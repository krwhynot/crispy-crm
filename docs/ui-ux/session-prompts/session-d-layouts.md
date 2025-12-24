# Session D: Lists & Layouts

**Run in parallel with:** Sessions A, B, C
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```
Fix 12 UI/UX issues in List, Layout, and Utility files.

IMPORTANT: Only modify files listed below. Other sessions are working on other files.

## Files I Own (DO NOT touch other files)
- src/atomic-crm/contacts/ContactList.tsx
- src/atomic-crm/contacts/ContactDetailsTab.tsx
- src/atomic-crm/contacts/ContactHierarchyBreadcrumb.tsx
- src/atomic-crm/organizations/OrganizationList.tsx
- src/components/layouts/StandardListLayout.tsx
- src/components/layouts/ResourceSlideOver.tsx
- src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx
- src/atomic-crm/dashboard/v3/components/DashboardTabPanel.tsx
- src/atomic-crm/utils/formatRelativeTime.ts
- src/stories/Header.tsx
- src/stories/Page.tsx
- src/atomic-crm/shared/TutorialProvider.tsx
- src/atomic-crm/opportunities/OpportunityCreateFormTutorial.tsx

## Design Rules
- Spacing: gap-2 minimum (not gap-1, gap-0.5)
- Colors: Semantic tokens only (NOT rgba() or hex)
- Text overflow: Use truncate class with max-w-*
- Scrollable areas: Use max-h-* overflow-y-auto

## Issues to Fix

### ContactList.tsx (1 fix)
1. Line 126: Add truncate and max-w-[200px] to formatFullName output

### ContactDetailsTab.tsx (1 fix)
1. Line 215: Add max-h-96 overflow-y-auto to notes section

### ContactHierarchyBreadcrumb.tsx (1 fix)
1. Line 33: Change gap-0.5 to gap-2

### OrganizationList.tsx (1 fix)
1. Line 150: Add truncate class to organization name column

### StandardListLayout.tsx (1 fix)
1. Line 180: Add min-w-[600px] to main content area

### ResourceSlideOver.tsx (3 fixes)
1. Line 188: Change gap-1 to gap-2 in header
2. Line 241: Change gap-1 to gap-2 in TabsList
3. Line 252: Change gap-1 to gap-2 in TabsTrigger

### KPISummaryRow.tsx (1 fix)
1. Add md: responsive breakpoints for tablet layout

### DashboardTabPanel.tsx (1 fix)
1. Lines 102-138: Remove forceMount from tabs, implement lazy loading

### formatRelativeTime.ts (1 fix)
1. Replace hardcoded strings ("ago", "in", etc.) with i18n translation keys

### Stories files (1 fix - covers both)
1. Header.tsx lines 25, 45, 49, 50: Replace #FFF, #999 with semantic tokens, size="small" with default
2. Page.tsx line 64: Replace hardcoded hex with semantic token

### Tutorial files (1 fix - covers both)
1. TutorialProvider.tsx line 126: Replace rgba() with semantic token
2. OpportunityCreateFormTutorial.tsx line 65: Replace rgba() with semantic token

## Verification
After all fixes, confirm:
- [ ] Long names truncate in lists
- [ ] Notes sections scroll when content is long
- [ ] No gap-1 or gap-0.5 in files
- [ ] No hardcoded colors (rgba, hex)
- [ ] Dashboard has tablet breakpoints
- [ ] No forceMount on dashboard tabs
```
