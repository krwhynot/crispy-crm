import React, { useState, memo } from "react";
import { useNotify } from "react-admin";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
  Calendar,
  CalendarDays,
} from "lucide-react";
import type { TaskItem } from "../types";
import { showFollowUpToast } from "../utils/showFollowUpToast";

interface TaskKanbanCardProps {
  task: TaskItem;
  isDragOverlay?: boolean;
  onComplete: (taskId: number) => Promise<void>;
  onSnooze: (taskId: number) => Promise<void>;
  onPostpone: (taskId: number, days: number) => Promise<void>;
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
    case "Demo":
      return <Presentation className="h-3.5 w-3.5" />;
    case "Proposal":
      return <FileSignature className="h-3.5 w-3.5" />;
    case "Other":
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
};

/**
 * Custom comparison function for React.memo optimization
 * Prevents re-renders when sibling cards change during drag-and-drop
 */
function arePropsEqual(prevProps: TaskKanbanCardProps, nextProps: TaskKanbanCardProps): boolean {
  // Check isDragOverlay
  if (prevProps.isDragOverlay !== nextProps.isDragOverlay) return false;

  // Check callback references
  if (prevProps.onComplete !== nextProps.onComplete) return false;
  if (prevProps.onSnooze !== nextProps.onSnooze) return false;
  if (prevProps.onPostpone !== nextProps.onPostpone) return false;
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
 * - Draggable via @dnd-kit/sortable
 * - Click opens task details (but not action buttons)
 * - Checkbox completes task
 * - Dropdown menu for snooze/edit/delete
 * - Priority badge with semantic colors
 * - 44px minimum touch targets
 */
export const TaskKanbanCard = memo(function TaskKanbanCard({
  task,
  isDragOverlay = false,
  onComplete,
  onSnooze,
  onPostpone,
  onDelete,
  onView,
}: TaskKanbanCardProps) {
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const notify = useNotify();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(task.id),
    disabled: isDragOverlay,
  });

  const style: React.CSSProperties = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
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

  const handlePostponeTomorrow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onPostpone(task.id, 1);
      notify("Task postponed to tomorrow", { type: "success" });
    } catch {
      notify("Failed to postpone task", { type: "error" });
    }
  };

  const handlePostponeNextWeek = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onPostpone(task.id, 7);
      notify("Task postponed to next week", { type: "success" });
    } catch {
      notify("Failed to postpone task", { type: "error" });
    }
  };

  const priorityClass =
    priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium;

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
      className={`
        bg-card rounded-lg border border-border
        p-3
        transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        cursor-pointer
        ${isDragging && !isDragOverlay ? "opacity-50" : "opacity-100"}
        ${isDragOverlay ? "shadow-xl" : ""}
      `}
      data-testid="task-kanban-card"
    >
      {/* Header: Drag Handle + Checkbox + Subject + Actions */}
      <div className="flex items-start gap-2">
        {/* Drag Handle - 44px touch target */}
        <div
          {...attributes}
          {...listeners}
          data-action-button
          className="flex h-11 w-11 shrink-0 items-center justify-center -ml-2 -mt-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Checkbox - 44px touch target */}
        <div
          data-action-button
          className="flex h-11 w-11 shrink-0 items-center justify-center -mt-1"
        >
          <Checkbox
            className="h-5 w-5"
            onCheckedChange={async (checked) => {
              if (checked) {
                try {
                  await onComplete(task.id);
                  // Show follow-up toast after successful completion
                  showFollowUpToast({
                    task,
                    onCreateFollowUp: (completedTask) => {
                      // Navigate to task create page with pre-filled follow-up context
                      const params = new URLSearchParams();
                      params.set("type", "Follow-up");
                      params.set("title", `Follow-up: ${completedTask.subject}`);
                      if (completedTask.relatedTo.type === "opportunity") {
                        params.set("opportunity_id", String(completedTask.relatedTo.id));
                      } else if (completedTask.relatedTo.type === "contact") {
                        params.set("contact_id", String(completedTask.relatedTo.id));
                      }
                      window.location.href = `/#/tasks/create?${params.toString()}`;
                    },
                  });
                } catch {
                  notify("Failed to complete task", { type: "error" });
                }
              }
            }}
            aria-label={`Complete task: ${task.subject}`}
          />
        </div>

        {/* Subject + Related */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {getTaskIcon(task.taskType)}
            <h3 className="font-medium text-sm text-foreground line-clamp-2">{task.subject}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">→ {task.relatedTo.name}</span>
          </div>
        </div>

        {/* Actions */}
        <div data-action-button className="flex items-center gap-0.5 shrink-0 -mr-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 w-11 p-0"
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
                className="h-11 w-11 p-0"
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
              <DropdownMenuItem onClick={() => onView(task.id)} className="min-h-11">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit} className="min-h-11">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePostponeTomorrow} className="min-h-11">
                <Calendar className="mr-2 h-4 w-4" />
                Postpone to Tomorrow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePostponeNextWeek} className="min-h-11">
                <CalendarDays className="mr-2 h-4 w-4" />
                Postpone to Next Week
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive min-h-11">
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
        <span className="text-xs text-muted-foreground">{format(task.dueDate, "MMM d")}</span>
      </div>
    </div>
  );
}, arePropsEqual);
