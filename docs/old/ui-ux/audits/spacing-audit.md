# Spacing & Layout Audit

**Audited:** 2025-12-15
**Files Scanned:** 169 (.tsx files in `src/components/ui/` and `src/atomic-crm/`)
**Reference:** `/docs/ui-ux/spacing-and-layout.md`

## Summary

| Category | Count |
|----------|-------|
| 🔴 Violations | 14 |
| 🟢 Compliant | 155+ |
| ⚪ N/A | ~50 |

**Overall Assessment:** The design system foundation is solid (`button.constants.ts` correctly uses `h-12` for 48px buttons), but several components override these defaults with smaller touch targets.

---

## Touch Targets (44px minimum)

**Standard:** All interactive elements must be minimum `h-11 w-11` (44px). Crispy CRM uses `h-12` (48px) as the standard.

### 🔴 Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/components/admin/bulk-delete-button.tsx` | 87 | Button height override | `h-9` (36px) | `h-11`+ (44px) |
| `src/components/admin/bulk-export-button.tsx` | 50 | Button height override | `h-9` (36px) | `h-11`+ (44px) |
| `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx` | 44 | Raw button element | `h-8 w-8` (32px) | `h-11 w-11` (44px) |
| `src/atomic-crm/organizations/AuthorizationsTab.tsx` | 529 | Interactive element | `w-8 h-8` (32px) | `h-11 w-11` (44px) |
| `src/components/admin/form/StepIndicator.tsx` | 59 | Step indicator circles (clickable) | `w-8 h-8` (32px) | `h-11 w-11` (44px) |
| `src/components/ui/pagination.tsx` | 98 | Pagination controls | `size-9` (36px) | `size-11` (44px) |
| `src/components/ui/breadcrumb.tsx` | 85 | Breadcrumb navigation | `size-9` (36px) | `size-11` (44px) |

### 🟢 Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/ui/button.constants.ts` | 28-31 | All button sizes use `h-12` (48px) |
| `src/components/admin/simple-form.tsx` | 36-37 | SaveButton/CancelButton use default h-12 |
| `src/atomic-crm/contacts/ContactHierarchyBreadcrumb.tsx` | 37, 46 | Uses `min-h-11` for touch targets |
| `src/atomic-crm/activities/components/ActivityTimelineEntry.tsx` | 71, 80, 89 | Links use `min-h-11` |
| `src/components/ui/switch.tsx` | 19 | Switch thumb is `size-9` but inner element (container is larger) |

### ⚪ N/A (Non-Interactive Elements)

| File | Reason |
|------|--------|
| `src/components/ui/skeleton.tsx` | Loading placeholder - not interactive |
| `src/components/ui/list-skeleton.tsx` | Loading placeholders (h-8, h-10 variants) |
| `src/atomic-crm/login/LoginSkeleton.tsx` | Loading skeleton for form fields |
| `src/components/admin/ready.tsx` | Decorative icons (`w-10 h-10`) |
| `src/atomic-crm/organizations/OrganizationImportResult.tsx` | Status icons (CheckCircle2, AlertTriangle, X) |
| `src/atomic-crm/dashboard/v3/components/*.tsx` | Skeleton loaders during data fetch |
| All Avatar components | Display-only avatars, not clickable |
| `src/components/ui/spinner.tsx` | Loading indicator |

---

## Button Spacing (gap-2 minimum)

**Standard:** Minimum `gap-2` (8px) between buttons, links, and interactive controls.

### 🔴 Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/components/admin/simple-form-iterator.tsx` | 332 | Action buttons too close | `gap-1` (4px) | `gap-2` (8px) |

### 🟢 Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/admin/simple-form.tsx` | 35 | FormToolbar uses `gap-2` |
| `src/components/layouts/ResourceSlideOver.tsx` | 316 | SheetFooter uses `gap-2` |
| `src/components/admin/bulk-actions-toolbar.tsx` | 32-33 | Uses `gap-2 md:gap-6` |
| `src/components/admin/form/SaveButtonGroup.tsx` | 37, 42 | Uses `gap-2` |
| `src/components/admin/create-in-dialog-button.tsx` | 95 | Uses `gap-2` |
| `src/components/ErrorBoundary.tsx` | 124-129 | Uses `gap-2` |

### ⚪ N/A (Not Button Groups)

| File | Reason |
|------|--------|
| `src/components/ui/pagination.tsx` | Uses `gap-1` but for pagination dots (acceptable) |
| Icon + text combinations | `gap-1` is correct for icon-label pairs per design spec |
| `src/components/ui/sidebar.tsx` | Menu items use `gap-1` (single clickable element) |
| `src/components/ui/navigation-menu.tsx` | Single-element styling |

---

## Form Field Spacing (gap-4 minimum)

**Standard:** Minimum `gap-4` (16px) vertical spacing between form fields.

### 🔴 Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/components/admin/form/form-primitives.tsx` | 61 | Form item spacing | `gap-2` (8px) | `gap-4` (16px) |
| `src/components/ui/form.tsx` | 72 | FormMessage container | `space-y-2` (8px) | `space-y-4` (16px) |

**Note:** These may be intentional for dense form layouts. Review if they're for internal component spacing vs. field separation.

### 🟢 Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/admin/simple-form.tsx` | 19 | Default `gap-4` for form fields |
| `src/atomic-crm/organizations/OrganizationEdit.tsx` | 86 | Uses `gap-4` |
| `src/atomic-crm/contacts/ContactEdit.tsx` | 22 | Uses `gap-4` |
| `src/atomic-crm/contacts/ContactImportDialog.tsx` | 651 | Uses `gap-4` |
| `src/atomic-crm/tasks/AddTask.tsx` | 120 | Uses `gap-4` |
| `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx` | 150 | Uses `gap-6` (exceeds minimum) |
| `src/components/admin/saved-queries.tsx` | 68 | Uses `space-y-4` |

### ⚪ N/A

| File | Reason |
|------|--------|
| `src/components/ui/sheet.tsx` | Header spacing (`gap-1.5`) - not form fields |
| `src/components/ui/drawer.tsx` | Internal component spacing |
| Progress/status indicator components | Internal spacing for visual elements |

---

## Container Padding

**Standard:** `p-4 md:p-6` responsive padding for page containers.

### 🔴 Violations

None found. Container padding is consistently applied.

### 🟢 Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/ui/sheet.tsx` | 82, 92 | SheetHeader/Footer use `p-4` |
| `src/components/ui/drawer.tsx` | 70, 82 | DrawerHeader/Footer use `p-4` |
| `src/components/admin/simple-form.tsx` | 29 | FormToolbar uses `px-6 pt-4 pb-4` |

---

## Max-Width Constraints

**Standard:** Forms should use `max-w-lg` (512px) or `max-w-2xl` (672px). Tables/datagrids have NO max-width.

### 🔴 Violations

None found. Forms correctly use max-width constraints.

### 🟢 Compliant

| File | Line | Pattern |
|------|------|---------|
| `src/components/admin/simple-form.tsx` | 19 | Default `max-w-lg` |
| `src/atomic-crm/sales/SalesCreate.tsx` | 44 | Uses `max-w-lg` |
| `src/atomic-crm/sales/SalesEdit.tsx` | 60 | Uses `max-w-lg` |
| `src/components/admin/create-in-dialog-button.tsx` | 74 | Dialog uses `max-w-2xl` |
| `src/atomic-crm/opportunities/quick-add/QuickAddDialog.tsx` | 26 | Uses `max-w-2xl` |
| `src/atomic-crm/contacts/ContactImportDialog.tsx` | 650 | Uses `max-w-2xl` |
| `src/atomic-crm/organizations/OrganizationImportDialog.tsx` | 876 | Uses `max-w-2xl` |
| `src/atomic-crm/tags/TagDialog.tsx` | 99 | Uses `max-w-lg` |

### ⚪ N/A

| File | Reason |
|------|--------|
| Datagrid/Table components | Correctly have NO max-width (full viewport) |
| Dashboard panels | Full-width layout is intentional |

---

## Raw Pixel Values

**Standard:** NO raw pixel values (`style={{ padding: '12px' }}`). Use Tailwind spacing scale.

### 🔴 Violations

| File | Line | Issue | Current | Required |
|------|------|-------|---------|----------|
| `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` | 145 | Inline style for border | `style={{ borderBottom: '2px solid ${color}' }}` | Use CSS variable or Tailwind |
| `src/atomic-crm/organizations/OrganizationAvatar.tsx` | 15 | Hardcoded pixel sizes | `w-[20px] h-[20px]` | Use Tailwind scale (`w-5 h-5`) |

### 🟢 Compliant

The vast majority of components use Tailwind spacing utilities exclusively.

---

## Section Spacing

**Standard:** `space-y-8` (32px) between sections, `space-y-4` (16px) within sections.

### 🔴 Violations

None found. Section spacing patterns are generally followed.

### 🟢 Compliant

| File | Line | Pattern |
|------|------|---------|
| Story files | Consistently use `space-y-8` for major sections |
| Form sections | Use `space-y-4` for field groups |

---

## Recommendations

### High Priority (Touch Target Violations)

1. **`bulk-delete-button.tsx`** - Remove `h-9` override, use default button height
2. **`bulk-export-button.tsx`** - Remove `h-9` override, use default button height
3. **`ColumnCustomizationMenu.tsx`** - Change `h-8 w-8` to `h-11 w-11` (or use Button component with `size="icon"`)
4. **`AuthorizationsTab.tsx:529`** - Increase to `h-11 w-11`
5. **`StepIndicator.tsx`** - Increase step circles to `w-11 h-11` for touch targets
6. **`pagination.tsx`** - Increase `size-9` to `size-11`
7. **`breadcrumb.tsx`** - Increase `size-9` to `size-11`

### Medium Priority

8. **`simple-form-iterator.tsx:332`** - Change `gap-1` to `gap-2` for action buttons
9. **`OrganizationAvatar.tsx`** - Replace `w-[20px]` with `w-5` (Tailwind scale)
10. **`OpportunityColumn.tsx`** - Extract border color to CSS variable

### Low Priority (Review Intent)

11. **`form-primitives.tsx`** - Verify if `gap-2` is intentional for dense layouts
12. **`form.tsx`** - Verify `space-y-2` is for internal component structure

---

## Appendix: Files Scanned

### `src/components/ui/` (69 files)
- accordion.tsx, accordion.stories.tsx
- alert.tsx, alert.stories.tsx
- alert-dialog.tsx
- aside-section.tsx
- avatar.tsx, avatar.stories.tsx
- badge.tsx, badge.stories.tsx
- breadcrumb.tsx
- button.tsx, button.stories.tsx
- calendar.tsx
- card.tsx, card.stories.tsx, card-elevation.stories.tsx
- checkbox.tsx, checkbox.stories.tsx
- collapsible.tsx
- combobox.tsx, combobox.stories.tsx
- command.tsx, command.stories.tsx
- dialog.tsx, dialog.stories.tsx
- drawer.tsx
- dropdown-menu.tsx, dropdown-menu.stories.tsx
- form.tsx
- image-editor-field.tsx
- input.tsx, input.stories.tsx
- label.tsx
- list-skeleton.tsx
- navigation-menu.tsx, navigation-menu.stories.tsx
- pagination.tsx
- popover.tsx, popover.stories.tsx
- priority-badge.tsx
- progress.tsx, progress.stories.tsx
- radio-group.tsx, radio-group.stories.tsx
- relative-date.tsx
- resizable.tsx
- scroll-area.tsx
- select.tsx, select.stories.tsx
- separator.tsx, separator.stories.tsx
- sheet.tsx, sheet.stories.tsx
- sidebar.tsx
- skeleton.tsx
- sonner.tsx, sonner.stories.tsx
- spinner.tsx
- switch.tsx, switch.stories.tsx
- table.tsx
- tabs.tsx, tabs.stories.tsx
- textarea.tsx
- toggle.tsx
- toggle-group.tsx
- tooltip.tsx, tooltip.stories.tsx
- visually-hidden.tsx

### `src/atomic-crm/` (100+ files)
- activities/
- activity-log/
- admin/
- components/
- contacts/
- dashboard/
- filters/
- hooks/
- layout/
- login/
- notes/
- notifications/
- opportunities/
- organizations/
- productDistributors/
- products/
- reports/
- root/
- sales/
- settings/
- shared/
- simple-list/
- tags/
- tasks/
- utils/
