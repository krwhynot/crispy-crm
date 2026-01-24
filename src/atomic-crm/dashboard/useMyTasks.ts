import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useGetList, useDataProvider } from "react-admin";
import { logger } from "@/lib/logger";
import { useQueryClient } from "@tanstack/react-query";
import { isSameDay, isBefore, startOfDay, addDays, endOfDay } from "date-fns";

import { taskKeys, opportunityKeys, activityKeys } from "@/atomic-crm/queryKeys";
import { useCurrentSale } from "./useCurrentSale";
import type { TaskItem, TaskStatus, TaskApiResponse } from "./types";
import { parseDateSafely } from "@/lib/date-utils";

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
      pagination: { page: 1, perPage: 100 },
      meta: {
        expand: ["opportunity", "contact", "organization"],
      },
    },
    {
      enabled: !salesLoading && !!salesId,
      staleTime: 5 * 60 * 1000,
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
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<number, Partial<TaskItem> & { deleted?: boolean }>
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
   * Complete a task
   * OPTIMISTIC UPDATE (Kanban Audit): Uses optimistic UI with rollback
   * Previously waited for API response before updating UI
   */
  const completeTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      // Optimistic UI update - mark as deleted immediately
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { deleted: true });
        return next;
      });

      try {
        await dataProvider.update("tasks", {
          id: taskId,
          data: { completed: true, completed_at: new Date().toISOString() },
          previousData: task,
        });

        // Clear optimistic update on success (task stays hidden as it's now completed on server)
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });

        // Invalidate tasks query to ensure fresh data on next fetch
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        // Invalidate dashboard KPIs that depend on task/activity data
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
      } catch (error: unknown) {
        logger.error("Failed to complete task", error, { feature: "useMyTasks", taskId });
        // Rollback optimistic update on failure
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });
        throw error;
      }
    },
    [dataProvider, queryClient]
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
   * Snooze a task by setting snooze_until to end of following day
   * Uses optimistic UI update for immediate feedback
   * Uses tasksRef pattern to avoid callback recreation on task changes
   *
   * NOTE: Snoozing sets snooze_until (NOT due_date) - the task's due date remains unchanged.
   * The task will be hidden from the active task list until snooze_until has passed.
   */
  const snoozeTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      // Calculate snooze date: end of the following day (timezone-aware)
      const snoozeUntil = endOfDay(addDays(new Date(), 1));

      // Optimistic UI update - hide task immediately (snoozed tasks are filtered out)
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { deleted: true });
        return next;
      });

      try {
        await dataProvider.update("tasks", {
          id: taskId,
          data: { snooze_until: snoozeUntil.toISOString() },
          previousData: task,
        });

        // Clear optimistic update on success
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });

        // Invalidate tasks query to ensure fresh data on next fetch
        // This ensures the UI stays in sync when optimistic update is cleared
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        // Invalidate dashboard KPIs that depend on task/activity data
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
      } catch (error: unknown) {
        logger.error("Failed to snooze task", error, { feature: "useMyTasks", taskId });
        // Rollback optimistic update on failure
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });
        throw error;
      }
    },
    [dataProvider, queryClient]
  );

  /**
   * Delete a task
   * Uses optimistic UI update for immediate feedback
   * Uses tasksRef pattern to avoid callback recreation on task changes
   */
  const deleteTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      // Optimistic UI update - mark as deleted immediately
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { deleted: true });
        return next;
      });

      try {
        await dataProvider.delete("tasks", {
          id: taskId,
          previousData: task,
        });

        // Clear optimistic update on success
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });

        // Invalidate tasks query to ensure fresh data on next fetch
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        // Invalidate dashboard KPIs that depend on task/activity data
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
      } catch (error: unknown) {
        console.error(
          "Failed to delete task:",
          error instanceof Error ? error.message : String(error)
        );
        // Rollback optimistic update on failure
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });
        throw error;
      }
    },
    [dataProvider, queryClient]
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
   * Update task due date (for Kanban drag-drop)
   * Uses optimistic UI update for immediate feedback
   * Uses tasksRef pattern to avoid callback recreation on task changes
   *
   * @param taskId - The task ID to update
   * @param newDueDate - The new due date
   * @returns Promise that resolves when update completes
   */
  const updateTaskDueDate = useCallback(
    async (taskId: number, newDueDate: Date) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      const newStatus = calculateStatus(newDueDate);

      // Optimistic UI update - immediately move task to new column
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { dueDate: newDueDate, status: newStatus });
        return next;
      });

      try {
        await dataProvider.update("tasks", {
          id: taskId,
          data: { due_date: newDueDate.toISOString() },
          previousData: task,
        });

        // Clear optimistic update on success
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });

        // Invalidate tasks query to ensure fresh data on next fetch
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        // Invalidate dashboard KPIs that depend on task/activity data
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
      } catch (error: unknown) {
        console.error(
          "Failed to update task due date:",
          error instanceof Error ? error.message : String(error)
        );
        // Rollback optimistic update on failure
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });
        throw error;
      }
    },
    [dataProvider, calculateStatus, queryClient]
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
