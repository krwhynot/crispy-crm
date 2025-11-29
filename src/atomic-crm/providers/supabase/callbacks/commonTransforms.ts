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

import type { RaRecord } from "ra-core";
import type { Transform } from "./createResourceCallbacks";

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
