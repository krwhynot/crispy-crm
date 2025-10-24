import type { DataProvider } from "ra-core";
import type { Opportunity } from "../types";

/**
 * Opportunities service handles business logic for opportunity management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class OpportunitiesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Unarchive an opportunity by setting deleted_at to null
   * Timestamp-based ordering means no reordering is needed
   * @param opportunity The opportunity to unarchive
   * @returns Promise resolving to the updated opportunity
   */
  async unarchiveOpportunity(opportunity: Opportunity): Promise<any> {
    try {
      return await this.dataProvider.update("opportunities", {
        id: opportunity.id,
        data: { deleted_at: null },
        previousData: opportunity,
      });
    } catch (error: any) {
      console.error(`[OpportunitiesService] Failed to unarchive opportunity`, {
        opportunityId: opportunity.id,
        stage: opportunity.stage,
        error
      });
      throw new Error(`Unarchive opportunity failed: ${error.message}`);
    }
  }
}