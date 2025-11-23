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

**Location:** `src/atomic-crm/dashboard/v3/components/`

### Dashboard Molecules
- [x] `src/atomic-crm/dashboard/v3/components/TaskGroup.tsx` – MOLECULE: Collapsible task list header with count badge
- [x] `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` – MOLECULE (large): Activity logging form
  - Uses: Form, Select, Combobox, Calendar, Switch, Button, Textarea
- [x] `TaskItemComponent` (in `TasksPanel.tsx`) – MOLECULE: Task row with checkbox, icon, badge, action buttons

> Legacy molecules such as `DashboardWidget`, `PriorityIndicator`, and `PrincipalCardSkeleton` now live only in `archive/` and are no longer part of the active dashboard.

---

## Organisms (Sections / Blocks)

Larger sections composed of multiple molecules and atoms. These are self-contained UI regions.

**Location:** `src/atomic-crm/dashboard/v3/components/`

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

> Historic V2/V1 dashboard organisms remain in `archive/dashboard` for reference but are no longer wired into the app.

---

## Pages (Screens)

Full screens/routes composed of organisms and molecules.

**Location:** `src/atomic-crm/dashboard/v3/`, `src/atomic-crm/root/`

### Dashboard Page
- [x] `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` – PAGE: Main dashboard (DEFAULT at `/`)
  - Layout: 3-column resizable (40/30/30)
  - Organisms: PrincipalPipelineTable, TasksPanel, QuickLoggerPanel

### Core App Pages
- [x] `src/atomic-crm/root/CRM.tsx` – PAGE (root): Main app shell, route definitions, resource registration
- [x] `src/atomic-crm/login/StartPage.tsx` – PAGE: Login entry point
- [x] `src/atomic-crm/settings/SettingsPage.tsx` – PAGE: User settings

### Resource Pages (React Admin Generated)
- [x] `src/atomic-crm/opportunities/` – List/Edit/Create pages (+ detail slide-over via `?view=ID`)
- [x] `src/atomic-crm/contacts/` – List/Edit/Create pages (+ detail slide-over)
- [x] `src/atomic-crm/organizations/` – List/Edit/Create pages (+ detail slide-over)
- [x] `src/atomic-crm/tasks/` – List/Edit/Create pages (+ detail slide-over)
- [x] `src/atomic-crm/products/` – List/Edit/Create pages (+ detail slide-over)

> “Show” routes now redirect to `/<resource>?view=<id>` so the slide-over detail stays within the list view.

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
- [x] Flow: "View pipeline → drill into opportunity" (navigation TBD)
  - Organism: PrincipalPipelineTable
  - Navigation: Row click wiring pending; UI currently read-only
  - Data: `principal_pipeline_summary` view

---

## Quick Reference

| Level | Count | Primary Location |
|-------|-------|------------------|
| Atoms | 25+ | `src/components/ui/` |
| Molecules | Current dashboard in `src/atomic-crm/dashboard/v3/components/` |
| Organisms | 3 (Pipeline, Tasks, Quick Logger) | `src/atomic-crm/dashboard/v3/components/` |
| Pages | 3 custom (CRM root, Dashboard V3, Settings) | `src/atomic-crm/dashboard/v3/`, `src/atomic-crm/root/` |
| Flows | 4 | Documented below |

---

*Last updated: Study session in progress*
