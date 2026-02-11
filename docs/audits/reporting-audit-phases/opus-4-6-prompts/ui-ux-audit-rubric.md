# Reporting UI/UX Audit Rubric

Use this rubric during reporting audits to evaluate usability risks that can reduce trust in reported numbers.

## Required Coverage Areas

All four areas are mandatory:

1. Visual layout quality (including filter layout and filter visual design)
2. UX flow quality
3. Accessibility and mobile behavior
4. Empty/loading/error state usability

## Scoring Model

Use one score per area:

- `PASS`: clear and consistent, no trust-impacting defects
- `PASS_WITH_NOTE`: minor usability issues, no direct trust risk
- `FAIL`: issue can mislead users, block interpretation, or hide/report wrong context

Use severity tags for defects:

- `P0`: blocks critical reporting use
- `P1`: high trust risk or frequent confusion risk
- `P2`: medium friction, workaround exists
- `P3`: low impact polish issue

## Area 1: Visual Layout Quality

Check:

- KPI cards/charts/tables have clear hierarchy and readable labels.
- Numbers, labels, and units are visually associated and not ambiguous.
- Related filters and result regions appear grouped logically.
- Filter bars/panels are visually organized, with clear grouping, spacing, and labels.
- Filter controls use consistent visual patterns across report pages.
- Dense views remain scannable without requiring trial-and-error.

Common fail conditions:

- Similar metrics look interchangeable without clear labels.
- Chart legends/axes or totals are hard to map to visible values.
- Filter controls are crowded or visually inconsistent enough to cause wrong filter selection.
- Layout causes users to misread what a number represents.

## Area 2: UX Flow Quality

Check:

- Filter controls are easy to find and understand.
- Filter interaction design is predictable (single-select, multi-select, clear/reset behavior).
- Filter changes are reflected predictably in all relevant widgets.
- Drill-down/navigation path from summary to detail is obvious.
- Export actions (CSV) align with the current filtered context.

Common fail conditions:

- Filter changes only update part of the page with no explanation.
- Filter behavior differs between similar reports without clear UX reason.
- Users cannot tell whether metrics are stale or refreshed.
- Export content does not clearly match visible filters.

## Filter Layout And Design Checks (Mandatory)

Run these checks on each audited reporting surface:

- Are filter controls visible without hunting or excessive scrolling?
- Are filter labels plain-language and unambiguous for average CRM users?
- Is filter grouping logical (time, owner/principal, pipeline, campaign, status)?
- Is active filter state always visible near metric outputs?
- Is clear/reset behavior obvious and safe?
- On mobile, are filters still discoverable and understandable?

If any answer is "no", log at least `PASS_WITH_NOTE`.
If the issue can cause wrong interpretation of report values, log `FAIL`.

## Major Visual/UX Change Classification

Classify each proposed UX/layout fix:

- `MINOR_UX_CHANGE`: text, spacing, or small control tweaks without structural layout change
- `MAJOR_UX_CHANGE`: filter bar redesign, layout reflow, major component repositioning, navigation model change, or any change likely to alter user workflow

Any `MAJOR_UX_CHANGE` requires explicit owner permission before implementation.

## Area 3: Accessibility And Mobile Behavior

Check:

- Keyboard navigation works for critical filter/report actions.
- Focus order is logical and visible.
- Critical labels/values meet readable contrast expectations.
- Desktop and mobile viewport behavior preserve metric meaning.

Common fail conditions:

- Core report actions are mouse-only.
- Mobile layout hides filter context or metric labels.
- Contrast/focus issues make critical numbers hard to verify.

## Area 4: Empty/Loading/Error State Usability

Check:

- Loading states preserve context and avoid misleading stale values.
- Empty states explain why there is no data and what to do next.
- Error states are actionable and do not imply false zero values.
- Retries and fallback behavior are visible and understandable.

Common fail conditions:

- No-data states look like true zeros without explanation.
- Loading state shows outdated totals with no pending indicator.
- Error states hide key reporting context or recovery steps.

## Evidence Requirements

For each area and issue captured:

- Surface/page name
- Local URL (localhost)
- Scenario/filter context
- Defect statement in user language
- Severity and confidence
- Best-practice reference(s) used

## Best-Practice Research Protocol (Ref MCP)

1. Use Ref MCP to collect 3-5 current best-practice references for reporting UX/data visualization/accessibility.
2. Capture source title, date, and why it applies.
3. Map each major UX finding to at least one reference.
4. If Ref MCP is unavailable, mark `REF_MCP_UNAVAILABLE` and cite fallback primary sources used.
