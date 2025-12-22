import type { Identifier } from "ra-core";
import type { Opportunity } from "../types";
import { diffProducts, type Product } from "../opportunities/utils/diffProducts";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";
import { devLog, devError } from "@/lib/devLogger";

/**
 * Input types for opportunity creation and updates with products
 * Extracted from validation schemas to support service layer typesafety
 */
export interface OpportunityCreateInput {
  name: string;
  customer_organization_id: Identifier;
  principal_organization_id: Identifier;
  distributor_organization_id?: Identifier | null;
  estimated_close_date: string;
  stage?: string | null;
  priority?: string | null;
  lead_source?: string | null;
  account_manager_id?: Identifier | null;
  contact_ids?: Identifier[];
  campaign?: string | null;
  related_opportunity_id?: Identifier | null;
  notes?: string | null;
  tags?: string[];
  next_action?: string | null;
  next_action_date?: string | null;
  decision_criteria?: string | null;
  products_to_sync?: Product[];
  description?: string | null;
}

export interface OpportunityUpdateInput extends Partial<OpportunityCreateInput> {
  id: Identifier;
  version?: number;
}

/**
 * Opportunities service handles business logic for opportunity management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class OpportunitiesService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  /**
   * Archive an opportunity and all related records by setting deleted_at
   * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
   * Uses RPC function for atomic operation across related tables
   * @param opportunity The opportunity to archive
   * @returns Promise resolving to the RPC response
   */
  async archiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]> {
    try {
      return await this.dataProvider.rpc<Opportunity[]>("archive_opportunity_with_relations", {
        opp_id: opportunity.id,
      });
    } catch (error: unknown) {
      devError("OpportunitiesService", "Failed to archive opportunity", {
        opportunityId: opportunity.id,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Archive opportunity failed: ${errorMessage}`);
    }
  }

  /**
   * Unarchive an opportunity and all related records by setting deleted_at to null
   * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
   * Uses RPC function for atomic operation across related tables
   * @param opportunity The opportunity to unarchive
   * @returns Promise resolving to the RPC response
   */
  async unarchiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]> {
    try {
      return await this.dataProvider.rpc<Opportunity[]>("unarchive_opportunity_with_relations", {
        opp_id: opportunity.id,
      });
    } catch (error: unknown) {
      devError("OpportunitiesService", "Failed to unarchive opportunity", {
        opportunityId: opportunity.id,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Unarchive opportunity failed: ${errorMessage}`);
    }
  }

  /**
   * Create an opportunity with product synchronization
   * Handles atomic creation of opportunity and linked products via RPC
   * Extracts products_to_sync field and passes to sync RPC function
   *
   * @param data Opportunity data from form (may include products_to_sync)
   * @returns Promise resolving to created opportunity
   * @throws Error if RPC call fails
   */
  async createWithProducts(data: Partial<OpportunityCreateInput>): Promise<Opportunity> {
    try {
      // Extract products before sending to database
      const productsToSync = data.products_to_sync || [];
      const { products_to_sync, ...opportunityData } = data;

      // If no products to sync, use standard create
      if (productsToSync.length === 0) {
        devLog("OpportunitiesService", "Creating opportunity without products");
        const result = await this.dataProvider.create("opportunities", { data: opportunityData });
        return result.data as Opportunity;
      }

      // Call RPC function for atomic creation with products
      devLog("OpportunitiesService", "Creating opportunity with products via RPC", {
        opportunityData,
        productsToCreate: productsToSync,
      });

      const opportunity = await this.rpcSyncOpportunity(opportunityData, productsToSync, [], []);
      devLog("OpportunitiesService", "Opportunity created successfully with products", opportunity);
      return opportunity;
    } catch (error: unknown) {
      devError("OpportunitiesService", "Failed to create opportunity with products", {
        error,
      });
      throw error;
    }
  }

  /**
   * Update an opportunity with product synchronization
   * Diffs products between current state and form state
   * Calls RPC function for atomic update with product sync
   *
   * @param id Opportunity ID to update
   * @param data Opportunity data from form (may include products_to_sync)
   * @param previousProducts Current products from database (for diffing)
   * @returns Promise resolving to updated opportunity
   * @throws Error if RPC call fails or previousProducts missing when updating products
   */
  async updateWithProducts(
    id: Identifier,
    data: Partial<OpportunityUpdateInput>,
    previousProducts: Product[] = [],
    previousVersion?: number
  ): Promise<Opportunity> {
    try {
      // Extract products before sending to database
      const productsToSync = data.products_to_sync || [];
      const { products_to_sync, ...restData } = data;
      const opportunityData = { ...restData, id };

      // If no products in form, use standard update
      if (productsToSync.length === 0) {
        devLog("OpportunitiesService", "Updating opportunity without product changes");
        const result = await this.dataProvider.update<Opportunity>("opportunities", {
          id,
          data: opportunityData,
        });
        return result.data;
      }

      // Diff products to determine creates, updates, deletes
      const { creates, updates, deletes } = diffProducts(previousProducts, productsToSync);

      devLog("OpportunitiesService", "Updating opportunity with product sync via RPC", {
        opportunityData,
        productsToCreate: creates,
        productsToUpdate: updates,
        productIdsToDelete: deletes,
      });

      // Call RPC function for atomic update with products
      const opportunity = await this.rpcSyncOpportunity(opportunityData, creates, updates, deletes, previousVersion);
      devLog(
        "OpportunitiesService",
        "Opportunity updated successfully with product sync",
        opportunity
      );
      return opportunity;
    } catch (error: unknown) {
      devError("OpportunitiesService", "Failed to update opportunity with products", {
        opportunityId: id,
        error,
      });
      throw error;
    }
  }

  /**
   * Call sync_opportunity_with_products RPC function
   * Handles RPC call, error checking, and response unwrapping
   * Used by both create and update operations to eliminate code duplication
   *
   * @param opportunityData Opportunity fields to sync to database
   * @param productsToCreate Products to add
   * @param productsToUpdate Products to modify
   * @param productIdsToDelete Product IDs to remove
   * @returns Promise resolving to the synced opportunity
   * @throws Error if RPC call fails
   */
  private async rpcSyncOpportunity(
    opportunityData: Partial<OpportunityCreateInput> | (Partial<OpportunityUpdateInput> & { id: Identifier }),
    productsToCreate: Product[],
    productsToUpdate: Product[],
    productIdsToDelete: (string | number)[],
    expectedVersion?: number
  ): Promise<Opportunity> {
    const rpcData = await this.dataProvider.rpc<Opportunity | { data: Opportunity }>("sync_opportunity_with_products", {
      opportunity_data: opportunityData,
      products_to_create: productsToCreate,
      products_to_update: productsToUpdate,
      product_ids_to_delete: productIdsToDelete,
      expected_version: expectedVersion,
    });

    return this.unwrapRpcResponse(rpcData);
  }

  /**
   * Unwrap potentially double-wrapped RPC responses
   * Some Supabase RPC functions return { data: <actual_data> } while others return <actual_data>
   * This helper ensures consistent unwrapping behavior
   *
   * @param response RPC response that may or may not be wrapped
   * @returns Unwrapped response data
   */
  private unwrapRpcResponse(response: Opportunity | { data: Opportunity }): Opportunity {
    // Check if response is wrapped in { data: ... } format
    if (
      response !== null &&
      response !== undefined &&
      typeof response === "object" &&
      "data" in response &&
      response.data !== null &&
      typeof response.data === "object" &&
      "id" in response.data
    ) {
      return response.data;
    }
    // Otherwise, assume it's already unwrapped
    return response as Opportunity;
  }
}
