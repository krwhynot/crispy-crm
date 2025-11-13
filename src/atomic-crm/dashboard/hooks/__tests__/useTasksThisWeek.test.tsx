import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasksThisWeek } from '../useTasksThisWeek';
import type { Task } from '@/atomic-crm/types';

// Mock react-admin hooks
const mockUseGetList = vi.fn();
const mockUseGetIdentity = vi.fn();

vi.mock('ra-core', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
  useGetIdentity: () => mockUseGetIdentity(),
}));

describe('useTasksThisWeek', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      due_date: '2025-11-15',
      completed: false,
      sales_id: 1,
      created_at: '2025-11-01T00:00:00Z',
      updated_at: '2025-11-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Task 2',
      due_date: '2025-11-16',
      completed: false,
      sales_id: 1,
      created_at: '2025-11-01T00:00:00Z',
      updated_at: '2025-11-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetIdentity.mockReturnValue({ identity: { id: 1 } });
  });

  it('should fetch tasks with default options', () => {
    mockUseGetList.mockReturnValue({
      data: mockTasks,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useTasksThisWeek());

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);

    // Verify useGetList was called with correct parameters
    expect(mockUseGetList).toHaveBeenCalledWith('tasks', expect.objectContaining({
      filter: expect.objectContaining({
        completed: false,
        sales_id: 1,
      }),
      sort: { field: 'due_date', order: 'ASC' },
      pagination: { page: 1, perPage: 50 },
    }));
  });

  it('should calculate todayStr and endOfWeekStr correctly', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useTasksThisWeek());

    // todayStr should be YYYY-MM-DD format
    expect(result.current.todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // endOfWeekStr should be 7 days from today (default)
    expect(result.current.endOfWeekStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // endOfWeekStr should be greater than todayStr
    expect(result.current.endOfWeekStr > result.current.todayStr).toBe(true);
  });

  it('should respect custom daysAhead option', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useTasksThisWeek({ daysAhead: 14 }));

    // Verify that endOfWeekStr is calculated correctly for 14 days
    const today = new Date();
    const expected = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const expectedStr = expected.toISOString().split('T')[0];

    expect(result.current.endOfWeekStr).toBe(expectedStr);
  });

  it('should respect custom perPage option', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    renderHook(() => useTasksThisWeek({ perPage: 100 }));

    expect(mockUseGetList).toHaveBeenCalledWith('tasks', expect.objectContaining({
      pagination: { page: 1, perPage: 100 },
    }));
  });

  it('should respect custom salesId option', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    renderHook(() => useTasksThisWeek({ salesId: 42 }));

    expect(mockUseGetList).toHaveBeenCalledWith('tasks', expect.objectContaining({
      filter: expect.objectContaining({
        sales_id: 42,
      }),
    }));
  });

  it('should use identity.id when salesId is not provided', () => {
    mockUseGetIdentity.mockReturnValue({ identity: { id: 123 } });
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    renderHook(() => useTasksThisWeek());

    expect(mockUseGetList).toHaveBeenCalledWith('tasks', expect.objectContaining({
      filter: expect.objectContaining({
        sales_id: 123,
      }),
    }));
  });

  it('should handle no identity gracefully', () => {
    mockUseGetIdentity.mockReturnValue({ identity: null });
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useTasksThisWeek());

    // Should still work, just without sales_id filter
    expect(result.current.tasks).toEqual([]);

    // Verify filter doesn't include sales_id when no identity
    const callArgs = mockUseGetList.mock.calls[0][1];
    expect(callArgs.filter.sales_id).toBeUndefined();
  });

  it('should handle loading state', () => {
    mockUseGetList.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useTasksThisWeek());

    expect(result.current.isPending).toBe(true);
    expect(result.current.tasks).toEqual([]);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: mockError,
    });

    const { result } = renderHook(() => useTasksThisWeek());

    expect(result.current.error).toBe(mockError);
    expect(result.current.isPending).toBe(false);
  });

  it('should include due_date filter with PostgREST syntax', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    renderHook(() => useTasksThisWeek());

    // Verify PostgREST-style filter syntax
    expect(mockUseGetList).toHaveBeenCalledWith('tasks', expect.objectContaining({
      filter: expect.objectContaining({
        'due_date@lte': expect.any(String),
      }),
    }));
  });

  it('should memoize date calculations', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useTasksThisWeek({ daysAhead: 7 }));

    const firstTodayStr = result.current.todayStr;
    const firstEndOfWeekStr = result.current.endOfWeekStr;

    // Rerender with same options
    rerender();

    // Date strings should be the same (memoized)
    expect(result.current.todayStr).toBe(firstTodayStr);
    expect(result.current.endOfWeekStr).toBe(firstEndOfWeekStr);
  });

  it('should recalculate dates when daysAhead changes', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ days }: { days: number }) => useTasksThisWeek({ daysAhead: days }),
      { initialProps: { days: 7 } }
    );

    const firstEndOfWeekStr = result.current.endOfWeekStr;

    // Change daysAhead
    rerender({ days: 14 });

    // endOfWeekStr should be different
    expect(result.current.endOfWeekStr).not.toBe(firstEndOfWeekStr);
  });

  it('should filter by completed: false', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    renderHook(() => useTasksThisWeek());

    expect(mockUseGetList).toHaveBeenCalledWith('tasks', expect.objectContaining({
      filter: expect.objectContaining({
        completed: false,
      }),
    }));
  });

  it('should sort by due_date ASC', () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    renderHook(() => useTasksThisWeek());

    expect(mockUseGetList).toHaveBeenCalledWith('tasks', expect.objectContaining({
      sort: { field: 'due_date', order: 'ASC' },
    }));
  });
});
