import type { TaskItem } from "./types";
import type { LucideIcon } from "lucide-react";
import {
  Phone,
  Mail,
  Users,
  FileText,
  CheckCircle2,
  Presentation,
  FileSignature,
} from "lucide-react";

export interface GroupedTasks {
  overdue: TaskItem[];
  today: TaskItem[];
  thisWeek: TaskItem[];
}

/**
 * Group tasks by time-horizon columns (overdue, today, thisWeek).
 * Tasks with status "later" are excluded from all groups.
 */
export function groupTasksByColumn(tasks: TaskItem[]): GroupedTasks {
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
}

/**
 * Priority color mappings using semantic Tailwind classes
 */
export const priorityColors = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning/10 text-warning",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
} as const;

/**
 * Get the icon component for a task type.
 * Returns the LucideIcon component (not JSX) so callers can render with custom sizes.
 */
export function getTaskIcon(type: TaskItem["taskType"]): LucideIcon {
  switch (type) {
    case "Call":
      return Phone;
    case "Email":
      return Mail;
    case "Meeting":
      return Users;
    case "Follow-up":
      return CheckCircle2;
    case "Demo":
      return Presentation;
    case "Proposal":
      return FileSignature;
    case "Other":
    default:
      return FileText;
  }
}
