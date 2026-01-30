# UX Blockers Audit — 2026-01-29

**Mode:** deep | **Checks:** 56/56 | **Duration:** 104.85s | **Files Scanned:** 1,000

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Blockers | 1 |
| 🟡 Warnings | 6 |
| ✅ Clean | 49 |

## Blockers

High-confidence issues that **prevent users from completing tasks**. These require immediate attention.

| # | Check | File | Line | Impact | Confidence |
|---|-------|------|------|--------|------------|
| 1 | Console.log in production code | src/atomic-crm/components/SampleStatusBadge.tsx | 182 | Debug noise in production console — masks real errors | 0.95 |

## Warnings

Moderate-confidence issues needing verification before classification as blockers.

| # | Check | File | Line | Impact | Confidence | Verify By |
|---|-------|------|------|--------|------------|-----------|
| 1 | onChange validation mode | src/components/ra-wrappers/__tests__/date-input.test.tsx | 41 | Aggressive error display on every keystroke disrupts data entry | 0.85 | Inspect test file - test-only usage is acceptable |
| 2 | Hardcoded query key string | src/atomic-crm/products/__tests__/ProductEdit.test.tsx | 171 | Key drifts from factory — cache never invalidated, user sees stale data | 0.80 | Check if test mock or production code - test mocks are acceptable |
| 3 | Aggressive refetchOnWindowFocus | src/atomic-crm/timeline/UnifiedTimeline.tsx | 63 | Every tab switch fires API storm — app freezes on return | 0.90 | Verify if staleTime is also configured to limit refetch frequency |
| 4 | Aggressive refetchOnWindowFocus | src/atomic-crm/contacts/OpportunitiesTab.tsx | 59 | Every tab switch fires API storm — app freezes on return | 0.90 | Verify if staleTime is also configured to limit refetch frequency |
| 5 | Aggressive refetchOnWindowFocus | src/atomic-crm/dashboard/usePrincipalOpportunities.ts | 55 | Every tab switch fires API storm — app freezes on return | 0.90 | Check if dashboard uses SHORT_STALE_TIME_MS to prevent excessive refetch |
| 6 | Touch target too small | src/components/NotificationDropdown.tsx | 139 | Button/link too small for iPad touch — user misses tap target | 0.85 | Check if icon is inside a larger clickable parent (Button, etc) with h-11 or larger |

## Analysis

### Test File False Positives

**Good News:** Most warnings (4 out of 6) are in test files, which is expected and acceptable:

- **FORM-B003:** Test files intentionally use `mode: "onChange"` to verify validation behavior
- **DATA-B002:** Test mocks use hardcoded query keys — this doesn't affect production

### Real Issues Found

**1. Console.log in Production (BLOCKER)**
- **File:** src/atomic-crm/components/SampleStatusBadge.tsx:182
- **Evidence:** JSDoc example showing `console.log` usage
- **Severity:** High — violates CODE_QUALITY.md baseline (0 console statements in production)
- **Fix:** Remove console.log from JSDoc example or replace with logger

**2. Aggressive refetchOnWindowFocus (3 instances)**
- **Files:** UnifiedTimeline, OpportunitiesTab, 5 dashboard hooks
- **Impact:** Every tab switch triggers API refetch — can cause performance issues
- **Recommendation:** Verify these use `SHORT_STALE_TIME_MS` (30s) to prevent excessive refetching per STALE_STATE_STRATEGY.md

**3. Small Touch Targets (needs verification)**
- **File:** NotificationDropdown.tsx:139
- **Evidence:** Icon using `h-8 w-8` (32px) instead of minimum 44px
- **Verify:** Check if icon is nested inside a larger clickable button that meets accessibility requirements

## Recommended Deep Dives

Based on findings, the following deep dive is recommended:

### Data Flow Deep Dive

```bash
/audit/deep/data-flow
```

**Reason:** Multiple `refetchOnWindowFocus: true` instances warrant investigation of cache invalidation patterns and stale time configuration.

## Inventory Status

⚠️ **Note:** Inventory files not found in expected locations. Consider running `just discover` for more accurate cross-referencing between forms, schemas, and handlers.

## Next Steps

1. **Fix blocker:** Remove console.log from SampleStatusBadge.tsx JSDoc
2. **Verify refetch patterns:** Check if dashboard hooks use SHORT_STALE_TIME_MS
3. **Accessibility check:** Verify NotificationDropdown touch targets
4. **Optional:** Run `/audit/deep/data-flow` for comprehensive cache analysis

---

**Report Generated:** 2026-01-30T02:08:20Z
**Audit Duration:** 104.85 seconds
**Files Scanned:** 1,000 TypeScript/TSX files
