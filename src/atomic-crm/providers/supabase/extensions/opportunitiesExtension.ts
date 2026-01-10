/**
 * Opportunities Extension Layer
 *
 * Delegates opportunities-related custom methods to OpportunitiesService.
 * Provides opportunity archiving and unarchiving functionality.
 *
 * Methods (2 total):
 * - archiveOpportunity: Archive opportunity via RPC
 * - unarchiveOpportunity: Unarchive opportunity via RPC
 *
 * @module providers/supabase/extensions/opportunitiesExtension
 */

import type { ServiceContainer } from "../services";
import type { Opportunity } from "../../../types";

/**
 * Opportunities extension methods interface
 */
export interface OpportunitiesExtension {
  archiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]>;
  unarchiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]>;
}

/**
 * Create Opportunities Extension
 *
 * Returns opportunities-related custom methods that delegate to OpportunitiesService.
 *
 * @param services - Pre-initialized service container
 * @returns Opportunities extension methods
 */
export function createOpportunitiesExtension(services: ServiceContainer): OpportunitiesExtension {
  return {
    /**
     * Archive opportunity via RPC function
     * Delegates to OpportunitiesService which calls archive_opportunity RPC
     *
     * @param opportunity - Opportunity record to archive
     * @returns Array of updated opportunities (archiving may affect related records)
     */
    archiveOpportunity: async (opportunity: Opportunity): Promise<Opportunity[]> => {
      return services.opportunities.archiveOpportunity(opportunity);
    },

    /**
     * Unarchive opportunity via RPC function
     * Delegates to OpportunitiesService which calls unarchive_opportunity RPC
     *
     * @param opportunity - Opportunity record to unarchive
     * @returns Array of updated opportunities (unarchiving may affect related records)
     */
    unarchiveOpportunity: async (opportunity: Opportunity): Promise<Opportunity[]> => {
      return services.opportunities.unarchiveOpportunity(opportunity);
    },
  };
}
