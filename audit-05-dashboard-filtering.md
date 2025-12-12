# Audit 05: Dashboard, KPIs & Filtering/Search Systems

**Audit Date:** 2025-12-12
**Auditor:** Claude Code (Automated Analysis)
**Scope:** Dashboard module, summary views, filter components, query performance

---

## Executive Summary

This audit examined the Crispy CRM dashboard system including 30+ components, 12 data hooks, 13 database views, and the complete filtering architecture. The dashboard is well-architected with proper error handling, parallelized queries, and comprehensive caching. However, **one critical data accuracy bug** and several medium-priority improvements were identified.

### Key Findings

| Severity | Count | Summary |
|----------|-------|---------|
| **CRITICAL** | 1 | Overdue tasks query excludes tasks due TODAY (`@lt` vs `@lte`) |
| **MEDIUM** | 5 | Missing soft-delete filters, imprecise "Deals Moved" metric |
| **LOW** | 4 | Minor architectural improvements, documentation gaps |

### Overall Health Score: **B+ (85/100)**

**Strengths:**
- Excellent error handling with `Promise.allSettled` pattern
- All database views use `SECURITY INVOKER` (RLS-safe)
- Single data entry point (`unifiedDataProvider`) enforced
- 5-minute React Query caching prevents redundant fetches
- `CurrentSaleProvider` eliminates 4+ redundant queries per session

**Weaknesses:**
- Critical task counting bug affects user experience
- Missing soft-delete filters on 2 KPI queries
- No cache invalidation after mutations

---

## 1. Dashboard Component Inventory

### Component Hierarchy

```
PrincipalDashboardV3 (entry point with Suspense + CurrentSaleProvider)
+-- DashboardErrorBoundary (error fallback UI)
+-- KPISummaryRow (4-column metrics header)
|   +-- KPICard x4 (OpenOpps, OverdueTasks, ActivitiesThisWeek, StaleDeals)
+-- DashboardTabPanel (4-tab interface)
|   +-- PrincipalPipelineTable (Pipeline tab)
|   +-- TasksKanbanPanel (Tasks tab)
|   +-- MyPerformanceWidget (Performance tab)
|   +-- ActivityFeedPanel (Activity tab)
+-- LogActivityFAB (floating action button - desktop)
+-- MobileQuickActionBar (quick actions - mobile/tablet)
+-- TaskCompleteSheet (task completion modal)
+-- DashboardTutorial (help button - bottom-left)
```

### Core Components (30+ total)

| Component | Data Source | Refresh | Loading | Error | Filter Props |
|-----------|-------------|---------|---------|-------|--------------|
| **KPISummaryRow** | `useKPIMetrics` | On-mount + manual | Skeleton cards | Suppressed | `loading` state |
| **PrincipalPipelineTable** | `usePrincipalPipeline` | 5min cache | Skeleton | Toast error | `myPrincipalsOnly` |
| **TasksKanbanPanel** | `useMyTasks` | 5min cache + optimistic | Skeleton | Toast + rollback | Column grouping |
| **MyPerformanceWidget** | `useMyPerformance` | On-mount | Skeleton | Suppressed | Week-over-week |
| **ActivityFeedPanel** | `useTeamActivities` | 5min cache | Skeleton | Toast | Team-wide |
| **QuickLogForm** | `useCurrentSale`, `useEntityData` | On-submit | Spinner | Validation | Pre-fill props |

### Data Hooks Summary

| Hook | Queries | Cache | Notes |
|------|---------|-------|-------|
| `useKPIMetrics` | 4 parallel | None (re-fetches on mount) | Uses `Promise.allSettled` |
| `useMyPerformance` | 8 parallel | None | Week-over-week comparison |
| `usePrincipalPipeline` | 1 | 5 min | Database view |
| `useMyTasks` | 1 | 5 min + optimistic | Status calculated client-side |
| `useTeamActivities` | 1 | 5 min | Team-shared visibility |
| `useTaskCount` | 1 | 30 sec | Badge update |
| `useHybridSearch` | 2+ (initial + search) | 5 min | Debounced 300ms |

---

## 2. KPI Calculation Audit Results

### KPI Metrics Table

| KPI Name | Calculation | Edge Cases | Soft-Delete | Status |
|----------|-------------|------------|-------------|--------|
| **Open Opportunities** | `stage NOT IN (closed_won, closed_lost)` | null total -> 0 | **MISSING** | MEDIUM |
| **Overdue Tasks** | `due_date < today AND completed = false` | null total -> 0 | Handled | **BUG** |
| **Activities This Week** | `activity_date >= weekStart(Monday)` | date-fns timezone-aware | Implicit | OK |
| **Stale Deals** | Per-stage thresholds (7-21 days) | Excellent null handling | **MISSING** | MEDIUM |
| **Deals Moved (Weekly)** | `updated_at` in range (ANY update) | null total -> 0 | **MISSING** | IMPRECISE |
| **Tasks Completed** | `completed_at` in range | null total -> 0 | Handled | OK |

### Critical Bug: Overdue Tasks Excludes "Due Today"

**Location:** `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts:149`

```typescript
// CURRENT (BUG):
"due_date@lt": today.toISOString()  // Less than today = OVERDUE only

// EXPECTED:
"due_date@lte": today.toISOString() // Less than or equal = OVERDUE + DUE TODAY
```

**Impact:** Users with 3 tasks requiring attention only see 1 in the KPI card.

### Missing Soft-Delete Filters

**Locations:**
- `useKPIMetrics.ts:124-142` - Opportunities query
- `useMyPerformance.ts:169-241` - Opportunities queries (both weeks)

**Fix:** Add `"deleted_at@is": null` to filter objects.

### Staleness Calculation (Correct)

Per-stage thresholds implemented correctly:
- `new_lead`: 7 days
- `initial_outreach`: 14 days
- `sample_visit_offered`: 14 days
- `feedback_logged`: 21 days
- `demo_scheduled`: 14 days
- `closed_*`: Never stale

---

## 3. Summary View Analysis

### Database Views (13 total)

| View Name | Purpose | Security | Pre-aggregation |
|-----------|---------|----------|-----------------|
| `dashboard_principal_summary` | Principal metrics for dashboard | INVOKER | Yes (CTEs) |
| `dashboard_pipeline_summary` | Pipeline by stage/manager | INVOKER | Yes |
| `principal_pipeline_summary` | Pipeline by principal | INVOKER | Yes (7/14-day windows) |
| `opportunities_summary` | Opportunities + org names | INVOKER | Partial (subqueries) |
| `contacts_summary` | Contacts + counts | INVOKER | Partial |
| `organizations_summary` | Orgs + hierarchy rollups | INVOKER | Partial |

**Security Assessment:** All views use `SECURITY INVOKER` - RLS policies enforced correctly.

### Index Coverage

| Table | Dashboard Indexes | Missing |
|-------|-------------------|---------|
| `opportunities` | stage, deleted_at, principal_org, account_manager | Composite (manager+stage+deleted) |
| `activities` | date DESC, opportunity, contact, organization | None |
| `tasks` | due_date, sales_id, snooze_until | Composite (opp+completed+due) |
| `contacts` | deleted_at, org_id, search_tsv (GIN) | None |
| `organizations` | type, parent, search_tsv (GIN) | None |

### RLS Impact

- Tasks use creator-only visibility (`created_by = current_sales_id()`)
- Activities, Opportunities: Team-shared visibility
- This may cause task count discrepancies for cross-assigned tasks

---

## 4. Filtering System Assessment

### Filter Architecture

```
React Components (filter props)
       |
       v
React Admin useGetList (URL params + staleTime: 5min)
       |
       v
UnifiedDataProvider.getList()
  +-- transformOrFilter(): $or -> @or
  +-- transformArrayFilters(): arrays -> @in/@cs
  +-- applyFullTextSearch(): q -> @or across fields
       |
       v
ra-data-postgrest (PostgREST query string)
       |
       v
Supabase + RLS Policies
```

### $or Logic Implementation

**Pattern:** MongoDB-style filter transforms to PostgREST:

```typescript
// Frontend:
{ $or: [{ principal_id: 1 }, { distributor_id: 1 }] }

// Transformed:
{ "@or": { principal_id: 1, distributor_id: 1 } }

// PostgREST:
?or=(principal_id.eq.1,distributor_id.eq.1)
```

**Assessment:** Correct implementation with test coverage (12+ test cases).

### Search Implementation

- **Debouncing:** 300ms default
- **Hybrid Search:** Initial 100 records cached, then server-side search on 2+ chars
- **Fields:** Resource-specific via `filterRegistry.ts`
- **Full-text:** GIN indexes on `search_tsv` columns

### Filter Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Empty $or array | MEDIUM | `$or: []` transforms to empty @or (undefined behavior) |
| Combined $or + q | LOW | May create unintended OR combinations |
| useCurrentSale raw syntax | LOW | Uses raw PostgREST instead of $or format |

---

## 5. Query Performance Findings

### N+1 Patterns

**None found.** All multiple fetches properly parallelized with `Promise.allSettled`.

### Inefficient Queries

| Location | Issue | Impact |
|----------|-------|--------|
| `useKPIMetrics` | No React Query caching | Re-fetches on every mount |
| `useMyPerformance` | 8 separate queries | Could batch into 2 RPC calls |
| Dashboard `refreshKey` | Unmounts children, clears cache | Should use `.refetch()` instead |

### Caching Strategy

| Hook | Strategy | Assessment |
|------|----------|------------|
| Most hooks | 5-min staleTime | Good |
| `useKPIMetrics` | None (Promise-based) | **Should add caching** |
| `useMyPerformance` | None (Promise-based) | **Should add caching** |
| `useTaskCount` | 30-sec staleTime | Good (frequent updates) |
| `CurrentSaleProvider` | Session-level context | **Excellent** (saves 4+ queries) |

### Performance Recommendations

1. **Enable React Query for KPI/Performance hooks** - ~150ms savings
2. **Replace `refreshKey` with `.refetch()`** - ~50ms savings
3. **RPC batch for useMyPerformance** - 8->2 queries, ~150ms savings

---

## 6. Data Accuracy Verification

### Spot Check Results

| Scenario | Database | Dashboard Logic | Match | Status |
|----------|----------|-----------------|-------|--------|
| Total Opportunities | 369 | `stage NOT IN (closed)` | Yes | OK |
| By Stage | 100% initial_outreach | View groups correctly | Yes | OK |
| Activities This Week | 124 (Monday start) | `weekStartsOn: 1` | Yes | OK |
| Tasks Due/Overdue | 3 total (1 overdue + 2 today) | `due_date@lt` = 1 only | **NO** | **BUG** |
| Principal Filtering | 0 (no principals in data) | View filters correctly | N/A | Data issue |

### Critical Finding

**Tasks Due Today are NOT counted in Overdue Tasks KPI.**

- **Expected count:** 3 (1 overdue + 2 due today)
- **Actual count:** 1 (overdue only)
- **Root cause:** `"due_date@lt"` instead of `"due_date@lte"`

### Data Quality Issues

- No `principal` organizations in seed data (all prospects/distributors)
- All opportunities in single stage (limits testing)
- No soft-deleted records to test filter behavior

---

## 7. Remediation Tasks

### Priority 1: Critical (Fix This Week)

| Task | File | Line | Fix |
|------|------|------|-----|
| **Fix overdue tasks filter** | `hooks/useKPIMetrics.ts` | 149 | Change `@lt` to `@lte` |
| Add soft-delete filter to opportunities | `hooks/useKPIMetrics.ts` | 124-142 | Add `"deleted_at@is": null` |
| Add soft-delete filter to performance | `hooks/useMyPerformance.ts` | 169-241 | Add `"deleted_at@is": null` |

### Priority 2: Important (Fix This Sprint)

| Task | File | Description |
|------|------|-------------|
| Enable React Query for KPI metrics | `hooks/useKPIMetrics.ts` | Convert to useGetList with staleTime |
| Enable React Query for performance | `hooks/useMyPerformance.ts` | Convert to useGetList with staleTime |
| Replace refreshKey with refetch | `PrincipalDashboardV3.tsx` | Store refs, call refetch() |
| Document "Deals Moved" metric | `hooks/useMyPerformance.ts` | Clarify it counts ANY update |
| Add composite index | Database | `(account_manager_id, stage, deleted_at)` |

### Priority 3: Nice to Have (Backlog)

| Task | Description |
|------|-------------|
| Handle empty $or arrays | Add explicit check in transformOrFilter |
| Standardize useCurrentSale filter | Use $or format instead of raw PostgREST |
| Add cache invalidation | Invalidate on task complete, activity log |
| Create RPC batch for performance metrics | Reduce 8->2 queries |
| Diversify seed data | Add principals, multiple stages |

---

## 8. Test Coverage Recommendations

### Missing E2E Tests

1. **KPI accuracy tests** - Compare displayed values against database counts
2. **Tasks due today inclusion** - Verify tasks due today appear in count
3. **Principal filtering** - Test with actual principal organizations
4. **Soft-delete exclusion** - Verify deleted records don't appear

### Missing Unit Tests

1. **transformOrFilter with empty array** - Document expected behavior
2. **Combined $or + q filters** - Verify interaction
3. **Real soft-delete filtering** - Current mocks don't test actual behavior

---

## Appendix: Files Analyzed

### Dashboard Components (30+ files)
- `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`
- `src/atomic-crm/dashboard/v3/components/*.tsx` (15 files)
- `src/atomic-crm/dashboard/v3/hooks/*.ts` (12 files)
- `src/atomic-crm/dashboard/v3/context/*.tsx` (2 files)

### Data Provider
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
- `src/atomic-crm/providers/supabase/filterRegistry.ts`

### Database Migrations
- `supabase/migrations/20251118050755_add_principal_pipeline_summary_view.sql`
- `supabase/migrations/20251130011911_fix_remaining_security_definer_views.sql`
- `supabase/migrations/20251116124147_fix_permissive_rls_policies.sql`

---

**Report Generated:** 2025-12-12
**Next Review:** After P1 fixes applied
