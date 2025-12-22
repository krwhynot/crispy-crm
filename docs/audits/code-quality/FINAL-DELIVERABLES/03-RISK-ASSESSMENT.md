# Risk Assessment Report

**Agent:** 25 - Forensic Aggregator
**Date:** 2025-12-21
**Source Reports:** Agents 4, 16, 20, 21, 22, 23

---

## Executive Summary

This risk assessment consolidates security, data integrity, and operational risks identified across the 25-agent audit. The codebase has **one critical security vulnerability** (RLS policy) and several medium-severity issues requiring attention before launch.

### Risk Matrix

| Severity | Security | Data Integrity | Performance | UX | Total |
|----------|----------|----------------|-------------|----|----|
| Critical | 1 | 0 | 1 | 0 | **2** |
| High | ~~2~~ 0 ✅ | 2 | 1 | 0 | **3** (was 5) |
| Medium | 3 | 3 | 2 | 4 | **12** |
| Low | 2 | 2 | 3 | 6 | **13** |

> **Update 2025-12-21:** HIGH-01 (JSON.parse) and HIGH-02 (z.object) have been fully mitigated.

---

## Critical Risks

### CRIT-01: RLS USING(true) Vulnerability

**Risk Type:** Security - Data Isolation Breach
**Severity:** Critical
**Likelihood:** Certain if exploited
**Impact:** Cross-tenant data leakage

**Description:**
The `product_distributors` table has RLS policies with `USING(true)`, meaning any authenticated user can read, insert, update, or delete ANY record regardless of organization membership.

**Attack Scenario:**
1. Attacker creates account for Organization A
2. Attacker queries `product_distributors` table
3. Attacker sees confidential pricing from Organizations B, C, D
4. Attacker modifies competitor's product-distributor relationships

**Files Affected:**
- `supabase/migrations/20251215054822_08_create_product_distributors.sql:41-51`

**Mitigation:**
```sql
DROP POLICY "Users can view product_distributors" ON product_distributors;
CREATE POLICY "Users can view product_distributors"
  ON product_distributors FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND deleted_at IS NULL
    AND organization_id IN (
      SELECT id FROM organizations WHERE deleted_at IS NULL
    )
  );
```

**Timeline:** Immediate (before any beta users)
**Owner:** Database/Security team

---

### CRIT-02: Query Performance Causing Browser Crash

**Risk Type:** Performance - Denial of Service
**Severity:** Critical
**Likelihood:** High with production data
**Impact:** Browser tab crash, user frustration

**Description:**
The `opportunities_summary` view executes the same subquery 4 times per row. With 1000+ opportunities, this causes:
- ~4000 subquery executions
- Browser memory exhaustion
- Tab crash on list load

**Attack Scenario:**
1. User with many opportunities loads Opportunities page
2. Browser allocates memory for repeated subqueries
3. Memory limit exceeded, tab crashes
4. User can't access their opportunities

**Files Affected:**
- `supabase/migrations/.../opportunities_summary.sql`

**Mitigation:**
Refactor view to use CTEs with single aggregation pass.

**Timeline:** This week
**Owner:** Backend team

---

## High Risks

### HIGH-01: JSON.parse Without Validation ✅ MITIGATED 2025-12-21

**Risk Type:** Security - Type Confusion
**Severity:** High → **Resolved**
**Likelihood:** Low (requires XSS or physical access)
**Impact:** Application state corruption, potential XSS

**Description:**
~~11~~ 13 locations parsed JSON from localStorage/sessionStorage without Zod validation. An attacker with XSS access could modify storage to inject malicious data.

**Resolution Applied:**
- Created `src/atomic-crm/utils/safeJsonParse.ts` utility
- Created `src/atomic-crm/activities/activityDraftSchema.ts` shared schema
- All 13 locations now use `safeJsonParse()` with proper Zod schemas
- `secureStorage.ts` already had built-in validation (used as template)

**Files Fixed:**
| File | Schema Applied |
|------|----------------|
| `useTutorialProgress.ts` | `tutorialProgressSchema` |
| `useColumnPreferences.ts` | `opportunityStageArraySchema` |
| `useFilterCleanup.ts` | `listParamsSchema` |
| `LogActivityFAB.tsx` | `activityDraftSchema` |
| `QuickLogActivityDialog.tsx` | `activityDraftSchema` |
| `rateLimiter.ts` | `rateLimitStateSchema` |
| `useRecentSelections.ts` | `recentItemsSchema` |
| `opportunityStagePreferences.ts` | `urlFilterSchema` |
| `filterPrecedence.ts` | `filterValueSchema` |
| `exportScheduler.ts` | `exportScheduleArraySchema` |

**Status:** ✅ MITIGATED - All JSON.parse locations now have Zod validation

---

### HIGH-02: z.object Mass Assignment Risk ✅ MITIGATED 2025-12-21

**Risk Type:** Security - Mass Assignment
**Severity:** High → **Resolved**
**Likelihood:** Low (requires API knowledge)
**Impact:** Unauthorized field modification

**Description:**
9 schemas used `z.object()` instead of `z.strictObject()`, allowing extra fields to pass through validation.

**Resolution Applied:**
8 schemas converted to `z.strictObject()`. One intentional exception documented.

**Files Fixed:**
| File | Schema | Status |
|------|--------|--------|
| `stalenessCalculation.ts:57` | StageStaleThresholdsSchema | ✅ Fixed |
| `digest.service.ts` (5 schemas) | All digest schemas | ✅ Fixed |
| `filterConfigSchema.ts` (2 schemas) | filterChoiceSchema, chipFilterConfigSchema | ✅ Fixed |
| `distributorAuthorizations.ts:141` | specialPricingSchema | ⚠️ Exception |

**Exception Documented:** `specialPricingSchema` intentionally keeps `.passthrough()` for JSONB field flexibility (user-approved).

**Status:** ✅ MITIGATED - All applicable schemas now use z.strictObject()

---

### HIGH-03: Soft-Delete Cascade Bypass

**Risk Type:** Data Integrity - Orphaned Records
**Severity:** High
**Likelihood:** Medium
**Impact:** Data inconsistency, broken references

**Description:**
Direct `deleted_at` updates bypass `archive_opportunity_with_relations()` function, leaving orphaned junction table records.

**Attack Scenario:**
1. Admin uses database tool to archive opportunity
2. Sets `deleted_at` directly, not via function
3. `opportunity_contacts`, `opportunity_products` remain
4. Reports show inconsistent data

**Files Affected:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Mitigation:**
Route all deletions through cascade function in data provider.

**Timeline:** This week
**Owner:** Backend team

---

### HIGH-04: Missing Concurrent Edit Detection

**Risk Type:** Data Integrity - Lost Updates
**Severity:** High
**Likelihood:** Medium (multi-user scenarios)
**Impact:** Silent data loss

**Description:**
No optimistic locking implemented. When two users edit the same record, last write wins without warning.

**Attack Scenario:**
1. User A opens Opportunity X at 10:00
2. User B opens Opportunity X at 10:01
3. User B saves at 10:05
4. User A saves at 10:10 (B's changes silently lost)

**Mitigation:**
Add `version` column with update checks.

**Timeline:** Pre-launch
**Owner:** Backend team

---

### HIGH-05: 10K Record Bulk Loads

**Risk Type:** Performance - Resource Exhaustion
**Severity:** High
**Likelihood:** Medium
**Impact:** Slow page loads, memory pressure

**Description:**
6 locations fetch up to 10,000 records for client-side filtering instead of server-side aggregation.

**Files Affected:**
- `CampaignActivityReport.tsx` - Reports loading
- `OpportunityListFilter.tsx` - Campaign filter dropdown

**Mitigation:**
Create server-side aggregation endpoints.

**Timeline:** Pre-launch
**Owner:** Backend team

---

## Medium Risks

### MED-01: Missing Unsaved Changes Warning

**Risk Type:** UX - Data Loss
**Severity:** Medium
**Likelihood:** High
**Impact:** User frustration, lost work

**Description:**
5 major forms lack `isDirty` check before navigation, causing silent loss of user input.

**Forms Affected:**
- OpportunityCreate
- OrganizationCreate
- ActivityCreate
- ProductCreate
- SalesEdit

**Mitigation:**
Add `window.confirm` on cancel/navigation when `isDirty`.

**Timeline:** This sprint
**Owner:** Frontend team

---

### MED-02: Whitespace-Only Validation Gap

**Risk Type:** Data Integrity - Invalid Data
**Severity:** Medium
**Likelihood:** Medium
**Impact:** Data quality issues

**Description:**
Required string fields accept whitespace-only input ("   "), creating records with effectively blank names.

**Mitigation:**
Add `.trim()` before `.min(1)` in all required string schemas.

**Timeline:** This sprint
**Owner:** Frontend team

---

### MED-03: ConfigurationContext Re-render Blast Radius

**Risk Type:** Performance - Unnecessary Renders
**Severity:** Medium
**Likelihood:** Certain
**Impact:** Performance degradation

**Description:**
11 values in single context cause 13 consumer components to re-render on any config change.

**Mitigation:**
Split into `AppBrandingContext`, `StagesContext`, `FormOptionsContext`.

**Timeline:** Pre-launch
**Owner:** Frontend team

---

### MED-04: Large Component Maintainability

**Risk Type:** Maintainability
**Severity:** Medium
**Likelihood:** N/A
**Impact:** Developer velocity, bug surface area

**Description:**
7 components exceed 400 lines, handling multiple concerns.

**Components:**
- OrganizationImportDialog (1,082 lines)
- AuthorizationsTab (1,043 lines)
- CampaignActivityReport (900 lines)

**Mitigation:**
Split into smaller, focused components.

**Timeline:** Post-launch backlog
**Owner:** Frontend team

---

### MED-05 through MED-12

*(Additional medium risks documented in 01-PRIORITIZED-FIX-LIST.md)*

---

## Low Risks

### LOW-01: Missing Autocomplete Attributes

**Risk Type:** Accessibility
**Severity:** Low
**Impact:** Suboptimal autofill behavior

### LOW-02: Double Type Assertions

**Risk Type:** Type Safety
**Severity:** Low
**Impact:** Potential runtime type errors

### LOW-03: useEffect Missing Cleanup

**Risk Type:** Memory Management
**Severity:** Low
**Impact:** Potential memory leaks (minor)

*(Additional low risks documented in 01-PRIORITIZED-FIX-LIST.md)*

---

## Accepted Risks

The following risks have been accepted with documented justification:

| Risk | Justification | Accepted By |
|------|---------------|-------------|
| Auth provider direct Supabase | Architectural necessity - auth precedes context | Agent 24 |
| Tutorial silent catches | Non-critical feature degradation acceptable | Agent 24 |
| Promise.allSettled for bulk | Batch partial success is valid UX | Agent 13 |
| `any` in RA wrappers | Library integration boundary | Agent 24 |

---

## Risk Monitoring Plan

### Pre-Launch Monitoring

| Metric | Target | Tool |
|--------|--------|------|
| RLS policy coverage | 100% proper policies | Migration audit |
| Type safety score | 85%+ | TypeScript strict mode |
| Bundle size | <2MB gzipped | Bundle analyzer |
| Dead code | 0 lines | ESLint unused-imports |

### Post-Launch Monitoring

| Metric | Target | Tool |
|--------|--------|------|
| Error rate | <0.1% | Sentry |
| Page load time | <3s | Browser performance |
| Memory usage | <200MB | Chrome DevTools |
| User-reported issues | <5/week | Support tickets |

---

## Risk Response Matrix

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| Critical | Immediate (same day) | Team lead + PM |
| High | This sprint | Team lead |
| Medium | Pre-launch | Sprint planning |
| Low | Backlog | Quarterly review |

---

*Generated by Agent 25 - Forensic Aggregator*
*Source: Agents 4, 16, 20, 21, 22, 23*
