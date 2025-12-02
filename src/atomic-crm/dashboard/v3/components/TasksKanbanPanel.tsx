import { useMemo, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useNotify } from "react-admin";
import { startOfDay, addDays, setHours, setMinutes } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TaskKanbanColumn, type TaskColumnId } from "./TaskKanbanColumn";
import type { TaskItem } from "../types";
import { useMyTasks } from "../hooks/useMyTasks";

/**
 * TasksKanbanPanel - Kanban board for tasks with time-horizon columns
 *
 * Replaces the list-based TasksPanel with a drag-and-drop kanban board.
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
export function TasksKanbanPanel() {
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

  /**
   * Handle drag end - update task due_date based on destination column
   */
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      // Dropped outside a valid droppable
      if (!destination) return;

      // Dropped in same position
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
      }

      const taskId = parseInt(draggableId, 10);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const destColumnId = destination.droppableId as TaskColumnId;
      const sourceColumnId = source.droppableId as TaskColumnId;

      // Same column, different position - no date change needed
      if (destColumnId === sourceColumnId) {
        // Could implement reordering within column if needed
        return;
      }

      // Calculate new due date based on destination column
      const newDueDate = getTargetDueDate(destColumnId, task.dueDate);

      // Column labels for notification
      const columnLabels: Record<TaskColumnId, string> = {
        overdue: "Overdue",
        today: "Today",
        thisWeek: "This Week",
      };

      try {
        await updateTaskDueDate(taskId, newDueDate);
        notify(`Moved to ${columnLabels[destColumnId]}`, { type: "success" });
      } catch {
        notify("Failed to move task. Please try again.", { type: "error" });
      }
    },
    [tasks, getTargetDueDate, updateTaskDueDate, notify]
  );

  // Loading state - matches production flex layout
  if (loading) {
    return (
      <Card className="card-container flex h-full flex-col">
        <CardHeader className="border-b border-border pb-3 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-11 w-28" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="flex h-full gap-3 p-4 flex-col lg:flex-row">
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
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="card-container flex h-full flex-col">
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">Failed to load tasks</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTasks =
    tasksByColumn.overdue.length + tasksByColumn.today.length + tasksByColumn.thisWeek.length;

  return (
    <Card className="card-container flex h-full flex-col">
      {/* Header */}
      <CardHeader className="border-b border-border pb-3 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Drag tasks between columns to reschedule
            </CardDescription>
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
      </CardHeader>

      {/* Kanban Board */}
      <CardContent className="flex-1 overflow-hidden p-0">
        {totalTasks === 0 ? (
          // Empty state
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <p className="text-muted-foreground">No tasks to show</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create a task to get started</p>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              className="
                flex h-full gap-3 p-4
                flex-col lg:flex-row
                overflow-y-auto lg:overflow-y-visible
              "
              data-testid="task-kanban-board"
            >
              <TaskKanbanColumn
                columnId="overdue"
                title="Overdue"
                tasks={tasksByColumn.overdue}
                onComplete={completeTask}
                onSnooze={snoozeTask}
                onDelete={deleteTask}
                onView={viewTask}
              />
              <TaskKanbanColumn
                columnId="today"
                title="Today"
                tasks={tasksByColumn.today}
                onComplete={completeTask}
                onSnooze={snoozeTask}
                onDelete={deleteTask}
                onView={viewTask}
              />
              <TaskKanbanColumn
                columnId="thisWeek"
                title="This Week"
                tasks={tasksByColumn.thisWeek}
                onComplete={completeTask}
                onSnooze={snoozeTask}
                onDelete={deleteTask}
                onView={viewTask}
              />
            </div>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}
