# Risk Report — Module Risk Assessment

**Generated:** 2026-03-03
**Baseline run:** incremental (prior run: 2026-03-03T00:00:00Z)
**Source:** `docs/audit/baseline/risk-assessment.json`, `docs/audit/baseline/audit-meta.json`
**Confidence:** 95%

---

## 1. Full Risk Matrix

All 25 assessed modules, sorted by risk score descending.

| Module | Risk Level | Score | LOC | Files | Dependents | Dependencies | Test Coverage | Commits/30d | Commits/14d | Phase |
|--------|-----------|-------|-----|-------|------------|--------------|---------------|-------------|-------------|-------|
| `providers` | HIGH | 9 | 24,720 | 115 | 6 | 5 | full | 38 | 20 | 3 |
| `opportunities` | HIGH | 9 | 26,828 | 152 | 19 | 10 | full | 36 | 9 | 3 |
| `src/components` | HIGH | 8 | 41,900 | — | 20 | 5 | partial | — | 20 | 3 |
| `validation` | HIGH | 8 | 19,702 | 96 | 91 | 2 | full | 34 | 10 | 2 |
| `contacts` | HIGH | 7 | 15,883 | 80 | 0 | 10 | full | 31 | 10 | 3 |
| `organizations` | HIGH | 7 | 18,539 | 97 | 3 | 6 | full | 37 | 14 | 3 |
| `dashboard` | HIGH | 7 | 13,479 | 62 | 0 | 6 | full | 29 | 6 | 3 |
| `reports` | MEDIUM | 6 | 9,555 | 58 | 5 | 6 | full | 25 | 4 | 2 |
| `filters` | MEDIUM | 5 | 4,991 | — | 1 | 2 | none | 0 | 4 | 2 |
| `activities` | MEDIUM | 5 | 4,473 | 24 | 1 | 5 | full | 20 | 5 | 2 |
| `products` | MEDIUM | 5 | 4,257 | 27 | 0 | 4 | partial | 19 | 6 | 2 |
| `tasks` | MEDIUM | 5 | 3,825 | 29 | 3 | 5 | partial | 27 | 7 | 2 |
| `services` | MEDIUM | 5 | 4,637 | — | 8 | 0 | partial | 13 | 10 | 2 |
| `sales` | MEDIUM | 5 | 3,173 | 20 | 0 | 5 | partial | 24 | 17 | 2 |
| `hooks` | MEDIUM | 4 | 2,435 | — | 13 | 1 | partial | 9 | 6 | 1 |
| `productDistributors` | MEDIUM | 4 | 508 | 11 | 11 | 1 | none | 10 | 4 | 2 |
| `timeline` | MEDIUM | 4 | 1,507 | — | 5 | 1 | none | 0 | 0 | 2 |
| `tags` | LOW | 3 | 932 | 18 | 0 | 4 | partial | 11 | 4 | 1 |
| `notes` | LOW | 3 | 530 | 7 | 7 | 1 | partial | 6 | 4 | 1 |
| `settings` | LOW | 3 | 820 | 12 | 0 | 3 | none | 2 | 1 | 1 |
| `components` (atomic-crm) | LOW | 3 | 1,218 | — | 7 | 4 | none | 0 | 0 | 1 |
| `notifications` | LOW | 2 | 257 | 3 | 3 | 1 | none | 7 | 4 | 1 |
| `login` | LOW | 1 | 27 | 3 | 3 | 0 | none | 0 | 0 | 1 |
| `layout` | LOW | 2 | 318 | — | 5 | 0 | none | 0 | 1 | 1 |
| `contexts` | LOW | 2 | 238 | — | 7 | 0 | none | 0 | 2 | 1 |

> "—" in Files column means file count was not individually tallied in the baseline for that module.

---

## 2. Risk Factor Detail — High-Risk Modules

### `providers` (score: 9, Phase 3)
Path: `src/atomic-crm/providers/`

- 24,720 LOC across 115 files — largest non-component module.
- 38 commits in 30 days; 578 commits in 6 months — extremely high historical churn.
- Contains `authProvider.ts` — authentication and RLS enforcement. Mistakes lock out all users (CLAUDE.md Caution Zone).
- Contains `composedDataProvider.ts` — god class, all 48 resource handlers route through this single file.
- 2 remaining circular references involve this module (`opportunities <-> providers`).
- Module-level mutable state: `cachedSale` and `cacheTimestamp` variables in `authProvider.ts`.

### `opportunities` (score: 9, Phase 3)
Path: `src/atomic-crm/opportunities/`

- 26,828 LOC across 152 files — largest feature module.
- 771 commits in 6 months — highest historical churn of all feature modules.
- 19 fan-in dependents (highest coupling in codebase), 10 fan-out dependencies.
- 7-stage pipeline with transitions, duplicate detection, and authorization warnings.
- 6 DB tables including junction and audit tables.
- Directly drives MFB revenue pipeline KPIs — business-critical.
- Circular reference with `providers` module (stage-enum constants crossing layer boundary).

### `src/components` (score: 8, Phase 3)
Path: `src/components/`

- 41,900 LOC — largest module by line count in the entire codebase.
- 20 commits in 14 days — CI/CD architectural review threshold exceeded (16+).
- `ListToolbar.tsx` at 7 edits in 14 days — top churn file.
- 20 fan-in dependents — broadly consumed by all feature modules (high blast radius).
- Spans three tiers: Tier 1 UI, Tier 2 ra-wrappers, layouts, and Supabase auth pages.
- Tier boundary violations (UI-001, UI-002) risk spreading when mixed under one module.
- Active hotspots: `AdaptiveFilterContainer.tsx`, `ListPageLayout.tsx`.
- Newly elevated to Phase 3 in this audit run.

### `validation` (score: 8, Phase 2)
Path: `src/atomic-crm/validation/`

- 19,702 LOC across 96 files.
- 91 fan-in dependents — most-depended-upon module in the codebase.
- 34 commits in 30 days — high churn for a shared schema module.
- Schema changes cascade to all 91 dependent modules simultaneously.
- Source of truth for all Zod schemas and TypeScript types (CORE-004).
- Remaining test coverage: circular reference with `providers` now test-only (resolved in production).

### `contacts` (score: 7, Phase 3)
Path: `src/atomic-crm/contacts/`

- 15,883 LOC across 80 files.
- 31 commits in 30 days.
- 10 fan-out dependencies.
- CSV import wizard multi-step flow adds complexity.
- Junction table `contact_organizations` plus summary views.
- No README.

### `organizations` (score: 7, Phase 3)
Path: `src/atomic-crm/organizations/`

- 18,539 LOC across 97 files — second-largest feature module.
- 37 commits in 30 days — highest 30-day churn among feature modules.
- Self-referential hierarchy (parent-child) adds structural complexity.
- `distributor_principal_authorizations` table — principal authorization management.
- Product exception management adds cross-module coupling.
- No README.

### `dashboard` (score: 7, Phase 3)
Path: `src/atomic-crm/dashboard/`

- 13,479 LOC across 62 files.
- 29 commits in 30 days.
- Two competing versions (`PrincipalDashboardV3` and `PrincipalDashboardV4`). V4 status requires human clarification.
- 6 DB tables including `dashboard_snapshots` and `user_favorites`.
- DnD-kit drag-and-drop adds interaction complexity.
- No README.

---

## 3. Phase Boundary Recommendations

### Phase 1 — Low Risk (safe to modify with standard review)
**Modules:** `hooks`, `tags`, `notes`, `settings`, `notifications`, `login`, `layout`, `contexts`, `components` (atomic-crm)

**Entry criteria:**
- Local build verified: `npm install` and `npx tsc --noEmit` pass.
- `npm run lint` passes with zero errors.
- Developer has read `CLAUDE.md` and `CORE_CONSTRAINTS.md`.

**Exit criteria:**
- All unit tests pass (`npm run test`).
- Zero TypeScript errors (`npx tsc --noEmit`).
- Code review by one developer.
- No new console statements in production code (CMD-001).

### Phase 2 — Medium Risk (requires broader verification)
**Modules:** `validation`, `reports`, `filters`, `activities`, `products`, `tasks`, `sales`, `services`, `timeline`, `productDistributors`

**Entry criteria:**
- Phase 1 complete and exit criteria verified.
- Developer has reviewed `dependency-map.json` for fan-in counts.
- Validation schema changes reviewed by tech lead.
- RLS policies reviewed for junction-table changes (DB-008).

**Exit criteria:**
- All unit tests pass.
- Zero TypeScript errors.
- SQL dry-run passes: `npx supabase db push --dry-run`.
- RLS policy audit: CMD-006.
- Code review by two developers for validation or providers changes.

### Phase 3 — High Risk (requires staging verification and E2E)
**Modules:** `providers`, `opportunities`, `src/components`, `contacts`, `organizations`, `dashboard`

**Entry criteria:**
- Phase 2 complete and exit criteria verified.
- Playwright E2E smoke tests pass on staging.
- Tech lead review for changes to `composedDataProvider.ts` or `authProvider.ts`.
- RLS audit complete (CMD-006).
- Staging database snapshot taken before migration work.

**Exit criteria:**
- Playwright E2E full suite passes on staging.
- Manual QA sign-off from product owner.
- RLS policy review completed if auth or access-control changes.
- Zero TypeScript errors and zero lint errors.
- Performance baseline verified: under 2s for principal dashboard queries.
- pgTAP security tests pass if RLS policies changed.

---

## 4. Regression Testing Priorities

Ordered by business impact and failure blast radius.

| Priority | Area | Path | Recommended Test Type | Rationale |
|----------|------|------|-----------------------|-----------|
| 1 | Auth and data access | `authProvider.ts` | Vitest unit + Playwright E2E | Mistakes lock out all users. Caution Zone. |
| 2 | Composed data provider routing | `composedDataProvider.ts` | Vitest per handler + integration smoke | God class — change affects all resources. |
| 3 | Shared component infrastructure | `src/components/` | Vitest unit + visual regression | 41.9K LOC, 20 commits/14d, broadly consumed. |
| 4 | Opportunity pipeline | `src/atomic-crm/opportunities/` | Vitest unit + Playwright E2E | 19 fan-in, 771 commits/6mo, revenue-critical. |
| 5 | Validation schemas | `src/atomic-crm/validation/` | Vitest unit for all schema boundaries | 91 fan-in — schema changes cascade everywhere. |
| 6 | Sales module permissions | `src/atomic-crm/sales/` | Vitest unit + Playwright E2E for disable/reassign | 17 commits/14d, RBAC inputs, high-consequence ops. |
| 7 | Organization hierarchy and RLS | `src/atomic-crm/organizations/` | Vitest + pgTAP for RLS on auth tables | Self-referential hierarchy, principal authorization. |
| 8 | Contact CSV import | `src/atomic-crm/contacts/` | Vitest unit + Playwright E2E wizard | Multi-step wizard, bulk data integrity risk. |
| 9 | Services layer | `src/atomic-crm/services/` | Vitest unit for StorageService + ValidationService | 8 fan-in, zero test files, shared infrastructure. |
| 10 | ProductDistributors RLS | `src/atomic-crm/productDistributors/` | pgTAP RLS tests for `product_distributors` | Junction table, 11 fan-in, zero test coverage. |
| 11 | Notes XSS boundary | `src/atomic-crm/notes/` | Vitest unit for sanitization boundary | dompurify misconfiguration allows XSS, 7 consumers. |
| 12 | Dashboard data aggregation | `src/atomic-crm/dashboard/` | Vitest KPI calculations + Playwright render | Dual versions, 6 DB tables, DnD complexity. |

---

## 5. Modules with Decayed Confidence (this run)

| Module | Previous Confidence | Current Confidence | Reason |
|--------|--------------------|--------------------|--------|
| `Activities` | 0.93 | 0.92 | Test coverage downgraded to partial (6 test files vs 20+ source files) |
| `Notes` | 0.92 | 0.90 | Test coverage downgraded to none (0 test files confirmed) |

No modules have confidence below the 70% threshold requiring human escalation. The `Segments` feature at 80% and `Admin` at 82% are the lowest-confidence items and warrant human review.

---

## 6. Changes Since Last Audit

| Type | Module | Description | Severity |
|------|--------|-------------|----------|
| Module added | `src/components` | Now tracked as a named module. 41.9K LOC, 20 commits/14d. | New entry — elevated to Phase 3 |
| Churn increase | `sales` | 17 commits/14d — exceeds CI/CD architectural review threshold. | Watch |
| Churn elevated | `services` | 10 commits/14d. `sales.service.ts` at 7 edits/14d. | Watch |
| Churn stable | `opportunities` | LOC stable at 26,828. 9 commits/14d (down from prior). | Improvement |
| LOC stable | all others | All other module LOC counts match previous baseline within rounding. | Informational |

---

*Source: `docs/audit/baseline/risk-assessment.json`. Confidence: 95%.*
