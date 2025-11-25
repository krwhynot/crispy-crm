/**
 * Generic type utilities for type-safe resource name lookups
 *
 * This module provides type constraints that ensure:
 * 1. Resources always have an `id` field
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
 * All CRM resources have `id: string | number` from Zod schemas
 */
export interface ResourceWithId {
  id: string | number;
}

/**
 * Generic function type for extracting display name from a resource
 * @template T - The resource type (must have an id)
 */
export type DisplayNameExtractor<T extends ResourceWithId> = (item: T) => string;

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
 */
export const resourceExtractors = {
  /**
   * Extract display name from Sales resource
   * Combines first_name and last_name with fallback
   */
  sales: ((s: Sales) =>
    `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() ||
    "Unknown") satisfies DisplayNameExtractor<Sales>,

  /**
   * Extract display name from Organization resource
   */
  organizations: ((o: Organization) => o.name) satisfies DisplayNameExtractor<Organization>,

  /**
   * Extract display name from Tag resource
   */
  tags: ((t: Tag) => t.name) satisfies DisplayNameExtractor<Tag>,
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
