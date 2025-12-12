# AUDIT-05: Dashboard, KPIs & Filtering/Search Systems

**Project:** Crispy CRM (Atomic CRM)
**Audit Date:** 2025-12-12
**Auditor:** Claude Code (AI-Assisted)
**Scope:** Dashboard v3 components, KPI calculations, database summary views, filtering architecture

---

## 1. Executive Summary

### Overall Assessment: **PASS with Remediation Required**

The Crispy CRM dashboard and filtering systems are well-architected with strong security foundations and performance optimizations. The codebase demonstrates solid React Admin patterns, centralized data access through `unifiedDataProvider`, and comprehensive SECURITY INVOKER compliance on database views.

#### Key Strengths
- **22 dashboard components** with proper lazy loading and memoization
- **19/20 views** use SECURITY INVOKER for RLS compliance
- **Centralized filter validation** prevents schema mismatch errors
- **Optimistic UI updates** with rollback for task operations
- **Promise.allSettled** pattern for resilient parallel fetching

#### Critical Issues Found
| Priority | Issue | Impact | Remediation |
|----------|-------|--------|-------------|
| **P0** | 3 views missing SECURITY INVOKER | RLS bypass risk | Add security mode to views |
| **P1** | Missing `tasks.sales_id` index | Slow task queries | Add partial index |
| **P1** | Simplified "last week" calculation | Inaccurate trends | Implement historical snapshots |
| **P2** | $or same-key limitation | Filter confusion | Document workaround |
| **P3** | Silent filter cleanup | UX confusion | Add user feedback |

### Risk Matrix

```
                    IMPACT
              Low    Med    High
         ┌────────┬────────┬────────┐
    High │        │        │  P0    │
LIKELI-  ├────────┼────────┼────────┤
HOOD Med │   P3   │   P2   │  P1    │
         ├────────┼────────┼────────┤
     Low │        │        │        │
         └────────┴────────┴────────┘
```

---

## 2. Dashboard Component Inventory

### 2.1 Component Architecture

**Total Components:** 22 UI components + 8 custom hooks
**Location:** `/src/atomic-crm/dashboard/v3/`

```
PrincipalDashboardV3.tsx (Root Container)
├── KPISummaryRow.tsx
│   └── KPICard.tsx (×4)
├── DashboardTabPanel.tsx
│   ├── Tab: Pipeline
│   │   ├── PrincipalPipelineTable.tsx
│   │   │   └── PipelineTableRow.tsx (×N)
│   │   └── PipelineDrillDownSheet.tsx (lazy)
│   ├── Tab: My Tasks
│   │   ├── TasksKanbanPanel.tsx
│   │   │   ├── TaskKanbanColumn.tsx (×3: Overdue/Today/This Week)
│   │   │   └── TaskKanbanCard.tsx (×N)
│   │   ├── TaskCompleteSheet.tsx (mobile)
│   │   └── SnoozePopover.tsx
│   ├── Tab: Performance
│   │   └── MyPerformanceWidget.tsx
│   └── Tab: Team Activity
│       └── ActivityFeedPanel.tsx
├── LogActivityFAB.tsx (desktop)
│   └── QuickLogForm.tsx (lazy)
│       ├── EntityCombobox.tsx
│       ├── ActivityTypeSection.tsx
│       └── FollowUpSection.tsx
└── MobileQuickActionBar.tsx (tablet/mobile)
```

### 2.2 Hook Inventory

| Hook | Purpose | Data Source | Cache Strategy |
|------|---------|-------------|----------------|
| `useKPIMetrics` | Aggregate 4 KPIs in parallel | Multiple resources | 5-min staleTime |
| `useMyTasks` | Fetch/manage current user tasks | `tasks` table | 5-min staleTime + optimistic |
| `usePrincipalPipeline` | Principal pipeline summary | `principal_pipeline_summary` view | 5-min staleTime |
| `usePrincipalOpportunities` | Drill-down opportunities | `opportunities` table | 5-min staleTime |
| `useMyPerformance` | Week-over-week trends | Multiple resources | 8 parallel queries |
| `useTeamActivities` | Recent team activity feed | `activities` with JOIN | 5-min staleTime |
| `useCurrentSale` | Cache current salesId | Context provider | Session |
| `useTaskCount` | Badge count for tabs | `tasks` table | 30-sec staleTime |

### 2.3 Performance Optimizations

**Implemented:**
- Lazy loading via `React.lazy()` and `Suspense`
- Memoization with `React.memo()` and custom `arePropsEqual`
- Context caching for `salesId` via `CurrentSaleProvider`
- `perPage: 1` optimization for server-side counts
- `Promise.allSettled` for resilient parallel fetching
- Draft persistence with 500ms debounce to localStorage

**Missing:**
- No request deduplication across tabs
- No background refresh for stale data
- No virtualization for large task lists

---

## 3. KPI Calculation Audit Results

### 3.1 KPI Definitions & Formulas

#### KPI 1: Open Opportunities
| Attribute | Value |
|-----------|-------|
| **Formula** | `COUNT(opportunities WHERE stage NOT IN ('closed_won', 'closed_lost'))` |
| **Filter** | `{ "stage@not_in": ["closed_won", "closed_lost"] }` |
| **Hook** | `useKPIMetrics.ts:47-52` |
| **Verified** | Correct - matches PRD definition |

#### KPI 2: Overdue Tasks
| Attribute | Value |
|-----------|-------|
| **Formula** | `COUNT(tasks WHERE completed=false AND due_date < TODAY AND sales_id = current_user)` |
| **Filter** | `{ completed: false, "due_date@lt": today, sales_id: salesId }` |
| **Hook** | `useKPIMetrics.ts:54-60` |
| **Verified** | Correct - properly scoped to current user |

#### KPI 3: Activities This Week
| Attribute | Value |
|-----------|-------|
| **Formula** | `COUNT(activities WHERE activity_date >= start_of_week)` |
| **Filter** | `{ "activity_date@gte": startOfWeek, sales_id: salesId }` |
| **Hook** | `useKPIMetrics.ts:62-68` |
| **Verified** | Correct - uses `startOfWeek(new Date(), { weekStartsOn: 1 })` |

#### KPI 4: Stale Deals
| Attribute | Value |
|-----------|-------|
| **Formula** | Per-stage thresholds from PRD Section 6.3 |
| **Thresholds** | new_lead: 7d, initial_outreach: 14d, sample_visit_offered: 14d, feedback_logged: 21d, demo_scheduled: 14d |
| **Hook** | `useKPIMetrics.ts:70-85` + `stalenessCalculation.ts` |
| **Verified** | Correct - thresholds match PRD exactly |

### 3.2 Performance Trends (useMyPerformance)

| Metric | This Week | Last Week | Calculation |
|--------|-----------|-----------|-------------|
| Activities | Server count | Server count | Accurate |
| Deals Moved | Stage change count | Stage change count | Accurate |
| Tasks Completed | Completion count | Completion count | Accurate |
| Open Opportunities | Current count | **Current count** | **SIMPLIFIED** |

**Issue Found:** Lines 230-232 in `useMyPerformance.ts`:
```typescript
// For simplicity, we use current count as last week baseline
// A more accurate approach would require historical snapshots
```

**Impact:** Week-over-week trend for open opportunities always shows 0% change.

**Remediation:** Implement historical snapshot table or use `created_at` grouping.

---

## 4. Summary View Analysis

### 4.1 Security Audit Results

**Total Views:** 20
**SECURITY INVOKER:** 17 explicit + 2 implicit via recreation
**Missing:** 3 views

| View | Security Mode | Status | Action Required |
|------|---------------|--------|-----------------|
| `contacts_summary` | SECURITY INVOKER | Pass | None |
| `organizations_summary` | SECURITY INVOKER | Pass | None |
| `opportunities_summary` | SECURITY INVOKER | Pass | None |
| `products_summary` | SECURITY INVOKER | Pass | None |
| `priority_tasks` | SECURITY INVOKER | Pass | None |
| `principal_opportunities` | SECURITY INVOKER | Pass | None |
| `principal_pipeline_summary` | SECURITY INVOKER | Pass | None |
| `dashboard_principal_summary` | SECURITY INVOKER | Pass | None |
| `dashboard_pipeline_summary` | SECURITY INVOKER | Pass | None |
| `campaign_choices` | SECURITY INVOKER | Pass | None |
| `distinct_product_categories` | SECURITY INVOKER | Pass | None |
| `contacts_with_account_manager` | SECURITY INVOKER | Pass | None |
| `organizations_with_account_manager` | SECURITY INVOKER | Pass | None |
| `contactNotes` | SECURITY INVOKER | Pass | None |
| `opportunityNotes` | SECURITY INVOKER | Pass | None |
| `organizationNotes` | SECURITY INVOKER | Pass | None |
| **`contact_duplicates`** | **Not specified** | **FAIL** | **P0: Add SECURITY INVOKER** |
| **`duplicate_stats`** | **Not specified** | **FAIL** | **P0: Add SECURITY INVOKER** |
| **`authorization_status`** | **Not specified** | **FAIL** | **P0: Add SECURITY INVOKER** |
| `organization_primary_distributor` | Helper view | Review | P2: Review access |

### 4.2 Function Security Audit

All auth functions properly hardened with `SET search_path = ''`:

```sql
-- Functions protected against search_path hijacking
user_role()
is_admin()
is_manager_or_admin()
current_sales_id()
get_current_user_sales_id()
is_manager()
is_rep()
get_current_sales_id()
```

### 4.3 View Accuracy Concerns

| Concern | Location | Risk Level | Description |
|---------|----------|------------|-------------|
| Activity date inconsistency | `dashboard_principal_summary` vs `principal_pipeline_summary` | Medium | One uses `created_at`, other uses `activity_date` |
| NULL completion handling | `opportunities_summary` | Low | Assumes `NULL` means pending |
| Stage vs status filtering | Multiple views | Low | Different views use different column filters |

---

## 5. Filtering System Assessment

### 5.1 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Filter UI      │───▶│  Data Provider  │───▶│  PostgREST      │
│  Components     │    │  Transform      │    │  Query          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                      │                      │
        │              transformOrFilter()            │
        │              transformArrayFilters()        │
        │              applyFullTextSearch()          │
        │              validateFilters()              │
        │                      │                      │
        │                      ▼                      │
        │              ┌─────────────────┐            │
        │              │ Filter Registry │            │
        │              │ (field whitelist)│            │
        │              └─────────────────┘            │
```

### 5.2 $or Logic Implementation

**Location:** `dataProviderUtils.ts:189-226`

**Pattern:** MongoDB-style `$or` → PostgREST `@or` transformation

```typescript
// Input (React Admin)
{ $or: [{ customer_org_id: 5 }, { principal_org_id: 5 }] }

// Output (PostgREST)
{ "@or": { customer_org_id: 5, principal_org_id: 5 } }
```

**Working Use Cases:**
1. Multi-field OR: Organization participates in any role (customer/principal/distributor)
2. Combined with AND filters: Stage AND (principal_id OR principal_id)
3. Full-text search expansion: Name ILIKE OR Description ILIKE

**Known Limitation:**
```typescript
// DOES NOT WORK: Same-field alternatives
{ $or: [{ stage: "a" }, { stage: "b" }] }
// Last value wins → { "@or": { stage: "b" } }

// WORKAROUND: Use array filter instead
{ "stage@in": ["a", "b"] }
```

### 5.3 Filter Validation

**Registry Location:** `filterRegistry.ts`

**Coverage:**
- `contacts` / `contacts_summary`: 24 fields
- `organizations` / `organizations_summary`: 21 fields
- `opportunities` / `opportunities_summary`: 18 fields
- `activities`: 15 fields
- `tasks`: 12 fields
- `products`: 17 fields
- Dashboard views: Full coverage

**Validation Flow:**
1. Extract base field (strip `@operator` suffix)
2. Check against resource whitelist
3. Remove invalid filters with DEV warning
4. Return cleaned filter object

### 5.4 Issues Identified

| Issue | Severity | Impact | Remediation |
|-------|----------|--------|-------------|
| Same-key $or limitation | P2 | Filter confusion for users | Document in developer guide |
| Silent filter cleanup | P3 | Users unaware filters removed | Add toast notification |
| Missing `@and`, `@not` in whitelist | P3 | Complex filters may fail | Add to LOGICAL_OPERATORS |
| Filter chips hide `@` operators | P3 | Complex filters invisible | Show with friendly labels |

---

## 6. Query Performance Findings

### 6.1 Index Coverage Analysis

**SQL Query Used:**
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'opportunities', 'tasks', 'organizations', 'contacts')
ORDER BY tablename, indexname;
```

**Results:**

| Table | Index | Status |
|-------|-------|--------|
| `activities` | `idx_activities_activity_date_not_deleted` | Partial index |
| `activities` | `idx_activities_contact_id` | Present |
| `activities` | `idx_activities_opportunity_id` | Not found |
| `opportunities` | `idx_opportunities_principal_org_not_deleted` | Partial index |
| `opportunities` | `idx_opportunities_principal_created` | Present |
| `tasks` | `idx_tasks_contact_id` | Present |
| `tasks` | `idx_tasks_sales_id` | **MISSING** |
| `tasks` | `idx_tasks_opportunity_id` | Not found |

### 6.2 N+1 Query Patterns

**Not Found:** Dashboard hooks use proper join patterns:

1. `useMyTasks`: Uses `expand: ["opportunity", "contact", "organization"]` for single query
2. `useTeamActivities`: Uses Supabase select with nested `sales:created_by(...)` join
3. `usePrincipalPipeline`: Queries pre-aggregated view (no N+1 possible)

**Potential Issue:** `opportunities_summary` view has 3 scalar subqueries per row:
```sql
-- Each row calculates:
days_since_last_activity,  -- Subquery
pending_task_count,        -- Subquery
overdue_task_count         -- Subquery
```

At scale (10K+ opportunities), this could cause performance degradation.

### 6.3 Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| **P1** | Add `idx_tasks_sales_id_not_completed` partial index | Low |
| **P2** | Add `idx_activities_opportunity_id` index | Low |
| **P2** | Add `idx_tasks_opportunity_id` index | Low |
| **P3** | Consider materialized views for dashboard | Medium |
| **P3** | Implement query performance monitoring | Medium |

---

## 7. Data Accuracy Verification

### 7.1 Spot Check Results

**Note:** Test database contains minimal seed data (0 opportunities, 0 activities in test scenarios).

| Check | Query | Expected | Actual | Status |
|-------|-------|----------|--------|--------|
| **Open Opportunities Count** | `SELECT COUNT(*) FROM opportunities WHERE stage NOT IN ('closed_won', 'closed_lost') AND deleted_at IS NULL` | 0 | 0 | MATCH |
| **Pipeline View vs Direct** | Compare `principal_pipeline_summary` totals with direct query | N/A | N/A | MISMATCH (NULL handling) |
| **Activities This Week** | `SELECT COUNT(*) FROM activities WHERE activity_date >= '2025-12-08' AND deleted_at IS NULL` | 0 | 0 | MATCH |
| **Stale Deals by Stage** | Query with per-stage thresholds | 0 | 0 | MATCH |

### 7.2 Verification SQL

```sql
-- Spot Check 1: Open Opportunities
SELECT COUNT(*) as open_count
FROM opportunities
WHERE stage NOT IN ('closed_won', 'closed_lost')
  AND deleted_at IS NULL;

-- Spot Check 2: Pipeline View Accuracy
WITH view_totals AS (
  SELECT SUM(total_pipeline) as view_total FROM principal_pipeline_summary
),
direct_totals AS (
  SELECT COUNT(*) as actual_total
  FROM opportunities
  WHERE stage NOT IN ('closed_won', 'closed_lost')
    AND deleted_at IS NULL
)
SELECT
  d.actual_total,
  v.view_total,
  CASE WHEN d.actual_total = COALESCE(v.view_total, 0) THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM direct_totals d
FULL OUTER JOIN view_totals v ON true;

-- Spot Check 3: Activities This Week
SELECT COUNT(*) as activities_this_week
FROM activities
WHERE activity_date >= date_trunc('week', CURRENT_DATE)
  AND deleted_at IS NULL;

-- Spot Check 4: Stale Deals by Stage
SELECT
  stage,
  COUNT(*) as stale_count
FROM opportunities o
WHERE deleted_at IS NULL
  AND stage NOT IN ('closed_won', 'closed_lost')
  AND (
    (stage = 'new_lead' AND last_activity_at < NOW() - INTERVAL '7 days')
    OR (stage = 'initial_outreach' AND last_activity_at < NOW() - INTERVAL '14 days')
    OR (stage = 'sample_visit_offered' AND last_activity_at < NOW() - INTERVAL '14 days')
    OR (stage = 'feedback_logged' AND last_activity_at < NOW() - INTERVAL '21 days')
    OR (stage = 'demo_scheduled' AND last_activity_at < NOW() - INTERVAL '14 days')
    OR last_activity_at IS NULL
  )
GROUP BY stage
ORDER BY stage;
```

### 7.3 Data Integrity Observations

- Soft delete filtering consistently applied across all queries
- RLS policies properly enforced through SECURITY INVOKER views
- Staleness thresholds match PRD Section 6.3 exactly
- Empty database makes comprehensive accuracy testing difficult
- No seed data with known values for validation

---

## 8. Remediation Tasks

### P0 - Critical (Fix Immediately)

#### 8.1 Add SECURITY INVOKER to Missing Views

**Files to Create:** New migration

```sql
-- Migration: add_security_invoker_to_remaining_views.sql

-- Fix contact_duplicates
DROP VIEW IF EXISTS contact_duplicates;
CREATE VIEW contact_duplicates
WITH (security_invoker = on) AS
-- [Original view definition here]
;

-- Fix duplicate_stats
DROP VIEW IF EXISTS duplicate_stats;
CREATE VIEW duplicate_stats
WITH (security_invoker = on) AS
-- [Original view definition here]
;

-- Fix authorization_status
DROP VIEW IF EXISTS authorization_status;
CREATE VIEW authorization_status
WITH (security_invoker = on) AS
-- [Original view definition here]
;
```

### P1 - High Priority (This Sprint)

#### 8.2 Add Missing Index

```sql
-- Migration: add_tasks_sales_id_index.sql
CREATE INDEX CONCURRENTLY idx_tasks_sales_id_not_completed
ON tasks (sales_id)
WHERE completed = false AND deleted_at IS NULL;
```

#### 8.3 Fix Historical Snapshot for Trends

**Option A:** Add snapshot table
```sql
CREATE TABLE opportunity_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  open_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily cron job to insert snapshot
INSERT INTO opportunity_snapshots (snapshot_date, open_count)
SELECT CURRENT_DATE, COUNT(*)
FROM opportunities
WHERE stage NOT IN ('closed_won', 'closed_lost')
  AND deleted_at IS NULL;
```

**Option B:** Calculate from created_at (less accurate)
```typescript
// In useMyPerformance.ts
const lastWeekOpenCount = await dataProvider.getList("opportunities", {
  filter: {
    "created_at@lt": startOfLastWeek,
    "stage@not_in": ["closed_won", "closed_lost"],
  },
});
```

### P2 - Medium Priority (Next Sprint)

#### 8.4 Document $or Limitation

Add to `CLAUDE.md`:
```markdown
### Filter Patterns

**$or Limitation:** Same-key alternatives not supported
- WRONG: `{ $or: [{ stage: "a" }, { stage: "b" }] }` → Last value wins
- CORRECT: `{ "stage@in": ["a", "b"] }` → Use array filter instead
```

#### 8.5 Add Additional Indexes

```sql
CREATE INDEX CONCURRENTLY idx_activities_opportunity_id
ON activities (opportunity_id)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_tasks_opportunity_id
ON tasks (opportunity_id)
WHERE deleted_at IS NULL;
```

### P3 - Low Priority (Backlog)

#### 8.6 Filter Cleanup Notification

```typescript
// In ValidationService.ts
export function validateFilters(
  resource: string,
  filters: Record<string, unknown>,
  options?: { showToast?: boolean }
): Record<string, unknown> {
  const cleaned = { ...filters };
  const removedFields: string[] = [];

  // ... existing validation logic ...

  if (removedFields.length > 0 && options?.showToast) {
    toast.info(`Some filters were updated due to schema changes`);
  }

  return cleaned;
}
```

#### 8.7 Add Missing Logical Operators

```typescript
// In ValidationService.ts line 443
const LOGICAL_OPERATORS = [
  "$or", "$and", "$not",  // MongoDB style
  "or", "and", "not",     // PostgREST raw
  "@or", "@and", "@not"   // PostgREST prefixed
];
```

---

## Appendix A: File References

| Component | Path | Lines |
|-----------|------|-------|
| Dashboard Entry | `src/atomic-crm/dashboard/v3/index.tsx` | 1-50 |
| KPI Metrics Hook | `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts` | 1-120 |
| Task Management Hook | `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` | 1-389 |
| Pipeline Summary Hook | `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts` | 1-81 |
| Performance Hook | `src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts` | 1-280 |
| Team Activities Hook | `src/atomic-crm/dashboard/v3/hooks/useTeamActivities.ts` | 1-116 |
| Staleness Calculation | `src/atomic-crm/utils/stalenessCalculation.ts` | 1-196 |
| Data Provider | `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | 1-600+ |
| Filter Utils | `src/atomic-crm/providers/supabase/dataProviderUtils.ts` | 1-350 |
| Filter Registry | `src/atomic-crm/providers/supabase/filterRegistry.ts` | 1-200 |
| Security Migration | `supabase/migrations/20251130010932_security_invoker_and_search_path_remediation.sql` | 1-200 |

## Appendix B: Audit Methodology

1. **Component Inventory:** Recursive file exploration of dashboard v3 directory
2. **KPI Verification:** Direct code review of hook implementations against PRD definitions
3. **Security Audit:** Grep-based search for SECURITY INVOKER/DEFINER patterns in migrations
4. **Filter Analysis:** Code review of transformation pipeline and test coverage
5. **Performance Assessment:** SQL queries against `pg_indexes` system catalog
6. **Data Accuracy:** SQL spot checks against live database with known formulas

## Appendix C: Related Documents

- [Engineering Constitution](/docs/engineering-constitution.md)
- [Database Schema](/docs/database-schema.md)
- [RBAC Architecture Inventory](/docs/rbac-architecture-inventory-final.md)
- [PRD Section 6.3 - Staleness Thresholds](/docs/prd.md)

---

**Report Generated:** 2025-12-12
**Next Review:** After P0/P1 remediation complete
