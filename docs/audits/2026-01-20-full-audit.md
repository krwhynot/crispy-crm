# Full Codebase Audit Report

**Date:** 2026-01-20 09:10
**Mode:** Full
**Duration:** 15 minutes
**Baseline:** 2026-01-18

---

## Executive Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Security | 1 | 23 | 6 | 30 |
| Data Integrity | 0 | 1 | 2 | 3 |
| Error Handling | 0 | 7 | 14 | 21 |
| DB Hardening | 1 | 27 | 72 | 100 |
| Stale State | 2 | 4 | 5 | 11 |
| Workflow Gaps | 2 | 5 | 8 | 15 |
| Architecture | 0 | 1 | 3 | 4 |
| TypeScript | 0 | 18 | 27 | 45 |
| Accessibility | 0 | 3 | 6 | 9 |
| Performance | 2 | 5 | 8 | 15 |
| Code Quality | 24 | 51 | 69 | 144 |
| **TOTAL** | **32** | **145** | **220** | **397** |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may experience incorrect data displays, slow performance with large datasets, or potential security exposure from overly permissive RLS policies. |
| **High** | Users may encounter stale data after mutations, N+1 query slowdowns during imports, or inconsistent behavior from deprecated code paths. |
| **Medium** | Users won't notice these immediately - they affect maintainability, test coverage, and future development velocity. |

**Status:** ⚠️ **CRITICAL** - 32 critical issues require attention before next release

---

## Delta from Last Full Audit

**Previous Audit:** 2026-01-18 | **Current:** 2026-01-20

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Critical Issues | 16 | 32 | +16 ⬆️ |
| High Issues | 83 | 145 | +62 ⬆️ |
| Medium Issues | 138 | 220 | +82 ⬆️ |
| **Total Issues** | **237** | **397** | **+160 ⬆️** |

### Understanding the Increase

The significant increase in findings is due to **expanded audit scope**, not codebase degradation:

1. **New Audits Added:**
   - Stale State audit (11 findings) - NEW
   - Workflow Gaps audit (15 findings) - NEW
   - TypeScript audit (45 findings) - EXPANDED scope
   - Code Quality audit (144 findings) - EXPANDED to include large files and deprecated code

2. **Existing Issues Remain:**
   - 6 perPage:1000 performance issues (unchanged)
   - 23 RLS permissive policies (existing)
   - 18 large files >500 lines (existing)

3. **Excellence Areas Maintained:**
   - Strangler Fig: 100% COMPLETE
   - RLS Coverage: 100% on all tables
   - Fail-Fast: 90%+ compliant
   - useWatch() Adoption: 92 occurrences
   - TypeScript Production Safety: 0.02 issues/file

### New Issues (Since Last Audit)

| # | Category | Severity | Issue | Location |
|---|----------|----------|-------|----------|
| 1 | stale-state | Critical | SalesCreate missing cache invalidation | src/atomic-crm/sales/SalesCreate.tsx:49 |
| 2 | stale-state | Critical | ArchiveActions missing cache invalidation | src/atomic-crm/opportunities/components/ArchiveActions.tsx |
| 3 | workflow-gaps | Critical | Silent status default to 'active' | productDistributors.service.ts:217 |
| 4 | workflow-gaps | Critical | Test pattern propagating to production | createResourceCallbacks.test.ts:238 |
| 5 | code-quality | Critical | 18 large files >500 lines | Multiple validation/component files |

### Fixed Issues (Since Last Audit)

| # | Category | Severity | Issue | Status |
|---|----------|----------|-------|--------|
| 1 | architecture | Critical | Direct Supabase in QuickLogForm | Fixed - uses dataProvider |
| 2 | stale-state | Critical | Missing refetch in ActivitiesTab | Fixed - staleTime configured |
| 3 | stale-state | Critical | Inconsistent task query keys | Fixed - uses taskKeys factory |

---

## All Critical Issues

**These MUST be addressed before deployment.**

### Security (1 Critical)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | SECURITY DEFINER View | public.entity_timeline | View bypasses RLS for querying user | Remove SECURITY DEFINER or use SECURITY INVOKER |

### DB Hardening (1 Critical)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | SECURITY DEFINER View | entity_timeline | Same as security finding | See SEC-001 |

### Stale State (2 Critical)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Missing Cache Invalidation | SalesCreate.tsx:49 | New users don't appear until manual refresh | Add queryClient.invalidateQueries({ queryKey: saleKeys.all }) |
| 2 | Missing Cache Invalidation | ArchiveActions.tsx:31,70 | Archive/unarchive doesn't update dashboard/kanban | Add opportunityKeys.all invalidation |

### Workflow Gaps (2 Critical)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Silent Status Default | productDistributors.service.ts:217 | `status \|\| "active"` masks validation failures | Remove fallback, use Zod validation |
| 2 | Test Pattern Propagation | createResourceCallbacks.test.ts:238 | Test shows fallback pattern that may be copied | Update test to expect validation error |

### Performance (2 Critical)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Large Pagination | useReportData.ts:111 | perPage: 1000 for reports | Implement server-side aggregation |
| 2 | Large Pagination | OpportunityArchivedList.tsx:25 | perPage: 1000 for archived list | Add pagination or virtualization |

### Code Quality (24 Critical)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1-18 | Large Files | 18 files >500 lines | See list below | Split into focused modules |
| 19-24 | Test File Bloat | 6 test files >700 lines | Long test files | Split by test category |

**Large Files (>500 lines):**
1. `validation/activities.ts` (759 lines)
2. `providers/supabase/extensions/types.ts` (696 lines)
3. `components/ui/sidebar.tsx` (673 lines)
4. `providers/supabase/filterRegistry.ts` (658 lines)
5. `contacts/useImportWizard.ts` (627 lines)
6. `opportunities/quick-add/QuickAddForm.tsx` (620 lines)
7. `contacts/columnAliases.ts` (612 lines)
8. `activities/QuickLogActivityDialog.tsx` (609 lines)
9. `reports/OpportunitiesByPrincipalReport.tsx` (603 lines)
10. `opportunities/kanban/OpportunityListContent.tsx` (585 lines)
11. `sales/UserDisableReassignDialog.tsx` (562 lines)
12. `validation/opportunities/opportunities-operations.ts` (546 lines)
13. `validation/contacts/contacts-core.ts` (517 lines)
14. `pages/WhatsNew.tsx` (514 lines)
15. `services/junctions.service.ts` (513 lines)
16. `providers/supabase/dataProviderUtils.ts` (507 lines)
17. `reports/CampaignActivity/CampaignActivityReport.tsx` (506 lines)
18. `components/SampleStatusBadge.tsx` (503 lines)

---

## All High Issues (Top 20)

| # | Category | Check | Location | Description |
|---|----------|-------|----------|-------------|
| 1 | security | RLS Always True | 11 tables (22 policies) | INSERT/UPDATE use WITH CHECK (true) |
| 2 | security | Leaked Password Protection | Auth Config | HaveIBeenPwned disabled |
| 3 | db-hardening | Missing FK Index | distributor_principal_authorizations.principal_id | No index on FK |
| 4 | db-hardening | Missing FK Index | opportunity_products.product_id_reference | No index on FK |
| 5 | db-hardening | Missing FK Index | product_distributor_authorizations.distributor_id | No index on FK |
| 6 | stale-state | Inconsistent Query Keys | tasks, notes, products | Hardcoded vs factory pattern |
| 7 | workflow-gaps | Hardcoded Stage | OverviewTab.tsx:255 | Uses "Lead" instead of STAGE constant |
| 8 | workflow-gaps | Required Field Fallback | OpportunitiesByPrincipalReport.tsx:251 | Stage \|\| "Unknown" |
| 9 | workflow-gaps | Required Field Fallback | ProductListContent.tsx:48-49 | principal_name \|\| "N/A" |
| 10 | performance | N+1 Query | useOrganizationImportMapper.ts:189 | Individual inserts in loop |
| 11 | performance | N+1 Query | useOrganizationImportMapper.ts:303 | Segment creation N+1 |
| 12 | performance | N+1 Query | useOrganizationImport.tsx:123 | Organization import N+1 |
| 13 | performance | N+1 Query | productDistributorsHandler.ts:143 | getMany fetches individually |
| 14 | typescript | Explicit any | 14 production files | any type usage |
| 15 | code-quality | Deprecated Code | 51 @deprecated annotations | Awaiting React Admin migration |
| 16 | code-quality | TODO/FIXME | 8 comments | Unfinished work |
| 17 | error-handling | Graceful Fallbacks | 7 locations | Storage utilities with fallbacks |
| 18 | error-handling | Silent Catch | 14 locations | Empty catch blocks |
| 19 | architecture | Business Logic in Provider | opportunitiesHandler.ts | Product sync logic in handler |
| 20 | accessibility | Small Touch Targets | Quick Create popovers | h-9 (36px) < 44px minimum |

---

## Category Summaries

### 1. Security

**Issues:** 1 critical, 23 high, 6 medium

The entity_timeline view uses SECURITY DEFINER, which bypasses RLS for the querying user. Additionally, 22 RLS policies across 11 tables use `USING (true)` or `WITH CHECK (true)`, effectively allowing any authenticated user to INSERT/UPDATE records without ownership checks.

**Key Actions:**
- Fix entity_timeline SECURITY DEFINER
- Enable leaked password protection
- Add ownership checks to RLS policies (future sprint)

### 2. Data Integrity

**Issues:** 0 critical, 1 high, 2 medium

**Strangler Fig Status: ✅ COMPLETED**
- unifiedDataProvider.ts: DELETED (0 lines)
- composedDataProvider.ts: 260 lines
- Handler count: 18+ modular handlers

The architecture migration is complete. All hard DELETEs are isolated to tests/seeds.

### 3. Error Handling

**Issues:** 0 critical, 7 high, 14 medium

**Fail-Fast Compliance: ✅ PASS**

No automatic retry patterns or circuit breakers found. The 7 graceful fallbacks are intentional and documented for security/UX in non-critical features. The 14 silent catch blocks are in utility functions.

### 4. DB Hardening

**Issues:** 1 critical, 27 high, 72 medium

All 27 tables have RLS enabled (100% coverage). Key issues:
- 3 missing indexes on FK columns
- 58 unused indexes (candidates for removal)
- 5 duplicate index pairs
- 19 RLS policies with auth.uid() InitPlan pattern

### 5. Stale State

**Issues:** 2 critical, 4 high, 5 medium

Two mutations (SalesCreate, ArchiveActions) don't invalidate relevant caches. Query key patterns are inconsistent - some files use factory (`taskKeys.all`) while others use hardcoded strings (`['tasks']`).

**Positive:** Dashboard hooks properly use staleTime: 5min with refetchOnWindowFocus.

### 6. Workflow Gaps

**Issues:** 2 critical, 5 high, 8 medium

Silent status defaults (`|| "active"`) violate fail-fast principles. Hardcoded stage strings appear in several files instead of using `STAGE` constants from stageConstants.ts.

**Database Consistency:** Good
- 0 orphaned opportunities
- 0 invalid stages
- 6 activities without opportunity links (minor)

### 7. Architecture

**Issues:** 0 critical, 1 high, 3 medium

**Strangler Fig: ✅ 100% COMPLETE**

Feature structure compliance: 8 compliant, 4 partial (by design), 1 incomplete (dashboard).

All Supabase imports correctly confined to provider layer.

### 8. TypeScript

**Issues:** 0 critical, 18 high (production), 27 medium

**Type Safety Score: 78%** (Production: 99.98%)

Only 18 type issues in 957 production files (0.02 issues/file). Most `any` usage is in test files for mock flexibility.

### 9. Accessibility

**Issues:** 0 critical, 3 high, 6 medium

**WCAG 2.1 AA Status: ✅ PASS**

Excellent ARIA support via centralized FormControl wrapper. All hardcoded colors are in acceptable locations (email templates, CSS definitions, tests).

One minor fix: Quick Create popover buttons at h-9 (36px) should be h-11 (44px).

### 10. Performance

**Issues:** 2 critical, 5 high, 8 medium

Two large pagination patterns (perPage: 1000) remain in reports and archived list. Four N+1 query patterns in import flows need batch optimization.

**Positive:** Excellent useMemo/useCallback coverage (200+ files), proper useWatch() patterns.

### 11. Code Quality

**Issues:** 24 critical, 51 high, 69 medium

18 non-generated files exceed 500 lines - primarily validation schemas, dialogs, and reports. 51 @deprecated annotations await React Admin upgrade.

**Codebase Metrics:**
- 920 source files
- 197K lines (excluding generated types)
- 101 Zod schemas
- Average 214 lines/file

---

## Recommendations (Priority Order)

### Immediate (Critical - Blocks Deployment)

1. **[Security]** Remove SECURITY DEFINER from entity_timeline view
2. **[Stale State]** Add cache invalidation to SalesCreate.tsx and ArchiveActions.tsx
3. **[Workflow]** Remove `status || "active"` fallback in productDistributors.service.ts

### Short-Term (High - Fix This Sprint)

1. **[DB]** Add indexes on 3 unindexed FK columns
2. **[Security]** Enable leaked password protection in Supabase Auth
3. **[Stale State]** Replace hardcoded query keys with factory pattern
4. **[Performance]** Batch import operations to eliminate N+1 patterns
5. **[Workflow]** Replace hardcoded stage strings with STAGE constants

### Technical Debt (Medium - Schedule for Backlog)

1. **[Code Quality]** Split 18 large files into focused modules
2. **[Deprecated]** Schedule React Admin hook migration
3. **[Accessibility]** Update Quick Create button heights to h-11
4. **[Performance]** Implement server-side report aggregation

---

## Excellence Areas

The audit also identified strong patterns worth preserving:

- ✅ **Strangler Fig: 100% COMPLETE** - All resources via composed handlers
- ✅ **RLS Coverage: 100%** - All 35 tables have policies
- ✅ **Fail-Fast: 90%+** - No automatic retries or circuit breakers
- ✅ **useWatch() Adoption** - 92 occurrences for optimized form subscriptions
- ✅ **TypeScript Production Safety** - 0.02 issues per file
- ✅ **Accessibility Patterns** - Centralized FormControl with ARIA support
- ✅ **Query Key Factory** - Well-structured queryKeys.ts with hierarchy

---

## Audit Methodology

### Parallel Execution

Audits were executed in 3 batches across 11 specialized agents:

1. **Batch 1 (Critical):** security, data-integrity, error-handling, db-hardening
2. **Batch 2 (High Priority):** stale-state, workflow-gaps, architecture, typescript
3. **Batch 3 (Standard):** accessibility, performance, code-quality

### Tools Used
- Supabase MCP: Security advisors, performance advisors, SQL queries
- ripgrep: Pattern matching across codebase
- wc: File size analysis
- Baseline comparison: docs/audits/.baseline/full-audit.json

---

*Generated by `/audit:full` command*
*Report location: docs/audits/2026-01-20-full-audit.md*
