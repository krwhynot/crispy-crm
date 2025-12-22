# Reports Page Component Specification

## Architecture Changes

### 1. Data Provider Migration

**Current (Violation):**
```tsx
// ❌ Direct useGetList - bypasses unifiedDataProvider
const { data: opportunities = [], isPending: opportunitiesPending } = useGetList<Opportunity>(
  "opportunities",
  {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      "deleted_at@is": null,
      ...(salesRepId && { opportunity_owner_id: salesRepId }),
    },
  }
);
```

**Issues:**
- Bypasses `unifiedDataProvider` single entry point requirement
- No Zod validation at API boundary
- Filter logic duplicated across all tabs
- Date range handling scattered in components

**Proposed:**
```tsx
// ✅ Use unifiedDataProvider via custom hook
const { data, isLoading, error } = useReportData<Opportunity>("opportunities", {
  dateRange: { start: dateRange.start, end: dateRange.end },
  salesRepId,
  additionalFilters: { "deleted_at@is": null },
});
```

**Benefits:**
- Centralized through `unifiedDataProvider`
- Zod validation happens at API boundary
- Consistent date range conversion logic
- Memoized filter objects prevent re-render loops
- Type-safe with generic support

### 2. Pagination Strategy

**Current Implementation:**
```tsx
pagination: { page: 1, perPage: 10000 }
```

**Analysis:**
- Unbounded query creates memory risk
- Acceptable at current scale (6 reps, 9 principals)
- Reports require full dataset for aggregation
- No server-side aggregation available yet

**Recommendation for MVP:**
- Keep `perPage: 10000` with monitoring
- Add warning comment about future optimization
- Consider Edge Function for server-side aggregation post-MVP

**Future Enhancement:**
```tsx
// Edge Function: aggregate-report-data
interface AggregateRequest {
  resource: string;
  metrics: string[];
  groupBy: string[];
  filters: Record<string, unknown>;
}
```

## New Components

### 1. FilterChip Component

**Purpose:** Display applied filter values with removal capability

**Interface:**
```tsx
interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}
```

**Implementation Requirements:**
- Semantic styling: `bg-muted`, `text-foreground`
- 44px touch target for remove button
- X icon from `lucide-react`
- Keyboard accessible (Enter/Space to remove)

**Usage Example:**
```tsx
<FilterChip
  label="Date Range"
  value="Last 7 Days"
  onRemove={() => setDateRange({ preset: "last30", start: null, end: null })}
/>
```

**Styling:**
```tsx
// Base chip
className="inline-flex items-center gap-compact px-3 py-2 rounded-md bg-muted text-foreground text-sm"

// Remove button (44px touch target)
className="h-11 w-11 rounded-full hover:bg-muted-foreground/10"
```

### 2. AppliedFiltersBar Component

**Purpose:** Horizontal bar showing all active filters with reset capability

**Interface:**
```tsx
interface AppliedFiltersBarProps {
  filters: Array<{
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  onResetAll: () => void;
  hasActiveFilters: boolean;
}
```

**Implementation Requirements:**
- Only renders when `hasActiveFilters === true`
- Horizontal flex layout with `gap-compact`
- "Reset All" button with ghost variant
- Semantic colors only

**Usage Example:**
```tsx
<AppliedFiltersBar
  filters={[
    {
      label: "Date Range",
      value: "Last 7 Days",
      onRemove: () => setDateRange({ preset: "last30", start: null, end: null }),
    },
    {
      label: "Sales Rep",
      value: "John Smith",
      onRemove: () => setSalesRepId(null),
    },
  ]}
  onResetAll={handleResetAll}
  hasActiveFilters={hasActiveFilters}
/>
```

**Layout:**
```tsx
<div className="flex items-center justify-between gap-content p-content bg-muted/50 rounded-lg">
  <div className="flex flex-wrap items-center gap-compact">
    {filters.map((filter) => (
      <FilterChip key={filter.label} {...filter} />
    ))}
  </div>
  <Button variant="ghost" size="sm" onClick={onResetAll} className="h-11">
    <RotateCcw className="h-4 w-4 mr-2" />
    Reset All
  </Button>
</div>
```

### 3. useReportData Hook

**Purpose:** Wrapper around `unifiedDataProvider.getList()` with report-specific optimizations

**Interface:**
```tsx
interface UseReportDataOptions {
  dateRange?: { start: Date | null; end: Date | null };
  salesRepId?: number | null;
  additionalFilters?: Record<string, unknown>;
}

function useReportData<T extends RaRecord>(
  resource: string,
  options: UseReportDataOptions
): {
  data: T[];
  isLoading: boolean;
  error: Error | null;
}
```

**Implementation Requirements:**
- Calls `unifiedDataProvider.getList()` directly
- Converts date range to ISO strings
- Memoizes filter objects to prevent re-render loops
- Type-safe with generics

**Usage Example:**
```tsx
const { data: opportunities, isLoading, error } = useReportData<Opportunity>(
  "opportunities",
  {
    dateRange: { start: startDate, end: endDate },
    salesRepId,
    additionalFilters: { "deleted_at@is": null },
  }
);
```

**Implementation Pattern:**
```tsx
export function useReportData<T extends RaRecord>(
  resource: string,
  options: UseReportDataOptions
) {
  const dataProvider = useDataProvider();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize filter object
  const filter = useMemo(() => {
    const baseFilter = { ...options.additionalFilters };

    if (options.dateRange?.start) {
      baseFilter["created_at@gte"] = options.dateRange.start.toISOString();
    }
    if (options.dateRange?.end) {
      baseFilter["created_at@lte"] = options.dateRange.end.toISOString();
    }
    if (options.salesRepId) {
      baseFilter.created_by = options.salesRepId;
    }

    return baseFilter;
  }, [options.dateRange, options.salesRepId, options.additionalFilters]);

  useEffect(() => {
    setIsLoading(true);
    dataProvider
      .getList<T>(resource, {
        pagination: { page: 1, perPage: 10000 }, // TODO: Add Edge Function for aggregation
        filter,
      })
      .then((result) => {
        setData(result.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [dataProvider, resource, filter]);

  return { data, isLoading, error };
}
```

### 4. EmptyState Component

**Purpose:** Actionable empty state for reports with no data

**Interface:**
```tsx
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Implementation Requirements:**
- Centered layout with muted styling
- Optional icon from `lucide-react`
- Optional action button
- Semantic colors only

**Usage Example:**
```tsx
<EmptyState
  title="No Opportunities Found"
  description="Try adjusting your filters or create a new opportunity to get started."
  icon={TrendingUp}
  action={{
    label: "Create Opportunity",
    onClick: () => navigate("/opportunities/create"),
  }}
/>
```

**Layout:**
```tsx
<div className="flex flex-col items-center justify-center p-widget space-y-content text-center">
  {icon && <Icon className="h-12 w-12 text-muted-foreground" />}
  <div className="space-y-compact">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-md">{description}</p>
  </div>
  {action && (
    <Button onClick={action.onClick} className="h-11">
      {action.label}
    </Button>
  )}
</div>
```

## Components NOT Changing

### KPICard Component
**Status:** Meets all standards - NO changes required

**Rationale:**
- Already supports `variant` prop (default, warning, success, destructive)
- Implements proper a11y (`role="button"`, `aria-label`, keyboard handlers)
- Uses 44px touch targets implicitly through `CardContent` padding
- Semantic colors only (`text-muted-foreground`, `text-primary`, etc.)
- Click handlers for navigation already implemented

**Key Features:**
- Variants for visual emphasis (amber styling for stale deals)
- Keyboard navigation (Enter/Space)
- Hover states with ring focus
- Icon animation on hover
- Trend indicators with semantic colors

### ChartWrapper Component
**Status:** Solid implementation - NO changes required

**Rationale:**
- Fixed height (`h-[300px]`) prevents layout shift
- Loading skeleton for async data
- Consistent card styling
- Simple, focused responsibility

**Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="relative h-[300px] w-full">
      {isLoading ? <Skeleton /> : children}
    </div>
  </CardContent>
</Card>
```

### ReportPageShell Component
**Status:** Good breadcrumb/header pattern - NO changes required

**Rationale:**
- Consistent breadcrumb navigation with semantic HTML
- Flexible actions slot for buttons
- Semantic spacing tokens (`gap-content`, `space-y-section`)
- Accessibility support (`aria-label="Breadcrumb"`)

**Layout:**
```tsx
<div className="p-content lg:p-widget space-y-section">
  {/* Breadcrumb nav */}
  <nav aria-label="Breadcrumb">...</nav>

  {/* Page header with actions */}
  <div className="flex items-center justify-between">
    <h1>{title}</h1>
    {actions}
  </div>

  {/* Content */}
  <div>{children}</div>
</div>
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `components/FilterChip.tsx` | **NEW** | Applied filter chip with remove button (44px touch target) |
| `components/AppliedFiltersBar.tsx` | **NEW** | Horizontal bar showing active filters with Reset All |
| `components/EmptyState.tsx` | **NEW** | Actionable empty state with optional icon and action |
| `hooks/useReportData.ts` | **NEW** | Custom hook wrapping `unifiedDataProvider.getList()` |
| `components/TabFilterBar.tsx` | **MODIFY** | Integrate `AppliedFiltersBar` component |
| `tabs/OverviewTab.tsx` | **MODIFY** | Replace `useGetList` with `useReportData` hook |
| `tabs/OpportunitiesTab.tsx` | **MODIFY** | Replace `useGetList` with `useReportData` hook |
| `tabs/WeeklyActivityTab.tsx` | **MODIFY** | Replace `useGetList` with `useReportData` hook |
| `tabs/CampaignActivityTab.tsx` | **MODIFY** | Replace `useGetList` with `useReportData` hook |

## Critical Constraints

### NO Dollar Amounts or Volume Tracking
Per CLAUDE.md, the following are explicitly **NOT MVP**:
- Volume tracking
- Price tracking
- Revenue calculations
- Financial metrics

**Chart.js Implementation:**
- Use count-based metrics only (opportunity count, activity count)
- No currency formatters
- No volume/units axes

### Semantic Colors Only
**Correct Usage:**
```tsx
className="text-muted-foreground bg-primary text-destructive"
```

**WRONG:**
```tsx
className="text-gray-500 bg-green-600 text-red-500"
className="text-[#FF0000]"
style={{ color: "oklch(0.5 0.2 180)" }}
```

### Touch Targets
All interactive elements must meet 44x44px minimum:
```tsx
// Correct
<Button className="h-11 w-11">...</Button>

// Wrong
<Button className="h-8 w-8">...</Button>
```

## Integration Example

**Before (OverviewTab.tsx):**
```tsx
const { data: opportunities = [] } = useGetList<Opportunity>("opportunities", {
  pagination: { page: 1, perPage: 10000 },
  filter: { "deleted_at@is": null, ...(salesRepId && { opportunity_owner_id: salesRepId }) },
});
```

**After:**
```tsx
const { data: opportunities, isLoading } = useReportData<Opportunity>("opportunities", {
  dateRange: { start: dateRange.start, end: dateRange.end },
  salesRepId,
  additionalFilters: { "deleted_at@is": null },
});

// Applied filters integration
<AppliedFiltersBar
  filters={[
    dateRange.preset !== "last30" && {
      label: "Date Range",
      value: dateRange.preset,
      onRemove: () => setDateRange({ preset: "last30", start: null, end: null }),
    },
    salesRepId && {
      label: "Sales Rep",
      value: salesMap.get(salesRepId) || `Rep ${salesRepId}`,
      onRemove: () => setSalesRepId(null),
    },
  ].filter(Boolean)}
  onResetAll={handleReset}
  hasActiveFilters={hasActiveFilters}
/>

// Empty state
{!isLoading && opportunities.length === 0 && (
  <EmptyState
    title="No Opportunities Found"
    description="Try adjusting your filters or create a new opportunity."
    icon={TrendingUp}
  />
)}
```

## Testing Requirements

### Unit Tests (Vitest)
- `FilterChip.test.tsx` - Remove button fires callback
- `AppliedFiltersBar.test.tsx` - Reset All clears all filters
- `useReportData.test.ts` - Memoization prevents infinite loops
- `EmptyState.test.tsx` - Action button renders conditionally

### E2E Tests (Playwright)
- Filter application updates chip display
- Reset All clears all filters
- Empty state shows when no data matches filters
- Semantic selectors only (`getByRole`, `getByText`)

## Migration Notes

### Phase 1: Create New Components
1. `FilterChip.tsx` - Standalone, no dependencies
2. `EmptyState.tsx` - Standalone, no dependencies
3. `useReportData.ts` - Requires `unifiedDataProvider`
4. `AppliedFiltersBar.tsx` - Depends on `FilterChip`

### Phase 2: Integrate into TabFilterBar
- Add `AppliedFiltersBar` below existing filters
- Pass filter state as props
- Verify no regression in existing behavior

### Phase 3: Migrate Tabs to useReportData
- Start with `OverviewTab.tsx` (most complex)
- Replace `useGetList` with `useReportData`
- Verify KPI calculations remain accurate
- Test date range filtering
- Repeat for remaining tabs

### Phase 4: Add Empty States
- Add to each tab when `data.length === 0`
- Provide actionable next steps
- Test filter combinations that produce empty results
