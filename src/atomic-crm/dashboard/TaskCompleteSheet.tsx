import { useState, useCallback } from "react";
import { useNotify } from "react-admin";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Users,
  Calendar,
  Repeat,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMyTasks } from "../hooks/useMyTasks";
import type { TaskItem } from "../types";

/**
 * Icon mapping for task types
 * Follows PRD v1.18 task_type enum
 */
const TASK_TYPE_ICONS: Record<string, typeof Phone> = {
  Call: Phone,
  Email: Mail,
  Meeting: Users,
  "Follow-up": Repeat,
  Demo: Calendar,
  Proposal: FileText,
  Other: MoreHorizontal,
};

/**
 * Priority badge variants
 * Uses semantic color tokens
 */
const PRIORITY_VARIANTS: Record<string, { className: string; label: string }> = {
  critical: { className: "bg-destructive text-destructive-foreground", label: "Critical" },
  high: { className: "bg-warning text-warning-foreground", label: "High" },
  medium: { className: "bg-primary/20 text-primary", label: "Medium" },
  low: { className: "bg-muted text-muted-foreground", label: "Low" },
};

interface TaskItemCardProps {
  task: TaskItem;
  onComplete: (taskId: number) => Promise<void>;
  isCompleting: boolean;
}

/**
 * Individual task card with complete action
 * 44px minimum touch target for accessibility
 */
function TaskItemCard({ task, onComplete, isCompleting }: TaskItemCardProps) {
  const Icon = TASK_TYPE_ICONS[task.taskType] || MoreHorizontal;
  const isOverdue = task.status === "overdue";
  const priorityConfig = PRIORITY_VARIANTS[task.priority] || PRIORITY_VARIANTS.medium;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        "transition-colors duration-150",
        isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-card",
        isCompleting && "opacity-50"
      )}
    >
      {/* Complete button - 44px touch target */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-11 w-11 shrink-0 rounded-full",
          "text-muted-foreground hover:text-success",
          "hover:bg-success/10",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={() => onComplete(task.id)}
        disabled={isCompleting}
        aria-label={`Mark "${task.subject}" as complete`}
      >
        <CheckCircle2 className="h-6 w-6" />
      </Button>

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-medium text-foreground">{task.subject}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* Due date */}
          <span className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
            <Clock className="h-3 w-3" aria-hidden="true" />
            {format(task.dueDate, "MMM d")}
          </span>

          {/* Related entity */}
          {task.relatedTo?.name && <span className="truncate">• {task.relatedTo.name}</span>}
        </div>
      </div>

      {/* Priority badge */}
      <Badge variant="secondary" className={cn("shrink-0 text-xs", priorityConfig.className)}>
        {priorityConfig.label}
      </Badge>
    </div>
  );
}

/**
 * Loading skeleton for task list
 */
function TaskListSkeleton() {
  return (
    <div className="space-y-3" data-testid="task-list-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

interface TaskCompleteSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback to refresh dashboard data after completion */
  onRefresh?: () => void;
}

/**
 * TaskCompleteSheet - Quick task completion from mobile action bar
 *
 * Features:
 * - Shows incomplete tasks grouped by urgency (Overdue → Today → This Week)
 * - One-tap completion with optimistic UI update
 * - 44px minimum touch targets (WCAG AA compliant)
 * - Semantic colors only (no hex codes)
 *
 * Layout:
 * - Bottom sheet slide-up on mobile
 * - Shows priority tasks first (overdue, then by priority)
 */
export function TaskCompleteSheet({ open, onOpenChange, onRefresh }: TaskCompleteSheetProps) {
  const { tasks, loading, error, completeTask } = useMyTasks();
  const notify = useNotify();
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Sort tasks: overdue first, then by priority within status
  const sortedTasks = [...tasks].sort((a, b) => {
    // Status priority: overdue > today > tomorrow > upcoming > later
    const statusOrder: Record<string, number> = {
      overdue: 0,
      today: 1,
      tomorrow: 2,
      upcoming: 3,
      later: 4,
    };

    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Within same status, sort by priority
    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Filter to only show actionable tasks (not "later")
  const actionableTasks = sortedTasks.filter((t) => t.status !== "later");

  const handleComplete = useCallback(
    async (taskId: number) => {
      setCompletingId(taskId);
      try {
        await completeTask(taskId);
        notify("Task completed!", { type: "success" });

        // Refresh dashboard data
        onRefresh?.();

        // Close sheet if no more tasks
        if (actionableTasks.length <= 1) {
          onOpenChange(false);
        }
      } catch {
        notify("Failed to complete task", { type: "error" });
      } finally {
        setCompletingId(null);
      }
    },
    [completeTask, notify, onRefresh, actionableTasks.length, onOpenChange]
  );

  // Group tasks by status for display
  const overdueCount = actionableTasks.filter((t) => t.status === "overdue").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[80vh] flex-col rounded-t-xl"
        aria-labelledby="complete-task-title"
        aria-describedby="complete-task-description"
      >
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between pr-14">
            <SheetTitle id="complete-task-title" className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
              Complete Task
            </SheetTitle>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} overdue
              </Badge>
            )}
          </div>
          <SheetDescription id="complete-task-description">
            Tap the checkmark to mark a task as complete
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <TaskListSkeleton />
          ) : error ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <p className="text-destructive">Failed to load tasks</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          ) : actionableTasks.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success/50" />
                <p className="mt-2 font-medium text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending tasks to complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {actionableTasks.map((task) => (
                <TaskItemCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  isCompleting={completingId === task.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with task count */}
        {!loading && actionableTasks.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-center text-sm text-muted-foreground">
              {actionableTasks.length} task{actionableTasks.length !== 1 ? "s" : ""} remaining
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
