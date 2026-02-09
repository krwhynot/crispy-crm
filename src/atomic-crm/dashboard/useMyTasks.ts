import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useGetList, useDataProvider } from "react-admin";
import { logger } from "@/lib/logger";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { isSameDay, isBefore, startOfDay, addDays, endOfDay } from "date-fns";

import {
  taskKeys,
  opportunityKeys,
  activityKeys,
  dashboardKeys,
  entityTimelineKeys,
} from "@/atomic-crm/queryKeys";
import { useCurrentSale } from "./useCurrentSale";
import type { TaskItem, TaskStatus, TaskApiResponse } from "./types";
import { parseDateSafely } from "@/lib/date-utils";
import { MAX_PAGE_SIZE } from "@/atomic-crm/constants";
import { SHORT_STALE_TIME_MS } from "@/atomic-crm/constants/appConstants";

/**
 * useMyTasks - Hook for managing current user's tasks
 *
 * PERFORMANCE OPTIMIZATIONS (Kanban Audit):
 * 1. useGetList with staleTime caching - prevents unnecessary refetches
 * 2. Optimistic updates with rollback for all operations (complete, snooze, delete)
 * 3. Uses cached salesId from CurrentSaleProvider context
 */
export function useMyTasks() {
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const { salesId, loading: salesLoading } = useCurrentSale();

  // Fetch tasks from server using React Admin's useGetList
  const {
    data: rawTasks = [],
    isLoading: loading,
    error: fetchError,
    refetch: _refetch,
  } = useGetList<TaskApiResponse>(
    "tasks",
    {
      filter: {
        sales_id: salesId,
        completed: false,
        "deleted_at@is": null,
      },
      sort: { field: "due_date", order: "ASC" },
      pagination: { page: 1, perPage: MAX_PAGE_SIZE },
      meta: {
        expand: ["opportunity", "contact", "organization"],
      },
    },
    {
      enabled: !salesLoading && !!salesId,
      staleTime: SHORT_STALE_TIME_MS,
      refetchOnWindowFocus: true, // Refresh when user tabs back
    }
  );

  // Transform server data to TaskItem format
  const serverTasks = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    return rawTasks.map((task: TaskApiResponse) => {
      const dueDate = parseDateSafely(task.due_date) ?? new Date();
      const dueDateStart = startOfDay(dueDate);

      // Determine status using date-fns for proper timezone handling
      let status: TaskItem["status"];
      if (isBefore(dueDateStart, today)) {
        status = "overdue";
      } else if (isSameDay(dueDateStart, today)) {
        status = "today";
      } else if (isSameDay(dueDateStart, tomorrow)) {
        status = "tomorrow";
      } else if (isBefore(dueDateStart, nextWeek)) {
        status = "upcoming";
      } else {
        status = "later";
      }

      // Map task type with proper handling (aligned with task_type enum)
      const taskTypeMap: Record<string, TaskItem["taskType"]> = {
        call: "Call",
        email: "Email",
        meeting: "Meeting",
        "follow-up": "Follow-up",
        demo: "Demo",
        proposal: "Proposal",
        other: "Other",
      };

      return {
        id: task.id,
        subject: task.subject || "Untitled Task",
        dueDate,
        priority: (task.priority || "medium") as TaskItem["priority"],
        taskType: taskTypeMap[task.type?.toLowerCase()] || "Other",
        relatedTo: {
          type: (task.opportunity_id
            ? "opportunity"
            : task.contact_id
              ? "contact"
              : task.organization_id
                ? "organization"
                : "personal") as TaskItem["relatedTo"]["type"],
          name:
            task.opportunity?.name ||
            task.contact?.name ||
            task.organization?.name ||
            "Personal Task",
          id: task.opportunity_id || task.contact_id || task.organization_id || 0,
        },
        status,
        notes: task.notes,
        snoozeUntil: task.snooze_until
          ? (parseDateSafely(task.snooze_until) ?? undefined)
          : undefined,
      };
    });
  }, [rawTasks]);

  // Local optimistic state for immediate UI updates
  // BUG-4 FIX: Added pendingCompletion flag to keep task in DOM during completion dialog workflow
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<number, Partial<TaskItem> & { deleted?: boolean; pendingCompletion?: boolean }>
  >(new Map());

  // Merge server data with optimistic updates
  const tasks = useMemo(() => {
    return serverTasks
      .map((task) => ({
        ...task,
        ...(optimisticUpdates.get(task.id) || {}),
      }))
      .filter((task) => !optimisticUpdates.get(task.id)?.deleted);
  }, [serverTasks, optimisticUpdates]);

  // Ref to track tasks for callbacks without causing recreations
  const tasksRef = useRef<TaskItem[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Error state (from fetch error)
  const error = fetchError ? (fetchError as Error) : null;

  /**
   * Complete a task with proper optimistic updates
   * RACE CONDITION FIX: Uses React Query's optimistic update pattern
   * - Cancels outgoing refetches before mutating cache (prevents stale data races)
   * - Snapshots previous value for rollback on error
   * - Optimistically updates cache immediately
   * - Rolls back on error, refetches on settle
   */
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, task }: { taskId: number; task: TaskItem }) => {
      await dataProvider.update("tasks", {
        id: taskId,
        data: { completed: true, completed_at: new Date().toISOString() },
        previousData: task,
      });

      return taskId;
    },
    onMutate: async ({ taskId }: { taskId: number; task: TaskItem }) => {
      // CRITICAL: Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot previous optimistic updates for rollback
      const previousOptimisticState = new Map(optimisticUpdates);

      // BUG-4 FIX: Mark as pendingCompletion (not deleted) to keep task in DOM
      // This allows QuickLogActivityDialog to stay mounted during completion workflow
      // Task will be marked deleted in onSuccess after mutation completes
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { pendingCompletion: true });
        return next;
      });

      // Return context for rollback
      return { previousOptimisticState };
    },
    onError: (error: unknown, { taskId }: { taskId: number; task: TaskItem }, context) => {
      logger.error("Failed to complete task", error, { feature: "useMyTasks", taskId });

      // Rollback optimistic update to snapshot
      if (context?.previousOptimisticState) {
        setOptimisticUpdates(context.previousOptimisticState);
      }
    },
    onSuccess: (taskId: number) => {
      // BUG-4 FIX: NOW remove from list - mutation succeeded, dialog workflow complete
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { deleted: true });
        return next;
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency after mutation settles (success or error)
      // No race condition because we cancelled all previous refetches in onMutate
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
    },
  });

  const completeTask = useCallback(
    async (taskId: number) => {
      // Capture task reference BEFORE mutation starts to avoid race condition:
      // onMutate optimistically removes task from list, which updates tasksRef
      // before mutationFn runs, causing "Task not found" error
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      await completeTaskMutation.mutateAsync({ taskId, task });
    },
    [completeTaskMutation]
  );

  /**
   * Calculate task status based on due date relative to today
   */
  const calculateStatus = useCallback((dueDate: Date): TaskStatus => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    const dueDateStart = startOfDay(dueDate);

    if (isBefore(dueDateStart, today)) {
      return "overdue";
    } else if (isSameDay(dueDateStart, today)) {
      return "today";
    } else if (isSameDay(dueDateStart, tomorrow)) {
      return "tomorrow";
    } else if (isBefore(dueDateStart, nextWeek)) {
      return "upcoming";
    } else {
      return "later";
    }
  }, []);

  /**
   * Snooze a task with proper optimistic updates
   * RACE CONDITION FIX: Uses React Query's optimistic update pattern
   *
   * NOTE: Snoozing sets snooze_until (NOT due_date) - the task's due date remains unchanged.
   * The task will be hidden from the active task list until snooze_until has passed.
   */
  const snoozeTaskMutation = useMutation({
    mutationFn: async ({ taskId, task }: { taskId: number; task: TaskItem }) => {
      // Calculate snooze date: end of the following day (timezone-aware)
      const snoozeUntil = endOfDay(addDays(new Date(), 1));

      await dataProvider.update("tasks", {
        id: taskId,
        data: { snooze_until: snoozeUntil.toISOString() },
        previousData: task,
      });

      return taskId;
    },
    onMutate: async ({ taskId }: { taskId: number; task: TaskItem }) => {
      // CRITICAL: Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot previous optimistic updates for rollback
      const previousOptimisticState = new Map(optimisticUpdates);

      // Optimistically mark task as deleted (snoozed tasks are hidden)
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { deleted: true });
        return next;
      });

      // Return context for rollback
      return { previousOptimisticState };
    },
    onError: (error: unknown, { taskId }: { taskId: number; task: TaskItem }, context) => {
      logger.error("Failed to snooze task", error, { feature: "useMyTasks", taskId });

      // Rollback optimistic update to snapshot
      if (context?.previousOptimisticState) {
        setOptimisticUpdates(context.previousOptimisticState);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency after mutation settles (success or error)
      // No race condition because we cancelled all previous refetches in onMutate
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
    },
  });

  const snoozeTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      await snoozeTaskMutation.mutateAsync({ taskId, task });
    },
    [snoozeTaskMutation]
  );

  /**
   * Delete a task with proper optimistic updates
   * RACE CONDITION FIX: Uses React Query's optimistic update pattern
   */
  const deleteTaskMutation = useMutation({
    mutationFn: async ({ taskId, task }: { taskId: number; task: TaskItem }) => {
      await dataProvider.delete("tasks", {
        id: taskId,
        previousData: task,
      });

      return taskId;
    },
    onMutate: async ({ taskId }: { taskId: number; task: TaskItem }) => {
      // CRITICAL: Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot previous optimistic updates for rollback
      const previousOptimisticState = new Map(optimisticUpdates);

      // Optimistically mark task as deleted
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { deleted: true });
        return next;
      });

      // Return context for rollback
      return { previousOptimisticState };
    },
    onError: (error: unknown, { taskId }: { taskId: number; task: TaskItem }, context) => {
      logger.error("Failed to delete task", error, { feature: "useMyTasks", taskId });

      // Rollback optimistic update to snapshot
      if (context?.previousOptimisticState) {
        setOptimisticUpdates(context.previousOptimisticState);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency after mutation settles (success or error)
      // No race condition because we cancelled all previous refetches in onMutate
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
    },
  });

  const deleteTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      await deleteTaskMutation.mutateAsync({ taskId, task });
    },
    [deleteTaskMutation]
  );

  /**
   * View task - navigates to task details
   * This is a callback that panels can use to open task details
   */
  const viewTask = useCallback((taskId: number) => {
    // Navigate to task show page (or could trigger a slide-over)
    // For now, this is a placeholder that panels can override
    window.location.href = `/#/tasks/${taskId}/show`;
  }, []);

  /**
   * Update task due date with proper optimistic updates
   * RACE CONDITION FIX: Uses React Query's optimistic update pattern
   *
   * @param taskId - The task ID to update
   * @param newDueDate - The new due date
   * @returns Promise that resolves when update completes
   */
  const updateTaskDueDateMutation = useMutation({
    mutationFn: async ({
      taskId,
      newDueDate,
      task,
    }: {
      taskId: number;
      newDueDate: Date;
      task: TaskItem;
    }) => {
      await dataProvider.update("tasks", {
        id: taskId,
        data: { due_date: newDueDate.toISOString() },
        previousData: task,
      });

      return { taskId, newDueDate };
    },
    onMutate: async ({ taskId, newDueDate }) => {
      // CRITICAL: Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Calculate new status based on new due date
      const newStatus = calculateStatus(newDueDate);

      // Snapshot previous optimistic updates for rollback
      const previousOptimisticState = new Map(optimisticUpdates);

      // Optimistically update task with new due date and status
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { dueDate: newDueDate, status: newStatus });
        return next;
      });

      // Return context for rollback
      return { previousOptimisticState };
    },
    onError: (error: unknown, { taskId }, context) => {
      logger.error("Failed to update task due date", error, { feature: "useMyTasks", taskId });

      // Rollback optimistic update to snapshot
      if (context?.previousOptimisticState) {
        setOptimisticUpdates(context.previousOptimisticState);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency after mutation settles (success or error)
      // No race condition because we cancelled all previous refetches in onMutate
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
    },
  });

  const updateTaskDueDate = useCallback(
    async (taskId: number, newDueDate: Date) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      await updateTaskDueDateMutation.mutateAsync({ taskId, newDueDate, task });
    },
    [updateTaskDueDateMutation]
  );

  /**
   * Optimistic update for local state (used by Kanban for instant feedback)
   * Called before API request, allows immediate column move
   */
  const updateTaskLocally = useCallback((taskId: number, updates: Partial<TaskItem>) => {
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      const existing = next.get(taskId) || {};
      next.set(taskId, { ...existing, ...updates });
      return next;
    });
  }, []);

  /**
   * Rollback a task to previous state (for failed API calls)
   */
  const rollbackTask = useCallback((taskId: number, _previousState: TaskItem) => {
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  return {
    tasks,
    loading,
    error,
    completeTask,
    snoozeTask,
    deleteTask,
    viewTask,
    updateTaskDueDate,
    updateTaskLocally,
    rollbackTask,
    calculateStatus,
  };
}
