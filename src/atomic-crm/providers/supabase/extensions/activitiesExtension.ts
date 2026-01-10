/**
 * Activities Extension Layer
 *
 * Delegates activities-related custom methods to ActivitiesService.
 * Provides activity log retrieval functionality.
 *
 * Methods (1 total):
 * - getActivityLog: Fetch activity log via RPC function
 *
 * @module providers/supabase/extensions/activitiesExtension
 */

import type { Identifier } from "ra-core";
import type { ServiceContainer } from "../services";
import type { Activity } from "../../../types";

/**
 * Activities extension methods interface
 */
export interface ActivitiesExtension {
  getActivityLog(companyId?: Identifier, salesId?: Identifier): Promise<Activity[]>;
}

/**
 * Create Activities Extension
 *
 * Returns activities-related custom methods that delegate to ActivitiesService.
 *
 * @param services - Pre-initialized service container
 * @returns Activities extension methods
 */
export function createActivitiesExtension(services: ServiceContainer): ActivitiesExtension {
  return {
    /**
     * Fetch activity log via RPC function
     * Delegates to ActivitiesService which calls get_activity_log RPC
     *
     * @param companyId - Optional organization ID to filter activities
     * @param salesId - Optional sales rep ID to filter activities
     * @returns Array of activity records
     */
    getActivityLog: async (companyId?: Identifier, salesId?: Identifier): Promise<Activity[]> => {
      return services.activities.getActivityLog(companyId, salesId);
    },
  };
}
