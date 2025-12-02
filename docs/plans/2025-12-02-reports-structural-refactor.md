# Reports Module Structural Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the Reports module to eliminate architectural fragmentation—each tab owns its filters, with consistent breadcrumbs, semantic spacing, and drill-down slide-overs.

**Architecture:** Replace the fragmented "global filter that isn't global" pattern with tab-owned filters. Each tab becomes a self-contained report with its own filter state, export action, and optional drill-down. A shared `ReportPageShell` provides consistent breadcrumbs, header, and tab navigation.

**Tech Stack:** React 19, Tailwind v4 semantic utilities, shadcn/ui, React Router, Zod validation

**Current Problems:**
1. GlobalFilterBar only affects OverviewTab (misleading UX)
2. Inconsistent spacing (`p-6`, `gap-4` vs semantic tokens)
3. `md:` breakpoints instead of `lg:` (desktop-first violation)
4. No breadcrumb navigation for deep-linking
5. No slide-over drill-downs for detailed views
6. Redundant `data-state` props on TabsTrigger

---

## Task 1: Create ReportPageShell Component

**Files:**
- Create: `src/atomic-crm/reports/components/ReportPageShell.tsx`
- Create: `src/atomic-crm/reports/components/ReportPageShell.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/components/ReportPageShell.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { ReportPageShell } from "./ReportPageShell";

describe("ReportPageShell", () => {
  it("renders breadcrumbs with Reports root link", () => {
    render(
      <MemoryRouter>
        <ReportPageShell
          title="Weekly Activity"
          breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Weekly Activity" }]}
        >
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Weekly Activity")).toBeInTheDocument();
  });

  it("renders title with semantic heading", () => {
    render(
      <MemoryRouter>
        <ReportPageShell title="Campaign Activity" breadcrumbs={[]}>
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Campaign Activity" })).toBeInTheDocument();
  });

  it("renders actions slot when provided", () => {
    render(
      <MemoryRouter>
        <ReportPageShell
          title="Test"
          breadcrumbs={[]}
          actions={<button>Export</button>}
        >
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("uses semantic spacing tokens", () => {
    const { container } = render(
      <MemoryRouter>
        <ReportPageShell title="Test" breadcrumbs={[]}>
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    // Verify no hardcoded spacing like p-6
    const shell = container.firstChild;
    expect(shell).toHaveClass("p-content");
    expect(shell).toHaveClass("lg:p-widget");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/reports/components/ReportPageShell.test.tsx`
Expected: FAIL with "Cannot find module './ReportPageShell'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/reports/components/ReportPageShell.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ReportPageShellProps {
  title: string;
  breadcrumbs: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * ReportPageShell
 *
 * Consistent shell for all report pages:
 * - Breadcrumb navigation for deep-linking
 * - Semantic spacing (desktop-first)
 * - Actions slot for export/filters
 * - Accessible heading structure
 */
export function ReportPageShell({
  title,
  breadcrumbs,
  actions,
  children,
}: ReportPageShellProps) {
  return (
    <div className="p-content lg:p-widget space-y-section">
      {/* Breadcrumbs */}
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

      {/* Header */}
      <div className="flex items-center justify-between gap-content">
        <h1 className="text-3xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-compact">{actions}</div>}
      </div>

      {/* Content */}
      <div className="space-y-section">{children}</div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/reports/components/ReportPageShell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/components/ReportPageShell.tsx src/atomic-crm/reports/components/ReportPageShell.test.tsx
git commit -m "feat(reports): add ReportPageShell with breadcrumbs and semantic spacing"
```

---

## Task 2: Create TabFilterBar Component

**Files:**
- Create: `src/atomic-crm/reports/components/TabFilterBar.tsx`
- Create: `src/atomic-crm/reports/components/TabFilterBar.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/components/TabFilterBar.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TabFilterBar } from "./TabFilterBar";

describe("TabFilterBar", () => {
  it("renders date range selector with presets", () => {
    const onChange = vi.fn();
    render(
      <TabFilterBar
        showDateRange
        dateRange={{ preset: "last30", start: null, end: null }}
        onDateRangeChange={onChange}
      />
    );

    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
  });

  it("renders sales rep selector when enabled", () => {
    const onChange = vi.fn();
    render(
      <TabFilterBar
        showSalesRep
        salesRepId={null}
        onSalesRepChange={onChange}
      />
    );

    expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
  });

  it("shows reset button when filters are active", () => {
    const onReset = vi.fn();
    render(
      <TabFilterBar
        showDateRange
        dateRange={{ preset: "last7", start: null, end: null }}
        onDateRangeChange={vi.fn()}
        hasActiveFilters
        onReset={onReset}
      />
    );

    const resetButton = screen.getByRole("button", { name: /reset/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(onReset).toHaveBeenCalled();
  });

  it("meets 44px touch target requirement", () => {
    render(
      <TabFilterBar
        showDateRange
        dateRange={{ preset: "last30", start: null, end: null }}
        onDateRangeChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-11"); // 44px = h-11
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/reports/components/TabFilterBar.test.tsx`
Expected: FAIL with "Cannot find module './TabFilterBar'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/reports/components/TabFilterBar.tsx
import { useMemo } from "react";
import { useGetList } from "ra-core";
import { Calendar, User, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sale } from "../../types";

interface DateRange {
  preset: string;
  start: string | null;
  end: string | null;
}

interface TabFilterBarProps {
  // Date range filter
  showDateRange?: boolean;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;

  // Sales rep filter
  showSalesRep?: boolean;
  salesRepId?: number | null;
  onSalesRepChange?: (id: number | null) => void;

  // Reset
  hasActiveFilters?: boolean;
  onReset?: () => void;

  // Custom filters slot
  children?: React.ReactNode;
}

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

/**
 * TabFilterBar
 *
 * Reusable filter bar for report tabs. Composable design:
 * - Toggle date range, sales rep filters via props
 * - Children slot for tab-specific filters
 * - Consistent 44px touch targets
 * - Semantic styling
 */
export function TabFilterBar({
  showDateRange,
  dateRange,
  onDateRangeChange,
  showSalesRep,
  salesRepId,
  onSalesRepChange,
  hasActiveFilters,
  onReset,
  children,
}: TabFilterBarProps) {
  // Fetch sales reps for dropdown
  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "first_name", order: "ASC" },
  });

  const salesRepOptions = useMemo(
    () =>
      salesReps.map((rep) => ({
        id: rep.id,
        name: `${rep.first_name} ${rep.last_name}`,
      })),
    [salesReps]
  );

  const handleDatePresetChange = (value: string) => {
    onDateRangeChange?.({
      preset: value,
      start: null, // Preset handles date calculation
      end: null,
    });
  };

  const handleSalesRepChange = (value: string) => {
    onSalesRepChange?.(value === "all" ? null : parseInt(value, 10));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-content p-content bg-muted/50 rounded-lg">
      <div className="flex flex-wrap items-center gap-content">
        {/* Date Range */}
        {showDateRange && dateRange && (
          <div className="flex items-center gap-compact">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select value={dateRange.preset} onValueChange={handleDatePresetChange}>
              <SelectTrigger className="w-[160px] h-11" aria-label="Date Range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sales Rep */}
        {showSalesRep && (
          <div className="flex items-center gap-compact">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select
              value={salesRepId?.toString() || "all"}
              onValueChange={handleSalesRepChange}
            >
              <SelectTrigger className="w-[180px] h-11" aria-label="Sales Rep">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {salesRepOptions.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id.toString()}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom filters */}
        {children}
      </div>

      {/* Reset */}
      {hasActiveFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-11">
          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/reports/components/TabFilterBar.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/components/TabFilterBar.tsx src/atomic-crm/reports/components/TabFilterBar.test.tsx
git commit -m "feat(reports): add composable TabFilterBar component"
```

---

## Task 3: Refactor ReportsPage with Desktop-First Tabs

**Files:**
- Modify: `src/atomic-crm/reports/ReportsPage.tsx:26-86`
- Modify: `src/atomic-crm/reports/ReportsPage.test.tsx`

**Step 1: Write the updated test**

```typescript
// Add to existing ReportsPage.test.tsx
it("uses desktop-first responsive tabs", () => {
  render(<ReportsPage />, { wrapper: TestWrapper });

  const tabList = screen.getByRole("tablist");
  // Should use grid-cols-2 base, lg:grid-cols-4 for desktop
  expect(tabList).toHaveClass("grid-cols-2");
  expect(tabList).toHaveClass("lg:grid-cols-4");
});

it("does not render GlobalFilterBar (filters moved to tabs)", () => {
  render(<ReportsPage />, { wrapper: TestWrapper });

  // Old global filter bar should not exist
  expect(screen.queryByLabelText(/date range/i)).not.toBeInTheDocument();
});

it("uses Skeleton for tab loading states", async () => {
  render(<ReportsPage />, { wrapper: TestWrapper });

  // Switch to a tab that lazy loads
  const weeklyTab = screen.getByRole("tab", { name: /weekly/i });
  fireEvent.click(weeklyTab);

  // Should show Skeleton, not plain text
  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/reports/ReportsPage.test.tsx`
Expected: FAIL (GlobalFilterBar still rendered, wrong grid classes)

**Step 3: Write the refactored implementation**

```typescript
// src/atomic-crm/reports/ReportsPage.tsx
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy, useEffect } from "react";
import { cleanupOldReportKeys } from "./utils/cleanupMigration";
import { ReportPageShell } from "./components/ReportPageShell";

const OverviewTab = lazy(() => import("./tabs/OverviewTab"));
const OpportunitiesTab = lazy(() => import("./tabs/OpportunitiesTab"));
const WeeklyActivityTab = lazy(() => import("./tabs/WeeklyActivityTab"));
const CampaignActivityTab = lazy(() => import("./tabs/CampaignActivityTab"));

/** Loading skeleton for tab content */
function TabSkeleton() {
  return (
    <div className="space-y-section">
      {/* Filter bar skeleton */}
      <Skeleton className="h-14 w-full rounded-lg" />
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-content">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    cleanupOldReportKeys();
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Breadcrumbs for current tab
  const tabLabels: Record<string, string> = {
    overview: "Overview",
    opportunities: "Opportunities by Principal",
    weekly: "Weekly Activity",
    campaign: "Campaign Activity",
  };

  const breadcrumbs = [
    { label: "Reports", href: "/reports?tab=overview" },
    { label: tabLabels[activeTab] || "Overview" },
  ];

  return (
    <ReportPageShell
      title="Reports & Analytics"
      breadcrumbs={breadcrumbs}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Desktop-first: 2 cols mobile, 4 cols desktop */}
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="h-11">
            Overview
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="h-11">
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="weekly" className="h-11">
            Weekly Activity
          </TabsTrigger>
          <TabsTrigger value="campaign" className="h-11">
            Campaign
          </TabsTrigger>
        </TabsList>

        <div className="mt-section">
          <TabsContent value="overview" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <OverviewTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <OpportunitiesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="weekly" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <WeeklyActivityTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="campaign" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <CampaignActivityTab />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </ReportPageShell>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/reports/ReportsPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/ReportsPage.tsx src/atomic-crm/reports/ReportsPage.test.tsx
git commit -m "refactor(reports): desktop-first tabs, remove global filter bar, add skeleton loading"
```

---

## Task 4: Refactor OverviewTab with Embedded Filters

**Files:**
- Modify: `src/atomic-crm/reports/tabs/OverviewTab.tsx`
- Modify: `src/atomic-crm/reports/tabs/OverviewTab.test.tsx`

**Step 1: Write the updated test**

```typescript
// Add to OverviewTab.test.tsx
it("renders embedded TabFilterBar", () => {
  render(<OverviewTab />, { wrapper: TestWrapper });

  // Filter bar should be inside the tab, not global
  expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
});

it("uses lg: breakpoint for desktop-first grid", () => {
  const { container } = render(<OverviewTab />, { wrapper: TestWrapper });

  const kpiGrid = container.querySelector('[data-testid="kpi-grid"]');
  expect(kpiGrid).toHaveClass("grid-cols-1");
  expect(kpiGrid).toHaveClass("lg:grid-cols-4");
  // Should NOT have md: breakpoint
  expect(kpiGrid).not.toHaveClass("md:grid-cols-2");
});

it("uses semantic spacing tokens", () => {
  const { container } = render(<OverviewTab />, { wrapper: TestWrapper });

  const wrapper = container.firstChild;
  expect(wrapper).toHaveClass("space-y-section");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/reports/tabs/OverviewTab.test.tsx`
Expected: FAIL (no embedded filter bar, wrong breakpoints)

**Step 3: Write the refactored implementation**

Key changes to OverviewTab.tsx:
1. Add `TabFilterBar` at top with date range and sales rep
2. Replace `md:grid-cols-2 lg:grid-cols-4` with `grid-cols-1 lg:grid-cols-4`
3. Replace `space-y-6` with `space-y-section`
4. Replace `gap-4` with `gap-content`, `gap-6` with `gap-section`
5. Add `data-testid="kpi-grid"` for testing
6. Remove dependency on GlobalFilterContext (use local state)

```typescript
// Key changes (not full file - showing pattern):

import { useState, useMemo, useCallback } from "react";
import { TabFilterBar } from "../components/TabFilterBar";
// ... other imports

export default function OverviewTab() {
  // Local filter state (replaces GlobalFilterContext)
  const [dateRange, setDateRange] = useState({
    preset: "last30",
    start: null as string | null,
    end: null as string | null,
  });
  const [salesRepId, setSalesRepId] = useState<number | null>(null);

  const hasActiveFilters = dateRange.preset !== "last30" || salesRepId !== null;

  const handleReset = () => {
    setDateRange({ preset: "last30", start: null, end: null });
    setSalesRepId(null);
  };

  // ... rest of component logic (use salesRepId in filters)

  return (
    <div className="space-y-section">
      {/* Embedded filter bar */}
      <TabFilterBar
        showDateRange
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showSalesRep
        salesRepId={salesRepId}
        onSalesRepChange={setSalesRepId}
        hasActiveFilters={hasActiveFilters}
        onReset={handleReset}
      />

      {/* KPIs - desktop-first grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-content" data-testid="kpi-grid">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-content" data-testid="kpi-grid">
          {/* KPI cards */}
        </div>
      )}

      {/* Charts - desktop-first grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
        {/* Chart wrappers */}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/reports/tabs/OverviewTab.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/tabs/OverviewTab.tsx src/atomic-crm/reports/tabs/OverviewTab.test.tsx
git commit -m "refactor(reports): OverviewTab with embedded filters, desktop-first grid"
```

---

## Task 5: Refactor Remaining Tabs

Apply the same pattern to the remaining tabs. Each tab should:
1. Remove the placeholder "filters coming soon" div
2. Use the actual filter controls from the sub-report
3. Apply semantic spacing tokens
4. Use `lg:` breakpoint for desktop-first

**Files:**
- Modify: `src/atomic-crm/reports/tabs/OpportunitiesTab.tsx`
- Modify: `src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx`
- Modify: `src/atomic-crm/reports/tabs/CampaignActivityTab.tsx`

**Pattern for each tab:**

```typescript
// Example: OpportunitiesTab.tsx
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const OpportunitiesByPrincipalReport = lazy(
  () => import("../OpportunitiesByPrincipalReport")
);

export default function OpportunitiesTab() {
  return (
    <div className="space-y-section">
      {/* The sub-report handles its own filters */}
      <Suspense
        fallback={
          <div className="space-y-section">
            <Skeleton className="h-14 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-content">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-lg" />
          </div>
        }
      >
        <OpportunitiesByPrincipalReport />
      </Suspense>
    </div>
  );
}
```

**Commit after each tab:**

```bash
git add src/atomic-crm/reports/tabs/OpportunitiesTab.tsx
git commit -m "refactor(reports): OpportunitiesTab with semantic spacing"

git add src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx
git commit -m "refactor(reports): WeeklyActivityTab with semantic spacing"

git add src/atomic-crm/reports/tabs/CampaignActivityTab.tsx
git commit -m "refactor(reports): CampaignActivityTab with semantic spacing"
```

---

## Task 6: Delete Obsolete GlobalFilter Files

**Files:**
- Delete: `src/atomic-crm/reports/contexts/GlobalFilterContext.tsx`
- Delete: `src/atomic-crm/reports/contexts/GlobalFilterContext.test.tsx`
- Delete: `src/atomic-crm/reports/components/GlobalFilterBar.tsx`
- Delete: `src/atomic-crm/reports/components/GlobalFilterBar.test.tsx`

**Step 1: Verify no remaining imports**

```bash
grep -r "GlobalFilter" src/atomic-crm/reports/
```
Expected: No results (all imports removed in previous tasks)

**Step 2: Delete files**

```bash
rm src/atomic-crm/reports/contexts/GlobalFilterContext.tsx
rm src/atomic-crm/reports/contexts/GlobalFilterContext.test.tsx
rm src/atomic-crm/reports/components/GlobalFilterBar.tsx
rm src/atomic-crm/reports/components/GlobalFilterBar.test.tsx
```

**Step 3: Run tests to verify nothing is broken**

Run: `npm test -- src/atomic-crm/reports/`
Expected: PASS (all tests pass without GlobalFilter files)

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(reports): delete obsolete GlobalFilter files"
```

---

## Task 7: Update ChartWrapper for Tailwind Height

**Files:**
- Modify: `src/atomic-crm/reports/components/ChartWrapper.tsx`

**Step 1: Replace inline style with Tailwind class**

```typescript
// src/atomic-crm/reports/components/ChartWrapper.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}

export function ChartWrapper({
  title,
  children,
  isLoading = false,
}: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Standard chart height - use Tailwind class instead of inline style */}
        <div className="h-[300px]">
          {isLoading ? <Skeleton className="w-full h-full" /> : children}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/atomic-crm/reports/components/ChartWrapper.tsx
git commit -m "fix(reports): ChartWrapper uses Tailwind height class"
```

---

## Task 8: Add KPI Drill-Down Slide-Over

**Files:**
- Create: `src/atomic-crm/reports/components/KPIDrillDown.tsx`
- Create: `src/atomic-crm/reports/components/KPIDrillDown.test.tsx`
- Modify: `src/atomic-crm/reports/components/KPICard.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/components/KPIDrillDown.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KPIDrillDown } from "./KPIDrillDown";

describe("KPIDrillDown", () => {
  it("renders as a slide-over dialog", () => {
    render(
      <KPIDrillDown
        open={true}
        onClose={vi.fn()}
        title="Total Opportunities"
        children={<div>Details</div>}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("has focus trap when open", () => {
    render(
      <KPIDrillDown
        open={true}
        onClose={vi.fn()}
        title="Test"
        children={<button>First</button>}
      />
    );

    // Dialog should have focus management
    expect(screen.getByRole("dialog")).toHaveAttribute("data-focus-trap", "true");
  });

  it("closes on ESC key", () => {
    const onClose = vi.fn();
    render(
      <KPIDrillDown
        open={true}
        onClose={onClose}
        title="Test"
        children={<div>Content</div>}
      />
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders close button with 44px touch target", () => {
    render(
      <KPIDrillDown
        open={true}
        onClose={vi.fn()}
        title="Test"
        children={<div>Content</div>}
      />
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toHaveClass("h-11");
    expect(closeButton).toHaveClass("w-11");
  });
});
```

**Step 2: Write implementation using Sheet component**

```typescript
// src/atomic-crm/reports/components/KPIDrillDown.tsx
import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface KPIDrillDownProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * KPIDrillDown
 *
 * Slide-over panel for KPI details:
 * - Opens from right side
 * - Focus trap for accessibility
 * - ESC to close
 * - 44px touch targets
 */
export function KPIDrillDown({
  open,
  onClose,
  title,
  description,
  children,
}: KPIDrillDownProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg lg:max-w-xl"
        data-focus-trap="true"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-section space-y-content overflow-y-auto max-h-[calc(100vh-8rem)]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 3: Run tests**

Run: `npm test -- src/atomic-crm/reports/components/KPIDrillDown.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/atomic-crm/reports/components/KPIDrillDown.tsx src/atomic-crm/reports/components/KPIDrillDown.test.tsx
git commit -m "feat(reports): add KPIDrillDown slide-over component"
```

---

## Task 9: Update Sub-Reports for Semantic Spacing

Apply semantic spacing tokens to the three sub-reports:

**Files:**
- Modify: `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`
- Modify: `src/atomic-crm/reports/WeeklyActivitySummary.tsx`
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`

**Pattern:**
- Replace `space-y-6` → `space-y-section`
- Replace `gap-4` → `gap-content`
- Replace `mb-6` → `mb-section`
- Replace `grid-cols-3` → `grid-cols-1 lg:grid-cols-3` (desktop-first)
- Replace `md:grid-cols-2` → `lg:grid-cols-2`

**Commit after each file:**

```bash
git add src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx
git commit -m "fix(reports): OpportunitiesByPrincipalReport semantic spacing"

git add src/atomic-crm/reports/WeeklyActivitySummary.tsx
git commit -m "fix(reports): WeeklyActivitySummary semantic spacing"

git add src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx
git commit -m "fix(reports): CampaignActivityReport semantic spacing"
```

---

## Task 10: Final Validation

**Step 1: Run all report tests**

```bash
npm test -- src/atomic-crm/reports/
```
Expected: All tests PASS

**Step 2: Run type check**

```bash
npm run build
```
Expected: No TypeScript errors

**Step 3: Validate semantic colors**

```bash
npm run validate:colors
```
Expected: No hardcoded hex values or inline CSS variables

**Step 4: Manual visual check**

1. Open http://localhost:5173/reports
2. Verify breadcrumbs work
3. Verify each tab has its own filter bar
4. Verify 44px touch targets on mobile viewport
5. Verify desktop layout at 1440px

**Step 5: Final commit**

```bash
git add -A
git commit -m "docs: complete reports structural refactor"
```

---

## Success Criteria

- [ ] Each tab owns its filters (no global filter confusion)
- [ ] Breadcrumb navigation works for deep-linking
- [ ] Desktop-first responsive design (`lg:` breakpoint)
- [ ] Semantic spacing tokens throughout (`space-y-section`, `gap-content`)
- [ ] 44px touch targets on all interactive elements
- [ ] Skeleton loading states (no plain "Loading..." text)
- [ ] GlobalFilter files deleted
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No hardcoded colors

---

## Rollback Plan

If critical issues arise:

```bash
git revert HEAD~N  # N = number of commits to revert
```

The refactor is incremental with frequent commits, so partial rollback is possible.
