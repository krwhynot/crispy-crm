/**
 * Date utilities for Crispy CRM
 *
 * Provides consistent date handling following MFB business rules.
 * All week calculations use ISO 8601 (Monday as first day of week).
 *
 * @module utils/dateUtils
 */

import { startOfWeek, endOfWeek, format } from "date-fns";

/**
 * Get ISO 8601 week range (Monday to Sunday) for a given date.
 *
 * MFB Business Rule: Week starts on Monday (ISO 8601 standard).
 * This ensures consistent week calculations across all reports and filters.
 *
 * @param date - Date to get week range for (defaults to current date)
 * @returns Object with start and end dates formatted as yyyy-MM-dd
 *
 * @example
 * // Get current week range
 * getWeekRange()
 * // => { start: "2026-01-13", end: "2026-01-19" }
 *
 * @example
 * // Get week range for specific date
 * getWeekRange(new Date("2026-01-15"))
 * // => { start: "2026-01-13", end: "2026-01-19" }
 */
export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}
