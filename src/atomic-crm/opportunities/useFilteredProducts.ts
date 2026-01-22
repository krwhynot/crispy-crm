import { useGetList } from "ra-core";
import type { Product } from "@/atomic-crm/types";

/**
 * Filtered Products Hook
 *
 * Fetches products filtered by principal organization to ensure
 * users only see products from the selected manufacturer/brand.
 *
 * Features:
 * - Server-side filtering by principal_id (indexed query)
 * - Disabled state when no principal selected
 * - Sorted alphabetically by product name
 * - Excludes soft-deleted products (handled by data provider)
 *
 * Engineering Constitution:
 * - Fail fast: No retry logic
 * - Single source of truth: Server-side filtering only
 *
 * @param principalId The principal organization ID to filter by (null/undefined = no filter)
 * @returns Object with products, loading state, error, and readiness flag
 */
export const useFilteredProducts = (principalId: number | null | undefined) => {
  const {
    data: products,
    isLoading,
    error,
  } = useGetList<Product>(
    "products",
    {
      filter: principalId ? { principal_id: principalId } : {},
      pagination: { page: 1, perPage: 200 }, // Reasonable limit for dropdown
      sort: { field: "name", order: "ASC" },
    },
    {
      // Only fetch if principal is selected
      enabled: !!principalId,
    }
  );

  return {
    products: products || [],
    isLoading,
    error,
    isReady: !!principalId, // Dropdown should be disabled until principal selected
    isEmpty: !isLoading && (!products || products.length === 0),
  };
};
