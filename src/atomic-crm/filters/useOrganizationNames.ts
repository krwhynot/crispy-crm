/**
 * Custom hook to fetch and cache organization names
 * Handles batch fetching for performance optimization
 *
 * REFACTORED: Now uses type-safe generic base hook
 * BACKWARD COMPATIBLE: Same API as before
 *
 * @module filters/useOrganizationNames
 */

import type { Organization } from "../validation/organizations";
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";
import { resourceExtractors } from "./types/resourceTypes";

/**
 * Fetch and cache organization names for display
 *
 * @param organizationIds - Array of organization IDs to look up
 * @returns Object with organizationMap, getOrganizationName function, and loading state
 *
 * @example
 * ```typescript
 * const { getOrganizationName, loading } = useOrganizationNames(["1", "2"]);
 * const name = getOrganizationName("1"); // "Acme Corp" or "Organization #1"
 * ```
 */
export const useOrganizationNames = (organizationIds: string[] | undefined) => {
  const { namesMap, getName, loading } = useResourceNamesBase<Organization>(
    "organizations",
    organizationIds,
    resourceExtractors.organizations,
    "Organization"
  );

  // Return with original property names for backward compatibility
  return {
    organizationMap: namesMap,
    getOrganizationName: getName,
    loading,
  };
};
