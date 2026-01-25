/**
 * Filter Registry Types - Type-Safe Filterable Fields Definition
 *
 * This module defines type-level constraints for the filter registry,
 * ensuring all registered resources map to actual database tables/views.
 *
 * Schema Source: Derived from actual database columns via supabase-lite MCP tools
 * Last Updated: 2026-01-25
 */

import type { Database } from "@/types/database.generated";

// =============================================================================
// TYPE-SAFE HELPER TYPES
// =============================================================================

/**
 * Extract all table names from the Database type
 */
export type TableName = keyof Database["public"]["Tables"];

/**
 * Extract all view names from the Database type
 */
export type ViewName = keyof Database["public"]["Views"];

/**
 * All database resources (tables + views)
 */
export type DatabaseResource = TableName | ViewName;

/**
 * Extract column names from a table's Row type
 */
export type TableColumns<T extends TableName> = keyof Database["public"]["Tables"][T]["Row"];

/**
 * Extract column names from a view's Row type
 */
export type ViewColumns<T extends ViewName> = keyof Database["public"]["Views"][T]["Row"];

/**
 * Virtual fields that exist in React Admin but not in the database.
 * These are transformed by the data provider layer.
 */
export type VirtualFilterField =
  | "q" // Full-text search parameter
  | "stale" // Staleness filter (transformed to last_activity_date + stage)
  | "type" // Alias for organization_type/activity_type in some contexts
  | "opportunities.campaign" // Nested relationship filter
  | "opportunities.deleted_at"; // Nested relationship filter

/**
 * Resources registered in the filter registry.
 * Includes database resources + React Admin aliases (e.g., contactNotes → contact_notes)
 */
export type RegisteredResource =
  | DatabaseResource
  | "contactNotes" // React Admin alias for contact_notes
  | "opportunityNotes" // React Admin alias for opportunity_notes
  | "user_favorites"; // May not be in generated types yet

/**
 * Type for the filter registry - keys must be registered resources,
 * values are arrays of column names (string for flexibility with virtual fields)
 */
export type FilterRegistry = Record<RegisteredResource, readonly string[]>;

/**
 * Custom error class for filter registry security violations.
 * Thrown when an unregistered resource attempts to use filters.
 */
export class UnregisteredResourceError extends Error {
  constructor(resource: string) {
    super(
      `[SECURITY] Resource "${resource}" is not registered in filterRegistry. ` +
        `This could indicate a filter injection attempt or a missing registry entry. ` +
        `Register the resource in filterableFields if it's legitimate.`
    );
    this.name = "UnregisteredResourceError";
  }
}
