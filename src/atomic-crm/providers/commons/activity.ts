import type { DataProvider, Identifier } from "ra-core";
import type { Activity } from "../../types";

/**
 * Get activity log using optimized RPC function
 * Replaces 5 separate queries with single server-side UNION ALL
 * Engineering Constitution: BOY SCOUT RULE - improved from 5 queries to 1
 */
export async function getActivityLog(
  dataProvider: DataProvider,
  organizationId?: Identifier,
  salesId?: Identifier
): Promise<Activity[]> {
  // Call RPC function with parameters
  const data = await dataProvider.rpc("get_activity_log", {
    p_organization_id: organizationId || null,
    p_sales_id: salesId || null,
    p_limit: 250,
  });

  // RPC returns null if no results, handle gracefully
  return data || [];
}
