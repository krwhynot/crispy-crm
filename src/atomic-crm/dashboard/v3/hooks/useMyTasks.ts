import { useState, useEffect } from 'react';
import { useDataProvider } from 'react-admin';
import { isSameDay, isBefore, startOfDay, addDays } from 'date-fns';
import { useCurrentSale } from './useCurrentSale';
import type { TaskItem } from '../types';

export function useMyTasks() {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      // Manage loading state properly to avoid race conditions
      if (salesLoading) {
        setLoading(true); // Show loading while waiting for salesId
        return;
      }

      if (!salesId) {
        setTasks([]); // Clear tasks if no salesId
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch tasks with related entities expanded
        const { data: tasksData } = await dataProvider.getList('tasks', {
          filter: {
            sales_id: salesId,
            completed: false,
          },
          sort: { field: 'due_date', order: 'ASC' },
          pagination: { page: 1, perPage: 100 },
          // Request expansion of related entities
          meta: {
            expand: ['opportunity', 'contact', 'organization']
          }
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
          let status: TaskItem['status'];
          if (isBefore(dueDateStart, today)) {
            status = 'overdue';
          } else if (isSameDay(dueDateStart, today)) {
            status = 'today';
          } else if (isSameDay(dueDateStart, tomorrow)) {
            status = 'tomorrow';
          } else if (isBefore(dueDateStart, nextWeek)) {
            status = 'upcoming';
          } else {
            status = 'later';
          }

          // Map task type with proper handling
          const taskTypeMap: Record<string, TaskItem['taskType']> = {
            'call': 'Call',
            'email': 'Email',
            'meeting': 'Meeting',
            'follow_up': 'Follow-up',
          };

          return {
            id: task.id,
            subject: task.title || 'Untitled Task',
            dueDate,
            priority: (task.priority || 'medium') as TaskItem['priority'],
            taskType: taskTypeMap[task.type?.toLowerCase()] || 'Other',
            relatedTo: {
              type: task.opportunity_id ? 'opportunity' : task.contact_id ? 'contact' : 'organization',
              name: task.opportunity?.name || task.contact?.name || task.organization?.name || 'Unknown',
              id: task.opportunity_id || task.contact_id || task.organization_id || 0,
            },
            status,
            notes: task.description,
          };
        });

        setTasks(mappedTasks);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [dataProvider, salesId, salesLoading]);

  const completeTask = async (taskId: number) => {
    try {
      await dataProvider.update('tasks', {
        id: taskId,
        data: { completed: true, completed_at: new Date().toISOString() },
        previousData: tasks.find(t => t.id === taskId) || {}
      });

      // Remove from local state
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to complete task:', err);
      throw err; // Re-throw so UI can handle
    }
  };

  const snoozeTask = async (taskId: number, newDate: Date) => {
    try {
      await dataProvider.update('tasks', {
        id: taskId,
        data: { due_date: newDate.toISOString() },
        previousData: tasks.find(t => t.id === taskId) || {}
      });

      // Update local state
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, dueDate: newDate } : t
      ));
    } catch (err) {
      console.error('Failed to snooze task:', err);
      throw err; // Re-throw so UI can handle
    }
  };

  return { tasks, loading, error, completeTask, snoozeTask };
}
