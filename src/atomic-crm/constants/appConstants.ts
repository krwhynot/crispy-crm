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

/**
 * Notification auto-hide duration for action items (10 seconds)
 * Longer than default to allow user to read and act
 */
export const NOTIFICATION_AUTO_HIDE_MS = 10_000;

// =============================================================================
// CSV Export & Import Limits
// =============================================================================

/**
 * Maximum rows for CSV export operations
 * Prevents timeout and memory issues
 */
export const CSV_EXPORT_MAX_ROWS = 10_000;

/**
 * Chunk size for batch processing (CSV import/export)
 */
export const CSV_CHUNK_SIZE = 1_000;

/**
 * Maximum characters per CSV cell
 * Prevents DoS via unbounded cell content
 */
export const CSV_MAX_CELL_LENGTH = 1_000;

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

/**
 * Page size for report data fetching
 * Higher limit for aggregate operations
 */
export const REPORT_PAGE_SIZE = 1_000;

// =============================================================================
// Touch Targets (iPad compliance - WCAG 2.1 AA)
// =============================================================================

/**
 * Minimum touch target size in pixels (44px per WCAG 2.1 AA)
 * All interactive elements must meet this minimum
 */
export const MIN_TOUCH_TARGET_PX = 44;

// =============================================================================
// Time Intervals
// =============================================================================

/**
 * Draft expiry time (24 hours)
 * Used for activity draft auto-cleanup
 */
export const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Recent task window (5 minutes)
 * Used to determine if a task was "just completed"
 */
export const RECENT_TASK_WINDOW_MS = 5 * 60 * 1000;

/**
 * Milliseconds per day (for date calculations)
 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

/**
 * Toast duration for action items (10 seconds)
 * Extended duration - gives user time to read and act
 */
export const TOAST_ACTION_DURATION_MS = 10_000;

// =============================================================================
// Animation & UI Timing
// =============================================================================

/**
 * Standard animation duration for UI transitions (300ms)
 * Matches Tailwind's duration-300 class
 */
export const ANIMATION_DURATION_MS = 300;

/**
 * UI feedback delay for visual confirmation (300ms)
 * Short delay to provide visual feedback on actions
 */
export const UI_FEEDBACK_DELAY_MS = 300;

// =============================================================================
// Validation Limits
// =============================================================================

/**
 * Maximum length for name fields (255 characters)
 * Standard database varchar limit
 */
export const MAX_NAME_LENGTH = 255;

/**
 * Maximum length for description/notes fields (2000 characters)
 * Prevents excessively long text entries
 */
export const MAX_DESCRIPTION_LENGTH = 2_000;
