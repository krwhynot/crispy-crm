# Crispy-CRM - Reports Module Documentation

> **Comprehensive documentation for the Reports & Analytics system**
> Last Updated: 2025-11-28
> **PRD Reference:** See `docs/PRD.md` v1.18 Section 9.6 (Reports Module) for MVP requirements: 4 KPIs, per-stage stale thresholds, click-through navigation

---

## 1. Report Page Overview

The **Reports Module** provides a comprehensive analytics dashboard for tracking sales activities, opportunities, and campaign performance in the Crispy-CRM system. It features a **tabbed interface** with four specialized report views, global filtering capabilities, CSV export functionality, and interactive data visualization.

### Purpose
- **Principal-centric reporting**: Groups opportunities and activities by principal organization
- **Sales activity tracking**: Monitors rep performance and engagement metrics
- **Campaign analysis**: Tracks campaign effectiveness and identifies stale leads
- **Executive dashboard**: Provides high-level KPIs and pipeline visualization

### Key Features
- 📊 **4 specialized report tabs** with lazy loading for performance
- 🎯 **Global filters** (date range, sales rep) with localStorage persistence
- 📥 **CSV export** with formula injection protection (sanitized values)
- 📈 **Interactive charts** using Chart.js and recharts
- 🔍 **Advanced filtering** (multi-select stages, date ranges, activity types)
- ♿ **WCAG 2.1 AA compliant** with screen reader support
- 🎨 **Semantic color system** (OKLCH format, no hardcoded hex values)
- 📱 **iPad-first responsive design** (768px+ optimized)

---

## 2. File Structure

### Main Entry Point
```
src/atomic-crm/reports/
├── ReportsPage.tsx              # Main container with tab navigation
└── index.ts                      # Lazy-loaded report exports
```

### Report Components (Tab Views)
```
src/atomic-crm/reports/
├── tabs/
│   ├── OverviewTab.tsx           # Dashboard with KPIs and pipeline chart
│   ├── OpportunitiesTab.tsx      # Wrapper for OpportunitiesByPrincipalReport
│   ├── WeeklyActivityTab.tsx     # Wrapper for WeeklyActivitySummary
│   └── CampaignActivityTab.tsx   # Wrapper for CampaignActivityReport
│
├── OpportunitiesByPrincipalReport.tsx  # Principal-grouped opportunities
├── WeeklyActivitySummary.tsx           # Rep activity by principal
└── CampaignActivity/
    ├── CampaignActivityReport.tsx      # Campaign metrics and filtering
    ├── ActivityTypeCard.tsx             # Expandable activity type groups
    └── StaleLeadsView.tsx               # Stale opportunities table
```

### Supporting Infrastructure
```
src/atomic-crm/reports/
├── components/
│   ├── KPICard.tsx               # Reusable metric card with trends
│   ├── ChartWrapper.tsx          # Standardized chart container
│   └── GlobalFilterBar.tsx       # Global filter UI (partial impl)
│
├── contexts/
│   └── GlobalFilterContext.tsx   # Shared filter state (date range, sales rep)
│
├── hooks/
│   └── useChartTheme.ts          # Dynamic CSS theme extraction
│
├── charts/
│   ├── chartSetup.ts             # Chart.js module registration
│   └── PipelineChart.tsx         # Doughnut chart for opportunity stages
│
├── utils/
│   └── cleanupMigration.ts       # localStorage cleanup for old reports
│
└── ReportLayout.tsx              # Common layout with header and export button
```

### Test Files
```
tests/
├── e2e/specs/reports/
│   ├── weekly-activity-report.spec.ts
│   ├── campaign-activity-report.spec.ts
│   └── reports-navigation.spec.ts
│
└── src/atomic-crm/reports/
    ├── ReportsPage.test.tsx
    ├── OpportunitiesByPrincipalReport.test.tsx
    ├── OverviewTab.test.tsx
    ├── components/KPICard.test.tsx
    ├── components/GlobalFilterBar.test.tsx
    ├── contexts/GlobalFilterContext.test.tsx
    └── CampaignActivity/__tests__/
        ├── CampaignActivityReport.test.tsx
        └── ActivityTypeCard.test.tsx
```

---

## 3. Components Used

### shadcn/ui Components (Primary UI Library)

#### Card Components
- **Files**: All report files, `KPICard.tsx`, `ChartWrapper.tsx`
- **Components**: `Card`, `CardContent`, `CardHeader`, `CardTitle`
- **Purpose**: Semantic card-based layout for reports, KPIs, and charts
- **Status**: ✅ **Actively used** across all reports

#### Button
- **Files**: `ReportLayout.tsx`, `OpportunitiesByPrincipalReport.tsx`, `GlobalFilterBar.tsx`, `CampaignActivityReport.tsx`
- **Variants**: `default`, `outline`, `ghost`, `link`
- **Purpose**: Export CSV, filter actions, clear filters, navigation
- **Status**: ✅ **Actively used**

#### Badge
- **Files**: `OpportunitiesByPrincipalReport.tsx`, `WeeklyActivitySummary.tsx`, `CampaignActivityReport.tsx`
- **Variants**: `default`, `secondary`, `outline`
- **Purpose**: Opportunity counts, activity badges, low-activity warnings
- **Status**: ✅ **Actively used**

#### Select Components
- **Files**: `GlobalFilterBar.tsx`, `CampaignActivityReport.tsx`
- **Components**: `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- **Purpose**: Campaign selection, date presets, sales rep filter
- **Status**: ✅ **Actively used**

#### Popover
- **Files**: `GlobalFilterBar.tsx`
- **Components**: `Popover`, `PopoverContent`, `PopoverTrigger`
- **Purpose**: Date range picker (placeholder implementation)
- **Status**: ⚠️ **Partially implemented** (UI exists but functionality incomplete)

#### Checkbox & Label
- **Files**: `CampaignActivityReport.tsx`
- **Purpose**: Activity type multi-select, stale leads toggle
- **Status**: ✅ **Actively used**

#### Skeleton
- **Files**: `ChartWrapper.tsx`, `OverviewTab.tsx`, All tab wrappers
- **Purpose**: Loading states for charts and KPIs
- **Status**: ✅ **Actively used**

#### Tabs
- **Files**: `ReportsPage.tsx`
- **Components**: `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- **Purpose**: Main tab navigation between 4 report views
- **Status**: ✅ **Actively used**

### React Admin Components

#### Data Fetching Hooks (from ra-core)
- **Hook**: `useGetList<T>(resource, options)`
- **Files**: All report components
- **Usage**: Fetch opportunities, activities, sales, organizations
- **Pattern**: High pagination limit (10,000) for complete datasets
- **Status**: ✅ **Core data fetching mechanism**

**Example**:
```typescript
const { data: opportunities, isPending } = useGetList<Opportunity>(
  "opportunities_summary",
  {
    pagination: { page: 1, perPage: 10000 },
    filter: { "deleted_at@is": null, status: "active" },
    sort: { field: "estimated_close_date", order: "ASC" },
  }
);
```

#### Other React Admin Hooks
- `useNotify()` - User notifications for export success/errors
- `useGetIdentity()` - Current user context (WeeklyActivitySummary)
- `downloadCSV()` - CSV file download utility
- **Status**: ✅ **Actively used**

#### Custom React Admin Components
- **MultiSelectInput** (`@/components/admin/multi-select-input`)
  - **File**: `OpportunitiesByPrincipalReport.tsx`
  - **Purpose**: Multi-select stage filter
  - **Status**: ✅ **Actively used**

- **ReferenceInput** + **AutocompleteArrayInput** (`@/components/admin/*`)
  - **Files**: `OpportunitiesByPrincipalReport.tsx`
  - **Purpose**: Principal/Sales rep filtering with autocomplete
  - **Status**: ✅ **Actively used**

### Lucide React Icons

| Icon | Component | Purpose |
|------|-----------|---------|
| `Download` | ReportLayout, GlobalFilterBar | CSV export button |
| `ChevronDown`/`ChevronRight` | OpportunitiesByPrincipalReport, ActivityTypeCard | Expand/collapse controls |
| `ExternalLink` | OpportunitiesByPrincipalReport | Navigate to opportunity detail |
| `Calendar` | GlobalFilterBar | Date range selector |
| `User` | GlobalFilterBar | Sales rep filter |
| `RotateCcw` | GlobalFilterBar | Reset filters |
| `TrendingUp` | OverviewTab | Total opportunities KPI |
| `Activity` | OverviewTab | Activities this week KPI |
| `AlertCircle` | OverviewTab | Stale leads KPI |

**Status**: ✅ **All actively used**

### Chart Libraries

#### Chart.js + react-chartjs-2
- **Version**: chart.js@4.5.1, react-chartjs-2@5.3.1
- **Components**: `PipelineChart` (Doughnut chart)
- **Modules Registered**: ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title
- **Purpose**: Pipeline by stage visualization (doughnut chart with percentages)
- **Status**: ✅ **Actively used in OverviewTab**

**Configuration**:
```typescript
// chartSetup.ts - Global Chart.js registration
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Title
);
```

**Dynamic Theming**:
```typescript
// useChartTheme hook extracts CSS custom properties
const theme = useChartTheme();
backgroundColor: [
  theme.colors.primary,    // --primary
  theme.colors.brand700,   // --brand-700
  theme.colors.success,    // --success
  theme.colors.warning,    // --warning
]
```

#### recharts
- **Version**: 3.3.0
- **Status**: ⚠️ **Installed but NOT used in reports module**
- **Note**: Used in `src/atomic-crm/dashboard/PipelineByStage.tsx` (dashboard, not reports)

#### @nivo/bar
- **Version**: 0.99.0
- **Status**: ❌ **Installed but UNUSED** (no imports found in codebase)

---

## 4. Styling & CSS

### Primary Approach: Tailwind CSS v4

All components use Tailwind utility classes for layout, spacing, typography, and responsive design.

**Common Patterns**:
```tsx
// Spacing
className="space-y-4 p-6 gap-4"

// Layout
className="flex items-center justify-between"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Typography
className="text-3xl font-bold"
className="text-sm text-muted-foreground"

// Responsive breakpoints
className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
```

**iPad-First Responsive** (CLAUDE.md standard):
- Mobile: 375-767px
- iPad: 768-1024px (primary target)
- Desktop: 1440px+

### CSS Custom Properties (Semantic Colors)

**Location**: `src/index.css` (lines 6-123 in `@theme` layer)

#### Color System (OKLCH Format)
```css
/* Semantic colors used in reports */
--primary: var(--brand-500);             /* Forest green buttons */
--success: oklch(56% 0.115 155);         /* Emerald for positive trends */
--warning: oklch(68% 0.14 85);           /* Golden amber for warnings */
--destructive: oklch(58% 0.13 25);       /* Terracotta for errors */
--muted-foreground: var(--neutral-400);  /* Metadata text */
```

#### Chart-Specific Colors (8-color palette)
```css
--chart-1: oklch(55% 0.035 60);      /* Warm Tan/Soil (Baseline) */
--chart-2: oklch(52% 0.095 142);     /* Forest Green (Primary) */
--chart-3: oklch(63% 0.095 72);      /* Terracotta/Clay (Revenue) */
--chart-4: oklch(60% 0.06 138);      /* Sage/Olive (Secondary) */
--chart-5: oklch(70% 0.125 85);      /* Golden Amber (Warning) */
--chart-6: oklch(58% 0.065 180);     /* Sage-Teal (Cool) */
--chart-7: oklch(48% 0.065 295);     /* Eggplant (Inactive) */
--chart-8: oklch(50% 0.012 85);      /* Mushroom Gray (Fallback) */

--chart-gridline: oklch(90% 0.01 92);
--chart-axis-text: var(--muted-foreground);
```

#### Spacing Tokens
```css
/* Semantic spacing (Phase 1 rollout) */
--spacing-grid-columns-desktop: 12;
--spacing-grid-columns-ipad: 8;
--spacing-gutter-desktop: 12px;
--spacing-gutter-ipad: 20px;
--spacing-edge-desktop: 24px;
--spacing-edge-ipad: 60px;
--spacing-section: 24px;        /* Section gaps */
--spacing-widget: 16px;         /* Widget gaps */
--spacing-content: 12px;        /* Content padding */
--spacing-compact: 8px;         /* Tight spacing */
```

**Status**: ⚠️ Spacing tokens defined but not yet fully adopted in reports module (still uses Tailwind spacing classes)

### Conditional Styling with `cn()` Utility

**File**: `src/lib/utils.ts`

**Usage in KPICard**:
```typescript
const trendColor = trend === 'up' ? 'text-success'
  : trend === 'down' ? 'text-destructive'
  : 'text-muted-foreground';

<p className={cn("text-xs mt-2", trendColor)}>
  {changePrefix}{change}%
</p>
```

### Inline Styles (Strategic Use Only)

**Dynamic Height** (ChartWrapper.tsx):
```tsx
<div style={{ height }}>  {/* height prop: default '300px' */}
```

**Conditional Background** (WeeklyActivitySummary.tsx, line 287):
```tsx
<tr style={stats.total < 3 ? { backgroundColor: "var(--warning-light)" } : {}}>
```

### No CSS-in-JS
❌ **Not used**: styled-components, emotion, CSS modules, SCSS/LESS files

---

## 5. Data & Queries

### Database Views (Supabase)

#### `opportunities_summary`
**Migration**: `20251024125242_add_opportunities_summary_view.sql` (updated: `20251104125744`)

**Purpose**: Denormalized opportunity view with organization names and products

**Columns**:
- All `opportunities` table columns
- `customer_organization_name`, `principal_organization_name`, `distributor_organization_name`
- `products` (JSONB array with `product_name`, `principal_name`, `product_category`)

**RLS**: Uses `security_invoker = on` for row-level security enforcement

**Used By**:
- `OpportunitiesByPrincipalReport.tsx` (primary data source)

#### `organizations_summary`
**Migration**: `20251020001702_add_organizations_summary_rls_policies.sql`

**Purpose**: Aggregated organization metrics

**Columns**:
- All `organizations` table columns
- `nb_opportunities` (count of related opportunities)
- `nb_contacts` (count of related contacts)
- `last_opportunity_activity` (most recent opportunity update)

**Used By**:
- Not directly used in reports (available for future enhancements)

#### `dashboard_principal_summary`
**Migration**: `20251106190107_create_dashboard_principal_summary_view.sql`

**Purpose**: Principal-centric dashboard metrics with activity tracking

**Features**:
- Groups active opportunities by principal
- Calculates: `last_activity_date`, `days_in_stage`, `next_task`
- Status indicators: Good (≤7 days) / Warning (7-14 days) / Urgent (14+ days)
- Stuck flag: `stuck = TRUE` if in stage for 30+ days

**Used By**:
- Not used in current reports implementation (designed for future dashboard expansion)

### Data Fetching Patterns

#### Primary Pattern: `useGetList` from ra-core

All reports use the same pattern:
```typescript
const { data, isPending } = useGetList<Type>(
  "resource_name",
  {
    pagination: { page: 1, perPage: 10000 },  // High limit for complete dataset
    filter: { /* PostgREST filters */ },
    sort: { field: "fieldName", order: "ASC" | "DESC" },
  }
);
```

#### Filtering Syntax (PostgREST)

```typescript
// Operators
"deleted_at@is": null              // IS NULL
"activity_date@gte": "2025-01-01"  // >= (greater than or equal)
"activity_date@lte": "2025-01-31"  // <= (less than or equal)

// Multi-select (IN operator)
filter.stage = ["new_lead", "demo_scheduled"]

// Foreign key filtering
"opportunities.campaign": selectedCampaign
"opportunities.deleted_at@is": null
```

### Data Flow by Report

#### 1. Opportunities by Principal Report
**File**: `OpportunitiesByPrincipalReport.tsx`

| Data Source | Hook | Filters | Purpose |
|------------|------|---------|---------|
| `opportunities_summary` | `useGetList<Opportunity>` | deleted_at IS NULL, status: "active", optional: principal, stage, owner, date range | Main opportunity list |
| `sales` | `useGetList<Sale>` | id IN (owner IDs from opportunities) | Sales rep names for display |

**Transformation** (lines 113-152):
1. Group opportunities by `principal_organization_id`
2. Calculate `stageBreakdown` per principal (count by stage)
3. Sort principals by `totalCount` (descending)
4. Auto-expand top 3 principals on first load

**Export** (lines 167-200):
- Flattens principal groups into rows
- Sanitizes all string values with `sanitizeCsvValue()`
- Filename: `opportunities-by-principal-YYYY-MM-DD.csv`

#### 2. Weekly Activity Summary
**File**: `WeeklyActivitySummary.tsx`

| Data Source | Hook | Filters | Purpose |
|------------|------|---------|---------|
| `activities` | `useGetList<ActivityRecord>` | activity_date@gte, activity_date@lte (ISO week) | Activities in date range |
| `sales` | `useGetList<Sale>` | id IN (created_by IDs) | Sales rep names |
| `organizations` | `useGetList<Organization>` | id IN (organization_ids) | Principal names |

**Transformation** (lines 73-131):
1. Group by: `created_by` (rep) → `organization_id` (principal) → activity type
2. Count activities by type: calls, emails, meetings, notes
3. Flag principals with < 3 total activities as "Low Activity"

**Export** (lines 133-159):
- Fields: `rep_name`, `principal_name`, `calls`, `emails`, `meetings`, `notes`, `total`
- Filename: `weekly-activity-START-to-END.csv`

#### 3. Campaign Activity Report
**File**: `CampaignActivity/CampaignActivityReport.tsx`

| Data Source | Hook | Filters | Purpose |
|------------|------|---------|---------|
| `opportunities` | `useGetList<Opportunity>` | deleted_at IS NULL | Get available campaigns |
| `activities` (all) | `useGetList<Activity>` | opportunities.campaign, opportunities.deleted_at IS NULL | Unfiltered counts |
| `activities` (filtered) | `useGetList<Activity>` | Campaign + date range + activity types + sales rep | User-filtered activities |
| `sales` | `useGetList<Sale>` | id IN (created_by IDs) | Sales rep names |

**Transformation** (lines 186-238):
1. Group activities by `type`
2. Calculate metrics per group:
   - `totalCount`, `uniqueOrgs` (Set deduplication)
   - `percentage` of total activities
   - `mostActiveOrg` (organization with most activities of this type)

**Stale Opportunities** (lines 253-274):
- Filter: `daysInactive >= staleLeadsThreshold`
- Sort by `daysInactive` (descending)
- Never-contacted opportunities: `daysInactive = 999999` (sorts to end)

**Dual Export Modes**:
1. **Activity Export**: All activities with org, contact, date, rep, opportunity details
2. **Stale Leads Export**: Opportunities with `lastActivityDate`, `daysInactive`

#### 4. Overview Tab
**File**: `tabs/OverviewTab.tsx`

| Data Source | Hook | Filters | Purpose |
|------------|------|---------|---------|
| `opportunities` | `useGetList` | deleted_at IS NULL, optional: opportunity_owner_id (global filter) | KPI calculations |
| `activities` | `useGetList` | created_at in global date range, optional: created_by (global filter) | Week activity count |

**Transformation** (lines 42-67):
1. **KPIs**: `totalOpportunities`, `weekActivities` (last 7 days), `staleLeads` (stage='Lead' + no last_activity_at)
2. **Pipeline Data**: Group by stage using `OPPORTUNITY_STAGE_CHOICES`, filter out zero-count stages

**Uses**: `GlobalFilterContext` (date range, sales rep filter)

### Secondary Fetches Pattern

All reports use **dependent fetches** for lookups:
```typescript
// 1. Primary fetch
const { data: activities } = useGetList<Activity>(...);

// 2. Extract IDs
const ownerIds = useMemo(
  () => Array.from(new Set(activities.map(a => a.created_by).filter(Boolean))),
  [activities]
);

// 3. Secondary fetch for names
const { data: salesReps } = useGetList<Sale>("sales", {
  filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
});

// 4. Build lookup map
const salesMap = useMemo(
  () => new Map(salesReps.map(s => [s.id, `${s.first_name} ${s.last_name}`])),
  [salesReps]
);
```

**Performance**: Uses `Set` for deduplication, `useMemo` for expensive transformations

### CSV Security Implementation

**Utility**: `@/atomic-crm/utils/csvUploadValidator.ts`

#### `sanitizeCsvValue(value)` Function
**Purpose**: Prevent CSV formula injection attacks

**Pattern**:
```typescript
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

exportData.push({
  principal: sanitizeCsvValue(group.principalName),
  opportunity: sanitizeCsvValue(opp.name),
  sales_rep: sanitizeCsvValue(salesMap.get(opp.opportunity_owner_id!) || "Unassigned"),
});
```

**What it does**:
- Checks for leading formula characters: `=`, `+`, `-`, `@`, tab, carriage return
- Prepends single quote (`'`) to prevent formula evaluation
- Example: `=cmd|'/c calc'!A0` → `'=cmd|'/c calc'!A0`

**Used By**:
- `OpportunitiesByPrincipalReport.tsx` (line 173-180)
- `WeeklyActivitySummary.tsx` (line 139-140)
- `CampaignActivityReport.tsx` (line 406-453)

#### Papa Parse Security Config
**Function**: `getSecurePapaParseConfig()`

**Critical Settings**:
```typescript
{
  dynamicTyping: false,  // CRITICAL: Prevents auto-detection that could trigger formulas
  preview: 10000,        // Row limit
  skipEmptyLines: true,
}
```

---

## 6. Dependencies

### Production Dependencies

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| **react** | 19 | Core framework | ✅ Active |
| **react-router-dom** | latest | Navigation (`useNavigate`, `useSearchParams`) | ✅ Active |
| **ra-core** | latest | React Admin data hooks | ✅ Active |
| **chart.js** | 4.5.1 | Chart rendering engine | ✅ Active |
| **react-chartjs-2** | 5.3.1 | React wrapper for Chart.js | ✅ Active |
| **recharts** | 3.3.0 | Alternative charting library | ⚠️ Not used in reports (used in dashboard) |
| **@nivo/bar** | 0.99.0 | Advanced bar charts | ❌ **UNUSED** |
| **date-fns** | latest | Date utilities (`format`, `startOfWeek`, `subDays`) | ✅ Active |
| **jsonexport** | latest | JSON to CSV conversion | ✅ Active |
| **lucide-react** | latest | Icon library | ✅ Active |
| **zod** | latest | Validation schemas (INTERACTION_TYPE_OPTIONS) | ✅ Active |

### shadcn/ui Component Dependencies

All shadcn/ui components are source-code installed in `src/components/ui/`:
- `card`, `button`, `badge`, `select`, `popover`, `checkbox`, `label`, `skeleton`, `tabs`

**Dependency Chain**:
- shadcn/ui → Radix UI primitives → Tailwind CSS

### Custom Component Dependencies

| Import Path | Component | Purpose |
|------------|-----------|---------|
| `@/components/admin/multi-select-input` | MultiSelectInput | Stage multi-select filter |
| `@/components/admin/reference-input` | ReferenceInput | Principal/sales rep autocomplete |
| `@/components/admin/autocomplete-array-input` | AutocompleteArrayInput | Autocomplete UI |
| `@/atomic-crm/utils/csvUploadValidator` | sanitizeCsvValue, getSecurePapaParseConfig | CSV security |
| `@/atomic-crm/opportunities/stageConstants` | OPPORTUNITY_STAGE_CHOICES | Stage definitions |
| `@/atomic-crm/validation/activities` | INTERACTION_TYPE_OPTIONS | Activity type enums |
| `@/lib/utils` | cn | Conditional className utility |

---

## 7. Unused/Outdated Code

### ❌ Completely Unused Code

#### 1. **@nivo/bar Library**
- **Location**: `node_modules/@nivo/bar@0.99.0`
- **Status**: Installed but never imported
- **Recommendation**: **Remove from `package.json`** if not planned for future use
- **Impact**: Reduces bundle size

#### 2. **GlobalFilterBar Component**
- **File**: `src/atomic-crm/reports/components/GlobalFilterBar.tsx`
- **Status**: Implemented but **never rendered** in any report
- **Issues**:
  - Date preset calculations incomplete (only updates state, doesn't calculate ranges)
  - Export All button is placeholder (console.log only)
- **Recommendation**:
  - Complete implementation OR remove component
  - Consider integrating into OverviewTab for global filtering

#### 3. **Hardcoded Percentage Calculation**
- **File**: `CampaignActivity/ActivityTypeCard.tsx`, line 66
- **Code**: `const percentage = group.percentage ?? Math.round((group.totalCount / 247) * 100);`
- **Issue**: Magic number `247` appears to be leftover from testing
- **Recommendation**: **Remove fallback** - parent always provides `percentage`

### ⚠️ Placeholder/Incomplete Implementations

#### 1. **OverviewTab Charts (3 of 4)**
- **File**: `tabs/OverviewTab.tsx`, lines 113-129
- **Status**: Placeholders with "Chart implementation coming soon"
- **Charts**:
  1. ✅ **Pipeline by Stage** - Implemented (PipelineChart)
  2. ❌ **Activity Trend** - Placeholder
  3. ❌ **Top Principals** - Placeholder
  4. ❌ **Rep Performance** - Placeholder
- **Recommendation**: Prioritize based on user needs

#### 2. **GlobalFilterContext Integration**
- **File**: `contexts/GlobalFilterContext.tsx`
- **Status**: Fully implemented, but **only used in OverviewTab**
- **Not used in**:
  - OpportunitiesTab (uses local filters)
  - WeeklyActivityTab (uses local date range)
  - CampaignActivityTab (uses local filters)
- **Recommendation**:
  - Integrate global filters across all tabs for consistency
  - OR remove if local filters are preferred

#### 3. **KPICard Trend Calculations**
- **File**: `OverviewTab.tsx`, lines 84-103
- **Issue**: `change` values are hardcoded (12, -5, 0) instead of calculated
- **Example**:
  ```typescript
  <KPICard
    title="Total Opportunities"
    value={kpis.totalOpportunities}
    change={12}  // ← Hardcoded, should be calculated from historical data
    trend="up"
  />
  ```
- **Recommendation**: Calculate actual percentage changes from previous period

### 🔧 Minor Issues

#### 1. **CSS Variable Not Defined**
- **File**: `hooks/useChartTheme.ts`, line 28
- **Code**: `brand600: computedStyles.getPropertyValue('--brand-600') || '#2a2a2a'`
- **Issue**: `--brand-600` is referenced but may not be defined in `src/index.css`
- **Impact**: Falls back to `#2a2a2a` (acceptable)
- **Recommendation**: Verify CSS variable exists or document fallback behavior

#### 2. **Date Preset Handler Incomplete**
- **File**: `CampaignActivityReport.tsx`, lines 316-343
- **Function**: `setDatePresetHandler(preset)`
- **Status**: Works correctly (sets date ranges properly)
- **Non-issue**: Code is functional despite complexity

#### 3. **localStorage Migration Utility**
- **File**: `utils/cleanupMigration.ts`
- **Purpose**: One-time cleanup for old report keys
- **Status**: Runs on every ReportsPage mount (line 17-19)
- **Issue**: Could check migration flag before running
- **Current behavior**: Harmless (removes non-existent keys safely)
- **Recommendation**: Add guard to skip if migration already completed

### 📊 Test Coverage Gaps

Based on test files found:
- ✅ **Good coverage**: ReportsPage, OpportunitiesByPrincipalReport, KPICard, GlobalFilterContext, ActivityTypeCard
- ⚠️ **Missing unit tests**:
  - `WeeklyActivitySummary.tsx`
  - `CampaignActivityReport.tsx` (has E2E tests only)
  - `StaleLeadsView.tsx`
  - `ChartWrapper.tsx`
  - `PipelineChart.tsx`
  - `useChartTheme.ts`

---

## 8. Technical Notes

### Architecture Patterns

#### 1. **Lazy Loading Strategy**
All report components use React.lazy() for code splitting:
```typescript
// index.ts
const WeeklyActivitySummary = React.lazy(() => import("./WeeklyActivitySummary"));

// ReportsPage.tsx
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));

// Usage in tabs
<Suspense fallback={<div>Loading...</div>}>
  <OverviewTab />
</Suspense>
```

**Benefits**:
- Reduces initial bundle size
- Loads reports only when tabs are accessed
- Improves TTI (Time to Interactive)

#### 2. **Container/Presentation Pattern**
- **Tabs** (`tabs/*.tsx`) = Smart containers with data fetching
- **Reports** (`*Report.tsx`) = Presentation components
- **ReportLayout** = Consistent wrapper for all reports

#### 3. **Optimistic Expansion State**
Reports auto-expand top items on first load:
```typescript
// Auto-expand first 3 principals
if (expandedPrincipals.size === 0 && groups.length > 0) {
  const initialExpanded = new Set(groups.slice(0, 3).map(g => g.principalId || "null"));
  setExpandedPrincipals(initialExpanded);
}
```

**Used by**:
- OpportunitiesByPrincipalReport (line 146-149)
- CampaignActivityReport (line 277-282) - top 3 activity types

#### 4. **Performance Optimizations**

**useMemo for Expensive Calculations**:
```typescript
const principalGroups = useMemo(() => {
  // Group and transform data
}, [opportunities, expandedPrincipals.size]);

const reportData = useMemo(() => {
  // Complex grouping logic
}, [activities, salesMap, orgMap]);
```

**Set Deduplication**:
```typescript
const ownerIds = useMemo(
  () => Array.from(new Set((opportunities || []).map(o => o.opportunity_owner_id).filter(Boolean))),
  [opportunities]
);
```

**Map Lookups** (O(1) vs O(n) array find):
```typescript
const salesMap = useMemo(
  () => new Map((salesReps || []).map((s) => [s.id, `${s.first_name} ${s.last_name}`])),
  [salesReps]
);
```

### Accessibility (WCAG 2.1 AA Compliance)

#### Screen Reader Support
```tsx
// Campaign Activity Report, line 478-480
<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {ariaLiveMessage}
</div>

// Activity Type Card, line 99-100
aria-expanded={isExpanded}
aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label} section with ${group.totalCount} activities`}
```

#### Semantic HTML
- `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`
- Proper heading hierarchy (`<h1>`, `<h3>`, `<h4>`)
- `<button>` elements for interactive elements (not `<div>`)

#### Touch Targets (44x44px minimum)
```tsx
// StaleLeadsView, line 104
className="h-auto p-0 min-w-[44px] min-h-[44px]"

// ActivityTypeCard, line 164
<button className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center">
```

### State Management

#### Local State (useState)
- Filters (principal, stage, date range, sales rep)
- Expanded sections (Set data structure)
- Date presets
- Stale leads threshold

#### Context State (GlobalFilterContext)
- Global date range (last 30 days default)
- Global sales rep filter
- localStorage persistence with key `'reports.globalFilters'`

#### URL State (useSearchParams)
- Active tab in ReportsPage
- Enables deep linking: `/reports?tab=campaign`

### Data Transformation Pipeline

**Example: Weekly Activity Summary**

1. **Fetch** activities (raw data)
2. **Extract** IDs for secondary fetches (sales, organizations)
3. **Build** lookup maps (`salesMap`, `orgMap`)
4. **Group** by rep → principal → activity type
5. **Count** activities by type (calls, emails, meetings, notes)
6. **Flag** low-activity principals (< 3 total)
7. **Render** nested structure (RepActivityCard)
8. **Export** flattened CSV

### Error Handling

**Data Provider Errors**: Handled by unifiedDataProvider (integrated error logging)

**Export Errors**:
```typescript
jsonExport(exportData, (err, csv) => {
  if (err) {
    console.error("Export error:", err);
    notify("Export failed. Please try again.", { type: "error" });
    return;
  }
  downloadCSV(csv, filename);
  notify("Report exported successfully", { type: "success" });
});
```

**Empty State Handling**:
- Zero opportunities: "No opportunities found matching the selected filters"
- Zero activities: "No activities found for this date range"
- No stale leads: "No stale leads found! All opportunities have been contacted..."

### Browser Compatibility

**Required Features**:
- ES2020+ (Set, Map, Array methods)
- CSS Custom Properties
- CSS Grid
- Flexbox
- localStorage

**Tested Browsers** (inferred from Tailwind + React 19):
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

---

## Quick Reference

### File Navigation
```
📁 Main Entry
   └── ReportsPage.tsx (tab container)

📁 Report Tabs
   ├── tabs/OverviewTab.tsx (dashboard)
   ├── tabs/OpportunitiesTab.tsx → OpportunitiesByPrincipalReport.tsx
   ├── tabs/WeeklyActivityTab.tsx → WeeklyActivitySummary.tsx
   └── tabs/CampaignActivityTab.tsx → CampaignActivity/CampaignActivityReport.tsx

📁 Supporting Components
   ├── components/KPICard.tsx (metrics)
   ├── components/ChartWrapper.tsx (chart container)
   ├── charts/PipelineChart.tsx (doughnut chart)
   ├── contexts/GlobalFilterContext.tsx (shared filters)
   └── ReportLayout.tsx (common layout)

📁 Utilities
   ├── hooks/useChartTheme.ts (CSS theme extraction)
   ├── charts/chartSetup.ts (Chart.js registration)
   └── utils/cleanupMigration.ts (localStorage cleanup)
```

### Common Tasks

#### Add a New Report Tab
1. Create component in `tabs/NewReportTab.tsx`
2. Lazy load in `ReportsPage.tsx`: `const NewReportTab = lazy(() => import('./tabs/NewReportTab'));`
3. Add tab trigger: `<TabsTrigger value="new-report">New Report</TabsTrigger>`
4. Add tab content: `<TabsContent value="new-report"><Suspense...><NewReportTab /></Suspense></TabsContent>`

#### Add CSV Export to a Report
1. Import utilities:
   ```typescript
   import { downloadCSV, useNotify } from "ra-core";
   import jsonExport from "jsonexport/dist";
   import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
   ```
2. Create export handler (sanitize all string fields)
3. Pass to ReportLayout: `<ReportLayout onExport={handleExport} />`

#### Add a New KPI Card
```typescript
<KPICard
  title="Your Metric"
  value={calculatedValue}
  change={percentageChange}  // Optional
  trend="up" | "down" | "neutral"  // Optional
  icon={LucideIcon}  // Optional
  subtitle="Additional context"  // Optional
/>
```

#### Add a New Chart
1. Import chart library component
2. Use `ChartWrapper` for consistent layout:
   ```typescript
   <ChartWrapper title="My Chart" isLoading={isPending}>
     <YourChartComponent data={chartData} />
   </ChartWrapper>
   ```
3. Use `useChartTheme()` hook for semantic colors

---

## Maintenance Recommendations

### High Priority
1. ✅ **Complete or remove GlobalFilterBar** (currently unused)
2. ✅ **Remove @nivo/bar dependency** (unused, ~150KB)
3. ✅ **Fix hardcoded magic number** in ActivityTypeCard line 66
4. ✅ **Integrate global filters** across all tabs (or remove context)
5. ✅ **Calculate actual KPI trends** (not hardcoded values)

### Medium Priority
1. 📊 **Add unit tests** for untested components (WeeklyActivitySummary, CampaignActivityReport, etc.)
2. 📈 **Implement placeholder charts** in OverviewTab (Activity Trend, Top Principals, Rep Performance)
3. 🔍 **Verify --brand-600 CSS variable** exists or document fallback

### Low Priority
1. 🧹 **Optimize cleanupMigration** to run only once (check flag before execution)
2. 📚 **Document chart color palette** usage (which color for which metric)
3. ♿ **Audit keyboard navigation** in expandable sections

---

## Related Documentation

- [Engineering Constitution](../../docs/claude/engineering-constitution.md) - Core principles
- [Supabase Workflow](../../docs/supabase/WORKFLOW.md) - Database operations
- [Color Theming Architecture](../../docs/internal-docs/color-theming-architecture.docs.md) - Design system
- [Spacing System Design](../../docs/archive/plans/2025-11-08-spacing-layout-system-design.md) - Layout tokens
- [CSV Security](../utils/csvUploadValidator.ts) - Formula injection prevention

---

**Last Updated**: 2025-11-13
**Reviewed By**: Claude Code (Automated Analysis)
**Status**: ✅ Comprehensive Analysis Complete
