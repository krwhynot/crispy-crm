/**
 * Filter Registry Utilities - Security-Hardened Accessor Functions
 *
 * This module provides type-safe functions for accessing and validating
 * filterable fields from the registry.
 */

import type { FilterableResource } from "./index";
import { UnregisteredResourceError } from "./types";
import { filterableFields } from "./index";

/**
 * Get filterable fields for a resource (SECURE VERSION).
 *
 * @param resource The resource name to look up
 * @returns The array of filterable field names
 * @throws UnregisteredResourceError if the resource is not in the registry
 *
 * ## Security Rationale
 *
 * The old `isValidFilterField` returned `false` for unknown resources,
 * which could silently allow malformed filters through in some code paths.
 * This function THROWS on unknown resources, ensuring:
 *
 * 1. **Fail-Fast**: Invalid resources are caught immediately at the validation layer
 * 2. **No Silent Failures**: Developers see explicit errors in logs
 * 3. **Defense in Depth**: Even if other validation is bypassed, this catches it
 *
 * @example
 * ```typescript
 * // Safe usage
 * const fields = getFilterableFields("contacts"); // Returns string[]
 *
 * // Throws on unknown resource (security protection)
 * const fields = getFilterableFields("malicious_table"); // Throws UnregisteredResourceError
 * ```
 */
export function getFilterableFields(resource: string): readonly string[] {
  const fields = filterableFields[resource as FilterableResource];
  if (!fields) {
    throw new UnregisteredResourceError(resource);
  }
  return fields;
}

/**
 * Check if a resource is registered in the filter registry.
 * Use this for conditional logic where you need to handle unregistered resources gracefully.
 *
 * @param resource The resource name to check
 * @returns true if the resource is registered, false otherwise
 */
export function isRegisteredResource(resource: string): resource is FilterableResource {
  return resource in filterableFields;
}

/**
 * Helper function to check if a filter field is valid for a resource
 * @param resource The resource name
 * @param filterKey The filter key (may include operators like @gte)
 * @returns true if the filter is valid, false otherwise
 * @throws UnregisteredResourceError if the resource is not in the registry (security hardening)
 */
export function isValidFilterField(resource: string, filterKey: string): boolean {
  // SECURITY: Throw on unknown resources instead of returning false
  const allowedFields = getFilterableFields(resource);

  // Logical operators - whitelist both input and output formats:
  // Input: MongoDB-style $or/$and/$not from components
  // Output: PostgREST or/and/not after transformOrFilter() conversion.
  const LOGICAL_OPERATORS = ["$or", "$and", "$not", "or", "and", "not", "@or", "or@"];
  if (LOGICAL_OPERATORS.includes(filterKey)) {
    return true;
  }

  // Extract base field name, handling BOTH filter operator conventions:
  // 1. PostgREST style: "last_seen@gte" -> "last_seen"
  // 2. React Admin style: "last_seen_gte" -> "last_seen" (per RA FilteringTutorial docs)
  let baseField = filterKey.split("@")[0]; // PostgREST style

  // Handle React Admin underscore convention (field_operator)
  // Per React Admin docs: "suffix the filter name with an operator, e.g. '_gte'"
  const RA_OPERATORS = [
    "_gte",
    "_lte",
    "_gt",
    "_lt",
    "_neq",
    "_like",
    "_ilike",
    "_in",
    "_nin",
    "_is",
  ];
  for (const op of RA_OPERATORS) {
    if (filterKey.endsWith(op)) {
      baseField = filterKey.slice(0, -op.length);
      break;
    }
  }

  return allowedFields.includes(baseField) || allowedFields.includes(filterKey);
}
