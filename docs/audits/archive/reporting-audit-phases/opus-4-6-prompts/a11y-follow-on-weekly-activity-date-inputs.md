# Follow-On Ticket: Weekly Activity Date Input Accessibility (P1)

**Source:** Reporting Audit Phase 1 (Q3=A) / Phase 4 (Q1-P4=A)
**Severity:** P1 (accessibility)
**Scope:** Outside metric-correctness remediation — standalone a11y improvement
**Status:** OPEN
**Date Created:** 2026-02-11

---

## Problem

`WeeklyActivitySummary.tsx` (lines 241-253) uses raw `<input type="date">` elements for the date range picker:

```tsx
<input
  type="date"
  value={dateRange.start}
  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
  className="h-11 px-3 py-2 border rounded text-sm"
/>
```

**Violations:**
1. No `aria-label` or `<label htmlFor>` association (WCAG 2.1 AA 1.3.1 / 4.1.2)
2. No `aria-describedby` for date format hints
3. Inconsistent with other report tabs (OverviewTab uses `TabFilterBar` with accessible presets)
4. Raw `<input>` bypasses Tier 2 wrapper convention (UI_STANDARDS.md)

## Recommended Fix

Replace raw date inputs with `TabFilterBar` date range component, matching the pattern used in `OverviewTab.tsx`. This resolves:
- a11y: `<label>` association, `aria-label`, screen reader announcements
- UX consistency: Same filter pattern across all report tabs
- Architecture: Tier 2 wrapper compliance (no raw Tier 1 in features)

### Files to Change

| File | Change |
|------|--------|
| `src/atomic-crm/reports/WeeklyActivitySummary.tsx` | Replace `<input type="date">` pair with `TabFilterBar` date range preset |
| `src/atomic-crm/reports/components/TabFilterBar.tsx` | May need date range mode (currently supports presets; Weekly Activity needs arbitrary date selection) |

### Acceptance Criteria

- [ ] Date range inputs have associated `<label>` elements or `aria-label` attributes
- [ ] Screen readers announce the purpose of each date input
- [ ] Filter pattern matches OverviewTab's `TabFilterBar` approach
- [ ] No raw `<input>` elements remain in WeeklyActivitySummary
- [ ] Touch targets meet 44px minimum (`h-11`)
- [ ] Existing date filtering behavior preserved (start/end range selection)

## References

- Reporting Audit Phase 1, Section: Accessibility findings
- Reporting Audit Phase 4, Section 4: Filter Layout/Design Quality
- Phase 4 Q1-P4 decision: **A** (standalone ticket)
- UI_STANDARDS.md: Tier 2 wrapper convention
- CODE_QUALITY.md: Accessibility Requirements
