# Dashboard Component Dependency Map

**Generated:** 2025-11-29
**Module:** `src/atomic-crm/dashboard/v3/`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CRM.tsx (Entry Point)                              │
│                                                                              │
│   ┌─────────────────────┐                                                    │
│   │ DashboardErrorBoundary │ ← Class component, Sentry integration          │
│   │   └─ PrincipalDashboardV3 │ ← Main dashboard (96 LOC) ✅                 │
│   └─────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   KPISummaryRow      │  │ PrincipalPipelineTable│  │   TasksKanbanPanel   │
│   (59 LOC) ✅        │  │   (456 LOC) ⚠️       │  │   (277 LOC) ✅       │
│                      │  │                      │  │                      │
│   └─ KPICard ×4      │  │   └─ usePrincipalPipeline │  │   └─ useMyTasks    │
│      (198 LOC)       │  │   └─ PipelineDrillDownSheet │ │   └─ TaskKanbanColumn ×3│
│   └─ useKPIMetrics   │  │      (lazy, 230 LOC)      │  │      (167 LOC)    │
│      (189 LOC)       │  │                           │  │      └─ TaskKanbanCard│
└──────────────────────┘  └───────────────────────────┘  │         (318 LOC) │
                                                         └──────────────────┘
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  MyPerformanceWidget │  │   ActivityFeedPanel  │  │     LogActivityFAB   │
│   (208 LOC) ✅       │  │   (288 LOC) ✅       │  │     (293 LOC) ✅     │
│                      │  │                      │  │                      │
│   └─ useMyPerformance│  │   └─ useTeamActivities│ │   └─ QuickLogForm    │
│      (292 LOC)       │  │      (118 LOC)       │  │      (1167 LOC) 🔴   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
                                                              │
                                    ┌─────────────────────────┼───────────────┐
                                    │                         │               │
                                    ▼                         ▼               ▼
                         ┌──────────────────┐      ┌──────────────────┐ ┌─────────────┐
                         │  useCurrentSale  │      │ useHybridSearch  │ │activitySchema│
                         │   (86 LOC) ✅    │      │   (165 LOC) ✅   │ │ (113 LOC) ⚠️│
                         └──────────────────┘      └──────────────────┘ └─────────────┘
```

---

## Component Tree (Depth-First)

### PrincipalDashboardV3 (Root)
```
PrincipalDashboardV3.tsx (96 LOC)
├── Props: none
├── State: refreshKey, isTaskSheetOpen
├── Callbacks: handleRefresh (memoized), handleCompleteTask (memoized)
│
├── KPISummaryRow (key={`kpi-${refreshKey}`})
│   ├── Props: none
│   └── Children: 4× KPICard
│       └── useKPIMetrics (hook)
│           └── useCurrentSale (hook)
│
├── PrincipalPipelineTable (key={`pipeline-${refreshKey}`})
│   ├── Props: none
│   ├── State: myPrincipalsOnly, selectedPrincipal, sortField, sortDirection
│   ├── usePrincipalPipeline (hook)
│   │   └── useCurrentSale (hook)
│   └── Children: PipelineDrillDownSheet (lazy-loaded, Suspense)
│       └── usePrincipalOpportunities (hook)
│           └── useCurrentSale (hook)
│
├── TasksKanbanPanel (key={`tasks-${refreshKey}`})
│   ├── Props: none
│   ├── useMyTasks (hook)
│   │   └── useCurrentSale (hook)
│   └── Children: 3× TaskKanbanColumn
│       └── Children: n× TaskKanbanCard
│           └── Props: task, onComplete, onSnooze, onDelete, onView
│
├── MyPerformanceWidget (key={`performance-${refreshKey}`})
│   ├── Props: none
│   └── useMyPerformance (hook)
│       └── useCurrentSale (hook)
│
├── ActivityFeedPanel (key={`activities-${refreshKey}`})
│   ├── Props: limit={10}
│   └── useTeamActivities (hook)
│
├── LogActivityFAB
│   ├── Props: onRefresh
│   └── Children: QuickLogForm (in Sheet)
│       ├── Props: onComplete, onRefresh, initialDraft, onDraftChange
│       ├── useCurrentSale (hook)
│       └── useForm (React Hook Form)
│
├── MobileQuickActionBar
│   ├── Props: onRefresh, onCompleteTask
│   └── (opens TaskCompleteSheet)
│
└── TaskCompleteSheet
    ├── Props: open, onOpenChange, onRefresh
    └── useMyTasks (hook - re-fetches tasks)
```

---

## Data Flow Analysis

### React Admin Integration Points

| Hook | Data Source | React Admin Method |
|------|-------------|-------------------|
| usePrincipalPipeline | `principal_pipeline_summary` | `dataProvider.getList()` |
| useMyTasks | `tasks` | `dataProvider.getList()`, `update()`, `delete()` |
| useKPIMetrics | `opportunities`, `tasks`, `activities` | `dataProvider.getList()` ×3 |
| useMyPerformance | `opportunities`, `tasks`, `activities` | `dataProvider.getList()` ×8 |
| useTeamActivities | `activities` | `dataProvider.getList()` |
| usePrincipalOpportunities | `opportunities` | `dataProvider.getList()` |
| QuickLogForm | `contacts`, `organizations`, `opportunities`, `activities`, `tasks` | `useGetList()`, `dataProvider.create()` ×2 |

### State Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STATE OWNERSHIP MAP                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PrincipalDashboardV3 (PARENT)                                          │
│  ├─ refreshKey: number            ← Triggers data re-fetch across all   │
│  └─ isTaskSheetOpen: boolean      ← TaskCompleteSheet visibility        │
│                                                                          │
│  PrincipalPipelineTable (ISOLATED)                                       │
│  ├─ myPrincipalsOnly: boolean     ← Filter toggle                       │
│  ├─ selectedPrincipal: obj|null   ← Drill-down sheet trigger           │
│  ├─ sortField: SortField          ← Table sorting                       │
│  ├─ sortDirection: SortDirection                                        │
│  ├─ searchQuery: string           ← Client-side filter                  │
│  └─ momentumFilters: Set          ← Momentum filter chips               │
│                                                                          │
│  TasksKanbanPanel (ISOLATED)                                             │
│  └─ (no local state - delegates to useMyTasks)                          │
│                                                                          │
│  LogActivityFAB (ISOLATED)                                               │
│  └─ isOpen: boolean               ← Sheet visibility                    │
│                                                                          │
│  QuickLogForm (COMPLEX - 1167 LOC)                                       │
│  ├─ contactOpen: boolean          ← Popover state                       │
│  ├─ orgOpen: boolean              ← Popover state                       │
│  ├─ oppOpen: boolean              ← Popover state                       │
│  ├─ contactSearch.*               ← Debounced search state              │
│  ├─ orgSearch.*                   ← Debounced search state              │
│  ├─ oppSearch.*                   ← Debounced search state              │
│  └─ form.* (React Hook Form)      ← All form field values               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Prop Drilling Analysis

### Depth: Maximum 3 levels ✅

```
PrincipalDashboardV3
└─ onRefresh ─────────┬─ LogActivityFAB
                      │    └─ QuickLogForm (onRefresh)     [Depth: 2]
                      │
                      ├─ MobileQuickActionBar
                      │    └─ (no further drilling)        [Depth: 1]
                      │
                      └─ TaskCompleteSheet
                           └─ (uses onRefresh directly)    [Depth: 1]
```

### Props Interface Summary

| Component | Props | Prop Drilling Concern |
|-----------|-------|----------------------|
| KPISummaryRow | none | ✅ Self-contained |
| PrincipalPipelineTable | none | ✅ Self-contained |
| TasksKanbanPanel | none | ✅ Self-contained |
| MyPerformanceWidget | none | ✅ Self-contained |
| ActivityFeedPanel | `limit` | ✅ Simple config |
| LogActivityFAB | `onRefresh` | ✅ Single callback |
| MobileQuickActionBar | `onRefresh`, `onCompleteTask` | ✅ Two callbacks |
| TaskCompleteSheet | `open`, `onOpenChange`, `onRefresh` | ✅ Standard sheet pattern |
| QuickLogForm | `onComplete`, `onRefresh`, `initialDraft`, `onDraftChange` | ⚠️ 4 props but acceptable |

**Verdict:** No significant prop drilling issues. Components are well-isolated.

---

## Re-render Triggers

### Optimized Patterns ✅

1. **refreshKey pattern** - Parent increments key, forces clean re-mount:
   ```tsx
   <PrincipalPipelineTable key={`pipeline-${refreshKey}`} />
   ```
   ✅ Correct: Avoids stale closure issues, guarantees fresh data fetch

2. **Memoized callbacks** - Prevents unnecessary child re-renders:
   ```tsx
   const handleRefresh = useCallback(() => {
     setRefreshKey((prev) => prev + 1);
   }, []);
   ```

3. **Stable empty arrays** - Hooks return stable references:
   ```tsx
   const EMPTY_TASKS: TaskItem[] = [];
   const [tasks, setTasks] = useState<TaskItem[]>(EMPTY_TASKS);
   ```

### Potential Issues ⚠️

1. **QuickLogForm.tsx:150** - `form.watch()` without dependency optimization:
   ```tsx
   const formValues = form.watch(); // Re-renders on EVERY field change
   ```
   **Impact:** High - triggers effect + onDraftChange on every keystroke
   **Fix:** Debounce draft persistence or use `watch` with specific fields

2. **Multiple `form.watch()` calls** - Lines 160-164:
   ```tsx
   const selectedOpportunityId = form.watch("opportunityId");
   const selectedContactId = form.watch("contactId");
   const selectedOrganizationId = form.watch("organizationId");
   const activityType = form.watch("activityType");
   const createFollowUp = form.watch("createFollowUp");
   ```
   **Impact:** Medium - Each watch() subscribes independently
   **Fix:** Single destructured watch: `const { opportunityId, contactId, ... } = form.watch()`

---

## Circular Dependencies

### Analysis: ✅ NONE DETECTED

Checked imports using grep pattern analysis. No cycles found.

**Import Direction (all unidirectional):**
```
PrincipalDashboardV3
├── imports ← components/
├── imports ← hooks/
└── imports ← types

components/
├── imports ← hooks/
├── imports ← types
├── imports ← validation/ (QuickLogForm only)
└── imports ← @/components/ui/

hooks/
├── imports ← types
└── imports ← hooks/useCurrentSale (shared)
```

---

## Orphaned Components

| Component | Exported | Used | Status |
|-----------|----------|------|--------|
| TaskGroup | Yes | No | ⚠️ Orphaned |
| TasksPanel | Yes | No (tests only) | ⚠️ Orphaned |
| SnoozePopover | Yes | TasksPanel only | ⚠️ Orphaned (transitively) |

**TasksPanel Replacement:** `TasksKanbanPanel` has replaced `TasksPanel` as the main tasks view. `TasksPanel` is only imported in tests.

**Recommended Action:**
- Remove `TasksPanel` and `SnoozePopover` if Kanban is permanent replacement
- OR mark `TasksPanel` as deprecated in JSDoc for potential future use

---

## Missing Error Boundaries

### Current Coverage:

| Boundary | Scope | Covers |
|----------|-------|--------|
| DashboardErrorBoundary | Dashboard root | All dashboard children |

### Recommendation:

Consider adding granular error boundaries for:
1. **TasksKanbanPanel** - Drag-drop errors shouldn't crash dashboard
2. **QuickLogForm** - Form submission errors isolated

```tsx
// Suggested pattern
<DashboardErrorBoundary>
  <PrincipalDashboardV3 />
</DashboardErrorBoundary>

// Inside PrincipalDashboardV3:
<TasksErrorBoundary>
  <TasksKanbanPanel />
</TasksErrorBoundary>
```

---

## Summary Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Total Components | 18 | - |
| Total Hooks | 8 | - |
| Max Component Depth | 4 | ✅ Reasonable |
| Max Prop Drilling | 2 levels | ✅ Acceptable |
| Circular Dependencies | 0 | ✅ Clean |
| Orphaned Components | 3 | ⚠️ Cleanup needed |
| Missing Error Boundaries | Possible 2 | 🟡 Consider adding |
| God Components (>300 LOC) | 6 | 🔴 Refactor needed |

---

## Visual Component Hierarchy

```
src/atomic-crm/dashboard/
├── index.ts                          # Re-exports v3
└── v3/
    ├── index.ts                      # Public API
    ├── PrincipalDashboardV3.tsx      # Root (96 LOC) ✅
    ├── DashboardErrorBoundary.tsx    # Error boundary (126 LOC) ✅
    ├── types.ts                      # Shared types (69 LOC) ✅
    │
    ├── components/
    │   ├── index.ts                  # Barrel exports
    │   ├── KPISummaryRow.tsx         # (59 LOC) ✅
    │   ├── KPICard.tsx               # (198 LOC) ✅
    │   ├── PrincipalPipelineTable.tsx# (456 LOC) ⚠️
    │   ├── PipelineDrillDownSheet.tsx# (230 LOC) ✅
    │   ├── TasksKanbanPanel.tsx      # (277 LOC) ✅
    │   ├── TaskKanbanColumn.tsx      # (167 LOC) ✅
    │   ├── TaskKanbanCard.tsx        # (318 LOC) ⚠️
    │   ├── TasksPanel.tsx            # (342 LOC) ⚠️ ORPHANED
    │   ├── TaskGroup.tsx             # (51 LOC) ⚠️ ORPHANED
    │   ├── SnoozePopover.tsx         # (250 LOC) ⚠️ ORPHANED
    │   ├── TaskCompleteSheet.tsx     # (309 LOC) ⚠️
    │   ├── MyPerformanceWidget.tsx   # (208 LOC) ✅
    │   ├── ActivityFeedPanel.tsx     # (288 LOC) ✅
    │   ├── LogActivityFAB.tsx        # (293 LOC) ✅
    │   ├── MobileQuickActionBar.tsx  # (296 LOC) ✅
    │   └── QuickLogForm.tsx          # (1167 LOC) 🔴 CRITICAL
    │
    ├── hooks/
    │   ├── index.ts                  # Barrel exports
    │   ├── useCurrentSale.ts         # (86 LOC) ✅ SHARED
    │   ├── usePrincipalPipeline.ts   # (93 LOC) ✅
    │   ├── usePrincipalOpportunities.ts # (99 LOC) ✅
    │   ├── useMyTasks.ts             # (319 LOC) ⚠️
    │   ├── useKPIMetrics.ts          # (189 LOC) ✅
    │   ├── useTeamActivities.ts      # (118 LOC) ✅
    │   ├── useMyPerformance.ts       # (292 LOC) ⚠️
    │   └── useHybridSearch.ts        # (165 LOC) ✅
    │
    ├── validation/
    │   └── activitySchema.ts         # (113 LOC) ⚠️ DUPLICATE
    │
    └── utils/
        └── showFollowUpToast.tsx     # Toast helper
```

**Legend:**
- ✅ Good (<300 LOC, clean)
- ⚠️ Warning (300-500 LOC or has issues)
- 🔴 Critical (>500 LOC or major issues)
