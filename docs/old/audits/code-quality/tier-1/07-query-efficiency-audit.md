# Query Efficiency Audit Report

**Agent:** 7 - Query Efficiency Auditor
**Date:** 2025-12-21
**Queries Analyzed:** 85+ files with data fetching patterns

---

## Executive Summary

The codebase has **strong query efficiency fundamentals** with proper ReferenceField batching, comprehensive indexing, and well-configured caching. However, there are **two critical issues** that could violate the 2-second response goal:

1. **`opportunities_summary` view runs the same subquery 4 times** for next_task data - multiplies query cost by 4x
2. **Reports loading 10,000 records** per page - can crash browser and timeout

**Estimated Impact on 2-Second Goal:** **Medium-High risk** for reports and opportunity lists with many items.

---

## N+1 Query Patterns

### Confirmed N+1 Issues

| File | Line | Pattern | Records | Est. Queries | Fix |
|------|------|---------|---------|--------------|-----|
| *(None found)* | - | - | - | - | - |

**Good News:** No N+1 patterns detected. The codebase correctly uses:
- `ReferenceFieldBase` for batched getOne calls
- Summary views for pre-joined list data
- `useGetMany` for batch fetching

### Potential N+1 (Verified as Safe)

| File | Line | Pattern | Status |
|------|------|---------|--------|
| `QuickLogActivityDialog.tsx` | 395-411 | 3x useGetOne calls | Safe - parallel, not in loop |
| `OrganizationList.tsx` | 174-185 | ReferenceField for parent | Safe - batched via ReferenceFieldBase |
| `ActivityLogOpportunityNoteCreated.tsx` | 24-64 | Nested ReferenceFields | Safe - batched by React Admin |

---

## Over-Fetching Issues

### CRITICAL: Repeated Subquery Anti-Pattern

| View | Issue | Impact | Fix |
|------|-------|--------|-----|
| `opportunities_summary` | Same subquery runs 4 times for next_task_* columns | 4x query cost per row | Use LATERAL JOIN or CTE |

**Location:** `supabase/migrations/20251216175827_add_next_task_to_opportunities_summary.sql:186-230`

```sql
-- CURRENT (INEFFICIENT): Same query runs 4 times per opportunity
(SELECT t.id FROM tasks t WHERE ... LIMIT 1) AS next_task_id,
(SELECT t.title FROM tasks t WHERE ... LIMIT 1) AS next_task_title,
(SELECT t.due_date FROM tasks t WHERE ... LIMIT 1) AS next_task_due_date,
(SELECT t.priority FROM tasks t WHERE ... LIMIT 1) AS next_task_priority,

-- RECOMMENDED: Use LATERAL JOIN (runs once per row)
LEFT JOIN LATERAL (
    SELECT t.id, t.title, t.due_date, t.priority
    FROM tasks t
    WHERE t.opportunity_id = o.id
      AND COALESCE(t.completed, false) = false
      AND t.deleted_at IS NULL
      AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
    ORDER BY t.due_date ASC NULLS LAST, t.priority DESC
    LIMIT 1
) next_task ON true
```

**Additional correlated subqueries in opportunities_summary:**
- `days_since_last_activity` - 1 subquery per row
- `pending_task_count` - 1 subquery per row
- `overdue_task_count` - 1 subquery per row
- `products` JSONB aggregation - 1 subquery per row

**Total: 8 subqueries per opportunity row = 400 subqueries for 50 opportunities**

### Large Page Size Issues

| File | Line | perPage | Table | Risk |
|------|------|---------|-------|------|
| `OpportunitiesByPrincipalReport.tsx` | 204 | 10000 | opportunities | High - browser crash |
| `CampaignActivityReport.tsx` | 77 | 10000 | opportunities | High - browser crash |
| `CampaignActivityReport.tsx` | 101 | 10000 | activities | High - browser crash |
| `CampaignActivityReport.tsx` | 113 | 10000 | products | High - browser crash |
| `OverviewTab.tsx` | 100 | 10000 | opportunities | High - browser crash |
| `OverviewTab.tsx` | 118 | 10000 | activities | High - browser crash |
| `useSimilarOpportunityCheck.ts` | 125 | 1000 | opportunities | Medium - slow |
| `OpportunityArchivedList.tsx` | 24 | 1000 | opportunities | Medium |
| `WeeklyActivitySummary.tsx` | 49-60 | 1000 | activities/sales | Medium |

### SELECT * Patterns

| File | Line | Table | Columns Fetched | Columns Used |
|------|------|-------|-----------------|--------------|
| *(None found)* | - | - | - | - |

**Good News:** All queries use summary views with explicit column selection.

---

## Waterfall Request Patterns

### Sequential Requests (Should Be Parallel)

| File | Lines | Requests | Current | Should Be |
|------|-------|----------|---------|-----------|
| *(None found)* | - | - | - | - |

**Good News:** No waterfall patterns detected. Dashboard uses:
- `CurrentSaleProvider` for cached salesId
- Parallel data fetching via React Admin hooks
- Lazy loading with Suspense

### useEffect Chains

| File | Pattern | Status |
|------|---------|--------|
| *(None found)* | - | - |

**Good News:** No useEffect-triggered data fetching chains found.

---

## Caching Issues

### Current Cache Configuration

| Query Type | staleTime | refetchOnWindowFocus | Location |
|------------|-----------|---------------------|----------|
| Global default | 30s | true | `CRM.tsx:86-87` |
| Dashboard hooks | 5 min | varies | `dashboard/v3/hooks/` |
| Task count | 30s | - | `useTaskCount.ts:31` |
| Product filters | 5 min | false | `ProductListFilter.tsx:19-21` |
| Change log | 5 min | - | `ChangeLogTab.tsx:61` |

### Missing Cache Configuration

| Query | File | Issue | Recommendation |
|-------|------|-------|----------------|
| *(None found)* | - | - | - |

**Good News:** Caching is well-configured across the application.

---

## List Performance

### Pagination Analysis

| List | Default Size | Location | Recommendation |
|------|--------------|----------|----------------|
| Organizations | 25 | `constants.ts:202` | OK |
| Contacts | 25 | `ContactList.tsx:53` | OK |
| Opportunities | 25 | `OpportunityList.tsx:64` | OK |
| Products | 25 | `ProductList.tsx:62` | OK |
| Activities | 50 | `ActivityList.tsx:61` | OK |
| Tasks | 100 | `TaskList.tsx:83` | Slightly high, acceptable |
| Notifications | 20 | `NotificationsList.tsx:34` | OK |

### Filter Performance

| List | Filter Debounced? | Debounce Ms | Status |
|------|-------------------|-------------|--------|
| Organizations | Yes | 300ms | `OrganizationDatagridHeader.tsx:38` |
| Contacts | Yes | 300ms | `ContactDatagridHeader.tsx:37` |
| Products | Yes | 300ms | `ProductsDatagridHeader.tsx:47` |
| Tasks | Yes | 300ms | `TasksDatagridHeader.tsx:49` |
| Dashboard search | Yes | 300ms | `useDebouncedSearch.ts:12` |

---

## Index Recommendations

### Existing Indexes (Comprehensive)

The database has **80+ indexes** covering all key query patterns:

| Table | Indexed Columns | Index Type |
|-------|-----------------|------------|
| opportunities | stage, status, priority, estimated_close_date | B-tree |
| opportunities | customer/principal/distributor_organization_id | B-tree |
| opportunities | search_tsv | GIN (full-text) |
| organizations | organization_type, priority, sales_id | B-tree |
| organizations | search_tsv | GIN (full-text) |
| contacts | organization_id, sales_id | B-tree |
| contacts | search_tsv | GIN (full-text) |
| activities | activity_date, opportunity_id, contact_id | B-tree |
| tasks | sales_id, snooze_until, deleted_at | B-tree |
| All tables | deleted_at WHERE NULL | Partial index |

### Additional Index Recommendations

| Table | Column | Query Pattern | Priority |
|-------|--------|---------------|----------|
| tasks | (opportunity_id, completed, deleted_at, snooze_until) | Composite for next_task subquery | P1 |
| tasks | due_date, priority | Next task sorting | P2 |

---

## Performance Impact Summary

| Issue Type | Count | Est. Time Impact | Priority |
|------------|-------|------------------|----------|
| Repeated subqueries in view | 1 view | +200-400ms per page | **P0** |
| 10K record page loads | 6 locations | +2-10s (timeout risk) | **P0** |
| 1K record page loads | 4 locations | +500ms-2s | **P1** |
| N+1 patterns | 0 | None | N/A |
| Missing cache | 0 | None | N/A |
| Unindexed columns | 0 | None | N/A |

---

## Recommendations

### P0 - Critical (Fix This Week)

1. **Refactor `opportunities_summary` view** to use LATERAL JOIN for next_task columns
   - Current: 4 identical subqueries per row
   - Fix: Single LATERAL JOIN returns all 4 values
   - Impact: 4x reduction in subquery count

2. **Add server-side pagination/aggregation to reports**
   - Files: `OpportunitiesByPrincipalReport.tsx`, `CampaignActivityReport.tsx`, `OverviewTab.tsx`
   - Change `perPage: 10000` to streaming or server-side aggregation
   - Alternative: Add export-to-CSV for large datasets

### P1 - High Priority (Fix This Sprint)

3. **Reduce `useSimilarOpportunityCheck` page size**
   - File: `src/atomic-crm/opportunities/hooks/useSimilarOpportunityCheck.ts:125`
   - Consider server-side similarity search or index-based approach
   - Current: Loads 1000 opportunities for client-side comparison

4. **Add composite index for next_task subquery**
   ```sql
   CREATE INDEX idx_tasks_next_task ON tasks (
     opportunity_id, due_date, priority
   ) WHERE completed = false AND deleted_at IS NULL;
   ```

### P2 - Medium Priority (Backlog)

5. **Consider materialized view for opportunities_summary**
   - If opportunity lists remain slow after P0 fixes
   - Refresh on opportunity/task changes

6. **Add query logging to monitor slow queries**
   - Enable pg_stat_statements in Supabase
   - Set up alerting for queries >500ms

---

## Verification Checklist

- [x] N+1 patterns identified (none found)
- [x] Over-fetching documented (view subqueries, large page sizes)
- [x] Waterfall patterns found (none found)
- [x] Caching analyzed (well-configured)
- [x] List performance checked (good defaults, reports need work)
- [x] Index coverage verified (comprehensive)
- [x] Output file created at specified location

---

**Auditor Notes:**

The codebase shows mature query efficiency practices:
- React Admin's batching is properly utilized
- Summary views avoid N+1 at the data provider level
- Debouncing prevents filter query storms
- Caching is configured appropriately for CRM data freshness needs

The main concerns are architectural:
1. The `opportunities_summary` view's design with 8 subqueries per row
2. Report pages that load unbounded datasets

These issues are fixable without major refactoring.
