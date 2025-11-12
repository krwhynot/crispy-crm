# Pipedrive Reports UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the reports interface into a unified tabbed experience with Chart.js visualizations

**Architecture:** Single ReportsPage with tabs, GlobalFilterContext for shared state, Chart.js for visualizations, URL params for navigation

**Tech Stack:** React, TypeScript, Chart.js, react-chartjs-2, shadcn/ui tabs, React Router

## Implementation Status

**Last Updated:** 2025-11-12
**Overall Progress:** ~94% Complete (16/18 tasks completed + 1 enhancement)

### Completed
- ✅ **Phase 1** (Tasks 1-6): Setup, GlobalFilterContext, ReportsPage, GlobalFilterBar, routes, KPICard, ChartWrapper
- ✅ **Phase 2** (Tasks 7-9): Overview Tab with KPI cards, PipelineChart, useChartTheme
- ✅ **Phase 3** (Tasks 10-12): OpportunitiesTab, WeeklyActivityTab, CampaignActivityTab wrappers
- ✅ **Phase 4** (Tasks 13-15): Header navigation update, loading states, E2E tests
- ✅ **Phase 5** (Tasks 16, 18): Remove old routes, cleanup localStorage keys
- ✅ **Enhancement:** Removed all dollar value displays from Overview tab (user request 2025-11-12)

### Pending
- ⏳ **Task 17:** Archive old ReportLayout (deferred - technical debt, not blocking)

---

## Phase 1: Setup and Infrastructure

### Task 1: Install Chart.js Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install required packages**

```bash
npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0
npm install -D @types/chart.js
```

**Step 2: Verify installation**

```bash
npm list chart.js react-chartjs-2
```
Expected: Shows installed versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: Add Chart.js and react-chartjs-2 for reports visualizations"
```

---

### Task 2: Create GlobalFilterContext

**Files:**
- Create: `src/atomic-crm/reports/contexts/GlobalFilterContext.tsx`
- Create: `src/atomic-crm/reports/contexts/GlobalFilterContext.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/contexts/GlobalFilterContext.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GlobalFilterProvider, useGlobalFilters } from './GlobalFilterContext';

describe('GlobalFilterContext', () => {
  it('provides default filter values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalFilterProvider>{children}</GlobalFilterProvider>
    );

    const { result } = renderHook(() => useGlobalFilters(), { wrapper });

    expect(result.current.filters.dateRange).toEqual({
      start: expect.any(Date),
      end: expect.any(Date),
    });
    expect(result.current.filters.salesRepId).toBeNull();
  });

  it('persists filters to localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalFilterProvider>{children}</GlobalFilterProvider>
    );

    const { result } = renderHook(() => useGlobalFilters(), { wrapper });

    act(() => {
      result.current.setFilters({
        dateRange: { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
        salesRepId: 123,
      });
    });

    const stored = localStorage.getItem('reports.globalFilters');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.salesRepId).toBe(123);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- GlobalFilterContext.test.tsx
```
Expected: FAIL - Module not found

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/reports/contexts/GlobalFilterContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subDays } from 'date-fns';

export interface GlobalFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  salesRepId: number | null;
}

interface GlobalFilterContextValue {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  resetFilters: () => void;
}

const defaultFilters: GlobalFilters = {
  dateRange: {
    start: subDays(new Date(), 30),
    end: new Date(),
  },
  salesRepId: null,
};

const GlobalFilterContext = createContext<GlobalFilterContextValue | undefined>(undefined);

const STORAGE_KEY = 'reports.globalFilters';

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          dateRange: {
            start: new Date(parsed.dateRange.start),
            end: new Date(parsed.dateRange.end),
          },
        };
      } catch {
        return defaultFilters;
      }
    }
    return defaultFilters;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const setFilters = (newFilters: GlobalFilters) => {
    setFiltersState(newFilters);
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <GlobalFilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within GlobalFilterProvider');
  }
  return context;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- GlobalFilterContext.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/contexts/
git commit -m "feat: Add GlobalFilterContext for shared report filters"
```

---

### Task 3: Create ReportsPage Component Structure

**Files:**
- Create: `src/atomic-crm/reports/ReportsPage.tsx`
- Create: `src/atomic-crm/reports/ReportsPage.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/ReportsPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from './ReportsPage';

describe('ReportsPage', () => {
  it('renders page title', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /opportunities by principal/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /weekly activity/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /campaign activity/i })).toBeInTheDocument();
  });

  it('defaults to overview tab', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview/i });
    expect(overviewTab).toHaveAttribute('data-state', 'active');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- ReportsPage.test.tsx
```
Expected: FAIL - Module not found

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/reports/ReportsPage.tsx
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalFilterProvider } from './contexts/GlobalFilterContext';
import { Suspense, lazy } from 'react';

// Lazy load tab components (to be created later)
const OverviewTab = () => <div>Overview content coming soon</div>;
const OpportunitiesTab = lazy(() => import('./tabs/OpportunitiesTab'));
const WeeklyActivityTab = lazy(() => import('./tabs/WeeklyActivityTab'));
const CampaignActivityTab = lazy(() => import('./tabs/CampaignActivityTab'));

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <GlobalFilterProvider>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-state={activeTab === 'overview' ? 'active' : 'inactive'}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="opportunities" data-state={activeTab === 'opportunities' ? 'active' : 'inactive'}>
              Opportunities by Principal
            </TabsTrigger>
            <TabsTrigger value="weekly" data-state={activeTab === 'weekly' ? 'active' : 'inactive'}>
              Weekly Activity
            </TabsTrigger>
            <TabsTrigger value="campaign" data-state={activeTab === 'campaign' ? 'active' : 'inactive'}>
              Campaign Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="opportunities">
            <Suspense fallback={<div>Loading...</div>}>
              <OpportunitiesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="weekly">
            <Suspense fallback={<div>Loading...</div>}>
              <WeeklyActivityTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="campaign">
            <Suspense fallback={<div>Loading...</div>}>
              <CampaignActivityTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </GlobalFilterProvider>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- ReportsPage.test.tsx
```
Expected: PASS (with warnings about missing tab components)

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/ReportsPage.tsx src/atomic-crm/reports/ReportsPage.test.tsx
git commit -m "feat: Add ReportsPage with tab navigation structure"
```

---

### Task 4: Add GlobalFilterBar Component

**Files:**
- Create: `src/atomic-crm/reports/components/GlobalFilterBar.tsx`
- Create: `src/atomic-crm/reports/components/GlobalFilterBar.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/components/GlobalFilterBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalFilterBar } from './GlobalFilterBar';
import { GlobalFilterProvider } from '../contexts/GlobalFilterContext';

describe('GlobalFilterBar', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalFilterProvider>{children}</GlobalFilterProvider>
  );

  it('renders date range selector', () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
    expect(screen.getByText(/last 30 days/i)).toBeInTheDocument();
  });

  it('renders sales rep filter', () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
    expect(screen.getByText(/all reps/i)).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    const exportButton = screen.getByRole('button', { name: /export all/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('renders reset filters button', () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    const resetButton = screen.getByRole('button', { name: /reset filters/i });
    expect(resetButton).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- GlobalFilterBar.test.tsx
```
Expected: FAIL - Module not found

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/reports/components/GlobalFilterBar.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Download, RotateCcw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGlobalFilters } from '../contexts/GlobalFilterContext';

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

export function GlobalFilterBar() {
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const [datePreset, setDatePreset] = useState('last30');

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    // Date calculation logic would go here
    // For now, keeping the existing filter values
  };

  const handleSalesRepChange = (value: string) => {
    setFilters({
      ...filters,
      salesRepId: value === 'all' ? null : parseInt(value),
    });
  };

  const handleExportAll = () => {
    // Export logic will be implemented later
    console.log('Exporting all reports...');
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-secondary/50 rounded-lg">
      <div className="flex items-center gap-4">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={datePreset} onValueChange={handleDatePresetChange}>
            <SelectTrigger className="w-[180px]" aria-label="Date Range">
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

        {/* Sales Rep Filter */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.salesRepId?.toString() || 'all'}
            onValueChange={handleSalesRepChange}
          >
            <SelectTrigger className="w-[180px]" aria-label="Sales Rep">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reps</SelectItem>
              {/* Sales reps will be loaded dynamically */}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Reset Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>

        {/* Export All */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAll}
        >
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- GlobalFilterBar.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/components/
git commit -m "feat: Add GlobalFilterBar component with date and sales rep filters"
```

---

### Task 5: Update Routes in CRM.tsx

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`

**Step 1: Add the new route**

Find the routes section (around line 300-400) and add:

```typescript
// Add import at the top
const ReportsPage = React.lazy(() => import("../reports/ReportsPage"));

// In the routes section, replace individual report routes with:
<Route path="/reports" element={<ReportsPage />} />
```

**Step 2: Verify route works**

```bash
npm run dev
# Navigate to http://localhost:5173/reports
```
Expected: See Reports & Analytics page with tabs

**Step 3: Commit**

```bash
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat: Add /reports route to CRM"
```

---

## Phase 2: Overview Tab Implementation

### Task 6: Create KPICard Component

**Files:**
- Create: `src/atomic-crm/reports/components/KPICard.tsx`
- Create: `src/atomic-crm/reports/components/KPICard.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/components/KPICard.test.tsx
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';
import { TrendingUp, TrendingDown } from 'lucide-react';

describe('KPICard', () => {
  it('renders title and value', () => {
    render(
      <KPICard
        title="Total Opportunities"
        value="42"
        change={15}
        trend="up"
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('Total Opportunities')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows positive trend with green color', () => {
    render(
      <KPICard
        title="Revenue"
        value="$100k"
        change={25}
        trend="up"
        icon={TrendingUp}
      />
    );

    const changeElement = screen.getByText('+25%');
    expect(changeElement).toHaveClass('text-success');
  });

  it('shows negative trend with red color', () => {
    render(
      <KPICard
        title="Leads"
        value="10"
        change={-10}
        trend="down"
        icon={TrendingDown}
      />
    );

    const changeElement = screen.getByText('-10%');
    expect(changeElement).toHaveClass('text-destructive');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- KPICard.test.tsx
```
Expected: FAIL - Module not found

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/reports/components/KPICard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  subtitle?: string;
}

export function KPICard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  subtitle,
}: KPICardProps) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const changePrefix = change && change > 0 ? '+' : '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {change !== undefined && (
          <p className={cn("text-xs mt-2", trendColor)}>
            {changePrefix}{change}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- KPICard.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/components/KPICard.*
git commit -m "feat: Add KPICard component for dashboard metrics"
```

---

### Task 7: Create ChartWrapper Component

**Files:**
- Create: `src/atomic-crm/reports/components/ChartWrapper.tsx`
- Create: `src/atomic-crm/reports/hooks/useChartTheme.ts`

**Step 1: Create chart theme hook**

```typescript
// src/atomic-crm/reports/hooks/useChartTheme.ts
import { useEffect, useState } from 'react';

export function useChartTheme() {
  const [theme, setTheme] = useState({
    colors: {
      primary: '',
      brand700: '',
      brand600: '',
      success: '',
      warning: '',
      destructive: '',
      muted: '',
    },
    font: {
      family: 'system-ui',
      size: 12,
    },
  });

  useEffect(() => {
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);

    setTheme({
      colors: {
        primary: computedStyles.getPropertyValue('--primary') || '#000',
        brand700: computedStyles.getPropertyValue('--brand-700') || '#1a1a1a',
        brand600: computedStyles.getPropertyValue('--brand-600') || '#2a2a2a',
        success: computedStyles.getPropertyValue('--success') || '#10b981',
        warning: computedStyles.getPropertyValue('--warning') || '#f59e0b',
        destructive: computedStyles.getPropertyValue('--destructive') || '#ef4444',
        muted: computedStyles.getPropertyValue('--muted') || '#6b7280',
      },
      font: {
        family: computedStyles.getPropertyValue('--font-sans') || 'system-ui',
        size: 12,
      },
    });
  }, []);

  return theme;
}
```

**Step 2: Create ChartWrapper component**

```typescript
// src/atomic-crm/reports/components/ChartWrapper.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  height?: string;
}

export function ChartWrapper({
  title,
  children,
  isLoading = false,
  height = '300px'
}: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/atomic-crm/reports/components/ChartWrapper.tsx
git add src/atomic-crm/reports/hooks/useChartTheme.ts
git commit -m "feat: Add ChartWrapper and useChartTheme for consistent chart styling"
```

---

### Task 8: Implement OverviewTab with KPI Cards

**Files:**
- Create: `src/atomic-crm/reports/tabs/OverviewTab.tsx`
- Create: `src/atomic-crm/reports/tabs/OverviewTab.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/reports/tabs/OverviewTab.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OverviewTab from './OverviewTab';
import { GlobalFilterProvider } from '../contexts/GlobalFilterContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <GlobalFilterProvider>
      {children}
    </GlobalFilterProvider>
  </QueryClientProvider>
);

describe('OverviewTab', () => {
  it('renders KPI cards', () => {
    render(<OverviewTab />, { wrapper: Wrapper });

    expect(screen.getByText('Total Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Value')).toBeInTheDocument();
    expect(screen.getByText('Activities This Week')).toBeInTheDocument();
    expect(screen.getByText('Stale Leads')).toBeInTheDocument();
  });

  it('renders chart sections', () => {
    render(<OverviewTab />, { wrapper: Wrapper });

    expect(screen.getByText('Pipeline by Stage')).toBeInTheDocument();
    expect(screen.getByText('Activity Trend')).toBeInTheDocument();
    expect(screen.getByText('Top Principals')).toBeInTheDocument();
    expect(screen.getByText('Rep Performance')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- OverviewTab.test.tsx
```
Expected: FAIL - Module not found

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/reports/tabs/OverviewTab.tsx
import { useMemo } from 'react';
import { useGetList } from 'ra-core';
import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { ChartWrapper } from '../components/ChartWrapper';
import { useGlobalFilters } from '../contexts/GlobalFilterContext';

export default function OverviewTab() {
  const { filters } = useGlobalFilters();

  // Fetch opportunities
  const { data: opportunities = [], isPending: opportunitiesPending } = useGetList(
    'opportunities',
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        'deleted_at@is': null,
        ...(filters.salesRepId && { opportunity_owner_id: filters.salesRepId }),
      },
    }
  );

  // Fetch activities
  const { data: activities = [], isPending: activitiesPending } = useGetList(
    'activities',
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        'created_at@gte': filters.dateRange.start.toISOString(),
        'created_at@lte': filters.dateRange.end.toISOString(),
        ...(filters.salesRepId && { created_by: filters.salesRepId }),
      },
    }
  );

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalOpportunities = opportunities.length;
    const pipelineValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    const weekActivities = activities.filter(a => {
      const date = new Date(a.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    const staleLeads = opportunities.filter(opp => {
      // Simplified stale logic - would need proper calculation
      return opp.stage === 'Lead' && !opp.last_activity_at;
    }).length;

    return {
      totalOpportunities,
      pipelineValue,
      weekActivities,
      staleLeads,
    };
  }, [opportunities, activities]);

  const isLoading = opportunitiesPending || activitiesPending;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Opportunities"
          value={kpis.totalOpportunities}
          change={12}
          trend="up"
          icon={TrendingUp}
          subtitle={`$${Math.round(kpis.pipelineValue / 1000)}k pipeline`}
        />
        <KPICard
          title="Pipeline Value"
          value={`$${Math.round(kpis.pipelineValue / 1000)}k`}
          change={8}
          trend="up"
          icon={DollarSign}
          subtitle={`Avg $${Math.round(kpis.pipelineValue / Math.max(kpis.totalOpportunities, 1) / 1000)}k`}
        />
        <KPICard
          title="Activities This Week"
          value={kpis.weekActivities}
          change={-5}
          trend="down"
          icon={Activity}
          subtitle="Most: Emails"
        />
        <KPICard
          title="Stale Leads"
          value={kpis.staleLeads}
          change={0}
          trend="neutral"
          icon={AlertCircle}
          subtitle="> 7 days inactive"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="Pipeline by Stage" isLoading={isLoading}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart implementation coming soon
          </div>
        </ChartWrapper>

        <ChartWrapper title="Activity Trend" isLoading={isLoading}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart implementation coming soon
          </div>
        </ChartWrapper>

        <ChartWrapper title="Top Principals" isLoading={isLoading}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart implementation coming soon
          </div>
        </ChartWrapper>

        <ChartWrapper title="Rep Performance" isLoading={isLoading}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart implementation coming soon
          </div>
        </ChartWrapper>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- OverviewTab.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/reports/tabs/OverviewTab.*
git commit -m "feat: Add OverviewTab with KPI cards and chart placeholders"
```

---

### Task 9: Implement Pipeline by Stage Chart

**Files:**
- Modify: `src/atomic-crm/reports/tabs/OverviewTab.tsx`
- Create: `src/atomic-crm/reports/charts/PipelineChart.tsx`

**Step 1: Register Chart.js components**

```typescript
// src/atomic-crm/reports/charts/chartSetup.ts
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);
```

**Step 2: Create PipelineChart component**

```typescript
// src/atomic-crm/reports/charts/PipelineChart.tsx
import { Doughnut } from 'react-chartjs-2';
import { useChartTheme } from '../hooks/useChartTheme';
import '../charts/chartSetup';

interface PipelineChartProps {
  data: Array<{ stage: string; count: number }>;
}

export function PipelineChart({ data }: PipelineChartProps) {
  const theme = useChartTheme();

  const chartData = {
    labels: data.map(d => d.stage),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: [
          theme.colors.primary,
          theme.colors.brand700,
          theme.colors.brand600,
          theme.colors.success,
          theme.colors.warning,
          theme.colors.muted,
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: theme.font.family,
            size: theme.font.size,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
```

**Step 3: Update OverviewTab to use PipelineChart**

In `src/atomic-crm/reports/tabs/OverviewTab.tsx`, add:

```typescript
import { PipelineChart } from '../charts/PipelineChart';
import { OPPORTUNITY_STAGE_CHOICES } from '../../opportunities/stageConstants';

// In the component, calculate pipeline data:
const pipelineData = useMemo(() => {
  const stageCounts = OPPORTUNITY_STAGE_CHOICES.map(stage => ({
    stage: stage.name,
    count: opportunities.filter(o => o.stage === stage.id).length,
  }));
  return stageCounts.filter(s => s.count > 0);
}, [opportunities]);

// Replace the Pipeline by Stage ChartWrapper content:
<ChartWrapper title="Pipeline by Stage" isLoading={isLoading}>
  <PipelineChart data={pipelineData} />
</ChartWrapper>
```

**Step 4: Commit**

```bash
git add src/atomic-crm/reports/charts/
git add src/atomic-crm/reports/tabs/OverviewTab.tsx
git commit -m "feat: Add Pipeline by Stage doughnut chart"
```

---

## Phase 3: Report Tab Migration

### Task 10: Create OpportunitiesTab Wrapper

**Files:**
- Create: `src/atomic-crm/reports/tabs/OpportunitiesTab.tsx`

**Step 1: Create wrapper component**

```typescript
// src/atomic-crm/reports/tabs/OpportunitiesTab.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Import the existing report component
const OpportunitiesByPrincipalReport = lazy(
  () => import('../../OpportunitiesByPrincipalReport')
);

export default function OpportunitiesTab() {
  return (
    <div className="space-y-4">
      {/* Tab-specific filters will go here */}
      <div className="bg-secondary/30 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Report Filters</h3>
        <div className="flex gap-4">
          {/* Principal, Stage, Status filters to be added */}
          <div className="text-sm text-muted-foreground">
            Tab-specific filters coming soon
          </div>
        </div>
      </div>

      {/* Render existing report */}
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <OpportunitiesByPrincipalReport />
      </Suspense>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/atomic-crm/reports/tabs/OpportunitiesTab.tsx
git commit -m "feat: Add OpportunitiesTab wrapper for existing report"
```

---

### Task 11: Create WeeklyActivityTab Wrapper

**Files:**
- Create: `src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx`

**Step 1: Create wrapper component**

```typescript
// src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const WeeklyActivitySummary = lazy(
  () => import('../../WeeklyActivitySummary')
);

export default function WeeklyActivityTab() {
  return (
    <div className="space-y-4">
      {/* Tab-specific filters */}
      <div className="bg-secondary/30 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Activity Filters</h3>
        <div className="flex gap-4">
          <div className="text-sm text-muted-foreground">
            Activity type and principal filters coming soon
          </div>
        </div>
      </div>

      {/* Render existing report */}
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <WeeklyActivitySummary />
      </Suspense>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx
git commit -m "feat: Add WeeklyActivityTab wrapper for existing report"
```

---

### Task 12: Create CampaignActivityTab Wrapper

**Files:**
- Create: `src/atomic-crm/reports/tabs/CampaignActivityTab.tsx`

**Step 1: Create wrapper component**

```typescript
// src/atomic-crm/reports/tabs/CampaignActivityTab.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const CampaignActivityReport = lazy(
  () => import('../../CampaignActivity/CampaignActivityReport')
);

export default function CampaignActivityTab() {
  return (
    <div className="space-y-4">
      {/* Tab-specific filters */}
      <div className="bg-secondary/30 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Campaign Filters</h3>
        <div className="flex gap-4">
          <div className="text-sm text-muted-foreground">
            Campaign selector and activity filters coming soon
          </div>
        </div>
      </div>

      {/* Render existing report */}
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <CampaignActivityReport />
      </Suspense>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/atomic-crm/reports/tabs/CampaignActivityTab.tsx
git commit -m "feat: Add CampaignActivityTab wrapper for existing report"
```

---

### Task 13: Update Header Navigation

**Files:**
- Modify: `src/atomic-crm/layout/Header.tsx`

**Step 1: Remove dropdown menu and make Reports a direct link**

Find the Reports navigation section (around line 89-130) and replace:

```typescript
// REMOVE the NavigationMenu component and its contents
// REPLACE with simple NavigationTab:
<NavigationTab
  label="Reports"
  to="/reports"
  isActive={currentPath === "/reports"}
/>
```

**Step 2: Update currentPath logic**

Add to the path detection logic (around line 24-41):

```typescript
} else if (matchPath("/reports/*", location.pathname) || matchPath("/reports", location.pathname)) {
  currentPath = "/reports";
```

**Step 3: Test navigation**

```bash
npm run dev
# Click Reports in header
# Should navigate directly to /reports
```

**Step 4: Commit**

```bash
git add src/atomic-crm/layout/Header.tsx
git commit -m "feat: Update Header to use direct Reports navigation"
```

---

## Phase 4: Polish & Testing

### Task 14: Add Loading States

**Files:**
- Modify: `src/atomic-crm/reports/tabs/OverviewTab.tsx`

**Step 1: Add skeleton loading states**

```typescript
// In OverviewTab.tsx, wrap KPI cards:
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="h-32" />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    {/* KPI cards */}
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/atomic-crm/reports/tabs/OverviewTab.tsx
git commit -m "feat: Add skeleton loading states to Overview tab"
```

---

### Task 15: E2E Test for Tab Navigation

**Files:**
- Create: `tests/e2e/specs/reports/reports-navigation.spec.ts`

**Step 1: Write E2E test**

```typescript
// tests/e2e/specs/reports/reports-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reports Navigation', () => {
  test('navigates between report tabs', async ({ page }) => {
    await page.goto('/reports');

    // Check default tab
    await expect(page.getByRole('tab', { name: 'Overview', selected: true })).toBeVisible();
    await expect(page.getByText('Total Opportunities')).toBeVisible();

    // Navigate to Opportunities tab
    await page.getByRole('tab', { name: 'Opportunities by Principal' }).click();
    await expect(page.url()).toContain('tab=opportunities');

    // Navigate to Weekly Activity tab
    await page.getByRole('tab', { name: 'Weekly Activity' }).click();
    await expect(page.url()).toContain('tab=weekly');

    // Navigate to Campaign Activity tab
    await page.getByRole('tab', { name: 'Campaign Activity' }).click();
    await expect(page.url()).toContain('tab=campaign');
  });

  test('preserves tab selection on refresh', async ({ page }) => {
    await page.goto('/reports?tab=weekly');

    await expect(page.getByRole('tab', { name: 'Weekly Activity', selected: true })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('tab', { name: 'Weekly Activity', selected: true })).toBeVisible();
  });
});
```

**Step 2: Run E2E test**

```bash
npm run test:e2e -- reports-navigation.spec.ts
```
Expected: PASS

**Step 3: Commit**

```bash
git add tests/e2e/specs/reports/reports-navigation.spec.ts
git commit -m "test: Add E2E tests for reports tab navigation"
```

---

## Phase 5: Cleanup

### Task 16: Remove Old Report Routes

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`

**Step 1: Remove individual report routes**

Find and remove:
```typescript
// REMOVE these routes:
<Route path="/reports/opportunities-by-principal" element={<reports.OpportunitiesByPrincipalReport />} />
<Route path="/reports/weekly-activity" element={<reports.WeeklyActivitySummary />} />
<Route path="/reports/campaign-activity" element={<reports.CampaignActivityReport />} />
```

**Step 2: Commit**

```bash
git add src/atomic-crm/root/CRM.tsx
git commit -m "cleanup: Remove deprecated individual report routes"
```

---

### Task 17: Archive Old ReportLayout

**Files:**
- Move: `src/atomic-crm/reports/ReportLayout.tsx` → `src/atomic-crm/_deprecated/ReportLayout.tsx`

**Step 1: Create deprecated folder and move file**

```bash
mkdir -p src/atomic-crm/_deprecated
mv src/atomic-crm/reports/ReportLayout.tsx src/atomic-crm/_deprecated/
```

**Step 2: Commit**

```bash
git add src/atomic-crm/_deprecated/
git add src/atomic-crm/reports/ReportLayout.tsx
git commit -m "cleanup: Archive old ReportLayout component"
```

---

### Task 18: Clean Up localStorage Keys

**Files:**
- Create: `src/atomic-crm/reports/utils/cleanupMigration.ts`

**Step 1: Create cleanup utility**

```typescript
// src/atomic-crm/reports/utils/cleanupMigration.ts
export function cleanupOldReportKeys() {
  const oldKeys = [
    'reports.opportunities.filters',
    'reports.weekly.filters',
    'reports.campaign.filters',
    'report-view-preference',
  ];

  oldKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('Cleaned up old report localStorage keys');
}
```

**Step 2: Call cleanup on mount (temporarily)**

Add to ReportsPage.tsx:
```typescript
import { cleanupOldReportKeys } from './utils/cleanupMigration';

// In component:
useEffect(() => {
  cleanupOldReportKeys();
}, []);
```

**Step 3: Commit**

```bash
git add src/atomic-crm/reports/utils/
git commit -m "cleanup: Add utility to remove old localStorage keys"
```

---

## Testing Checklist

Run all tests to ensure nothing is broken:

```bash
npm test                       # Unit tests
npm run test:e2e              # E2E tests
npm run lint                  # Linting
npm run build                 # Build verification
```

## Final Verification

1. Navigate to `/reports` - verify tabs work
2. Check each tab loads its content
3. Verify URL params update when switching tabs
4. Test global filters persist across tabs
5. Confirm old report URLs redirect or 404
6. Check bundle size hasn't increased significantly

---

## Summary

This plan breaks down the Pipedrive reports migration into **18 bite-sized tasks** across 5 phases:

- **Phase 1:** Setup infrastructure (5 tasks)
- **Phase 2:** Overview tab implementation (4 tasks)
- **Phase 3:** Report migration (4 tasks)
- **Phase 4:** Polish & testing (2 tasks)
- **Phase 5:** Cleanup (3 tasks)

Each task is designed to be:
- Completed in 5-30 minutes
- Independently testable
- Committable on its own
- Clear enough for any developer to execute

Total estimated time: 8-10 hours of focused implementation.