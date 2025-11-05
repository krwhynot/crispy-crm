# Data Model: Reports Module

**Created:** 2025-11-05
**Status:** No Database Changes Needed
**Complexity:** None (uses existing schema)

---

## Overview

**Good News:** Reports module requires ZERO database migrations. All necessary tables, columns, and indexes already exist.

---

## Existing Schema (Already Perfect)

### Opportunities Table (for Opportunities by Principal Report)

```sql
CREATE TABLE opportunities (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    stage TEXT NOT NULL,
    status TEXT NOT NULL,
    expected_close_date DATE,
    principal_id BIGINT REFERENCES principals(id),
    organization_id BIGINT REFERENCES organizations(id),
    sales_id BIGINT REFERENCES sales(id),  -- Account Manager
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Existing indexes (already optimized)
CREATE INDEX idx_opportunities_principal_id ON opportunities(principal_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_opportunities_sales_id ON opportunities(sales_id);
```

### Activities Table (for Weekly Activity Summary Report)

```sql
CREATE TABLE activities (
    id BIGINT PRIMARY KEY,
    activity_type TEXT NOT NULL,  -- Call, Email, Meeting, Note
    description TEXT,
    activity_date DATE NOT NULL,
    sales_id BIGINT REFERENCES sales(id),  -- Account Manager
    contact_id BIGINT REFERENCES contacts(id),
    opportunity_id BIGINT REFERENCES opportunities(id),
    organization_id BIGINT REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Existing indexes (already optimized)
CREATE INDEX idx_activities_sales_id ON activities(sales_id);
CREATE INDEX idx_activities_activity_date ON activities(activity_date);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
```

### Related Tables (for joins)

**Sales Table (Account Managers):**
```sql
CREATE TABLE sales (
    id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    ...
);
```

**Principals Table:**
```sql
CREATE TABLE principals (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    ...
);
```

**Organizations Table:**
```sql
CREATE TABLE organizations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    ...
);
```

**Contacts Table:**
```sql
CREATE TABLE contacts (
    id BIGINT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    ...
);
```

---

## Query Patterns

### Query 1: Opportunities by Principal

**Requirements:**
- Group opportunities by `principal_id`
- Include: Principal name, Org name, Opportunity details, Account Manager name
- Filter by: Status, Stage, Date range, Account Manager
- Sort by: Principal name, Opportunity count, Expected close date

**SQL Query Pattern:**
```sql
SELECT
  p.id AS principal_id,
  p.name AS principal_name,
  COUNT(o.id) AS opportunity_count,
  o.id AS opportunity_id,
  o.name AS opportunity_name,
  o.stage,
  o.status,
  o.expected_close_date,
  org.name AS organization_name,
  s.name AS account_manager_name
FROM opportunities o
INNER JOIN principals p ON o.principal_id = p.id
LEFT JOIN organizations org ON o.organization_id = org.id
LEFT JOIN sales s ON o.sales_id = s.id
WHERE
  o.status = $1  -- Filter: Active/Closed/On Hold
  AND o.expected_close_date BETWEEN $2 AND $3  -- Filter: Date range
  AND (o.sales_id = ANY($4) OR $4 IS NULL)  -- Filter: Account Manager(s)
GROUP BY p.id, p.name, o.id, o.name, o.stage, o.status, o.expected_close_date, org.name, s.name
ORDER BY p.name ASC, o.expected_close_date ASC;
```

**Performance:**
- ✅ `idx_opportunities_principal_id` used for grouping
- ✅ `idx_opportunities_status` used for filtering
- ✅ `idx_opportunities_expected_close_date` used for date filtering
- **Expected:** <1 second for 1000 opportunities

### Query 2: Weekly Activity Summary

**Requirements:**
- Group activities by `sales_id` (Account Manager)
- Count by `activity_type`
- Include: Account Manager name, Activity details, Related entity
- Filter by: Date range, Account Manager, Activity type
- Sort by: Account Manager name, then Activity date (newest first)

**SQL Query Pattern:**
```sql
SELECT
  s.id AS sales_id,
  s.name AS account_manager_name,
  COUNT(a.id) FILTER (WHERE a.activity_type = 'Call') AS call_count,
  COUNT(a.id) FILTER (WHERE a.activity_type = 'Email') AS email_count,
  COUNT(a.id) FILTER (WHERE a.activity_type = 'Meeting') AS meeting_count,
  COUNT(a.id) FILTER (WHERE a.activity_type = 'Note') AS note_count,
  a.id AS activity_id,
  a.activity_type,
  a.description,
  a.activity_date,
  COALESCE(c.first_name || ' ' || c.last_name, org.name, opp.name) AS related_entity
FROM activities a
INNER JOIN sales s ON a.sales_id = s.id
LEFT JOIN contacts c ON a.contact_id = c.id
LEFT JOIN organizations org ON a.organization_id = org.id
LEFT JOIN opportunities opp ON a.opportunity_id = opp.id
WHERE
  a.activity_date BETWEEN $1 AND $2  -- Filter: Date range (Mon-Sun)
  AND (a.sales_id = ANY($3) OR $3 IS NULL)  -- Filter: Account Manager(s)
  AND (a.activity_type = ANY($4) OR $4 IS NULL)  -- Filter: Activity type(s)
GROUP BY s.id, s.name, a.id, a.activity_type, a.description, a.activity_date, c.first_name, c.last_name, org.name, opp.name
ORDER BY s.name ASC, a.activity_date DESC;
```

**Performance:**
- ✅ `idx_activities_sales_id` used for grouping
- ✅ `idx_activities_activity_date` used for date range filtering
- ✅ `idx_activities_activity_type` used for type filtering
- **Expected:** <1 second for 2000 activities

---

## TypeScript Types

### Opportunities by Principal Report

```typescript
// Data structure for report
interface OpportunitiesByPrincipalReport {
  principals: PrincipalGroup[];
  totalPrincipals: number;
  totalOpportunities: number;
  activeOpportunities: number;
}

interface PrincipalGroup {
  principalId: number;
  principalName: string;
  opportunityCount: number;
  opportunities: OpportunityRow[];
}

interface OpportunityRow {
  id: number;
  name: string;
  stage: string;
  status: string;
  expectedCloseDate: string;
  organizationName: string;
  accountManagerName: string;
}

// Filters
interface OpportunitiesByPrincipalFilters {
  status?: 'Active' | 'Closed' | 'On Hold';
  stages?: string[];
  dateRangeStart?: string;
  dateRangeEnd?: string;
  accountManagers?: number[];
  principals?: number[];
}
```

### Weekly Activity Summary Report

```typescript
// Data structure for report
interface WeeklyActivitySummaryReport {
  accountManagers: AccountManagerGroup[];
  totalActivities: number;
  totalAccountManagers: number;
  averageActivitiesPerUser: number;
}

interface AccountManagerGroup {
  accountManagerId: number;
  accountManagerName: string;
  totalActivities: number;
  activityCounts: {
    calls: number;
    emails: number;
    meetings: number;
    notes: number;
  };
  activities: ActivityRow[];
}

interface ActivityRow {
  id: number;
  activityType: 'Call' | 'Email' | 'Meeting' | 'Note';
  description: string;
  activityDate: string;
  relatedEntity: string;
  relatedEntityType: 'Contact' | 'Opportunity' | 'Organization' | null;
}

// Filters
interface WeeklyActivitySummaryFilters {
  dateRangeStart: string;  // Default: Monday of current week
  dateRangeEnd: string;    // Default: Sunday of current week
  accountManagers?: number[];
  activityTypes?: ('Call' | 'Email' | 'Meeting' | 'Note')[];
}
```

---

## Data Provider Integration

**Reports use READ operations only:**

```typescript
// Opportunities by Principal
const { data, isLoading, error } = useDataProvider().getList('opportunities', {
  pagination: { page: 1, perPage: 1000 },
  sort: { field: 'principal_id', order: 'ASC' },
  filter: {
    status: 'Active',
    expected_close_date_gte: '2025-11-01',
    expected_close_date_lte: '2026-02-01',
  },
});

// Weekly Activity Summary
const { data, isLoading, error } = useDataProvider().getList('activities', {
  pagination: { page: 1, perPage: 1000 },
  sort: { field: 'activity_date', order: 'DESC' },
  filter: {
    activity_date_gte: '2025-11-04',  // Monday
    activity_date_lte: '2025-11-10',  // Sunday
  },
});
```

**Notes:**
- Reports may need to fetch ALL data (not paginated like list views)
- Consider `perPage: 10000` or custom hook that fetches all pages
- Grouping/aggregation done in frontend for MVP (no database views needed)

---

## No Migrations Needed

**Migration Checklist:**
- [x] Opportunities table has `principal_id` ✅ EXISTS
- [x] Activities table has `sales_id` and `activity_type` ✅ EXISTS
- [x] Indexes exist for performance ✅ EXISTS
- [x] Foreign key constraints exist ✅ EXISTS
- [x] RLS policies allow reading ✅ EXISTS

**Result:** **ZERO database changes required** 🎉

---

## Performance Optimization (Future)

**If reports become slow (>2 seconds), consider:**

1. **Materialized Views:**
```sql
CREATE MATERIALIZED VIEW opportunities_by_principal_summary AS
SELECT
  p.id AS principal_id,
  p.name AS principal_name,
  COUNT(o.id) AS opportunity_count,
  ...
FROM opportunities o
INNER JOIN principals p ON o.principal_id = p.id
GROUP BY p.id, p.name;

-- Refresh daily
CREATE INDEX ON opportunities_by_principal_summary(principal_id);
```

2. **Backend Aggregation:**
- Create Edge Function or RPC for complex grouping
- Return pre-aggregated data to frontend

3. **Caching:**
- Cache report data for 5 minutes in browser
- Use React Query with `staleTime: 5 * 60 * 1000`

**For MVP:** Frontend aggregation is sufficient for expected data volumes (<1000 opportunities, <2000 activities/week).

---

## Related Files

- **Opportunities Table:** `supabase/migrations/20251018152315_cloud_schema_fresh.sql`
- **Activities Table:** `supabase/migrations/20251018152315_cloud_schema_fresh.sql`
- **Existing Indexes:** Already optimal
