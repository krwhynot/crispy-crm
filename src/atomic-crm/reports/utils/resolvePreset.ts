/**
 * resolvePreset — Convert date preset strings to concrete Date ranges.
 *
 * The global report filter stores a `periodPreset` string (e.g., "last30")
 * but report data hooks expect `{ start: Date; end: Date }`. This utility
 * bridges the two, covering every value in REPORT_DATE_PRESETS (constants.ts).
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
 * @param preset - The preset identifier (e.g., "last30", "allTime", "custom")
 * @param customStart - ISO date string for custom range start (only used when preset is "custom")
 * @param customEnd - ISO date string for custom range end (only used when preset is "custom")
 * @returns `null` when the preset is "allTime", unknown, or a half-filled custom range —
 *          callers should treat this as "no date filtering" (fetch all data).
 */
export function resolvePreset(
  preset: string,
  customStart?: string | null,
  customEnd?: string | null
): ResolvedDateRange | null {
  const now = new Date();

  switch (preset) {
    case "allTime":
      return null;
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
    case "custom": {
      if (customStart != null && customEnd != null) {
        return {
          start: startOfDay(new Date(customStart)),
          end: endOfDay(new Date(customEnd)),
        };
      }
      return null;
    }
    default:
      return null;
  }
}
