/**
 * resolvePreset — Convert date preset strings to concrete Date ranges.
 *
 * The Overview filter stores a `datePreset` string (e.g., "last30") but
 * `useReportData` expects `{ start: Date; end: Date }`. This utility
 * bridges the two, covering every value in DATE_PRESETS (constants.ts).
 */

import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";

export interface ResolvedDateRange {
  start: Date;
  end: Date;
}

/**
 * Resolve a preset name to a concrete date range.
 *
 * @returns `null` when the preset is unknown — callers should treat this
 *          as "no date filtering" (fetch all data).
 */
export function resolvePreset(preset: string): ResolvedDateRange | null {
  const now = new Date();

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: now };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case "last7":
      return { start: subDays(now, 7), end: now };
    case "last30":
      return { start: subDays(now, 30), end: now };
    case "last90":
      return { start: subDays(now, 90), end: now };
    case "thisMonth":
      return { start: startOfMonth(now), end: now };
    case "lastMonth": {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case "thisQuarter":
      return { start: startOfQuarter(now), end: now };
    case "thisYear":
      return { start: startOfYear(now), end: now };
    default:
      return null;
  }
}
