/**
 * Common Transform Functions
 *
 * Reusable transformation functions for resource callbacks.
 * These transforms can be used with the createResourceCallbacks factory
 * via the readTransforms, writeTransforms, or deleteTransforms parameters.
 *
 * Design principle: Each transform is a pure function that does one thing well.
 * Multiple transforms can be composed sequentially by listing them in the config array.
 *
 * Engineering Constitution: Shared utility functions extracted for reuse
 * Pattern: Factory pattern with composable transforms (see createResourceCallbacks.ts)
 */

import type { RaRecord, GetListParams } from "ra-core";
import type { Transform } from "./createResourceCallbacks";
import { escapeForIlike } from "../dataProviderUtils";

/**
 * JSONB array fields that need normalization across multiple resources
 * Database may return null/undefined but frontend expects arrays
 */
const JSONB_ARRAY_FIELDS_CONTACTS = ["email", "phone", "tags"] as const;

/**
 * Normalize JSONB array fields to ensure they are always arrays
 * Prevents runtime errors when components expect array data
 *
 * This is contacts-specific but exported as a common transform
 * for potential reuse in other resources with similar patterns.
 *
 * @param record - The record from database
 * @returns Record with normalized array fields
 *
 * @example
 * ```typescript
 * import { createResourceCallbacks } from "./createResourceCallbacks";
 * import { commonTransforms } from "./commonTransforms";
 *
 * export const contactsCallbacks = createResourceCallbacks({
 *   resource: 'contacts',
 *   supportsSoftDelete: true,
 *   computedFields: CONTACT_COMPUTED_FIELDS,
 *   readTransforms: [commonTransforms.normalizeJsonbArrays], // New way!
 * });
 * ```
 */
export function normalizeJsonbArrays(record: RaRecord): RaRecord {
  const normalized = { ...record };

  for (const field of JSONB_ARRAY_FIELDS_CONTACTS) {
    if (field in normalized) {
      const value = normalized[field];
      if (value === null || value === undefined) {
        normalized[field] = [];
      } else if (!Array.isArray(value)) {
        // Handle unexpected non-array values (shouldn't happen after migration)
        normalized[field] = typeof value === "object" ? [value] : [];
      }
    }
  }

  return normalized;
}

/**
 * Registry of common transforms for easy discovery and composition
 * Allows resources to opt-in to reusable transforms by name
 *
 * @example
 * ```typescript
 * // Use transforms from registry in createResourceCallbacks
 * const callbacks = createResourceCallbacks({
 *   resource: 'contacts',
 *   readTransforms: [
 *     commonTransforms.normalizeJsonbArrays,
 *     commonTransforms.ensurePhoneArrays,
 *   ],
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Or compose them with inline transforms
 * const callbacks = createResourceCallbacks({
 *   resource: 'contacts',
 *   readTransforms: [
 *     commonTransforms.normalizeJsonbArrays,
 *     (record) => ({ ...record, custom: true }), // Inline function
 *   ],
 * });
 * ```
 */
export const commonTransforms = {
  normalizeJsonbArrays: {
    name: "normalize-jsonb-arrays",
    description:
      "Ensure JSONB array fields (email, phone, tags) are always arrays, not null/undefined",
    apply: normalizeJsonbArrays,
  },
} as const satisfies Record<string, Transform>;

/**
 * Configuration for q→ILIKE search transformation
 */
export interface QToIlikeConfig {
  /** Fields to search with ILIKE when q filter is present */
  searchFields: readonly string[];
  /**
   * Whether to use raw PostgREST syntax with escaping
   * Required for multi-word searches due to ra-data-postgrest library bug
   * @default false
   */
  useRawPostgrest?: boolean;
}

/**
 * Create a q→ILIKE search transformer for a specific resource
 *
 * This factory creates a function that transforms a `q` filter into
 * `@or` ILIKE conditions on the specified search fields.
 *
 * Two modes are supported:
 * 1. Standard mode (default): Uses React Admin's `@or` filter syntax
 * 2. Raw PostgREST mode: Uses raw `or@` syntax with proper escaping
 *    Required for multi-word searches due to ra-data-postgrest library bug
 *
 * @param config - Configuration with searchFields and optional useRawPostgrest flag
 * @returns A function that transforms GetListParams
 *
 * @example Standard mode (contacts, opportunities, sales)
 * ```typescript
 * const transformContactsSearch = createQToIlikeTransformer({
 *   searchFields: ["name", "first_name", "last_name"],
 * });
 *
 * // Input: { filter: { q: "john", status: "active" } }
 * // Output: { filter: { status: "active", "@or": { "name@ilike": "%john%", ... } } }
 * ```
 *
 * @example Raw PostgREST mode (organizations - for multi-word searches)
 * ```typescript
 * const transformOrgsSearch = createQToIlikeTransformer({
 *   searchFields: ["name", "city", "state", "sector"],
 *   useRawPostgrest: true,
 * });
 *
 * // Input: { filter: { q: "Test Org 2024" } }
 * // Output: { filter: { "or@": "(name.ilike.*Test Org 2024*,...)" } }
 * ```
 */
export function createQToIlikeTransformer(
  config: QToIlikeConfig
): (params: GetListParams) => GetListParams {
  const { searchFields, useRawPostgrest = false } = config;

  return (params: GetListParams): GetListParams => {
    const { q, ...filterWithoutQ } = params.filter || {};

    // If no q filter, return params unchanged
    if (!q || typeof q !== "string") {
      return params;
    }

    if (useRawPostgrest) {
      // Raw PostgREST mode: Handle multi-word searches with proper escaping
      // WORKAROUND for ra-data-postgrest library bug with 3+ word ILIKE values
      const trimmed = q.trim();
      if (!trimmed) {
        return params;
      }

      const escaped = escapeForIlike(trimmed);

      // Build raw PostgREST OR condition with properly escaped ILIKE
      // Uses * for wildcards (PostgREST URL syntax, not SQL %)
      // Values with spaces/special chars are double-quoted per PostgREST spec
      const needsQuoting = /[,."':() ]/.test(escaped);
      const wildcardValue = needsQuoting ? `"*${escaped}*"` : `*${escaped}*`;

      const orConditions = searchFields
        .map((field) => `${field}.ilike.${wildcardValue}`)
        .join(",");

      return {
        ...params,
        filter: {
          ...filterWithoutQ,
          "or@": `(${orConditions})`,
        },
      };
    }

    // Standard mode: Use React Admin @or filter syntax
    const searchTerm = `%${q}%`;

    const orFilter = searchFields.reduce(
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
  };
}

/**
 * Legacy export: transformQToIlikeSearch for backward compatibility
 *
 * @deprecated Use createQToIlikeTransformer factory instead
 * This is kept for backward compatibility with existing imports
 *
 * @param params - GetListParams with filter containing q
 * @param searchFields - Fields to search with ILIKE
 * @returns Transformed params with @or ILIKE filter
 */
export function transformQToIlikeSearch(
  params: GetListParams,
  searchFields: readonly string[]
): GetListParams {
  return createQToIlikeTransformer({ searchFields })(params);
}
