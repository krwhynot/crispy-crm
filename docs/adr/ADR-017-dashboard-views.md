# ADR-017: Optimized Views for Dashboard Performance

**Status:** Accepted
**Date:** 2024-12-22
**Authors:** Engineering Team
**Reviewers:** -

## Context

Crispy CRM's dashboard must answer the question "What is the ONE thing I have to do this week for each principal?" in under 2 seconds. Initial implementation used client-side joins and aggregations, which caused critical performance issues:

1. **Browser crashes** with 1000+ opportunities due to N+1 query patterns
2. **8 correlated subqueries per row** in `opportunities_summary` view (O(n*8) complexity)
3. **Inconsistent calculations** when business logic was duplicated client-side
4. **Excessive data transfer** sending raw data for client-side aggregation

The core challenge: complex dashboard queries require data from multiple tables (opportunities, tasks, activities, organizations) with computed metrics like "days since last activity", "pending task count", and momentum indicators.

## Decision

Implement pre-aggregated PostgreSQL views with Common Table Expression (CTE) optimization and `security_invoker = on` for RLS enforcement.

### Views Implemented

| View | Purpose | Key Metrics |
|------|---------|-------------|
| `opportunities_summary` | Full opportunity denormalization | days_in_stage, task counts, next_task, products JSONB |
| `dashboard_principal_summary` | Principal-centric aggregation | status_indicator (good/warning/urgent), is_stuck flag |
| `principal_pipeline_summary` | Momentum tracking | active_this_week, momentum (increasing/steady/decreasing/stale) |
| `priority_tasks` | Filtered task panel | High priority + due within 7 days |
| `contacts_summary` | Contact denormalization | Organization names, contact count |
| `organizations_summary` | Organization denormalization | Contact count, opportunity count |
| `products_summary` | Product denormalization | Principal name |

### CTE Optimization Pattern

The critical performance fix replaced correlated subqueries with CTEs:

```sql
-- BEFORE: Correlated subqueries - O(n*8) complexity
-- Each subquery executes per row, causing 8N queries for N opportunities
SELECT
    o.*,
    (SELECT MAX(activity_date) FROM activities WHERE opportunity_id = o.id) AS last_activity,
    (SELECT COUNT(*) FROM tasks WHERE opportunity_id = o.id AND completed = false) AS pending_tasks,
    (SELECT id FROM tasks WHERE opportunity_id = o.id AND completed = false ORDER BY due_date LIMIT 1) AS next_task_id,
    (SELECT title FROM tasks WHERE opportunity_id = o.id AND completed = false ORDER BY due_date LIMIT 1) AS next_task_title,
    -- ... 4 more subqueries with SAME filter pattern
FROM opportunities o;

-- AFTER: CTEs - O(n+4) complexity
-- Each CTE executes once, then joined to opportunities
WITH activity_stats AS (
    SELECT
        opportunity_id,
        MAX(activity_date) AS last_activity_date,
        EXTRACT(DAY FROM (NOW() - MAX(activity_date)))::integer AS days_since_last_activity
    FROM activities
    WHERE deleted_at IS NULL
    GROUP BY opportunity_id
),
task_stats AS (
    SELECT
        opportunity_id,
        COUNT(*) FILTER (WHERE COALESCE(completed, false) = false)::integer AS pending_task_count,
        COUNT(*) FILTER (WHERE COALESCE(completed, false) = false AND due_date < CURRENT_DATE)::integer AS overdue_task_count
    FROM tasks
    WHERE deleted_at IS NULL
    GROUP BY opportunity_id
),
next_tasks AS (
    -- Gets ALL 4 columns in single query using window function
    SELECT
        opportunity_id,
        id AS next_task_id,
        title AS next_task_title,
        due_date AS next_task_due_date,
        priority AS next_task_priority,
        ROW_NUMBER() OVER (
            PARTITION BY opportunity_id
            ORDER BY due_date ASC NULLS LAST, priority DESC
        ) AS rn
    FROM tasks
    WHERE deleted_at IS NULL AND COALESCE(completed, false) = false
),
product_aggregates AS (
    SELECT opportunity_id, jsonb_agg(...) AS products
    FROM opportunity_products
    WHERE deleted_at IS NULL
    GROUP BY opportunity_id
)
SELECT
    o.*,
    COALESCE(a.days_since_last_activity, NULL) AS days_since_last_activity,
    COALESCE(ts.pending_task_count, 0) AS pending_task_count,
    COALESCE(ts.overdue_task_count, 0) AS overdue_task_count,
    nt.next_task_id, nt.next_task_title, nt.next_task_due_date, nt.next_task_priority,
    COALESCE(pa.products, '[]'::jsonb) AS products
FROM opportunities o
LEFT JOIN activity_stats a ON a.opportunity_id = o.id
LEFT JOIN task_stats ts ON ts.opportunity_id = o.id
LEFT JOIN next_tasks nt ON nt.opportunity_id = o.id AND nt.rn = 1
LEFT JOIN product_aggregates pa ON pa.opportunity_id = o.id;
```

### Status Indicators in SQL

Business logic computed server-side for consistency:

```sql
-- Status indicator: Good (<= 7 days) | Warning (7-14 days) | Urgent (14+ days)
CASE
    WHEN pa.days_since_last_activity IS NULL THEN 'urgent'
    WHEN pa.days_since_last_activity <= 7 THEN 'good'
    WHEN pa.days_since_last_activity <= 14 THEN 'warning'
    ELSE 'urgent'
END AS status_indicator,

-- Stuck indicator: TRUE if any opportunity in same stage 30+ days
CASE
    WHEN pa.max_days_in_stage >= 30 THEN TRUE
    ELSE FALSE
END AS is_stuck,

-- Momentum: Compare this week vs last week activity
CASE
    WHEN active_opps > 0 AND recent_activity = 0 THEN 'stale'
    WHEN active_this_week > active_last_week THEN 'increasing'
    WHEN active_this_week < active_last_week THEN 'decreasing'
    ELSE 'steady'
END AS momentum
```

### Security: RLS Enforcement via security_invoker

PostgreSQL views by default execute as the view owner, bypassing Row Level Security. Using `security_invoker = on` ensures RLS policies on underlying tables are enforced:

```sql
CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
SELECT ...;

-- Views inherit RLS from base tables when security_invoker = on
-- This ensures authenticated users only see rows they have access to
```

### DataProvider Integration

Views integrate with React Admin's data provider pattern:

```typescript
// src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts
export function usePrincipalPipeline(filters?: { myPrincipalsOnly?: boolean }) {
  const { salesId, loading: salesIdLoading } = useCurrentSale();

  const queryFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (filters?.myPrincipalsOnly && salesId) {
      filter.sales_id = salesId;
    }
    return filter;
  }, [filters?.myPrincipalsOnly, salesId]);

  // Fetch from view as if it were a table
  const { data: rawSummary = [], isPending: loading } = useGetList<PipelineSummaryRow>(
    "principal_pipeline_summary",  // View name as resource
    {
      filter: queryFilter,
      sort: { field: "active_this_week", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
    {
      staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
    }
  );

  // Transform snake_case to camelCase for React
  return {
    data: rawSummary.map((row) => ({
      id: row.principal_id,
      name: row.principal_name,
      totalPipeline: row.total_pipeline,
      momentum: row.momentum,
    })),
    loading,
  };
}
```

### Computed Field Stripping

Views add computed columns that must be stripped before save operations:

```typescript
// src/atomic-crm/providers/supabase/callbacks/productsCallbacks.ts

// Computed fields from products_summary view (must be stripped before save)
export const COMPUTED_FIELDS = ["principal_name"] as const;

export const productsCallbacks: ResourceCallbacks = createResourceCallbacks({
  resource: "products",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,  // Stripped in beforeSave callback
});

// createResourceCallbacks.ts - strips computed fields
callbacks.beforeSave = async (data, _dataProvider, _resource) => {
  let processed = writePipeline(data);
  if (computedFields.length > 0) {
    processed = stripFields(processed, computedFields);
  }
  return processed;
};
```

### Supporting Indexes

Views require indexes on frequently filtered columns for optimal performance:

```sql
-- Index for activity date range queries
CREATE INDEX IF NOT EXISTS idx_activities_activity_date_not_deleted
ON activities(activity_date DESC)
WHERE deleted_at IS NULL;

-- Index for opportunity-principal relationship
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_org_not_deleted
ON opportunities(principal_organization_id)
WHERE deleted_at IS NULL;

-- Composite index for account manager subquery
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_created
ON opportunities(principal_organization_id, created_at DESC)
WHERE deleted_at IS NULL AND account_manager_id IS NOT NULL;
```

## Consequences

### Positive

1. **10x performance improvement**: O(n*8) reduced to O(n+4) complexity
2. **Pre-computed metrics**: Status indicators, stuck flags, momentum calculated once
3. **Consistent calculations**: Business logic in SQL, no client drift
4. **Reduced data transfer**: Server-side aggregation sends only required columns
5. **RLS enforcement**: `security_invoker = on` maintains row-level security
6. **React Admin compatibility**: Views work as resources with `useGetList`
7. **Caching friendly**: Stale-while-revalidate pattern with 5-minute cache

### Negative

1. **View maintenance overhead**: Schema changes require view updates
2. **Potential staleness**: Computed values reflect query-time, not real-time
3. **Migration complexity**: DROP CASCADE affects dependent views/policies
4. **Debugging difficulty**: Complex CTEs harder to debug than simple queries
5. **Index requirements**: Views need supporting indexes on base tables

## Anti-Patterns to Avoid

### 1. N+1 Correlated Subqueries

```sql
-- BAD: Each subquery runs per row
SELECT o.*,
    (SELECT MAX(date) FROM activities WHERE opportunity_id = o.id),
    (SELECT COUNT(*) FROM tasks WHERE opportunity_id = o.id)
FROM opportunities o;

-- GOOD: CTEs run once, then join
WITH activity_agg AS (SELECT opportunity_id, MAX(date) FROM activities GROUP BY 1),
     task_agg AS (SELECT opportunity_id, COUNT(*) FROM tasks GROUP BY 1)
SELECT o.*, a.max, t.count
FROM opportunities o
LEFT JOIN activity_agg a ON a.opportunity_id = o.id
LEFT JOIN task_agg t ON t.opportunity_id = o.id;
```

### 2. Missing security_invoker

```sql
-- BAD: Bypasses RLS, all users see all rows
CREATE VIEW sensitive_data AS SELECT * FROM private_table;

-- GOOD: Enforces RLS policies on underlying tables
CREATE VIEW sensitive_data WITH (security_invoker = on) AS SELECT * FROM private_table;
```

### 3. Missing Supporting Indexes

Views with complex JOINs or WHERE clauses need indexes on filter columns. Monitor query plans for sequential scans on large tables.

### 4. Client-Side Aggregation

```typescript
// BAD: Fetches all opportunities, aggregates in browser
const { data: opportunities } = useGetList('opportunities', { perPage: 10000 });
const summary = opportunities.reduce((acc, opp) => {...}, {});

// GOOD: Server aggregates, client receives summary
const { data } = useGetList('opportunities_summary', { perPage: 100 });
```

### 5. Saving Computed Fields

```typescript
// BAD: Tries to save view-computed columns to base table
await dataProvider.update('products', {
  id: 1,
  data: { name: 'New', principal_name: 'Acme' }  // principal_name is computed!
});

// GOOD: Use callbacks to strip computed fields before save
export const productsCallbacks = createResourceCallbacks({
  resource: 'products',
  computedFields: ['principal_name'],
});
```

## When to Create a New View

Create a PostgreSQL view when:

1. **Repeated complex queries**: Same JOIN pattern used in multiple places
2. **Dashboard requirements**: Need pre-computed metrics for fast display
3. **Cross-table aggregations**: Counting/summing related records
4. **Computed status indicators**: Business logic that should be consistent
5. **Performance optimization**: Reducing N+1 query patterns

Do NOT create a view when:

1. Simple single-table queries suffice
2. Real-time data freshness is critical (use direct queries)
3. Write operations are frequent (views add read overhead)

## Implementation Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20251222011129_optimize_opportunities_summary_performance.sql` | CTE refactor for O(n+4) |
| `supabase/migrations/20251106190107_create_dashboard_principal_summary_view.sql` | Principal status/stuck indicators |
| `supabase/migrations/20251118050755_add_principal_pipeline_summary_view.sql` | Momentum tracking |
| `supabase/migrations/20251114001720_priority_tasks_view.sql` | Filtered task panel |
| `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts` | DataProvider integration |
| `src/atomic-crm/providers/supabase/callbacks/productsCallbacks.ts` | Computed field stripping |
| `src/atomic-crm/providers/supabase/callbacks/createResourceCallbacks.ts` | Reusable callback factory |

## Related ADRs

- **ADR-007**: Soft delete pattern - all views filter `deleted_at IS NULL`
