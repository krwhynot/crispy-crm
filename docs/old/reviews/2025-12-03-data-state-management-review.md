# Data & State Management Code Review Report

**Date:** 2025-12-03
**Scope:** All source files in `src/` related to TanStack Query, React Admin ra-core, and @hello-pangea/dnd
**Method:** 3 parallel agents + external validation (Gemini 2.5 Pro)

---

## Executive Summary

This review identified **27 issues** across data and state management patterns, with **11 Critical**, **11 High**, and **5 Medium/Low** severity findings. The primary violations are:

1. **Manual data fetching** (8 files) - Using `useState` + `useEffect` instead of React Admin's `useGetList` hook
2. **Missing screen reader announcements** (6 issues) - Both Kanban boards violate accessibility requirements
3. **Missing HttpError usage** (14+ locations) - Data provider throws plain `Error` instead of React Admin's `HttpError`

**Positive findings:** `retry: false` correctly configured (fail-fast), `provided.placeholder` present in all Droppables, excellent optimistic update patterns in some hooks.

---

## Agent Results

### Agent 1: TanStack Query v5 Patterns
**Issues Found:** 8 Critical, 3 Medium, 2 Low

| Severity | Issue | Files Affected |
|----------|-------|----------------|
| Critical | Manual loading state anti-pattern | 8 files |
| Medium | Missing signal forwarding | 2 files |
| Medium | Missing query key factories | Codebase-wide |
| Medium | Incomplete optimistic updates | Multiple mutations |
| Low | Inconsistent staleTime | Various |
| Low | Potential state duplication | useMyTasks.ts |

### Agent 2: React Admin ra-core v5.10.0 Patterns
**Issues Found:** 3 Critical, 5 High

| Severity | Issue | Files Affected |
|----------|-------|----------------|
| Critical | Direct Supabase imports | 2 files |
| Critical | Missing HttpError | 14+ locations |
| High | Manual data fetching | 4 files |

### Agent 3: @hello-pangea/dnd v18.0.1 Accessibility
**Issues Found:** 0 Critical, 6 High

| Severity | Issue | Files Affected |
|----------|-------|----------------|
| High | Missing onDragStart announce | 2 Kanban boards |
| High | Missing onDragUpdate announce | 2 Kanban boards |
| High | Missing onDragEnd announce | 2 Kanban boards |

### External Validation (Gemini 2.5 Pro)
**Additional Recommendations:**
- Decompose mixed slices before migration (separate server state from client state)
- Establish state placement heuristic for developers
- Use phased rollout approach for migrations

---

## Consolidated Findings by Severity

### Critical (Blocks Merge / Must Fix for MVP)

| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|
| 1 | Manual loading state | `useTeamActivities.ts:59-61` | TanStack | Replace with `useGetList` |
| 2 | Manual loading state | `ChangeLogTab.tsx:47-48` | TanStack | Replace with `useGetList` |
| 3 | Manual loading state | `OrganizationOpportunitiesTab.tsx:28-30` | TanStack | Replace with `useGetList` |
| 4 | Manual loading state | `OrganizationContactsTab.tsx:26-28` | TanStack | Replace with `useGetList` |
| 5 | Manual loading state | `usePrincipalPipeline.ts:12-14` | TanStack | Replace with `useGetList` |
| 6 | Manual loading state | `usePrincipalOpportunities.ts:37-39` | TanStack | Replace with `useGetList` |
| 7 | Manual loading state | `useMyTasks.ts:21-23` | TanStack | Replace with `useGetList` |
| 8 | Manual loading state | `CurrentSaleContext.tsx:40-42` | TanStack | Replace with `useQuery` |
| 9 | Direct Supabase import | `useCurrentSale.ts:2` | ra-core | Use auth provider |
| 10 | Direct Supabase import | `CurrentSaleContext.tsx:19` | ra-core | Use auth provider |
| 11 | Missing HttpError | `unifiedDataProvider.ts` (9+ locations) | ra-core | Use `HttpError` from ra-core |

### High (Should Fix Before MVP)

| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|
| 1 | Missing HttpError | `customMethodsExtension.ts:492-505` | ra-core | Use `HttpError` |
| 2 | Missing HttpError | `StorageService.ts` (5 locations) | ra-core | Use `HttpError` |
| 3 | Missing onDragStart announce | `OpportunityListContent.tsx:264` | dnd | Add `provided.announce()` |
| 4 | Missing onDragUpdate announce | `OpportunityListContent.tsx:264` | dnd | Add `provided.announce()` |
| 5 | Missing onDragEnd announce | `OpportunityListContent.tsx:189` | dnd | Add `provided.announce()` |
| 6 | Missing onDragStart announce | `TasksKanbanPanel.tsx:247` | dnd | Add `provided.announce()` |
| 7 | Missing onDragUpdate announce | `TasksKanbanPanel.tsx:247` | dnd | Add `provided.announce()` |
| 8 | Missing onDragEnd announce | `TasksKanbanPanel.tsx:100` | dnd | Add `provided.announce()` |

### Medium (Fix When Convenient)

| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|
| 1 | Missing signal forwarding | `ActivityLog.tsx:24-27` | TanStack | Pass `signal` to queryFn |
| 2 | Missing signal forwarding | `DigestPreferences.tsx:49-53` | TanStack | Pass `signal` to queryFn |
| 3 | Missing query key factories | Codebase-wide | TanStack | Create `src/lib/queryKeys.ts` |

### Low (Optional / Nice to Have)

| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|
| 1 | Inconsistent staleTime | Various useGetList calls | TanStack | Standardize to 5 min |
| 2 | Potential state duplication | `useMyTasks.ts:21,142` | TanStack | Derive from query data |

---

## Positive Findings (What's Done Right)

| Pattern | Location | Status |
|---------|----------|--------|
| `retry: false` in QueryClient | `src/tests/setup.ts:101,109` | ✅ Correct (fail-fast) |
| `provided.placeholder` in Droppables | All Droppable components | ✅ Present |
| No nested DragDropContext | All Kanban implementations | ✅ Correct |
| Optimistic updates with rollback | `useMyTasks.ts:167-283` | ✅ Excellent pattern |
| `previousData` in mutations | 28+ instances codebase-wide | ✅ Correct |
| Zod→React Admin error transform | `withValidation.ts:70-83` | ✅ Correct |
| `staleTime: 5 * 60 * 1000` | `useSimilarOpportunityCheck.ts:136` | ✅ Correct |
| isDragging/isDraggingOver styling | All Kanban cards/columns | ✅ Good UX |
| React.memo optimization | OpportunityColumn, TaskKanbanColumn | ✅ Performance |

---

## Prioritized Recommendations

### Priority 1: Manual Data Fetching Migration (8 files)
**Effort:** 4-6 hours | **Impact:** High

Replace all `useState` + `useEffect` data fetching with `useGetList`:

```tsx
// BEFORE (WRONG)
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
  dataProvider.getList(...).then(setData);
}, []);

// AFTER (CORRECT)
const { data = [], isLoading: loading } = useGetList('resource', {
  pagination: { page: 1, perPage: 25 },
  sort: { field: 'created_at', order: 'DESC' },
  filter: { ... }
}, {
  staleTime: 5 * 60 * 1000
});
```

### Priority 2: Screen Reader Announcements (2 files)
**Effort:** 2-3 hours | **Impact:** Critical for accessibility

Add `provided.announce()` to both Kanban boards:

```tsx
<DragDropContext
  onDragStart={(start, provided) => {
    const item = getItemById(start.draggableId);
    provided.announce(`Picked up ${item.name}. Currently in ${stageName}.`);
  }}
  onDragUpdate={(update, provided) => {
    if (update.destination) {
      provided.announce(`Moving to ${destName}, position ${update.destination.index + 1}`);
    }
  }}
  onDragEnd={(result, provided) => {
    if (result.destination) {
      provided.announce(`Dropped in ${destName} at position ${result.destination.index + 1}`);
    } else {
      provided.announce('Drag cancelled. Returned to original position.');
    }
  }}
>
```

### Priority 3: HttpError Migration (14+ locations)
**Effort:** 2-3 hours | **Impact:** Medium (form validation)

Replace all `throw new Error()` with `HttpError`:

```tsx
// BEFORE (WRONG)
throw new Error('Upload failed');

// AFTER (CORRECT)
import { HttpError } from 'react-admin';
throw new HttpError('Upload failed', 500);
throw new HttpError('File too large', 413);
throw new HttpError('Validation failed', 400, { errors: { field: 'message' } });
```

### Priority 4: Query Key Factories (Codebase-wide)
**Effort:** 1-2 hours | **Impact:** Low (maintainability)

Create `src/lib/queryKeys.ts`:

```tsx
export const queryKeys = {
  activities: {
    all: ['activities'] as const,
    lists: () => [...queryKeys.activities.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.activities.lists(), { filters }] as const,
    detail: (id: number) => [...queryKeys.activities.all, 'detail', id] as const,
  },
  // ... other resources
};
```

---

## Files Requiring Changes

| File | Issues | Priority |
|------|--------|----------|
| `useTeamActivities.ts` | Manual state | P1 |
| `ChangeLogTab.tsx` | Manual state | P1 |
| `OrganizationOpportunitiesTab.tsx` | Manual state | P1 |
| `OrganizationContactsTab.tsx` | Manual state | P1 |
| `usePrincipalPipeline.ts` | Manual state | P1 |
| `usePrincipalOpportunities.ts` | Manual state | P1 |
| `useMyTasks.ts` | Manual state | P1 |
| `CurrentSaleContext.tsx` | Manual state, Direct Supabase | P1 |
| `useCurrentSale.ts` | Direct Supabase | P1 |
| `OpportunityListContent.tsx` | Missing announce | P2 |
| `TasksKanbanPanel.tsx` | Missing announce | P2 |
| `unifiedDataProvider.ts` | Missing HttpError | P3 |
| `customMethodsExtension.ts` | Missing HttpError | P3 |
| `StorageService.ts` | Missing HttpError | P3 |

---

## Conclusion

The codebase has solid foundations (fail-fast principle, Zod validation, optimistic updates) but has drifted from idiomatic React Admin + TanStack Query patterns in data fetching. The accessibility violations in Kanban boards should be addressed before shipping if WCAG compliance is a goal.

**Total estimated effort:** 10-14 hours to address all Critical and High issues.

---

*Generated by Claude Code parallel review system*
*Reviewed by: TanStack Query Agent, React Admin Agent, @hello-pangea/dnd Agent*
*Validated by: Gemini 2.5 Pro*
