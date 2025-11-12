import { useGetList, useGetIdentity, useRefresh } from "react-admin";
import { Link, useNavigate } from "react-router-dom";
import { endOfWeek, startOfDay, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { QuickCompleteTaskModal } from "./QuickCompleteTaskModal";
import type { Task } from "../types";
import { CheckSquare } from "lucide-react";
import { DashboardWidget } from "./DashboardWidget";

/**
 * My Tasks This Week Widget
 *
 * Rebuilt from scratch with table-style design matching principal table.
 * Displays incomplete tasks due this week, grouped by urgency.
 *
 * Design: docs/plans/2025-11-12-sidebar-widget-redesign.md (Task 2)
 *
 * Table Structure:
 * - Header: "MY TASKS THIS WEEK" with count badge
 * - Sub-headers: OVERDUE / TODAY / THIS WEEK
 * - Columns: [Checkbox] [Task Title] [Due Date Badge]
 * - Row height: h-8 (matching principal table)
 * - Hover: hover:bg-muted/30 (matching principal table)
 *
 * Interactions:
 * - Checkbox: Opens QuickCompleteTaskModal
 * - Row click: Navigate to /tasks/{id}
 * - Footer link: Navigate to /tasks
 */

interface GroupedTasks {
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
}

export const MyTasksThisWeek = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const today = new Date();
  const endOfWeekDate = endOfWeek(today);

  const { data: tasks, isPending, error } = useGetList<Task>(
    "tasks",
    {
      filter: {
        completed: false,
        due_date_lte: format(endOfWeekDate, "yyyy-MM-dd"),
        sales_id: identity?.id,
      },
      sort: { field: "due_date", order: "ASC" },
      pagination: { page: 1, perPage: 50 },
    },
    {
      enabled: !!identity?.id,
    }
  );

  // Group tasks by urgency
  const groupedTasks = groupTasksByUrgency(tasks || []);
  const totalTasks =
    groupedTasks.overdue.length + groupedTasks.today.length + groupedTasks.thisWeek.length;

  // Loading state
  if (isPending) {
    return (
      <div className="rounded-md border border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              MY TASKS THIS WEEK
            </h3>
          </div>
        </div>

        {/* Loading skeleton rows */}
        <div className="px-3 py-2 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>

        <div className="text-center py-2 text-xs text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md border border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            MY TASKS THIS WEEK
          </h3>
        </div>

        {/* Error message */}
        <div className="px-3 py-4">
          <p className="text-sm text-destructive">Failed to load tasks</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (totalTasks === 0) {
    return (
      <div className="rounded-md border border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              MY TASKS THIS WEEK
            </h3>
            <CheckSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        {/* Empty message */}
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground">No tasks this week</p>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border px-3 py-2">
          <Link to="/tasks" className="text-sm text-primary hover:underline">
            View all tasks →
          </Link>
        </div>
      </div>
    );
  }

  // Success state with tasks
  return (
    <>
      <div className="rounded-md border border-border bg-card">
        {/* Header with count badge */}
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                MY TASKS THIS WEEK
              </h3>
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {totalTasks}
              </Badge>
            </div>
            <CheckSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        {/* Table rows */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Overdue section */}
          {groupedTasks.overdue.length > 0 && (
            <TaskSection
              title="⚠️ OVERDUE"
              tasks={groupedTasks.overdue}
              variant="overdue"
              onTaskSelect={setSelectedTask}
              onRowClick={(taskId) => navigate(`/tasks/${taskId}`)}
            />
          )}

          {/* Today section */}
          {groupedTasks.today.length > 0 && (
            <TaskSection
              title="📅 DUE TODAY"
              tasks={groupedTasks.today}
              variant="today"
              onTaskSelect={setSelectedTask}
              onRowClick={(taskId) => navigate(`/tasks/${taskId}`)}
            />
          )}

          {/* This week section */}
          {groupedTasks.thisWeek.length > 0 && (
            <TaskSection
              title="📆 THIS WEEK"
              tasks={groupedTasks.thisWeek}
              variant="week"
              onTaskSelect={setSelectedTask}
              onRowClick={(taskId) => navigate(`/tasks/${taskId}`)}
            />
          )}
        </div>

        {/* Footer with border */}
        <div className="border-t-2 border-border px-3 py-2">
          <Link to="/tasks" className="text-sm text-primary hover:underline">
            View all tasks →
          </Link>
        </div>
      </div>

      {/* Quick Complete Task Modal */}
      {selectedTask && (
        <QuickCompleteTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={() => {
            setSelectedTask(null);
            // Note: removed useRefresh() - parent will re-fetch on modal close
          }}
        />
      )}
    </>
  );
};

/**
 * Group tasks by urgency (overdue, today, this week)
 */
function groupTasksByUrgency(tasks: Task[]): GroupedTasks {
  const grouped: GroupedTasks = {
    overdue: [],
    today: [],
    thisWeek: [],
  };

  const now = new Date();
  const todayStart = startOfDay(now);

  tasks.forEach((task) => {
    if (!task.due_date) {
      grouped.thisWeek.push(task);
      return;
    }

    // Parse due date as local date (not UTC)
    const dueDate = new Date(task.due_date + "T00:00:00");
    const dueDateStart = startOfDay(dueDate);

    // Check if it's today by comparing date parts
    if (dueDateStart.getTime() === todayStart.getTime()) {
      grouped.today.push(task);
    } else if (dueDateStart < todayStart) {
      // Past dates that are not today are overdue
      grouped.overdue.push(task);
    } else {
      // Future dates
      grouped.thisWeek.push(task);
    }
  });

  return grouped;
}

/**
 * Task Section Component
 * Renders a group of tasks with sub-header
 */
interface TaskSectionProps {
  title: string;
  tasks: Task[];
  variant: "overdue" | "today" | "week";
  onTaskSelect: (task: Task) => void;
  onRowClick: (taskId: number) => void;
}

function TaskSection({ title, tasks, variant, onTaskSelect, onRowClick }: TaskSectionProps) {
  return (
    <div>
      {/* Sub-header */}
      <div className="bg-muted/30 h-6 px-3 flex items-center">
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>

      {/* Task rows */}
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          variant={variant}
          onTaskSelect={onTaskSelect}
          onRowClick={onRowClick}
        />
      ))}
    </div>
  );
}

/**
 * Task Row Component
 * Individual task row with checkbox, title, and due date badge
 */
interface TaskRowProps {
  task: Task;
  variant: "overdue" | "today" | "week";
  onTaskSelect: (task: Task) => void;
  onRowClick: (taskId: number) => void;
}

function TaskRow({ task, variant, onTaskSelect, onRowClick }: TaskRowProps) {
  const handleCheckboxChange = () => {
    onTaskSelect(task);
  };

  const handleRowClick = () => {
    onRowClick(task.id as number);
  };

  return (
    <div
      className="h-8 px-3 py-1 flex items-center gap-2 hover:bg-muted/30 cursor-pointer border-b border-border/50"
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      aria-label={`View task: ${task.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      {/* Checkbox */}
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        role="presentation"
      >
        <Checkbox
          checked={false}
          onCheckedChange={handleCheckboxChange}
          aria-label={`Complete task: ${task.title}`}
          className="h-4 w-4"
        />
      </span>

      {/* Task title */}
      <span className="flex-1 text-sm truncate">{task.title}</span>

      {/* Due date badge */}
      <DueDateBadge task={task} variant={variant} />
    </div>
  );
}

/**
 * Due Date Badge Component
 * Displays due date with semantic colors
 */
interface DueDateBadgeProps {
  task: Task;
  variant: "overdue" | "today" | "week";
}

function DueDateBadge({ task, variant }: DueDateBadgeProps) {
  if (!task.due_date) {
    return <Badge variant="outline" className="text-xs text-muted-foreground">No date</Badge>;
  }

  const dueDate = new Date(task.due_date);
  const formattedDate = format(dueDate, "MMM d");

  // Semantic colors based on variant
  const variantStyles = {
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
    today: "bg-warning/10 text-warning border-warning/20",
    week: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge variant="outline" className={`text-xs ${variantStyles[variant]}`}>
      {formattedDate}
    </Badge>
  );
}
