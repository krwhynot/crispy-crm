import { memo } from "react";
import { differenceInDays, isToday, isPast, format } from "date-fns";
import { AlertCircle, Clock, Calendar, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/priority-badge";

/**
 * NextTaskBadge - Displays the most urgent task inline for quick visibility
 *
 * Supports the "<2 second answer" UX goal: Account managers can instantly see
 * what needs attention for each opportunity without clicking into details.
 *
 * Features:
 * - Urgency-based icons and semantic colors (overdue, today, soon, normal)
 * - Truncated title with priority badge for high/critical tasks
 * - 44px minimum touch target for iPad accessibility
 * - Memoized for Kanban card performance
 */

interface NextTaskBadgeProps {
  taskId: number | null | undefined;
  title: string | null | undefined;
  dueDate: string | null | undefined;
  priority: "low" | "medium" | "high" | "critical" | null | undefined;
  onClick?: () => void;
  className?: string;
}

type DueStatus = "overdue" | "today" | "soon" | "normal" | "no-date";

const getDueStatus = (dueDate: string | null | undefined): DueStatus => {
  if (!dueDate) return "no-date";

  const date = new Date(dueDate);
  if (isPast(date) && !isToday(date)) return "overdue";
  if (isToday(date)) return "today";
  if (differenceInDays(date, new Date()) <= 3) return "soon";
  return "normal";
};

const getDueLabel = (dueDate: string | null | undefined, status: DueStatus): string => {
  if (!dueDate) return "";

  const date = new Date(dueDate);
  switch (status) {
    case "overdue": {
      const daysOverdue = Math.abs(differenceInDays(date, new Date()));
      return `${daysOverdue}d overdue`;
    }
    case "today":
      return "Due today";
    case "soon":
      return format(date, "EEE"); // "Mon", "Tue", etc.
    default:
      return format(date, "MMM d"); // "Dec 20"
  }
};

const DUE_STATUS_STYLES: Record<DueStatus, string> = {
  overdue: "text-destructive font-medium",
  today: "text-warning font-medium",
  soon: "text-foreground",
  normal: "text-muted-foreground",
  "no-date": "text-muted-foreground",
};

const DUE_STATUS_ICONS: Record<DueStatus, typeof AlertCircle> = {
  overdue: AlertCircle,
  today: Clock,
  soon: Calendar,
  normal: Calendar,
  "no-date": CheckSquare,
};

export const NextTaskBadge = memo(function NextTaskBadge({
  taskId,
  title,
  dueDate,
  priority,
  onClick,
  className,
}: NextTaskBadgeProps) {
  // No task state
  if (!taskId || !title) {
    return <span className={cn("text-sm text-muted-foreground italic", className)}>No tasks</span>;
  }

  const dueStatus = getDueStatus(dueDate);
  const dueLabel = getDueLabel(dueDate, dueStatus);
  const StatusIcon = DUE_STATUS_ICONS[dueStatus];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-left min-h-11 px-2 py-1 -mx-2",
        "rounded-md hover:bg-muted/50 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        className
      )}
      aria-label={`Task: ${title}${dueLabel ? `, ${dueLabel}` : ""}`}
    >
      <StatusIcon
        className={cn("h-4 w-4 shrink-0", DUE_STATUS_STYLES[dueStatus])}
        aria-hidden="true"
      />

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm truncate max-w-[180px]">{title}</span>
        {dueLabel && (
          <span className={cn("text-xs", DUE_STATUS_STYLES[dueStatus])}>{dueLabel}</span>
        )}
      </div>

      {priority && priority !== "low" && <PriorityBadge priority={priority} className="text-xs" />}
    </button>
  );
});

NextTaskBadge.displayName = "NextTaskBadge";

export default NextTaskBadge;
