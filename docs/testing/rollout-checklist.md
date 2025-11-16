# Test Coverage Rollout Checklist

## Completed ✅

- [x] Phase 1: Immediate cleanup (quarantine legacy tests, fix scripts)
- [x] Phase 2: Standardize Playwright (auth fixture, consolidated suites)
- [x] Phase 3: Fix coverage reporting
- [ ] Phase 4: Rebuild CSV import tests (blocked until Supabase harness specs run end-to-end)
- [ ] Phase 5: Dashboard V2 filter tests (unit + Playwright coverage still pending)
- [ ] Phase 6: Documentation (rollout guide will be updated after Sprint 2)

## Sprint 1 (Next 2 Weeks)

- [ ] Add RLS policy integration tests
  - Files: create `tests/integration/rls-policies.test.ts` (runs via `vitest -c vitest.integration.config.ts`)
  - Verify admin-only UPDATE/DELETE policies
  - Test personal task access (sales_id filtering)

- [ ] Add auth flow integration tests (replace mocked version)
  - Files: migrate logic from `src/tests/integration/auth-flow.test.ts` into `tests/integration/auth-flow.test.ts`
  - Test login, logout, session refresh with real Supabase
  - Use Supabase test harness (no global mocks)

- [ ] Stabilize Opportunities E2E suite
  - Files: `tests/e2e/specs/opportunities/crud.spec.ts`
  - Fix auth redirects (reuse `tests/e2e/support/fixtures/authenticated`)
  - Ensure seeded data for stable runs

## Sprint 2 (Weeks 3-4)

- [ ] Add business workflow E2E tests
  - Opportunity close → won flow
  - Activity logging with follow-up task
  - Principal dashboard filtering → drill-down

- [ ] Improve unit test coverage for:
  - `src/atomic-crm/dashboard/v2/components/` (40% → 70%)
  - `src/providers/supabase/unifiedDataProvider.ts` (mocked → real API)

## Sprint 3 (Weeks 5-6)

- [ ] Visual regression baseline
  - Capture snapshots for Dashboard V2, Kanban, Reports
  - Set up Percy or Chromatic integration

- [ ] Performance testing
  - Lighthouse CI for Dashboard (target: 95+ accessibility)
  - Load testing for CSV imports (1000+ rows)

## Ongoing

- [ ] Enforce 70% coverage in CI (add to `.github/workflows/ci.yml`)
  - Add `vitest run --coverage` gate to `ci.yml` → `test` job
- [ ] Add coverage delta comments on PRs
- [ ] Monthly review of flaky tests (retry rate > 5%)
