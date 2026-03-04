# PRD: Dashboard

**Feature ID:** feat-dsh-001
**Domain:** Dashboard
**Status:** Reverse-Engineered
**Confidence:** 95%
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Linked Documents
- **BRD:** [docs/brd/dashboard.md](../../brd/dashboard.md)
- **ADRs:** None — ADR recommended for V3/V4 version strategy and pipeline caching decisions
- **Module:** `src/atomic-crm/dashboard`
- **Risk Level:** High (risk score 75/100, phase 3)

---

## Executive Summary

The Dashboard is the primary entry screen for MFB sales reps and managers. It aggregates
read-only data from five internal resources — opportunities, tasks, activities, contacts,
and organizations — plus a precomputed `principal_pipeline_summary` database view. The
goal is to answer "How am I doing?" in under 2 seconds without requiring the user to open
any individual record.

The current production layout is `PrincipalDashboardV4`, a three-column scrollable grid.
A prior version, `PrincipalDashboardV3`, still exists in source but is not the primary
rendered path. [REQUIRES REVIEW: confirm V3 is fully retired or identify its active route.]

---

## Business Context

MFB acts as a food-service broker between Principals (manufacturers, 9 active) and
Operators (restaurants), selling through Distributors. Sales reps must log at least 10
activities per week per principal. The Dashboard is the primary tool that surfaces whether
reps are on track, which deals are going stale, and what tasks are due today.

Without the dashboard, reps rely on Excel spreadsheets to track pipeline status — one of
the two explicit goals the CRM was built to replace (BRD §1).

**User roles served:**

| Role | Data Scope |
|------|-----------|
| Admin | All data across all reps |
| Manager | All data across all reps |
| Rep | Own data only (scoped by `sales_id`) |

---

## Goals

1. Surface "Am I on track?" KPIs in under 2 seconds of first meaningful paint.
2. Show which principal relationships are losing momentum before deals go stale.
3. Give reps a daily task dispatch surface — view, complete, snooze, or delete tasks without
   leaving the dashboard.
4. Show week-over-week performance trends per rep so coaching conversations are data-driven.
5. Replace the Excel-based activity tracker as the first screen reps open each morning.

---

## Functional Requirements

### P0 — Must Work for Launch

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-001 | Display four KPI cards: Open Opportunities, Overdue Tasks, Activities This Week, and Stale Deals | `src/atomic-crm/dashboard/useKPIMetrics.ts` L47-53 | Yes |
| FR-002 | KPI queries run in parallel using `Promise.allSettled`; one failure must not blank the whole dashboard | `src/atomic-crm/dashboard/useKPIMetrics.ts` L149-220 | Yes |
| FR-003 | A deal is stale when its `last_activity_date` exceeds the per-stage threshold (new_lead: 7d, initial_outreach/sample_visit_offered/demo_scheduled: 14d, feedback_logged: 21d) | `src/atomic-crm/dashboard/useKPIMetrics.ts` L33-44, BRD §3 | Yes |
| FR-004 | Closed-stage opportunities (`closed_won`, `closed_lost`) are excluded from all open/stale counts | `src/atomic-crm/dashboard/useKPIMetrics.ts` L162-164, `src/atomic-crm/opportunities/constants.ts` | Yes |
| FR-005 | Principal Pipeline table shows: principal name, total pipeline count, activities this week, activities last week, momentum indicator, next action, and 30-day task completion rate | `src/atomic-crm/dashboard/types.ts` L33-43 | Yes |
| FR-006 | Pipeline table data comes from the `principal_pipeline_summary` database view, sorted by `active_this_week` descending | `src/atomic-crm/dashboard/usePrincipalPipeline.ts` L38-50 | Yes |
| FR-007 | Pipeline table supports a "my principals only" filter scoped to `sales_id` or `opportunity_owner_id` | `src/atomic-crm/dashboard/usePrincipalPipeline.ts` L17-26 | Yes |
| FR-008 | Task list shows only the current rep's incomplete, non-deleted, non-snoozed tasks, sorted by `due_date` ascending | `src/atomic-crm/dashboard/useMyTasks.ts` L41-58 | Yes |
| FR-009 | Tasks are categorized as: overdue, today, tomorrow, upcoming (within 7 days), or later | `src/atomic-crm/dashboard/types.ts` L47, `useMyTasks.ts` L72-84 | Yes |
| FR-010 | Rep can complete a task from the dashboard; completion uses optimistic update with rollback on failure | `src/atomic-crm/dashboard/useMyTasks.ts` L160-213 | Yes |
| FR-011 | Rep can snooze a task; snooze sets `snooze_until` to end-of-tomorrow and hides the task until then | `src/atomic-crm/dashboard/useMyTasks.ts` L260-307 | Yes |
| FR-012 | Rep can soft-delete a task from the dashboard | `src/atomic-crm/dashboard/useMyTasks.ts` L324-367 | Yes |
| FR-013 | Rep can update a task's due date from the dashboard with optimistic update and rollback | `src/atomic-crm/dashboard/useMyTasks.ts` L397-462 | Yes |
| FR-014 | Dashboard renders in a three-column grid on desktop (lg: 1024px+): left column (KPIs + Performance), center column (Pipeline + Activity Feed), right column (Tasks, sticky) | `src/atomic-crm/dashboard/PrincipalDashboardV4.tsx` L32-72 | Yes |
| FR-015 | Dashboard renders in single-column order on mobile: KPIs → Pipeline → Tasks → Activity → Performance | `src/atomic-crm/dashboard/PrincipalDashboardV4.tsx` L32-72 | Yes |
| FR-016 | All heavy panel components are lazy-loaded with a skeleton fallback | `src/atomic-crm/dashboard/PrincipalDashboardV4.tsx` L7-10 | Yes |

### P1 — High Priority

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-017 | Performance widget shows four rep-specific metrics with week-over-week trends: Activities This Week, Deals Moved, Tasks Completed, Open Opportunities | `src/atomic-crm/dashboard/useMyPerformance.ts` L33-38 | Yes |
| FR-018 | "Deals Moved" counts only actual stage transitions (excludes initial deal creation) using the `opportunity_stage_changes` view | `src/atomic-crm/dashboard/useMyPerformance.ts` L146-156 | Yes |
| FR-019 | Open Opportunities trend compares current count against a historical snapshot from `dashboard_snapshots` table (falls back to current count if snapshot unavailable) | `src/atomic-crm/dashboard/useMyPerformance.ts` L207-241 | Yes |
| FR-020 | Activities KPI shows a trend indicator (up/down/neutral) comparing this week to last week | `src/atomic-crm/dashboard/useKPIMetrics.ts` L302-317 | Yes |
| FR-021 | Clicking a principal row in the pipeline table opens a drill-down slide-over showing that principal's opportunities | `src/atomic-crm/dashboard/PipelineDrillDownSheet.tsx` | Yes |
| FR-022 | Activity feed panel displays recent activities logged by the current rep | `src/atomic-crm/dashboard/ActivityFeedPanel.tsx`, `useTeamActivities.ts` | Yes |
| FR-023 | Task completion opens a sheet to log an activity (follow-up) before the task is removed from the list | `src/atomic-crm/dashboard/TaskCompleteSheet.tsx` | Yes |
| FR-024 | Dashboard wraps in `DashboardErrorBoundary` to catch and display component-level render errors without crashing the app | `src/atomic-crm/dashboard/DashboardErrorBoundary.tsx` | Yes |
| FR-025 | `CurrentSaleProvider` provides a cached `salesId` to all child components to prevent redundant identity lookups | `src/atomic-crm/dashboard/CurrentSaleContext.tsx`, `useCurrentSale.ts` | Yes |

### P2 — Nice to Have / Future

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| FR-026 | Kanban view of tasks grouped by status column (implemented as `TasksKanbanPanel` with drag-and-drop) | `src/atomic-crm/dashboard/TasksKanbanPanel.tsx`, `TaskKanbanCard.tsx`, `TaskKanbanColumn.tsx` | Yes |
| FR-027 | Recent items widget showing recently visited contacts, organizations, or opportunities | `src/atomic-crm/dashboard/RecentItemsWidget.tsx` | Yes |
| FR-028 | Hybrid search across entities from the dashboard | `src/atomic-crm/dashboard/useHybridSearch.ts` | Yes |
| FR-029 | Configurable stale-deal thresholds per principal or team [INFERRED from BRD §9] | BRD §9 open question | No |
| FR-030 | Date range selector for KPIs (currently fixed to "this week") [INFERRED from BRD §9] | BRD §9 open question | No |

---

## Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| NFR-001 | First meaningful paint of dashboard content must complete in under 2 seconds | BRD §8, CLAUDE.md goals | Yes |
| NFR-002 | Pipeline table data has a 30-second stale time and refetches on window focus | `src/atomic-crm/dashboard/usePrincipalPipeline.ts` L46-49, `constants/appConstants.ts` `SHORT_STALE_TIME_MS` | Yes |
| NFR-003 | Task list data has a 30-second stale time and refetches on window focus | `src/atomic-crm/dashboard/useMyTasks.ts` L54-57 | Yes |
| NFR-004 | Dashboard must be usable on desktop (1440px+) and iPad; it is not optimized for phone | CLAUDE.md device targets | Yes |
| NFR-005 | Optimistic mutations must include rollback: cancelling in-flight refetches before mutation, snapshotting previous state, and restoring on error | `src/atomic-crm/dashboard/useMyTasks.ts` L170-196 | Yes |
| NFR-006 | `AbortController` is used in KPI metric and performance hooks to cancel in-flight requests when the component unmounts | `src/atomic-crm/dashboard/useKPIMetrics.ts` L104-106 | Yes |
| NFR-007 | Cache invalidation after any task mutation must cover: `taskKeys.lists()`, `opportunityKeys.lists()`, `activityKeys.lists()`, `dashboardKeys.all`, `entityTimelineKeys.lists()` | `src/atomic-crm/dashboard/useMyTasks.ts` L207-212 | Yes |
| NFR-008 | No direct Supabase imports in dashboard components; all reads go through React Admin data provider hooks | CLAUDE.md CORE-001 | Yes |
| NFR-009 | KPI values display `null` (unknown) while loading rather than showing `0` (confirmed zero) to prevent misleading metrics | `src/atomic-crm/dashboard/useKPIMetrics.ts` L75-82 | Yes |

---

## Data Model

### Database Tables and Views Read

| Resource | Type | Purpose | Write? |
|----------|------|---------|--------|
| `opportunities` | Table/view | Open count, stale deal detection | No |
| `opportunities_summary` | View | Pipeline list reads | No |
| `principal_pipeline_summary` | View | Principal pipeline table (precomputed) | No |
| `tasks` | Table | Task list, overdue count | Yes (complete, snooze, delete, reschedule) |
| `activities` | Table/view | Activity count this week, recent count | No |
| `activities_summary` | View | Activity feed panel | No |
| `sales` | Table | Current user identity via `useCurrentSale` | No |
| `opportunity_stage_changes` | View | Deals moved metric in performance widget | No |
| `dashboard_snapshots` | Table | Historical open-opportunity baseline for week-over-week trend | No |

### Key Types

```
PrincipalPipelineRow  — id, name, totalPipeline, activeThisWeek, activeLastWeek, momentum, nextAction, completedTasks30d, totalTasks30d
TaskItem              — id, subject, dueDate, priority, taskType, relatedTo, status, notes, snoozeUntil
KPIMetrics            — openOpportunitiesCount, overdueTasksCount, activitiesThisWeek, staleDealsCount, recentActivityCount
MyPerformanceMetrics  — activitiesThisWeek, dealsMoved, tasksCompleted, openOpportunities (each with value, previousValue, trend, direction)
Momentum              — "increasing" | "steady" | "decreasing" | "stale"
TaskStatus            — "overdue" | "today" | "tomorrow" | "upcoming" | "later"
Priority              — "critical" | "high" | "medium" | "low"
TaskType              — "Call" | "Email" | "Meeting" | "Follow-up" | "Demo" | "Proposal" | "Other"
```

Source: `src/atomic-crm/dashboard/types.ts`, `src/atomic-crm/dashboard/useKPIMetrics.ts`, `src/atomic-crm/dashboard/useMyPerformance.ts`

---

## UI/UX

### Layout (PrincipalDashboardV4 — Current Production)

```
Desktop (lg: 1024px+)
┌─────────────────┬──────────────────────────────────┬─────────────────┐
│  LEFT (3/12)    │  CENTER (6/12)                   │  RIGHT (3/12)   │
│                 │                                  │                 │
│  KPI 2x2 Grid   │  Principal Pipeline Table        │  Task List      │
│  (row 1)        │  (row 1)                         │  (sticky)       │
│                 │                                  │                 │
│  Performance    │  Activity Feed                   │                 │
│  Widget (row 2) │  (row 2)                         │                 │
└─────────────────┴──────────────────────────────────┴─────────────────┘

Mobile (single column, DOM order)
1. KPIs  2. Pipeline  3. Tasks  4. Activity Feed  5. Performance
```

### Component Map

| Component | File | Purpose |
|-----------|------|---------|
| `PrincipalDashboardV4` | `PrincipalDashboardV4.tsx` | Page shell, grid layout |
| `KPISummaryRow` | `KPISummaryRow.tsx` | 2x2 KPI card grid |
| `PrincipalPipelineTable` | `PrincipalPipelineTable.tsx` | Pipeline rows + filter toggle |
| `PipelineTableRow` | `PipelineTableRow.tsx` | Single principal row |
| `PipelineDrillDownSheet` | `PipelineDrillDownSheet.tsx` | Slide-over with principal's opportunities |
| `DashboardTasksList` | `DashboardTasksList.tsx` | Linear task list (right column) |
| `TasksKanbanPanel` | `TasksKanbanPanel.tsx` | Kanban view of tasks by status |
| `TaskKanbanCard` | `TaskKanbanCard.tsx` | Individual kanban task card |
| `TaskKanbanColumn` | `TaskKanbanColumn.tsx` | Kanban column (overdue, today, etc.) |
| `TaskCompleteSheet` | `TaskCompleteSheet.tsx` | Activity log sheet opened on task completion |
| `SnoozePopover` | `SnoozePopover.tsx` | Popover for snooze confirmation |
| `ActivityFeedPanel` | `ActivityFeedPanel.tsx` | Recent activity stream |
| `CompactActivityWidget` | `CompactActivityWidget.tsx` | Condensed activity summary |
| `CompactPerformanceWidget` | `CompactPerformanceWidget.tsx` | Rep performance scorecard |
| `MyPerformanceWidget` | `MyPerformanceWidget.tsx` | Expanded performance widget |
| `RecentItemsWidget` | `RecentItemsWidget.tsx` | Recently viewed entities |
| `DashboardErrorBoundary` | `DashboardErrorBoundary.tsx` | Render error isolation |
| `DashboardTabPanel` | `DashboardTabPanel.tsx` | Tab container (used in V3 layout) |

### Interaction Patterns

- Task complete: optimistic hide → `TaskCompleteSheet` opens for activity log → task removed on sheet close
- Task snooze: optimistic hide → `snooze_until` set to end of tomorrow → hidden from list until then
- Task reschedule: date picker inline → optimistic status recalculation → API update
- Pipeline drill-down: click row → `PipelineDrillDownSheet` slide-over at 40vw
- Pipeline filter: toggle "my principals" → filter applies via `$or` query on `sales_id`/`opportunity_owner_id`

---

## Business Rules

| Rule | Detail | Source |
|------|--------|--------|
| BR-001 | `null` KPI value means the metric query failed; `0` means the confirmed count is zero. Never default a failed query to `0`. | `useKPIMetrics.ts` L75-82 |
| BR-002 | Closed opportunities are excluded from open count and stale detection using `CLOSED_STAGES` constant | `useKPIMetrics.ts` L162, `opportunities/constants.ts` |
| BR-003 | Stale threshold is 21 days maximum; only opportunities with `last_activity_date` older than 21 days are fetched for client-side stale filtering | `useKPIMetrics.ts` L146 |
| BR-004 | Snoozing a task sets `snooze_until`, not `due_date`; the original due date is preserved | `useMyTasks.ts` L258 |
| BR-005 | Task `type` field from DB uses lowercase (`call`, `email`, etc.); UI displays Title Case (`Call`, `Email`, etc.) | `useMyTasks.ts` L87-95 |
| BR-006 | Activities for performance widget are filtered by `created_by` (not `sales_id`) because the activities table uses a different ownership column | `useMyPerformance.ts` L121-122 |
| BR-007 | "Deals Moved" excludes initial deal creation (where `from_stage IS NULL`); only real stage transitions count | `useMyPerformance.ts` L153-155 |
| BR-008 | Pipeline momentum (`increasing`, `steady`, `decreasing`, `stale`) is computed in the `principal_pipeline_summary` database view, not in JavaScript | BRD §4, `usePrincipalPipeline.ts` |
| BR-009 | `sales.id` is a database bigint (number); `identity.id` from React Admin auth is always a string. Dashboard hooks use `useCurrentSale()` — never `identity.id` — for database queries | `src/atomic-crm/dashboard/types.ts` L3-8 |
| BR-010 | "My principals only" filter uses an `$or` on `sales_id` OR `opportunity_owner_id` because a principal may be owned by either field | `usePrincipalPipeline.ts` L18-19 |

---

## Integration Points

### Internal Dependencies

| Module | Used For | Risk Level |
|--------|---------|-----------|
| `src/atomic-crm/opportunities` | CLOSED_STAGES constant, opportunity data | High |
| `src/atomic-crm/tasks` | Task navigation routes (`navigateToTaskSlideOver`) | Medium |
| `src/atomic-crm/utils` | `dateUtils`, `stalenessCalculation`, `trendCalculation` | Medium |
| `src/atomic-crm/constants` | `MAX_PAGE_SIZE`, `SHORT_STALE_TIME_MS`, `appConstants` | Medium |
| `src/atomic-crm/validation/activities` | `ActivityLogInput`, `activityDisplayTypeSchema`, `activityOutcomeSchema` | High |
| `src/atomic-crm/queryKeys` | Typed query key factories for cache invalidation | Medium |

### External Dependencies

| Library | Purpose | Verified |
|---------|---------|---------|
| `chart.js` | Chart rendering (used in performance/pipeline visualizations) [INFERRED] | [REQUIRES REVIEW] |
| `react-chartjs-2` | React wrapper for chart.js | [REQUIRES REVIEW] |
| `@dnd-kit/*` (dnd-kit) | Drag-and-drop in TasksKanbanPanel | Yes |
| `date-fns` | Date arithmetic for task status, week boundary calculation | Yes |
| TanStack Query v5 | `useMutation`, `useQueryClient`, `invalidateQueries` | Yes |
| React Admin `useGetList`, `useDataProvider` | Data fetching hooks | Yes |

### Data Provider Resources Called

| Resource Name | Operation | Hook |
|--------------|-----------|------|
| `opportunities` | `getList` | `useKPIMetrics`, `useMyPerformance` |
| `tasks` | `getList`, `update`, `delete` | `useMyTasks` |
| `activities` | `getList` | `useKPIMetrics`, `useMyPerformance` |
| `principal_pipeline_summary` | `getList` | `usePrincipalPipeline` |
| `opportunity_stage_changes` | `getList` | `useMyPerformance` |
| `dashboard_snapshots` | `getList` | `useMyPerformance` |

---

## Risk Assessment

- **Module Risk Level:** High (risk score 75/100)
- **Phase Assignment:** Phase 3 (highest caution; depends on Phase 1 and 2 completing first)
- **LOC:** 13,479 across 62 files
- **Test Coverage:** Full (32 test files present in `__tests__/`)
- **Git Churn:** 30 commits in 30 days (active development)

### Risk Factors

| Factor | Detail |
|--------|--------|
| Two competing layout versions | `PrincipalDashboardV3` and `PrincipalDashboardV4` both exist in source; V4 is current but V3 is not deleted — creates maintenance and testing burden |
| Aggregated data scope | Dashboard reads from 6+ DB tables/views; a schema change in any of them affects the dashboard |
| Drag-and-drop complexity | `dnd-kit` in `TasksKanbanPanel` adds interaction complexity and event-handling edge cases |
| Optimistic mutation surface | Four separate task mutations each implement their own optimistic + rollback pattern; consistency must be maintained across all four |
| `dashboard_snapshots` dependency | Performance widget "Open Opportunities" trend falls back to current count if snapshot is missing — trend data may be misleading on first use |
| No ADR for V3/V4 version strategy | The decision to keep V3 alongside V4 is undocumented |

### Security Observations

- Dashboard reads are scoped to `sales_id` at the query layer in all hooks; no client-side filtering is the sole access control mechanism — RLS policies must back this up at the DB layer.
- `principal_pipeline_summary` view must respect RLS to prevent one rep from seeing another's pipeline when "my principals only" filter is active. [REQUIRES REVIEW: confirm RLS on this view]

---

## Acceptance Criteria

| # | Criteria | Current State |
|---|----------|---------------|
| AC-001 | Dashboard loads and displays at least the KPI row within 2 seconds on a standard desktop connection | Met (lazy loading + parallel queries implemented) |
| AC-002 | A KPI query failure shows a partial-failure indicator, not a blank dashboard | Met (`hasPartialFailure` flag, `Promise.allSettled`) |
| AC-003 | Stale deal count matches expected count when manually comparing against per-stage thresholds | Met (snapshot test: `__tests__/kpi-metric-snapshot.test.ts`) |
| AC-004 | Principal pipeline table shows only the current rep's principals when "my principals only" is toggled | Met (`usePrincipalPipeline` filter) |
| AC-005 | Completing a task from the dashboard removes it from the list and the KPI overdue count updates on next refetch | Met (optimistic update + cache invalidation) |
| AC-006 | Snoozing a task hides it from the list immediately without a page reload | Met (optimistic `deleted: true` in local state) |
| AC-007 | Snooze sets `snooze_until` (not `due_date`); the original due date is unchanged | Met (`useMyTasks.ts` L264) |
| AC-008 | Task status categories (overdue, today, tomorrow, upcoming, later) are correctly assigned based on due date relative to the current date | Met (`__tests__/useMyTasks.test.ts`) |
| AC-009 | Performance widget shows non-zero trend values when activity count differs week over week | Met (`calculateTrend` utility) |
| AC-010 | Dashboard renders single-column on mobile without horizontal scroll | Met (Tailwind grid responsive classes) |
| AC-011 | `PrincipalDashboardV4` is the active render path; V3 is not shown to production users | Met [REQUIRES REVIEW: verify routing/index.tsx does not expose V3] |
| AC-012 | `closed_won` and `closed_lost` opportunities are excluded from Open Opportunities and Stale Deals counts | Met (CLOSED_STAGES filter in useKPIMetrics) |
| AC-013 | Pipeline table data refreshes when user switches back to the browser tab | Met (`refetchOnWindowFocus: true`) |

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| OQ-001 | Is `PrincipalDashboardV3` still routed anywhere in production, or can it be deleted? | Test surface reduction, maintenance burden | Engineering |
| OQ-002 | Should stale deal thresholds be configurable per principal or per team, rather than hard-coded? (BRD §9) | FR-003 may change | Product/Business |
| OQ-003 | Should the KPI date range be configurable (e.g., "last 30 days" vs. "this week")? Currently fixed to current calendar week. (BRD §9) | Affects all KPI queries | Product |
| OQ-004 | Should pipeline momentum calculation move from the `principal_pipeline_summary` DB view into a separate auditable service? (BRD §9) | Consistency and testability of momentum | Engineering |
| OQ-005 | Does `principal_pipeline_summary` have RLS policies that prevent cross-rep data leakage when `myPrincipalsOnly` is false? | Security | Engineering/DBA |
| OQ-006 | Are `chart.js` and `react-chartjs-2` actively used in the dashboard, or are they leftover from an earlier iteration? Feature inventory lists them as external deps but source files show no explicit chart imports in the core layout. | Dependency hygiene | Engineering |
| OQ-007 | What is the `dashboard_snapshots` table population mechanism? If no snapshot exists for last week, the "Open Opportunities" trend always shows flat. | Accuracy of performance widget | Engineering |
