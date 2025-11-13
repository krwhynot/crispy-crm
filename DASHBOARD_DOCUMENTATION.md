# Dashboard Documentation

## Dashboard Overview

The Atomic CRM Dashboard is a **principal-centric performance tracking interface** designed to help sales teams monitor opportunities, tasks, and activities organized by key accounts (principals). The dashboard provides real-time insights into pipeline health, upcoming events, and sales rep activities with automatic 5-minute refresh intervals.

### Current Implementation Status

The codebase contains **3 dashboard implementations**:

1. **`Dashboard.tsx`** - Main production dashboard (Principal-Centric) ✅ **Active**
2. **`CompactGridDashboard.tsx`** - Compact 3-column grid layout ✅ **Active** (default export)
3. **`PrincipalDashboard.tsx`** - Alternative 70/30 grid layout ⚠️ **Alternative**

### Key Features

- **Auto-refresh**: 5-minute interval to keep data current
- **Keyboard shortcuts**: Ctrl+L (quick log activity), Ctrl+R (manual refresh)
- **Principal-centric view**: All data grouped by key accounts (principals)
- **Real-time metrics**: Pipeline health, stuck deals, activity tracking
- **Quick actions**: Inline call/email/task buttons with hover-revealed actions
- **Task completion workflow**: Multi-step modal with activity logging and opportunity updates
- **Responsive design**: iPad-first responsive layout (768px+)

---

## File Structure

### Core Dashboard Files (4 files)

```
src/atomic-crm/dashboard/
├── index.ts                              # Module exports (default: CompactGridDashboard)
├── Dashboard.tsx                         # Main dashboard container (168 lines)
├── CompactGridDashboard.tsx             # Compact grid layout (138 lines)
└── PrincipalDashboard.tsx               # Alternative layout (54 lines)
```

### Widget Components (13 files)

```
src/atomic-crm/dashboard/
├── OpportunitiesByPrincipalDesktopContainer.tsx  # Data container (70 lines)
├── OpportunitiesByPrincipalDesktop.tsx           # Desktop table view (200 lines)
├── OpportunitiesByPrincipal.tsx                  # Legacy widget (133 lines)
├── UpcomingEventsByPrincipal.tsx                 # This week's tasks/activities (262 lines)
├── MyTasksThisWeek.tsx                           # Task list with urgency groups (348 lines)
├── RecentActivityFeed.tsx                        # Last 7 days activities (190 lines)
├── PipelineSummary.tsx                           # Pipeline health metrics (290 lines)
├── DashboardWidget.tsx                           # Reusable widget container (158 lines)
├── CompactDashboardHeader.tsx                    # Header with refresh/quick log (51 lines)
├── CompactPrincipalTable.tsx                     # Condensed principal table (200 lines)
├── CompactTasksWidget.tsx                        # Minimal task list (48 lines)
├── CompactRecentActivity.tsx                     # Compact activity feed (111 lines)
└── DashboardActivityLog.tsx                      # Activity log stub (28 lines) ⚠️ Legacy
```

### Modal Components (6 files)

```
src/atomic-crm/dashboard/
├── QuickActionModals/
│   └── QuickLogActivity.tsx                      # Quick activity logging (198 lines)
├── QuickCompleteTaskModal.tsx                    # Multi-step task completion (166 lines)
├── LogActivityStep.tsx                           # Step 1: Activity form (194 lines)
├── UpdateOpportunityStep.tsx                     # Step 2: Opportunity stage (155 lines)
├── SuccessStep.tsx                               # Step 3: Success confirmation (32 lines)
└── QuickAdd.tsx                                  # Quick add stub (23 lines) ⚠️ Legacy
```

### Card/List Components (10 files)

```
src/atomic-crm/dashboard/
├── PrincipalCard.tsx                             # Principal summary card (131 lines)
├── PrincipalCardSkeleton.tsx                     # Loading skeleton (30 lines)
├── PriorityIndicator.tsx                         # Priority badge (92 lines)
├── TasksList.tsx                                 # Simple task list (72 lines)
├── TasksListEmpty.tsx                            # Empty state (24 lines)
├── TasksListFilter.tsx                           # Task filtering UI (80 lines)
├── MetricsCardGrid.tsx                           # Metric card grid (192 lines) ⚠️ Legacy
├── HotContacts.tsx                               # Frequent contacts (89 lines) ⚠️ Legacy
├── LatestNotes.tsx                               # Recent notes (110 lines) ⚠️ Legacy
└── MiniPipeline.tsx                              # Compact pipeline (55 lines) ⚠️ Legacy
```

### Legacy/Deprecated Widgets (6 files) ⚠️

```
src/atomic-crm/dashboard/
├── MyOpenOpportunities.tsx                       # Opportunity count (61 lines)
├── OverdueTasks.tsx                              # Overdue tasks (68 lines)
├── PipelineByStage.tsx                           # Stage breakdown (184 lines)
├── RecentActivities.tsx                          # Activity feed alt (187 lines)
├── ThisWeeksActivities.tsx                       # Week-scoped activities (69 lines)
└── PrincipalDashboardTable.tsx                   # Table variant (251 lines)
```

### Utilities (1 file)

```
src/atomic-crm/dashboard/utils/
└── activityTypeDetection.ts                      # Auto-detect activity type (47 lines)
```

### Styling (2 files)

```
src/atomic-crm/styles/
└── desktop.css                                   # Desktop utilities (460 lines) ⚠️ Unused

src/
└── index.css                                     # Global styles, Tailwind v4, semantic colors
```

### Database Layer (4 migrations)

```
supabase/migrations/
├── 20251106190107_create_dashboard_principal_summary_view.sql
├── 20251110110402_dashboard_quick_actions_view_update.sql
├── 20251112063019_add_weekly_activity_count_and_assigned_reps_to_dashboard.sql
└── 20251110111229_complete_task_with_followup_rpc.sql
```

### Test Files (26 files)

```
src/atomic-crm/dashboard/__tests__/
├── Component tests (17 files)
└── utils/__tests__/activityTypeDetection.test.ts
```

**Total Files**: 68 files (41 components + 26 tests + 1 CSS file)

---

## Components Used

### Active Production Components

#### 1. **Dashboard Layout Components**

##### `Dashboard.tsx` (Main Container)
- **Purpose**: Main dashboard container with auto-refresh and keyboard shortcuts
- **Key Features**:
  - Auto-refresh every 5 minutes (`AUTO_REFRESH_INTERVAL = 5 * 60 * 1000`)
  - Manual refresh: Ctrl+R
  - Quick log activity: Ctrl+L
  - Context menu support (right-click)
  - ARIA announcements for screen readers
- **Dependencies**:
  - React Admin: `useRefresh`, `useDataProvider`
  - Design system: `useAriaAnnounce` from `@/lib/design-system/accessibility`
  - Context menu: `useContextMenu` from `@/atomic-crm/utils/contextMenu`
  - Keyboard shortcuts: `useKeyboardShortcuts` from `@/atomic-crm/utils/keyboardShortcuts`
- **Child Widgets**: `OpportunitiesByPrincipalDesktopContainer`, `UpcomingEventsByPrincipal`, `MyTasksThisWeek`, `RecentActivityFeed`, `PipelineSummary`, `QuickLogActivity`
- **Location**: `src/atomic-crm/dashboard/Dashboard.tsx:1`
- **TODO Comment**: Line 94 - "Call API to create activity"

##### `CompactGridDashboard.tsx` (Default Export)
- **Purpose**: Compact 3-column grid layout (40% / 30% / 30%) for mobile/tablet optimization
- **Key Features**:
  - Event-driven quick log modal (custom event: `quick-log-activity`)
  - Real-time data from `dashboard_principal_summary` view
  - Compact widget variants (top 4-5 items only)
- **Dependencies**:
  - React Admin: `useGetList`
  - Components: `CompactDashboardHeader`, `CompactPrincipalTable`, `CompactTasksWidget`, `CompactRecentActivity`, `QuickLogActivity`
- **Location**: `src/atomic-crm/dashboard/CompactGridDashboard.tsx:1`
- **TODO Comments**:
  - Lines 66-67: "Calculate weekly activities and assigned reps from data"
  - Line 132: "Implement actual activity creation"

##### `PrincipalDashboard.tsx` (Alternative Layout)
- **Purpose**: Simplified 70/30 grid dashboard without header
- **Location**: `src/atomic-crm/dashboard/PrincipalDashboard.tsx:1`
- **Status**: Alternative implementation, not default

---

#### 2. **Widget Components**

##### `OpportunitiesByPrincipalDesktopContainer.tsx` (Data Container)
- **Purpose**: Data fetching container for principal performance table
- **Data Source**: `dashboard_principal_summary` view (Supabase)
- **Query**:
  ```typescript
  useGetList<DashboardPrincipalSummary>('dashboard_principal_summary', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'priority_score', order: 'DESC' }
  })
  ```
- **Data Transformation**: Maps view columns to `PrincipalData` interface
- **Exports**: `PrincipalData` interface with `principalId`, `principalName`, `opportunityCount`, `weeklyActivities`, `assignedReps`
- **Location**: `src/atomic-crm/dashboard/OpportunitiesByPrincipalDesktopContainer.tsx:1`

##### `OpportunitiesByPrincipalDesktop.tsx` (Presentation)
- **Purpose**: Desktop-optimized principal performance table with inline quick actions
- **Key Features**:
  - Hover-revealed action buttons (call, email, task, export)
  - Principal filtering navigation (click name → filter opportunities)
  - Sortable columns (name, opportunity count, weekly activities)
  - CSV export button (per row)
- **Dependencies**:
  - UI: `DashboardWidget`, `Button`, `DropdownMenu`
  - Icons: `Phone`, `Mail`, `ListTodo`, `Download` (lucide-react)
  - Navigation: `useNavigate` (react-router-dom)
- **Location**: `src/atomic-crm/dashboard/OpportunitiesByPrincipalDesktop.tsx:1`
- **TODO Comment**: Line 40 - "Implement actual export"

##### `MyTasksThisWeek.tsx` (Task Widget)
- **Purpose**: Task list widget with urgency grouping (overdue / today / this week)
- **Key Features**:
  - Inline checkbox completion (optimistic UI update)
  - Urgency-based grouping with date-fns
  - Semantic due date badges (destructive/warning/default)
  - Table-style design with h-8 compact rows
  - Quick complete modal integration
- **Data Source**: `tasks` table filtered by current user and due date
- **Query**:
  ```typescript
  useGetList<Task>('tasks', {
    filter: {
      completed: false,
      'due_date@lte': format(endOfWeekDate, 'yyyy-MM-dd'),
      sales_id: identity?.id
    },
    sort: { field: 'due_date', order: 'ASC' },
    pagination: { page: 1, perPage: 50 }
  })
  ```
- **Components**: `TaskSection`, `TaskRow`, `DueDateBadge` (internal)
- **Utility Function**: `groupTasksByUrgency(tasks: Task[]): GroupedTasks`
- **Location**: `src/atomic-crm/dashboard/MyTasksThisWeek.tsx:1`

##### `RecentActivityFeed.tsx` (Activity Widget)
- **Purpose**: Last 7 days of activities in table format
- **Key Features**:
  - Activity type icons (call/email/meeting/note)
  - Relative timestamps ("2h ago", "3d ago")
  - Click-to-navigate to related records
  - Compact h-8 rows for desktop density
- **Data Source**: `activities` table filtered by creation date
- **Query**:
  ```typescript
  useGetList<ActivityRecord>('activities', {
    filter: {
      'created_at@gte': sevenDaysAgoFilter  // Memoized
    },
    sort: { field: 'created_at', order: 'DESC' },
    pagination: { page: 1, perPage: 7 }
  })
  ```
- **Dependencies**:
  - Utilities: `getActivityIcon`, `formatRelativeTime`
  - Icons: `Activity` (lucide-react)
- **Location**: `src/atomic-crm/dashboard/RecentActivityFeed.tsx:1`

##### `PipelineSummary.tsx` (Pipeline Metrics)
- **Purpose**: Pipeline health metrics widget with stage breakdown
- **Key Features**:
  - Health calculation (🟢 Healthy / 🟡 Fair / 🔴 Needs Attention)
  - Stuck deal tracking (30+ days in stage)
  - At-risk principal detection
  - Total/active opportunity counts
  - Stage-by-stage breakdown
- **Data Source**: `opportunities` table (all active opportunities)
- **Query**:
  ```typescript
  useGetList<Opportunity>('opportunities', {
    filter: {
      account_manager_id: identity?.id,
      status: 'active'
    },
    pagination: { page: 1, perPage: 1000 }  // ⚠️ Large dataset
  })
  ```
- **Exported Functions**:
  - `calculatePipelineMetrics(opportunities: Opportunity[]): PipelineMetrics`
  - `calculatePipelineHealth(stuckDeals: number, urgentPrincipals: number): PipelineHealth`
- **Location**: `src/atomic-crm/dashboard/PipelineSummary.tsx:1`
- **TODO Comment**: Line 73 - "Calculate atRisk based on principal urgency"

##### `UpcomingEventsByPrincipal.tsx` (Events Widget)
- **Purpose**: Shows this week's tasks and activities grouped by principal
- **Key Features**:
  - Status emojis (🔴 urgent / 🟡 warning / 🟢 good)
  - Priority sorting (high → critical → medium → low)
  - Combined tasks + activities view
  - Principal-grouped display
- **Data Sources**:
  - `tasks` table (next 7 days, incomplete)
  - `activities` table (next 7 days)
  - `dashboard_principal_summary` view (for status indicators)
- **Location**: `src/atomic-crm/dashboard/UpcomingEventsByPrincipal.tsx:1`
- **Commented Code**: Lines 186-213 - Task/activity grouping logic (needs proper database joins)

##### `DashboardWidget.tsx` (Reusable Container)
- **Purpose**: Reusable widget container with loading/error states
- **Key Features**:
  - Skeleton loading with animate-pulse
  - Error retry functionality
  - Optional click actions
  - Icon support
  - Responsive padding (p-2 md:p-3 lg:p-4)
- **Props**: `title`, `value`, `isLoading`, `error`, `onRetry`, `onClick`, `icon`, `children`
- **Location**: `src/atomic-crm/dashboard/DashboardWidget.tsx:1`

---

#### 3. **Compact Dashboard Components**

##### `CompactDashboardHeader.tsx`
- **Purpose**: Header with date display, refresh, and quick log buttons
- **Key Features**:
  - Current date display (e.g., "November 12, 2025")
  - Manual refresh button
  - Quick log activity button (dispatches custom event)
- **Event Dispatching**: `window.dispatchEvent(new CustomEvent('quick-log-activity'))`
- **Location**: `src/atomic-crm/dashboard/CompactDashboardHeader.tsx:1`

##### `CompactPrincipalTable.tsx`
- **Purpose**: Condensed principal table with show more/less functionality
- **Key Features**:
  - Expandable rows (show 5 → show all)
  - Hover-revealed actions (call, email, task)
  - Rep avatars with overflow badge ("3 reps" → "+2")
  - Weekly activity count display
- **Location**: `src/atomic-crm/dashboard/CompactPrincipalTable.tsx:1`

##### `CompactTasksWidget.tsx`
- **Purpose**: Minimal task list showing top 4 tasks
- **Key Features**:
  - Inline checkbox completion
  - Priority indicator (red dot for high priority)
  - Truncated titles with ellipsis
  - "View all tasks" link
- **Location**: `src/atomic-crm/dashboard/CompactTasksWidget.tsx:1`

##### `CompactRecentActivity.tsx`
- **Purpose**: Compact activity feed (last 4 activities)
- **Key Features**:
  - Activity type icons
  - Relative timestamps
  - Click navigation to related records
  - "View all activities" link
- **Location**: `src/atomic-crm/dashboard/CompactRecentActivity.tsx:1`

---

#### 4. **Modal Components**

##### `QuickLogActivity.tsx` (Quick Action Modal)
- **Purpose**: Lightweight activity logging modal
- **Key Features**:
  - Activity type selector (call/email/meeting/check-in/note)
  - Notes textarea with auto-resize
  - Keyboard shortcuts: Ctrl+Enter (save), Escape (close)
  - Date picker (defaults to today)
- **Exports**: `ActivityType`, `QuickLogActivityData`, `QuickLogActivityProps`
- **Location**: `src/atomic-crm/dashboard/QuickActionModals/QuickLogActivity.tsx:1`

##### `QuickCompleteTaskModal.tsx` (Multi-Step Flow)
- **Purpose**: Multi-step task completion flow
- **Flow Steps**:
  1. **LogActivityStep** - Log activity related to task
  2. **UpdateOpportunityStep** - Update opportunity stage (optional)
  3. **SuccessStep** - Success confirmation with auto-close
- **Key Features**:
  - Progressive disclosure pattern
  - Atomic RPC function: `complete_task_with_followup`
  - Transaction safety (rollback on error)
- **State Management**: `FlowStep` enum (`LOG_ACTIVITY`, `UPDATE_OPPORTUNITY`, `SUCCESS`)
- **Location**: `src/atomic-crm/dashboard/QuickCompleteTaskModal.tsx:1`

##### `LogActivityStep.tsx` (Step 1)
- **Purpose**: Activity logging form (step 1 of task completion)
- **Key Features**:
  - Activity type auto-detection from task title
  - Subject/description fields
  - Date picker (defaults to today)
  - Form validation
- **Dependencies**: `activityTypeDetection.ts` utility
- **Location**: `src/atomic-crm/dashboard/LogActivityStep.tsx:1`

##### `UpdateOpportunityStep.tsx` (Step 2)
- **Purpose**: Opportunity stage update form (step 2)
- **Key Features**:
  - Stage dropdown (from ConfigurationContext)
  - Skip option (no stage update needed)
  - Optional step
- **Dependencies**: `useConfigurationContext` for opportunity stages
- **Location**: `src/atomic-crm/dashboard/UpdateOpportunityStep.tsx:1`

##### `SuccessStep.tsx` (Step 3)
- **Purpose**: Success confirmation screen (step 3)
- **Key Features**:
  - Checkmark animation
  - Auto-close after 1 second
  - Minimal UI (just confirmation)
- **Location**: `src/atomic-crm/dashboard/SuccessStep.tsx:1`

---

#### 5. **Card/List Components**

##### `PrincipalCard.tsx`
- **Purpose**: Individual principal card with task summary and top opportunity
- **Key Features**:
  - Overdue task highlighting (red text)
  - Action buttons (View Tasks / View Opportunities)
  - Priority indicator integration
  - Top opportunity display
- **Props**: `principal`, `tasks`, `topOpportunity`
- **Location**: `src/atomic-crm/dashboard/PrincipalCard.tsx:1`

##### `PrincipalCardSkeleton.tsx`
- **Purpose**: Loading skeleton for PrincipalCard
- **Key Features**:
  - Animate-pulse animation
  - Gray bars matching card structure
  - Maintains layout while loading
- **Location**: `src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx:1`

##### `PriorityIndicator.tsx`
- **Purpose**: Visual priority badge with color coding
- **Exports**: `Priority` type (`'high' | 'medium' | 'low'`)
- **Key Features**:
  - Semantic color variants:
    - High: `text-destructive` (red)
    - Medium: `text-warning` (yellow) ⚠️ Hardcoded: `bg-yellow-50 border-yellow-300`
    - Low: `text-muted-foreground` (gray) ⚠️ Hardcoded: `bg-green-50 border-green-300`
  - Size variants (sm, md, lg)
  - Responsive design
- **Location**: `src/atomic-crm/dashboard/PriorityIndicator.tsx:1`

##### `TasksList.tsx`
- **Purpose**: Simple task list component
- **Key Features**:
  - Basic task rendering with due dates
  - Uses semantic colors: `var(--text-subtle)`, `var(--text-title)` ✅
- **Location**: `src/atomic-crm/dashboard/TasksList.tsx:1`

##### `TasksListEmpty.tsx`
- **Purpose**: Empty state for task list
- **Key Features**:
  - Friendly message: "No tasks scheduled. Enjoy your free time!"
  - Encourages task creation
- **Location**: `src/atomic-crm/dashboard/TasksListEmpty.tsx:1`

##### `TasksListFilter.tsx`
- **Purpose**: Task filtering UI component
- **Key Features**:
  - Status filter (completed/incomplete)
  - Priority filter (low/medium/high/critical)
  - Date range filter
- **Location**: `src/atomic-crm/dashboard/TasksListFilter.tsx:1`

---

### Legacy/Deprecated Components ⚠️

The following components appear to be **unused or deprecated**. Consider removing to reduce bundle size:

1. **`DashboardActivityLog.tsx`** (28 lines) - Minimal stub implementation
2. **`QuickAdd.tsx`** (23 lines) - Minimal stub implementation
3. **`MetricsCardGrid.tsx`** (192 lines) - Grid layout for metric cards (not referenced)
4. **`HotContacts.tsx`** (89 lines) - Frequent contacts widget (not in active dashboards)
5. **`LatestNotes.tsx`** (110 lines) - Recent notes widget (not in active dashboards)
6. **`MiniPipeline.tsx`** (55 lines) - Compact pipeline widget (superseded by PipelineSummary)
7. **`MyOpenOpportunities.tsx`** (61 lines) - Opportunity count widget (not in active dashboards)
8. **`OverdueTasks.tsx`** (68 lines) - Overdue tasks widget (functionality in MyTasksThisWeek)
9. **`PipelineByStage.tsx`** (184 lines) - Stage breakdown (superseded by PipelineSummary)
10. **`RecentActivities.tsx`** (187 lines) - Alternative to RecentActivityFeed
11. **`ThisWeeksActivities.tsx`** (69 lines) - Week-scoped activities (functionality in UpcomingEventsByPrincipal)
12. **`PrincipalDashboardTable.tsx`** (251 lines) - Table variant (superseded by CompactPrincipalTable)

---

## Styling & CSS

### Styling Approach

**Primary**: Tailwind CSS v4 utility-first classes
**Secondary**: CSS custom properties for semantic colors and spacing

### CSS Files

#### 1. **`src/index.css`** (Main Stylesheet)

**Location**: `/home/krwhynot/projects/crispy-crm/src/index.css`

**Sections**:
- **Lines 1-70**: Tailwind v4 directives (`@import`, `@theme`)
- **Lines 76-123**: Semantic spacing tokens (spacing system)
- **Lines 166-443**: Light mode color tokens
- **Lines 445-664**: Dark mode color tokens
- **Lines 665+**: Base styles, component overrides

**Spacing Tokens Defined**:
```css
--spacing-widget-padding: 12px;
--spacing-dashboard-gap: 16px;
--spacing-dashboard-row-height: 36px;
--row-height-compact: 32px;
--spacing-grid-columns-desktop: 12;
--spacing-grid-columns-ipad: 8;
--spacing-gutter-desktop: 24px;
--spacing-gutter-ipad: 16px;
--spacing-edge-desktop: 40px;
--spacing-edge-ipad: 24px;
--spacing-edge-mobile: 16px;
--spacing-section: 32px;
--spacing-widget: 24px;
--spacing-content: 16px;
--spacing-compact: 12px;
--spacing-widget-min-height: 280px;
```

**Color Tokens Defined** (200+ semantic variables):
```css
--primary, --secondary, --accent, --destructive, --warning, --success
--text-title, --text-body, --text-subtle, --text-muted
--bg-primary, --bg-secondary, --bg-muted
--border, --border-subtle, --border-strong
--elevation-1, --elevation-2, --elevation-3
/* ...and many more */
```

**Status**: ✅ Actively used

---

#### 2. **`src/atomic-crm/styles/desktop.css`** (Desktop Utilities)

**Location**: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/styles/desktop.css` (460 lines)

**Utility Classes Defined**:
- `.desktop-table` - Data table styles with 44px touch targets
- `.desktop-button` - Standard button styles
- `.desktop-card` - Card container with shadows
- `.inline-actions` - Hover-revealed action buttons
- `.desktop-form` - Form layouts
- `.desktop-sidebar` - Sidebar navigation

**Features**:
- Semantic spacing tokens
- WCAG AA accessibility compliance
- High contrast mode support
- Reduced motion support
- 1440px+ display optimization

**Status**: ⚠️ **UNUSED** - Defined but not applied in dashboard components

**Recommendation**: Either adopt these utilities or remove the file to reduce bundle size.

---

### Color System Compliance Analysis

#### ✅ **Semantic Color Rule**

From `CLAUDE.md`:
> **SEMANTIC COLORS ONLY**: CSS vars (--primary, --brand-700), never hex

#### ❌ **Violations Found** (80+ instances)

##### **Hardcoded Gray Colors** (50+ instances)
```tsx
// Common violations across dashboard components:
bg-gray-50          // Should use: bg-muted or bg-secondary
text-gray-900       // Should use: text-[color:var(--text-title)]
text-gray-600       // Should use: text-[color:var(--text-body)]
text-gray-500       // Should use: text-[color:var(--text-subtle)]
text-gray-400       // Should use: text-[color:var(--text-muted)]
hover:bg-gray-50    // Should use: hover:bg-muted
border-gray-300     // Should use: border-border
bg-gray-200         // Should use: bg-muted/50
```

**Files with violations**:
- `CompactGridDashboard.tsx` (3 instances)
- `CompactDashboardHeader.tsx` (4 instances)
- `CompactPrincipalTable.tsx` (12 instances)
- `CompactRecentActivity.tsx` (8 instances)
- `CompactTasksWidget.tsx` (5 instances)
- `PrincipalCardSkeleton.tsx` (7 instances)
- `PrincipalCard.tsx` (3 instances)

##### **Hardcoded Blue Colors** (10+ instances)
```tsx
bg-blue-100 text-blue-800   // Should use: bg-info/10 text-info-default
text-blue-600               // Should use: text-primary
bg-blue-50                  // Should use: bg-info/5
```

##### **Hardcoded Status Colors** (20+ instances)
```tsx
text-red-600      // Should use: text-destructive or text-error-default
text-green-600    // Should use: text-success-default
text-yellow-600   // Should use: text-warning-default
text-yellow-500   // Should use: text-warning-default
bg-yellow-50      // Should use: bg-warning/10
bg-green-50       // Should use: bg-success/10
border-yellow-300 // Should use: border-warning
border-green-300  // Should use: border-success
```

**Files with violations**:
- `PriorityIndicator.tsx` (4 instances)
- `PrincipalDashboardTable.tsx` (3 instances)
- `CompactPrincipalTable.tsx` (2 instances)
- `CompactTasksWidget.tsx` (1 instance)
- `MetricsCardGrid.tsx` (2 instances)
- `OpportunitiesByPrincipalDesktop.tsx` (1 instance)

#### ✅ **Compliant Components** (3 of 37)

1. **`TasksList.tsx`** - Uses `var(--text-subtle)`, `var(--text-title)` ✅
2. **`PipelineByStage.tsx`** - Uses `hsl(var(--border))`, `hsl(var(--muted-foreground))` ✅
3. **`PrincipalDashboardTable.tsx`** - Partial compliance with `var(--secondary)`, `var(--accent)` ⚠️

**Overall Compliance**: ~8% (3 of 37 components fully compliant)

---

### Inconsistent Styling Patterns

#### 1. **Mixed CSS Variable Approaches**
```tsx
// ❌ Verbose but correct (rarely used):
text-[color:var(--text-title)]

// ❌ Hardcoded Tailwind (most common - violates rule):
text-gray-900

// ✅ Recommended approach:
Use Tailwind semantic aliases: text-foreground, text-muted-foreground
```

#### 2. **Spacing: Hardcoded vs. Semantic**
```tsx
// ❌ Current approach (hardcoded):
p-2 md:p-3 lg:p-4
gap-4
h-7 h-9
py-1 px-2

// ✅ Available semantic tokens (not used):
var(--spacing-widget-padding)
var(--spacing-dashboard-gap)
var(--spacing-dashboard-row-height)
```

#### 3. **Border Usage**
```tsx
// ❌ Current approach (mixed):
border                  // Generic Tailwind
border-b                // Bottom only
border-gray-300         // Hardcoded color (violation)

// ✅ Should use:
border-border          // Semantic token
```

#### 4. **Elevation System (Defined but Unused)**
```css
/* Available in index.css but not applied */
--elevation-1, --elevation-2, --elevation-3
--shadow-card-1, --shadow-card-2, --shadow-card-3
--stroke-card, --stroke-card-hover
```

**Current approach**: Flat design with `rounded-lg` but no shadows
**Opportunity**: Apply elevation for material design depth

---

### Color System Compliance Status Table

| Component | Semantic Colors | Hardcoded Colors | Status |
|-----------|----------------|------------------|--------|
| CompactGridDashboard | 0 | 2 (bg-gray-50) | ❌ |
| CompactDashboardHeader | 0 | 4 (gray shades) | ❌ |
| CompactPrincipalTable | 0 | 12 (gray, blue, red) | ❌ |
| CompactRecentActivity | 0 | 8 (gray, blue) | ❌ |
| CompactTasksWidget | 0 | 5 (gray, blue, red) | ❌ |
| PriorityIndicator | 1 (destructive) | 4 (yellow, green) | ⚠️ |
| PrincipalDashboardTable | 2 (secondary, accent) | 3 (green, yellow, red) | ⚠️ |
| TasksList | 2 (text-subtle, text-title) | 0 | ✅ |
| PipelineByStage | 5 (border, muted, accent) | 0 | ✅ |

---

### Unused CSS Rules

#### **Desktop.css Utilities** (All Unused)
All classes in `desktop.css` are defined but **not referenced** in dashboard components:
- `.desktop-table` → Components use custom table markup
- `.desktop-button` → Components use `Button` from shadcn/ui
- `.desktop-card` → Components use custom `bg-white rounded-lg p-3`
- `.inline-actions` → Components use custom hover patterns

**Impact**: 460 lines of unused CSS in production bundle

---

## Data & Queries

### Data Architecture

The dashboard uses a **hybrid data fetching architecture**:

1. **Database Views** - Pre-aggregated metrics (performance optimization)
2. **Direct Table Queries** - Real-time data via React Admin hooks
3. **RPC Functions** - Atomic transactions for complex operations
4. **Filter Registry** - Query parameter validation

---

### 1. Database Views

#### **`dashboard_principal_summary`** (Primary View)

**Location**: `supabase/migrations/20251110110402_dashboard_quick_actions_view_update.sql`

**Purpose**: Pre-aggregated principal metrics for optimal performance

**Columns**:
```sql
id                      BIGINT          -- Principal organization ID
principal_name          TEXT            -- Organization name
account_manager_id      BIGINT          -- Assigned sales rep
opportunity_count       BIGINT          -- Total opportunities
last_activity_date      DATE            -- Most recent activity
last_activity_type      TEXT            -- Activity type (call/email/meeting)
days_since_last_activity INT            -- Days since last interaction
status_indicator        TEXT            -- 'good' | 'warning' | 'urgent'
max_days_in_stage       INT             -- Longest opportunity in stage
is_stuck                BOOLEAN         -- TRUE if 30+ days in stage
next_action             TEXT            -- Next task title
next_action_task        JSONB           -- Full task object
priority_score          INT             -- Urgency ranking (higher = more urgent)
weekly_activity_count   INT             -- Activities in past 7 days
assigned_reps           TEXT[]          -- Array of sales rep names
```

**Business Logic**:
```sql
-- Status indicator calculation
CASE
  WHEN days_since_last_activity IS NULL THEN 'urgent'
  WHEN days_since_last_activity <= 7 THEN 'good'
  WHEN days_since_last_activity <= 14 THEN 'warning'
  ELSE 'urgent'
END

-- Stuck indicator (30+ days in same stage)
CASE
  WHEN max_days_in_stage >= 30 THEN TRUE
  ELSE FALSE
END

-- Priority score (higher = more urgent)
CASE
  WHEN days_since_last_activity IS NULL THEN 300
  WHEN days_since_last_activity > 14 THEN 200 + days_since_last_activity
  WHEN days_since_last_activity > 7 THEN 100 + days_since_last_activity
  ELSE days_since_last_activity
END
```

**Performance Optimizations**:
- Indexes on `activities(opportunity_id, activity_date DESC)`
- Indexes on `tasks(opportunity_id, completed, due_date, priority)`
- `security_invoker = on` for Row Level Security (RLS)
- Materialized aggregations avoid N+1 queries

**Used By**:
- `OpportunitiesByPrincipalDesktopContainer`
- `PrincipalDashboardTable`
- `CompactPrincipalTable`
- `UpcomingEventsByPrincipal`

---

### 2. React Admin Data Hooks

#### **`useGetList`** - List Queries

**Principal Table Query**:
```typescript
// OpportunitiesByPrincipalDesktopContainer.tsx:27
useGetList<DashboardPrincipalSummary>('dashboard_principal_summary', {
  pagination: { page: 1, perPage: 100 },
  sort: { field: 'priority_score', order: 'DESC' }
})
```

**Tasks Widget Query**:
```typescript
// MyTasksThisWeek.tsx:48
useGetList<Task>('tasks', {
  filter: {
    completed: false,
    'due_date@lte': format(endOfWeekDate, 'yyyy-MM-dd'),
    sales_id: identity?.id
  },
  sort: { field: 'due_date', order: 'ASC' },
  pagination: { page: 1, perPage: 50 }
}, {
  enabled: !!identity?.id  // Conditional query execution
})
```

**Recent Activity Query**:
```typescript
// RecentActivityFeed.tsx:41
useGetList<ActivityRecord>('activities', {
  filter: {
    'created_at@gte': sevenDaysAgoFilter  // Memoized filter
  },
  sort: { field: 'created_at', order: 'DESC' },
  pagination: { page: 1, perPage: 7 }
})
```

**Pipeline Summary Query**:
```typescript
// PipelineSummary.tsx:126
useGetList<Opportunity>('opportunities', {
  filter: {
    account_manager_id: identity?.id,
    status: 'active'
  },
  pagination: { page: 1, perPage: 1000 }  // ⚠️ Large dataset
}, {
  enabled: !!identity?.id
})
```

**Upcoming Events Queries** (3 queries in parallel):
```typescript
// UpcomingEventsByPrincipal.tsx:68-105

// 1. Tasks (next 7 days)
useGetList<Task>('tasks', {
  filter: {
    completed: false,
    'due_date@gte': format(startOfDay(today), 'yyyy-MM-dd'),
    'due_date@lte': format(endOfDay(sevenDaysFromNow), 'yyyy-MM-dd')
  },
  sort: { field: 'due_date', order: 'ASC' }
})

// 2. Activities (next 7 days)
useGetList<Activity>('activities', {
  filter: {
    created_by: identity?.id,
    'activity_date@gte': format(startOfDay(today), 'yyyy-MM-dd'),
    'activity_date@lte': format(endOfDay(sevenDaysFromNow), 'yyyy-MM-dd')
  },
  sort: { field: 'activity_date', order: 'ASC' }
})

// 3. Principal summary (for status indicators)
useGetList('dashboard_principal_summary', {
  filter: { account_manager_id: identity?.id }
})
```

**Filter Operators**:
- `@lte` - Less than or equal (date filters)
- `@gte` - Greater than or equal (date filters)
- Direct equality (e.g., `completed: false`, `status: 'active'`)

---

#### **`useGetIdentity`** - Current User

**Usage**: All widgets filter by current user
```typescript
const { identity } = useGetIdentity();
const salesId = identity?.id;
```

---

### 3. RPC Functions (Database Procedures)

#### **`complete_task_with_followup`**

**Location**: `supabase/migrations/20251110111229_complete_task_with_followup_rpc.sql`

**Purpose**: Atomic transaction for completing tasks with activity logging and optional opportunity updates

**Signature**:
```sql
complete_task_with_followup(
  p_task_id BIGINT,
  p_activity_data JSONB,
  p_opportunity_stage TEXT DEFAULT NULL
) RETURNS JSONB
```

**Called From**:
```typescript
// QuickCompleteTaskModal.tsx:88
await dataProvider.rpc('complete_task_with_followup', {
  p_task_id: task.id,
  p_activity_data: {
    type: activity.type,
    description: activity.description,
    subject: activity.subject,
    activity_date: activity.activity_date
  },
  p_opportunity_stage: opportunityStage
})
```

**Transaction Steps**:
1. Validate task exists and not already completed
2. Mark task complete (`tasks.completed = true`, set `completed_at`)
3. Create activity record linked to task (`activities.related_task_id`)
4. Optionally update opportunity stage
5. Return JSONB with `{ task_id, activity_id, opportunity_id, success }`

**Error Handling**:
- Validates required inputs (task_id, activity description)
- Checks task existence and completion status
- Handles tasks with/without opportunities (creates interaction vs engagement)
- Rollback on any error (transaction safety)

**Return Example**:
```json
{
  "task_id": 123,
  "activity_id": 456,
  "opportunity_id": 789,
  "success": true
}
```

---

### 4. Filter Registry

**Location**: `src/atomic-crm/providers/supabase/filterRegistry.ts`

**Purpose**: Whitelist valid filter fields per resource to prevent 400 errors from stale/invalid filters

**Dashboard Principal Summary Registration**:
```typescript
dashboard_principal_summary: [
  'id',
  'principal_name',
  'account_manager_id',
  'opportunity_count',
  'last_activity_date',
  'last_activity_type',
  'days_since_last_activity',
  'status_indicator',
  'max_days_in_stage',
  'is_stuck',
  'next_action',
  'priority_score'
]
```

**Validation**: Invalid filter fields are silently removed before query execution

---

### 5. Client-Side Data Transformations

#### **Pipeline Metrics Calculation**
```typescript
// PipelineSummary.tsx:16
function calculatePipelineMetrics(opportunities: Opportunity[]): PipelineMetrics {
  // Groups opportunities by stage
  // Counts stuck deals (30+ days in stage)
  // Calculates active count
  // Returns { total, byStage, active, stuck, atRisk }
}
```

#### **Pipeline Health Calculation**
```typescript
// PipelineSummary.tsx:92
function calculatePipelineHealth(stuckDeals: number, urgentPrincipals: number): PipelineHealth {
  // Health Levels:
  // 🔴 Needs Attention: >3 stuck deals OR >1 urgent principals
  // 🟡 Fair: 1-3 stuck deals OR 1 urgent principal
  // 🟢 Healthy: No stuck deals, no urgent principals
}
```

#### **Task Urgency Grouping**
```typescript
// MyTasksThisWeek.tsx:192
function groupTasksByUrgency(tasks: Task[]): GroupedTasks {
  // Groups tasks into:
  // - overdue: due_date < today
  // - today: due_date = today
  // - thisWeek: due_date > today && <= end of week
}
```

---

### 6. Auto-Refresh Mechanisms

**Auto-Refresh** (Dashboard.tsx):
```typescript
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
  const intervalId = setInterval(() => {
    refresh();  // React Admin's refresh function
  }, AUTO_REFRESH_INTERVAL);

  return () => clearInterval(intervalId);
}, [refresh]);
```

**Manual Refresh**:
```typescript
const handleRefresh = async () => {
  setIsRefreshing(true);
  refresh();
  announce('Dashboard data refreshed');  // ARIA announcement
  setTimeout(() => setIsRefreshing(false), 500);
};
```

---

### 7. Query Optimization Patterns

#### **Conditional Query Execution**
```typescript
// Don't query until identity is available
{ enabled: !!identity?.id }
```

#### **Memoized Filters**
```typescript
// Prevents re-fetching on every render
const sevenDaysAgoFilter = useMemo(
  () => subDays(startOfDay(new Date()), 7).toISOString(),
  []
);
```

#### **Pagination Limits**
- Principal table: 25 rows (display)
- Principal summary: 100 rows (full dataset)
- Tasks: 20-50 rows (widget-dependent)
- Activities: 4-7 rows (recent only)
- Opportunities: **1000 rows** ⚠️ (all active for metrics - potential performance issue)

---

### Data Flow Summary

| Widget | Resource | Query Type | Limit | Client Transform | Auto-Refresh |
|--------|----------|------------|-------|------------------|--------------|
| Principal Table | `dashboard_principal_summary` | useGetList | 100 | None | ✅ 5 min |
| Tasks Widget | `tasks` | useGetList | 50 | `groupTasksByUrgency()` | ✅ 5 min |
| Activity Feed | `activities` | useGetList | 7 | None | ✅ 5 min |
| Pipeline Summary | `opportunities` | useGetList | 1000 ⚠️ | `calculatePipelineMetrics()`, `calculatePipelineHealth()` | ✅ 5 min |
| Upcoming Events | `tasks`, `activities`, `dashboard_principal_summary` | useGetList (3x) | 50, 50, 100 | `groupEventsByPrincipal()` | ✅ 5 min |
| Task Completion | `tasks`, `activities`, `opportunities` | RPC | N/A | None | ❌ On-demand |

---

## Dependencies

### UI Libraries

#### **shadcn/ui Components**
Used extensively across dashboard components:

```typescript
// Card components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Form components
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Dialog/Modal components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Dropdown menus
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Badges
import { Badge } from "@/components/ui/badge"

// Skeleton loading
import { Skeleton } from "@/components/ui/skeleton"
```

---

### React Admin (Data Layer)

```typescript
// Data fetching hooks
import { useGetList, useGetOne, useGetIdentity } from 'react-admin'
import { useDataProvider, useRefresh, useNotify } from 'react-admin'

// Type definitions
import { Identifier } from 'react-admin'
```

**Version**: Compatible with React Admin v4+

---

### Icon Library

#### **lucide-react**
```typescript
// Common icons used across dashboard
import {
  Phone,           // Call action
  Mail,            // Email action
  ListTodo,        // Task action
  Download,        // Export action
  Activity,        // Activity icon
  Calendar,        // Date/event icon
  CheckCircle,     // Success icon
  AlertCircle,     // Error/warning icon
  TrendingUp,      // Metrics icon
  RefreshCw,       // Refresh icon
  Plus,            // Add action
  ChevronDown,     // Dropdown icon
  ChevronUp,       // Collapse icon
  Star,            // Priority/favorite
  FileText,        // Note icon
  Users            // Contact/rep icon
} from 'lucide-react'
```

---

### Date/Time Libraries

#### **date-fns**
```typescript
import {
  format,              // Date formatting
  startOfDay,          // Date normalization
  endOfDay,            // Date normalization
  startOfWeek,         // Week calculations
  endOfWeek,           // Week calculations
  addDays,             // Date arithmetic
  subDays,             // Date arithmetic
  isAfter,             // Date comparison
  isBefore,            // Date comparison
  parseISO             // ISO string parsing
} from 'date-fns'
```

---

### Routing

#### **react-router-dom**
```typescript
import { useNavigate } from 'react-router-dom'
```

---

### Styling

#### **Tailwind CSS v4**
- **Utility-first CSS framework**
- **Version**: v4 (using `@import` syntax)
- **Config**: `tailwind.config.js`

#### **Class Utilities**
```typescript
import { cn } from '@/lib/utils'  // clsx + tailwind-merge
```

---

### Custom Utilities (Internal Dependencies)

#### **Formatting & Icons**
```typescript
import { getActivityIcon } from '@/atomic-crm/utils/getActivityIcon'
import { formatRelativeTime } from '@/atomic-crm/utils/formatRelativeTime'
import { formatName, formatFullName } from '@/atomic-crm/utils/formatName'
```

#### **Activity Type Detection**
```typescript
import { inferActivityTypeFromTaskTitle } from '@/atomic-crm/dashboard/utils/activityTypeDetection'
```

#### **Keyboard Shortcuts**
```typescript
import { useKeyboardShortcuts, globalShortcuts } from '@/atomic-crm/utils/keyboardShortcuts'
```

#### **Context Menu**
```typescript
import { useContextMenu, ContextMenu } from '@/atomic-crm/utils/contextMenu'
```

#### **Accessibility**
```typescript
import { useAriaAnnounce, focusRing, srOnly } from '@/lib/design-system/accessibility'
```

#### **Configuration**
```typescript
import { useConfigurationContext } from '@/atomic-crm/root/ConfigurationContext'
```

---

### Type Definitions

```typescript
// Core types
import type {
  Contact,
  Organization,
  Sale,
  ActivityRecord,
  Task,
  Opportunity,
  OpportunityStage,
  InteractionType
} from '@/atomic-crm/types'

// React Admin types
import type { Identifier } from 'react-admin'
```

---

### Third-Party Dependencies (from package.json)

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-admin": "^4.16.0",
  "react-router-dom": "^6.20.0",
  "date-fns": "^3.0.0",
  "lucide-react": "^0.400.0",
  "tailwindcss": "^4.0.0-alpha.30",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

---

## Unused/Outdated Code

### 1. Commented-Out Code Blocks

#### **UpcomingEventsByPrincipal.tsx:186-213**
```typescript
// COMMENTED OUT: Task/activity grouping logic
// Issue: Needs proper database joins instead of client-side matching
// Lines 186-213 contain logic for grouping tasks/activities by principal

/*
// Group tasks by principal
const tasksByPrincipal = tasksData?.reduce((acc, task) => {
  const principalId = task.opportunity?.principal_organization_id;
  if (!principalId) return acc;

  if (!acc[principalId]) {
    acc[principalId] = { tasks: [], activities: [] };
  }
  acc[principalId].tasks.push(task);
  return acc;
}, {});
*/
```

**Recommendation**: Create database view for upcoming events to avoid client-side joins

---

### 2. TODO Comments (Incomplete Implementations)

#### **Dashboard.tsx:94**
```typescript
// TODO: Call API to create activity
const handleQuickLogActivity = async (activityData: QuickLogActivityData) => {
  // Implementation pending
}
```

#### **CompactGridDashboard.tsx:66-67**
```typescript
// TODO: Calculate weekly activities and assigned reps from data
// Currently showing placeholder data
```

#### **CompactGridDashboard.tsx:132**
```typescript
// TODO: Implement actual activity creation
const handleQuickLog = () => {
  console.log('Quick log activity');
}
```

#### **OpportunitiesByPrincipalDesktop.tsx:40**
```typescript
// TODO: Implement actual export
const handleExport = (principalId: number) => {
  console.log('Export principal:', principalId);
}
```

#### **PipelineSummary.tsx:73**
```typescript
// TODO: Calculate atRisk based on principal urgency
const atRisk = 0;  // Placeholder
```

---

### 3. Unused Component Files

The following components are **not imported or referenced** in active dashboard implementations:

1. **`DashboardActivityLog.tsx`** - Minimal stub (28 lines)
2. **`QuickAdd.tsx`** - Minimal stub (23 lines)
3. **`MetricsCardGrid.tsx`** - Grid layout (192 lines)
4. **`HotContacts.tsx`** - Frequent contacts widget (89 lines)
5. **`LatestNotes.tsx`** - Recent notes widget (110 lines)
6. **`MiniPipeline.tsx`** - Compact pipeline (55 lines)
7. **`MyOpenOpportunities.tsx`** - Opportunity count (61 lines)
8. **`OverdueTasks.tsx`** - Overdue tasks (68 lines)
9. **`PipelineByStage.tsx`** - Stage breakdown (184 lines)
10. **`RecentActivities.tsx`** - Activity feed alternative (187 lines)
11. **`ThisWeeksActivities.tsx`** - Week-scoped activities (69 lines)
12. **`PrincipalDashboardTable.tsx`** - Table variant (251 lines)

**Impact**: ~1,300 lines of dead code
**Recommendation**: Move to `archive/` or delete to reduce bundle size

---

### 4. Unused CSS File

#### **`src/atomic-crm/styles/desktop.css`** (460 lines)

**Classes defined but not used**:
- `.desktop-table`
- `.desktop-button`
- `.desktop-card`
- `.inline-actions`
- `.desktop-form`
- `.desktop-sidebar`

**Recommendation**: Either adopt these utilities in dashboard components or remove the file

---

### 5. Outdated Code Patterns

#### **Hard-coded Color Values** (Violates Engineering Constitution)

**From CLAUDE.md**:
> **SEMANTIC COLORS ONLY**: CSS vars (--primary, --brand-700), never hex

**80+ violations found** across dashboard components (see "Styling & CSS" section for full list)

**Examples**:
```tsx
// ❌ Outdated pattern:
text-gray-900
bg-blue-100 text-blue-800
text-red-600

// ✅ Should use:
text-[color:var(--text-title)]
bg-info/10 text-info-default
text-destructive
```

**Impact**: Design system inconsistency, dark mode issues, maintenance burden

---

### 6. Potentially Redundant Implementations

#### **Multiple Activity Feed Widgets**
- **`RecentActivityFeed.tsx`** (190 lines) - Active ✅
- **`RecentActivities.tsx`** (187 lines) - Legacy ⚠️
- **`CompactRecentActivity.tsx`** (111 lines) - Active ✅

**Recommendation**: Consolidate to single activity feed component with variant props

#### **Multiple Task Widgets**
- **`MyTasksThisWeek.tsx`** (348 lines) - Active ✅
- **`CompactTasksWidget.tsx`** (48 lines) - Active ✅
- **`OverdueTasks.tsx`** (68 lines) - Legacy ⚠️
- **`ThisWeeksActivities.tsx`** (69 lines) - Legacy ⚠️

**Recommendation**: Consolidate to single task widget with variant props

---

### Code Quality Summary

| Issue Type | Count | Impact | Priority |
|------------|-------|--------|----------|
| Commented-out code blocks | 1 | Medium | Low |
| TODO comments | 5 | High | High |
| Unused component files | 12 | High | Medium |
| Unused CSS file | 1 (460 lines) | Medium | Medium |
| Hard-coded color violations | 80+ | High | High |
| Redundant implementations | 4 sets | Medium | Low |

**Total Dead Code**: ~1,800 lines (components + CSS)

---

## Technical Notes

### 1. Architecture Patterns

#### **Container/Presentational Pattern**
```typescript
// Container: Data fetching
OpportunitiesByPrincipalDesktopContainer.tsx
  ↓ Fetches data, transforms
  ↓ Passes to presentation
OpportunitiesByPrincipalDesktop.tsx
  ↓ Pure UI rendering
```

**Benefits**: Separation of concerns, easier testing, reusable presentation components

---

#### **Progressive Disclosure (Multi-Step Modals)**
```typescript
// QuickCompleteTaskModal.tsx
enum FlowStep {
  LOG_ACTIVITY,       // Step 1: Log activity
  UPDATE_OPPORTUNITY, // Step 2: Update stage (optional)
  SUCCESS             // Step 3: Confirmation
}
```

**Benefits**: Reduces cognitive load, guides user through complex workflows

---

#### **Event-Driven Communication**
```typescript
// CompactDashboardHeader.tsx
const handleQuickLog = () => {
  window.dispatchEvent(new CustomEvent('quick-log-activity'));
};

// CompactGridDashboard.tsx
useEffect(() => {
  const handler = () => setShowQuickLog(true);
  window.addEventListener('quick-log-activity', handler);
  return () => window.removeEventListener('quick-log-activity', handler);
}, []);
```

**Benefits**: Decouples components, avoids prop drilling, supports global actions

---

#### **Atomic Database Operations**
```sql
-- complete_task_with_followup RPC function
BEGIN;
  UPDATE tasks SET completed = true;
  INSERT INTO activities (...);
  UPDATE opportunities SET stage = new_stage;
COMMIT;
```

**Benefits**: Data consistency, all-or-nothing updates, prevents partial state

---

### 2. Performance Considerations

#### **Optimization Strategies**

✅ **Good**:
- Pre-aggregated `dashboard_principal_summary` view
- Conditional query execution (`enabled: !!identity?.id`)
- Memoized date filters
- Database indexes on `activities`, `tasks`, `opportunities`

⚠️ **Potential Issues**:
- **PipelineSummary**: Fetches 1000 opportunities client-side for aggregation
  - **Impact**: High memory usage, slow client-side transforms
  - **Fix**: Move aggregation to database view
- **UpcomingEventsByPrincipal**: 3 parallel queries + client-side joins
  - **Impact**: Multiple round-trips, client-side data matching
  - **Fix**: Create dedicated database view
- **No query caching**: Relies on React Admin's internal cache only
  - **Impact**: Redundant fetches on component remounts
  - **Fix**: Implement React Query or SWR for persistent caching

---

#### **Bundle Size Concerns**

**Dead Code** (~1,800 lines):
- 12 unused component files (~1,300 lines)
- 1 unused CSS file (460 lines)
- Commented-out code blocks (30+ lines)

**Recommendation**: Remove unused files to reduce bundle size by ~20-30 KB (minified)

---

### 3. Accessibility (WCAG Compliance)

#### **Implemented Features** ✅

- **ARIA announcements**: Screen reader notifications for refresh actions
  ```typescript
  announce('Dashboard data refreshed');
  ```
- **Keyboard shortcuts**: Ctrl+R (refresh), Ctrl+L (quick log)
- **Focus management**: Tab navigation, focus rings on interactive elements
- **Semantic HTML**: Proper heading hierarchy, landmark regions
- **Touch targets**: 44px minimum (WCAG AA compliant)

#### **Areas for Improvement** ⚠️

- **Color contrast**: Some gray text may not meet WCAG AA ratio
- **Screen reader labels**: Some action buttons missing `aria-label`
- **Keyboard navigation**: Dropdown menus may not be fully keyboard accessible
- **Focus indicators**: Some custom components override default focus rings

---

### 4. Security Considerations

#### **Row Level Security (RLS)**

All dashboard queries respect Supabase RLS policies:
- Users only see data for their assigned principals
- Tasks filtered by `sales_id`
- Activities filtered by `created_by` or `account_manager_id`

**Enforced by**: `dashboard_principal_summary` view uses `security_invoker = on`

---

#### **SQL Injection Prevention**

All queries use React Admin's parameterized query builder:
```typescript
// Safe: Parameterized
useGetList('tasks', {
  filter: { sales_id: identity?.id }  // Sanitized by React Admin
})

// Unsafe: Never used in dashboard ✅
dataProvider.query(`SELECT * FROM tasks WHERE id = ${userInput}`)
```

---

#### **Filter Validation**

**Filter Registry** prevents injection via invalid filter keys:
```typescript
// filterRegistry.ts
dashboard_principal_summary: ['id', 'principal_name', 'account_manager_id', ...]
```

Invalid filters are silently removed before query execution.

---

### 5. Error Handling

#### **Widget-Level Error Boundaries**

```typescript
// DashboardWidget.tsx
{error && (
  <div className="text-destructive">
    <AlertCircle className="h-4 w-4" />
    <span>{error.message}</span>
    <Button onClick={onRetry}>Retry</Button>
  </div>
)}
```

**Benefits**: Isolated failures don't crash entire dashboard

---

#### **RPC Function Error Handling**

```sql
-- complete_task_with_followup
BEGIN;
  IF NOT EXISTS (...) THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  -- ... transaction logic
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
```

**Benefits**: Graceful degradation, informative error messages

---

### 6. Testing Coverage

#### **Test Files** (26 total)

**Component Tests** (17):
- `CompactDashboardHeader.test.tsx`
- `CompactGridDashboard.test.tsx`
- `CompactPrincipalTable.test.tsx`
- `CompactTasksWidget.test.tsx`
- `LogActivityStep.test.tsx`
- `MyTasksThisWeek.test.tsx`
- `OpportunitiesByPrincipalDesktop.test.tsx`
- `PipelineSummary.test.tsx`
- `PrincipalCard.test.tsx`
- `PrincipalDashboard.test.tsx`
- `PriorityIndicator.test.tsx`
- `QuickCompleteTaskModal.test.tsx`
- `RecentActivityFeed.test.tsx`
- `UpdateOpportunityStep.test.tsx`
- `QuickActionModals/QuickLogActivity.test.tsx`
- `OpportunitiesByPrincipal.test.tsx`

**Utility Tests** (1):
- `utils/activityTypeDetection.test.ts`

**Missing Tests**:
- `DashboardWidget.tsx`
- `CompactRecentActivity.tsx`
- `SuccessStep.tsx`
- All legacy/unused components (intentionally not tested)

**Coverage Target**: 70% minimum (per CLAUDE.md)

---

### 7. Responsive Design

#### **Breakpoints**

```css
/* From index.css */
--breakpoint-mobile: 375px;   /* Mobile phones */
--breakpoint-ipad: 768px;     /* iPad and tablets */
--breakpoint-desktop: 1440px; /* Desktop displays */
```

#### **iPad-First Approach**

Dashboard is optimized for iPad Pro (768px+) with responsive scaling:

```tsx
// Typical pattern
className="p-2 md:p-3 lg:p-4"  // Padding scales with viewport
className="grid grid-cols-1 lg:grid-cols-3"  // Layout changes
```

**Touch Targets**: Minimum 44x44px (WCAG AA compliance)

---

### 8. Data Refresh Strategy

#### **Auto-Refresh** (5-minute interval)
```typescript
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;
```

**Rationale**: Balance between data freshness and server load

**Considerations**:
- ✅ Keeps dashboard current for active users
- ⚠️ May be too frequent (consider 10-15 min)
- ❌ No optimistic updates (users wait for refresh)

---

### 9. State Management

**No Global State Library** (Redux, Zustand, etc.)

**State Management Strategy**:
- **Server State**: React Admin hooks (`useGetList`, `useGetOne`)
- **Local State**: React `useState`, `useEffect`
- **Derived State**: `useMemo` for computed values
- **Persistent State**: `localStorage` for user preferences (Kanban column state, filters)

**Benefits**: Simplicity, less boilerplate, aligns with React Admin patterns

---

### 10. Key Insights

#### **Strengths** ✅

1. **Performance**: Pre-aggregated views optimize complex queries
2. **Accessibility**: ARIA announcements, keyboard shortcuts, touch targets
3. **Error Handling**: Widget-level error boundaries, graceful degradation
4. **Transaction Safety**: Atomic RPC functions prevent partial updates
5. **Test Coverage**: 17 component tests + 1 utility test

#### **Areas for Improvement** ⚠️

1. **Code Quality**: 80+ hard-coded color violations, 1,800 lines of dead code
2. **Performance**: PipelineSummary fetches 1000 opportunities client-side
3. **Consistency**: Multiple implementations of similar widgets (activity feeds, task lists)
4. **Bundle Size**: Unused CSS file (460 lines), unused components (1,300 lines)
5. **Documentation**: 5 TODO comments for incomplete features

---

### 11. Migration Path (Recommendations)

#### **Phase 1: Code Cleanup** (High Priority)
1. Remove unused component files (12 files, ~1,300 lines)
2. Remove unused `desktop.css` file (460 lines)
3. Resolve 5 TODO comments (implement or remove)
4. Remove commented-out code block (UpcomingEventsByPrincipal.tsx)

#### **Phase 2: Design System Compliance** (High Priority)
1. Create semantic color migration script
2. Replace 80+ hard-coded color values with semantic tokens
3. Standardize spacing to use semantic tokens
4. Add elevation system (shadows) for depth

#### **Phase 3: Performance Optimization** (Medium Priority)
1. Create database view for pipeline metrics (move aggregation to backend)
2. Create database view for upcoming events (avoid client-side joins)
3. Implement query result caching (React Query or SWR)
4. Reduce auto-refresh interval to 10-15 minutes

#### **Phase 4: Consolidation** (Low Priority)
1. Merge activity feed variants into single component with props
2. Merge task widget variants into single component with props
3. Standardize on container/presentational pattern
4. Create dashboard component library (Storybook)

---

## Summary

### Dashboard Implementation Overview

**Active Dashboards**: 2 (Dashboard.tsx, CompactGridDashboard.tsx)
**Total Files**: 68 (41 components + 26 tests + 1 CSS)
**Active Components**: 29
**Legacy/Unused Components**: 12
**Dead Code**: ~1,800 lines

### Key Technologies

- **UI Framework**: React 19
- **Data Layer**: React Admin v4+ with Supabase
- **Styling**: Tailwind CSS v4 + CSS Custom Properties
- **Icons**: lucide-react
- **Date/Time**: date-fns
- **Routing**: react-router-dom

### Critical Issues

1. **80+ hard-coded color violations** (violates Engineering Constitution)
2. **1,800 lines of dead code** (12 unused components + 460-line CSS file)
3. **Performance**: PipelineSummary fetches 1000 opportunities client-side
4. **5 TODO comments** for incomplete features

### Strengths

1. **Pre-aggregated database views** for performance
2. **Atomic RPC functions** for data consistency
3. **WCAG AA accessibility** (ARIA, keyboard shortcuts, touch targets)
4. **17 component tests** for quality assurance
5. **Auto-refresh** for data freshness

---

**Last Updated**: November 12, 2025
**Dashboard Version**: v2.0 (Principal-Centric Design)
**Project Phase**: Pre-launch
