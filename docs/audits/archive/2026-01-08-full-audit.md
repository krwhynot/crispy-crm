# Full Codebase Audit Report

**Date:** 2026-01-08 23:16
**Mode:** Full
**Duration:** 13 minutes

---

## Executive Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Security | 24 | 9 | 2 | 35 |
| Data Integrity | 3 | 4 | 5 | 12 |
| Error Handling | 1 | 3 | 2 | 6 |
| DB Hardening | 3 | 31 | 2 | 36 |
| Stale State | 5 | 8 | 4 | 17 |
| Workflow Gaps | 3 | 5 | 4 | 12 |
| Architecture | 0 | 0 | 3 | 3 |
| TypeScript | 4 | 38 | 270 | 312 |
| Accessibility | 2 | 3 | 4 | 9 |
| Performance | 2 | 5 | 3 | 10 |
| Code Quality | 4 | 9 | 12 | 25 |
| **TOTAL** | **51** | **115** | **311** | **477** |

**Status:** CRITICAL - 51 critical issues require immediate attention before deployment

---

## Delta from Last Full Audit

**Previous Audit:** 2026-01-08 (earlier run) | **Current:** 2026-01-08 23:16

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Critical Issues | 14 | 51 | +37 |
| High Issues | 84 | 115 | +31 |
| Medium Issues | 152 | 311 | +159 |
| **Total Issues** | **250** | **477** | **+227** |

### Analysis of Delta

The significant increase in findings is due to **deeper security analysis** in this audit:

1. **Security (+24 critical):** Previous audit found 0 critical; this audit performed deeper RLS policy analysis discovering 24 permissive `WITH CHECK (true)` policies that effectively bypass row-level security
2. **TypeScript (+235 medium):** More comprehensive analysis of `any` usage and type assertions across test files
3. **Stale State (+5 critical):** New discovery of missing cache invalidation patterns in bulk operations

### New Issues (Key Additions)

| # | Category | Severity | Issue | Location |
|---|----------|----------|-------|----------|
| 1 | security | Critical | 26 RLS policies with `WITH CHECK (true)` | Multiple tables |
| 2 | stale-state | Critical | Missing cache invalidation in bulk operations | BulkReassignButton, UserDisableReassignDialog |
| 3 | workflow-gaps | Critical | Principal field nullable despite business rule | opportunities validation |
| 4 | code-quality | Critical | Duplicate keyboard utilities | useKeyboardShortcuts, useListKeyboardNavigation |

### Fixed Issues (From Previous Audit)

| # | Category | Severity | Issue | Status |
|---|----------|----------|-------|--------|
| 1 | architecture | High | Strangler Fig migration | COMPLETED (0 lines in unifiedDataProvider) |
| 2 | data-integrity | Medium | Deprecated patterns | No company_id/archived_at usage found |

---

## All Critical Issues (51)

**These MUST be fixed before production deployment.**

### Security Critical (24)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | RLS Permissive Policy | activities table | INSERT/UPDATE policies use `WITH CHECK (true)` | Add organization isolation checks |
| 2 | RLS Permissive Policy | contact_notes table | INSERT/UPDATE policies bypass security | Add organization scoping |
| 3 | RLS Permissive Policy | contacts table | INSERT/UPDATE allow unrestricted access | Add owner/org validation |
| 4 | RLS Permissive Policy | interaction_participants | INSERT allows any participant | Validate interaction ownership |
| 5 | RLS Permissive Policy | opportunity_notes | INSERT/UPDATE bypass security | Add opportunity ownership check |
| 6 | RLS Permissive Policy | opportunity_participants | INSERT allows unrestricted | Validate opportunity ownership |
| 7 | RLS Permissive Policy | organization_notes | INSERT/UPDATE bypass security | Add org membership validation |
| 8 | RLS Permissive Policy | organizations table | INSERT/UPDATE unrestricted | Restrict to admins only |
| 9 | RLS Permissive Policy | product_distributors | INSERT/UPDATE bypass security | Add relationship validation |
| 10 | RLS Permissive Policy | products table | INSERT/UPDATE allow any user | Restrict to authorized users |
| 11 | RLS Permissive Policy | segments table | INSERT/UPDATE bypass security | Add authorization checks |
| 12 | RLS Permissive Policy | tags table | DELETE/INSERT/UPDATE unrestricted | Restrict to tag creators/admins |
| 13 | Function Search Path | increment_opportunity_version | Mutable search_path - privilege escalation | Set search_path = '' |

### Data Integrity Critical (3)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Hard DELETE | phase2d_consolidate_duplicates.sql | DELETE FROM organizations | Use UPDATE SET deleted_at |
| 2 | Hard DELETE | add_sample_activities_cloud.sql | DELETE FROM activities | Use soft delete |
| 3 | Hard DELETE | fix_merge_function_table_names.sql | Hard delete in merge function | Update to soft delete |

### Error Handling Critical (1)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Silent Catch | contactsCallbacks.ts:164 | Fire-and-forget storage cleanup | Remove .catch() or rethrow |

### DB Hardening Critical (3)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Permissive RLS | 12 tables | 26 policies with always-true conditions | Replace with org scoping |
| 2 | Mutable Search Path | 3 functions | Privilege escalation risk | Add SET search_path = '' |
| 3 | Extension in Public | pg_trgm | Security principle violation | Move to extensions schema |

### Stale State Critical (5)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Missing Invalidation | QuickLogForm.tsx:141-178 | Activities not invalidated after create | Add queryClient.invalidateQueries |
| 2 | Missing Invalidation | ActivityNoteForm.tsx:72-88 | Stage change doesn't invalidate cache | Add opportunity key invalidation |
| 3 | Missing Invalidation | BulkReassignButton.tsx:130-184 | Bulk reassign shows stale data | Invalidate org/contact keys |
| 4 | Missing Invalidation | UserDisableReassignDialog.tsx:236-336 | Multi-resource reassign stale | Invalidate all affected keys |
| 5 | Missing Invalidation | useBulkActionsState.ts:138-156 | Bulk archive shows deleted records | Invalidate opportunity keys |

### Workflow Gaps Critical (3)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Missing Activity Logging | OpportunityCardActions.tsx:55-90 | Stage transitions don't create activities | Add activity on close |
| 2 | Nullable Required Field | opportunities.ts:274 | principal_organization_id nullable | Make required |
| 3 | Silent Default | opportunities.ts:117 | stage defaults silently to 'new_lead' | Require explicit selection |

### TypeScript Critical (4)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | @ts-ignore | columns-button.tsx:4 | Suppressing TypeScript on import | Add type declaration |
| 2 | Missing Return Types | Multiple files | 292 instances of `: any` | Add explicit types |
| 3 | Implicit Error Types | Multiple catch blocks | 100 untyped catch blocks | Use `error: unknown` |
| 4 | @ts-expect-error | 20 instances | Known type errors suppressed | Fix or document |

### Accessibility Critical (2)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Missing aria-invalid | form-primitives.tsx:92 | May not propagate to all inputs | Audit consumers |
| 2 | Hardcoded HSL | TutorialProvider.tsx | Uses hsl() instead of semantic | Use Tailwind token |

### Performance Critical (2)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | watch() Usage | TagDialog.tsx:67 | watch() causes full form re-renders | Use useWatch() |
| 2 | watch() Usage | QuickCreatePopover.tsx:133,157 | watch() in Select components | Use useWatch() |

### Code Quality Critical (4)

| # | Check | Location | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Large File | database.types.ts (5219 lines) | Exceeds 500-line rule | Auto-generated, document |
| 2 | Large File | database.generated.ts (5219 lines) | Duplicate of types file | Consolidate |
| 3 | Code Duplication | useKeyboardShortcuts.ts | shouldPreventShortcut() duplicated | Extract to shared util |
| 4 | Code Duplication | useListKeyboardNavigation.ts | isMac() duplicated | Extract to shared util |

---

## Category Summaries

### 1. Security

**Issues:** 24 critical, 9 high, 2 medium

**Key Finding:** The database has 26 RLS policies with `WITH CHECK (true)` or `USING (true)` conditions that effectively bypass row-level security. Any authenticated user can INSERT, UPDATE, or DELETE records across 12 tables without proper authorization checks.

**Strengths:**
- XSS protection via DOMPurify sanitization
- Environment variables validated with fail-fast
- Direct Supabase imports isolated to data provider
- Zod validation at API boundaries

**Remediation Priority:** IMMEDIATE - These RLS issues must be fixed before production launch.

---

### 2. Data Integrity

**Issues:** 3 critical, 4 high, 5 medium

**Strangler Fig Status:**
- Previous lines: 0
- Current lines: 0
- Status: **COMPLETED**

**Key Finding:** Hard DELETE statements found in 3 production migrations violate the soft-delete-only Constitution. The Strangler Fig migration is fully complete with all resources using composed handlers.

---

### 3. Error Handling

**Issues:** 1 critical, 3 high, 2 medium

**Fail-Fast Compliance:** PARTIAL

**Key Finding:** Fire-and-forget error handling in storage cleanup silently suppresses errors. Several graceful fallback patterns return empty/default values instead of throwing.

---

### 4. DB Hardening

**Issues:** 3 critical, 31 high, 2 medium

**Key Findings:**
- 26 RLS policies need authorization checks (overlaps with Security)
- 3 functions have mutable search_path (privilege escalation risk)
- pg_trgm extension in public schema
- 24 unindexed FK columns
- 5 duplicate indexes wasting storage
- 18 unused indexes slowing writes

---

### 5. Stale State

**Issues:** 5 critical, 8 high, 4 medium

**Key Finding:** Multiple bulk operations (reassign, archive, import) perform mutations without invalidating React Query cache, causing stale data to persist across components.

---

### 6. Workflow Gaps

**Issues:** 3 critical, 5 high, 4 medium

**Database Consistency:**
- Orphaned opportunities: 0
- Invalid stages: 0
- Unlinked contacts: 0

**Key Finding:** Stage transitions don't create activity records, required fields (principal, owner) are nullable despite business rules, and win/loss reasons aren't logged as interactions.

---

### 7. Architecture

**Issues:** 0 critical, 0 high, 3 medium

**Feature Compliance:**
- Compliant: 8 features
- Partial: 0
- Incomplete: 0

**Key Finding:** Architecture is excellent! No direct Supabase imports in components, all validation at API boundary, proper service layer separation, and Strangler Fig migration fully complete.

---

### 8. TypeScript

**Issues:** 4 critical, 38 high, 270 medium

**Type Safety Score:** ~70% (based on any/assertion usage)

**Key Finding:** 292 instances of `: any` annotations (mostly in tests), 319 `as any` assertions, and 50+ untyped catch blocks. Most test files use `: any` for mock data - recommend systematic test infrastructure upgrade.

---

### 9. Accessibility

**Issues:** 2 critical, 3 high, 4 medium

**WCAG 2.1 AA Status:** MOSTLY COMPLIANT

**Key Finding:** Form accessibility is excellent with proper aria-invalid, aria-describedby, role="alert" implementation. Touch targets consistently 44px. Main issues are edge cases (tutorial overlay using hsl()).

---

### 10. Performance

**Issues:** 2 critical, 5 high, 3 medium

**Key Finding:** `watch()` used instead of `useWatch()` causes full form re-renders. Zero React.memo usage across 52+ components in list views could benefit from memoization.

---

### 11. Code Quality

**Issues:** 4 critical, 9 high, 12 medium

**Key Finding:** Duplicate keyboard utility functions across 2 files, auto-generated database types exceeding 500 lines, and multiple untracked TODOs indicating architectural debt.

---

## Recommendations (Priority Order)

### Immediate (Critical - Blocks Deployment)

1. **[Security]** Fix all 26 RLS policies - replace `WITH CHECK (true)` with proper organization scoping
2. **[Security]** Harden 3 database functions with `SET search_path = ''`
3. **[Stale State]** Add queryClient.invalidateQueries to bulk operations
4. **[Data Integrity]** Update 3 migrations to use soft delete
5. **[Workflow Gaps]** Make principal_organization_id required

### Short-Term (High - Fix Before Next Release)

1. **[DB Hardening]** Add indexes to 24 FK columns
2. **[DB Hardening]** Remove 5 duplicate indexes
3. **[TypeScript]** Add explicit types to catch blocks
4. **[Performance]** Replace watch() with useWatch()
5. **[Code Quality]** Extract duplicate keyboard utilities

### Technical Debt (Medium - Schedule for Sprint)

1. **[TypeScript]** Create typed mock utilities for tests
2. **[Performance]** Add React.memo to list row components
3. **[Code Quality]** Split large validation files
4. **[Accessibility]** Complete aria-controls implementation

---

## Audit Methodology

### Parallel Execution

Audits were executed in 3 batches:

1. **Batch 1 (Critical):** security, data-integrity, error-handling, db-hardening
2. **Batch 2 (High Priority):** stale-state, workflow-gaps, architecture, typescript
3. **Batch 3 (Standard):** accessibility, performance, code-quality

### Mode Details

- **Full Mode:** All checks including MCP advisors and SQL queries

---

*Generated by `/audit:full` command*
*Report location: docs/audits/2026-01-08-full-audit.md*
