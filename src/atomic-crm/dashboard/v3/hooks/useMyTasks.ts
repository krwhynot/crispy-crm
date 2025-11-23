import { useState, useEffect, useCallback, useRef } from "react";
import { useDataProvider } from "react-admin";
import { isSameDay, isBefore, startOfDay, addDays, endOfDay } from "date-fns";
import { useCurrentSale } from "./useCurrentSale";
import type { TaskItem, TaskStatus } from "../types";

// Stable empty array to avoid new reference creation on each render
const EMPTY_TASKS: TaskItem[] = [];

export function useMyTasks() {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [tasks, setTasks] = useState<TaskItem[]>(EMPTY_TASKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track previous salesId to avoid unnecessary state updates
  const prevSalesIdRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      // Manage loading state properly to avoid race conditions
      if (salesLoading) {
        setLoading((prev) => prev ? prev : true); // Only update if not already loading
        return;
      }

      if (!salesId) {
        // Only clear tasks if we previously had a salesId
        if (prevSalesIdRef.current !== null) {
          setTasks(EMPTY_TASKS);
          prevSalesIdRef.current = null;
        }
        setLoading(false);
        return;
      }

      prevSalesIdRef.current = salesId;

      try {
        setLoading(true);

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

        // Map to TaskItem format with proper timezone handling
        const now = new Date();
        const today = startOfDay(now);
        const tomorrow = addDays(today, 1);
        const nextWeek = addDays(today, 7);

        const mappedTasks: TaskItem[] = tasksData.map((task: any) => {
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

          // Map task type with proper handling
          const taskTypeMap: Record<string, TaskItem["taskType"]> = {
            call: "Call",
            email: "Email",
            meeting: "Meeting",
            follow_up: "Follow-up",
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
                  : "organization",
              name:
                task.opportunity?.name ||
                task.contact?.name ||
                task.organization?.name ||
                "Unknown",
              id: task.opportunity_id || task.contact_id || task.organization_id || 0,
            },
            status,
            notes: task.description,
          };
        });

        setTasks(mappedTasks);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [dataProvider, salesId, salesLoading]);

  const completeTask = async (taskId: number) => {
    try {
      await dataProvider.update("tasks", {
        id: taskId,
        data: { completed: true, completed_at: new Date().toISOString() },
        previousData: tasks.find((t) => t.id === taskId) || {},
      });

      // Remove from local state
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to complete task:", err);
      throw err; // Re-throw so UI can handle
    }
  };

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
   */
  const snoozeTask = useCallback(
    async (taskId: number) => {
      const task = tasks.find((t) => t.id === taskId);
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
    [tasks, dataProvider, calculateStatus]
  );

  /**
   * Delete a task
   * Uses optimistic UI update for immediate feedback
   */
  const deleteTask = useCallback(
    async (taskId: number) => {
      const task = tasks.find((t) => t.id === taskId);
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
        setTasks((prev) => [...prev, task].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()));
        throw err; // Re-throw so UI can handle
      }
    },
    [tasks, dataProvider]
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

  return { tasks, loading, error, completeTask, snoozeTask, deleteTask, viewTask };
}
