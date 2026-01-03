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
import { subDays } from "date-fns";
import { getSearchableFields, supportsSoftDelete, getResourceName } from "./resources";
import { escapeCacheManager } from "./dataProviderCache";
import { STAGE_STALE_THRESHOLDS, CLOSED_STAGES } from "../../utils/stalenessCalculation";

// Type for filter payloads (compatible with React Admin filters)
type FilterPayload = Record<string, unknown>;

/**
 * Virtual Filter Transformations
 *
 * Transforms virtual filter fields (not actual DB columns) into database-compatible filters.
 * Called in applySearchParams before other transformations.
 *
 * Currently supported virtual filters:
 * - "stale": For opportunities - fetches deals exceeding per-stage activity thresholds
 */

/**
 * Transform "stale" virtual filter to database-compatible filters.
 *
 * Staleness has per-stage thresholds (PRD Section 6.3):
 * - new_lead: 7 days
 * - initial_outreach: 14 days
 * - sample_visit_offered: 14 days
 * - feedback_logged: 21 days
 * - demo_scheduled: 14 days
 *
 * Since we can't express per-stage thresholds in a single PostgREST query,
 * we use the minimum threshold (7 days) to fetch all POTENTIALLY stale candidates.
 * Client-side filtering with isOpportunityStale() can refine the results.
 *
 * Filter transforms:
 * { stale: true } → {
 *   "stage@not.in": (closed_won,closed_lost),
 *   "or@": "(last_activity_date.lt.THRESHOLD,last_activity_date.is.null)"
 * }
 */
export function transformStaleFilter(filter: FilterPayload, resource: string): FilterPayload {
  // Only applies to opportunities resource
  if (resource !== "opportunities" && resource !== "opportunities_summary") {
    return filter;
  }

  // Check if stale filter is present
  if (!filter || filter.stale !== true) {
    return filter;
  }

  // Remove the virtual "stale" key
  const { stale: _, ...restFilter } = filter;

  // Calculate threshold date using minimum threshold (7 days for new_lead)
  // This ensures we capture ALL potentially stale deals
  const minThreshold = Math.min(...Object.values(STAGE_STALE_THRESHOLDS));
  const thresholdDate = subDays(new Date(), minThreshold);
  const thresholdISO = thresholdDate.toISOString().split("T")[0]; // YYYY-MM-DD format

  // Build the transformed filter:
  // 1. Exclude closed stages (closed_won, closed_lost)
  // 2. Include deals with last_activity_date < threshold OR last_activity_date IS NULL
  return {
    ...restFilter,
    // Exclude closed stages
    "stage@not.in": `(${CLOSED_STAGES.join(",")})`,
    // Include deals with old activity OR no activity
    // Using PostgREST's native OR syntax via "or@" key
    "or@": `(last_activity_date.lt.${thresholdISO},last_activity_date.is.null)`,
  };
}

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
 * Cache for escaped PostgREST values using LRU eviction
 * Replaces Map-based cache with proper LRU implementation
 * Max 1000 entries, 5-minute TTL
 */

/**
 * Escape values for PostgREST according to official documentation
 * PostgREST uses BACKSLASH escaping, NOT doubled quotes!
 * Now with LRU caching for frequently used values
 */
export function escapeForPostgREST(value: string | number | boolean | null | undefined): string {
  const str = String(value);

  // Check cache first
  const cached = escapeCacheManager.get(str);
  if (cached !== undefined) {
    return cached;
  }

  // Check for PostgREST reserved characters
  const needsQuoting = /[,."':() ]/.test(str);

  let result: string;
  if (!needsQuoting) {
    result = str;
  } else {
    // IMPORTANT: Escape backslashes first, then quotes
    let escaped = str.replace(/\\/g, "\\\\"); // Backslash → \\
    escaped = escaped.replace(/"/g, '\\"'); // Quote → \"
    result = `"${escaped}"`;
  }

  // Add to LRU cache (automatic eviction when max size reached)
  escapeCacheManager.set(str, result);

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
  if (!filter || typeof filter !== "object") {
    return filter || {};
  }

  // DEBUG: Trace filter transformation for hierarchy exclusion investigation
  if (filter && Object.keys(filter).some((k) => k.includes("not_in"))) {
    console.log("🔍 transformArrayFilters input (not_in detected):", JSON.stringify(filter));
  }

  const transformed: Record<string, unknown> = {};

  // Fields that are stored as JSONB arrays in PostgreSQL
  // These use the @cs (contains) operator
  const jsonbArrayFields = ["tags", "email", "phone"];

  for (const [key, value] of Object.entries(filter)) {
    // Handle existing PostgREST operators (keys containing @)
    // IMPORTANT: Check this BEFORE null check because @is operator needs null values
    // e.g., "deleted_at@is": null translates to PostgREST's "deleted_at=is.null"
    if (key.includes("@")) {
      // Convert underscore-separated operators to dot-separated for PostgREST
      // e.g., "stage@not_in" → "stage@not.in" (PostgREST uses dot notation)
      const normalizedKey = key.replace(/@not_in$/, "@not.in");

      // If the value is an array, transform it to PostgREST format
      // e.g., "stage@not.in": ["closed_won", "closed_lost"] → "stage@not.in": "(closed_won,closed_lost)"
      if (Array.isArray(value) && value.length > 0) {
        transformed[normalizedKey] = `(${value.map(escapeForPostgREST).join(",")})`;
      } else {
        transformed[normalizedKey] = value;
      }
      continue;
    }

    // Skip null/undefined values for non-operator keys
    if (value === null || value === undefined) {
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
        transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(",")}}`;
      } else {
        // Regular IN operator - format: (val1,val2,val3)
        // This checks if the field value is in the list
        transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(",")})`;
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

  // DEBUG: Trace filter transformation output for hierarchy exclusion investigation
  if (Object.keys(transformed).some((k) => k.includes("not.in"))) {
    console.log("🔍 transformArrayFilters output (not.in result):", JSON.stringify(transformed));
  }

  return transformed;
}

/**
 * Escape ILIKE special characters in search strings
 * ILIKE uses % and _ as wildcards, and \ as escape character
 * These must be escaped to be treated as literals
 *
 * @example
 * escapeForIlike("100% done") → "100\\% done"
 * escapeForIlike("file_name") → "file\\_name"
 */
export function escapeForIlike(str: string): string {
  // Escape backslash first (it's the escape character), then % and _
  return str.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Apply full-text search to query parameters
 *
 * WORKAROUND for ra-data-postgrest library bug:
 * The library splits multi-word ILIKE values on whitespace and has a bug
 * handling 3+ words (line 151 checks result[key] instead of result.filter[key]).
 *
 * SOLUTION: Use "or@" key (empty operator) which passes the value through
 * unchanged, bypassing the flawed ILIKE splitting and array handling.
 */
export function applyFullTextSearch(
  columns: readonly string[],
  shouldAddSoftDeleteFilter: boolean = true
) {
  return (params: GetListParams): GetListParams => {
    if (!params.filter?.q) {
      return params;
    }

    const { q, ...filter } = params.filter;

    // Trim and validate search term
    const trimmed = String(q).trim();
    if (!trimmed) {
      return params;
    }

    // Apply soft delete filter automatically for supported resources (unless it's a view)
    const softDeleteFilter =
      params.filter?.includeDeleted || !shouldAddSoftDeleteFilter ? {} : { "deleted_at@is": null };

    // Escape ILIKE special characters (%, _, \)
    const escaped = escapeForIlike(trimmed);

    // Build raw PostgREST OR condition with properly escaped ILIKE
    // Uses * for wildcards (PostgREST URL syntax, not SQL %)
    // Values with spaces/special chars are double-quoted per PostgREST spec
    const needsQuoting = /[,."':() ]/.test(escaped);
    const wildcardValue = needsQuoting ? `"*${escaped}*"` : `*${escaped}*`;

    const orConditions = columns.map((column) => `${column}.ilike.${wildcardValue}`).join(",");

    // Use "or@" key to pass raw PostgREST syntax through unchanged
    // The empty operator (@) makes ra-data-postgrest return the value as-is
    return {
      ...params,
      filter: {
        ...filter,
        ...softDeleteFilter,
        "or@": `(${orConditions})`,
      },
    };
  };
}

/**
 * Transform MongoDB-style $or filter to PostgREST format
 *
 * Converts React Admin/frontend-style $or operator into PostgREST query string format.
 * PostgREST expects: `or=(field1.eq.val1,field2.eq.val2)` as a query parameter.
 *
 * @example
 * // Input (MongoDB-style from frontend components)
 * { $or: [{ customer_organization_id: 5 }, { principal_organization_id: 5 }] }
 *
 * // Output (PostgREST format - string value)
 * { "or": "(customer_organization_id.eq.5,principal_organization_id.eq.5)" }
 *
 * @param filter - The filter object potentially containing $or
 * @returns Filter with $or transformed to PostgREST string format
 */
export const transformOrFilter = (filter: FilterPayload): FilterPayload => {
  const orFilter = filter.$or;
  if (!orFilter) {
    return filter;
  }

  // Transform $or array into @or object format for ra-data-postgrest
  // Library expects: { "@or": { field1: value1, field2: value2 } }
  // NOT: { "or": "(field1.eq.value1,field2.eq.value2)" }
  //
  // The library parses "@or" by splitting on "@" to get operator="or",
  // then recursively processes the object value to build the PostgREST query.
  const orObject: FilterPayload = {};
  for (const condition of orFilter) {
    const key = Object.keys(condition)[0];
    if (key) {
      orObject[key] = condition[key];
    }
  }

  const { $or: _, ...rest } = filter;
  return { ...rest, "@or": orObject };
};

/**
 * Get the appropriate database resource name
 */
export function getDatabaseResource(
  resource: string,
  operation: "list" | "one" | "create" | "update" | "delete" = "list"
): string {
  const actualResource = getResourceName(resource);

  // Use summary views for list operations only (not getOne - base table avoids RLS mismatches)
  if (operation === "list") {
    const summaryResource = `${actualResource}_summary`;
    if (
      resource === "organizations" ||
      resource === "contacts" ||
      resource === "opportunities" ||
      resource === "products"
    ) {
      return summaryResource;
    }
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
  useView: boolean = true
): GetListParams {
  const searchableFields = getCachedSearchableFields(resource);

  // Check if we're using a view (views already handle soft delete filtering internally)
  // Only check for view if the operation will actually use one
  const dbResource = useView ? getDatabaseResource(resource, "list") : getResourceName(resource);
  const isView = dbResource.includes("_summary") || dbResource.includes("_view");

  // Apply soft delete filter for all supported resources, even without search
  // But skip for views as they handle this internally and adding the filter causes PostgREST errors
  const needsSoftDeleteFilter =
    supportsSoftDelete(resource) && !params.filter?.includeDeleted && !isView;

  // Transform virtual filters (e.g., "stale") to database-compatible filters FIRST
  // This must happen before other transformations to remove virtual keys
  const virtualTransformedFilter = transformStaleFilter(params.filter || {}, resource);

  // Transform $or filters to PostgREST @or format
  // This must happen before array transformation to properly handle $or conditions
  const orTransformedFilter = transformOrFilter(virtualTransformedFilter);

  // Transform array filters to PostgREST operators
  const transformedFilter = transformArrayFilters(orTransformedFilter);

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
  const { q: _q, ...filterWithoutQ } = transformedFilter;

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
  return applyFullTextSearch(
    searchableFields,
    needsSoftDeleteFilter
  )({
    ...params,
    // CRITICAL: Pass the transformedFilter to preserve the $or and array transformations.
    filter: transformedFilter,
  });
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
export function normalizeJsonbArrayFields<T extends JsonbArrayRecord>(
  data: T | null | undefined
): T | null | undefined {
  if (!data) return data;

  // Helper to ensure a value is always an array
  const ensureArray = (value: unknown): unknown[] => {
    if (value === null || value === undefined) {
      return [];
    }
    if (!Array.isArray(value)) {
      // Data has been migrated to arrays - this shouldn't happen anymore
      // If it's an object, wrap it in an array, otherwise return empty array
      return typeof value === "object" ? [value] : [];
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
  _resource: string,
  data: T[] | null | undefined
): T[];
export function normalizeResponseData<T extends JsonbArrayRecord>(_resource: string, data: T): T;
export function normalizeResponseData<_T extends JsonbArrayRecord>(
  _resource: string,
  data: null | undefined
): null | undefined;
export function normalizeResponseData<T extends JsonbArrayRecord>(
  _resource: string,
  data: T | T[] | null | undefined
): T | T[] | null | undefined {
  // Handle array of records (getList, getMany, getManyReference)
  if (Array.isArray(data)) {
    if (!data) return [];
    return data
      .map((record) => normalizeJsonbArrayFields(record))
      .filter((r): r is T => r !== null && r !== undefined);
  }

  // Handle single record (getOne)
  return normalizeJsonbArrayFields(data);
}
