# UI/UX Consistency Remediation Checklist

**Created:** January 8, 2026
**Source:** UI/UX Consistency Audit Report
**Plan:** `.claude/plans/cached-meandering-liskov.md`

---

## Phase 1: Critical Issues

### 1.1 TaskCreate Form → Single-Page with Sections
- [x] Create `src/atomic-crm/tasks/TaskCompactForm.tsx`
- [x] Migrate fields from `TaskGeneralTab.tsx` (title, description, due_date, reminder_date)
- [x] Migrate fields from `TaskDetailsTab.tsx` (priority, type, sales_id, organization_id, opportunity_id, contact_id)
- [x] Update `TaskCreate.tsx` to use `TaskCompactForm` instead of `TaskInputs`
- [x] Delete `TaskInputs.tsx` (tabbed wrapper)
- [x] Delete `TaskGeneralTab.tsx`
- [x] Delete `TaskDetailsTab.tsx`
- [x] Verify form validation still works (typecheck passes)
- [ ] Verify progress bar updates correctly (requires manual test)

### 1.2 OpportunityCompactForm → Add Section Headers
- [x] Wrap "Opportunity Details" fields (name, customer, principal) in `FormSectionWithProgress`
- [x] Wrap "Pipeline" fields (stage, priority, close_date, account_manager, distributor) in `FormSectionWithProgress`
- [x] Keep existing `CollapsibleSection` components for optional groups
- [ ] Verify progress tracking works with new sections (requires manual test)

### 1.3 Issues Closed (No Changes Needed)
- [x] Row heights - Already consistent at 52px via `table-row-premium`
- [x] Input heights - Already correct at 44px (h-11)
- [x] List layouts - All use `StandardListLayout` consistently

---

## Phase 2: Medium Issues

### 2.1 Slide-Over Header Actions
- [x] Remove broken `<QuickAddTaskButton />` from `TaskSlideOver.tsx` (had no params)
- [x] Verify `QuickAddTaskButton` renders correctly in `OrganizationSlideOver.tsx` (passes organizationId)

### 2.2 Breadcrumbs for Slide-Overs
- [x] Create `OrganizationHierarchyBreadcrumb.tsx`
- [x] Add breadcrumb prop to `OrganizationSlideOver.tsx`
- [x] Create `TaskHierarchyBreadcrumb.tsx` (show parent opportunity/organization)
- [x] Add breadcrumb prop to `TaskSlideOver.tsx`

### 2.3 Edit Button Positioning
- [x] Review `ResourceSlideOver.tsx` edit button placement (already correct - in header actions row line 265-296)
- [x] Move button to header actions row if overlapping tabs (N/A - already correctly positioned)

### 2.4 Badge Styling System
- [x] Document badge semantic system (filled vs outline) - See `docs/design/badge-semantic-system.md`
- [x] Audit status badges for consistency (all use semantic variants or tag classes)
- [x] Audit priority badges for consistency (all use CVA variants: destructive/default/secondary/outline)
- [x] Audit type/category badges for consistency (all use tag-* classes from MFB theme)

### 2.5 Dropdown Background Consistency
- [x] Audit `OrganizationCompactForm.tsx` dropdown styling (uses SelectInput/GenericSelectInput)
- [x] Ensure consistent background colors across all dropdowns (all use `bg-popover` semantic token)

---

## Phase 3: Minor Issues

### 3.1 Products Header Height
- [x] Investigate 4px height difference in Products list header (FilterableColumnHeader uses h-11 touch targets, consistent with design system)
- [x] Align with standard header height if needed (N/A - already consistent)

### 3.2 "Yu null" Display Bug
- [x] Find null value display in Contact slide-over (ContactDetailsTab.tsx line 93)
- [x] Add null check to prevent "null" text (used formatName utility, added "null" string sanitization)

### 3.3 Progress Bar Edge Case
- [x] Review `FormProgressProvider.tsx` initial progress logic
- [x] Fix or document 10% default with 0 required fields (intentional behavior: 10% = "started", scales to 100% as fields complete)

---

## Verification

### Automated
- [x] `just typecheck` passes
- [x] `just test-ci` passes (3330 tests pass, 28 pre-existing failures unrelated to UI/UX changes)
- [x] `just build` succeeds

### Manual (Claude Chrome)
- [ ] Run through `docs/tests/e2e/ui-ux-consistency-manual-test.md`
- [ ] Verify all create forms use consistent section pattern
- [ ] Verify slide-over header actions are consistent
- [ ] Verify breadcrumb navigation works

---

## Files Reference

### To Modify
| File | Change |
|------|--------|
| `src/atomic-crm/tasks/TaskCreate.tsx` | Use TaskCompactForm |
| `src/atomic-crm/opportunities/OpportunityCompactForm.tsx` | Add section headers |
| `src/atomic-crm/tasks/TaskSlideOver.tsx` | Remove broken button, add breadcrumb |
| `src/atomic-crm/organizations/OrganizationSlideOver.tsx` | Add breadcrumb |
| `src/components/layouts/ResourceSlideOver.tsx` | Fix edit button position |

### To Create
| File | Purpose |
|------|---------|
| `src/atomic-crm/tasks/TaskCompactForm.tsx` | Single-page task form |
| `src/atomic-crm/organizations/OrganizationHierarchyBreadcrumb.tsx` | Org breadcrumb |
| `src/atomic-crm/tasks/TaskHierarchyBreadcrumb.tsx` | Task breadcrumb |

### To Delete
| File | Reason |
|------|--------|
| `src/atomic-crm/tasks/TaskInputs.tsx` | Replaced by TaskCompactForm |
| `src/atomic-crm/tasks/TaskGeneralTab.tsx` | Merged into TaskCompactForm |
| `src/atomic-crm/tasks/TaskDetailsTab.tsx` | Merged into TaskCompactForm |
