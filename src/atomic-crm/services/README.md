# Services Module

Business logic layer for Crispy CRM. Provider handlers do transport and plumbing only; this module owns domain workflows — opportunity product sync, sales user management via Edge Functions, junction table operations, digest queries, and Playbook segment lookups. Consumed by `providers/` and `opportunities/`.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 2 |
| Test Project | `__tests__/` (5 test files) |
| Dependents | 2 internal modules (`opportunities`, `providers`) |

## Key Components

| File | Purpose |
|------|---------|
| `sales.service.ts` | Sales user CRUD and password reset via `users` and `updatepassword` Edge Functions |
| `opportunities.service.ts` | Archive/unarchive and product sync via `sync_opportunity_with_products` RPC |
| `junctions.service.ts` | Opportunity participants and contact junction management |
| `products.service.ts` | Product creation with distributor relationship sync |
| `productDistributors.service.ts` | Product-distributor junction CRUD; `parseCompositeId` / `createCompositeId` helpers |
| `segments.service.ts` | Fixed Playbook category lookups (no dynamic creation) |
| `digest.service.ts` | Overdue task and stale deal queries with per-stage thresholds |
| `utils/handleServiceError.ts` | Shared error normalisation utility |
| `index.ts` | Barrel export for all services and derived types |

## Dependencies

### Internal References
- `src/atomic-crm/providers/supabase/extensions/types` — `ExtendedDataProvider` (RPC-capable provider type)
- `src/atomic-crm/validation/` — Zod schemas imported by `digest.service.ts` and `segments.service.ts`
- `src/atomic-crm/utils/stalenessCalculation` — `STAGE_STALE_THRESHOLDS` used by `DigestService`
- `src/atomic-crm/types` — `Sale`, `SalesFormData`, `Opportunity`, `OpportunityParticipant`

### npm Packages
None. The services layer has zero direct npm dependencies — it accepts a `DataProvider` or `ExtendedDataProvider` via constructor injection.

### External Integrations
- `supabase/functions/users` — invoked by `SalesService.salesCreate` (POST) and `SalesService.salesUpdate` (PATCH)
- `supabase/functions/updatepassword` — invoked by `SalesService.updatePassword` and `SalesService.resetUserPassword`
- Supabase RPC: `sync_opportunity_with_products`, `archive_opportunity_with_relations`, `unarchive_opportunity_with_relations`, `sync_opportunity_with_contacts`

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|------------|
| Business Logic Services | Services | 0.90 |
| Segments (Playbook Categories) | Segments | 0.90 |

## Common Modification Patterns

All services are plain TypeScript classes that accept a `DataProvider` or `ExtendedDataProvider` in their constructor — never import Supabase directly (CORE-001). When adding a method, follow the existing try/catch pattern: log with `devError`/`devLog`, wrap thrown errors as typed `Error` or `HttpError`, and let errors propagate to the provider layer (Fail Fast, no silent catches per CORE-013).

- Adding a workflow method: add it to the relevant `*.service.ts` class, export the return type from `index.ts`, and add a corresponding test in `__tests__/`.
- Adding a new service: create `[name].service.ts`, register it in `index.ts`, and add at minimum a happy-path test.
- After any change, run `npx tsc --noEmit` and `npm run test` — the `providers` module is the primary consumer and its handler tests will catch interface drift.

## Guardrails

- `sales.service.ts` is a high-churn file (CI/CD watch). Changes that touch `salesCreate` or `salesUpdate` must be verified against the Edge Function schema in `supabase/functions/users/index.ts` — both sides must agree on the request/response shape.
- `DigestService` depends on `STAGE_STALE_THRESHOLDS` from `utils/stalenessCalculation`. Changing thresholds affects notification frequency for all users.
- Services contain no RLS logic — access control is enforced at the database layer. Do not add RLS-bypassing patterns here.
- Full audit report: `docs/audit/baseline/risk-assessment.json` (services entry, risk score 5/10, phase 2).
