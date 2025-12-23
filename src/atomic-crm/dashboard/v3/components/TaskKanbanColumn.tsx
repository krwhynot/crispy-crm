import React, { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskKanbanCard } from "./TaskKanbanCard";
import type { TaskItem } from "../types";
import { cn } from "@/lib/utils";

/**
 * Time horizon column types for task kanban
 */
export type TaskColumnId = "overdue" | "today" | "thisWeek";

interface TaskKanbanColumnProps {
  columnId: TaskColumnId;
  title: string;
  tasks: TaskItem[];
  onComplete: (taskId: number) => Promise<void>;
  onSnooze: (taskId: number) => Promise<void>;
  onPostpone: (taskId: number, days: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onView: (taskId: number) => void;
}

/**
 * Column styling configuration based on time horizon
 */
const columnConfig: Record<
  TaskColumnId,
  {
    accentColor: string;
    bgColor: string;
    emptyText: string;
    emptySubtext: string;
  }
> = {
  overdue: {
    accentColor: "border-destructive",
    bgColor: "bg-destructive/5",
    emptyText: "No overdue tasks",
    emptySubtext: "Great job staying on top of things!",
  },
  today: {
    accentColor: "border-primary",
    bgColor: "bg-primary/5",
    emptyText: "No tasks due today",
    emptySubtext: "Drag tasks here to focus on them today",
  },
  thisWeek: {
    accentColor: "border-muted-foreground",
    bgColor: "bg-muted/30",
    emptyText: "No upcoming tasks",
    emptySubtext: "Plan your week by adding tasks here",
  },
};

/**
 * Custom comparison function for React.memo optimization
 */
function arePropsEqual(
  prevProps: TaskKanbanColumnProps,
  nextProps: TaskKanbanColumnProps
): boolean {
  if (prevProps.columnId !== nextProps.columnId) return false;
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.onComplete !== nextProps.onComplete) return false;
  if (prevProps.onSnooze !== nextProps.onSnooze) return false;
  if (prevProps.onPostpone !== nextProps.onPostpone) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  if (prevProps.onView !== nextProps.onView) return false;

  // Compare tasks array
  const prevTasks = prevProps.tasks;
  const nextTasks = nextProps.tasks;

  if (prevTasks.length !== nextTasks.length) return false;

  for (let i = 0; i < prevTasks.length; i++) {
    if (prevTasks[i].id !== nextTasks[i].id || prevTasks[i].status !== nextTasks[i].status) {
      return false;
    }
  }

  return true;
}

/**
 * TaskKanbanColumn - A droppable column for the task kanban board
 *
 * Features:
 * - Droppable zone for drag-and-drop
 * - Time-horizon based styling (overdue/today/thisWeek)
 * - Empty state with encouraging placeholder
 * - Accent border color indicates urgency
 * - Memoized to prevent unnecessary re-renders
 */
export const TaskKanbanColumn = React.memo(function TaskKanbanColumn({
  columnId,
  title,
  tasks,
  onComplete,
  onSnooze,
  onPostpone,
  onDelete,
  onView,
}: TaskKanbanColumnProps) {
  const config = columnConfig[columnId];

  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const taskIds = useMemo(() => tasks.map(t => String(t.id)), [tasks]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border-t-4 bg-card",
        "w-full lg:min-w-0 lg:flex-1",
        "shadow-sm",
        config.accentColor
      )}
      data-testid={`task-kanban-column-${columnId}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground">{title}</h2>
        <span className="text-sm text-muted-foreground">{tasks.length}</span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-2 overflow-y-auto",
          "min-h-[120px] transition-colors duration-200",
          isOver && config.bgColor
        )}
      >
        {tasks.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center p-4">
            <p className="text-sm font-medium text-muted-foreground">{config.emptyText}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{config.emptySubtext}</p>
          </div>
        ) : (
          // Task Cards
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskKanbanCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onSnooze={onSnooze}
                onPostpone={onPostpone}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}, arePropsEqual);
