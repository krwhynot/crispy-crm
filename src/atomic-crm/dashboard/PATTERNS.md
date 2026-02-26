# Dashboard Patterns

Standard patterns for the Principal Dashboard in Crispy CRM.

## Architecture Overview

```
index.tsx (Entry Point / Public API)
├── PrincipalDashboardV4WithProvider (ACTIVE)
│   └── CurrentSaleProvider (Context) ─────────────────────────────────────┐
│       └── Suspense (DashboardSkeleton)                                   │
│           └── PrincipalDashboardV4 (3-column CSS Grid)                   │
│               ├── KPISummaryRow (2x2 grid)                               │
│               │   └── 4x KPICard (via useKPIMetrics) ◄──────────────────┤
│               ├── PrincipalPipelineTable (lazy, center column) ◄────────┤
│               │   ├── PipelineTableRow (memo, decay bars)               │
│               │   └── PipelineDrillDownSheet (lazy, right Sheet)        │
│               │       └── OpportunityCard                               │
│               ├── DashboardTasksList (lazy, sticky right column) ◄──────┤
│               │   ├── CollapsibleSection (Overdue / Today / This Week)  │
│               │   │   └── TaskRow (checkbox + action menu)              │
│               │   └── TaskActionMenu (view / postpone / delete)         │
│               ├── CompactActivityWidget (lazy, center row 2) ◄──────────┤
│               │   └── CompactActivityItem (via useTeamActivities)       │
│               ├── CompactPerformanceWidget (lazy, left row 2) ◄─────────┤
│               │   └── CompactMetricItem (via useMyPerformance)          │
│               └── DashboardTutorial (fixed bottom-left)                  │
│                   └── Driver.js tour (DASHBOARD_TUTORIAL_STEPS_V4)       │
│                                                                          │
├── PrincipalDashboardV3WithProvider (LEGACY, still exported)              │
│   └── CurrentSaleProvider                                                │
│       └── Suspense                                                       │
│           └── PrincipalDashboardV3 (tabbed layout)                       │
│               ├── DashboardTabPanel                                      │
│               │   ├── PrincipalPipelineTable (lazy)                      │
│               │   ├── TasksKanbanPanel (lazy, drag-and-drop)             │
│               │   ├── MyPerformanceWidget (lazy)                         │
│               │   ├── ActivityFeedPanel (lazy)                           │
│               │   └── RecentItemsTabContent                              │
│               ├── TaskCompleteSheet (bottom Sheet)                       │
│               └── DashboardTutorial (default V3 steps)                   │
│                                                                          │
└── Shared exports                                                         │
    ├── DashboardErrorBoundary (class component)                           │
    ├── CurrentSaleProvider                                                │
    └── Types: PrincipalPipelineRow, TaskItem, TaskStatus, etc.            │
                                                                           │
                   ┌───────────────────────────────────────────────────────┘
                   │ All hooks use useCurrentSale() for cached salesId.
                   │ Context caches the value, eliminating redundant queries.
                   └───────────────────────────────────────────────────────
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  CurrentSaleProvider                                                 │
│  - Calls useGetIdentity() once on mount                              │
│  - Caches salesId in React Context for session lifetime              │
│  - All dashboard hooks read salesId from context (zero redundancy)   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
           useCurrentSale()│ (consumed by all hooks below)
                           │
    ┌──────────────────────┼──────────────────────────────────┐
    │                      │                                   │
    v                      v                                   v
useKPIMetrics()    useMyTasks()              usePrincipalPipeline()
(Promise.allSettled) (useGetList + useMutation)  (useGetList)
    │                      │                                   │
    v                      v                                   v
KPISummaryRow     DashboardTasksList          PrincipalPipelineTable
                   (optimistic updates)        │
                                               ├─> usePipelineTableState()
                                               │   (sort, search, filter)
                                               │
                                               └─> PipelineDrillDownSheet
                                                   └─> usePrincipalOpportunities()

    ┌─────────────────────────────────────────────────────────┐
    │                                                          │
    v                                                          v
useTeamActivities()                               useMyPerformance()
(useGetList, 5min stale)                          (Promise.allSettled)
    │                                                          │
    v                                                          v
CompactActivityWidget                           CompactPerformanceWidget
```

All data access flows through React Admin hooks (`useGetList`, `useDataProvider`, `useGetOne`).
No direct Supabase imports exist in dashboard components (CORE-001).

---

## Pattern A: V4 Three-Column CSS Grid Layout

### Problem

The V3 tabbed dashboard hides content behind tabs, requiring clicks to switch between Pipeline, Tasks, Performance, and Activity views. On desktop screens (1440px+), valuable screen real estate goes unused.

### Solution

Replace the tabbed layout with a single-page 3-column CSS Grid that shows all sections simultaneously. The page scrolls naturally with one exception: the Tasks column is sticky with internal scroll.

### Implementation

```tsx
// PrincipalDashboardV4.tsx:34-76
export function PrincipalDashboardV4() {
  return (
    <div className="pb-8">
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column (3/12): KPIs + Performance */}
        <div className="lg:col-span-3 lg:col-start-1 lg:row-start-1">
          <KPISummaryRow />
        </div>

        {/* Center column (6/12): Pipeline Table */}
        <Card className="lg:col-span-6 lg:col-start-4 lg:row-start-1">
          <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
            <PrincipalPipelineTable />
          </Suspense>
        </Card>

        {/* Right column (3/12): Tasks - sticky with bounded scroll */}
        <div className="lg:col-span-3 lg:col-start-10 lg:row-start-1
                        lg:sticky lg:top-4 lg:self-start
                        lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto">
          <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
            <DashboardTasksList />
          </Suspense>
        </div>

        {/* Center row 2 (6/12): Activity Feed */}
        <div className="lg:col-span-6 lg:col-start-4 lg:row-start-2">
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactActivityWidget />
          </Suspense>
        </div>

        {/* Left row 2 (3/12): Performance */}
        <div className="lg:col-span-3 lg:col-start-1 lg:row-start-2">
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactPerformanceWidget />
          </Suspense>
        </div>
      </main>

      <DashboardTutorial steps={DASHBOARD_TUTORIAL_STEPS_V4} />
    </div>
  );
}
```

**Grid positions:**

| Column      | Desktop             | Mobile (single col) |
|-------------|---------------------|---------------------|
| Left 3/12   | KPIs (row 1), Perf (row 2)  | 1st, 5th   |
| Center 6/12 | Pipeline (row 1), Activity (row 2) | 2nd, 4th |
| Right 3/12  | Tasks (row 1, sticky)       | 3rd         |

**Scroll model:**
- Page scrolls naturally (pipeline, KPIs, activity, performance flow with page)
- Tasks column: `lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto`
- No other component has internal scroll

**Mobile order:** DOM order = visual order = focus order (no CSS `order-*` tricks):
1. KPIs -> 2. Pipeline -> 3. Tasks -> 4. Activity -> 5. Performance

**Example:** `src/atomic-crm/dashboard/PrincipalDashboardV4.tsx`

---

## Pattern B: Session-Level Caching (CurrentSaleProvider)

### Problem

Multiple dashboard hooks (`useKPIMetrics`, `useMyTasks`, `useMyPerformance`, `usePrincipalPipeline`) each need the current user's `salesId`. Without caching, each hook triggers an independent identity lookup, creating 4+ redundant queries on mount.

### Solution

Cache `salesId` once at the dashboard level via React Context. The `CurrentSaleProvider` wraps the dashboard, and all child hooks read from the context.

### Implementation

```tsx
// CurrentSaleContext.tsx:40-75
export function CurrentSaleProvider({ children }: CurrentSaleProviderProps) {
  const { data: identity, isLoading, error: identityError } = useGetIdentity();
  const salesId = identity?.id ? Number(identity.id) : null;
  const error = identityError instanceof Error ? identityError : null;

  const refetch = useCallback(() => { /* no-op: React Admin manages cache */ }, []);

  const contextValue = useMemo(
    () => ({ salesId, loading: isLoading, error, refetch }),
    [salesId, isLoading, error, refetch]
  );

  return (
    <CurrentSaleContext.Provider value={contextValue}>
      {children}
    </CurrentSaleContext.Provider>
  );
}
```

```tsx
// useCurrentSale.ts:60-92
export function useCurrentSale() {
  const context = useContext(CurrentSaleContext);
  const directResult = useCurrentSaleDirect(); // Fallback

  // ERR-003: Structured error categorization (NOT_FOUND, UNAUTHORIZED, UNKNOWN)
  if (context && context.error) {
    const categorized = categorizeError(context.error);
    if (categorized.code !== "NOT_FOUND") {
      return { salesId: context.salesId, loading: context.loading, error: context.error };
    }
  }

  if (context && !context.error) {
    return { salesId: context.salesId, loading: context.loading, error: context.error };
  }

  return directResult; // Fallback for outside-provider usage
}
```

**Key points:**
- Provider fetches once, caches for session lifetime
- All child components get instant access without additional queries
- Fallback to direct `useGetIdentity()` query for backward compatibility outside provider
- Error categorization via `categorizeError()` (NOT_FOUND, UNAUTHORIZED, UNKNOWN)

**Example:** `src/atomic-crm/dashboard/CurrentSaleContext.tsx`, `src/atomic-crm/dashboard/useCurrentSale.ts`

---

## Pattern C: KPI Metrics with Parallel Resilient Fetching

### Problem

The KPI summary row needs four independent metrics (Open Opportunities, Overdue Tasks, Team Activities, Stale Deals). A single failing query should not prevent other metrics from displaying.

### Solution

Use `Promise.allSettled()` for parallel fetching with per-metric graceful degradation. Failed metrics show as en-dash ("--"), never silently default to "0" (G1 guardrail: `null` = unknown, `0` = confirmed zero).

### Implementation

```tsx
// useKPIMetrics.ts:88-357
export function useKPIMetrics(): UseKPIMetricsReturn {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();

  useEffect(() => {
    const abortController = new AbortController();

    const fetchMetrics = async () => {
      if (salesLoading || !salesId) return;

      const [openCountResult, staleResult, tasksResult, activitiesResult, ...] =
        await Promise.allSettled([
          // perPage: 1 uses server-side count (optimization)
          dataProvider.getList("opportunities", {
            filter: { "stage@not_in": [...CLOSED_STAGES] },
            pagination: { page: 1, perPage: 1 },
          }),
          // Only fetch candidates older than 21 days (stale threshold)
          dataProvider.getList("opportunities", {
            filter: { "stage@not_in": [...CLOSED_STAGES], "last_activity_date@lt": threshold },
            pagination: { page: 1, perPage: 500 },
          }),
          // ... overdue tasks, activities this week, last week (for trends)
        ]);

      // G1: null = failed (show "--"), never silently default to 0
      let openOpportunitiesCount: number | null = null;
      if (openCountResult.status === "fulfilled") {
        openOpportunitiesCount = openCountResult.value.total || 0;
      }

      // Client-side stale calculation with per-stage thresholds
      if (staleResult.status === "fulfilled") {
        staleDealsCount = staleResult.value.data.filter(
          (opp) => isOpportunityStale(opp.stage, opp.last_activity_date, today)
        ).length;
      }
    };

    fetchMetrics();
    return () => { abortController.abort(); };
  }, [dataProvider, salesId, salesLoading, refetchTrigger]);
}
```

**Key points:**
- `Promise.allSettled()` isolates failures per metric
- `perPage: 1` with server-side `.total` avoids data transfer for simple counts
- Per-stage stale thresholds: new_lead (7d), initial_outreach (14d), sample_visit_offered (14d), feedback_logged (21d), demo_scheduled (14d)
- AbortController prevents state updates on unmounted components
- Week-over-week trend calculation for activities KPI

**Example:** `src/atomic-crm/dashboard/useKPIMetrics.ts`

---

## Pattern D: DashboardTasksList (List-Based Task View)

### Problem

The V3 Kanban board required drag-and-drop libraries (`@dnd-kit`) and was visually heavy for a sidebar column. The V4 right column (3/12) needs a compact, scrollable task view.

### Solution

Replace the Kanban with a collapsible list grouped by time horizon (Overdue, Today, This Week). Each section has a preview limit with "Show more" expansion.

### Implementation

```tsx
// DashboardTasksList.tsx:314-437
export function DashboardTasksList() {
  const { tasks, loading, error, completeTask, deleteTask, viewTask, updateTaskDueDate } =
    useMyTasks();

  const tasksByColumn = useMemo(() => groupTasksByColumn(tasks), [tasks]);

  // Collapsible state per section
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    overdue: true, today: true, thisWeek: true,
  });
  const [showAll, setShowAll] = useState<Record<SectionKey, boolean>>({
    overdue: false, today: false, thisWeek: false,
  });

  return (
    <Card data-tutorial="dashboard-tasks-list">
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        {overdueCount > 0 && <Badge variant="destructive">{overdueCount}</Badge>}
        <AdminButton onClick={() => { window.location.href = "/#/tasks/create"; }}>
          New Task
        </AdminButton>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        {SECTIONS.map((config) => (
          <CollapsibleSection
            key={config.key}
            config={config}
            tasks={sectionData[config.key]}
            expanded={expandedSections[config.key]}
            showAll={showAll[config.key]}
            onToggleExpanded={() => toggleSection(config.key)}
            onToggleShowAll={() => toggleShowAll(config.key)}
            onComplete={completeTask}
            onView={viewTask}
            onDelete={deleteTask}
            onPostpone={handlePostpone}
          />
        ))}
      </CardContent>
    </Card>
  );
}
```

**Section config (data-driven):**
- Overdue: `text-destructive`, `variant="destructive"`
- Today: `text-primary`, `variant="default"`
- This Week: `text-muted-foreground`, `variant="secondary"`

**Preview limit:** 5 tasks per section before "Show more" toggle.

**Scroll ownership:** The component renders a Card that grows to fit content. The parent (`PrincipalDashboardV4`) owns scroll sizing via sticky positioning.

**Example:** `src/atomic-crm/dashboard/DashboardTasksList.tsx`

---

## Pattern E: Optimistic Updates with React Query Mutations

### Problem

Task operations (complete, snooze, delete, reschedule) need instant UI feedback. A round-trip to the server before visual update creates perceptible lag, especially for Kanban drag-and-drop.

### Solution

Use React Query's `useMutation` with `onMutate` for optimistic updates. The pattern cancels outgoing refetches before mutating, snapshots previous state for rollback, and invalidates targeted query keys on settle.

### Implementation

```tsx
// useMyTasks.ts:160-214
const completeTaskMutation = useMutation({
  mutationFn: async ({ taskId, task }) => {
    await dataProvider.update("tasks", {
      id: taskId,
      data: { completed: true, completed_at: new Date().toISOString() },
      previousData: task,
    });
    return taskId;
  },
  onMutate: async ({ taskId }) => {
    // CRITICAL: Cancel outgoing refetches to prevent race conditions
    await queryClient.cancelQueries({ queryKey: taskKeys.all });

    // Snapshot for rollback
    const previousOptimisticState = new Map(optimisticUpdates);

    // BUG-4 FIX: Mark as pendingCompletion, not deleted
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      next.set(taskId, { pendingCompletion: true });
      return next;
    });

    return { previousOptimisticState };
  },
  onError: (error, { taskId }, context) => {
    // Rollback to snapshot
    if (context?.previousOptimisticState) {
      setOptimisticUpdates(context.previousOptimisticState);
    }
  },
  onSuccess: (taskId) => {
    // Remove from list after mutation succeeds
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      next.set(taskId, { deleted: true });
      return next;
    });
  },
  onSettled: () => {
    // Targeted invalidation (STALE-002)
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
  },
});
```

**Rollback sequence:**
1. `onMutate`: Cancel outgoing fetches, snapshot state, apply optimistic update
2. API call runs
3. `onSuccess`: Finalize optimistic state (e.g., mark as deleted)
4. `onError`: Restore snapshot (reverts to server state)
5. `onSettled`: Invalidate query keys regardless of outcome

**Map-based tracking:** `Map<taskId, Partial<TaskItem> & { deleted?: boolean; pendingCompletion?: boolean }>` for O(1) lookup.

**Ref pattern:** `tasksRef = useRef(tasks)` prevents callback recreation when tasks change, avoiding infinite re-render loops.

**Example:** `src/atomic-crm/dashboard/useMyTasks.ts`

---

## Pattern F: Pipeline with Momentum Indicators

### Problem

Pipeline health needs instant visual recognition. Reading text-based status for each principal row is too slow for a summary view.

### Solution

A 4px left-edge decay indicator bar on each table row using semantic color tokens, plus icon+text momentum labels. The sorting hook extracts all state management from the table component.

### Implementation

```tsx
// PipelineTableRow.tsx:38-49
function getDecayIndicatorColor(momentum: Momentum): string {
  switch (momentum) {
    case "increasing": return "bg-success";
    case "steady":     return "bg-muted-foreground/50";
    case "decreasing": return "bg-warning";
    case "stale":      return "bg-destructive";
  }
}

// In table row - 4px left border as decay bar
<TableCell className="font-medium relative">
  <div
    className={`absolute left-0 top-0 bottom-0 w-1.5 ${getDecayIndicatorColor(row.momentum)}`}
    aria-hidden="true"
  />
  <span className="pl-2">{row.name}</span>
</TableCell>
```

```tsx
// usePipelineTableState.ts:86-117 - Momentum sort ordering
case "momentum": {
  const momentumOrder = { increasing: 3, steady: 2, decreasing: 1, stale: 0 };
  comparison = momentumOrder[a.momentum] - momentumOrder[b.momentum];
  break;
}
```

**State extraction:** `usePipelineTableState` manages sorting, searching, and momentum filtering using `useTransition` for non-blocking UI updates.

**Drill-down:** Clicking a row opens `PipelineDrillDownSheet` (lazy-loaded) with opportunities filtered by `principal_organization_id`.

**Example:** `src/atomic-crm/dashboard/PipelineTableRow.tsx`, `src/atomic-crm/dashboard/usePipelineTableState.ts`

---

## Pattern G: Provider Wrapping in index.tsx

### Problem

The dashboard needs lazy loading for code splitting, context providers for cached data, and Suspense boundaries for loading states. Multiple dashboard versions (V3, V4) need to coexist for safe rollback.

### Solution

The `index.tsx` barrel exports wrapper functions that compose `CurrentSaleProvider` + `Suspense` + lazy component. Consumers import from the barrel and get the fully wrapped version.

### Implementation

```tsx
// index.tsx:27-101
const PrincipalDashboardV3Lazy = lazy(() =>
  import("./PrincipalDashboardV3").then((m) => ({ default: m.PrincipalDashboardV3 }))
);
const PrincipalDashboardV4Lazy = lazy(() =>
  import("./PrincipalDashboardV4").then((m) => ({ default: m.PrincipalDashboardV4 }))
);

function PrincipalDashboardV4WithProvider() {
  return (
    <CurrentSaleProvider>
      <Suspense fallback={<DashboardSkeleton />}>
        <PrincipalDashboardV4Lazy />
      </Suspense>
    </CurrentSaleProvider>
  );
}

// Re-export with clean names
export { PrincipalDashboardV3WithProvider as PrincipalDashboardV3 };
export { PrincipalDashboardV4WithProvider as PrincipalDashboardV4 };
```

**Key points:**
- Both V3 and V4 are exported for rollback safety
- `DashboardSkeleton` matches the V4 3-column grid layout
- Child components (PipelineTable, TasksList) are internal -- not exported from barrel
- Types are re-exported for external consumers

**Example:** `src/atomic-crm/dashboard/index.tsx`

---

## Pattern H: Snooze Popover with Calendar

### Problem

Task snoozing needs both quick shortcuts (Tomorrow, Next Week) and arbitrary date selection. Exposing a full calendar upfront adds visual noise for the common 80% case.

### Solution

A two-tier Popover: quick options view first, with a "Pick a date..." option that transitions to a full Calendar view. State machine controlled by `showCalendar` boolean.

### Implementation

```tsx
// SnoozePopover.tsx:30-241
export function SnoozePopover({ taskSubject, onSnooze, disabled }: SnoozePopoverProps) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleQuickSnooze = useCallback(async (targetDate: Date) => {
    await onSnooze(endOfDay(targetDate)); // Normalize to end of day
    setOpen(false);
  }, [onSnooze]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <AdminButton className="h-11 w-11 p-0" aria-label={`Snooze "${taskSubject}"`}>
          <AlarmClock className="h-4 w-4" />
        </AdminButton>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" role="dialog">
        {!showCalendar ? (
          /* Quick options: Tomorrow, Next Week, Pick a date... */
        ) : (
          /* Calendar with back button and confirm */
        )}
      </PopoverContent>
    </Popover>
  );
}
```

**Key points:**
- `endOfDay()` normalizes all dates for consistent snooze behavior
- Back button preserves Popover context (no re-open needed)
- 44px touch targets on trigger button (`h-11 w-11`)
- ARIA: `aria-haspopup="dialog"`, `aria-expanded`, `aria-label`

**Example:** `src/atomic-crm/dashboard/SnoozePopover.tsx`

---

## Pattern I: Feature-Level Error Boundary

### Problem

A failing widget (e.g., bad API response in KPI metrics) should not crash the entire dashboard.

### Solution

A React class component error boundary wrapping the dashboard with structured logging and user recovery options.

### Implementation

```tsx
// DashboardErrorBoundary.tsx:17-88
export class DashboardErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Dashboard error caught by boundary", error, {
      componentStack: errorInfo.componentStack,
      feature: "dashboard",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-md">
          <CardTitle>Something went wrong</CardTitle>
          <AdminButton onClick={this.handleReload}>Reload Dashboard</AdminButton>
          <AdminButton onClick={this.handleGoHome}>Go Home</AdminButton>
          {import.meta.env.DEV && /* Error details in dev only */}
        </Card>
      );
    }
    return this.props.children;
  }
}
```

**Key points:**
- Must be a class component (React error boundaries requirement)
- Structured logging with `componentStack` for debugging
- Two recovery options: Reload (retry) or Go Home (escape)
- Dev-only error details via `import.meta.env.DEV`

**Example:** `src/atomic-crm/dashboard/DashboardErrorBoundary.tsx`

---

## Pattern J: Hybrid Search (Local + Server-Side)

### Problem

Entity dropdowns (contacts, organizations, opportunities) need instant population on open, but the full dataset may be too large to cache client-side.

### Solution

Dual-query pattern: load an initial cached dataset (100 records) for instant dropdown population, then switch to server-side search when the user types 2+ characters.

### Implementation

```tsx
// useHybridSearch.ts:70-174
export function useHybridSearch<T>({ resource, initialPageSize = 100, ... }) {
  const shouldSearch = debouncedSearchTerm.length >= minSearchLength;

  // Initial data (cached, large page) - enabled when NOT searching
  const { data: initialData } = useGetList<T>(resource, {
    pagination: { page: 1, perPage: initialPageSize },
    ...
  }, { enabled: enabled && !shouldSearch, staleTime: staleTimeMs });

  // Search data (smaller page) - enabled when user types 2+ chars
  const { data: searchData } = useGetList<T>(resource, {
    pagination: { page: 1, perPage: 50 },
    filter: { ...additionalFilter, q: debouncedSearchTerm },
  }, { enabled: enabled && shouldSearch, staleTime: staleTimeMs });

  // Toggle between datasets
  const data = useMemo(() => {
    return shouldSearch ? (searchData ?? []) : (initialData ?? []);
  }, [shouldSearch, searchData, initialData]);
}
```

**Key points:**
- Only one query enabled at a time via `shouldSearch` flag
- 300ms debounce prevents API spam during typing
- 5-minute staleTime reduces refetches
- `placeholderData: (prev) => prev` keeps previous results visible during loading
- `useTransition` wraps debounced term updates for non-blocking rendering

**Example:** `src/atomic-crm/dashboard/useHybridSearch.ts`

---

## Pattern K: Cascading Entity Data (useEntityData)

### Problem

Activity logging forms have three entity selectors (Contact, Organization, Opportunity) with cascading relationships. Selecting an Opportunity should auto-fill its Organization, and changing an Organization should clear mismatched Contacts.

### Solution

The `useEntityData` hook encapsulates all cascading logic: anchor organization detection, fallback fetches for out-of-page entities, and auto-fill/clear side effects.

### Implementation

```tsx
// useEntityData.ts:53-349
export function useEntityData({ form, selectedOrganizationId, selectedContactId, ... }) {
  // Debounced search state for each dropdown
  const contactSearch = useDebouncedSearch();
  const orgSearch = useDebouncedSearch();
  const oppSearch = useDebouncedSearch();

  // Anchor organization: derived from any entity selection
  const anchorOrganizationId = useMemo(() => {
    if (selectedOrganizationId) return selectedOrganizationId;
    if (selectedContact?.organization_id) return selectedContact.organization_id;
    if (selectedOpportunity?.customer_organization_id) return selectedOpportunity.customer_organization_id;
    return null;
  }, [...]);

  // Fallback fetch for anchor org not in paginated list
  const { data: fetchedAnchorOrg } = useGetOne<Organization>("organizations",
    { id: anchorOrganizationId! },
    { enabled: anchorOrgMissing && anchorOrganizationId !== null }
  );

  // Side effect: Auto-fill org from opportunity, clear mismatched contact
  useEffect(() => {
    if (selectedOpportunity?.customer_organization_id) {
      form.setValue("organizationId", selectedOpportunity.customer_organization_id);
      // Clear mismatched contact with notification
    }
  }, [selectedOpportunity?.customer_organization_id, ...]);

  return {
    contacts, organizations, opportunities,
    filteredContacts, filteredOrganizations, filteredOpportunities,
    contactSearch, orgSearch, oppSearch,
    anchorOrganizationId,
  };
}
```

**Key points:**
- Anchor organization cascades from org > contact > opportunity selection
- Fallback `useGetOne` for entities outside the paginated list
- Auto-fill + mismatched-entity clearing with `useNotify` feedback
- Debounced search per dropdown (300ms, 2-char minimum)

**Example:** `src/atomic-crm/dashboard/useEntityData.ts`

---

## Pattern L: Dashboard Tutorial (Driver.js)

### Problem

New users need guided onboarding for the dashboard. The tutorial must work differently for V3 (tabbed) and V4 (3-column) layouts.

### Solution

A standalone floating button that launches a Driver.js tour. The component accepts an optional `steps` prop; V3 uses the default steps, V4 passes `DASHBOARD_TUTORIAL_STEPS_V4` explicitly.

### Implementation

```tsx
// DashboardTutorial.tsx:27-98
export function DashboardTutorial({ steps }: DashboardTutorialProps) {
  const driverRef = useRef<Driver | null>(null);

  const startTutorial = useCallback(() => {
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      steps: steps ?? DASHBOARD_TUTORIAL_STEPS, // V3 default, V4 explicit
      onDestroyStarted: () => { setIsActive(false); },
    });
    driverRef.current.drive();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AdminButton size="icon" className="h-11 w-11 rounded-full"
        onClick={startTutorial} aria-label="Start dashboard tutorial">
        <HelpCircle className="h-5 w-5" />
      </AdminButton>
    </div>
  );
}
```

```tsx
// dashboardTutorialStepsV4.ts - V4 step order (left-to-right, top-to-bottom):
// Row 1: KPIs (left) -> Pipeline (center) -> Tasks (right)
// Row 2: Performance (left) -> Activity (center)

// V4 differences from V3:
// - No tabs (removed dashboard-tabs selectors)
// - No kanban (replaced with dashboard-tasks-list)
// - No FAB (removed dashboard-log-activity)
```

**Key points:**
- V3 and V4 steps are separate files (`dashboardTutorialSteps.ts` vs `dashboardTutorialStepsV4.ts`)
- Uses `data-tutorial` attributes as selectors, not CSS classes
- Button hides while tour is active
- Cleanup on unmount via `driverRef.current.destroy()`

**Example:** `src/atomic-crm/dashboard/DashboardTutorial.tsx`, `src/atomic-crm/dashboard/dashboardTutorialStepsV4.ts`

---

## Anti-Patterns

### Do not bypass the data provider

```tsx
// WRONG: Direct Supabase import
import { supabase } from "@/providers/supabase";
const { data } = await supabase.from("tasks").select("*");

// CORRECT: Use React Admin hooks
const { data } = useGetList("tasks", { ... });
// Or for imperative calls:
const dataProvider = useDataProvider();
await dataProvider.getList("tasks", { ... });
```

**Why:** Direct imports bypass RLS, validation, and audit logging layers defined in the provider.

### Do not use nuclear query invalidation

```tsx
// WRONG: Invalidates EVERYTHING
queryClient.invalidateQueries();

// CORRECT: Target specific query keys (STALE-008)
queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
```

**Why:** Nuclear invalidation triggers refetches across the entire app on every mutation.

### Do not create context for every piece of state

```tsx
// WRONG: Context for volatile data
const TasksContext = createContext(...);
// Re-renders ALL children when any task changes

// CORRECT: Let hooks manage volatile data
function DashboardTasksList() {
  const { tasks } = useMyTasks(); // React Query caches internally
}
// Only CurrentSaleProvider uses context (stable, rarely changes)
```

**Why:** Each context re-renders all children on value change. Reserve context for stable, session-level data.

### Do not skip memoization in data hooks

```tsx
// WRONG: New object reference every render
return { openCount: data?.length || 0, staleCount: data?.filter(isStale).length || 0 };

// CORRECT: Memoize derived values
const metrics = useMemo(() => ({
  openCount: data?.length || 0,
  staleCount: data?.filter(isStale).length || 0,
}), [data]);
```

**Why:** Without memoization, consumers re-render even when data has not changed.

### Do not silently default null metrics to zero

```tsx
// WRONG: Failed query looks like confirmed zero
let count = 0;
if (result.status === "fulfilled") count = result.value.total || 0;

// CORRECT: G1 guardrail - null = unknown, 0 = confirmed zero
let count: number | null = null;
if (result.status === "fulfilled") count = result.value.total || 0;
// Display: formatKPIValue(count) renders null as "--" (en-dash)
```

**Why:** Displaying "0" when a query failed misleads users into thinking there are actually zero items.

---

## File Reference

| File | Role | V3 | V4 | Description |
|------|------|:--:|:--:|-------------|
| `index.tsx` | Barrel | Y | Y | Public API: lazy loading, provider wrapping, type exports |
| `PrincipalDashboardV4.tsx` | Layout | - | Y | 3-column CSS Grid layout |
| `PrincipalDashboardV3.tsx` | Layout | Y | - | Tabbed layout with Kanban |
| `DashboardTabPanel.tsx` | Layout | Y | - | Tabs (Pipeline, Tasks, Performance, Activity, Recent) |
| `KPISummaryRow.tsx` | Widget | Y | Y | 2x2 KPI card grid |
| `PrincipalPipelineTable.tsx` | Widget | Y | Y | Sortable pipeline table with drill-down |
| `PipelineTableRow.tsx` | Widget | Y | Y | Memoized table row with decay indicator |
| `PipelineDrillDownSheet.tsx` | Widget | Y | Y | Right-side Sheet showing opportunities |
| `DashboardTasksList.tsx` | Widget | - | Y | Collapsible list-based task view |
| `TasksKanbanPanel.tsx` | Widget | Y | - | Drag-and-drop Kanban board (V3 only) |
| `TaskKanbanColumn.tsx` | Widget | Y | - | Kanban column container (V3 only) |
| `TaskKanbanCard.tsx` | Widget | Y | - | Draggable task card (V3 only) |
| `TaskCompleteSheet.tsx` | Widget | Y | - | Bottom Sheet for quick task completion (V3) |
| `CompactActivityWidget.tsx` | Widget | - | Y | Compact team activity feed card |
| `CompactPerformanceWidget.tsx` | Widget | - | Y | Compact 2x2 performance metrics card |
| `MyPerformanceWidget.tsx` | Widget | Y | - | Full performance widget (V3 tab) |
| `ActivityFeedPanel.tsx` | Widget | Y | - | Full activity feed (V3 tab) |
| `RecentItemsWidget.tsx` | Widget | Y | - | Recently viewed items (V3 tab) |
| `SnoozePopover.tsx` | Component | Y | Y | Two-tier snooze date picker |
| `EntityCombobox.tsx` | Component | Y | Y | Searchable entity dropdown |
| `ActivityTypeSection.tsx` | Component | Y | Y | Activity type + outcome selectors |
| `ActivityDateSection.tsx` | Component | Y | Y | Calendar date picker for activity date |
| `NotesSection.tsx` | Component | Y | Y | Textarea for activity notes |
| `FollowUpSection.tsx` | Component | Y | Y | Follow-up toggle + date picker |
| `ActionButtons.tsx` | Component | Y | Y | Save/Cancel/Save & New buttons |
| `DashboardTutorial.tsx` | Component | Y | Y | Floating tutorial button (Driver.js) |
| `DashboardErrorBoundary.tsx` | Component | Y | Y | Error boundary with recovery UI |
| `CurrentSaleContext.tsx` | Provider | Y | Y | Session-level salesId cache |
| `useCurrentSale.ts` | Hook | Y | Y | Context + fallback for salesId |
| `useKPIMetrics.ts` | Hook | Y | Y | Parallel KPI fetching (Promise.allSettled) |
| `useMyTasks.ts` | Hook | Y | Y | Task CRUD with optimistic updates |
| `useMyPerformance.ts` | Hook | Y | Y | Personal performance metrics |
| `useTeamActivities.ts` | Hook | Y | Y | Team activity feed data |
| `usePrincipalPipeline.ts` | Hook | Y | Y | Pipeline summary from DB view |
| `usePipelineTableState.ts` | Hook | Y | Y | Sort/search/filter state machine |
| `usePrincipalOpportunities.ts` | Hook | Y | Y | Drill-down opportunities by principal |
| `useTaskCount.ts` | Hook | Y | - | Pending task badge count (V3 tabs) |
| `useHybridSearch.ts` | Hook | Y | Y | Initial cache + server search |
| `useEntityData.ts` | Hook | Y | Y | Cascading entity fetching |
| `useDebouncedSearch.ts` | Hook | Y | Y | Debounced search with deferred value |
| `taskUtils.ts` | Utility | Y | Y | Task grouping, icons, priority colors |
| `types.ts` | Types | Y | Y | TaskItem, PipelineRow, API response types |
| `dashboardTutorialSteps.ts` | Config | Y | - | V3 tutorial steps (tabs + kanban) |
| `dashboardTutorialStepsV4.ts` | Config | - | Y | V4 tutorial steps (3-column grid) |

---

## Migration Checklist: Adding a New V4 Widget

When adding a new widget to the V4 dashboard:

1. [ ] **Create widget component** with default export for lazy loading
   ```tsx
   export function NewWidget() { ... }
   export default NewWidget;
   ```

2. [ ] **Add to PrincipalDashboardV4** with lazy + Suspense
   ```tsx
   const NewWidget = lazy(() => import("./NewWidget"));

   <div className="lg:col-span-X lg:col-start-Y lg:row-start-Z">
     <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
       <NewWidget />
     </Suspense>
   </div>
   ```

3. [ ] **Create dedicated data hook** following existing patterns
   - Use `useCurrentSale()` for cached salesId
   - Use `useGetList()` or `useDataProvider()` for data fetching
   - Return stable object references via `useMemo`

4. [ ] **Add `data-tutorial` attribute** to the widget root
   ```tsx
   <Card data-tutorial="dashboard-new-widget">
   ```

5. [ ] **Add tutorial step** to `dashboardTutorialStepsV4.ts`
   ```ts
   { element: '[data-tutorial="dashboard-new-widget"]', popover: { ... } }
   ```

6. [ ] **Update DashboardSkeleton** in `index.tsx` if grid layout changes

7. [ ] **Add loading skeleton** matching widget structure (`aria-busy="true"`)

8. [ ] **Verify touch targets** (44px minimum): `h-11 w-11` or `min-h-[44px]`

9. [ ] **Verify accessibility**: `aria-label` for icon-only buttons, `role="region"` for metric groups

10. [ ] **Test mobile layout**: Confirm correct DOM order in single-column mode (no CSS `order-*`)

11. [ ] **Do NOT modify V3** -- V4 widgets are independent. V3 remains frozen for rollback safety.
