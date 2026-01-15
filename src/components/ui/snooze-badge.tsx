/**
 * SnoozeBadge Component
 *
 * Displays a "snoozed" indicator for tasks that have been deferred.
 * Uses semantic warning colors from Tailwind v4 theme for consistency.
 *
 * Extracted from:
 * - TaskList.tsx (table cell)
 * - TaskSlideOverDetailsTab.tsx (detail view)
 * - TaskKanbanCard.tsx (kanban card)
 *
 * Engineering Constitution: Single Source of Truth for UI patterns
 */

import { Badge } from "@/components/ui/badge";
import { AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isAfter } from "date-fns";

interface SnoozeBadgeProps {
  /** ISO date string or Date for when the snooze expires */
  snoozeUntil?: Date | string | null;
  /** Show the snooze date (e.g., "until Jan 15, 3:00 PM") */
  showDate?: boolean;
  /** Custom date format string (default: "MMM d, h:mm a") */
  dateFormat?: string;
  /** Additional className for styling overrides */
  className?: string;
}

/**
 * SnoozeBadge - Semantic warning badge for snoozed tasks
 *
 * Uses Tailwind v4 semantic color tokens:
 * - text-warning: Warning foreground color
 * - border-warning/20: Warning border with 20% opacity
 * - bg-warning/10: Warning background with 10% opacity
 *
 * WCAG AA: Warning colors designed for sufficient contrast
 *
 * @example
 * // Simple badge (just shows "Snoozed")
 * <SnoozeBadge snoozeUntil={task.snooze_until} />
 *
 * @example
 * // With date display
 * <SnoozeBadge snoozeUntil={task.snooze_until} showDate />
 */
export function SnoozeBadge({
  snoozeUntil,
  showDate = false,
  dateFormat = "MMM d, h:mm a",
  className,
}: SnoozeBadgeProps) {
  // Return null if no snooze date or snooze has expired
  if (!snoozeUntil) return null;

  const snoozeDate = typeof snoozeUntil === "string" ? new Date(snoozeUntil) : snoozeUntil;

  // Check if snooze is still active (in the future)
  if (!isAfter(snoozeDate, new Date())) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs text-warning border-warning/20 bg-warning/10 dark:bg-warning/5 shrink-0",
        className
      )}
    >
      <AlarmClock className="h-3 w-3 mr-1" />
      {showDate ? `Snoozed until ${format(snoozeDate, dateFormat)}` : "Snoozed"}
    </Badge>
  );
}

/**
 * Inline snooze indicator for detail views
 *
 * Displays as inline text with icon (not a badge)
 * Used in TaskSlideOverDetailsTab where a badge doesn't fit the layout
 *
 * @example
 * <SnoozeIndicator snoozeUntil={record.snooze_until} />
 */
export function SnoozeIndicator({
  snoozeUntil,
  dateFormat = "MMM d, h:mm a",
  className,
}: Omit<SnoozeBadgeProps, "showDate">) {
  if (!snoozeUntil) return null;

  const snoozeDate = typeof snoozeUntil === "string" ? new Date(snoozeUntil) : snoozeUntil;

  if (!isAfter(snoozeDate, new Date())) return null;

  return (
    <div className={cn("flex items-center gap-2 text-warning pt-1", className)}>
      <AlarmClock className="h-4 w-4" />
      <span className="text-sm font-medium">Snoozed until {format(snoozeDate, dateFormat)}</span>
    </div>
  );
}
