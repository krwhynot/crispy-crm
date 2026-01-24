import { parseDateSafely } from "@/lib/date-utils";
import { logger } from "@/lib/logger";

/**
 * Get the user's locale, falling back to 'en' if not available
 */
function getUserLocale(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en";
}

/**
 * Format a date as relative time (e.g., "2h ago", "3d ago")
 * Desktop-optimized: compact format suitable for table displays
 * Uses the user's browser locale for proper i18n support.
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  const locale = getUserLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });
  if (!date) return "unknown";

  let targetDate: Date | null;
  if (typeof date === "string") {
    targetDate = parseDateSafely(date);
    if (!targetDate) return "unknown";
  } else {
    targetDate = date;
  }

  if (isNaN(targetDate.getTime())) {
    return "unknown";
  }

  try {
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Within 1 minute (inclusive)
    if (diffSec <= 60) {
      return rtf.format(0, "second");
    }

    // Within 1 hour: show minutes
    if (diffHour === 0) {
      return rtf.format(-diffMin, "minute");
    }

    // Within 7 days: show hours or days
    if (diffDay === 0) {
      return rtf.format(-diffHour, "hour");
    }

    if (diffDay <= 7) {
      return rtf.format(-diffDay, "day");
    }

    // Older than 7 days: show abbreviated date using user's locale
    return targetDate.toLocaleDateString(locale, { month: "short", day: "numeric" });
  } catch (error) {
    // Date formatting errors - return fallback but log for debugging
    logger.warn("Date formatting failed", {
      feature: "formatRelativeTime",
      date: String(date),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return "unknown";
  }
}
