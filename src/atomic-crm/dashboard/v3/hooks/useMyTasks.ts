import { useState, useEffect, useCallback, useRef } from "react";
import { useDataProvider } from "react-admin";
import { isSameDay, isBefore, startOfDay, addDays, endOfDay } from "date-fns";
import { useCurrentSale } from "./useCurrentSale";
import type { TaskItem, TaskStatus, TaskApiResponse } from "../types";

// Stable empty array to avoid new reference creation on each render
const EMPTY_TASKS: TaskItem[] = [];

/**
 * useMyTasks - Hook for managing current user's tasks
 *
 * PERFORMANCE OPTIMIZATIONS (Kanban Audit):
 * 1. AbortController for cleanup - prevents state updates on unmounted components
 * 2. Optimistic updates with rollback for all operations (complete, snooze, delete)
 * 3. Uses cached salesId from CurrentSaleProvider context
 */
export function useMyTasks() {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [tasks, setTasks] = useState<TaskItem[]>(EMPTY_TASKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track previous salesId to avoid unnecessary state updates
  const prevSalesIdRef = useRef<number | null>(null);

  // Ref to track tasks for callbacks without causing recreations
  const tasksRef = useRef<TaskItem[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    // AbortController for cleanup - prevents state updates on unmounted component
    const abortController = new AbortController();
    let isMounted = true;

    const fetchTasks = async () => {
      // Manage loading state properly to avoid race conditions
      if (salesLoading) {
        if (isMounted) setLoading((prev) => (prev ? prev : true));
        return;
      }

      if (!salesId) {
        // Only clear tasks if we previously had a salesId
        if (prevSalesIdRef.current !== null && isMounted) {
          setTasks(EMPTY_TASKS);
          prevSalesIdRef.current = null;
        }
        if (isMounted) setLoading(false);
        return;
      }

      prevSalesIdRef.current = salesId;

      try {
        if (isMounted) setLoading(true);

        // Check if aborted before making request
        if (abortController.signal.aborted) return;

        // Fetch tasks with related entities expanded
        const { data: tasksData } = await dataProvider.getList("tasks", {
          filter: {
            sales_id: salesId,
            completed: false,
          },
          sort: { field: "due_date", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          // Request expansion of related entities
          meta: {
            expand: ["opportunity", "contact", "organization"],
          },
        });

        // Check if aborted before updating state
        if (abortController.signal.aborted || !isMounted) return;

        // Map to TaskItem format with proper timezone handling
        const now = new Date();
        const today = startOfDay(now);
        const tomorrow = addDays(today, 1);
        const nextWeek = addDays(today, 7);

        const mappedTasks: TaskItem[] = tasksData.map((task: TaskApiResponse) => {
          const dueDate = new Date(task.due_date);
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
            subject: task.title || "Untitled Task",
            dueDate,
            priority: (task.priority || "medium") as TaskItem["priority"],
            taskType: taskTypeMap[task.type?.toLowerCase()] || "Other",
            relatedTo: {
              type: task.opportunity_id
                ? "opportunity"
                : task.contact_id
                  ? "contact"
                  : task.organization_id
                    ? "organization"
                    : "personal",
              name:
                task.opportunity?.name ||
                task.contact?.name ||
                task.organization?.name ||
                "Personal Task",
              id: task.opportunity_id || task.contact_id || task.organization_id || 0,
            },
            status,
            notes: task.description,
          };
        });

        if (isMounted) setTasks(mappedTasks);
      } catch (err) {
        // Don't log or set error if aborted
        if (abortController.signal.aborted) return;
        console.error("Failed to fetch tasks:", err);
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();

    // Cleanup function - abort and mark unmounted
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [dataProvider, salesId, salesLoading]);

  /**
   * Complete a task
   * OPTIMISTIC UPDATE (Kanban Audit): Now uses optimistic UI with rollback
   * Previously waited for API response before updating UI
   */
  const completeTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      // Optimistic UI update - immediately remove task
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        await dataProvider.update("tasks", {
          id: taskId,
          data: { completed: true, completed_at: new Date().toISOString() },
          previousData: task,
        });
      } catch (err) {
        console.error("Failed to complete task:", err);
        // Rollback optimistic update on failure - add task back in sorted position
        setTasks((prev) =>
          [...prev, task].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        );
        throw err; // Re-throw so UI can handle
      }
    },
    [dataProvider]
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
   * Snooze a task by 1 day (to end of following day)
   * Uses optimistic UI update for immediate feedback
   * Uses tasksRef pattern to avoid callback recreation on task changes
   */
  const snoozeTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      // Calculate new due date: end of the following day (timezone-aware)
      const newDueDate = endOfDay(addDays(task.dueDate, 1));
      const newStatus = calculateStatus(newDueDate);

      // Optimistic UI update - immediately move task to new bucket
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDueDate, status: newStatus } : t))
      );

      try {
        await dataProvider.update("tasks", {
          id: taskId,
          data: { due_date: newDueDate.toISOString() },
          previousData: task,
        });
      } catch (err) {
        console.error("Failed to snooze task:", err);
        // Rollback optimistic update on failure
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, dueDate: task.dueDate, status: task.status } : t
          )
        );
        throw err; // Re-throw so UI can handle
      }
    },
    [dataProvider, calculateStatus]
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

      // Optimistic UI update - immediately remove task
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        await dataProvider.delete("tasks", {
          id: taskId,
          previousData: task,
        });
      } catch (err) {
        console.error("Failed to delete task:", err);
        // Rollback optimistic update on failure
        setTasks((prev) =>
          [...prev, task].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        );
        throw err; // Re-throw so UI can handle
      }
    },
    [dataProvider]
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
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDueDate, status: newStatus } : t))
      );

      try {
        await dataProvider.update("tasks", {
          id: taskId,
          data: { due_date: newDueDate.toISOString() },
          previousData: task,
        });
      } catch (err) {
        console.error("Failed to update task due date:", err);
        // Rollback optimistic update on failure
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, dueDate: task.dueDate, status: task.status } : t
          )
        );
        throw err; // Re-throw so UI can handle
      }
    },
    [dataProvider, calculateStatus]
  );

  /**
   * Optimistic update for local state (used by Kanban for instant feedback)
   * Called before API request, allows immediate column move
   */
  const updateTaskLocally = useCallback((taskId: number, updates: Partial<TaskItem>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  }, []);

  /**
   * Rollback a task to previous state (for failed API calls)
   */
  const rollbackTask = useCallback((taskId: number, previousState: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? previousState : t)));
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
