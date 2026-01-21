# Full Codebase Audit Report

**Date:** 2026-01-20 20:12
**Mode:** Full
**Duration:** 15 minutes
**Previous Audit:** 2026-01-20 09:10

---

## Executive Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Security | 1 | 3 | 20 | 24 |
| Data Integrity | 2 | 4 | 3 | 9 |
| Error Handling | 0 | 3 | 28 | 31 |
| DB Hardening | 1 | 27 | 22 | 50 |
| Stale State | 0 | 3 | 6 | 9 |
| Workflow Gaps | 1 | 3 | 5 | 9 |
| Architecture | 1 | 3 | 5 | 9 |
| TypeScript | 0 | 4 | 12 | 16 |
| Accessibility | 0 | 3 | 6 | 9 |
| Performance | 2 | 5 | 8 | 15 |
| Code Quality | 3 | 8 | 12 | 23 |
| **TOTAL** | **11** | **66** | **127** | **204** |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical (11)** | Users may encounter data integrity issues with orphaned records, performance degradation with large datasets, or maintainability blockers in oversized files. Most critical issues are architectural debt, not user-facing bugs. |
| **High (66)** | Primarily RLS policy permissiveness (security hardening), missing cache invalidation (stale data), and code patterns that should be improved. Users may notice occasional stale data after updates. |
| **Medium (127)** | Code quality and maintainability issues that don't directly affect users but slow feature development. Touch target sizing below 44px on some popovers. |

**Status:** ⚠️ **IMPROVED** - Critical issues reduced from 32 to 11 (-66%)

---

## Delta from Last Full Audit

**Previous Audit:** 2026-01-20 09:10 | **Current:** 2026-01-20 20:12

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Critical Issues | 32 | 11 | **-21 (-66%)** |
| High Issues | 145 | 66 | **-79 (-54%)** |
| Medium Issues | 220 | 127 | **-93 (-42%)** |
| **Total Issues** | **397** | **204** | **-193 (-49%)** |

### Key Improvements Since Last Audit

1. **Stale State Issues Fixed**: Previous critical cache invalidation issues (SS-001, SS-002) no longer detected
2. **Workflow Gaps Addressed**: Silent status defaults and test pattern propagation issues resolved
3. **TypeScript Improvements**: Zero `any` in production code (all 220 occurrences in tests only)
4. **Error Handling Compliance**: Fail-fast pattern followed - no retry logic or circuit breakers
5. **Code Quality Rebaselining**: Many "critical" large files now properly categorized

### New Issues Found (This Audit)

| # | Category | Severity | Issue | Location |
|---|----------|----------|-------|----------|
| 1 | data-integrity | Critical | Hard DELETE in sync_opportunity_contacts RPC | supabase/migrations/20251231120000 |
| 2 | data-integrity | Critical | Hard DELETE in merge_duplicate_contacts RPC | supabase/migrations/20251123215857 |
| 3 | architecture | Critical | Direct Supabase auth call in useCurrentSale | src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts:3 |
| 4 | performance | Critical | N+1 query pattern (3 useGetOne calls) | src/atomic-crm/activities/slideOverTabs/ActivityRelatedTab.tsx |

### Previously Fixed Issues (Confirmed)

| # | Category | Severity | Issue | Fixed Date |
|---|----------|----------|-------|------------|
| 1 | security | Critical | Hardcoded secrets in .env.cloud | 2026-01-17 |
| 2 | architecture | Critical | Direct Supabase import in QuickLogForm | 2026-01-15 |
| 3 | stale-state | Critical | Missing refetch in ActivitiesTab | 2026-01-17 |
| 4 | stale-state | Critical | Inconsistent query keys in Tasks | 2026-01-17 |

---

## All Critical Issues (11)

**These should be addressed in priority order.**

| # | Category | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | security | RLS Disabled | public.task_id_mapping | Table has no RLS policies | Enable RLS and add SELECT policy |
| 2 | data-integrity | Hard DELETE | sync_opportunity_contacts RPC | Bypasses soft delete | Replace with UPDATE SET deleted_at = NOW() |
| 3 | data-integrity | Hard DELETE | merge_duplicate_contacts RPC | Permanently deletes contacts | Use soft delete pattern |
| 4 | db-hardening | RLS Disabled | public.task_id_mapping | Same as SEC-001 | Enable RLS policies |
| 5 | workflow-gaps | DB Stage Default | opportunities table | Default 'new_lead' can mask missing data | Consider removing DB default |
| 6 | architecture | Direct Supabase Import | useCurrentSale.ts:3 | Calls supabase.auth.getUser() directly | Use authProvider or React Admin hooks |
| 7 | performance | Large Pagination | useReportData.ts:111 | perPage: 1000 is time bomb | Implement server-side aggregation |
| 8 | performance | N+1 Query Pattern | ActivityRelatedTab.tsx | 3 independent useGetOne calls | Batch with useGetMany or RPC |
| 9 | code-quality | Large File | QuickAddForm.tsx (620 lines) | 6 components in one file | Extract to separate files |
| 10 | code-quality | Large File | QuickLogActivityDialog.tsx (609 lines) | Mixed concerns | Split into form/hook/utilities |
| 11 | code-quality | Large File | useImportWizard.ts (627 lines) | Oversized state machine | Extract reducers to separate files |

---

## All High Issues (Top 20 by Priority)

| # | Category | Check | Location | Fix |
|---|----------|-------|----------|-----|
| 1 | security | Function Search Path | deprecated_tasks_access_notice | SET search_path = public |
| 2 | security | Function Search Path | set_activity_created_by | SET search_path = public |
| 3 | security | Leaked Password Protection | Supabase Auth Config | Enable HaveIBeenPwned check |
| 4 | db-hardening | Permissive RLS (22 policies) | Multiple tables | Replace WITH CHECK (true) |
| 5 | db-hardening | Unindexed FK | distributor_principal_authorizations.principal_id | Add index |
| 6 | db-hardening | Unindexed FK | opportunity_products.product_id_reference | Add index |
| 7 | db-hardening | Unindexed FK | product_distributor_authorizations.distributor_id | Add index |
| 8 | data-integrity | Orphaned Opportunities | 3 records | Link contacts or cleanup |
| 9 | data-integrity | Unlinked Activities | 9 records | Link to entities or cleanup |
| 10 | data-integrity | Missing actual_close_date | closeOpportunitySchema | Auto-populate on close |
| 11 | architecture | Zod in Form | ContactCompactForm.tsx:17 | Move to API boundary |
| 12 | architecture | Zod in Form | QuickAddOpportunity.tsx:4 | Move to API boundary |
| 13 | architecture | Direct Supabase Query | timelineHandler.ts:100 | Document exception or use baseProvider |
| 14 | error-handling | Silent Catch | filterPrecedence.ts:174 | Add console.warn |
| 15 | error-handling | Silent Catch | StorageService.ts:151 | Differentiate errors |
| 16 | error-handling | Silent Catch | StorageService.ts:39 | Log error context |
| 17 | stale-state | Missing Invalidation | useOrganizationImport.tsx:184-189 | Add queryClient.invalidateQueries |
| 18 | stale-state | Missing Invalidation | useOrganizationImportMapper.ts:190,304 | Invalidate sales/segment keys |
| 19 | stale-state | Missing staleTime | OpportunityListFilter.tsx:36-47 | Add staleTime: 5 * 60 * 1000 |
| 20 | workflow-gaps | Orphaned Opportunities | Database | 3 opportunities without contacts |

---

## Category Summaries

### 1. Security (1 Critical, 3 High, 20 Medium)

**RLS Coverage:** 28/29 tables (96.6%) - only task_id_mapping missing

**Key Findings:**
- 1 table without RLS (task_id_mapping)
- 2 functions with mutable search_path
- 22 overly permissive RLS policies using WITH CHECK (true)
- Leaked password protection disabled

**Positive:** No XSS, no hardcoded secrets, no SQL injection, Zod validation mostly proper

---

### 2. Data Integrity (2 Critical, 4 High, 3 Medium)

**Strangler Fig Status:** ✅ COMPLETE
- composedDataProvider.ts: 260 lines
- Handler files: 24
- unifiedDataProvider.ts: Fully migrated

**Key Findings:**
- 2 RPC functions with hard DELETE (sync_opportunity_contacts, merge_duplicate_contacts)
- 3 orphaned opportunities, 9 unlinked activities in database
- No application-level .delete() calls - all use soft delete

---

### 3. Error Handling (0 Critical, 3 High, 28 Medium)

**Fail-Fast Compliance:** ✅ PASS
- No retry logic
- No circuit breakers
- No exponential backoff

**Key Findings:**
- 3 silent catch blocks in StorageService/filterPrecedence
- Many UI catch blocks notify user but don't log error details
- All Zod validation catches return false appropriately

---

### 4. DB Hardening (1 Critical, 27 High, 22 Medium)

**Key Findings:**
- 22 overly permissive RLS policies
- 3 unindexed foreign keys
- 5 duplicate index sets (cleanup needed)
- Missing UNIQUE constraints on 2 junction tables

---

### 5. Stale State (0 Critical, 3 High, 6 Medium)

**Key Findings:**
- Missing cache invalidation in organization import flow
- Inconsistent query key usage (['tasks'] vs taskKeys.all)
- refetchOnWindowFocus: false on some filter dropdowns

**Positive:** Excellent optimistic update patterns in useMyTasks, useFavorites, Kanban

---

### 6. Workflow Gaps (1 Critical, 3 High, 5 Medium)

**Database Consistency:**
- Orphaned opportunities: 3
- Unlinked activities: 9
- Invalid stages: 0 ✅
- Closed without reason: 0 ✅

**Key Findings:**
- DB default 'new_lead' on stage column
- Missing actual_close_date auto-population
- Silent defaults on activity_type and interaction_type

---

### 7. Architecture (1 Critical, 3 High, 5 Medium)

**Feature Compliance:**
- Compliant: 7 (contacts, organizations, opportunities, products, activities, tasks, sales)
- Partial: 3 (productDistributors, notes, tags)
- Incomplete: 3 (notifications, settings, admin)

**Key Findings:**
- Direct Supabase auth call in useCurrentSale hook
- Zod validation in form components (should be API boundary)
- Handler pattern compliance: EXCELLENT

---

### 8. TypeScript (0 Critical, 4 High, 12 Medium)

**Type Safety Metrics:**
- any in production: 0 ✅
- any in tests: 220 (acceptable)
- Non-null assertions: 52 in production
- Type assertions: 46

**Key Findings:**
- Zero explicit `any` in production code
- Unsafe double casts in TransformService
- Non-null assertions in critical paths (main.tsx, dataProviderUtils.ts)

---

### 9. Accessibility (0 Critical, 3 High, 6 Medium)

**WCAG 2.1 AA Status:** ✅ PASS

**Key Findings:**
- Small touch targets (h-9 = 36px) in QuickCreate popovers
- Icon buttons in Storybook missing aria-label

**Positive:** Excellent aria-invalid, role="alert", aria-describedby coverage. Zero hardcoded colors.

---

### 10. Performance (2 Critical, 5 High, 8 Medium)

**Key Findings:**
- perPage: 1000 in reports (time bomb)
- N+1 query pattern in ActivityRelatedTab
- Missing React.memo on PrincipalOpportunityCard
- index as key in 35+ locations

**Positive:** useWatch pattern followed, React.lazy code splitting, debounced search

---

### 11. Code Quality (3 Critical, 8 High, 12 Medium)

**Large Files (>500 lines):** 21 (excluding generated types)

**Key Findings:**
- QuickAddForm.tsx (620 lines) - 6 components in one file
- QuickLogActivityDialog.tsx (609 lines) - mixed concerns
- 60+ console statements in production
- 406 repeated className patterns

---

## Recommendations (Priority Order)

### Immediate (Critical - This Sprint)

1. **Enable RLS on task_id_mapping table**
2. **Fix hard DELETE in sync_opportunity_contacts RPC** - Replace with soft delete
3. **Fix hard DELETE in merge_duplicate_contacts RPC** - Verify fix migration applied
4. **Implement server-side aggregation for reports** - Remove perPage: 1000

### Short-Term (High - Next 2 Sprints)

1. Fix function search_path on SECURITY DEFINER functions
2. Tighten 22 overly permissive RLS policies
3. Add indexes to 3 unindexed foreign keys
4. Add cache invalidation to organization import flow
5. Batch useGetOne calls in ActivityRelatedTab

### Technical Debt (Medium - Schedule for Backlog)

1. Split large component files (QuickAddForm, QuickLogActivityDialog)
2. Extract common className patterns to utilities
3. Replace 52 non-null assertions with proper null checks
4. Update touch targets from h-9 to h-11 in popovers

---

## Excellence Areas

The codebase demonstrates strong engineering practices:

- ✅ **Strangler Fig Migration:** 100% COMPLETE - 24 composed handlers
- ✅ **Fail-Fast Compliance:** No retry logic, circuit breakers, or graceful degradation
- ✅ **TypeScript Safety:** 0 `any` in production code
- ✅ **Semantic Colors:** Zero hardcoded hex/Tailwind colors
- ✅ **Form Optimization:** useWatch() pattern properly followed
- ✅ **Code Splitting:** React.lazy on all resources
- ✅ **Optimistic Updates:** Proper rollback patterns in kanban/favorites

---

## Audit Methodology

### Parallel Execution

Audits were executed in 3 batches:

1. **Batch 1 (Critical):** security, data-integrity, error-handling, db-hardening
2. **Batch 2 (High Priority):** stale-state, workflow-gaps, architecture, typescript
3. **Batch 3 (Standard):** accessibility, performance, code-quality

### Tools Used

- Supabase MCP: get_advisors (security, performance)
- ripgrep: Pattern matching across codebase
- TypeScript analysis: tsconfig.json strict mode verification
- Manual file reads: Critical path validation

---

*Generated by `/audit:full` command*
*Report location: docs/audits/2026-01-20-full-audit.md*
*Confidence: 90% [High - Based on automated scans and MCP advisor integration]*
