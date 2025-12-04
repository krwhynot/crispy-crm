/**
 * Custom hook to fetch and cache segment (playbook) names
 *
 * Follows the same pattern as useSalesNames, useOrganizationNames, useTagNames
 * for consistency across the filter chip bar.
 *
 * @module filters/useSegmentNames
 */

import type { Segment } from "../validation/segments";
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";

/**
 * Display name extractor for Segment resources
 * Segments have a `name` field representing the Playbook category
 */
const segmentExtractor = (segment: Segment & { id: string | number }) => segment.name;

/**
 * Fetch and cache segment names for display in FilterChipBar
 *
 * @param segmentIds - Array of segment UUIDs to look up
 * @returns Object with segmentMap, getSegmentName function, and loading state
 *
 * @example
 * ```typescript
 * const { getSegmentName, loading } = useSegmentNames(["uuid-1", "uuid-2"]);
 * const name = getSegmentName("uuid-1"); // "Major Broadline" or "Playbook #uuid-1"
 * ```
 */
export const useSegmentNames = (segmentIds: string[] | undefined) => {
  const { namesMap, getName, loading } = useResourceNamesBase<Segment>(
    "segments",
    segmentIds,
    segmentExtractor,
    "Playbook"
  );

  // Return with semantic property names for clarity
  return {
    segmentMap: namesMap,
    getSegmentName: getName,
    loading,
  };
};
