# ADR-008: Dashboard Architecture

**Status:** Proposed
**Date:** 2026-03-04
**Deciders:** Engineering team
**Feature:** Dashboard (feat-dsh-001)

## Context

The Dashboard is a high-risk feature (fan_out=8) that aggregates data from opportunities, tasks, activities, and organizations into actionable views for sales reps. Several architectural decisions warrant documentation:

1. **V3/V4 dual strategy** — V4 exists but V3 is production-active; the switch is intentionally deferred
2. **CurrentSaleProvider** — shared identity context that prevents N+1 auth queries across widgets
3. **Pipeline data flow** — a dedicated SQL view (`principal_pipeline_summary`) precomputes metrics server-side
4. **Mixed caching strategy** — some widgets use TanStack Query, others use raw `useEffect`
5. **Widget architecture** — self-contained component + hook pairs composed into layout shells

## Decision

### V3 Active, V4 Ready (Deferred Switch)

**V3** (`PrincipalDashboardV3`) is the production-active dashboard, registered in `CRM.tsx:218`. It uses a **tabbed layout** (`DashboardTabPanel`) with 5 tabs: Pipeline, My Tasks, Performance, Team Activity, Recently Viewed. The layout uses a trapped-scroll container (`calc(100dvh-140px)`) optimized for iPad. All tabs use `forceMount` to preserve state when switching. Default tab is `"tasks"`.

**V4** (`PrincipalDashboardV4`) is built, lazy-loaded, and exported but not wired up. It uses a **12-column CSS grid** (left 3/12: KPIs + Performance, center 6/12: Pipeline + Activity, right 3/12: Tasks sticky). The page scrolls naturally — no trapped containers. All widgets are simultaneously visible.

**Key difference:** V3 is iPad/tablet-first with tabbed UX (one widget at a time). V4 is desktop-first with all widgets visible simultaneously. The switch is a single line change in `CRM.tsx`. V3 remains active because the primary user base is on iPads in the field; V4 will activate when desktop adoption increases.

Both versions are wrapped in `CurrentSaleProvider` + `Suspense` + `DashboardErrorBoundary`.

### CurrentSaleProvider (Shared Identity Context)

`CurrentSaleProvider` wraps the dashboard and provides `salesId: number | null` via React context. It calls `useGetIdentity()` once (React Admin's auth hook, 15-minute TTL managed by `authProvider`) and shares the result to all child widgets.

**Why a provider:** Without it, each widget (`useKPIMetrics`, `useMyTasks`, `useMyPerformance`, `usePrincipalPipeline`) would independently call `useGetIdentity()`. While React Admin deduplicates these in the cache, the provider makes the shared dependency explicit and provides a single refetch path.

**Consumer fallback:** `useCurrentSale()` checks for context first. If rendered outside the provider (e.g., in tests), it falls back to calling `useGetIdentity()` directly via `useCurrentSaleDirect()`. Both hooks are always called unconditionally to comply with React's Rules of Hooks.

**Refetch is a no-op:** The provider's `refetch` function does nothing — the `authProvider` owns cache invalidation on login/logout.

### Server-Side Pipeline Aggregation via SQL View

`principal_pipeline_summary` is a `security_invoker` view that precomputes per-principal metrics:

- `total_pipeline` — count of non-closed opportunities
- `active_this_week` / `active_last_week` — distinct opportunities with activity in 7d/14d windows
- `momentum` — SQL CASE: `stale` (no activity 14d on non-empty pipeline), `increasing`, `decreasing`, `steady`
- `next_action_summary` — earliest incomplete task subject (correlated subquery)
- `completed_tasks_30d` / `total_tasks_30d` — task completion metrics

The hook `usePrincipalPipeline` fetches with `staleTime: SHORT_STALE_TIME_MS` (30s) and `refetchOnWindowFocus: true`. Raw `PipelineSummaryRow` (snake_case) is mapped to `PrincipalPipelineRow` (camelCase) in a transform step. Drill-down into a principal's opportunities loads `PipelineDrillDownSheet` lazily.

### Mixed Caching Strategy (Intentional Divergence)

| Widget | Caching | Stale Time | Why |
|---|---|---|---|
| Pipeline | TanStack `useGetList` | 30s (`SHORT_STALE_TIME_MS`) | Standard query — benefits from cache dedup |
| Tasks | TanStack `useGetList` + `useMutation` | 30s | Optimistic updates need TanStack's `onMutate`/`onError`/`onSettled` |
| Team Activities | TanStack `useGetList` | 5 min (hardcoded) | Lower-priority feed; less frequent refresh acceptable |
| KPI Metrics | Raw `useEffect` + `Promise.allSettled` | None (fresh on mount) | 6 parallel queries with `AbortController` — TanStack doesn't support grouped abort |
| My Performance | Raw `useEffect` + `Promise.allSettled` | None (fresh on mount) | 8 parallel queries — same `AbortController` rationale |

KPI and Performance hooks bypass TanStack Query intentionally for `AbortController` support on component unmount. This means no cache dedup if multiple components mount these hooks, but in practice only one instance exists per dashboard.

**Known debt:** Team Activities uses hardcoded `5 * 60 * 1000` instead of `DEFAULT_STALE_TIME_MS` (STALE-005 violation).

### Self-Contained Widget Architecture

Each widget is a component + hook pair:

| Widget | Component | Hook | Data Source |
|---|---|---|---|
| KPI Summary | `KPISummaryRow` | `useKPIMetrics` | `opportunities`, `tasks`, `activities` direct |
| Pipeline | `PrincipalPipelineTable` | `usePrincipalPipeline` | `principal_pipeline_summary` view |
| Tasks | `TasksKanbanPanel` / `DashboardTasksList` | `useMyTasks` | `tasks` table |
| Performance | `MyPerformanceWidget` / `CompactPerformanceWidget` | `useMyPerformance` | `activities`, `tasks`, `opportunity_stage_changes`, `dashboard_snapshots` |
| Activity Feed | `ActivityFeedPanel` / `CompactActivityWidget` | `useTeamActivities` | `activities` via `activities_summary` view |
| Recently Viewed | Inline in `DashboardTabPanel` | `useRecentSearches` | `localStorage` only |

Widgets are layout-agnostic — V3 composes them in tabs, V4 in a grid. Each widget handles its own loading/error states and can be independently Suspense-wrapped.

**Task optimistic updates:** Complete, snooze, delete, and due-date-change use TanStack `useMutation` with snapshot + rollback. A `pendingCompletion` flag keeps the task visible in the DOM during completion to avoid a race with `QuickLogActivityDialog`.

**Query key invalidation:** Task mutations invalidate `dashboardKeys.all` (broad but correct per STALE-002 — mutations that change counts/metrics need to refresh all dashboard widgets).

## Consequences

### Positive

- Server-side pipeline aggregation avoids N+1 queries and transfers minimal data to the client
- V3/V4 coexistence allows zero-downtime layout experiments — switch is a one-line change
- Self-contained widgets are reusable across both layouts without modification
- CurrentSaleProvider eliminates redundant identity queries across widgets
- Optimistic task mutations provide instant feedback for the primary "quick logging" use case

### Negative

- Mixed caching strategy (TanStack vs raw `useEffect`) is inconsistent — developers must know which pattern each widget uses
- KPI and Performance hooks get no TanStack cache benefits (dedup, background refetch, stale-while-revalidate)
- V3 `forceMount` on all tabs means all widget subscriptions are always active even when hidden, increasing background query load
- `dashboard_snapshots` table dependency for Performance widget — data pipeline (presumably an edge function) is a separate failure domain

### Neutral

- `dashboardKeys` is flat (`all`, `widgets()`, `stats(period)`) rather than hierarchical — adequate for current widget count but may need restructuring if widget count grows
- Recently Viewed is `localStorage`-only — no server persistence, lost on browser clear

## Alternatives Considered

### Option A: Single Dashboard Version

Build one layout that works for both iPad and desktop. Rejected: the UX requirements are fundamentally different — iPad users need tabbed navigation (one hand, limited viewport), desktop users want simultaneous visibility of all metrics.

### Option B: TanStack Query for All Widgets

Use `useGetList` / `useQueries` for KPI and Performance widgets too. Rejected: these widgets fire 6-8 parallel queries that need grouped abort on unmount. TanStack Query doesn't support an `AbortController` shared across a query group. The `Promise.allSettled` pattern with manual abort is cleaner for this use case.

### Option C: Single Aggregation View for All Dashboard Data

One SQL view that returns all dashboard metrics in a single query. Rejected: different widgets have different stale-time requirements (tasks: 30s, activities: 5min), and a monolithic view would force the slowest refresh interval on all data.

### Option D: WebSocket/SSE for Real-Time Dashboard

Push updates instead of polling. Rejected: MFB's usage pattern is periodic check-ins (morning, between meetings), not continuous monitoring. Short stale times (30s) with `refetchOnWindowFocus` are sufficient and much simpler.

## References

- `src/atomic-crm/dashboard/` — all dashboard components and hooks
- `src/atomic-crm/dashboard/CurrentSaleContext.tsx` — identity provider
- `src/atomic-crm/dashboard/useCurrentSale.ts` — consumer hook with fallback
- `src/atomic-crm/dashboard/useKPIMetrics.ts` — 6-query parallel KPI fetch
- `src/atomic-crm/dashboard/usePrincipalPipeline.ts` — pipeline data flow
- `src/atomic-crm/dashboard/useMyTasks.ts` — task mutations with optimistic updates
- `src/atomic-crm/queryKeys.ts` — centralized query key factories
- `src/atomic-crm/constants/appConstants.ts` — stale time constants
- `src/atomic-crm/root/CRM.tsx` — active dashboard assignment
- `supabase/migrations/20260214003331_add_task_metrics_to_principal_pipeline_summary.sql` — pipeline view
- `docs/prd/dashboard/PRD-dashboard.md`
- `docs/brd/dashboard.md`
