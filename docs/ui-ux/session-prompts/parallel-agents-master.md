# Parallel Agents Master Prompt

Copy this entire prompt into Claude Code to dispatch 4 parallel agents:

---

```
I need to fix 60 UI/UX audit violations. Dispatch 4 parallel task-implementor agents, each working on isolated file clusters to avoid merge conflicts.

Reference: /home/krwhynot/projects/crispy-crm/docs/ui-ux/shadcn-mcp-fix-guide.md

Design rules for ALL agents:
- Touch targets: 44px minimum (h-11, min-h-11, size-11)
- Colors: Semantic tokens only (text-foreground, NOT hex)
- Spacing: gap-2 minimum
- Focus: focus-visible:ring-2 focus-visible:ring-ring
- Z-index: Standard scale (z-40 FAB, z-50 modals)

---

AGENT A - Kanban & Opportunities (15 issues):

Files owned:
- src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx
- src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx
- src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx
- src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx
- src/atomic-crm/opportunities/OpportunitySlideOverDetailsTab.tsx
- src/atomic-crm/opportunities/OpportunityCard.tsx
- src/atomic-crm/tasks/AddTask.tsx
- src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx
- src/atomic-crm/products/ProductList.tsx

Fixes:
1. QuickAddOpportunity: Add ESC handler, close button (44px), click-outside, h-11 on buttons
2. ColumnCustomizationMenu: h-8 w-8 → h-11 w-11, add ESC handler
3. OpportunityCard: Add truncate to badge and contact name
4. SimilarOpportunitiesDialog: var(--text-on-color) → text-primary-foreground
5. CloseOpportunityModal: Disable X during submission
6. OpportunitySlideOverDetailsTab: Add max-h-96 overflow-y-auto
7. AddTask: max-h-9/10 → max-h-[90vh]
8. LogActivityFAB: z-50 → z-40
9. ProductList: Add h-11 to popover trigger

---

AGENT B - Navigation & Menus (16 issues):

Files owned:
- src/atomic-crm/layout/Header.tsx
- src/atomic-crm/utils/contextMenu.tsx
- src/components/ui/sidebar.tsx
- src/components/ui/navigation-menu.tsx
- src/components/ui/breadcrumb.tsx
- src/components/admin/columns-button.tsx
- src/components/admin/theme-mode-toggle.tsx
- src/components/admin/locales-menu-button.tsx
- src/components/admin/user-menu.tsx

Fixes:
1. Header NavigationTab: Add min-h-11, focus-visible:ring-2
2. contextMenu: Add min-h-11 to items, z-[9999] → z-50
3. sidebar: sm variant h-7 → min-h-11, SidebarInput h-8 → h-11
4. columns-button: Refactor to Radix Popover, clear button → h-11 w-11, remove forceMount
5. navigation-menu: z-[1] → z-10
6. breadcrumb: Add focus-visible to BreadcrumbLink
7. theme-mode-toggle: Remove modal={false}
8. locales-menu-button: Remove modal={false}
9. user-menu: Remove forceMount

---

AGENT C - UI Primitives (17 issues):

Files owned:
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

Fixes:
1. button.constants: gap-1.5 → gap-2
2. badge.constants: gap-1 → gap-2
3. calendar: --cell-size → 44px
4. dialog/alert-dialog: sm: → desktop-first breakpoints
5. sheet: sm:max-w-sm → desktop-first
6. drawer: bg-black/80 → semantic token
7. select-input: skeleton h-9 → h-11
8. boolean-input: Implement readOnly
9. radio-button-group-input: skeleton h-9 → h-11
10. number-input: locale-aware parseFloat
11. Avatar: emoji-safe grapheme handling
12. Combobox: Add max-h-* to CommandList

---

AGENT D - Lists & Layouts (12 issues):

Files owned:
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

Fixes:
1. ContactList: Add truncate to name
2. ContactDetailsTab: Add max-h-96 overflow-y-auto to notes
3. ContactHierarchyBreadcrumb: gap-0.5 → gap-2
4. OrganizationList: Add truncate to name
5. StandardListLayout: Add min-w-[600px]
6. ResourceSlideOver: All gap-1 → gap-2
7. KPISummaryRow: Add md: breakpoints
8. DashboardTabPanel: Remove forceMount, use lazy loading
9. formatRelativeTime: i18n translation keys
10. Stories files: Replace hardcoded colors, size="small" → default
11. TutorialProvider/OpportunityCreateFormTutorial: rgba() → semantic tokens

---

Dispatch all 4 agents in parallel. Each agent should:
1. Read its assigned files
2. Apply all fixes for those files
3. Verify touch targets ≥ 44px
4. Report completion status
```

---

## How It Works

When you paste this prompt, Claude Code will:

1. **Parse the 4 agent definitions**
2. **Dispatch them simultaneously** using Task tool with `task-implementor` subagent
3. **Each agent works on isolated files** - no merge conflicts
4. **Results aggregate** when all complete

## Expected Output

```
Agent A: ✅ 15 issues fixed (Kanban & Opportunities)
Agent B: ✅ 16 issues fixed (Navigation & Menus)
Agent C: ✅ 17 issues fixed (UI Primitives)
Agent D: ✅ 12 issues fixed (Lists & Layouts)

Total: 60/60 issues fixed
Score: 8.2 → 10.0
```

## Time Savings

| Mode | Time |
|------|------|
| Sequential (4 prompts) | 8-10 hours |
| Parallel (4 agents) | 2-3 hours |

**~4x faster execution**
