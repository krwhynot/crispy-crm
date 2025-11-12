/**
 * Format a date as relative time (e.g., "2h ago", "3d ago")
 *
 * @param date - Date object or ISO string
 * @returns Formatted string like "2h ago", "1d ago", or "Invalid date"
 *
 * Examples:
 * - 30 minutes ago → "0h ago"
 * - 2 hours ago → "2h ago"
 * - 1 day ago → "1d ago"
 * - Invalid date → "Invalid date"
 * - Future date → "Just now"
 */
export function formatRelativeTime(date: Date | string): string {
  // Convert string to Date if needed
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Validate date
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  // Calculate difference in milliseconds
  const now = Date.now();
  const diff = now - dateObj.getTime();

  // Handle future dates
  if (diff < 0) {
    return "Just now";
  }

  // Handle "just now" (< 1 hour but very close to now)
  if (diff < 60 * 1000) {
    // Less than 1 minute
    return "Just now";
  }

  // Convert to hours
  const hours = Math.floor(diff / (1000 * 60 * 60));

  // If less than 24 hours, show hours
  if (hours < 24) {
    return `${hours}h ago`;
  }

  // Otherwise show days
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days}d ago`;
}
