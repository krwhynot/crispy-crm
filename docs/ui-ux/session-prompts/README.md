# UI/UX Remediation - Parallel Sessions

**Fix all 60 issues by running 4 Claude Code sessions simultaneously.**

---

## Quick Start

1. Open **4 terminal windows**
2. Run `claude` in each
3. Paste one prompt per session:

| Terminal | Prompt File | Issues |
|----------|-------------|--------|
| 1 | [session-a-kanban.md](./session-a-kanban.md) | 15 |
| 2 | [session-b-navigation.md](./session-b-navigation.md) | 16 |
| 3 | [session-c-primitives.md](./session-c-primitives.md) | 17 |
| 4 | [session-d-layouts.md](./session-d-layouts.md) | 12 |

---

## Parallel Execution Diagram

```
Terminal 1          Terminal 2          Terminal 3          Terminal 4
────────────        ────────────        ────────────        ────────────
Session A           Session B           Session C           Session D
Kanban/Opps         Navigation          UI Primitives       Lists/Layouts
15 issues           16 issues           17 issues           12 issues
    │                   │                   │                   │
    ▼                   ▼                   ▼                   ▼
QuickAddOpp         Header.tsx          button.constants    ContactList
ColumnCustom        contextMenu         calendar.tsx        ResourceSlide
OpportunityCard     sidebar.tsx         dialog.tsx          StandardList
AddTask.tsx         columns-button      Avatar.tsx          formatRelative
    │                   │                   │                   │
    └───────────────────┴───────────────────┴───────────────────┘
                                │
                        All 60 fixes merge
                        without conflicts
```

---

## File Ownership (No Conflicts)

Each session owns exclusive files:

### Session A - Kanban
```
src/atomic-crm/opportunities/kanban/*
src/atomic-crm/opportunities/components/*
src/atomic-crm/tasks/AddTask.tsx
src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx
src/atomic-crm/products/ProductList.tsx
```

### Session B - Navigation
```
src/atomic-crm/layout/Header.tsx
src/atomic-crm/utils/contextMenu.tsx
src/components/ui/sidebar.tsx
src/components/ui/navigation-menu.tsx
src/components/ui/breadcrumb.tsx
src/components/admin/columns-button.tsx
src/components/admin/theme-mode-toggle.tsx
src/components/admin/locales-menu-button.tsx
src/components/admin/user-menu.tsx
```

### Session C - Primitives
```
src/components/ui/button.constants.ts
src/components/ui/badge.constants.ts
src/components/ui/calendar.tsx
src/components/ui/dialog.tsx
src/components/ui/alert-dialog.tsx
src/components/ui/sheet.tsx
src/components/ui/drawer.tsx
src/components/admin/*-input.tsx
src/atomic-crm/shared/Avatar.tsx
src/atomic-crm/shared/Combobox.tsx
```

### Session D - Layouts
```
src/atomic-crm/contacts/*
src/atomic-crm/organizations/OrganizationList.tsx
src/components/layouts/*
src/atomic-crm/dashboard/v3/components/KPI*
src/atomic-crm/dashboard/v3/components/DashboardTabPanel.tsx
src/atomic-crm/utils/formatRelativeTime.ts
src/stories/*
src/atomic-crm/shared/TutorialProvider.tsx
```

---

## Time Estimate

| Mode | Time |
|------|------|
| Sequential | 8-10 hours |
| **4 Parallel Sessions** | **2-3 hours** |

---

## After Completion

When all 4 sessions finish:

```bash
# Verify no conflicts
git status

# Check touch targets
grep -r "h-11\|min-h-11" src/

# Check no bad z-index
grep -r "z-\[" src/ --include="*.tsx"

# Update score in audit
# docs/ui-ux/audits/ui-ux-audit-executive-summary.md
# Score: 8.2 → 10.0
```

---

*Generated 2025-12-24*
