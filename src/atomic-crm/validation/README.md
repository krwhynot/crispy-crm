# Validation Module

Centralized Zod schemas for all domain entities in Crispy CRM. This module is the single source of truth for TypeScript types (via `z.infer`) and for all write validation enforced at the provider API boundary. It is the most-depended-upon module in the codebase — 91 internal consumers — so changes here cascade broadly.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | Zod 4 |
| Risk Level | High |
| Phase | 2 |
| Test Project | `__tests__/` (partial coverage) |
| Dependents | 91 (activities, components, contacts, dashboard, filters, opportunities, organizations, products, providers, reports, sales, tasks) |

## Key Files

| File / Directory | Purpose |
|------------------|---------|
| `index.ts` | Barrel export; re-exports all schemas and `ZodError` |
| `contacts/contacts-core.ts` | Contact base, create, update schemas and `validateContactForm` |
| `contacts/contacts-communication.ts` | Email and phone entry schemas |
| `contacts/contacts-import.ts` | CSV import row schema |
| `opportunities/opportunities-core.ts` | Opportunity base schema, stage/win/loss enums, `validateOpportunityForm` |
| `opportunities/opportunities-junctions.ts` | Junction-table schemas for opportunity relationships |
| `opportunities/opportunities-operations.ts` | Operation-specific validation (stage transitions, close flows) |
| `activities/schemas.ts` | Activity create/update schemas |
| `shared/ra-file.ts` | `raFileSchema` for React Admin file upload fields |
| `utils.ts` | `zodErrorToReactAdminError`, `formatZodErrors`, `getFriendlyErrorMessage` |
| `constants.ts` | Shared string length limits and regex constants |
| `filters.ts` | Filter payload schemas used by the advanced filter system |
| `sales.ts` | Sales rep schemas |
| `task.ts` | Task create/update schemas |

## Schema Conventions

All schemas in this module follow four project-wide conventions enforced by `DOM-004` – `DOM-007`:

- **`z.strictObject()`** for create payloads — unknown keys are rejected at the provider boundary.
- **`z.coerce`** for non-string scalars — e.g., `z.coerce.number()` for FK IDs arriving as strings from React Admin forms.
- **`.max()`** on every string field — prevents oversized payloads reaching the database.
- **`z.enum()`** for allowlists — stage values, win/loss reasons, priority, and lead source all use `z.enum` so out-of-range values are caught before DB writes.

TypeScript types are always derived via `z.infer`:

```ts
// Correct — type is derived from schema (DOM-003)
export type Opportunity = z.infer<typeof opportunitySchema>;

// Disallowed — parallel manual interface
interface Opportunity { ... }
```

Validation functions follow the naming convention `validateCreate[Resource]` / `validateUpdate[Resource]` and are called by `ValidationService` inside the provider layer, never from form components.

## Common Modification Patterns

When adding a field to a database table, add it to the corresponding base schema first (`contactBaseSchema`, `opportunityBaseSchema`, etc.), mark it `.optional()` if it is nullable, and use `z.coerce` if it arrives from a form as a string. If the field is writable on create, add it to the create schema's `.omit()` exclusion list only if it must be stripped (e.g., computed fields). Run `npx tsc --noEmit` after every schema change — type errors in 91 consumers will surface immediately.

When removing or renaming a field, search for all `z.infer` usages of the affected type before committing; the TypeScript compiler will catch most breakage but runtime narrowing in provider handlers should be verified manually.

## Guardrails

Per `CORE-004` (DOM-001) this module is the authoritative home for all Zod schemas. Do not define entity schemas inline in feature components or provider handlers.

- **Phase 2 change gate** — validation schema changes require tech lead review and two-developer code review before merge (see `docs/audit/baseline/risk-assessment.json` Phase 2 exit criteria).
- **Fan-in blast radius** — 91 modules import from this directory. A breaking schema change (field removal, type narrowing, enum value rename) will fail TypeScript compilation across the entire codebase. Always check with `npx tsc --noEmit` before opening a PR.
- **`strictObject` on creates** — do not relax `z.strictObject` to `z.object` on create schemas without a documented reason; `CORE-005` requires unknown-key rejection at the API boundary.
- **No direct Zod imports in feature components** — UI components must import `ZodError` from `src/atomic-crm/validation` (re-exported in `index.ts`), not directly from `zod`.

## Related

- Full audit report: `docs/audit/baseline/risk-assessment.json` (validation entry)
- Dependency fan-in detail: `docs/audit/baseline/dependency-map.json`
- ADR-004: validation-at-provider-boundary
- Provider layer that calls these schemas: `src/atomic-crm/providers/supabase/composedDataProvider.ts`
- `ValidationService`: `src/atomic-crm/services/`
