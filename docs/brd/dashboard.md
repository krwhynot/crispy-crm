# BRD: Dashboard

**Status:** Draft | **Last Updated:** 2026-03-01 | **Source:** Dashboard hooks, types, UI components

---

## 1. Domain Overview

The dashboard is a read-only aggregate view providing at-a-glance sales performance metrics. It consumes data from opportunities, tasks, activities, and a precomputed `principal_pipeline_summary` database view. The dashboard does not have its own CRUD operations or validation schemas.

**Business role:** Answer "How am I doing?" in under 2 seconds. Surface overdue tasks, stale deals, and pipeline momentum to drive daily rep behavior.

---

## 2. Layout (V4 -- Current)

Three-column scrollable grid (`PrincipalDashboardV4`):

| Column | Width | Components |
|--------|-------|------------|
| Left | 3/12 | KPI Summary (2x2 grid), Performance Widget |
| Center | 6/12 | Principal Pipeline Table, Activity Feed |
| Right | 3/12 | Tasks List (sticky with internal scroll) |

All heavy components are lazy-loaded via `React.lazy()`. Wrapped in `CurrentSaleProvider` for cached `salesId`.

---

## 3. KPI Metrics

Six parallel queries via `Promise.allSettled`:

| KPI | Query Source | Calculation |
|-----|-------------|-------------|
| Open Opportunities | `opportunities` (stage not in closed) | Count |
| Stale Deals | `opportunities` (per-stage activity thresholds) | Client-side filter |
| Overdue Tasks | `tasks` (completed=false, due_date < today) | Count |
| Activities This Week | `activities` (activity_date in current week) | Count |
| Last Week Activities | `activities` (previous week) | For trend calculation |
| Recent Activities (1hr) | `activities` (last hour) | For KPI alert subtitle |

### Stale Deal Thresholds (Days Without Activity)

| Stage | Threshold |
|-------|-----------|
| `new_lead` | 7 days |
| `initial_outreach` | 14 days |
| `sample_visit_offered` | 14 days |
| `feedback_logged` | 21 days |
| `demo_scheduled` | 14 days |
| `closed_won` / `closed_lost` | N/A |

---

## 4. Principal Pipeline

**Data source:** `principal_pipeline_summary` database view (30-second stale time, refetch on window focus).

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Principal org ID |
| `name` | string | Principal name |
| `totalPipeline` | number | Active opportunity count |
| `activeThisWeek` | number | Activities this week |
| `activeLastWeek` | number | Activities last week |
| `momentum` | enum | increasing/steady/decreasing/stale |
| `nextAction` | string | Next action description |
| `completedTasks30d` | number | Completed tasks (30 days) |
| `totalTasks30d` | number | Total tasks (30 days) |

**Filter:** `myPrincipalsOnly` scopes by `sales_id` or `opportunity_owner_id`.

---

## 5. Task Management

**Data source:** `tasks` table (filter: `sales_id=current`, `completed=false`, `deleted_at IS NULL`).

### Task Status Categories

| Status | Criteria |
|--------|----------|
| `overdue` | `due_date < today` |
| `today` | `due_date === today` |
| `tomorrow` | `due_date === tomorrow` |
| `upcoming` | `due_date` within next 7 days |
| `later` | `due_date > 7 days from now` |

### Task Operations

| Operation | Pattern | Cache Invalidation |
|-----------|---------|-------------------|
| Complete | Optimistic update + rollback | tasks, opportunities, activities, dashboard |
| Snooze | Update `due_date` | tasks, dashboard |
| Delete | Soft delete | tasks, opportunities, dashboard |
| Update Due Date | Optimistic update | tasks, dashboard |

### Task Types

`"Call"` | `"Email"` | `"Meeting"` | `"Follow-up"` | `"Demo"` | `"Proposal"` | `"Other"`

### Task Priority

`"critical"` | `"high"` | `"medium"` | `"low"`

---

## 6. Dashboard Types

| Type | Description |
|------|-------------|
| `PrincipalPipelineRow` | Row in pipeline table |
| `TaskItem` | Task list item with relations |
| `KPIMetrics` | Four core KPI values |
| `Momentum` | Pipeline trend indicator |

---

## 7. Data Sources Consumed

The dashboard reads from but does not write to:

| Entity | Purpose |
|--------|---------|
| `opportunities` / `opportunities_summary` | Pipeline counts, stale deal detection |
| `tasks` | Task list, overdue count |
| `activities` / `activities_summary` | Activity count, activity feed |
| `principal_pipeline_summary` | DB view aggregating principal metrics |
| `sales` | Current user identity |

---

## 8. Performance Characteristics

- **Target:** < 2 seconds to first meaningful paint.
- **Caching:** 30-second stale time on pipeline, `refetchOnWindowFocus: true`.
- **Error isolation:** Each KPI query uses `Promise.allSettled` (one failure doesn't block others).
- **Lazy loading:** All major components lazy-loaded.
- **Optimization:** `CurrentSaleProvider` caches `salesId` to prevent redundant lookups.

---

## 9. Open Questions

- Should stale deal thresholds be configurable per principal or team?
- Should the dashboard support date range selection for KPIs (current: fixed to "this week")?
- Should pipeline momentum calculation move to a database view for consistency?
