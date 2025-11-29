import React, { useState, memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { useNotify } from "react-admin";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  Mail,
  Users,
  FileText,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  AlarmClock,
  Presentation,
  FileSignature,
} from "lucide-react";
import type { TaskItem } from "../types";

interface TaskKanbanCardProps {
  task: TaskItem;
  index: number;
  onComplete: (taskId: number) => Promise<void>;
  onSnooze: (taskId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onView: (taskId: number) => void;
}

/**
 * Priority color mappings using semantic Tailwind classes
 */
const priorityColors = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning/10 text-warning",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
} as const;

/**
 * Task type icon mapping
 */
const getTaskIcon = (type: TaskItem["taskType"]) => {
  switch (type) {
    case "Call":
      return <Phone className="h-3.5 w-3.5" />;
    case "Email":
      return <Mail className="h-3.5 w-3.5" />;
    case "Meeting":
      return <Users className="h-3.5 w-3.5" />;
    case "Follow-up":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
};

/**
 * Custom comparison function for React.memo optimization
 * Prevents re-renders when sibling cards change during drag-and-drop
 */
function arePropsEqual(
  prevProps: TaskKanbanCardProps,
  nextProps: TaskKanbanCardProps
): boolean {
  // Check index (position changed)
  if (prevProps.index !== nextProps.index) return false;

  // Check callback references
  if (prevProps.onComplete !== nextProps.onComplete) return false;
  if (prevProps.onSnooze !== nextProps.onSnooze) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  if (prevProps.onView !== nextProps.onView) return false;

  // Deep comparison for task data
  const prev = prevProps.task;
  const next = nextProps.task;

  return (
    prev.id === next.id &&
    prev.subject === next.subject &&
    prev.status === next.status &&
    prev.priority === next.priority &&
    prev.taskType === next.taskType &&
    prev.dueDate.getTime() === next.dueDate.getTime() &&
    prev.relatedTo.name === next.relatedTo.name
  );
}

/**
 * TaskKanbanCard - Draggable task card for the Kanban board
 *
 * Features:
 * - Draggable via @hello-pangea/dnd
 * - Click opens task details (but not action buttons)
 * - Checkbox completes task
 * - Dropdown menu for snooze/edit/delete
 * - Priority badge with semantic colors
 * - 44px minimum touch targets
 */
export const TaskKanbanCard = memo(function TaskKanbanCard({
  task,
  index,
  onComplete,
  onSnooze,
  onDelete,
  onView,
}: TaskKanbanCardProps) {
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const notify = useNotify();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open slide-over when clicking on action buttons or checkbox
    if ((e.target as HTMLElement).closest("[data-action-button]")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onView(task.id);
  };

  const handleSnooze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSnoozing(true);
    try {
      await onSnooze(task.id);
      notify("Task snoozed for tomorrow", { type: "success" });
    } catch {
      notify("Failed to snooze task", { type: "error" });
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      notify("Task deleted", { type: "success" });
    } catch {
      notify("Failed to delete task", { type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    window.location.href = `/#/tasks/${task.id}`;
  };

  const priorityClass =
    priorityColors[task.priority as keyof typeof priorityColors] ||
    priorityColors.medium;

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick(e as unknown as React.MouseEvent);
            }
          }}
          className={`
            bg-card rounded-lg border border-border
            p-3
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            cursor-pointer
            ${snapshot.isDragging ? "opacity-60 rotate-1 shadow-lg" : "opacity-100"}
          `}
          data-testid="task-kanban-card"
        >
          {/* Header: Checkbox + Subject + Actions */}
          <div className="flex items-start gap-2">
            {/* Checkbox - 44px touch target */}
            <div
              data-action-button
              className="flex h-11 w-11 shrink-0 items-center justify-center -ml-2 -mt-1"
            >
              <Checkbox
                className="h-5 w-5"
                onCheckedChange={(checked) => {
                  if (checked) {
                    onComplete(task.id);
                  }
                }}
                aria-label={`Complete task: ${task.subject}`}
              />
            </div>

            {/* Subject + Related */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {getTaskIcon(task.taskType)}
                <h3 className="font-medium text-sm text-foreground line-clamp-2">
                  {task.subject}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate">→ {task.relatedTo.name}</span>
              </div>
            </div>

            {/* Actions */}
            <div
              data-action-button
              className="flex items-center gap-0.5 shrink-0 -mr-1"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={handleSnooze}
                disabled={isSnoozing}
                title="Snooze task by 1 day"
                aria-label={`Snooze "${task.subject}" by 1 day`}
              >
                {isSnoozing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlarmClock className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    aria-label={`More actions for "${task.subject}"`}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(task.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Footer: Priority + Due Date */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <Badge className={`text-xs ${priorityClass}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(task.dueDate, "MMM d")}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}, arePropsEqual);
