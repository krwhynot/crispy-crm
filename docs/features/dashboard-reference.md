# Dashboard Reference

> Complete reference for dashboard widgets, data sources, and aggregation logic.
>
> **Entry Point:** `src/atomic-crm/dashboard/index.tsx`
> **Main Component:** `PrincipalDashboardV3.tsx`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CurrentSaleProvider                          │
│  (Caches salesId - eliminates 4+ redundant queries per load)   │
├─────────────────────────────────────────────────────────────────┤
│  PrincipalDashboardV3                                           │
│  ├── KPISummaryRow (4 metric cards)                            │
│  └── DashboardTabPanel                                          │
│      ├── Pipeline Tab → PrincipalPipelineTable                  │
│      ├── Tasks Tab → TasksKanbanPanel                           │
│      ├── Performance Tab → MyPerformanceWidget                  │
│      └── Activity Tab → ActivityFeedPanel                       │
├─────────────────────────────────────────────────────────────────┤
│  LogActivityFAB (Floating Action Button)                        │
│  MobileQuickActionBar (Mobile/Tablet navigation)                │
│  DashboardTutorial (Onboarding overlay)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Widget Inventory

### 1. KPI Summary Row

**Component:** `src/atomic-crm/dashboard/KPISummaryRow.tsx`
**Hook:** `src/atomic-crm/dashboard/useKPIMetrics.ts`

Displays 4 key performance indicators in a horizontal row above the main dashboard.

#### Metrics & Data Queries

| Metric | Query | Aggregation | Notes |
|--------|-------|-------------|-------|
| **Open Opportunities** | `getList('opportunities', { filter: { 'stage@not_in': ['closed_won', 'closed_lost'] } })` | Server-side count via `total` | Uses `perPage: 1` optimization |
| **Overdue Tasks** | `getList('tasks', { filter: { sales_id, completed: false, 'due_date@lt': today } })` | Server-side count via `total` | Filtered by current user |
| **Activities This Week** | `getList('activities', { filter: { 'activity_date@gte': weekStart, 'activity_date@lte': weekEnd } })` | Server-side count via `total` | Monday-Sunday week |
| **Stale Deals** | `getList('opportunities', { filter: { 'stage@not_in': [...], 'last_activity_date@lt': staleThresholdDate } })` | Client-side filter using `isOpportunityStale()` | Per-stage thresholds applied |

#### Staleness Calculation Logic

```typescript
// src/atomic-crm/utils/stalenessCalculation.ts
const STAGE_STALE_THRESHOLDS: Record<ActivePipelineStage, number> = {
  new_lead: 7,           // 7 days without activity
  initial_outreach: 14,  // 14 days
  sample_visit_offered: 14,
  feedback_logged: 21,   // Longest threshold - allow time for evaluation
  demo_scheduled: 14,
};

// Closed stages (closed_won, closed_lost) are NEVER stale
function isOpportunityStale(stage, lastActivityDate, referenceDate) {
  const threshold = getStaleThreshold(stage);
  if (threshold === undefined) return false; // Closed stage
  if (!lastActivityDate) return true;        // No activity = stale
  return daysSince(lastActivityDate) > threshold;
}
```

#### Refresh Behavior
- **Initial:** On component mount
- **Trigger:** `refreshKey` state change from parent
- **Cache:** No client-side cache (fresh on each mount)
- **Error Handling:** `Promise.allSettled` - partial failures don't break dashboard

---

### 2. Pipeline by Principal Table

**Component:** `src/atomic-crm/dashboard/PrincipalPipelineTable.tsx`
**Hook:** `src/atomic-crm/dashboard/usePrincipalPipeline.ts`

Aggregated pipeline view showing opportunity metrics per principal (manufacturer).

#### Data Query

```typescript
useGetList<PipelineSummaryRow>('principal_pipeline_summary', {
  filter: myPrincipalsOnly ? { sales_id: salesId } : {},
  sort: { field: 'active_this_week', order: 'DESC' },
  pagination: { page: 1, perPage: 100 },
}, {
  staleTime: 5 * 60 * 1000, // 5-minute cache
});
```

#### Response Shape (Database View)

```typescript
interface PipelineSummaryRow {
  principal_id: number;
  principal_name: string;
  total_pipeline: number;      // Count of active opportunities
  active_this_week: number;    // Activities Mon-Sun current week
  active_last_week: number;    // Activities Mon-Sun previous week
  momentum: 'increasing' | 'steady' | 'decreasing' | 'stale';
  next_action_summary: string | null; // Earliest pending action
  sales_id?: number;           // For "My Principals Only" filter
}
```

#### Features

| Feature | Implementation |
|---------|----------------|
| **Sorting** | Client-side via `usePipelineTableState` hook (name, pipeline, activity, momentum) |
| **Search** | Client-side filter on `principal_name` |
| **Momentum Filter** | Multi-select dropdown (increasing, steady, decreasing, stale) |
| **My Principals Only** | Server-side filter via `sales_id` |
| **Drill-Down** | Click row → Opens `PipelineDrillDownSheet` (lazy-loaded) |

#### Momentum Calculation

Momentum is calculated server-side in the `principal_pipeline_summary` database view:
- **Increasing:** `active_this_week > active_last_week`
- **Steady:** `active_this_week == active_last_week`
- **Decreasing:** `active_this_week < active_last_week && active_this_week > 0`
- **Stale:** `active_this_week == 0`

---

### 3. Tasks Kanban Panel

**Component:** `src/atomic-crm/dashboard/TasksKanbanPanel.tsx`
**Hook:** `src/atomic-crm/dashboard/useMyTasks.ts`

Drag-and-drop kanban board for task management with time-horizon columns.

#### Data Query

```typescript
useGetList<TaskApiResponse>('tasks', {
  filter: {
    sales_id: salesId,
    completed: false,
    'deleted_at@is': null,
  },
  sort: { field: 'due_date', order: 'ASC' },
  pagination: { page: 1, perPage: 100 },
  meta: {
    expand: ['opportunity', 'contact', 'organization'],
  },
}, {
  enabled: !salesLoading && !!salesId,
  staleTime: 5 * 60 * 1000, // 5-minute cache
});
```

#### Column Grouping Logic

```typescript
function calculateStatus(dueDate: Date): TaskStatus {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  if (isBefore(dueDate, today)) return 'overdue';
  if (isSameDay(dueDate, today)) return 'today';
  if (isSameDay(dueDate, tomorrow)) return 'tomorrow';
  if (isBefore(dueDate, nextWeek)) return 'upcoming';
  return 'later'; // Not shown in kanban
}
```

| Column | Status Values | Visual |
|--------|---------------|--------|
| **Overdue** | `overdue` | Destructive/red accent |
| **Today** | `today` | Primary accent |
| **This Week** | `tomorrow`, `upcoming` | Muted |

#### Drag-Drop Behavior

Target due dates when dropping into column:
- **Overdue:** Keep current date (acknowledge it's overdue)
- **Today:** Today at 5:00 PM (end of business)
- **This Week:** 3 days from now at 5:00 PM

#### Optimistic Updates

All operations use optimistic UI with rollback:

```typescript
// Pattern used for completeTask, snoozeTask, deleteTask, updateTaskDueDate
const optimisticUpdates = useState<Map<number, Partial<TaskItem>>>();

// 1. Apply optimistic update immediately
setOptimisticUpdates(prev => prev.set(taskId, { deleted: true }));

// 2. Make API call
await dataProvider.update('tasks', { id, data, previousData });

// 3a. On success: clear optimistic state (server data takes over)
// 3b. On error: rollback optimistic state
```

---

### 4. My Performance Widget

**Component:** `src/atomic-crm/dashboard/MyPerformanceWidget.tsx`
**Hook:** `src/atomic-crm/dashboard/useMyPerformance.ts`

Personal performance metrics with week-over-week trend comparison.

#### Data Queries (8 Parallel)

| Metric | Current Week Query | Previous Week Query |
|--------|-------------------|---------------------|
| **Activities** | `getList('activities', { filter: { created_by: salesId, activity_date: thisWeek } })` | Same with `lastWeek` date range |
| **Tasks Completed** | `getList('tasks', { filter: { sales_id, completed: true, completed_at: thisWeek } })` | Same with `lastWeek` date range |
| **Deals Moved** | `getList('opportunities', { filter: { opportunity_owner_id: salesId, updated_at: thisWeek, stage@not_in: closed } })` | Same with `lastWeek` date range |
| **Open Opportunities** | `getList('opportunities', { filter: { opportunity_owner_id: salesId, stage@not_in: closed } })` | `getList('dashboard_snapshots', { filter: { sales_id, snapshot_date: lastWeekEnd } })` |

#### Trend Calculation

```typescript
function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return { trend: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'flat' };
  }
  const percentChange = ((current - previous) / previous) * 100;
  return {
    trend: Math.round(percentChange),
    direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'flat',
  };
}
```

#### Display

| Direction | Color | Icon |
|-----------|-------|------|
| Up | `text-success` (green) | ↗ ArrowUpRight |
| Down | `text-destructive` (red) | ↘ ArrowDownRight |
| Flat | `text-muted-foreground` | — Minus |

---

### 5. Team Activity Feed

**Component:** `src/atomic-crm/dashboard/ActivityFeedPanel.tsx`
**Hook:** `src/atomic-crm/dashboard/useTeamActivities.ts`

Real-time feed of recent activities across all team members.

#### Data Query

```typescript
useGetList<TeamActivity>('activities', {
  pagination: { page: 1, perPage: 15 },
  sort: { field: 'activity_date', order: 'DESC' },
  filter: {
    'deleted_at@is': null,
  },
  meta: {
    select: `
      id, type, subject, activity_date, description, created_by,
      contact_id, organization_id, opportunity_id,
      sales:created_by (id, first_name, last_name, email, avatar_url)
    `,
  },
}, {
  staleTime: 5 * 60 * 1000, // 5-minute cache
});
```

#### Response Shape

```typescript
interface TeamActivity {
  id: number;
  type: string;              // call, email, meeting, etc.
  subject: string;
  activity_date: string;
  description: string | null;
  created_by: number | null;
  sales?: {                  // Joined from sales table
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  contact_id: number | null;
  organization_id: number | null;
  opportunity_id: number | null;
}
```

#### Relative Time Display

```typescript
function formatRelativeTime(dateString: string): string {
  // < 60 seconds: "Just now"
  // < 60 minutes: "X mins ago"
  // < 24 hours: "X hours ago"
  // 1 day: "Yesterday"
  // < 7 days: "X days ago"
  // Older: "Dec 15" (short date)
}
```

---

## Context Providers

### CurrentSaleProvider

**File:** `src/atomic-crm/dashboard/CurrentSaleContext.tsx`

Caches the current user's `salesId` at the dashboard level to prevent redundant database lookups.

```typescript
// Usage: Wrap dashboard with provider
<CurrentSaleProvider>
  <PrincipalDashboardV3 />
</CurrentSaleProvider>

// All child components access cached value
const { salesId, loading, error } = useCurrentSale();
```

#### Performance Impact
- **Before:** 5+ components each querying `SELECT id FROM sales WHERE user_id = auth.uid()`
- **After:** 1 query, cached for session lifetime
- **Improvement:** ~100-200ms faster initial load, 4+ fewer queries

#### Implementation Details

```typescript
// Uses React Admin's useGetIdentity (already cached with 15-min TTL)
const { data: identity, isLoading } = useGetIdentity();
const salesId = identity?.id ? Number(identity.id) : null;

// Provides context value
<CurrentSaleContext.Provider value={{ salesId, loading, error, refetch }}>
```

---

## Filter System

### Global Filters

The dashboard uses component-level filtering rather than a global filter context:

| Filter | Scope | Persistence |
|--------|-------|-------------|
| **My Principals Only** | Pipeline Table | Component state (resets on navigation) |
| **Search Query** | Pipeline Table | Component state |
| **Momentum Filter** | Pipeline Table | Component state |

### Date Range Calculations

All hooks use consistent date-fns calculations:

```typescript
import { startOfWeek, endOfWeek, startOfDay, subWeeks } from 'date-fns';

const today = startOfDay(new Date());
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
const weekEnd = endOfWeek(today, { weekStartsOn: 1 });     // Sunday
const lastWeekStart = subWeeks(weekStart, 1);
const lastWeekEnd = subWeeks(weekEnd, 1);
```

---

## Refresh Mechanism

### Manual Refresh

The dashboard uses a `refreshKey` pattern for coordinated refresh:

```typescript
// PrincipalDashboardV3.tsx
const [refreshKey, setRefreshKey] = useState(0);

const handleRefresh = useCallback(() => {
  setRefreshKey(prev => prev + 1);
}, []);

// Components re-mount on key change
<KPISummaryRow key={`kpi-${refreshKey}`} />
<DashboardTabPanel key={`tabs-${refreshKey}`} />
```

### Automatic Caching

| Hook | `staleTime` | Cache Strategy |
|------|-------------|----------------|
| `usePrincipalPipeline` | 5 min | React Query cache |
| `useTeamActivities` | 5 min | React Query cache |
| `useMyTasks` | 5 min | React Query cache |
| `useTaskCount` | 30 sec | React Query cache |
| `useKPIMetrics` | None | Fresh on mount |
| `useMyPerformance` | None | Fresh on mount |

---

## Lazy Loading

Dashboard components use code splitting for performance:

```typescript
// DashboardTabPanel.tsx
const PrincipalPipelineTable = lazy(() => import('./PrincipalPipelineTable'));
const TasksKanbanPanel = lazy(() => import('./TasksKanbanPanel'));
const MyPerformanceWidget = lazy(() => import('./MyPerformanceWidget'));
const ActivityFeedPanel = lazy(() => import('./ActivityFeedPanel'));

// Lazy-loaded drill-down sheet
const PipelineDrillDownSheet = lazy(() => import('./PipelineDrillDownSheet'));
```

Tab content uses `forceMount` to preserve state when switching tabs.

---

## Error Handling

All dashboard hooks use resilient error handling:

1. **Promise.allSettled:** Partial failures don't break entire dashboard
2. **Error State UI:** Each widget displays error message independently
3. **Console Logging:** Errors logged for debugging without crashing
4. **Abort Controller:** Prevents state updates on unmounted components

```typescript
const [openCountResult, tasksResult, ...] = await Promise.allSettled([
  dataProvider.getList(...),
  dataProvider.getList(...),
]);

// Process results - use 0 for failed requests
if (openCountResult.status === 'fulfilled') {
  count = openCountResult.value.total || 0;
} else {
  console.error('Failed to fetch:', openCountResult.reason);
}
```

---

## Supporting Hooks

### useTaskCount

**File:** `src/atomic-crm/dashboard/useTaskCount.ts`

Simple count for the "My Tasks" tab badge:

```typescript
// Returns pending task count with 30-second cache
const { pendingCount, isLoading } = useTaskCount();
```

### usePipelineTableState

**File:** `src/atomic-crm/dashboard/usePipelineTableState.ts`

Extracted state management for pipeline table (sorting, filtering):

```typescript
const {
  searchQuery, setSearchQuery,
  momentumFilters, toggleMomentumFilter,
  handleSort, sortedData,
  sortField, sortDirection,
  getAriaSortValue,
} = usePipelineTableState({ data });
```

---

## Database Views Referenced

| View/Table | Used By | Purpose |
|------------|---------|---------|
| `principal_pipeline_summary` | `usePrincipalPipeline` | Aggregated pipeline metrics per principal |
| `opportunities` | `useKPIMetrics`, `useMyPerformance` | Opportunity counts and stale detection |
| `tasks` | `useMyTasks`, `useTaskCount`, `useKPIMetrics` | Task management |
| `activities` | `useTeamActivities`, `useKPIMetrics`, `useMyPerformance` | Activity logging and counts |
| `sales` | `useCurrentSale`, `useTeamActivities` | User identity and avatars |
| `dashboard_snapshots` | `useMyPerformance` | Historical metrics for trending |

---

## Related Documentation

- [Business Logic Discovery](../../.claude/state/business-logic-discovery.json) - Pipeline stages, activity types, business rules
- [Stage Constants](../../src/atomic-crm/opportunities/constants/stage-config.ts) - Stage metadata
- [Staleness Calculation](../../src/atomic-crm/utils/stalenessCalculation.ts) - Stale threshold logic
