/**
 * Date Filter Labels Utility
 *
 * Provides semantic label detection for date range filters.
 * Instead of checking "is this date today?", we check "does this filter
 * combination match a known sidebar preset?".
 *
 * This fixes the badge label mismatch bug where selecting "This week"
 * would show "Today" if the start of week happened to be today.
 *
 * @module filters/dateFilterLabels
 */

import {
  startOfWeek,
  startOfMonth,
  subDays,
  endOfYesterday,
  isSameDay,
  format,
} from "date-fns";

/**
 * Detect which sidebar date preset was selected based on filter values.
 * Matches the filter combination against known sidebar button patterns.
 *
 * @param gteValue - The @gte / _gte filter value (ISO date string)
 * @param lteValue - The @lte / _lte filter value (ISO date string)
 * @returns The semantic label (e.g., "This week") or null if no preset matches
 *
 * @example
 * // Returns "This week" when only @gte is set to start of week
 * detectDatePresetLabel(startOfWeek(new Date()).toISOString(), undefined)
 *
 * @example
 * // Returns "Before this month" when only @lte is set to start of month
 * detectDatePresetLabel(undefined, startOfMonth(new Date()).toISOString())
 */
export function detectDatePresetLabel(
  gteValue: string | undefined,
  lteValue: string | undefined
): string | null {
  const now = new Date();

  // Parse dates
  const gteDate = gteValue ? new Date(gteValue) : null;
  const lteDate = lteValue ? new Date(lteValue) : null;

  // Validate parsed dates
  if (gteDate && isNaN(gteDate.getTime())) return null;
  if (lteDate && isNaN(lteDate.getTime())) return null;

  // Only @gte set (no @lte) - "since" filters
  if (gteDate && !lteDate) {
    if (isSameDay(gteDate, endOfYesterday())) return "Today";
    if (isSameDay(gteDate, startOfWeek(now))) return "This week";
    if (isSameDay(gteDate, startOfMonth(now))) return "This month";
  }

  // Both @gte and @lte set - range filters
  if (gteDate && lteDate) {
    // Last week: 7 days ago to yesterday
    if (
      isSameDay(gteDate, subDays(now, 7)) &&
      isSameDay(lteDate, endOfYesterday())
    ) {
      return "Last week";
    }
    // Custom range: fall through to formatted dates
  }

  // Custom range or no match - return null to use default formatting
  return null;
}

/**
 * Format a single date value for display (fallback for custom date ranges).
 *
 * @param value - ISO date string
 * @returns Formatted date string like "Jan 4, 2026"
 */
export function formatDateValue(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return format(date, "MMM d, yyyy");
}
