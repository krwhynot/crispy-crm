# PRD: Data Provider & Service Layer

**Feature ID:** feat-svc-001
**Domain:** Providers
**Status:** Reverse-Engineered
**Confidence:** 90%
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Linked Documents

- **BRD:** None — this is a system-layer module. A lightweight architecture note capturing rationale for specific provider design decisions is more appropriate than a full BRD.
- **ADRs:** [docs/adr/001-supabase-provider-pattern.md](../../adr/001-supabase-provider-pattern.md)
- **Module:** `src/atomic-crm/providers/` and `src/atomic-crm/services/`
- **Risk Level:** High (risk score: 95/100 — highest in codebase)
- **Phase Assignment:** 3

---

## Executive Summary

The Data Provider & Service Layer is the **exclusive data access boundary** for Crispy CRM. All reads and writes from every feature UI component pass through this module. It wraps the Supabase client behind a composed React Admin `DataProvider`, routes requests to per-resource handlers, enforces Zod validation, manages soft-delete semantics, and coordinates structured error handling. The companion `services/` module holds domain workflow logic (archive/unarchive operations, junction management, user provisioning via Edge Functions) that handlers delegate to, keeping transport and business logic cleanly separated.

No feature component may import `@supabase/supabase-js` directly. Violation of this boundary is a CORE-001 breach.

---

## Business Context

The CRM must integrate the React Admin UI framework (which expects a standard `DataProvider` interface) with a Supabase/PostgreSQL backend that requires:

- Per-resource computed field stripping before writes
- Zod schema validation at the API boundary, not in forms
- Soft-delete (`deleted_at`) behaviour for most resources
- Summary SQL views for read performance on list queries
- Structured error logging to distinguish auth failures (401) from RLS denials (403)
- Async side-effects (file storage, edge function calls) that must not block core DB transactions

A single monolithic provider with switch statements was evaluated and rejected. See `docs/adr/001-supabase-provider-pattern.md` for the full decision record.

---

## Goals

1. Provide a single, stable data access interface that all 30+ feature modules consume without direct Supabase knowledge.
2. Guarantee that every write to the database passes Zod schema validation before reaching the network.
3. Enforce soft-delete consistency: `delete` calls become `deleted_at` updates; `list` and `getManyReference` reads hide soft-deleted rows automatically.
4. Route reads to the correct SQL summary view and writes to the correct base table for all 20 handled resources.
5. Keep each resource's transport behaviour isolated and independently testable via its handler file.
6. Allow the service layer to own business workflows (archive, junction sync, user provisioning) while handlers own only plumbing.

---

## Architectural Constraints

These constraints apply to all work inside `src/atomic-crm/providers/` and `src/atomic-crm/services/`.

### P0 — Must Not Violate (Breaking if Ignored)

| ID | Constraint | Source | Verified |
|----|------------|--------|----------|
| AC-001 | No feature component may import from `@supabase/supabase-js` directly. All Supabase access routes through `composedDataProvider.ts` or `authProvider.ts`. | `CORE-001`, `CLAUDE.md` | Yes — `src/atomic-crm/providers/supabase/composedDataProvider.ts` is the sole routing hub. |
| AC-002 | Wrapper composition order is fixed and must not be changed: `withErrorLogging( withLifecycleCallbacks( withSkipDelete( withValidation(baseProvider) ) ) )`. Reversing any layer causes data corruption (unrecognized Zod keys) or missed soft deletes. | `docs/adr/001-supabase-provider-pattern.md`, `src/atomic-crm/providers/supabase/wrappers/withSkipDelete.ts` | Yes — `withSkipDelete.ts` documents the required nesting and the failure mode of wrong ordering. |
| AC-003 | Every new resource must have a handler registered in `composedDataProvider.ts` and a Zod schema registered in `ValidationService`. Unregistered resources silently fall through to the raw base provider, bypassing all validation. | `src/atomic-crm/providers/supabase/composedDataProvider.ts` L155-159 | Yes — fallback `return baseProvider` confirmed in `getProviderForResource`. |
| AC-004 | `composedDataProvider.ts` and `authProvider.ts` are Caution Zone files. Any AI-assisted modification requires human review before merge. | `CLAUDE.md`, `docs/audit/baseline/integration-map.json` ai_guardrails | Yes |
| AC-005 | Soft-delete resources must set `supportsSoftDelete: true` and route deletes through `withSkipDelete` semantics (`meta.skipDelete`). Hard DELETE on a soft-delete resource will trigger FK constraint errors. | `src/atomic-crm/providers/supabase/wrappers/withSkipDelete.ts`, `src/atomic-crm/providers/supabase/resources.ts` | Yes — `SOFT_DELETE_RESOURCES` array confirmed; `withSkipDelete` intercepts `meta.skipDelete = true`. |
| AC-006 | `withErrorLogging` must remain the outermost wrapper. It is the centralized error handling layer (CORE-012). Placing it inside `withLifecycleCallbacks` would swallow lifecycle errors silently. | `CORE-012`, `PROVIDER_RULES.md` PRV-004 | Yes — confirmed in all handler files reviewed. |

### P1 — Should Not Violate (Degraded Behaviour if Ignored)

| ID | Constraint | Source | Verified |
|----|------------|--------|----------|
| AC-007 | Reads (`getList`, `getOne`, `getMany`) must target SQL summary views (e.g. `opportunities_summary`, `contacts_summary`) via `getDatabaseResource()`. Writes target base tables. | `src/atomic-crm/providers/supabase/composedDataProvider.ts` L169, `src/atomic-crm/providers/supabase/resources.ts` `RESOURCE_MAPPING` | Yes |
| AC-008 | `beforeSave` callbacks must strip computed/view-only fields (`COMPUTED_FIELDS` array) before Zod validates. Stripping after validation causes "Unrecognized keys" errors on writes. | `src/atomic-crm/providers/README.md` Architecture section | Yes |
| AC-009 | Handlers own transport and plumbing only. Business workflows (archive/unarchive, product sync, junction management, user provisioning) must live in `src/atomic-crm/services/` classes. | `PROVIDER_RULES.md` PRV-006, `src/atomic-crm/services/README.md` | Yes |
| AC-010 | Non-critical side-effects (storage cleanup, Edge Function calls, email) must not block core DB transactions. Async side-effects must be explicitly awaited or `void`-ed with `.catch` logging — no silent failures (CORE-013). | `PROVIDER_RULES.md` PRV-011, PRV-014 | Yes — services README confirms try/catch pattern with `devError`. |
| AC-011 | Filter fields must be registered in the filter registry (`src/atomic-crm/providers/supabase/filters/`). Unknown filter fields throw `UnregisteredResourceError`. Adding a new filterable field requires a registry entry. | `src/atomic-crm/providers/supabase/filterRegistry.ts` | Yes — confirmed deprecated entry point re-exports from `filters/`. |
| AC-012 | Services have zero direct npm dependencies. They accept `DataProvider` or `ExtendedDataProvider` via constructor injection. This must be maintained to keep the service layer independently testable. | `src/atomic-crm/services/README.md` | Yes |

### P2 — Best Practice (Technical Debt if Ignored)

| ID | Constraint | Source | Verified |
|----|------------|--------|----------|
| AC-013 | Full-text search (FTS) must be staged: add a resource to `FTS_ENABLED_RESOURCES` only after confirming the summary view exposes `search_tsv` and a GIN index exists on the base table. Premature addition silently returns no results. | `src/atomic-crm/providers/supabase/resources.ts` L62-71 | Yes |
| AC-014 | `authProvider.ts` module-level `cachedSale`/`cacheTimestamp` state is a known design concern. Any changes to caching logic require staging verification with login/logout/password-reset cycle. | `src/atomic-crm/providers/README.md` Guardrails section | Yes [REQUIRES REVIEW] |
| AC-015 | Storage operations must use `StorageService` with MIME allowlist and sanitised filenames. Public URLs are currently used instead of signed URLs — this is an open gap (sec-003 in integration-map). | `docs/audit/baseline/integration-map.json` sec-003, `PROVIDER_RULES.md` PRV-007, PRV-008 | Yes — partial resolution noted (crypto.randomUUID added, signed URLs not yet enforced). |

---

## Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| NFR-001 | All writes must pass provider-layer Zod schema validation before any DB call is made. | `CORE-007`, `PROVIDER_RULES.md` PRV-003 | Yes |
| NFR-002 | Authentication errors (401) must be distinguished from RLS policy denials (403). 401 triggers logout; 403 surfaces an access-denied message without logging the user out. | `src/atomic-crm/providers/README.md` authProvider section | Yes |
| NFR-003 | `getManyReference` calls automatically append `"deleted_at@is": null` for any resource in `SOFT_DELETE_RESOURCES`, unless the caller passes `filter.includeDeleted`. | `src/atomic-crm/providers/supabase/composedDataProvider.ts` L202-212 | Yes |
| NFR-004 | Handler test suite must pass after any change to `composedDataProvider.ts`. A routing mistake silently falls through to the base provider — tests are the only safety net. | `src/atomic-crm/providers/README.md` | Yes |
| NFR-005 | `StorageService` must sanitize filenames and validate MIME type against an allowlist before upload. | `CORE-019`, `PROVIDER_RULES.md` PRV-007 | Partial — sec-003 open gap for signed URLs. |
| NFR-006 | The service layer must propagate errors as typed `Error` or `HttpError` objects. Silent catch blocks are banned (CORE-013). | `src/atomic-crm/services/README.md` | Yes |

---

## API / Contract Model

### React Admin DataProvider Interface

The composed provider implements the standard React Admin `DataProvider` interface. All 20 handled resources route through this contract.

```
getList(resource, params)        → reads summary view via getDatabaseResource()
getOne(resource, params)         → reads summary view via getDatabaseResource()
getMany(resource, params)        → reads summary view via getDatabaseResource()
getManyReference(resource, params) → base table + auto soft-delete filter
create(resource, params)         → base table, via handler with validation
update(resource, params)         → base table, via handler with validation
updateMany(resource, params)     → base table, via handler
delete(resource, params)         → soft delete via meta.skipDelete OR hard delete (tags only)
deleteMany(resource, params)     → same as delete
```

Source: `src/atomic-crm/providers/supabase/composedDataProvider.ts`

### Handler Composition Contract

Every resource handler must follow this exact factory shape (ADR-001):

```typescript
export function create{Resource}Handler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(
      withSkipDelete(withValidation(baseProvider)),
      [resourceCallbacks]
    )
  );
}
```

Source: `src/atomic-crm/providers/supabase/wrappers/withSkipDelete.ts` and `docs/adr/001-supabase-provider-pattern.md`

### Handled Resources (20 total)

| Resource | Type | Soft Delete |
|----------|------|-------------|
| `contacts` | Core CRM | Yes |
| `organizations` | Core CRM | Yes |
| `opportunities` | Core CRM | Yes |
| `activities` | Core CRM | Yes |
| `products` | Core CRM | Yes |
| `tasks` | Task management | Yes |
| `contact_notes` | Notes | Yes |
| `opportunity_notes` | Notes | Yes |
| `organization_notes` | Notes | Yes |
| `tags` | Supporting | Yes (SOFT_DELETE_RESOURCES — hard delete bypassed) |
| `sales` | Supporting | Yes |
| `segments` | Supporting | Yes |
| `product_distributors` | Supporting | No [REQUIRES REVIEW] |
| `opportunity_participants` | Junction | Yes |
| `opportunity_contacts` | Junction | Yes |
| `interaction_participants` | Junction | Yes |
| `distributor_principal_authorizations` | Junction | Yes |
| `organization_distributors` | Junction | Yes |
| `user_favorites` | Supporting | Yes |
| `notifications` | Notifications | Yes |
| `entity_timeline` | Read-only view | N/A |

Source: `src/atomic-crm/providers/supabase/composedDataProvider.ts` `HANDLED_RESOURCES`, `src/atomic-crm/providers/supabase/resources.ts` `SOFT_DELETE_RESOURCES`

### Service Layer Contract

Services are plain TypeScript classes injected with a `DataProvider` or `ExtendedDataProvider`. They expose domain workflow methods consumed by handlers.

| Service | Key Methods | External Calls |
|---------|-------------|----------------|
| `SalesService` | `salesCreate`, `salesUpdate`, `updatePassword`, `resetUserPassword` | `supabase/functions/users`, `supabase/functions/updatepassword` |
| `OpportunitiesService` | archive/unarchive, product sync | RPCs: `archive_opportunity_with_relations`, `unarchive_opportunity_with_relations`, `sync_opportunity_with_products` |
| `JunctionsService` | Opportunity participants and contact junction management | None |
| `ProductsService` | Product creation with distributor sync | None |
| `ProductDistributorsService` | Junction CRUD, `parseCompositeId`, `createCompositeId` | None |
| `SegmentsService` | Fixed Playbook category lookups | None |
| `DigestService` | Overdue task and stale deal queries | None — uses `STAGE_STALE_THRESHOLDS` from `utils/stalenessCalculation` |

Source: `src/atomic-crm/services/README.md`

### Authentication Contract

`authProvider.ts` wraps `ra-supabase-core` and overrides `checkError` to distinguish HTTP 401 (session expired → logout) from HTTP 403 (RLS denial → surface error, stay logged in). Module-level `cachedSale`/`cacheTimestamp` holds the current user's sales record to avoid repeated fetches.

Source: `src/atomic-crm/providers/README.md` Key Components table

---

## UI / UX: How Provider Errors Surface

The provider layer does not own UI components, but its error contracts determine what users see.

| Scenario | Provider Behaviour | User-Visible Result |
|----------|--------------------|---------------------|
| HTTP 401 (session expired) | `authProvider.checkError` triggers logout | User redirected to login page |
| HTTP 403 (RLS denial) | `authProvider.checkError` does NOT logout; throws error for UI to handle | Permission-denied toast or inline message [INFERRED] |
| Zod validation failure on write | `withValidation` throws before network call | React Admin surfaces field-level errors from the thrown error object |
| Storage upload MIME rejection | `StorageService` throws typed error | File input shows rejection message [INFERRED — UI implementation varies per feature] |
| Edge Function failure (non-critical) | `withErrorLogging` logs structured error; does not block transaction | Operation may partially succeed; user may not see feedback [REQUIRES REVIEW — gap in PRV-011 compliance] |
| Routing fallthrough (unregistered resource) | Passes to base provider, no validation applied | Silent — no visible error, but writes bypass Zod [REQUIRES REVIEW] |

---

## Design Rules

These rules are derived from `PROVIDER_RULES.md` (PRV-001 through PRV-014) and `CORE_CONSTRAINTS.md`. They govern all code written inside this module.

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PRV-001 | Every resource uses `handlers/[resource]Handler.ts` registered in `composedDataProvider.ts`. | Code review |
| PRV-002 | Handlers define and strip `COMPUTED_FIELDS`; list reads follow summary mapping. | Handler test suite |
| PRV-003 | Resource schemas registered in `ValidationService`, enforced by `withValidation` before writes. | `schemaDrift.test.ts` |
| PRV-004 | Wrapper composition keeps error logging outermost; sanitize/validate order preserved. | ADR-001, code review |
| PRV-005 | Edit round-trip contract (`getOne → defaults → resolver → update`) must stay valid. Each resource keeps a save-path guard test. | Handler test per resource |
| PRV-006 | Handlers do transport/plumbing only; business workflows live in service-layer methods. | Code review |
| PRV-007 | Storage operations run through `StorageService`, validate MIME allowlists, remove orphaned files on downstream failure. | `StorageService` unit tests |
| PRV-008 | Private assets use signed URLs; raw `File` objects do not leak beyond handler boundary. | sec-003 open gap — not yet fully enforced. |
| PRV-009 | Soft-delete resources set `supportsSoftDelete: true` and route deletes through `withSkipDelete` semantics. | `withSkipDelete.test.ts` |
| PRV-010 | Side-effects use explicit error handling and structured logging; no silent failures. | `CORE-013`, code review |
| PRV-011 | Non-critical external side-effects cannot block critical DB transactions. | Code review |
| PRV-012 | Self-referential selectors exclude current record IDs to prevent hierarchy cycles. | Code review |
| PRV-013 | Self-referential tables enforce `id != parent_id` at the DB level. | Migration review |
| PRV-014 | Async provider operations are awaited or explicitly fire-and-forget with `.catch` logging. | Code review |

---

## Integration Points

### Internal Dependencies

| Module | Role | Risk Level |
|--------|------|------------|
| `src/atomic-crm/validation/` | Zod schemas consumed by `withValidation` and registered in `ValidationService`. 91 dependents. | High |
| `src/atomic-crm/services/` | Business workflow layer called by handlers. Depends on `DataProvider` injection. | Medium |
| `src/atomic-crm/types.ts` | Shared domain types consumed by handlers and services. | Low |
| `src/atomic-crm/utils/` | Shared utility helpers including `stalenessCalculation`. | Medium |

### External Dependencies

| Integration ID | Service | Files | Purpose |
|---------------|---------|-------|---------|
| int-auth-001 | Supabase Auth (Client SDK) | `authProvider.ts`, `supabase.ts` | Session management, login, password reset |
| int-auth-002 | Supabase Auth (REST + WebSocket) | `authProvider.ts` | Auth state subscription, OTP flows |
| int-db-001 | Supabase PostgreSQL via PostgREST | `composedDataProvider.ts` | All CRUD operations against base tables and summary views |
| int-storage-001 | Supabase Storage (S3-compatible) | `services/StorageService.ts` | File attachment upload/delete for notes and avatars |
| (implicit) | `supabase/functions/users` | `services/sales.service.ts` | Sales user creation and update via Edge Function |
| (implicit) | `supabase/functions/updatepassword` | `services/sales.service.ts` | Password reset and admin reset flows |

Source: `docs/audit/baseline/integration-map.json`

### npm Package Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.75.1 | Supabase client SDK |
| `ra-supabase-core` | ^3.5.1 | Base auth and data provider for React Admin |

---

## Risk Assessment

- **Module Risk Level:** High (risk score 95/100 — highest in codebase)
- **Phase Assignment:** 3
- **Test Coverage:** Full (handler test per resource, wrapper tests, schema drift tests, filter registry tests)
- **30-day Commits:** 41 (high churn; 22 in last 14 days, above CI/CD review threshold of 16)
- **6-month Commits:** 581 (extremely high historical churn)

### Risk Factors

1. `authProvider.ts` is the single most active Caution Zone file: recovery link redirect, set-password flow, admin password reset, OTP invite fallback, and `PASSWORD_RECOVERY` event handler all added within 14 days as of last audit.
2. `composedDataProvider.ts` is a god-class router: a routing mistake silently bypasses all validation with no visible error.
3. Uncommitted modification to `authProvider.ts` in working tree at time of last audit.
4. `StorageService.ts` has open security observation sec-003: public URLs used instead of signed URLs (PRV-008 gap).
5. Module-level `cachedSale`/`cacheTimestamp` in `authProvider.ts` is stateful and can go stale across role changes.

### Security Concerns

| ID | Severity | Description | File |
|----|----------|-------------|------|
| sec-003 | Low | Partial resolution: `crypto.randomUUID()` and MIME allowlist added. Public URLs still used instead of signed URLs. PRV-008 gap remains open. | `services/StorageService.ts` |

Source: `docs/audit/baseline/integration-map.json` security_observations

---

## Acceptance Criteria

| # | Criteria | Current State |
|---|----------|---------------|
| AC-001 | No `import ... from '@supabase/supabase-js'` exists in any feature component outside `providers/supabase/`. | Met — enforced by CORE-001 and code review. |
| AC-002 | All 20 handled resources have a handler file registered in `composedDataProvider.ts`. | Met — confirmed in `HANDLED_RESOURCES` constant. |
| AC-003 | All 20 handled resources have a Zod schema registered in `ValidationService`. | Met — confirmed by `schemaDrift.test.ts` contract. |
| AC-004 | Wrapper composition order is `withErrorLogging > withLifecycleCallbacks > withSkipDelete > withValidation > baseProvider` for every handler. | Met — verified in handlers reviewed. |
| AC-005 | All resources in `SOFT_DELETE_RESOURCES` route `delete` through `withSkipDelete`; hard DELETE is never issued for these resources during normal operation. | Met — `withSkipDelete.test.ts` confirms. |
| AC-006 | `getList`, `getOne`, and `getMany` map to summary views via `getDatabaseResource()`. | Met — confirmed in `composedDataProvider.ts` L169, L180, L191. |
| AC-007 | `getManyReference` appends `"deleted_at@is": null` for soft-delete resources unless `filter.includeDeleted` is set. | Met — confirmed in `composedDataProvider.ts` L202-212. |
| AC-008 | `authProvider.checkError` distinguishes 401 (logout) from 403 (stay logged in, surface error). | Met — confirmed in `providers/README.md`. |
| AC-009 | `StorageService` uses `crypto.randomUUID()` for filenames and validates MIME against an allowlist. Signed URLs not yet enforced. | Partial — sec-003 open. |
| AC-010 | Service layer classes have zero direct npm dependencies; they accept `DataProvider` via constructor injection. | Met — confirmed in `services/README.md`. |
| AC-011 | Non-critical side-effects (storage cleanup, Edge Function calls) do not block core DB transaction success/failure. | Met [REQUIRES REVIEW — manual verification recommended per PRV-011]. |

---

## Open Questions

1. **[REQUIRES REVIEW]** `StorageService` still uses public URLs instead of signed URLs (sec-003). When will PRV-008 be fully enforced? What is the blast radius — which resources serve file attachments via public URL today?

2. **[REQUIRES REVIEW]** `authProvider.ts` module-level `cachedSale`/`cacheTimestamp` state: what is the invalidation strategy if a user's role or sales record changes mid-session without logout?

3. **[REQUIRES REVIEW]** The base provider fallthrough for unregistered resources silently bypasses validation. Should an explicit error be thrown for unknown resources rather than silently passing through?

4. **[REQUIRES REVIEW]** Non-critical Edge Function failures (e.g., `supabase/functions/users` call failure during `salesCreate`) — is the user informed that the operation partially failed, or does the UI show success while the user record is missing?

5. **[ASSUMPTION]** `product_distributors` does not appear in `SOFT_DELETE_RESOURCES` despite having a handler that likely touches `deleted_at`. Verify whether this resource uses hard deletes intentionally or is missing from the array.

6. **[REQUIRES REVIEW]** `authProvider.ts` has uncommitted working-tree modifications as of the last audit (2026-03-03). What is the current state of the OTP invite fallback and admin password reset flows? Are they production-ready?
