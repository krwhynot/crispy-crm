# Dashboard Test Coverage Gap Analysis

**Date:** 2025-11-29
**Auditor:** Claude (Architect Persona)
**Scope:** `src/atomic-crm/dashboard/v3/` test coverage
**Target Coverage:** 80%+ on business logic
**Framework:** Vitest + React Testing Library

---

## Executive Summary

The Dashboard V3 module has **15 test files** but significant gaps exist:

1. **Unit tests for KPI calculations** - PARTIALLY COVERED
2. **Integration tests for data fetching** - WEAK
3. **E2E tests for critical user flows** - NOT ASSESSED (separate Playwright suite)
4. **Failing tests** - 10 tests in `QuickLogForm.cascading.test.tsx` due to mock issues

**Overall Assessment:** Test infrastructure exists but has coverage gaps in business-critical areas.

---

## Existing Test Files

### Dashboard V3 Test Inventory

| File | Tests | Status | Coverage Area |
|------|-------|--------|---------------|
| `__tests__/DashboardErrorBoundary.test.tsx` | ~3 | PASSING | Error handling UI |
| `__tests__/PrincipalPipelineFiltering.test.tsx` | ~5 | PASSING | Filter state |
| `__tests__/types.test.ts` | 2 | PASSING | Type validation |
| `__tests__/PipelineDrillDown.test.tsx` | ~4 | PASSING | Drill-down sheet |
| `__tests__/usePrincipalOpportunities.test.ts` | ~5 | PASSING | Opportunities hook |
| `__tests__/TaskSnooze.test.tsx` | ~4 | PASSING | Snooze functionality |
| `__tests__/PrincipalDashboardV3.test.tsx` | ~8 | PASSING | Main dashboard |
| `__tests__/performance.benchmark.test.tsx` | ~10 | PASSING | Performance benchmarks |
| `hooks/__tests__/useCurrentSale.test.ts` | ~4 | PASSING | Auth hook |
| `components/__tests__/QuickLogForm.simple.test.tsx` | ~6 | PASSING | Form basics |
| `components/__tests__/QuickLogForm.cascading.test.tsx` | 10 | **FAILING** | Cascading filters |
| `components/__tests__/MobileQuickActionBar.test.tsx` | ~5 | PASSING | Mobile actions |
| `components/__tests__/PrincipalPipelineTable.test.tsx` | ~6 | PASSING | Pipeline table |
| `components/__tests__/TasksPanel.test.tsx` | ~8 | PASSING | Tasks panel |
| `components/__tests__/TaskCompleteSheet.test.tsx` | ~4 | PASSING | Task completion |

**Total: ~84 tests, 10 failing**

---

## Gap 1: KPI Calculation Unit Tests

### Current State

`useKPIMetrics.ts` performs 4 KPI calculations:
1. **Open Opportunities Count** - Counts non-closed opportunities
2. **Overdue Tasks Count** - Uses `total` from API response
3. **Activities This Week** - Uses `total` from API response
4. **Stale Deals Count** - Complex: uses `isOpportunityStale()` with per-stage thresholds

### Test Coverage

| KPI | Calculation Logic | Unit Test? | Integration Test? |
|-----|-------------------|------------|-------------------|
| Open Opportunities | `opportunities.length` | NO | WEAK |
| Overdue Tasks | `tasksResult.value.total` | NO | NO |
| Activities This Week | `activitiesResult.value.total` | NO | NO |
| Stale Deals | `isOpportunityStale()` | **YES** (via `stalenessCalculation.ts` tests) | NO |

### Gaps

1. **No unit tests** for `useKPIMetrics` hook directly
2. **No edge case tests**:
   - What happens when one API call fails (Promise.allSettled)?
   - What happens when `total` is undefined?
   - What if `salesLoading` is true but `salesId` is stale?

### Recommended Tests

```typescript
// useKPIMetrics.test.ts (NEW FILE)
describe("useKPIMetrics", () => {
  it("should return 0 for all metrics when user is logged out");
  it("should calculate openOpportunitiesCount from data length, not amount");
  it("should handle partial failures from Promise.allSettled");
  it("should use per-stage staleness thresholds (new_lead=7d, initial_outreach=14d)");
  it("should exclude closed_won and closed_lost from stale count");
  it("should refetch when refetch() is called");
});
```

---

## Gap 2: Staleness Calculation Edge Cases

### Current State

`isOpportunityStale()` is extracted to `@/atomic-crm/utils/stalenessCalculation.ts` and has separate tests.

### Gaps in Dashboard Integration

The dashboard uses staleness calculation in `useKPIMetrics`:

```typescript
staleDealsCount = opportunities.filter(
  (opp: { stage: string; last_activity_date?: string | null }) =>
    isOpportunityStale(opp.stage, opp.last_activity_date ?? null, today)
).length;
```

**Missing tests:**
- What happens when `last_activity_date` is `null` for all stages?
- What happens when `last_activity_date` is malformed ISO string?
- Per-stage threshold boundary conditions (exactly 7 days for new_lead)

---

## Gap 3: `useMyTasks` Hook Tests

### Current State

`useMyTasks.ts` is **NOT TESTED** despite containing:
- Task status calculation (overdue/today/tomorrow/upcoming/later)
- Optimistic UI updates (snooze, complete, delete)
- Rollback logic on API failures

### Missing Test File

No `useMyTasks.test.ts` exists.

### Critical Untested Functions

| Function | Complexity | Risk |
|----------|------------|------|
| `calculateStatus(dueDate)` | Medium | Date edge cases |
| `snoozeTask(taskId)` | High | Optimistic update + rollback |
| `deleteTask(taskId)` | High | Optimistic update + rollback |
| `updateTaskDueDate(taskId, newDueDate)` | High | Kanban drag-drop |
| `rollbackTask(taskId, previousState)` | Low | State restoration |

### Recommended Tests

```typescript
// hooks/__tests__/useMyTasks.test.ts (NEW FILE)
describe("useMyTasks", () => {
  describe("calculateStatus", () => {
    it("returns 'overdue' for dates before today");
    it("returns 'today' for today's date");
    it("returns 'tomorrow' for tomorrow's date");
    it("returns 'upcoming' for dates within 7 days");
    it("returns 'later' for dates beyond 7 days");
    it("handles timezone edge cases at midnight");
  });

  describe("snoozeTask", () => {
    it("optimistically updates local state");
    it("rolls back on API failure");
    it("moves task to end of following day");
  });

  describe("completeTask", () => {
    it("removes task from local state");
    it("sends completed_at timestamp");
  });
});
```

---

## Gap 4: Failing Tests - QuickLogForm Cascading

### Current State

10 tests in `QuickLogForm.cascading.test.tsx` are **FAILING**:

```
× [vitest] No "SelectGroup" export is defined on the "@/components/ui/select" mock
```

### Root Cause

The mock for `@/components/ui/select` is missing the `SelectGroup`, `SelectLabel`, and `SelectSeparator` exports that `QuickLogForm.tsx` uses.

### Fix Required

Update mock in test file:

```typescript
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  // MISSING - add these:
  SelectGroup: ({ children }: any) => <div>{children}</div>,
  SelectLabel: ({ children }: any) => <span>{children}</span>,
  SelectSeparator: () => <hr />,
}));
```

---

## Gap 5: No Tests for `useKPIMetrics` or `usePrincipalPipeline`

### Current State

| Hook | Has Tests? | Complexity |
|------|------------|------------|
| `useCurrentSale.ts` | YES | Low |
| `useKPIMetrics.ts` | NO | High |
| `useMyTasks.ts` | NO | High |
| `usePrincipalPipeline.ts` | NO | Medium |
| `usePrincipalOpportunities.ts` | YES | Medium |
| `useTeamActivities.ts` | NO | Medium |
| `useMyPerformance.ts` | NO | Low |
| `useHybridSearch.ts` | NO | High |

**4 high-complexity hooks have NO tests.**

---

## Gap 6: Integration Tests for Data Fetching

### Current State

Most tests mock `useGetList` and `useDataProvider` entirely, meaning:
- No testing of actual filter construction
- No testing of pagination logic
- No testing of sort behavior

### Recommended Approach

Create integration tests using MSW (Mock Service Worker) to test actual data provider behavior:

```typescript
// __tests__/integration/dashboard-data-fetching.test.tsx
describe("Dashboard Data Fetching Integration", () => {
  it("fetches opportunities with correct stage@not_in filter");
  it("fetches tasks filtered by sales_id and completed=false");
  it("fetches activities within correct week boundaries");
  it("handles API errors gracefully without crashing dashboard");
});
```

---

## Gap 7: E2E Test Coverage (Playwright)

### Current State

E2E tests exist in `tests/e2e/` but were not assessed in this audit. Dashboard-specific E2E flows should cover:

1. **Activity logging flow** - FAB → QuickLogForm → Submit → Toast
2. **Task snooze flow** - Click snooze → Select duration → Verify bucket move
3. **Pipeline drill-down** - Click principal → Sheet opens → Opportunities listed
4. **KPI click-through** - Click "Stale Deals" → Navigate to filtered list

---

## Recommendations

### Immediate Fixes (P0)

1. **Fix failing `QuickLogForm.cascading.test.tsx`** - Add missing mock exports
2. **Add `useMyTasks.test.ts`** - Critical hook with optimistic updates

### Short-term (P1)

3. **Add `useKPIMetrics.test.ts`** - Business-critical calculations
4. **Add `usePrincipalPipeline.test.ts`** - Filter logic validation
5. **Add edge case tests for staleness calculation**

### Medium-term (P2)

6. **Create integration test suite** with MSW
7. **Add E2E tests** for activity logging and task management flows
8. **Achieve 80%+ coverage** on hooks directory

---

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test files in dashboard/v3 | 15 | 20+ |
| Failing tests | 10 | 0 |
| Hooks with tests | 2/8 (25%) | 8/8 (100%) |
| KPI calculation tests | 0 | 6+ |
| Integration tests | 0 | 4+ |

---

## Test File Template

For missing hook tests:

```typescript
// hooks/__tests__/use[HookName].test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { use[HookName] } from "../use[HookName]";

// Mock dependencies
vi.mock("react-admin", () => ({
  useDataProvider: () => mockDataProvider,
}));

const mockDataProvider = {
  getList: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe("use[HookName]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state", async () => {
    const { result } = renderHook(() => use[HookName]());
    expect(result.current.loading).toBe(true);
  });

  // Add specific tests...
});
```

---

## References

- Vitest Config: `vitest.config.ts`
- Coverage Thresholds: 70% lines/functions/branches/statements
- Testing Patterns: `.claude/skills/engineering-constitution/resources/testing-patterns.md`
