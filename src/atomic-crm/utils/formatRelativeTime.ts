import { parseDateSafely } from "@/lib/date-utils";

/**
 * Format a date as relative time (e.g., "2h ago", "3d ago")
 * Desktop-optimized: compact format suitable for table displays
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
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
      return "now";
    }

    // Within 1 hour: show minutes
    if (diffHour === 0) {
      return `${diffMin}m ago`;
    }

    // Within 7 days: show hours or days
    if (diffDay === 0) {
      return `${diffHour}h ago`;
    }

    if (diffDay <= 7) {
      return diffDay === 1 ? "1d ago" : `${diffDay}d ago`;
    }

    // Older than 7 days: show abbreviated date (e.g., "Nov 13")
    const month = targetDate.toLocaleDateString("en-US", { month: "short" });
    const day = targetDate.getDate();
    return `${month} ${day}`;
  } catch {
    return "unknown";
  }
}
