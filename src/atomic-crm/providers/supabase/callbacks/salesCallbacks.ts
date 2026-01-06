/**
 * Sales Resource Lifecycle Callbacks
 *
 * Callbacks for sales (salespeople/users) resource:
 * - Soft delete enabled (disabled users remain for historical data)
 * - Computed fields stripped (administrator is a computed column)
 * - Read-heavy operations (most operations are read, writes are admin-only)
 * - Search transformation: q filter → ILIKE search on name/email fields
 *
 * Engineering Constitution: Resource-specific logic extracted for single responsibility
 */

import type { GetListParams, DataProvider } from "ra-core";
import { createResourceCallbacks, type ResourceCallbacks } from "./createResourceCallbacks";
import { createQToIlikeTransformer } from "./commonTransforms";

/**
 * Computed fields from sales view (must be stripped before save)
 * - administrator: computed from role field via database function
 */
export const COMPUTED_FIELDS = ["administrator"] as const;

/**
 * Fields to search when q filter is provided
 * These fields will be searched with ILIKE for partial matching
 * Matches the columns shown in SalesList: first_name, last_name, email
 */
export const SALES_SEARCH_FIELDS = ["first_name", "last_name", "email"] as const;

/**
 * Transform q filter into ILIKE search on sales name/email fields
 *
 * Matches the unified data provider's search behavior by transforming a simple
 * `q` filter into an `@or` filter with ILIKE conditions on each searchable field.
 *
 * @param params - GetListParams containing the filter with q
 * @returns GetListParams with q transformed to @or ILIKE filters
 *
 * @example
 * ```typescript
 * // Input filter:
 * { q: "admin", disabled: false }
 *
 * // Output filter:
 * {
 *   disabled: false,
 *   "@or": {
 *     "first_name@ilike": "%admin%",
 *     "last_name@ilike": "%admin%",
 *     "email@ilike": "%admin%"
 *   }
 * }
 * ```
 */
export function transformQToIlikeSearch(params: GetListParams): GetListParams {
  const { q, ...filterWithoutQ } = params.filter || {};

  // If no q filter, return params unchanged
  if (!q || typeof q !== "string") {
    return params;
  }

  // Wrap search term with wildcards for partial matching
  const searchTerm = `%${q}%`;

  // Build @or filter with ILIKE conditions for each searchable field
  const orFilter = SALES_SEARCH_FIELDS.reduce(
    (acc, field) => ({
      ...acc,
      [`${field}@ilike`]: searchTerm,
    }),
    {} as Record<string, string>
  );

  return {
    ...params,
    filter: {
      ...filterWithoutQ,
      "@or": orFilter,
    },
  };
}

/**
 * Base callbacks from factory (soft delete, computed fields)
 * We extract this so we can override beforeGetList with search support
 */
const baseCallbacks = createResourceCallbacks({
  resource: "sales",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,
});

/**
 * Custom beforeGetList that chains:
 * 1. q filter → ILIKE search transformation
 * 2. Soft delete filter (from base callbacks)
 *
 * This matches the unified data provider's search behavior while preserving
 * the factory's soft-delete filtering.
 */
async function salesBeforeGetList(
  params: GetListParams,
  dataProvider: DataProvider
): Promise<GetListParams> {
  // Step 1: Transform q filter to ILIKE search (removes q from filter)
  const searchTransformedParams = transformQToIlikeSearch(params);

  // Step 2: Apply soft delete filter from base callbacks
  // The base callback will add deleted_at@is: null unless includeDeleted is true
  if (baseCallbacks.beforeGetList) {
    return baseCallbacks.beforeGetList(searchTransformedParams, dataProvider);
  }

  return searchTransformedParams;
}

/**
 * Sales lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Features:
 * - Soft delete enabled (users are disabled, not removed)
 * - Computed fields stripped before save
 * - Search: q filter transforms to ILIKE on first_name, last_name, email
 *
 * Note: Write operations are restricted by RLS to admin users only.
 * The handler doesn't need to enforce this - the database does.
 *
 * Usage:
 * ```typescript
 * import { withLifecycleCallbacks } from 'react-admin';
 * import { salesCallbacks } from './callbacks/salesCallbacks';
 *
 * const dataProvider = withLifecycleCallbacks(baseProvider, [
 *   salesCallbacks,
 * ]);
 * ```
 */
export const salesCallbacks: ResourceCallbacks = {
  ...baseCallbacks,
  beforeGetList: salesBeforeGetList,
};
