# PRD: Zod Validation Schemas

**Feature ID:** feat-val-001
**Domain:** Validation
**Status:** Reverse-Engineered
**Confidence:** 90%
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Linked Documents

- **BRD:** None — BRD recommended; run `/create-brd` to capture business context for this system-layer module
- **ADRs:** [docs/adr/004-validation-at-provider-boundary.md](../../adr/004-validation-at-provider-boundary.md)
- **Module:** `src/atomic-crm/validation`
- **Risk Level:** High
- **Phase Assignment:** 2

---

## Executive Summary

The Validation module is the single source of truth for all data shape contracts in Crispy CRM. It provides centralized Zod schemas that serve two purposes simultaneously: they define TypeScript types (via `z.infer`) for the entire codebase, and they enforce write validation at the provider boundary before any data reaches Supabase. With 91 internal consumers and 28+ schema files, this is the most-depended-upon module in the codebase. A breaking schema change cascades to every resource.

---

## Business Context

Crispy CRM's data integrity model relies on a single, consistent gate that validates all write operations — regardless of whether the write originates from a form, a bulk import, a programmatic `dataProvider.create()` call, or a future API consumer. This design is documented in ADR-004.

Prior to this design, the risk was that form-level-only validation would leave the data provider unguarded. PostgreSQL constraints alone produce opaque error messages that cannot be mapped back to specific form fields. The validation module resolves both concerns by placing Zod schema validation at the provider layer, where all callers converge, while still supporting client-side UX feedback through `createFormResolver`.

No BRD exists for this domain because it is a system-layer engineering concern rather than a directly user-visible feature. Business rules expressed here (required fields, enum allowlists, string length limits) trace back to domain-specific BRDs (contacts, opportunities, organizations) and the Engineering Constitution documented in `CLAUDE.md`.

---

## Goals

1. Provide a single, auditable definition of what shape each entity must have when written to the database.
2. Derive all TypeScript types from schema definitions so there is no drift between runtime validation and compile-time type checking.
3. Block invalid, oversized, or malformed payloads before they reach Supabase — regardless of caller.
4. Translate raw Zod errors into user-friendly messages that React Admin can surface on specific form fields.
5. Prevent mass-assignment attacks by rejecting unknown keys on create payloads.

---

## Architectural Constraints

### P0 — Must Never Be Violated

| ID | Constraint | Source | Verified |
|----|-----------|--------|---------|
| AC-P0-001 | All entity Zod schemas live exclusively in `src/atomic-crm/validation/`. Schemas must not be defined inline in feature components or provider handlers. | `src/atomic-crm/validation/README.md`, `CLAUDE.md` CORE-004, DOM-001 | Yes |
| AC-P0-002 | TypeScript types are derived from schemas via `z.infer<typeof schema>`. Parallel manual `interface` declarations for the same entity are banned. | `src/atomic-crm/validation/README.md`, DOM-003 | Yes |
| AC-P0-003 | Create-payload schemas use `z.strictObject()`. Relaxing this to `z.object()` without a documented exception violates CORE-005 (unknown-key rejection). | `src/atomic-crm/validation/contacts/contacts-core.ts` line 75, ADR-004 | Yes |
| AC-P0-004 | UI components must import `ZodError` from `src/atomic-crm/validation` (the barrel re-export), not directly from `zod`. | `src/atomic-crm/validation/index.ts` lines 18–21 | Yes |
| AC-P0-005 | Forms must use `createFormResolver(schema)`, not raw `zodResolver(schema)` from `@hookform/resolvers/zod`. | `CLAUDE.md` CORE-018, ADR-004 section 3 | Yes |
| AC-P0-006 | Validation schemas must not import from feature components or the React Admin layer. The dependency direction is one-way: features import from validation, never the reverse. | `src/atomic-crm/validation/index.ts`, CORE-001 | Yes |

### P1 — Required Unless Explicitly Documented Exception Exists

| ID | Constraint | Source | Verified |
|----|-----------|--------|---------|
| AC-P1-001 | Every string field in a schema includes a `.max()` constraint. This prevents oversized payloads reaching the database. | `src/atomic-crm/validation/constants.ts` `VALIDATION_LIMITS`, README.md | Yes |
| AC-P1-002 | Non-string scalar values from form origins (IDs, numbers, dates) use `z.coerce` to tolerate React Admin's string-to-type conversion. | `src/atomic-crm/validation/contacts/contacts-core.ts` e.g. `z.coerce.number()` for `sales_id`, DOM-007 | Yes |
| AC-P1-003 | Enumerated value fields (stage, priority, lead source, win/loss reason, activity type) use `z.enum()` allowlists, not `z.string()`. | `src/atomic-crm/validation/opportunities/opportunities-core.ts` lines 11–58 | Yes |
| AC-P1-004 | Update schemas use `.partial()` to permit partial-field updates. The chosen strategy (passthrough+partial) must be explicitly documented per DOM-005. | `src/atomic-crm/validation/contacts/contacts-core.ts` line 472 `updateContactSchema` | Yes |
| AC-P1-005 | Validation functions follow the naming convention `validateCreate[Resource]` / `validateUpdate[Resource]`. The only documented exceptions are `validateContactForm` (legacy) and `validateTaskForm` (dispatches internally). | `src/atomic-crm/validation/index.ts` PAT-01 comment | Yes |
| AC-P1-006 | Schema changes require `npx tsc --noEmit` to pass before a PR is opened. A breaking schema change (field removal, type narrowing, enum rename) will cause TypeScript errors across all 91 consumers. | `src/atomic-crm/validation/README.md` Guardrails section | Yes |
| AC-P1-007 | Validation schema changes in Phase 2 require tech lead review and two-developer code review before merge. | `src/atomic-crm/validation/README.md` Guardrails section, `docs/audit/baseline/risk-assessment.json` Phase 2 exit criteria | Yes |

### P2 — Strong Preference; Deviation Requires a Note in the PR

| ID | Constraint | Source | Verified |
|----|-----------|--------|---------|
| AC-P2-001 | Form defaults are derived from schema via `schema.partial().parse({})` to reduce drift between schema and form state (DOM-011). | `src/atomic-crm/validation/contacts/contacts-core.ts` `contactBaseSchema` export comment line 73 | Yes |
| AC-P2-002 | String length limits should be sourced from the `VALIDATION_LIMITS` constants object in `src/atomic-crm/validation/constants.ts` rather than hardcoded magic numbers. | `src/atomic-crm/validation/constants.ts` | Yes |
| AC-P2-003 | HTML-containing fields (notes, descriptions) apply `sanitizeHtml()` inside the schema `.transform()` so sanitization runs at the same boundary as validation. | `src/atomic-crm/validation/contacts/contacts-core.ts` line 144 | Yes |
| AC-P2-004 | Arrays of sub-entities (email entries, phone entries) apply `.max()` on the array length in addition to `.max()` on each string element, to guard against DoS via large array payloads. | `src/atomic-crm/validation/contacts/contacts-core.ts` lines 87–97 | Yes |

---

## Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|---------|
| NFR-001 | Validation must add negligible latency to write operations. Zod parsing of typical entity payloads is synchronous and completes in under 1ms. | `docs/adr/004-validation-at-provider-boundary.md` Consequences | Yes |
| NFR-002 | Error messages must be human-readable and mappable to specific form fields by field path. | `src/atomic-crm/validation/utils.ts` `zodErrorToReactAdminError`, `formatZodErrors` | Yes |
| NFR-003 | The module must remain compatible with both Zod v3 and Zod v4 error shapes during any migration period. | `src/atomic-crm/validation/utils.ts` lines 28–33, 71 | Yes |
| NFR-004 | The module has no runtime dependencies other than `zod` and `@/lib/sanitization`. It must not pull in React Admin, Supabase, or React. | `src/atomic-crm/validation/index.ts` (no RA/Supabase imports), feature-inventory.json `external_deps: ["zod"]` | Yes |
| NFR-005 | Test coverage is classified as "partial" in the baseline. High-priority schema boundaries (contacts, opportunities, organizations, tags, notes) have Vitest unit tests. All schema boundaries must eventually reach full unit test coverage. [REQUIRES REVIEW] | `docs/audit/baseline/feature-inventory.json` feat-val-001 `test_coverage: "partial"` | Yes |

---

## API/Contract Model

This section describes the schema structure that every resource module must follow when contributing to or consuming this module.

### Barrel Export Pattern

All schemas are re-exported through `src/atomic-crm/validation/index.ts`. Consumers import from this barrel, never from sub-files directly. `ZodError` is re-exported here so that the `zod` package is not imported elsewhere in the application.

```
src/atomic-crm/validation/
  index.ts                          ← Single import point for all consumers
  constants.ts                      ← VALIDATION_LIMITS (string max lengths, UUID length)
  utils.ts                          ← getFriendlyErrorMessage, formatZodErrors, zodErrorToReactAdminError
  contacts/
    contacts-core.ts                ← contactBaseSchema, createContactSchema, updateContactSchema
    contacts-communication.ts       ← emailAndTypeSchema, phoneNumberAndTypeSchema
    contacts-import.ts              ← CSV import row schema
    contacts-department.ts          ← contactDepartmentSchema
    contacts-quick-create.ts        ← quickCreateContactSchema (reduced validation for fast path)
  opportunities/
    opportunities-core.ts           ← opportunityBaseSchema, stage/priority/win/loss enums
    opportunities-junctions.ts      ← Junction-table schemas (contacts, products, distributors)
    opportunities-operations.ts     ← Stage transition and close-flow operation schemas
    opportunities-duplicates.ts     ← Duplicate check schemas
  activities/
    schemas.ts                      ← Activity create/update schemas
    constants.ts                    ← Activity-specific limits
    transforms.ts                   ← Data transforms for activity payloads
    types.ts                        ← Inferred types
    validation.ts                   ← validateCreateActivity, validateUpdateActivity
  shared/
    ra-file.ts                      ← raFileSchema, optionalRaFileSchema (React Admin file uploads)
  organizations.ts                  ← Organization schemas
  products.ts                       ← Product schemas
  sales.ts                          ← Sales rep schemas
  task.ts                           ← Task create/update schemas
  tags.ts                           ← Tag schemas
  notes.ts                          ← Note schemas
  segments.ts                       ← Segment schemas
  filters.ts                        ← Filter payload schemas (advanced filter system)
  distributorAuthorizations.ts      ← Distributor authorization schemas
  productDistributors.ts            ← Product-distributor junction schemas
  rpc.ts                            ← RPC payload schemas
  quickAdd.ts                       ← Quick-add flow schemas
  ui-props.ts                       ← UI prop schemas (non-entity validation)
  organizationFormConfig.ts         ← Organization form configuration schema
  categories.ts                     ← Category schemas
  favorites.ts                      ← Favorites schemas
  operatorSegments.ts               ← Operator segment schemas
  organizationDistributors.ts       ← Organization-distributor schemas
  productWithDistributors.ts        ← Combined product+distributor schemas
```

### Schema Tier Model

Each resource with write operations exposes three schema tiers:

| Tier | Zod Primitive | Purpose |
|------|--------------|---------|
| Base schema (`[resource]BaseSchema`) | `z.strictObject({...})` | Defines all known fields. Used for form defaults via `.partial().parse({})`. |
| Create schema (`create[Resource]Schema`) | `baseSchema.omit({computed_fields}).superRefine(...)` | Strips computed/readonly fields. Adds required-field `superRefine` checks. |
| Update schema (`update[Resource]Schema`) | `baseSchema.partial()` | All fields optional; permits partial updates. |

### Validation Function Signatures

Validation functions called by `ValidationService` are async and throw on failure:

```ts
// Standard signature (verified in contacts-core.ts, activities/validation.ts)
async function validateCreate[Resource](data: unknown): Promise<void>
async function validateUpdate[Resource](data: unknown): Promise<void>
```

On failure they throw the output of `zodErrorToReactAdminError(error)`:

```ts
// From src/atomic-crm/validation/utils.ts
{
  message: string;                        // "Validation failed"
  body: { errors: Record<string, string> } // field path → friendly message
}
```

### Error Utility Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `getFriendlyErrorMessage(issue)` | `utils.ts` | Maps a single `ZodIssue` to a human-readable string. Handles `invalid_type`, `too_small`, `too_big`, `invalid_format`, `unrecognized_keys`, Zod v3/v4 variants. |
| `formatZodErrors(error)` | `utils.ts` | Converts a full `ZodError` to `Record<string, string>` keyed by field path. |
| `zodErrorToReactAdminError(error, message?)` | `utils.ts` | Wraps `formatZodErrors` output into the React Admin error shape `{ message, body: { errors } }`. |

### String Length Constants

All `.max()` values must be sourced from `VALIDATION_LIMITS` in `src/atomic-crm/validation/constants.ts`:

| Constant | Value | Applies To |
|----------|-------|-----------|
| `UUID_LENGTH` | 36 | UUID fields |
| `EMAIL_MAX` | 254 | Email addresses (RFC 5321) |
| `PHONE_MAX` | 30 | Phone numbers |
| `URL_MAX` | 2000 | General URLs |
| `AVATAR_URL_MAX` | 500 | Avatar/CDN URLs |
| `NAME_MAX` | 100 | Names, titles |
| `SHORT_TEXT_MAX` | 255 | Default varchar(255) fields |
| `MEDIUM_TEXT_MAX` | 1000 | Descriptions, summaries |
| `LONG_TEXT_MAX` | 5000 | Notes, comments |
| `TIMESTAMP_MAX` | 50 | ISO 8601 timestamp strings |
| `TIMEZONE_MAX` | 50 | Timezone identifiers |

---

## UI/UX — How Validation Errors Surface

The validation module does not render any UI. However, it directly controls how errors appear in forms through the following chain:

1. **Provider boundary fires:** `withValidation(baseProvider)` calls the registered schema function. If parsing fails, `zodErrorToReactAdminError(error)` is thrown.

2. **React Admin intercepts:** The thrown error shape `{ message, body: { errors } }` matches React Admin's expected error format. RA maps `body.errors` field paths back to form field components.

3. **Form resolver (client-side UX):** Forms instantiate `createFormResolver(schema)` — not raw `zodResolver`. This adapter runs the same Zod schema on the client before submission, surfacing errors inline without a round-trip to the provider. This is a convenience layer; the provider is the enforcement gate.

4. **Field error display:** React Admin's `<TextInput>`, `<SelectInput>`, and other field components show the mapped error text below the field when their path appears in the error object. Accessibility is handled by CORE-014 (aria-invalid, aria-describedby).

The result is that validation errors always appear on the specific field that failed, with a friendly message from `getFriendlyErrorMessage`, regardless of whether the error originated from the client resolver or the provider boundary.

---

## Design Rules

The following rules are enforced by the project governance files and apply to every schema in this module:

| Rule ID | Design Rule | Governance Reference |
|---------|-------------|---------------------|
| DR-001 | Use `z.strictObject()` on all base schemas so unknown keys are caught at the create boundary. | CORE-005, DOM-004, ADR-004 |
| DR-002 | Use `z.coerce` for any scalar that may arrive as a string from React Admin forms (numbers, dates, booleans). | DOM-007, ADR-004 schema conventions |
| DR-003 | Apply `.max()` to every string field. Use `VALIDATION_LIMITS` constants, not inline numbers. | CORE-005, `constants.ts` |
| DR-004 | Use `z.enum()` for all bounded value sets (stages, priorities, reasons, types). Never use `z.string()` for fields with a defined allowlist. | DOM-006, ADR-004 |
| DR-005 | Export types via `z.infer<typeof schema>`. Never define a parallel manual `interface` for the same entity shape. | DOM-003, CORE-004 |
| DR-006 | Validation functions must call `zodErrorToReactAdminError(error)` and re-throw. They must never silently swallow validation errors. | CORE-013, PRV-010 |
| DR-007 | HTML fields (notes, descriptions) apply `sanitizeHtml()` inside a `.transform()` at schema parse time — not in the component or handler. | `contacts-core.ts` line 144, `opportunities-core.ts` |
| DR-008 | Computed fields (fields auto-generated by database triggers or views) are listed in the create schema's `.omit()` call so they are never written from the application layer. | PRV-002, CORE-009 |
| DR-009 | Self-referential relationships (manager_id on contacts, parent opportunity) must include a `superRefine` check that prevents `id === reference_id` circular references. | `contacts-core.ts` line 270, CORE-013, PRV-013 |
| DR-010 | Arrays of sub-entities cap both array length (`.max(N)`) and each string element length. | `contacts-core.ts` lines 87–97 |
| DR-011 | The `quickCreate` bypass path must still parse through a reduced (not zero) schema — it is not a full validation skip. | `contacts-core.ts` `validateContactForm`, `quickCreateContactSchema` |

---

## Integration Points

### Internal Dependencies

This module is consumed by (fan-in = 91 modules). The highest-impact consumers are:

| Consumer Module | Path | Dependency Type |
|----------------|------|----------------|
| Providers / ValidationService | `src/atomic-crm/providers/supabase/` | Schema registration; enforcement gate |
| Contacts | `src/atomic-crm/contacts/` | Types and form resolver |
| Opportunities | `src/atomic-crm/opportunities/` | Types, enums, and form resolver |
| Organizations | `src/atomic-crm/organizations/` | Types and form resolver |
| Activities | `src/atomic-crm/activities/` | Types and form resolver |
| Tasks | `src/atomic-crm/tasks/` | Types and form resolver |
| Products | `src/atomic-crm/products/` | Types and form resolver |
| ProductDistributors | `src/atomic-crm/productDistributors/` | Types and form resolver |
| Filters | `src/atomic-crm/filters/` | Filter payload schemas |
| Dashboard | `src/atomic-crm/dashboard/` | Read types |
| Reports | `src/atomic-crm/reports/` | Read types |

This module has 2 outbound dependencies of its own:

| Dependency | Path | Purpose |
|-----------|------|---------|
| `zod` | npm package | Schema definition and parsing |
| `@/lib/sanitization` | `src/lib/sanitization.ts` | `sanitizeHtml()` called inside transforms |

### External Dependencies

None. This is a pure TypeScript/Zod module with no external API calls, edge function invocations, or Supabase client usage.

### Database Tables

None. This module does not read from or write to any database table directly. It defines the shape contracts that govern what is written to all tables by the provider layer.

---

## Risk Assessment

- **Risk Level:** High
- **Phase Assignment:** 2
- **LOC:** ~19,702 across 96 files
- **Test Coverage:** Partial — high-priority entities (contacts, opportunities, organizations, tags, notes, activities) have Vitest unit tests; some schemas remain untested
- **Fan-in Blast Radius:** 91 consumers. Any breaking schema change (field removal, type narrowing, enum rename) will cause TypeScript compilation failures across the full codebase
- **Security Concerns:**
  - `z.strictObject()` on create payloads prevents mass-assignment (unknown keys rejected at provider boundary)
  - `.max()` on all string fields and array lengths defends against DoS via oversized payloads
  - `sanitizeHtml()` applied inside schema transforms prevents XSS in HTML-accepting fields
  - `z.enum()` allowlists prevent out-of-range enum injection
  - Self-referential cycle prevention (`id !== manager_id`) via `superRefine` guards
- **Change Gate:** Phase 2 — schema changes require tech lead review + two-developer code review before merge

### Risk Factors (from baseline)

- 91 fan-in dependents for a module with partial test coverage
- Schema drift from database columns causes false rejections at runtime — no automated drift detection exists [REQUIRES REVIEW]
- `contacts/contacts-core.ts` is 600+ lines; the contact schema handles multiple validation paths (standard create, quick create, update) which increases maintenance surface [INFERRED]

---

## Acceptance Criteria

| # | Criteria | Current State |
|---|----------|--------------|
| AC-001 | All entity write operations pass through `withValidation` before reaching Supabase. No handler bypasses the validation wrapper. | Met — verified by PRV-003 enforcement and `withValidation` wrapper position in ADR-004 |
| AC-002 | Create payloads with unknown keys are rejected with an `unrecognized_keys` error, not silently passed through. | Met — `z.strictObject()` used on all base schemas (verified in `contacts-core.ts`, `opportunities-core.ts`) |
| AC-003 | A string field exceeding its `.max()` limit is rejected with a friendly message (e.g., "Please keep this under 255 characters."). | Met — `getFriendlyErrorMessage` handles `too_big` code; verified by `__tests__/*-max-constraints.test.ts` files |
| AC-004 | An enum field with an out-of-range value (e.g., stage = "invented_stage") is rejected with "Please select a valid option." | Met — `z.enum()` used on all stage/reason fields; `getFriendlyErrorMessage` handles `invalid_value`/`invalid_enum_value` |
| AC-005 | Form field errors are mapped to the correct field path so React Admin displays the error under the specific input that failed. | Met — `formatZodErrors` keys errors by `issue.path.join(".")` |
| AC-006 | `ZodError` can be imported from `src/atomic-crm/validation` without a direct `zod` import in feature components. | Met — `index.ts` line 21 re-exports `ZodError` from `zod` |
| AC-007 | TypeScript compilation passes with zero errors after any schema change (`npx tsc --noEmit`). | Met at last audit — must be re-verified after each schema change |
| AC-008 | All string length limit values are defined in `VALIDATION_LIMITS` (no magic numbers in schema files). | Partial — `VALIDATION_LIMITS` exists and is used in many schemas; some older schemas may still use inline numbers [REQUIRES REVIEW] |
| AC-009 | HTML-accepting fields (notes, descriptions) have `sanitizeHtml()` applied inside the schema `.transform()`. | Met — verified in `contacts-core.ts` line 144 and `opportunities-core.ts` |
| AC-010 | Test coverage reaches full unit test coverage for all schema boundaries, not just high-priority ones. | Not Met — baseline classifies coverage as "partial"; gap exists for some junction-table and auxiliary schemas |

---

## Open Questions

1. **Schema drift detection [REQUIRES REVIEW]:** There is no automated check that schema fields match the current database column list. If a migration adds or removes a column without a corresponding schema update, writes will either be silently dropped (column not in schema) or cause false `unrecognized_keys` rejections (column not in `z.strictObject`). Consider adding a pgTAP or Vitest test that compares schema fields against `information_schema.columns`.

2. **Inline magic numbers [REQUIRES REVIEW]:** AC-008 is only partially met. A grep audit of all schema files for `.max(` with a hardcoded integer (not a `VALIDATION_LIMITS` reference) would identify which schemas still need migration to the constants pattern.

3. **`contacts-core.ts` complexity [INFERRED]:** The file handles standard create, quick-create, and update validation paths in ~600 lines with overlapping `superRefine` blocks. Splitting into `contacts-create.ts`, `contacts-update.ts`, and retaining `contacts-core.ts` only for the base schema and types would reduce the maintenance surface. This is a refactor consideration, not a bug.

4. **Filter schema ownership [INFERRED]:** `filters.ts` in this module defines filter payload schemas used by the advanced filter system. As the filter system grows (16 commits in the last 30 days per the risk assessment), consider whether filter schemas belong in the Filters module or remain centralized here. The current placement is correct per CORE-004 but creates coupling between the Validation module change gate (Phase 2, two-developer review) and rapid filter development.

5. **BRD gap:** No BRD exists for this module. Because this is a system-layer engineering module rather than a user-visible feature, a traditional BRD may not be appropriate. However, documenting the business rules that inform schema decisions (required fields, enum values, max lengths) in a lightweight architecture decision record may be more valuable than a full BRD. [INFERRED — human input recommended]
