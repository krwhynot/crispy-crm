# Providers Module

The providers module is the **exclusive data access layer** for Crispy CRM. All reads and writes from feature UI components pass through this module — no feature code may import from `@supabase/supabase-js` directly. It contains the Supabase data provider, authentication provider, resource-specific handlers, composition wrappers, and shared services.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React Admin 5 + ra-supabase-core 3 |
| Risk Level | High (score: 9/10) |
| Phase | 3 |
| Files | 116 |
| LOC | ~24,967 |
| Dependents | opportunities, validation (fan-in: 6 modules) |
| npm Packages | `@supabase/supabase-js ^2.75.1`, `ra-supabase-core ^3.5.1` |

## Key Components

| File / Directory | Purpose |
|------------------|---------|
| `supabase/composedDataProvider.ts` | God-class router: dispatches every React Admin method call to the correct resource handler. 260 lines, 20 registered resources. **Caution Zone.** |
| `supabase/authProvider.ts` | Authentication and identity. Wraps `ra-supabase-core`, overrides `checkError` to distinguish 401 (logout) from 403 (RLS violation). Holds `cachedSale` / `cacheTimestamp` module-level state. **Caution Zone.** |
| `supabase/handlers/` | One handler file per resource (e.g. `contactsHandler.ts`, `opportunitiesHandler.ts`). Each handler composes the three wrappers around the base provider. |
| `supabase/callbacks/` | `beforeSave` / `beforeDelete` lifecycle callbacks per resource. Strip computed/view-only fields before Zod validation runs. |
| `supabase/wrappers/` | `withValidation.ts`, `withErrorLogging.ts`, `withSkipDelete.ts`. The three building blocks applied to every handler. |
| `supabase/services/` | `ValidationService.ts`, `StorageService.ts`, `TransformService.ts`. Shared infrastructure consumed by handlers. |
| `supabase/filterRegistry.ts` | Type-safe allowlist of filterable fields per resource. Unknown fields throw `UnregisteredResourceError`. |
| `supabase/resources.ts` | `supportsSoftDelete()` helper and resource-to-view mapping used by the router. |
| `supabase/dataProviderUtils.ts` | `getDatabaseResource()` (maps resource names to SQL views) and `applySearchParams()`. |

## Architecture

### Wrapper Composition Order

Every handler must apply wrappers in this exact order (ADR-001, ADR-004, PRV-004):

```typescript
return withErrorLogging(
  withLifecycleCallbacks(
    withValidation(baseProvider),
    [resourceCallbacks]
  )
);
```

`beforeSave` callbacks strip view-only fields **before** Zod validates. Reversing this order causes "Unrecognized keys" errors on writes.

### Read / Write Duality

List and single-record reads target SQL summary views (`opportunities_summary`, `contacts_summary`). Writes always target the base table. The `getDatabaseResource()` utility in `dataProviderUtils.ts` handles the mapping.

### Soft Deletes

All resources except `tags` use `deleted_at` soft deletes. `getManyReference` adds `"deleted_at@is": null` automatically for soft-delete resources via `supportsSoftDelete()`. Hard-delete resources (tags) bypass this path.

## Dependencies

### Internal Modules
- `src/atomic-crm/services/` — business logic called by handlers
- `src/atomic-crm/validation/` — Zod schemas enforced via `withValidation`
- `src/atomic-crm/types.ts` — shared domain types
- `src/atomic-crm/utils/` — shared utility helpers

### npm Packages
- `@supabase/supabase-js ^2.75.1` — Supabase client SDK
- `ra-supabase-core ^3.5.1` — base auth and data provider for React Admin

### External Integrations
- Supabase PostgreSQL via PostgREST (data reads/writes)
- Supabase Auth REST + WebSocket (authentication)
- Supabase Storage S3-compatible API (file attachments via `StorageService`)

## Adding a New Resource Handler

1. Create `handlers/exampleHandler.ts` using the wrapper composition pattern above.
2. Add the resource name to `HANDLED_RESOURCES` in `composedDataProvider.ts`.
3. Instantiate the handler inside `createComposedDataProvider()`.
4. Register the Zod schema in `ValidationService`.
5. Add a test file at `handlers/exampleHandler.test.ts`.

Full detail: `src/atomic-crm/providers/supabase/README.md`

## Common Modification Patterns

Adding a computed field to a summary view requires updating both the SQL view (migration) and the `COMPUTED_FIELDS` array in the corresponding handler's callbacks file, so the field is stripped before the base-table write. When changing `composedDataProvider.ts`, run the full handler test suite immediately — a routing mistake silently falls through to the base provider, bypassing all validation. `authProvider.ts` changes must be verified with both unit tests and a manual login / logout / password-reset cycle on staging.

## Guardrails

The following files require human review before any AI-assisted modification (from `integration-map.json` `ai_guardrails` and CLAUDE.md Caution Zones):

| Path | Reason |
|------|--------|
| `supabase/authProvider.ts` | Auth flow — mistakes lock out all users. 14+ commits in 14 days; active rework. |
| `supabase/composedDataProvider.ts` | Handler routing hub — a change here affects all resources simultaneously. |
| `supabase/services/StorageService.ts` | Open security observation sec-003 (Math.random filenames, MIME validation). |

See full audit report: `docs/audit/baseline/risk-assessment.json` (providers entry, risk score 9).
