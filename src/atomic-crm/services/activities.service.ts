import type { DataProvider, Identifier } from "ra-core";
import { getActivityLog } from "../providers/commons/activity";

/**
 * Activities service handles activity log aggregation and management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class ActivitiesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Get activity log for a company or sales person
   * Aggregates activities from multiple sources (companies, contacts, notes, opportunities)
   *
   * FIXME: Requires 5 large queries to get the latest activities.
   * Replace with a server-side view or a custom API endpoint.
   *
   * @param companyId Optional company ID to filter activities
   * @param salesId Optional sales ID to filter activities
   * @returns Array of activity records sorted by date descending, limited to 250 items
   */
  async getActivityLog(companyId?: Identifier, salesId?: Identifier): Promise<any[]> {
    try {
      return await getActivityLog(this.dataProvider, companyId, salesId);
    } catch (error: any) {
      console.error(`[ActivitiesService] Failed to get activity log`, {
        companyId,
        salesId,
        error
      });
      throw new Error(`Get activity log failed: ${error.message}`);
    }
  }
}