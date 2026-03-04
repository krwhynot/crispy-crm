# Activities Module

Activity logging for Crispy CRM. Sales reps use this module to record every touchpoint with contacts, organizations, and opportunities — calls, emails, samples, meetings, and twelve other interaction types. Activities feed the dashboard activity feed, the Weekly Activity Summary report, and the entity timeline shown across contacts, organizations, and opportunities. This module is directly tied to the 10+ activities/week/principal KPI.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 2 |
| DB Table | `activities` (STI — also stores tasks) |
| Dependents | 1 (`timeline`) |

## Key Components

| File | Purpose |
|------|---------|
| `ActivityList.tsx` | List view with `PremiumDatagrid`, filter chip bar, and slide-over |
| `ActivityEdit.tsx` | Edit form wrapping `ActivityInputs` and `ActivitySinglePage` |
| `ActivityShow.tsx` | Read-only single activity view |
| `ActivitySlideOver.tsx` | 40vw slide-over panel with Details and Related tabs |
| `ActivitySinglePage.tsx` | Core form sections: Activity Details, Relationships, Follow-up, Outcome |
| `ActivityInputs.tsx` | Shared form input set reused across create and edit |
| `ActivityListFilter.tsx` | Filter sidebar wired to `activityFilterConfig.ts` |
| `ActivityTimelineEntry.tsx` | Single entry renderer for `UnifiedTimeline` |
| `activityDraftSchema.ts` | Zod schema for localStorage draft persistence |
| `activityFilterConfig.ts` | Filter definitions: type, sample_status, date range, sentiment, created_by |
| `constants.ts` | `ACTIVITY_PAGE_SIZE = 50` used across entity tabs |
| `resource.tsx` | React Admin resource config with error boundaries |
| `slideOverTabs/ActivityDetailsTab.tsx` | Details tab inside the slide-over |
| `slideOverTabs/ActivityRelatedTab.tsx` | Related entities tab inside the slide-over |

## Dependencies

### Internal Modules
- `constants` — shared enum/label lookups
- `layout` — `ListPageLayout` and layout primitives
- `types` — `ActivityRecord`, `Contact`, `Opportunity`, `Organization`, `Sale`
- `utils` — formatting helpers, `listPatterns`, `ucFirst`
- `validation` — `INTERACTION_TYPE_OPTIONS`, `SAMPLE_STATUS_OPTIONS`, activity Zod schemas

### Provider and Validation
- Handler: `src/atomic-crm/providers/supabase/handlers/activitiesHandler.ts`
- Schemas: `src/atomic-crm/validation/activities/schemas.ts`, `types.ts`, `constants.ts`
- Wrapper chain: `baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging`

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Activity Logging | Activities | 95% |

## STI Pattern — activities table

The `activities` table uses Single Table Inheritance. Rows with `activity_type = "activity"` are logged interactions (this module). Rows with `activity_type = "task"` are planned tasks (Tasks module). Do not add task-only fields to the activity-side UI and vice versa.

## Business Rules to Know

- `subject` is required; at least one of `contact_id` or `organization_id` is required
- `sample` activities require `sample_status`; active sample statuses (`sent`, `received`, `feedback_pending`) require `follow_up_required = true` and a `follow_up_date`
- `activity_date` cannot be set to a future date
- `description`, `outcome`, and `follow_up_notes` are HTML-sanitized at the schema boundary
- Draft state is persisted to `localStorage` via `activityDraftSchema` and `activityDraftStorage.ts`

## Common Modification Patterns

New interaction types go in `src/atomic-crm/validation/activities/types.ts` (`interactionTypeSchema`) and in `INTERACTION_TYPE_OPTIONS`. Any new field that is conditional on interaction type should use `useWatch({ name: "type" })` in `ActivitySinglePage.tsx` — see the `isSampleActivity` branch as a reference. After schema changes, run `npx tsc --noEmit` and verify the handler wrapper chain still compiles cleanly; the validation schemas are applied at the provider boundary, not in the form itself.

## Guardrails

- `src/atomic-crm/providers/supabase/handlers/activitiesHandler.ts` — Caution Zone; changes affect all activity reads and writes
- `src/atomic-crm/validation/activities/schemas.ts` — cross-field refinements (sample follow-up rules); changes cascade to provider validation
- `activityDraftSchema.ts` — uses `z.strictObject`; adding fields here requires matching changes in `activityDraftStorage.ts`
- RLS on the `activities` table governs which reps can read or edit other reps' records; verify with `CMD-006` after any migration touching this table
- The `archive_opportunity_with_relations` RPC soft-deletes activities atomically; do not add hard-delete paths

## Related

- BRD: `docs/brd/activities.md`
- Full audit report: `docs/audit/baseline/`
- Tasks module (task side of the STI table): `src/atomic-crm/tasks/`
- Timeline module (renders activities chronologically): `src/atomic-crm/timeline/`
- Opportunities module (cascade archive writes an automatic activity): `src/atomic-crm/opportunities/`
