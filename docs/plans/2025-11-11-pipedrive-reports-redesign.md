# Pipedrive-Inspired Reports UI/UX Redesign

## Executive Summary

Transform the current dropdown-based reports navigation into a unified, tabbed reports hub following Pipedrive's modern analytics patterns. This design provides both high-level insights (Overview tab) and detailed analysis capabilities while maintaining consistency with the existing Atomic CRM design system.

## Design Decisions

### Scope
- **Coverage**: Reports Hub landing page + redesign of all 3 existing reports
- **Navigation**: Replace dropdown menu with direct navigation to tabbed interface
- **Filters**: Hybrid approach with global filters + tab-specific filters
- **Visuals**: Chart.js + react-chartjs-2 for professional visualizations
- **Styling**: Match current theme (semantic colors, existing spacing system)

## Architecture Overview

### URL Structure
```
/reports                    # Default to overview tab
/reports?tab=overview       # Explicit overview
/reports?tab=opportunities  # Opportunities by Principal
/reports?tab=weekly         # Weekly Activity Summary
/reports?tab=campaign       # Campaign Activity Report
```

### Component Hierarchy
```
ReportsPage
├── GlobalFilterBar        # Persistent across tabs
│   ├── DateRangeFilter   # With presets
│   ├── SalesRepFilter    # Dropdown selector
│   └── ExportAllButton   # Export complete dataset
├── TabNavigation         # Horizontal tabs
└── TabContent           # Active tab component
    ├── OverviewTab
    ├── OpportunitiesTab
    ├── WeeklyActivityTab
    └── CampaignActivityTab
```

## Detailed Specifications

### 1. Global Navigation Changes

**Header.tsx modifications:**
- Remove `NavigationMenu` component for Reports
- Change Reports link to direct navigation: `<NavigationTab label="Reports" to="/reports" />`
- Active state when URL starts with `/reports`

### 2. Reports Page Layout

**Structure (top to bottom):**
1. Page Title: "Reports & Analytics"
2. Global Filter Bar (80px height)
3. Tab Navigation (48px height)
4. Tab-Specific Filters (collapsible, 60px collapsed)
5. Tab Content Area (dynamic height)

**Responsive Behavior:**
- Desktop (>1024px): Full layout as described
- iPad (768-1024px): Filters stack vertically, 2-column grids
- Mobile (<768px): Single column, simplified charts, horizontal scroll for tables

### 3. Global Filter Bar

**Components:**
- **Date Range Selector**
  - Presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, Custom
  - Custom opens date picker modal
  - Default: Last 30 Days

- **Sales Rep Filter**
  - Autocomplete dropdown
  - "All Reps" option at top
  - Shows rep name + avatar if available

- **Export All Reports**
  - Dropdown: CSV, PDF, Excel
  - Generates comprehensive report package
  - Shows progress indicator for large exports

**Persistence:**
- Store in localStorage: `reports.globalFilters`
- Apply to all API calls across tabs
- Reset button to clear all filters

### 4. Overview Tab Design

**KPI Cards (4-column grid):**
```typescript
interface KPICard {
  title: string;
  value: string | number;
  change: number; // Percentage
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}
```

Cards:
1. Total Opportunities (count + pipeline value subtitle)
2. Activities This Week (count + most common type)
3. Conversion Rate (percentage + stage funnel mini-visualization)
4. Stale Leads (count + days threshold badge)

**Preview Charts (2x2 grid):**

1. **Pipeline by Stage** (Doughnut Chart)
```typescript
{
  type: 'doughnut',
  data: {
    labels: OPPORTUNITY_STAGE_CHOICES,
    datasets: [{
      data: stageCounts,
      backgroundColor: [--primary, --brand-700, --brand-600, ...]
    }]
  },
  options: {
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.value} (${percentage}%)`
        }
      }
    }
  }
}
```

2. **Activity Trend** (Line Chart)
- X-axis: Last 30 days
- Y-axis: Activity count
- Toggle: Daily/Weekly view
- Smooth gradient fill under line

3. **Top Principals** (Horizontal Bar Chart)
- Top 5 by opportunity count
- Shows opportunity value on hover
- Clickable bars navigate to Opportunities tab filtered by principal

4. **Rep Performance** (Stacked Bar Chart)
- X-axis: Sales reps
- Y-axis: Activity count
- Stack: Activity types (different colors)
- This week's data

### 5. Individual Report Tab Redesigns

#### Opportunities by Principal Tab

**Tab-Specific Filters:**
- Principal Organization (searchable dropdown)
- Opportunity Stage (multi-select chips)
- Opportunity Status (active/inactive toggle)
- Close Date Range (if different from global)

**Summary Metrics Bar:**
- Total Opportunities: {count}
- Pipeline Value: ${total}
- Average Deal Size: ${average}
- Conversion Rate: {percentage}%

**Enhanced Principal Groups:**
```typescript
interface PrincipalGroupEnhanced {
  // Existing fields
  principalId: string;
  principalName: string;
  opportunities: Opportunity[];

  // New additions
  stageChart: MiniPieData;      // Mini pie chart data
  trendIndicator: 'growing' | 'stable' | 'declining';
  lastActivity: Date;
  assignedRep: string;
}
```

**Visual Enhancements:**
- Zebra striping on expanded rows
- Sticky principal header while scrolling within group
- Quick actions dropdown per principal
- Mini stage distribution chart per principal

#### Weekly Activity Tab

**Tab-Specific Filters:**
- Activity Type (multi-select)
- Principal Organization (searchable dropdown)
- Minimum Activity Threshold (slider 0-20)

**Data Grid Implementation:**
```typescript
interface ActivityGrid {
  columns: [
    { field: 'rep', header: 'Sales Rep', frozen: true },
    { field: 'principal', header: 'Principal' },
    { field: 'calls', header: 'Calls', type: 'numeric' },
    { field: 'emails', header: 'Emails', type: 'numeric' },
    { field: 'meetings', header: 'Meetings', type: 'numeric' },
    { field: 'total', header: 'Total', type: 'numeric', bold: true }
  ],
  features: {
    sorting: true,
    grouping: 'rep',
    heatMap: true,    // Color intensity based on values
    expandable: true, // Show activity details
    export: ['summary', 'detailed']
  }
}
```

#### Campaign Activity Tab

**Tab-Specific Filters:**
- Campaign Selector (moved from main content)
- Activity Type (multi-select chips)
- Stale Threshold (slider 1-30 days)
- Show Only Stale (toggle)

**Layout Restructure:**
- Campaign selector becomes primary filter
- Summary metrics bar with ROI calculations
- Activity type cards get progress bars
- Stale leads as slide-out panel (not inline toggle)

**New Features:**
- Sparkline charts in activity cards
- Campaign comparison mode (side-by-side)
- Activity timeline visualization
- Engagement heatmap by day/hour

### 6. Technical Implementation

#### State Management

**Global Filter Context:**
```typescript
interface GlobalFilters {
  dateRange: { start: Date; end: Date };
  salesRepId: number | null;
}

const GlobalFilterContext = React.createContext<{
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
}>({
  filters: defaultFilters,
  setFilters: () => {}
});
```

**Tab State via URL:**
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'overview';

const handleTabChange = (tab: string) => {
  setSearchParams({ tab });
};
```

#### Chart.js Configuration

**Theme Integration:**
```typescript
const useChartTheme = () => {
  const cssVars = getComputedStyle(document.documentElement);

  return {
    colors: {
      primary: cssVars.getPropertyValue('--primary'),
      brand700: cssVars.getPropertyValue('--brand-700'),
      brand600: cssVars.getPropertyValue('--brand-600'),
      success: cssVars.getPropertyValue('--success'),
      warning: cssVars.getPropertyValue('--warning'),
      muted: cssVars.getPropertyValue('--muted')
    },
    font: {
      family: cssVars.getPropertyValue('--font-sans'),
      size: 12
    }
  };
};
```

**Performance Optimizations:**
```typescript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  },
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb',
      samples: 50
    }
  }
};
```

#### Data Fetching Pattern

```typescript
const useReportData = (reportType: string, filters: GlobalFilters) => {
  const { data, isPending, error } = useGetList(
    getResourceName(reportType),
    {
      filter: buildApiFilter(filters),
      pagination: { page: 1, perPage: 10000 },
      sort: getDefaultSort(reportType)
    }
  );

  const processedData = useMemo(
    () => processReportData(reportType, data),
    [reportType, data]
  );

  return { data: processedData, isPending, error };
};
```

### 7. Migration Strategy

**Phase 1: Setup (Week 1)**
- Install Chart.js + react-chartjs-2
- Create ReportsPage component with tab structure
- Implement GlobalFilterContext
- Update routing in CRM.tsx

**Phase 2: Overview Tab (Week 1-2)**
- Build KPI cards with mock data
- Implement 4 preview charts
- Connect to real data APIs
- Add loading states and error handling

**Phase 3: Report Migration (Week 2-3)**
- Refactor OpportunitiesByPrincipalReport as tab
- Refactor WeeklyActivitySummary as tab
- Refactor CampaignActivityReport as tab
- Maintain backward compatibility during transition

**Phase 4: Polish (Week 3-4)**
- Add animations and transitions
- Implement export functionality
- Performance optimization
- Comprehensive testing

**Phase 5: Cleanup (Week 4-5)**
- Remove dropdown menu code from Header.tsx
- Delete old report routes from CRM.tsx
- Remove ReportLayout wrapper component (replaced by tabs)
- Clean up unused report-specific filter components
- Remove backward compatibility shims
- Consolidate duplicate data fetching logic
- Update all report links throughout the codebase
- Archive old report components to `_deprecated/` folder
- Update user documentation and help text
- Remove feature flags if used during migration
- Optimize bundle size (tree-shake unused Chart.js modules)
- Run final performance audit and address bottlenecks
- Update CI/CD tests to reflect new structure
- Remove old E2E tests for dropdown navigation
- Clean up localStorage keys from old implementation

### 8. Testing Strategy

**Unit Tests:**
- Filter context behavior
- Chart data transformations
- Export sanitization
- Tab navigation state

**Integration Tests:**
- Filter persistence across tabs
- Data fetching with filters
- Chart rendering with real data
- Export file generation

**E2E Tests:**
- Full report workflow
- Tab switching with data
- Filter combinations
- Export and download

## Success Metrics

1. **Performance**: Initial load < 2 seconds, tab switch < 500ms
2. **Usability**: 50% reduction in clicks to access report data
3. **Adoption**: 80% of users accessing Overview tab weekly
4. **Data Quality**: 100% of exports pass CSV security validation

## Accessibility Considerations

- ARIA labels on all interactive elements
- Keyboard navigation for tabs (Arrow keys)
- Screen reader announcements for data updates
- High contrast mode support for charts
- Alternative text descriptions for visual data

## Future Enhancements

1. **Saved Report Configurations**: Let users save filter combinations
2. **Scheduled Reports**: Email reports on schedule
3. **Custom Dashboards**: Drag-and-drop widget builder
4. **Real-time Updates**: WebSocket for live data
5. **AI Insights**: Natural language report summaries

## Dependencies

```json
{
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "date-fns": "^2.30.0"
}
```

## Implementation Checklist

- [ ] Install Chart.js dependencies
- [ ] Create ReportsPage component
- [ ] Implement GlobalFilterContext
- [ ] Build Overview tab with charts
- [ ] Migrate Opportunities report
- [ ] Migrate Weekly Activity report
- [ ] Migrate Campaign Activity report
- [ ] Update Header navigation
- [ ] Add loading states
- [ ] Implement export functionality
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation update
- [ ] Remove dropdown navigation code
- [ ] Archive old report components
- [ ] Clean up unused filters
- [ ] Remove backward compatibility code
- [ ] Update all report links
- [ ] Optimize Chart.js bundle
- [ ] Final performance audit
- [ ] Clean up old localStorage keys

## References

- [Pipedrive CRM Analytics](https://www.pipedrive.com/en/products/sales/crm-analytics)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [React Chart.js 2](https://react-chartjs-2.js.org/)
- Current implementations: `/src/atomic-crm/reports/`