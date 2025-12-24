# Session B: Navigation & Menus

**Run in parallel with:** Sessions A, C, D
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```
Fix 16 UI/UX issues in Navigation and Menu files.

IMPORTANT: Only modify files listed below. Other sessions are working on other files.

## Files I Own (DO NOT touch other files)
- src/atomic-crm/layout/Header.tsx
- src/atomic-crm/utils/contextMenu.tsx
- src/components/ui/sidebar.tsx
- src/components/ui/navigation-menu.tsx
- src/components/ui/breadcrumb.tsx
- src/components/admin/columns-button.tsx
- src/components/admin/theme-mode-toggle.tsx
- src/components/admin/locales-menu-button.tsx
- src/components/admin/user-menu.tsx

## Design Rules
- Touch targets: 44px minimum (h-11, min-h-11, size-11)
- Focus: focus-visible:ring-2 focus-visible:ring-ring
- Z-index: Standard scale (z-10, z-50), never z-[9999] or z-[1]
- No modal={false} on dropdown menus

## Issues to Fix

### Header.tsx (2 fixes)
1. Lines 130-141: Add min-h-11 to NavigationTab
2. Lines 130-141: Add focus-visible:ring-2 focus-visible:ring-ring

### contextMenu.tsx (3 fixes)
1. Line 94: Add min-h-11 to main menu items
2. Line 138: Add min-h-11 to submenu items
3. Line 82: Change z-[9999] to z-50

### sidebar.tsx (2 fixes)
1. Line 446: Change sm variant h-7 to min-h-11
2. Line 294: Change SidebarInput h-8 to h-11

### columns-button.tsx (3 fixes)
1. Line 86: Refactor createPortal to use Radix Popover component
2. Line 170: Change clear button h-4 w-4 to h-11 w-11
3. Line 86: Remove forceMount prop if present

### navigation-menu.tsx (1 fix)
1. Line 137: Change z-[1] to z-10

### breadcrumb.tsx (1 fix)
1. Line 46: Add focus-visible:ring-2 focus-visible:ring-ring to BreadcrumbLink

### theme-mode-toggle.tsx (1 fix)
1. Line 50: Remove modal={false} prop from DropdownMenu

### locales-menu-button.tsx (1 fix)
1. Line 29: Remove modal={false} prop from DropdownMenu

### user-menu.tsx (1 fix)
1. Line 48: Remove forceMount prop if not needed for animation

## Verification
After all fixes, confirm:
- [ ] All nav items have focus rings when focused
- [ ] All menu items are 44px height
- [ ] columns-button uses Radix Popover (no manual portal)
- [ ] No z-[9999] or z-[1] in any file
- [ ] No modal={false} in dropdown menus
```
