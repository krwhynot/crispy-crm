/**
 * List Default Constants - Stable references for List component props
 *
 * These constants prevent unnecessary re-renders by providing stable object references
 * for sort, filter, and other props that would otherwise be recreated on each render.
 *
 * @see Engineering Constitution - Single Source of Truth principle
 * @see PERF-1 - Extract inline object props to constants
 */

import type { SortPayload } from "react-admin";

// =============================================================================
// SORT CONSTANTS
// =============================================================================

/**
 * Sort by created_at descending (newest first)
 * Common default for most list views
 */
export const SORT_BY_CREATED_DESC: SortPayload = {
  field: "created_at",
  order: "DESC",
} as const;

/**
 * Sort by updated_at descending (recently modified first)
 * Used for organization lists
 */
export const SORT_BY_UPDATED_DESC: SortPayload = {
  field: "updated_at",
  order: "DESC",
} as const;

// =============================================================================
// FILTER CONSTANTS
// =============================================================================

/**
 * Filter for active (non-deleted) records
 * Used by opportunities and activities lists
 */
export const FILTER_ACTIVE_RECORDS = {
  "deleted_at@is": null,
} as const;
