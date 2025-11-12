import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GlobalFilterProvider, useGlobalFilters } from './GlobalFilterContext';

describe('GlobalFilterContext', () => {
  it('provides default filter values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalFilterProvider>{children}</GlobalFilterProvider>
    );

    const { result } = renderHook(() => useGlobalFilters(), { wrapper });

    expect(result.current.filters.dateRange).toEqual({
      start: expect.any(Date),
      end: expect.any(Date),
    });
    expect(result.current.filters.salesRepId).toBeNull();
  });

  it('persists filters to localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalFilterProvider>{children}</GlobalFilterProvider>
    );

    const { result } = renderHook(() => useGlobalFilters(), { wrapper });

    act(() => {
      result.current.setFilters({
        dateRange: { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
        salesRepId: 123,
      });
    });

    const stored = localStorage.getItem('reports.globalFilters');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.salesRepId).toBe(123);
  });
});
