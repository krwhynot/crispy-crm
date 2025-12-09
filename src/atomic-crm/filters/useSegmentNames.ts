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
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";

/**
 * Display name extractor for Segment resources
 * Segments have a `name` field representing the Playbook category
 */
const segmentExtractor = (segment: Segment & { id: string | number }) => segment.name;

/**
 * Fetch and cache segment names for display in FilterChipBar
 *
 * Uses synchronous static lookup for known playbook categories (instant display),
 * only falling back to async fetch for unknown segment types.
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
  // Filter out known playbook IDs - no need to fetch these from database
  const unknownIds = useMemo(
    () => segmentIds?.filter((id) => !PLAYBOOK_CATEGORY_NAMES_BY_ID[id]),
    [segmentIds]
  );

  // Only fetch unknown segments (operator segments, etc.)
  const { namesMap, loading } = useResourceNamesBase<Segment>(
    "segments",
    unknownIds,
    segmentExtractor,
    "Playbook"
  );

  // Check static map first (instant!), then fall back to async-fetched names
  const getSegmentName = useCallback(
    (id: string): string => {
      // Static lookup for known playbook categories - no loading, no fallback
      const staticName = PLAYBOOK_CATEGORY_NAMES_BY_ID[id];
      if (staticName) return staticName;

      // Fall back to async-fetched name for unknown segments
      return namesMap[id] || `Playbook #${id}`;
    },
    [namesMap]
  );

  // Merge static names with dynamically fetched ones
  const segmentMap = useMemo(
    () => ({ ...PLAYBOOK_CATEGORY_NAMES_BY_ID, ...namesMap }),
    [namesMap]
  );

  return {
    segmentMap,
    getSegmentName,
    loading,
  };
};
