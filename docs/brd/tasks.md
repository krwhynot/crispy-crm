# BRD: Tasks

**Status:** Reverse-Engineered | **Last Updated:** 2026-03-03 | **Source:** Zod schemas, handler logic, UI components

---

## 1. Domain Overview

Tasks represent discrete action items assigned to sales representatives. A task can be linked to a contact, opportunity, organization, or any combination of these entities. Tasks drive day-to-day sales rep workflow: follow-up calls, emails, meetings, demos, and proposals are captured as tasks so nothing falls through the cracks.

**Business role:** Task management is the operational heartbeat of the CRM. Reps log tasks to schedule and track customer-facing actions. The dashboard surfaces overdue and priority tasks in a kanban panel, giving managers visibility into rep activity volume and responsiveness. Tasks also serve as a bridge to activity logging: completing a customer-facing task (Call, Email, Meeting, Demo) automatically creates a corresponding activity record. [INFERRED]

**Storage note:** Tasks are stored in the `activities` table using a Single Table Inheritance (STI) pattern, filtered by `activity_type = 'task'`. The handler (`tasksHandler.ts`) wraps the activities handler and translates the `title` field to/from the `subject` column and maps task type labels to interaction type enums. The logical `tasks` and `priority_tasks` (a dashboard summary view) are the external-facing resources.

---

## 2. Schema Fields

### Core Fields

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `id` | number | auto-increment, coerce | No |
| `title` | string | trim, min 1, max 500 | Yes |
| `description` | string | max 2000, nullable | No |
| `type` | enum | see enums | Yes |
| `priority` | enum | see enums, default `medium` | No (defaults medium) |
| `completed` | boolean | coerce, default `false` | No |
| `completed_at` | string | ISO timestamp, nullable | No |

### Schedule Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `due_date` | date | coerce, optional |
| `reminder_date` | date | coerce, nullable |
| `snooze_until` | date | coerce, nullable; empty string coerced to null |

### Relationship Fields

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `sales_id` | number | FK to sales, coerce positive int | Yes |
| `contact_id` | number | FK to contacts, nullable | No |
| `opportunity_id` | number | FK to opportunities, nullable | No |
| `organization_id` | number | FK to organizations, nullable | No |
| `related_task_id` | number | FK to tasks (self), nullable | No |

### Audit Fields

| Field | Type | Notes |
|-------|------|-------|
| `created_by` | string or number | Auto-set by DB trigger `trigger_set_task_created_by` |
| `created_at` / `updated_at` | string | DB-managed timestamps |
| `deleted_at` | string | Soft-delete marker (NULL = active) |

### Computed Fields (View-Only, Stripped Before Save)

`contact_name`, `opportunity_name`, `organization_name`, `assignee_name`, `assignee_email`, `creator_name`, `customer_name`, `principal_name`

---

## 3. Business Rules

1. **Title required** -- `title` must be non-empty (min 1 char) on create. Source: `src/atomic-crm/validation/task.ts:38`
2. **Assignment required** -- `sales_id` required on create; every task must have an assigned sales rep. Source: `src/atomic-crm/validation/task.ts:52`
3. **Type required** -- task `type` is required and must be a known enum value. Source: `src/atomic-crm/validation/task.ts:48`
4. **Soft delete** -- deletes set `deleted_at` timestamp; hard deletes are not used. Source: `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts:187`
5. **Completion timestamp auto-managed** -- setting `completed = true` automatically sets `completed_at` to current UTC time; setting `completed = false` clears `completed_at` to null. Source: `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts:43-63`
6. **Snooze normalization** -- empty string or invalid date in `snooze_until` is coerced to null before save. Source: `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts:69-87`
7. **Activity auto-creation on completion** -- completing a customer-facing task (Call, Email, Meeting, Demo) that is linked to a contact, opportunity, or organization automatically creates a corresponding activity record. Failure is non-blocking (logged, does not prevent task completion). Source: `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts:93-161`
8. **Computed fields stripped before write** -- view-only fields (`contact_name`, `assignee_name`, etc.) are stripped by the lifecycle callback before any database write. Source: `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts:26-36`
9. **Default priority** -- new tasks default to `priority = "medium"` and `completed = false`. Source: `src/atomic-crm/validation/task.ts:122-126`
10. **STI filter on read** -- all list and reference reads automatically inject `activity_type = 'task'` filter so tasks never surface non-task activity rows. Source: `src/atomic-crm/providers/supabase/handlers/tasksHandler.ts:131-138`
11. **creator_id auto-set** -- `created_by` is excluded from create schema; set by DB trigger, not by client. Source: `src/atomic-crm/validation/task.ts:85-91`

---

## 4. Enums

- **`taskTypeSchema`**: `"Call"` | `"Email"` | `"Meeting"` | `"Follow-up"` | `"Demo"` | `"Proposal"` | `"Other"` -- Source: `src/atomic-crm/validation/task.ts:17-25`
- **`priorityLevelSchema`**: `"low"` | `"medium"` | `"high"` | `"critical"` -- Source: `src/atomic-crm/validation/task.ts:27`

**Note:** Task types are also surfaced at runtime via `ConfigurationContext.taskTypes`, allowing the UI to display dynamic choices. The Zod enum is the authoritative validation boundary.

---

## 5. CRUD Operations

| Operation | Handler Pattern | Notes |
|-----------|----------------|-------|
| List | `activities` table, filtered `activity_type = 'task'` | `title` sort field mapped to `subject` |
| GetOne | `activities` base table | Maps `subject` → `title` on response |
| GetMany | `activities` base table | Maps `subject` → `title` on each record |
| GetManyReference | `activities` table, filtered `activity_type = 'task'` | Used by related entity tabs |
| Create | `activities` base table | Sets `activity_type = 'task'`; maps `title` → `subject` |
| Update | `activities` base table | Maps `title` → `subject`; strips computed fields |
| Delete | Soft delete | Sets `deleted_at` via lifecycle callback |

**Quick Add:** `AddTask` component (`src/atomic-crm/tasks/AddTask.tsx`) provides a dialog-based inline task creation triggered from contact context. Defaults `sales_id` to current user identity and `contact_id` from context record. Updates `contact.last_seen` as a side effect on success.

**Wrapper chain:** `baseProvider (activities) → tasksHandler (STI filter) → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging`

---

## 6. UI Views

- **TaskList** -- Datagrid or list with filter chip bar; filters by due date range, status, priority, type, and assigned user
- **TaskCreate** -- Full create form
- **TaskEdit** -- Edit form with all fields; tabbed if slide-over is open
- **TaskSlideOver** -- 40vw slide-over with view/edit mode toggle; includes inline completion checkbox, priority badge, snooze indicator, and schedule section
- **AddTask** -- Compact dialog for quick-adding a task from contact or global context; supports chip and icon display modes
- **TaskKanbanPanel** (Dashboard) -- Tasks grouped by due-date bucket (Overdue, Today, This Week, Later) in a kanban-style column layout on the main dashboard

### Key Filter Presets

| Filter | Purpose |
|--------|---------|
| `due_date@lt` (today) | "Overdue" preset used by KPI summary row |
| `completed = false` | Default incomplete tasks view |
| `priority` (multiselect) | Filter by low / medium / high / critical |
| `sales_id` | Filter by assigned rep (managers only) |

---

## 7. Related Entities

| Relationship | Type | Entity |
|-------------|------|--------|
| `sales_id` | N:1 (required) | sales (assigned rep) |
| `created_by` | N:1 (audit) | sales (creator) |
| `contact_id` | N:1 (optional) | contacts |
| `opportunity_id` | N:1 (optional) | opportunities |
| `organization_id` | N:1 (optional) | organizations |
| `related_task_id` | N:1 self-ref (optional) | tasks (follow-up chain) |
| `priority_tasks` | read-only view | dashboard summary; adds `customer_name`, `principal_name` |

---

## 8. Open Questions

- Should tasks require at least one entity link (contact, opportunity, or organization), or should standalone/admin tasks without a customer link remain supported?
- Is the snooze feature surfaced in the task list UI with a preset filter, or only visible in the slide-over detail panel?
- Should the `related_task_id` self-referential field support a UI-visible follow-up task chain, or is it currently write-only from the activity auto-creation callback?
- Are `taskTypes` in `ConfigurationContext` fully admin-configurable at runtime, or are they seeded from the `taskTypeSchema` Zod enum and not yet editable?
