/**
 * Custom hook to fetch and cache segment (playbook) names
 *
 * Follows the same pattern as useSalesNames, useOrganizationNames, useTagNames
 * for consistency across the filter chip bar.
 *
 * OPTIMIZATION: Playbook categories have fixed UUIDs, so we use synchronous
 * static lookup first, avoiding async fetch and ugly fallback display.
 *
 * @module filters/useSegmentNames
 */

import { useCallback, useMemo } from "react";
import type { Segment } from "../validation/segments";
import { PLAYBOOK_CATEGORY_NAMES_BY_ID } from "../validation/segments";
import { OPERATOR_SEGMENT_NAMES_BY_ID } from "../validation/operatorSegments";
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";

/**
 * Display name extractor for Segment resources
 * Segments have a `name` field representing the Playbook category
 */
const segmentExtractor = (segment: Segment & { id: string | number }) => segment.name;

/**
 * Combined static lookup for all known segment types.
 * Playbook categories (22222222-...) and operator segments (33333333-...)
 * both resolve synchronously without async fetch.
 */
const STATIC_SEGMENT_NAMES: Record<string, string> = {
  ...PLAYBOOK_CATEGORY_NAMES_BY_ID,
  ...OPERATOR_SEGMENT_NAMES_BY_ID,
};

/**
 * Fetch and cache segment names for display in FilterChipBar
 *
 * Uses synchronous static lookup for known playbook AND operator segments
 * (instant display), only falling back to async fetch for truly unknown types.
 *
 * @param segmentIds - Array of segment UUIDs to look up
 * @returns Object with segmentMap, getSegmentName function, and loading state
 *
 * @example
 * ```typescript
 * const { getSegmentName, loading } = useSegmentNames(["uuid-1", "uuid-2"]);
 * const name = getSegmentName("uuid-1"); // "Major Broadline" (instant, no fetch!)
 * ```
 */
export const useSegmentNames = (segmentIds: string[] | undefined) => {
  // Filter out known segment IDs (playbook + operator) - no need to fetch these
  const unknownIds = useMemo(
    () => segmentIds?.filter((id) => !STATIC_SEGMENT_NAMES[id]),
    [segmentIds]
  );

  // Only fetch truly unknown segments
  const { namesMap, loading } = useResourceNamesBase<Segment>(
    "segments",
    unknownIds,
    segmentExtractor,
    "Playbook"
  );

  // Check static map first (instant!), then fall back to async-fetched names
  const getSegmentName = useCallback(
    (id: string): string => {
      // Static lookup for known segments - no loading, no fallback
      const staticName = STATIC_SEGMENT_NAMES[id];
      if (staticName) return staticName;

      // Fall back to async-fetched name for unknown segments
      return namesMap[id] || `Playbook #${id}`;
    },
    [namesMap]
  );

  // Merge static names with dynamically fetched ones
  const segmentMap = useMemo(() => ({ ...STATIC_SEGMENT_NAMES, ...namesMap }), [namesMap]);

  return {
    segmentMap,
    getSegmentName,
    loading,
  };
};
