import { useCallback, useState } from "react";
import { useUpdate, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { taskKeys } from "@/atomic-crm/queryKeys";
import type { Task } from "@/atomic-crm/types";

interface UseTaskCompletionOptions {
  /**
   * Callback fired after successful task completion.
   * Use this to close dialogs, refresh lists, etc.
   */
  onSuccess?: () => void;
  /**
   * Callback fired when task completion fails.
   */
  onError?: (error: Error) => void;
}

interface UseTaskCompletionReturn {
  /**
   * Complete a task by setting completed=true and completed_at timestamp.
   * Handles optimistic cache invalidation.
   */
  completeTask: (task: Task) => Promise<void>;
  /**
   * Reopen a completed task by clearing completed flag and timestamp.
   */
  reopenTask: (task: Task) => void;
  /**
   * Whether a completion operation is in progress.
   */
  isCompleting: boolean;
}

/**
 * useTaskCompletion - Hook for task completion/reopening workflow
 *
 * Extracted from TaskList.tsx to separate business logic from UI.
 * Follows the useSalesUpdate pattern for mutation hooks.
 *
 * ARCHITECTURE NOTE:
 * - Uses React Admin's useUpdate for mutations (not raw dataProvider)
 * - Invalidates taskKeys.all after mutations for cache consistency
 * - Returns both completeTask (async) and reopenTask (sync with notify)
 *
 * @example
 * ```tsx
 * const { completeTask, reopenTask, isCompleting } = useTaskCompletion({
 *   onSuccess: () => setDialogOpen(false),
 * });
 *
 * // Complete task (shows dialog workflow)
 * await completeTask(pendingTask);
 *
 * // Reopen task (inline checkbox uncheck)
 * reopenTask(task);
 * ```
 */
export function useTaskCompletion(options: UseTaskCompletionOptions = {}): UseTaskCompletionReturn {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);

  /**
   * Complete a task - marks it as done with timestamp
   * Uses try/catch for error handling with proper user feedback
   */
  const completeTask = useCallback(
    async (task: Task) => {
      setIsCompleting(true);

      try {
        await update("tasks", {
          id: task.id,
          data: {
            completed: true,
            completed_at: new Date().toISOString(),
          },
          previousData: task,
        });

        // Invalidate task queries to refresh any lists/views
        queryClient.invalidateQueries({ queryKey: taskKeys.all });

        notify("Task completed", { type: "success" });
        options.onSuccess?.();
      } catch (error: unknown) {
        const err =
          error instanceof Error ? error : new Error(`Failed to complete task ${task.id}`);
        notify("Error completing task", { type: "error" });
        options.onError?.(err);
        throw err;
      } finally {
        setIsCompleting(false);
      }
    },
    [update, notify, queryClient, options]
  );

  /**
   * Reopen a completed task - clears completion status
   * Synchronous (fire-and-forget) for checkbox interaction
   */
  const reopenTask = useCallback(
    (task: Task) => {
      update("tasks", {
        id: task.id,
        data: {
          completed: false,
          completed_at: null,
        },
        previousData: task,
      });

      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notify("Task reopened", { type: "success" });
    },
    [update, notify, queryClient]
  );

  return {
    completeTask,
    reopenTask,
    isCompleting,
  };
}
