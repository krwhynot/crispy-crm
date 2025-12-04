/**
 * Custom hook to fetch and cache product category names
 *
 * Categories come from the distinct_product_categories database view.
 * Follows the same pattern as other name hooks for consistency.
 *
 * @module filters/useCategoryNames
 */

import type { Category } from "../validation/categories";
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";

/**
 * Display name extractor for Category resources
 * Categories have a `name` field from the distinct_product_categories view
 */
const categoryExtractor = (category: Category & { id: string | number }) => category.name;

/**
 * Fetch and cache category names for display in FilterChipBar
 *
 * @param categoryIds - Array of category IDs to look up
 * @returns Object with categoryMap, getCategoryName function, and loading state
 *
 * @example
 * ```typescript
 * const { getCategoryName, loading } = useCategoryNames(["frozen", "dairy"]);
 * const name = getCategoryName("frozen"); // "Frozen Foods" or "Category #frozen"
 * ```
 */
export const useCategoryNames = (categoryIds: string[] | undefined) => {
  const { namesMap, getName, loading } = useResourceNamesBase<Category>(
    "distinct_product_categories",
    categoryIds,
    categoryExtractor,
    "Category"
  );

  // Return with semantic property names for clarity
  return {
    categoryMap: namesMap,
    getCategoryName: getName,
    loading,
  };
};
