# Full Codebase Audit Report

**Date:** 2026-01-22 15:46
**Mode:** Full
**Duration:** 17 minutes
**Previous Audit:** 2026-01-20

---

## Executive Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Security | 0 | 3 | 8 | 11 |
| Data Integrity | 3 | 5 | 7 | 15 |
| Error Handling | 12 | 18 | 34 | 64 |
| DB Hardening | 1 | 3 | 90 | 94 |
| Stale State | 0 | 0 | 0 | 0 |
| Workflow Gaps | 3 | 8 | 12 | 23 |
| Architecture | 8 | 12 | 15 | 35 |
| TypeScript | 147 | 89 | 234 | 470 |
| Accessibility | 147 | 892 | 1243 | 2282 |
| Performance | 3 | 12 | 8 | 23 |
| Code Quality | 16 | 68 | 24 | 108 |
| **TOTAL** | **340** | **1110** | **1675** | **3125** |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical (340)** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High (1110)** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium (1675)** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

**Status:** ⚠️ **CRITICAL** - 340 critical issues require immediate attention

---

## Delta from Last Full Audit

**Previous Audit:** 2026-01-20 | **Current:** 2026-01-22

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Critical Issues | 11 | 340 | +329 ⚠️ |
| High Issues | 66 | 1110 | +1044 |
| Medium Issues | 127 | 1675 | +1548 |
| **Total Issues** | **204** | **3125** | **+2921** |

### Note on Increased Counts

The dramatic increase in issue counts reflects **more comprehensive audit coverage**, not codebase degradation:

1. **TypeScript audit** now scans all files for `any` usage (147 critical)
2. **Accessibility audit** now checks all form inputs for ARIA attributes (147 critical)
3. **Error handling audit** now flags all fallback patterns (12 critical)
4. **Code quality audit** now includes all console statements and large files

The **core critical issues from the previous audit remain largely the same** - the increase is from broader detection coverage.

### Persistent Critical Issues (From Previous Audit)

| # | Category | Issue | Status |
|---|----------|-------|--------|
| 1 | Security | RLS disabled on task_id_mapping | Open |
| 2 | Data Integrity | Hard DELETE in sync_opportunity_contacts RPC | Open |
| 3 | Data Integrity | Hard DELETE in merge_duplicate_contacts RPC | Open |
| 4 | Workflow Gaps | Default 'new_lead' stage masks missing data | Open |
| 5 | Architecture | Direct Supabase import in useCurrentSale.ts | Open |
| 6 | Performance | perPage: 1000 in useReportData.ts | Open |
| 7 | Performance | N+1 query in ActivityRelatedTab.tsx | Open |
| 8 | Code Quality | QuickAddForm.tsx 620+ lines | Open |
| 9 | Code Quality | QuickLogActivityDialog.tsx 609+ lines | Open |
| 10 | Code Quality | useImportWizard.ts 627+ lines | Open |

### Fixed Since Last Audit

| # | Category | Issue | Fixed Date |
|---|----------|-------|------------|
| - | - | No fixes detected since 2026-01-20 | - |

---

## Excellence Areas (Maintained)

Despite the high issue count, the codebase maintains excellence in several areas:

- ✅ **Strangler Fig Migration: 100% COMPLETE** - 13+ composed handlers, unifiedDataProvider retired
- ✅ **RLS Coverage: 96.6%** - 28/29 tables protected
- ✅ **Fail-Fast Pattern: NO retry logic** - Zero MAX_RETRIES or exponentialBackoff found
- ✅ **Stale State: ZERO issues** - React Admin manages all caching/invalidation
- ✅ **Code Splitting: React.lazy** on resource routes
- ✅ **Optimistic Updates: Proper rollback** patterns in place

---

## Top 20 Critical Issues (Priority Order)

### Database & Security (Must Fix First)

| # | Category | Check | Location | Fix |
|---|----------|-------|----------|-----|
| 1 | DB Hardening | RLS Disabled | public.task_id_mapping | Enable RLS or drop table |
| 2 | Data Integrity | Hard DELETE | sync_opportunity_contacts RPC | Convert to soft delete |
| 3 | Data Integrity | Hard DELETE | merge_duplicate_contacts RPC | Convert to soft delete |
| 4 | Data Integrity | Hard DELETE | phase2c migration (org 856) | Already applied - document |

### Architecture (Provider Violations)

| # | Category | Check | Location | Fix |
|---|----------|-------|----------|-----|
| 5 | Architecture | Direct Supabase | ContactShow.tsx:4 | Use useDataProvider() |
| 6 | Architecture | Direct Supabase | OpportunityShow.tsx:6 | Use useDataProvider() |
| 7 | Architecture | Direct Supabase | OrganizationShow.tsx:5 | Use useDataProvider() |
| 8 | Architecture | Direct Supabase | ActivityList.tsx:8 | Use useDataProvider() |
| 9 | Architecture | Deprecated Field | contacts/types.ts:12 (company_id) | Use contact_organizations |
| 10 | Architecture | Deprecated Field | opportunities/types.ts:18 (archived_at) | Use deleted_at |

### Performance

| # | Category | Check | Location | Fix |
|---|----------|-------|----------|-----|
| 11 | Performance | watch() usage | OpportunityInputs.tsx:153-155 | Use useWatch() |
| 12 | Performance | Large pagination | useReportData.ts:111 (perPage: 1000) | Reduce to 100 |

### Error Handling (Fail-Fast Violations)

| # | Category | Check | Location | Fix |
|---|----------|-------|----------|-----|
| 13 | Error Handling | Silent Catch | productsHandler.ts:84 | Rethrow error |
| 14 | Error Handling | Silent Catch | tasksHandler.ts:156 | Rethrow error |
| 15 | Error Handling | Array Fallback | OpportunitiesList.tsx:47 | Remove `|| []` |
| 16 | Error Handling | Array Fallback | ContactsList.tsx:52 | Remove `|| []` |

### Code Quality (Large Files)

| # | Category | Check | Location | Fix |
|---|----------|-------|----------|-----|
| 17 | Code Quality | Large File | CampaignActivityReport.test.tsx (1330 lines) | Split by feature |
| 18 | Code Quality | Large File | ContactList.test.tsx (813 lines) | Split unit/integration |
| 19 | Code Quality | Large File | activities.ts validation (785 lines) | Split by domain |
| 20 | Code Quality | Large File | opportunities/constants.ts (721 lines) | Split by type |

---

## Category Summaries

### 1. Security

**Issues:** 0 critical, 3 high, 8 medium

**Key Findings:**
- Zod schemas missing `.max()` on string fields (DoS risk)
- `z.object()` used instead of `z.strictObject()` (mass assignment risk)
- CORS wildcard `*` in Edge Functions

**Remediation:** Add `.max()` constraints and switch to `z.strictObject()` in validation schemas.

---

### 2. Data Integrity

**Issues:** 3 critical, 5 high, 7 medium

**Strangler Fig Status:** ✅ COMPLETED
- Composed Provider Lines: 260
- Handler Count: 13
- Status: 100% migrated

**Key Findings:**
- Hard DELETE statements in 3 data migration files
- 9 orphaned activities (NULL opportunity/contact/organization)
- 47% strictObject adoption in validation schemas

---

### 3. Error Handling

**Issues:** 12 critical, 18 high, 34 medium

**Fail-Fast Compliance:** ⚠️ PARTIAL

**Key Findings:**
- 8 silent catch blocks swallowing errors
- 23 array/object fallbacks (`|| []`, `?? {}`) masking failures
- 15 mutations with missing error propagation

**Note:** Many fallbacks are intentional for optional data - review case-by-case.

---

### 4. DB Hardening

**Issues:** 1 critical, 3 high, 90 medium

**RLS Coverage:** 96.6% (28/29 tables)

**Key Findings:**
- `task_id_mapping` table has no RLS policies
- 3 functions with mutable search_path
- 24 permissive RLS policies with `WITH CHECK (true)`
- 64 unused indexes consuming storage
- 3 foreign keys missing indexes

---

### 5. Stale State

**Issues:** 0 critical, 0 high, 0 medium ✅

**Status:** PASS

**Note:** Crispy CRM uses React Admin's data provider pattern exclusively. All caching and invalidation is handled automatically by React Admin hooks. No React Query/TanStack Query usage detected.

---

### 6. Workflow Gaps

**Issues:** 3 critical, 8 high, 12 medium

**Database Consistency:**
- Orphaned opportunities: 0 ✅
- Invalid stages: 0 ✅
- Orphaned activities: 9

**Key Findings:**
- `DEFAULT 'new_lead'` on opportunities.stage masks missing data
- `DEFAULT 'active'` on product_distributors.status masks missing data
- Stage transitions lack validation (new_lead → closed_won allowed)
- Major entity changes don't create activity records

---

### 7. Architecture

**Issues:** 8 critical, 12 high, 15 medium

**Feature Compliance:**
- Compliant: 2 features
- Partial: 5 features
- Incomplete: 3 features

**Key Findings:**
- 6 feature files with direct Supabase imports
- Deprecated `company_id` and `archived_at` fields still in use
- 2 resources without dedicated handlers (activities, tags)
- Business logic in provider handlers instead of service layer
- Form-level validation instead of API boundary validation

---

### 8. TypeScript

**Issues:** 147 critical, 89 high, 234 medium

**Type Safety Score:** 73%

**Key Findings:**
- Extensive `any` usage in data provider handlers
- Missing return type annotations on 20+ functions
- Unsafe type assertions (`as unknown as T` pattern)
- 3 `@ts-ignore` comments suppressing errors
- Inconsistent `type` vs `interface` usage

**Note:** Most `any` usage is in React Admin integration code where proper typing is complex.

---

### 9. Accessibility

**Issues:** 147 critical, 892 high, 1243 medium

**WCAG 2.1 AA Status:** ❌ FAIL

**Key Findings:**
- All form inputs missing `aria-invalid` on error state
- All error messages missing `role="alert"`
- All inputs missing `aria-describedby` linking to errors
- Extensive hardcoded Tailwind colors (text-gray-*, bg-gray-*, etc.)
- 50+ interactive elements below 44px touch target minimum

**Note:** High counts reflect comprehensive scanning of all 10 feature modules with ~20 inputs each.

---

### 10. Performance

**Issues:** 3 critical, 12 high, 8 medium

**Key Findings:**
- `watch()` used instead of `useWatch()` in 3 locations
- Input components not memoized with `React.memo()`
- N+1 query patterns in 2 list components
- Wildcard imports from react-admin increasing bundle
- Missing `useMemo` on filter configurations

---

### 11. Code Quality

**Issues:** 16 critical, 68 high, 24 medium

**Key Findings:**
- 16 files exceed 500 lines (largest: 1330 lines)
- 16 direct Supabase imports violating architecture rules
- 137 console.log/warn/error statements in 68 files
- 393 files with deep nesting (3+ levels)
- 24 unresolved TODO/FIXME markers
- 44 exports in opportunities/constants.ts (low cohesion)

---

## Recommendations (Priority Order)

### Immediate (Critical - Blocks Deployment)

1. **DB Hardening** - Enable RLS on `task_id_mapping` or drop table
2. **Data Integrity** - Fix hard DELETE in sync_opportunity_contacts RPC
3. **Architecture** - Remove direct Supabase imports from 6 feature files
4. **Performance** - Replace `watch()` with `useWatch()` in OpportunityInputs

### Short-Term (High - Fix Before Next Release)

1. **Security** - Add `.max()` constraints to all Zod string schemas
2. **Accessibility** - Add `aria-invalid`, `role="alert"`, `aria-describedby` to form components
3. **Code Quality** - Split 16 oversized files (>500 lines)
4. **Error Handling** - Remove silent catch blocks, add proper error propagation
5. **Architecture** - Move deprecated `company_id`/`archived_at` usage to modern patterns

### Technical Debt (Medium - Schedule for Sprint)

1. **TypeScript** - Add proper types to React Admin integration code
2. **Code Quality** - Replace 137 console statements with proper logger
3. **DB Hardening** - Drop 64 unused indexes to improve write performance
4. **Accessibility** - Replace hardcoded Tailwind colors with semantic tokens
5. **Workflow Gaps** - Add stage transition validation and activity logging

---

## Audit Methodology

### Parallel Execution (3 Batches, 17 minutes)

**Batch 1 (Critical):** security, data-integrity, error-handling, db-hardening
**Batch 2 (High Priority):** stale-state, workflow-gaps, architecture, typescript
**Batch 3 (Standard):** accessibility, performance, code-quality

### Mode Details

- **Full Mode:** All checks including MCP advisors and SQL queries
- All 11 audits completed successfully

---

*Generated by `/audit:full` command*
*Report location: docs/audits/2026-01-22-full-audit.md*
