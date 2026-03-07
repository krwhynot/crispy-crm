# ADR-005: Opportunities Pipeline Architecture

**Status:** Proposed
**Date:** 2026-03-04
**Deciders:** Engineering team
**Feature:** Opportunities (feat-opp-001)

## Context

Opportunities is the highest-coupling feature in Crispy CRM (fan_in=19, 134 files referencing `opportunity_id`). It models MFB's sales pipeline from lead qualification through close, with a Kanban board as the primary UI. Several architectural decisions were made that warrant documentation:

1. The pipeline uses a **7-stage model** (reduced from 8 after removing `awaiting_response` per PRD v1.18)
2. Stage transitions need a **drag-and-drop Kanban** with special handling for close stages
3. Win/loss reasons require **three-layer enforcement** (DB constraints, triggers, Zod schemas)
4. The opportunity's high coupling means **cascade delete** cannot use simple `deleted_at` updates
5. Stage health ("rotting") detection drives **visual urgency** in the Kanban board

## Decision

### 7-Stage Pipeline with Fail-Fast Stage Validation

Adopt a 7-stage pipeline defined as a PostgreSQL enum `opportunity_stage`:

```
new_lead → initial_outreach → sample_visit_offered → feedback_logged → demo_scheduled → closed_won | closed_lost
```

The canonical type `OpportunityStageValue` lives in `src/atomic-crm/constants/stage-enums.ts` (not in validation) to break circular import cycles between `opportunities/`, `providers/supabase/`, and `utils/`. A mirrored `z.enum()` in validation provides runtime checking.

**Transition policy:** Any active-to-active jump is allowed (forward or backward). Active-to-closed is allowed. Closed-to-active is allowed (reopen clears all close metadata). Closed-to-closed is disallowed — must reopen first.

### Kanban Board with @dnd-kit and Modal-Gated Close

Use `@dnd-kit` (not `react-beautiful-dnd`) for drag-and-drop with a custom collision detection strategy that combines `pointerWithin`, `rectIntersection`, and `closestCorners`, prioritizing column (stage) collisions over card collisions.

**Optimistic UI:** `handleDragEnd` stores previous state, applies an optimistic move immediately, then calls the API. On error, it reverts to the snapshot.

**Close-stage gate:** When the destination column is `closed_won` or `closed_lost`, the drag handler does NOT call the API immediately. Instead it sets `pendingCloseData` and opens `CloseOpportunityModal`, which collects `win_reason`/`loss_reason`/`actual_close_date`/`close_reason_notes` before the update fires. This prevents accidental closes without required metadata.

**Stage health:** Per-stage rotting thresholds (`new_lead=7d`, `initial_outreach=10d`, `sample_visit_offered=14d`, `feedback_logged=7d`, `demo_scheduled=5d`) drive card coloring (healthy → warning at 75% → rotting → expired). Cards sort red-first within each column. Invalid stage values throw immediately (fail-fast) to detect data corruption.

### Three-Layer Win/Loss Enforcement (Defense in Depth)

1. **DB CHECK constraints** (`opportunities_closed_won_check`, `opportunities_closed_lost_check`) — single source of truth
2. **DB trigger** (`trg_validate_opportunity_closure`) — BEFORE UPDATE, raises exception with detail for the application to surface
3. **Zod refinements** on `updateOpportunitySchema` and `closeOpportunitySchema` — UX-friendly field-level error messages

When `win_reason === "other"` or `loss_reason === "other"`, `close_reason_notes` becomes required. This rule is app-layer only (not a DB constraint) by design — notes are UX convenience, not data integrity.

### Cascade Archive via RPC (Not Simple Soft Delete)

Standard `supportsSoftDelete: false` on the handler. Deletes route through `archive_opportunity_with_relations` RPC, which archives the opportunity AND its related activities, notes, tasks, and participants atomically in a single transaction. This is necessary because the cascade requirement cannot be met by a simple `deleted_at` update on the opportunities table alone.

### Summary View for Reads, Base Table for Writes

`opportunities_summary` view (with `security_invoker=on`) JOINs org names, primary contact name, and a `jsonb_agg` of products. All list/getOne/getMany reads use this view; writes target the base `opportunities` table. Computed fields (14 total including `days_in_stage`, `pending_task_count`, `overdue_task_count`) are stripped before validation via `TYPED_COMPUTED_FIELDS`.

## Consequences

### Positive

- 7-stage model matches MFB's real sales process; stage skip flexibility reduces friction
- Modal-gated close prevents accidental closes and ensures win/loss data completeness
- Three-layer validation catches errors at every boundary (DB, trigger, app)
- Cascade RPC guarantees atomic archive of all related records
- Stage health visualization drives rep urgency without manual manager intervention

### Negative

- Highest coupling in the codebase (fan_in=19) — changes to stage definitions ripple across dashboard, reports, contacts, organizations, tasks, notes, and timeline
- Custom collision detection adds complexity to the Kanban board
- Optimistic UI with rollback requires careful state management
- Cascade RPC is opaque from the application layer — debugging requires reading the SQL function

### Neutral

- `contact_ids bigint[]` denormalized array coexists with `opportunity_contacts` and `opportunity_participants` junction tables — the ownership contract between the three contact linkage mechanisms is not fully resolved
- `probability` field exists in schema but has no UI inputs or triggers — likely a future field
- `status` field (`active`, `on_hold`, `nurturing`, `stalled`, `expired`) is system/trigger managed but lifecycle of non-active statuses is not fully surfaced in application code

## Alternatives Considered

### Option A: Linear Stage Progression Only

Force sequential stage advancement (no skipping). Rejected: MFB reps frequently skip stages when a principal is already warm (e.g., direct to `demo_scheduled` from `new_lead`).

### Option B: react-beautiful-dnd for Kanban

The more popular DnD library. Rejected: `@dnd-kit` provides pluggable collision detection strategies needed for column-priority dropping, better accessibility announcements, and is actively maintained.

### Option C: Application-Only Win/Loss Validation

Enforce win/loss reasons only in Zod schemas. Rejected: DB constraints are the single source of truth — if a direct SQL update bypasses the app layer, data integrity must still hold.

### Option D: Simple Soft Delete (No Cascade RPC)

Set `deleted_at` on the opportunity only, let related records become orphans. Rejected: orphaned tasks and activities would appear in dashboards and reports without their parent context.

## References

- `src/atomic-crm/constants/stage-enums.ts` — canonical stage type
- `src/atomic-crm/opportunities/constants/` — stage config, health thresholds, MFB phase mapping
- `src/atomic-crm/validation/opportunities/` — Zod schemas and transition policy
- `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx` — Kanban board implementation
- `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts` — provider composition
- `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts` — lifecycle callbacks
- `supabase/migrations/20260214003329_remote_schema.sql` — DB schema, views, triggers, CHECK constraints
- `.claude/rules/PROVIDER_RULES.md` (PRV-001 through PRV-014)
- `docs/prd/opportunities/PRD-opportunities.md`
- `docs/brd/opportunities.md`
