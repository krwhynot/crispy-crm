# Session C: UI Primitives & Inputs

**Run in parallel with:** Sessions A, B, D
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```
Fix 17 UI/UX issues in UI primitive and input files.

IMPORTANT: Only modify files listed below. Other sessions are working on other files.

## Files I Own (DO NOT touch other files)
- src/components/ui/button.constants.ts
- src/components/ui/badge.constants.ts
- src/components/ui/calendar.tsx
- src/components/ui/dialog.tsx
- src/components/ui/alert-dialog.tsx
- src/components/ui/sheet.tsx
- src/components/ui/drawer.tsx
- src/components/admin/select-input.tsx
- src/components/admin/boolean-input.tsx
- src/components/admin/radio-button-group-input.tsx
- src/components/admin/number-input.tsx
- src/atomic-crm/shared/Avatar.tsx
- src/atomic-crm/shared/Combobox.tsx

## Design Rules
- Touch targets: 44px minimum (h-11)
- Spacing: gap-2 minimum (not gap-1 or gap-1.5)
- Breakpoints: Desktop-first (lg:, md:), NOT mobile-first (sm:)
- Colors: Semantic tokens only (bg-background, NOT bg-black/80)

## Issues to Fix

### button.constants.ts (1 fix)
1. Line 29: Change gap-1.5 to gap-2

### badge.constants.ts (1 fix)
1. Line 12: Change gap-1 to gap-2

### calendar.tsx (1 fix)
1. Line 27: Increase --cell-size CSS variable to 44px

### dialog.tsx (1 fix)
1. Lines 72, 82: Change sm: breakpoints to desktop-first (use lg: or md:)

### alert-dialog.tsx (1 fix)
1. Lines 47, 53: Change sm: breakpoints to desktop-first pattern

### sheet.tsx (1 fix)
1. Line 56: Change sm:max-w-sm to desktop-first breakpoint

### drawer.tsx (1 fix)
1. Line 30: Change bg-black/80 to bg-background/80 or semantic overlay token

### select-input.tsx (1 fix)
1. Line 184: Change loading skeleton h-9 to h-11

### boolean-input.tsx (1 fix)
1. Implement readOnly behavior - when readOnly prop is true, prevent toggle

### radio-button-group-input.tsx (1 fix)
1. Line 94: Change skeleton h-9 to h-11

### number-input.tsx (1 fix)
1. Use locale-aware number parsing (Intl.NumberFormat) instead of parseFloat

### Avatar.tsx (1 fix)
1. Fix charAt(0) to handle emoji - use Array.from(name)[0] or grapheme splitter

### Combobox.tsx (1 fix)
1. Add max-h-60 or max-h-80 to CommandList to prevent overflow

### Multiple input components (1 fix)
1. Add dir="auto" attribute to text inputs for RTL support

## Verification
After all fixes, confirm:
- [ ] No gap-1 or gap-1.5 in constants files
- [ ] Calendar cells are 44px
- [ ] Dialogs use desktop-first breakpoints
- [ ] Drawer overlay uses semantic color
- [ ] All skeletons are h-11
- [ ] Avatar handles emoji names correctly
```
