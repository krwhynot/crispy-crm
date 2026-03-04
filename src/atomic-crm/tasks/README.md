# Tasks Module

Task management for Crispy CRM sales representatives. Tasks are discrete action items — follow-up calls, emails, demos, proposals — assigned to a rep and optionally linked to a contact, opportunity, or organization. Completing a customer-facing task (Call, Email, Meeting, Demo) automatically creates a corresponding activity record. The dashboard surfaces tasks in a kanban panel grouped by due-date bucket (Overdue, Today, This Week, Later).

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 2 |
| Test Project | None |
| Dependents | 3 — `dashboard` (kanban), `contacts` (AddTask), `opportunities` (related tasks tab) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `TaskList.tsx` | List view with `PremiumDatagrid`, inline completion checkbox, and slide-over |
| `TaskCreate.tsx` | Full create form |
| `TaskEdit.tsx` | Edit form for all fields |
| `TaskSlideOver.tsx` | 40vw slide-over with view/edit toggle and breadcrumb |
| `TaskSlideOverDetailsTab.tsx` | Details tab content: schedule, priority, snooze, entity links |
| `AddTask.tsx` | Compact dialog for quick-adding a task from contact or global context |
| `TaskCompactForm.tsx` | Minimal inline form for quick-add scenarios |
| `TaskListFilter.tsx` | Filter chip bar wired to `TASK_FILTER_CONFIG` |
| `TasksDatagridHeader.tsx` | Filterable column header components for title, priority, type |
| `TaskActionMenu.tsx` | Row-level action menu (view, edit, delete) |
| `TaskEmpty.tsx` | Empty-state illustration shown when no tasks match filters |
| `constants.ts` | `TASK_PRIORITY_CHOICES` derived from `priorityLevelSchema` (DOM-006) |
| `taskFilterConfig.ts` | Centralized filter preset configuration |
| `taskRoutes.ts` | Route path constants |
| `types.ts` | `Task` TypeScript type (`z.infer` from validation schema) |
| `hooks/index.ts` | Task-scoped hooks barrel |
| `resource.tsx` | React Admin resource config exporting `TaskListView`, `TaskEditView`, `TaskCreateView` |

## Dependencies

### Internal Modules
- `src/atomic-crm/validation/task.ts` — Zod schema and TypeScript type source
- `src/atomic-crm/constants/` — shared pipeline constants
- `src/atomic-crm/queryKeys.ts` — `taskKeys`, `entityTimelineKeys` for cache invalidation
- `src/atomic-crm/utils/` — formatting helpers
- `src/atomic-crm/components/` — shared CRM UI components

### Provider Layer
- Handler: `src/atomic-crm/providers/supabase/handlers/tasksHandler.ts`
- Callbacks: `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts`
- Wrapper chain: `baseProvider (activities) → tasksHandler (STI filter) → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging`

### External Integrations
None specific to this module. CSV export uses `jsonexport` (prod dep).

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Task Management | Tasks | 0.90 |

## Storage Pattern

Tasks use **Single Table Inheritance** — they are stored in the `activities` table filtered by `activity_type = 'task'`. The `tasksHandler.ts` translation layer:

- Injects `activity_type = 'task'` on all reads
- Maps `title` ↔ `subject` column on every read/write
- Maps task type labels to interaction type enums

List reads use the `priority_tasks` DB view (adds `customer_name`, `principal_name` for the dashboard kanban). Writes target the `activities` base table.

## Common Modification Patterns

To add a new task field: add it to `src/atomic-crm/validation/task.ts`, update `COMPUTED_FIELDS` in `tasksCallbacks.ts` if it is view-only, add the field to `TaskInputs.tsx`, and verify `tasksHandler.ts` does not need a new column mapping. To add a new filter: extend `taskFilterConfig.ts` and add the corresponding input to `TaskListFilter.tsx`. The `TaskSlideOver` uses a single `details` tab — new sections go into `TaskSlideOverDetailsTab.tsx`.

After any change run `npx tsc --noEmit`, `npm run lint`, and the task test suite in `__tests__/`.

## Guardrails

- `src/atomic-crm/providers/supabase/handlers/tasksHandler.ts` — changing the STI filter or field mapping breaks all task reads and writes; requires human review
- `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts` — activity auto-creation on completion is a non-blocking side-effect; changes here affect activity log integrity
- `src/atomic-crm/providers/supabase/composedDataProvider.ts` — god class routing hub; do not modify directly (Caution Zone per CLAUDE.md)
- RLS on `activities` table governs task visibility by role; policy changes require `CMD-006` audit and pgTAP verification

## Related

- BRD: `docs/brd/tasks.md`
- Audit report: `docs/audit/baseline/`
- Activities module — auto-created records on task completion
- Dashboard module — `TaskKanbanPanel` consumes `priority_tasks` view
