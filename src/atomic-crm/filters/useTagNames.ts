/**
 * Custom hook to fetch and cache tag names
 * Handles batch fetching for performance optimization
 *
 * Note: Tags in opportunities table are stored as text[] (tag names),
 * not IDs. However, this hook will be needed for contacts which use
 * bigint[] (tag IDs). For opportunities, tag values ARE the display names.
 *
 * REFACTORED: Now uses type-safe generic base hook
 * BACKWARD COMPATIBLE: Same API as before
 *
 * @module filters/useTagNames
 */

import type { Tag } from "../validation/tags";
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";
import { resourceExtractors } from "./types/resourceTypes";

/**
 * Fetch and cache tag names for display
 *
 * @param tagIds - Array of tag IDs to look up
 * @returns Object with tagMap, getTagName function, and loading state
 *
 * @example
 * ```typescript
 * const { getTagName, loading } = useTagNames(["1", "2", "3"]);
 * const name = getTagName("1"); // "Important" or "Tag #1"
 * ```
 */
export const useTagNames = (tagIds: string[] | undefined) => {
  const { namesMap, getName, loading } = useResourceNamesBase<Tag>(
    "tags",
    tagIds,
    resourceExtractors.tags,
    "Tag"
  );

  // Return with original property names for backward compatibility
  return {
    tagMap: namesMap,
    getTagName: getName,
    loading,
  };
};
