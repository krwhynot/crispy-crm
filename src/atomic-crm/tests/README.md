# Tests Module

Integration and schema validation tests for the Crispy CRM data layer. These tests exercise the Supabase data provider contract — verifying that DB views expose the right columns, RLS policies enforce correct access control, and the provider surfaces useful errors on schema mismatches. Shared unit-test utilities (typed mocks, render helpers, global setup) live alongside this directory in `src/tests/`.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | Vitest 3 |
| Risk Level | Low |
| Phase | 1 |
| Test Project | None (this module IS the test layer) |
| Dependents | None (fan-in: 0) |

## Key Files

| File | Purpose |
|------|---------|
| `dataProviderErrors.test.ts` | Unit tests for HTTP error handling and schema-mismatch detection in the data provider |
| `dataProviderSchemaValidation.test.ts` | Integration tests that hit a real (or local) Supabase instance to verify column presence and field type compatibility |
| `httpErrorPatterns.test.ts` | Unit tests for PostgREST 400 error pattern parsing (`PGRST202` column-does-not-exist, relation not found) |
| `opportunitiesSummaryRLS.test.ts` | Integration tests for `opportunities_summary` RLS policies; verifies authenticated reads and anon-role blocking |
| `unifiedDataProvider.test.ts` | Schema contract tests for `contacts_summary` view queries; uses a real Supabase client with CI fallback to localhost |

## Shared Test Infrastructure

The shared utilities consumed by all feature module tests live in `src/tests/`:

| File | Purpose |
|------|---------|
| `src/tests/setup.ts` | Global Vitest setup: `@testing-library/jest-dom`, global Supabase client mock, QueryClient bootstrap |
| `src/tests/utils/typed-mocks.ts` | Typed factory functions for React Admin hooks (`mockUseGetListReturn`, `mockUseGetOneReturn`, etc.) — required by DOM-009 |
| `src/tests/utils/render-admin.tsx` | `renderWithAdminContext` wrapper for rendering components inside a React Admin context |
| `src/tests/utils/mock-providers.ts` | Pre-wired mock data providers for use in component tests |
| `src/tests/utils/typed-test-helpers.ts` | Additional typed helpers for common test assertions |
| `src/tests/fixtures/auth-users.json` | Seed data for auth-related test cases |

## Dependencies

### Project References
None. This module has zero fan-out — it does not import from other `src/atomic-crm/` modules.

### npm Packages (dev)
- `vitest` ^3.2.4 — test runner
- `@supabase/supabase-js` ^2.75.1 — real client used in integration tests
- `@testing-library/jest-dom` ^6.6.3 — DOM matchers (via `src/tests/setup.ts`)

## Common Modification Patterns

Tests in this directory fall into two categories: pure-unit tests that mock all I/O (no `beforeAll` Supabase setup) and integration tests that connect to a real or local Supabase instance. Integration tests guard themselves with an `isSupabaseAvailable()` helper and skip gracefully in CI when the local Supabase stack is not running — add a similar guard to any new integration test. When adding a schema contract test, model it after `dataProviderSchemaValidation.test.ts`: declare `requiredFields` per table, then assert field presence via `.select(fieldList).limit(1)`. New feature module unit tests should use `renderWithAdminContext` from `src/tests/utils/render-admin.tsx` and typed mock factories from `src/tests/utils/typed-mocks.ts` rather than casting to `any`.

## Guardrails

- Tests in this directory may `import { createClient }` directly from `@supabase/supabase-js`. This is the only location in the codebase where direct Supabase imports are permitted (CORE-022 exception: test files).
- Integration tests that bypass the global mock must use `vi.importActual` (see `opportunitiesSummaryRLS.test.ts`) so the global mock in `src/tests/setup.ts` is not silently overridden for other tests in the same run.
- Do not add `console.log` statements to production code as part of test debugging — `console.warn` inside test helpers is acceptable per CORE-022.

## Related

- Full audit report: `docs/audit/reports/`
- Test runner config: `vitest.config.ts` (root)
- Seed command: `npm run seed:e2e:dashboard-v3`
