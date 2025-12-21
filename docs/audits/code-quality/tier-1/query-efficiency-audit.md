# Query Efficiency Audit Report

**Agent:** 7 - Query Efficiency Auditor
**Date:** 2025-12-21 (Updated)
**Queries Analyzed:** 47 data hooks across 28 files
**Target:** < 2 seconds for "What's the ONE thing I need to do this week?"

---

## Executive Summary

The Crispy CRM codebase demonstrates **generally good query patterns** with proper use of React Admin's caching and conditional fetching. However, **3 critical N+1 patterns** and **excessive pagination limits** (perPage: 10000) threaten the 2-second response goal. The most impactful issues are in the AuthorizationsTab (nested queries per card) and CampaignActivityReport (duplicate fetches).

---

## N+1 Query Patterns

### Queries in Loops

| File | Line | Pattern | Est. Items | Severity | Fix |
|------|------|---------|------------|----------|-----|
| `AuthorizationsTab.tsx` | 289-292 | `useGetList` inside `AuthorizationCard` to fetch principal name | ~10-50 authorizations | **P0 - CRITICAL** | Join principal data in parent query OR use `useGetMany` with collected IDs |
| `AuthorizationsTab.tsx` | 295-302 | `useGetList` for product_authorizations per expanded card | ~5-20 expanded | **P1 - HIGH** | Already uses `enabled: isExpanded` (good), but still N+1 when expanded |
| `AuthorizationsTab.tsx` | 306-313 | `useGetList` for products per expanded card | ~5-20 expanded | **P1 - HIGH** | Combine with product_authorizations fetch |

**Impact:** With 20 authorizations displayed, this creates **60+ network requests** instead of 3-4 batched queries.

### Sequential Awaits (Should Be Parallel)

| File | Line | Pattern | Queries | Potential Savings |
|------|------|---------|---------|-------------------|
| `unifiedDataProvider.ts` | 1018-1030 | `for (const id of params.ids) { await supabase.rpc() }` | N sequential | ~(N-1) × 100ms |
| `BulkReassignButton.tsx` | 98-104 | `for (const id of selectedIds) { await dataProvider.update }` | N sequential | ~(N-1) round trips |

**Critical Finding (2025-12-21):** The `deleteMany` method for opportunities executes RPC calls sequentially:

```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts:1018-1030
if (resource === "opportunities") {
  for (const id of params.ids) {
    const { error: rpcError } = await supabase.rpc(
      'archive_opportunity_with_relations',
      { opp_id: id }
    );
    // Sequential execution - O(N) round trips
  }
}
```

**Fix:** Create batch RPC `archive_opportunities_batch(opp_ids: int[])` or use `Promise.all()`.

---

## Over-Fetching Issues

### Excessive Pagination (perPage: 10000)

| File | Line | Table | Likely Max Records | Risk |
|------|------|-------|-------------------|------|
| `OverviewTab.tsx` | 100 | opportunities | ~200-500 | Medium - fetches all when only aggregates needed |
| `OverviewTab.tsx` | 118 | activities | ~1000-5000 | **HIGH** - 60-day activity history |
| `CampaignActivityReport.tsx` | 77 | opportunities | ~200-500 | Medium |
| `CampaignActivityReport.tsx` | 101 | activities (all) | ~500-2000 | **HIGH** - duplicate fetch |
| `CampaignActivityReport.tsx` | 113 | activities (filtered) | ~100-500 | Medium |
| `WeeklyActivitySummary.tsx` | 33 | activities | ~100-200 | Low - weekly scope |
| `OpportunitiesByPrincipalReport.tsx` | 204 | opportunities | ~200-500 | Medium |

**Impact:** These large fetches transfer excessive data over the network. For a 500-activity fetch with 20 fields each, that's ~50KB+ per request.

### select('*') Usage

| File | Line | Context | Assessment |
|------|------|---------|------------|
| `src/tests/**` | Multiple | Test files | ✅ Acceptable - test context |
| Data Provider | Internal | Supabase queries | ⚠️ Should audit - not visible in grep |

**Recommendation:** Audit `unifiedDataProvider.ts` for field selection optimization.

---

## Caching Issues

### Duplicate Queries (Same Data Fetched Multiple Times)

| Query | Locations | Duplicate Type | Recommendation |
|-------|-----------|----------------|----------------|
| Activities for campaign | `CampaignActivityReport.tsx:101` + `:113` | **Full duplicate** - fetches ALL activities, then fetches filtered | Fetch once with filters, derive counts from response |
| Sales reps | Multiple components | Repeated across views | Consider React context or global cache |
| Organizations (principals) | `AuthorizationsTab.tsx:159` | Per-dialog open | Already uses `enabled: addDialogOpen` (good) |

### Example: CampaignActivityReport Duplicate Fetch

```typescript
// Line 99-107: Fetches ALL activities for campaign (unfiltered)
const { data: allCampaignActivities } = useGetList("activities", {
  filter: { "opportunities.campaign": selectedCampaign },
  pagination: { page: 1, perPage: 10000 },
});

// Line 110-127: Fetches SAME activities with filters
const { data: activities } = useGetList("activities", {
  filter: {
    "opportunities.campaign": selectedCampaign,
    ...(dateRange?.start && { "created_at@gte": dateRange.start }),
    // ... more filters
  },
  pagination: { page: 1, perPage: 10000 },
});
```

**Fix:** Fetch once, filter client-side for counts, or use a single parameterized query.

---

## Unnecessary Refetches

### useEffect Dependency Issues

| File | Line | Dep | Issue | Fix |
|------|------|-----|-------|-----|
| (None found) | - | - | ✅ No issues detected | - |

**Good Practice Noted:** `OverviewTab.tsx:111-113` properly memoizes date objects to prevent infinite refetch loops:
```typescript
const now = useMemo(() => new Date().toISOString(), []);
const sixtyDaysAgo = useMemo(() => subDays(new Date(), 60).toISOString(), []);
```

### Over-Invalidation

| File | Line | Pattern | Assessment |
|------|------|---------|------------|
| Multiple | - | `useRefresh()` after mutations | ⚠️ Refreshes entire list - acceptable for simplicity |

---

## Waterfall Patterns

### Dependent Query Chains

| Start | Chain | Total RTT | Assessment | Fix |
|-------|-------|-----------|------------|-----|
| `OpportunitiesTab.tsx` | junction → opportunities | 2 RTT | ✅ **GOOD** - Uses `useGetMany` for batch fetch | None needed |
| `AuthorizationsTab.tsx` | authorizations → (per-card: principal, products, productAuths) | 1 + N×3 RTT | **BAD** - N+1 pattern | Join in parent or batch fetch |
| `OpportunityContactsTab.tsx` | junction → contacts | 2 RTT | ⚠️ **SUBOPTIMAL** - Uses `useGetList` not `useGetMany` | Use `useGetMany` |
| `OpportunityProductsTab.tsx` | junction → products | 2 RTT | ⚠️ **SUBOPTIMAL** - Uses `useGetList` not `useGetMany` | Use `useGetMany` |

### New Finding (2025-12-21): Suboptimal Junction Fetching

The slide-over tabs use `useGetList` with `filter: { id: ids }` instead of `useGetMany`:

```typescript
// src/atomic-crm/opportunities/slideOverTabs/OpportunityContactsTab.tsx:30-48
const { data: junctionRecords } = useGetList("opportunity_contacts", ...);
const contactIds = junctionRecords?.map((jr) => jr.contact_id) || [];

// SUBOPTIMAL: Should use useGetMany
const { data: contacts } = useGetList("contacts", {
  filter: { id: contactIds },  // ❌ Not designed for ID batch lookups
  pagination: { page: 1, perPage: 100 },
});
```

**Fix:** Use `useGetMany` which is designed for batch ID fetches:
```typescript
const { data: contacts } = useGetMany("contacts", { ids: contactIds });
```

Same pattern exists in `OpportunityProductsTab.tsx:46-64`.

### Good Pattern Example: OpportunitiesTab

```typescript
// Step 1: Fetch junction records
const { data: junctionRecords } = useGetList("opportunity_contacts", { ... });

// Step 2: Extract IDs
const opportunityIds = junctionRecords?.map(jr => jr.opportunity_id) || [];

// Step 3: Batch fetch using useGetMany (CORRECT!)
const { data: opportunities } = useGetMany("opportunities", { ids: opportunityIds });
```

---

## Positive Patterns Observed

| Pattern | Location | Benefit |
|---------|----------|---------|
| Conditional fetching with `enabled` | Multiple files | Prevents unnecessary queries |
| `useGetMany` for batch ID fetches | `OpportunitiesTab.tsx:43-47` | Avoids N+1 |
| Memoized date objects | `OverviewTab.tsx:111-113` | Prevents infinite loops |
| Lazy loading with `isExpanded` | `AuthorizationsTab.tsx:302` | Defers expensive queries |
| **staleTime caching** (5 min) | Dashboard hooks, entity data | Reduces network calls |
| **placeholderData: prev** | `useEntityData.ts` | Smooth UI during refetch |
| **Promise.all/allSettled** | Import handlers, metrics | Parallel execution |

### Caching Strategy (2025-12-21 Update)

The codebase has a well-defined caching strategy:

| staleTime | Usage | Files |
|-----------|-------|-------|
| 30 seconds | High-frequency data (task counts) | `useTaskCount.ts`, `CRM.tsx` |
| 5 minutes | Reference data (entities, lookups) | Dashboard hooks, filters |
| `placeholderData: prev` | Keep previous data during refetch | `useEntityData.ts`, `useHybridSearch.ts` |

---

## Performance Impact Estimates

| Issue Category | Count | Est. Latency Impact | Priority |
|----------------|-------|---------------------|----------|
| N+1 patterns in AuthorizationsTab | 3 | +500-2000ms per list view | **P0** |
| perPage: 10000 over-fetching | 7 | +100-300ms per query | **P1** |
| Duplicate activity fetches | 1 | +200-400ms | **P1** |
| Sequential bulk updates | 1 | +50ms × N items | P2 |

**Total Estimated Impact on Critical Path:** 800-2500ms (threatens 2-second goal)

---

## Prioritized Findings

### P0 - Critical (Blocks < 2s Goal)

1. **AuthorizationsTab N+1 Pattern** (`src/atomic-crm/organizations/AuthorizationsTab.tsx:289-313`)
   - Each authorization card triggers 1-3 additional queries
   - With 20 authorizations: 20-60 extra network requests
   - **Fix:** Fetch principal names via join in parent query, batch fetch with useGetMany

### P1 - High (Noticeable Delay)

1. **CampaignActivityReport Duplicate Fetch** (`src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:99-127`)
   - Fetches all activities twice (unfiltered + filtered)
   - **Fix:** Fetch once, derive unfiltered counts from full response

2. **Sequential deleteMany in Data Provider** (`unifiedDataProvider.ts:1018-1030`)
   - Bulk delete executes N sequential RPC calls
   - **Fix:** Create `archive_opportunities_batch(opp_ids: int[])` or use `Promise.all()`

3. **useGetList instead of useGetMany** (`OpportunityContactsTab.tsx`, `OpportunityProductsTab.tsx`)
   - Uses `useGetList` with ID filter instead of `useGetMany` for batch lookups
   - **Fix:** Replace with `useGetMany` which is optimized for ID batch fetching

4. **Excessive perPage: 10000 in Reports** (7 occurrences)
   - Fetches entire datasets when aggregates would suffice
   - **Fix:** Consider server-side aggregation or pagination

### P2 - Medium (Optimization)

1. **BulkReassignButton Sequential Updates** (`src/atomic-crm/organizations/BulkReassignButton.tsx:98-104`)
   - Sequential await in for loop
   - **Fix:** Use `Promise.allSettled` for parallel execution (if backend supports)

2. **Sales Rep Data Not Cached Globally**
   - Fetched in multiple components independently
   - **Fix:** Consider context provider or Tanstack Query cache sharing

---

## Recommendations

### Immediate Actions (This Sprint)

1. **Fix AuthorizationsTab N+1** - Estimated 500ms+ improvement
   ```typescript
   // Instead of fetching principal per card, join in parent query
   const { data: authorizations } = useGetList("distributor_principal_authorizations", {
     filter: { distributor_id: distributorId },
     meta: {
       select: '*, principal:organizations!principal_id(id, name)'  // Join principal
     }
   });
   ```

2. **Deduplicate CampaignActivityReport Queries** - Estimated 200ms improvement
   - Fetch activities once, compute counts from response

### Short-Term (Next 2 Sprints)

3. **Reduce perPage Limits** - Add server-side aggregation endpoints for report KPIs
4. **Audit Data Provider Selects** - Ensure `unifiedDataProvider.ts` uses specific field selection

### Long-Term

5. **Consider React Query/Tanstack Query** - Better cache sharing, deduplication built-in
6. **Add Query Performance Monitoring** - Track slow queries in production

---

## Verification Checklist

- [x] All useGetList usages analyzed (35+ found)
- [x] All useGetOne usages analyzed (8 found)
- [x] All useGetMany usages analyzed (4 found)
- [x] N+1 patterns identified (4 total: 3 in AuthorizationsTab + 1 in deleteMany)
- [x] Over-fetching catalogued (7 high-pagination queries in reports)
- [x] Caching issues found (1 duplicate fetch, good staleTime coverage overall)
- [x] Waterfall patterns analyzed (2 bad in slide-over tabs, 1 good in OrganizationsTab)
- [x] Positive patterns documented (staleTime, Promise.all, placeholderData)
- [x] Report created at `/docs/audits/code-quality/tier-1/query-efficiency-audit.md`

---

*Generated by Query Efficiency Auditor | Crispy CRM Code Quality Initiative*
*Last Updated: 2025-12-21*
