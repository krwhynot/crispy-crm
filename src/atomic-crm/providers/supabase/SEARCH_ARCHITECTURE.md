# Search Architecture

This document explains how search and filtering currently works in the Crispy CRM Supabase data layer.

## Runtime Flow (Actual Order)

For `getList`, search processing happens in this order:

1. UI builds a filter object from autocomplete input:
   - `getQSearchAutocompleteProps()` -> `{ q: "kyle" }`
   - `getAutocompleteProps("name")` -> `{ "name@ilike": "%kyle%" }`
2. `composedDataProvider.getList()` calls `applySearchParams(resource, params)` first.
3. `applySearchParams()` transforms filters:
   - virtual filters (`stale`)
   - `$or` -> `@or`
   - arrays -> PostgREST operators (`@in`, `@cs`)
   - soft-delete filters (when needed)
   - `q` -> raw PostgREST `or@` search (for configured resources)
4. Request is routed to the resource handler (if resource is in `HANDLED_RESOURCES`), where `beforeGetList` may apply additional transforms.
5. Query executes on the mapped database table/view from `getDatabaseResource()`.

## Two Input Search Helpers

### 1. `getQSearchAutocompleteProps()` (Multi-field `q`)

Use when backend supports `q` transformation for that resource.

```tsx
<ReferenceInput source="contact_id" reference="contacts">
  <AutocompleteInput {...getQSearchAutocompleteProps()} />
</ReferenceInput>
```

### 2. `getAutocompleteProps(fieldName)` (Single-field ILIKE)

Use for simple, explicit field search.

```tsx
<ReferenceInput source="tag_id" reference="tags">
  <AutocompleteInput {...getAutocompleteProps("name")} />
</ReferenceInput>
```

## `q` Search Coverage

### Central `applySearchParams()` (`SEARCHABLE_RESOURCES`)

All `q` search transformations are handled centrally in `applySearchParams()` before callbacks run.
Configured in `resources.ts`:

| Resource | Fields |
|----------|--------|
| organizations | name, phone, website, postal_code, city, state, description |
| organizations_summary | name, phone, website, postal_code, city, state, description |
| contacts | first_name, last_name, company_name, title |
| contacts_summary | first_name, last_name |
| opportunities | name, description, next_action, lead_source, customer_organization_name |
| opportunities_summary | name, description, next_action, lead_source, principal_organization_name, customer_organization_name |
| products | name, category, description, manufacturer_part_number |
| sales | first_name, last_name, email |

### Callback-level `q` transforms

**None.** All `q` search logic has been consolidated to the central `SEARCHABLE_RESOURCES` layer.
Callbacks only handle:
- Soft-delete filtering
- Computed field stripping
- Resource-specific data transforms

## Resource Name Guidance

Prefer base resource names in `ReferenceInput` (`contacts`, `organizations`, `opportunities`, `products`, etc.).

Why:
- You keep handler-specific behavior (`beforeGetList`, soft-delete handling, callback logic).
- `getDatabaseResource()` still maps list calls to summary views when appropriate.

Using a summary resource directly (for example `contacts_summary`) may still search if that resource is configured in `SEARCHABLE_RESOURCES`, but it bypasses handler-level callback logic.

## Common Mistakes

### Assuming `q` is transformed in callbacks

`q` is processed **exclusively** by `applySearchParams()` in the central layer. Callbacks no longer handle `q` transformation. To add `q` search support for a resource, add it to `SEARCHABLE_RESOURCES` in `resources.ts`.

### Using summary resources in inputs expecting handler behavior

If you need callback-specific behavior, use base resource names in `ReferenceInput`.

### Using `q` for resources not configured for central `q` search

If a resource is not in `SEARCHABLE_RESOURCES`, `q` does not produce central multi-field search behavior. Use `getAutocompleteProps(field)` or add search config for that resource.

## Files Reference

| File | Purpose |
|------|---------|
| `src/atomic-crm/utils/autocompleteDefaults.ts` | Autocomplete helper props (`q` and field-specific search) |
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Routes resources and applies `applySearchParams()` |
| `src/atomic-crm/providers/supabase/dataProviderUtils.ts` | Search/filter transformation pipeline (`applySearchParams`) |
| `src/atomic-crm/providers/supabase/resources.ts` | `SEARCHABLE_RESOURCES` and resource mappings |
| `src/atomic-crm/providers/supabase/callbacks/*.ts` | Resource-specific `beforeGetList` transforms |
| `src/atomic-crm/providers/supabase/__tests__/ftsOperatorSyntax.contract.test.ts` | FTS syntax contract (frozen patterns) |
| `src/atomic-crm/providers/supabase/__tests__/dataProviderUtils.searchCharacterization.test.ts` | Pre-FTS behavior snapshots |
| `supabase/migrations/20260206000001_add_search_tsv_to_organizations_summary.sql` | View fix for organizations FTS |

## Detailed Plan: Migrate `q` Search to PostgreSQL Full-Text Search (`search_tsv`)

### Goal

Replace multi-column `ILIKE`-OR query patterns with indexed full-text search on `search_tsv` to improve:
- Performance on large datasets
- Relevance quality for multi-word queries
- Consistency of search behavior across resources

### Scope

Initial target resources:
- `contacts`
- `organizations`
- `opportunities`
- `products`
- `sales` (optional in phase 1 if `search_tsv` is not currently maintained)

Out of scope for initial rollout:
- Fuzzy typo tolerance (trigram similarity ranking)
- Cross-resource global search UI
- Advanced synonym dictionaries/thesaurus configuration

### Current State Summary (as of this architecture)

- The app currently transforms `q` into `ILIKE` conditions in `applySearchParams()`.
- `search_tsv` exists in core tables and some summary views, with trigger/index history in migrations.
- `q` search behavior is centralized via `SEARCHABLE_RESOURCES`.

### Migration Strategy

Use a **dual-path rollout**:
1. Keep current `ILIKE` behavior as fallback.
2. Add FTS path behind a feature flag.
3. Enable resource-by-resource after validation.

---

### Phase 0: Discovery and Baseline (0.5 day)

1. Confirm schema parity between local/dev/prod:
   - `search_tsv` column present on target base tables
   - Trigger functions and triggers installed
   - GIN index exists (prefer partial index where soft-delete applies)
2. Confirm `search_tsv` is exposed on summary views used for list queries.
3. Capture baseline performance:
   - representative `q` queries per resource
   - query latency p50/p95
   - query plans (`EXPLAIN (ANALYZE, BUFFERS)`)
4. Validate search quality baseline:
   - multi-word
   - punctuation
   - stemming expectations (for example `running` -> `run`)

Deliverables:
- Baseline metrics document
- Gap list (missing columns/views/indexes/triggers)

---

### Phase 1: Database Hardening for FTS (0.5-1.5 days)

1. Ensure `search_tsv` maintenance is correct for each table:
   - `BEFORE INSERT OR UPDATE` trigger
   - consistent language config (`english` or explicit chosen config)
2. Ensure weighted vector composition (where useful):
   - high weight for names/title
   - medium for descriptions/notes
   - low for metadata fields
3. Ensure indexes:
   - `GIN(search_tsv)`
   - consider partial index `WHERE deleted_at IS NULL` for soft-deleted tables
4. ✅ Summary views now include `search_tsv`:
   - ✅ `contacts_summary` - Already has `search_tsv`
   - ✅ `organizations_summary` - Fixed in `20260206000001_add_search_tsv_to_organizations_summary.sql`
   - ✅ `opportunities_summary` - Already has `search_tsv`
   - ❌ `sales` - Base table lacks `search_tsv` (optional for phase 1)
5. Backfill existing rows if needed:
   - run safe `UPDATE` to force trigger recomputation

Deliverables:
- Migration SQL files
- Rollback SQL for each migration
- Verification SQL checks

---

### Phase 2: Data Provider Query Path (1 day)

1. Add FTS query builder in `dataProviderUtils.ts`:
   - input: `q`
   - output: PostgREST FTS filter on `search_tsv`

   **Verified PostgREST FTS Syntax** (frozen in `__tests__/ftsOperatorSyntax.contract.test.ts`):
   - User search: `{ search_tsv: "wfts(english).term" }` - websearch semantics (multi-word AND, OR, negation)
   - Autocomplete: `{ search_tsv: "fts(english).prefix:*" }` - prefix matching for typeahead

   ```typescript
   // Import from contract test or extract to shared module
   import { buildWebSearchFilter, buildPrefixSearchFilter } from './__tests__/ftsOperatorSyntax.contract.test';

   // In applySearchParams():
   if (FTS_ENABLED_RESOURCES.includes(resource) && filter.q) {
     const ftsFilter = buildWebSearchFilter(String(filter.q));
     return { ...params, filter: { ...filterWithoutQ, ...ftsFilter } };
   }
   ```
2. Keep transformation pipeline order:
   - virtual filters -> logical operators -> array transforms -> search transform
3. Implement fallback logic:
   - if resource is FTS-enabled and has `search_tsv`, use FTS
   - else fallback to existing `ILIKE` path
4. Add feature flag:
   - global flag (for example `SEARCH_MODE=ilike|fts|hybrid`)
   - optional per-resource override

Deliverables:
- Updated `applySearchParams()`
- Config map for FTS-enabled resources
- Backward-compatible fallback path

---

### Phase 3: Validation and Filter Registry Updates (0.5 day)

1. Ensure filter validation allows FTS filter keys/operators used by provider.
2. Keep `q` as the public UI filter contract.
3. Prevent direct client dependence on raw `search_tsv` unless intentionally exposed.

Deliverables:
- Updated filter registry and validation tests

---

### Phase 4: Tests (1 day)

1. Unit tests (`dataProviderUtils`):
   - `q` -> FTS filter output
   - fallback behavior when FTS disabled/unavailable
   - empty/whitespace `q`
2. Integration/provider tests:
   - `getList` with `q` on each target resource
   - summary view resources and base resources
3. Regression tests:
   - ensure stale/soft-delete/array filters still compose correctly with search
4. E2E smoke:
   - autocomplete flows for contacts/orgs/opps/products
   - verify no regressions in result count and selection UX

Deliverables:
- New/updated test suites
- Test run artifacts in CI

---

### Testing Strategy (Recommended)

Use a **hybrid approach** for this change:

1. **Characterization first** (lock current behavior)
2. **TDD for pure transformation logic**
3. **Integration tests for DB-backed FTS behavior**
4. **Performance gates before rollout**

Why hybrid instead of pure TDD:
- FTS behavior depends on PostgreSQL dictionaries, stemming, indexes, and view definitions.
- Unit tests alone cannot validate query plans or realistic relevance behavior.
- Characterization tests reduce regression risk during migration from `ILIKE` to FTS.

#### Test Layers and Ownership

1. Characterization tests (pre-change baseline):
   - Purpose: freeze existing `q` behavior while refactoring.
   - Targets:
     - `src/atomic-crm/providers/supabase/__tests__/dataProviderUtils.transform.test.ts`
     - `src/atomic-crm/providers/supabase/composedDataProvider.test.ts`
   - Examples:
     - `q` with multi-word input
     - `q` + soft-delete filter
     - `q` + stale filter + array filters

2. Unit tests (TDD lane):
   - Purpose: prove deterministic filter transformation logic.
   - Targets:
     - `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
     - `src/atomic-crm/providers/supabase/__tests__/dataProviderUtils.transform.test.ts`
   - Required cases:
     - `q` -> FTS filter expression for enabled resources
     - fallback to `ILIKE` when FTS disabled/unavailable
     - empty/whitespace `q`
     - feature flag modes (`ilike`, `fts`, `hybrid`)

3. Provider integration tests:
   - Purpose: verify composed provider wiring and filter pipeline order.
   - Targets:
     - `src/atomic-crm/providers/supabase/composedDataProvider.test.ts`
   - Required cases:
     - `getList` resource routing still correct
     - FTS filter coexists with virtual/array/logical transforms
     - summary-view mapped resources behave as expected

4. Database integration tests (highest value for this migration):
   - Purpose: validate actual FTS semantics and index usage.
   - Required cases:
     - stemming (`running` matches `run`)
     - multi-word search behavior
     - punctuation/special character handling
     - soft-deleted rows excluded where expected
     - query plan uses GIN index on `search_tsv`

5. E2E smoke tests:
   - Purpose: confirm UI autocomplete behavior is stable.
   - Required cases:
     - contacts/orgs/opps/products autocomplete with `q`
     - result selection still writes expected foreign keys

#### Performance Test Gates

Before enabling FTS globally, require:

1. p95 latency improvement (or no regression) on representative search queries.
2. `EXPLAIN (ANALYZE, BUFFERS)` shows index-backed search for typical `q` queries.
3. No significant increase in error rate for list/autocomplete endpoints.

#### Exit Criteria for Test Phase

1. All unit + provider tests pass in CI.
2. DB integration suite passes for all enabled resources.
3. E2E smoke passes for autocomplete flows.
4. Performance gates meet thresholds documented in Phase 0 baseline.

---

### Phase 5: Rollout (0.5 day)

1. Enable FTS for one resource first (recommended: `contacts`).
2. Monitor:
   - API latency
   - slow query logs
   - error rate
   - search relevance feedback
3. Expand to remaining resources incrementally.
4. Remove old `ILIKE` path only after stable window.

Deliverables:
- Rollout checklist
- Post-rollout report

---

### Acceptance Criteria

Functional:
- `q` search returns relevant results for all enabled resources.
- Multi-word queries behave correctly without raw `or@` workarounds.
- Existing filters (`stale`, arrays, soft-delete) continue to work.

Performance:
- p95 search latency improves materially versus baseline on large datasets.
- Query plans use GIN index scans on `search_tsv` (no broad sequential scans for typical queries).

Operational:
- Feature flag allows immediate fallback to `ILIKE`.
- Rollback migrations exist and are tested.

### Risks and Mitigations

1. Risk: Summary view lacks `search_tsv`.
   - Mitigation: include view updates in phase 1 before enabling FTS for that resource.
2. Risk: Language config gives unexpected stemming.
   - Mitigation: document expected behavior; switch to `simple` config if business prefers literal matching.
3. Risk: Relevance regressions for short queries.
   - Mitigation: hybrid mode (`fts` + selective `ILIKE` fallback for very short input).
4. Risk: Filter validation blocks new FTS operator keys.
   - Mitigation: update registry + tests in same PR.

### Rollback Plan

1. Set feature flag back to `ilike`.
2. Revert provider change PR.
3. Keep DB FTS artifacts in place (safe) unless explicit rollback required.
4. If DB rollback is needed, run reverse migrations for new triggers/views/indexes.

### Estimated Effort

- MVP (`contacts` + `opportunities`): 1-2 days
- Full core resources (`contacts`, `organizations`, `opportunities`, `products`): 2-4 days
- Add ranking/relevance tuning and hybrid heuristics: +1-2 days

### Confidence Level

Overall confidence: **High (0.88)** *(Updated 2026-02-06 after verification)*

Breakdown:
- Existing DB readiness (columns/triggers/indexes): **High (0.92)** *(views fixed, syntax verified)*
- App-layer migration effort (`applySearchParams` + filters + tests): **High (0.90)** *(characterization tests in place)*
- Cross-environment parity risk (dev/staging/prod schema drift): **Medium (0.62)**
- Search relevance tuning effort (stemming/weights/hybrid behavior): **Medium (0.65)**

Verification completed (2026-02-06):
- ✅ Summary views verified: contacts_summary, opportunities_summary have search_tsv; organizations_summary fixed
- ✅ FTS syntax verified via spike: `wfts(english).term` for search, `fts(english).term:*` for autocomplete
- ✅ Contract test frozen: `__tests__/ftsOperatorSyntax.contract.test.ts` (11 tests)
- ✅ Characterization tests: `__tests__/dataProviderUtils.searchCharacterization.test.ts` (47 tests)
- ✅ GIN indexes confirmed on base tables
