# P3 Widget Consolidation Analysis

**Date**: November 13, 2025
**Session**: 7 - P3 Implementation
**Status**: Analysis Complete

## Overview

This document analyzes consolidation opportunities for dashboard widgets as part of P3 (UX, Consolidation & Behavior) work. The goal is to reduce duplication, improve maintainability, and ensure consistent UX patterns across the dashboard.

## Activity Feed Consolidation

### Current State

Three activity feed implementations exist:

#### 1. RecentActivityFeed.tsx (Active - Sidebar)
- **Location**: Dashboard.tsx, PrincipalDashboard.tsx sidebar
- **Items**: 7 activities from last 7 days
- **Data**: `useGetList('activities')` with `created_at_gte` filter
- **Layout**: Icon | Principal Name | Timestamp
- **Wrapper**: DashboardWidget
- **Styling**: Uppercase header, compact 32px rows, semantic spacing
- **Features**: Navigate to `/activities/{id}` on click
- **Test Coverage**: ✅ RecentActivityFeed.test.tsx

#### 2. CompactRecentActivity.tsx (Active - Compact Grid)
- **Location**: CompactGridDashboard.tsx
- **Items**: 4 activities from last 7 days
- **Data**: `useGetList('activities')` with `'created_at@gte'` filter (PostgREST syntax)
- **Layout**: Icon | Notes/Title | Relative Time
- **Wrapper**: Plain div
- **Styling**: Title with icon, compact spacing
- **Features**: "View all activities →" link when >= 4 items
- **Test Coverage**: ❌ None

#### 3. RecentActivities.tsx (Archived - Legacy)
- **Location**: archive/dashboard/
- **Items**: 10 activities, no date filter
- **Data**: Two queries - `activities` + `sales` (for user names)
- **Layout**: Icon | User Name | Type | Description | Time
- **Wrapper**: DashboardWidget with title prop
- **Styling**: Bordered cards, full details, keyboard nav
- **Features**: Full accessibility (aria-labels, keyboard support)
- **Test Coverage**: ❌ None

### Shared Patterns

All implementations share:
- `useGetList` for data fetching
- Activity icon display (via `getActivityIcon()`)
- Navigation to activity details
- Loading/empty/error states
- Semantic spacing tokens

### Key Differences

| Feature | RecentActivityFeed | CompactRecentActivity | RecentActivities (Archived) |
|---------|-------------------|----------------------|---------------------------|
| Item Count | 7 | 4 | 10 |
| Data Field | `principal_name` | `notes` | User name lookup |
| Filter | `created_at_gte` | `'created_at@gte'` | `"deleted_at@is": null` |
| Wrapper | DashboardWidget | Plain div | DashboardWidget |
| "View All" Link | ❌ | ✅ | ❌ |
| User Names | ❌ | ❌ | ✅ (separate query) |
| Accessibility | Basic | Basic | Full (keyboard, aria) |

### Consolidation Recommendation: **PROCEED**

**Benefits:**
- Reduce 3 implementations to 1
- Centralize loading/error/empty state logic
- Consistent styling and UX patterns
- Shared test coverage
- Easier maintenance

**Proposed API:**

```typescript
interface ActivityFeedProps {
  variant: 'compact' | 'sidebar' | 'full';
  maxItems?: number; // Default: 4 for compact, 7 for sidebar, 10 for full
  showViewAllLink?: boolean; // Default: true for compact
  showUserNames?: boolean; // Default: false (requires extra query)
  dateRangeFilter?: 'last7days' | 'all'; // Default: 'last7days'
  title?: string; // Override default title
  wrapper?: 'widget' | 'none'; // Default: 'widget'
}
```

**Variant Mappings:**
- `compact` → CompactRecentActivity style (4 items, notes field, "View all" link)
- `sidebar` → RecentActivityFeed style (7 items, principal names, no link)
- `full` → RecentActivities style (10 items, user names, full details)

**Implementation Plan:**
1. Create new `ActivityFeed.tsx` component with variant support
2. Extract shared data fetching logic
3. Implement variant-specific rendering
4. Add comprehensive tests
5. Migrate consumers to new component
6. Archive old implementations

## Task Widget Consolidation

### Current State

Three task widget implementations exist:

#### 1. MyTasksThisWeek.tsx (Active - Sidebar)
- **Location**: Dashboard.tsx, PrincipalDashboard.tsx sidebar
- **Data Pattern**: Fetches own data via `useGetList`
- **Items**: Up to 50 incomplete tasks due this week
- **Grouping**: By urgency (OVERDUE → TODAY → THIS WEEK)
- **Filter**: `completed: false, due_date_lte: endOfWeekStr, sales_id: identity?.id`
- **Layout**: Grouped sections with 32px rows
- **Wrapper**: DashboardWidget
- **Features**:
  - Inline checkbox (hidden until hover)
  - Semantic color badges (destructive/warning/muted)
  - Section headers for each group
  - Navigate to `/tasks/{id}`
- **Test Coverage**: ❌ None

#### 2. CompactTasksWidget.tsx (Active - Compact Grid)
- **Location**: CompactGridDashboard.tsx
- **Data Pattern**: Props-based (receives `tasks` array)
- **Items**: 4 tasks maximum
- **Grouping**: None (flat list)
- **Filter**: None (pre-filtered by parent)
- **Layout**: Simple checkbox + title + priority indicator
- **Wrapper**: Plain div
- **Features**:
  - "View all tasks →" link when > 4 items
  - Priority indicator (red "!" for high priority)
  - No date filtering or grouping
- **Test Coverage**: ❌ None

#### 3. OverdueTasks.tsx (Archived - Legacy)
- **Location**: archive/dashboard/
- **Data Pattern**: Fetches own data via `useGetList`
- **Items**: Count only (no list display)
- **Grouping**: N/A (metric display)
- **Filter**: `"completed_at@is": null, "due_date@lt": startOfTodayISO`
- **Layout**: Large number (4xl-6xl font) + descriptive text
- **Wrapper**: DashboardWidget
- **Features**:
  - Red styling when count > 0
  - "Action Required" badge
  - AlertTriangle icon
- **Test Coverage**: ❌ None

### Key Differences

| Feature | MyTasksThisWeek | CompactTasksWidget | OverdueTasks (Archived) |
|---------|----------------|-------------------|------------------------|
| Purpose | Full task list | Compact preview | Metric display |
| Data Pattern | Fetches own | Props-based | Fetches own |
| Display | List with grouping | Flat list | Count only |
| Item Count | Up to 50 | 4 max | N/A (count) |
| Grouping | ✅ By urgency | ❌ None | N/A |
| User Filtering | ✅ By sales_id | ❌ Parent filters | ❌ All users |
| Wrapper | DashboardWidget | Plain div | DashboardWidget |

### Consolidation Recommendation: **LIMITED - Extract Hooks Only**

**Analysis:**

These are fundamentally different widget types serving distinct use cases:

1. **MyTasksThisWeek** = Full-featured task list with grouping, filtering, and urgency display
2. **CompactTasksWidget** = Reusable display component (no data fetching, props-based)
3. **OverdueTasks** = Metric widget (count display, no list)

**Why Full Consolidation is Not Recommended:**

- Different UX patterns (list vs metric)
- Different data patterns (fetch vs props vs count-only)
- Different complexity levels (grouped vs flat vs numeric)
- Forcing variants would create "Franken-component" with too many props

**Alternative Approach - Shared Logic Extraction:**

Instead of consolidating components, extract shared logic into reusable hooks:

```typescript
// Custom hooks for shared logic
export function useTasksThisWeek(userId: string) {
  // Encapsulates filtering, grouping logic
}

export function useOverdueTasks(userId?: string) {
  // Encapsulates overdue filtering
}

export function groupTasksByUrgency(tasks: Task[], todayStr: string) {
  // Shared grouping logic
}
```

**Benefits of This Approach:**
- Preserve distinct UX patterns for different contexts
- Share filtering and grouping logic
- Maintain component simplicity
- Avoid prop explosion
- Better testability (test hooks independently)

**Implementation Plan:**
1. Extract `useTasksThisWeek` hook from MyTasksThisWeek.tsx
2. Extract `groupTasksByUrgency` utility function
3. Add tests for shared hooks/utilities
4. Keep components separate with their distinct UX patterns
5. Document usage patterns for each widget type

## Quick-Action Flows Analysis

### Current State

Two quick-action modal flows exist:

#### 1. QuickLogActivity.tsx
- **Trigger**: "Quick Log" button in Dashboard and CompactGridDashboard
- **Flow**: Single-step modal for logging activity
- **Current State**: ⚠️ Handler not fully wired
- **Location**: `Dashboard.tsx.handleQuickLogActivity` (line 97)
- **Issue**: Currently shows placeholder - needs real dataProvider integration

#### 2. QuickCompleteTaskModal.tsx
- **Trigger**: Task completion action
- **Flow**: Multi-step modal (LOG_ACTIVITY → UPDATE_OPPORTUNITY → SUCCESS)
- **Current State**: ⚠️ Error handling needs validation
- **Steps**:
  1. Log Activity (task completion details)
  2. Update Opportunity (optional stage progression)
  3. Success (confirmation + summary)
- **Issue**: Rollback behavior on RPC errors needs E2E validation

### Implementation Plan

#### Task 5: Wire Quick-Log Activity Flow

**Requirements:**
- Complete `Dashboard.tsx.handleQuickLogActivity` implementation
- Call real dataProvider methods (not placeholder)
- Wire CompactGridDashboard.tsx quick-log events
- Add error handling and user feedback
- Test end-to-end workflow

**Files to Modify:**
- `src/atomic-crm/dashboard/Dashboard.tsx` (line 97)
- `src/atomic-crm/dashboard/CompactGridDashboard.tsx` (event handlers)
- `src/atomic-crm/dashboard/QuickActionModals/QuickLogActivity.tsx` (if needed)

#### Task 6: Validate Multi-Step Modal Workflows

**Requirements:**
- Test QuickCompleteTaskModal complete flow
- Verify intermediate state transitions (LOG_ACTIVITY → UPDATE_OPPORTUNITY → SUCCESS)
- Validate rollback on RPC errors
- Test error recovery and user feedback
- Add E2E test coverage

**Files to Verify:**
- `src/atomic-crm/dashboard/QuickCompleteTaskModal.tsx`
- Test all three steps independently
- Test error scenarios (network failure, validation errors, RPC errors)

## Summary

### Proceed with Implementation

**Activity Feed Consolidation** ✅
- Strong consolidation opportunity
- High benefit-to-effort ratio
- Reduces 3 implementations to 1
- Improves maintainability significantly

### Extract Hooks Only

**Task Widget Logic Sharing** ⚙️
- Limited consolidation value
- Keep distinct components for different UX patterns
- Extract shared hooks and utilities
- Maintain component simplicity

### Wire and Validate

**Quick-Action Flows** 🔌
- Complete quick-log activity handler wiring
- Validate multi-step modal error handling
- Add E2E test coverage
- Ensure production-ready error recovery

## Next Steps

1. ✅ Analysis complete - documented in this file
2. ⏭️ Proceed with Activity Feed consolidation (high value)
3. ⏭️ Extract task widget hooks (moderate value)
4. ⏭️ Wire quick-action flows (unblock users)
5. ⏭️ Validate multi-step modals (production readiness)

**Estimated Effort:**
- Activity Feed Consolidation: 4-6 hours
- Task Widget Hook Extraction: 2-3 hours
- Quick-Action Flow Wiring: 2-3 hours
- Multi-Step Modal Validation: 1-2 hours

**Total P3 Effort**: 9-14 hours
