# Risk Report — Module Risk Assessment

**Generated:** 2026-03-03T23:30:00Z
**Baseline source:** `docs/audit/baseline/risk-assessment.json`
**Audit type:** Incremental (current run: 2026-03-03T23:00:00Z)

---

## Summary

| Metric | Value |
|---|---|
| Total modules assessed | 33 |
| High risk | 8 |
| Medium risk | 12 |
| Low risk | 13 |
| Highest-risk module | `providers` (score: 95) |
| Safest module | `login` |

---

## Full Risk Matrix

All 33 modules ranked by risk score. Confidence reflects audit agent certainty about the module's state.

| Module | Path | Risk | Score | LOC | Files | Dependents | 30d Commits | 14d Commits | Test Coverage | Phase |
|---|---|---|---|---|---|---|---|---|---|---|
| providers | `src/atomic-crm/providers/` | **HIGH** | 95 | 24,967 | 116 | 6 | 41 | 22 | full | 3 |
| opportunities | `src/atomic-crm/opportunities/` | **HIGH** | 93 | 26,753 | 152 | 19 | 37 | 10 | full | 3 |
| supabase | `supabase/` | **HIGH** | 92 | 17,070 | 31 | 0 | 57 | 29 | partial | 3 |
| src/components | `src/components/` | **HIGH** | 88 | 41,900 | 200 | 20 | 49 | 19 | partial | 3 |
| validation | `src/atomic-crm/validation/` | **HIGH** | 85 | 19,702 | 96 | 91 | 33 | 10 | full | 2 |
| organizations | `src/atomic-crm/organizations/` | **HIGH** | 80 | 18,539 | 97 | 3 | 37 | 14 | full | 3 |
| contacts | `src/atomic-crm/contacts/` | **HIGH** | 78 | 15,883 | 80 | 0 | 32 | 10 | full | 3 |
| dashboard | `src/atomic-crm/dashboard/` | **HIGH** | 75 | 13,479 | 62 | 0 | 30 | 6 | full | 3 |
| utils | `src/atomic-crm/utils/` | medium | 65 | 5,858 | 35 | 73 | 14 | 6 | partial | 2 |
| reports | `src/atomic-crm/reports/` | medium | 60 | 9,557 | 58 | 5 | 26 | 4 | full | 2 |
| sales | `src/atomic-crm/sales/` | medium | 58 | 3,173 | 20 | 0 | 25 | 17 | partial | 2 |
| services | `src/atomic-crm/services/` | medium | 55 | 4,634 | 18 | 8 | 14 | 11 | partial | 2 |
| filters | `src/atomic-crm/filters/` | medium | 55 | 6,209 | 22 | 1 | 16 | 4 | **none** | 2 |
| activities | `src/atomic-crm/activities/` | medium | 50 | 4,473 | 24 | 1 | 20 | 5 | full | 2 |
| tasks | `src/atomic-crm/tasks/` | medium | 48 | — | 29 | 3 | — | — | full | 2 |
| products | `src/atomic-crm/products/` | medium | 45 | — | 27 | 0 | — | — | partial | 2 |
| productDistributors | `src/atomic-crm/productDistributors/` | medium | 42 | — | 12 | 0 | — | — | partial | 2 |
| hooks | `src/atomic-crm/hooks/` | medium | 40 | — | 14 | 13 | — | — | partial | 2 |
| constants | `src/atomic-crm/constants/` | medium | 38 | — | 5 | 72 | — | — | partial | 1 |
| queryKeys | `src/atomic-crm/queryKeys.ts` | medium | 35 | — | 1 | 34 | — | — | partial | 1 |
| types | `src/atomic-crm/types.ts` | medium | 30 | — | 1 | 34 | — | — | partial | 1 |
| notes | `src/atomic-crm/notes/` | low | 25 | — | 7 | 0 | — | — | none | 1 |
| timeline | `src/atomic-crm/timeline/` | low | 22 | — | 5 | 1 | — | — | none | 1 |
| tags | `src/atomic-crm/tags/` | low | 20 | — | 18 | 0 | — | — | none | 1 |
| notifications | `src/atomic-crm/notifications/` | low | 18 | — | 4 | 0 | — | — | partial | 1 |
| settings | `src/atomic-crm/settings/` | low | 18 | — | 13 | 0 | — | — | partial | 1 |
| root | `src/atomic-crm/root/` | low | 15 | — | 6 | 0 | — | — | none | 1 |
| contexts | `src/atomic-crm/contexts/` | low | 15 | — | 7 | 0 | — | — | none | 1 |
| layout | `src/atomic-crm/layout/` | low | 12 | — | 5 | 1 | — | — | none | 1 |
| shared | `src/atomic-crm/shared/` | low | 10 | — | 1 | 1 | — | — | none | 1 |
| admin | `src/atomic-crm/admin/` | low | 10 | — | 2 | 0 | — | — | none | 1 |
| config | `src/atomic-crm/config/` | low | 8 | — | 1 | 0 | — | — | none | 1 |
| login | `src/atomic-crm/login/` | low | 5 | — | 4 | 1 | — | — | partial | 1 |

Note: `—` in LOC/commits columns indicates metric not captured in this baseline cycle for low-priority modules.

---

## Phase Boundary Recommendations

Phase assignments govern deployment review gates and regression scope. Higher phases require more sign-off.

| Phase | Modules | Rationale |
|---|---|---|
| Phase 3 (highest review burden) | providers, opportunities, supabase, src/components, organizations, contacts, dashboard | Active churn, high coupling, or production-only deployment path |
| Phase 2 (standard review) | validation, utils, reports, sales, services, filters, activities, tasks, products, productDistributors, hooks, constants, queryKeys, types | Moderate churn; contained blast radius |
| Phase 1 (low gate) | notes, timeline, tags, notifications, settings, root, contexts, layout, shared, admin, config, login | Low churn, low coupling, leaf modules |

---

## Regression Testing Priorities

| Priority | Module | Basis | Recommended Action |
|---|---|---|---|
| P0 | `filters` | 0 test files, 16 commits in 30d, consumed by all list views | Add Vitest tests: debounce, preset filter, header filter edge cases |
| P1 | `providers/authProvider.ts` | 14+ commits in 14d; auth flow lockout risk | Expand authProvider.test.ts to cover recovery redirect, OTP invite, PASSWORD_RECOVERY event |
| P1 | `supabase` | Uncommitted migration in working tree; 29 commits in 14d | Push `20260303110000_fix_admin_restore_sale_race.sql`; add pgTAP test for TOCTOU fix |
| P2 | `src/components` | 19 commits in 14d (3rd consecutive audit above threshold); partial test coverage | Add column-filter regression tests; audit ListToolbar.tsx and AdaptiveFilterContainer.tsx |
| P2 | `validation` | 91 fan-in; schema regressions cascade everywhere | Increase Zod schema test coverage; validate all enums against DB allowlists |
| P2 | `utils` | 73 fan-in; partial test coverage | Audit uncovered utility functions; prioritize avatar.utils.ts and date helpers |
| P3 | `sales` | 17 commits in 14d (3rd consecutive CI/CD threshold breach); SalesPermissionsTab hotspot | Add tests for disable/reassign dialog flows |
| P3 | `services` | Partial coverage; `sales.service.ts` is high-churn | Add service-layer unit tests for junction and opportunity services |

---

## Modules with Elevated Churn This Cycle

| Module | Previous 30d Commits | Current 30d Commits | Severity |
|---|---|---|---|
| filters | 0 | 16 | Watch — active refactoring, zero tests |
| layout | 0 | 7 | Watch — list architecture unification |
| supabase | — | 57 | Watch — uncommitted working tree changes |
| src/components | — | 49 | Persistent — 3rd consecutive audit above threshold |
| sales | — | 25 | Persistent — 3rd consecutive audit above CI/CD threshold |

Source: `risk-assessment.json` `changes_since_last_audit`

---

## Uncommitted Work Requiring Action

| Item | File | Risk |
|---|---|---|
| ⚠️ New migration | `supabase/migrations/20260303110000_fix_admin_restore_sale_race.sql` | TOCTOU race fix not yet pushed to production |
| ⚠️ Modified edge function | `supabase/functions/users/index.ts` | Working tree modification uncommitted |

---

## Confidence Statement

Risk scores are computed from LOC, churn (git commits), coupling (fan-in/fan-out), test coverage, and doc quality factors. All data sourced from `risk-assessment.json`. Low-priority module detail metrics not fully captured this cycle — marked with `—` above.

[Confidence: 91%]
