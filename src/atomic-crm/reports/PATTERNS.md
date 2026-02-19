# Reports Patterns

Standard patterns for business intelligence, analytics, and reporting in Crispy CRM.

## Architecture Overview

```
ReportsPage (Entry Point, URL-driven tab selection)
|
+-- ReportPageShell (Layout: breadcrumbs, title, section rule, filterBar slot, actions)
|   |
|   +-- filterBar slot ---------> ReportParameterBar (switches inner bar by activeTab)
|   |                              +-- OverviewParameterBar      (Period, Owner)
|   |                              +-- OpportunitiesParameterBar (Principal, Stage, Owner, DateRange)
|   |                              +-- WeeklyParameterBar        (Start, End)
|   |                              +-- CampaignParameterBar      (Campaign, DateRange, Rep, Types, StaleToggle)
|   |
|   +-- actions slot ------------> "Copy Link" button (builds shareable URL from store state)
|   |
|   +-- children slot -----------> Tabs (Radix)
|       +-- TabsList (4 tabs: Overview, Opportunities, Weekly, Campaign)
|       +-- TabsContent (lazy-loaded via React.lazy + Suspense)
|           |
|           +-- OverviewTab (default export, lazy)
|           |   +-- KeyInsightsStrip (auto-generated contextual summaries)
|           |   +-- KPICard x4 (Open Opportunities, Team Activities, Stale Leads, Stale Deals)
|           |   +-- ChartWrapper > PipelineChart (horizontal bar)
|           |   +-- ChartWrapper > ActivityTrendChart (line)
|           |   +-- ChartWrapper > TopPrincipalsChart (horizontal bar)
|           |   +-- ChartWrapper > RepPerformanceChart (grouped bar)
|           |
|           +-- OpportunitiesTab (lazy wrapper)
|           |   +-- OpportunitiesByPrincipalReport
|           |       +-- KPICard x3 (Total Opps, Principals, Avg per Principal)
|           |       +-- PrincipalGroupCard xN (collapsible, with opportunity table)
|           |
|           +-- WeeklyActivityTab (lazy wrapper)
|           |   +-- WeeklyActivitySummary
|           |       +-- KPICard x3 (Total Activities, Active Reps, Avg per Rep)
|           |       +-- RepActivityCard xN (collapsible, with principal/type matrix table)
|           |
|           +-- CampaignActivityTab (lazy wrapper)
|               +-- CampaignActivityReport
|                   +-- KPICard x4 (Total Activities, Orgs Contacted, Coverage Rate, Avg per Lead)
|                   +-- ActivityTypeCard xN (collapsible, with activity detail table)
|                   +-- StaleLeadsView (conditional on showStaleLeads toggle)
|
+-- Data Hooks Layer
    +-- useReportFilterState (store-backed persistence + URL seeding)
    +-- useReportData<T> (generic data fetcher via dataProvider)
    +-- useCampaignActivityData (composite: RPC + activities + sales reps + stale opps)
    +-- useCampaignFilterOptions (light RPC for filter metadata, deduped with above)
    +-- useCampaignActivityMetrics (client-side grouping + staleness calculation)
    +-- useCampaignActivityExport (CSV export: activities + stale leads)
    +-- useChartTheme (CSS variable resolution for Chart.js)
    +-- useScrollFadeRight (horizontal overflow fade indicator)
```

---

## Data Flow

```
URL ?tab=X&filters=JSON
         |
         v
useReportFilterState (seeds store from URL once, then clears URL params)
         |
         v
React Admin useStore("reports.<tab>") -- localStorage-backed persistence
         |
    +----+----+
    |         |
    v         v
Tab Content   ReportParameterBar
(reads store, (reads/writes store
 owns URL     via useStore directly,
 seeding)     NOT useReportFilterState)
    |
    v
useReportData / useGetList / useQuery (RPC)
    |
    v
unifiedDataProvider (Supabase) -- single entry point, Zod validated
    |
    v
Client-side aggregation (useMemo) -- grouping, percentages, trends
    |
    v
Presentation (KPICard, ChartWrapper, tables, empty states)
```

**Critical rule**: Only tab content components call `useReportFilterState` (which seeds from URL on mount). The `ReportParameterBar` uses `useStore` directly to read/write filter state, avoiding double-seeding side effects.

---

## Pattern A: Store-Backed Filter Persistence (useReportFilterState)

### Problem

Report filters must survive tab switches, page navigation, and browser refreshes. Users also need shareable URLs that reproduce filter state.

### Solution

`useReportFilterState` wraps React Admin's `useStore()` (localStorage-backed) with two additions: (1) URL seeding on mount, (2) a `buildShareUrl` helper that serializes non-default filter values into the URL.

### Implementation

```tsx
// hooks/useReportFilterState.ts:88-132
export function useReportFilterState<T extends FilterState>(
  storeKey: string,
  defaults: T
): [T, (update: Partial<T>) => void, () => void] {
  const [stored, setStored] = useStore<T>(storeKey, defaults);
  const [searchParams, setSearchParams] = useSearchParams();
  const seededRef = useRef(false);

  // On mount: seed store from URL params if present, then clear filter params
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const filterParam = searchParams.get("filters");
    if (!filterParam) return;

    const parsed = JSON.parse(decodeURIComponent(filterParam)) as Partial<T>;
    setStored({ ...stored, ...parsed });

    // Clean filter params from URL, preserve tab param
    const tab = searchParams.get("tab");
    const cleaned = new URLSearchParams();
    if (tab) cleaned.set("tab", tab);
    setSearchParams(cleaned, { replace: true });
  }, []);

  const update = useCallback(
    (partial: Partial<T>) => setStored({ ...stored, ...partial }),
    [stored, setStored]
  );

  const reset = useCallback(() => setStored(defaults), [defaults, setStored]);

  return [stored, update, reset];
}
```

**Store keys**: `reports.overview`, `reports.opportunities`, `reports.weekly`, `reports.campaign`

**Filter state types** (hooks/useReportFilterState.ts:19-73):
- `OverviewFilterState`: `{ datePreset, salesRepId }`
- `OpportunitiesFilterState`: `{ principal_organization_id, stage[], opportunity_owner_id, startDate, endDate }`
- `WeeklyFilterState`: `{ start, end }`
- `CampaignFilterState`: `{ selectedCampaign, datePreset, startDate, endDate, selectedActivityTypes[], selectedSalesRep, showStaleLeads }`

---

## Pattern B: Horizontal Parameter Bar (ReportParameterBar)

### Problem

Each report tab has different filter parameters. The parameter bar must switch controls based on the active tab while sharing a consistent horizontal layout.

### Solution

`ReportParameterBar` is a switch component that renders a tab-specific inner bar. Each inner bar reads/writes its tab's store key via `useStore` directly (not `useReportFilterState`) to avoid double URL-seeding.

### Implementation

```tsx
// components/ReportParameterBar.tsx:60-73
export function ReportParameterBar({ activeTab }: ReportParameterBarProps) {
  switch (activeTab) {
    case "overview":      return <OverviewParameterBar />;
    case "opportunities": return <OpportunitiesParameterBar />;
    case "weekly":        return <WeeklyParameterBar />;
    case "campaign":      return <CampaignParameterBar />;
    default:              return null;
  }
}
```

Each inner bar follows the same structure:
1. `useStore<TabFilterState>("reports.<tab>", DEFAULTS)` for state
2. `useCallback` update helper for partial state merges
3. `role="toolbar"` with `aria-label` on the container div
4. `h-11` minimum touch targets on all controls
5. `paper-micro-label` for control labels above each field

**Filter control types used**:
- `Select` (Radix) -- for single-value dropdowns (Period, Owner, Principal, Campaign)
- `CheckboxPopoverFilter` -- for multi-select (Stage, Activity Types)
- `DateRangePopoverFilter` -- for date range pickers (collapsed into a single trigger)
- `Switch` -- for boolean toggles (Stale Leads)
- `<input type="date">` -- for raw date inputs (Weekly start/end)

---

## Pattern C: Generic Report Data Hook (useReportData)

### Problem

Reports need consistent data access through the provider layer with standardized filtering, pagination, and error handling.

### Solution

`useReportData<T>` centralizes all report data fetching through `useDataProvider()`. It constructs filters from primitives to prevent render loops, uses a large pagination limit (1000) for client-side aggregation, and exposes truncation warnings.

### Implementation

```tsx
// hooks/useReportData.ts:59-169
export function useReportData<T extends RaRecord>(
  resource: string,
  options: UseReportDataOptions = {}
): UseReportDataResult<T> {
  const dataProvider = useDataProvider();

  // CRITICAL: Extract primitive values to prevent render loops
  const dateStartStr = dateRange?.start?.toISOString() ?? null;
  const dateEndStr = dateRange?.end?.toISOString() ?? null;

  const filter = useMemo(() => {
    const baseFilter: Record<string, unknown> = additionalFilters ? { ...additionalFilters } : {};
    if (dateStartStr) baseFilter[`${dateField}@gte`] = dateStartStr;
    if (dateEndStr) baseFilter[`${dateField}@lte`] = dateEndStr;
    if (salesRepId) baseFilter.sales_id = salesRepId;
    return baseFilter;
  }, [dateStartStr, dateEndStr, salesRepId, dateField, additionalFilters, secondarySalesSource]);

  useEffect(() => {
    let cancelled = false;
    dataProvider.getList<T>(resource, {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "id", order: "DESC" },
      filter,
    }).then(result => {
      if (!cancelled) {
        setData(result.data);
        setTotal(result.total ?? result.data.length);
        setIsTruncated((result.total ?? result.data.length) > 1000);
      }
    });
    return () => { cancelled = true; };
  }, [dataProvider, resource, filter, refetchTrigger]);
  // ...
}
```

**Key design decisions**:
- 1000-record pagination limit (current scale: ~500 opportunities, 6 reps, 9 principals)
- `isTruncated` flag warns consumers when data exceeds limit
- `cancelled` flag prevents state updates on unmounted components
- Fail-fast: no retry logic, errors surface immediately
- Migration path: Edge Function server-side aggregation when data exceeds 1000 records

---

## Pattern D: Lazy-Loaded Tab Content

### Problem

Loading all four report tabs upfront increases initial bundle size and blocks rendering with data fetches for non-visible tabs.

### Solution

Each tab wrapper uses `React.lazy()` + `Suspense` with a `TabSkeleton` fallback. The tab content module is a default export, allowing dynamic import splitting.

### Implementation

```tsx
// ReportsPage.tsx:22-25
const OverviewTab = lazy(() => import("./tabs/OverviewTab"));
const OpportunitiesTab = lazy(() => import("./tabs/OpportunitiesTab"));
const WeeklyActivityTab = lazy(() => import("./tabs/WeeklyActivityTab"));
const CampaignActivityTab = lazy(() => import("./tabs/CampaignActivityTab"));

// ReportsPage.tsx:140-163
<TabsContent value="overview" className="mt-0">
  <Suspense fallback={<TabSkeleton />}>
    <OverviewTab />
  </Suspense>
</TabsContent>
```

Tab wrappers (`tabs/*.tsx`) also use a secondary `React.lazy()` for the actual report component, providing tab-specific skeleton shapes:

```tsx
// tabs/OpportunitiesTab.tsx:4
const OpportunitiesByPrincipalReport = lazy(() => import("../OpportunitiesByPrincipalReport"));
```

**Loading state hierarchy**: `TabSkeleton` (page-level) -> tab-specific skeleton -> `isFirstLoad` skeleton within each report component.

---

## Pattern E: Chart Theme System (useChartTheme)

### Problem

Chart.js renders to `<canvas>` and cannot use CSS `var()` references. Charts must read resolved CSS custom property values and update when the theme (light/dark) changes.

### Solution

`useChartTheme` reads computed CSS properties from `:root`, fails fast if any semantic variable is missing, and re-runs when `resolvedTheme` changes.

### Implementation

```tsx
// hooks/useChartTheme.ts:89-143
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<ChartTheme>(DEFAULT_THEME);

  useEffect(() => {
    const computedStyles = getComputedStyle(document.documentElement);

    const getCssVar = (varName: string): string => {
      const value = computedStyles.getPropertyValue(`--${varName}`).trim();
      if (!value) throwMissingCssVarError(`--${varName}`);
      return value;
    };

    setTheme({
      colors: {
        primary: getCssVar("primary"),
        chart1: getCssVar("chart-1"),
        chart2: getCssVar("chart-2"),
        // ... 8 chart palette colors + semantic colors
      },
      font: {
        family: computedStyles.getPropertyValue("--font-sans").trim() || "system-ui",
        size: 12,
      },
    });
  }, [resolvedTheme]);

  return theme;
}
```

Charts use shared utility functions from `charts/chartUtils.ts`:
- `createBaseChartOptions()` -- responsive, no aspect ratio, standard padding
- `createAxisConfig()` -- gridline colors, tick fonts from theme
- `withOklchAlpha()` -- adds alpha channel to OKLCH color strings for canvas rendering
- `truncateLabel()` -- shortens axis labels with ellipsis

**Chart.js registration**: `charts/chartSetup.ts` registers all required elements globally. Each chart file imports it as a side effect.

---

## Pattern F: Composite Data Hook (useCampaignActivityData)

### Problem

The Campaign Activity report combines multiple data sources: aggregated campaign stats (RPC), filtered activities (list), sales rep lookup, and conditional stale opportunities (RPC).

### Solution

`useCampaignActivityData` orchestrates multiple queries with React Query deduplication, conditional fetching, and efficient ID-based lookups.

### Implementation

```tsx
// CampaignActivity/useCampaignActivityData.ts:42-166
export function useCampaignActivityData(options: UseCampaignActivityDataOptions) {
  const dataProvider = useDataProvider() as ExtendedDataProvider;

  // RPC for aggregated stats (campaign list, rep counts, type counts)
  const { data: reportStats } = useQuery({
    queryKey: reportKeys.campaignStats(selectedCampaign),
    queryFn: () => dataProvider.rpc<GetCampaignReportStatsResponse>(
      "get_campaign_report_stats", { p_campaign: selectedCampaign || null }
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Activity details via generic hook
  const { data: activities } = useReportData<CampaignActivity>("activities", {
    dateRange: activitiesDateRange,
    additionalFilters: activitiesFilter,
  });

  // Sales reps -- only fetch IDs present in activities
  const ownerIds = useMemo(
    () => Array.from(new Set(activities.map(a => a.created_by).filter(Boolean))),
    [activities]
  );
  const { data: salesReps } = useGetList<Sale>("sales", {
    filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
  });

  // Stale opportunities -- conditional on showStaleLeads flag
  const { data: staleOpportunities } = useQuery({
    queryKey: reportKeys.staleOpportunities(selectedCampaign, dateRange, selectedSalesRep),
    queryFn: () => dataProvider.rpc<GetStaleOpportunitiesResponse>(
      "get_stale_opportunities", { /* params */ }
    ),
    enabled: showStaleLeads && !!selectedCampaign,
    staleTime: 2 * 60 * 1000, // 2 minutes (volatile data)
  });
}
```

**Query deduplication**: `useCampaignFilterOptions` shares the same `reportKeys.campaignStats` query key, so the RPC is called once even when both the parameter bar and tab content are mounted.

---

## Pattern G: CSV Export with Sanitization

### Problem

Reports need CSV export with proper date formatting and CSV formula injection prevention.

### Solution

Export hooks use `sanitizeCsvValue()` from `csvUploadValidator` on all user-generated content, `jsonexport` for CSV generation, and React Admin's `downloadCSV` for file download.

### Implementation

Three export patterns exist in the codebase:

| Report | Hook/Function | Filename Pattern |
|--------|---------------|------------------|
| Campaign Activities | `useCampaignActivityExport.exportActivities` | `campaign-activity-{slug}-{date}` |
| Campaign Stale Leads | `useCampaignActivityExport.exportStaleLeads` | `campaign-stale-leads-{slug}-{date}` |
| Opportunities | `exportOpportunitiesReport()` | `opportunities-by-principal-{date}` |
| Weekly Activity | inline in `WeeklyActivitySummary` | `weekly-activity-{start}-to-{end}` |

All exports follow the same contract:
1. Guard empty data with early return + user notification
2. Map records to flat export rows with `sanitizeCsvValue()` on strings
3. Format dates as `yyyy-MM-dd`
4. Slugify names for filenames (lowercase, hyphens, no special chars)
5. `jsonExport` callback with error logging + `downloadCSV`

---

## Pattern H: ReportPageShell Layout

### Problem

Reports need consistent page structure with breadcrumbs, title, section rule, a slot for the parameter bar, and actions.

### Solution

`ReportPageShell` provides a composable layout with named slots for `filterBar`, `actions`, and `children`.

### Implementation

```tsx
// components/ReportPageShell.tsx:19-59
export function ReportPageShell({ title, breadcrumbs, actions, filterBar, children }: ReportPageShellProps) {
  return (
    <div className="paper-dashboard-surface p-content md:p-widget space-y-section rounded-xl">
      <Breadcrumb>
        <BreadcrumbItem><Link to="/">Home</Link></BreadcrumbItem>
        {breadcrumbs.map(crumb => /* ... */)}
      </Breadcrumb>

      <div className="flex items-center justify-between gap-content">
        <h1 className="text-2xl md:text-3xl font-semibold ...">{title}</h1>
        {actions && <div className="flex items-center gap-compact">{actions}</div>}
      </div>

      <div className="paper-section-rule" aria-hidden="true">Reports &amp; Analytics</div>

      {filterBar && <div className="py-2">{filterBar}</div>}

      <div className="space-y-widget">{children}</div>
    </div>
  );
}
```

**Visual stacking order**: Breadcrumbs -> Title + Actions -> Section Rule -> Filter Bar -> Tab Content

---

## Pattern I: Collapsible Group Cards

### Problem

Reports with grouped data (by principal, by rep, by activity type) need expandable/collapsible sections with auto-expansion of top items on initial load.

### Solution

A `useRef`-guarded one-time effect auto-expands the top N groups on first data load. `Set<string>` tracks expanded state. Each card header is a `<button>` with `aria-expanded` and `aria-controls`.

### Implementation

```tsx
// OpportunitiesByPrincipalReport.tsx:157-165
const hasInitializedRef = useRef(false);
useEffect(() => {
  if (!hasInitializedRef.current && principalGroups.length > 0) {
    hasInitializedRef.current = true;
    const initialExpanded = new Set(principalGroups.slice(0, 3).map(g => g.principalId || "null"));
    setExpandedPrincipals(initialExpanded);
  }
}, [principalGroups]);
```

Used in three places:
- `OpportunitiesByPrincipalReport` -- top 3 principals auto-expanded
- `WeeklyActivitySummary` -- top 2 reps auto-expanded
- `CampaignActivityReport` -- top 3 activity types auto-expanded

---

## Pattern J: Shareable URL Generation

### Problem

Users need to share report views with specific filter configurations via URL.

### Solution

`buildShareUrl()` serializes only non-default filter values into a `?tab=X&filters=JSON` URL. On the receiving end, `useReportFilterState` detects the `filters` param, seeds the store, and clears it from the URL.

### Implementation

```tsx
// hooks/useReportFilterState.ts:142-171
export function buildShareUrl<T extends FilterState>(tab: string, filters: T, defaults: T): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();
  params.set("tab", tab);

  // Only include non-default values to keep URL clean
  const nonDefaults: Record<string, unknown> = {};
  for (const key of Object.keys(filters)) {
    if (JSON.stringify(filters[key]) !== JSON.stringify(defaults[key])) {
      nonDefaults[key] = filters[key];
    }
  }

  if (Object.keys(nonDefaults).length > 0) {
    params.set("filters", encodeURIComponent(JSON.stringify(nonDefaults)));
  }

  return `${base}?${params.toString()}`;
}
```

The "Copy Link" button in `ReportsPage` reads all four tab stores and calls `buildShareUrl` for the active tab.

---

## Pattern K: Date Preset Resolution

### Problem

The Overview tab stores a preset name (e.g., `"last30"`) but data hooks need concrete `Date` objects.

### Solution

`resolvePreset()` maps preset strings to `{ start: Date, end: Date }` using `date-fns`. Returns `null` for unknown presets (meaning "no date filtering").

### Implementation

```tsx
// utils/resolvePreset.ts:31-60
export function resolvePreset(preset: string): ResolvedDateRange | null {
  const now = new Date();
  switch (preset) {
    case "today":     return { start: startOfDay(now), end: now };
    case "yesterday": return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    case "last7":     return { start: subDays(now, 7), end: now };
    case "last30":    return { start: subDays(now, 30), end: now };
    case "thisMonth": return { start: startOfMonth(now), end: now };
    case "lastMonth": return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    // ...
    default:          return null;
  }
}
```

**Preset catalogs** (constants.ts):
- `DATE_PRESETS`: today, yesterday, last7, last30, thisMonth, lastMonth (Overview)
- `CAMPAIGN_DATE_PRESETS`: allTime, last7, last30, thisMonth, custom (Campaign)

---

## Filter Component Library

### CheckboxPopoverFilter

Multi-select filter rendered as a popover with checkboxes. Trigger shows "N selected" / "All" / "None" / single item label.

```
components/CheckboxPopoverFilter.tsx
Props: label, options[], selected[], onChange, showSelectAll?, triggerWidth?, ariaLabel?
Used by: OpportunitiesParameterBar (Stage), CampaignParameterBar (Activity Types)
```

### DateRangePopoverFilter

Date range picker collapsed into a single trigger. Shows "All time" when both dates null, or "Mar 01 - Mar 31" formatted range.

```
components/DateRangePopoverFilter.tsx
Props: label, startDate, endDate, onStartChange, onEndChange, triggerWidth?, startId?, endId?
Used by: OpportunitiesParameterBar (Date Range), CampaignParameterBar (Custom Range)
```

### FilterChip

Removable tag showing an active filter with keyboard-accessible remove button.

```
components/FilterChip.tsx
Props: label, value, onRemove
Uses: role="listitem", 44px touch targets, keyboard Enter/Space support
```

### KeyInsightsStrip

Auto-generated contextual summaries displayed above KPI cards. Derives up to 3 insights from pipeline data, rep performance, and stale deal counts.

```
components/KeyInsightsStrip.tsx
Props: pipelineData, repPerformanceData, staleDeals, isLoading
Insights: dominant pipeline stage, most active rep, stale deal warning
Used by: OverviewTab
```

### KPIDrillDown

Sheet (slide-over) panel for detailed KPI exploration. Uses Radix Sheet component with proper `SheetTitle` and `SheetDescription` landmarks.

```
components/KPIDrillDown.tsx
Props: open, onClose, title, description?, children
```

### ChartWrapper

Consistent card layout for charts with loading skeleton states and responsive height.

```
components/ChartWrapper.tsx
Props: title, children, isLoading?, className?
Height: h-[260px] md:h-[280px] lg:h-[300px]
Used by: OverviewTab (4 charts)
```

---

## Chart Types

| Component | Type | Library | Data Shape | Used In |
|-----------|------|---------|------------|---------|
| PipelineChart | Horizontal Bar | react-chartjs-2 `<Bar>` | `{ stage, count }[]` | OverviewTab |
| ActivityTrendChart | Line (filled) | react-chartjs-2 `<Line>` | `{ date, count }[]` | OverviewTab |
| TopPrincipalsChart | Horizontal Bar | react-chartjs-2 `<Bar>` | `{ name, count, id? }[]` | OverviewTab |
| RepPerformanceChart | Grouped Bar | react-chartjs-2 `<Bar>` | `{ name, activities, opportunities, id? }[]` | OverviewTab |

All charts:
- Use `useChartTheme()` for colors and fonts
- Memoize `chartData` and `options` via `useMemo`
- Include `aria-label` with data summary and `role="img"`
- Guard empty data with a centered "No data available" message
- Support click handlers for drilldown navigation
- Show drilldown links below the chart (max 5-7 items)
- Import `./chartSetup` for Chart.js component registration

---

## Anti-Patterns

### Do not use useReportFilterState in ReportParameterBar

```tsx
// WRONG: Double URL-seeding when both parameter bar and tab content use this
const [state, update] = useReportFilterState("reports.overview", OVERVIEW_DEFAULTS);

// CORRECT: Parameter bar uses useStore directly
const [state, setState] = useStore<OverviewFilterState>("reports.overview", OVERVIEW_DEFAULTS);
```

**Why**: `useReportFilterState` seeds from URL params on mount. If both the parameter bar and the tab content call it, the URL params get consumed twice, potentially causing race conditions.

### Do not use object references as useMemo/useEffect dependencies

```tsx
// WRONG: dateRange is a new object on every render -> infinite re-fetch loop
const filter = useMemo(() => ({ start: dateRange.start }), [dateRange]);

// CORRECT: Extract primitives
const startStr = dateRange?.start?.toISOString() ?? null;
const filter = useMemo(() => ({ start: startStr }), [startStr]);
```

**Why**: Objects compared by reference. Parent re-renders create new object references, triggering infinite re-fetches in `useReportData`.

### Do not use hardcoded colors in charts

```tsx
// WRONG: Hex codes violate semantic color rules
backgroundColor: ["#3B82F6", "#EF4444"]

// CORRECT: Use chart palette from theme
const { colors } = useChartTheme();
backgroundColor: [colors.chart1, colors.chart2]
```

**Why**: Hardcoded colors break light/dark mode switching and design system updates.

### Do not bypass the data provider for RPC calls

```tsx
// WRONG: Direct Supabase import
import { supabase } from "@/lib/supabase";
const { data } = await supabase.rpc("get_campaign_report_stats", { ... });

// CORRECT: Use data provider extension
const dataProvider = useDataProvider() as ExtendedDataProvider;
const data = await dataProvider.rpc<GetCampaignReportStatsResponse>("get_campaign_report_stats", { ... });
```

**Why**: Direct calls skip Zod validation, error logging, and type inference at the RPC boundary.

### Do not export unsanitized CSV data

```tsx
// WRONG: Formula injection risk
exportData.push({ subject: activity.subject });

// CORRECT: Sanitize all user-generated content
exportData.push({ subject: sanitizeCsvValue(activity.subject) });
```

**Why**: CSV formula injection (`=SUM(...)`, `+CMD(...)`) allows code execution when opened in Excel.

### Do not render charts without empty state guards

```tsx
// WRONG: Chart.js errors or NaN% tooltips on empty data
return <Bar data={chartData} options={options} />;

// CORRECT: Guard empty state
if (data.length === 0) {
  return <div className="flex items-center justify-center h-full text-muted-foreground">
    No data available
  </div>;
}
return <Bar data={chartData} options={options} />;
```

---

## File Reference

### Entry Point
- `ReportsPage.tsx` -- Tab routing, lazy imports, share URL, cleanup migration

### Layout & Shell
- `components/ReportPageShell.tsx` -- Breadcrumb + title + filterBar slot + children
- `components/ReportParameterBar.tsx` -- Horizontal parameter bar (switches by tab)

### Tab Wrappers
- `tabs/OverviewTab.tsx` -- KPIs, charts, insights (default export)
- `tabs/OpportunitiesTab.tsx` -- Lazy wrapper for OpportunitiesByPrincipalReport
- `tabs/WeeklyActivityTab.tsx` -- Lazy wrapper for WeeklyActivitySummary
- `tabs/CampaignActivityTab.tsx` -- Lazy wrapper for CampaignActivityReport

### Report Components
- `OpportunitiesByPrincipalReport.tsx` -- Grouped opportunities by principal
- `WeeklyActivitySummary.tsx` -- Rep/principal activity matrix
- `CampaignActivity/CampaignActivityReport.tsx` -- Campaign activity breakdown
- `CampaignActivity/ActivityTypeCard.tsx` -- Expandable activity type group
- `CampaignActivity/StaleLeadsView.tsx` -- Stale opportunities table
- `opportunities-by-principal/components/PrincipalGroupCard.tsx` -- Expandable principal group

### Shared Components
- `components/CheckboxPopoverFilter.tsx` -- Multi-select popover
- `components/DateRangePopoverFilter.tsx` -- Date range popover
- `components/FilterChip.tsx` -- Removable filter tag
- `components/KeyInsightsStrip.tsx` -- Auto-generated insights
- `components/KPIDrillDown.tsx` -- Sheet panel for KPI exploration
- `components/ChartWrapper.tsx` -- Chart card with loading skeleton
- `components/index.ts` -- Barrel exports (includes re-exports of KPICard, EmptyState)

### Hooks
- `hooks/useReportFilterState.ts` -- Store persistence + URL seeding + share URL builder
- `hooks/useReportData.ts` -- Generic report data fetcher
- `hooks/useChartTheme.ts` -- CSS variable resolution for Chart.js
- `hooks/useScrollFadeRight.ts` -- Horizontal overflow fade indicator
- `hooks/index.ts` -- Barrel exports

### Campaign-Specific Hooks
- `CampaignActivity/useCampaignActivityData.ts` -- Composite data (RPC + activities + sales + stale)
- `CampaignActivity/useCampaignFilterOptions.ts` -- Light RPC for filter metadata
- `CampaignActivity/useCampaignActivityMetrics.ts` -- Client-side grouping + staleness
- `CampaignActivity/useCampaignActivityExport.ts` -- CSV export (activities + stale leads)

### Charts
- `charts/chartSetup.ts` -- Chart.js component registration
- `charts/chartUtils.ts` -- Shared chart utilities (axis config, label truncation, OKLCH alpha)
- `charts/PipelineChart.tsx` -- Horizontal bar (pipeline by stage)
- `charts/ActivityTrendChart.tsx` -- Line chart (activity over time)
- `charts/TopPrincipalsChart.tsx` -- Horizontal bar (top 5 principals)
- `charts/RepPerformanceChart.tsx` -- Grouped bar (activities + opportunities per rep)

### Utilities
- `utils/resolvePreset.ts` -- Date preset string to concrete Date range
- `utils/cleanupMigration.ts` -- Removes orphaned localStorage keys from previous architecture

### Constants & Types
- `constants.ts` -- `DATE_PRESETS`, `CAMPAIGN_DATE_PRESETS`
- `types.ts` -- `Sale`, `Activity`, `ActivityGroup`

---

## Migration Checklist: Adding a New Report Tab

1. [ ] **Define filter state type and defaults** in `hooks/useReportFilterState.ts`
   - Add interface `NewTabFilterState`
   - Add `NEWTAB_DEFAULTS` constant
   - Add to `FilterState` union type
   - Export from `hooks/index.ts`

2. [ ] **Add store key** in `ReportsPage.tsx`
   ```tsx
   const [newTabFilters] = useStore<NewTabFilterState>("reports.newtab", NEWTAB_DEFAULTS);
   ```

3. [ ] **Add parameter bar section** in `components/ReportParameterBar.tsx`
   - Add `case "newtab": return <NewTabParameterBar />;`
   - Use `useStore` directly (not `useReportFilterState`)
   - Follow `role="toolbar"` and `h-11` patterns

4. [ ] **Create tab content component** as default export
   ```tsx
   // MyNewReport.tsx
   export default function MyNewReport() { /* ... */ }
   ```

5. [ ] **Create tab wrapper** in `tabs/NewTab.tsx`
   ```tsx
   const MyNewReport = lazy(() => import("../MyNewReport"));
   export default function NewTab() {
     return <Suspense fallback={<Skeleton />}><MyNewReport /></Suspense>;
   }
   ```

6. [ ] **Register in ReportsPage.tsx**
   - Add lazy import
   - Add `TabsTrigger` and `TabsContent`
   - Add to `filterMap` for share URL
   - Add to `tabLabels` for breadcrumbs

7. [ ] **Use useReportData** for data fetching (not direct Supabase)
   - Extract primitive dependencies for filter memos
   - Handle `isFirstLoad` vs `isRefreshing` states

8. [ ] **Wrap charts in ChartWrapper** with `isLoading` prop

9. [ ] **Add CSV export** with `sanitizeCsvValue` on all string fields

10. [ ] **Handle empty/error states**
    - `EmptyState` component for no data
    - Error banner for failed fetches
    - `isFirstLoad` skeleton for initial load

11. [ ] **Update cleanupMigration.ts** if adding new localStorage keys that replace old ones

12. [ ] **Test edge cases**
    - Empty dataset
    - Single record
    - 1000+ records (pagination limit / truncation warning)
    - Missing optional fields
    - Share URL round-trip (generate -> open -> verify filters applied)
