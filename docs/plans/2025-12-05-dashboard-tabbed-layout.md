# Implementation Plan: Dashboard Tabbed Layout

**Date:** 2025-12-05
**Type:** UI Enhancement
**Scope:** Dashboard v3 bottom sections
**Execution:** Hybrid (parallel where possible)
**Estimated Tasks:** 8 atomic tasks (2-5 min each)

---

## Overview

Replace the vertically stacked bottom sections (My Tasks, My Performance, Team Activity) with a tabbed interface to reduce scrolling and improve focus on iPad devices.

### Before
```
┌─────────────────────────────────────┐
│ KPI Cards                           │
├─────────────────────────────────────┤
│ Pipeline by Principal Table         │
├─────────────────────────────────────┤
│ My Tasks (Kanban)        ← SCROLL   │
├─────────────────────────────────────┤
│ My Performance | Team Activity      │
└─────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────┐
│ KPI Cards                           │
├─────────────────────────────────────┤
│ Pipeline by Principal Table         │
├─────────────────────────────────────┤
│ [My Tasks (3)] [Performance] [Team] │
│ ════════════                        │
│ Selected tab content only           │
└─────────────────────────────────────┘
```

---

## Zen MCP Review Findings (Applied)

| Finding | Severity | Resolution |
|---------|----------|------------|
| **forceMount for state preservation** | Medium | Added `forceMount` to all TabsContent - preserves kanban drag state, prevents data refetch |
| **Async test handling** | Low | Updated tests to use `waitFor` and `findBy*` for Suspense boundaries |
| **Keyboard navigation test** | Low | Added test for arrow key + Enter navigation |
| **URL state sync** | Optional | Deferred - can add later if deep linking is needed |

---

## Architecture Decision

### Why Radix Tabs (Existing Component)

The codebase already has `src/components/ui/tabs.tsx` built on `@radix-ui/react-tabs`. We will reuse this rather than creating a new component.

**Benefits:**
- Accessible by default (ARIA, keyboard navigation)
- Already styled with semantic Tailwind v4 tokens
- Used elsewhere in codebase (ContactShow, OrganizationShow)

---

## Task Dependency Graph

```
STAGE 1 (Parallel - No Dependencies)
├── Task 1: Create DashboardTabPanel component
├── Task 2: Create useTaskCount hook for badge
└── Task 3: Add barrel export

STAGE 2 (Parallel - Depends on Stage 1)
├── Task 4: Update TasksKanbanPanel (remove Card wrapper)
├── Task 5: Update MyPerformanceWidget (remove Card wrapper)
└── Task 6: Update ActivityFeedPanel (remove Card wrapper)

STAGE 3 (Sequential - Depends on Stage 2)
├── Task 7: Integrate DashboardTabPanel into PrincipalDashboardV3
└── Task 8: Add component test

STAGE 4 (Sequential - Cleanup after verification)
├── Task 9: Remove unused imports from PrincipalDashboardV3
├── Task 10: Delete deprecated TasksPanel.tsx and TaskGroup.tsx
└── Task 11: Run lint, type-check, and verify build
```

---

## Stage 1: Create New Components (PARALLEL)

### Task 1: Create DashboardTabPanel Component

**File:** `src/atomic-crm/dashboard/v3/components/DashboardTabPanel.tsx`

**Time:** 5 min

**Code:**
```tsx
'use client';

import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTaskCount } from '../hooks/useTaskCount';
import { CheckSquare, TrendingUp, Users } from 'lucide-react';

// Lazy load tab content for performance
const TasksKanbanPanel = lazy(() => import('./TasksKanbanPanel'));
const MyPerformanceWidget = lazy(() => import('./MyPerformanceWidget'));
const ActivityFeedPanel = lazy(() => import('./ActivityFeedPanel'));

interface DashboardTabPanelProps {
  salesId: string;
}

function TabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function DashboardTabPanel({ salesId }: DashboardTabPanelProps) {
  const { pendingCount, isLoading } = useTaskCount(salesId);

  return (
    <Card className="flex-1">
      <Tabs defaultValue="tasks" className="w-full">
        <div className="border-b border-border px-4 pt-4">
          <TabsList className="h-11 w-full justify-start gap-2 bg-transparent p-0">
            {/* My Tasks Tab - 44px touch target */}
            <TabsTrigger
              value="tasks"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <CheckSquare className="h-4 w-4" />
              <span>My Tasks</span>
              {!isLoading && pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>

            {/* Performance Tab */}
            <TabsTrigger
              value="performance"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>

            {/* Team Activity Tab */}
            <TabsTrigger
              value="activity"
              className="h-11 min-w-[120px] gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Users className="h-4 w-4" />
              <span>Team Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0">
          {/* Tasks Tab Content - forceMount preserves kanban state */}
          <TabsContent value="tasks" className="m-0 focus-visible:ring-0" forceMount>
            <Suspense fallback={<TabSkeleton />}>
              <TasksKanbanPanel salesId={salesId} />
            </Suspense>
          </TabsContent>

          {/* Performance Tab Content - forceMount prevents refetch */}
          <TabsContent value="performance" className="m-0 focus-visible:ring-0" forceMount>
            <Suspense fallback={<TabSkeleton />}>
              <MyPerformanceWidget />
            </Suspense>
          </TabsContent>

          {/* Team Activity Tab Content - forceMount preserves scroll */}
          <TabsContent value="activity" className="m-0 focus-visible:ring-0" forceMount>
            <Suspense fallback={<TabSkeleton />}>
              <ActivityFeedPanel />
            </Suspense>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

export default DashboardTabPanel;
```

**Constitution Checklist:**
- [x] No retry logic or circuit breakers
- [x] Semantic colors only (border-primary, border-border)
- [x] Touch targets 44px (h-11)
- [x] Lazy loading for performance
- [x] Using existing UI components

---

### Task 2: Create useTaskCount Hook

**File:** `src/atomic-crm/dashboard/v3/hooks/useTaskCount.ts`

**Time:** 3 min

**Code:**
```typescript
import { useGetList } from 'react-admin';

interface UseTaskCountResult {
  pendingCount: number;
  isLoading: boolean;
}

/**
 * Returns count of pending tasks for badge display.
 * Uses server-side pagination (perPage: 1) for efficient counting.
 */
export function useTaskCount(salesId: string): UseTaskCountResult {
  const { total, isLoading } = useGetList(
    'tasks',
    {
      pagination: { page: 1, perPage: 1 },
      filter: {
        assigned_to: salesId,
        status: 'pending',
        'deleted_at@is': null,
      },
    },
    {
      enabled: !!salesId,
      staleTime: 30_000, // 30 seconds
    }
  );

  return {
    pendingCount: total ?? 0,
    isLoading,
  };
}
```

**Constitution Checklist:**
- [x] No retry logic
- [x] Uses React Admin data provider (single entry point)
- [x] Server-side pagination for efficiency

---

### Task 3: Add Barrel Exports

**File:** `src/atomic-crm/dashboard/v3/components/index.ts`

**Time:** 1 min

**Action:** Add export for new component

**Code to Add:**
```typescript
// Add to existing exports
export { DashboardTabPanel } from './DashboardTabPanel';
```

**File:** `src/atomic-crm/dashboard/v3/hooks/index.ts`

**Code to Add:**
```typescript
// Add to existing exports
export { useTaskCount } from './useTaskCount';
```

---

## Stage 2: Update Existing Components (SEQUENTIAL)

### Task 4: Update TasksKanbanPanel

**File:** `src/atomic-crm/dashboard/v3/components/TasksKanbanPanel.tsx`

**Time:** 3 min

**Change:** Remove outer Card wrapper (parent DashboardTabPanel provides it)

**Before:**
```tsx
return (
  <Card>
    <CardHeader>
      <CardTitle>My Tasks</CardTitle>
      ...
    </CardHeader>
    <CardContent>
      {/* Kanban content */}
    </CardContent>
  </Card>
);
```

**After:**
```tsx
return (
  <div className="p-4">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">My Tasks</h3>
        <p className="text-sm text-muted-foreground">
          Drag tasks between columns to reschedule
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={handleNewTask}>
        <Plus className="mr-2 h-4 w-4" />
        New Task
      </Button>
    </div>
    {/* Kanban columns unchanged */}
  </div>
);
```

**Also:** Add default export for lazy loading:
```tsx
export default TasksKanbanPanel;
```

---

### Task 5: Update MyPerformanceWidget

**File:** `src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx`

**Time:** 2 min

**Change:** Remove outer Card wrapper, keep internal layout

**Before:**
```tsx
return (
  <Card>
    <CardHeader>
      <CardTitle>My Performance</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Metrics grid */}
    </CardContent>
  </Card>
);
```

**After:**
```tsx
return (
  <div className="p-4">
    <div className="mb-4">
      <h3 className="text-lg font-semibold">My Performance</h3>
      <p className="text-sm text-muted-foreground">
        Compared to last week
      </p>
    </div>
    {/* Metrics grid unchanged */}
  </div>
);
```

**Also:** Add default export for lazy loading:
```tsx
export default MyPerformanceWidget;
```

---

### Task 6: Update ActivityFeedPanel

**File:** `src/atomic-crm/dashboard/v3/components/ActivityFeedPanel.tsx`

**Time:** 2 min

**Change:** Remove outer Card wrapper

**Before:**
```tsx
return (
  <Card>
    <CardHeader>
      <CardTitle>Team Activity</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Activity list */}
    </CardContent>
  </Card>
);
```

**After:**
```tsx
return (
  <div className="p-4">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Team Activity</h3>
        <p className="text-sm text-muted-foreground">
          Recent activities across the team
        </p>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/activities">View All →</Link>
      </Button>
    </div>
    {/* Activity list unchanged */}
  </div>
);
```

**Also:** Add default export for lazy loading:
```tsx
export default ActivityFeedPanel;
```

---

## Stage 3: Integration (SEQUENTIAL)

### Task 7: Integrate into PrincipalDashboardV3

**File:** `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`

**Time:** 5 min

**Change:** Replace stacked sections with DashboardTabPanel

**Find this section (approximately lines 80-120):**
```tsx
{/* Current: Stacked sections */}
<div className="space-y-6">
  <TasksKanbanPanel salesId={salesId} />
  <div className="grid gap-6 lg:grid-cols-2">
    <MyPerformanceWidget />
    <ActivityFeedPanel />
  </div>
</div>
```

**Replace with:**
```tsx
{/* New: Tabbed interface */}
<DashboardTabPanel salesId={salesId} />
```

**Also update imports at top of file:**
```tsx
// Remove these imports (now lazy-loaded inside DashboardTabPanel):
// import { TasksKanbanPanel } from './components/TasksKanbanPanel';
// import { MyPerformanceWidget } from './components/MyPerformanceWidget';
// import { ActivityFeedPanel } from './components/ActivityFeedPanel';

// Add this import:
import { DashboardTabPanel } from './components/DashboardTabPanel';
```

---

### Task 8: Add Component Test

**File:** `src/atomic-crm/dashboard/v3/components/__tests__/DashboardTabPanel.test.tsx`

**Time:** 5 min

**Code:**
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardTabPanel } from '../DashboardTabPanel';

// Mock the hooks
vi.mock('../../hooks/useTaskCount', () => ({
  useTaskCount: () => ({ pendingCount: 3, isLoading: false }),
}));

// Mock lazy-loaded components
vi.mock('../TasksKanbanPanel', () => ({
  default: () => <div data-testid="tasks-panel">Tasks Content</div>,
}));

vi.mock('../MyPerformanceWidget', () => ({
  default: () => <div data-testid="performance-widget">Performance Content</div>,
}));

vi.mock('../ActivityFeedPanel', () => ({
  default: () => <div data-testid="activity-feed">Activity Content</div>,
}));

describe('DashboardTabPanel', () => {
  const defaultProps = {
    salesId: 'test-sales-id',
  };

  it('renders all three tabs', () => {
    render(<DashboardTabPanel {...defaultProps} />);

    expect(screen.getByRole('tab', { name: /my tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /team activity/i })).toBeInTheDocument();
  });

  it('shows task count badge', () => {
    render(<DashboardTabPanel {...defaultProps} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('defaults to tasks tab and loads content', async () => {
    render(<DashboardTabPanel {...defaultProps} />);

    const tasksTab = screen.getByRole('tab', { name: /my tasks/i });
    expect(tasksTab).toHaveAttribute('data-state', 'active');

    // Wait for lazy-loaded content (Suspense boundary)
    await waitFor(() => {
      expect(screen.getByTestId('tasks-panel')).toBeInTheDocument();
    });
  });

  it('switches to performance tab on click', async () => {
    const user = userEvent.setup();
    render(<DashboardTabPanel {...defaultProps} />);

    // Wait for initial content
    await screen.findByTestId('tasks-panel');

    await user.click(screen.getByRole('tab', { name: /performance/i }));

    const performanceTab = screen.getByRole('tab', { name: /performance/i });
    expect(performanceTab).toHaveAttribute('data-state', 'active');

    // Wait for lazy-loaded performance content
    await waitFor(() => {
      expect(screen.getByTestId('performance-widget')).toBeInTheDocument();
    });

    // With forceMount, tasks content should still be in DOM (hidden)
    expect(screen.getByTestId('tasks-panel')).toBeInTheDocument();
  });

  it('has accessible touch targets (44px)', () => {
    render(<DashboardTabPanel {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      // h-11 = 44px
      expect(tab).toHaveClass('h-11');
    });
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DashboardTabPanel {...defaultProps} />);

    // Focus first tab
    const tasksTab = screen.getByRole('tab', { name: /my tasks/i });
    tasksTab.focus();

    // Arrow right to next tab
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /performance/i })).toHaveFocus();

    // Enter to activate
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: /performance/i })).toHaveAttribute('data-state', 'active');
  });
});
```

---

## Stage 4: Cleanup (SEQUENTIAL)

### Task 9: Remove Unused Imports from PrincipalDashboardV3

**File:** `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`

**Time:** 2 min

**Action:** Remove direct imports that are now lazy-loaded inside DashboardTabPanel

**Remove these imports:**
```tsx
// DELETE these lines - components are now lazy-loaded in DashboardTabPanel
import { TasksKanbanPanel } from './components/TasksKanbanPanel';
import { MyPerformanceWidget } from './components/MyPerformanceWidget';
import { ActivityFeedPanel } from './components/ActivityFeedPanel';
```

**Also remove if present:**
```tsx
// DELETE - no longer needed if only used by removed sections
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Keep Card imports ONLY if used elsewhere in the file (e.g., KPI section)
```

**Verification:**
```bash
# Run ESLint to catch any remaining unused imports
npx eslint src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx --fix
```

---

### Task 10: Delete Deprecated Components

**Files to DELETE:**
- `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx` (old list view, replaced by kanban)
- `src/atomic-crm/dashboard/v3/components/TaskGroup.tsx` (used by TasksPanel)

**Time:** 2 min

**Commands:**
```bash
# Delete deprecated files
rm src/atomic-crm/dashboard/v3/components/TasksPanel.tsx
rm src/atomic-crm/dashboard/v3/components/TaskGroup.tsx
```

**Also update barrel export:**

**File:** `src/atomic-crm/dashboard/v3/components/index.ts`

**Remove these exports if present:**
```tsx
// DELETE these lines
export { TasksPanel } from './TasksPanel';
export { TaskGroup } from './TaskGroup';
```

**Verification:**
```bash
# Ensure no files import the deleted components
grep -r "TasksPanel\|TaskGroup" src/atomic-crm/dashboard/v3/ --include="*.tsx" --include="*.ts"
# Should return empty (no matches)
```

---

### Task 11: Verify Build and Lint

**Time:** 3 min

**Commands:**
```bash
# 1. TypeScript type check
npx tsc --noEmit

# 2. ESLint check
npx eslint src/atomic-crm/dashboard/v3/ --ext .ts,.tsx

# 3. Build verification
npm run build

# 4. Run tests
npm test -- --testPathPattern="dashboard/v3"
```

**Expected Output:**
- TypeScript: No errors
- ESLint: No errors (warnings acceptable)
- Build: Successful
- Tests: All passing

**If errors occur:**
- TypeScript errors → Fix type imports/exports
- ESLint errors → Run `--fix` flag
- Build errors → Check for circular dependencies
- Test errors → Update mocks if component signatures changed

---

## Execution Order Summary

| Stage | Tasks | Execution | Depends On |
|-------|-------|-----------|------------|
| **1** | Tasks 1, 2, 3 | PARALLEL | None |
| **2** | Tasks 4, 5, 6 | PARALLEL | Stage 1 |
| **3** | Tasks 7, 8 | SEQUENTIAL | Stage 2 |
| **4** | Tasks 9, 10, 11 | SEQUENTIAL | Stage 3 (verified working) |

**Total Estimated Time:** 30-35 minutes

---

## Rollback Plan

If issues arise:

**Before Stage 4 (cleanup not started):**
1. Revert Task 7 changes to `PrincipalDashboardV3.tsx`
2. Revert Card wrappers in Tasks 4, 5, 6
3. New files (Tasks 1, 2) can be deleted without impact

**After Stage 4 (cleanup completed):**
1. Use git to restore deleted files:
   ```bash
   git checkout HEAD~1 -- src/atomic-crm/dashboard/v3/components/TasksPanel.tsx
   git checkout HEAD~1 -- src/atomic-crm/dashboard/v3/components/TaskGroup.tsx
   ```
2. Revert `PrincipalDashboardV3.tsx` to use stacked layout
3. Restore Card wrappers in individual components
4. Remove `DashboardTabPanel.tsx` and `useTaskCount.ts`

**Quick Rollback (git):**
```bash
# If on a feature branch, reset to before changes
git stash
git checkout main
git branch -D feature/dashboard-tabs  # if needed
```

---

## Verification Checklist

After implementation, verify:

- [ ] All three tabs render correctly
- [ ] Task count badge shows accurate count
- [ ] Tab switching is smooth (no layout shift)
- [ ] Touch targets are 44px on iPad
- [ ] Lazy loading works (check Network tab)
- [ ] No console errors
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] Screen reader announces tab changes

---

## Constitution Compliance

| Principle | Status |
|-----------|--------|
| No retry logic | ✅ |
| Fail fast | ✅ |
| Semantic colors only | ✅ |
| 44px touch targets | ✅ |
| React Admin components | ✅ (data layer) |
| Zod at API boundary | N/A (no new validation) |
| Single data provider | ✅ (useGetList) |
