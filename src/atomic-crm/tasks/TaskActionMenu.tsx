import React, { useState } from "react";
import { useNotify, useUpdate, useDelete } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, Eye, Pencil, Trash2, Calendar, CalendarDays } from "lucide-react";

/**
 * Task record shape for the action menu
 * Accepts both full Task type and minimal required fields
 */
interface TaskRecord {
  id: number | string;
  title?: string;
  subject?: string; // Kanban uses 'subject'
  due_date?: string | Date;
  dueDate?: Date; // Kanban uses 'dueDate'
}

interface TaskActionMenuProps {
  task: TaskRecord;
  onView: (taskId: number) => void;
  onEdit?: (taskId: number) => void;
  onDelete?: (taskId: number) => Promise<void>;
  onPostpone?: (taskId: number, days: number) => Promise<void>;
  /** Optional: Use internal handlers if not provided */
  useInternalHandlers?: boolean;
}

/**
 * TaskActionMenu - Reusable dropdown action menu for tasks
 *
 * Used by:
 * - TaskKanbanCard (Dashboard Kanban board)
 * - TaskList (Task list rows)
 *
 * Features:
 * - View: Opens task in slide-over (view mode)
 * - Edit: Opens task in slide-over (edit mode) or navigates to edit page
 * - Postpone to Tomorrow: Moves due date +1 day
 * - Postpone to Next Week: Moves due date +7 days
 * - Delete: Soft-deletes the task
 *
 * Touch target: 44x44px (h-11 w-11) per design system
 */
export function TaskActionMenu({
  task,
  onView,
  onEdit,
  onDelete,
  onPostpone,
  useInternalHandlers = false,
}: TaskActionMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPostponing, setIsPostponing] = useState(false);
  const notify = useNotify();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const queryClient = useQueryClient();

  const taskId = typeof task.id === "string" ? parseInt(task.id, 10) : task.id;
  const taskTitle = task.title || task.subject || "task";

  /**
   * Internal snooze handler - sets snooze_until via data provider
   */
  const handlePostponeInternal = async (days: number) => {
    setIsPostponing(true);
    try {
      const newSnoozeDate = new Date();
      newSnoozeDate.setDate(newSnoozeDate.getDate() + days);
      newSnoozeDate.setHours(23, 59, 59, 999);

      await update("tasks", {
        id: taskId,
        data: { snooze_until: newSnoozeDate.toISOString() },
        previousData: task,
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      notify(`Task snoozed until ${days === 1 ? "tomorrow" : "next week"}`, {
        type: "success",
      });
    } catch {
      notify("Failed to snooze task", { type: "error" });
    } finally {
      setIsPostponing(false);
    }
  };

  /**
   * Internal delete handler - soft-deletes via data provider
   */
  const handleDeleteInternal = async () => {
    setIsDeleting(true);
    try {
      await deleteOne("tasks", { id: taskId, previousData: task });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      notify("Task deleted", { type: "success" });
    } catch {
      notify("Failed to delete task", { type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Use internal or external handlers
  const handlePostpone = async (e: React.MouseEvent, days: number) => {
    e.stopPropagation();
    if (onPostpone && !useInternalHandlers) {
      try {
        await onPostpone(taskId, days);
        notify(`Task snoozed until ${days === 1 ? "tomorrow" : "next week"}`, {
          type: "success",
        });
      } catch {
        notify("Failed to snooze task", { type: "error" });
      }
    } else {
      await handlePostponeInternal(days);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      if (onDelete && !useInternalHandlers) {
        await onDelete(taskId);
      } else {
        await handleDeleteInternal();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(taskId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(taskId);
    } else {
      // Default: navigate to edit page
      window.location.href = `/#/tasks/${taskId}`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 p-0"
          aria-label={`More actions for "${taskTitle}"`}
          disabled={isDeleting || isPostponing}
          onClick={(e) => e.stopPropagation()}
        >
          {isDeleting || isPostponing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleView} className="min-h-11">
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} className="min-h-11">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handlePostpone(e, 1)} className="min-h-11">
          <Calendar className="mr-2 h-4 w-4" />
          Postpone to Tomorrow
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handlePostpone(e, 7)} className="min-h-11">
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
  );
}
