# Reports Patterns

Standard patterns for business intelligence, analytics, and reporting in Crispy CRM.

## Component & Data Flow Architecture

```
ReportsPage (Entry Point)
├── ReportPageShell (Layout wrapper with breadcrumbs)
│   ├── Breadcrumb Navigation
│   ├── Title + Actions (Export buttons)
│   └── Tab Container
│       ├── OverviewTab
│       │   ├── KPICard × 4 (Dashboard metrics)
│       │   ├── ChartWrapper (Pipeline)
│       │   │   └── PipelineChart (Doughnut)
│       │   ├── ChartWrapper (Activity Trends)
│       │   │   └── ActivityTrendChart (Line)
│       │   └── ChartWrapper (Rep Performance)
│       │       └── RepPerformanceChart (Bar)
│       ├── CampaignActivityTab
│       │   ├── CampaignActivityFilters (Dropdowns + date range)
│       │   ├── CampaignActivitySummaryCards (KPIs)
│       │   ├── ActivityTypeCard × N (Grouped metrics)
│       │   └── StaleLeadsView (Conditional on flag)
│       ├── OpportunitiesTab
│       │   ├── FilterToolbar (Principal + Stage filters)
│       │   └── PrincipalGroupCard × N (Collapsible groups)
│       └── WeeklyActivityTab
│           └── WeeklyActivitySummary (Time-based metrics)
│
└── Data Hooks Layer
    ├── useReportData<T> (Generic data fetcher) ◄──────────┐
    │   └── useDataProvider (React Admin) ◄─ Single Entry  │
    ├── useCampaignActivityData                            │
    │   ├── useReportData (activities)                     │
    │   ├── useQuery (RPC: get_campaign_report_stats)      │
    │   ├── useQuery (RPC: get_stale_opportunities)        │
    │   └── useGetList (sales reps)                        │
    ├── useCampaignActivityMetrics                         │
    │   └── useMemo (Client-side aggregation)              │
    └── useCampaignActivityExport                          │
        └── jsonExport → downloadCSV                       │
                                                            │
                  ┌─────────────────────────────────────────┘
                  │ All data flows through unifiedDataProvider
                  │ Zod validation at RPC boundaries
                  │ Fail-fast error handling (no retry)
                  └─────────────────────────────────────────
```

---

## Pattern A: Generic Report Data Hook (useReportData)

Centralized data access for reports with standardized filtering and pagination.

```tsx
// hooks/useReportData.ts
interface UseReportDataOptions {
  dateRange?: { start: Date | null; end: Date | null };
  salesRepId?: string | null;
  additionalFilters?: Record<string, unknown>;
  dateField?: string; // Default: "created_at"
}

export function useReportData<T extends RaRecord>(
  resource: string,
  options: UseReportDataOptions = {}
): UseReportDataResult<T> {
  const dataProvider = useDataProvider();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // CRITICAL: Extract primitive values to prevent render loops
  // Objects compared by reference cause infinite loops when parent creates new refs
  const dateStartStr = dateRange?.start?.toISOString() ?? null;
  const dateEndStr = dateRange?.end?.toISOString() ?? null;
  const additionalFiltersStr = JSON.stringify(additionalFilters ?? {});

  // Memoize filter object using primitive dependencies only
  const filter = useMemo(() => {
    const baseFilter: Record<string, unknown> = additionalFilters ? { ...additionalFilters } : {};

    if (dateStartStr) baseFilter[`${dateField}@gte`] = dateStartStr;
    if (dateEndStr) baseFilter[`${dateField}@lte`] = dateEndStr;
    if (salesRepId) baseFilter.sales_id = salesRepId;

    return baseFilter;
  }, [additionalFiltersStr, dateStartStr, dateEndStr, salesRepId, dateField, additionalFilters]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    dataProvider
      .getList<T>(resource, {
        // Large pagination for report aggregation (PERF-001)
        // Reports need complete datasets for grouping, totals, percentages, charts
        // Current scale: 6 reps, 9 principals, ~500 opportunities - within limit
        // Migration path at 1000+ records: Edge Function server-side aggregation
        pagination: { page: 1, perPage: 1000 },
        sort: { field: "id", order: "DESC" },
        filter,
      })
      .then((result) => {
        if (!cancelled) {
          if (result.data.length >= 1000) {
            logger.warn(`${resource}: Retrieved ${result.data.length} records (at pagination limit). Data may be truncated.`, { feature: "useReportData", resource });
          }
          setData(result.data);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
          logger.error(`Failed to fetch ${resource}`, err, { feature: "useReportData", resource });
        }
      });

    return () => { cancelled = true; };
  }, [dataProvider, resource, filter, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((n) => n + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
```

**When to use**: All report data fetching. Standardizes date filtering, sales rep filtering, and pagination limits across reports.

**Key points:**
- **Single Entry Point**: Uses `useDataProvider` (Constitution compliant, not direct Supabase)
- **Primitive Dependencies**: `toISOString()` and `JSON.stringify()` prevent render loops
- **Large Pagination**: 1000 records for client-side aggregation (scalable to Edge Functions)
- **Fail-Fast**: No retry logic, errors surface immediately
- **Cancellation**: `cancelled` flag prevents state updates on unmounted components
- **Generic Constraint**: `T extends RaRecord` maintains type safety

**Example:** `src/atomic-crm/reports/hooks/useReportData.ts`

---

## Pattern B: Chart Theme System (CSS Variable Integration)

Design system integration for charts using semantic colors from CSS variables.

```tsx
// hooks/useChartTheme.ts
interface ChartTheme {
  colors: {
    primary: string;
    brand700: string;
    brand600: string;
    success: string;
    warning: string;
    destructive: string;
    muted: string;
  };
  font: { family: string; size: number };
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(DEFAULT_THEME);

  useEffect(() => {
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);

    // Fail-fast error for missing CSS variables (Constitution #1 + #8)
    const getCssVar = (varName: string): string => {
      const value = computedStyles.getPropertyValue(`--${varName}`).trim();
      if (!value) {
        throw new Error(
          `[ChartTheme] CSS custom property "--${varName}" is not defined. ` +
          `Ensure design system is loaded before rendering charts. ` +
          `Constitution #8: Never use hex fallback colors.`
        );
      }
      return value;
    };

    setTheme({
      colors: {
        primary: getCssVar("primary"),
        brand700: getCssVar("brand-700"),
        brand600: getCssVar("brand-600"),
        success: getCssVar("success"),
        warning: getCssVar("warning"),
        destructive: getCssVar("destructive"),
        muted: getCssVar("muted"),
      },
      font: {
        family: computedStyles.getPropertyValue("--font-sans").trim() || "system-ui",
        size: 12,
      },
    });
  }, []);

  return theme;
}
```

```tsx
// charts/PipelineChart.tsx - Chart component using theme
export function PipelineChart({ data }: PipelineChartProps) {
  const { colors, font } = useChartTheme();

  const chartData = useMemo(() => ({
    labels: data.map((d) => d.stage),
    datasets: [{
      id: "pipeline-stages",
      data: data.map((d) => d.count),
      backgroundColor: [
        colors.primary,      // Semantic colors from design system
        colors.brand700,
        colors.brand600,
        colors.success,
        colors.warning,
        colors.muted,
      ],
      borderWidth: 0,
    }],
  }), [data, colors]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: { family: font.family, size: 14 },
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  }), [font]);

  return (
    <Doughnut
      data={chartData}
      options={options}
      datasetIdKey="id"
      aria-label={ariaLabel}
      role="img"
    />
  );
}
```

**When to use**: All Chart.js components. Ensures charts match design system colors and respond to theme changes.

**Key points:**
- **No Hex Codes**: Constitution #8 enforced via fail-fast error
- **CSS Custom Properties**: Read from `:root` via `getComputedStyle`
- **Fail-Fast**: Throws if CSS vars missing (prevents silent fallback)
- **Memoization**: `useMemo` on `chartData` and `options` prevents recalculation
- **A11y**: `aria-label` with data summary, `role="img"`
- **Chart.js Setup**: Import `./chartSetup` registers required components globally

**Example:** `src/atomic-crm/reports/hooks/useChartTheme.ts`

---

## Pattern C: ChartWrapper with Loading Skeleton

Consistent card layout for all charts with loading states.

```tsx
// components/ChartWrapper.tsx
interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}

export function ChartWrapper({ title, children, isLoading = false }: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px] w-full">
          {isLoading ? <Skeleton className="w-full h-full" /> : children}
        </div>
      </CardContent>
    </Card>
  );
}
```

```tsx
// Usage in OverviewTab.tsx
<ChartWrapper title="Pipeline by Stage" isLoading={isLoading}>
  <PipelineChart data={pipelineData} />
</ChartWrapper>

<ChartWrapper title="Activity Trends" isLoading={isLoading}>
  <ActivityTrendChart data={trendData} />
</ChartWrapper>
```

**When to use**: All chart components. Provides consistent height, title positioning, and loading states.

**Key points:**
- **Fixed Height**: `h-[300px]` ensures consistent layout during loading
- **Semantic Spacing**: Uses design system card structure
- **Loading State**: Skeleton matches chart container dimensions
- **Responsive**: Chart.js `responsive: true` fills container
- **Title Size**: `text-base` for hierarchy (reports use `text-3xl` for page title)

**Example:** `src/atomic-crm/reports/components/ChartWrapper.tsx`

---

## Pattern D: Composite Data Hook (useCampaignActivityData)

Combines multiple data sources with efficient RPC calls for aggregated metrics.

```tsx
// CampaignActivity/useCampaignActivityData.ts
export function useCampaignActivityData(options: UseCampaignActivityDataOptions) {
  const { selectedCampaign, dateRange, selectedActivityTypes, selectedSalesRep, showStaleLeads } = options;
  const dataProvider = useDataProvider() as ExtendedDataProvider;

  // RPC call for aggregated stats (campaign list, sales rep counts, activity type counts)
  const { data: reportStats, isPending: reportStatsPending } = useQuery({
    queryKey: reportKeys.campaignStats(selectedCampaign),
    queryFn: () =>
      dataProvider.rpc<GetCampaignReportStatsResponse>("get_campaign_report_stats", {
        p_campaign: selectedCampaign || null,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes (dashboard-level metrics)
  });

  // Build filter with selected types (if not "all types" selected)
  const activitiesFilter = useMemo(() => ({
    "opportunities.campaign": selectedCampaign,
    "opportunities.deleted_at@is": null,
    ...(selectedActivityTypes.length > 0 &&
      selectedActivityTypes.length < allActivityTypes.length && {
        type: selectedActivityTypes,
      }),
    ...(selectedSalesRep !== null && { created_by: selectedSalesRep }),
  }), [selectedCampaign, selectedActivityTypes, selectedSalesRep, allActivityTypes.length]);

  // Generic hook for activity details
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } =
    useReportData<CampaignActivity>("activities", {
      dateRange: activitiesDateRange,
      additionalFilters: activitiesFilter,
      dateField: "created_at",
    });

  // Fetch sales reps ONLY for owner IDs in activities (reduces query size)
  const ownerIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.created_by).filter(Boolean))),
    [activities]
  );

  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
    pagination: { page: 1, perPage: 100 },
  });

  // Build salesMap for O(1) lookup
  const salesMap = useMemo(
    () => new Map((salesReps || []).map((s) => [s.id, `${s.first_name} ${s.last_name}`])),
    [salesReps]
  );

  // RPC call for stale opportunities (conditional on flag)
  const { data: staleOpportunities = [], isPending: staleOpportunitiesLoading } = useQuery({
    queryKey: reportKeys.staleOpportunities(selectedCampaign, dateRange, selectedSalesRep),
    queryFn: () =>
      dataProvider.rpc<GetStaleOpportunitiesResponse>("get_stale_opportunities", {
        p_campaign: selectedCampaign,
        p_start_date: dateRange?.start ? new Date(dateRange.start).toISOString() : null,
        p_end_date: dateRange?.end ? new Date(dateRange.end).toISOString() : null,
        p_sales_rep_id: selectedSalesRep,
      }),
    enabled: showStaleLeads && !!selectedCampaign,
    staleTime: 2 * 60 * 1000, // Shorter stale time for volatile data
  });

  return {
    activities,
    activitiesError,
    salesMap,
    campaignOptions: reportStats?.campaign_options ?? [],
    salesRepOptions: reportStats?.sales_rep_options ?? [],
    activityTypeCounts: new Map(Object.entries(reportStats?.activity_type_counts ?? {})),
    totalCampaignActivitiesCount,
    totalCampaignOpportunities,
    isLoadingCampaigns: reportStatsPending,
    isLoadingActivities: activitiesLoading,
    staleOpportunities,
    isLoadingStaleOpportunities: staleOpportunitiesLoading,
  };
}
```

**When to use**: Complex reports combining multiple data sources (RPC for aggregates + detail queries). Reduces round trips via RPC calls.

**Key points:**
- **RPC for Aggregates**: `get_campaign_report_stats` returns counts in single call
- **Conditional Queries**: `enabled` flag prevents unnecessary stale opportunity RPC
- **Owner ID Filtering**: Only fetch sales reps for IDs present in activities
- **O(1) Lookup**: `salesMap` (Map) for fast name resolution
- **Memoized Filters**: Prevents recalculating filter object on every render
- **Stale Time Strategy**: 5 min for stats, 2 min for volatile stale data

**Example:** `src/atomic-crm/reports/CampaignActivity/useCampaignActivityData.ts`

---

## Pattern E: Client-Side Metrics Aggregation (useCampaignActivityMetrics)

Transforms raw data into grouped metrics with business logic (staleness calculation).

```tsx
// CampaignActivity/useCampaignActivityMetrics.ts
export function useCampaignActivityMetrics(
  activities: CampaignActivity[],
  allOpportunities: CampaignOpportunity[],
  allCampaignActivities: CampaignActivity[],
  selectedCampaign: string,
  showStaleLeads: boolean
) {
  // Group activities by type with org-level analysis
  const activityGroups = useMemo(() => {
    if (activities.length === 0) return [];

    const grouped = new Map<string, CampaignActivityGroup>();
    const totalActivities = activities.length;

    activities.forEach((activity) => {
      const type = activity.type || "Unknown";

      if (!grouped.has(type)) {
        grouped.set(type, {
          type,
          activities: [],
          totalCount: 0,
          uniqueOrgs: 0,
          percentage: 0,
          mostActiveOrg: "",
          mostActiveCount: 0,
        });
      }

      const group = grouped.get(type)!;
      group.activities.push(activity);
      group.totalCount += 1;
    });

    // Calculate org-level metrics per activity type
    const result = Array.from(grouped.values()).map((group) => {
      const orgCounts = new Map<number, { name: string; count: number }>();

      group.activities.forEach((activity) => {
        const orgId = activity.organization_id;
        if (!orgCounts.has(orgId)) {
          orgCounts.set(orgId, {
            name: activity.organization_name || `Organization ${orgId}`,
            count: 0,
          });
        }
        orgCounts.get(orgId)!.count += 1;
      });

      const uniqueOrgs = orgCounts.size;
      const sortedOrgs = Array.from(orgCounts.entries()).sort((a, b) => b[1].count - a[1].count);
      const [, mostActiveData] = sortedOrgs[0] || [null, { name: "N/A", count: 0 }];

      return {
        ...group,
        uniqueOrgs,
        percentage: Math.round((group.totalCount / totalActivities) * 100),
        mostActiveOrg: mostActiveData.name,
        mostActiveCount: mostActiveData.count,
      };
    });

    return result.sort((a, b) => b.totalCount - a.totalCount);
  }, [activities]);

  // Stale opportunities calculation (per-stage thresholds)
  const staleOpportunities = useMemo(() => {
    if (!showStaleLeads || !allOpportunities) return [];

    const opportunitiesForCampaign = allOpportunities.filter(
      (o) => o.campaign === selectedCampaign
    );
    const now = new Date();

    return opportunitiesForCampaign
      .filter((opp) => {
        if (!opp.stage) {
          logger.error(`[DATA INTEGRITY] Opportunity ID ${opp.id} has no stage. Excluding from metrics.`, undefined, { feature: "CampaignActivityMetrics", opportunityId: opp.id });
          return false;
        }
        return true;
      })
      .map((opp) => {
        const lastActivityDate = getLastActivityForOpportunity(opp.id, allCampaignActivities);
        const lastActivityDateObj = lastActivityDate ? parseDateSafely(lastActivityDate) : null;
        const daysInactive = lastActivityDateObj
          ? Math.floor((now.getTime() - lastActivityDateObj.getTime()) / (1000 * 60 * 60 * 24))
          : 999999; // Never contacted

        const stage = opp.stage as string;
        const stageThreshold = getStaleThreshold(stage);

        return {
          ...opp,
          lastActivityDate,
          daysInactive,
          stageThreshold,
          isStale: isOpportunityStale(stage, lastActivityDate, now),
        };
      })
      .filter((opp) => opp.isStale && opp.stageThreshold !== undefined)
      .sort((a, b) => {
        const aOverage = a.daysInactive - (a.stageThreshold || 0);
        const bOverage = b.daysInactive - (b.staleThreshold || 0);
        return bOverage - aOverage; // Most overdue first
      });
  }, [showStaleLeads, allOpportunities, selectedCampaign, allCampaignActivities]);

  // Summary metrics
  const totalActivities = activities.length;
  const uniqueOrgs = new Set(activities.map((a) => a.organization_id)).size;
  const totalOpportunities = allOpportunities.filter((opp) => opp.campaign === selectedCampaign).length || 1;
  const coverageRate = totalOpportunities > 0 ? Math.round((uniqueOrgs / totalOpportunities) * 100) : 0;
  const avgActivitiesPerLead = totalOpportunities > 0 ? (totalActivities / totalOpportunities).toFixed(1) : "0.0";

  return {
    activityGroups,
    staleOpportunities,
    totalActivities,
    uniqueOrgs,
    coverageRate,
    avgActivitiesPerLead,
  };
}
```

**When to use**: Reports requiring client-side grouping, percentages, or business rule calculations (staleness thresholds vary by stage).

**Key points:**
- **Map-Based Grouping**: O(n) grouping via `Map<type, group>`
- **Nested Aggregation**: Org counts within activity type groups
- **Business Logic**: Per-stage staleness thresholds (`getStaleThreshold`)
- **Data Integrity**: Logs and excludes records with missing required fields
- **Sorting**: Most active types first, most overdue opportunities first
- **Defensive**: `|| 1` prevents division by zero

**Example:** `src/atomic-crm/reports/CampaignActivity/useCampaignActivityMetrics.ts`

---

## Pattern F: CSV Export with Sanitization (useCampaignActivityExport)

Formatted CSV export with proper date handling and injection prevention.

```tsx
// CampaignActivity/useCampaignActivityExport.ts
export function useCampaignActivityExport(selectedCampaign: string, salesMap: Map<number, string>) {
  const notify = useNotify();

  const exportActivities = useCallback(
    (activityGroups: CampaignActivityGroup[], activities: CampaignActivity[]) => {
      if (activityGroups.length === 0 || activities.length === 0) {
        notify("No activities to export", { type: "warning" });
        return;
      }

      // Flatten groups to rows with calculated fields
      const exportData = activityGroups.flatMap((group) =>
        group.activities.map((activity) => {
          const createdAtDate = parseDateSafely(activity.created_at);
          const daysSinceActivity = createdAtDate
            ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return {
            campaign: sanitizeCsvValue(selectedCampaign),
            activity_type: sanitizeCsvValue(activity.type),
            activity_category: sanitizeCsvValue(activity.type),
            subject: sanitizeCsvValue(activity.subject),
            organization: sanitizeCsvValue(activity.organization_name),
            contact_name: sanitizeCsvValue(activity.contact_name || ""),
            date: createdAtDate ? format(createdAtDate, "yyyy-MM-dd") : "",
            sales_rep: sanitizeCsvValue(salesMap.get(activity.created_by!) || "Unassigned"),
            days_since_activity: daysSinceActivity,
            opportunity_name: sanitizeCsvValue(activity.opportunity_name || ""),
          };
        })
      );

      jsonExport(exportData, (err, csv) => {
        if (err) {
          logger.error("Export activities error", err, { feature: "CampaignActivityExport" });
          notify("Export failed. Please try again.", { type: "error" });
          return;
        }

        // Slugify campaign name for filename
        const campaignSlug = selectedCampaign
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");
        const dateStr = format(new Date(), "yyyy-MM-dd");
        downloadCSV(csv, `campaign-activity-${campaignSlug}-${dateStr}`);
        notify(`${exportData.length} activities exported successfully`, { type: "success" });
      });
    },
    [selectedCampaign, salesMap, notify]
  );

  const exportStaleLeads = useCallback(
    (staleOpportunities: StaleOpportunity[]) => {
      if (staleOpportunities.length === 0) {
        notify("No stale leads to export", { type: "warning" });
        return;
      }

      const exportData = staleOpportunities.map((opp) => {
        const lastActivityDateObj = opp.lastActivityDate ? parseDateSafely(opp.lastActivityDate) : null;
        return {
          campaign: sanitizeCsvValue(selectedCampaign),
          opportunity_name: sanitizeCsvValue(opp.name),
          organization: sanitizeCsvValue(opp.customer_organization_name || ""),
          last_activity_date: lastActivityDateObj ? format(lastActivityDateObj, "yyyy-MM-dd") : "Never",
          days_inactive: opp.daysInactive >= 999999 ? "Never contacted" : opp.daysInactive.toString(),
          notes: "", // Empty column for manual note-taking
        };
      });

      // Same export pattern
    },
    [selectedCampaign, notify]
  );

  return { exportStaleLeads, exportActivities };
}
```

**When to use**: All CSV export operations. Prevents formula injection and ensures consistent date formatting.

**Key points:**
- **Sanitization**: `sanitizeCsvValue` from `csvUploadValidator` prevents `=`, `+`, `-` injection
- **Date Formatting**: `format(date, "yyyy-MM-dd")` for ISO dates, not timestamps
- **Slugification**: Campaign name → valid filename (lowercase, hyphens, no special chars)
- **Flatmap**: Nested groups → flat rows for CSV export
- **Calculated Fields**: `days_since_activity`, `days_inactive` computed at export time
- **Empty Notes Column**: Placeholder for manual follow-up notes
- **Error Handling**: Fail-fast with user notification, structured logging

**Example:** `src/atomic-crm/reports/CampaignActivity/useCampaignActivityExport.ts`

---

## Pattern G: ReportLayout with Action Slot

Consistent page structure with title, export button, and custom action slot.

```tsx
// ReportLayout.tsx
interface ReportLayoutProps {
  title: string;
  children: ReactNode;
  onExport?: () => void;
  actions?: ReactNode; // Custom action buttons
}

export function ReportLayout({ title, children, onExport, actions }: ReportLayoutProps) {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {actions}
          {onExport && (
            <AdminButton onClick={onExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </AdminButton>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
```

```tsx
// Usage
<ReportLayout
  title="Campaign Activity Report"
  onExport={handleExport}
  actions={
    <>
      <Button onClick={handleRefresh}>Refresh</Button>
      <DateRangePicker value={dateRange} onChange={setDateRange} />
    </>
  }
>
  <CampaignActivityFilters />
  <ActivityTypeCards />
</ReportLayout>
```

**When to use**: All report pages. Provides consistent header structure with export functionality.

**Key points:**
- **Semantic Spacing**: `space-y-4 p-6` follows design system rhythm
- **Title Hierarchy**: `text-3xl` for page title, `text-base` for chart titles
- **Action Slot**: `actions` prop for custom buttons (filters, refresh, date pickers)
- **Export Button**: Optional, right-aligned with download icon
- **Card Wrapper**: Semantic container for report content

**Example:** `src/atomic-crm/reports/ReportLayout.tsx`

---

## Pattern H: ReportPageShell with Breadcrumbs

Enhanced layout with breadcrumb navigation and design system spacing tokens.

```tsx
// components/ReportPageShell.tsx
interface Breadcrumb {
  label: string;
  href?: string; // Optional for current page
}

interface ReportPageShellProps {
  title: string;
  breadcrumbs: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
}

export function ReportPageShell({ title, breadcrumbs, actions, children }: ReportPageShellProps) {
  return (
    <div className="p-content lg:p-widget space-y-section">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center justify-between gap-content">
        <h1 className="text-3xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-compact">{actions}</div>}
      </div>

      <div className="space-y-section">{children}</div>
    </div>
  );
}
```

```tsx
// Usage
<ReportPageShell
  title="Opportunities by Principal"
  breadcrumbs={[
    { label: "Reports", href: "/reports" },
    { label: "Opportunities" }, // Current page - no href
  ]}
  actions={<Button onClick={handleExport}>Export</Button>}
>
  <FilterToolbar />
  <OpportunitiesTable />
</ReportPageShell>
```

**When to use**: Report pages requiring breadcrumb navigation or design system spacing tokens.

**Key points:**
- **Design System Spacing**: `p-content`, `p-widget`, `space-y-section`, `gap-content`, `gap-compact`
- **Breadcrumb A11y**: `aria-label="Breadcrumb"`, `aria-hidden` on separator icons
- **Current Page**: No `href` on current page breadcrumb, styled with `font-medium`
- **Responsive Padding**: `p-content` on mobile, `lg:p-widget` on desktop
- **Semantic Links**: React Router `Link` with hover states

**Example:** `src/atomic-crm/reports/components/ReportPageShell.tsx`

---

## Pattern Comparison Tables

### Data Fetching Approaches

| Approach | Pattern | When to Use | Stale Time |
|----------|---------|-------------|------------|
| **Generic Hook** | A (useReportData) | Standard list fetching with filters | 5 min |
| **Composite Hook** | D (useCampaignActivityData) | Multiple sources + RPC aggregates | 2-5 min |
| **Client Aggregation** | E (useCampaignActivityMetrics) | Grouping, percentages, business rules | N/A (derived) |
| **Direct RPC** | useQuery + dataProvider.rpc | Server-side aggregation only | 2-5 min |

### Chart Types & Use Cases

| Chart Type | Pattern | Data Shape | Best For |
|------------|---------|------------|----------|
| **Doughnut** | PipelineChart | `{ stage: string, count: number }[]` | Stage distribution, percentages |
| **Line** | ActivityTrendChart | `{ date: string, count: number }[]` | Time series, trends over time |
| **Bar** | RepPerformanceChart | `{ name: string, value: number }[]` | Comparisons, rankings |
| **Horizontal Bar** | TopPrincipalsChart | `{ name: string, value: number }[]` | Long labels, top N lists |

### Export Strategies

| Aspect | Activities Export | Stale Leads Export |
|--------|------------------|-------------------|
| **Data Source** | Filtered activities | Calculated stale opportunities |
| **Flattening** | `flatMap` (groups → rows) | `map` (already flat) |
| **Calculated Fields** | `days_since_activity` | `days_inactive`, "Never contacted" |
| **Filename Pattern** | `campaign-activity-{slug}-{date}` | `campaign-stale-leads-{slug}-{date}` |
| **Empty Columns** | None | `notes` (for manual follow-up) |

---

## Anti-Patterns

### ❌ Hardcoded Chart Colors

```tsx
// WRONG: Hex codes violate Constitution #8
const chartData = {
  datasets: [{
    backgroundColor: [
      "#3B82F6", // Blue
      "#EF4444", // Red
      "#10B981", // Green
    ],
  }],
};

// CORRECT: Use semantic colors from theme hook
const { colors } = useChartTheme();
const chartData = {
  datasets: [{
    backgroundColor: [
      colors.primary,
      colors.destructive,
      colors.success,
    ],
  }],
};
```

**Why it matters:** Hardcoded colors break when design system changes (light/dark mode, rebrand). Semantic colors update automatically.

### ❌ Direct Supabase RPC Calls

```tsx
// WRONG: Bypasses data provider validation
import { supabase } from "@/lib/supabase";

const { data } = await supabase.rpc("get_campaign_stats", { p_campaign: "Q1 2025" });

// CORRECT: Use data provider extension
const dataProvider = useDataProvider() as ExtendedDataProvider;
const data = await dataProvider.rpc<GetCampaignStatsResponse>(
  "get_campaign_stats",
  { p_campaign: "Q1 2025" }
);
```

**Why it matters:** Direct calls skip Zod validation at RPC boundary, error logging, and TypeScript type inference.

### ❌ Object Dependencies in useMemo/useEffect

```tsx
// WRONG: dateRange object reference changes every render → infinite loop
const filter = useMemo(() => ({
  start: dateRange?.start,
  end: dateRange?.end,
}), [dateRange]); // ⚠️ New object reference every time parent renders

// CORRECT: Extract primitive values as dependencies
const startStr = dateRange?.start?.toISOString() ?? null;
const endStr = dateRange?.end?.toISOString() ?? null;

const filter = useMemo(() => ({
  start: startStr,
  end: endStr,
}), [startStr, endStr]); // ✅ Primitive strings - stable references
```

**Why it matters:** Objects compared by reference. Parent creating new `dateRange` objects on each render causes infinite re-fetching.

### ❌ Uncontrolled Export Data

```tsx
// WRONG: Exporting raw database values with potential injection
const exportData = activities.map((a) => ({
  subject: a.subject, // Could contain "=SUM(A1:A10)" formula injection
  notes: a.notes,
}));

// CORRECT: Sanitize all user-generated content
const exportData = activities.map((a) => ({
  subject: sanitizeCsvValue(a.subject),
  notes: sanitizeCsvValue(a.notes),
}));
```

**Why it matters:** CSV formula injection allows malicious users to execute code when file opened in Excel. `sanitizeCsvValue` strips `=`, `+`, `-` prefixes.

### ❌ Missing Chart Empty States

```tsx
// WRONG: Chart crashes when data is empty array
<Doughnut data={chartData} options={options} />

// CORRECT: Guard empty state with message
if (data.length === 0) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      No pipeline data available
    </div>
  );
}

return <Doughnut data={chartData} options={options} />;
```

**Why it matters:** Empty datasets cause Chart.js errors or render 100% slices with "NaN%" tooltips. Explicit empty state improves UX.

---

## Migration Checklist: Adding New Reports

When adding a new report page:

1. [ ] **Create report component** following naming convention
   ```tsx
   // src/atomic-crm/reports/MyReport.tsx or tabs/MyReportTab.tsx
   export function MyReport() { /* ... */ }
   ```

2. [ ] **Use ReportPageShell or ReportLayout** for consistent structure
   ```tsx
   <ReportPageShell
     title="My Report"
     breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "My Report" }]}
   >
     {/* Report content */}
   </ReportPageShell>
   ```

3. [ ] **Create dedicated data hook** following useReportData pattern
   ```tsx
   // hooks/useMyReportData.ts
   export function useMyReportData(filters: MyFilters) {
     const { data, isLoading } = useReportData<MyEntity>("my_resource", {
       dateRange: filters.dateRange,
       additionalFilters: { /* ... */ },
     });
     return { data, isLoading };
   }
   ```

4. [ ] **Wrap charts in ChartWrapper** with loading states
   ```tsx
   <ChartWrapper title="My Chart" isLoading={isLoading}>
     <MyChart data={chartData} />
   </ChartWrapper>
   ```

5. [ ] **Implement CSV export** with sanitization
   ```tsx
   const exportData = data.map((row) => ({
     field1: sanitizeCsvValue(row.field1),
     field2: format(parseDateSafely(row.date), "yyyy-MM-dd"),
   }));
   jsonExport(exportData, (err, csv) => {
     if (err) { /* handle error */ }
     downloadCSV(csv, `my-report-${format(new Date(), "yyyy-MM-dd")}`);
   });
   ```

6. [ ] **Use semantic colors** via useChartTheme hook
   ```tsx
   const { colors, font } = useChartTheme();
   // Use colors.primary, colors.success, etc.
   ```

7. [ ] **Add empty state handling** for charts and tables
   ```tsx
   if (data.length === 0) {
     return <EmptyState message="No data available for selected filters" />;
   }
   ```

8. [ ] **Memoize expensive calculations** with useMemo
   ```tsx
   const groupedData = useMemo(() => {
     // Expensive grouping logic
   }, [data]);
   ```

9. [ ] **Add to report navigation** (tabs or routes)
   ```tsx
   // In ReportsPage.tsx
   <TabsList>
     <TabsTrigger value="my-report">My Report</TabsTrigger>
   </TabsList>
   ```

10. [ ] **Test with edge cases**
    - [ ] Empty dataset
    - [ ] Single record
    - [ ] 1000+ records (pagination limit)
    - [ ] Missing optional fields
    - [ ] Date range filtering

---

## Performance Optimization Checklist

### Query Optimization

- [ ] **Use RPC for aggregates** instead of client-side calculation
  - Example: `get_campaign_report_stats` returns counts, not full datasets
- [ ] **Filter early** via `additionalFilters` in useReportData
  - Don't fetch all records then filter client-side
- [ ] **Fetch only needed IDs** for lookups
  - Example: `ownerIds` extracted from activities, then fetch only those sales reps
- [ ] **Use Map for O(1) lookups** instead of `find()` in loops
  - Example: `salesMap.get(id)` vs `salesReps.find(s => s.id === id)`

### Render Optimization

- [ ] **Memoize chart data and options** with useMemo
  - Prevent Chart.js recalculation on every render
- [ ] **Extract primitive dependencies** for hooks
  - Use `.toISOString()`, `JSON.stringify()` instead of object references
- [ ] **Use conditional queries** with `enabled` flag
  - Don't fetch stale opportunities until user toggles "Show Stale Leads"

### Bundle Optimization

- [ ] **Lazy load chart components** if heavy
  - Chart.js + plugins can be 50KB+ gzipped
- [ ] **Import only needed Chart.js components** in chartSetup.ts
  - Don't import `Filler`, `RadarElement` if not used

---

## Accessibility Standards for Reports

### Chart Accessibility

- [ ] **Add aria-label with data summary**
  ```tsx
  aria-label={`Pipeline chart showing ${total} opportunities across ${stages.length} stages`}
  ```
- [ ] **Set role="img"** on chart canvas
- [ ] **Provide data table alternative** for screen readers (optional)
  ```tsx
  <details className="sr-only">
    <summary>Pipeline data table</summary>
    <table>{/* Accessible table with same data */}</table>
  </details>
  ```

### Filter Accessibility

- [ ] **Label all form controls** explicitly
  ```tsx
  <label htmlFor="campaign-select">Campaign</label>
  <select id="campaign-select">{/* options */}</select>
  ```
- [ ] **Associate errors with inputs** via aria-describedby
  ```tsx
  <input aria-describedby={error ? "date-error" : undefined} />
  {error && <div id="date-error" role="alert">{error}</div>}
  ```

### Table Accessibility

- [ ] **Use semantic table elements** (`<thead>`, `<tbody>`, `<th scope="col">`)
- [ ] **Sort indicators** visible to screen readers
  ```tsx
  <th aria-sort={sortDirection === "ascending" ? "ascending" : "descending"}>
    Name <ArrowUp aria-hidden="true" />
  </th>
  ```
