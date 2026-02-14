/**
 * Application-wide constants
 * Single source of truth for magic numbers
 *
 * @see Engineering Constitution - Single Source of Truth principle
 */

// =============================================================================
// Search & Filter
// =============================================================================

/**
 * Standard debounce delay for search inputs
 * Balances responsiveness with API efficiency
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Standard debounce delay for filter inputs
 */
export const FILTER_DEBOUNCE_MS = 300;

/**
 * Minimum characters before triggering autocomplete search
 * Prevents overly broad searches
 */
export const AUTOCOMPLETE_MIN_CHARS = 2;

// =============================================================================
// Cache & Stale Time
// =============================================================================

/**
 * Default stale time for React Query caches (5 minutes)
 * Balance between freshness and API efficiency
 */
export const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Default garbage collection time for React Query (15 minutes)
 */
export const DEFAULT_GC_TIME_MS = 15 * 60 * 1000;

// =============================================================================
// Pagination
// =============================================================================

/**
 * Default page size for list views
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Maximum page size for list requests
 * Prevents excessive data transfer
 */
export const MAX_PAGE_SIZE = 100;

/** Upper bound for secondary lookup queries (sales reps, orgs). Prevents silent truncation. */
export const LOOKUP_PAGE_SIZE = 200;

// =============================================================================
// Time Intervals
// =============================================================================

/**
 * Draft expiry time (24 hours)
 * Used for activity draft auto-cleanup
 */
export const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

// =============================================================================
// Polling & Refresh Intervals
// =============================================================================

/**
 * Notification poll interval (30 seconds)
 * Used for NotificationBell and HealthDashboard auto-refresh
 */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

/**
 * Short cache stale time (30 seconds)
 * Used for data that changes frequently (task counts, org hierarchy)
 */
export const SHORT_STALE_TIME_MS = 30_000;

// =============================================================================
// Toast Durations
// =============================================================================

/**
 * Toast duration for success messages (3 seconds)
 * Short duration - user just needs confirmation
 */
export const TOAST_SUCCESS_DURATION_MS = 3_000;

/**
 * Toast duration for info/warning messages (4 seconds)
 * Medium duration - user may want to read details
 */
export const TOAST_INFO_DURATION_MS = 4_000;

/**
 * Toast duration for error messages (5 seconds)
 * Longer duration - user needs time to read error
 */
export const TOAST_ERROR_DURATION_MS = 5_000;

// =============================================================================
// Reporting Thresholds
// =============================================================================

/**
 * Minimum activities per principal per week before "Low Activity" warning
 * PRD target is 10+ activities/week/principal; this threshold flags critically low
 */
export const LOW_ACTIVITY_THRESHOLD = 3;

// =============================================================================
// Animation & UI Timing
// =============================================================================

/**
 * UI feedback delay for visual confirmation (300ms)
 * Short delay to provide visual feedback on actions
 */
export const UI_FEEDBACK_DELAY_MS = 300;
