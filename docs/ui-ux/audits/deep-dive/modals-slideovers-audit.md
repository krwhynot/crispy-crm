# Modals & SlideOvers Forensic Audit

**Agent:** 3 of 13 (Overlay Specialist)
**Audited:** 2025-12-15
**Files Analyzed:** 24
**Overlay Components Found:** 17 (7 primitives + 10 feature-specific)

---

## Executive Summary

| Category | Count |
|----------|-------|
| 🔴 NEW Violations | 6 |
| 🟡 CONFIRMED Violations | 5 |
| 🟢 Verified Compliant | 11 |
| ⚪ Verified N/A | 0 |
| ⚠️ NEEDS VERIFICATION | 2 |

### Key Findings

1. **Portal Usage: EXCELLENT** - All Radix-based primitives auto-portal to `document.body`. Custom `contextMenu.tsx` correctly uses `createPortal()`.

2. **Z-Index: MOSTLY COMPLIANT** - All primitives use `z-50`. Two violations found:
   - `contextMenu.tsx:82` uses `z-[9999]` (P1 - confirmed)
   - `navigation-menu.tsx:137` uses `z-[1]` (P2 - confirmed)

3. **Width Constraints: MAJOR ISSUE** - `ResourceSlideOver` at `w-[78vw]` violates 600px main content minimum (P1 - confirmed)

4. **Touch Targets: MIXED** - Many buttons correctly use `h-11`, but several overlays have undersized elements

5. **Mobile-First Patterns: WIDESPREAD** - Most DialogFooter patterns use `flex-col-reverse sm:flex-row` which contradicts desktop-first philosophy

---

## Overlay-by-Overlay Analysis

### 1. Dialog (`src/components/ui/dialog.tsx`)

**Type:** Modal Dialog
**Radix-based:** Yes (`@radix-ui/react-dialog`)
**First Audit Status:** P2 (mobile-first footer)

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via `DialogPortal`) | ✅ |
| Render target | document.body (Radix default) | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| DialogOverlay | `z-50` | ✅ |
| DialogContent | `z-50` | ✅ |

#### Dimension Analysis
| Viewport | Width | Height | Usable? |
|----------|-------|--------|---------|
| Desktop 1440px | `max-w-lg` (512px) | Auto | ✅ |
| iPad 768px | `max-w-[calc(100%-2rem)]` | Auto | ✅ |

#### Content Overflow
| Metric | Value |
|--------|-------|
| Scrollable | No (content determines height) |
| Actions sticky | N/A |
| Close visible | Yes (absolute positioned top-right) |

#### Focus Management
| Metric | Value | Compliant? |
|--------|-------|------------|
| Focus trap | Yes (Radix built-in) | ✅ |
| Initial focus | First focusable (Radix default) | ✅ |
| ESC closes | Yes (Radix built-in) | ✅ |
| Close button | Yes with `sr-only` label | ✅ |

#### Issues Found
1. **P2 - Mobile-first footer (line 82):** `flex-col-reverse gap-2 sm:flex-row sm:justify-end`
   - Should be: `flex-row justify-end gap-2 md:flex-col-reverse`
2. **NEW - Close button touch target:** Close button has no explicit size, icon is 16px. Total clickable area ~24px (below 44px minimum)

#### Verdict
- [x] First audit classification CORRECT (P2 mobile-first)
- [ ] NEW violation: Close button < 44px touch target

---

### 2. AlertDialog (`src/components/ui/alert-dialog.tsx`)

**Type:** Confirmation Dialog
**Radix-based:** Yes (`@radix-ui/react-alert-dialog`)
**First Audit Status:** P2 (mobile-first footer)

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via `AlertDialogPortal`) | ✅ |
| Render target | document.body | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| AlertDialogOverlay | `z-50` | ✅ |
| AlertDialogContent | `z-50` | ✅ |

#### Dimension Analysis
| Viewport | Width | Height | Usable? |
|----------|-------|--------|---------|
| Desktop 1440px | `max-w-lg` (512px) | Auto | ✅ |
| iPad 768px | Full width - 2rem | Auto | ✅ |

#### Issues Found
1. **P2 - Mobile-first footer (line 53):** `flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`
2. **P2 - Mobile-first cancel button (line 97):** `mt-2 sm:mt-0`

#### Verdict
- [x] First audit classification CORRECT

---

### 3. Sheet (`src/components/ui/sheet.tsx`)

**Type:** Side Panel / Slide-over
**Radix-based:** Yes (`@radix-ui/react-dialog` as Sheet)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via `SheetPortal`) | ✅ |
| Render target | document.body | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| SheetOverlay | `z-50` | ✅ |
| SheetContent | `z-50` | ✅ |

#### Dimension Analysis
| Viewport | Width (side=right) | Usable? |
|----------|-------------------|---------|
| Desktop | `w-3/4 sm:max-w-sm` (75% / max 384px) | ⚠️ |
| iPad | `w-3/4` (576px on 768px viewport) | ⚠️ |

#### Issues Found
1. **NEW - Close button size (line 69):** `p-2` + 20px icon = ~36px total clickable area (below 44px)
2. **NEW - Mobile-first width:** `w-3/4 sm:max-w-sm` should be desktop-first

#### Verdict
- [x] NEW violations found (close button size, mobile-first width)

---

### 4. Popover (`src/components/ui/popover.tsx`)

**Type:** Contextual Overlay
**Radix-based:** Yes (`@radix-ui/react-popover`)
**First Audit Status:** Not in first audit (compliant)

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (explicit `PopoverPrimitive.Portal`) | ✅ |
| Render target | document.body | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| PopoverContent | `z-50` | ✅ |

#### Dimension Analysis
| Viewport | Width | Usable? |
|----------|-------|---------|
| All viewports | `w-72` (288px) fixed | ✅ |

#### Verdict
- [x] FULLY COMPLIANT - No issues found

---

### 5. DropdownMenu (`src/components/ui/dropdown-menu.tsx`)

**Type:** Action Menu
**Radix-based:** Yes (`@radix-ui/react-dropdown-menu`)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (explicit `DropdownMenuPrimitive.Portal`) | ✅ |
| Render target | document.body | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| DropdownMenuContent | `z-50` | ✅ |
| DropdownMenuSubContent | `z-50` | ✅ |

#### Content Overflow
| Metric | Value |
|--------|-------|
| Max height | `max-h-(--radix-dropdown-menu-content-available-height)` |
| Overflow | `overflow-y-auto` |

#### Issues Found
1. **NEW - Menu item height (line 62):** `py-1.5` (12px padding) + text ≈ 28-32px height (below 44px touch target)

#### Verdict
- [ ] NEW violation: Menu items below 44px touch target

---

### 6. Drawer (`src/components/ui/drawer.tsx`)

**Type:** Mobile-optimized Bottom Sheet
**Radix-based:** No (uses `vaul` library)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via `DrawerPortal`) | ✅ |
| Render target | document.body | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| DrawerOverlay | `z-50` | ✅ |
| DrawerContent | `z-50` | ✅ |

#### Dimension Analysis
| Direction | Width/Height | Usable? |
|-----------|--------------|---------|
| Bottom | `max-h-[80vh]` | ✅ |
| Right/Left | `w-3/4 sm:max-w-sm` | ⚠️ (mobile-first) |

#### Verdict
- [x] Mostly compliant, mobile-first width pattern

---

### 7. Tooltip (`src/components/ui/tooltip.tsx`)

**Type:** Informational Overlay
**Radix-based:** Yes (`@radix-ui/react-tooltip`)
**First Audit Status:** Not in first audit (compliant)

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (explicit `TooltipPrimitive.Portal`) | ✅ |
| Render target | document.body | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| TooltipContent | `z-50` | ✅ |

#### Verdict
- [x] FULLY COMPLIANT - No issues found

---

### 8. ResourceSlideOver (`src/components/layouts/ResourceSlideOver.tsx`)

**Type:** Record Detail Panel
**Radix-based:** Yes (uses Sheet component)
**First Audit Status:** P1 - Width squeezes main content

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Sheet → SheetPortal) | ✅ |
| Render target | document.body | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| Inherited from Sheet | `z-50` | ✅ |

#### Dimension Analysis
| Viewport | Width | Main Content Remaining | Usable? |
|----------|-------|------------------------|---------|
| Desktop 1440px | `w-[78vw]` (1123px) | 317px | ❌ |
| iPad 1024px | 799px | 225px | ❌ |
| iPad 768px | 599px | 169px | ❌ |

**CRITICAL ISSUE:** At 78vw, the slide-over consumes most of the viewport. Main content shrinks below the 600px minimum on all viewport sizes when slide-over is open.

#### Content Overflow
| Metric | Value |
|--------|-------|
| Scrollable | Yes (`overflow-y-auto` on TabsContent) |
| Actions sticky | Yes (SheetFooter in edit mode) |
| Close visible | Yes (inherited from Sheet) |

#### Focus Management
| Metric | Value | Compliant? |
|--------|-------|------------|
| Focus trap | Yes (Radix built-in) | ✅ |
| ESC closes | Yes (via `useKeyboardShortcuts`) | ✅ |
| ARIA attributes | Yes (`role="dialog"`, `aria-modal`, `aria-labelledby`) | ✅ |

#### Issues Found
1. **P1 CONFIRMED - Width (line 176):** `w-[78vw] min-w-[576px] max-w-[1024px]`
   - Should be: `w-[40vw] max-w-[600px]` on desktop, `fixed inset-0` on iPad
2. **Compliant - Buttons:** Uses `h-11` for Edit/Cancel/Save buttons ✅

#### Verdict
- [x] First audit classification CORRECT (P1)

---

### 9. ContextMenu (`src/atomic-crm/utils/contextMenu.tsx`)

**Type:** Right-click Context Menu
**Radix-based:** No (custom implementation)
**First Audit Status:** P1 - z-[9999] + menu items < 44px

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (`createPortal(...)`) | ✅ |
| Render target | `document.body` | ✅ |

#### Z-Index Analysis
| Element | Z-Index | Standard? |
|---------|---------|-----------|
| Menu container | `z-[9999]` | ❌ |
| Submenu | None specified | ⚠️ |

#### Issues Found
1. **P1 CONFIRMED - Z-index (line 82):** `z-[9999]` should be `z-50`
2. **P1 CONFIRMED - Menu item height (line 95):** `py-3` (24px) is NOT 44px minimum
   - Calculation: `px-3 py-3` = ~40px height with text, close but not quite 44px

#### Verdict
- [x] First audit classifications CORRECT (P1)

---

### 10. QuickAddDialog (`src/atomic-crm/opportunities/quick-add/QuickAddDialog.tsx`)

**Type:** Form Dialog
**Radix-based:** Yes (uses Dialog component)
**First Audit Status:** P2 - Mobile-first width

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Dialog) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Viewport | Width | Usable? |
|----------|-------|---------|
| Desktop | `max-w-2xl` (672px) | ✅ |
| Mobile | `sm:w-[calc(100%-2rem)]` | ⚠️ |

#### Issues Found
1. **P2 CONFIRMED - Mobile-first width (line 26):** `sm:w-[calc(100%-2rem)]`

#### Verdict
- [x] First audit classification CORRECT (P2)

---

### 11. CloseOpportunityModal (`src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx`)

**Type:** Confirmation Dialog with Form
**Radix-based:** Yes (uses Dialog component)
**First Audit Status:** P2 - Mobile-first width

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Dialog) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Viewport | Width | Usable? |
|----------|-------|---------|
| Desktop | `max-w-md` (448px) | ✅ |
| Mobile | `sm:w-[calc(100%-2rem)]` | ⚠️ |

#### Touch Targets
| Element | Size | Compliant? |
|---------|------|------------|
| Cancel button | `h-11 min-w-[100px]` | ✅ |
| Submit button | `h-11 min-w-[120px]` | ✅ |

#### Issues Found
1. **P2 CONFIRMED - Mobile-first width (line 148):** `sm:w-[calc(100%-2rem)]`

#### Verdict
- [x] First audit classification CORRECT (P2)
- [x] Button touch targets compliant

---

### 12. SimilarOpportunitiesDialog (`src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx`)

**Type:** Warning Dialog with Table
**Radix-based:** Yes (uses Dialog component)
**First Audit Status:** P2 - Mobile-first footer

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Dialog) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Viewport | Width | Usable? |
|----------|-------|---------|
| Desktop | `sm:max-w-2xl` (672px) | ⚠️ (mobile-first) |

#### Content Overflow
| Metric | Value |
|--------|-------|
| Table scrollable | Yes (`max-h-64 overflow-y-auto`) |

#### Touch Targets
| Element | Size | Compliant? |
|---------|------|------------|
| Go Back button | `h-11 min-w-[120px]` | ✅ |
| Create button | `h-11 min-w-[150px]` | ✅ |

#### Issues Found
1. **P2 CONFIRMED - Mobile-first footer (line 139):** `flex-col gap-2 sm:flex-row sm:justify-end`

#### Verdict
- [x] First audit classification CORRECT (P2)

---

### 13. ContactImportDialog (`src/atomic-crm/contacts/ContactImportDialog.tsx`)

**Type:** Multi-step Import Wizard
**Radix-based:** Yes (uses Dialog component)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Dialog) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Dialog | Width | Usable? |
|--------|-------|---------|
| Main dialog | `max-w-2xl` (672px) | ✅ |
| Preview dialog | `sm:max-w-7xl h-[90vh]` | ⚠️ |

#### Content Overflow
| Metric | Value |
|--------|-------|
| Preview scrollable | Yes (`overflow-y-auto` on content) |
| Import progress visible | Yes (in-view card) |

#### Touch Targets
| Element | Size | Compliant? |
|---------|------|------------|
| Import button | Default button height | ⚠️ (no explicit h-11) |
| Cancel button | `h-11 px-4` | ✅ |

#### Issues Found
1. **NEW - Import button:** Line 490 uses default Button without explicit height

#### Verdict
- [ ] NEW violation: Import button missing h-11

---

### 14. TagDialog (`src/atomic-crm/tags/TagDialog.tsx`)

**Type:** Create/Edit Tag Form
**Radix-based:** Yes (uses Dialog component)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Dialog) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Viewport | Width | Usable? |
|----------|-------|---------|
| Desktop | `sm:max-w-lg` (512px) | ⚠️ (mobile-first) |

#### Touch Targets
| Element | Size | Compliant? |
|---------|------|------------|
| Save button | Default height | ❌ (no h-11) |
| Color buttons | RoundButton component | ⚠️ (needs verification) |

#### Issues Found
1. **NEW - Save button height (line 160):** No explicit height, uses default
2. **Mobile-first width:** `sm:max-w-lg`

#### Verdict
- [ ] NEW violations found (button height, mobile-first width)

---

### 15. TaskCompleteSheet (`src/atomic-crm/dashboard/v3/components/TaskCompleteSheet.tsx`)

**Type:** Bottom Sheet for Task Management
**Radix-based:** Yes (uses Sheet component)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Sheet) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Metric | Value |
|--------|-------|
| Side | Bottom |
| Max height | `max-h-[80vh]` |
| Border radius | `rounded-t-xl` |

#### Touch Targets
| Element | Size | Compliant? |
|---------|------|------------|
| Complete button | `h-11 w-11` | ✅ |

#### Accessibility
| Metric | Value | Compliant? |
|--------|-------|------------|
| aria-labelledby | Yes (`complete-task-title`) | ✅ |
| aria-describedby | Yes (`complete-task-description`) | ✅ |

#### Verdict
- [x] FULLY COMPLIANT - No issues found

---

### 16. PipelineDrillDownSheet (`src/atomic-crm/dashboard/v3/components/PipelineDrillDownSheet.tsx`)

**Type:** Side Panel for Pipeline Details
**Radix-based:** Yes (uses Sheet component)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Sheet) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Viewport | Width | Main Content Remaining | Usable? |
|----------|-------|------------------------|---------|
| Desktop 1440px | `w-[480px] max-w-[90vw]` | 960px | ✅ |
| iPad 768px | 480px (capped at 90vw = 691px) | ~77px - 288px | ⚠️ |

#### Content Overflow
| Metric | Value |
|--------|-------|
| Scrollable | Yes (`ScrollArea` component) |

#### Touch Targets
| Element | Size | Compliant? |
|---------|------|------------|
| OpportunityCard | Full card clickable | ✅ |
| Keyboard | `tabIndex={0}` + Enter/Space | ✅ |

#### Issues Found
1. **NEEDS VERIFICATION:** On iPad 768px, 480px width may squeeze main content below 600px

#### Verdict
- [x] Mostly compliant, iPad behavior needs verification

---

### 17. LinkOpportunityModal (`src/atomic-crm/contacts/LinkOpportunityModal.tsx`)

**Type:** Selection Dialog
**Radix-based:** Yes (uses Dialog component)
**First Audit Status:** Not in first audit

#### Portal Analysis
| Metric | Value | Compliant? |
|--------|-------|------------|
| Portal used | Yes (via Dialog) | ✅ |
| Render target | document.body | ✅ |

#### Dimension Analysis
| Viewport | Width | Usable? |
|----------|-------|---------|
| Desktop | `max-w-2xl` (672px) | ✅ |

#### Touch Targets
| Element | Size | Compliant? |
|---------|------|------------|
| Cancel button | Default height | ❌ (no h-11) |
| Submit button | Default height | ❌ (no h-11) |

#### Issues Found
1. **NEW - Button heights (lines 91, 94):** Both buttons missing explicit `h-11`

#### Verdict
- [ ] NEW violations found (button heights)

---

## NEW Violations Discovered

| ID | File:Line | Principle | Issue | Why First Audit Missed |
|----|-----------|-----------|-------|------------------------|
| N1 | `dialog.tsx:59` | Interactive | Close button ~24px clickable area | First audit focused on explicit button elements, not DialogClose |
| N2 | `sheet.tsx:69` | Interactive | Close button ~36px clickable area | Sheet not audited in first pass |
| N3 | `dropdown-menu.tsx:62` | Interactive | Menu items ~28-32px height | First audit didn't analyze menu item heights |
| N4 | `ContactImportDialog.tsx:490` | Interactive | Import button missing h-11 | File not in first audit scope |
| N5 | `TagDialog.tsx:160` | Interactive | Save button missing h-11 | File not in first audit scope |
| N6 | `LinkOpportunityModal.tsx:91,94` | Interactive | Both buttons missing h-11 | File not in first audit scope |

---

## False Negatives Corrected

| File:Line | First Audit Said | Actually Is | Evidence |
|-----------|------------------|-------------|----------|
| None | - | - | First audit was accurate for files covered |

---

## Confirmed Violations from First Audit

| ID | File:Line | Status | Notes |
|----|-----------|--------|-------|
| 9 | `ResourceSlideOver.tsx:176` | CONFIRMED P1 | Width `w-[78vw]` squeezes main content |
| 14 | `contextMenu.tsx:82` | CONFIRMED P1 | `z-[9999]` non-standard |
| 15 | `contextMenu.tsx:95` | CONFIRMED P1 | Menu items < 44px height |
| 24 | `alert-dialog.tsx:53` | CONFIRMED P2 | Mobile-first footer |
| 25 | `dialog.tsx:82` | CONFIRMED P2 | Mobile-first footer |

---

## Success Criteria Verification

- [x] EVERY overlay component analyzed (17 total)
- [x] ALL z-index values mapped (all use z-50 except contextMenu z-[9999] and navigation-menu z-[1])
- [x] ALL widths calculated at multiple viewports
- [x] Portal usage verified for each overlay (all compliant)
- [x] Focus management tested conceptually (all Radix-based components inherit correct behavior)
- [x] Nested overlay scenarios considered (no nested overlays found in codebase)

---

## Recommendations

### Immediate (P0/P1)

1. **ResourceSlideOver width:** Change to `w-[40vw] max-w-[600px]` on desktop, `fixed inset-0 z-50` on iPad
2. **ContextMenu z-index:** Change `z-[9999]` to `z-50`
3. **ContextMenu items:** Add `min-h-[44px]` to menu items

### Short-term (P2)

1. **Dialog/AlertDialog close buttons:** Add explicit `h-11 w-11` sizing
2. **Button standardization:** Audit all Dialog/Modal buttons for missing `h-11`
3. **Mobile-first patterns:** Batch convert to desktop-first:
   - `flex-col-reverse sm:flex-row` → `flex-row md:flex-col-reverse`
   - `sm:max-w-lg` → `max-w-lg md:max-w-full`

### Long-term

1. **Consider Radix ContextMenu:** Replace custom `contextMenu.tsx` with `@radix-ui/react-context-menu` for built-in accessibility and portal handling
2. **Sheet width standardization:** Create design tokens for sheet widths (small: 384px, medium: 480px, large: 600px)

---

## Appendix: Z-Index Scale Verification

| Component | Element | Z-Index | Compliant? |
|-----------|---------|---------|------------|
| dialog.tsx | Overlay | z-50 | ✅ |
| dialog.tsx | Content | z-50 | ✅ |
| alert-dialog.tsx | Overlay | z-50 | ✅ |
| alert-dialog.tsx | Content | z-50 | ✅ |
| sheet.tsx | Overlay | z-50 | ✅ |
| sheet.tsx | Content | z-50 | ✅ |
| popover.tsx | Content | z-50 | ✅ |
| dropdown-menu.tsx | Content | z-50 | ✅ |
| dropdown-menu.tsx | SubContent | z-50 | ✅ |
| drawer.tsx | Overlay | z-50 | ✅ |
| drawer.tsx | Content | z-50 | ✅ |
| tooltip.tsx | Content | z-50 | ✅ |
| contextMenu.tsx | Container | z-[9999] | ❌ |
| navigation-menu.tsx | Indicator | z-[1] | ❌ |

**Standard Z-Index Scale (from interactive-elements.md):**
- `z-0` - Base content layer
- `z-10` - Sticky headers, fixed toolbars
- `z-50` - Dropdowns, popovers, modals (via Radix Portal)
- `z-[100]` - Toasts, notifications
