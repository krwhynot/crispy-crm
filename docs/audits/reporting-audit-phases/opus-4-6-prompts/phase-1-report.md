# Phase 1: Reporting Discovery & Lineage Inventory

**Auditor:** Claude Opus 4.6
**Date:** 2026-02-10
**Mode:** Read-only audit (PLAN MODE)
**Scope:** Dashboard widgets + Reports & Analytics page (Round 1)
**Localhost:** http://localhost:5173
**REF_MCP_UNAVAILABLE:** Ref MCP not available; fallback web-search references used.

---

## 1) Scope Confirmation

**Round 1 Scope:**
- Dashboard: KPI Summary Row (4 cards), Pipeline by Principal table, My Tasks kanban, My Performance widget, Team Activity feed, Recently Viewed
- Reports & Analytics: Overview tab (4 KPIs + 4 charts), Opportunities by Principal tab, Weekly Activity tab, Campaign Activity tab
- CSV exports on: Opportunities by Principal, Weekly Activity, Campaign Activity

**Task/Activity Model Confirmed:**
- Tasks are stored in the `activities` table with `activity_type = 'task'` (NOT a separate tasks table for DB views)
- The data provider maps the `tasks` resource to a compatibility view (`tasks_v`) that filters `activity_type = 'task'` [Confidence: 90%]
- The `principal_pipeline_summary` DB view queries `activities` where `activity_type = 'task'` for `next_action_summary`

---

## 2) Metric Inventory Table

### Dashboard Metrics

| Metric ID | Surface | User-Facing Label | Widget/Component |
|-----------|---------|-------------------|------------------|
| D-KPI-1 | Dashboard KPI Row | Open Opportunities | `KPISummaryRow.tsx` → `useKPIMetrics.ts` |
| D-KPI-2 | Dashboard KPI Row | Overdue Tasks | `KPISummaryRow.tsx` → `useKPIMetrics.ts` |
| D-KPI-3 | Dashboard KPI Row | Activities This Week | `KPISummaryRow.tsx` → `useKPIMetrics.ts` |
| D-KPI-4 | Dashboard KPI Row | Stale Deals | `KPISummaryRow.tsx` → `useKPIMetrics.ts` |
| D-PIP-1 | Pipeline Tab | Principal Name | `PrincipalPipelineTable` → `usePrincipalPipeline.ts` |
| D-PIP-2 | Pipeline Tab | Pipeline (count) | `PrincipalPipelineTable` → `usePrincipalPipeline.ts` |
| D-PIP-3 | Pipeline Tab | This Week (active opps) | `PrincipalPipelineTable` → `usePrincipalPipeline.ts` |
| D-PIP-4 | Pipeline Tab | Last Week (active opps) | `PrincipalPipelineTable` → `usePrincipalPipeline.ts` |
| D-PIP-5 | Pipeline Tab | Momentum | `PrincipalPipelineTable` → `usePrincipalPipeline.ts` |
| D-PIP-6 | Pipeline Tab | Completed | `PrincipalPipelineTable` → `usePrincipalPipeline.ts` |
| D-PIP-7 | Pipeline Tab | Next Action | `PrincipalPipelineTable` → `usePrincipalPipeline.ts` |
| D-TSK-1 | My Tasks Tab | Overdue count | `TaskKanbanPanel` → `useMyTasks.ts` |
| D-TSK-2 | My Tasks Tab | Today count | `TaskKanbanPanel` → `useMyTasks.ts` |
| D-TSK-3 | My Tasks Tab | This Week count | `TaskKanbanPanel` → `useMyTasks.ts` |
| D-PERF-1 | Performance Tab | Activities (this week, personal) | `MyPerformanceWidget` → `useMyPerformance.ts` |
| D-PERF-2 | Performance Tab | Deals Moved | `MyPerformanceWidget` → `useMyPerformance.ts` |
| D-PERF-3 | Performance Tab | Tasks Done | `MyPerformanceWidget` → `useMyPerformance.ts` |
| D-PERF-4 | Performance Tab | Open Opps (personal) | `MyPerformanceWidget` → `useMyPerformance.ts` |
| D-ACT-1 | Team Activity Tab | Activity feed items | `ActivityFeedPanel` → `useTeamActivities.ts` |

### Reports Metrics

| Metric ID | Surface | User-Facing Label | Widget/Component |
|-----------|---------|-------------------|------------------|
| R-OV-1 | Overview Tab | Total Opportunities | `OverviewTab.tsx` KPICard |
| R-OV-2 | Overview Tab | Activities This Week | `OverviewTab.tsx` KPICard |
| R-OV-3 | Overview Tab | Stale Leads | `OverviewTab.tsx` KPICard |
| R-OV-4 | Overview Tab | Stale Deals | `OverviewTab.tsx` KPICard |
| R-OV-5 | Overview Tab | Pipeline by Stage (chart) | `PipelineChart` |
| R-OV-6 | Overview Tab | Activity Trend 14 Days (chart) | `ActivityTrendChart` |
| R-OV-7 | Overview Tab | Top Principals by Opportunities (chart) | `TopPrincipalsChart` |
| R-OV-8 | Overview Tab | Rep Performance (chart) | `RepPerformanceChart` |
| R-OP-1 | Opportunities Tab | Total Opportunities | `OpportunitiesByPrincipalReport` summary card |
| R-OP-2 | Opportunities Tab | Principals (count) | `OpportunitiesByPrincipalReport` summary card |
| R-OP-3 | Opportunities Tab | Avg per Principal | `OpportunitiesByPrincipalReport` summary card |
| R-OP-4 | Opportunities Tab | Per-principal opp details | `PrincipalGroupCard` |
| R-WA-1 | Weekly Activity Tab | Total Activities | `WeeklyActivitySummary` summary card |
| R-WA-2 | Weekly Activity Tab | Active Reps | `WeeklyActivitySummary` summary card |
| R-WA-3 | Weekly Activity Tab | Avg per Rep | `WeeklyActivitySummary` summary card |
| R-WA-4 | Weekly Activity Tab | Per-rep breakdown (calls/emails/meetings/notes) | `RepActivityCard` table |
| R-CA-1 | Campaign Tab | Total Activities | `CampaignActivityReport` summary card |
| R-CA-2 | Campaign Tab | Unique Organizations | `CampaignActivityReport` summary card |
| R-CA-3 | Campaign Tab | Coverage Rate | `CampaignActivityReport` summary card |
| R-CA-4 | Campaign Tab | Avg Activities per Lead | `CampaignActivityReport` summary card |
| R-CA-5 | Campaign Tab | Stale Leads list | `StaleLeadsView` |
| R-CA-6 | Campaign Tab | Activity Type Breakdown | `ActivityTypeCard` |

---

## 3) Lineage Map Table (UI → Provider → DB)

### Dashboard Lineage

| Metric ID | UI Component | Hook | Data Provider Call | Resource | DB Object | Aggregation Layer |
|-----------|-------------|------|-------------------|----------|-----------|-------------------|
| D-KPI-1 | `KPISummaryRow` | `useKPIMetrics` | `dataProvider.getList("opportunities", {perPage:1})` | opportunities | `opportunities_summary` view | Server-side count (`.total`) |
| D-KPI-2 | `KPISummaryRow` | `useKPIMetrics` | `dataProvider.getList("tasks", {perPage:1})` | tasks | `tasks_v` / `activities` (task compat view) | Server-side count (`.total`) |
| D-KPI-3 | `KPISummaryRow` | `useKPIMetrics` | `dataProvider.getList("activities", {perPage:1})` | activities | `activities_summary` view | Server-side count (`.total`) |
| D-KPI-4 | `KPISummaryRow` | `useKPIMetrics` | `dataProvider.getList("opportunities", {perPage:500})` | opportunities | `opportunities_summary` view | **Client-side** (`isOpportunityStale()`) |
| D-PIP-1..7 | `PrincipalPipelineTable` | `usePrincipalPipeline` | `useGetList("principal_pipeline_summary")` | principal_pipeline_summary | `principal_pipeline_summary` view | Server-side (SQL aggregation) |
| D-TSK-1..3 | `TaskKanbanPanel` | `useMyTasks` | `useGetList("tasks", {filter:{sales_id, completed:false}})` | tasks | `tasks_v` / `activities` (task compat view) | **Client-side** (date bucketing into overdue/today/week) |
| D-PERF-1 | `MyPerformanceWidget` | `useMyPerformance` | `dataProvider.getList("activities", {perPage:1})` | activities | `activities_summary` view | Server-side count × 2 (this week + last week) |
| D-PERF-2 | `MyPerformanceWidget` | `useMyPerformance` | `dataProvider.getList("opportunities", {perPage:1})` | opportunities | `opportunities_summary` view | Server-side count (updated_at filter) |
| D-PERF-3 | `MyPerformanceWidget` | `useMyPerformance` | `dataProvider.getList("tasks", {perPage:1})` | tasks | `tasks_v` / `activities` | Server-side count (completed_at filter) |
| D-PERF-4 | `MyPerformanceWidget` | `useMyPerformance` | `dataProvider.getList("opportunities", {perPage:1})` | opportunities | `opportunities_summary` view | Server-side count |
| D-ACT-1 | `ActivityFeedPanel` | `useTeamActivities` | `useGetList("activities", {perPage:15})` | activities | `activities_summary` view | Server-side (sort + limit) |

### Reports Lineage

| Metric ID | UI Component | Hook | Data Provider Call | Resource | DB Object | Aggregation Layer |
|-----------|-------------|------|-------------------|----------|-----------|-------------------|
| R-OV-1 | `OverviewTab` KPICard | `useReportData` | `dataProvider.getList("opportunities", {perPage:1000})` | opportunities | `opportunities_summary` view | **Client-side** (`.length` on filtered array) |
| R-OV-2 | `OverviewTab` KPICard | `useReportData` | `dataProvider.getList("activities", {perPage:1000})` | activities | `activities_summary` view | **Client-side** (date filter + `.length`) |
| R-OV-3 | `OverviewTab` KPICard | computed | - | - | - | **Client-side** (`isOpportunityStale()` on new_lead stage) |
| R-OV-4 | `OverviewTab` KPICard | computed | - | - | - | **Client-side** (`countStaleOpportunities()`) |
| R-OV-5..8 | `OverviewTab` charts | `useReportData` | (same as R-OV-1, R-OV-2) | opportunities + activities | views | **Client-side** (grouping, counting, bucketing) |
| R-OP-1..4 | `OpportunitiesByPrincipalReport` | `useReportData` | `dataProvider.getList("opportunities_summary", {perPage:1000})` | opportunities_summary | `opportunities_summary` view | **Client-side** (grouping by principal) |
| R-WA-1..4 | `WeeklyActivitySummary` | `useReportData` | `dataProvider.getList("activities", {perPage:1000})` | activities | `activities_summary` view | **Client-side** (grouping by rep → principal → type) |
| R-CA-1..4 | `CampaignActivityReport` | `useCampaignActivityData` | `useReportData` + `dataProvider.rpc("get_campaign_report_stats")` | activities + RPC | `activities_summary` + RPC function | **Mixed** (RPC for stats, client-side for filtering) |
| R-CA-5 | `StaleLeadsView` | `useCampaignActivityData` | `dataProvider.rpc("get_stale_opportunities")` | RPC | `get_stale_opportunities` function | Server-side (RPC) |
| R-CA-6 | `ActivityTypeCard` | computed | (reuses R-CA activities) | - | - | **Client-side** (grouping by type) |

---

## 4) Include/Exclude Rules By Metric

| Metric ID | Deleted Rows | Closed Stages | Task vs Activity | Owner/Rep Scoping | Date Scoping |
|-----------|-------------|---------------|-----------------|-------------------|--------------|
| D-KPI-1 | Excluded via view `deleted_at IS NULL` | Excludes `closed_won`, `closed_lost` via `stage@not_in` | N/A | **None** (all users see all) [Confidence: 95%] | None |
| D-KPI-2 | Excluded via task view | N/A | Tasks only (via compat view `activity_type='task'`) | **Scoped to current user** (`sales_id`) | `due_date < today` |
| D-KPI-3 | Excluded via view | N/A | **All activities** (not task-filtered) | **None** (all users see total) [Confidence: 95%] | Current ISO week (Mon-Sun) |
| D-KPI-4 | Excluded via view | Excludes closed stages | N/A | **None** (all users see all) [Confidence: 95%] | `last_activity_date < 21 days ago` then client-side per-stage threshold |
| D-PIP-1..7 | Excluded via view (`o.deleted_at IS NULL`, `opp.deleted_at IS NULL`) | Excludes `closed_won`, `closed_lost` from pipeline count | `next_action_summary` uses `activity_type='task'` | Optional "My Principals Only" toggle filters by `sales_id` | This week = 7 days, Last week = 7-14 days |
| D-TSK-1..3 | Explicit filter `deleted_at@is: null` | N/A | Tasks only (via compat view) | **Scoped to current user** (`sales_id`) | Client-side bucketing (overdue/today/week) |
| D-PERF-1 | Excluded via view | N/A | **All activities** (includes tasks) [Confidence: 85%] | **Scoped to current user** (`created_by`) | This week + last week comparison |
| D-PERF-2 | Excluded via view | Excludes closed stages | N/A | **Scoped to current user** (`opportunity_owner_id`) | `updated_at` in current week |
| D-PERF-3 | Excluded via view | N/A | Tasks only (completed filter) | **Scoped to current user** (`sales_id`) | `completed_at` in current week |
| D-PERF-4 | Excluded via view | Excludes closed stages | N/A | **Scoped to current user** (`opportunity_owner_id`) | None |
| R-OV-1 | `deleted_at@is: null` in filter | **Includes all stages** (no stage filter) | N/A | Optional sales rep filter (`opportunity_owner_id`) | None (unless date range set) |
| R-OV-2 | Via view | N/A | **All activities** | Optional sales rep filter (`created_by`) | Last 60 days always fetched; displayed = last 7 days |
| R-OV-3 | Via view | Only `new_lead` stage | N/A | Optional sales rep filter | Staleness = 7+ days no activity |
| R-OV-4 | Via view | Excludes closed stages | N/A | Optional sales rep filter | Per-stage staleness thresholds |
| R-OP-1..4 | `deleted_at@is: null`, `status: "active"` | Stage filter available | N/A | Optional filters (principal, rep, stage, date) | `estimated_close_date` range optional |
| R-WA-1..4 | Via view | N/A | **All activities** (includes tasks if created as activities) | None (shows all reps) | Week date range picker |
| R-CA-1..6 | Via view and RPC | N/A | Activity type filter available | Optional sales rep filter | Optional date range |

---

## 5) High-Risk Metrics (with why)

### HIGH_RISK

| Metric ID | Risk | Reason | [Confidence] |
|-----------|------|--------|-------------|
| D-KPI-3 | **All-users scope** | Activities This Week (dashboard) has **no user scoping**—shows company-wide total. D-PERF-1 (Performance tab) shows the same label "Activities" but scoped to current user. Users may confuse these. | [Confidence: 90%] |
| D-PERF-2 | **Deals Moved proxy** | Uses `updated_at` as proxy for "stage changed". Any update (notes, field edit) counts as "moved," not just actual stage transitions. No `opportunity_stage_changes` view is queried. | [Confidence: 92%] |
| R-OV-1 | **Includes all stages** | Reports Overview "Total Opportunities" includes ALL active stages (including closed_won if not soft-deleted). Dashboard D-KPI-1 excludes closed stages. Same label, different number. | [Confidence: 88%] |
| R-OV-2 vs D-KPI-3 | **Scope mismatch** | Dashboard KPI "Activities This Week" = ISO week, all users, server count. Reports Overview "Activities This Week" = last 7 rolling days, filtered by rep, client count from 60-day fetch. Different definitions, same label. | [Confidence: 95%] |
| R-WA-4 | **"Notes" catch-all bucket** | Weekly Activity bucketing: call, email, meeting, then everything else → "notes". Tasks logged as activities would fall into "notes" bucket, not their own column. | [Confidence: 85%] |

### MEDIUM_RISK

| Metric ID | Risk | Reason | [Confidence] |
|-----------|------|--------|-------------|
| D-KPI-4 vs R-OV-4 | **Different staleness logic** | Dashboard Stale Deals: fetches candidates with `last_activity_date < 21 days ago`, then applies per-stage thresholds client-side. Reports Stale Deals: fetches all opps (perPage:1000) then applies `countStaleOpportunities()` client-side. Different candidate pools could yield different counts. | [Confidence: 80%] |
| D-PIP-6 | **Completed column always '-' (BUG)** | **CONFIRMED**: `completed_tasks_30d` and `total_tasks_30d` columns are MISSING from the `principal_pipeline_summary` SQL view (migration `20260210000005`). TypeScript types and hook expect them. The view never joins to `activities WHERE activity_type='task'` to compute task metrics. **Requires migration to fix.** | [Confidence: 95%] |
| R-OV-1 trend | **Opportunity trend is activity-based** | The "trend" arrow on Total Opportunities compares recent vs older active opps count (based on `last_activity_at`), not actual opportunity creation/closure rate. Misleading trend direction. | [Confidence: 85%] |
| R-CA-3 | **Coverage Rate denominator** | `coverageRate = uniqueOrgs / totalCampaignOpportunities * 100`. Compares unique organizations to opportunity count—these are different units. An org with 3 opps counts as 1 org but 3 opps. | [Confidence: 90%] |
| R-OV-5..8 | **1000-record cap** | `useReportData` uses `perPage: 1000`. If opportunities or activities exceed 1000, charts show truncated data with only a `logger.warn`. No user-visible warning. | [Confidence: 92%] |

### LOW_RISK

| Metric ID | Risk | Reason | [Confidence] |
|-----------|------|--------|-------------|
| D-KPI-1 | Low | Clean server-side count with proper stage exclusion. | [Confidence: 95%] |
| D-KPI-2 | Low | Clean server-side count scoped to user with date filter. | [Confidence: 95%] |
| D-PIP-1..5 | Low | Server-side SQL aggregation in `principal_pipeline_summary` view. Proper soft-delete and stage filtering. | [Confidence: 90%] |
| D-ACT-1 | Low | Simple feed—no numeric aggregation. Uses `activities_summary` view with soft-delete filter. | [Confidence: 95%] |
| R-OP-1..3 | Low | Simple client-side counts from filtered data. Uses `opportunities_summary` view. | [Confidence: 90%] |

---

## 6) Unknowns (Resolved 2026-02-10)

| # | Unknown | Resolution | Status |
|---|---------|-----------|--------|
| U1 | `tasks` resource → DB mapping | `tasks` maps to `tasks_v` view which filters `activity_type = 'task' AND deleted_at IS NULL`. `tasks_summary` extends it with pre-joined entity names. | **RESOLVED** [Confidence: 100%] |
| U2 | `activities_summary` includes task records? | **YES** — No `activity_type` filter. ALL activities (calls, emails, tasks, meetings) included. Activity count metrics that don't explicitly filter `activity_type != 'task'` will include tasks. | **RESOLVED — RISK CONFIRMED** [Confidence: 100%] |
| U3 | `dashboard_snapshots` populated? | **YES** — Table exists with daily cron job (`pg_cron` at 23:00 UTC) invoking `capture-dashboard-snapshots` Edge Function. Upserts per-user snapshots with `Promise.allSettled()` resilience. RLS restricts to own snapshots + manager/admin. | **RESOLVED** [Confidence: 100%] |
| U4 | Campaign RPCs filter soft-deleted? | **YES** — Both `get_campaign_report_stats` and `get_stale_opportunities` filter `deleted_at IS NULL` on both opportunities and activities tables. | **RESOLVED — NO RISK** [Confidence: 100%] |
| U5 | `completed_tasks_30d` in pipeline view? | **MISSING** — Column does NOT exist in `principal_pipeline_summary` view (migration `20260210000005`). TypeScript types (`PipelineSummaryRow`) and hook (`usePrincipalPipeline.ts`) expect `completed_tasks_30d` and `total_tasks_30d`, but the SQL view doesn't calculate them. **This is a confirmed bug** — the "Completed" column always shows '-'. | **RESOLVED — BUG CONFIRMED** [Confidence: 95%] |

### U2 Impact Analysis

Since `activities_summary` includes tasks, these metrics are affected:
- **D-KPI-3 (Activities This Week)**: Fetches from `activities` resource (maps to `activities_summary`). Does NOT filter `activity_type` — **tasks inflate the activity count**.
- **R-OV-2 (Activities This Week in Reports)**: Same source, same inflation risk.
- **R-WA-1..4 (Weekly Activity)**: Groups by `type` field. If tasks appear as a distinct type, they show in the report (which may be intentional). But the "Notes" catch-all bucket could absorb unexpected types.
- **D-PERF-1 (Personal Activities)**: Fetches from `activities` with `created_by` filter. Does NOT exclude tasks — personal activity count includes tasks.

**Decision needed in Phase 2**: Should activity counts exclude `activity_type='task'` records, or is the current behavior (tasks count as activities) intentional?

### U5 Bug Detail

**Root cause**: The `principal_pipeline_summary` view (migration `20260210000005`) calculates `total_pipeline`, `active_this_week`, `active_last_week`, `momentum`, `next_action_summary`, and `sales_id` — but never joins to `activities WHERE activity_type='task'` to compute task completion metrics.

**Frontend expects**: `completed_tasks_30d: number` and `total_tasks_30d: number` (defined in `src/atomic-crm/dashboard/types.ts:87-88`).

**Result**: `row.completed_tasks_30d` is always `undefined` → mapped to `completedTasks30d` → rendered as '-' in the Pipeline table's Completed column.

---

## 7) UI/UX Heuristic Baseline (4 Areas)

### 7.1 Visual Layout Quality

| Surface | Score | Finding | Severity |
|---------|-------|---------|----------|
| Dashboard KPI Row | PASS | 4 cards in horizontal row, clear hierarchy, semantic colors (green for success indicators, amber for warnings). Good use of icons. | - |
| Pipeline Table | PASS_WITH_NOTE | Table is clean with sortable columns. However, "Completed" column shows '-' for all rows — appears broken or empty. Momentum indicator uses text ("Steady", "Increasing") rather than a visual indicator. | P2 |
| My Tasks Kanban | PASS | Clear column layout (Overdue/Today/This Week). Empty state messaging is helpful ("Great job staying on top of things!"). Color-coded column headers (red for overdue, green for today). | - |
| Performance Widget | PASS_WITH_NOTE | 2x2 grid is compact. Trend arrows use semantic colors. However, "Compared to last week" text at bottom doesn't clarify which week boundary is used (ISO week Mon-Sun). | P3 |
| Reports Overview | PASS | 4 KPI cards + 4 charts in balanced 2-column grid. Good use of Chart.js with readable labels. | - |
| Opportunities Report | PASS | Expandable principal groups with stage breakdown badges. Clean summary cards at top. | - |
| Weekly Activity | PASS_WITH_NOTE | Per-rep tables are clear. Low-activity warning badge is useful. But raw `<input type="date">` for date picker doesn't match app's design system. | P2 |
| Campaign Activity | PASS | Rich filter panel, summary cards, expandable activity type sections. Clean layout. | - |

### 7.2 UX Flow Quality

| Surface | Score | Finding | Severity |
|---------|-------|---------|----------|
| Dashboard tabs | PASS | Tab navigation is clear with icon labels. My Tasks badge shows count. | - |
| Dashboard KPI clicks | PASS_WITH_NOTE | KPI cards in Reports Overview are clickable (navigate to filtered lists). Dashboard KPI cards do NOT appear clickable — no cursor/hover indication visible, though code suggests `onClick` handlers exist. | P2 |
| Reports tab navigation | PASS | Tab-based navigation with URL state (`?tab=overview`). Breadcrumbs present. | - |
| Filter → metric feedback | PASS_WITH_NOTE | Applied Filters Bar shows active filters with remove buttons. BUT when filters result in 0 data, empty state appears only after loading completes with no intermediate state indicating "filtering in progress". | P3 |
| CSV Export | PASS | Export buttons on Opportunities, Weekly, and Campaign reports. Success/error toasts. | - |

### 7.3 Accessibility and Mobile Behavior

| Surface | Score | Finding | Severity |
|---------|-------|---------|----------|
| KPI Cards | PASS | `role="group"`, `aria-label` on Performance metrics. Semantic structure. | - |
| Pipeline Table | PASS_WITH_NOTE | Standard HTML table. No `role="table"` annotation, but inherits from `<table>` semantics. Missing `aria-sort` on sortable column headers. | P2 |
| My Tasks Kanban | PASS_WITH_NOTE | Drag-and-drop for rescheduling has no keyboard alternative visible. Tasks have checkbox + action menu. | P2 |
| Campaign Activity | PASS | `aria-live="polite"` region for view change announcements. Loading states have `role="status"`. Label/htmlFor on campaign select. | - |
| Touch targets | PASS | Tab triggers use `h-11` (44px). Buttons meet minimum size. | - |
| Weekly Activity date inputs | FAIL | Raw `<input type="date">` with no `aria-label` or associated `<label>`. Missing `id`/`htmlFor` association. Doesn't match Tier 2 wrapper requirements. | P1 |

### 7.4 Empty/Loading/Error State Usability

| Surface | Score | Finding | Severity |
|---------|-------|---------|----------|
| Dashboard error boundary | PASS | Custom `DashboardErrorBoundary` with "Reload Dashboard" and "Go Home" buttons. Error details expandable in dev mode. | - |
| Reports empty states | PASS | `EmptyState` component with icon, description, and action button ("Create Opportunity"). Contextual messaging. | - |
| Reports error states | PASS | Red bordered error boxes with message text. Fail-fast principle followed. | - |
| Reports loading states | PASS_WITH_NOTE | Skeleton placeholders used for tab content. KPI cards show skeletons. BUT the Weekly Activity tab shows only text "Loading activities..." instead of skeleton. | P3 |
| Dashboard loading | PASS | KPI cards have loading state. Pipeline table data loads with React Admin's built-in loading. | - |

---

## 8) Filter Layout/Design Findings

| Surface | Filter Type | Score | Finding |
|---------|------------|-------|---------|
| Overview Tab | Date range dropdown + Sales rep dropdown | PASS | Clean horizontal filter bar with reset button. Presets ("Last 7 Days", "Last 30 Days", etc.) are clear. |
| Overview Tab | Applied filters bar | PASS | Shows active filters as removable chips near metrics. Clear reset affordance. |
| Opportunities Tab | Principal, Stage, Rep, Date range | PASS | Multi-filter toolbar with dedicated `FilterToolbar` component. Applied filters bar below. |
| Weekly Activity Tab | Date range | FAIL | Raw `<input type="date">` elements instead of a designed date picker. Inconsistent with other tabs' filter UI. No date preset buttons. | P1 |
| Campaign Tab | Campaign select, Date preset, Activity types, Sales rep, Stale leads toggle | PASS_WITH_NOTE | Rich filter panel with many options. However, filter density may overwhelm new users — 5+ filter controls visible simultaneously. Activity type checkboxes show counts from RPC which is good context. | P3 |
| Cross-tab consistency | - | FAIL | Overview uses `TabFilterBar` with dropdowns. Weekly uses raw date inputs. Campaign uses inline `Select` + custom checkbox panels. Three different filter UI patterns across 4 tabs. | P1 |

---

## 9) Ref MCP Best-Practice References

**REF_MCP_UNAVAILABLE** — Using web-search fallback references:

1. **Nielsen Norman Group: Dashboard Design** — Top KPIs should use progressive disclosure; avoid showing all metrics at once. Source: nngroup.com dashboard usability studies.
2. **Tableau Dashboard Best Practices** — Charts should have clear titles, axis labels, and context (time period, filters applied). Source: Tableau public resources.
3. **WCAG 2.1 AA §1.3.1 Info and Relationships** — Table headers must be programmatically associated. Sortable columns need `aria-sort`. Source: w3.org/WAI/WCAG21.
4. **Material Design: Data Tables** — Tables with sortable columns should indicate sort state visually and programmatically. Touch targets >= 48dp. Source: material.io.
5. **Hick's Law applied to CRM dashboards** — Too many filter options increase decision time. Group filters by frequency of use; hide advanced filters behind progressive disclosure. Source: lawsofux.com.

---

## 10) Multiple-Choice Questions

**[Q1]** The "Deals Moved" metric (D-PERF-2) uses `updated_at` as a proxy for stage changes, meaning ANY edit to an opportunity (notes, contact change, etc.) counts as a "deal moved." How should this be addressed in Phase 2?

A) Replace with `opportunity_stage_changes` view query (Recommended) — Uses existing stage change tracking for accurate "stage moved" count. Precise metric.
B) Add `stage_changed_at` column to opportunities table — Requires migration + trigger. More work but gives a direct timestamp.
C) Keep current behavior but rename label to "Deals Updated" — Low effort, fixes user expectation mismatch without code change.

**[Q2]** Dashboard "Activities This Week" (D-KPI-3) shows company-wide count (500) while Performance tab "Activities" (D-PERF-1) shows personal count (3). Both use similar labels. How should the scope confusion be resolved?

A) Rename dashboard KPI to "Team Activities This Week" (Recommended) — Minimal code change, clarifies scope immediately. Users won't confuse personal vs team.
B) Add scope indicator badges ("Team" / "Personal") to both widgets — More visual work but creates a reusable pattern for other metrics.
C) Change D-KPI-3 to show only current user's activities — Breaks manager visibility. Not recommended per PRD requirements.

**[Q3]** Three different filter UI patterns exist across report tabs (TabFilterBar dropdowns, raw date inputs, inline Select+checkboxes). What's the priority fix?

A) Standardize Weekly Activity tab to use TabFilterBar pattern (Recommended) — Fixes the worst offender (raw date inputs) and establishes consistency with existing Overview pattern. One component change.
B) Create a unified ReportFilterBar component for all tabs — Full refactor gives best long-term consistency but higher effort for Phase 2.
C) Add date preset buttons to Weekly Activity tab only — Quick fix for the accessibility issue without full pattern unification.

---

## Decisions (Recorded 2026-02-10)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Q1: "Deals Moved" metric fix | **A — Use `opportunity_stage_changes`** | Current `updated_at` logic is materially misleading. Stage change tracking already exists. |
| Q2: Activities scope confusion | **A — Rename to "Team Activities This Week"** | Fastest way to remove scope ambiguity without breaking manager visibility. |
| Q3: Filter UI standardization | **A — Standardize Weekly Activity to `TabFilterBar`** | Fixes current P1 a11y/inconsistency issue with lowest Phase 2 risk. |

**Phase 2 Verification Priority (User-Directed):**
1. Validate U2/U4/U5 first (task inclusion in `activities_summary`, campaign RPC soft-delete behavior, `completed_tasks_30d` in principal view)
2. Reconcile D-KPI-3 vs R-OV-2 with explicit scope/date definitions
3. Reconcile D-KPI-1 vs R-OV-1 stage inclusion mismatch
4. Add user-visible truncation warning for `perPage:1000` paths

---

## Plan Confidence Summary

- **Overall Confidence:** 92% (up from 85% after U1-U5 resolution)
- **Highest Risk:** D-PERF-2 (Deals Moved uses wrong proxy metric), D-PIP-6 (missing view columns — confirmed bug), U2 impact (tasks inflate activity counts)
- **All Unknowns Resolved:** U1-U5 verified via code inspection (see Section 6)
- **Remaining Verification:** D-KPI-4 vs R-OV-4 staleness count parity (requires live DB query comparison)
