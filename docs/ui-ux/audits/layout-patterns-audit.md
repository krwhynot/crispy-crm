# Layout Patterns Audit

**Audited:** 2025-12-15
**Files Scanned:** 450 (70 in `src/components/ui/` + 380 in `src/atomic-crm/`)
**Reference:** `/docs/ui-ux/layout-patterns.md`

## Summary

| Category | Count |
|----------|-------|
| Violations | 23 |
| Compliant | 89 |
| N/A | 338 |

**Key Issues Identified:**
1. SlideOver sizing deviates from spec (`w-[78vw]` vs required `w-[40vw]`)
2. Multiple mobile-first breakpoint patterns violate desktop-first principle
3. Two form files use prohibited three-column layouts
4. Main content `min-w-[600px]` constraint not consistently applied

---

## Responsive Breakpoints (Desktop-First)

**Rule:** Write styles for 1440px viewports by default. Use `lg:`, `md:`, `sm:` for progressive degradation. Never use mobile-first patterns like `sm:flex-row` (starts stacked, expands).

### Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/components/admin/login-page.tsx` | 57 | Mobile-first width | `sm:w-[350px]` | Default `w-[350px]` with `md:w-full` |
| `src/components/admin/bulk-actions-toolbar.tsx` | 32 | Mobile-first layout | `flex-col sm:items-center sm:w-fit` | Default `flex-row items-center w-fit md:flex-col` |
| `src/components/admin/simple-form-iterator.tsx` | 324 | Mobile-first flex | `flex-col sm:flex-row` | Default `flex-row md:flex-col` |
| `src/components/supabase/layout.tsx` | 19 | Mobile-first width | `sm:w-[350px]` | Default `w-[350px]` with `md:w-full` |
| `src/components/ui/alert-dialog.tsx` | 53 | Mobile-first layout | `flex-col-reverse sm:flex-row sm:justify-end` | Default `flex-row justify-end md:flex-col-reverse` |
| `src/components/ui/dialog.tsx` | 82 | Mobile-first layout | `flex-col-reverse sm:flex-row sm:justify-end` | Default `flex-row justify-end md:flex-col-reverse` |
| `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` | 516 | Mobile-first layout | `flex-col sm:flex-row sm:items-end` | Default `flex-row items-end md:flex-col` |
| `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` | 542 | Mobile-first layout | `flex-col sm:flex-row` | Default `flex-row md:flex-col` |
| `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` | 544 | Mobile-first width | `w-full sm:w-auto` | Default `w-auto md:w-full` |
| `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` | 555 | Mobile-first width | `w-full sm:w-auto` | Default `w-auto md:w-full` |
| `src/atomic-crm/opportunities/OpportunityRowListView.tsx` | 118 | Mobile-first layout | `flex-col sm:flex-row` | Default `flex-row md:flex-col` |
| `src/atomic-crm/opportunities/OpportunityRowListView.tsx` | 125 | Mobile-first width | `w-full sm:w-auto` | Default `w-auto md:w-full` |
| `src/atomic-crm/opportunities/OpportunityRowListView.tsx` | 208 | Mobile-first layout | `sm:gap-3 sm:justify-end` | Default `gap-3 justify-end md:gap-2 md:justify-start` |
| `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx` | 26,40,54 | Redundant sm: classes | `h-11 w-11 sm:h-11 sm:w-11` | Just `h-11 w-11` (already 44px) |
| `src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx` | 139 | Mobile-first layout | `flex-col sm:flex-row sm:justify-end` | Default `flex-row justify-end md:flex-col` |
| `src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx` | 148 | Mobile-first width | `sm:w-[calc(100%-2rem)]` | Default `w-[calc(100%-2rem)] md:w-full` |
| `src/atomic-crm/opportunities/quick-add/QuickAddDialog.tsx` | 26 | Mobile-first width | `sm:w-[calc(100%-2rem)]` | Default `w-[calc(100%-2rem)] md:w-full` |
| `src/atomic-crm/opportunities/OpportunityArchivedList.tsx` | 74 | Mobile-first grid | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` | Default `grid-cols-3 lg:grid-cols-2 md:grid-cols-1` |

### Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/design-system/ResponsiveGrid.tsx` | 79 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (progressive enhancement for cards) |
| `src/atomic-crm/organizations/OrganizationImportResult.tsx` | 148 | `grid-cols-1 md:grid-cols-3` (desktop default with tablet fallback) |
| `src/atomic-crm/reports/WeeklyActivitySummary.tsx` | 195 | `grid-cols-1 lg:grid-cols-3` (proper desktop-first) |
| `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx` | 345 | `grid-cols-1 lg:grid-cols-3` (proper desktop-first) |
| `src/atomic-crm/contacts/ContactImportDialog.tsx` | 557 | `grid-cols-1 lg:grid-cols-3` (proper desktop-first) |

### N/A

| File | Reason |
|------|--------|
| `src/components/ui/*.stories.tsx` (21 files) | Storybook demos, not production code |
| UI primitive components (button, badge, card, etc.) | No responsive breakpoints needed |

---

## Three-Panel Dashboard

**Rule:**
- Sidebar: 240px fixed (`w-60`) or collapsible to 64px (`w-16`)
- Main content: `flex-1` with `min-w-[600px]` constraint
- SlideOver: `w-[40vw] max-w-[600px]` on desktop, full-screen on iPad

### Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/components/layouts/ResourceSlideOver.tsx` | 176 | SlideOver width exceeds spec | `w-[78vw] min-w-[576px] max-w-[1024px]` | `w-[40vw] max-w-[600px] md:w-full md:fixed md:inset-0` |

### Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/layouts/StandardListLayout.tsx` | 166 | Uses `flex-1 min-w-0` for main content |
| `src/components/ui/sidebar.tsx` | 194 | Proper collapsible sidebar pattern |
| `src/atomic-crm/layout/Layout.tsx` | - | Integrates with standard layout shell |

### N/A - Missing Constraint

| File | Issue |
|------|-------|
| `src/components/layouts/StandardListLayout.tsx` | Main content uses `flex-1 min-w-0` but lacks `min-w-[600px]` constraint |
| `src/atomic-crm/opportunities/OpportunityList.tsx` | Uses `flex-1` without min-width guard |

---

## Form Layout Standards

**Rules:**
- Default: Single-column with `max-w-2xl`
- Two-column: ONLY for semantically related field pairs (first/last name, city/state)
- Three-column: NEVER allowed for forms
- Section spacing: `space-y-8` between sections, `space-y-4` within
- Labels: Above inputs (except checkboxes)

### Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx` | 192 | Three-column form layout | `CompactFormRow columns="md:grid-cols-3"` | Max `grid-cols-2` for related pairs only |
| `src/atomic-crm/opportunities/forms/OpportunityWizardSteps.tsx` | 200 | Three-column form layout | `CompactFormRow columns="md:grid-cols-3"` | Max `grid-cols-2` for related pairs only |

### Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/admin/login-page.tsx` | 61 | `space-y-8` for form sections |
| `src/components/admin/form/FormSectionWithProgress.tsx` | 53, 100 | `space-y-4` within sections |
| `src/atomic-crm/organizations/OrganizationCompactForm.tsx` | 109 | `space-y-4` within sections |
| `src/atomic-crm/contacts/LinkOpportunityModal.tsx` | 79 | `space-y-4` for form fields |
| `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx` | 219, 263, 306 | `space-y-4` within sections |
| `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` | 259 | `space-y-4` for form fields |

### N/A

| File | Reason |
|------|--------|
| Most `space-y-4` / `space-y-8` usages in non-form contexts | Layout spacing, not form-specific |
| Import dialogs, result screens | Data display, not user input forms |

---

## Table/List Density

**Rules:**
- Row heights: 52px comfortable (default), 40px dense
- Action columns: Fixed width, right-aligned, no wrapping
- Status columns: Fixed width with `whitespace-nowrap`
- Empty cells: Display `-` with `text-muted-foreground`

### Violations

None identified. Current implementation follows standards.

### Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/ui/table.tsx` | 59 | Table header: `min-h-[48px] whitespace-nowrap` |
| `src/components/ui/table.tsx` | 72 | Table cell: `min-h-[56px] whitespace-nowrap` |
| `src/atomic-crm/reports/CampaignActivity/StaleLeadsView.tsx` | 129, 137, 140 | `whitespace-nowrap` on data cells |
| `src/atomic-crm/reports/CampaignActivity/ActivityTypeCard.tsx` | 148, 151 | `whitespace-nowrap` on data cells |

### N/A

| File | Reason |
|------|--------|
| Files using PremiumDatagrid | MUI DataGrid handles density internally |
| Kanban/card views | Not table-based layouts |

---

## Overflow Handling

**Rules:**
- Horizontal scroll: ONLY for wide tables, NEVER for page content
- Vertical scroll: On main content area, not individual cards
- Tables: Wrap in `<div className="overflow-x-auto">`

### Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/atomic-crm/filters/FilterChipBar.tsx` | 103 | Horizontal scroll on filter bar | `overflow-x-auto` on chip container | Consider truncation or wrap instead |

### Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/ui/table.tsx` | 7 | Table container: `overflow-x-auto` |
| `src/atomic-crm/organizations/OrganizationImportPreview.tsx` | 377 | Table wrapper: `overflow-x-auto` |
| `src/atomic-crm/reports/CampaignActivity/StaleLeadsView.tsx` | 91 | Table wrapper: `overflow-x-auto` |
| `src/atomic-crm/reports/CampaignActivity/ActivityTypeCard.tsx` | 112 | Table wrapper: `overflow-x-auto` |
| `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx` | 444 | Table wrapper: `overflow-x-auto` |
| `src/atomic-crm/contacts/ContactImportPreview.tsx` | 421 | Table wrapper: `overflow-x-auto` |
| `src/atomic-crm/admin/HealthDashboard.tsx` | 310 | Table wrapper: `overflow-x-auto` |

### N/A

| File | Reason |
|------|--------|
| `src/components/ui/card-elevation.stories.tsx:309` | `<pre>` element in stories |
| `src/components/ui/alert.stories.tsx:265` | `<pre>` element in stories |
| `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx:315` | Kanban horizontal scroll is intentional UX |

---

## Touch Targets

**Rule:** Minimum 44x44px (`h-11 w-11`) for all interactive elements.

### Violations

None identified in audited files.

### Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/layouts/StandardListLayout.tsx` | 88, 128, 150 | `h-11 w-11` on buttons |
| `src/components/admin/filter-form.tsx` | 158 | `h-11 w-11` on filter button |
| `src/components/admin/user-menu.tsx` | 41-42 | `h-11 w-11` on avatar button |
| `src/components/admin/list-pagination.tsx` | 88 | `h-11` on select trigger |
| `src/components/layouts/ResourceSlideOver.tsx` | 209, 252 | `h-11` on action buttons |
| `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx` | 26, 40, 54 | `h-11 w-11` on view toggle buttons |
| `src/components/NotificationBell.tsx` | 35 | `min-h-[44px] min-w-[44px]` on notification button |

---

## Priority Fixes

### Critical (Affects UX)

1. **SlideOver Width** (`ResourceSlideOver.tsx:176`)
   - Current: `w-[78vw]` takes most of screen
   - Impact: Main content gets squeezed below usable width
   - Fix: Change to `w-[40vw] max-w-[600px]` with `md:w-full md:fixed md:inset-0` for iPad

2. **Three-Column Forms** (`OpportunityCompactForm.tsx:192`, `OpportunityWizardSteps.tsx:200`)
   - Current: Stage, Priority, Close Date in one row
   - Impact: Increased cognitive load, F-pattern violation
   - Fix: Split into two rows or single column

### High (Inconsistent Patterns)

3. **Mobile-First Dialogs** (`alert-dialog.tsx:53`, `dialog.tsx:82`)
   - These are shadcn/ui defaults
   - Consider overriding with desktop-first pattern or document exception

4. **Main Content Min-Width** (`StandardListLayout.tsx`)
   - Add `min-w-[600px]` constraint to prevent content squeeze

### Medium (Polish)

5. **Filter Chip Bar Overflow** (`FilterChipBar.tsx:103`)
   - Evaluate if horizontal scroll or wrapping is better UX

6. **Redundant Breakpoints** (`OpportunityViewSwitcher.tsx`)
   - Remove redundant `sm:h-11 sm:w-11` when default is already `h-11 w-11`

---

## Verification Commands

```bash
# Re-check for mobile-first patterns
grep -rn "sm:flex-row\|sm:grid-cols\|sm:w-" --include="*.tsx" src/

# Verify SlideOver sizing
grep -rn "w-\[40vw\]" --include="*.tsx" src/

# Check for three-column forms
grep -rn "grid-cols-3.*Input\|CompactFormRow.*grid-cols-3" --include="*.tsx" src/

# Verify min-width constraints on main content
grep -rn "min-w-\[600px\]\|min-w-\[576px\]" --include="*.tsx" src/

# Touch target compliance
grep -rn "h-11 w-11\|min-h-\[44px\]\|min-w-\[44px\]" --include="*.tsx" src/
```

---

## Appendix: Files Not Applicable

The following 338 files were excluded from detailed audit:

- **Storybook files** (`*.stories.tsx`): 45 files - Demo purposes only
- **Test files** (`*.test.tsx`, `*.spec.tsx`): 52 files - Not production UI
- **Utility/hooks** (no UI): ~80 files - Business logic only
- **Context providers**: ~15 files - No visual elements
- **Type definitions**: ~20 files - TypeScript interfaces only
- **Simple components** (badges, icons, etc.): ~126 files - No layout responsibility
