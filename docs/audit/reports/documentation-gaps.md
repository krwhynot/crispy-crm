# Documentation Gaps Report

**Generated:** 2026-03-03T23:30:00Z
**Baseline sources:** `docs/audit/baseline/documentation-coverage.json`, `docs/audit/baseline/document-linkage.json`
**Audit type:** Incremental (last audit: 2026-03-03T20:00:00Z)

---

## Summary

| Metric | Previous | Current | Delta |
|---|---|---|---|
| Total documentation files | 64 | 175 | +111 |
| Modules with README | 9 | 37 | +28 |
| Modules without README | — | 4 | — |
| Average quality score | 3.7 | 4.2 | +0.5 |
| ADR count | — | 4 | — |
| Features with PRD | 2 | 7 | +5 |
| Features with BRD | 5 | 8 | +3 |
| Features missing all docs | 1 | 0 | Gap closed |
| JSDoc coverage (est.) | — | ~20% | Low |
| TODO/FIXME count | — | 21 | Stable |

---

## Improvements This Cycle

The following documentation was added between the previous and current audit runs:

- 37 new module READMEs added across `src/atomic-crm/` and `src/components/`
- `supabase/README.md` added — covers schema, edge functions, security-sensitive RPCs, migration workflow
- 3 new PRDs added: `docs/prd/contacts/`, `docs/prd/organizations/`, `docs/prd/opportunities/`
- 5 total PRDs created this run (dashboard, validation, providers, components, supabase)
- `projects_with_readme` increased from 9 to 37 — near-complete module coverage achieved
- `avg_quality_score` improved from 3.7 to 4.2
- ~70 new `.claude/skills` markdown documents added
- JSDoc density in provider handlers improved from minimal to light (112 JSDoc blocks across 31 handler files)

---

## Modules Missing README

Only 4 modules currently lack a README. Two are feature modules; two are newly identified feature areas.

| Module | Path | Risk Level | Status |
|---|---|---|---|
| `segments` | `src/atomic-crm/segments/` (inferred) | low | No README found |
| `FormWizard` / onboarding | (inferred from linkage) | low | No README found |
| `validation` submodules | Individual Zod schema files | — | README exists at module level, not per-file |
| root-level project | `/` | — | No `README.md` for human contributor onboarding (`CLAUDE.md` is AI-only) |

Source: `document-linkage.json` (readme: null entries), `documentation-coverage.json`

---

## README Quality Distribution

| Quality Score | Count | Modules |
|---|---|---|
| 5 (full, exemplary) | 13 | providers/supabase, providers, supabase, activities, sales, opportunities, validation, src/components, tasks, column-filters, reports, filters, src/atomic-crm/components |
| 4 (full, good) | 20 | services, hooks, constants, productDistributors, timeline, products, notes, settings, login, notifications, admin, layout, root, shared, tests, utils, tags, contexts, config, src/components/ra-wrappers |
| 3 (partial) | 4 | contacts, organizations, dashboard, pages |
| Missing | 4 | segments, FormWizard, root README, — |

Contacts, organizations, and dashboard READMEs are shorter than their peers and would benefit from expansion.

---

## Feature Document Linkage — Full Coverage Table

| Feature | Risk | BRD | PRD | ADR | README | Gaps |
|---|---|---|---|---|---|---|
| Contacts | high | `docs/brd/contacts.md` | `docs/prd/contacts/PRD-contacts.md` | — | `src/atomic-crm/contacts/README.md` | ADR recommended (10 fan-out, no ADR) |
| Organizations | high | `docs/brd/organizations.md` | `docs/prd/organizations/PRD-organizations.md` | — | `src/atomic-crm/organizations/README.md` | ADR recommended (self-referential hierarchy) |
| Opportunities | high | `docs/brd/opportunities.md` | `docs/prd/opportunities/PRD-opportunities.md` | — | `src/atomic-crm/opportunities/README.md` | ADR recommended (19 fan-in, no ADR) |
| Dashboard | high | `docs/brd/dashboard.md` | `docs/prd/dashboard/PRD-dashboard.md` | — | `src/atomic-crm/dashboard/README.md` | ADR needed: V3 vs V4 strategy and pipeline caching |
| Validation | high | — | `docs/prd/validation/PRD-validation.md` | `docs/adr/004-validation-at-provider-boundary.md` | `src/atomic-crm/validation/README.md` | BRD gap (system-layer; architecture note preferred) |
| Providers | high | — | `docs/prd/providers/PRD-providers.md` | `docs/adr/001-supabase-provider-pattern.md` | `src/atomic-crm/providers/README.md` | BRD gap; ADR needed for authProvider caching and StorageService signed URL |
| Components | high | — | `docs/prd/components/PRD-components.md` | `docs/adr/003-three-tier-ui-architecture.md` | `src/components/README.md` | BRD gap (tier-separation architecture note preferred) |
| Supabase | high | — | `docs/prd/supabase/PRD-supabase.md` | `docs/adr/002-soft-delete-convention.md` | `supabase/README.md` | BRD gap; ADR needed for storage RLS gaps and SECURITY DEFINER RPC inventory |
| Sales | medium | `docs/brd/sales.md` | — | — | `src/atomic-crm/sales/README.md` | PRD missing |
| Tasks | medium | `docs/brd/tasks.md` | — | — | `src/atomic-crm/tasks/README.md` | PRD missing |
| Activities | medium | `docs/brd/activities.md` | — | — | `src/atomic-crm/activities/README.md` | PRD missing |
| Products | medium | `docs/brd/products.md` | — | — | `src/atomic-crm/products/README.md` | PRD missing |
| Reports | medium | — | — | — | `src/atomic-crm/reports/README.md` | BRD and PRD missing |
| Filters | medium | — | — | — | `src/atomic-crm/filters/README.md` | BRD and PRD missing; test coverage also 0 |
| Timeline | medium | — | — | — | `src/atomic-crm/timeline/README.md` | BRD and PRD missing |
| Services | medium | — | `docs/prd/providers/PRD-providers.md` | — | `src/atomic-crm/services/README.md` | BRD gap; ADR needed for service layer constructor injection |
| ProductDistributors | medium | — | — | — | `src/atomic-crm/productDistributors/README.md` | BRD and PRD missing |
| Hooks | medium | — | — | — | `src/atomic-crm/hooks/README.md` | No formal docs |
| Constants | medium | — | — | — | `src/atomic-crm/constants/README.md` | No formal docs |
| Utils | medium | — | — | — | `src/atomic-crm/utils/README.md` | No formal docs |
| Settings | low | — | — | — | `src/atomic-crm/settings/README.md` | — |
| Notifications | low | — | — | — | `src/atomic-crm/notifications/README.md` | — |
| Tags | low | — | — | — | `src/atomic-crm/tags/README.md` | — |
| Login | low | — | — | — | `src/atomic-crm/login/README.md` | — |
| Notes | low | — | — | — | `src/atomic-crm/notes/README.md` | — |
| Segments | low | — | — | — | — | README, BRD, PRD all missing |
| Root | low | — | — | — | `src/atomic-crm/root/README.md` | — |
| AppLayout | low | — | — | — | `src/atomic-crm/layout/README.md` | — |
| Contexts | low | — | — | — | `src/atomic-crm/contexts/README.md` | — |
| Admin | low | — | — | — | `src/atomic-crm/admin/README.md` | — |
| SharedComponents | low | — | — | — | `src/atomic-crm/shared/README.md` | — |
| FormWizard | low | — | — | — | — | README missing |

---

## High-Risk Modules Without ADR

Two high-coupling modules lack ADRs despite significant architectural surface:

| Module | Fan-In | Fan-Out | Gap |
|---|---|---|---|
| `opportunities` | 19 | 10 | No ADR documenting 7-stage pipeline transitions, duplicate detection, Kanban layout decisions |
| `contacts` | 0 | 10 | No ADR documenting CSV import wizard design, junction table strategy |

Source: `document-linkage.json` `cross_references.high_coupling_no_adr`

---

## Medium-Risk Modules Missing BRD

These medium-risk modules have READMEs but no BRD capturing business context:

| Module | Risk | Has README | Has PRD | Has ADR |
|---|---|---|---|---|
| reports | medium | yes | no | no |
| filters | medium | yes | no | no |
| timeline | medium | yes | no | no |
| services | medium | yes | partial (providers PRD) | no |
| hooks | medium | yes | no | no |
| constants | medium | yes | no | no |
| utils | medium | yes | no | no |
| productDistributors | medium | yes | no | no |

Source: `document-linkage.json` `cross_references.medium_risk_no_brd`

---

## JSDoc Coverage

Current estimated JSDoc coverage is approximately 20% of TypeScript source files.

| Area | JSDoc Status | Notes |
|---|---|---|
| Provider handlers (`src/atomic-crm/providers/supabase/handlers/`) | Light (improved) | 112 JSDoc blocks added across 31 handler files this cycle |
| Feature UI components | Minimal | Most `.tsx` files have no JSDoc |
| Validation schemas | None | Zod schemas are self-documenting by type; JSDoc would add value for non-obvious rules |
| Utility functions | Sparse | High-priority given 73 fan-in |
| Service layer | Sparse | Partial coverage |
| Edge functions (Deno) | None | No per-function documentation |

---

## TODO/FIXME Hotspots

21 TODO/FIXME items tracked. Count is stable since last audit.

| Category | Count | Detail |
|---|---|---|
| Disabled tests | 6 | Located in `CampaignActivityReport`; tests marked as skipped/disabled |
| Other TODOs | 15 | Distributed across codebase; specific files not enumerated in baseline |

Source: `documentation-coverage.json` `todo_fixme_count: 21`

The 6 disabled tests in `CampaignActivityReport` are the highest-priority TODO items — disabled tests represent untested code paths.

---

## Remaining Coverage Gaps (Prioritized)

| Priority | Gap | Recommended Action |
|---|---|---|
| P1 | No root-level `README.md` for human onboarding | Create a developer-facing README separate from CLAUDE.md |
| P1 | 6 disabled tests in `CampaignActivityReport` | Re-enable or delete; dead test code creates false coverage signals |
| P2 | No per-function documentation for supabase edge functions | Add per-function README or JSDoc to each `supabase/functions/*/index.ts` |
| P2 | No migration index document | Create `supabase/migrations/MIGRATIONS.md` cataloguing all migrations and their purpose |
| P2 | ADRs needed: `opportunities`, `contacts`, `dashboard`, `supabase` | Write ADRs for key architectural decisions in high-risk modules |
| P3 | JSDoc coverage ~20% | Prioritize `utils/` and provider handlers given fan-in counts |
| P3 | `contacts`, `organizations`, `dashboard` README quality 3 | Expand these READMEs to match quality-5 peers |

---

## Confidence Statement

Documentation coverage data sourced from `documentation-coverage.json` and `document-linkage.json`. JSDoc coverage is an estimate derived from baseline observations, not a line-by-line count. README quality scores reflect agent assessment on a 1-5 scale.

[Confidence: 90%]
