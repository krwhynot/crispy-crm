import type { Identifier } from "ra-core";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";
import { devLog, devError } from "@/lib/devLogger";

/**
 * Product distributor junction data for creating products with distributor relationships
 */
export interface ProductDistributorInput {
  distributor_id: number;
  vendor_item_number?: string | null;
}

/**
 * Product data for creation
 */
export interface ProductCreateInput {
  name: string;
  principal_id: Identifier;
  pack_size?: string | null;
  case_count?: string | null;
  case_net_weight?: string | null;
  master_case_count?: string | null;
  upc?: string | null;
  gtin?: string | null;
  storage_requirements?: string | null;
  lead_time_days?: number | null;
  minimum_order_quantity?: number | null;
  tags?: string[];
}

/**
 * Product data for updates
 */
export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  id: Identifier;
}

/**
 * Product with distributors response
 */
export interface ProductWithDistributors {
  id: Identifier;
  name: string;
  principal_id: Identifier;
  pack_size?: string | null;
  case_count?: string | null;
  case_net_weight?: string | null;
  master_case_count?: string | null;
  upc?: string | null;
  gtin?: string | null;
  storage_requirements?: string | null;
  lead_time_days?: number | null;
  minimum_order_quantity?: number | null;
  tags?: string[];
  distributor_ids: number[];
  product_distributors: Record<number, { vendor_item_number: string | null }>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Products service handles business logic for product management
 *
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 *
 * This service encapsulates:
 * - Product CRUD with distributor relationships
 * - Soft delete via RPC (required due to RLS SELECT policy conflict)
 * - Atomic operations for product + distributor creation
 */
export class ProductsService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  /**
   * Get a product with its distributor relationships
   * Transforms junction table data into form-consumable format
   *
   * @param id Product ID
   * @returns Product with distributor_ids array and product_distributors map
   */
  async getOneWithDistributors(id: Identifier): Promise<ProductWithDistributors> {
    try {
      devLog("ProductsService", "getOneWithDistributors", { id });

      // Use RPC or direct query - for now, delegate to data provider
      // The transformation happens in the data layer
      const { data } = await this.dataProvider.getOne<ProductWithDistributors>("products", { id });

      return data;
    } catch (error: unknown) {
      devError("ProductsService", "Failed to get product with distributors", { id, error });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Get product with distributors failed: ${errorMessage}`);
    }
  }

  /**
   * Create a product with distributor relationships atomically
   *
   * If distributors are provided:
   * 1. Create the product
   * 2. Create junction records for each distributor
   *
   * Transaction semantics: If junction creation fails, the product
   * still exists but without distributor relationships.
   *
   * @param productData Product data to create
   * @param distributors Array of distributor relationships
   * @returns Created product
   */
  async createWithDistributors(
    productData: ProductCreateInput,
    distributors: ProductDistributorInput[] = []
  ): Promise<ProductWithDistributors> {
    try {
      devLog("ProductsService", "createWithDistributors", {
        productName: productData.name,
        distributorCount: distributors.length,
      });

      // Create the product first
      const { data: product } = await this.dataProvider.create<ProductWithDistributors>(
        "products",
        {
          data: productData,
        }
      );

      // If distributors provided, create junction records
      if (distributors.length > 0) {
        const distributorRecords = distributors.map((dist) => ({
          product_id: product.id,
          distributor_id: dist.distributor_id,
          vendor_item_number: dist.vendor_item_number || null,
          status: "active",
          valid_from: new Date().toISOString(),
        }));

        // Create all junction records in parallel
        await Promise.all(
          distributorRecords.map((record) =>
            this.dataProvider.create("product_distributors", { data: record })
          )
        );

        devLog("ProductsService", "Created distributor relationships", {
          productId: product.id,
          distributorCount: distributors.length,
        });
      }

      // Return with distributor info
      return {
        ...product,
        distributor_ids: distributors.map((d) => d.distributor_id),
        product_distributors: distributors.reduce(
          (acc, d) => {
            acc[d.distributor_id] = { vendor_item_number: d.vendor_item_number || null };
            return acc;
          },
          {} as Record<number, { vendor_item_number: string | null }>
        ),
      };
    } catch (error: unknown) {
      devError("ProductsService", "Failed to create product with distributors", {
        productData,
        distributorCount: distributors.length,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Create product with distributors failed: ${errorMessage}`);
    }
  }

  /**
   * Update a product and sync its distributor relationships
   *
   * If distributor_ids is provided:
   * 1. Delete all existing junction records
   * 2. Create new junction records for provided distributors
   *
   * @param id Product ID
   * @param productData Product data to update
   * @param distributors New distributor relationships (replaces existing)
   * @returns Updated product
   */
  async updateWithDistributors(
    id: Identifier,
    productData: Partial<ProductCreateInput>,
    distributors?: ProductDistributorInput[]
  ): Promise<ProductWithDistributors> {
    try {
      devLog("ProductsService", "updateWithDistributors", {
        id,
        hasDistributors: distributors !== undefined,
      });

      // Update the product
      const { data: product } = await this.dataProvider.update<ProductWithDistributors>(
        "products",
        {
          id,
          data: productData,
          previousData: { id } as ProductWithDistributors,
        }
      );

      // Sync distributors if provided
      if (distributors !== undefined) {
        // Delete existing junction records via deleteMany
        // Note: This is a simplification - in production, use RPC for atomicity
        const { data: existingDistributors } = await this.dataProvider.getList(
          "product_distributors",
          {
            filter: { product_id: id },
            pagination: { page: 1, perPage: 100 },
            sort: { field: "id", order: "ASC" },
          }
        );

        // Delete each existing record
        for (const dist of existingDistributors) {
          await this.dataProvider.delete("product_distributors", {
            id: dist.id,
            previousData: dist,
          });
        }

        // Create new junction records
        if (distributors.length > 0) {
          const distributorRecords = distributors.map((dist) => ({
            product_id: id,
            distributor_id: dist.distributor_id,
            vendor_item_number: dist.vendor_item_number || null,
            status: "active",
            valid_from: new Date().toISOString(),
          }));

          for (const record of distributorRecords) {
            await this.dataProvider.create("product_distributors", { data: record });
          }
        }

        devLog("ProductsService", "Synced distributor relationships", {
          productId: id,
          newDistributorCount: distributors.length,
        });
      }

      // Return with distributor info
      const distributor_ids = distributors?.map((d) => d.distributor_id) ?? [];
      const product_distributors =
        distributors?.reduce(
          (acc, d) => {
            acc[d.distributor_id] = { vendor_item_number: d.vendor_item_number || null };
            return acc;
          },
          {} as Record<number, { vendor_item_number: string | null }>
        ) ?? {};

      return {
        ...product,
        distributor_ids,
        product_distributors,
      };
    } catch (error: unknown) {
      devError("ProductsService", "Failed to update product with distributors", { id, error });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Update product with distributors failed: ${errorMessage}`);
    }
  }

  /**
   * Soft delete a product via RPC
   *
   * Uses RPC because direct UPDATE is blocked by RLS SELECT policy:
   * The SELECT policy (deleted_at IS NULL) prevents seeing the resulting row
   * after setting deleted_at. SECURITY DEFINER RPC bypasses this.
   *
   * @param id Product ID to soft delete
   */
  async softDelete(id: Identifier): Promise<void> {
    try {
      devLog("ProductsService", "softDelete", { id });

      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        throw new Error(`Invalid product ID: ${id}`);
      }

      await this.dataProvider.rpc("soft_delete_product", {
        product_id: numericId,
      });

      devLog("ProductsService", "Product soft deleted", { id });
    } catch (error: unknown) {
      devError("ProductsService", "Failed to soft delete product", { id, error });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Soft delete product failed: ${errorMessage}`);
    }
  }

  /**
   * Soft delete multiple products via RPC
   *
   * Uses RPC for the same RLS bypass reason as softDelete.
   *
   * @param ids Array of product IDs to soft delete
   */
  async softDeleteMany(ids: Identifier[]): Promise<void> {
    try {
      devLog("ProductsService", "softDeleteMany", { count: ids.length });

      const numericIds = ids.map((id) => {
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
          throw new Error(`Invalid product ID: ${id}`);
        }
        return numId;
      });

      await this.dataProvider.rpc("soft_delete_products", {
        product_ids: numericIds,
      });

      devLog("ProductsService", "Products soft deleted", { count: ids.length });
    } catch (error: unknown) {
      devError("ProductsService", "Failed to soft delete products", { ids, error });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Soft delete products failed: ${errorMessage}`);
    }
  }
}
