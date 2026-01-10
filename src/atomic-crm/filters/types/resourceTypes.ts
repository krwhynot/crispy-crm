/**
 * Generic type utilities for type-safe resource name lookups
 *
 * This module provides type constraints that ensure:
 * 1. Resources have an `id` field (required or optional in schema)
 * 2. Display name extractors are correctly typed per resource
 * 3. The reduce callback receives typed data, not `any`
 *
 * @module filters/types/resourceTypes
 */

import type { Sales } from "../../validation/sales";
import type { Organization } from "../../validation/organizations";
import type { Tag } from "../../validation/tags";

/**
 * Base constraint for any resource that can be looked up by ID
 *
 * Note: Zod schemas define `id` as optional (for creation scenarios),
 * but data returned from dataProvider.getMany() always has id.
 * We use optional here for schema compatibility.
 */
export interface ResourceWithId {
  id?: string | number;
}

/**
 * Represents a resource as returned from the API (id is always present)
 * This is what dataProvider.getMany() actually returns
 */
export type FetchedResource<T extends ResourceWithId> = T & { id: string | number };

/**
 * Generic function type for extracting display name from a resource
 * @template T - The resource type (must have an id field defined in schema)
 */
export type DisplayNameExtractor<T extends ResourceWithId> = (item: FetchedResource<T>) => string;

/**
 * Return type for useResourceNames hooks
 * Consistent across all resource types
 */
export interface ResourceNamesResult {
  /** Map of id -> display name */
  namesMap: Record<string, string>;
  /** Function to get display name by id with fallback */
  getName: (id: string) => string;
  /** Loading state */
  loading: boolean;
}

/**
 * Pre-defined extractors for common resources
 * These are type-safe and provide compile-time checking
 *
 * Note: The `satisfies` keyword ensures type safety while allowing
 * TypeScript to infer the most specific function type.
 */
export const resourceExtractors = {
  /**
   * Extract display name from Sales resource
   * Combines first_name and last_name with ID-based fallback for data quality visibility
   */
  sales: ((s) => {
    const fullName = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
    if (fullName) return fullName;
    return `Sales #${s.id} (missing name)`;
  }) satisfies DisplayNameExtractor<Sales>,

  /**
   * Extract display name from Organization resource
   */
  organizations: ((o) => o.name) satisfies DisplayNameExtractor<Organization>,

  /**
   * Extract display name from Tag resource
   */
  tags: ((t) => t.name) satisfies DisplayNameExtractor<Tag>,
} as const;

/**
 * Type-safe resource name configuration
 * Maps resource names to their types and extractors
 */
export interface ResourceConfig {
  sales: { type: Sales; extractor: typeof resourceExtractors.sales };
  organizations: { type: Organization; extractor: typeof resourceExtractors.organizations };
  tags: { type: Tag; extractor: typeof resourceExtractors.tags };
}

/**
 * Valid resource names for name lookup
 */
export type ResourceName = keyof ResourceConfig;
