# ADR-004: Validation at Provider Boundary

**Status:** Accepted
**Date:** 2025-10-01
**Deciders:** Engineering team

## Context

React Admin forms can validate client-side (via `resolver`), but this leaves the data provider vulnerable to invalid payloads from programmatic calls, bulk operations, or future API consumers. The question is where to place the canonical validation gate.

## Decision

Place **Zod schema validation at the provider boundary** (data access layer), not at the form level. The `withValidation` wrapper validates all write operations (`create`, `update`) against registered schemas before they reach Supabase.

### Implementation:

1. **Schema registry:** `ValidationService` maps resource names to Zod schemas. Each resource registers create and update schemas.
2. **Provider wrapper:** `withValidation(baseProvider)` intercepts write calls, runs `schema.parse(data)`, and throws `ValidationError` on failure before the DB call executes.
3. **Form resolver:** Forms use `createFormResolver(schema)` (not raw `zodResolver`) for client-side UX feedback, but this is a convenience layer — the provider is the enforcement gate.
4. **Schema conventions:**
   - Create schemas use `z.strictObject()` to reject unknown keys
   - Update schemas use `.partial()` for partial updates
   - `z.coerce` for form-originated scalars (numbers, dates)
   - `.max()` constraints on all string fields

### Wrapper chain position:

```
withErrorLogging(
  withLifecycleCallbacks(
    withValidation(baseProvider),  // validates before any callback or DB write
    [callbacks]
  )
)
```

Validation sits inside error logging (so validation errors get logged) and inside lifecycle callbacks (so computed fields are stripped before validation runs).

## Consequences

### Positive

- Single enforcement point — all writes validated regardless of caller (form, bulk import, programmatic)
- Schema is source of truth — TypeScript types derived via `z.infer<typeof schema>`
- Strict create schemas prevent mass-assignment attacks (unknown keys rejected)
- Validation errors are structured and loggable via the outer error wrapper

### Negative

- Two validation passes on form submit (resolver + provider) — acceptable for data integrity
- Schema must stay in sync with database columns — drift causes false rejections
- Provider-level errors need mapping back to form fields for UX (handled by `createFormResolver`)

### Neutral

- Forms still benefit from client-side validation for instant UX feedback
- The pattern is mechanical: new resource = new schema + register in `ValidationService`

## Alternatives Considered

### Option A: Form-Only Validation

Validate exclusively in the form resolver. Rejected: leaves provider unguarded against non-form callers, bulk operations, and direct `dataProvider.create()` calls from custom code.

### Option B: Database-Only Constraints

Rely on PostgreSQL CHECK constraints and NOT NULL. Rejected: error messages are opaque (`violates check constraint "chk_..."`) and can't express business rules like "email must be unique across active records."

### Option C: Middleware Validation Library

Use a dedicated validation middleware (e.g., `express-validator` style). Rejected: unnecessary dependency when Zod + a thin wrapper provides the same guarantee within the existing provider chain.

## References

- `src/atomic-crm/providers/supabase/wrappers/withValidation.ts`
- `src/atomic-crm/validation/` (per-entity schemas)
- `.claude/rules/PROVIDER_RULES.md` (PRV-003, PRV-004)
- `.claude/rules/DOMAIN_INTEGRITY.md` (DOM-001, DOM-004, DOM-005)
- `.claude/rules/CORE_CONSTRAINTS.md` (CORE-004, CORE-005, CORE-007)
