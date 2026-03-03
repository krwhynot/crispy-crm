# Risk Report — Module Risk Assessment

**Generated:** 2026-03-03
**Run type:** Incremental (builds on 2026-03-03T12:00:00Z baseline)
**Sources:** `docs/audit/baseline/risk-assessment.json`, `docs/audit/baseline/audit-meta.json`
[Confidence: 95%]

---

## Summary

| Risk Level | Module Count | Change vs Previous |
|------------|-------------|-------------------|
| High (score 7-9) | 8 | +1 (supabase newly tracked) |
| Medium (score 4-6) | 12 | +2 (utils, constants newly tracked) |
| Low (score 1-3) | 8 | no change |
| **Total** | **28** | **+3** |

Highest-risk module: `providers` (score 9/10).
Safest module: `login` (score 1/10).

---

## Full Risk Matrix

All 28 tracked modules sorted by risk score descending.

| Module | Path | Risk | Score | LOC | Files | Dependents | Commits 30d | Commits 14d | Test Coverage | Phase |
|--------|------|------|-------|-----|-------|------------|------------|------------|---------------|-------|
| providers | src/atomic-crm/providers/ | High | 9 | 24,720 | 115 | 6 | 39 | 21 | full | 3 |
| opportunities | src/atomic-crm/opportunities/ | High | 9 | 26,828 | 152 | 19 | 37 | 11 | full | 3 |
| supabase | supabase/ | High | 9 | 16,051 | 30 | 0 | 54 | 27 | partial | 3 |
| src/components | src/components/ | High | 8 | 41,900 | 200 | 20 | 49 | 20 | partial | 3 |
| validation | src/atomic-crm/validation/ | High | 8 | 19,702 | 96 | 91 | 33 | 10 | full | 2 |
| contacts | src/atomic-crm/contacts/ | High | 7 | 15,883 | 80 | 0 | 31 | 10 | full | 3 |
| organizations | src/atomic-crm/organizations/ | High | 7 | 18,539 | 97 | 3 | 36 | 14 | full | 3 |
| dashboard | src/atomic-crm/dashboard/ | High | 7 | 13,479 | 62 | 0 | 29 | 6 | full | 3 |
| utils | src/atomic-crm/utils/ | Medium | 6 | 5,858 | 35 | 73 | 14 | 6 | partial | 2 |
| reports | src/atomic-crm/reports/ | Medium | 6 | 9,555 | 58 | 5 | 25 | 4 | full | 2 |
| sales | src/atomic-crm/sales/ | Medium | 5 | 3,173 | 20 | 0 | 25 | 18 | partial | 2 |
| services | src/atomic-crm/services/ | Medium | 5 | 4,637 | 18 | 8 | 14 | 11 | partial | 2 |
| filters | src/components/admin/column-filters/ | Medium | 5 | 4,991 | 22 | 1 | 0 | 4 | none | 2 |
| activities | src/atomic-crm/activities/ | Medium | 5 | 4,473 | 24 | 1 | 20 | 5 | full | 2 |
| products | src/atomic-crm/products/ | Medium | 5 | 4,257 | 27 | 0 | 19 | 6 | partial | 2 |
| tasks | src/atomic-crm/tasks/ | Medium | 5 | 3,825 | 29 | 3 | 27 | 7 | partial | 2 |
| hooks | src/atomic-crm/hooks/ | Medium | 4 | 2,435 | 14 | 13 | 9 | 6 | partial | 1 |
| productDistributors | src/atomic-crm/productDistributors/ | Medium | 4 | 508 | 11 | 11 | 10 | 4 | none | 2 |
| timeline | src/atomic-crm/timeline/ | Medium | 4 | 1,507 | 8 | 5 | 0 | 0 | none | 2 |
| constants | src/atomic-crm/constants/ | Medium | 4 | 325 | 5 | 72 | 3 | 1 | none | 2 |
| tags | src/atomic-crm/tags/ | Low | 3 | 932 | 18 | 0 | 11 | 4 | partial | 1 |
| notes | src/atomic-crm/notes/ | Low | 3 | 530 | 7 | 7 | 6 | 4 | partial | 1 |
| settings | src/atomic-crm/settings/ | Low | 3 | 820 | 12 | 0 | 2 | 1 | none | 1 |
| components (atomic) | src/atomic-crm/components/ | Low | 3 | 1,218 | 8 | 7 | 0 | 0 | none | 1 |
| notifications | src/atomic-crm/notifications/ | Low | 2 | 257 | 3 | 3 | 7 | 4 | none | 1 |
| layout | src/atomic-crm/layout/ | Low | 2 | 318 | 5 | 5 | 0 | 1 | none | 1 |
| contexts | src/atomic-crm/contexts/ | Low | 2 | 238 | 4 | 7 | 0 | 2 | none | 1 |
| login | src/atomic-crm/login/ | Low | 1 | 27 | 3 | 3 | 0 | 0 | none | 1 |

---

## Newly Tracked Modules (This Run)

Three modules entered risk tracking for the first time this audit cycle.

| Module | Risk Score | Reason for Elevation | Notes |
|--------|------------|---------------------|-------|
| supabase | 9 (High) | 16K LOC production SQL; 54 commits/30d; Caution Zone per CLAUDE.md | Phase 3. No rollback path for migrations. RLS governs all tenant isolation. |
| utils | 6 (Medium) | 73 fan-in dependents; circular dep with opportunities now resolved | Phase 2. Partial test coverage. fan_out reduced from 2 to 1. |
| constants | 4 (Medium) | 72 fan-in dependents; stage-enums.ts is new canonical home post-refactor | Phase 2. Any enum rename breaks 72 consumers. No tests. |

---

## Phase Boundary Recommendations

### Phase 1 — Low Risk (Safe to modify freely)

**Scope:** hooks, tags, notes, settings, notifications, login, layout, contexts, components (atomic-crm)

**Rationale:** Low LOC, low churn, isolated blast radius.

**Entry criteria:**
- Local build verified: `npm install` and `npx tsc --noEmit` passes
- `npm run lint` passes with zero errors
- Developer has read `CLAUDE.md` and `CORE_CONSTRAINTS.md`

**Exit criteria:**
- All unit tests pass (`npm run test`)
- Zero TypeScript errors (`npx tsc --noEmit`)
- Code review by one developer
- No new console statements in production code (CMD-001)

### Phase 2 — Medium Risk (Requires broader verification)

**Scope:** validation, utils, constants, reports, filters, activities, products, tasks, sales, services, timeline, productDistributors

**Rationale:** Moderate LOC, partial test coverage, or notable coupling. `validation` (91 fan-in), `utils` (73 fan-in), and `constants` (72 fan-in) require broad verification. `sales` exceeds CI/CD churn threshold for the second consecutive audit. `productDistributors` has RLS exposure.

**Entry criteria:**
- Phase 1 complete and exit criteria verified
- Developer has reviewed `dependency-map.json` for fan-in counts
- Validation schema changes reviewed by tech lead
- RLS policies reviewed for junction-table changes (DB-008)
- `constants/stage-enums` changes require review of all pipeline stage consumers

**Exit criteria:**
- All unit tests pass
- Zero TypeScript errors
- SQL dry-run passes: `npx supabase db push --dry-run`
- RLS policy audit run: CMD-006
- Code review by two developers for `validation`, `utils`, or `constants` changes

### Phase 3 — High Risk (Requires staging sign-off)

**Scope:** providers, opportunities, src/components, supabase, contacts, organizations, dashboard

**Rationale:** Large LOC (13K–42K), very high churn, business-critical logic, auth/security, or production schema. `supabase` newly elevated: 16K LOC production SQL, 641 commits in 6 months, no rollback path. `composedDataProvider` and `authProvider` are Caution Zones per CLAUDE.md. `opportunities` has the highest historical coupling (19 fan-in, 10 fan-out). `src/components` at 20 commits/14d above CI/CD threshold.

**Entry criteria:**
- Phase 2 complete and exit criteria verified
- Playwright E2E smoke tests pass on staging
- Tech lead review for changes to `composedDataProvider.ts` or `authProvider.ts`
- RLS audit complete: CMD-006
- Staging database snapshot taken before migration work
- Supabase dry-run verified: `npx supabase db push --dry-run`

**Exit criteria:**
- Playwright E2E full suite passes on staging
- Manual QA sign-off from product owner
- RLS policy review completed if auth or access-control changes
- Zero TypeScript errors and zero lint errors
- Performance baseline verified: under 2s for principal dashboard queries
- pgTAP security tests pass if RLS policies changed

---

## Regression Testing Priorities

Ordered by blast radius and change frequency. Source: `risk-assessment.json` regression_priorities.

| Priority | Area | Path | Reason | Recommended Test Type |
|----------|------|------|--------|-----------------------|
| 1 | Auth and data access | `src/atomic-crm/providers/supabase/authProvider.ts` | Auth flow and RLS enforcement. Mistakes lock out all users. Caution Zone. | Vitest unit + Playwright E2E |
| 2 | Composed data provider | `src/atomic-crm/providers/supabase/composedDataProvider.ts` | God class — 48 handler references. 39 commits/30d. Any change affects all resources. | Vitest unit per handler + integration smoke test |
| 3 | Production schema and RLS | `supabase/migrations/` | Production schema, no rollback. 54 commits/30d, 641/6mo. RLS governs all data access. | pgTAP RLS tests + dry-run before every push |
| 4 | Shared component infrastructure | `src/components/` | 41.9K LOC, 20 commits/14d. Broadly consumed by all feature modules. | Vitest unit for ra-wrappers; visual regression for layout |
| 5 | Opportunity pipeline | `src/atomic-crm/opportunities/` | 19 fan-in, 10 fan-out, 771 commits/6mo. Revenue-critical. | Vitest unit + Playwright E2E for stage transitions and kanban |
| 6 | Validation schemas | `src/atomic-crm/validation/` | 91 fan-in. Schema changes cascade to every resource. | Vitest unit for all schema boundaries |
| 7 | Utility functions | `src/atomic-crm/utils/` | 73 fan-in. Partial coverage. Regressions propagate broadly. | Vitest unit for all utility functions |
| 8 | Sales module / permissions | `src/atomic-crm/sales/` | 18 commits/14d — CI/CD threshold exceeded 2nd consecutive audit. RBAC inputs are high-consequence. | Vitest unit + Playwright E2E for disable/reassign |
| 9 | Organization hierarchy and auth | `src/atomic-crm/organizations/` | Self-referential hierarchy, principal authorization, distributor auth tables. RLS must enforce both FK sides. | Vitest + pgTAP for RLS on authorization tables |
| 10 | Contact CSV import | `src/atomic-crm/contacts/` | Multi-step wizard. Data integrity risk on bulk operations. 31 commits/30d. | Vitest unit + Playwright E2E for wizard flow |
| 11 | Pipeline stage constants | `src/atomic-crm/constants/` | 72 fan-in. Any enum rename breaks all consumers. Newly canonical after refactor. | Vitest unit validating enum values are stable |
| 12 | Services layer | `src/atomic-crm/services/` | 8 fan-in, partial coverage. Business workflow logic (PRV-006). | Vitest unit for StorageService and ValidationService |
| 13 | ProductDistributors RLS | `src/atomic-crm/productDistributors/` | Junction table, 11 fan-in, zero test coverage. RLS must validate both FK sides (DB-008, DB-009). | pgTAP RLS tests |
| 14 | Notes XSS boundary | `src/atomic-crm/notes/` | dompurify sanitization. Misconfiguration allows XSS. 7 fan-in consumers. | Vitest unit for sanitization boundary |
| 15 | Dashboard data aggregation | `src/atomic-crm/dashboard/` | Dual versions (V3/V4). 6 DB tables aggregated. DnD-kit state complexity. | Vitest unit for KPI calculations + Playwright E2E |

---

## Modules with Decayed Confidence

No confidence decay recorded this run. The feature inventory average dropped 1.1 pp due to more conservative scoring on new entries, not existing feature regression.

---

## Modules to Watch Next Audit

| Module | Watch Reason |
|--------|-------------|
| sales | 18 commits/14d — third consecutive audit above threshold would trigger mandatory refactor review |
| providers | 39 commits/30d; composedDataProvider.ts god class complexity; watch for handler count growth |
| supabase | First run tracked; confirm pgTAP test scope covers all RLS policies |
| constants | 72 fan-in; monitor for accidental enum value changes post-refactor |

---

*Source: `docs/audit/baseline/risk-assessment.json`. [Confidence: 95%]*
