import type { DataProvider } from "ra-core";
import type { Opportunity } from "../types";

/**
 * Opportunities service handles business logic for opportunity management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class OpportunitiesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Unarchive an opportunity and reorder all opportunities in the same stage
   * This is critical for drag-drop Kanban functionality - maintains proper index ordering
   * @param opportunity The opportunity to unarchive
   * @returns Promise resolving to array of updated opportunities
   */
  async unarchiveOpportunity(opportunity: Opportunity): Promise<any[]> {
    try {
      // Get all opportunities where stage is the same as the opportunity to unarchive
      const { data: opportunities } = await this.dataProvider.getList<Opportunity>(
        "opportunities",
        {
          filter: { stage: opportunity.stage },
          pagination: { page: 1, perPage: 1000 },
          sort: { field: "index", order: "ASC" },
        },
      );

      // Set index for each opportunity starting from 1, if the opportunity to unarchive is found, set its index to the last one
      const updatedOpportunities = opportunities.map((o, index) => ({
        ...o,
        index: o.id === opportunity.id ? 0 : index + 1,
        deleted_at: o.id === opportunity.id ? null : o.deleted_at,
      }));

      return await Promise.all(
        updatedOpportunities.map((updatedOpportunity) =>
          this.dataProvider.update("opportunities", {
            id: updatedOpportunity.id,
            data: updatedOpportunity,
            previousData: opportunities.find(
              (o) => o.id === updatedOpportunity.id,
            ),
          }),
        ),
      );
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