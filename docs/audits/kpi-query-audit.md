# KPI Query Performance Audit

**Date:** 2025-11-29
**Target:** Dashboard KPI data fetching
**Focus:** Supabase query efficiency, N+1 patterns, RLS overhead, aggregation strategies
**Constraint:** Target <200ms initial load

---

## Executive Summary

The Dashboard V3 KPI implementation shows **good architectural patterns** with `Promise.allSettled` for resilient parallel fetching, but suffers from **significant query inefficiencies** that likely exceed the 200ms target:

| Issue | Severity | Impact |
|-------|----------|--------|
| Multiple independent queries on load | High | 16+ queries fire on dashboard mount |
| No query deduplication | High | Same data fetched multiple times |
| Client-side staleness calculation | Medium | Full dataset transfer for filtering |
| Missing database indexes | Medium | Full table scans for date filters |
| `principal_pipeline_summary` view complexity | High | Heavy aggregation on every request |

**Estimated Initial Load Time:** 400-800ms (2-4x over target)

---

## 1. Query Analysis by Component

### 1.1 Dashboard Component Tree

```
PrincipalDashboardV3
├── KPISummaryRow (useKPIMetrics) ─── 3 parallel queries
├── PrincipalPipelineTable (usePrincipalPipeline) ─── 1 view query
├── TasksKanbanPanel (useMyTasks) ─── 1 query + expand
├── MyPerformanceWidget (useMyPerformance) ─── 8 parallel queries
└── ActivityFeedPanel (useTeamActivities) ─── 1 query with join
```

**Total Queries on Mount: 14+ minimum**

### 1.2 useKPIMetrics Hook (3 queries)

```typescript
// Query 1: Opportunities - INEFFICIENT
dataProvider.getList("opportunities", {
  filter: { "stage@not_in": ["closed_won", "closed_lost"] },
  pagination: { page: 1, perPage: 1000 }, // ⚠️ FETCHES ALL DATA
});

// Query 2: Tasks - Efficient (count only)
dataProvider.getList("tasks", {
  filter: { sales_id, completed: false, "due_date@lt": today },
  pagination: { page: 1, perPage: 1 }, // ✅ Only needs count
});

// Query 3: Activities - Efficient (count only)
dataProvider.getList("activities", {
  filter: { "activity_date@gte": weekStart, "activity_date@lte": weekEnd },
  pagination: { page: 1, perPage: 1 }, // ✅ Only needs count
});
```

**Issues:**
1. **Opportunities query fetches ALL open opportunities (up to 1000 rows)** just to count them and calculate staleness client-side
2. Staleness is calculated in JavaScript by iterating the full result set
3. No server-side aggregation for simple counts

### 1.3 useMyPerformance Hook (8 queries!)

```typescript
// CRITICAL: 8 parallel queries for a single widget
const results = await Promise.allSettled([
  // Current week (4 queries)
  activities - this week,
  tasks completed - this week,
  deals moved - this week,
  open opportunities,
  // Previous week for trends (4 more queries)
  activities - last week,
  tasks completed - last week,
  deals moved - last week,
  open opportunities - snapshot
]);
```

**Issues:**
1. **8 queries for 4 KPIs with trends** - extreme query multiplication
2. Each query makes a separate round-trip to Supabase
3. No batching or aggregation

### 1.4 usePrincipalPipeline Hook (1 complex view query)

```typescript
// Uses principal_pipeline_summary view
dataProvider.getList("principal_pipeline_summary", {
  filter: queryFilter,
  sort: { field: "active_this_week", order: "DESC" },
  pagination: { page: 1, perPage: 100 },
});
```

**View Definition Analysis:**
```sql
-- The view performs:
-- 1. Full scan of organizations (WHERE organization_type = 'principal')
-- 2. LEFT JOIN to opportunities (full table)
-- 3. LEFT JOIN to activities (full table)
-- 4. Complex CASE/WHEN for momentum calculation
-- 5. Subquery for next_action_summary
-- 6. Subquery for sales_id lookup
-- GROUP BY o.id, o.name
```

**Issues:**
1. **View recomputes on every query** - no materialization
2. Two correlated subqueries per row
3. Full table JOINs without row limits

### 1.5 useCurrentSale Hook (blocks all other queries)

```typescript
// This query MUST complete before any user-specific queries can run
const { data: sale } = await supabase
  .from("sales")
  .select("id, user_id, email")
  .or(`user_id.eq.${user.id},email.eq.${user.email}`)
  .maybeSingle();
```

**Issues:**
1. **Serialization point** - all KPI queries wait for this
2. Could be cached for session duration
3. Uses OR filter which may not use index efficiently

---

## 2. N+1 Pattern Analysis

### 2.1 Direct N+1 Violations: None Found

The codebase correctly uses:
- `Promise.allSettled` for parallel queries
- `meta.expand` for related entity loading
- Supabase joins via select syntax

### 2.2 Indirect N+1 Patterns

**Pattern: "Refresh Key Re-mounting"**
```typescript
// PrincipalDashboardV3.tsx
const [refreshKey, setRefreshKey] = useState(0);
<KPISummaryRow key={`kpi-${refreshKey}`} />
<PrincipalPipelineTable key={`pipeline-${refreshKey}`} />
// ... all components re-mount and re-fetch on any refresh
```

**Issue:** Refreshing one component triggers ALL components to re-fetch

---

## 3. RLS Policy Overhead

### 3.1 RLS Patterns Used

| Table | Policy Type | Performance Impact |
|-------|------------|---------------------|
| opportunities | Shared (`USING (true)`) | Minimal |
| tasks | Personal (`USING (sales_id IN (...))`) | Subquery per row |
| activities | Shared | Minimal |
| principal_pipeline_summary | SECURITY INVOKER | Inherits from base tables |

### 3.2 RLS Performance Issues

**Tasks RLS Pattern:**
```sql
CREATE POLICY select_tasks ON tasks FOR SELECT
TO authenticated
USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
```

**Issue:** Subquery executes for every row checked, though PostgreSQL may optimize.

### 3.3 View with SECURITY INVOKER

The `principal_pipeline_summary` view uses `SECURITY INVOKER`:
```sql
CREATE VIEW principal_pipeline_summary
WITH (security_invoker = on)
AS ...
```

**Implication:** RLS policies on underlying tables (organizations, opportunities, activities) are evaluated during view execution, adding overhead.

---

## 4. Missing Aggregation Opportunities

### 4.1 KPIs That Should Be Server-Side

| KPI | Current | Recommended |
|-----|---------|-------------|
| Open Opportunities Count | Fetch 1000 rows, count client-side | `SELECT COUNT(*)` |
| Stale Deals Count | Fetch all, filter client-side | Database function with threshold logic |
| Week-over-Week Trends | 8 separate queries | Single RPC with date windowing |

### 4.2 Proposed Aggregation Functions

**Option A: Single KPI Summary RPC**
```sql
CREATE FUNCTION get_kpi_summary(p_sales_id bigint)
RETURNS TABLE (
  open_opportunities_count bigint,
  overdue_tasks_count bigint,
  activities_this_week bigint,
  stale_deals_count bigint
) AS $$
  -- Single query with CTEs
$$;
```

**Option B: Materialized View for Pipeline**
```sql
CREATE MATERIALIZED VIEW pipeline_metrics_mv AS
SELECT ... FROM principal_pipeline_summary
WITH DATA;

-- Refresh on demand or schedule
REFRESH MATERIALIZED VIEW CONCURRENTLY pipeline_metrics_mv;
```

---

## 5. Query Combination Opportunities

### 5.1 Queries That Can Be Combined

| Current (Separate) | Combined Approach |
|--------------------|-------------------|
| useKPIMetrics (3 queries) | Single `get_kpi_summary()` RPC |
| useMyPerformance (8 queries) | Single `get_my_performance()` RPC with CTEs |
| useCurrentSale (1 query) | Cache in React context for session |

### 5.2 Deduplication Opportunities

**Open Opportunities Queried Multiple Times:**
- `useKPIMetrics` - fetches all open opportunities
- `useMyPerformance` - fetches open opportunities (count only)
- `usePrincipalPipeline` - via the aggregation view

**Solution:** Implement query deduplication via React Query or SWR

---

## 6. Caching Strategy Recommendations

### 6.1 Client-Side Caching

| Data | Cache Duration | Strategy |
|------|----------------|----------|
| Current Sale ID | Session lifetime | React Context |
| KPI Summary | 30 seconds | Stale-while-revalidate |
| Pipeline Table | 60 seconds | Stale-while-revalidate |
| Activities Feed | 30 seconds | Background refresh |

### 6.2 Server-Side Caching

| Candidate | Implementation |
|-----------|----------------|
| Pipeline Summary | Materialized view (refresh every 5 min) |
| KPI Aggregates | Database function with result caching |

---

## 7. Index Recommendations

### 7.1 Missing Indexes (High Priority)

```sql
-- For date range queries on activities
CREATE INDEX idx_activities_activity_date
ON activities(activity_date)
WHERE deleted_at IS NULL;

-- For task due date filtering
CREATE INDEX idx_tasks_due_date_incomplete
ON tasks(sales_id, due_date)
WHERE completed = false;

-- For opportunity stage filtering
CREATE INDEX idx_opportunities_stage_active
ON opportunities(stage)
WHERE deleted_at IS NULL
  AND stage NOT IN ('closed_won', 'closed_lost');
```

### 7.2 View Optimization

```sql
-- Consider partial index for principal organizations
CREATE INDEX idx_organizations_principal
ON organizations(id, name)
WHERE organization_type = 'principal' AND deleted_at IS NULL;
```

---

## 8. Performance Improvement Roadmap

### Phase 1: Quick Wins (1-2 days)

1. **Cache `useCurrentSale` in React Context**
   - Eliminates serialization delay
   - Single query on login

2. **Add Missing Indexes**
   - Apply indexes from Section 7.1
   - Validate with `EXPLAIN ANALYZE`

3. **Convert Opportunity Count to Server-Side**
   ```typescript
   // Instead of fetching 1000 rows
   pagination: { page: 1, perPage: 1 } // Use total from response
   ```

### Phase 2: Consolidation (3-5 days)

4. **Create `get_kpi_summary()` RPC**
   - Single function returning all 4 KPIs
   - Reduces 3 queries to 1

5. **Create `get_my_performance()` RPC**
   - Single function with date windowing
   - Reduces 8 queries to 1

### Phase 3: Advanced Optimization (1 week)

6. **Materialized View for Pipeline**
   - Pre-compute aggregations
   - Refresh on schedule or trigger

7. **Implement React Query/SWR**
   - Automatic deduplication
   - Background revalidation
   - Cache management

---

## 9. Success Metrics

| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| Initial Load Time | 400-800ms | <200ms |
| Query Count | 14+ | <5 |
| Data Transfer | ~100KB | <20KB |
| Time to Interactive | ~1000ms | <500ms |

---

## 10. Conclusion

The current implementation prioritizes **resilience** (via `Promise.allSettled`) over **efficiency**. While this is good for fault tolerance, it results in:

1. **Query multiplication**: 14+ queries where 3-4 would suffice
2. **Over-fetching**: Entire datasets transferred for simple counts
3. **Client-side computation**: Staleness calculated in JavaScript vs SQL

**Recommended Priority Order:**
1. Server-side KPI aggregation (biggest impact)
2. Index creation (easy win)
3. `useCurrentSale` caching (removes serialization)
4. React Query integration (deduplication + caching)

**Expected Improvement:** 60-70% reduction in initial load time with Phase 1+2 changes.
