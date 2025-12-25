import { useMemo, useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useNotify } from "react-admin";
import { startOfDay, addDays, setHours, setMinutes } from "date-fns";
// Card wrapper removed - parent DashboardTabPanel provides container
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TaskKanbanColumn, type TaskColumnId } from "./TaskKanbanColumn";
import { TaskKanbanCard } from "./TaskKanbanCard";
import type { TaskItem } from "../types";
import { useMyTasks } from "../hooks/useMyTasks";

/**
 * TasksKanbanPanel - Kanban board for tasks with time-horizon columns
 *
 * Provides a drag-and-drop kanban board for task management.
 *
 * Three Columns:
 * - Overdue: Tasks past due date (destructive accent)
 * - Today: Tasks due today (primary accent)
 * - This Week: Tasks due tomorrow through end of week (muted)
 *
 * Behavior:
 * - Drag-drop updates due_date based on target column
 * - Optimistic UI updates with rollback on error
 * - Click task opens TaskSlideOver (via onView)
 * - Mobile (<1024px): Stacked vertical layout
 * - Desktop (≥1024px): 3-column horizontal layout
 */

const columnLabels: Record<TaskColumnId, string> = {
  overdue: "Overdue",
  today: "Today",
  thisWeek: "This Week",
};

const announcements = {
  onDragStart: (_event: { active: { id: string | number } }) => {
    return `Picked up task. Currently in column.`;
  },
  onDragOver: ({ over }: { over: { id: string | number } | null }) => {
    if (over && columnLabels[over.id as TaskColumnId]) {
      return `Moving to ${columnLabels[over.id as TaskColumnId]}.`;
    }
    return `Not over a valid column.`;
  },
  onDragEnd: ({ over }: { over: { id: string | number } | null }) => {
    if (over && columnLabels[over.id as TaskColumnId]) {
      return `Dropped in ${columnLabels[over.id as TaskColumnId]}.`;
    }
    return `Drag cancelled.`;
  },
  onDragCancel: () => `Dragging was cancelled.`,
};

function TasksKanbanPanel() {
  const {
    tasks,
    loading,
    error,
    completeTask,
    snoozeTask,
    deleteTask,
    viewTask,
    updateTaskDueDate,
  } = useMyTasks();
  const notify = useNotify();

  /**
   * Handle postpone - Add days to task due date
   */
  const handlePostpone = useCallback(
    async (taskId: number, days: number) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newDueDate = addDays(task.dueDate, days);

      try {
        await updateTaskDueDate(taskId, newDueDate);
      } catch {
        throw new Error("Failed to postpone task");
      }
    },
    [tasks, updateTaskDueDate]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // Memoize filtered task lists by time horizon
  const tasksByColumn = useMemo(() => {
    const overdue: TaskItem[] = [];
    const today: TaskItem[] = [];
    const thisWeek: TaskItem[] = [];

    for (const task of tasks) {
      switch (task.status) {
        case "overdue":
          overdue.push(task);
          break;
        case "today":
          today.push(task);
          break;
        case "tomorrow":
        case "upcoming":
          thisWeek.push(task);
          break;
        // 'later' tasks not shown in this view
      }
    }

    return { overdue, today, thisWeek };
  }, [tasks]);

  const activeTask = activeId
    ? [...tasksByColumn.overdue, ...tasksByColumn.today, ...tasksByColumn.thisWeek]
        .find(t => String(t.id) === activeId)
    : null;

  /**
   * Calculate target due date based on destination column
   * - Overdue: Keep current date (can't make more overdue)
   * - Today: Today at 5pm
   * - This Week: 3 days from now at 5pm
   */
  const getTargetDueDate = useCallback((columnId: TaskColumnId, currentDueDate: Date): Date => {
    const now = new Date();
    const todayStart = startOfDay(now);

    switch (columnId) {
      case "overdue":
        // Keep current date - user is acknowledging it's overdue
        return currentDueDate;

      case "today":
        // Set to today at 5pm (end of business day)
        return setMinutes(setHours(todayStart, 17), 0);

      case "thisWeek":
        // Set to 3 days from now at 5pm
        return setMinutes(setHours(addDays(todayStart, 3), 17), 0);

      default:
        return currentDueDate;
    }
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(String(event.active.id));
    },
    []
  );

  /**
   * Handle drag end - update task due_date based on destination column
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);

      const { active, over } = event;

      // Dropped outside a valid droppable
      if (!over) {
        return;
      }

      const draggableId = String(active.id);

      // Find source column by searching tasksByColumn
      let sourceColumnId: TaskColumnId | null = null;
      for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
        if (columnTasks.some((t) => String(t.id) === draggableId)) {
          sourceColumnId = columnId as TaskColumnId;
          break;
        }
      }

      if (!sourceColumnId) return;

      // Determine destination column from over.id
      let destColumnId: TaskColumnId | null = null;

      // Check if over.id is a column ID
      if (columnLabels[over.id as TaskColumnId]) {
        destColumnId = over.id as TaskColumnId;
      } else {
        // over.id is a task ID - find which column it's in
        for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
          if (columnTasks.some((t) => String(t.id) === String(over.id))) {
            destColumnId = columnId as TaskColumnId;
            break;
          }
        }
      }

      if (!destColumnId) return;

      // Same column - no date change needed
      if (destColumnId === sourceColumnId) {
        return;
      }

      const taskId = parseInt(draggableId, 10);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Calculate new due date based on destination column
      const newDueDate = getTargetDueDate(destColumnId, task.dueDate);

      try {
        await updateTaskDueDate(taskId, newDueDate);
        notify(`Moved to ${columnLabels[destColumnId]}`, { type: "success" });
      } catch {
        notify("Failed to move task. Please try again.", { type: "error" });
      }
    },
    [tasksByColumn, tasks, getTargetDueDate, updateTaskDueDate, notify]
  );

  // Loading state - matches production flex layout
  if (loading) {
    return (
      <div className="flex flex-col p-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-28" />
        </div>
        <div className="flex gap-3 flex-col lg:flex-row">
          {/* Three column skeletons matching Overdue/Today/This Week */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border-t-4 border-muted bg-card w-full lg:min-w-0 lg:flex-1 shadow-sm"
            >
              {/* Column header skeleton */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-6" />
              </div>
              {/* Column content skeleton */}
              <div className="flex-1 p-3 space-y-2 min-h-[120px]">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col p-4">
        <h3 className="text-lg font-semibold">My Tasks</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">Failed to load tasks</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks =
    tasksByColumn.overdue.length + tasksByColumn.today.length + tasksByColumn.thisWeek.length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">My Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Drag tasks between columns to reschedule
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tasksByColumn.overdue.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {tasksByColumn.overdue.length} overdue
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-11 gap-1"
              onClick={() => {
                window.location.href = "/#/tasks/create";
              }}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div>
        {totalTasks === 0 ? (
          // Empty state
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-muted-foreground">No tasks to show</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create a task to get started</p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            accessibility={{ announcements }}
          >
            <div
              className="
                flex gap-3 p-4
                flex-col lg:flex-row
              "
              data-testid="task-kanban-board"
              data-tutorial="dashboard-tasks-kanban"
            >
              <TaskKanbanColumn
                columnId="overdue"
                title="Overdue"
                tasks={tasksByColumn.overdue}
                onComplete={completeTask}
                onSnooze={snoozeTask}
                onPostpone={handlePostpone}
                onDelete={deleteTask}
                onView={viewTask}
              />
              <TaskKanbanColumn
                columnId="today"
                title="Today"
                tasks={tasksByColumn.today}
                onComplete={completeTask}
                onSnooze={snoozeTask}
                onPostpone={handlePostpone}
                onDelete={deleteTask}
                onView={viewTask}
              />
              <TaskKanbanColumn
                columnId="thisWeek"
                title="This Week"
                tasks={tasksByColumn.thisWeek}
                onComplete={completeTask}
                onSnooze={snoozeTask}
                onPostpone={handlePostpone}
                onDelete={deleteTask}
                onView={viewTask}
              />
            </div>
            <DragOverlay>
              {activeTask ? (
                <TaskKanbanCard
                  task={activeTask}
                  isDragOverlay
                  onComplete={completeTask}
                  onSnooze={snoozeTask}
                  onPostpone={handlePostpone}
                  onDelete={deleteTask}
                  onView={viewTask}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// Named export for barrel, default export for lazy loading
export { TasksKanbanPanel };
export default TasksKanbanPanel;
