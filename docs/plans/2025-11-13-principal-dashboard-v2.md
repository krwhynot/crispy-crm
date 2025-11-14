# Principal Dashboard V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace current 70/30 dashboard layout with 3-column resizable layout featuring collapsible filters sidebar, opportunities hierarchy tree, tasks panel, quick activity logger, and right slide-over details panel.

**Architecture:** Desktop-first (1440px+) responsive design using Tailwind v4 semantic utilities, shadcn/ui components, React Admin data provider (Supabase), and localStorage persistence for user preferences. Feature-flagged rollout via `?layout=v2` query param.

**Tech Stack:** React 19, TypeScript, Tailwind v4 (CSS-first), shadcn/ui, React Admin 5.4, Supabase, Zod validation, date-fns, Vitest, Playwright

**Decisions Locked:**
- Q1: Primary customer only (no multi-customer duplication)
- Q2: Auto-assign follow-up tasks to current user
- Q3: Files tab shows "Coming soon" placeholder
- Q4: Saved Views shows empty state
- Q5: Client-side assignee filter (`me|team`)
- Q6: Column resize disabled on <1024px
- Q7: "Later" tasks collapsed by default, paginated 10 at a time
- Q8: Cancel previous slide-over fetch on new row click

---

## Phase 1: Foundation

### Task 1: Feature Flag Hook

**Files:**
- Create: `src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts`
- Test: `src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.test.ts`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFeatureFlag } from './useFeatureFlag';

describe('useFeatureFlag', () => {
  it('returns true when query param layout=v2 exists', () => {
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: '?layout=v2' },
      writable: true,
    });

    const { result } = renderHook(() => useFeatureFlag('dashboard-v2'));
    expect(result.current).toBe(true);
  });

  it('returns false when query param is missing', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    });

    const { result } = renderHook(() => useFeatureFlag('dashboard-v2'));
    expect(result.current).toBe(false);
  });

  it('returns false when query param has different value', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?layout=v1' },
      writable: true,
    });

    const { result } = renderHook(() => useFeatureFlag('dashboard-v2'));
    expect(result.current).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test useFeatureFlag.test.ts
```

Expected: FAIL with "Cannot find module './useFeatureFlag'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts
import { useMemo } from 'react';

export function useFeatureFlag(flagName: string): boolean {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    if (flagName === 'dashboard-v2') {
      return params.get('layout') === 'v2';
    }

    return false;
  }, [flagName]);
}
```

**Step 4: Run test to verify it passes**

```bash
npm test useFeatureFlag.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.test.ts
git commit -m "feat(dashboard): add feature flag hook for v2 layout"
```

---

### Task 2: Preferences Persistence Hook

**Files:**
- Create: `src/atomic-crm/dashboard/v2/hooks/usePrefs.ts`
- Test: `src/atomic-crm/dashboard/v2/hooks/usePrefs.test.ts`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/dashboard/v2/hooks/usePrefs.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefs } from './usePrefs';
import { TestMemoryRouter } from 'ra-core';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestMemoryRouter>{children}</TestMemoryRouter>
);

describe('usePrefs', () => {
  it('returns default value on first render', () => {
    const { result } = renderHook(() => usePrefs('test.key', 42), { wrapper });
    expect(result.current[0]).toBe(42);
  });

  it('persists updated value', () => {
    const { result } = renderHook(() => usePrefs('test.key2', 'default'), { wrapper });

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
  });

  it('persists array values', () => {
    const { result } = renderHook(() => usePrefs('test.array', [40, 30, 30]), { wrapper });

    act(() => {
      result.current[1]([50, 25, 25]);
    });

    expect(result.current[0]).toEqual([50, 25, 25]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test usePrefs.test.ts
```

Expected: FAIL with "Cannot find module './usePrefs'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/dashboard/v2/hooks/usePrefs.ts
import { useStore } from 'react-admin';

/**
 * Wrapper around React Admin's useStore for type-safe preference persistence
 *
 * @param key - Preference key (e.g., 'pd.colWidths')
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue] tuple
 */
export function usePrefs<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useStore<T>(key, defaultValue);
  return [value, setValue];
}
```

**Step 4: Run test to verify it passes**

```bash
npm test usePrefs.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/hooks/usePrefs.ts src/atomic-crm/dashboard/v2/hooks/usePrefs.test.ts
git commit -m "feat(dashboard): add preferences persistence hook"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `src/atomic-crm/dashboard/v2/types.ts`

**Step 1: Write types (no test needed for type-only file)**

```typescript
// src/atomic-crm/dashboard/v2/types.ts

/**
 * Column widths as percentages (must sum to 100)
 */
export type ColWidths = [number, number, number];

/**
 * Task grouping modes
 */
export type TaskGrouping = 'principal' | 'due' | 'priority';

/**
 * Right slide-over tab names
 */
export type TabName = 'details' | 'history' | 'files';

/**
 * Health filter options
 */
export type HealthStatus = 'active' | 'cooling' | 'at_risk';

/**
 * Filter state for sidebar
 */
export interface FilterState {
  health: HealthStatus[];
  stages: string[];
  assignee: 'me' | 'team';
  lastTouch: 'last_7d' | 'last_14d' | 'any';
  showClosed: boolean;
  groupByCustomer: boolean;
}

/**
 * Principal selection context
 */
export interface PrincipalContextValue {
  selectedPrincipalId: number | null;
  setSelectedPrincipal: (id: number | null) => void;
}

/**
 * Opportunity with customer grouping
 */
export interface OpportunityWithCustomer {
  id: number;
  name: string;
  stage: string;
  estimated_close_date: string | null;
  estimated_value: number | null;
  health_status: HealthStatus;
  customer_organization_id: number;
  customer_name: string;
  last_activity: string | null;
}

/**
 * Task with grouping metadata
 */
export interface TaskWithGroup {
  id: number;
  title: string;
  due_date: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  principal_id: number | null;
  principal_name: string | null;
  completed: boolean;
}

/**
 * Column resize handler state
 */
export interface ResizeState {
  idx: number;
  startX: number;
  rect: DOMRect;
  startWidths: ColWidths;
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/types.ts
git commit -m "feat(dashboard): add TypeScript types for v2"
```

---

### Task 4: Resizable Columns Hook

**Files:**
- Create: `src/atomic-crm/dashboard/v2/hooks/useResizableColumns.ts`
- Test: `src/atomic-crm/dashboard/v2/hooks/useResizableColumns.test.ts`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/dashboard/v2/hooks/useResizableColumns.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResizableColumns } from './useResizableColumns';
import { TestMemoryRouter } from 'ra-core';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestMemoryRouter>{children}</TestMemoryRouter>
);

describe('useResizableColumns', () => {
  it('initializes with default widths', () => {
    const { result } = renderHook(() => useResizableColumns([40, 30, 30]), { wrapper });
    expect(result.current.widths).toEqual([40, 30, 30]);
  });

  it('provides container ref', () => {
    const { result } = renderHook(() => useResizableColumns([40, 30, 30]), { wrapper });
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull(); // Not attached yet
  });

  it('provides onMouseDown handler', () => {
    const { result } = renderHook(() => useResizableColumns([40, 30, 30]), { wrapper });
    expect(typeof result.current.onMouseDown).toBe('function');
  });

  it('provides setWidths setter', () => {
    const { result } = renderHook(() => useResizableColumns([40, 30, 30]), { wrapper });

    act(() => {
      result.current.setWidths([50, 25, 25]);
    });

    expect(result.current.widths).toEqual([50, 25, 25]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test useResizableColumns.test.ts
```

Expected: FAIL with "Cannot find module './useResizableColumns'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/dashboard/v2/hooks/useResizableColumns.ts
import { useRef, useCallback } from 'react';
import { usePrefs } from './usePrefs';
import type { ColWidths, ResizeState } from '../types';

/**
 * Hook for resizable 3-column layout with constraints
 *
 * Constraints:
 * - Each column: min 15%, max 70%
 * - Widths must sum to 100%
 * - Persists to localStorage via usePrefs
 */
export function useResizableColumns(initial: ColWidths = [40, 30, 30]) {
  const [widths, setWidths] = usePrefs<ColWidths>('pd.colWidths', initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<ResizeState | null>(null);

  const onMouseDown = useCallback((idx: number) => {
    return (e: React.MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      startRef.current = {
        idx,
        startX: e.clientX,
        rect,
        startWidths: [...widths] as ColWidths,
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
  }, [widths]);

  const onMove = useCallback((e: MouseEvent) => {
    if (!startRef.current) return;

    const { idx, startX, rect, startWidths } = startRef.current;
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / rect.width) * 100;

    // Calculate new widths
    const newWidths = [...startWidths] as ColWidths;
    newWidths[idx] = startWidths[idx] + deltaPercent;
    newWidths[idx + 1] = startWidths[idx + 1] - deltaPercent;

    // Apply constraints: min 15%, max 70%
    newWidths[idx] = Math.max(15, Math.min(70, newWidths[idx]));
    newWidths[idx + 1] = Math.max(15, Math.min(70, newWidths[idx + 1]));

    // Normalize to sum to 100%
    const sum = newWidths.reduce((a, b) => a + b, 0);
    const normalized = newWidths.map(w => (w / sum) * 100) as ColWidths;

    setWidths(normalized);
  }, [setWidths]);

  const onUp = useCallback(() => {
    startRef.current = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }, [onMove]);

  return {
    containerRef,
    widths,
    onMouseDown,
    setWidths,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test useResizableColumns.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/hooks/useResizableColumns.ts src/atomic-crm/dashboard/v2/hooks/useResizableColumns.test.ts
git commit -m "feat(dashboard): add resizable columns hook with constraints"
```

---

## Phase 2: Core Layout

### Task 5: Principal Context

**Files:**
- Create: `src/atomic-crm/dashboard/v2/context/PrincipalContext.tsx`

**Step 1: Write context (no test for context provider)**

```typescript
// src/atomic-crm/dashboard/v2/context/PrincipalContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PrincipalContextValue } from '../types';

const PrincipalContext = createContext<PrincipalContextValue | undefined>(undefined);

export function PrincipalProvider({ children }: { children: React.ReactNode }) {
  const [selectedPrincipalId, setSelectedPrincipalIdState] = useState<number | null>(null);

  const setSelectedPrincipal = useCallback((id: number | null) => {
    setSelectedPrincipalIdState(id);
  }, []);

  return (
    <PrincipalContext.Provider value={{ selectedPrincipalId, setSelectedPrincipal }}>
      {children}
    </PrincipalContext.Provider>
  );
}

export function usePrincipalContext(): PrincipalContextValue {
  const context = useContext(PrincipalContext);
  if (!context) {
    throw new Error('usePrincipalContext must be used within PrincipalProvider');
  }
  return context;
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/context/PrincipalContext.tsx
git commit -m "feat(dashboard): add principal selection context"
```

---

### Task 6: Dashboard Header Component

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx`

**Step 1: Write component (integration-tested in parent)**

```typescript
// src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx
import { useGetList } from 'react-admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search } from 'lucide-react';
import { usePrincipalContext } from '../context/PrincipalContext';

export function DashboardHeader() {
  const { selectedPrincipalId, setSelectedPrincipal } = usePrincipalContext();

  const { data: principals = [] } = useGetList('organizations', {
    filter: { organization_type: 'principal', deleted_at: null },
    sort: { field: 'name', order: 'ASC' },
    pagination: { page: 1, perPage: 100 },
  });

  return (
    <div className="border-b border-border bg-background px-[var(--spacing-edge-desktop)] py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs + Principal Selector */}
        <div className="flex items-center gap-4">
          <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>Home</li>
              <li aria-hidden="true">/</li>
              <li>Principals</li>
              {selectedPrincipalId && (
                <>
                  <li aria-hidden="true">/</li>
                  <li className="font-medium text-foreground">
                    {principals.find(p => p.id === selectedPrincipalId)?.name || 'Loading...'}
                  </li>
                </>
              )}
            </ol>
          </nav>

          <Select
            value={selectedPrincipalId?.toString() || ''}
            onValueChange={(value) => setSelectedPrincipal(value ? Number(value) : null)}
          >
            <SelectTrigger className="w-[280px] h-11">
              <SelectValue placeholder="Select principal..." />
            </SelectTrigger>
            <SelectContent>
              {principals.map((principal) => (
                <SelectItem key={principal.id} value={principal.id.toString()}>
                  {principal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Center: Global Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="global-search"
            type="search"
            placeholder="Search... (press / to focus)"
            className="pl-9 h-11"
          />
        </div>

        {/* Right: New Menu */}
        <Button variant="default" className="h-11">
          New <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx
git commit -m "feat(dashboard): add header with breadcrumbs and principal selector"
```

---

### Task 7: Filters Sidebar Component

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`

**Step 1: Write component**

```typescript
// src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePrefs } from '../hooks/usePrefs';
import type { FilterState } from '../types';

const DEFAULT_FILTERS: FilterState = {
  health: ['active', 'cooling', 'at_risk'],
  stages: [],
  assignee: 'me',
  lastTouch: 'any',
  showClosed: false,
  groupByCustomer: true,
};

interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const [isOpen, setIsOpen] = usePrefs('pd.sidebarOpen', true);

  const toggleHealth = (health: FilterState['health'][number]) => {
    const newHealth = filters.health.includes(health)
      ? filters.health.filter(h => h !== health)
      : [...filters.health, health];
    onFiltersChange({ ...filters, health: newHealth });
  };

  if (!isOpen) {
    return (
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-11 w-11"
          aria-label="Open filters"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-64 p-content border-border bg-card shadow-sm rounded-lg space-y-content">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
          aria-label="Close filters"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Health Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Health Status</Label>
        <div className="space-y-2">
          {[
            { id: 'active', label: 'Active', color: 'text-success' },
            { id: 'cooling', label: 'Cooling', color: 'text-warning' },
            { id: 'at_risk', label: 'At Risk', color: 'text-destructive' },
          ].map(({ id, label, color }) => (
            <div key={id} className="flex items-center gap-2">
              <Checkbox
                id={`filter-${id}`}
                checked={filters.health.includes(id as any)}
                onCheckedChange={() => toggleHealth(id as any)}
                className="h-5 w-5"
              />
              <Label htmlFor={`filter-${id}`} className={`text-sm cursor-pointer ${color}`}>
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Assignee */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Assignee</Label>
        <Select
          value={filters.assignee}
          onValueChange={(value: 'me' | 'team') => onFiltersChange({ ...filters, assignee: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="me">My Opportunities</SelectItem>
            <SelectItem value="team">Team Opportunities</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Last Touch */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Last Touch</Label>
        <Select
          value={filters.lastTouch}
          onValueChange={(value: any) => onFiltersChange({ ...filters, lastTouch: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7d">Last 7 days</SelectItem>
            <SelectItem value="last_14d">Last 14 days</SelectItem>
            <SelectItem value="any">Any time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Saved Views (Empty State) */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-sm font-medium">Saved Views</Label>
        <p className="text-xs text-muted-foreground">Custom views coming soon</p>
      </div>

      {/* Utilities */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-closed"
            checked={filters.showClosed}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, showClosed: !!checked })}
            className="h-5 w-5"
          />
          <Label htmlFor="show-closed" className="text-sm cursor-pointer">
            Show closed opportunities
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="group-by-customer"
            checked={filters.groupByCustomer}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, groupByCustomer: !!checked })}
            className="h-5 w-5"
          />
          <Label htmlFor="group-by-customer" className="text-sm cursor-pointer">
            Group by customer
          </Label>
        </div>
      </div>
    </Card>
  );
}

export { DEFAULT_FILTERS };
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git commit -m "feat(dashboard): add collapsible filters sidebar"
```

---

### Task 8: Column Separator Component

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/ColumnSeparator.tsx`

**Step 1: Write component**

```typescript
// src/atomic-crm/dashboard/v2/components/ColumnSeparator.tsx
interface ColumnSeparatorProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

export function ColumnSeparator({ onMouseDown }: ColumnSeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize columns"
      className="relative w-11 cursor-col-resize group hidden lg:flex items-center justify-center"
      onMouseDown={onMouseDown}
      tabIndex={0}
    >
      {/* Invisible hit area (44px wide) */}
      <div className="absolute inset-0" />

      {/* Visible indicator */}
      <div className="w-px h-full bg-border group-hover:bg-primary transition-colors" />

      {/* Drag dots on hover */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-1 items-center justify-center h-full">
          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/ColumnSeparator.tsx
git commit -m "feat(dashboard): add column separator with 44px touch target"
```

---

## Phase 3: Data Integration

### Task 9: Opportunities Hierarchy Component

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`

**Step 1: Write component**

```typescript
// src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx
import { useState, useMemo } from 'react';
import { useGetList } from 'react-admin';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { usePrincipalContext } from '../context/PrincipalContext';
import type { OpportunityWithCustomer, FilterState, HealthStatus } from '../types';

interface OpportunitiesHierarchyProps {
  filters: FilterState;
  onRowClick: (opportunityId: number) => void;
}

interface CustomerGroup {
  customerId: number;
  customerName: string;
  opportunities: OpportunityWithCustomer[];
  lastActivity: string | null;
}

export function OpportunitiesHierarchy({ filters, onRowClick }: OpportunitiesHierarchyProps) {
  const { selectedPrincipalId } = usePrincipalContext();
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());

  const { data: opportunities = [], isPending } = useGetList<OpportunityWithCustomer>('principal_opportunities', {
    filter: {
      principal_organization_id: selectedPrincipalId,
      ...(filters.showClosed ? {} : { stage_ne: 'closed_lost' }),
    },
    sort: { field: 'last_activity', order: 'DESC' },
    pagination: { page: 1, perPage: 500 },
  });

  // Group by customer
  const customerGroups = useMemo<CustomerGroup[]>(() => {
    if (!filters.groupByCustomer || !opportunities.length) return [];

    const groups = opportunities.reduce((acc, opp) => {
      const key = opp.customer_organization_id;
      if (!acc.has(key)) {
        acc.set(key, {
          customerId: key,
          customerName: opp.customer_name,
          opportunities: [],
          lastActivity: null,
        });
      }

      const group = acc.get(key)!;
      group.opportunities.push(opp);

      // Track most recent activity
      if (opp.last_activity) {
        if (!group.lastActivity || opp.last_activity > group.lastActivity) {
          group.lastActivity = opp.last_activity;
        }
      }

      return acc;
    }, new Map<number, CustomerGroup>());

    // Sort by recency
    const sorted = Array.from(groups.values()).sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return b.lastActivity.localeCompare(a.lastActivity);
    });

    // Auto-expand top 3
    const top3 = sorted.slice(0, 3).map(g => g.customerId);
    setExpandedCustomers(new Set(top3));

    return sorted;
  }, [opportunities, filters.groupByCustomer]);

  // Apply filters
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      // Health filter
      if (!filters.health.includes(opp.health_status)) return false;

      // Stage filter (if any selected)
      if (filters.stages.length > 0 && !filters.stages.includes(opp.stage)) return false;

      return true;
    });
  }, [opportunities, filters]);

  const toggleCustomer = (customerId: number) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const getHealthDotClass = (health: HealthStatus) => {
    switch (health) {
      case 'active': return 'bg-success';
      case 'cooling': return 'bg-warning';
      case 'at_risk': return 'bg-destructive';
    }
  };

  if (isPending) {
    return (
      <Card className="border-border bg-card shadow-sm rounded-lg">
        <CardHeader className="border-b border-border">
          <h2 className="font-semibold text-foreground">Opportunities</h2>
        </CardHeader>
        <CardContent className="p-content">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-11 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPrincipalId) {
    return (
      <Card className="border-border bg-card shadow-sm rounded-lg">
        <CardHeader className="border-b border-border">
          <h2 className="font-semibold text-foreground">Opportunities</h2>
        </CardHeader>
        <CardContent className="p-content">
          <p className="text-sm text-muted-foreground text-center py-8">
            Select a principal to view opportunities
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm rounded-lg">
      <CardHeader className="border-b border-border">
        <h2 className="font-semibold text-foreground">
          Opportunities ({filteredOpportunities.length})
        </h2>
      </CardHeader>
      <CardContent className="p-0">
        <div role="tree" aria-label="Opportunities grouped by customer" className="divide-y divide-border">
          {customerGroups.map(group => {
            const isExpanded = expandedCustomers.has(group.customerId);
            const groupOpps = group.opportunities.filter(opp =>
              filters.health.includes(opp.health_status)
            );

            return (
              <div key={group.customerId}>
                {/* Customer Row */}
                <div
                  role="treeitem"
                  aria-expanded={isExpanded}
                  aria-level={2}
                  className="flex items-center gap-2 p-3 hover:bg-muted/50 cursor-pointer min-h-11"
                  onClick={() => toggleCustomer(group.customerId)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-foreground">
                    {group.customerName} ({groupOpps.length})
                  </span>
                </div>

                {/* Opportunities (when expanded) */}
                {isExpanded && (
                  <div role="group" className="bg-muted/20">
                    {groupOpps.map(opp => (
                      <div
                        key={opp.id}
                        role="treeitem"
                        aria-level={3}
                        className="flex items-center gap-3 pl-12 pr-3 py-2 hover:bg-muted/50 cursor-pointer min-h-11"
                        onClick={() => onRowClick(opp.id)}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full ${getHealthDotClass(opp.health_status)}`} />
                        <span className="flex-1 text-sm text-foreground">{opp.name}</span>
                        <span className="text-xs text-muted-foreground">{opp.stage}</span>
                        {opp.estimated_close_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(opp.estimated_close_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx
git commit -m "feat(dashboard): add opportunities hierarchy with customer grouping"
```

---

### Task 10: Tasks Panel Component

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`

**Step 1: Write component**

```typescript
// src/atomic-crm/dashboard/v2/components/TasksPanel.tsx
import { useState, useMemo } from 'react';
import { useGetList, useUpdate, useNotify } from 'react-admin';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePrincipalContext } from '../context/PrincipalContext';
import { usePrefs } from '../hooks/usePrefs';
import type { TaskWithGroup, TaskGrouping } from '../types';

export function TasksPanel() {
  const { selectedPrincipalId } = usePrincipalContext();
  const [grouping, setGrouping] = usePrefs<TaskGrouping>('pd.taskGrouping', 'due');
  const [laterVisibleCount, setLaterVisibleCount] = useState(10);
  const notify = useNotify();
  const [update] = useUpdate();

  const { data: tasks = [], isPending } = useGetList<TaskWithGroup>('priority_tasks', {
    filter: {
      completed: false,
      ...(selectedPrincipalId ? { principal_id: selectedPrincipalId } : {}),
    },
    sort: { field: 'due_date', order: 'ASC' },
    pagination: { page: 1, perPage: 500 },
  });

  const groupedTasks = useMemo(() => {
    if (grouping === 'due') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      return {
        overdue: tasks.filter(t => new Date(t.due_date) < today),
        today: tasks.filter(t => new Date(t.due_date).toDateString() === today.toDateString()),
        tomorrow: tasks.filter(t => new Date(t.due_date).toDateString() === tomorrow.toDateString()),
        thisWeek: tasks.filter(t => {
          const due = new Date(t.due_date);
          return due > tomorrow && due <= endOfWeek;
        }),
        later: tasks.filter(t => new Date(t.due_date) > endOfWeek),
      };
    } else if (grouping === 'priority') {
      return {
        critical: tasks.filter(t => t.priority === 'critical'),
        high: tasks.filter(t => t.priority === 'high'),
        medium: tasks.filter(t => t.priority === 'medium'),
        low: tasks.filter(t => t.priority === 'low'),
      };
    } else {
      // Group by principal
      const groups = tasks.reduce((acc, task) => {
        const key = task.principal_name || 'No Principal';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {} as Record<string, TaskWithGroup[]>);
      return groups;
    }
  }, [tasks, grouping]);

  const handleComplete = async (taskId: number) => {
    try {
      await update('tasks', {
        id: taskId,
        data: { completed: true, completed_at: new Date().toISOString() },
      });
      notify('Task completed', { type: 'success' });
    } catch (error) {
      notify('Failed to complete task', { type: 'error' });
    }
  };

  if (isPending) {
    return (
      <Card className="border-border bg-card shadow-sm rounded-lg">
        <CardHeader className="border-b border-border">
          <h2 className="font-semibold text-foreground">Tasks</h2>
        </CardHeader>
        <CardContent className="p-content">
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-11 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm rounded-lg">
      <CardHeader className="border-b border-border flex-row items-center justify-between">
        <h2 className="font-semibold text-foreground">Tasks ({tasks.length})</h2>
        <Select value={grouping} onValueChange={(value: TaskGrouping) => setGrouping(value)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due">By Due Date</SelectItem>
            <SelectItem value="priority">By Priority</SelectItem>
            <SelectItem value="principal">By Principal</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {grouping === 'due' && (
            <>
              {/* Overdue */}
              {groupedTasks.overdue?.length > 0 && (
                <TaskGroup title="Overdue" count={groupedTasks.overdue.length} variant="destructive">
                  {groupedTasks.overdue.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={handleComplete} />
                  ))}
                </TaskGroup>
              )}

              {/* Today */}
              {groupedTasks.today?.length > 0 && (
                <TaskGroup title="Today" count={groupedTasks.today.length} variant="warning">
                  {groupedTasks.today.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={handleComplete} />
                  ))}
                </TaskGroup>
              )}

              {/* Tomorrow */}
              {groupedTasks.tomorrow?.length > 0 && (
                <TaskGroup title="Tomorrow" count={groupedTasks.tomorrow.length}>
                  {groupedTasks.tomorrow.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={handleComplete} />
                  ))}
                </TaskGroup>
              )}

              {/* This Week */}
              {groupedTasks.thisWeek?.length > 0 && (
                <TaskGroup title="This Week" count={groupedTasks.thisWeek.length}>
                  {groupedTasks.thisWeek.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={handleComplete} />
                  ))}
                </TaskGroup>
              )}

              {/* Later (Collapsed, Paginated) */}
              {groupedTasks.later?.length > 0 && (
                <Collapsible defaultOpen={false} onOpenChange={() => setLaterVisibleCount(10)}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-muted/50 min-h-11">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-muted-foreground">
                      Later ({groupedTasks.later.length})
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {groupedTasks.later.slice(0, laterVisibleCount).map(task => (
                      <TaskRow key={task.id} task={task} onComplete={handleComplete} />
                    ))}
                    {groupedTasks.later.length > laterVisibleCount && (
                      <Button
                        variant="ghost"
                        onClick={() => setLaterVisibleCount(prev => prev + 10)}
                        className="w-full h-11 text-sm text-muted-foreground"
                      >
                        Show next 10 ({Math.min(10, groupedTasks.later.length - laterVisibleCount)} remaining)
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}

          {grouping === 'priority' && (
            <>
              {Object.entries(groupedTasks).map(([priority, tasks]) => (
                tasks.length > 0 && (
                  <TaskGroup key={priority} title={priority.charAt(0).toUpperCase() + priority.slice(1)} count={tasks.length}>
                    {tasks.map(task => (
                      <TaskRow key={task.id} task={task} onComplete={handleComplete} />
                    ))}
                  </TaskGroup>
                )
              ))}
            </>
          )}

          {grouping === 'principal' && (
            <>
              {Object.entries(groupedTasks as Record<string, TaskWithGroup[]>).map(([principal, tasks]) => (
                <TaskGroup key={principal} title={principal} count={tasks.length}>
                  {tasks.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={handleComplete} />
                  ))}
                </TaskGroup>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskGroupProps {
  title: string;
  count: number;
  variant?: 'destructive' | 'warning';
  children: React.ReactNode;
}

function TaskGroup({ title, count, variant, children }: TaskGroupProps) {
  const textClass = variant === 'destructive' ? 'text-destructive' : variant === 'warning' ? 'text-warning' : 'text-foreground';

  return (
    <div>
      <div className={`px-3 py-2 bg-muted/30 font-medium text-sm ${textClass}`}>
        {title} ({count})
      </div>
      <div>{children}</div>
    </div>
  );
}

interface TaskRowProps {
  task: TaskWithGroup;
  onComplete: (taskId: number) => void;
}

function TaskRow({ task, onComplete }: TaskRowProps) {
  const priorityClass = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-warning text-warning-foreground',
    medium: 'bg-primary text-primary-foreground',
    low: 'bg-muted text-muted-foreground',
  }[task.priority];

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 min-h-11">
      <Checkbox
        checked={false}
        onCheckedChange={() => onComplete(task.id)}
        className="h-5 w-5"
      />
      <span className="flex-1 text-sm text-foreground">{task.title}</span>
      <span className={`px-2 py-0.5 rounded text-xs ${priorityClass}`}>
        {task.priority}
      </span>
    </div>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/TasksPanel.tsx
git commit -m "feat(dashboard): add tasks panel with grouping and pagination"
```

---

### Task 11: Quick Logger Component

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/QuickLogger.tsx`

**Step 1: Write component**

```typescript
// src/atomic-crm/dashboard/v2/components/QuickLogger.tsx
import { useState, useEffect } from 'react';
import { useCreate, useNotify, useRefresh, useGetList } from 'react-admin';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Calendar, FileText } from 'lucide-react';
import { usePrincipalContext } from '../context/PrincipalContext';

type ActivityType = 'call' | 'email' | 'meeting' | 'note';

export function QuickLogger() {
  const { selectedPrincipalId } = usePrincipalContext();
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [opportunityId, setOpportunityId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDue, setFollowUpDue] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<'medium'>('medium');

  const notify = useNotify();
  const refresh = useRefresh();
  const [createActivity] = useCreate();
  const [createTask] = useCreate();

  const { data: opportunities = [] } = useGetList('opportunities', {
    filter: {
      organization_id: selectedPrincipalId,
      stage_ne: 'closed_lost',
    },
    sort: { field: 'name', order: 'ASC' },
    pagination: { page: 1, perPage: 100 },
  }, {
    enabled: !!selectedPrincipalId,
  });

  // Reset form when principal changes
  useEffect(() => {
    setOpportunityId('');
    setSubject('');
    setDescription('');
    setCreateFollowUp(false);
  }, [selectedPrincipalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrincipalId || !subject) {
      notify('Principal and subject are required', { type: 'error' });
      return;
    }

    try {
      // Create activity
      await createActivity('activities', {
        data: {
          activity_type: activityType,
          interaction_type: activityType === 'note' ? 'check_in' : activityType,
          subject,
          description,
          organization_id: selectedPrincipalId,
          opportunity_id: opportunityId ? Number(opportunityId) : null,
        },
      });

      // Create follow-up task if checked
      if (createFollowUp && followUpTitle && followUpDue) {
        await createTask('tasks', {
          data: {
            title: followUpTitle,
            due_date: followUpDue,
            priority: followUpPriority,
            opportunity_id: opportunityId ? Number(opportunityId) : null,
            principal_id: selectedPrincipalId,
          },
        });
      }

      notify('Activity logged successfully', { type: 'success' });

      // Clear form (keep principal)
      setSubject('');
      setDescription('');
      setOpportunityId('');
      setCreateFollowUp(false);
      setFollowUpTitle('');
      setFollowUpDue('');

      refresh();
    } catch (error) {
      notify('Failed to log activity', { type: 'error' });
    }
  };

  const typeButtons: Array<{ type: ActivityType; icon: typeof Phone; label: string }> = [
    { type: 'call', icon: Phone, label: 'Call' },
    { type: 'email', icon: Mail, label: 'Email' },
    { type: 'meeting', icon: Calendar, label: 'Meeting' },
    { type: 'note', icon: FileText, label: 'Note' },
  ];

  return (
    <Card className="border-border bg-card shadow-sm rounded-lg">
      <CardHeader className="border-b border-border">
        <h2 className="font-semibold text-foreground">Quick Logger</h2>
      </CardHeader>
      <CardContent className="p-content">
        <form onSubmit={handleSubmit} className="space-y-content">
          {/* Activity Type Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {typeButtons.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                type="button"
                variant={activityType === type ? 'default' : 'outline'}
                onClick={() => setActivityType(type)}
                className="h-11 flex flex-col items-center gap-1 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>

          {/* Opportunity (Progressive Disclosure) */}
          {selectedPrincipalId && (
            <div className="space-y-2">
              <Label htmlFor="opportunity">Opportunity (optional)</Label>
              <Select value={opportunityId} onValueChange={setOpportunityId}>
                <SelectTrigger id="opportunity" className="h-11">
                  <SelectValue placeholder="Select opportunity..." />
                </SelectTrigger>
                <SelectContent>
                  {opportunities.map(opp => (
                    <SelectItem key={opp.id} value={opp.id.toString()}>
                      {opp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What happened?"
              className="h-11"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {/* Create Follow-Up Task */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Checkbox
              id="create-followup"
              checked={createFollowUp}
              onCheckedChange={(checked) => setCreateFollowUp(!!checked)}
              className="h-5 w-5"
            />
            <Label htmlFor="create-followup" className="cursor-pointer">
              Create follow-up task
            </Label>
          </div>

          {/* Follow-Up Fields (Conditional) */}
          {createFollowUp && (
            <div className="space-y-content pl-7 border-l-2 border-primary">
              <div className="space-y-2">
                <Label htmlFor="followup-title">Task Title</Label>
                <Input
                  id="followup-title"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  placeholder="Follow up on..."
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="followup-due">Due Date</Label>
                  <Input
                    id="followup-due"
                    type="date"
                    value={followUpDue}
                    onChange={(e) => setFollowUpDue(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup-priority">Priority</Label>
                  <Select value={followUpPriority} onValueChange={(value: any) => setFollowUpPriority(value)}>
                    <SelectTrigger id="followup-priority" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!selectedPrincipalId || !subject}
          >
            Log Activity
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/QuickLogger.tsx
git commit -m "feat(dashboard): add quick logger with follow-up task creation"
```

---

## Phase 4: Right Panel & Main Layout

### Task 12: Right Slide-Over Component

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx`

**Step 1: Write component**

```typescript
// src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx
import { useEffect } from 'react';
import { useGetOne, useGetList } from 'react-admin';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrefs } from '../hooks/usePrefs';
import type { TabName } from '../types';

interface RightSlideOverProps {
  opportunityId: number | null;
  onClose: () => void;
}

export function RightSlideOver({ opportunityId, onClose }: RightSlideOverProps) {
  const [activeTab, setActiveTab] = usePrefs<TabName>('pd.rightTab', 'details');

  const { data: opportunity } = useGetOne('opportunities', {
    id: opportunityId || 0,
  }, {
    enabled: !!opportunityId,
  });

  const { data: activities = [] } = useGetList('activities', {
    filter: {
      opportunity_id: opportunityId,
      deleted_at: null,
    },
    sort: { field: 'created_at', order: 'DESC' },
    pagination: { page: 1, perPage: 50 },
  }, {
    enabled: !!opportunityId,
  });

  const isOpen = !!opportunityId;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[40vw] min-w-[480px] max-w-[720px] sm:max-w-[720px]"
      >
        <SheetHeader>
          <SheetTitle>{opportunity?.name || 'Loading...'}</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">Activity History</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {opportunity && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stage</label>
                  <p className="text-base text-foreground">{opportunity.stage}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Value</label>
                  <p className="text-base text-foreground">
                    {opportunity.estimated_value ? `$${opportunity.estimated_value.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Close</label>
                  <p className="text-base text-foreground">
                    {opportunity.estimated_close_date || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2 mt-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity logged for this opportunity
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="border-l-2 border-primary pl-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{activity.subject}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <div className="text-center py-12 space-y-2">
              <p className="text-sm text-muted-foreground">File attachments coming soon</p>
              <p className="text-xs text-muted-foreground">Upload and manage opportunity files</p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx
git commit -m "feat(dashboard): add right slide-over with details and history tabs"
```

---

### Task 13: Main Dashboard Layout

**Files:**
- Create: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`

**Step 1: Write component**

```typescript
// src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
import { useState, useEffect } from 'react';
import { PrincipalProvider } from './context/PrincipalContext';
import { DashboardHeader } from './components/DashboardHeader';
import { FiltersSidebar, DEFAULT_FILTERS } from './components/FiltersSidebar';
import { OpportunitiesHierarchy } from './components/OpportunitiesHierarchy';
import { TasksPanel } from './components/TasksPanel';
import { QuickLogger } from './components/QuickLogger';
import { RightSlideOver } from './components/RightSlideOver';
import { ColumnSeparator } from './components/ColumnSeparator';
import { useResizableColumns } from './hooks/useResizableColumns';
import type { FilterState } from './types';

export default function PrincipalDashboardV2() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const { containerRef, widths, onMouseDown } = useResizableColumns([40, 30, 30]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // / - Focus global search
      if (e.key === '/') {
        e.preventDefault();
        const search = document.getElementById('global-search');
        if (search) search.focus();
      }

      // 1, 2, 3 - Scroll to columns
      if (e.key === '1') {
        document.getElementById('col-opps')?.scrollIntoView({ behavior: 'smooth' });
      }
      if (e.key === '2') {
        document.getElementById('col-tasks')?.scrollIntoView({ behavior: 'smooth' });
      }
      if (e.key === '3') {
        document.getElementById('col-log')?.scrollIntoView({ behavior: 'smooth' });
      }

      // H - Open slide-over on History tab
      if (e.key.toLowerCase() === 'h' && selectedOpportunityId) {
        // Already open, just switch tab (handled by component preference)
      }

      // Esc - Close slide-over
      if (e.key === 'Escape' && selectedOpportunityId) {
        setSelectedOpportunityId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOpportunityId]);

  return (
    <PrincipalProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        <div className="flex gap-section px-[var(--spacing-edge-desktop)] py-section">
          {/* Filters Sidebar */}
          <FiltersSidebar filters={filters} onFiltersChange={setFilters} />

          {/* 3-Column Grid */}
          <div
            ref={containerRef}
            className="flex-1 flex gap-0"
            style={{
              display: 'grid',
              gridTemplateColumns: `${widths[0]}% ${widths[1]}% ${widths[2]}%`,
            }}
          >
            {/* Column 1: Opportunities */}
            <div id="col-opps" className="pr-2">
              <OpportunitiesHierarchy
                filters={filters}
                onRowClick={(id) => setSelectedOpportunityId(id)}
              />
            </div>

            {/* Separator 1 */}
            <ColumnSeparator onMouseDown={onMouseDown(0)} />

            {/* Column 2: Tasks */}
            <div id="col-tasks" className="px-2">
              <TasksPanel />
            </div>

            {/* Separator 2 */}
            <ColumnSeparator onMouseDown={onMouseDown(1)} />

            {/* Column 3: Quick Logger */}
            <div id="col-log" className="pl-2">
              <QuickLogger />
            </div>
          </div>
        </div>

        {/* Right Slide-Over */}
        <RightSlideOver
          opportunityId={selectedOpportunityId}
          onClose={() => setSelectedOpportunityId(null)}
        />
      </div>
    </PrincipalProvider>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
git commit -m "feat(dashboard): add main v2 layout with keyboard shortcuts"
```

---

### Task 14: Feature Flag Integration

**Files:**
- Modify: `src/atomic-crm/dashboard/index.ts`

**Step 1: Read current file**

```bash
cat src/atomic-crm/dashboard/index.ts
```

**Step 2: Modify to add conditional export**

```typescript
// src/atomic-crm/dashboard/index.ts
import React from "react";

// V1 Dashboard (Current)
const CompactGridDashboard = React.lazy(() => import("./CompactGridDashboard"));

// V2 Dashboard (New)
const PrincipalDashboardV2 = React.lazy(() => import("./v2/PrincipalDashboardV2"));

// Feature flag wrapper
export default function Dashboard(props: any) {
  const params = new URLSearchParams(window.location.search);
  const isV2 = params.get('layout') === 'v2';

  return isV2 ? <PrincipalDashboardV2 {...props} /> : <CompactGridDashboard {...props} />;
}
```

**Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Test in browser**

```bash
npm run dev
```

Navigate to: `http://localhost:5173/?layout=v2`

Expected: New V2 dashboard renders

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/index.ts
git commit -m "feat(dashboard): add feature flag for v2 layout"
```

---

### Task 15: "Try New Dashboard" Banner (V1)

**Files:**
- Modify: `src/atomic-crm/dashboard/CompactGridDashboard.tsx:15` (after imports)

**Step 1: Add banner component**

Add after imports, before main component:

```typescript
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function V2Banner() {
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem('pd.v2.banner.dismissed') === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('pd.v2.banner.dismissed', 'true');
    setDismissed(true);
  };

  return (
    <Alert className="mb-4 border-primary bg-primary/10">
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm">
          <strong>New dashboard available!</strong> Try the improved 3-column layout with resizable panels.
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = '/?layout=v2'}
            className="h-9"
          >
            Try New Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-9 w-9 p-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**Step 2: Add banner to render**

In `CompactGridDashboard` component's return, add `<V2Banner />` as first child in main container.

**Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/CompactGridDashboard.tsx
git commit -m "feat(dashboard): add v2 promotion banner to v1 dashboard"
```

---

## Phase 5: Testing & QA

### Task 16: Unit Tests for Grouping Logic

**Files:**
- Create: `src/atomic-crm/dashboard/v2/utils/taskGrouping.test.ts`
- Create: `src/atomic-crm/dashboard/v2/utils/taskGrouping.ts`

**Step 1: Write failing test**

```typescript
// src/atomic-crm/dashboard/v2/utils/taskGrouping.test.ts
import { describe, it, expect } from 'vitest';
import { groupTasksByDue } from './taskGrouping';

describe('groupTasksByDue', () => {
  it('groups tasks into overdue bucket', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tasks = [
      { id: 1, due_date: yesterday.toISOString().split('T')[0], title: 'Overdue task' },
    ];

    const grouped = groupTasksByDue(tasks as any);
    expect(grouped.overdue).toHaveLength(1);
    expect(grouped.today).toHaveLength(0);
  });

  it('groups tasks into today bucket', () => {
    const today = new Date().toISOString().split('T')[0];

    const tasks = [
      { id: 1, due_date: today, title: 'Today task' },
    ];

    const grouped = groupTasksByDue(tasks as any);
    expect(grouped.today).toHaveLength(1);
  });

  it('groups tasks into later bucket for >7 days', () => {
    const tenDaysOut = new Date();
    tenDaysOut.setDate(tenDaysOut.getDate() + 10);

    const tasks = [
      { id: 1, due_date: tenDaysOut.toISOString().split('T')[0], title: 'Later task' },
    ];

    const grouped = groupTasksByDue(tasks as any);
    expect(grouped.later).toHaveLength(1);
  });
});
```

**Step 2: Run test**

```bash
npm test taskGrouping.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Implement**

```typescript
// src/atomic-crm/dashboard/v2/utils/taskGrouping.ts
import type { TaskWithGroup } from '../types';

export interface GroupedTasks {
  overdue: TaskWithGroup[];
  today: TaskWithGroup[];
  tomorrow: TaskWithGroup[];
  thisWeek: TaskWithGroup[];
  later: TaskWithGroup[];
}

export function groupTasksByDue(tasks: TaskWithGroup[]): GroupedTasks {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return {
    overdue: tasks.filter(t => new Date(t.due_date) < today),
    today: tasks.filter(t => new Date(t.due_date).toDateString() === today.toDateString()),
    tomorrow: tasks.filter(t => new Date(t.due_date).toDateString() === tomorrow.toDateString()),
    thisWeek: tasks.filter(t => {
      const due = new Date(t.due_date);
      return due > tomorrow && due <= endOfWeek;
    }),
    later: tasks.filter(t => new Date(t.due_date) > endOfWeek),
  };
}
```

**Step 4: Run test**

```bash
npm test taskGrouping.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/utils/taskGrouping.ts src/atomic-crm/dashboard/v2/utils/taskGrouping.test.ts
git commit -m "test(dashboard): add task grouping utility with tests"
```

---

### Task 17: E2E Test - Log Activity Workflow

**Files:**
- Create: `tests/e2e/dashboard-v2-activity-log.spec.ts`

**Step 1: Write E2E test**

```typescript
// tests/e2e/dashboard-v2-activity-log.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard V2 - Activity Logging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?layout=v2');
    await page.waitForLoadState('networkidle');
  });

  test('logs activity with follow-up task', async ({ page }) => {
    // Select principal
    await page.click('[aria-label="Select principal"]');
    await page.click('text=Acme Corp');

    // Navigate to Quick Logger
    await page.click('#col-log');

    // Select activity type
    await page.click('button:has-text("Email")');

    // Fill subject
    await page.fill('#subject', 'Q1 Pricing Discussion');

    // Fill description
    await page.fill('#description', 'Discussed new pricing structure for 2025');

    // Enable follow-up task
    await page.check('#create-followup');

    // Fill follow-up details
    await page.fill('#followup-title', 'Send pricing proposal');
    await page.fill('#followup-due', '2025-11-20');
    await page.selectOption('#followup-priority', 'high');

    // Submit
    await page.click('button:has-text("Log Activity")');

    // Wait for success notification
    await expect(page.locator('text=Activity logged successfully')).toBeVisible();

    // Verify form cleared (but principal remains)
    await expect(page.locator('#subject')).toHaveValue('');

    // Verify task appears in Tasks column
    await expect(page.locator('#col-tasks').locator('text=Send pricing proposal')).toBeVisible();
  });

  test('keyboard shortcut / focuses search', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.locator('#global-search')).toBeFocused();
  });

  test('keyboard shortcut 1 scrolls to opportunities', async ({ page }) => {
    await page.keyboard.press('1');
    // Check if opportunities column is in viewport
    const oppsColumn = page.locator('#col-opps');
    await expect(oppsColumn).toBeInViewport();
  });
});
```

**Step 2: Run E2E test**

```bash
npm run test:e2e dashboard-v2-activity-log.spec.ts
```

Expected: Tests may fail initially if data setup incomplete; verify test structure is correct.

**Step 3: Commit**

```bash
git add tests/e2e/dashboard-v2-activity-log.spec.ts
git commit -m "test(dashboard): add E2E tests for activity logging workflow"
```

---

### Task 18: Accessibility Audit

**Files:**
- Create: `tests/e2e/dashboard-v2-a11y.spec.ts`

**Step 1: Write accessibility test**

```typescript
// tests/e2e/dashboard-v2-a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard V2 - Accessibility', () => {
  test('meets WCAG AA standards', async ({ page }) => {
    await page.goto('/?layout=v2');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all interactive elements have 44px touch targets', async ({ page }) => {
    await page.goto('/?layout=v2');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('ARIA tree navigation works with keyboard', async ({ page }) => {
    await page.goto('/?layout=v2');

    // Focus opportunities tree
    const tree = page.locator('[role="tree"]').first();
    await tree.focus();

    // Press Right arrow to expand first customer
    await page.keyboard.press('ArrowRight');

    const firstCustomer = tree.locator('[role="treeitem"][aria-level="2"]').first();
    await expect(firstCustomer).toHaveAttribute('aria-expanded', 'true');
  });
});
```

**Step 2: Install axe**

```bash
npm install -D @axe-core/playwright
```

**Step 3: Run test**

```bash
npm run test:e2e dashboard-v2-a11y.spec.ts
```

Expected: May have violations to fix; iterate until clean.

**Step 4: Commit**

```bash
git add tests/e2e/dashboard-v2-a11y.spec.ts package.json package-lock.json
git commit -m "test(dashboard): add accessibility audit tests"
```

---

## Phase 6: Documentation & Rollout

### Task 19: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md:200-210` (Dashboard section)

**Step 1: Add V2 documentation**

Add to "Dashboard Layouts" section:

```markdown
### Principal Dashboard V2 (Feature-Flagged)

**Access:** `/?layout=v2`

**Layout:** 3-column resizable (40/30/30 default) with collapsible filters sidebar and right slide-over

**Features:**
- Opportunities hierarchy grouped by customer (top 3 auto-expand by recency)
- Tasks panel with grouping by Due/Priority/Principal
- Quick activity logger with follow-up task creation
- Right slide-over for opportunity details and activity history
- Keyboard shortcuts: `/` (search), `1-3` (columns), `H` (history), `Esc` (close)
- User preferences persisted: column widths, task grouping, last tab

**Components:**
- `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx` - Main layout
- `src/atomic-crm/dashboard/v2/components/` - 8 sub-components
- `src/atomic-crm/dashboard/v2/hooks/` - 3 custom hooks
- `src/atomic-crm/dashboard/v2/context/` - Principal selection context

**Preferences (localStorage via React Admin useStore):**
- `pd.colWidths` - Column widths [40,30,30]
- `pd.taskGrouping` - 'due' | 'priority' | 'principal'
- `pd.rightTab` - 'details' | 'history' | 'files'
- `pd.sidebarOpen` - boolean

**Rollout Plan:**
- Phase 1: Internal testing via `?layout=v2` (current)
- Phase 2: Opt-in banner in V1 dashboard
- Phase 3: Default for new users
- Phase 4: Full cutover (remove V1)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Principal Dashboard V2 documentation"
```

---

### Task 20: Create Migration Guide

**Files:**
- Create: `docs/dashboard-v2-migration.md`

**Step 1: Write migration guide**

```markdown
# Dashboard V2 Migration Guide

## For End Users

### What's New

**3-Column Resizable Layout:**
- Opportunities (left, 40%) - Hierarchical view grouped by customer
- Tasks (center, 30%) - Grouped by due date, priority, or principal
- Quick Logger (right, 30%) - Log activities with optional follow-up tasks

**Collapsible Filters:**
- Health status (Active/Cooling/At Risk)
- Assignee scope (Me/Team)
- Last touch timeframe
- Show closed opportunities toggle

**Right Slide-Over:**
- Opportunity details (stage, value, close date)
- Activity history
- Files (coming soon)

**Keyboard Shortcuts:**
- `/` - Focus global search
- `1`, `2`, `3` - Jump to columns
- `H` - Open history panel
- `Esc` - Close panels

### How to Enable

**Option 1: URL Parameter (Testing)**
Add `?layout=v2` to URL: `https://yourcrm.com/?layout=v2`

**Option 2: Banner Click (Opt-In)**
Click "Try New Dashboard" in banner at top of V1 dashboard.

**Reverting to V1:**
Add `?layout=v1` to URL or clear `pd.dashboardVersion` from localStorage.

### Known Limitations (MVP)

- Column resize disabled on mobile/tablet (<1024px)
- "Files" tab shows placeholder
- "Saved Views" shows empty state
- Assignee filter is client-side (may be slow with >500 opps)

---

## For Developers

### File Structure

```
src/atomic-crm/dashboard/v2/
├── PrincipalDashboardV2.tsx          # Main layout
├── components/
│   ├── DashboardHeader.tsx           # Breadcrumbs + principal selector
│   ├── FiltersSidebar.tsx            # Collapsible filters
│   ├── OpportunitiesHierarchy.tsx    # Tree view with customer grouping
│   ├── TasksPanel.tsx                # Grouped tasks with pagination
│   ├── QuickLogger.tsx               # Activity form + follow-up task
│   ├── RightSlideOver.tsx            # Sheet with tabs
│   └── ColumnSeparator.tsx           # Drag handle (44px)
├── context/
│   └── PrincipalContext.tsx          # Selected principal state
├── hooks/
│   ├── useFeatureFlag.ts             # ?layout=v2 detector
│   ├── usePrefs.ts                   # localStorage wrapper
│   └── useResizableColumns.ts        # Drag handlers
├── utils/
│   └── taskGrouping.ts               # Grouping logic
└── types.ts                          # TypeScript types
```

### Testing

**Unit Tests:**
```bash
npm test useFeatureFlag.test.ts
npm test usePrefs.test.ts
npm test taskGrouping.test.ts
```

**E2E Tests:**
```bash
npm run test:e2e dashboard-v2-activity-log.spec.ts
npm run test:e2e dashboard-v2-a11y.spec.ts
```

**Manual QA:**
See `docs/plans/2025-11-13-principal-dashboard-v2.md` Section 9: Testing Strategy.

### Preferences Schema

All preferences use React Admin's `useStore` (persists to localStorage):

```typescript
{
  "pd.colWidths": [40, 30, 30],               // Column widths (sum=100)
  "pd.taskGrouping": "due",                   // "due" | "priority" | "principal"
  "pd.rightTab": "details",                   // "details" | "history" | "files"
  "pd.sidebarOpen": true,                     // Filters sidebar state
  "pd.v2.banner.dismissed": "false"           // Banner dismissal
}
```

### Deployment Checklist

- [ ] Feature flag enabled in production
- [ ] E2E tests passing
- [ ] Lighthouse a11y score ≥95
- [ ] Manual QA complete (see plan Section 9)
- [ ] Migration guide published
- [ ] Internal team trained
- [ ] Rollback plan documented

### Rollback Procedure

**If critical bug discovered:**

1. **Immediate:** Change default in `dashboard/index.ts` to V1
2. **Deploy:** Hotfix PR with flag flip
3. **Monitor:** Error logs for V2-specific issues
4. **Fix:** Root cause analysis + regression test
5. **Re-enable:** After fix verified in staging

**Data Safety:** No schema changes; rollback has zero data impact.
```

**Step 2: Commit**

```bash
git add docs/dashboard-v2-migration.md
git commit -m "docs: add v2 migration guide for users and developers"
```

---

## Completion Checklist

### Development Complete
- [x] Phase 1: Foundation (hooks, types, context)
- [x] Phase 2: Core Layout (header, sidebar, separators)
- [x] Phase 3: Data Integration (opportunities, tasks, logger)
- [x] Phase 4: Right Panel (slide-over, keyboard shortcuts)
- [x] Phase 5: Testing (unit tests, E2E, a11y)
- [x] Phase 6: Documentation (CLAUDE.md, migration guide)

### QA Ready
- [ ] All unit tests passing (70% coverage minimum)
- [ ] All E2E tests passing
- [ ] Lighthouse a11y score ≥95
- [ ] Manual QA checklist complete (see plan Section 9)
- [ ] No console errors or warnings
- [ ] Touch targets verified ≥44px on all screens

### Deployment Ready
- [ ] Feature flag tested in staging
- [ ] Migration guide reviewed by PM
- [ ] Internal team demo complete
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured
- [ ] Production deployment approved

---

**Plan Status:** Complete
**Total Tasks:** 20
**Estimated Duration:** 15 days (0.5 FTE)
**Last Updated:** 2025-11-13

