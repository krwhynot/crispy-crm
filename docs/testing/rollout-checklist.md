# Test Coverage Rollout Checklist

## Completed ✅

- [x] Phase 1: Immediate cleanup (quarantine legacy tests, fix scripts)
- [x] Phase 2: Standardize Playwright (auth fixture, consolidated suites)
- [x] Phase 3: Fix coverage reporting (vitest.config.ts now measures src/**/*.{ts,tsx})
- [x] Phase 4: Rebuild CSV import tests (5 passing integration tests with Supabase harness)
- [x] Phase 5: Dashboard V2 filter tests (10 unit tests + 3 E2E sidebar collapse tests)
- [x] Phase 6: Documentation (testing strategy, E2E standards, rollout checklist)

## Sprint 1 (In Progress)

- **RLS policy coverage** ✅
  - [x] Scaffold `tests/integration/rls-policies.test.ts` (using `vitest -c vitest.integration.config.ts`)
  - [x] Add admin-only UPDATE/DELETE policy assertions (19 tests: contacts, organizations, opportunities)
  - [x] Add personal task `created_by` filter test case (4 tests: SELECT, INSERT, UPDATE, DELETE)
  - [x] Fix permissive RLS policies (migration `20251116124147_fix_permissive_rls_policies.sql`)

- **Auth flow integration rewrite** ✅
  - [x] Move legacy mocked tests out of `src/tests/integration/auth-flow.test.ts` (moved to `.quarantine/`)
  - [x] Implement real Supabase login/logout/session refresh cases in `tests/integration/auth-flow.test.ts` (18 tests)
  - [x] Cover refresh-token failure + error scenarios (invalid token, empty token, unauthenticated user)

- **Opportunities E2E stabilization** ✅
  - [x] Update `tests/e2e/specs/opportunities/crud.spec.ts` to use `tests/e2e/support/fixtures/authenticated`
  - [x] Add deterministic seed/reset helper for opportunity data (`tests/e2e/support/helpers/opportunity-seed.ts`)
  - [x] Remove all arbitrary timeouts (replaced with condition-based waiting)
  - [ ] Run suite on CI and capture flake metrics (deferred - POM needs fixes first)

## Sprint 2 (Weeks 3-4)

- **Dashboard V2 UI/UX acceptance** ⚠️ Partial (60% complete)
  - [x] Validate filters (health/stage/assignee/last touch), clear/reset, active badge counts ✅
    - 18 tests passing in `tests/e2e/dashboard-v2-filters.spec.ts`
    - All filter types tested, persistence verified
  - [x] Test sidebar collapse/expand ⚠️ 5/6 tests passing
    - 5 tests passing in `tests/e2e/dashboard-v2-filters.spec.ts`
    - 1 test skipped (focus test) - documented in `docs/testing/known-issues.md`
  - [x] Test keyboard nav + focus states ✅
    - 1 passing, 6 conditional skips in `tests/e2e/dashboard-v2-keyboard.spec.ts`
    - Conditional skips are intentional (data-dependent tests)
  - [x] Fix ARIA tree structure ✅
    - 5/5 tests passing in `tests/e2e/dashboard-v2-a11y.spec.ts`
    - Changed `role="region"` to `role="tree"` in `OpportunitiesHierarchy.tsx`
  - [x] Document shared shell accessibility violations ✅
    - Created `docs/testing/shared-shell-a11y-violations.md`
    - 4 violations (button-name, color-contrast, landmark-unique, page-has-heading-one)
    - Violations are in app shell, not Dashboard V2 code
  - [x] Create coverage assessment ✅
    - Created `docs/testing/dashboard-v2-ui-ux-coverage.md`
    - Identified gaps: task grouping, task completion, opportunity slide-over, screenshots
  - [ ] Test table sorting (task grouping) ❌ Missing
    - **Gap:** No tests for task grouping dropdown (due/priority/principal modes)
    - **Recommended:** Create `tests/e2e/dashboard-v2-task-grouping.spec.ts`
  - [ ] Test quick actions (task completion) ❌ Missing
    - **Gap:** No explicit tests for inline task completion checkboxes
    - **Recommended:** Create `tests/e2e/dashboard-v2-task-actions.spec.ts`
  - [ ] Test quick actions (opportunity clicks) ❌ Missing
    - **Gap:** No tests for opportunity row click → slide-over open
    - **Recommended:** Create `tests/e2e/dashboard-v2-slide-over.spec.ts`
  - [ ] Capture masked screenshots for desktop/iPad/narrow desktop ❌ Missing
    - **Gap:** No screenshot baselines for visual regression testing
    - **Recommended:** Create `tests/e2e/dashboard-v2-screenshots.spec.ts`

- **Business workflow automation**
  - [ ] Script opportunity close → won flow end-to-end
  - [ ] Script activity logging + follow-up task creation
  - [ ] Script dashboard filter → drill-down navigation path

- **Unit/integration coverage improvements**
  - [ ] Raise `src/atomic-crm/dashboard/v2/components/` coverage from 40% → 70%
  - [ ] Replace mocked provider tests with Supabase-/MSW-backed tests for `src/providers/supabase/unifiedDataProvider.ts`

## Sprint 3 (Weeks 5-6)

- **Visual regression baseline**
  - [ ] Select tooling (Percy vs Chromatic) and integrate auth
  - [ ] Capture baseline snapshots for Dashboard V2, Kanban, Reports
  - [ ] Wire snapshot check into CI

- **Performance / load**
  - [ ] Add Lighthouse CI step for dashboard (target ≥ 95 accessibility)
  - [ ] Script CSV import load test (1000+ rows) and record metrics

## Ongoing

- [ ] Enforce 70% coverage in CI (add `vitest run --coverage` gate to `.github/workflows/ci.yml` → `test` job)
- [ ] Add coverage delta comments on PRs
- [ ] Monthly review of flaky tests (retry rate > 5%)
