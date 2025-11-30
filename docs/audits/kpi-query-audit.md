# KPI Query Performance Audit

**Audit Date:** 2025-11-29
**Auditor:** Claude Code (Opus 4.5)
**Target:** Dashboard KPI data fetching
**Performance Goal:** <200ms initial load

---

## Executive Summary

The KPI data fetching system demonstrates **solid foundational architecture** with Promise.allSettled parallel fetching, but has **3 HIGH severity** and **2 MEDIUM severity** issues that should be addressed for optimal performance. Current estimated initial load time: **300-500ms** (exceeds 200ms target).

| Severity | Count | Impact |
|----------|-------|--------|
| HIGH | 3 | Direct performance degradation |
| MEDIUM | 2 | Efficiency opportunities |
| LOW | 2 | Minor optimizations |

---

## Architecture Overview

### Current Data Flow

```
Dashboard Load
    │
    ├─► useCurrentSale() ─► Supabase auth.getUser() + sales lookup
    │
    └─► useKPIMetrics() (waits for salesId)
            │
            └─► Promise.allSettled([
                    dataProvider.getList("opportunities", ...) ─► 1000 records
                    dataProvider.getList("tasks", ...)         ─► count only
                    dataProvider.getList("activities", ...)    ─► count only
                ])
```

### Hooks Analyzed

| Hook | Purpose | Queries | Est. Time |
|------|---------|---------|-----------|
| `useKPIMetrics` | Dashboard KPIs | 3 parallel | 100-150ms |
| `useMyPerformance` | User metrics | 8 parallel | 150-250ms |
| `usePrincipalPipeline` | Pipeline table | 1 (view) | 50-100ms |
| `useMyTasks` | Task list | 1 + expand | 50-100ms |
| `useTeamActivities` | Activity feed | 1 + join | 30-50ms |
| `useCurrentSale` | Auth lookup | 1 | 30-50ms |

---

## Issues Identified

### HIGH-1: Over-fetching Opportunities for Count (Critical)

**Location:** `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts:105-112`

```typescript
// CURRENT: Fetches up to 1000 records just to count them
dataProvider.getList("opportunities", {
  filter: { "stage@not_in": ["closed_won", "closed_lost"] },
  pagination: { page: 1, perPage: 1000 }, // ❌ Fetches ALL data
})
```

**Problem:** Fetching 1000 opportunity records (~200KB-1MB payload) just to:
1. Count them (`opportunities.length`)
2. Calculate stale deals (`opportunities.filter(...)`)

**Impact:**
- **Payload:** ~500KB average vs ~100 bytes for count
- **Time:** +150-300ms network latency
- **Memory:** Unnecessary object allocation for 1000 records

**Recommendation:**
```sql
-- Create database function for aggregated KPIs
CREATE FUNCTION get_kpi_summary(sales_id_param BIGINT DEFAULT NULL)
RETURNS TABLE (
  open_opportunities_count INT,
  stale_deals_count INT,
  overdue_tasks_count INT,
  activities_this_week INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INT FROM opportunities
     WHERE stage NOT IN ('closed_won', 'closed_lost') AND deleted_at IS NULL),
    (SELECT COUNT(*)::INT FROM opportunities
     WHERE stage NOT IN ('closed_won', 'closed_lost')
     AND deleted_at IS NULL
     AND last_activity_date < CURRENT_DATE - (
       CASE stage
         WHEN 'new_lead' THEN 7
         WHEN 'initial_outreach' THEN 14
         WHEN 'sample_visit_offered' THEN 14
         WHEN 'feedback_logged' THEN 21
         WHEN 'demo_scheduled' THEN 14
         ELSE 30
       END
     )::INTEGER),
    (SELECT COUNT(*)::INT FROM tasks
     WHERE completed = false
     AND due_date < CURRENT_DATE
     AND (sales_id_param IS NULL OR sales_id = sales_id_param)),
    (SELECT COUNT(*)::INT FROM activities
     WHERE activity_date >= date_trunc('week', CURRENT_DATE)
     AND activity_date <= date_trunc('week', CURRENT_DATE) + INTERVAL '6 days');
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
```

**Estimated Savings:** 200-400ms, 90%+ payload reduction

---

### HIGH-2: Sequential Auth Dependency Creates Waterfall

**Location:** All dashboard hooks depend on `useCurrentSale()`

```typescript
// useKPIMetrics.ts
const { salesId, loading: salesLoading } = useCurrentSale();

useEffect(() => {
  if (salesLoading) return; // ❌ Blocks until auth complete
  if (!salesId) return;
  // ... fetch KPIs
}, [salesLoading, salesId]);
```

**Problem:** Every dashboard hook waits for `useCurrentSale()` to complete (~50ms), creating a waterfall:

```
Timeline (current):
|--auth--|--KPIs--|--tasks--|--pipeline--| = 300-400ms
          ↑ blocked

Timeline (optimized):
|--auth--+--KPIs--+--tasks--+--pipeline--| = 100-150ms
         ↑ parallel
```

**Impact:** +50-100ms on every dashboard load

**Recommendation:**
1. Move `salesId` to React Context, fetched once at app init
2. Or use optimistic loading with RLS filtering (most data is team-wide anyway)

```typescript
// Optimistic loading pattern for team-wide data
useEffect(() => {
  // Start fetching team-wide KPIs immediately
  const fetchKPIs = async () => {
    const [opportunities, tasks, activities] = await Promise.allSettled([
      dataProvider.getList("opportunities", { /* team-wide */ }),
      // ... tasks and activities can filter by salesId later
    ]);
    // ...
  };
  fetchKPIs();
}, [dataProvider]); // No salesId dependency for team data
```

---

### HIGH-3: useMyPerformance Issues 8 Parallel Queries

**Location:** `src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts:142-237`

```typescript
const [
  activitiesThisWeekResult,
  tasksCompletedThisWeekResult,
  dealsMovedThisWeekResult,
  openOpportunitiesResult,
  activitiesLastWeekResult,      // ❌ Separate query for trend
  tasksCompletedLastWeekResult,  // ❌ Separate query for trend
  dealsMovedLastWeekResult,      // ❌ Separate query for trend
  openOpportunitiesLastWeekResult, // ❌ Separate query for trend
] = await Promise.allSettled([...8 queries...]);
```

**Problem:** 8 separate HTTP requests for metrics that could be a single aggregation

**Impact:**
- **Connection overhead:** 8 × ~20ms = 160ms
- **RLS evaluation:** 8 × table scans
- **Server load:** 8 round-trips per dashboard load

**Recommendation:**
```sql
CREATE FUNCTION get_my_performance(sales_id_param BIGINT)
RETURNS TABLE (
  activities_this_week INT,
  activities_last_week INT,
  tasks_completed_this_week INT,
  tasks_completed_last_week INT,
  deals_moved_this_week INT,
  deals_moved_last_week INT,
  open_opportunities INT,
  open_opportunities_last_week INT
) AS $$
DECLARE
  this_week_start DATE := date_trunc('week', CURRENT_DATE);
  last_week_start DATE := date_trunc('week', CURRENT_DATE) - INTERVAL '7 days';
BEGIN
  RETURN QUERY SELECT
    (SELECT COUNT(*)::INT FROM activities WHERE sales_id = sales_id_param
     AND activity_date >= this_week_start),
    (SELECT COUNT(*)::INT FROM activities WHERE sales_id = sales_id_param
     AND activity_date >= last_week_start AND activity_date < this_week_start),
    -- ... similar for other metrics
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
```

**Estimated Savings:** 100-200ms, 7 fewer round-trips

---

### MEDIUM-1: No Request Deduplication

**Location:** Multiple hooks fetching overlapping data

**Problem:** If multiple components use the same hooks, queries are duplicated:
- `useKPIMetrics` fetches opportunities
- `usePrincipalPipeline` fetches principal_pipeline_summary (includes opportunity data)

**Recommendation:**
- Use React Query (already integrated via react-admin) with `queryKey` deduplication
- Share fetched data via Context for dashboard-wide metrics

---

### MEDIUM-2: principal_pipeline_summary View Performance

**Location:** `supabase/migrations/20251118050755_add_principal_pipeline_summary_view.sql`

```sql
-- Current view uses 3 correlated subqueries per row
SELECT
  -- ... aggregations ...
  (SELECT t.title FROM tasks t ...) as next_action_summary,  -- ❌ N+1
  (SELECT account_manager_id FROM opportunities ...) as sales_id  -- ❌ N+1
FROM organizations o
LEFT JOIN opportunities opp ON ...
LEFT JOIN activities a ON ...
```

**Problem:** Correlated subqueries execute per-row, causing N+1 pattern

**Impact:** For 50 principals: 50 × 2 = 100 additional queries

**Recommendation:** Convert to materialized view with refresh trigger, or use lateral joins:

```sql
-- Option 1: Lateral join for next_action
FROM organizations o
LEFT JOIN LATERAL (
  SELECT t.title
  FROM tasks t
  JOIN opportunities opp2 ON t.opportunity_id = opp2.id
  WHERE opp2.principal_organization_id = o.id
    AND t.completed = false
  ORDER BY t.due_date ASC
  LIMIT 1
) next_task ON true
```

---

### LOW-1: Missing Index on tasks.sales_id + completed

**Location:** Tasks queries filter by `sales_id` and `completed`

**Current:** No composite index for the common query pattern

**Recommendation:**
```sql
CREATE INDEX IF NOT EXISTS idx_tasks_sales_incomplete
ON tasks(sales_id, due_date)
WHERE completed = false AND deleted_at IS NULL;
```

---

### LOW-2: Date Calculations in JavaScript

**Location:** `useKPIMetrics.ts:93-95`

```typescript
const today = startOfDay(new Date());
const weekStart = startOfWeek(today, { weekStartsOn: 1 });
const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
```

**Problem:** Minor inefficiency - dates recalculated on each effect run

**Recommendation:** Memoize date calculations:
```typescript
const { weekStart, weekEnd } = useMemo(() => ({
  weekStart: startOfWeek(startOfDay(new Date()), { weekStartsOn: 1 }),
  weekEnd: endOfWeek(startOfDay(new Date()), { weekStartsOn: 1 }),
}), [/* empty - calculate once per mount */]);
```

---

## Positive Patterns Identified

### 1. Promise.allSettled for Resilience
```typescript
// useKPIMetrics.ts - Excellent error isolation
const [opps, tasks, activities] = await Promise.allSettled([...]);
// Individual failures don't break dashboard
```

### 2. Stable Default References
```typescript
// Prevents unnecessary re-renders
const EMPTY_PIPELINE: PrincipalPipelineRow[] = [];
const DEFAULT_METRICS: KPIMetrics = { openOpportunitiesCount: 0, ... };
```

### 3. Previous Value Tracking
```typescript
// Avoids state thrashing
const prevSalesIdRef = useRef<number | null>(null);
if (prevSalesIdRef.current !== salesId) { ... }
```

### 4. Indexed Views for Complex Aggregations
```sql
-- Good use of partial indexes
CREATE INDEX idx_activities_activity_date_not_deleted
ON activities(activity_date DESC) WHERE deleted_at IS NULL;
```

---

## RLS Policy Overhead Assessment

Current RLS policies are well-designed:

```sql
-- Shared team model - minimal overhead
CREATE POLICY authenticated_select ON opportunities
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
```

**Assessment:** LOW overhead - simple boolean check, no subqueries

---

## Recommendations Summary

### Immediate Actions (Sprint 1)

| Action | Effort | Impact | Priority |
|--------|--------|--------|----------|
| Create `get_kpi_summary()` RPC function | 2h | HIGH | P0 |
| Add composite index on tasks | 15min | MEDIUM | P0 |
| Memoize date calculations | 30min | LOW | P1 |

### Near-term Actions (Sprint 2)

| Action | Effort | Impact | Priority |
|--------|--------|--------|----------|
| Create `get_my_performance()` RPC function | 3h | HIGH | P0 |
| Implement request deduplication | 2h | MEDIUM | P1 |
| Move salesId to App Context | 1h | MEDIUM | P1 |

### Long-term Actions (Backlog)

| Action | Effort | Impact | Priority |
|--------|--------|--------|----------|
| Convert pipeline view to materialized | 4h | MEDIUM | P2 |
| Implement server-side caching (Redis) | 8h | HIGH | P2 |

---

## Expected Outcome

After implementing P0 recommendations:

| Metric | Current | Target | Expected |
|--------|---------|--------|----------|
| Initial Load | 300-500ms | <200ms | ~150ms |
| Payload Size | ~600KB | <50KB | ~30KB |
| Query Count | 12+ | 3-4 | 4 |
| RLS Evaluations | 12+ | 3-4 | 4 |

---

## Appendix: Query Patterns

### Current Query Pattern (Anti-pattern)
```
Client → 8 separate queries → 8 network round-trips → 8 RLS checks → Aggregation in JS
```

### Recommended Query Pattern
```
Client → 1 RPC call → 1 network round-trip → 1 RLS check → Aggregation in SQL
```
