# Modals & SlideOvers Forensic Audit

**Agent:** 3 of 13 (Overlay Specialist)
**Audited:** 2025-12-20
**Files Analyzed:** 52
**Overlay Components Found:** 45

---

## Executive Summary

| Category | Count |
|----------|-------|
| **NEW Violations** | 17 |
| **CONFIRMED Backlog Issues** | 4 |
| **REFUTED/FIXED Backlog Issues** | 3 |
| **Verified Compliant** | 21 |
| **Verified N/A** | 0 |

This audit exhaustively analyzed all dialogs, modals, sheets, slide-overs, popovers, and dropdown menus in the Crispy CRM codebase. The codebase shows strong adherence to Radix UI primitives with consistent portaling and z-index management. However, several custom implementations bypass these patterns, creating accessibility and UX gaps.

---

## Backlog Verification Results

### CONFIRMED Issues

| Backlog ID | Component | Issue | Status |
|------------|-----------|-------|--------|
| **#1** | `ColumnCustomizationMenu.tsx:44` | Settings button 32px (h-8 w-8) | **CONFIRMED** - violates 44px minimum |
| **#15** | `contextMenu.tsx:138` | Submenu items < 44px height | **CONFIRMED** - `py-1.5 min-h-11` results in ~28px |
| **#24** | `alert-dialog.tsx:53` | Footer mobile-first layout | **CONFIRMED** - `flex-col-reverse sm:flex-row` |
| **#25** | `dialog.tsx:82` | Footer mobile-first layout | **CONFIRMED** - `flex-col-reverse sm:flex-row` |

### REFUTED / ALREADY FIXED Issues

| Backlog ID | Component | Claimed Issue | Actual Finding |
|------------|-----------|---------------|----------------|
| **#9** | `ResourceSlideOver.tsx:176` | SlideOver width 78vw | **FIXED** - Now `lg:w-[40vw] lg:max-w-[600px]` |
| **#14** | `contextMenu.tsx:82` | Uses z-[9999] | **FALSE** - Uses standard `z-50` |
| **#40** | `navigation-menu.tsx:137` | Uses z-[1] | **PARTIAL** - Uses `z-10` (standard Tailwind value) |

---

## NEW Violations Discovered

### CRITICAL Priority (P0) - Accessibility Violations

#### NEW-01: QuickAddOpportunity Missing ESC Handler
**File:** `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:102-196`
**Impact:** WCAG 2.1 AA violation - keyboard users cannot dismiss dialog
**Fix:** Add keyboard event listener for ESC key

#### NEW-02: QuickAddOpportunity Missing Close Button
**File:** `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:102-196`
**Impact:** UX convention violation - no X button in modal header
**Fix:** Add 44x44px close button in top-right corner

#### NEW-03: QuickAddOpportunity Missing Click-Outside Handler
**File:** `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:106`
**Impact:** Modal backdrop click does not dismiss - unexpected behavior
**Fix:** Add click handler on backdrop div

#### NEW-04: ColumnCustomizationMenu Missing ESC Handler
**File:** `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx:23-36`
**Impact:** Keyboard users cannot dismiss menu
**Fix:** Add useEffect for ESC key listener

#### NEW-05: ColumnsButton Non-Standard Portal
**File:** `src/components/admin/columns-button.tsx:86-96, 148-200`
**Impact:** Uses `createPortal` manually, bypassing Radix Portal's z-index management
**Risk:** Z-index conflicts, broken focus traps, click-outside issues
**Fix:** Refactor to use standard Radix Popover pattern

### HIGH Priority (P1) - Touch Target Violations

#### NEW-06: ColumnsButton Clear Button Too Small
**File:** `src/components/admin/columns-button.tsx:170`
**Current:** `h-4 w-4` (16x16px)
**Required:** 44x44px minimum for touch targets
**Fix:** Change to `h-11 w-11` with position adjustments

#### NEW-07: QuickAddOpportunity Form Buttons Not 44px
**File:** `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:167-191`
**Impact:** Cancel and Create buttons lack explicit `h-11` class
**Fix:** Add `h-11` class to both buttons

### MEDIUM Priority (P2) - Broken Functionality

#### NEW-08: AddTask Invalid Tailwind Class
**File:** `src/atomic-crm/tasks/AddTask.tsx`
**Issue:** Uses `max-h-9/10` which is not valid Tailwind CSS
**Fix:** Change to `max-h-[90vh]`

#### NEW-09: AddTask Positioning Override
**File:** `src/atomic-crm/tasks/AddTask.tsx`
**Issue:** `top-1/20 translate-y-0` breaks Dialog's default centering
**Fix:** Remove positioning overrides

#### NEW-10: LogActivityFAB Z-Index Conflict
**File:** `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx`
**Issue:** FAB button and Sheet content both use `z-50`
**Risk:** FAB may overlay Sheet when both visible
**Fix:** Change FAB from `z-50` to `z-40`

#### NEW-11: Missing aria-describedby Auto-Link
**Files:**
- `src/components/ui/dialog.tsx:55`
- `src/components/ui/sheet.tsx:65`
**Issue:** DialogDescription/SheetDescription not automatically linked to content
**Fix:** Generate default aria-describedby when description component present

### LOW Priority (P3) - Design Consistency

#### NEW-12: SimilarOpportunitiesDialog Missing ARIA
**File:** `src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx:79`
**Issue:** Missing `aria-describedby` attribute on DialogContent
**Fix:** Add `aria-describedby="similar-opportunities-description"`

#### NEW-13: NotificationDropdown Button Sizing
**File:** `src/components/NotificationDropdown.tsx:114`
**Issue:** Mixed pattern - `size="sm"` with `h-11` override
**Fix:** Use standard size variant without manual override

#### NEW-14: KPIDrillDown Redundant Overflow
**File:** `src/atomic-crm/reports/components/KPIDrillDown.tsx`
**Issue:** Content div has `max-h-[calc(100vh-8rem)]` but SheetContent already handles this
**Fix:** Remove redundant constraint

#### NEW-15: NavigationMenu Z-Index Inconsistency
**File:** `src/components/ui/navigation-menu.tsx:137`
**Issue:** Indicator uses `z-10` while all other overlays use `z-50`
**Note:** z-10 is valid Tailwind but breaks visual consistency

#### NEW-16: Drawer Non-Semantic Color
**File:** `src/components/ui/drawer.tsx:30`
**Issue:** Uses `bg-black/80` instead of `bg-overlay` semantic token
**Fix:** Change to `bg-overlay`

#### NEW-17: ResourceSlideOver Mobile Width
**File:** `src/components/layouts/ResourceSlideOver.tsx:176`
**Issue:** Full-width on mobile (`w-full max-w-none`) breaks slide-over pattern
**Consideration:** May be intentional for full-screen mobile experience

---

## Component Analysis by Domain

### Contacts & Organizations (9 components)

| Component | Portal | Z-Index | Width | Touch Targets | Status |
|-----------|--------|---------|-------|---------------|--------|
| ContactSlideOver | Radix Sheet | z-50 | 40vw/600px | 44px | **COMPLIANT** |
| ContactImportDialog | Radix Dialog | z-50 | 2xl/7xl | 44px | **COMPLIANT** (backlog #25 applies) |
| LinkOpportunityModal | Radix Dialog | z-50 | 2xl | 44px | **COMPLIANT** (backlog #25 applies) |
| UnlinkConfirmDialog | Radix AlertDialog | z-50 | lg | 44px | **COMPLIANT** (backlog #24 applies) |
| OrganizationSlideOver | Radix Sheet | z-50 | 40vw/600px | 44px | **COMPLIANT** |
| OrganizationImportDialog | Radix Dialog | z-50 | 2xl/7xl | 44px | **COMPLIANT** (backlog #25 applies) |
| DuplicateOrgWarningDialog | Radix AlertDialog | z-50 | lg | 44px | **COMPLIANT** (backlog #24 applies) |
| BulkReassignButton | Radix Dialog | z-50 | lg | 44px | **COMPLIANT** (backlog #25 applies) |
| PrincipalChangeWarning | Radix AlertDialog | z-50 | 2xl | 44px | **COMPLIANT** (backlog #24 applies) |

### Opportunities (8 components)

| Component | Portal | Z-Index | Width | Touch Targets | Status |
|-----------|--------|---------|-------|---------------|--------|
| OpportunitySlideOver | Radix Sheet | z-50 | 40vw/600px | 44px | **COMPLIANT** |
| QuickAddDialog | Radix Dialog | z-50 | 2xl | 44px | **COMPLIANT** |
| CloseOpportunityModal | Radix Dialog | z-50 | md | 44px | **COMPLIANT** |
| SimilarOpportunitiesDialog | Radix Dialog | z-50 | 2xl | 44px | **MINOR** (NEW-12) |
| ColumnCustomizationMenu | Manual | z-50 | 64 | **32px** | **FAIL** (#1, NEW-04) |
| QuickAddOpportunity | Custom Fixed | z-50 | md | **<44px** | **FAIL** (NEW-01-07) |
| OpportunityCardActions | Radix Dropdown | z-50 | 48 | 44px | **COMPLIANT** |
| contextMenu | Custom Portal | z-50 | 200px | **<44px** | **FAIL** (#15) |

### Dashboard & Tasks (9 components)

| Component | Portal | Z-Index | Width | Touch Targets | Status |
|-----------|--------|---------|-------|---------------|--------|
| PipelineDrillDownSheet | Radix Sheet | z-50 | 480px | 44px | **COMPLIANT** |
| TaskCompleteSheet | Radix Sheet | z-50 | Full (bottom) | 44px | **COMPLIANT** |
| SnoozePopover | Radix Popover | z-50 | 72 | 44px | **COMPLIANT** |
| LogActivityFAB | Radix Sheet | **z-50 conflict** | 420px | 44px | **FAIL** (NEW-10) |
| MobileQuickActionBar | Radix Sheet | z-40/z-50 | 90vh | 44px | **COMPLIANT** |
| TaskSlideOver | Radix Sheet | z-50 | 40vw | 44px | **COMPLIANT** |
| AddTask | Radix Dialog | z-50 | xl | 44px | **FAIL** (NEW-08-09) |
| QuickLogActivityDialog | Radix Sheet | z-50 | 420px | 44px | **COMPLIANT** |
| KPIDrillDown | Radix Sheet | z-50 | xl | 44px | **MINOR** (NEW-14) |

### Tags, Products & Admin (10 components)

| Component | Portal | Z-Index | Width | Touch Targets | Status |
|-----------|--------|---------|-------|---------------|--------|
| TagDialog | Radix Dialog | z-50 | lg | 44px | **COMPLIANT** |
| ProductSlideOver | Radix Sheet | z-50 | 40vw/600px | 44px | **COMPLIANT** |
| SalesSlideOver | Radix Sheet | z-50 | 40vw/600px | 44px | **COMPLIANT** |
| confirm.tsx | Radix Dialog | z-50 | lg | 44px | **COMPLIANT** |
| CreateInDialogButton | Radix Dialog | z-50 | 2xl | 44px | **COMPLIANT** |
| SavedQueries | Radix Dialog | z-50 | 425px | 44px | **COMPLIANT** |
| ColumnsButton | **Manual Portal** | z-50 | 72 | **16px** | **FAIL** (NEW-05-06) |
| FilterForm | Radix Popover | z-50 | auto | 44px | **COMPLIANT** |
| NotificationDropdown | Radix Dropdown | z-50 | 400px | 44px | **MINOR** (NEW-13) |
| Combobox | Radix Popover | z-50 | var | 44px | **COMPLIANT** |

### Base UI Components (9 components)

| Component | Portal | Z-Index | Touch Targets | Status |
|-----------|--------|---------|---------------|--------|
| dialog.tsx | Radix Portal | z-50 | 44px | **MINOR** (#25, NEW-11) |
| alert-dialog.tsx | Radix Portal | z-50 | 44px | **MINOR** (#24) |
| sheet.tsx | Radix Portal | z-50 | 44px | **MINOR** (NEW-11) |
| popover.tsx | Radix Portal | z-50 | N/A | **COMPLIANT** |
| dropdown-menu.tsx | Radix Portal | z-50 | 44px | **COMPLIANT** |
| drawer.tsx | Vaul Portal | z-50 | 44px | **MINOR** (NEW-16) |
| tooltip.tsx | Radix Portal | z-50 | N/A | **COMPLIANT** |
| navigation-menu.tsx | Absolute | z-10/z-50 | N/A | **MINOR** (NEW-15) |
| select.tsx | Radix Portal | z-50 | 44px | **COMPLIANT** |

---

## Portal Analysis

### Standard Pattern (Correct)
```tsx
// All Radix-based components auto-portal to document.body
<DialogPrimitive.Portal>
  <DialogPrimitive.Overlay className="z-50" />
  <DialogPrimitive.Content className="z-50" />
</DialogPrimitive.Portal>
```

**Components Using Standard Pattern:** 38 of 45 (84%)

### Non-Standard Implementations (Require Review)

| Component | Implementation | Risk Level |
|-----------|---------------|------------|
| ColumnsButton | Manual `createPortal` | **HIGH** - bypasses Radix z-index context |
| QuickAddOpportunity | Custom `fixed inset-0` | **MEDIUM** - missing ESC/close handlers |
| contextMenu | Custom `createPortal` | **LOW** - properly implements ESC/click-outside |

---

## Z-Index Analysis

### Standard Layer: z-50
All overlay components correctly use `z-50` for both overlay backdrop and content:
- **Dialog/AlertDialog:** z-50 overlay, z-50 content
- **Sheet:** z-50 overlay, z-50 content
- **Popover:** z-50 content (no overlay)
- **Dropdown:** z-50 content (no overlay)
- **Drawer:** z-50 overlay, z-50 content
- **Tooltip:** z-50 content

### Exceptions
| Component | Z-Index | Reason |
|-----------|---------|--------|
| NavigationMenu Indicator | z-10 | Arrow indicator only |
| MobileQuickActionBar (bar) | z-40 | Below modals, above content |
| LogActivityFAB (button) | z-50 | **CONFLICT** - same as Sheet |

### No Arbitrary Z-Index Values Found
Grep for `z-\[\d+\]` returned **no matches** - the codebase correctly uses standard Tailwind z-index values.

---

## Focus Management Analysis

### WCAG 2.2 AAA Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Focus trap in modals | **PASS** | All Radix-based dialogs auto-trap focus |
| ESC key dismissal | **PARTIAL** | QuickAddOpportunity and ColumnCustomizationMenu missing |
| Return focus on close | **PASS** | Radix handles automatically |
| aria-modal attribute | **PASS** | All modal dialogs have `aria-modal="true"` |
| aria-labelledby | **PASS** | All dialogs reference their title |
| aria-describedby | **PARTIAL** | Not auto-linked to description components |

---

## Overflow & Content Visibility

### Height Constraints

| Pattern | Usage | Example |
|---------|-------|---------|
| `max-h-[90vh]` | Modal dialogs | QuickAddDialog, CreateInDialogButton |
| `max-h-[80vh]` | Bottom sheets | TaskCompleteSheet |
| `ScrollArea` | Long lists | PipelineDrillDownSheet, PrincipalChangeWarning |
| `overflow-y-auto` | Scrollable content | All slide-overs via ResourceSlideOver |

### Width Constraints (Desktop 1440px / iPad 1024px)

| Component Type | Desktop Width | iPad Landscape | iPad Portrait |
|----------------|---------------|----------------|---------------|
| Slide-Over | 40vw (576px) | 410px | Full width |
| Standard Dialog | 512px (lg) | 512px | 512px |
| Large Dialog | 672px (2xl) | 672px | 672px |
| Import Preview | 1280px (7xl) | 1024px | 768px |
| Bottom Sheet | Full width | Full width | Full width |

---

## Remediation Priority

### P0 - CRITICAL (Fix Immediately)
1. **QuickAddOpportunity** - Add ESC handler, close button, click-outside (NEW-01 to NEW-03)
2. **ColumnsButton** - Refactor portal implementation (NEW-05)

### P1 - HIGH (Fix This Sprint)
3. **ColumnsButton** - Increase clear button to 44px (NEW-06)
4. **QuickAddOpportunity** - Add `h-11` to form buttons (NEW-07)
5. **ColumnCustomizationMenu** - Add ESC handler (NEW-04)
6. **ColumnCustomizationMenu** - Increase settings button to 44px (#1)
7. **contextMenu** - Fix submenu item height (#15)

### P2 - MEDIUM (Fix Next Sprint)
8. **AddTask** - Fix invalid Tailwind class (NEW-08)
9. **AddTask** - Remove positioning override (NEW-09)
10. **LogActivityFAB** - Change FAB z-index to z-40 (NEW-10)
11. **Dialog/Sheet** - Auto-link aria-describedby (NEW-11)
12. **DialogFooter** - Change to desktop-first pattern (#25)
13. **AlertDialogFooter** - Change to desktop-first pattern (#24)

### P3 - LOW (Backlog)
14. **SimilarOpportunitiesDialog** - Add aria-describedby (NEW-12)
15. **NotificationDropdown** - Fix button sizing pattern (NEW-13)
16. **KPIDrillDown** - Remove redundant overflow (NEW-14)
17. **NavigationMenu** - Consider z-50 for consistency (NEW-15)
18. **Drawer** - Use semantic bg-overlay (NEW-16)

---

## File Change Summary

| File | Changes Required |
|------|-----------------|
| `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx` | ESC handler, close button, click-outside, button heights |
| `src/components/admin/columns-button.tsx` | Refactor portal, increase clear button size |
| `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx` | ESC handler, increase button size |
| `src/atomic-crm/utils/contextMenu.tsx` | Fix submenu item padding |
| `src/atomic-crm/tasks/AddTask.tsx` | Fix max-h class, remove position overrides |
| `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx` | Change FAB z-index |
| `src/components/ui/dialog.tsx` | Auto-link aria-describedby, fix footer pattern |
| `src/components/ui/alert-dialog.tsx` | Fix footer pattern |
| `src/components/ui/sheet.tsx` | Auto-link aria-describedby |
| `src/components/ui/drawer.tsx` | Use bg-overlay |

---

## Architectural Recommendations

### 1. Z-Index Strategy Documentation
Document standard z-index tiers:
- `z-40`: Floating elements (FAB, quick action bars)
- `z-50`: Modal overlays (dialogs, sheets, popovers)
- Avoid arbitrary values like `z-[9999]`

### 2. Portal Standardization
All overlay components should use Radix Primitives Portal to ensure:
- Consistent z-index stacking context
- Proper focus trap behavior
- Correct click-outside handling

### 3. Touch Target Enforcement
Add ESLint rule or custom hook to enforce 44px minimum touch targets on all interactive overlay elements.

### 4. ARIA Automation
Enhance base Dialog/Sheet components to auto-generate aria-describedby when description component is present.

---

## Appendix: Files Analyzed

### Contacts Domain
- `src/atomic-crm/contacts/ContactSlideOver.tsx`
- `src/atomic-crm/contacts/ContactImportDialog.tsx`
- `src/atomic-crm/contacts/LinkOpportunityModal.tsx`
- `src/atomic-crm/contacts/UnlinkConfirmDialog.tsx`

### Organizations Domain
- `src/atomic-crm/organizations/OrganizationSlideOver.tsx`
- `src/atomic-crm/organizations/OrganizationImportDialog.tsx`
- `src/atomic-crm/organizations/DuplicateOrgWarningDialog.tsx`
- `src/atomic-crm/organizations/BulkReassignButton.tsx`
- `src/atomic-crm/organizations/PrincipalChangeWarning.tsx`

### Opportunities Domain
- `src/atomic-crm/opportunities/OpportunitySlideOver.tsx`
- `src/atomic-crm/opportunities/quick-add/QuickAddDialog.tsx`
- `src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx`
- `src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx`
- `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx`
- `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx`
- `src/atomic-crm/opportunities/kanban/OpportunityCardActions.tsx`
- `src/atomic-crm/utils/contextMenu.tsx`

### Dashboard & Tasks Domain
- `src/atomic-crm/dashboard/v3/components/PipelineDrillDownSheet.tsx`
- `src/atomic-crm/dashboard/v3/components/TaskCompleteSheet.tsx`
- `src/atomic-crm/dashboard/v3/components/SnoozePopover.tsx`
- `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx`
- `src/atomic-crm/dashboard/v3/components/MobileQuickActionBar.tsx`
- `src/atomic-crm/tasks/TaskSlideOver.tsx`
- `src/atomic-crm/tasks/AddTask.tsx`
- `src/atomic-crm/activities/QuickLogActivityDialog.tsx`
- `src/atomic-crm/reports/components/KPIDrillDown.tsx`

### Tags, Products & Admin
- `src/atomic-crm/tags/TagCreateModal.tsx`
- `src/atomic-crm/tags/TagEditModal.tsx`
- `src/atomic-crm/tags/TagDialog.tsx`
- `src/atomic-crm/products/ProductSlideOver.tsx`
- `src/atomic-crm/sales/SalesSlideOver.tsx`
- `src/components/admin/confirm.tsx`
- `src/components/admin/create-in-dialog-button.tsx`
- `src/components/admin/saved-queries.tsx`
- `src/components/admin/columns-button.tsx`
- `src/components/admin/filter-form.tsx`
- `src/components/NotificationDropdown.tsx`

### Base UI Components
- `src/components/ui/dialog.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/combobox.tsx`

### Layout Components
- `src/components/layouts/ResourceSlideOver.tsx`

---

*Generated by Agent 3 (Overlay Specialist) as part of Tier 1 Parallel UI/UX Deep Audit*
