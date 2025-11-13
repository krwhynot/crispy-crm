# Query Optimization

## Purpose

Query optimization patterns ensure fast, efficient database queries. This resource covers indexing strategies, pagination, view optimization, query planning, and performance monitoring for Crispy-CRM.

## Core Pattern

### Efficient Query Structure

```typescript
// ✅ GOOD: Selective projection with filters and pagination
const { data, error } = await supabase
  .from('organizations')
  .select('id, name, organization_type, priority')  // Only needed columns
  .eq('organization_type', 'customer')              // Indexed filter
  .is('deleted_at', null)                           // Soft delete filter
  .order('name', { ascending: true })                // Indexed sort
  .range(0, 24);                                    // Pagination (limit 25)

// ❌ BAD: Select all with no filtering or pagination
const { data, error } = await supabase
  .from('organizations')
  .select('*')  // Fetches ALL columns
  .order('name');  // No pagination - fetches ALL rows
```

**Why this works:**
- Selective projection reduces data transfer
- Indexed filters use efficient index scans
- Pagination prevents large result sets
- Ordered results use index for fast sorting

## Real-World Example: Opportunities Summary View

**From migration `20251024125242_add_opportunities_summary_view.sql`:**

```sql
-- Optimized view with selective joins
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
    o.id,
    o.name,
    o.stage,
    o.status,
    o.amount,
    o.estimated_close_date,
    o.actual_close_date,
    o.probability,
    o.created_at,
    o.updated_at,

    -- Foreign key references
    o.organization_id,
    org.name AS organization_name,
    org.organization_type,

    o.sales_id,
    s.first_name || ' ' || s.last_name AS sales_rep_name,

    o.principal_id,
    principal.name AS principal_name,

    -- Aggregated data
    (SELECT COUNT(*)
     FROM opportunity_contacts oc
     WHERE oc.opportunity_id = o.id
     AND oc.deleted_at IS NULL) AS contact_count,

    (SELECT COUNT(*)
     FROM opportunity_products op
     WHERE op.opportunity_id = o.id
     AND op.deleted_at IS NULL) AS product_count

FROM opportunities o
LEFT JOIN organizations org ON o.organization_id = org.id
LEFT JOIN sales s ON o.sales_id = s.id
LEFT JOIN organizations principal ON o.principal_id = principal.id
WHERE o.deleted_at IS NULL;

-- Create indexes on view's underlying tables
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_sales_id ON opportunities(sales_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_id ON opportunities(principal_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);
```

**Why this view is optimized:**
- Uses LEFT JOINs to avoid missing data
- Subqueries for counts (efficient for 1-to-many)
- Filtered by `deleted_at` at view level
- Indexes on foreign keys and filter columns
- Selective columns (no SELECT *)

## Indexing Strategies

### Pattern 1: Foreign Key Indexes

**Use for:** Join columns and reference lookups

```sql
-- ALWAYS index foreign keys
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_sales_id ON contacts(sales_id);
CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX idx_opportunities_sales_id ON opportunities(sales_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_opportunity_id ON activities(opportunity_id);
```

**Why:** Foreign keys are used in:
- JOINs (most common query pattern)
- Lookups (finding all contacts for an organization)
- Cascade deletes/updates

### Pattern 2: Filter Column Indexes

**Use for:** WHERE clause columns

```sql
-- Index columns frequently used in WHERE clauses
CREATE INDEX idx_organizations_type ON organizations(organization_type);
CREATE INDEX idx_organizations_priority ON organizations(priority);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_contacts_last_seen ON contacts(last_seen DESC);
```

**Why:** Filters use indexes for fast row selection

### Pattern 3: Composite Indexes

**Use for:** Multi-column filters

```sql
-- Composite index for common filter combinations
CREATE INDEX idx_opportunities_stage_status ON opportunities(stage, status);
CREATE INDEX idx_tasks_sales_completed ON tasks(sales_id, completed);
CREATE INDEX idx_activities_contact_type ON activities(contact_id, activity_type);

-- Order matters: Most selective first
CREATE INDEX idx_opportunities_org_stage ON opportunities(
  organization_id,  -- More selective (specific org)
  stage            -- Less selective (8 possible values)
);
```

**Query using composite index:**
```typescript
// Uses idx_opportunities_stage_status efficiently
const { data } = await supabase
  .from('opportunities')
  .select('*')
  .eq('stage', 'proposal')
  .eq('status', 'active');
```

### Pattern 4: Partial Indexes

**Use for:** Filtering on common conditions

```sql
-- Index only non-deleted records (most queries)
CREATE INDEX idx_organizations_active ON organizations(id)
WHERE deleted_at IS NULL;

-- Index only completed tasks
CREATE INDEX idx_tasks_completed_date ON tasks(completed_at DESC)
WHERE completed = true;

-- Index only high-priority opportunities
CREATE INDEX idx_opportunities_high_priority ON opportunities(
  estimated_close_date,
  amount
) WHERE status = 'active' AND probability >= 0.7;
```

**Why:** Partial indexes are smaller and faster for specific queries

### Pattern 5: DESC Indexes for Sorting

**Use for:** ORDER BY DESC queries

```sql
-- Default index (ASC)
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

-- DESC index for reverse sorting (more efficient)
CREATE INDEX idx_contacts_created_at_desc ON contacts(created_at DESC);
```

**Query using DESC index:**
```typescript
// Uses idx_contacts_created_at_desc efficiently
const { data } = await supabase
  .from('contacts')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(25);
```

### Pattern 6: JSONB Indexes

**Use for:** Querying JSONB fields

```sql
-- GIN index for JSONB containment queries
CREATE INDEX idx_contacts_email_gin ON contacts USING GIN (email);
CREATE INDEX idx_contacts_phone_gin ON contacts USING GIN (phone);

-- Expression index for specific JSONB field
CREATE INDEX idx_organizations_metadata_status ON organizations(
  (metadata->>'status')
) WHERE metadata->>'status' IS NOT NULL;
```

**Query using GIN index:**
```typescript
// Find contacts with specific email type
const { data } = await supabase
  .from('contacts')
  .select('*')
  .contains('email', [{ type: 'Work' }]);
```

## Pagination Strategies

### Pattern 1: Offset Pagination

**Use for:** Simple pagination with page numbers

```typescript
const PAGE_SIZE = 25;

async function getPage(pageNumber: number) {
  const offset = (pageNumber - 1) * PAGE_SIZE;

  const { data, error, count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })  // Get total count
    .order('name', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  return {
    data,
    total: count,
    page: pageNumber,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  };
}
```

**Pros:**
- Simple to implement
- Works with React Admin pagination
- Can jump to any page

**Cons:**
- Slow for large offsets (database still scans skipped rows)
- Inconsistent results if data changes between pages

### Pattern 2: Cursor Pagination

**Use for:** Infinite scroll, real-time data

```typescript
async function getNextPage(cursor?: string) {
  const PAGE_SIZE = 25;

  let query = supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  // Apply cursor filter
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  // Next cursor is last item's created_at
  const nextCursor = data && data.length > 0
    ? data[data.length - 1].created_at
    : null;

  return { data, nextCursor };
}
```

**Pros:**
- Fast for any page position
- Consistent results (no skipped/duplicate records)
- Efficient for real-time data

**Cons:**
- Can't jump to arbitrary page
- Requires indexed cursor field

### Pattern 3: Keyset Pagination

**Use for:** Large datasets with stable sorting

```typescript
async function getNextPage(lastId?: number, lastName?: string) {
  const PAGE_SIZE = 25;

  let query = supabase
    .from('contacts')
    .select('*')
    .order('last_name', { ascending: true })
    .order('id', { ascending: true })  // Tiebreaker
    .limit(PAGE_SIZE);

  if (lastId && lastName) {
    query = query.or(
      `last_name.gt.${lastName},and(last_name.eq.${lastName},id.gt.${lastId})`
    );
  }

  const { data } = await query;

  return { data };
}
```

**Pros:**
- Most efficient for large datasets
- Stable pagination (no duplicates/gaps)
- Uses composite index

**Cons:**
- Complex query construction
- Requires composite index on sort columns

## View Optimization

### Pattern 1: Security Invoker Views

**Use for:** Views that enforce RLS policies

```sql
-- SECURITY DEFINER (default) - bypasses RLS
CREATE VIEW organizations_summary AS
SELECT * FROM organizations;

-- SECURITY INVOKER - respects RLS
CREATE VIEW organizations_summary
WITH (security_invoker = true) AS
SELECT * FROM organizations;

-- Alternative syntax
ALTER VIEW organizations_summary SET (security_invoker = true);
```

**From migration `20251020002305_fix_contacts_summary_security_invoker.sql`:**

```sql
-- Fix view to respect RLS policies
ALTER VIEW contacts_summary SET (security_invoker = true);
ALTER VIEW organizations_summary SET (security_invoker = true);
ALTER VIEW opportunities_summary SET (security_invoker = true);
```

**Why:** SECURITY INVOKER ensures users only see data they're authorized to access

### Pattern 2: Materialized Views

**Use for:** Complex aggregations that change infrequently

```sql
-- Create materialized view for dashboard metrics
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
  -- Total counts
  (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL) AS total_organizations,
  (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL) AS total_contacts,
  (SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL) AS total_opportunities,

  -- By type
  (SELECT COUNT(*) FROM organizations
   WHERE organization_type = 'customer' AND deleted_at IS NULL) AS customer_count,
  (SELECT COUNT(*) FROM organizations
   WHERE organization_type = 'prospect' AND deleted_at IS NULL) AS prospect_count,

  -- By stage
  (SELECT COUNT(*) FROM opportunities
   WHERE stage = 'proposal' AND deleted_at IS NULL) AS opportunities_in_proposal,
  (SELECT SUM(amount) FROM opportunities
   WHERE stage = 'closed_won' AND deleted_at IS NULL) AS total_revenue;

-- Index for fast refresh
CREATE INDEX idx_dashboard_metrics_refresh ON dashboard_metrics(total_organizations);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
```

**Refresh strategies:**
```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW dashboard_metrics;

-- Scheduled refresh (via cron job or Edge Function)
-- Call every 15 minutes

-- Trigger-based refresh
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_dashboard
AFTER INSERT OR UPDATE OR DELETE ON opportunities
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_dashboard_metrics();
```

## Query Planning

### EXPLAIN ANALYZE

**Use for:** Understanding query performance

```sql
-- Analyze query execution
EXPLAIN ANALYZE
SELECT o.*, org.name AS organization_name
FROM opportunities o
LEFT JOIN organizations org ON o.organization_id = org.id
WHERE o.stage = 'proposal'
  AND o.deleted_at IS NULL
ORDER BY o.created_at DESC
LIMIT 25;
```

**Reading EXPLAIN output:**
```
Limit  (cost=0.00..100.25 rows=25 width=500) (actual time=0.123..1.456 rows=25 loops=1)
  ->  Nested Loop Left Join  (cost=0.00..1000.00 rows=250 width=500) (actual time=0.120..1.450 rows=25 loops=1)
        ->  Index Scan using idx_opportunities_stage on opportunities o
            (cost=0.00..500.00 rows=250 width=400) (actual time=0.100..1.200 rows=25 loops=1)
            Index Cond: ((stage = 'proposal') AND (deleted_at IS NULL))
        ->  Index Scan using organizations_pkey on organizations org
            (cost=0.00..2.00 rows=1 width=100) (actual time=0.005..0.006 rows=1 loops=25)
            Index Cond: (id = o.organization_id)
Planning Time: 0.234 ms
Execution Time: 1.578 ms
```

**Key metrics:**
- `cost`: Estimated query cost (relative units)
- `rows`: Estimated number of rows
- `actual time`: Real execution time in ms
- `loops`: Number of times node executed
- `Index Scan` vs `Seq Scan`: Index = good, Sequential = slow for large tables

### Common Query Performance Issues

**Issue 1: Sequential Scan on Large Table**

```sql
-- Bad: Sequential scan (slow)
EXPLAIN SELECT * FROM organizations WHERE name = 'Acme Corp';
-- Seq Scan on organizations (cost=0.00..1000.00 rows=1 width=500)

-- Solution: Add index
CREATE INDEX idx_organizations_name ON organizations(name);

-- Good: Index scan (fast)
EXPLAIN SELECT * FROM organizations WHERE name = 'Acme Corp';
-- Index Scan using idx_organizations_name (cost=0.00..8.27 rows=1 width=500)
```

**Issue 2: N+1 Query Problem**

```typescript
// ❌ BAD: N+1 queries (1 + N additional queries)
const opportunities = await supabase.from('opportunities').select('*');
for (const opp of opportunities) {
  // Additional query for each opportunity
  const org = await supabase
    .from('organizations')
    .select('*')
    .eq('id', opp.organization_id)
    .single();
}

// ✅ GOOD: Single query with join
const { data } = await supabase
  .from('opportunities')
  .select(`
    *,
    organization:organizations(*)
  `);
// Now each opportunity has organization embedded
```

**Issue 3: Missing Index on Foreign Key**

```sql
-- Query using foreign key without index
SELECT * FROM contacts WHERE organization_id = 123;
-- Seq Scan on contacts (cost=0.00..5000.00 rows=100 width=500)

-- Add index
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);

-- Now uses index
-- Index Scan using idx_contacts_organization_id (cost=0.00..10.25 rows=100 width=500)
```

## Real-Time Subscriptions

### Efficient Real-Time Queries

```typescript
// ✅ GOOD: Filtered subscription (reduces messages)
const subscription = supabase
  .channel('opportunities')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'opportunities',
      filter: 'sales_id=eq.123',  // Only changes for this sales rep
    },
    (payload) => {
      console.log('Change received:', payload);
    }
  )
  .subscribe();

// ❌ BAD: Unfiltered subscription (all changes)
const subscription = supabase
  .channel('opportunities')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'opportunities',  // Receives ALL opportunity changes
    },
    (payload) => {
      console.log('Change received:', payload);
    }
  )
  .subscribe();
```

### Presence for User Activity

```typescript
// Track active users efficiently
const channel = supabase.channel('online-users', {
  config: { presence: { key: userId } },
});

// Join presence
await channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', Object.keys(state));
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ online_at: new Date().toISOString() });
    }
  });
```

## Performance Monitoring

### Slow Query Logging

```sql
-- Enable slow query logging
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Index Usage Stats

```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

-- Find missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_rows_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
  AND seq_tup_read / seq_scan > 1000
ORDER BY seq_tup_read DESC;
```

## Best Practices

### DO
✅ Index all foreign keys
✅ Use selective projections (specific columns)
✅ Paginate all list queries
✅ Use views for complex joins
✅ Apply filters before sorting
✅ Use composite indexes for multi-column filters
✅ Use EXPLAIN ANALYZE to verify query plans
✅ Monitor slow queries in production

### DON'T
❌ Use SELECT * in production
❌ Fetch all records without pagination
❌ Create indexes on every column
❌ Use offset pagination for large datasets
❌ Skip indexing foreign keys
❌ Query JSONB without GIN indexes
❌ Use real-time subscriptions without filters
❌ Ignore query performance in development

## Related Resources

- [RLS Policies](rls-policies.md) - Security and performance trade-offs
- [Service Layer](service-layer.md) - Query patterns in services
- [Edge Functions](edge-functions.md) - Complex query operations
- [Organizations](organizations.md) - Hierarchy query optimization
