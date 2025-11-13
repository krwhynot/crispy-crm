import type { Task } from '@/atomic-crm/types';

export interface TasksByUrgency {
  OVERDUE: Task[];
  TODAY: Task[];
  'THIS WEEK': Task[];
}

/**
 * Groups tasks by urgency based on due date relative to today
 *
 * @param tasks - Array of tasks to group
 * @param todayStr - Today's date string in YYYY-MM-DD format
 * @returns Tasks grouped into OVERDUE, TODAY, and THIS WEEK buckets
 *
 * @example
 * ```tsx
 * const { tasks, todayStr } = useTasksThisWeek();
 * const grouped = groupTasksByUrgency(tasks, todayStr);
 *
 * // Access groups
 * grouped.OVERDUE // Tasks with due_date < today
 * grouped.TODAY   // Tasks with due_date === today
 * grouped['THIS WEEK'] // Tasks with due_date > today
 * ```
 */
export function groupTasksByUrgency(tasks: Task[], todayStr: string): TasksByUrgency {
  const groups: TasksByUrgency = {
    OVERDUE: [],
    TODAY: [],
    'THIS WEEK': [],
  };

  tasks.forEach((task) => {
    if (!task.due_date) {
      // Tasks with no due date go to THIS WEEK by default
      groups['THIS WEEK'].push(task);
    } else if (task.due_date < todayStr) {
      groups.OVERDUE.push(task);
    } else if (task.due_date === todayStr) {
      groups.TODAY.push(task);
    } else {
      groups['THIS WEEK'].push(task);
    }
  });

  return groups;
}
