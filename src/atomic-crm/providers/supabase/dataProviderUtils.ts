/**
 * Data Provider Utilities
 *
 * Helper functions extracted from unifiedDataProvider.ts to improve code organization
 * and reduce the main file's complexity. These utilities handle data transformation,
 * search parameter processing, and PostgREST query formatting.
 *
 * Engineering Constitution: BOY SCOUT RULE - Improving code organization
 */

import type { GetListParams } from "ra-core";
import { getSearchableFields, supportsSoftDelete, getResourceName } from "./resources";

/**
 * Cache for searchable fields to avoid repeated lookups
 * Since these are static configuration values, they can be cached indefinitely
 */
const searchableFieldsCache = new Map<string, readonly string[]>();

/**
 * Get searchable fields with caching
 */
function getCachedSearchableFields(resource: string): readonly string[] {
  if (!searchableFieldsCache.has(resource)) {
    searchableFieldsCache.set(resource, getSearchableFields(resource));
  }
  return searchableFieldsCache.get(resource)!;
}

/**
 * Cache for escaped PostgREST values (limited size to prevent memory issues)
 * TODO: Replace with proper LRU implementation if cache evictions exceed 1k/hour
 * Current "clear half" strategy is adequate for <5k distinct values per process lifetime
 */
const escapeCache = new Map<string, string>();
const MAX_ESCAPE_CACHE_SIZE = 1000;

/**
 * Escape values for PostgREST according to official documentation
 * PostgREST uses BACKSLASH escaping, NOT doubled quotes!
 * Now with caching for frequently used values
 */
export function escapeForPostgREST(value: string | number | boolean | null | undefined): string {
  const str = String(value);

  // Check cache first
  if (escapeCache.has(str)) {
    return escapeCache.get(str)!;
  }

  // Check for PostgREST reserved characters
  const needsQuoting = /[,."':() ]/.test(str);

  let result: string;
  if (!needsQuoting) {
    result = str;
  } else {
    // IMPORTANT: Escape backslashes first, then quotes
    let escaped = str.replace(/\\/g, '\\\\');  // Backslash → \\
    escaped = escaped.replace(/"/g, '\\"');    // Quote → \"
    result = `"${escaped}"`;
  }

  // Add to cache (with size limit to prevent memory issues)
  if (escapeCache.size >= MAX_ESCAPE_CACHE_SIZE) {
    // Simple eviction: clear half the cache when limit reached
    const entriesToKeep = Array.from(escapeCache.entries()).slice(-MAX_ESCAPE_CACHE_SIZE / 2);
    escapeCache.clear();
    entriesToKeep.forEach(([k, v]) => escapeCache.set(k, v));
  }
  escapeCache.set(str, result);

  return result;
}

// Type for filter values that can be transformed
type FilterValue = string | number | boolean | null | undefined | Array<string | number | boolean>;
type FilterRecord = Record<string, FilterValue>;

/**
 * Transform array filter values to PostgREST operators
 * Handles conversion of React Admin array filters to appropriate PostgREST syntax
 *
 * @example
 * // JSONB array fields (tags, email, phone)
 * { tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" }
 *
 * // Regular enum/text fields
 * { status: ["active", "pending"] } → { "status@in": "(active,pending)" }
 */
export function transformArrayFilters(filter: FilterRecord | undefined | null): FilterRecord {
  if (!filter || typeof filter !== 'object') {
    return filter || {};
  }

  const transformed: Record<string, any> = {};

  // Fields that are stored as JSONB arrays in PostgreSQL
  // These use the @cs (contains) operator
  const jsonbArrayFields = ['tags', 'email', 'phone'];

  for (const [key, value] of Object.entries(filter)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Preserve existing PostgREST operators (keys containing @)
    if (key.includes('@')) {
      transformed[key] = value;
      continue;
    }

    // Handle array values
    if (Array.isArray(value)) {
      // Skip empty arrays
      if (value.length === 0) {
        continue;
      }

      if (jsonbArrayFields.includes(key)) {
        // JSONB array contains - format: {1,2,3}
        // This checks if the JSONB array contains any of the specified values
        transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
      } else {
        // Regular IN operator - format: (val1,val2,val3)
        // This checks if the field value is in the list
        transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
      }
    } else {
      // JSONB array fields: Single value needs @cs operator too
      if (jsonbArrayFields.includes(key)) {
        transformed[`${key}@cs`] = `{${escapeForPostgREST(value)}}`;
      } else {
        // Regular non-array value
        transformed[key] = value;
      }
    }
  }

  return transformed;
}

/**
 * Apply full-text search to query parameters
 * Replicates the behavior from the original dataProvider's applyFullTextSearch function
 */
export function applyFullTextSearch(columns: readonly string[], shouldAddSoftDeleteFilter: boolean = true) {
  return (params: GetListParams): GetListParams => {
    if (!params.filter?.q) {
      return params;
    }

    const { q, ...filter } = params.filter;

    // Apply soft delete filter automatically for supported resources (unless it's a view)
    const softDeleteFilter = params.filter?.includeDeleted || !shouldAddSoftDeleteFilter
      ? {}
      : { "deleted_at@is": null };

    return {
      ...params,
      filter: {
        ...filter,
        ...softDeleteFilter,
        "@or": columns.reduce((acc, column) => {
          return {
            ...acc,
            [`${column}@ilike`]: q,
          };
        }, {}),
      },
    };
  };
}

/**
 * Get the appropriate database resource name
 */
export function getDatabaseResource(
  resource: string,
  operation: "list" | "one" | "create" | "update" | "delete" = "list",
): string {
  const actualResource = getResourceName(resource);

  // Use summary views for list operations when available
  if (operation === "list" || operation === "one") {
    const summaryResource = `${actualResource}_summary`;
    if (
      resource === "organizations" ||
      resource === "contacts"
    ) {
      return summaryResource;
    }
    // Note: opportunities_summary removed for MVP - query base table directly
  }

  return actualResource;
}

/**
 * Apply search parameters to a query
 * Enhanced version that supports both search and automatic soft delete filtering
 *
 * @param resource - The resource name
 * @param params - The query parameters
 * @param useView - Whether this query will use a summary view (true for getList, false for getManyReference)
 */
export function applySearchParams(
  resource: string,
  params: GetListParams,
  useView: boolean = true,
): GetListParams {
  const searchableFields = getCachedSearchableFields(resource);

  // Check if we're using a view (views already handle soft delete filtering internally)
  // Only check for view if the operation will actually use one
  const dbResource = useView ? getDatabaseResource(resource, "list") : getResourceName(resource);
  const isView = dbResource.includes("_summary") || dbResource.includes("_view");

  // Apply soft delete filter for all supported resources, even without search
  // But skip for views as they handle this internally and adding the filter causes PostgREST errors
  const needsSoftDeleteFilter = supportsSoftDelete(resource) &&
    !params.filter?.includeDeleted &&
    !isView;

  // Transform array filters to PostgREST operators
  const transformedFilter = transformArrayFilters(params.filter);

  // If no search query but needs soft delete filter
  if (!transformedFilter?.q && needsSoftDeleteFilter) {
    return {
      ...params,
      filter: {
        ...transformedFilter,
        "deleted_at@is": null,
      },
    };
  }

  // If no search query and no soft delete needed, return params with transformed filters
  if (!transformedFilter?.q) {
    return {
      ...params,
      filter: transformedFilter,
    };
  }

  // Extract search query and apply full-text search
  const { q, ...filterWithoutQ } = transformedFilter;

  // If no searchable fields configured, apply basic soft delete only
  if (searchableFields.length === 0) {
    const softDeleteFilter = needsSoftDeleteFilter ? { "deleted_at@is": null } : {};
    return {
      ...params,
      filter: {
        ...filterWithoutQ,
        ...softDeleteFilter,
      },
    };
  }

  // Use the applyFullTextSearch helper for resources with search configuration
  // Pass the needsSoftDeleteFilter flag to avoid adding deleted_at filter for views
  const searchParams = applyFullTextSearch(searchableFields, needsSoftDeleteFilter)({
    ...params,
    filter: transformedFilter,
  });

  return searchParams;
}

// Type for database records that may have JSONB array fields
interface JsonbArrayRecord {
  id?: string | number;
  email?: unknown;
  phone?: unknown;
  tags?: unknown;
  [key: string]: unknown;
}

/**
 * Normalize JSONB array fields to ensure they are always arrays
 * This prevents runtime errors when components expect array data
 * Engineering Constitution: BOY SCOUT RULE - fixing data inconsistencies
 */
export function normalizeJsonbArrayFields<T extends JsonbArrayRecord>(data: T | null | undefined): T | null | undefined {
  if (!data) return data;

  // Helper to ensure a value is always an array
  const ensureArray = (value: any): any[] => {
    if (value === null || value === undefined) {
      return [];
    }
    if (!Array.isArray(value)) {
      // Data has been migrated to arrays - this shouldn't happen anymore
      // If it's an object, wrap it in an array, otherwise return empty array
      return typeof value === 'object' ? [value] : [];
    }
    return value;
  };

  // Normalize based on resource type
  // Currently only contacts have JSONB array fields that need normalization
  if (data.email !== undefined || data.phone !== undefined || data.tags !== undefined) {
    return {
      ...data,
      ...(data.email !== undefined && { email: ensureArray(data.email) }),
      ...(data.phone !== undefined && { phone: ensureArray(data.phone) }),
      ...(data.tags !== undefined && { tags: ensureArray(data.tags) }),
    };
  }

  return data;
}

/**
 * Normalize response data from database queries
 * Applies to both single records and arrays of records
 */
export function normalizeResponseData<T extends JsonbArrayRecord>(
  resource: string,
  data: T | T[] | null | undefined
): T | T[] | null | undefined {
  // Handle array of records (getList, getMany, getManyReference)
  if (Array.isArray(data)) {
    return data.map(record => normalizeJsonbArrayFields(record)).filter((r): r is T => r !== null && r !== undefined);
  }

  // Handle single record (getOne)
  return normalizeJsonbArrayFields(data);
}