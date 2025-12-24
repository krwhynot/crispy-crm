# Query Efficiency Audit Report

**Agent:** 7 - Query Efficiency Auditor
**Date:** 2025-12-24
**Queries Analyzed:** 50+ query patterns across 146 files with data fetching

---

## Executive Summary

The Crispy CRM codebase demonstrates **generally good query efficiency practices**. React Admin's `useGetMany` is properly used for batch fetching, debouncing is implemented consistently (300ms), and the database has comprehensive indexing. The main concerns are: one instance of excessive pagination (`perPage: 1000`), global caching configuration that may cause unnecessary refetches, and a few parallel fetch opportunities that could be optimized.

**Estimated Impact on 2-Second Goal:** **Low risk** - Most patterns are already efficient. The identified issues are edge cases that won't significantly impact the typical account manager workflow.

---

## N+1 Query Patterns

### Confirmed N+1 Issues
| File | Line | Pattern | Records | Est. Queries | Fix |
|------|------|---------|---------|--------------|-----|
| *None found* | - | - | - | - | - |

**Good Practice Examples Found:**
- `OpportunitiesTab.tsx:49-53` - Uses `useGetMany` for batch fetching opportunity details
- `TagsListEdit.tsx:29` - Uses `useGetMany` for batch fetching tags

### Potential N+1 (Needs Verification)
| File | Line | Pattern | Investigate |
|------|------|---------|-------------|
| `QuickLogActivityDialog.tsx` | 388-404 | 3x `useGetOne` calls | Uses `enabled` flag properly - runs only when needed, not in loop |
| `ContactHierarchyBreadcrumb.tsx` | 19 | `useGetOne` for parent org | Single fetch per component, acceptable |

**Analysis:** The codebase correctly uses React Admin's batch fetching patterns. No actual N+1 issues where queries run inside loops were found.

---

## Over-Fetching Issues

### SELECT * Patterns
| File | Line | Table | Context | Issue |
|------|------|-------|---------|-------|
| Tests only | Various | `*_summary` | Test files | Acceptable for tests |
| Production code | N/A | Uses summary views | Data provider | Summary views are already optimized |

**Good Practice:** The data provider uses optimized summary views (`contacts_summary`, `opportunities_summary`, `organizations_summary`) instead of base tables for list views. These views pre-compute aggregates, reducing joins at query time.

### Large Page Size Issues
| File | Line | Resource | perPage | Should Be |
|------|------|----------|---------|-----------|
| `OpportunityArchivedList.tsx` | 25 | opportunities | 1000 | 100 (with pagination) |

**Recommendation:** The archived list fetches up to 1000 records at once. This could cause slow loads if many opportunities are archived. Add pagination with max 100 per page.

### Per-Page Configuration Summary
| List | Current perPage | Assessment |
|------|-----------------|------------|
| TaskList | 100 | Reasonable for tasks |
| OpportunityList | 25 | Good |
| ContactList | 25 | Good |
| ActivityList | 50 | Good |
| ProductList | 25 | Good |
| NotificationsList | 20 | Good |
| **OpportunityArchivedList** | **1000** | **Too high - P2** |

---

## Waterfall Request Patterns

### Sequential Requests (Should Be Parallel)
| File | Lines | Requests | Current | Should Be |
|------|-------|----------|---------|-----------|
| *None found requiring parallelization* | - | - | - | - |

**Good Practices Found:**

1. **Dashboard uses `CurrentSaleProvider`** (`dashboard/v3/index.tsx:64`)
   - Caches `salesId` at dashboard level
   - Prevents 4+ redundant queries from child components (KPIs, Tasks, Pipeline)
   - Saves ~100-200ms on initial load

2. **Promise.allSettled for parallel operations** (`useKPIMetrics.ts:121`, `useMyPerformance.ts:141`)
   - KPI metrics fetched in parallel with resilient error handling
   - Partial failures don't block entire dashboard

### useEffect Chains
| File | Pattern | Assessment |
|------|---------|------------|
| `OpportunityArchivedList.tsx` | Two useEffects for dialog state | Sequential by design (not a waterfall) |

**Analysis:** No problematic waterfall patterns found. The codebase makes good use of parallel fetching where appropriate.

---

## Caching Issues

### Global Configuration (`CRM.tsx:86-87`)
```typescript
staleTime: 30 * 1000, // 30 seconds
refetchOnWindowFocus: true,
```

**Issue:** With `refetchOnWindowFocus: true` and only 30-second stale time, switching windows/tabs triggers refetches frequently. For CRM data that doesn't change that rapidly, this causes unnecessary network traffic.

**Recommendation:** Consider:
- Increase global `staleTime` to 60 seconds
- Set `refetchOnWindowFocus: false` globally, enable selectively for dashboards

### Component-Level Cache Configuration (Good Practices)
| Query | File | staleTime | refetchOnWindowFocus |
|-------|------|-----------|----------------------|
| ChangeLog | `ChangeLogTab.tsx:61` | 5 min | default |
| Similar opportunities | `useSimilarOpportunityCheck.ts:136` | 5 min | N/A |
| Filter dropdowns | `OpportunityListFilter.tsx:108` | 5 min | false |
| Product filters | `ProductListFilter.tsx:19` | 5 min | false |
| My tasks | `useMyTasks.ts:44` | 5 min | default |
| Task count | `useTaskCount.ts:31` | 30 sec | default |
| Principal pipeline | `usePrincipalPipeline.ts:45` | 5 min | default |
| Entity data | `useEntityData.ts:112+` | 5 min | default |

**Assessment:** Component-level caching is well-implemented. Dropdown/filter data correctly uses longer stale times with `refetchOnWindowFocus: false`.

### Unnecessary Refetches
| File | Line | Trigger | Recommendation |
|------|------|---------|----------------|
| Global | - | Window focus | Add `refetchOnWindowFocus: false` to global config |

---

## List Performance

### Pagination Analysis
| List | Default Size | Max Size | Recommendation |
|------|--------------|----------|----------------|
| OpportunityList | 25 | 25 | OK |
| ContactList | 25 | 25 | OK |
| TaskList | 100 | 100 | OK - tasks need quick scanning |
| ActivityList | 50 | 50 | OK |
| ProductList | 25 | 25 | OK |
| **OpportunityArchivedList** | **1000** | **1000** | **Reduce to 100 with pagination** |

### Filter Performance
| List | Debounced? | Debounce Time | Issue |
|------|------------|---------------|-------|
| ProductList | ✅ | 300ms | None |
| TaskList | ✅ | 300ms | None |
| ContactList | ✅ | 300ms | None |
| OrganizationList | ✅ | 300ms | None |
| QuickLogForm (entity search) | ✅ | 300ms | None |

**Assessment:** All text filters are properly debounced at 300ms. No keystroke-triggered queries.

---

## Index Recommendations

### Existing Indexes (Comprehensive Coverage)
The database already has **100+ indexes** covering:

| Table | Indexed Columns |
|-------|-----------------|
| opportunities | stage, status, owner_id, customer_organization_id, principal_organization_id, estimated_close_date, priority, campaign, deleted_at, search_tsv (GIN) |
| organizations | name, sales_id, organization_type, is_principal, is_distributor, parent_organization_id, priority, deleted_at, search_tsv (GIN) |
| contacts | organization_id, sales_id, deleted_at, search_tsv (GIN), district, manager |
| activities | contact_id, organization_id, opportunity_id, activity_date, activity_type, created_by, follow_up_date |
| tasks | sales_id, due_date, contact_id, opportunity_id, organization_id, snooze_until, deleted_at |
| products | principal_id, category, sku, status, search_tsv (GIN) |

### Potential Missing Indexes
| Table | Column | Query Pattern | Priority | Evidence |
|-------|--------|---------------|----------|----------|
| *None identified* | - | - | - | Indexes are comprehensive |

**Assessment:** Database indexing is thorough. All commonly filtered and sorted columns have indexes. Partial indexes (e.g., `WHERE deleted_at IS NULL`) optimize soft-delete queries.

---

## Performance Impact Summary

| Issue Type | Count | Est. Time Impact | Priority |
|------------|-------|------------------|----------|
| N+1 patterns | 0 | None | - |
| Over-fetching (pagination) | 1 | +200-500ms on archived view | P2 |
| Waterfall patterns | 0 | None | - |
| Missing cache config | 1 | +50-100ms on window refocus | P3 |
| Missing indexes | 0 | None | - |

---

## Recommendations

### Priority 1 (Before Launch)
*None - no critical issues found*

### Priority 2 (Soon After Launch)
1. **Reduce `OpportunityArchivedList` perPage from 1000 to 100**
   - File: `src/atomic-crm/opportunities/OpportunityArchivedList.tsx:25`
   - Impact: Prevents slow loads when many opportunities are archived
   - Effort: Low (change one line)

### Priority 3 (Nice to Have)
2. **Optimize global React Query config**
   - File: `src/atomic-crm/root/CRM.tsx:86-87`
   - Change: Increase `staleTime` to 60s, set `refetchOnWindowFocus: false`
   - Impact: Reduces unnecessary network traffic on tab switches
   - Effort: Low

3. **Add staleTime to OpportunityArchivedList query**
   - Currently re-fetches on every dialog open
   - Add `staleTime: 5 * 60 * 1000` to prevent unnecessary refetches

---

## Positive Findings

The codebase demonstrates excellent query efficiency practices:

1. **Batch Fetching**: Uses `useGetMany` instead of loops with `useGetOne`
2. **Summary Views**: Optimized database views for list operations
3. **Debouncing**: Consistent 300ms debounce on all text filters
4. **Parallel Fetching**: `Promise.allSettled` for dashboard metrics
5. **Context Providers**: `CurrentSaleProvider` prevents redundant identity queries
6. **Comprehensive Indexing**: 100+ database indexes covering all common query patterns
7. **Lazy Loading**: Dashboard uses `React.lazy` for code splitting
8. **Component-Level Caching**: Filter dropdowns use 5-minute stale times

---

## Verification Checklist

- [x] N+1 patterns identified (none found)
- [x] Over-fetching documented (1 pagination issue)
- [x] Waterfall patterns found (none problematic)
- [x] Caching analyzed (mostly good, 1 global config suggestion)
- [x] List performance checked (pagination reasonable except archived)
- [x] Index needs assessed (comprehensive coverage exists)
- [x] Output file created at specified location
