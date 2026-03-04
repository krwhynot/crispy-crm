# Opportunities Module

The highest-coupling feature module in Crispy CRM. Manages the full sales pipeline for MFB, tracking deals from initial lead through close. Each opportunity links a customer organization to a principal (manufacturer) and an optional distributor. The module drives pipeline velocity metrics on the dashboard and is the primary workspace for sales reps logging activity.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | React 19 + React Admin 5 |
| Risk Level | High |
| Phase | 3 |
| LOC / Files | ~26,700 LOC across 152 files |
| Fan-in / Fan-out | 19 dependents / 10 dependencies |
| Test Coverage | Full (`__tests__/` — 40+ test files) |
| ADRs | ADR-001 (provider pattern), ADR-002 (soft-delete) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `OpportunityList.tsx` | List view with Kanban / row-view switcher |
| `OpportunityEdit.tsx` | Tabbed edit form with optimistic-conflict handling |
| `OpportunitySlideOver.tsx` | 40vw slide-over for quick edits |
| `CloseOpportunityModal.tsx` | Enforces win/loss reason + close-date requirements |
| `kanban/OpportunityListContent.tsx` | Kanban board root — drag-and-drop context |
| `kanban/OpportunityCard.tsx` | Draggable card with `StageStatusDot` indicator |
| `kanban/OpportunityColumn.tsx` | Per-stage column with droppable area |
| `QuickAddDialog.tsx` | Inline create entry point (replaces `/create` route) |
| `SimilarOpportunitiesDialog.tsx` | Duplicate detection UI |
| `ProductsTable.tsx` | Product line management with diff tracking |
| `ActivitiesList.tsx` | Activity timeline embedded in edit/show |
| `OpportunityArchivedList.tsx` | Soft-deleted opportunity archive |
| `BulkActionsToolbar.tsx` | Bulk stage change and delete |
| `resource.tsx` | React Admin resource config — lazy loads list and edit |

## Pipeline Stages

```
new_lead → initial_outreach → sample_visit_offered → feedback_logged → demo_scheduled → closed_won
                                                                                       ↘ closed_lost
```

Stage transitions are bidirectional among active stages. Closed → closed transitions are blocked; reopen to active first. Close validation (win/loss reason + actual close date) is enforced in `CloseOpportunityModal.tsx` and also at DB level via CHECK constraints.

## Dependencies

### Project References
- `src/atomic-crm/providers/supabase/` — all DB access
- `src/atomic-crm/validation/opportunities.ts` — Zod schemas
- `src/atomic-crm/organizations/` — org combobox and info card
- `src/atomic-crm/contacts/` — contact linking
- `src/atomic-crm/tasks/` — next task badge
- `src/atomic-crm/hooks/` — shared hooks
- `src/atomic-crm/queryKeys.ts` — `opportunityKeys`, `dashboardKeys`
- `src/components/ra-wrappers/` — Tier 2 UI wrappers
- `src/components/ui/` — Tier 1 presentational components

### Key npm Packages
- `@dnd-kit/core`, `@dnd-kit/sortable` — drag-and-drop Kanban
- `react-hook-form` + `zod` via `createFormResolver` — form validation
- `@tanstack/react-query` — cache invalidation after mutations

## Data Flow

- **List reads:** `opportunities_summary` view (products, task counts, activity dates precomputed)
- **Writes:** `opportunities` base table
- **Product sync:** `sync_opportunity_with_products` RPC via `OpportunitiesService`
- **Soft delete:** `archive_opportunity_with_relations` RPC (cascades to participants, contacts, notes)
- **Provider handler:** `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts`
- **Wrapper chain:** `baseProvider → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging`

### Computed Fields (View-Only, Stripped Before Write)
`customer_organization_name`, `principal_organization_name`, `days_in_stage`, `last_activity_date`, `pending_task_count`, `overdue_task_count`, `next_task_*`, `products` (JSONB), `search_tsv`

## Common Modification Patterns

New fields go into `src/atomic-crm/validation/opportunities.ts` first (Zod schema), then `OpportunityInputs.tsx` for reusable inputs, then the relevant tab in `OpportunityEdit.tsx` or `OpportunityCompactForm.tsx`. If the field is view-only or DB-computed, add it to the `COMPUTED_FIELDS` list in `opportunitiesHandler.ts` so it is stripped before writes.

New stage-level behavior (colors, labels, health thresholds) belongs in `constants/stage-config.ts` and `constants/stage-health.ts` — not inline in components. Kanban column order derives from the `OPPORTUNITY_STAGES` array in `constants/stage-enums.ts`.

After any change, run the stage-transition integration tests (`__tests__/stageChange*.integration.test.ts`) and the QuickAdd integration test (`__tests__/QuickAdd.integration.test.tsx`) as these cover the highest-risk paths.

## Guardrails

- **Human review required** before merging changes that touch stage-transition logic, close validation, or the `archive_opportunity_with_relations` RPC.
- **Duplicate detection** (`useExactDuplicateCheck.ts`, `useSimilarOpportunityCheck.ts`) must remain active on create — do not bypass without a documented exception.
- **Product sync** runs through `OpportunitiesService`, not direct Supabase calls — respect `CORE-001`.
- **Soft-delete cascade** is RPC-driven; do not replace with client-side deletes on child tables.
- **Optimistic locking** (`version` field) is in place — conflict handling in `OpportunityEdit.tsx` must not be removed.
- RLS policies cover `opportunities`, `opportunity_participants`, `opportunity_contacts`, and `opportunity_products`; validate with `CMD-006` after any migration touching these tables.

## Related

- BRD: `docs/brd/opportunities.md`
- PRD: `docs/prd/opportunities/PRD-opportunities.md`
- Full audit report: `docs/audit/`
- Validation schemas: `src/atomic-crm/validation/opportunities.ts`
- Provider handler: `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts`
