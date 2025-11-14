import { startOfDay, addDays, parseISO, isBefore, isEqual } from 'date-fns';
import type { TaskBucket } from '../types';

const TODAY = startOfDay(new Date());
const TOMORROW = addDays(TODAY, 1);
const END_OF_WEEK = addDays(TODAY, 7);

export function getBucket(due_date: string | null): TaskBucket {
  if (!due_date) return 'later';

  const dueDate = startOfDay(parseISO(due_date));

  if (isBefore(dueDate, TODAY)) return 'overdue';
  if (isEqual(dueDate, TODAY)) return 'today';
  if (isEqual(dueDate, TOMORROW)) return 'tomorrow';
  if (isBefore(dueDate, END_OF_WEEK)) return 'this_week';
  return 'later';
}

export const BUCKET_LABELS: Record<TaskBucket, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  this_week: 'This Week',
  later: 'Later',
};

export const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
