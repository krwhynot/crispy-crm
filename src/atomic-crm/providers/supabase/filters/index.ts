/**
 * Filter Registry - Type-Safe Filterable Fields Definition
 *
 * This registry defines valid filterable fields for each resource, preventing
 * 400 errors from stale cached filters that reference non-existent database columns.
 *
 * ## Type Safety (Phase 7)
 *
 * This module is now TYPE-LINKED to `database.generated.ts`:
 * - `RegisteredResource` type constrains keys to actual Tables + Views
 * - Column arrays include DB columns + virtual fields (q, stale, nested filters)
 * - `getFilterableFields()` throws on unknown resources (security hardening)
 *
 * Used by:
 * - ValidationService.validateFilters() in the dataProvider layer (API protection)
 * - useFilterCleanup() hook in components (localStorage/UI cleanup)
 *
 * IMPORTANT: Update this registry when database schema changes affect filterable columns.
 *
 * Note: For fields supporting React Admin filter operators (e.g., @gte, @lte, @like),
 * only list the base field name. The validation logic handles operator suffixes.
 * Example: "last_seen" allows "last_seen@gte", "last_seen@lte", etc.
 *
 * ## $or Filter Limitation (UX-02)
 *
 * **KNOWN LIMITATION:** Same-key alternatives in $or do NOT work due to JavaScript
 * object key deduplication:
 *
 * ```typescript
 * // ❌ DOES NOT WORK: Same field in multiple $or conditions
 * { $or: [{ stage: "a" }, { stage: "b" }] }
 * // Transforms to: { "@or": { stage: "b" } } — "a" is silently lost!
 *
 * // ✅ WORKAROUND: Use @in operator instead
 * { "stage@in": ["a", "b"] }
 * // Correctly queries: stage IN ('a', 'b')
 * ```
 *
 * **Why this happens:** When transformOrFilter() converts $or array to PostgREST
 * object format, duplicate keys are deduplicated by JavaScript (last value wins).
 *
 * **When to use $or:** Multi-field OR queries work correctly:
 * ```typescript
 * { $or: [{ customer_org_id: 5 }, { principal_org_id: 5 }] }
 * // Works! Different keys are preserved.
 * ```
 *
 * Schema Source: Derived from actual database columns via supabase-lite MCP tools
 * Last Updated: 2026-01-25
 */

// Import domain-specific filter definitions
import { contactsFilters } from "./contacts";
import { organizationsFilters } from "./organizations";
import { opportunitiesFilters } from "./opportunities";
import { activitiesFilters } from "./activities";
import { productsFilters } from "./products";
import { usersFilters } from "./users";
import { dashboardsFilters } from "./dashboards";
import { miscFilters } from "./misc";

// Import types
import type { FilterRegistry } from "./types";

// =============================================================================
// COMBINED FILTER REGISTRY
// =============================================================================

/**
 * The filterable fields registry with type-safe resource keys.
 *
 * NOTE: We use `as const satisfies FilterRegistry` to:
 * 1. Ensure all keys are valid RegisteredResource types
 * 2. Preserve the readonly tuple types for values
 * 3. Allow TypeScript to catch typos in resource names
 */
export const filterableFields = {
  ...contactsFilters,
  ...organizationsFilters,
  ...opportunitiesFilters,
  ...activitiesFilters,
  ...productsFilters,
  ...usersFilters,
  ...dashboardsFilters,
  ...miscFilters,
} as const satisfies Partial<FilterRegistry>;

// Export the type for external use
export type FilterableResource = keyof typeof filterableFields;

// =============================================================================
// RE-EXPORT TYPES AND UTILITIES
// =============================================================================

// Export all types
export type {
  TableName,
  ViewName,
  DatabaseResource,
  TableColumns,
  ViewColumns,
  VirtualFilterField,
  RegisteredResource,
  FilterRegistry,
} from "./types";

// Export error class
export { UnregisteredResourceError } from "./types";

// Export utility functions
export { getFilterableFields, isRegisteredResource, isValidFilterField } from "./utils";
