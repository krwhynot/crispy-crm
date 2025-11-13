import { useMemo } from 'react';
import { useGetList, useGetIdentity } from 'ra-core';
import type { Task } from '@/atomic-crm/types';

export interface UseTasksThisWeekOptions {
  /**
   * Number of days to look ahead (default: 7)
   */
  daysAhead?: number;
  /**
   * Maximum number of tasks to fetch (default: 50)
   */
  perPage?: number;
  /**
   * Filter by sales rep ID (default: current user's ID)
   */
  salesId?: number | string;
}

export interface UseTasksThisWeekResult {
  /** Array of incomplete tasks due this week */
  tasks: Task[];
  /** Loading state */
  isPending: boolean;
  /** Error state */
  error: Error | null;
  /** Today's date string (YYYY-MM-DD) */
  todayStr: string;
  /** End of week date string (YYYY-MM-DD) */
  endOfWeekStr: string;
}

/**
 * Fetches incomplete tasks due within the specified time window for the current user
 *
 * @param options - Configuration options
 * @returns Tasks, loading state, error, and date strings
 *
 * @example
 * ```tsx
 * const { tasks, isPending, todayStr } = useTasksThisWeek({ daysAhead: 7 });
 *
 * const grouped = groupTasksByUrgency(tasks, todayStr);
 * ```
 */
export function useTasksThisWeek(options: UseTasksThisWeekOptions = {}): UseTasksThisWeekResult {
  const { daysAhead = 7, perPage = 50, salesId } = options;
  const { identity } = useGetIdentity();

  // Calculate date range
  const { todayStr, endOfWeekStr } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const endOfWeek = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    return { todayStr, endOfWeekStr };
  }, [daysAhead]);

  // Fetch tasks
  const effectiveSalesId = salesId ?? identity?.id;

  const { data: tasks = [], isPending, error } = useGetList<Task>('tasks', {
    filter: {
      completed: false,
      'due_date@lte': endOfWeekStr,
      ...(effectiveSalesId && { sales_id: effectiveSalesId }),
    },
    sort: { field: 'due_date', order: 'ASC' },
    pagination: { page: 1, perPage },
  });

  return {
    tasks,
    isPending,
    error: error || null,
    todayStr,
    endOfWeekStr,
  };
}
