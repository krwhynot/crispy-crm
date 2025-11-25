/**
 * Custom hook to fetch and cache sales person names
 * Handles batch fetching for performance optimization
 *
 * REFACTORED: Now uses type-safe generic base hook
 * BACKWARD COMPATIBLE: Same API as before
 *
 * @module filters/useSalesNames
 */

import type { Sales } from "../validation/sales";
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";
import { resourceExtractors } from "./types/resourceTypes";

/**
 * Fetch and cache sales person names for display
 *
 * @param salesIds - Array of sales IDs to look up
 * @returns Object with salesMap, getSalesName function, and loading state
 *
 * @example
 * ```typescript
 * const { getSalesName, loading } = useSalesNames(["1", "2", "3"]);
 * const name = getSalesName("1"); // "John Smith" or "Sales #1"
 * ```
 */
export const useSalesNames = (salesIds: string[] | undefined) => {
  const { namesMap, getName, loading } = useResourceNamesBase<Sales>(
    "sales",
    salesIds,
    resourceExtractors.sales,
    "Sales"
  );

  // Return with original property names for backward compatibility
  return {
    salesMap: namesMap,
    getSalesName: getName,
    loading,
  };
};
