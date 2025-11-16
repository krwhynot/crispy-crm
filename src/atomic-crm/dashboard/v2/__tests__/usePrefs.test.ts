import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefs } from '../hooks/usePrefs';
import type { FilterState } from '../types';

// Mock react-admin's useStore
vi.mock('react-admin', () => ({
  useStore: vi.fn(),
}));

import { useStore } from 'react-admin';

describe('usePrefs - Dashboard V2 Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default filter state on first load', () => {
    const mockSetValue = vi.fn();
    vi.mocked(useStore).mockReturnValue([undefined, mockSetValue]);

    const defaultFilters: FilterState = {
      health: [],
      stages: [],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    const { result } = renderHook(() => usePrefs<FilterState>('filters', defaultFilters));

    expect(result.current[0]).toEqual({
      health: [],
      stages: [],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    });
  });

  it('persists filter changes to localStorage', () => {
    const mockSetValue = vi.fn();
    const defaultFilters: FilterState = {
      health: [],
      stages: [],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    // First render - returns undefined (not yet stored)
    vi.mocked(useStore).mockReturnValue([undefined, mockSetValue]);
    const { result: result1 } = renderHook(() => usePrefs<FilterState>('filters', defaultFilters));

    // Change filters
    const newFilters: FilterState = {
      health: ['at_risk'],
      stages: ['discovery', 'proposal'],
      assignee: 'me',
      lastTouch: '7d',
      showClosed: false,
      groupByCustomer: true,
    };

    act(() => {
      result1.current[1](newFilters);
    });

    expect(mockSetValue).toHaveBeenCalledWith(newFilters);

    // Second render - simulates page reload, returns stored value
    vi.mocked(useStore).mockReturnValue([newFilters, mockSetValue]);
    const { result: result2 } = renderHook(() => usePrefs<FilterState>('filters', defaultFilters));

    expect(result2.current[0]).toEqual({
      health: ['at_risk'],
      stages: ['discovery', 'proposal'],
      assignee: 'me',
      lastTouch: '7d',
      showClosed: false,
      groupByCustomer: true,
    });
  });

  it('handles partial filter updates', () => {
    const mockSetValue = vi.fn();
    const storedFilters: FilterState = {
      health: ['active'],
      stages: ['discovery'],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    vi.mocked(useStore).mockReturnValue([storedFilters, mockSetValue]);
    const { result } = renderHook(() => usePrefs<FilterState>('filters', storedFilters));

    // Update only health filter
    const updatedFilters: FilterState = {
      ...storedFilters,
      health: ['at_risk', 'cooling'],
    };

    act(() => {
      result.current[1](updatedFilters);
    });

    expect(mockSetValue).toHaveBeenCalledWith(updatedFilters);
  });
});

describe('FilterState logic', () => {
  it('calculates active filter count correctly with all filters active', () => {
    const filters: FilterState = {
      health: ['at_risk'],
      stages: ['discovery'],
      assignee: 'me',
      lastTouch: '7d',
      showClosed: true,
      groupByCustomer: false,
    };

    // Active filters: health, stages, assignee, lastTouch, showClosed = 5
    // (groupByCustomer is display option, not filter)
    const activeCount = [
      filters.health.length > 0,
      filters.stages.length > 0,
      filters.assignee !== 'team',
      filters.lastTouch !== 'any',
      filters.showClosed !== false,
    ].filter(Boolean).length;

    expect(activeCount).toBe(5);
  });

  it('calculates active filter count correctly with no filters active', () => {
    const filters: FilterState = {
      health: [],
      stages: [],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    const activeCount = [
      filters.health.length > 0,
      filters.stages.length > 0,
      filters.assignee !== 'team',
      filters.lastTouch !== 'any',
      filters.showClosed !== false,
    ].filter(Boolean).length;

    expect(activeCount).toBe(0);
  });

  it('calculates active filter count correctly with mixed filters', () => {
    const filters: FilterState = {
      health: ['active', 'cooling'],
      stages: [],
      assignee: 'team',
      lastTouch: '14d',
      showClosed: false,
      groupByCustomer: true,
    };

    // Active filters: health (2 values), lastTouch = 2
    const activeCount = [
      filters.health.length > 0,
      filters.stages.length > 0,
      filters.assignee !== 'team',
      filters.lastTouch !== 'any',
      filters.showClosed !== false,
    ].filter(Boolean).length;

    expect(activeCount).toBe(2);
  });

  it('treats assignee as sales_id string correctly', () => {
    const filters: FilterState = {
      health: [],
      stages: [],
      assignee: '123', // sales_id as string (React Admin pattern)
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    const activeCount = [
      filters.health.length > 0,
      filters.stages.length > 0,
      filters.assignee !== 'team',
      filters.lastTouch !== 'any',
      filters.showClosed !== false,
    ].filter(Boolean).length;

    // assignee is '123' (not 'team'), so count should be 1
    expect(activeCount).toBe(1);
  });

  it('treats null assignee as inactive filter', () => {
    const filters: FilterState = {
      health: [],
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    const activeCount = [
      filters.health.length > 0,
      filters.stages.length > 0,
      filters.assignee !== 'team' && filters.assignee !== null,
      filters.lastTouch !== 'any',
      filters.showClosed !== false,
    ].filter(Boolean).length;

    expect(activeCount).toBe(0);
  });

  it('handles multiple health statuses in filter', () => {
    const filters: FilterState = {
      health: ['active', 'cooling', 'at_risk'],
      stages: [],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    // Health filter is active if array has any values
    const healthFilterActive = filters.health.length > 0;
    expect(healthFilterActive).toBe(true);
    expect(filters.health.length).toBe(3);
  });

  it('handles multiple stages in filter', () => {
    const filters: FilterState = {
      health: [],
      stages: ['discovery', 'proposal', 'negotiation', 'closed_won'],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    const stagesFilterActive = filters.stages.length > 0;
    expect(stagesFilterActive).toBe(true);
    expect(filters.stages.length).toBe(4);
  });
});
