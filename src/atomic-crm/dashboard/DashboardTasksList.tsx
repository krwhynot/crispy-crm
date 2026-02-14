import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { addDays } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminButton } from "@/components/admin/AdminButton";
import { TaskActionMenu } from "@/atomic-crm/tasks/TaskActionMenu";
import { Plus, ChevronDown, ChevronRight, ClipboardList, AlertTriangle } from "lucide-react";
import { ucFirst } from "@/atomic-crm/utils";
import { useMyTasks } from "./useMyTasks";
import { groupTasksByColumn, getTaskIcon, priorityColors } from "./taskUtils";
import type { TaskItem } from "./types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum tasks shown per section before "Show more" is required */
const SECTION_PREVIEW_LIMIT = 5;

type SectionKey = "overdue" | "today" | "thisWeek";

interface SectionConfig {
  key: SectionKey;
  label: string;
  accentClass: string;
  countVariant: "destructive" | "default" | "secondary";
}

const SECTIONS: SectionConfig[] = [
  {
    key: "overdue",
    label: "Overdue",
    accentClass: "text-destructive",
    countVariant: "destructive",
  },
  {
    key: "today",
    label: "Today",
    accentClass: "text-primary",
    countVariant: "default",
  },
  {
    key: "thisWeek",
    label: "This Week",
    accentClass: "text-muted-foreground",
    countVariant: "secondary",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TaskRowProps {
  task: TaskItem;
  onComplete: (taskId: number) => Promise<void>;
  onView: (taskId: number) => void;
  onDelete: (taskId: number) => Promise<void>;
  onPostpone: (taskId: number, days: number) => Promise<void>;
}

function TaskRow({ task, onComplete, onView, onDelete, onPostpone }: TaskRowProps) {
  const Icon = getTaskIcon(task.taskType);
  const priorityClass = priorityColors[task.priority];

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 min-h-[44px] hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
      data-testid={`task-row-${task.id}`}
    >
      {/* Completion checkbox */}
      <Checkbox
        className="h-5 w-5 shrink-0"
        aria-label={`Mark "${task.subject}" as complete`}
        onCheckedChange={(checked) => {
          if (checked) {
            void onComplete(task.id);
          }
        }}
      />

      {/* Task type icon with priority-tinted background */}
      <span
        className={cn(
          "inline-flex items-center justify-center rounded h-5 w-5 shrink-0",
          priorityClass
        )}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      {/* Subject */}
      <span
        className="text-sm font-medium truncate flex-1 cursor-pointer"
        title={task.subject}
        onClick={() => onView(task.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView(task.id);
          }
        }}
      >
        {task.subject}
      </span>

      {/* Due date */}
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {format(task.dueDate, "MMM d")}
      </span>

      {/* Action menu */}
      <TaskActionMenu
        task={{ ...task, subject: task.subject, dueDate: task.dueDate }}
        onView={onView}
        onPostpone={onPostpone}
        onDelete={onDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

interface CollapsibleSectionProps {
  config: SectionConfig;
  tasks: TaskItem[];
  expanded: boolean;
  showAll: boolean;
  onToggleExpanded: () => void;
  onToggleShowAll: () => void;
  onComplete: (taskId: number) => Promise<void>;
  onView: (taskId: number) => void;
  onDelete: (taskId: number) => Promise<void>;
  onPostpone: (taskId: number, days: number) => Promise<void>;
}

function CollapsibleSection({
  config,
  tasks,
  expanded,
  showAll,
  onToggleExpanded,
  onToggleShowAll,
  onComplete,
  onView,
  onDelete,
  onPostpone,
}: CollapsibleSectionProps) {
  if (tasks.length === 0) return null;

  const visibleTasks = showAll ? tasks : tasks.slice(0, SECTION_PREVIEW_LIMIT);
  const hiddenCount = tasks.length - SECTION_PREVIEW_LIMIT;

  return (
    <div data-testid={`tasks-section-${config.key}`}>
      {/* Section header toggle */}
      <button
        type="button"
        className="flex items-center gap-2 w-full px-3 py-2 min-h-[44px] hover:bg-muted/50 transition-colors"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-controls={`tasks-section-content-${config.key}`}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <span className={cn("text-sm font-semibold", config.accentClass)}>{config.label}</span>
        <Badge variant={config.countVariant} className="ml-auto">
          {tasks.length}
        </Badge>
      </button>

      {/* Section content */}
      {expanded && (
        <div
          id={`tasks-section-content-${config.key}`}
          role="region"
          aria-label={`${config.label} tasks`}
        >
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={onComplete}
              onView={onView}
              onDelete={onDelete}
              onPostpone={onPostpone}
            />
          ))}

          {/* Show more / Show less toggle */}
          {hiddenCount > 0 && (
            <button
              type="button"
              className="w-full px-3 py-2 min-h-[44px] text-xs text-primary hover:bg-muted/50 transition-colors text-center"
              onClick={onToggleShowAll}
            >
              {showAll
                ? "Show fewer"
                : `Show ${hiddenCount} more ${ucFirst(config.label.toLowerCase())} task${hiddenCount === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TasksListSkeleton() {
  return (
    <Card data-testid="dashboard-tasks-list-loading">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent className="px-0 pt-0">
        {/* Fake section headers + rows */}
        {[1, 2, 3].map((section) => (
          <div key={section}>
            <div className="flex items-center gap-2 px-3 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-6 ml-auto rounded-md" />
            </div>
            {[1, 2].map((row) => (
              <div key={row} className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function TasksEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">No tasks to show</p>
      <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Create a task to get started</p>
      <AdminButton
        variant="outline"
        size="sm"
        className="h-11"
        onClick={() => {
          window.location.href = "/#/tasks/create";
        }}
      >
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        New Task
      </AdminButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

interface TasksErrorStateProps {
  message: string;
}

function TasksErrorState({ message }: TasksErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" role="alert">
      <AlertTriangle className="h-10 w-10 text-destructive/60 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-destructive">Failed to load tasks</p>
      <p className="text-xs text-muted-foreground mt-1">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * DashboardTasksList - Right-column list-based task view for the V4 dashboard.
 *
 * Replaces the kanban board with a compact, collapsible list grouped by
 * time horizon (Overdue, Today, This Week). Uses the same useMyTasks hook
 * and shared taskUtils as the kanban.
 *
 * Scroll ownership: This component renders a Card that grows to fit content.
 * The parent (PrincipalDashboardV4) owns all scroll sizing.
 */
export function DashboardTasksList() {
  const { tasks, loading, error, completeTask, deleteTask, viewTask, updateTaskDueDate } =
    useMyTasks();

  // Group tasks into time-horizon buckets
  const tasksByColumn = useMemo(() => groupTasksByColumn(tasks), [tasks]);

  // Postpone handler: add N days to current due_date (same pattern as kanban)
  const handlePostpone = useCallback(
    async (taskId: number, days: number) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newDueDate = addDays(task.dueDate, days);
      await updateTaskDueDate(taskId, newDueDate);
    },
    [tasks, updateTaskDueDate]
  );

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    overdue: true,
    today: true,
    thisWeek: true,
  });

  const [showAll, setShowAll] = useState<Record<SectionKey, boolean>>({
    overdue: false,
    today: false,
    thisWeek: false,
  });

  const toggleSection = useCallback((section: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const toggleShowAll = useCallback((section: SectionKey) => {
    setShowAll((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Derived counts
  const overdueCount = tasksByColumn.overdue.length;
  const totalTasks =
    tasksByColumn.overdue.length + tasksByColumn.today.length + tasksByColumn.thisWeek.length;

  // Section data mapping
  const sectionData: Record<SectionKey, TaskItem[]> = {
    overdue: tasksByColumn.overdue,
    today: tasksByColumn.today,
    thisWeek: tasksByColumn.thisWeek,
  };

  // --- Loading state ---
  if (loading) {
    return <TasksListSkeleton />;
  }

  // --- Main render ---
  return (
    <Card data-tutorial="dashboard-tasks-list" data-testid="dashboard-tasks-list">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">My Tasks</CardTitle>
          {overdueCount > 0 && (
            <Badge variant="destructive" aria-label={`${overdueCount} overdue`}>
              {overdueCount}
            </Badge>
          )}
        </div>
        <AdminButton
          variant="outline"
          size="sm"
          className="h-11"
          onClick={() => {
            window.location.href = "/#/tasks/create";
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          New Task
        </AdminButton>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-0 pt-0">
        {/* Error state */}
        {error && <TasksErrorState message={error.message} />}

        {/* Empty state */}
        {!error && totalTasks === 0 && <TasksEmptyState />}

        {/* Task sections */}
        {!error && totalTasks > 0 && (
          <>
            {SECTIONS.map((sectionConfig) => (
              <CollapsibleSection
                key={sectionConfig.key}
                config={sectionConfig}
                tasks={sectionData[sectionConfig.key]}
                expanded={expandedSections[sectionConfig.key]}
                showAll={showAll[sectionConfig.key]}
                onToggleExpanded={() => toggleSection(sectionConfig.key)}
                onToggleShowAll={() => toggleShowAll(sectionConfig.key)}
                onComplete={completeTask}
                onView={viewTask}
                onDelete={deleteTask}
                onPostpone={handlePostpone}
              />
            ))}

            {/* Footer link */}
            <div className="border-t border-border px-3 py-2">
              <a
                href="/#/tasks"
                className="text-xs text-primary hover:underline inline-flex items-center min-h-[44px]"
              >
                View full board &rarr;
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardTasksList;
