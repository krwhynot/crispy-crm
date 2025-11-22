# 00 – Atomic Inventory Checklist

This file maps real project files into atomic levels. Use this as your navigation index.

> **Project:** Atomic CRM - React 19 + Vite + TypeScript + Supabase + shadcn/ui + Tailwind v4

---

## Atoms (Tiny Components)

Small, focused presentational components with minimal logic. These are the building blocks.

**Location:** `src/components/ui/`

### Core UI Controls
- [x] `src/components/ui/button.tsx` – ATOM: Clickable action trigger with variants (default, destructive, outline, secondary, ghost, link)
- [x] `src/components/ui/input.tsx` – ATOM: Text input field with focus states
- [x] `src/components/ui/textarea.tsx` – ATOM: Multi-line text input
- [x] `src/components/ui/checkbox.tsx` – ATOM: Boolean toggle with Radix UI
- [x] `src/components/ui/switch.tsx` – ATOM: Toggle switch for settings
- [x] `src/components/ui/select.tsx` – ATOM: Dropdown selection
- [x] `src/components/ui/radio-group.tsx` – ATOM: Single-choice selection

### Display Components
- [x] `src/components/ui/badge.tsx` – ATOM: Status/category indicator with org-type variants
- [x] `src/components/ui/label.tsx` – ATOM: Form field label
- [x] `src/components/ui/skeleton.tsx` – ATOM: Loading placeholder
- [x] `src/components/ui/separator.tsx` – ATOM: Visual divider
- [x] `src/components/ui/progress.tsx` – ATOM: Progress indicator

### Container Components
- [x] `src/components/ui/card.tsx` – ATOM: Content container with Card/CardHeader/CardTitle/CardContent/CardFooter
- [x] `src/components/ui/table.tsx` – ATOM: Data table structure (Table/TableHeader/TableRow/TableCell)
- [x] `src/components/ui/tabs.tsx` – ATOM: Tab navigation container
- [x] `src/components/ui/accordion.tsx` – ATOM: Collapsible content sections

### Overlay Components
- [x] `src/components/ui/dialog.tsx` – ATOM: Modal dialog
- [x] `src/components/ui/sheet.tsx` – ATOM: Slide-over panel
- [x] `src/components/ui/popover.tsx` – ATOM: Floating content
- [x] `src/components/ui/dropdown-menu.tsx` – ATOM: Context/action menu
- [x] `src/components/ui/tooltip.tsx` – ATOM: Hover information

### Navigation Components
- [x] `src/components/ui/breadcrumb.tsx` – ATOM: Path navigation
- [x] `src/components/ui/pagination.tsx` – ATOM: Page navigation
- [x] `src/components/ui/navigation-menu.tsx` – ATOM: Top-level navigation

### Form Components
- [x] `src/components/ui/form.tsx` – ATOM: Form wrapper with react-hook-form integration
- [x] `src/components/ui/calendar.tsx` – ATOM: Date picker
- [x] `src/components/ui/combobox.tsx` – ATOM: Searchable dropdown

### Layout Components
- [x] `src/components/ui/resizable.tsx` – ATOM: Resizable panel layout
- [x] `src/components/ui/scroll-area.tsx` – ATOM: Custom scrollable container

---

## Molecules (Small Combinations)

Components that combine 2-5 atoms into reusable patterns.

**Location:** `src/atomic-crm/dashboard/v3/components/`, `src/atomic-crm/dashboard/`

### Dashboard Molecules
- [x] `src/atomic-crm/dashboard/v3/components/TaskGroup.tsx` – MOLECULE: Collapsible task list header with count badge
- [x] `src/atomic-crm/dashboard/PriorityIndicator.tsx` – MOLECULE: Priority badge with icon + label
- [x] `src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx` – MOLECULE: Loading state for principal cards
- [x] `src/atomic-crm/dashboard/DashboardWidget.tsx` – MOLECULE: Generic widget container wrapper

### Form Molecules
- [x] `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` – MOLECULE (large): Activity logging form
  - Uses: Form, Select, Combobox, Calendar, Switch, Button, Textarea

### List Item Molecules
- [x] `TaskItemComponent` (in TasksPanel.tsx) – MOLECULE: Task row with checkbox, icon, badge, action buttons

---

## Organisms (Sections / Blocks)

Larger sections composed of multiple molecules and atoms. These are self-contained UI regions.

**Location:** `src/atomic-crm/dashboard/v3/components/`, `src/atomic-crm/dashboard/v2/components/`

### Dashboard V3 Organisms
- [x] `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx` – ORGANISM: Pipeline data table with filters
  - Uses: Table, Badge, Button, Switch, DropdownMenu, Skeleton
  - Data: `usePrincipalPipeline` hook → `principal_pipeline_summary` view

- [x] `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx` – ORGANISM: Time-bucketed task list
  - Uses: Card, TaskGroup, TaskItemComponent, Badge, Skeleton
  - Data: `useMyTasks` hook → tasks table

- [x] `src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx` – ORGANISM: Activity logging panel
  - Uses: Card, Button, QuickLogForm
  - Data: Creates activities and tasks records

### Dashboard V2 Organisms
- [x] `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx` – ORGANISM: Collapsible filter sidebar
- [x] `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx` – ORGANISM: Tasks with grouping modes
- [x] `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx` – ORGANISM: Tree view of opportunities
- [x] `src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx` – ORGANISM: Detail panel slide-over
- [x] `src/atomic-crm/dashboard/v2/components/QuickLogger.tsx` – ORGANISM: V2 quick activity logger

### Legacy Dashboard Organisms
- [x] `src/atomic-crm/dashboard/PipelineSummary.tsx` – ORGANISM: Pipeline metrics cards
- [x] `src/atomic-crm/dashboard/CompactTasksWidget.tsx` – ORGANISM: Compact task list
- [x] `src/atomic-crm/dashboard/ActivityFeed.tsx` – ORGANISM: Activity timeline

---

## Pages (Screens)

Full screens/routes composed of organisms and molecules.

**Location:** `src/atomic-crm/dashboard/`, `src/atomic-crm/root/`

### Dashboard Pages
- [x] `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` – PAGE: Main dashboard (DEFAULT at `/`)
  - Layout: 3-column resizable (40/30/30)
  - Organisms: PrincipalPipelineTable, TasksPanel, QuickLoggerPanel

- [x] `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx` – PAGE: Legacy dashboard at `/dashboard-v2`
  - Layout: Sidebar + 3-column resizable
  - Organisms: FiltersSidebar, OpportunitiesHierarchy, TasksPanel, QuickLogger, RightSlideOver

- [x] `src/atomic-crm/dashboard/PrincipalDashboard.tsx` – PAGE: Original dashboard at `/dashboard`
- [x] `src/atomic-crm/dashboard/CompactGridDashboard.tsx` – PAGE: Grid-based compact layout

### Core App Pages
- [x] `src/atomic-crm/root/CRM.tsx` – PAGE (root): Main app shell, route definitions, resource registration
- [x] `src/atomic-crm/login/StartPage.tsx` – PAGE: Login entry point
- [x] `src/atomic-crm/settings/SettingsPage.tsx` – PAGE: User settings

### Resource Pages (React Admin Generated)
- [x] `src/atomic-crm/opportunities/` – List/Show/Edit/Create pages
- [x] `src/atomic-crm/contacts/` – List/Show/Edit/Create pages
- [x] `src/atomic-crm/organizations/` – List/Show/Edit/Create pages
- [x] `src/atomic-crm/tasks/` – List/Show/Edit/Create pages
- [x] `src/atomic-crm/products/` – List/Show/Edit/Create pages

---

## Flows (User Journeys)

Multi-step user journeys across pages and components.

### Authentication Flow
- [x] Flow: "Log in → Dashboard"
  - Pages: StartPage → PrincipalDashboardV3
  - Components: LoginPage, authProvider
  - Data: Supabase auth session, sales table lookup

### Activity Logging Flow
- [x] Flow: "Log customer activity"
  - Organism: QuickLoggerPanel → QuickLogForm
  - Data: Creates `activities` record, optionally creates `tasks` follow-up
  - Components: Select, Combobox, Calendar, Switch, Button

### Task Management Flow
- [x] Flow: "View and complete tasks"
  - Organism: TasksPanel
  - Components: TaskGroup, TaskItemComponent, Checkbox
  - Data: Updates `tasks.completed` and `completed_at`

### Opportunity Management Flow
- [x] Flow: "View pipeline → drill into opportunity"
  - Organism: PrincipalPipelineTable
  - Navigation: Click row → Opportunity detail page
  - Data: `principal_pipeline_summary` view

---

## Quick Reference

| Level | Count | Primary Location |
|-------|-------|------------------|
| Atoms | 25+ | `src/components/ui/` |
| Molecules | ~8 | `src/atomic-crm/dashboard/*/components/` |
| Organisms | ~12 | `src/atomic-crm/dashboard/*/components/` |
| Pages | ~10 | `src/atomic-crm/dashboard/`, `src/atomic-crm/root/` |
| Flows | 4 | Documented below |

---

*Last updated: Study session in progress*
