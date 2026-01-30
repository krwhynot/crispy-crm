# UX Blockers Audit — 2026-01-29

**Mode:** deep | **Checks:** 56/56 | **Duration:** 104.85s | **Files Scanned:** 1,000

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Blockers | 0 |
| 🟡 Warnings | 5 |
| ✅ Clean | 51 |

## Blockers

High-confidence issues that **prevent users from completing tasks**. These require immediate attention.

**None found.** All identified issues require verification or are code quality concerns that don't block user workflows.

## Warnings

Moderate-confidence issues needing verification before classification as blockers.

| # | Check | File | Line | Impact | Confidence | Verify By |
|---|-------|------|------|--------|------------|-----------|
| 1 | Console.log in JSDoc example | src/atomic-crm/components/SampleStatusBadge.tsx | 182 | Code quality violation — documentation shows console.log usage | 0.95 | Verify if executable code or just JSDoc comment |
| 2 | Aggressive refetchOnWindowFocus | src/atomic-crm/timeline/UnifiedTimeline.tsx | 63 | Every tab switch fires API storm — app freezes on return | 0.90 | Verify if staleTime is also configured to limit refetch frequency |
| 3 | Aggressive refetchOnWindowFocus | src/atomic-crm/contacts/OpportunitiesTab.tsx | 59 | Every tab switch fires API storm — app freezes on return | 0.90 | Verify if staleTime is also configured to limit refetch frequency |
| 4 | Aggressive refetchOnWindowFocus | src/atomic-crm/dashboard/usePrincipalOpportunities.ts | 55 | Every tab switch fires API storm — app freezes on return | 0.90 | Check if dashboard uses SHORT_STALE_TIME_MS to prevent excessive refetch |
| 5 | Touch target too small | src/components/NotificationDropdown.tsx | 139 | Button/link too small for iPad touch — user misses tap target | 0.85 | Check if icon is inside a larger clickable parent (Button, etc) with h-11 or larger |

## Analysis

### Test File False Positives (Removed)

**Good News:** Test file warnings have been removed from this report:

- **FORM-B003:** Test files intentionally use `mode: "onChange"` to verify validation behavior ✅
- **DATA-B002:** Test mocks use hardcoded query keys — this doesn't affect production ✅

These were incorrectly flagged as warnings. Test files are explicitly exempted from production code quality rules.

### Issues Requiring Verification

**1. Console.log in JSDoc Example (WARNING - Code Quality)**
- **File:** src/atomic-crm/components/SampleStatusBadge.tsx:182
- **Evidence:** JSDoc example showing `console.log` usage
- **Severity:** Low — documentation example, not executable code
- **Classification:** Downgraded from BLOCKER to WARNING
- **Reasoning:** Doesn't prevent users from completing tasks (blocker definition requires user impact)
- **Fix:** Replace with logger in documentation example for consistency

**2. Aggressive refetchOnWindowFocus (3 instances - WARNING)**
- **Files:** UnifiedTimeline, OpportunitiesTab, usePrincipalOpportunities
- **Impact:** Potential API storm on every tab switch IF staleTime is not configured
- **Classification:** Correctly marked as WARNING (needs verification)
- **Per STALE_STATE_STRATEGY.md:** `refetchOnWindowFocus: true` WITH `staleTime` is an approved pattern
- **Recommendation:** Verify these use `SHORT_STALE_TIME_MS` (30s) to prevent excessive refetching

**3. Small Touch Targets (WARNING - Accessibility)**
- **File:** NotificationDropdown.tsx:139
- **Evidence:** Icon using `h-8 w-8` (32px) instead of minimum 44px
- **Classification:** WARNING (needs verification)
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

**Priority: All items are warnings requiring verification, not immediate blockers.**

1. **Verify refetch patterns:** Check if UnifiedTimeline, OpportunitiesTab, and usePrincipalOpportunities use SHORT_STALE_TIME_MS to prevent API storms
2. **Accessibility check:** Verify NotificationDropdown touch targets meet 44px minimum (check if icon is inside larger clickable area)
3. **Code quality cleanup:** Remove console.log from SampleStatusBadge.tsx JSDoc example
4. **Optional deep dive:** Run `/audit/deep/data-flow` for comprehensive cache invalidation analysis

**No blockers found** - users can complete all tasks without being stopped by UI issues.

---

**Report Generated:** 2026-01-30T02:08:20Z
**Audit Duration:** 104.85 seconds
**Files Scanned:** 1,000 TypeScript/TSX files
