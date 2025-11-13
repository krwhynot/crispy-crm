import { describe, it, expect } from 'vitest';
import { groupTasksByUrgency } from '../groupTasksByUrgency';
import type { Task } from '@/atomic-crm/types';

describe('groupTasksByUrgency', () => {
  const todayStr = '2025-11-13';

  const createTask = (id: number, due_date: string): Task => ({
    id,
    title: `Task ${id}`,
    due_date,
    completed: false,
    sales_id: 1,
    created_at: '2025-11-01T00:00:00Z',
    updated_at: '2025-11-01T00:00:00Z',
  });

  it('should group tasks by urgency correctly', () => {
    const tasks: Task[] = [
      createTask(1, '2025-11-10'), // Overdue
      createTask(2, '2025-11-13'), // Today
      createTask(3, '2025-11-15'), // This week
      createTask(4, '2025-11-12'), // Overdue
      createTask(5, '2025-11-13'), // Today
      createTask(6, '2025-11-18'), // This week
    ];

    const grouped = groupTasksByUrgency(tasks, todayStr);

    expect(grouped.OVERDUE).toHaveLength(2);
    expect(grouped.OVERDUE.map((t) => t.id)).toEqual([1, 4]);

    expect(grouped.TODAY).toHaveLength(2);
    expect(grouped.TODAY.map((t) => t.id)).toEqual([2, 5]);

    expect(grouped['THIS WEEK']).toHaveLength(2);
    expect(grouped['THIS WEEK'].map((t) => t.id)).toEqual([3, 6]);
  });

  it('should handle empty task array', () => {
    const grouped = groupTasksByUrgency([], todayStr);

    expect(grouped.OVERDUE).toHaveLength(0);
    expect(grouped.TODAY).toHaveLength(0);
    expect(grouped['THIS WEEK']).toHaveLength(0);
  });

  it('should put tasks with no due_date in THIS WEEK', () => {
    const tasks: Task[] = [
      { ...createTask(1, ''), due_date: '' },
      { ...createTask(2, ''), due_date: undefined as any },
    ];

    const grouped = groupTasksByUrgency(tasks, todayStr);

    expect(grouped['THIS WEEK']).toHaveLength(2);
    expect(grouped.OVERDUE).toHaveLength(0);
    expect(grouped.TODAY).toHaveLength(0);
  });

  it('should handle all tasks in OVERDUE group', () => {
    const tasks: Task[] = [
      createTask(1, '2025-11-10'),
      createTask(2, '2025-11-11'),
      createTask(3, '2025-11-12'),
    ];

    const grouped = groupTasksByUrgency(tasks, todayStr);

    expect(grouped.OVERDUE).toHaveLength(3);
    expect(grouped.TODAY).toHaveLength(0);
    expect(grouped['THIS WEEK']).toHaveLength(0);
  });

  it('should handle all tasks in TODAY group', () => {
    const tasks: Task[] = [
      createTask(1, '2025-11-13'),
      createTask(2, '2025-11-13'),
      createTask(3, '2025-11-13'),
    ];

    const grouped = groupTasksByUrgency(tasks, todayStr);

    expect(grouped.OVERDUE).toHaveLength(0);
    expect(grouped.TODAY).toHaveLength(3);
    expect(grouped['THIS WEEK']).toHaveLength(0);
  });

  it('should handle all tasks in THIS WEEK group', () => {
    const tasks: Task[] = [
      createTask(1, '2025-11-14'),
      createTask(2, '2025-11-15'),
      createTask(3, '2025-11-20'),
    ];

    const grouped = groupTasksByUrgency(tasks, todayStr);

    expect(grouped.OVERDUE).toHaveLength(0);
    expect(grouped.TODAY).toHaveLength(0);
    expect(grouped['THIS WEEK']).toHaveLength(3);
  });

  it('should correctly compare date strings', () => {
    const tasks: Task[] = [
      createTask(1, '2025-11-12'), // One day before today -> OVERDUE
      createTask(2, '2025-11-13'), // Exactly today -> TODAY
      createTask(3, '2025-11-14'), // One day after today -> THIS WEEK
    ];

    const grouped = groupTasksByUrgency(tasks, todayStr);

    expect(grouped.OVERDUE.map((t) => t.id)).toEqual([1]);
    expect(grouped.TODAY.map((t) => t.id)).toEqual([2]);
    expect(grouped['THIS WEEK'].map((t) => t.id)).toEqual([3]);
  });

  it('should maintain task object integrity', () => {
    const originalTask: Task = {
      id: 1,
      title: 'Test Task',
      due_date: '2025-11-13',
      completed: false,
      sales_id: 1,
      created_at: '2025-11-01T00:00:00Z',
      updated_at: '2025-11-01T00:00:00Z',
      description: 'Test description',
      priority: 'high',
    };

    const grouped = groupTasksByUrgency([originalTask], todayStr);

    // Task should be in TODAY group
    expect(grouped.TODAY).toHaveLength(1);

    // Task object should be unchanged
    expect(grouped.TODAY[0]).toEqual(originalTask);
    expect(grouped.TODAY[0].description).toBe('Test description');
    expect(grouped.TODAY[0].priority).toBe('high');
  });

  it('should handle edge case with date at midnight', () => {
    // Tasks due at exact midnight should still be grouped correctly
    const tasks: Task[] = [
      createTask(1, '2025-11-13T00:00:00Z'), // Should be TODAY (after splitting)
    ];

    // Simulate the date string split that happens in the component
    const taskWithTruncatedDate = {
      ...tasks[0],
      due_date: tasks[0].due_date.split('T')[0], // '2025-11-13'
    };

    const grouped = groupTasksByUrgency([taskWithTruncatedDate], todayStr);

    expect(grouped.TODAY).toHaveLength(1);
  });

  it('should be deterministic for same inputs', () => {
    const tasks: Task[] = [
      createTask(1, '2025-11-10'),
      createTask(2, '2025-11-13'),
      createTask(3, '2025-11-15'),
    ];

    const grouped1 = groupTasksByUrgency(tasks, todayStr);
    const grouped2 = groupTasksByUrgency(tasks, todayStr);

    expect(grouped1).toEqual(grouped2);
  });
});
