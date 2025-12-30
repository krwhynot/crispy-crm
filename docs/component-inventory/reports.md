# Reports Component Inventory

> Generated: 2025-12-29
> Source: `src/atomic-crm/reports/`
> Design System: OKLCH-based semantic colors, Tailwind v4

**Entry Point:** `src/atomic-crm/reports/index.tsx`
**Route:** `/#/reports`

---

## Overview

| Category | Count | Key Components |
|----------|-------|----------------|
| Entry/Layout | 3 | index.tsx, ReportsPage, ReportPageShell |
| Tabs | 4 | Overview, Opportunities, Weekly Activity, Campaign |
| Sub-Reports | 3 | OpportunitiesByPrincipal, WeeklyActivity, CampaignActivity |
| UI Components | 8 | KPICard, ChartWrapper, TabFilterBar, FilterChip, etc. |
| Charts | 4 | Pipeline, ActivityTrend, TopPrincipals, RepPerformance |
| Hooks | 2 | useReportData, useChartTheme |
| Tests | 13 | Full coverage across components |

**Total: 45 files (32 source + 13 tests)**

---

## 1. Flat File List

| # | File Path | Type |
|---|-----------|------|
| 1 | `src/atomic-crm/reports/index.tsx` | Entry/exports |
| 2 | `src/atomic-crm/reports/ReportsPage.tsx` | Main container |
| 3 | `src/atomic-crm/reports/ReportLayout.tsx` | Layout wrapper |
| 4 | `src/atomic-crm/reports/types.ts` | Shared types |
| **Tabs** |||
| 5 | `src/atomic-crm/reports/tabs/OverviewTab.tsx` | Tab component |
| 6 | `src/atomic-crm/reports/tabs/OpportunitiesTab.tsx` | Tab component |
| 7 | `src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx` | Tab component |
| 8 | `src/atomic-crm/reports/tabs/CampaignActivityTab.tsx` | Tab component |
| **Sub-Reports** |||
| 9 | `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx` | Report component |
| 10 | `src/atomic-crm/reports/WeeklyActivitySummary.tsx` | Report component |
| 11 | `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` | Report component |
| 12 | `src/atomic-crm/reports/CampaignActivity/ActivityTypeCard.tsx` | Card component |
| 13 | `src/atomic-crm/reports/CampaignActivity/StaleLeadsView.tsx` | View component |
| **UI Components** |||
| 14 | `src/atomic-crm/reports/components/index.ts` | Barrel export |
| 15 | `src/atomic-crm/reports/components/ReportPageShell.tsx` | Layout shell |
| 16 | `src/atomic-crm/reports/components/KPICard.tsx` | Metric card |
| 17 | `src/atomic-crm/reports/components/KPIDrillDown.tsx` | Drill-down modal |
| 18 | `src/atomic-crm/reports/components/ChartWrapper.tsx` | Chart container |
| 19 | `src/atomic-crm/reports/components/TabFilterBar.tsx` | Filter bar |
| 20 | `src/atomic-crm/reports/components/AppliedFiltersBar.tsx` | Active filters display |
| 21 | `src/atomic-crm/reports/components/FilterChip.tsx` | Filter tag |
| 22 | `src/atomic-crm/reports/components/EmptyState.tsx` | Empty state |
| **Charts** |||
| 23 | `src/atomic-crm/reports/charts/chartSetup.ts` | Chart.js config |
| 24 | `src/atomic-crm/reports/charts/chartUtils.ts` | Chart utilities |
| 25 | `src/atomic-crm/reports/charts/PipelineChart.tsx` | Doughnut chart |
| 26 | `src/atomic-crm/reports/charts/ActivityTrendChart.tsx` | Line chart |
| 27 | `src/atomic-crm/reports/charts/TopPrincipalsChart.tsx` | Bar chart |
| 28 | `src/atomic-crm/reports/charts/RepPerformanceChart.tsx` | Bar chart |
| **Hooks** |||
| 29 | `src/atomic-crm/reports/hooks/index.ts` | Barrel export |
| 30 | `src/atomic-crm/reports/hooks/useReportData.ts` | Data fetching hook |
| 31 | `src/atomic-crm/reports/hooks/useChartTheme.ts` | Chart theming hook |
| **Utils** |||
| 32 | `src/atomic-crm/reports/utils/cleanupMigration.ts` | Migration cleanup |
| **Tests** |||
| 33 | `src/atomic-crm/reports/ReportsPage.test.tsx` | Test |
| 34 | `src/atomic-crm/reports/OpportunitiesByPrincipalReport.test.tsx` | Test |
| 35 | `src/atomic-crm/reports/tabs/OverviewTab.test.tsx` | Test |
| 36 | `src/atomic-crm/reports/components/KPICard.test.tsx` | Test |
| 37 | `src/atomic-crm/reports/components/ReportPageShell.test.tsx` | Test |
| 38 | `src/atomic-crm/reports/components/TabFilterBar.test.tsx` | Test |
| 39 | `src/atomic-crm/reports/components/FilterChip.test.tsx` | Test |
| 40 | `src/atomic-crm/reports/components/AppliedFiltersBar.test.tsx` | Test |
| 41 | `src/atomic-crm/reports/components/EmptyState.test.tsx` | Test |
| 42 | `src/atomic-crm/reports/components/KPIDrillDown.test.tsx` | Test |
| 43 | `src/atomic-crm/reports/hooks/useReportData.test.tsx` | Test |
| 44 | `src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx` | Test |
| 45 | `src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx` | Test |

---

## 2. Dependency Graph

```
index.tsx (export wrapper)
├── ErrorBoundary (from @/components/ErrorBoundary)
├── React.lazy → WeeklyActivitySummary
├── React.lazy → OpportunitiesByPrincipalReport
└── React.lazy → CampaignActivityReport

ReportsPage.tsx (main container)
├── Tabs, TabsList, TabsTrigger, TabsContent (from @/components/ui/tabs)
├── Skeleton (from @/components/ui/skeleton)
├── ReportPageShell (local component)
├── cleanupOldReportKeys (from ./utils/cleanupMigration)
├── lazy → OverviewTab
├── lazy → OpportunitiesTab
├── lazy → WeeklyActivityTab
└── lazy → CampaignActivityTab

OverviewTab.tsx
├── useGetList (from ra-core)
├── useNavigate (from react-router-dom)
├── KPICard (local)
├── ChartWrapper (local)
├── TabFilterBar (local)
├── AppliedFiltersBar, EmptyState (local)
├── Skeleton (from @/components/ui/skeleton)
├── useReportData (from ./hooks)
├── PipelineChart (from ./charts)
├── ActivityTrendChart (from ./charts)
├── TopPrincipalsChart (from ./charts)
├── RepPerformanceChart (from ./charts)
├── isOpportunityStale, countStaleOpportunities (from @/atomic-crm/utils/stalenessCalculation)
├── parseDateSafely (from @/lib/date-utils)
├── OPPORTUNITY_STAGE_CHOICES (from ../../opportunities/constants/stageConstants)
├── format, subDays, startOfDay, eachDayOfInterval (from date-fns)
└── [data: opportunities, activities, sales tables]

OpportunitiesTab.tsx
├── Suspense (from react)
├── Skeleton (from @/components/ui/skeleton)
└── lazy → OpportunitiesByPrincipalReport

WeeklyActivityTab.tsx
├── Suspense (from react)
├── Skeleton (from @/components/ui/skeleton)
└── lazy → WeeklyActivitySummary

CampaignActivityTab.tsx
├── Suspense (from react)
├── Skeleton (from @/components/ui/skeleton)
└── lazy → CampaignActivityReport

OpportunitiesByPrincipalReport.tsx
├── useGetList, useNotify, downloadCSV (from react-admin)
├── useForm, FormProvider (from react-hook-form)
├── ReferenceInput, AutocompleteArrayInput (from react-admin)
├── useReportData (from ./hooks)
├── ReportLayout (local)
├── Card, CardHeader, CardTitle, CardContent (from @/components/ui/card)
├── Table components (from @/components/ui/table)
├── jsonexport (external)
├── sanitizeCsvValue (from @/atomic-crm/utils/csvUploadValidator)
└── [data: opportunities_summary view, sales table]

WeeklyActivitySummary.tsx
├── useGetList, useGetIdentity, downloadCSV, useNotify (from react-admin)
├── useReportData (from ./hooks)
├── ReportLayout (local)
├── Card, CardHeader, CardTitle, CardContent (from @/components/ui/card)
├── Table components (from @/components/ui/table)
├── date-fns utilities
├── sanitizeCsvValue (from @/atomic-crm/utils/csvUploadValidator)
└── [data: activities, sales, organizations tables]

CampaignActivityReport.tsx
├── useGetList, useNotify, downloadCSV (from react-admin)
├── ActivityTypeCard (local)
├── StaleLeadsView (local)
├── ReportLayout (from ../ReportLayout)
├── Select, Checkbox, Label (from @/components/ui/)
├── isOpportunityStale, getStaleThreshold (from @/atomic-crm/utils/stalenessCalculation)
├── sanitizeCsvValue (from @/atomic-crm/utils/csvUploadValidator)
└── [data: opportunities, activities, sales tables]

useReportData.ts
├── useState, useEffect, useMemo, useCallback (from react)
├── useDataProvider (from react-admin)
└── [flows to: unifiedDataProvider → Supabase]
```

---

## 3. Annotated Component Catalog

### Entry Layer

#### `index.tsx`
- **File:** `src/atomic-crm/reports/index.tsx`
- **Purpose:** Export wrapper providing lazy-loaded, error-bounded report components
- **Props:** None (exports object)
- **Data Sources:** None (delegates)
- **Dependencies:**
  - `React.lazy` from `react`
  - `ErrorBoundary` from `@/components/ErrorBoundary`

#### `ReportsPage`
- **File:** `src/atomic-crm/reports/ReportsPage.tsx`
- **Purpose:** Main container managing URL-based tab navigation with 4 lazy-loaded tabs
- **Props:** None
- **Data Sources:** None (delegates to tabs)
- **Dependencies:**
  - `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`
  - `Skeleton` from `@/components/ui/skeleton`
  - `useSearchParams` from `react-router-dom`
  - `ReportPageShell` (local)
  - `cleanupOldReportKeys` from `./utils/cleanupMigration`

---

### Tab Components

#### `OverviewTab`
- **File:** `src/atomic-crm/reports/tabs/OverviewTab.tsx`
- **Purpose:** Dashboard with 4 KPI cards and 4 charts showing pipeline health and activity trends
- **Props:** None
- **Data Sources:**
  - `opportunities` table via `useReportData`
  - `activities` table via `useReportData`
  - `sales` table via `useGetList`
- **Dependencies:**
  - `useGetList` from `ra-core`
  - `useReportData` hook
  - `KPICard`, `ChartWrapper`, `TabFilterBar`, `AppliedFiltersBar`, `EmptyState`
  - `PipelineChart`, `ActivityTrendChart`, `TopPrincipalsChart`, `RepPerformanceChart`
  - `isOpportunityStale`, `countStaleOpportunities` from staleness utils
  - `date-fns` utilities

#### `OpportunitiesTab`
- **File:** `src/atomic-crm/reports/tabs/OpportunitiesTab.tsx`
- **Purpose:** Suspense wrapper for OpportunitiesByPrincipalReport
- **Props:** None
- **Data Sources:** Delegates to child
- **Dependencies:**
  - `React.Suspense`, `React.lazy`
  - `Skeleton` from `@/components/ui/skeleton`

#### `WeeklyActivityTab`
- **File:** `src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx`
- **Purpose:** Suspense wrapper for WeeklyActivitySummary
- **Props:** None
- **Data Sources:** Delegates to child
- **Dependencies:**
  - `React.Suspense`, `React.lazy`
  - `Skeleton` from `@/components/ui/skeleton`

#### `CampaignActivityTab`
- **File:** `src/atomic-crm/reports/tabs/CampaignActivityTab.tsx`
- **Purpose:** Suspense wrapper for CampaignActivityReport
- **Props:** None
- **Data Sources:** Delegates to child
- **Dependencies:**
  - `React.Suspense`, `React.lazy`
  - `Skeleton` from `@/components/ui/skeleton`

---

### Sub-Report Components

#### `OpportunitiesByPrincipalReport`
- **File:** `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`
- **Purpose:** Grouped opportunity report filterable by principal, stage, rep, and date with CSV export
- **Props:** None
- **Data Sources:**
  - `opportunities_summary` view via `useReportData`
  - `sales` table via `useGetList`
- **Dependencies:**
  - `useGetList`, `useNotify`, `downloadCSV` from `react-admin`
  - `useForm`, `FormProvider` from `react-hook-form`
  - `useReportData` hook
  - `ReportLayout`, Card/Table UI components
  - `jsonexport` for CSV
  - `sanitizeCsvValue` from CSV utils

#### `WeeklyActivitySummary`
- **File:** `src/atomic-crm/reports/WeeklyActivitySummary.tsx`
- **Purpose:** Week-based activity report grouped by rep → principal → activity type with low-activity warnings
- **Props:** None
- **Data Sources:**
  - `activities` table via `useReportData`
  - `sales` table via `useGetList`
  - `organizations` table via `useGetList`
- **Dependencies:**
  - `useGetList`, `useGetIdentity`, `downloadCSV`, `useNotify` from `react-admin`
  - `useReportData` hook
  - `ReportLayout`, Card/Table UI components
  - `date-fns` utilities
  - `sanitizeCsvValue` from CSV utils

#### `CampaignActivityReport`
- **File:** `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`
- **Purpose:** Campaign-specific activity analysis with stale leads view and activity type breakdown
- **Props:** None
- **Data Sources:**
  - `opportunities` table via `useGetList`
  - `activities` table via `useGetList`
  - `sales` table via `useGetList`
- **Dependencies:**
  - `useGetList`, `useNotify`, `downloadCSV` from `react-admin`
  - `ActivityTypeCard`, `StaleLeadsView` (local)
  - `ReportLayout`, Select/Checkbox UI components
  - `isOpportunityStale`, `getStaleThreshold` from staleness utils
  - `sanitizeCsvValue` from CSV utils

#### `ActivityTypeCard`
- **File:** `src/atomic-crm/reports/CampaignActivity/ActivityTypeCard.tsx`
- **Purpose:** Expandable card showing activity type metrics with detailed activity table
- **Props:**
```typescript
interface ActivityTypeCardProps {
  group: ActivityGroup;
  isExpanded: boolean;
  onToggle: () => void;
  salesMap: Map<number, string>;
}
```
- **Data Sources:** None (receives data via props)
- **Dependencies:**
  - `Card, CardContent, CardHeader` from `@/components/ui/card`
  - `ChevronRight, ChevronDown` from `lucide-react`
  - `parseDateSafely` from `@/lib/date-utils`

#### `StaleLeadsView`
- **File:** `src/atomic-crm/reports/CampaignActivity/StaleLeadsView.tsx`
- **Purpose:** Displays opportunities exceeding per-stage staleness thresholds
- **Props:** (receives stale opportunities and metadata)
- **Data Sources:** None (receives data via props)
- **Dependencies:**
  - UI components from `@/components/ui/`

---

### Layout Components

#### `ReportPageShell`
- **File:** `src/atomic-crm/reports/components/ReportPageShell.tsx`
- **Purpose:** Page wrapper with breadcrumbs, title, and actions slot
- **Props:**
```typescript
interface ReportPageShellProps {
  title: string;
  breadcrumbs: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
}
```
- **Data Sources:** None
- **Dependencies:**
  - `Link` from `react-router-dom`
  - `ChevronRight` from `lucide-react`

#### `ReportLayout`
- **File:** `src/atomic-crm/reports/ReportLayout.tsx`
- **Purpose:** Report wrapper with title, export button, and actions slot
- **Props:** (title, actions, children)
- **Data Sources:** None
- **Dependencies:**
  - UI components from `@/components/ui/`

---

### UI Components

#### `KPICard`
- **File:** `src/atomic-crm/reports/components/KPICard.tsx`
- **Purpose:** Clickable metric card with value, trend indicator, and variant styling
- **Props:**
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  subtitle?: string;
  variant?: "default" | "warning" | "success" | "destructive";
  onClick?: () => void;
}
```
- **Data Sources:** None (display only)
- **Dependencies:**
  - `Card, CardContent, CardHeader, CardTitle` from `@/components/ui/card`
  - `cn` from `@/lib/utils`

#### `ChartWrapper`
- **File:** `src/atomic-crm/reports/components/ChartWrapper.tsx`
- **Purpose:** Container for charts with loading skeleton state
- **Props:** (title, isLoading, children)
- **Data Sources:** None
- **Dependencies:**
  - `Skeleton` from `@/components/ui/skeleton`
  - Card components

#### `TabFilterBar`
- **File:** `src/atomic-crm/reports/components/TabFilterBar.tsx`
- **Purpose:** Reusable filter bar with date range, sales rep filters, and children slot
- **Props:**
```typescript
interface TabFilterBarProps {
  showDateRange?: boolean;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showSalesRep?: boolean;
  salesRepId?: number | null;
  onSalesRepChange?: (id: number | null) => void;
  hasActiveFilters?: boolean;
  onReset?: () => void;
  children?: React.ReactNode;
}
```
- **Data Sources:**
  - `sales` table via `useGetList`
- **Dependencies:**
  - `useGetList` from `ra-core`
  - `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from `@/components/ui/select`
  - `Button` from `@/components/ui/button`
  - `Calendar, User, RotateCcw` from `lucide-react`

#### `AppliedFiltersBar`
- **File:** `src/atomic-crm/reports/components/AppliedFiltersBar.tsx`
- **Purpose:** Displays active filter chips with individual and reset-all removal
- **Props:**
```typescript
interface AppliedFiltersBarProps {
  filters: FilterItem[];
  onResetAll: () => void;
  hasActiveFilters: boolean;
}
```
- **Data Sources:** None
- **Dependencies:**
  - `FilterChip` (local)
  - `Button` from `@/components/ui/button`
  - `RotateCcw` from `lucide-react`

#### `FilterChip`
- **File:** `src/atomic-crm/reports/components/FilterChip.tsx`
- **Purpose:** Individual filter tag with label, value, and remove button
- **Props:** (label, value, onRemove)
- **Data Sources:** None
- **Dependencies:**
  - `X` from `lucide-react`

#### `EmptyState`
- **File:** `src/atomic-crm/reports/components/EmptyState.tsx`
- **Purpose:** Placeholder when no data matches filters with optional action button
- **Props:** (title, description, icon, action)
- **Data Sources:** None
- **Dependencies:**
  - Icon from `lucide-react`
  - `Button` from `@/components/ui/button`

#### `KPIDrillDown`
- **File:** `src/atomic-crm/reports/components/KPIDrillDown.tsx`
- **Purpose:** Modal/dialog for detailed KPI breakdowns
- **Props:** (varies)
- **Data Sources:** Receives data via props
- **Dependencies:**
  - Dialog components from `@/components/ui/`

---

### Chart Components

#### `PipelineChart`
- **File:** `src/atomic-crm/reports/charts/PipelineChart.tsx`
- **Purpose:** Doughnut chart showing opportunity distribution by stage
- **Props:**
```typescript
interface PipelineChartProps {
  data: Array<{ stage: string; count: number }>;
}
```
- **Data Sources:** None (receives data via props)
- **Dependencies:**
  - `Doughnut` from `react-chartjs-2`
  - `useChartTheme` hook
  - `./chartSetup` (Chart.js registration)

#### `ActivityTrendChart`
- **File:** `src/atomic-crm/reports/charts/ActivityTrendChart.tsx`
- **Purpose:** Line chart showing 14-day activity trend
- **Props:** (data: Array<{ date: string; count: number }>)
- **Data Sources:** None (receives data via props)
- **Dependencies:**
  - `Line` from `react-chartjs-2`
  - `useChartTheme` hook

#### `TopPrincipalsChart`
- **File:** `src/atomic-crm/reports/charts/TopPrincipalsChart.tsx`
- **Purpose:** Bar chart showing principals by opportunity count
- **Props:** (data: Array<{ name: string; count: number }>)
- **Data Sources:** None (receives data via props)
- **Dependencies:**
  - `Bar` from `react-chartjs-2`
  - `useChartTheme` hook

#### `RepPerformanceChart`
- **File:** `src/atomic-crm/reports/charts/RepPerformanceChart.tsx`
- **Purpose:** Bar chart comparing rep activities vs opportunities
- **Props:** (data: Array<{ name: string; activities: number; opportunities: number }>)
- **Data Sources:** None (receives data via props)
- **Dependencies:**
  - `Bar` from `react-chartjs-2`
  - `useChartTheme` hook

---

### Hooks

#### `useReportData`
- **File:** `src/atomic-crm/reports/hooks/useReportData.ts`
- **Purpose:** Centralized data fetching hook for reports, ensuring all data flows through unifiedDataProvider
- **Signature:**
```typescript
function useReportData<T extends RaRecord>(
  resource: string,
  options?: UseReportDataOptions
): UseReportDataResult<T>

interface UseReportDataOptions {
  dateRange?: { start: Date | null; end: Date | null };
  salesRepId?: string | null;
  additionalFilters?: Record<string, unknown>;
  dateField?: string;  // default: "created_at"
}

interface UseReportDataResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```
- **Data Sources:** Routes to `unifiedDataProvider` via `useDataProvider()`
- **Dependencies:**
  - `useDataProvider` from `react-admin`
  - React hooks (useState, useEffect, useMemo, useCallback)
- **Notes:**
  - Uses `perPage: 10000` (technical debt for large datasets)
  - Memoizes filters to prevent infinite re-render loops
  - Fail-fast error handling (no retry logic)

#### `useChartTheme`
- **File:** `src/atomic-crm/reports/hooks/useChartTheme.ts`
- **Purpose:** Provides semantic chart colors that respect theme settings
- **Returns:** `ChartTheme` with colors and font configuration
- **Dependencies:** CSS custom properties access

---

### Types

#### `types.ts`
- **File:** `src/atomic-crm/reports/types.ts`
- **Purpose:** Shared type definitions for the Reports module
- **Exports:**
```typescript
interface Sale {
  id: number;
  first_name: string;
  last_name: string;
}

interface Activity {
  id: number;
  type: string;
  subject: string;
  created_at: string;
  created_by: number;
  organization_id: number;
  contact_id: number | null;
  opportunity_id?: number | null;
  organization_name?: string;
  contact_name?: string;
}

interface ActivityGroup {
  type: string;
  activities: Activity[];
  totalCount: number;
  uniqueOrgs: number;
  percentage?: number;
  mostActiveOrg?: string;
  mostActiveCount?: number;
}
```

---

## 4. Data Sources Summary

| Component | Supabase Table/View | Via |
|-----------|---------------------|-----|
| OverviewTab | `opportunities`, `activities`, `sales` | `useReportData`, `useGetList` |
| OpportunitiesByPrincipalReport | `opportunities_summary` (view), `sales` | `useReportData`, `useGetList` |
| WeeklyActivitySummary | `activities`, `sales`, `organizations` | `useReportData`, `useGetList` |
| CampaignActivityReport | `opportunities`, `activities`, `sales` | `useGetList` |
| TabFilterBar | `sales` | `useGetList` |

**All data flows through:** `unifiedDataProvider` → Supabase PostgREST API

---

## 5. External UI Dependencies (from @/components/ui/)

| Component | Used By |
|-----------|---------|
| `Tabs, TabsList, TabsTrigger, TabsContent` | ReportsPage |
| `Card, CardHeader, CardTitle, CardContent, CardFooter` | KPICard, ActivityTypeCard, ChartWrapper, sub-reports |
| `Skeleton` | ReportsPage, tabs, ChartWrapper |
| `Button` | TabFilterBar, AppliedFiltersBar, EmptyState |
| `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` | TabFilterBar, CampaignActivityReport |
| `Checkbox` | CampaignActivityReport |
| `Label` | CampaignActivityReport |
| `Table` components | OpportunitiesByPrincipalReport, WeeklyActivitySummary, ActivityTypeCard |

---

## 6. Architecture Notes

### Lazy Loading Strategy
- **Two layers:** Entry exports (index.tsx) + Tab containers (ReportsPage.tsx)
- **Suspense boundaries:** Each tab has its own Suspense with TabSkeleton fallback
- **Error isolation:** ErrorBoundary wraps each export in index.tsx

### Data Fetching Pattern
```
Local Filter State → useReportData/useGetList
       ↓
   Memoized Filters (prevents infinite loops)
       ↓
   useDataProvider().getList()
       ↓
   unifiedDataProvider (single entry point)
       ↓
   Supabase PostgREST API
```

### Key Patterns
1. **Single Entry Point:** All data via `unifiedDataProvider`
2. **Fail-Fast:** Errors surface immediately, no retry logic
3. **Memoization:** Filters and transformations memoized to prevent re-renders
4. **44px Touch Targets:** All interactive elements meet accessibility requirements
5. **Semantic Colors:** Tailwind v4 tokens only (no raw hex/oklch)

---

## 7. Technical Debt

| ID | Description | Location |
|----|-------------|----------|
| A2 | `perPage: 10000` unbounded pagination | `useReportData.ts:119` |
