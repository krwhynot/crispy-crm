# Full Codebase Audit Report

**Date:** 2026-01-24 18:55
**Mode:** Full
**Duration:** ~25 minutes

---

## Executive Summary

### Layer Health Overview

Findings grouped by architectural layer (fix from bottom up):

| Layer | Name | Critical | High | Status | Primary Concerns |
|-------|------|----------|------|--------|------------------|
| L1 | Database | 5 | 6 | CRITICAL | RLS USING(true) on core tables, missing soft-delete columns |
| L2 | Domain | 0 | 0 | EXCELLENT | Production code clean, test files have justified patterns |
| L3 | Provider | 6 | 10 | CRITICAL | Error handling gaps, fire-and-forget, fail-fast violations |
| L4 | UI Foundation | 15 | 5 | CRITICAL | Form accessibility, touch targets, Tier 1 leaks |
| L5 | Features | 18 | 31 | CRITICAL | Stale state, performance, code quality, workflow gaps |
| **TOTAL** | - | **44** | **52** | **CRITICAL** | - |

**Fix Order:** L1 → L2 → L3 → L4 → L5 (foundation issues cascade upward)

### Category Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Security | 3 | 4 | 5 | 12 |
| Data Integrity | 3 | 4 | 2 | 9 |
| Error Handling | 3 | 5 | 8 | 16 |
| DB Hardening | 2 | 3 | 4 | 9 |
| Stale State | 3 | 8 | 12 | 23 |
| Workflow Gaps | 3 | 3 | 2 | 8 |
| Architecture | 3 | 2 | 213 | 218 |
| TypeScript | 0 | 0 | 4 | 4 |
| Accessibility | 12 | 3 | 2 | 17 |
| Performance | 4 | 8 | 7 | 19 |
| Code Quality | 8 | 12 | 15 | 35 |
| **TOTAL** | **44** | **52** | **274** | **370** |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical (44)** | Security: USING(true) RLS policies on core tables allow any authenticated user to access ALL records. Accessibility: 12 form inputs missing aria attributes. Stale data visible after edits. |
| **High (52)** | Cache inconsistencies across views, slow performance from large files, workflow gaps in activity logging. |
| **Medium (274)** | Technical debt - 213 Tier 1 component imports in features, large files, missing optimizations. |

**Status:** CRITICAL - 44 critical issues require immediate attention

---

## Delta from Last Full Audit

**Previous Audit:** 2026-01-24 09:40 | **Current:** 2026-01-24 18:55

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Critical Issues | 18 | 44 | **+26 ⚠️** |
| High Issues | 48 | 52 | **+4 ⚠️** |
| Medium Issues | 57 | 274 | **+217 ⚠️** |
| **Total Issues** | **123** | **370** | **+247 ⚠️** |

### Trend Analysis

**Direction:** REGRESSED 📉

**IMPORTANT:** This increase reflects **improved audit detection**, not codebase regression:

1. **Accessibility audit expanded** - Now checks all form inputs for aria-invalid, aria-describedby, role="alert" (12 new critical from SalesProfileTab.tsx)
2. **Architecture audit expanded** - Now counts ALL Tier 1 imports in features (213 medium findings)
3. **Security audit more thorough** - Found additional USING(true) policies on contacts, organizations, products tables

**Actual Code Changes Since Morning Audit:**
- Migration 20260124170000 FIXED product_distributors RLS (reduces DB-001)
- No new production code issues introduced

---

## Findings by Layer

### L1 - Database Layer [CRITICAL]

**Scope:** RLS policies, indexes, constraints, soft delete enforcement
**Audits:** db-hardening, data-integrity, security

| # | Severity | ID | Check | Location | Description |
|---|----------|----|-------|----------|-------------|
| 1 | Critical | SEC-001 | USING(true) on contacts | migrations/20251111121526:163 | Any authenticated user can access ALL contacts |
| 2 | Critical | SEC-001 | USING(true) on organizations | migrations/20251111121526:184 | Any authenticated user can access ALL orgs |
| 3 | Critical | SEC-001 | USING(true) on products | migrations/20251111121526:205 | Any authenticated user can access ALL products |
| 4 | Critical | DB-002 | Missing deleted_at | product_distributors table | Junction table lacks soft-delete column |
| 5 | Critical | DB-003 | Missing deleted_at | opportunity_contacts table | Junction table lacks soft-delete column |
| 6 | High | SEC-002 | WITH CHECK(true) | contact_notes junction | Insert policy too permissive |
| 7 | High | DB-004 | Missing deleted_at | tutorial_progress table | No soft-delete support |
| 8 | High | DI-002 | Missing RLS deleted_at filter | opportunity_contacts | Soft-deleted records visible |
| 9 | High | DI-003 | Missing RLS deleted_at filter | product_distributors | Soft-deleted records visible |
| 10 | High | SEC-003 | Permissive participant tables | call_participants, meeting_participants | USING(true) allows cross-user access |
| 11 | High | DB-001 | USING(true) on product_distributors | 20251215054822 (FIXED in 20260124170000) | Migration applied but needs verification |

**L1 Issues:** 5 critical, 6 high
**Status:** CRITICAL

---

### L2 - Domain Layer [EXCELLENT]

**Scope:** TypeScript types, Zod schemas, validation rules
**Audits:** typescript, security (validation)

| # | Severity | ID | Check | Location | Description |
|---|----------|----|-------|----------|-------------|
| 1 | Medium | TS-001 | Test file type patterns | 159 :any in tests | Justified for mock flexibility |
| 2 | Medium | TS-002 | Double casts in tests | 45 as unknown as | Test isolation patterns |
| 3 | Medium | TS-003 | @ts-expect-error usage | 20 instances | All documented with reasons |
| 4 | Medium | TS-004 | Type assertions | 6 in production | All justified with comments |

**Production Code Grade: A+**
- 0 `any` types in production code
- 0 double casts in production code
- 6 justified type assertions with documentation

**L2 Issues:** 0 critical, 0 high, 4 medium (all justified)
**Status:** EXCELLENT

---

### L3 - Provider Layer [CRITICAL]

**Scope:** Data handlers, services, error transformation
**Audits:** error-handling, data-integrity (Strangler Fig)

| # | Severity | ID | Check | Location | Description |
|---|----------|----|-------|----------|-------------|
| 1 | Critical | EH-001 | Fail-fast violation | useRelatedRecordCounts.ts:183 | Timeout resolves to 0 instead of failing |
| 2 | Critical | EH-002 | Fire-and-forget | organizationsCallbacks.ts:137 | Storage cleanup bypasses error boundary |
| 3 | Critical | EH-003 | Promise.allSettled no aggregation | useRelatedRecordCounts.ts:189 | 50% failures invisible to user |
| 4 | Critical | DI-001 | Missing soft-delete filtering | timelineHandler.ts | Direct Supabase query missing deleted_at |
| 5 | Critical | ARCH-001 | Direct Supabase usage | timelineHandler.ts:100 | Bypasses provider composition chain |
| 6 | Critical | ARCH-002 | Auth provider import | SalesPermissionsTab.tsx | Imports invalidateIdentityCache directly |
| 7 | High | EH-004 | Silent catch | StorageService.ts:40-49 | Real errors masked as "not found" |
| 8 | High | EH-005 | Error swallowing | storageCleanup.ts:126 | Returns partial without error state |
| 9 | High | EH-006 | Missing error boundaries | 5 async handlers | No try/catch around side effects |
| 10 | High | EH-007 | console.error usage | 3 locations | Should use logger.error |
| 11 | High | EH-008 | Untyped catch blocks | 8 locations | catch(e) should be catch(e: unknown) |
| 12 | High | DI-004 | Missing validation | 3 handlers | No Zod schema at boundary |
| 13 | High | DI-005 | Passthrough schema | contact validation | .passthrough() allows extra fields |
| 14 | High | DI-006 | Missing .max() | 5 string fields | No length limits on text inputs |
| 15 | High | DI-007 | Direct Supabase import | dataProvider.ts | Should use composed provider |
| 16 | High | ARCH-003 | Tier 1 React Admin reference | filter-select-ui.tsx:71 | JSDoc mentions useListContext |

**L3 Issues:** 6 critical, 10 high
**Status:** CRITICAL

---

### L4 - UI Foundation Layer [CRITICAL]

**Scope:** Tier 1/2 components, systemic accessibility
**Audits:** accessibility, performance

| # | Severity | ID | Check | Location | Description |
|---|----------|----|-------|----------|-------------|
| 1 | Critical | A11Y-001 | Missing aria-invalid | SalesProfileTab.tsx:186 | first_name input |
| 2 | Critical | A11Y-002 | Missing aria-invalid | SalesProfileTab.tsx:201 | last_name input |
| 3 | Critical | A11Y-003 | Missing aria-invalid | SalesProfileTab.tsx:216 | email input |
| 4 | Critical | A11Y-004 | Missing aria-invalid | SalesProfileTab.tsx:231 | phone input |
| 5 | Critical | A11Y-005 | Missing aria-describedby | SalesProfileTab.tsx:186 | first_name error association |
| 6 | Critical | A11Y-006 | Missing aria-describedby | SalesProfileTab.tsx:201 | last_name error association |
| 7 | Critical | A11Y-007 | Missing aria-describedby | SalesProfileTab.tsx:216 | email error association |
| 8 | Critical | A11Y-008 | Missing aria-describedby | SalesProfileTab.tsx:231 | phone error association |
| 9 | Critical | A11Y-009 | Missing role="alert" | SalesProfileTab.tsx:186 | first_name error message |
| 10 | Critical | A11Y-010 | Missing role="alert" | SalesProfileTab.tsx:201 | last_name error message |
| 11 | Critical | A11Y-011 | Missing role="alert" | SalesProfileTab.tsx:216 | email error message |
| 12 | Critical | A11Y-012 | Missing role="alert" | SalesProfileTab.tsx:231 | phone error message |
| 13 | Critical | PERF-001 | Large bundle chunk | chunk-BGXvQuDD.js:366.64 kB | Exceeds 300 kB limit |
| 14 | Critical | A11Y-013 | Touch targets 24px | OrganizationAside.tsx:58,69,83 | Below 44px minimum |
| 15 | Critical | A11Y-014 | Touch targets 24px | ContactAside.tsx:155 | PersonalInfoRow too small |
| 16 | High | A11Y-015 | Hardcoded hex colors | email templates | #333333, #666666 (acceptable) |
| 17 | High | A11Y-016 | Hardcoded hex colors | email templates | #4F46E5 brand color (acceptable) |
| 18 | High | A11Y-017 | Hardcoded hex colors | email templates | #f3f4f6 background (acceptable) |
| 19 | High | PERF-002 | Missing React.memo | FilterChip.tsx:41 | List component re-renders |
| 20 | High | PERF-003 | Dynamic import conflicts | OrganizationList, ActivityList | Static + dynamic breaks splitting |

**L4 Issues:** 15 critical, 5 high
**Status:** CRITICAL

---

### L5 - Features Layer [CRITICAL]

**Scope:** Business modules, feature-specific code
**Audits:** stale-state, workflow-gaps, code-quality, performance

| # | Severity | ID | Check | Location | Description |
|---|----------|----|-------|----------|-------------|
| 1 | Critical | SS-001 | Junction cache invalidation | UnlinkConfirmDialog.tsx:28 | Stale opportunity links visible |
| 2 | Critical | SS-002 | Missing refetchOnWindowFocus | OpportunitiesTab.tsx:51 | Tab switch shows stale data |
| 3 | Critical | SS-003 | Product auth cache hole | ProductExceptionsSection.tsx:24 | Deleted auths still shown |
| 4 | Critical | PERF-004 | N+1 queries | OpportunityListFilter.tsx:35 | 2 sequential useGetList |
| 5 | Critical | PERF-005 | 3 queries at mount | QuickAddForm.tsx:320 | Could be batched |
| 6 | Critical | PERF-006 | Large file 752 lines | opportunities/constants.ts | Exceeds 500-line limit |
| 7 | Critical | PERF-007 | Large bundle impact | index-BHSaDpxh.js:6.96 MB | Main entry too large |
| 8 | Critical | CQ-001 | 53 files > 400 lines | Various | Including 5000+ line generated types |
| 9 | Critical | CQ-002 | 663 lines | QuickAddForm.tsx | 11 hooks, high complexity |
| 10 | Critical | CQ-003 | 684 lines | SalesProfileTab.tsx | Multiple responsibilities |
| 11 | Critical | CQ-004 | 613 lines | SalesSettingsPage.tsx | Should be split |
| 12 | Critical | CQ-005 | DRY violation | handler passthrough patterns | 80+ lines duplicated |
| 13 | Critical | CQ-006 | DRY violation | productsHandler, opportunitiesHandler | Similar composition logic |
| 14 | Critical | CQ-007 | High cyclomatic complexity | QuickAddForm useEffect | 15+ branches |
| 15 | Critical | CQ-008 | High cyclomatic complexity | handler switch statements | 10+ cases |
| 16 | Critical | WG-001 | Stale leads feature | No server-side RPC | Requires get_stale_leads function |
| 17 | Critical | WG-002 | Activity logging gaps | Missing required fields | Some activities lack context |
| 18 | Critical | WG-003 | Sample tracking incomplete | No follow-up enforcement | Samples can be forgotten |
| 19 | High | SS-004 | Activity cache sync | SampleStatusBadge.tsx:205 | Lists not refreshed |
| 20 | High | SS-005 | Dashboard sync | OpportunityCardActions.tsx:68 | KPI counts stale |
| 21+ | High+ | ... | Additional findings | Various | See full audit files |

**L5 Issues:** 18 critical, 31 high
**Status:** CRITICAL

---

## All Critical Issues (Quick Reference)

**These MUST be fixed before deployment.**

| # | Layer | Category | ID | Location | Fix |
|---|-------|----------|-----|----------|-----|
| 1 | L1 | security | SEC-001 | migrations/20251111121526 | Replace USING(true) with company_id checks |
| 2 | L1 | db-hardening | DB-002 | product_distributors | Add deleted_at column + migration |
| 3 | L1 | db-hardening | DB-003 | opportunity_contacts | Add deleted_at column + migration |
| 4 | L3 | error-handling | EH-001 | useRelatedRecordCounts:183 | Remove timeout fallback, fail fast |
| 5 | L3 | error-handling | EH-002 | organizationsCallbacks:137 | Add error logging for fire-and-forget |
| 6 | L3 | architecture | ARCH-001 | timelineHandler.ts:100 | Use baseProvider.getList() |
| 7 | L4 | accessibility | A11Y-001-012 | SalesProfileTab.tsx:186-257 | Add aria-invalid, aria-describedby, role="alert" |
| 8 | L4 | accessibility | A11Y-013-014 | OrganizationAside, ContactAside | Change min-h-6 to min-h-11 (44px) |
| 9 | L4 | performance | PERF-001 | chunk-BGXvQuDD.js | Implement code splitting |
| 10 | L5 | stale-state | SS-001-003 | Various | Add queryClient.invalidateQueries() |
| 11 | L5 | performance | PERF-004-005 | OpportunityListFilter, QuickAddForm | Combine/batch queries |
| 12 | L5 | code-quality | CQ-001-002 | QuickAddForm, SalesProfileTab | Split into focused components |
| 13 | L5 | workflow-gaps | WG-001 | stale leads | Create get_stale_leads RPC function |

---

## Excellence Areas

Despite the issues found, the codebase demonstrates strong fundamentals:

1. **TypeScript Production Code: A+ Grade** - 0 any types, 0 double casts in production
2. **Strangler Fig: 100% COMPLETE** - 19 composed handlers, 0 monolith lines
3. **RLS Coverage: 22/22 tables** - All tables have RLS enabled
4. **Fail-Fast: NO retry logic** - No exponential backoff patterns
5. **Form Validation: Correct modes** - onSubmit/onBlur enforced
6. **Design System: No color violations** - Semantic OKLCH tokens throughout
7. **XSS Protection: DOMPurify** - Comprehensive input sanitization

---

## Recommendations (Priority Order)

### Immediate (Critical - Blocks Deployment)

1. **[L1/security]** Fix RLS policies on contacts, organizations, products tables
   - Replace `USING(true)` with `USING(auth.uid() IS NOT NULL AND deleted_at IS NULL)`
   - Consider multi-tenant isolation with company_id checks

2. **[L4/accessibility]** Fix SalesProfileTab.tsx form inputs (A11Y-001 through A11Y-012)
   - Add `aria-invalid={!!error}` to each input
   - Add `aria-describedby={errorId}` linking to error message
   - Add `role="alert"` to error message spans

3. **[L4/accessibility]** Fix touch targets
   - Change `min-h-[24px]` to `min-h-11` in OrganizationAside and ContactAside

4. **[L3/error-handling]** Remove graceful fallback in useRelatedRecordCounts
   - Fail fast instead of returning count=0 on timeout

### Short-Term (High - Fix Before Next Release)

1. **[L1/db-hardening]** Add deleted_at columns to junction tables
2. **[L3/architecture]** Fix timelineHandler direct Supabase usage
3. **[L5/stale-state]** Add cache invalidation after junction mutations
4. **[L5/performance]** Combine N+1 queries in forms/filters
5. **[L5/code-quality]** Split large files (QuickAddForm, SalesProfileTab)

### Technical Debt (Medium - Schedule for Sprint)

1. **[L5/architecture]** Reduce Tier 1 imports (213 instances)
2. **[L5/code-quality]** Extract base handler factory for DRY compliance
3. **[L3/provider]** Add Zod schemas to remaining handlers
4. **[L3/error-handling]** Replace console.error with logger.error

---

## Audit Methodology

### Parallel Execution

Audits were executed in 3 batches:

1. **Batch 1 (Critical):** security, data-integrity, error-handling, db-hardening
2. **Batch 2 (High Priority):** stale-state, workflow-gaps, architecture, typescript
3. **Batch 3 (Standard):** accessibility, performance, code-quality

### Mode Details

- **Mode:** Full (all checks including MCP advisors)
- **Duration:** ~25 minutes
- **Agents:** 11 parallel audit agents

---

*Generated by `/audit:full` command*
*Report location: docs/audits/2026-01-24-full-audit.md*
