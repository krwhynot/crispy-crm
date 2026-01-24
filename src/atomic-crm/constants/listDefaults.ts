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

/**
 * Sort by name ascending (A-Z)
 * Used for reference dropdowns and product lists
 */
export const SORT_BY_NAME_ASC: SortPayload = {
  field: "name",
  order: "ASC",
} as const;

/**
 * Sort by last_name ascending (A-Z)
 * Used for contact reference inputs and sales rep dropdowns
 */
export const SORT_BY_LAST_NAME_ASC: SortPayload = {
  field: "last_name",
  order: "ASC",
} as const;

/**
 * Sort by first_name ascending (A-Z)
 * Used for sales list
 */
export const SORT_BY_FIRST_NAME_ASC: SortPayload = {
  field: "first_name",
  order: "ASC",
} as const;

/**
 * Sort by activity_date descending (most recent activity first)
 * Used for activity lists and opportunity notes
 */
export const SORT_BY_ACTIVITY_DATE_DESC: SortPayload = {
  field: "activity_date",
  order: "DESC",
} as const;

/**
 * Sort by due_date ascending (soonest due first)
 * Used for task lists - shows urgent items first
 */
export const SORT_BY_DUE_DATE_ASC: SortPayload = {
  field: "due_date",
  order: "ASC",
} as const;

/**
 * Sort by last_seen descending (most recently contacted first)
 * Used for contact lists
 */
export const SORT_BY_LAST_SEEN_DESC: SortPayload = {
  field: "last_seen",
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

/**
 * Filter for interaction-type activities
 * Used in opportunity notes tab
 */
export const FILTER_INTERACTION_ACTIVITIES = {
  activity_type: "interaction",
} as const;

/**
 * Filter for enabled sales reps only
 * Used in account manager dropdowns
 */
export const FILTER_ENABLED_SALES = {
  "disabled@neq": true,
} as const;

/**
 * Filter for enabled sales reps with user accounts
 * Used in organization contact dropdowns
 */
export const FILTER_ENABLED_SALES_WITH_USER = {
  "disabled@neq": true,
  "user_id@not.is": null,
} as const;

/**
 * Filter for customer/prospect organizations
 * Used in opportunity customer organization dropdowns
 */
export const FILTER_CUSTOMER_ORGANIZATIONS = {
  "organization_type@in": "(prospect,customer)",
} as const;

/**
 * Filter for principal organizations
 * Used in opportunity principal organization dropdowns
 */
export const FILTER_PRINCIPAL_ORGANIZATIONS = {
  organization_type: "principal",
} as const;

/**
 * Filter for distributor organizations
 * Used in opportunity distributor organization dropdowns
 */
export const FILTER_DISTRIBUTOR_ORGANIZATIONS = {
  organization_type: "distributor",
} as const;

// =============================================================================
// FILTER DEFAULT VALUES
// =============================================================================

/**
 * Default filter showing only active (non-disabled) users
 * Used for sales list
 */
export const FILTER_DEFAULTS_ACTIVE_USERS = {
  disabled: false,
} as const;

// =============================================================================
// STYLE CONSTANTS (sx props)
// =============================================================================

/**
 * Minimum width for filter inputs (200px)
 * Used for principal and sales rep filters in reports
 */
export const SX_MIN_WIDTH_200 = {
  minWidth: 200,
} as const;

/**
 * Minimum width for narrow filter inputs (150px)
 * Used for stage multi-select filters
 */
export const SX_MIN_WIDTH_150 = {
  minWidth: 150,
} as const;
