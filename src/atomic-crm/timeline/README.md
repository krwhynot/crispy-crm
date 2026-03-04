# Timeline Module

Shared chronological activity feed for Crispy CRM. Renders a unified list of activities, tasks, and notes for a given contact, organization, or opportunity. Used inside slide-over panels across all three entity views. Bugs here affect every entity simultaneously.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 2 |
| Test Project | None (no test files) |
| Dependents | 5 (consumed by activities module) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `UnifiedTimeline.tsx` | Paginated feed of activities, tasks, and notes; accepts `contactId`, `organizationId`, `opportunityId` props |
| `TimelineEntry.tsx` | Renders a single entry with type icon, badge, creator/assignee reference, and deep links |
| `index.ts` | Barrel re-exports `UnifiedTimeline` and `TimelineEntry` |

## Dependencies

### Internal References
- `src/atomic-crm/utils` — `ucFirst` and `parseDateSafely` helpers
- `src/atomic-crm/providers/supabase/handlers/timelineHandler.ts` — read-only `getList` handler for the `entity_timeline` DB view

### npm Packages
- `ra-core` ^5.10.0 — `useGetList`, `RecordContextProvider`
- `react-admin` ^5.10.0 — `ReferenceField`, `TextField`
- `date-fns` ^4.1.0 — date formatting
- `lucide-react` ^0.542.0 — activity-type icons

### External Integrations
None.

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Activity Timeline | Timeline | 0.90 |

## Data Flow

- DB view: `entity_timeline` — unions `activities` and `tasks` with a common `entry_type` discriminator column. Soft-deleted records are excluded at the view level.
- Provider: `timelineHandler.ts` — read-only; only `getList` is implemented. All other operations throw `HttpError`.
- Filters: `UnifiedTimeline` builds OR conditions across `contact_id`, `organization_id`, `opportunity_id` using a `$or` filter that `dataProviderUtils.transformOrFilter()` converts to the `@or` PostgREST format.
- Stale time: 5 minutes, with `refetchOnWindowFocus: true`.

## Common Modification Patterns

To add a new `entry_type` (for example `note`), add the new subtype to the `getIcon` switch in `TimelineEntry.tsx` and update the `TimelineEntryData` union type in both `UnifiedTimeline.tsx` and `TimelineEntry.tsx`. The `entity_timeline` DB view must be updated in `supabase/migrations/` first — that is a Phase 3 schema change requiring `supabase db push --dry-run` validation before deployment. To add an entity scope (for example `taskId`), add a prop to `UnifiedTimelineProps`, push a condition onto `orConditions`, and update the page-reset `useEffect` dependencies.

## Guardrails

- `src/atomic-crm/providers/supabase/handlers/timelineHandler.ts` — handler directly imports `supabase`; do not add write operations without a validation wrapper per PRV-003.
- This module has **no tests**. Rendering regressions in `TimelineEntry.tsx` break activity display on contacts, organizations, and opportunities simultaneously. Add tests under `__tests__/` using `renderWithAdminContext` before making structural changes.
- The `entity_timeline` DB view is the single source of truth; avoid replicating aggregation logic in JavaScript (DB-002).

## Related

- Full audit report: `docs/audit/`
- Activities module: `src/atomic-crm/activities/`
- Provider handler: `src/atomic-crm/providers/supabase/handlers/timelineHandler.ts`
