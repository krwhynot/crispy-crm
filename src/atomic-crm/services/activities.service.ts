import type { DataProvider, Identifier } from "ra-core";
import { getActivityLog } from "../providers/commons/activity";

/**
 * Activities service handles activity log aggregation and management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class ActivitiesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Get activity log for an organization or sales person
   * Uses optimized RPC function to consolidate 5 queries into 1 server-side UNION ALL
   * Engineering Constitution: BOY SCOUT RULE - improved performance 5x
   *
   * @param organizationId Optional organization ID to filter activities
   * @param salesId Optional sales ID to filter activities
   * @returns Array of activity records sorted by date descending, limited to 250 items
   */
  async getActivityLog(organizationId?: Identifier, salesId?: Identifier): Promise<Record<string, unknown>[]> {
    try {
      return await getActivityLog(this.dataProvider, organizationId, salesId);
    } catch (error: unknown) {
      console.error(`[ActivitiesService] Failed to get activity log`, {
        organizationId,
        salesId,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Get activity log failed: ${errorMessage}`);
    }
  }
}
