/**
 * Follow-up Toast Utility
 *
 * Shows a success toast when a task is completed with an action button
 * to quickly create a follow-up task. Auto-dismisses after 5 seconds.
 *
 * Uses Sonner's toast API directly for custom action support.
 */
import { toast } from "sonner";
import type { TaskItem } from "../types";

interface FollowUpToastOptions {
  /** The completed task */
  task: TaskItem;
  /** Callback when user clicks "Create Follow-up" */
  onCreateFollowUp: (task: TaskItem) => void;
}

/**
 * Shows a toast notification after task completion with a follow-up action.
 *
 * @example
 * ```tsx
 * showFollowUpToast({
 *   task: completedTask,
 *   onCreateFollowUp: (task) => {
 *     // Open follow-up creation dialog or navigate to create page
 *     navigate(`/tasks/create?followUp=${task.id}`);
 *   },
 * });
 * ```
 */
export function showFollowUpToast({ task, onCreateFollowUp }: FollowUpToastOptions): void {
  toast.success(`Task completed: ${task.subject}`, {
    description: "Would you like to schedule a follow-up?",
    duration: 5000, // 5 second auto-dismiss
    action: {
      label: "Create Follow-up",
      onClick: () => onCreateFollowUp(task),
    },
  });
}
