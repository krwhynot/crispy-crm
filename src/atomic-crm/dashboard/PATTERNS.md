# Dashboard Patterns

Standard patterns for the Principal Dashboard in Crispy CRM.

## Component & Provider Hierarchy

```
index.tsx (Entry Point)
└── Suspense + Lazy Load
    └── CurrentSaleProvider (Context) ─────────────────────────────────┐
        └── DashboardErrorBoundary                                      │
            └── PrincipalDashboardV3                                    │
                ├── KPISummaryRow                                       │
                │   └── 4x KPICard (using useKPIMetrics) ◄──────────────┤
                ├── DashboardTabPanel                                   │
                │   ├── TabsList                                        │
                │   │   ├── Pipeline Tab                                │
                │   │   ├── My Tasks Tab (with badge)                   │
                │   │   ├── Performance Tab                             │
                │   │   └── Team Activity Tab                           │
                │   └── CardContent (absolute positioned, forceMount)   │
                │       ├── PrincipalPipelineTable (lazy) ◄─────────────┤
                │       │   └── PipelineTableRow (momentum indicators)  │
                │       ├── TasksKanbanPanel (lazy)                     │
                │       │   └── TaskKanbanColumn × 3                    │
                │       │       └── TaskKanbanCard (draggable)          │
                │       ├── MyPerformanceWidget (lazy)                  │
                │       └── ActivityFeedPanel (lazy)                    │
                ├── LogActivityFAB (desktop only)                       │
                │   └── Sheet                                           │
                │       └── Suspense (lazy)                             │
                │           └── QuickLogForm ◄──────────────────────────┤
                │               ├── ActivityTypeSection                 │
                │               ├── EntityCombobox (Contact) ◄──────────┼─ useHybridSearch
                │               ├── EntityCombobox (Organization)       │
                │               ├── EntityCombobox (Opportunity)        │
                │               └── FollowUpSection                     │
                ├── MobileQuickActionBar (mobile only, lg:hidden)       │
                │   └── Sheet (bottom)                                  │
                │       └── QuickLogForm (pre-filled activity type)     │
                └── DashboardTutorial (fixed bottom-left)               │
                                                                        │
                         ┌──────────────────────────────────────────────┘
                         │ All components access salesId via useCurrentSale()
                         │ Context caches the value, eliminating redundant queries
                         └──────────────────────────────────────────────
```

---

## Pattern A: Session-Level Caching (CurrentSaleProvider)

Eliminate redundant database queries by caching the current user's sales ID at the dashboard level.

```tsx
// context/CurrentSaleContext.tsx
import { type ReactNode, useMemo, useCallback } from "react";
import { useGetIdentity } from "react-admin";
import { CurrentSaleContext } from "../hooks/useCurrentSale";

export function CurrentSaleProvider({ children }: { children: ReactNode }) {
  // Uses React Admin's identity (15-minute TTL cache)
  const { data: identity, isLoading, error: identityError } = useGetIdentity();

  const salesId = identity?.id ? Number(identity.id) : null;
  const error = identityError instanceof Error ? identityError : null;

  const refetch = useCallback(() => {
    // No-op: React Admin manages the cache via authProvider
  }, []);

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
// hooks/useCurrentSale.ts - Consumer hook with fallback
export function useCurrentSale() {
  const context = useContext(CurrentSaleContext);
  const directResult = useCurrentSaleDirect(); // Fallback for non-provider usage

  // Prefer cached context when available
  if (context && !context.error?.message?.includes("not found")) {
    return {
      salesId: context.salesId,
      loading: context.loading,
      error: context.error,
    };
  }

  return directResult;
}
```

**When to use**: Wrap around any feature that has multiple components needing the same user-specific data. Prevents N+1 query patterns where each component fetches its own salesId.

**Key points:**
- Provider fetches once on mount, caches for session lifetime
- All child components get instant access without additional queries
- Fallback to direct query for backward compatibility outside provider
- Expected improvement: 4+ fewer queries, ~100-200ms faster initial load

**Example:** `src/atomic-crm/dashboard/v3/context/CurrentSaleContext.tsx`

---

## Pattern B: Pipeline with Momentum Indicators

Status-based sorting and visual decay indicators for pipeline health monitoring.

```tsx
// hooks/usePipelineTableState.ts - Momentum sorting
const sortedData = useMemo(() => {
  return [...filteredData].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "totalPipeline":
        comparison = a.totalPipeline - b.totalPipeline;
        break;
      case "momentum": {
        // Custom order: increasing (3) > steady (2) > decreasing (1) > stale (0)
        const momentumOrder = { increasing: 3, steady: 2, decreasing: 1, stale: 0 };
        comparison = momentumOrder[a.momentum] - momentumOrder[b.momentum];
        break;
      }
    }

    return sortDirection === "descending" ? -comparison : comparison;
  });
}, [filteredData, sortField, sortDirection]);
```

```tsx
// components/PipelineTableRow.tsx - Visual decay indicator
function MomentumIcon({ momentum }: { momentum: Momentum }) {
  switch (momentum) {
    case "increasing":
      return <TrendingUp className="h-4 w-4 text-success" />;
    case "decreasing":
      return <TrendingDown className="h-4 w-4 text-warning" />;
    case "steady":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    case "stale":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
}

function getDecayIndicatorColor(momentum: Momentum): string {
  switch (momentum) {
    case "increasing": return "bg-success";
    case "steady": return "bg-muted-foreground/50";
    case "decreasing": return "bg-warning";
    case "stale": return "bg-destructive";
  }
}

// In table row - 4px left border as decay bar
<TableCell className="font-medium relative">
  <div
    className={`absolute left-0 top-0 bottom-0 w-1 ${getDecayIndicatorColor(row.momentum)}`}
    aria-hidden="true"
  />
  <span className="pl-2">{row.name}</span>
</TableCell>
```

**When to use**: For data tables with health/status indicators that need quick visual scanning. The decay bar provides instant recognition without reading text.

**Key points:**
- Momentum ranking: `increasing(3) > steady(2) > decreasing(1) > stale(0)`
- Semantic colors from design system (success, warning, destructive)
- Context-aware defaults: ascending for names, descending for metrics
- ARIA attributes for accessibility: `aria-sort` on column headers

**Example:** `src/atomic-crm/dashboard/v3/components/PipelineTableRow.tsx`

---

## Pattern C: Multi-Step Form with Cascading Entity Selection

Activity logging form with cascading entity relationships and schema-derived defaults.

```tsx
// components/QuickLogForm.tsx
export function QuickLogForm({
  onComplete,
  onRefresh,
  initialDraft,
  onDraftChange,
  initialContactId,
  initialOrganizationId,
  initialOpportunityId,
}: QuickLogFormProps) {
  // Form initialization with schema-derived defaults (Constitution compliant)
  // Priority: initialEntityId props > initialDraft > schema defaults
  const defaultValues = useMemo(() => {
    const schemaDefaults = activityLogSchema.partial().parse({});

    // Merge in order of precedence: schema < draft < explicit props
    return {
      ...schemaDefaults,
      ...(initialDraft || {}),
      ...(initialContactId !== undefined && { contactId: initialContactId }),
      ...(initialOrganizationId !== undefined && { organizationId: initialOrganizationId }),
      ...(initialOpportunityId !== undefined && { opportunityId: initialOpportunityId }),
    };
  }, [initialDraft, initialContactId, initialOrganizationId, initialOpportunityId]);

  const form = useForm<ActivityLogInput>({
    resolver: zodResolver(activityLogSchema),
    defaultValues,
  });

  // Cascading: Contact selection → auto-fills Organization
  const handleContactSelect = useCallback(
    (contact: { id: number; organization_id?: number }) => {
      if (contact.organization_id) {
        form.setValue("organizationId", contact.organization_id);
      }
    },
    [form]
  );

  // Cascading: Organization change → clears mismatched Contact/Opportunity
  const handleOrganizationSelect = useCallback(
    (org: { id: number }) => {
      const currentContactId = form.getValues("contactId");
      const contact = entityData.contacts.find((c) => c.id === currentContactId);

      if (contact && contact.organization_id !== org.id) {
        form.setValue("contactId", undefined);
        notify("Contact cleared - doesn't belong to selected organization", { type: "info" });
      }
    },
    [form, entityData.contacts, notify]
  );

  // ... form render with EntityCombobox components
}
```

**When to use**: For forms with related entity fields where selecting one should filter or auto-populate others. Common in CRM contexts (Contact → Organization → Opportunity).

**Key points:**
- Schema defaults via `zodSchema.partial().parse({})` (Constitution compliant)
- Priority order: explicit props > localStorage draft > schema defaults
- Cascading clears mismatched entities with user notification
- Form mode: `onSubmit` (not `onChange`) per Constitution performance guidelines
- Uses `useWatch()` for isolated re-renders instead of `watch()`

**Example:** `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

---

## Pattern D: Snooze Popover with Calendar

Two-tier popover with quick options and calendar fallback for date selection.

```tsx
// components/SnoozePopover.tsx
export function SnoozePopover({ taskSubject, onSnooze, disabled }: SnoozePopoverProps) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = addWeeks(today, 1);

  const handleQuickSnooze = useCallback(async (targetDate: Date) => {
    setIsSubmitting(true);
    try {
      await onSnooze(endOfDay(targetDate)); // Normalize to end of day
      setOpen(false);
      setShowCalendar(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSnooze]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          className="h-11 w-11 p-0" // 44px touch target
          aria-label={`Snooze "${taskSubject}"`}
          aria-haspopup="dialog"
        >
          <AlarmClock className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" role="dialog">
        {!showCalendar ? (
          // Quick options view
          <div className="flex flex-col">
            <button onClick={() => handleQuickSnooze(tomorrow)}>
              <Sun className="h-4 w-4 text-warning" />
              Tomorrow - {format(tomorrow, "EEE, MMM d")}
            </button>
            <button onClick={() => handleQuickSnooze(nextWeek)}>
              <CalendarDays className="h-4 w-4 text-primary" />
              Next Week - {format(nextWeek, "EEE, MMM d")}
            </button>
            <div className="border-t" />
            <button onClick={() => setShowCalendar(true)}>
              <CalendarIcon className="h-4 w-4" />
              Pick a date...
            </button>
          </div>
        ) : (
          // Calendar view with back button
          <div>
            <Button onClick={handleBackToOptions} aria-label="Back">←</Button>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCustomDateSelect}
              disabled={(date) => date < today}
            />
            <Button onClick={handleCustomDateConfirm} disabled={!selectedDate}>
              Snooze until {selectedDate && format(selectedDate, "MMM d")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

**When to use**: For date selection that has common shortcuts (tomorrow, next week) but also needs arbitrary date selection. The two-tier approach reduces clicks for common cases.

**Key points:**
- Quick options cover 80% of use cases with one click
- `endOfDay()` normalizes all dates for consistent behavior
- State machine: `showCalendar` toggles between views
- Back button preserves popover context (no re-open needed)
- 44px touch targets per WCAG AA compliance

**Example:** `src/atomic-crm/dashboard/v3/components/SnoozePopover.tsx`

---

## Pattern E: KPI Metrics with Parallel Resilient Fetching

Parallel metric fetching with graceful degradation using Promise.allSettled.

```tsx
// hooks/useKPIMetrics.ts
export function useKPIMetrics(): UseKPIMetricsReturn {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [metrics, setMetrics] = useState<KPIMetrics>(DEFAULT_METRICS);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchMetrics = async () => {
      if (salesLoading || !salesId) return;

      const today = startOfDay(new Date());
      const staleThresholdDate = subDays(today, 21); // Max stale threshold

      // Fetch all metrics in parallel - individual failures don't break dashboard
      const [openCountResult, staleResult, tasksResult, activitiesResult] =
        await Promise.allSettled([
          // 1. Open opportunities COUNT (server-side total)
          dataProvider.getList("opportunities", {
            filter: { "stage@not_in": ["closed_won", "closed_lost"] },
            pagination: { page: 1, perPage: 1 }, // Just get total count
          }),

          // 2. Potentially stale opportunities (needs client-side calculation)
          dataProvider.getList("opportunities", {
            filter: {
              "stage@not_in": ["closed_won", "closed_lost"],
              "last_activity_date@lt": staleThresholdDate.toISOString(),
            },
            pagination: { page: 1, perPage: 500 },
          }),

          // 3. Overdue tasks COUNT
          dataProvider.getList("tasks", {
            filter: { sales_id: salesId, completed: false, "due_date@lt": today },
            pagination: { page: 1, perPage: 1 },
          }),

          // 4. Activities this week COUNT
          dataProvider.getList("activities", {
            filter: { "activity_date@gte": weekStart, "activity_date@lte": weekEnd },
            pagination: { page: 1, perPage: 1 },
          }),
        ]);

      if (abortController.signal.aborted || !isMounted) return;

      // Process with graceful fallback - failed metrics show 0
      let openCount = 0;
      if (openCountResult.status === "fulfilled") {
        openCount = openCountResult.value.total || 0;
      } else {
        console.error("Failed to fetch open opportunities:", openCountResult.reason);
      }

      // Client-side staleness calculation (per-stage thresholds)
      let staleCount = 0;
      if (staleResult.status === "fulfilled") {
        staleCount = staleResult.value.data.filter(
          (opp) => isOpportunityStale(opp.stage, opp.last_activity_date, today)
        ).length;
      }

      if (isMounted) setMetrics({ openCount, staleCount, /* ... */ });
    };

    fetchMetrics();
    return () => { isMounted = false; abortController.abort(); };
  }, [dataProvider, salesId, salesLoading]);

  return { metrics, loading, error, refetch };
}
```

**When to use**: Dashboard-level aggregations where multiple metrics should load independently. A failing metric shouldn't prevent other metrics from displaying.

**Key points:**
- `Promise.allSettled()` ensures all queries complete regardless of individual failures
- `perPage: 1` with server-side total avoids transferring full datasets
- AbortController prevents state updates on unmounted components
- Per-stage stale thresholds (7-21 days) calculated client-side
- Stable `DEFAULT_METRICS` object prevents reference changes

**Example:** `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts`

---

## Pattern F: Task Kanban with Time-Horizon Columns

Drag-and-drop kanban board with time-based column grouping using dnd-kit.

```tsx
// components/TasksKanbanPanel.tsx
const columnLabels: Record<TaskColumnId, string> = {
  overdue: "Overdue",
  today: "Today",
  thisWeek: "This Week",
};

export function TasksKanbanPanel() {
  const { tasks, updateTaskDueDate } = useMyTasks();
  const notify = useNotify();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group tasks by time horizon
  const tasksByColumn = useMemo(() => {
    const overdue: TaskItem[] = [];
    const today: TaskItem[] = [];
    const thisWeek: TaskItem[] = [];

    for (const task of tasks) {
      switch (task.status) {
        case "overdue": overdue.push(task); break;
        case "today": today.push(task); break;
        case "tomorrow":
        case "upcoming": thisWeek.push(task); break;
      }
    }
    return { overdue, today, thisWeek };
  }, [tasks]);

  // Calculate target due date based on destination column
  const getTargetDueDate = useCallback((columnId: TaskColumnId): Date => {
    const todayStart = startOfDay(new Date());
    switch (columnId) {
      case "overdue": return currentDueDate; // Keep current
      case "today": return setHours(todayStart, 17); // Today at 5pm
      case "thisWeek": return setHours(addDays(todayStart, 3), 17); // 3 days at 5pm
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const destColumnId = findColumnId(over, tasksByColumn);
    const sourceColumnId = findColumnId(active, tasksByColumn);
    if (destColumnId === sourceColumnId) return;

    const task = tasks.find(t => t.id === parseInt(String(active.id)));
    const newDueDate = getTargetDueDate(destColumnId, task.dueDate);

    try {
      await updateTaskDueDate(task.id, newDueDate);
      notify(`Moved to ${columnLabels[destColumnId]}`, { type: "success" });
    } catch {
      notify("Failed to move task", { type: "error" });
    }
  }, [/* deps */]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <div className="flex gap-3 flex-col lg:flex-row">
        <TaskKanbanColumn columnId="overdue" tasks={tasksByColumn.overdue} />
        <TaskKanbanColumn columnId="today" tasks={tasksByColumn.today} />
        <TaskKanbanColumn columnId="thisWeek" tasks={tasksByColumn.thisWeek} />
      </div>
      <DragOverlay>{activeTask && <TaskKanbanCard task={activeTask} isDragOverlay />}</DragOverlay>
    </DndContext>
  );
}
```

**When to use**: Task management interfaces where visual organization by time is more intuitive than lists. Drag-drop provides quick rescheduling.

**Key points:**
- Time-horizon columns (Overdue, Today, This Week) vs arbitrary lanes
- dnd-kit sensors: PointerSensor (mouse), KeyboardSensor (a11y)
- `activationConstraint: { distance: 8 }` prevents accidental drags
- ARIA announcements for screen readers during drag operations
- Responsive: vertical stack on mobile, horizontal on desktop

**Example:** `src/atomic-crm/dashboard/v3/components/TasksKanbanPanel.tsx`

---

## Pattern G: Hybrid Search (Local + Server-Side)

Dual-query pattern with initial cache and dynamic server search.

```tsx
// hooks/useHybridSearch.ts
export function useHybridSearch<T>({
  resource,
  initialPageSize = 100,
  minSearchLength = 2,
  debounceMs = 300,
  staleTimeMs = 5 * 60 * 1000, // 5 minutes
  sortField = "name",
  additionalFilter = {},
  enabled = true,
}: HybridSearchConfig): HybridSearchResult<T> {
  const [searchTerm, setSearchTermInternal] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term updates
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermInternal(term);
    const handler = setTimeout(() => setDebouncedSearchTerm(term), debounceMs);
    return () => clearTimeout(handler);
  }, [debounceMs]);

  const shouldSearch = debouncedSearchTerm.length >= minSearchLength;

  // Initial data query (cached, larger page) - when NOT searching
  const { data: initialData, isPending: isInitialLoading } = useGetList<T>(
    resource,
    {
      pagination: { page: 1, perPage: initialPageSize },
      sort: { field: sortField, order: "ASC" },
      filter: additionalFilter,
    },
    {
      enabled: enabled && !shouldSearch,
      staleTime: staleTimeMs,
      placeholderData: (prev) => prev, // Keep previous data while loading
    }
  );

  // Search query (smaller page) - when user types 2+ characters
  const { data: searchData, isPending: isSearchLoading } = useGetList<T>(
    resource,
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: sortField, order: "ASC" },
      filter: { ...additionalFilter, q: debouncedSearchTerm },
    },
    {
      enabled: enabled && shouldSearch,
      staleTime: staleTimeMs,
      placeholderData: (prev) => prev,
    }
  );

  // Select which data to show
  const data = useMemo(() => {
    return shouldSearch ? (searchData ?? []) : (initialData ?? []);
  }, [shouldSearch, searchData, initialData]);

  return { data, isInitialLoading, isSearching: isSearchLoading, searchTerm, setSearchTerm };
}
```

**When to use**: Entity dropdowns/comboboxes where initial data is small enough to cache but may need server-side search for the full dataset.

**Key points:**
- Two queries: initial (100 records, cached) + search (50 records, dynamic)
- Only one query enabled at a time via `shouldSearch` flag
- 300ms debounce prevents API spam during typing
- 5-minute staleTime reduces refetches
- `placeholderData` keeps previous results visible during loading

**Example:** `src/atomic-crm/dashboard/v3/hooks/useHybridSearch.ts`

---

## Pattern H: Mobile Quick Action Bar

Fixed bottom navigation with touch-optimized action buttons and lazy-loaded form.

```tsx
// components/MobileQuickActionBar.tsx
const QUICK_ACTIONS: QuickAction[] = [
  { id: "check-in", label: "Check-In", icon: MessageCircle, activityType: "Check-in" },
  { id: "sample", label: "Sample", icon: Package, activityType: "Sample" },
  { id: "call", label: "Call", icon: Phone, activityType: "Call" },
  { id: "meeting", label: "Meeting", icon: Users, activityType: "Meeting" },
  { id: "note", label: "Note", icon: FileText, activityType: "Note" },
  { id: "complete-task", label: "Complete", icon: CheckCircle2, customAction: true },
];

const QuickLogForm = lazy(() =>
  import("./QuickLogForm").then((m) => ({ default: m.QuickLogForm }))
);

export function MobileQuickActionBar({ onRefresh, onCompleteTask }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);

  // Pre-fill activity type from selected action
  const initialDraft = selectedAction?.activityType
    ? { activityType: selectedAction.activityType }
    : null;

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40",
          "lg:hidden", // Hidden on desktop
          "bg-background/95 backdrop-blur-sm",
          "border-t border-border shadow-lg",
          "pb-[env(safe-area-inset-bottom)]" // iPhone X+ safe area
        )}
        aria-label="Quick actions"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={cn(
                "flex h-14 min-w-[56px] flex-col items-center justify-center gap-1",
                "focus-visible:ring-2 focus-visible:ring-ring"
              )}
              onClick={() => handleActionClick(action)}
              aria-label={action.ariaLabel}
            >
              <action.icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] rounded-t-xl">
          <Suspense fallback={<QuickLogFormSkeleton />}>
            <QuickLogForm onComplete={handleComplete} initialDraft={initialDraft} />
          </Suspense>
        </SheetContent>
      </Sheet>

      {/* Spacer to prevent content overlap */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
```

**When to use**: Mobile-first interfaces with common actions that should be instantly accessible. The fixed bar provides one-tap access to frequent operations.

**Key points:**
- `lg:hidden` shows on mobile/tablet only, hidden on desktop
- 44px minimum touch targets (`h-14 min-w-[56px]`)
- `pb-[env(safe-area-inset-bottom)]` for iPhone X+ notch
- Lazy-loaded form saves ~15-20KB from main bundle
- Pre-fills activity type for faster form completion
- Bottom sheet (`side="bottom"`) feels native on mobile

**Example:** `src/atomic-crm/dashboard/v3/components/MobileQuickActionBar.tsx`

---

## Pattern I: Feature-Level Error Boundary

React class component error boundary with user recovery options.

```tsx
// DashboardErrorBoundary.tsx
import { Component, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface State {
  hasError: boolean;
  error?: Error;
}

export class DashboardErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Structured logging with component stack
    logger.error("Dashboard error caught by boundary", error, {
      componentStack: errorInfo.componentStack,
      feature: "dashboard",
    });
  }

  handleReload = () => window.location.reload();
  handleGoHome = () => { window.location.href = "/"; };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                The dashboard encountered an unexpected error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={this.handleReload} variant="outline">
                  <RotateCcw /> Reload Dashboard
                </Button>
                <Button onClick={this.handleGoHome}>
                  <Home /> Go Home
                </Button>
              </div>
              {/* Dev-only error details */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary>Error details (dev only)</summary>
                  <pre className="mt-2 max-h-32 overflow-auto bg-muted p-2 text-xs">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

```tsx
// Usage in index.tsx
<DashboardErrorBoundary>
  <CurrentSaleProvider>
    <PrincipalDashboardV3 />
  </CurrentSaleProvider>
</DashboardErrorBoundary>
```

**When to use**: Wrap major features to prevent errors from crashing the entire application. Provides user-friendly recovery options.

**Key points:**
- Must be a class component (React error boundaries requirement)
- Structured logging with `componentStack` for debugging
- Two recovery options: Reload (retry) or Go Home (escape)
- Dev-only error details via `import.meta.env.DEV`
- Place OUTSIDE context providers to catch provider errors too

**Example:** `src/atomic-crm/dashboard/v3/DashboardErrorBoundary.tsx`

---

## Pattern Comparison Tables

### Quick Log vs Full Activity Form

| Aspect | Quick Log (Pattern C) | Full Activity Form |
|--------|----------------------|-------------------|
| **Location** | FAB Sheet / Mobile Quick Action | Activity Create page |
| **Fields** | 6 core fields (type, contact, org, opp, notes, follow-up) | 12+ fields (includes all metadata) |
| **Draft Persistence** | localStorage with 24h expiry | None |
| **Pre-fill Support** | Activity type, entity IDs | Query params only |
| **Cascading Selection** | Yes (Contact → Org → Opp) | Limited |
| **Submit Options** | Save & Close, Save & New | Save only |
| **Use Case** | Quick captures during calls | Detailed record entry |

### Data Fetching Approaches

| Approach | Pattern | When to Use |
|----------|---------|-------------|
| **Context Cache** | A (CurrentSaleProvider) | Same data needed by 3+ components |
| **Promise.allSettled** | F (KPI Metrics) | Multiple independent metrics, resilience needed |
| **Hybrid Search** | H (useHybridSearch) | Dropdown with initial cache + server search |
| **React Query** | All hooks | Standard data fetching with caching |

### Touch Target Standards

| Element | Minimum Size | Pattern Example |
|---------|-------------|-----------------|
| Buttons | 44×44px (`h-11 w-11`) | Snooze button |
| Action Bar Buttons | 56×44px (`h-14 min-w-[56px]`) | Mobile quick actions |
| Dropdown Items | 44px height | Entity combobox options |
| Drag Handles | 44×44px | Kanban card handles |

---

## Anti-Patterns

### ❌ Context Overuse

```tsx
// WRONG: Creating a context for every piece of state
const ThemeContext = createContext(...);
const UserContext = createContext(...);
const SalesIdContext = createContext(...);
const PermissionsContext = createContext(...);
const TasksContext = createContext(...);
// 5 providers wrapped around app = re-render cascade on any change

// CORRECT: Combine related state, use hooks for independent data
<CurrentSaleProvider> // Just salesId - stable, rarely changes
  <App />
</CurrentSaleProvider>

// Tasks are component-local - don't need context
function TasksKanbanPanel() {
  const { tasks } = useMyTasks(); // Hook-level caching via React Query
}
```

**Why it matters:** Each context provider re-renders all children when its value changes. Multiple providers multiply re-render costs.

### ❌ Missing Memoization in Data Hooks

```tsx
// WRONG: Recalculating on every render
function useKPIMetrics() {
  const { data } = useQuery(...);

  // ⚠️ Creates new object reference every render!
  return {
    openCount: data?.opportunities?.length || 0,
    staleCount: data?.opportunities?.filter(isStale).length || 0,
  };
}

// CORRECT: Memoize derived values
function useKPIMetrics() {
  const { data } = useQuery(...);

  const metrics = useMemo(() => ({
    openCount: data?.opportunities?.length || 0,
    staleCount: data?.opportunities?.filter(isStale).length || 0,
  }), [data]);

  return metrics;
}
```

**Why it matters:** Without memoization, consumers re-render even when data hasn't changed.

### ❌ Direct Supabase Imports in Components

```tsx
// WRONG: Bypassing data provider
import { supabase } from "@/providers/supabase";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    supabase.from("tasks").select("*").then(/* ... */);
  }, []);
}

// CORRECT: Use data provider (single entry point)
import { useDataProvider } from "react-admin";

function TaskList() {
  const dataProvider = useDataProvider();
  useEffect(() => {
    dataProvider.getList("tasks", { /* ... */ });
  }, []);
}

// EXCEPTION: Supabase auth only (outside data provider scope)
const { data: { user } } = await supabase.auth.getUser();
```

**Why it matters:** Direct imports bypass RLS, audit logging, and validation layers defined in the data provider.

### ❌ Prop Drilling Task Callbacks

```tsx
// WRONG: Passing callbacks through 4 levels
<TasksKanbanPanel
  onComplete={completeTask}
  onSnooze={snoozeTask}
  onDelete={deleteTask}
  onView={viewTask}
/>
  <TaskKanbanColumn onComplete={...} onSnooze={...} />
    <TaskKanbanCard onComplete={...} onSnooze={...} />
      <TaskCardActions onComplete={...} onSnooze={...} />

// CORRECT: Let parent component own the hook, pass specific callbacks
function TasksKanbanPanel() {
  const { completeTask, snoozeTask } = useMyTasks();

  return (
    <TaskKanbanColumn
      onComplete={completeTask}
      onSnooze={snoozeTask}
    />
  );
}
// Only 2 levels deep is acceptable
```

**Why it matters:** Prop drilling makes refactoring painful and obscures data flow. For 3+ levels, consider context or composition.

---

## Migration Checklist: Adding New Dashboard Widgets

When adding a new widget/panel to the dashboard:

1. [ ] **Create widget component** with lazy loading
   ```tsx
   const NewWidget = lazy(() => import("./components/NewWidget"));
   ```

2. [ ] **Add to DashboardTabPanel** with `forceMount`
   ```tsx
   <TabsContent value="new-widget" forceMount>
     <Suspense fallback={<WidgetSkeleton />}>
       <NewWidget />
     </Suspense>
   </TabsContent>
   ```

3. [ ] **Create dedicated data hook** following existing patterns
   - Use `useCurrentSale()` for cached salesId
   - Use `useDataProvider()` for data fetching
   - Return stable object references via `useMemo`

4. [ ] **Add loading skeleton** matching widget structure
   ```tsx
   function WidgetSkeleton() {
     return (
       <div className="space-y-3">
         <Skeleton className="h-8 w-48" />
         <Skeleton className="h-24 w-full" />
       </div>
     );
   }
   ```

5. [ ] **Wrap in Suspense boundary** at appropriate level
   - Widget-level: Individual widget can fail independently
   - Tab-level: Entire tab content loads together

6. [ ] **Test error boundary** catches failures
   ```tsx
   // Temporarily add to test:
   if (true) throw new Error("Test error");
   ```

7. [ ] **Verify touch targets** (44px minimum)
   - All buttons: `h-11 w-11` or `h-11 px-4`
   - Clickable rows: `py-3` minimum padding

8. [ ] **Add ARIA attributes** for accessibility
   - Loading: `aria-busy="true"`
   - Interactive: `role="button"`, `tabIndex={0}`
   - Labels: `aria-label` for icon-only buttons

9. [ ] **Test responsive behavior**
   - Mobile: Stacked layout, touch-friendly
   - Desktop: Multi-column where appropriate
   - Use `lg:` breakpoint for desktop overrides

10. [ ] **Update KPI metrics** if widget affects dashboard totals
    - Add to `useKPIMetrics` Promise.allSettled array
    - Handle failure gracefully (show 0, log error)

---

## Pattern J: Defensive Validation at Submission

Pre-submission validation that verifies entity IDs still exist before database write.

```tsx
// components/QuickLogForm.tsx (lines 134-181)
const submitActivity = useCallback(
  async (data: ActivityLogInput, closeAfterSave = true) => {
    if (!salesId) {
      notify("Cannot log activity: user session expired. Please refresh and try again.", {
        type: "error",
      });
      return;
    }

    // Defensive validation: Verify entity IDs exist in loaded data
    // Prevents FK violations from stale drafts or recently deleted records
    if (data.contactId) {
      const contactExists = entityData.filteredContacts.some((c) => c.id === data.contactId);
      if (!contactExists) {
        notify("Selected contact no longer exists. Please select a different contact.", {
          type: "error",
        });
        form.setValue("contactId", undefined);
        return;
      }
    }

    if (data.organizationId) {
      const orgExists = entityData.filteredOrganizations.some(
        (o) => o.id === data.organizationId
      );
      if (!orgExists) {
        notify(
          "Selected organization no longer exists. Please select a different organization.",
          {
            type: "error",
          }
        );
        form.setValue("organizationId", undefined);
        return;
      }
    }

    if (data.opportunityId) {
      const oppExists = entityData.filteredOpportunities.some((o) => o.id === data.opportunityId);
      if (!oppExists) {
        notify("Selected opportunity no longer exists. Please select a different opportunity.", {
          type: "error",
        });
        form.setValue("opportunityId", undefined);
        return;
      }
    }

    // ... proceed with submission
  },
  [salesId, notify, entityData, form]
);
```

**When to use**: Forms with entity selectors that may hold stale draft data or reference recently deleted records. Critical for forms with localStorage draft persistence.

**Key points:**
- Check existence BEFORE database call to prevent FK constraint errors
- Clear invalid form values and notify user of the issue
- Guard against session expiry (salesId check)
- Applies to any foreign key reference in form data
- Use `some()` for O(n) lookup against fetched entity lists

**Example:** `src/atomic-crm/dashboard/QuickLogForm.tsx` (lines 134-181)

---

## Pattern K: Atomic RPC for Transactional Operations

Single database call for multi-table operations requiring transactional consistency.

```tsx
// providers/supabase/extensions/rpcExtension.ts (lines 162-178)
logActivityWithTask: async (
  params: LogActivityWithTaskParams
): Promise<LogActivityWithTaskResponse> => {
  devLog("DataProvider RPC", "Calling log_activity_with_task", params);

  const { data, error } = await supabaseClient.rpc("log_activity_with_task", {
    p_activity: params.p_activity,
    p_task: params.p_task,
  });

  if (error) {
    logError("logActivityWithTask", "log_activity_with_task", params, error);
    throw new HttpError(error.message, 500);
  }

  return data as LogActivityWithTaskResponse;
};
```

```tsx
// Usage in QuickLogForm.tsx (lines 219-224)
// Single atomic RPC call for activity + optional task
// Data provider throws HttpError on failure (fail-fast)
const rpcResult = await dataProvider.logActivityWithTask({
  p_activity: activityPayload,
  p_task: taskPayload,
});
```

**When to use**: Operations that create/update multiple related records where partial success would leave data inconsistent. Examples: activity with follow-up task, opportunity with contacts, booth visitor capture.

**Key points:**
- RPC function wraps multiple inserts in database transaction
- Single round-trip to database (vs multiple API calls)
- Fail-fast: entire operation succeeds or fails atomically
- Zod validation at RPC boundary (`validation/rpc.ts`)
- Type-safe params and response via TypeScript inference
- HttpError thrown on failure for consistent error handling

**Database function pattern:**
```sql
-- supabase/migrations/xxx_log_activity_with_task.sql
CREATE OR REPLACE FUNCTION log_activity_with_task(
  p_activity JSONB,
  p_task JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_activity_id BIGINT;
  v_task_id BIGINT;
BEGIN
  -- Insert activity
  INSERT INTO activities (...) VALUES (...)
  RETURNING id INTO v_activity_id;

  -- Insert task if provided
  IF p_task IS NOT NULL THEN
    INSERT INTO tasks (...) VALUES (...)
    RETURNING id INTO v_task_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'activity_id', v_activity_id,
    'task_id', v_task_id
  );
END;
$$ LANGUAGE plpgsql;
```

**Example:** `src/atomic-crm/providers/supabase/extensions/rpcExtension.ts`

---

## Pattern L: useEntityData Hook Abstraction

Composable hook that encapsulates complex entity fetching with cascading filters.

```tsx
// hooks/useEntityData.ts
export function useEntityData({
  form,
  selectedOrganizationId,
  selectedContactId,
  selectedOpportunityId,
}: UseEntityDataOptions) {
  const notify = useNotify();

  // Debounced search state for each dropdown
  const contactSearch = useDebouncedSearch();
  const orgSearch = useDebouncedSearch();
  const oppSearch = useDebouncedSearch();

  // Build filter with server-side search
  const contactFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (selectedOrganizationId) {
      filter.organization_id = selectedOrganizationId;
    }
    if (contactSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH) {
      filter.q = contactSearch.debouncedTerm;
    }
    return filter;
  }, [selectedOrganizationId, contactSearch.debouncedTerm]);

  // Fetch contacts with hybrid approach (cached + search)
  const { data: contacts = [], isPending: contactsLoading } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: shouldSearchContacts ? 50 : INITIAL_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: contactFilter,
    },
    {
      staleTime: STALE_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  // Anchor organization detection (from org, contact, or opportunity)
  const anchorOrganizationId = useMemo(() => {
    if (selectedOrganizationId) return selectedOrganizationId;
    if (selectedContact?.organization_id) return selectedContact.organization_id;
    if (selectedOpportunity?.customer_organization_id)
      return selectedOpportunity.customer_organization_id;
    return null;
  }, [selectedOrganizationId, selectedContact, selectedOpportunity]);

  // Fallback fetch for anchor org not in paginated list
  const { data: fetchedAnchorOrg } = useGetOne<Organization>(
    "organizations",
    { id: anchorOrganizationId! },
    { enabled: anchorOrgMissing && anchorOrganizationId !== null }
  );

  // Side effect: Auto-fill organization from opportunity selection
  useEffect(() => {
    if (selectedOpportunity?.customer_organization_id) {
      form.setValue("organizationId", selectedOpportunity.customer_organization_id);
      // Clear mismatched contact
      // ...
    }
  }, [selectedOpportunity?.customer_organization_id, contacts, form, notify]);

  return {
    // Raw data
    contacts, organizations, opportunities,
    // Filtered data
    filteredContacts, filteredOrganizations, filteredOpportunities,
    // Loading states
    contactsLoading, organizationsLoading, opportunitiesLoading, isInitialLoading,
    // Search controls
    contactSearch, orgSearch, oppSearch,
    // Derived state
    anchorOrganizationId,
  };
}
```

**When to use**: Forms with multiple related entity dropdowns where selections cascade (Contact → Organization → Opportunity). Extracts 300+ lines of logic from form components.

**Key points:**
- **Hybrid search**: Initial cache (100 records) + server search (50 records)
- **Anchor organization**: Derived from any entity selection, cascades to filter others
- **Fallback fetches**: Separate `useGetOne` for anchor org not in paginated results
- **Side effects**: Auto-fill and clear mismatched entities with user notification
- **Debounced search**: 300ms delay, 2-character minimum
- **5-minute staleTime**: Reduces refetches while maintaining freshness

**Example:** `src/atomic-crm/dashboard/useEntityData.ts`

---

## Pattern M: Optimistic Updates with Rollback

Immediate UI updates with automatic rollback on API failure.

```tsx
// hooks/useMyTasks.ts
export function useMyTasks() {
  // Local optimistic state for immediate UI updates
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<number, Partial<TaskItem> & { deleted?: boolean }>
  >(new Map());

  // Merge server data with optimistic updates
  const tasks = useMemo(() => {
    return serverTasks
      .map((task) => ({
        ...task,
        ...(optimisticUpdates.get(task.id) || {}),
      }))
      .filter((task) => !optimisticUpdates.get(task.id)?.deleted);
  }, [serverTasks, optimisticUpdates]);

  // Ref to track tasks for callbacks without causing recreations
  const tasksRef = useRef<TaskItem[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const completeTask = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      // Optimistic UI update - mark as deleted immediately
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { deleted: true });
        return next;
      });

      try {
        await dataProvider.update("tasks", {
          id: taskId,
          data: { completed: true, completed_at: new Date().toISOString() },
          previousData: task,
        });

        // Clear optimistic update on success
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });

        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
      } catch (error: unknown) {
        console.error("Failed to complete task:", error);
        // Rollback optimistic update on failure
        setOptimisticUpdates((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });
        throw error;
      }
    },
    [dataProvider, queryClient]
  );

  const updateTaskDueDate = useCallback(
    async (taskId: number, newDueDate: Date) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      const newStatus = calculateStatus(newDueDate);

      // Optimistic UI update - immediately move task to new column
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(taskId, { dueDate: newDueDate, status: newStatus });
        return next;
      });

      try {
        await dataProvider.update("tasks", { /* ... */ });
        // Clear on success, rollback on failure (same pattern)
      } catch (error) {
        // Rollback
      }
    },
    [dataProvider, calculateStatus, queryClient]
  );

  return {
    tasks, // Merged with optimistic updates
    completeTask,
    updateTaskDueDate,
    // ... other methods
  };
}
```

**When to use**: Operations where immediate feedback improves UX (drag-drop, task completion, deletes). Especially valuable for Kanban boards where items move between columns.

**Key points:**
- **Map-based tracking**: `Map<taskId, partialUpdate>` for O(1) lookup
- **Merge strategy**: Server data + optimistic updates via `useMemo`
- **Ref pattern**: `tasksRef` prevents callback recreation on task changes
- **Rollback**: Clear optimistic update in catch block
- **Cache invalidation**: `queryClient.invalidateQueries` after success
- **Delete pattern**: `{ deleted: true }` flag filters item from merged list

**Rollback sequence:**
1. Apply optimistic update immediately
2. Make API call
3. On success: Clear optimistic update, invalidate cache
4. On failure: Clear optimistic update (reverts to server state)

**Example:** `src/atomic-crm/dashboard/useMyTasks.ts`
