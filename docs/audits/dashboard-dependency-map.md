# Dashboard V3 Component Dependency Map

**Date:** 2025-11-29
**Auditor:** Claude (Frontend Persona)
**Scope:** `src/atomic-crm/dashboard/v3/`
**Focus:** React Admin integration, prop drilling, state management, re-render triggers

---

## Executive Summary

The Dashboard V3 module follows a **clean vertical slice architecture** with:
- ✅ Shallow prop drilling (max 2 levels)
- ✅ Proper hook composition for data fetching
- ✅ Error boundary at module boundary
- ✅ No circular dependencies
- ⚠️ One deprecated component (TasksPanel)
- ⚠️ Refresh mechanism via key prop (could be improved)

---

## Component Tree

```
PrincipalDashboardV3
├── State: refreshKey, isTaskSheetOpen
├── Callbacks: handleRefresh, handleCompleteTask
│
├── KPISummaryRow [key=refreshKey]
│   └── KPICard (×4)
│       └── useKPIMetrics() → useCurrentSale() → useDataProvider()
│
├── PrincipalPipelineTable [key=refreshKey]
│   ├── State: sortField, sortDirection, searchQuery, momentumFilters
│   ├── PipelineDrillDownSheet (lazy loaded)
│   └── usePrincipalPipeline() → useDataProvider()
│
├── TasksKanbanPanel [key=refreshKey]
│   ├── TaskKanbanColumn (×3: overdue, today, thisWeek)
│   │   └── TaskKanbanCard
│   │       └── SnoozePopover (internal)
│   └── useMyTasks() → useCurrentSale() → useDataProvider()
│
├── MyPerformanceWidget [key=refreshKey]
│   └── useMyPerformance() → useCurrentSale() → useDataProvider()
│
├── ActivityFeedPanel [key=refreshKey]
│   └── useTeamActivities() → useDataProvider()
│
├── LogActivityFAB
│   ├── Props: onRefresh
│   └── QuickLogForm (in Sheet)
│       ├── useCurrentSale() → useDataProvider()
│       └── useGetList() (contacts, orgs, opportunities)
│
├── MobileQuickActionBar
│   ├── Props: onRefresh, onCompleteTask
│   └── QuickLogForm (in Sheet)
│
└── TaskCompleteSheet
    ├── Props: open, onOpenChange, onRefresh
    └── useMyTasks() → useDataProvider()
```

---

## Prop Drilling Analysis

### Depth: 2 levels (ACCEPTABLE)

| Prop | Origin | Path | Purpose |
|------|--------|------|---------|
| `onRefresh` | PrincipalDashboardV3 | → LogActivityFAB → QuickLogForm | Trigger dashboard refresh |
| `onRefresh` | PrincipalDashboardV3 | → MobileQuickActionBar → QuickLogForm | Trigger dashboard refresh |
| `onRefresh` | PrincipalDashboardV3 | → TaskCompleteSheet | Trigger dashboard refresh |
| `onCompleteTask` | PrincipalDashboardV3 | → MobileQuickActionBar | Open task completion sheet |

**Assessment:** Prop drilling is minimal and justified. No need for Context API.

---

## Data Flow Patterns

### React Admin Integration

All data access goes through React Admin's data provider:

```
Component
    ↓
useMyTasks() / useKPIMetrics() / etc.
    ↓
useDataProvider() [React Admin]
    ↓
unifiedDataProvider.ts
    ↓
Supabase
```

**Key Pattern:** Custom hooks wrap `useDataProvider()` to provide domain-specific transformations.

### State Management Approach

| Type | Solution | Components |
|------|----------|------------|
| Server state | React Admin + useGetList/useDataProvider | All data hooks |
| Local UI state | useState | Sort, filter, selection states |
| Form state | react-hook-form + Zod | QuickLogForm |
| Cross-component | Key-based refresh | refreshKey pattern |

### Refresh Mechanism

**Current Pattern:** Key prop forces unmount/remount
```typescript
<KPISummaryRow key={`kpi-${refreshKey}`} />
```

**Pros:**
- Simple implementation
- Guaranteed fresh data

**Cons:**
- Loses internal component state
- More expensive than refetch

**Alternative (Future Improvement):**
```typescript
// Use callback-based refresh
const { refetch } = useKPIMetrics();
// Or use React Query's invalidation
```

---

## Hook Dependency Graph

```
useCurrentSale
├── useRef (session cache)
└── supabase.auth.getUser()

useKPIMetrics
├── useDataProvider
├── useCurrentSale
└── useState (metrics, loading, error)

useMyTasks
├── useDataProvider
├── useCurrentSale
└── useState (tasks, loading, error)
    └── useCallback (completeTask, snoozeTask, etc.)

usePrincipalPipeline
├── useDataProvider
└── useState (data, loading, error)

useMyPerformance
├── useDataProvider
├── useCurrentSale
└── useState (metrics, loading, error)

useTeamActivities
├── useDataProvider
└── useState (activities, loading, error)

useHybridSearch (QuickLogForm internal)
├── useGetList
└── useState (debounced search)
```

---

## Re-render Triggers

### High Impact Components

| Component | Re-render Triggers | Mitigations |
|-----------|-------------------|-------------|
| PrincipalDashboardV3 | refreshKey change | useCallback for handlers |
| QuickLogForm | form.watch() | Consolidated watch calls |
| TasksKanbanPanel | tasks change | useMemo for tasksByColumn |
| PrincipalPipelineTable | data/filter change | useMemo for filtered/sorted data |

### Memoization Patterns

**PrincipalPipelineTable.tsx:**
```typescript
// Filter data memoized
const filteredData = useMemo(() => {
  if (!data || data.length === 0) return data;
  // ... filtering logic
}, [data, searchQuery, momentumFilters]);

// Sort data memoized
const sortedData = useMemo(() => {
  if (!filteredData || filteredData.length === 0) return filteredData;
  // ... sorting logic
}, [filteredData, sortField, sortDirection]);
```

**QuickLogForm.tsx:**
```typescript
// Consolidated form.watch() calls at component top
const selectedOpportunityId = form.watch("opportunityId");
const selectedContactId = form.watch("contactId");
const selectedOrganizationId = form.watch("organizationId");
const activityType = form.watch("activityType");
const createFollowUp = form.watch("createFollowUp");
```

---

## Circular Dependencies

**Analysis Method:** Import graph inspection
**Result:** ✅ No circular dependencies detected

```
Types flow:
types.ts → components/* (one-way)
types.ts → hooks/* (one-way)

Hooks flow:
useCurrentSale → (used by other hooks, not importing them)
useKPIMetrics → useCurrentSale (one-way)
useMyTasks → useCurrentSale (one-way)
```

---

## Orphaned Components

| Component | Status | Reason |
|-----------|--------|--------|
| TasksPanel | ⚠️ ORPHANED | Replaced by TasksKanbanPanel, only used in tests |
| TaskGroup | ⚠️ ORPHANED | Only used by TasksPanel |
| SnoozePopover | ✅ INTERNAL | Used by TasksPanel and TaskKanbanCard |

**Recommendation:** Mark TasksPanel as deprecated, do not delete until tests are migrated.

---

## Error Boundary Coverage

```
App.tsx
└── ErrorBoundary (global)
    └── CRM.tsx
        └── DashboardErrorBoundary
            └── PrincipalDashboardV3
                └── Components (covered by boundary)
```

**Coverage:** ✅ All dashboard components protected by DashboardErrorBoundary

---

## Bundle Impact

### Lazy Loading

| Component | Lazy Loaded | Bundle Savings |
|-----------|-------------|----------------|
| PrincipalDashboardV3 | ✅ Yes (index.ts) | Main chunk reduced |
| PipelineDrillDownSheet | ✅ Yes (dynamic import) | ~3-5KB |
| QuickLogForm | ❌ No | Included in LogActivityFAB |

**Recommendation:** Consider lazy loading QuickLogForm since it's only rendered when FAB/Sheet is opened.

---

## Recommendations

### Priority 1: Architecture (No immediate action)
- Current architecture is sound
- Prop drilling is acceptable
- No need for Context API overhead

### Priority 2: Performance
1. **Add lazy loading to QuickLogForm** in LogActivityFAB:
   ```typescript
   const QuickLogForm = lazy(() => import("./QuickLogForm"));
   ```

2. **Consider refetch callback** instead of key-based refresh:
   ```typescript
   // Instead of: key={`kpi-${refreshKey}`}
   // Use: useKPIMetrics with refetch exposed
   ```

### Priority 3: Cleanup
3. **Deprecate TasksPanel** - Add deprecation notice
4. **Update barrel exports** - Remove TasksPanel from components/index.ts

---

## Component Size Summary

| Component | LOC | Status |
|-----------|-----|--------|
| QuickLogForm.tsx | 1,166 | ❌ God component |
| PrincipalPipelineTable.tsx | 456 | ⚠️ Large |
| TasksPanel.tsx | 342 | ⚠️ Near limit (orphaned) |
| useMyTasks.ts | 319 | ⚠️ Near limit |
| TaskKanbanCard.tsx | 318 | ⚠️ Near limit |
| TaskCompleteSheet.tsx | 309 | ⚠️ Near limit |
| MobileQuickActionBar.tsx | 296 | ✅ OK |
| LogActivityFAB.tsx | 293 | ✅ OK |
| useMyPerformance.ts | 292 | ✅ OK |
| ActivityFeedPanel.tsx | 288 | ✅ OK |
| TasksKanbanPanel.tsx | 277 | ✅ OK |
| SnoozePopover.tsx | 250 | ✅ OK |

---

## Conclusion

The Dashboard V3 module demonstrates **excellent component architecture** with:

1. **Clean separation of concerns** - Data hooks, UI components, types
2. **Minimal prop drilling** - Max 2 levels, justified
3. **Proper React Admin integration** - All data through dataProvider
4. **No circular dependencies** - Clean import graph
5. **Error boundary protection** - All components covered

**Primary concern:** QuickLogForm at 1,166 lines needs refactoring into smaller composable units.

---

## Visual Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PrincipalDashboardV3                            │
│  State: refreshKey, isTaskSheetOpen                                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
    ┌─────────────┬───────────┼───────────┬─────────────┬─────────────┐
    ▼             ▼           ▼           ▼             ▼             ▼
┌───────┐   ┌─────────┐   ┌───────┐   ┌───────┐   ┌─────────┐   ┌─────────┐
│KPISumm│   │Pipeline │   │Tasks  │   │MyPerf │   │Activity │   │Mobile   │
│aryRow │   │Table    │   │Kanban │   │Widget │   │Feed     │   │QuickBar │
└───┬───┘   └────┬────┘   └───┬───┘   └───┬───┘   └────┬────┘   └────┬────┘
    │            │            │           │            │             │
    ▼            ▼            ▼           ▼            ▼             ▼
┌───────┐   ┌─────────┐   ┌───────┐   ┌───────┐   ┌─────────┐   ┌─────────┐
│useKPI │   │usePrinc │   │useMy  │   │useMy  │   │useTeam  │   │QuickLog │
│Metrics│   │Pipeline │   │Tasks  │   │Perform│   │Activities│   │Form     │
└───┬───┘   └────┬────┘   └───┬───┘   └───┬───┘   └────┬────┘   └────┬────┘
    │            │            │           │            │             │
    └────────────┴────────────┴───────────┴────────────┴─────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  useDataProvider  │
                    │  (React Admin)    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │unifiedDataProvider│
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │     Supabase      │
                    └───────────────────┘
```
