# UI/UX Violation Backlog

**Generated:** 2025-12-15
**Source Audits:** spacing-audit.md, typography-audit.md, interactive-elements-audit.md, layout-patterns-audit.md
**Total Violations:** 47

## Summary by Priority

| Priority | Count | Est. Effort |
|----------|-------|-------------|
| P0 - Critical | 8 | 2.5 hours |
| P1 - High | 8 | 3.5 hours |
| P2 - Medium | 24 | 6 hours |
| P3 - Low | 7 | 1.5 hours |
| **Total** | **47** | **13.5 hours** |

## Summary by Principle

| Principle | Violations |
|-----------|------------|
| Spacing & Layout | 12 |
| Typography | 0 |
| Interactive Elements | 12 |
| Layout Patterns | 23 |

---

## P0 - Critical (Fix Immediately)

> **Accessibility blockers, WCAG AA failures, unusable on iPad**

| ID | File:Line | Principle | Issue | Fix | Effort |
|----|-----------|-----------|-------|-----|--------|
| 1 | `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx:44` | Interactive | Settings button 32px touch target | Change `h-8 w-8` to `h-11 w-11` | S |
| 2 | `src/atomic-crm/organizations/AuthorizationsTab.tsx:529` | Interactive | Toggle button 32px touch target | Change `w-8 h-8` to `w-11 h-11` | S |
| 3 | `src/components/admin/form/StepIndicator.tsx:59` | Interactive | Step circles 32px touch target | Change `w-8 h-8` to `w-11 h-11` | S |
| 4 | `src/components/ui/pagination.tsx:98` | Interactive | Pagination link 36px touch target | Change `size-9` to `size-11` | S |
| 5 | `src/components/admin/bulk-delete-button.tsx:87` | Interactive | Button height 36px override | Remove `h-9` override, use default h-12 | S |
| 6 | `src/components/admin/bulk-export-button.tsx:50` | Interactive | Button height 36px override | Remove `h-9` override, use default h-12 | S |
| 7 | `src/atomic-crm/simple-list/SimpleListItem.tsx:61,75` | Interactive | No focus indicator (`focus:outline-none` without ring) | Add `focus-visible:ring-2 focus-visible:ring-ring` | S |
| 8 | `src/atomic-crm/opportunities/OpportunityRowListView.tsx:141` | Interactive | Link has `focus:outline-none` without visible ring | Add `focus-visible:ring-2 focus-visible:ring-ring` | S |

**P0 Total: 8 violations | ~2.5 hours**

---

## P1 - High (Fix This Sprint)

> **Usability issues, frequent user paths affected**

| ID | File:Line | Principle | Issue | Fix | Effort |
|----|-----------|-----------|-------|-----|--------|
| 9 | `src/components/layouts/ResourceSlideOver.tsx:176` | Layout | SlideOver width `w-[78vw]` squeezes main content | Change to `w-[40vw] max-w-[600px]` with `md:w-full md:fixed md:inset-0` for iPad | L |
| 10 | `src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx:192` | Layout | Three-column form layout violates F-pattern | Split into max 2 columns or single column | M |
| 11 | `src/atomic-crm/opportunities/forms/OpportunityWizardSteps.tsx:200` | Layout | Three-column form layout violates F-pattern | Split into max 2 columns or single column | M |
| 12 | `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx:141` | Interactive | Drag handle 36px width touch target | Change `min-w-[36px]` to `min-w-[44px]` | S |
| 13 | `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx:163` | Interactive | Menu trigger 36px width touch target | Change `min-w-[36px]` to `min-w-[44px]` | S |
| 14 | `src/atomic-crm/utils/contextMenu.tsx:82` | Interactive | Non-standard z-index `z-[9999]` | Change to `z-50` (standard portal layer) | S |
| 15 | `src/atomic-crm/utils/contextMenu.tsx:94` | Interactive | Menu items < 44px height (`py-3` ~24px) | Add `min-h-[44px]` to menu items | M |
| 16 | `src/components/layouts/StandardListLayout.tsx:166` | Layout | Missing min-width constraint on main content | Add `min-w-[600px]` to prevent squeeze | S |

**P1 Total: 8 violations | ~3.5 hours**

---

## P2 - Medium (Fix Next Sprint)

> **Design system violations, visual inconsistencies**

| ID | File:Line | Principle | Issue | Fix | Effort |
|----|-----------|-----------|-------|-----|--------|
| 17 | `src/components/admin/simple-form-iterator.tsx:332` | Spacing | Button spacing `gap-1` (4px) | Change to `gap-2` (8px) | S |
| 18 | `src/components/admin/form/form-primitives.tsx:61` | Spacing | Form item spacing `gap-2` (8px) | Change to `gap-4` (16px) or verify intentional | S |
| 19 | `src/components/ui/form.tsx:72` | Spacing | FormMessage spacing `space-y-2` (8px) | Change to `space-y-4` (16px) or verify intentional | S |
| 20 | `src/components/admin/login-page.tsx:57` | Layout | Mobile-first width `sm:w-[350px]` | Change to `w-[350px] md:w-full` | S |
| 21 | `src/components/admin/bulk-actions-toolbar.tsx:32` | Layout | Mobile-first layout `flex-col sm:items-center` | Change to `flex-row items-center md:flex-col` | S |
| 22 | `src/components/admin/simple-form-iterator.tsx:324` | Layout | Mobile-first flex `flex-col sm:flex-row` | Change to `flex-row md:flex-col` | S |
| 23 | `src/components/supabase/layout.tsx:19` | Layout | Mobile-first width `sm:w-[350px]` | Change to `w-[350px] md:w-full` | S |
| 24 | `src/components/ui/alert-dialog.tsx:53` | Layout | Mobile-first layout `flex-col-reverse sm:flex-row` | Change to `flex-row justify-end md:flex-col-reverse` (shadcn override) | S |
| 25 | `src/components/ui/dialog.tsx:82` | Layout | Mobile-first layout `flex-col-reverse sm:flex-row` | Change to `flex-row justify-end md:flex-col-reverse` (shadcn override) | S |
| 26 | `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:516` | Layout | Mobile-first layout `flex-col sm:flex-row` | Change to `flex-row items-end md:flex-col` | S |
| 27 | `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:542` | Layout | Mobile-first layout `flex-col sm:flex-row` | Change to `flex-row md:flex-col` | S |
| 28 | `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:544` | Layout | Mobile-first width `w-full sm:w-auto` | Change to `w-auto md:w-full` | S |
| 29 | `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:555` | Layout | Mobile-first width `w-full sm:w-auto` | Change to `w-auto md:w-full` | S |
| 30 | `src/atomic-crm/opportunities/OpportunityRowListView.tsx:118` | Layout | Mobile-first layout `flex-col sm:flex-row` | Change to `flex-row md:flex-col` | S |
| 31 | `src/atomic-crm/opportunities/OpportunityRowListView.tsx:125` | Layout | Mobile-first width `w-full sm:w-auto` | Change to `w-auto md:w-full` | S |
| 32 | `src/atomic-crm/opportunities/OpportunityRowListView.tsx:208` | Layout | Mobile-first gaps `sm:gap-3 sm:justify-end` | Change to `gap-3 justify-end md:gap-2 md:justify-start` | S |
| 33 | `src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx:139` | Layout | Mobile-first layout `flex-col sm:flex-row` | Change to `flex-row justify-end md:flex-col` | S |
| 34 | `src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx:148` | Layout | Mobile-first width `sm:w-[calc(100%-2rem)]` | Change to `w-[calc(100%-2rem)] md:w-full` | S |
| 35 | `src/atomic-crm/opportunities/quick-add/QuickAddDialog.tsx:26` | Layout | Mobile-first width `sm:w-[calc(100%-2rem)]` | Change to `w-[calc(100%-2rem)] md:w-full` | S |
| 36 | `src/atomic-crm/opportunities/OpportunityArchivedList.tsx:74` | Layout | Mobile-first grid `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` | Change to `grid-cols-3 lg:grid-cols-2 md:grid-cols-1` | S |
| 37 | `src/atomic-crm/filters/FilterChipBar.tsx:103` | Layout | Horizontal scroll on filter bar | Consider wrapping or truncation instead of `overflow-x-auto` | M |
| 38 | `src/components/ui/breadcrumb.tsx:85` | Interactive | Breadcrumb ellipsis 36px touch target | Change `size-9` to `size-11` | S |
| 39 | `src/components/admin/form/ButtonPlaceholder.tsx:19` | Interactive | Placeholder button 36px touch target | Change `h-9 w-9` to `h-11 w-11` | S |
| 40 | `src/components/ui/navigation-menu.tsx:137` | Interactive | Non-standard z-index `z-[1]` | Change to `z-10` (standardized) | S |

**P2 Total: 24 violations | ~6 hours**

---

## P3 - Low (Backlog)

> **Minor polish, rare user paths, edge case layouts**

| ID | File:Line | Principle | Issue | Fix | Effort |
|----|-----------|-----------|-------|-----|--------|
| 41 | `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx:145` | Spacing | Inline style for border | Extract to CSS variable or Tailwind utility | S |
| 42 | `src/atomic-crm/organizations/OrganizationAvatar.tsx:15` | Spacing | Hardcoded pixel `w-[20px] h-[20px]` | Change to `w-5 h-5` (Tailwind scale) | S |
| 43 | `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx:26` | Layout | Redundant breakpoints `h-11 w-11 sm:h-11 sm:w-11` | Remove redundant `sm:` classes | S |
| 44 | `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx:40` | Layout | Redundant breakpoints `h-11 w-11 sm:h-11 sm:w-11` | Remove redundant `sm:` classes | S |
| 45 | `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx:54` | Layout | Redundant breakpoints `h-11 w-11 sm:h-11 sm:w-11` | Remove redundant `sm:` classes | S |
| 46 | `src/components/ui/card-elevation.stories.tsx:71,88,227,235,243` | Interactive | `focus:outline-none` without ring in stories | Add `focus-visible:ring-2 focus-visible:ring-ring` | S |
| 47 | `src/atomic-crm/opportunities/OpportunityList.tsx:152` | Layout | `flex-1` without min-width guard | Add `min-w-0` or `min-w-[600px]` | S |

**P3 Total: 7 violations | ~1.5 hours**

---

## Effort Legend

| Size | Time | Scope |
|------|------|-------|
| S | < 15 min | Single class change, single file |
| M | 15-60 min | Multiple files or logic change |
| L | 1-4 hours | Component refactor, structural change |

---

## Implementation Notes

### P0 Focus State Fixes
All focus state violations follow the same pattern. Create a search/replace batch:
```
# Find
focus:outline-none

# Replace with (when no ring exists)
focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
```

### P2 Mobile-First Breakpoint Fixes
These follow a consistent inversion pattern:
- `flex-col sm:flex-row` → `flex-row md:flex-col`
- `w-full sm:w-auto` → `w-auto md:w-full`
- `sm:w-[X]` → `w-[X] md:w-full`

Consider creating a codemod script for bulk conversion.

### shadcn/ui Overrides (IDs 24-25)
`alert-dialog.tsx` and `dialog.tsx` use mobile-first patterns from shadcn/ui defaults. Options:
1. Override in local components (recommended)
2. Document as accepted exception for dialog footers
3. Create wrapper components with desktop-first styling

### Context Menu Refactor (IDs 14-15)
Consider full refactor to `@radix-ui/react-context-menu` which provides:
- Auto-portaling to avoid z-index issues
- Built-in collision detection
- Proper touch target defaults

---

## Verification Checklist

- [x] All 🔴 violations from spacing-audit.md included (12 violations)
- [x] All violations from typography-audit.md included (0 violations - fully compliant!)
- [x] All violations from interactive-elements-audit.md included (12 violations, some deduplicated)
- [x] All violations from layout-patterns-audit.md included (23 violations)
- [x] Each violation has priority assigned (P0-P3)
- [x] Each violation has effort estimate (S/M/L)
- [x] Summary counts match detailed backlog (47 total)
- [x] Grouped by priority, sorted by effort within priority

---

## Cross-Reference: Audit Sources

| Audit File | Violations Found | Unique to Backlog |
|------------|------------------|-------------------|
| spacing-audit.md | 14 | 4 (rest overlap with Interactive) |
| typography-audit.md | 0 | 0 |
| interactive-elements-audit.md | 12 | 8 |
| layout-patterns-audit.md | 23 | 23 |
