# Session A: Kanban & Opportunities

**Run in parallel with:** Sessions B, C, D
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```
Fix 15 UI/UX issues in Kanban and Opportunity files.

IMPORTANT: Only modify files listed below. Other sessions are working on other files.

## Files I Own (DO NOT touch other files)
- src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx
- src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx
- src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx
- src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx
- src/atomic-crm/opportunities/OpportunitySlideOverDetailsTab.tsx
- src/atomic-crm/opportunities/OpportunityCard.tsx
- src/atomic-crm/tasks/AddTask.tsx
- src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx
- src/atomic-crm/products/ProductList.tsx

## Design Rules
- Touch targets: 44px minimum (h-11, min-h-11, size-11)
- Colors: Semantic tokens only (text-foreground, NOT hex)
- Z-index: z-40 for FAB, z-50 for modals

## Issues to Fix

### QuickAddOpportunity.tsx (4 fixes)
1. Line 102: Add useEffect ESC key handler to dismiss
2. Line 102: Add 44px close button (h-11 w-11) in top-right
3. Line 106: Add click-outside handler on backdrop
4. Lines 167-191: Add h-11 to Cancel and Create buttons

### ColumnCustomizationMenu.tsx (2 fixes)
1. Line 44: Change h-8 w-8 to h-11 w-11 on settings button
2. Lines 23-36: Add useEffect ESC key listener

### OpportunityCard.tsx (2 fixes)
1. Lines 196-197: Add truncate class to principal badge
2. Lines 208-209: Add truncate class to contact name

### SimilarOpportunitiesDialog.tsx (1 fix)
1. Line 111: Replace var(--text-on-color) with text-primary-foreground

### CloseOpportunityModal.tsx (1 fix)
1. Disable X close button during form submission (check isSubmitting state)

### OpportunitySlideOverDetailsTab.tsx (1 fix)
1. Lines 361, 457, 485: Add max-h-96 overflow-y-auto to content sections

### AddTask.tsx (1 fix)
1. Change invalid max-h-9/10 to max-h-[90vh]

### LogActivityFAB.tsx (1 fix)
1. Change z-50 to z-40 (FAB should be below modals)

### ProductList.tsx (1 fix)
1. Lines 57-60: Add h-11 to popover trigger button

## Verification
After all fixes, confirm:
- [ ] QuickAddOpportunity dismisses with ESC
- [ ] QuickAddOpportunity has visible X button
- [ ] All buttons are 44px height
- [ ] Long text truncates in cards
- [ ] FAB doesn't overlap modals
```
