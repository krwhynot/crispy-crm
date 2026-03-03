# Documentation Gaps Report

**Generated:** 2026-03-03
**Baseline run:** incremental (prior run: 2026-03-03T00:00:00Z)
**Sources:** `docs/audit/baseline/documentation-coverage.json`, `docs/audit/baseline/document-linkage.json`, `docs/audit/baseline/feature-inventory.json`
**Confidence:** 92%

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Total doc files | 47 |
| Projects with README | 5 |
| Projects without README | 9 |
| JSDoc coverage | ~12% |
| Average doc quality score | 3.4 / 5 |
| ADR count | 4 |
| BRD coverage | 4/19 features (21%) |
| PRD coverage | 0/19 features (0%) |
| TODO/FIXME instances | 21 |
| CLAUDE.md present | Yes |

---

## 2. BRD / PRD / ADR Coverage Matrix

| Domain | BRD | PRD | ADR-001 | ADR-002 | ADR-003 | ADR-004 |
|--------|-----|-----|---------|---------|---------|---------|
| Contacts | Yes | No | Yes | Yes | Yes | Yes |
| Organizations | Yes | No | Yes | Yes | Yes | Yes |
| Opportunities | Yes | No | Yes | Yes | Yes | Yes |
| Dashboard | Yes | No | No | No | Yes | No |
| Sales | No | No | Yes | Yes | No | Yes |
| Tasks | No | No | Yes | Yes | No | Yes |
| Activities | No | No | Yes | Yes | No | Yes |
| Notes | No | No | No | No | No | No |
| Products | No | No | Yes | Yes | No | Yes |
| ProductDistributors | No | No | Yes | Yes | No | Yes |
| Reports | No | No | No | No | Yes | No |
| Settings | No | No | No | No | No | No |
| Notifications | No | No | No | No | Yes | No |
| Tags | No | No | No | No | Yes | No |
| Login | No | No | No | No | No | No |
| Segments | No | No | No | No | No | No |
| Timeline | No | No | No | No | No | No |
| Filters | No | No | No | No | No | No |
| Admin | No | No | No | No | No | No |

**ADR key:**
- ADR-001: `docs/adr/001-supabase-provider-pattern.md`
- ADR-002: `docs/adr/002-soft-delete-convention.md`
- ADR-003: `docs/adr/003-three-tier-ui-architecture.md`
- ADR-004: `docs/adr/004-validation-at-provider-boundary.md`

---

## 3. Modules Missing READMEs

The following modules have no README file. Listed with risk level to prioritize authoring effort.

| Module | Path | Risk Level | Has BRD | Notes |
|--------|------|-----------|---------|-------|
| `organizations` | `src/atomic-crm/organizations/` | HIGH | Yes | Hierarchy, authorization tabs, product exceptions undocumented |
| `contacts` | `src/atomic-crm/contacts/` | HIGH | Yes | CSV import wizard and junction table undocumented |
| `dashboard` | `src/atomic-crm/dashboard/` | HIGH | Yes | Complex hooks, two competing versions undocumented |
| `opportunities` | `src/atomic-crm/opportunities/` | HIGH | Yes | Kanban, slideOverTabs, close workflows undocumented |
| Root (`/`) | `/` | HIGH | — | No root `README.md`; `CLAUDE.md` serves AI sessions, not human onboarding |
| `supabase/functions` | `supabase/functions/` | MEDIUM | — | 6 edge functions with no trigger, env var, or failure mode docs |
| `supabase/migrations` | `supabase/migrations/` | MEDIUM | — | No migration index; uneven comment quality |
| `validation` | `src/atomic-crm/validation/` | HIGH (fan-in: 91) | — | Schema source-of-truth with no module README |
| `filters` | `src/atomic-crm/filters/` | MEDIUM | — | `README.md` present per feature-inventory (confirms boundary); quality not assessed |

The `src/atomic-crm/providers/supabase/` README and `src/components/ra-wrappers/column-filters/README.md` are both rated 5/5 and serve as the documentation quality reference for other modules.

---

## 4. Features Missing PRDs or BRDs

### Missing BRD (15 features)

BRDs are the primary business requirements document. These features have no BRD:

| Feature | Risk Level | Commits/30d | Recommended Priority |
|---------|-----------|-------------|---------------------|
| Sales | MEDIUM | 24 | High — exceeds CI/CD churn threshold, RBAC logic |
| Tasks | MEDIUM | 27 | High — high churn, snooze behavior, dashboard coupling |
| Activities | MEDIUM | 20 | High — drives 10+ activities/week KPI |
| Products | MEDIUM | 19 | Medium — junction relationships unconfirmed |
| ProductDistributors | MEDIUM | 10 | Medium — junction RLS risk, zero tests |
| Reports | MEDIUM | 25 | Medium — cross-entity aggregation logic |
| Notifications | LOW | 7 | Medium — edge function-driven |
| Settings | LOW | 2 | Low — small, stable module |
| Notes | LOW | 6 | Medium — XSS boundary via dompurify |
| Tags | LOW | 11 | Low — simple lookup entity |
| Login | LOW | 0 | Low — thin wrapper |
| Segments | MEDIUM | 0 | Medium — embedded in orgs, no standalone UI |
| Timeline | MEDIUM | 0 | Low — new feature, limited scope |
| Filters | MEDIUM | 0 | Low — new feature, UI-only |
| Admin | LOW | 0 | Low — new feature, Sentry integration |

### Missing PRD (all 19 features)

Zero features have a PRD. PRDs document user stories, acceptance criteria, and UX flows. This is a systemic gap. Recommended authoring order mirrors the BRD priority list above, starting with Sales, Tasks, and Activities.

---

## 5. JSDoc Coverage by Module

Overall JSDoc coverage is approximately 12% of public APIs. The following breakdown is based on the documentation-coverage baseline assessment.

| Module | JSDoc Coverage | Notes |
|--------|---------------|-------|
| `src/atomic-crm/providers/supabase` | Partial | README excellent; individual handler files have minimal JSDoc |
| `src/atomic-crm/contacts` | Low | No JSDoc on public APIs |
| `src/atomic-crm/organizations` | Low | Hierarchy and authorization components undocumented |
| `src/atomic-crm/opportunities` | Low | Kanban and close workflows have no explanatory JSDoc |
| `src/atomic-crm/dashboard` | Low | Complex dashboard hooks undocumented |
| `supabase/functions` | None | 6 edge functions with no JSDoc or inline documentation |
| `supabase/migrations` | Partial | Uneven comment quality across migration files |
| All other modules | Not assessed | Assumed similar to project average (~12%) |

The project has a Storybook setup (`@chromatic-com/storybook`, `@storybook/addon-docs` in `package.json`) which could be leveraged to improve component documentation, but current story coverage is not catalogued in this baseline.

---

## 6. TODO / FIXME Hotspots

The baseline reports 21 TODO/FIXME instances. Key items requiring action:

| Item | Description | Impact |
|------|-------------|--------|
| TODO-004a | Win/Loss validation incomplete | Business logic gap in opportunity close workflow |
| 5 disabled tests | Awaiting RPC implementation | Test coverage gaps that may hide regressions |
| 3 placeholder tests | No implementation | Coverage metrics overstated |

Recommendation: Run `rg "TODO|FIXME" src/ supabase/ --type ts` to get the current full list and assign each item to a sprint.

---

## 7. Document Quality Scores

Existing documents rated by quality (5 = excellent, 1 = poor):

| Document | Type | Quality | Notes |
|----------|------|---------|-------|
| `CLAUDE.md` | Project guide | 5/5 | Comprehensive; covers all major areas |
| `docs/adr/001-supabase-provider-pattern.md` | ADR | 5/5 | Context, decision, wrapper chain, alternatives |
| `docs/adr/002-soft-delete-convention.md` | ADR | 5/5 | Three implementation layers, exceptions |
| `docs/adr/003-three-tier-ui-architecture.md` | ADR | 5/5 | Tier contracts, import rules, enforcement |
| `docs/adr/004-validation-at-provider-boundary.md` | ADR | 5/5 | Schema registry, withValidation, form resolver |
| `src/atomic-crm/providers/supabase/README.md` | README | 5/5 | ASCII diagram, golden rules, resource inventory |
| `src/components/ra-wrappers/column-filters/README.md` | README | 5/5 | Problem statement, props table, code examples |
| `docs/brd/contacts.md` | BRD | 4/5 | Schema fields, business rules, CRUD, UI views |
| `docs/brd/organizations.md` | BRD | 4/5 | Org types, enums, hierarchy, dual account mgmt |
| `docs/brd/opportunities.md` | BRD | 4/5 | 7-stage pipeline, duplicate detection, close workflows |
| `docs/brd/dashboard.md` | BRD | 4/5 | Read-only aggregate view, principal_pipeline_summary |
| `eslint-local-rules/README.md` | README | 4/5 | no-legacy-tailwind-colors rule with examples |
| `src/components/ra-wrappers/Readme.md` | README | 3/5 | Explains origin but not custom wrappers added |

---

## 8. Recommended Actions

### Immediate

1. Create a root `README.md` with project overview, setup instructions, and links to key docs. The current `CLAUDE.md` is AI-optimized and not a substitute for human onboarding.

### Short-term

2. Write BRDs for the four high-priority undocumented features: Sales, Tasks, Activities, and Products.
3. Add README files to `organizations`, `contacts`, `dashboard`, and `opportunities` (all high-risk, no README).
4. Add README to `supabase/functions/` with a table of all 6 edge functions, their triggers, required env vars, and failure modes.
5. Resolve the 5 disabled tests awaiting RPC implementation and 3 placeholder tests.
6. Address TODO-004a (Win/Loss validation) — business logic gap.

### Medium-term

7. Write PRDs for the top 5 features by business impact: Opportunities, Dashboard, Contacts, Organizations, Activities.
8. Increase JSDoc coverage from 12% to at least 40% on public APIs — prioritize `validation/`, `services/`, and `providers/` handlers.
9. Create a migration index document for `supabase/migrations/` listing each migration file, its purpose, and the date applied.

---

*Sources: `docs/audit/baseline/documentation-coverage.json`, `document-linkage.json`. Confidence: 92%.*
