# ADR-002: Soft Delete Convention

**Status:** Accepted
**Date:** 2025-10-01
**Deciders:** Engineering team

## Context

The CRM manages long-lived business relationships (contacts, organizations, opportunities) where accidental deletion is costly and auditing requires historical visibility. Hard deletes break referential integrity across junction tables and prevent forensic analysis of lost-deal pipelines.

## Decision

Adopt **soft deletes via `deleted_at` timestamps** as the default deletion strategy. Every table with user-facing data gets a `deleted_at TIMESTAMPTZ DEFAULT NULL` column. Deletion sets this timestamp rather than removing rows.

### Implementation layers:

1. **Database:** RLS policies include `deleted_at IS NULL` in `USING` clauses for SELECT. Tables are listed in `SOFT_DELETE_RESOURCES` in `resources.ts`.
2. **Provider:** The `withSkipDelete` wrapper intercepts `delete` calls and converts them to `update({ deleted_at: now() })`.
3. **UI:** Standard `DeleteButton` triggers the provider delete path, which soft-deletes transparently.

### Exceptions (hard delete):

- `product_distributors` — junction table with composite keys, no audit requirement
- Temporary/scratch data tables explicitly documented

## Consequences

### Positive

- Accidental deletions are recoverable (admin can NULL the `deleted_at`)
- Audit trail preserved for compliance and pipeline analysis
- Referential integrity maintained — FKs never dangle
- Consistent pattern across all resources reduces cognitive load

### Negative

- Storage grows monotonically (soft-deleted rows accumulate)
- Every query must filter `deleted_at IS NULL` — missed filters leak deleted data
- Cascade behavior requires explicit SQL triggers rather than `ON DELETE CASCADE`

### Neutral

- `SOFT_DELETE_RESOURCES` array is the single source of truth for which resources participate

## Alternatives Considered

### Option A: Hard Deletes with Archive Table

Move deleted rows to `{table}_archive`. Rejected: doubles schema surface area, complicates restores, and archive tables drift from source schema on migrations.

### Option B: Status Enum (`active`/`deleted`)

Use a status column instead of timestamp. Rejected: loses the "when was it deleted" information, and boolean-like filtering on enums is less ergonomic in PostgREST.

## References

- `src/atomic-crm/providers/supabase/resources.ts` (`SOFT_DELETE_RESOURCES`)
- `src/atomic-crm/providers/supabase/wrappers/withSkipDelete.ts`
- `.claude/rules/DATABASE_LAYER.md` (DB-003, DB-004)
- `.claude/rules/CORE_CONSTRAINTS.md` (CORE-010)
