import type { DataProvider } from "ra-core";
import type { Opportunity } from "../types";

/**
 * Opportunities service handles business logic for opportunity management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class OpportunitiesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Archive an opportunity and all related records by setting deleted_at
   * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
   * Uses RPC function for atomic operation across related tables
   * @param opportunity The opportunity to archive
   * @returns Promise resolving to the RPC response
   */
  async archiveOpportunity(opportunity: Opportunity): Promise<any> {
    try {
      return await this.dataProvider.rpc('archive_opportunity_with_relations', {
        opp_id: opportunity.id
      });
    } catch (error: any) {
      console.error(`[OpportunitiesService] Failed to archive opportunity`, {
        opportunityId: opportunity.id,
        error
      });
      throw new Error(`Archive opportunity failed: ${error.message}`);
    }
  }

  /**
   * Unarchive an opportunity and all related records by setting deleted_at to null
   * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
   * Uses RPC function for atomic operation across related tables
   * @param opportunity The opportunity to unarchive
   * @returns Promise resolving to the RPC response
   */
  async unarchiveOpportunity(opportunity: Opportunity): Promise<any> {
    try {
      return await this.dataProvider.rpc('unarchive_opportunity_with_relations', {
        opp_id: opportunity.id
      });
    } catch (error: any) {
      console.error(`[OpportunitiesService] Failed to unarchive opportunity`, {
        opportunityId: opportunity.id,
        error
      });
      throw new Error(`Unarchive opportunity failed: ${error.message}`);
    }
  }
}