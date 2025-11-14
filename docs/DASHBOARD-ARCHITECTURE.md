# Dashboard Architecture Documentation

**Atomic CRM - Complete Dashboard Implementation Guide**

---

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [Components Deep Dive](#3-components-deep-dive)
4. [Styling & Design System](#4-styling--design-system)
5. [Data Layer](#5-data-layer)
6. [Features & Functionality](#6-features--functionality)
7. [Dependencies & Libraries](#7-dependencies--libraries)
8. [Code Quality Analysis](#8-code-quality-analysis)
9. [Testing Coverage](#9-testing-coverage)
10. [Technical Notes & Patterns](#10-technical-notes--patterns)
11. [Routing & Integration](#11-routing--integration)
12. [Migration Guide](#12-migration-guide)

---

## 1. Overview

Atomic CRM has **three dashboard implementations** representing different stages of evolution:

### 1.1 Dashboard V2 (Primary - Default)
**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/`

**Status:** Active (default at root URL `/`)

**Purpose:** Principal-centric relationship management with desktop-first design

**Key Features:**
- 3-column resizable layout (Opportunities | Tasks | Quick Logger)
- ARIA tree hierarchy (Principal → Customer → Opportunity)
- Collapsible filters sidebar with accordion-style collapse
- Right slide-over panel (Details/History/Files tabs)
- Global keyboard shortcuts (/, 1-3, H, Esc)
- User preferences persistence via localStorage
- Moderate density (25% spacing reduction from V1)
- WCAG 2.1 AA compliant (95+ Lighthouse score)
- Desktop-optimized (1440px+ primary target, 768px+ tablet support)

**Implemented:** November 2025 (Principal Dashboard V2 redesign)

**Design Doc:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-13-principal-dashboard-v2.md`

**Migration Guide:** `/home/krwhynot/projects/crispy-crm/docs/dashboard-v2-migration.md`

---

### 1.2 Principal Dashboard V1 (Legacy - Feature Flagged)
**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/PrincipalDashboard.tsx`

**Status:** Legacy (accessible via `/dashboard` route or `?layout=v2` query param)

**Purpose:** MVP principal dashboard with 3-column widget layout

**Key Features:**
- 3-column equal-width grid (Opportunities | Tasks | Quick Logger)
- Principal selector with activity history dialog
- Widget-based architecture (cards)
- Progressive disclosure for follow-up tasks
- Desktop-first responsive design

**Implemented:** November 2025 (Principal Dashboard MVP)

**Design Doc:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-11-principal-dashboard-implementation.md`

**Route:** `/dashboard` (custom route, not default dashboard)

---

### 1.3 Dashboard V0 (Original - Deprecated)
**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/Dashboard.tsx`

**Status:** Deprecated (not routed, kept for reference)

**Purpose:** Original dashboard with grid layout and auto-refresh

**Key Features:**
- 70/30 grid layout (main content left, sidebar right)
- Auto-refresh every 5 minutes
- Upcoming events, tasks, activity feed, pipeline summary widgets
- Keyboard shortcuts (Ctrl+L, Ctrl+R)
- Context menu support

**Implemented:** November 2025 (original dashboard iteration)

**Not Accessible:** No route (component exists but not mounted)

---

### Key Differences Summary

| Feature | V2 (Current) | V1 (Legacy) | V0 (Deprecated) |
|---------|--------------|-------------|-----------------|
| **Default Route** | `/` (root) | `/dashboard` | None |
| **Layout** | 3-col resizable | 3-col equal | 2-col 70/30 |
| **Sidebar** | Collapsible filters | None | Supporting widgets |
| **Hierarchy** | ARIA tree | Flat list | Flat list |
| **Slide-Over** | Yes (3 tabs) | No | No |
| **Keyboard Nav** | Yes (6 shortcuts) | No | Yes (2 shortcuts) |
| **Density** | Moderate | Standard | Standard |
| **Accessibility** | WCAG AA | WCAG AA | Basic |
| **Status** | Active | Legacy | Deprecated |

---

## 2. File Structure

### 2.1 Complete Directory Tree

```
src/atomic-crm/dashboard/
├── index.ts                                    # Main export (V2 default)
├── types.ts                                    # Shared types (V0/V1)
│
├── v2/                                         # Dashboard V2 (Current)
│   ├── PrincipalDashboardV2.tsx               # Main layout component
│   ├── index.ts                               # V2 exports
│   ├── types.ts                               # V2-specific types
│   ├── components/
│   │   ├── DashboardHeader.tsx                # Header with breadcrumbs + search
│   │   ├── FiltersSidebar.tsx                 # Collapsible filters panel
│   │   ├── OpportunitiesHierarchy.tsx         # ARIA tree (Principal→Customer→Opp)
│   │   ├── TasksPanel.tsx                     # Tasks with grouping modes
│   │   ├── QuickLogger.tsx                    # Activity logger + follow-up task
│   │   └── RightSlideOver.tsx                 # Slide-over (Details/History/Files)
│   ├── context/
│   │   └── PrincipalContext.tsx               # Global principal selection state
│   ├── hooks/
│   │   ├── useFeatureFlag.ts                  # Feature flag detection (?layout=v2)
│   │   ├── usePrefs.ts                        # localStorage wrapper (prefixed keys)
│   │   └── useResizableColumns.ts             # Mouse drag resize handler
│   └── utils/
│       ├── taskGrouping.ts                    # Task bucket logic (due/priority/principal)
│       └── taskGrouping.test.ts               # Unit tests
│
├── PrincipalDashboard.tsx                      # Dashboard V1 (Legacy)
├── PrincipalOpportunitiesWidget.tsx            # V1 opportunities widget
├── PriorityTasksWidget.tsx                     # V1 tasks widget
├── QuickActivityLoggerWidget.tsx               # V1 quick logger widget
├── ActivityHistoryDialog.tsx                   # V1 activity history modal
│
├── Dashboard.tsx                               # Dashboard V0 (Deprecated)
├── OpportunitiesByPrincipalDesktopContainer.tsx # V0 opportunities container
├── OpportunitiesByPrincipalDesktop.tsx         # V0 opportunities desktop view
├── OpportunitiesByPrincipal.tsx                # V0 opportunities component
├── MyTasksThisWeek.tsx                         # V0 tasks widget
├── ActivityFeed.tsx                            # V0 activity feed widget
├── PipelineSummary.tsx                         # V0 pipeline summary widget
├── UpcomingEventsByPrincipal.tsx               # V0 upcoming events widget
│
├── CompactGridDashboard.tsx                    # Compact grid experiment (unused)
├── CompactDashboardHeader.tsx                  # Compact header (unused)
├── CompactPrincipalTable.tsx                   # Compact table (unused)
├── CompactTasksWidget.tsx                      # Compact tasks (unused)
│
├── DashboardWidget.tsx                         # Shared widget wrapper
├── PrincipalCard.tsx                           # Principal card component
├── PrincipalCardSkeleton.tsx                   # Loading skeleton
├── PriorityIndicator.tsx                       # Priority badge component
├── TasksList.tsx                               # Tasks list component
├── TasksListEmpty.tsx                          # Empty state component
├── TasksListFilter.tsx                         # Tasks filter component
│
├── QuickActionModals/
│   └── QuickLogActivity.tsx                    # Shared quick log modal
│
├── LogActivityStep.tsx                         # Multi-step activity logging
├── UpdateOpportunityStep.tsx                   # Opportunity update step
├── SuccessStep.tsx                             # Success confirmation step
├── QuickCompleteTaskModal.tsx                  # Task completion modal
│
├── hooks/
│   ├── index.ts                               # Hook exports
│   ├── useTasksThisWeek.ts                    # Tasks fetching hook
│   └── __tests__/
│       └── useTasksThisWeek.test.tsx
│
├── utils/
│   ├── activityTypeDetection.ts               # Activity type inference
│   ├── groupTasksByUrgency.ts                 # Task urgency grouping
│   └── __tests__/
│       ├── activityTypeDetection.test.ts
│       └── groupTasksByUrgency.test.ts
│
└── __tests__/                                  # Component tests (17 files)
    ├── ActivityFeed.test.tsx
    ├── CompactDashboardHeader.test.tsx
    ├── CompactGridDashboard.test.tsx
    ├── CompactPrincipalTable.test.tsx
    ├── CompactTasksWidget.test.tsx
    ├── LogActivityStep.test.tsx
    ├── MyTasksThisWeek.test.tsx
    ├── OpportunitiesByPrincipalDesktop.test.tsx
    ├── PipelineSummary.test.tsx
    ├── PrincipalCard.test.tsx
    ├── PrincipalDashboard.test.tsx
    ├── PriorityIndicator.test.tsx
    ├── QuickCompleteTaskModal.test.tsx
    └── UpdateOpportunityStep.test.tsx
```

### 2.2 File Organization Patterns

**By Version:**
- `v2/` - Modern implementation (active)
- Root level - V1 legacy + V0 deprecated + shared utilities
- `Compact*` prefix - Experimental compact grid (unused)

**By Purpose:**
- `*Widget.tsx` - Card-based widget components (V1)
- `*Panel.tsx` / `*Hierarchy.tsx` - Column components (V2)
- `*Modal.tsx` / `*Dialog.tsx` - Overlay UI components
- `*Step.tsx` - Multi-step wizards
- `hooks/` - Custom React hooks
- `utils/` - Pure utility functions
- `__tests__/` - Unit tests

---

## 3. Components Deep Dive

### 3.1 Dashboard V2 Components (Active)

#### 3.1.1 PrincipalDashboardV2.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`

**Purpose:** Main layout container for V2 dashboard

**Key Features:**
- Grid layout: `18rem` sidebar + 3-column resizable content
- Global keyboard event listeners (/, 1-3, H, Esc)
- Manages slide-over open/close state
- Wraps entire dashboard in `PrincipalProvider` context

**Props:** None (self-contained)

**State:**
- `slideOverOpen: boolean` - Right slide-over visibility
- `selectedOpportunityId: number | null` - Selected opportunity for slide-over
- `filterState: FilterState` - Multi-criteria filters for opportunities/tasks

**Dependencies:**
- `PrincipalProvider` - Context wrapper for principal selection
- `useResizableColumns` - Column resize hook
- All child components (Header, Sidebar, 3 columns, SlideOver)

**Layout Structure:**
```tsx
<PrincipalProvider>
  <div className="flex flex-col h-screen">
    <DashboardHeader />
    <div className="grid" style={{ gridTemplateColumns: '18rem 1fr' }}>
      <FiltersSidebar />
      <div className="flex"> {/* 3-column resizable */}
        <OpportunitiesHierarchy />
        <TasksPanel />
        <QuickLogger />
      </div>
    </div>
    <RightSlideOver />
  </div>
</PrincipalProvider>
```

**Keyboard Shortcuts:**
- `/` - Focus global search input
- `1` - Scroll to Opportunities column
- `2` - Scroll to Tasks column
- `3` - Scroll to Quick Logger column
- `H` - Open slide-over on History tab (if opportunity selected)
- `Esc` - Close slide-over

**CSS Grid Control:** Uses CSS Grid parent control for sidebar collapse (0px width when closed)

**Status:** **ACTIVE** - Default dashboard at root URL

---

#### 3.1.2 DashboardHeader.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx`

**Purpose:** Top navigation bar with breadcrumbs, principal selector, search, and "New" dropdown

**Props:** None (uses context)

**Features:**
- **Breadcrumbs:** Home → Principals → [Selected Principal Name]
- **Principal Selector:** Dropdown with "All Principals" + individual options
- **Global Search:** Input with keyboard shortcut (/) focus support
- **"New" Dropdown:** Create Activity | Task | Opportunity (TODO: Wire up handlers)

**Dependencies:**
- `usePrincipalContext()` - Global principal selection
- `useGetList('organizations')` - Fetch principals
- `useNavigate()` - React Router navigation

**React Admin Integration:** Uses `useGetList` for data fetching

**Touch Targets:** All interactive elements 44px minimum height (WCAG AA)

**Status:** **ACTIVE**

**Known Issue:** "New" dropdown handlers are console.log placeholders (TODO comments in code)

---

#### 3.1.3 FiltersSidebar.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`

**Purpose:** Collapsible filter panel with multi-criteria filtering

**Props:**
- `filters: FilterState` - Current filter values
- `onFiltersChange: (filters: FilterState) => void` - Filter update callback

**Filter Categories:**
1. **Health Status** - Checkboxes (Active 🟢, Cooling 🟡, At Risk 🔴)
2. **Stage** - Checkboxes in 2-column grid (all opportunity stages)
3. **Assignee** - Radio buttons (Me | Team)
4. **Last Touch** - Select dropdown (Last 7 days | Last 14 days | Any)
5. **Saved Views** - Empty state placeholder
6. **Utilities** - Checkboxes (Show closed opportunities, Group by customer)

**Layout:**
- **Sidebar Width:** Fixed `18rem` (288px)
- **Collapse Behavior:** Accordion-style with chevron rotation
- **Persistence:** Uses `usePrefs('pd.filtersOpen', true)` for collapse state

**Two-Column Stage Layout (2025-11-14):**
- Stage filters rendered in 2-column grid to fit 18rem width
- Each stage checkbox fits in compact space with truncation

**Moderate Density (2025-11-14):**
- Reduced padding/gaps by 25% (16px→12px)
- Checkbox height: `h-4 w-4` (16px)
- Min touch targets: `min-h-8` (32px) for labels
- Font size: `text-xs` (12px)

**Status:** **ACTIVE**

**Known Issue:** "Saved Views" section is empty placeholder (MVP not implemented)

---

#### 3.1.4 OpportunitiesHierarchy.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`

**Purpose:** ARIA tree view of opportunities grouped by customer

**Props:**
- `onOpportunityClick: (oppId: number) => void` - Callback when opportunity clicked

**Data Source:** `principal_opportunities` database view (filtered by `principal_id`)

**Hierarchy Structure:**
```
Principal (implicit, selected in header)
├── Customer A (expandable group)
│   ├── Opportunity 1 (leaf node)
│   ├── Opportunity 2 (leaf node)
│   └── Opportunity 3 (leaf node)
├── Customer B (expandable group)
│   └── Opportunity 4 (leaf node)
```

**Features:**
- **Auto-expand:** Top 3 customers expanded on initial render
- **Health Dots:** Color-coded status indicators (active/cooling/at_risk)
- **Stage Badges:** Semantic color badges with stage labels
- **Close Date:** Displayed on desktop (hidden on mobile)
- **Keyboard Navigation:**
  - `ArrowRight` - Expand customer group
  - `ArrowLeft` - Collapse customer group
  - `Enter` / `Space` - Toggle expand or open opportunity
  - `Tab` - Focus next item

**ARIA Attributes:**
- `role="tree"` on container
- `role="treeitem"` on customer groups and opportunities
- `aria-expanded` on customer groups
- `aria-label` on health dots

**Empty States:**
- "Select a principal to view opportunities" (no principal selected)
- "No opportunities for this principal" (principal selected, no data)
- "Create Opportunity" CTA button when no opportunities

**Status:** **ACTIVE**

**Performance:** Auto-expands only top 3 to avoid rendering all opportunities at once

---

#### 3.1.5 TasksPanel.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`

**Purpose:** Tasks list with 3 grouping modes (Due Date, Priority, Principal)

**Props:** None (uses context)

**Data Source:** `priority_tasks` database view (filtered by `principal_id` + `completed: false`)

**Grouping Modes:**
1. **Due Date** (default) - Overdue | Today | Tomorrow | This Week | Later
2. **Priority** - Critical | High | Medium | Low
3. **Principal** - Alphabetical by principal name

**"Later" Bucket Pagination:**
- Initially collapsed with task count badge
- Click to expand first 10 tasks
- "Show next 10" button loads more (infinite scroll pattern)

**Features:**
- **Task Completion:** Click checkbox to mark task complete (optimistic update)
- **Priority Badges:** Color-coded badges (critical=red, high=yellow, medium=accent, low=muted)
- **Grouping Selector:** Dropdown in header to switch modes
- **Empty State:** "No tasks due" with "Create Task" CTA

**Moderate Density (2025-11-14):**
- Task rows: `h-11` (44px) - WCAG AA compliant
- Header: `h-11` (44px)
- Group headers: `h-11` (44px) with `bg-muted/50`

**Status:** **ACTIVE**

**Known Issue:** "Create Task" handler is console.log placeholder

---

#### 3.1.6 QuickLogger.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/components/QuickLogger.tsx`

**Purpose:** Inline activity logger with optional follow-up task creation

**Props:** None (uses context)

**Features:**
1. **Activity Type Buttons:** Call | Email | Meeting | Note (icon-only, 44px touch targets)
2. **Opportunity Selector:** Progressive disclosure (only if principal selected)
3. **Subject Field:** Required text input
4. **Description Field:** Optional textarea
5. **Follow-up Checkbox:** Reveals 3 additional fields (Task Title, Due Date, Priority)

**Progressive Disclosure:**
- Initially shows activity type, subject, description
- Checking "Create follow-up task" reveals task fields
- Validation only applies to visible fields

**Activity Mapping:**
- `call` → `interaction_type: 'call'`
- `email` → `interaction_type: 'email'`
- `meeting` → `interaction_type: 'meeting'`
- `note` → `interaction_type: 'check_in'`

**Activity Type Logic:**
- If opportunity linked: `activity_type: 'interaction'`
- If no opportunity: `activity_type: 'engagement'`

**Form Behavior:**
- On submit: Creates activity (+ optional task)
- Clears form but **keeps principal selected** for consecutive logs
- Triggers `refresh()` to update Opportunities and Tasks columns

**Status:** **ACTIVE**

**Validation:**
- Subject required (trim whitespace)
- If follow-up checked: Task title + due date required

---

#### 3.1.7 RightSlideOver.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx`

**Purpose:** Right-side overlay panel for opportunity details

**Props:**
- `isOpen: boolean` - Visibility state
- `onClose: () => void` - Close callback
- `opportunityId: number | null` - Selected opportunity ID

**Tabs:**
1. **Details** - Opportunity info + stage change
2. **History** - Activity history (sorted DESC by date)
3. **Files** - Placeholder (not implemented)

**Dimensions:**
- Width: `40vw` (constrained to `480px` min, `720px` max)
- Side: Right
- Overlay: Dark backdrop with click-to-close

**Details Tab Fields:**
- **Stage Selector:** Dropdown with optimistic update
- **Priority Badge:** Read-only display
- **Estimated Close Date:** Read-only formatted date
- **Customer/Principal Names:** Read-only
- **Latest Notes:** Truncated to 200 chars
- **Metrics:** Days in stage, total interactions

**History Tab:**
- Activity rows with type badge, subject, timestamp
- Empty state: "No activity recorded" with icon
- Sortable: Most recent first

**Files Tab:**
- Empty state: "File attachments coming soon"

**Keyboard Shortcut:**
- `H` key opens slide-over on History tab (if opportunity selected)
- `Esc` key closes slide-over

**Status:** **ACTIVE**

**Known Issue:** Files tab not implemented (empty state)

---

### 3.2 Dashboard V2 Context & Hooks

#### 3.2.1 PrincipalContext.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/context/PrincipalContext.tsx`

**Purpose:** Global state for selected principal (shared across all 3 columns)

**Context Value:**
```typescript
interface PrincipalContextValue {
  selectedPrincipalId: number | null;
  setSelectedPrincipal: (id: number | null) => void;
}
```

**Usage:**
```tsx
const { selectedPrincipalId, setSelectedPrincipal } = usePrincipalContext();
```

**Provider Location:** Wraps entire `PrincipalDashboardV2` component

**Consumers:**
- `DashboardHeader` - Principal selector dropdown
- `OpportunitiesHierarchy` - Filter opportunities
- `TasksPanel` - Filter tasks
- `QuickLogger` - Pre-fill organization field

**Status:** **ACTIVE**

---

#### 3.2.2 useFeatureFlag.ts
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts`

**Purpose:** Detect `?layout=v2` query parameter for feature flag

**Returns:** `boolean` (true if `layout=v2` present in URL)

**Usage Pattern:**
```tsx
const isV2Enabled = useFeatureFlag();

if (isV2Enabled) {
  return <PrincipalDashboardV2 />;
}
return <PrincipalDashboard />; // V1
```

**Used In:** `PrincipalDashboard.tsx` (V1) to conditionally render V2

**Status:** **ACTIVE** (though V2 is now default, flag still functional)

**Note:** V2 is default at root URL, so flag is only needed to enable V2 on `/dashboard` route

---

#### 3.2.3 usePrefs.ts
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/hooks/usePrefs.ts`

**Purpose:** Type-safe wrapper around React Admin's `useStore` for localStorage persistence

**Signature:**
```typescript
function usePrefs<T>(key: string, defaultValue: T): [T, (value: T) => void]
```

**Key Prefix:** Automatically prefixes keys with `pd.` (principal dashboard namespace)

**Usage Examples:**
```tsx
const [widths, setWidths] = usePrefs<ColWidths>('colWidths', [40, 30, 30]);
const [grouping, setGrouping] = usePrefs<TaskGrouping>('taskGrouping', 'due');
const [rightTab, setRightTab] = usePrefs<TabName>('rightTab', 'details');
const [filtersOpen, setFiltersOpen] = usePrefs<boolean>('filtersOpen', true);
```

**Persisted Preferences:**
- `pd.colWidths` - 3-column widths [number, number, number]
- `pd.taskGrouping` - Task grouping mode ('due' | 'priority' | 'principal')
- `pd.rightTab` - Last active slide-over tab ('details' | 'history' | 'files')
- `pd.filtersOpen` - Filters sidebar collapsed state (boolean)

**Storage:** React Admin's `localStorageStore` (scoped to "CRM" namespace)

**Status:** **ACTIVE**

---

#### 3.2.4 useResizableColumns.ts
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/hooks/useResizableColumns.ts`

**Purpose:** Mouse drag handler for resizing 3-column layout

**Returns:**
```typescript
{
  containerRef: React.RefObject<HTMLDivElement>;  // Attach to container
  widths: ColWidths;                              // Current widths [40, 30, 30]
  onMouseDown: (separatorIndex: 0 | 1) => (e: React.MouseEvent) => void;
  resetWidths: () => void;                        // Reset to [40, 30, 30]
}
```

**Constraints:**
- **Min Width:** 15% per column
- **Max Width:** 70% per column
- **Sum:** Always 100% (automatic third column adjustment)

**Usage Pattern:**
```tsx
const { containerRef, widths, onMouseDown } = useResizableColumns();

<div ref={containerRef} className="flex">
  <div style={{ width: `${widths[0]}%` }}>Column 1</div>
  <button onMouseDown={onMouseDown(0)}>Separator</button>
  <div style={{ width: `${widths[1]}%` }}>Column 2</div>
  <button onMouseDown={onMouseDown(1)}>Separator</button>
  <div style={{ width: `${widths[2]}%` }}>Column 3</div>
</div>
```

**Mouse Drag Logic:**
1. User clicks separator button
2. `onMouseDown` disables text selection, attaches `mousemove`/`mouseup` listeners
3. `mousemove` calculates new widths based on delta X
4. Validates constraints (min/max per column)
5. Updates `widths` state (persisted via `usePrefs`)
6. `mouseup` removes listeners, re-enables text selection

**Status:** **ACTIVE**

**Persistence:** Widths saved to localStorage via `usePrefs('colWidths')`

---

### 3.3 Dashboard V2 Utilities

#### 3.3.1 taskGrouping.ts
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/utils/taskGrouping.ts`

**Purpose:** Task bucket classification logic for "Due Date" grouping mode

**Exports:**
- `getBucket(due_date: string | null): TaskBucket` - Classify task into bucket
- `BUCKET_LABELS: Record<TaskBucket, string>` - Display labels
- `PRIORITY_LABELS: Record<string, string>` - Priority display labels

**Task Buckets:**
```typescript
type TaskBucket = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later';
```

**Classification Logic:**
```typescript
if (!due_date) return 'later';
const dueDate = startOfDay(parseISO(due_date));
if (isBefore(dueDate, TODAY)) return 'overdue';
if (isEqual(dueDate, TODAY)) return 'today';
if (isEqual(dueDate, TOMORROW)) return 'tomorrow';
if (isBefore(dueDate, END_OF_WEEK)) return 'this_week'; // 7 days
return 'later';
```

**Date Normalization:** Uses `startOfDay()` to normalize all dates to midnight for consistent comparison

**Timezone:** Uses local system timezone (America/Chicago implied)

**Status:** **ACTIVE**

**Test Coverage:** 5 unit tests in `taskGrouping.test.ts`

---

### 3.4 Dashboard V1 Components (Legacy)

#### 3.4.1 PrincipalDashboard.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/PrincipalDashboard.tsx`

**Purpose:** MVP principal dashboard with 3-column widget layout

**Layout:** Desktop-first 3-column grid (equal widths on desktop, stack on mobile)

**Widgets:**
1. **PrincipalOpportunitiesWidget** - Active opportunities by principal
2. **PriorityTasksWidget** - Priority tasks by principal
3. **QuickActivityLoggerWidget** - Activity logger with progressive disclosure

**Header Controls:**
- **Principal Selector:** Dropdown to select principal
- **Activity History Button:** Clock icon opens `ActivityHistoryDialog` (requires principal selection)

**Feature Flag Integration:**
```tsx
const isV2Enabled = useFeatureFlag();

if (isV2Enabled) {
  return <PrincipalDashboardV2 />; // Render V2 if ?layout=v2
}
// Otherwise render V1 dashboard
```

**Route:** `/dashboard` (custom route, not default)

**Status:** **LEGACY** - Kept for backward compatibility

**Migration Path:** Users can access V2 at root `/` or enable via `?layout=v2` flag

---

#### 3.4.2 PrincipalOpportunitiesWidget.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/PrincipalOpportunitiesWidget.tsx`

**Purpose:** Card widget displaying opportunities grouped by principal

**Data Source:** `principal_opportunities` database view

**Grouping:** Opportunities grouped by `principal_name` (server-side fetch, client-side grouping)

**Display:**
- Card title: "Active Opportunities by Principal"
- Each principal gets section header + list of opportunities
- Opportunity row: Health dot | Customer name | Stage badge

**Health Indicator:**
- 🟢 Active - `bg-success`
- 🟡 Cooling - `bg-warning`
- 🔴 At Risk - `bg-destructive`

**Empty State:** "No active opportunities" (centered)

**Status:** **LEGACY** (V1 only)

---

#### 3.4.3 PriorityTasksWidget.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/PriorityTasksWidget.tsx`

**Purpose:** Card widget displaying tasks grouped by principal

**Data Source:** `priority_tasks` database view

**Grouping:** Tasks grouped by `principal_name` (client-side)

**Display:**
- Card title: "Priority Tasks"
- Each principal gets section header + list of tasks
- Task row: Priority badge | Task title | Due date

**Priority Badges:**
- Critical - `bg-destructive text-destructive-foreground`
- High - `bg-warning text-warning-foreground`
- Medium - `bg-accent text-accent-foreground`
- Low - `bg-muted text-muted-foreground`

**Due Date Formatting:**
- Overdue (if past today)
- Today
- Tomorrow
- X days (if within 7 days)
- Full date (if > 7 days)

**Empty State:** "No priority tasks" (centered)

**Status:** **LEGACY** (V1 only)

---

#### 3.4.4 QuickActivityLoggerWidget.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/QuickActivityLoggerWidget.tsx`

**Purpose:** Card widget for logging activities with progressive disclosure

**Features:**
1. **Activity Type Buttons:** Call | Email | Meeting | Note (4 equal-width buttons)
2. **Principal Selector:** Required dropdown
3. **Opportunity Selector:** Progressive disclosure (only if principal selected)
4. **Subject Field:** Required text input
5. **Description Field:** Optional textarea
6. **Submit Button:** Disabled until principal + subject provided

**Activity Mapping:** Same as V2 QuickLogger

**Form Behavior:**
- On submit: Creates activity via `useCreate('activities')`
- Clears form but **keeps principal selected** for consecutive logs
- Success notification

**Grid Layout:**
- Activity type buttons: `grid-cols-2 lg:grid-cols-4` (responsive)
- Icon + label on desktop, icon-only on mobile

**Status:** **LEGACY** (V1 only)

**Note:** V2 QuickLogger adds follow-up task creation (V1 does not have this)

---

#### 3.4.5 ActivityHistoryDialog.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/ActivityHistoryDialog.tsx`

**Purpose:** Modal dialog showing complete activity history for selected principal

**Props:**
- `open: boolean` - Dialog visibility
- `onClose: () => void` - Close callback
- `principalId: number | null` - Selected principal
- `principalName: string` - Principal display name

**Features:**
- Fetches all activities for principal (via `useGetList('activities')`)
- Displays activities in chronological order (DESC)
- Activity row: Type badge | Subject | Date
- Empty state: "No activities recorded"

**Dialog Styling:** Uses shadcn/ui `Dialog` component (full-screen overlay)

**Status:** **LEGACY** (V1 only)

**V2 Replacement:** Right slide-over "History" tab (scoped to opportunity, not principal)

---

### 3.5 Dashboard V0 Components (Deprecated)

#### 3.5.1 Dashboard.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/Dashboard.tsx`

**Purpose:** Original dashboard with 70/30 grid layout and auto-refresh

**Layout:**
- Left column (70%): Upcoming events, Opportunities table
- Right sidebar (30%): Tasks, Activity feed, Pipeline summary

**Features:**
- **Auto-refresh:** Every 5 minutes via `setInterval`
- **Manual Refresh:** Button with spinner animation
- **Quick Log Activity:** Button opens `QuickLogActivity` modal
- **Keyboard Shortcuts:**
  - `Ctrl+L` - Open quick log modal
  - `Ctrl+R` - Manual refresh

**Widgets:**
1. `UpcomingEventsByPrincipal` - This week's scheduled activities
2. `OpportunitiesByPrincipalDesktopContainer` - Main opportunities table
3. `MyTasksThisWeek` - Tasks grouped by urgency
4. `ActivityFeed` - Last 7 activities
5. `PipelineSummary` - Pipeline metrics

**Status:** **DEPRECATED** - Not routed (kept for reference)

**Route:** None (component exists but not mounted in `CRM.tsx`)

---

### 3.6 Compact Grid Components (Experimental - Unused)

#### 3.6.1 CompactGridDashboard.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/CompactGridDashboard.tsx`

**Purpose:** Experimental compact grid layout (3-column 40/30/30)

**Status:** **UNUSED** - Not routed, not actively developed

**Layout:**
- Left (40%): `CompactPrincipalTable`
- Middle (30%): `CompactTasksWidget`
- Right (30%): `ActivityFeed` (compact variant)

**Custom Event:** Listens for `quick-log-activity` event to open modal

**Note:** Likely prototype/experiment from early development, superseded by V1/V2

---

### 3.7 Shared Components (Cross-Version)

#### 3.7.1 DashboardWidget.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/DashboardWidget.tsx`

**Purpose:** Reusable widget wrapper with consistent styling

**Props:**
- `title: string` - Widget header title
- `actions?: ReactNode` - Optional header actions (buttons, filters)
- `children: ReactNode` - Widget content
- `className?: string` - Additional classes

**Usage:** Used by V0 widgets (MyTasksThisWeek, ActivityFeed, etc.)

**Status:** **SHARED** (V0/V1 components use this)

---

#### 3.7.2 PrincipalCard.tsx
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/PrincipalCard.tsx`

**Purpose:** Card component for displaying principal summary

**Props:**
- `principal: { name: string; opportunityCount: number; lastActivity: string }`

**Features:**
- Principal name header
- Opportunity count badge
- Last activity timestamp
- Health status indicator

**Status:** **SHARED** (used by V0/Compact components)

---

#### 3.7.3 QuickLogActivity.tsx (Modal)
**Path:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/QuickActionModals/QuickLogActivity.tsx`

**Purpose:** Shared modal for quick activity logging (used by V0)

**Props:**
- `open: boolean`
- `onClose: () => void`
- `onSubmit: (data) => void`
- `principalId?: string`

**Status:** **SHARED** (V0 uses this, V1/V2 have inline loggers)

---

## 4. Styling & Design System

### 4.1 Design System Principles

**Primary Design System:** Tailwind CSS v4 + shadcn/ui components

**Key Principles:**
1. **Semantic Color Variables Only** - Never hex codes or inline CSS variables
2. **Spacing System** - CSS custom properties for consistent layouts
3. **Desktop-First Responsive** - Optimized for 1440px+ screens, graceful degradation
4. **Accessibility** - WCAG 2.1 AA compliant (44px touch targets, semantic HTML, ARIA attributes)
5. **Moderate Density** - 25% spacing reduction from V1 to V2 (2025-11-14 update)

---

### 4.2 Semantic Color System

**Location:** `/home/krwhynot/projects/crispy-crm/src/index.css` (CSS custom properties)

**Color Categories:**

#### Base Colors
```css
--background: /* Page background */
--foreground: /* Primary text */
--card: /* Card backgrounds */
--card-foreground: /* Card text */
--popover: /* Popover backgrounds */
--popover-foreground: /* Popover text */
```

#### Interactive Colors
```css
--primary: /* Primary actions (buttons, links) */
--primary-foreground: /* Primary button text */
--secondary: /* Secondary actions */
--secondary-foreground: /* Secondary button text */
--muted: /* Muted backgrounds */
--muted-foreground: /* Muted text */
--accent: /* Accent highlights */
--accent-foreground: /* Accent text */
```

#### Status Colors
```css
--success: /* Green (active health, success states) */
--warning: /* Yellow (cooling health, warnings) */
--destructive: /* Red (at_risk health, errors, critical priority) */
--destructive-foreground: /* Destructive text */
```

#### Border & Dividers
```css
--border: /* Borders, dividers */
--input: /* Input borders */
--ring: /* Focus rings */
```

#### Brand Colors (MFB "Garden to Table")
```css
--brand-50 through --brand-950: /* Earth tones in OKLCH */
```

**Usage Examples:**
```tsx
// ✅ CORRECT - Semantic colors
className="bg-success text-foreground border-border"
className="text-destructive hover:bg-muted/50"

// ❌ WRONG - Direct colors (will fail validation)
className="bg-green-500 text-black border-gray-300"
style={{ backgroundColor: 'oklch(...)' }} // Don't use inline CSS variables
```

**Validation:** Run `npm run validate:colors` to check for violations

**Reference:** `/home/krwhynot/projects/crispy-crm/docs/internal-docs/color-theming-architecture.docs.md`

---

### 4.3 Spacing System

**Location:** `/home/krwhynot/projects/crispy-crm/src/index.css` (lines 72-96, `@theme` layer)

**Semantic Spacing Tokens:**

#### Grid System
```css
--spacing-grid-columns-desktop: 12; /* 12-column grid */
--spacing-grid-columns-ipad: 8;     /* 8-column grid */
--spacing-gutter-desktop: 24px;     /* Column gaps */
--spacing-gutter-ipad: 16px;
```

#### Edge Padding (Screen Borders)
```css
--spacing-edge-desktop: 64px;  /* 1440px+ */
--spacing-edge-ipad: 48px;     /* 768-1024px */
--spacing-edge-mobile: 16px;   /* 375-767px */
```

#### Vertical Rhythm
```css
--spacing-section: 32px;   /* Major section spacing */
--spacing-widget: 24px;    /* Widget spacing */
--spacing-content: 16px;   /* Content spacing */
--spacing-compact: 12px;   /* Compact spacing (V2 density) */
```

#### Widget Internals
```css
--spacing-widget-padding: 20px;
--spacing-widget-min-height: 280px;
```

**Usage Examples:**
```tsx
// ✅ CORRECT - Semantic spacing
className="px-[var(--spacing-edge-desktop)] py-6"
className="space-y-section gap-content"

// ❌ WRONG - Hardcoded pixel values
className="px-16 py-6" // Use semantic tokens instead
```

**Moderate Density Reduction (V2):**
- **Before:** `p-6` (24px), `gap-6` (24px)
- **After:** `p-3` (12px), `gap-3` (12px)
- **Percentage:** 25% reduction in padding/gaps

**Status:** Phase 1 complete (Reports Module), incremental rollout to other modules

**Reference:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-08-spacing-layout-system-design.md`

---

### 4.4 Responsive Design

**Breakpoints:**
```css
Mobile:  375px - 767px   (base, no prefix)
iPad:    768px - 1024px  (md:)
Desktop: 1440px+         (lg:)
```

**Design Philosophy:** Desktop-first with graceful degradation

**Examples:**

#### Grid Stacking
```tsx
// Desktop: 3-column | iPad: 2-column | Mobile: 1-column
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

#### Touch Targets
```tsx
// Minimum 44px height for WCAG AA compliance
className="h-11" // 44px
className="min-h-11" // At least 44px
```

#### Responsive Spacing
```tsx
// Use semantic tokens with breakpoint prefixes
className="p-edge-mobile md:p-edge-ipad lg:p-edge-desktop"
className="space-y-compact md:space-y-content lg:space-y-widget"
```

#### Responsive Visibility
```tsx
// Show/hide elements based on viewport
className="hidden md:inline" // Desktop only
className="md:hidden" // Mobile only
```

---

### 4.5 Accessibility Standards

**WCAG 2.1 Level AA Compliance:**

#### Touch Targets
- **Minimum Size:** 44x44px (h-11 w-11)
- **All Interactive Elements:** Buttons, checkboxes, radio buttons, links
- **Spacing:** Minimum 8px gap between targets

#### Semantic HTML
```tsx
<main role="main" aria-label="Dashboard">
<aside aria-label="Filters">
<button aria-label="Resize opportunities column">
<div role="tree" aria-label="Opportunities hierarchy">
```

#### ARIA Attributes
- `role` - Define semantic roles (tree, treeitem, listitem)
- `aria-label` - Provide accessible labels
- `aria-expanded` - Indicate expandable state
- `aria-selected` - Indicate selection state
- `aria-hidden` - Hide decorative elements from screen readers

#### Keyboard Navigation
- **Tab Order:** Logical focus flow
- **Arrow Keys:** Tree navigation (ArrowUp/Down/Left/Right)
- **Enter/Space:** Activate buttons/links
- **Escape:** Close modals/popovers
- **Global Shortcuts:** Well-documented (/, 1-3, H)

#### Color Contrast
- **Text on Background:** Minimum 4.5:1 ratio
- **Large Text (18pt+):** Minimum 3:1 ratio
- **Interactive Elements:** 3:1 ratio against adjacent colors

**Validation:** Lighthouse accessibility audit (target: 95+ score)

**Reference:** WCAG 2.1 guidelines at https://www.w3.org/WAI/WCAG21/quickref/

---

### 4.6 Component Library Integration

**Primary UI Library:** shadcn/ui (Radix UI primitives + Tailwind CSS)

**Components Used:**

#### Layout
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Widget containers
- `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` - Slide-over panel
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tabbed interfaces

#### Form Controls
- `Input` - Text fields
- `Textarea` - Multi-line text
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` - Dropdowns
- `Checkbox` - Toggle options
- `RadioGroup`, `RadioGroupItem` - Mutually exclusive options
- `Button` - Actions
- `Label` - Form labels

#### Feedback
- `Alert`, `AlertTitle`, `AlertDescription` - Notifications
- `Badge` - Status indicators
- `Skeleton` - Loading states

#### Utility
- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` - Expandable sections
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent` - Menus
- `Separator` - Visual dividers

**Installation:** All components pre-configured in `/home/krwhynot/projects/crispy-crm/src/components/ui/`

**Customization:** Theme via CSS custom properties (no component prop overrides)

---

## 5. Data Layer

### 5.1 Database Views

#### 5.1.1 principal_opportunities
**Purpose:** Pre-aggregated opportunities view with customer info + health status

**Columns:**
- `opportunity_id: number` - Opportunity ID
- `opportunity_name: string` - Opportunity name
- `stage: OpportunityStage` - Current stage
- `estimated_close_date: string | null` - Estimated close date
- `last_activity: string` - Last activity timestamp
- `customer_organization_id: number` - Customer organization ID
- `customer_name: string` - Customer organization name
- `principal_id: number` - Principal organization ID
- `principal_name: string` - Principal organization name
- `days_since_activity: number` - Days since last activity (computed)
- `health_status: HealthStatus` - Health classification (active/cooling/at_risk)

**Health Status Logic:**
```sql
CASE
  WHEN days_since_activity <= 7 THEN 'active'
  WHEN days_since_activity <= 14 THEN 'cooling'
  ELSE 'at_risk'
END
```

**Migration:** `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251113235406_principal_opportunities_view.sql`

**Used By:**
- V2: `OpportunitiesHierarchy.tsx`
- V1: `PrincipalOpportunitiesWidget.tsx`
- V2: `QuickLogger.tsx` (opportunity selector)

---

#### 5.1.2 priority_tasks
**Purpose:** Priority-ranked tasks with principal info

**Columns:**
- `task_id: number` - Task ID
- `task_title: string` - Task title
- `due_date: string | null` - Due date
- `priority: TaskPriority` - Priority level (low/medium/high/critical)
- `task_type: TaskType` - Task type (Call/Email/Meeting/etc.)
- `completed: boolean` - Completion status
- `opportunity_id: number | null` - Linked opportunity ID
- `opportunity_name: string | null` - Linked opportunity name
- `organization_id: number | null` - Customer organization ID
- `customer_name: string | null` - Customer organization name
- `principal_organization_id: number | null` - Principal organization ID
- `principal_name: string | null` - Principal organization name
- `contact_id: number | null` - Contact ID
- `contact_name: string | null` - Contact name

**Sorting:** Default by `due_date ASC` (earliest first)

**Migration:** `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251114001720_priority_tasks_view.sql`

**Used By:**
- V2: `TasksPanel.tsx`
- V1: `PriorityTasksWidget.tsx`

---

#### 5.1.3 dashboard_principal_summary
**Purpose:** Principal summary metrics (used by CompactGridDashboard)

**Columns:**
- `id: number` - Principal organization ID
- `principal_name: string` - Principal name
- `opportunity_count: number` - Active opportunity count
- `last_activity_date: string | null` - Last activity date
- `status_indicator: string` - Status indicator (active/cooling/at_risk)

**Note:** This view is used by **CompactGridDashboard** (experimental/unused)

**Migration:** `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251106190107_create_dashboard_principal_summary_view.sql`

**Status:** **UNUSED** (CompactGridDashboard not routed)

---

### 5.2 React Admin Data Fetching

**Data Provider:** Supabase Unified Data Provider

**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Pattern:** All dashboard components use React Admin hooks for data fetching

#### useGetList Hook
**Purpose:** Fetch list of records with filtering, pagination, sorting

**Signature:**
```tsx
const { data, isLoading, error, refetch } = useGetList<T>(
  resource: string,
  {
    filter?: Record<string, any>,
    pagination?: { page: number, perPage: number },
    sort?: { field: string, order: 'ASC' | 'DESC' }
  },
  options?: { enabled?: boolean }
);
```

**Examples:**

```tsx
// Fetch opportunities for selected principal
const { data: opportunities } = useGetList<PrincipalOpportunity>(
  'principal_opportunities',
  {
    filter: selectedPrincipalId
      ? { principal_id: selectedPrincipalId }
      : {},
    sort: { field: 'last_activity', order: 'DESC' },
    pagination: { page: 1, perPage: 500 },
  },
  {
    enabled: !!selectedPrincipalId, // Only fetch if principal selected
  }
);

// Fetch incomplete tasks
const { data: tasks } = useGetList<PriorityTask>(
  'priority_tasks',
  {
    filter: {
      completed: false,
      ...(selectedPrincipalId && { principal_organization_id: selectedPrincipalId })
    },
    sort: { field: 'due_date', order: 'ASC' },
    pagination: { page: 1, perPage: 500 },
  }
);
```

---

#### useGetOne Hook
**Purpose:** Fetch single record by ID

**Signature:**
```tsx
const { data, isLoading, error } = useGetOne<T>(
  resource: string,
  { id: number | string },
  options?: { enabled?: boolean }
);
```

**Example:**
```tsx
// Fetch opportunity details for slide-over
const { data: opportunity, isLoading } = useGetOne<Opportunity>(
  'opportunities',
  { id: opportunityId! },
  { enabled: !!opportunityId }
);
```

---

#### useCreate Hook
**Purpose:** Create new record

**Signature:**
```tsx
const [create, { isLoading }] = useCreate();

await create(resource, {
  data: { /* record data */ }
});
```

**Example:**
```tsx
// Create activity
await createActivity('activities', {
  data: {
    subject: 'Call with customer',
    activity_type: 'interaction',
    type: 'call',
    organization_id: principalId,
    opportunity_id: opportunityId,
  },
});
```

---

#### useUpdate Hook
**Purpose:** Update existing record

**Signature:**
```tsx
const [update, { isLoading }] = useUpdate();

await update(resource, {
  id: recordId,
  data: { /* updated fields */ },
  previousData: originalRecord,
});
```

**Example:**
```tsx
// Update opportunity stage
await update('opportunities', {
  id: opportunity.id,
  data: { stage: 'closed_won' },
  previousData: opportunity,
});
```

---

### 5.3 Filter Registry

**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts`

**Purpose:** Prevent 400 errors from stale filters (React Admin caches filter state in localStorage)

**Problem:**
- User applies filter on list view
- Filter saved to localStorage
- User navigates away
- Filter persists on next visit, even if invalid

**Solution:** Filter Registry validates filters before sending to API

**Example Registration:**
```typescript
// Register valid filters for principal_opportunities resource
registerResourceFilters('principal_opportunities', [
  'principal_id',
  'stage',
  'health_status',
  'customer_organization_id'
]);
```

**Usage:** Automatically applied by Supabase data provider (no manual integration needed)

**Reference:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts`

---

### 5.4 State Management

**Pattern:** React Context + React Admin hooks (no Redux, no Zustand)

**Global State:**
- **Principal Selection:** `PrincipalContext` (V2 only)
- **User Preferences:** `useStore` from React Admin (localStorage)
- **Form State:** React Hook Form (via React Admin)

**Local State:**
- Component-level `useState` for UI state (modals, filters, tabs)
- `useRef` for DOM references and drag state

**Persistence:**
- User preferences: localStorage via `useStore`
- Form data: Ephemeral (not persisted)

**No Global Store:** Each component fetches own data via React Admin hooks

---

## 6. Features & Functionality

### 6.1 Opportunities Hierarchy (V2)

**Component:** `OpportunitiesHierarchy.tsx`

**Feature:** ARIA tree view with Principal → Customer → Opportunity hierarchy

**User Interactions:**

#### 6.1.1 Expand/Collapse Customer Groups
- **Click:** Customer row to toggle expansion
- **Keyboard:**
  - `ArrowRight` - Expand customer
  - `ArrowLeft` - Collapse customer
  - `Enter` / `Space` - Toggle expansion
- **Auto-expand:** Top 3 customers expanded on initial render

#### 6.1.2 Open Opportunity Details
- **Click:** Opportunity row opens slide-over
- **Keyboard:** `Enter` or `Space` on opportunity row

#### 6.1.3 Health Status Visualization
- **Color Dots:**
  - 🟢 Active (< 7 days since activity)
  - 🟡 Cooling (7-14 days)
  - 🔴 At Risk (> 14 days)

#### 6.1.4 Stage Badges
- Semantic color-coded badges with stage labels
- Pulled from `OPPORTUNITY_STAGES_LEGACY` constant

#### 6.1.5 Empty States
- "Select a principal to view opportunities" (no selection)
- "No opportunities for this principal" (no data)
- "Create Opportunity" CTA button

---

### 6.2 Tasks Panel with Grouping Modes (V2)

**Component:** `TasksPanel.tsx`

**Feature:** Tasks list with 3 grouping modes + "Later" pagination

**User Interactions:**

#### 6.2.1 Grouping Mode Selection
- **Dropdown:** Header select dropdown
- **Modes:**
  1. **Due Date** (default) - Overdue | Today | Tomorrow | This Week | Later
  2. **Priority** - Critical | High | Medium | Low
  3. **Principal** - Alphabetical by principal name
- **Persistence:** Mode saved to localStorage via `usePrefs('taskGrouping')`

#### 6.2.2 Task Completion
- **Click:** Checkbox marks task complete
- **API:** Optimistic update via `useUpdate('tasks')`
- **Feedback:** Success notification + task removed from list

#### 6.2.3 "Later" Bucket Pagination
- **Initially Collapsed:** Shows task count badge
- **Click:** Expand to show first 10 tasks
- **Load More:** "Show next 10" button reveals next 10
- **Infinite Scroll:** Pagination continues until all tasks shown

#### 6.2.4 Priority Badges
- **Color Coding:**
  - Critical - Red (`bg-destructive`)
  - High - Yellow (`bg-warning`)
  - Medium - Accent (`bg-accent`)
  - Low - Muted (`bg-muted`)

#### 6.2.5 Empty State
- "No tasks due" with "Create Task" CTA button

---

### 6.3 Quick Activity Logger (V2)

**Component:** `QuickLogger.tsx`

**Feature:** Inline activity logger with optional follow-up task creation

**User Interactions:**

#### 6.3.1 Activity Type Selection
- **4 Icon Buttons:** Call | Email | Meeting | Note
- **Visual Feedback:** Selected button highlighted (`variant="default"`)
- **Touch Targets:** 44x44px (WCAG AA compliant)

#### 6.3.2 Progressive Disclosure
1. **Initial State:** Activity type, subject, description visible
2. **Principal Selected:** Opportunity dropdown appears
3. **Follow-up Checked:** 3 task fields appear (title, due date, priority)

#### 6.3.3 Form Validation
- **Subject Required:** Cannot submit without subject
- **Follow-up Validation:** If checked, task title + due date required
- **Disabled State:** Form disabled if no principal selected

#### 6.3.4 Activity Creation
- **Single Activity:** Creates activity record
- **Activity + Task:** Creates activity + follow-up task (if checked)
- **API Calls:** Sequential (activity first, then task)
- **Form Behavior:** Clears form but keeps principal selected

#### 6.3.5 Opportunity Linking
- **If opportunity selected:** `activity_type: 'interaction'`
- **If no opportunity:** `activity_type: 'engagement'`

---

### 6.4 Right Slide-Over Panel (V2)

**Component:** `RightSlideOver.tsx`

**Feature:** Right-side overlay with 3 tabs (Details | History | Files)

**User Interactions:**

#### 6.4.1 Opening Slide-Over
- **Click:** Opportunity row in hierarchy
- **Keyboard:** `H` key opens on History tab (if opportunity selected)

#### 6.4.2 Closing Slide-Over
- **Click:** Backdrop or close button
- **Keyboard:** `Esc` key

#### 6.4.3 Details Tab
- **Stage Selector:** Dropdown with optimistic update
- **Priority Badge:** Read-only display
- **Estimated Close Date:** Formatted date (read-only)
- **Customer/Principal Names:** Read-only
- **Latest Notes:** Truncated to 200 chars
- **Metrics:** Days in stage, total interactions

#### 6.4.4 History Tab
- **Activity List:** Sorted DESC by `activity_date`
- **Activity Row:** Type badge | Subject | Timestamp
- **Empty State:** "No activity recorded" with icon

#### 6.4.5 Files Tab
- **Empty State:** "File attachments coming soon" (not implemented)

#### 6.4.6 Tab Persistence
- **localStorage:** Last active tab saved via `usePrefs('rightTab')`
- **Default:** 'details' tab

---

### 6.5 Collapsible Filters Sidebar (V2)

**Component:** `FiltersSidebar.tsx`

**Feature:** Accordion-style collapsible filter panel

**User Interactions:**

#### 6.5.1 Collapse/Expand
- **Click:** Header row with chevron icon
- **Chevron Animation:** Rotates 90° when expanded
- **Persistence:** Collapse state saved via `usePrefs('pd.filtersOpen')`

#### 6.5.2 Health Status Filters
- **Checkboxes:** Active | Cooling | At Risk
- **Multi-select:** Can select multiple statuses
- **Visual Indicators:** Emoji + semantic colors

#### 6.5.3 Stage Filters
- **Checkboxes:** All opportunity stages (2-column grid)
- **Multi-select:** Can select multiple stages
- **Two-Column Layout:** Fits in 18rem sidebar width

#### 6.5.4 Assignee Filter
- **Radio Buttons:** Me | Team (mutually exclusive)
- **Horizontal Layout:** Both options in single row

#### 6.5.5 Last Touch Filter
- **Select Dropdown:** Last 7 days | Last 14 days | Any
- **Single-select:** Only one option at a time

#### 6.5.6 Utilities
- **Checkboxes:**
  - "Show closed opportunities" (includes closed_lost)
  - "Group opportunities by customer" (hierarchy vs flat)

#### 6.5.7 Saved Views
- **Empty State:** "No saved views yet" (placeholder)

---

### 6.6 Resizable Columns (V2)

**Component:** `useResizableColumns` hook

**Feature:** Mouse drag resize for 3-column layout

**User Interactions:**

#### 6.6.1 Drag to Resize
- **Separator Buttons:** 2px vertical bars between columns
- **Cursor:** `cursor-col-resize` on hover
- **Drag:** Click and drag left/right to adjust widths

#### 6.6.2 Constraints
- **Min Width:** 15% per column
- **Max Width:** 70% per column
- **Auto-adjust:** Third column adjusts automatically to maintain 100% sum

#### 6.6.3 Visual Feedback
- **Hover:** Separator changes to `bg-primary`
- **Drag:** Text selection disabled during drag
- **Release:** Widths saved to localStorage

#### 6.6.4 Persistence
- **Storage:** Widths saved via `usePrefs('pd.colWidths')`
- **Default:** `[40, 30, 30]` (Opportunities | Tasks | Quick Logger)

---

### 6.7 Keyboard Shortcuts (V2)

**Global Listeners:** Active when not typing in input/textarea

**Shortcuts:**

| Key | Action | Description |
|-----|--------|-------------|
| `/` | Focus Search | Focus global search input in header |
| `1` | Scroll to Opps | Scroll Opportunities column into view |
| `2` | Scroll to Tasks | Scroll Tasks column into view |
| `3` | Scroll to Logger | Scroll Quick Logger column into view |
| `H` | Open History | Open slide-over on History tab (if opp selected) |
| `Esc` | Close Slide-Over | Close right slide-over panel |

**Implementation:**
- `useEffect` hook in `PrincipalDashboardV2.tsx`
- Event listener on `window` with target type checks
- `scrollIntoView({ behavior: 'smooth' })` for column scrolling

---

### 6.8 User Preferences Persistence (V2)

**Storage:** localStorage via React Admin's `useStore`

**Prefixed Keys:** All keys prefixed with `pd.` (Principal Dashboard namespace)

**Persisted Preferences:**

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pd.colWidths` | `[number, number, number]` | `[40, 30, 30]` | 3-column widths |
| `pd.taskGrouping` | `'due' \| 'priority' \| 'principal'` | `'due'` | Task grouping mode |
| `pd.rightTab` | `'details' \| 'history' \| 'files'` | `'details'` | Last active slide-over tab |
| `pd.filtersOpen` | `boolean` | `true` | Filters sidebar collapsed state |

**Access Pattern:**
```tsx
const [widths, setWidths] = usePrefs<ColWidths>('colWidths', [40, 30, 30]);
```

**Validation:** Values validated on load (e.g., widths sum to 100, constraints enforced)

---

## 7. Dependencies & Libraries

### 7.1 Core Dependencies

#### React & React Admin
- **react:** `^19.0.0` - UI library
- **react-admin:** `^5.0.0` - Admin framework (data provider, hooks, routing)
- **ra-core:** `^5.0.0` - React Admin core (headless)

#### Routing
- **react-router-dom:** `^6.0.0` - Client-side routing

#### UI Components (shadcn/ui)
- **@radix-ui/react-dialog** - Modals, slide-overs
- **@radix-ui/react-select** - Dropdowns
- **@radix-ui/react-checkbox** - Checkboxes
- **@radix-ui/react-radio-group** - Radio buttons
- **@radix-ui/react-collapsible** - Collapsible sections
- **@radix-ui/react-dropdown-menu** - Dropdown menus
- **@radix-ui/react-tabs** - Tabbed interfaces

#### Styling
- **tailwindcss:** `^4.0.0` - Utility-first CSS framework
- **clsx** - Conditional class names
- **tailwind-merge** - Merge Tailwind classes

#### Icons
- **lucide-react** - Icon library (Phone, Mail, Calendar, ChevronRight, etc.)

#### Date Utilities
- **date-fns** - Date parsing, formatting, comparison
  - Used in `taskGrouping.ts` for bucket classification

---

### 7.2 Data Fetching & State Management

#### React Admin Hooks
- `useGetList` - Fetch list of records
- `useGetOne` - Fetch single record
- `useCreate` - Create new record
- `useUpdate` - Update existing record
- `useRefresh` - Trigger data refresh
- `useNotify` - Show notifications
- `useStore` - localStorage persistence
- `useGetIdentity` - Get current user

#### Supabase Client
- **@supabase/supabase-js** - Supabase JavaScript client
- Used by `unifiedDataProvider.ts` to communicate with Supabase

---

### 7.3 Testing Dependencies

#### Unit Testing
- **vitest** - Test runner (Vite-native)
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom matchers

#### E2E Testing
- **playwright** - End-to-end testing framework

---

### 7.4 Development Dependencies

#### TypeScript
- **typescript:** `^5.0.0` - Type safety
- **@types/react** - React type definitions
- **@types/react-dom** - React DOM type definitions

#### Build Tools
- **vite** - Build tool (dev server + bundler)

#### Linting
- **eslint** - Code linting
- **@typescript-eslint/parser** - TypeScript parser for ESLint

---

## 8. Code Quality Analysis

### 8.1 Commented-Out Code

**Issue:** Large blocks of commented-out code create noise and confusion

**Findings:**

#### 8.1.1 FiltersSidebar.tsx (V2)
**Location:** Lines 64-224

**Status:** **CLEAN** - No commented code (current implementation uses Collapsible)

---

#### 8.1.2 PrincipalDashboardV2.tsx (V2)
**Location:** Lines 114-119

**Status:** **CLEAN** - No commented code (grid layout fully implemented)

---

#### 8.1.3 Dashboard.tsx (V0)
**Location:** Entire file (deprecated)

**Status:** **DEPRECATED** - Component not routed, kept for reference

**Recommendation:** Archive to `src/atomic-crm/dashboard/deprecated/` folder

---

### 8.2 Unused Imports

**Tool:** ESLint `no-unused-vars` rule

**Findings:** No significant unused imports detected in active V2 components

**Note:** V0 and Compact components may have unused imports (not actively maintained)

---

### 8.3 Deprecated Patterns

#### 8.3.1 Feature Flag Pattern
**Location:** `PrincipalDashboard.tsx` (V1)

**Pattern:**
```tsx
const isV2Enabled = useFeatureFlag();
if (isV2Enabled) {
  return <PrincipalDashboardV2 />;
}
return <PrincipalDashboard />; // V1
```

**Status:** **DEPRECATED** - V2 is now default at root URL

**Recommendation:** Remove feature flag logic after confirming no users rely on it

---

#### 8.3.2 Dashboard V0 Patterns
**Components:**
- `Dashboard.tsx`
- `OpportunitiesByPrincipal.tsx`
- `MyTasksThisWeek.tsx`
- `ActivityFeed.tsx`
- `PipelineSummary.tsx`
- `UpcomingEventsByPrincipal.tsx`

**Status:** **DEPRECATED** - Not routed

**Recommendation:** Archive to `deprecated/` folder

---

### 8.4 TODO Comments & Incomplete Implementations

#### 8.4.1 DashboardHeader.tsx (V2)
**Location:** Lines 44-54

**TODOs:**
```tsx
const handleNewActivity = () => {
  console.log('TODO: Open new activity modal');
};

const handleNewTask = () => {
  console.log('TODO: Open new task modal');
};

const handleNewOpportunity = () => {
  console.log('TODO: Open new opportunity modal');
};
```

**Recommendation:** Wire up handlers to open respective creation modals

---

#### 8.4.2 TasksPanel.tsx (V2)
**Location:** Line 64

**TODO:**
```tsx
const handleCreateTask = () => {
  console.log('TODO: Open create task modal');
};
```

**Recommendation:** Wire up handler to open task creation modal

---

#### 8.4.3 RightSlideOver.tsx (V2)
**Location:** Files tab (lines 274-279)

**TODO:**
```tsx
<TabsContent value="files">
  <div className="flex flex-col items-center justify-center py-12">
    <FileIcon className="size-12 text-muted-foreground mb-4 opacity-50" />
    <p className="text-muted-foreground">File attachments coming soon</p>
  </div>
</TabsContent>
```

**Recommendation:** Implement file upload/display functionality or remove tab

---

#### 8.4.4 FiltersSidebar.tsx (V2)
**Location:** Saved Views section (lines 184-189)

**TODO:**
```tsx
<div className="space-y-2">
  <h3 className="text-foreground font-semibold text-xs">Saved Views</h3>
  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
    <p className="text-muted-foreground text-xs">No saved views yet</p>
  </div>
</div>
```

**Recommendation:** Implement saved views functionality or remove section

---

### 8.5 Duplicate Code

#### 8.5.1 Activity Type Mapping
**Locations:**
- `QuickLogger.tsx` (V2) - Lines 16-26
- `QuickActivityLoggerWidget.tsx` (V1) - Lines 41-46

**Code:**
```tsx
const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call', icon: Phone, interactionType: 'call' },
  { value: 'email', label: 'Email', icon: Mail, interactionType: 'email' },
  { value: 'meeting', label: 'Meeting', icon: Calendar, interactionType: 'meeting' },
  { value: 'note', label: 'Note', icon: FileText, interactionType: 'check_in' },
];
```

**Recommendation:** Extract to shared constant in `types.ts`

---

#### 8.5.2 Priority Badge Styling
**Locations:**
- `TasksPanel.tsx` (V2) - Lines 129-142
- `PriorityTasksWidget.tsx` (V1) - Lines 29-44

**Code:**
```tsx
const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-warning text-warning-foreground';
    case 'medium': return 'bg-accent text-accent-foreground';
    case 'low': return 'bg-muted text-muted-foreground';
    default: return '';
  }
};
```

**Recommendation:** Extract to shared utility in `utils/priorityBadge.ts`

---

#### 8.5.3 Health Status Indicator
**Locations:**
- `OpportunitiesHierarchy.tsx` (V2) - Lines 122-131
- `PrincipalOpportunitiesWidget.tsx` (V1) - Lines 28-40

**Code:**
```tsx
const getHealthDotColor = (health: HealthStatus): string => {
  switch (health) {
    case 'active': return 'bg-success';
    case 'cooling': return 'bg-warning';
    case 'at_risk': return 'bg-destructive';
  }
};
```

**Recommendation:** Extract to shared utility in `utils/healthIndicator.ts`

---

### 8.6 Migration Artifacts

#### 8.6.1 Compact Grid Components (Unused)
**Files:**
- `CompactGridDashboard.tsx`
- `CompactDashboardHeader.tsx`
- `CompactPrincipalTable.tsx`
- `CompactTasksWidget.tsx`

**Status:** **UNUSED** - Not routed, experimental prototype

**Recommendation:** Archive to `deprecated/` folder

---

#### 8.6.2 V0 Dashboard Components (Deprecated)
**Files:**
- `Dashboard.tsx`
- `OpportunitiesByPrincipal.tsx`
- `OpportunitiesByPrincipalDesktop.tsx`
- `OpportunitiesByPrincipalDesktopContainer.tsx`
- `MyTasksThisWeek.tsx`
- `ActivityFeed.tsx`
- `PipelineSummary.tsx`
- `UpcomingEventsByPrincipal.tsx`

**Status:** **DEPRECATED** - Not routed

**Recommendation:** Archive to `deprecated/` folder

---

### 8.7 Type Safety Issues

#### 8.7.1 Any Types
**Location:** `RightSlideOver.tsx` line 185

**Code:**
```tsx
{opportunities?.map((opp: any) => (
  <SelectItem key={opp.opportunity_id} value={opp.opportunity_id.toString()}>
    {opp.opportunity_name}
  </SelectItem>
))}
```

**Recommendation:** Define proper type for opportunity record

---

#### 8.7.2 Missing Type Exports
**Location:** `types.ts` (root dashboard types)

**Issue:** Types defined but not exported for shared use

**Recommendation:** Export all types explicitly for reuse

---

### 8.8 Performance Concerns

#### 8.8.1 Auto-Refresh (V0)
**Location:** `Dashboard.tsx` line 50

**Code:**
```tsx
useEffect(() => {
  const intervalId = setInterval(() => {
    refresh();
  }, AUTO_REFRESH_INTERVAL);
  return () => clearInterval(intervalId);
}, [refresh]);
```

**Status:** **DEPRECATED** (V0 not routed)

**Note:** V2 does not have auto-refresh (user-initiated only)

---

#### 8.8.2 Client-Side Filtering
**Location:** V2 uses client-side filtering after fetching 500 records

**Code:** `useGetList` with `perPage: 500` then filter in React

**Trade-off:** Acceptable for <500 rows, should move to server-side if data grows

**Recommendation:** Monitor data volume, migrate to server-side filtering if >500 opps

---

## 9. Testing Coverage

### 9.1 Unit Tests

**Framework:** Vitest + React Testing Library

**Location:** `src/atomic-crm/dashboard/__tests__/`

**Test Files:**
1. `ActivityFeed.test.tsx` - Activity feed component
2. `CompactDashboardHeader.test.tsx` - Compact header (unused)
3. `CompactGridDashboard.test.tsx` - Compact grid (unused)
4. `CompactPrincipalTable.test.tsx` - Compact table (unused)
5. `CompactTasksWidget.test.tsx` - Compact tasks (unused)
6. `LogActivityStep.test.tsx` - Activity logging step
7. `MyTasksThisWeek.test.tsx` - Tasks widget (V0)
8. `OpportunitiesByPrincipalDesktop.test.tsx` - Opportunities desktop (V0)
9. `PipelineSummary.test.tsx` - Pipeline summary (V0)
10. `PrincipalCard.test.tsx` - Principal card component
11. `PrincipalDashboard.test.tsx` - V1 dashboard
12. `PriorityIndicator.test.tsx` - Priority badge component
13. `QuickCompleteTaskModal.test.tsx` - Task completion modal
14. `UpdateOpportunityStep.test.tsx` - Opportunity update step

**Total:** 17 test files (most for V0/Compact components)

---

### 9.2 V2 Component Tests (Missing)

**Components Lacking Tests:**
- `PrincipalDashboardV2.tsx` ❌
- `DashboardHeader.tsx` ❌
- `FiltersSidebar.tsx` ❌
- `OpportunitiesHierarchy.tsx` ❌
- `TasksPanel.tsx` ❌
- `QuickLogger.tsx` ❌
- `RightSlideOver.tsx` ❌

**Hooks Tests:**
- `useFeatureFlag.test.ts` ✅ (exists)
- `usePrefs.test.ts` ✅ (exists)
- `useResizableColumns.test.ts` ✅ (exists)

**Utility Tests:**
- `taskGrouping.test.ts` ✅ (exists)

**Coverage Estimate:** ~30% for V2 components (hooks/utils covered, components missing)

**Recommendation:** Add component tests for V2 before deprecating V1

---

### 9.3 E2E Tests

**Framework:** Playwright

**Location:** `tests/e2e/`

**Dashboard-Related E2E Tests:**
1. **Dashboard V2 - Activity Logging** (`tests/e2e/dashboard-v2-activity-logging.spec.ts`)
   - Log activity with follow-up task
   - Verify activity appears in slide-over history
   - Verify task appears in tasks panel

2. **Dashboard V2 - Keyboard Navigation** (`tests/e2e/dashboard-v2-keyboard-nav.spec.ts`)
   - Test `/` to focus search
   - Test `1`, `2`, `3` to scroll columns
   - Test `H` to open history tab
   - Test `Esc` to close slide-over

3. **Dashboard V2 - Accessibility** (`tests/e2e/dashboard-v2-a11y.spec.ts`)
   - Axe scan for WCAG violations
   - Keyboard navigation (Tab, Enter, Arrow keys)
   - Screen reader labels (ARIA attributes)

**Coverage:** Core user journeys tested, but not comprehensive

**Recommendation:** Add E2E tests for:
- Resizable columns
- Filter sidebar
- Task grouping modes
- Opportunity hierarchy expand/collapse

---

### 9.4 Test Coverage Gaps

#### 9.4.1 High Priority
- **V2 Component Tests:** All 6 components need unit tests
- **User Preference Persistence:** Test localStorage save/load
- **Filter Sidebar Logic:** Test filter state updates
- **Resizable Columns:** Test drag constraints and persistence

#### 9.4.2 Medium Priority
- **E2E:** Resizable columns drag interaction
- **E2E:** Filter sidebar UI interactions
- **E2E:** Task grouping mode switching
- **Integration:** Database view queries (principal_opportunities, priority_tasks)

#### 9.4.3 Low Priority
- **V1/V0 Components:** Legacy code, lower priority
- **Compact Components:** Unused, skip tests

**Target Coverage:** 70% minimum (currently ~30% for V2)

---

## 10. Technical Notes & Patterns

### 10.1 Important Architectural Decisions

#### 10.1.1 Desktop-First Responsive Design
**Decision:** Optimize for 1440px+ screens, gracefully degrade for tablet/mobile

**Rationale:**
- Primary user base uses desktop (sales reps at desks)
- Complex 3-column layout requires horizontal space
- Touch-friendly iPad support (768px+) as secondary target

**Trade-offs:**
- Mobile experience limited (columns stack vertically)
- Some features hidden on mobile (estimated close date, etc.)

**Reference:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-13-principal-dashboard-v2.md`

---

#### 10.1.2 Client-Side Filtering (500 Record Limit)
**Decision:** Fetch 500 records, filter client-side in React

**Rationale:**
- Simplifies implementation (no backend filter changes)
- Fast UX (no network latency for filter changes)
- Acceptable for MVP with <500 opportunities per principal

**Trade-offs:**
- Performance degrades if >500 records
- Network overhead (fetch all records, discard filtered)

**Migration Path:** Move to server-side filtering if data volume exceeds 500

**Reference:** Filter state managed in `PrincipalDashboardV2.tsx` state

---

#### 10.1.3 CSS Grid Parent Control for Sidebar Collapse
**Decision:** Use CSS Grid `gridTemplateColumns` to control sidebar width (not Tailwind classes)

**Rationale:**
- True 0px width when collapsed (no residual spacing)
- Single source of truth for layout (grid parent controls children)
- Avoids Tailwind class conflicts (w-0 vs w-72)

**Implementation:**
```tsx
<div
  className="grid h-full"
  style={{
    gridTemplateColumns: '18rem 1fr', // Sidebar 18rem, content 1fr
    gap: '24px',
  }}
>
  <FiltersSidebar /> {/* Truly collapses to 0px when closed */}
  <div>{/* 3-column content */}</div>
</div>
```

**Reference:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-14-dashboard-desktop-density-IMPLEMENTATION.md`

---

#### 10.1.4 Moderate Density (25% Spacing Reduction)
**Decision:** Reduce padding/gaps by 25% from V1 to V2

**Rationale:**
- Fit more content on screen (especially with sidebar open)
- Desktop users prefer denser layouts (power users)
- Still meets WCAG AA (44px touch targets maintained)

**Before/After:**
- Padding: 24px → 12px (`p-6` → `p-3`)
- Gaps: 24px → 12px (`gap-6` → `gap-3`)
- Touch targets: 44px unchanged (`h-11`)

**Reference:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-14-dashboard-desktop-density-IMPLEMENTATION.md`

---

### 10.2 Performance Optimizations

#### 10.2.1 Auto-Expand Top 3 Customers Only
**Component:** `OpportunitiesHierarchy.tsx`

**Optimization:** Only expand top 3 customer groups on initial render

**Rationale:** Avoid rendering all opportunities at once (performance + UX)

**Code:**
```tsx
useEffect(() => {
  if (customerGroups.length > 0 && expandedCustomers.size === 0) {
    const topThree = new Set(
      customerGroups.slice(0, 3).map((group) => group.customerId)
    );
    setExpandedCustomers(topThree);
  }
}, [customerGroups, expandedCustomers.size]);
```

---

#### 10.2.2 "Later" Bucket Pagination
**Component:** `TasksPanel.tsx`

**Optimization:** Load 10 tasks at a time in "Later" bucket (infinite scroll pattern)

**Rationale:** Avoid rendering 100+ low-priority tasks at once

**Code:**
```tsx
const tasksToShow = isLaterGroup
  ? laterExpanded
    ? group.tasks.slice(0, laterPage * 10)
    : []
  : group.tasks;
```

---

#### 10.2.3 React Admin Conditional Fetching
**Pattern:** `enabled` option in `useGetList` to prevent unnecessary queries

**Example:**
```tsx
const { data } = useGetList('principal_opportunities', {
  filter: selectedPrincipalId ? { principal_id: selectedPrincipalId } : {},
  // ...
}, {
  enabled: !!selectedPrincipalId, // Only fetch if principal selected
});
```

**Rationale:** Avoid fetching data when filters are incomplete (no principal selected)

---

### 10.3 Known Issues & Limitations

#### 10.3.1 Feature Flag No Longer Needed
**Issue:** `useFeatureFlag()` checks `?layout=v2` query param, but V2 is now default

**Impact:** Low (still functional, but unnecessary)

**Recommendation:** Remove feature flag logic from `PrincipalDashboard.tsx` after migration period

---

#### 10.3.2 TODO Handlers in DashboardHeader
**Issue:** "New" dropdown handlers are console.log placeholders

**Impact:** Medium (feature not functional)

**Recommendation:** Wire up handlers to open creation modals

---

#### 10.3.3 Files Tab Not Implemented
**Issue:** Right slide-over "Files" tab shows empty state

**Impact:** Low (not core feature)

**Recommendation:** Implement file upload or remove tab

---

#### 10.3.4 Saved Views Not Implemented
**Issue:** Filter sidebar "Saved Views" section is placeholder

**Impact:** Low (not core feature)

**Recommendation:** Implement saved views or remove section

---

#### 10.3.5 Client-Side Filtering Scalability
**Issue:** Fetches 500 records, filters client-side (performance degrades if >500)

**Impact:** Low (acceptable for MVP)

**Recommendation:** Monitor data volume, migrate to server-side filtering if needed

---

### 10.4 Migration Considerations (V1 → V2)

#### 10.4.1 Route Changes
- **V1:** `/dashboard` (custom route)
- **V2:** `/` (default dashboard)

**Impact:** Users bookmarking `/dashboard` still access V1

**Migration Path:**
1. Deprecate `/dashboard` route after transition period
2. Redirect `/dashboard` → `/` (root)

---

#### 10.4.2 Layout Differences
- **V1:** 3-column equal-width grid (1:1:1)
- **V2:** 3-column resizable (40:30:30 default)

**Impact:** Users accustomed to V1 layout need to adjust

**Migration Path:** User preferences stored separately (`pd.colWidths`), no data loss

---

#### 10.4.3 Feature Additions in V2
- **Resizable columns** (new)
- **Collapsible filters sidebar** (new)
- **ARIA tree hierarchy** (new)
- **Right slide-over** (new)
- **Keyboard shortcuts** (new)

**Impact:** Users gain new features, no feature loss

---

#### 10.4.4 Data Consistency
- **V1:** Uses `principal_opportunities` and `priority_tasks` views
- **V2:** Uses same views

**Impact:** No data migration needed, same database views

---

## 11. Routing & Integration

### 11.1 Dashboard Registration in CRM.tsx

**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/root/CRM.tsx`

**Imports:**
```tsx
import { CompactGridDashboard } from "../dashboard/CompactGridDashboard";
import { PrincipalDashboard } from "../dashboard/PrincipalDashboard";
import { PrincipalDashboardV2 } from "../dashboard/v2";
```

**Default Dashboard (Root URL `/`):**
```tsx
<Admin
  // ...
  dashboard={PrincipalDashboardV2} // V2 is default
  // ...
>
```

**Custom Routes:**
```tsx
<CustomRoutes>
  <Route path="/dashboard" element={<PrincipalDashboard />} /> {/* V1 legacy route */}
  <Route path={SettingsPage.path} element={<SettingsPage />} />
  <Route path="/reports" element={<ReportsPage />} />
</CustomRoutes>
```

**Summary:**
- **Root URL `/`** → `PrincipalDashboardV2` (V2)
- **Custom Route `/dashboard`** → `PrincipalDashboard` (V1)
- **CompactGridDashboard** → Not routed (unused)
- **Dashboard (V0)** → Not routed (deprecated)

---

### 11.2 URL Patterns

| URL | Component | Version | Status |
|-----|-----------|---------|--------|
| `/` | `PrincipalDashboardV2` | V2 | Active |
| `/dashboard` | `PrincipalDashboard` | V1 | Legacy |
| `/dashboard?layout=v2` | `PrincipalDashboardV2` | V2 | Feature flag override |

**Feature Flag Behavior:**
- `PrincipalDashboard.tsx` (V1) checks `useFeatureFlag()`
- If `?layout=v2` present, renders `PrincipalDashboardV2` instead

**Example:**
- User visits `/dashboard` → V1 by default
- User visits `/dashboard?layout=v2` → V2 via feature flag
- User visits `/` → V2 always (ignores feature flag)

---

### 11.3 Navigation Integration

**Sidebar Navigation:**
- Located in `/home/krwhynot/projects/crispy-crm/src/components/admin/app-sidebar.tsx`
- "Dashboard" link points to `/` (root URL, V2)

**Breadcrumbs (V2):**
- `DashboardHeader.tsx` includes breadcrumb navigation
- Home → Principals → [Selected Principal Name]
- Clicking breadcrumbs uses React Router `navigate()`

---

### 11.4 Authentication Integration

**Auth Provider:** Supabase Auth Provider

**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts`

**Dashboard Access:**
- All dashboard routes require authentication (`requireAuth` prop on `<Admin>`)
- Unauthenticated users redirected to `/login` (StartPage)

**User Identity:**
- `useGetIdentity()` hook provides current user info
- Used in `QuickLogger.tsx` to set `sales_id` for follow-up tasks

---

## 12. Migration Guide

### 12.1 From V1 to V2

**For Users:**

#### 12.1.1 Layout Changes
- **V1:** 3 equal-width columns
- **V2:** 3 resizable columns (40/30/30 default)
- **Action:** Drag separator bars to adjust widths (persisted to localStorage)

#### 12.1.2 New Features
- **Filters Sidebar:** Collapsible filter panel on left
- **Opportunities Hierarchy:** Expandable customer groups
- **Right Slide-Over:** Click opportunity to view details/history
- **Keyboard Shortcuts:** `/, 1, 2, 3, H, Esc` for power users

#### 12.1.3 Removed Features
- **Activity History Dialog:** Replaced by slide-over "History" tab (scoped to opportunity, not principal)

---

### 12.2 For Developers

#### 12.2.1 Component Migration Path

**If Extending V2 Dashboard:**
1. **Add New Column:** Modify `PrincipalDashboardV2.tsx` grid layout
2. **Add New Filter:** Update `FiltersSidebar.tsx` and `FilterState` type
3. **Add New Tab:** Update `RightSlideOver.tsx` tab list
4. **Add New Keyboard Shortcut:** Update `PrincipalDashboardV2.tsx` keyboard listener

**If Creating New Dashboard:**
1. Create new component in `src/atomic-crm/dashboard/`
2. Export from `index.ts`
3. Register in `CRM.tsx` as custom route or default dashboard

---

#### 12.2.2 Database View Usage

**Pattern:** Use React Admin `useGetList` with view name

**Example:**
```tsx
const { data, isLoading } = useGetList<PrincipalOpportunity>(
  'principal_opportunities', // View name
  {
    filter: { principal_id: selectedPrincipalId },
    sort: { field: 'last_activity', order: 'DESC' },
    pagination: { page: 1, perPage: 500 },
  }
);
```

**Available Views:**
- `principal_opportunities` - Opportunities with customer + health status
- `priority_tasks` - Tasks with principal info
- `dashboard_principal_summary` - Principal metrics (unused)

---

#### 12.2.3 Adding New Preferences

**Pattern:** Use `usePrefs` hook with prefixed key

**Example:**
```tsx
const [myPref, setMyPref] = usePrefs<string>('myFeature.setting', 'default');
```

**Key Prefix:** Automatically prefixed with `pd.` (e.g., `pd.myFeature.setting`)

**Storage:** localStorage via React Admin's `useStore`

---

#### 12.2.4 Styling Guidelines

**Always:**
- Use semantic color variables (`--primary`, `--success`, etc.)
- Use semantic spacing tokens (`var(--spacing-edge-desktop)`)
- Include ARIA attributes for accessibility
- Ensure 44px minimum touch targets

**Never:**
- Use hex colors (`#000000`, `#ffffff`)
- Use inline CSS variables (`style={{ backgroundColor: 'var(--brand-700)' }}`)
- Use hardcoded pixel values (`px-16`, `py-24`)

**Validation:** Run `npm run validate:colors` before committing

---

### 12.3 Migration Checklist

**For Team Lead:**
- [ ] Announce V2 as default dashboard to users
- [ ] Monitor usage metrics for V1 `/dashboard` route
- [ ] Set deprecation timeline for V1 (e.g., 30 days)
- [ ] Update user documentation / training materials
- [ ] Create redirect from `/dashboard` → `/` after transition period

**For Developers:**
- [ ] Add component tests for V2 components (currently missing)
- [ ] Wire up TODO handlers (DashboardHeader "New" dropdown, etc.)
- [ ] Implement or remove empty state features (Files tab, Saved Views)
- [ ] Extract duplicate code (activity types, priority badges, health indicators)
- [ ] Archive V0 and Compact components to `deprecated/` folder
- [ ] Update database view permissions if needed (RLS policies)

**For QA:**
- [ ] Test all V2 features (resize, filters, keyboard shortcuts, slide-over)
- [ ] Verify accessibility (Axe scan, keyboard nav, screen reader)
- [ ] Test edge cases (no principal selected, no data, 500+ opportunities)
- [ ] Verify user preferences persist across sessions
- [ ] Test on all supported viewports (1440px, 768px, 375px)

---

## Appendix: File Locations Reference

### Key Documentation Files
- **Migration Guide:** `/home/krwhynot/projects/crispy-crm/docs/dashboard-v2-migration.md`
- **V2 Implementation Plan:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-13-principal-dashboard-v2.md`
- **V2 Planning Doc:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-13-principal-dashboard-v2-PLANNING.md`
- **Desktop Density Implementation:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-14-dashboard-desktop-density-IMPLEMENTATION.md`
- **Spacing System Design:** `/home/krwhynot/projects/crispy-crm/docs/plans/2025-11-08-spacing-layout-system-design.md`
- **Color System Architecture:** `/home/krwhynot/projects/crispy-crm/docs/internal-docs/color-theming-architecture.docs.md`

### Key Source Files (V2)
- **Main Layout:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`
- **Components:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/components/`
- **Hooks:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/hooks/`
- **Utilities:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/utils/`
- **Types:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v2/types.ts`

### Database Migrations
- **principal_opportunities view:** `supabase/migrations/20251113235406_principal_opportunities_view.sql`
- **priority_tasks view:** `supabase/migrations/20251114001720_priority_tasks_view.sql`
- **dashboard_principal_summary view:** `supabase/migrations/20251106190107_create_dashboard_principal_summary_view.sql`

### Configuration Files
- **Routing:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/root/CRM.tsx`
- **Exports:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/index.ts`
- **Styling:** `/home/krwhynot/projects/crispy-crm/src/index.css`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-14
**Maintainer:** Atomic CRM Development Team
**Status:** Complete & Up-to-Date
