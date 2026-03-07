# Three Pillars Audit Report — Crispy CRM

**Audit Date:** 2026-03-04
**Run Type:** Incremental (previous: 2026-03-04T12:00:00Z)
**Scanner Version:** 0.1.0
**Agents Deployed:** 5 of 5 succeeded
**Baselines Written:** 7 of 7 valid

---

## Key Metrics

| Metric | Value | Change |
|--------|-------|--------|
| Total features | 22 | +4 (Provider, Services, Pages, Admin) |
| Internal modules | 36 | +2 (consts, services) |
| High-risk modules | 8 | No change |
| Medium-risk modules | 13 | No change |
| Low-risk modules | 15 | No change |
| Security observations | 8 total | sec-009 CSP divergence resolved |
| Hardcoded credentials | 4 files | Unresolved (sec-001, sec-002, sec-005, sec-008) |
| Total doc files | 238 | +10 from 228 |
| Avg doc quality | 4.3 / 5 | Stable |
| ADR count | 8 | +4 (005, 006, 007, 008 — all 4 highest-risk feature ADR gap closed) |
| Features with PRD | 8 of 22 | Stable |
| High-risk features missing ADR | 0 | Gap closed this run |
| JSDoc coverage | 22% | Stable |
| Open TODO/FIXME | 18 | Stable |
| Circular dependencies | 0 | Clean |
| God classes | 1 | composedDataProvider.ts (metric corrected: 21 unique handlers, was 47) |

---

## High-Risk Modules

Ordered by risk score. All eight were present in the previous audit.

### 1. providers — Risk 90

- **Path:** `src/atomic-crm/providers/`
- **Size:** 11,205 LOC across 116 files
- **Churn:** 582 commits in 6mo
- **Why high-risk:** Contains `composedDataProvider.ts` (god class routing 21 handler factories for 22 resources — every resource CRUD write passes through this single 260-line file) and `authProvider.ts` (auth flow, shared mutable state `cachedSale` and `cacheTimestamp` — mistakes lock out all users). Both are designated Caution Zones in CLAUDE.md. Lead engineer review required before modification.
- **Coverage:** Full test coverage — composedDataProvider.test.ts, authProvider.test.ts, dataProviderCache.test.ts, plus 45 test files across handlers and wrappers.
- **Doc status:** Best-documented module — README (quality 5), PRD, two ADRs (001, 004), and SEARCH_ARCHITECTURE.md all present.

### 2. opportunities — Risk 85

- **Path:** `src/atomic-crm/opportunities/`
- **Size:** 14,480 LOC across 152 files (largest feature module)
- **Churn:** 774 commits in 6mo (highest historical churn among feature modules)
- **Why high-risk:** fan_in=19 (highest among feature modules), fan_out=10. Seven-stage pipeline, Kanban subdirectory, slideOverTabs, 6 DB tables including junction and audit tables. Directly drives all MFB revenue pipeline KPIs. Risk score raised 82 → 85 this run after LOC confirmed at 14,480.
- **Coverage:** Full test coverage — 46 test files maintained.
- **Doc status:** BRD, PRD, and ADR 005 all present.

### 3. supabase_migrations — Risk 83

- **Path:** `supabase/migrations/`
- **Size:** 14,234 lines of SQL
- **Churn:** 472 commits in 6mo (highest absolute frequency in the entire codebase)
- **Why high-risk:** Production schema — no rollback path on `supabase db push`. RLS policies enforced here govern all tenant isolation. A policy mistake exposes or locks tenant data. Caution Zone in CLAUDE.md.
- **Coverage:** Partial (pgTAP tests present for some policies; not all migrations have test coverage).

### 4. validation — Risk 80

- **Path:** `src/atomic-crm/validation/`
- **Size:** 6,654 LOC across 96 files
- **Churn:** 432 commits in 6mo
- **Why high-risk:** fan_in=91 — the most depended-upon module in the entire codebase. Any Zod schema break propagates silently to all 91 consuming modules at the API boundary without surfacing TypeScript errors in the consuming modules themselves.
- **Coverage:** Full test coverage — 55 test files.
- **Doc status:** README (quality 5), PRD, and ADR 004 all present.

### 5. supabase_functions — Risk 75

- **Path:** `supabase/functions/`
- **Size:** 2,166 LOC across 7 edge functions
- **Churn:** 93 commits in 6mo
- **Why high-risk:** Edge functions deployed to production and run with service_role privileges. Failures in digest and overdue logic are asynchronous and silent. Caution Zone in CLAUDE.md. Risk score reduced 78 → 75 this run after 11 pgTAP tests confirmed.
- **Coverage:** Partial (11 pgTAP test files; 5 edge functions still lack JSDoc headers).

### 6. contacts — Risk 70

- **Path:** `src/atomic-crm/contacts/`
- **Size:** 9,348 LOC across 80 files
- **Churn:** 561 commits in 6mo
- **Why high-risk:** 9.3K LOC, fan_out=10. CSV import via papaparse and react-dropzone adds multi-step complexity. Junction table `contact_organizations`. Risk score refined 68 → 70 this run after LOC confirmed.
- **Coverage:** Full test coverage — 19 test files.
- **Doc status:** BRD, PRD, and ADR 006 all present.

### 7. organizations — Risk 68

- **Path:** `src/atomic-crm/organizations/`
- **Size:** 10,500 LOC across 97 files
- **Churn:** 594 commits in 6mo
- **Why high-risk:** 10.5K LOC. Self-referential parent-child hierarchy with cycle prevention (PRV-012, PRV-013 apply). CSV import present. Risk score refined 65 → 68 this run after LOC confirmed.
- **Coverage:** Full test coverage — 22 test files.
- **Doc status:** BRD, PRD, and ADR 007 all present.

### 8. dashboard — Risk 65

- **Path:** `src/atomic-crm/dashboard/`
- **Size:** 7,528 LOC across 62 files
- **Churn:** 718 commits in 6mo (second highest among feature modules)
- **Why high-risk:** New `CurrentSaleContext` adds shared mutable state for session-level salesId caching. Chart.js rendering and TanStack Query cache interaction. Aggregates data across 6 DB tables.
- **Coverage:** Full test coverage — 21 test files.
- **Doc status:** BRD, PRD, and ADR 008 all present.

---

## Security Observations

Sorted by severity. All observations carried forward from previous audit unless noted.

### High Severity

| ID | File | Description |
|----|------|-------------|
| sec-001 | `.env.development` | Live development Supabase project URL and anon key committed to version control. Unresolved. |
| sec-002 | `.env.production` | Live production Supabase project URL and anon key committed to version control. Unresolved. |
| sec-005 | `supabase/functions/.env` | ES256-signed local service role JWT and anon JWT committed to version control. Unresolved. |

### Low Severity

| ID | File | Description |
|----|------|-------------|
| sec-003 | `src/atomic-crm/providers/supabase/services/StorageService.ts` | Partial resolution: crypto.randomUUID() and MIME allowlist added this cycle. Public URLs still used instead of signed URLs (PRV-008 gap). Flat path pattern still used instead of tenant-scoped (DB-006 gap). |
| sec-004 | `supabase/functions/users/index.ts` | Improved: origin validation hardened with fail-fast guard. SITE_URL env var still optional. |
| sec-006 | `supabase/.env` | Placeholder auth encryption key committed — local-only development value. |
| sec-007 | `vite.config.ts` | `unsafe-inline` persists in production `style-src` (required for Tailwind CSS inline styles). |
| sec-008 | `supabase/functions/_shared/cors-config.ts` | Production domain hostnames hardcoded in source. ALLOWED_ORIGINS env var available as override. |

### Resolved This Run

**sec-009 (CSP divergence)** — `src/config/csp-config.ts` is now aligned with `vite.config.ts`. The previous three-way divergence (missing `*.sentry.io`, `*.supabase.in`, and `gravatar.com`) has been corrected. Security issue count reduced from 9 to 8.

**Key concern:** The three high-severity items (sec-001, sec-002, sec-005) have been present across multiple consecutive audits without resolution. These are the highest-priority unresolved security items in the codebase.

---

## Documentation Coverage

**Total documentation files:** 238 (up from 228)
**Projects with README:** 40 | **Without README:** 2
**JSDoc coverage:** 22%
**Average quality score:** 4.3 / 5
**ADR count:** 8 (up from 4 — ADR gap for all high-risk features now fully closed)
**Open TODO/FIXME items:** 18

### Improvements This Run

- 4 new ADRs: `docs/adr/005-opportunities-pipeline-architecture.md`, `006-contacts-data-architecture.md`, `007-organizations-hierarchy-architecture.md`, `008-dashboard-architecture.md`
- `supabase/schemas/` reference layer added (6 SQL files + README)
- `docs/audit/reports/three-pillars-report.md` added
- `.env.example` added
- 2 new AI-readiness slash commands added: `.claude/commands/ai-readiness-scan.md`, `.claude/commands/ai-readiness-generate.md`
- Approximately 35 new `.agents/skills/supabase-postgres-best-practices/` reference docs
- 7 new `.claude/skills/enforcing-principles/` reference docs

### Best-Documented Module

`src/atomic-crm/providers/supabase` — README (quality 5), PRD, ADR 001, ADR 004, SEARCH_ARCHITECTURE.md, 35% JSDoc coverage across 111 files, full test suite.

### Coverage Gaps

- No ADRs for Sales, Tasks, Activities, Products, Filters, or Services — all medium or low risk; lower priority than the now-resolved high-risk ADR gap.
- 5 edge functions have no JSDoc headers: `check-overdue-tasks`, `health-check`, `capture-dashboard-snapshots`, `users`, `updatepassword`. Only `daily-digest` has a quality JSDoc header.
- `src/components/ui/README.md` quality score 2 — minimal stub listing shadcn/ui with no usage guidance. 23 Storybook stories partially compensate.
- JSDoc coverage at 22% overall: provider layer best at 35%, feature UI components minimal (~2 blocks per file average).
- 6 disabled tests in `CampaignActivityReport` — `get_stale_opportunities` RPC unimplemented.
- 3 placeholder tests with no assertions: `OpportunitiesTab`, `OpportunitySlideOverDetailsTab`, `OpportunityProductsTab`.

### Per-Module Quality Summary

| Module | README | BRD | PRD | ADR | Quality |
|--------|--------|-----|-----|-----|---------|
| providers/supabase | Yes (5) | No | Yes | Yes (001, 004) | 5 — Best documented |
| opportunities | Yes (5) | Yes | Yes | Yes (005) | 4 |
| contacts | Yes (4) | Yes | Yes | Yes (006) | 4 |
| organizations | Yes (4) | Yes | Yes | Yes (007) | 4 |
| dashboard | Yes (4) | Yes | Yes | Yes (008) | 4 |
| validation | Yes (5) | No | Yes | Yes (004) | 4 |
| activities | Yes (5) | Yes | No | No | 4 |
| sales | Yes (5) | Yes | No | No | 4 |
| tasks | Yes (5) | Yes | No | No | 4 |
| filters | Yes (5) | No | No | No | 4 |
| src/components | Yes (5) | No | Yes | Yes (003) | 4 |
| supabase | Yes (5) | No | Yes | Yes (002) | 4 |
| src/components/ui | Yes (2) | No | No | No | 3 — Stub only |

---

## Dependency Analysis

**NPM packages:** 115 (67 production, 48 development, 2 overrides)
**Internal modules:** 36
**Circular references:** 0
**God classes:** 1
**Shared mutable state instances:** 9

### Most Coupled Modules

| Module | Fan-In | Fan-Out | Role |
|--------|--------|---------|------|
| `validation` | 91 | 2 | Shared dependency — Zod schemas consumed by all features |
| `utils` | 73 | 1 | Shared dependency — general utilities (fan-out reduced from 2 this run) |
| `constants` | 72 | 0 | Shared dependency — enums and stage constants |
| `opportunities` | 19 | 10 | High coupling — bidirectional; largest feature module |
| `contacts` | 0 | 10 | High fan-out consumer — leaf module |

### God Class

**File:** `src/atomic-crm/providers/supabase/composedDataProvider.ts`
**Lines:** 260
**Handler factories:** 21 unique (42 occurrences in the file)
**Resources handled:** 22
**Impact:** Every feature module write passes through this single file. Designated Caution Zone in CLAUDE.md. Lead engineer review required before modification. Note: the handler count was corrected this run from 47 to 21 unique factories — the previous count was based on a raw keyword grep that double-counted references.

### Shared Mutable State (9 instances)

| Type | Name | File |
|------|------|------|
| Module variable | cachedSnapshot | `src/atomic-crm/hooks/useRecentSearches.ts` |
| Module variable | cachedSale | `src/atomic-crm/providers/supabase/authProvider.ts` |
| Module variable | cacheTimestamp | `src/atomic-crm/providers/supabase/authProvider.ts` |
| React context | AppBrandingContext | `src/atomic-crm/contexts/AppBrandingContext.tsx` |
| React context | FormOptionsContext | `src/atomic-crm/contexts/FormOptionsContext.tsx` |
| React context | PipelineConfigContext | `src/atomic-crm/contexts/PipelineConfigContext.tsx` |
| React context | ConfigurationContext | `src/atomic-crm/root/ConfigurationContext.tsx` |
| React context | CurrentSaleContext (NEW) | `src/atomic-crm/dashboard/CurrentSaleContext.tsx` |
| React context | FilterLayoutModeContext (NEW) | `src/atomic-crm/filters/FilterLayoutModeContext.tsx` |

The two module-level `let` variables in `authProvider.ts` (`cachedSale`, `cacheTimestamp`) carry the highest risk given the auth-critical context of that file.

### Dependency Changes This Run

- `consts.ts` added — 5 LOC, event-name constants only, single consumer (`types.ts`). Fan-in=1, fan-out=0.
- `types.ts` fan-out updated 0 → 1 (now imports from the new `consts.ts`).
- `CurrentSaleContext` added — dashboard-scoped, session-level salesId cache. No new cross-module atomic-crm production dependencies.
- `FilterLayoutModeContext` added — consumed within filters and by `AdaptiveFilterContainer.tsx` outside the atomic-crm boundary.
- `src/types/database.types.ts` and `src/types/supabase.ts` deleted — replaced by `src/types/database.generated.ts`.
- `supabase/schemas/` directory added — 6 SQL schema reference files. No TypeScript dependency graph impact.
- `searchability.ts` added (tracked as new module) — thin adapter for `isResourceSearchable()`, zero atomic-crm consumers.

---

## Document Linkage

**Features fully documented (BRD + PRD + ADR):** 4
**Features with BRD:** 8 | **Features with PRD:** 8 | **Features with ADR:** 4
**Features missing all documentation:** 10
**High-risk features missing ADR:** 0 (gap closed this run)

### Feature Documentation Status

| Feature | Risk | BRD | PRD | ADR | Status |
|---------|------|-----|-----|-----|--------|
| Opportunities | High | Yes | Yes | Yes (005) | Fully documented |
| Contacts | High | Yes | Yes | Yes (006) | Fully documented |
| Organizations | High | Yes | Yes | Yes (007) | Fully documented |
| Dashboard | High | Yes | Yes | Yes (008) | Fully documented |
| Provider | High | No | Yes | Yes (001, 004) | Infrastructure documented |
| Sales | Medium | Yes | No | No | BRD only |
| Tasks | Medium | Yes | No | No | BRD only |
| Activities | Medium | Yes | No | No | BRD only |
| Products | Medium | Yes | No | No | BRD only |
| Filters | Medium | No | No | No | No docs (78 unit tests present) |
| Services | Medium | No | No | No | No docs (new this run) |
| ProductDistributors | Medium | No | No | No | No documentation |
| Reports | Medium | No | No | No | No documentation |
| Notes | Low | No | No | No | No documentation |
| Settings | Low | No | No | No | No documentation |
| Notifications | Low | No | No | No | No documentation |
| Tags | Low | No | No | No | No documentation |
| Login | Low | No | No | No | No documentation |
| Segments | Low | No | No | No | No documentation |
| Timeline | Low | No | No | No | No documentation |
| Admin | Low | No | No | No | No documentation (new this run) |
| Pages | Low | No | No | No | No documentation (new this run) |

The 10 features with no documentation are all low or medium risk. No high-risk feature is now undocumented.

---

## Integration Map

**Total integrations:** 22 across 7 categories
**New this run:** int-api-007 (GoTrue Admin REST API direct fetch)

### Integrations by Category

| Category | Count | Key Integrations |
|----------|-------|-----------------|
| Edge Functions | 7 | daily-digest, check-overdue-tasks, users, updatepassword, digest-opt-out, capture-dashboard-snapshots, health-check |
| API | 6 | Gravatar, favicon.show, Direct domain favicon, ui-avatars.com, Google Fonts CDN, GoTrue Admin REST API (new) |
| Auth | 2 | Supabase Auth Client SDK, Supabase Auth Admin API |
| Database | 2 | Supabase PostgreSQL (data provider), Supabase PostgreSQL (edge function admin) |
| Monitoring | 2 | Sentry runtime, Sentry build-time source maps |
| CI/CD | 2 | GitHub Actions CI, GitHub Actions Supabase Deploy |
| Storage | 1 | Supabase Storage attachments |

### AI Guardrails — Auto-Modify Disabled

The following files require human review before any AI agent modification:
`authProvider.ts`, `composedDataProvider.ts`, `supabase/functions/users/index.ts`, `supabase/functions/updatepassword/index.ts`, `supabase/functions/_shared/supabaseAdmin.ts`, `supabase/functions/_shared/cors-config.ts`, `supabase/migrations/`, `StorageService.ts`, `src/config/csp-config.ts`, `vite.config.ts`, `.github/workflows/supabase-deploy.yml`, `src/main.tsx`

---

## Cross-Reference Findings

### High Coupling + High Risk

These three modules combine high change frequency, high dependency count, and high risk score. A defect here has the largest blast radius in the codebase.

1. **providers** — God class `composedDataProvider.ts` (risk 90), 21 handler factories, Caution Zone. All writes to all 22 resources pass through a single 260-line file.
2. **opportunities** — fan_in=19, fan_out=10 (risk 85), 14,480 LOC, 774 commits in 6mo. Every feature that touches pipeline data depends on this module.
3. **validation** — fan_in=91 (highest in codebase), risk 80. A schema change in `src/atomic-crm/validation/` silently breaks all 91 consumers at the API boundary without TypeScript errors in the consuming modules.

### Elevated Churn Watch

- **sales** — 4th consecutive audit above the churn threshold. The `admin_restore_sale` function had a race condition fixed in recent commits. Partial test coverage (3 test files) for a module linked directly to auth identity.
- **supabase_migrations** — 472 commits in 6 months, highest absolute change frequency in the codebase. Every migration is irreversible in production without a counter-migration.

### New This Run — Regression Priorities

- **Provider layer** (newly catalogued) — 21 handler factories, full test coverage. The god class itself has no dedicated integration test verifying routing correctness across all 22 resources.
- **Services layer** (newly catalogued) — 5 test files, partial coverage. `junctions.service.ts` at 513 LOC is business-critical with partial testing.

### High-Risk Features Missing ADR

None. This gap was fully closed this run with ADRs 005 through 008.

---

## Regression Priorities

| Priority | Area | Path | Test Type |
|----------|------|------|-----------|
| 1 | Auth and data access | `src/atomic-crm/providers/supabase/authProvider.ts` | Vitest + Playwright |
| 2 | Composed data provider routing | `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Vitest integration tests |
| 3 | Zod validation schemas | `src/atomic-crm/validation/` | Vitest unit tests |
| 4 | RLS policies and migrations | `supabase/migrations/` | pgTAP + supabase db push --dry-run |
| 5 | Opportunity pipeline | `src/atomic-crm/opportunities/` | Vitest + Playwright E2E |
| 6 | Dashboard and KPI views | `src/atomic-crm/dashboard/` | Vitest + Playwright E2E |
| 7 | Shared utilities | `src/atomic-crm/utils/` | Vitest unit tests |
| 8 | Edge functions digest and overdue | `supabase/functions/` | pgTAP + manual integration test |
| 9 | Query key factory | `src/atomic-crm/queryKeys.ts` | Vitest snapshot tests |

---

## New Features Discovered This Run

### 1. Provider (feat-prv-001) — `src/atomic-crm/providers/supabase/`

Central data access hub routing all React Admin resource calls through 21 per-resource handler factories. Implements `withErrorLogging` (outermost), `withLifecycleCallbacks`, and `withValidation` wrappers. Includes `ValidationService`, `StorageService`, `TransformService`, `filterRegistry`, and LRU cache. Full test coverage confirmed across `composedDataProvider.test.ts`, `authProvider.test.ts`, `dataProviderCache.test.ts`, and 45 additional test files.

### 2. Services (feat-svc-001) — `src/atomic-crm/services/`

Business logic service layer separating domain workflows from provider transport per PRV-006. Key services: `junctions.service.ts` (513 LOC), `segments.service.ts` (182 LOC), `opportunities.service.ts`, `products.service.ts`, `productDistributors.service.ts`, `sales.service.ts`, `digest.service.ts`. 5 test files (partial coverage). 2,379 LOC total.

### 3. Pages (feat-pag-001) — `src/atomic-crm/pages/`

Standalone onboarding page `WhatsNew.tsx` at 518 LOC. Hardcoded tour data — no DB writes. No confirmed route found in `CRM.tsx`. No test coverage. Low risk (score 12) — fully isolated with fan-in=0 and fan-out=0.

### 4. Admin (feat-adm-001) — `src/atomic-crm/admin/`

`HealthDashboard.tsx` at 357 LOC, lazily loaded at the `/admin/health` route in `CRM.tsx`. No test coverage. Low risk (score 12) — no dependents, no direct DB access.

---

## Top 10 Prioritized Action Items

### 1. Rotate committed credentials (sec-001, sec-002, sec-005)

- **Files:** `.env.development`, `.env.production`, `supabase/functions/.env`
- **Why first:** Live Supabase keys and signed JWTs committed to version control affect both development and production environments. Unresolved across multiple consecutive audits.
- **Action:** Rotate all Supabase anon keys and service role JWTs. Add the three `.env` files to `.gitignore`. Remove from git history using `git filter-repo` or BFG Repo Cleaner.

### 2. Complete StorageService signed URL migration (sec-003 / PRV-008 / DB-006)

- **File:** `src/atomic-crm/providers/supabase/services/StorageService.ts`
- **Why second:** MIME allowlist was added this run but private storage assets still use public URLs. PRV-008 requires signed URLs. Storage paths still use a flat pattern instead of the tenant-scoped format required by DB-006.
- **Action:** Update `StorageService.ts` to use `createSignedUrl()` instead of `getPublicUrl()`. Apply `/{tenant_id}/{resource}/{record_id}/{filename}` path convention per DB-006.

### 3. Investigate sales module churn (4th consecutive elevated audit)

- **Path:** `src/atomic-crm/sales/`
- **Why third:** sales has exceeded the review threshold for four consecutive audits. Partial test coverage (3 test files) for a module that is directly linked to authenticated user identity.
- **Action:** Assign a designated reviewer to all sales PRs. Audit downstream consumers of `salesCreate` to confirm the `SalesCreateResult` contract is compatible with all callers.

### 4. Add test coverage for Admin and Pages (new features, zero tests)

- **Files:** `src/atomic-crm/admin/HealthDashboard.tsx`, `src/atomic-crm/pages/WhatsNew.tsx`
- **Why fourth:** Both features were catalogued this run with no test coverage. `HealthDashboard.tsx` is 357 LOC with a route in `CRM.tsx`. `WhatsNew.tsx` is 518 LOC with no confirmed route.
- **Action:** Add at minimum render and smoke tests for `HealthDashboard`. Confirm whether `WhatsNew.tsx` has an active route before adding full test coverage.

### 5. Verify Admin module for CORE-001 violations

- **File:** `src/atomic-crm/admin/HealthDashboard.tsx`
- **Why fifth:** Admin grew to 357 LOC this run. Per CORE-001, no direct Supabase imports are permitted in feature components.
- **Action:** Run `grep -n "supabase" src/atomic-crm/admin/HealthDashboard.tsx` and confirm all data access routes through the composed data provider.

### 6. Confirm active route for Pages/WhatsNew.tsx

- **File:** `src/atomic-crm/pages/WhatsNew.tsx`
- **Why sixth:** 518 LOC with hardcoded tour data and no confirmed route in `CRM.tsx`. If this file is unreachable, it should either be routed or removed.
- **Action:** Search `CRM.tsx` and routing configuration for a `WhatsNew` reference. Either add the route or remove the file to eliminate dead code.

### 7. Write PRD and BRD for the Filters module

- **Path:** `src/atomic-crm/filters/`
- **Why seventh:** Filters is consumed by all list views and has 78 unit tests but no requirements documentation. Future changes to filter configuration schema or precedence logic have no baseline.
- **Action:** Create `docs/prd/filters/PRD-filters.md` and `docs/brd/filters.md` documenting the unified filter system, Zod config schema, precedence rules, and hook contract.

### 8. Expand JSDoc coverage for edge functions

- **Path:** `supabase/functions/`
- **Why eighth:** 5 of 7 edge functions (`check-overdue-tasks`, `health-check`, `capture-dashboard-snapshots`, `users`, `updatepassword`) have no JSDoc headers. Only `daily-digest` is documented. Edge functions are deployed directly to production with service_role privileges.
- **Action:** Add JSDoc file headers to the 5 undocumented edge functions documenting trigger mechanism, inputs, outputs, and failure behavior.

### 9. Improve src/components/ui/README.md

- **File:** `src/components/ui/README.md`
- **Why ninth:** Current quality score is 2 of 5 — minimal stub listing shadcn/ui with no usage guidance. All feature modules consume Tier 1 components from this directory.
- **Action:** Expand the README to include usage guidelines, the three-tier architecture reference (ADR 003), and a component index.

### 10. Implement get_stale_opportunities RPC to re-enable disabled tests

- **File:** `src/atomic-crm/reports/` (`CampaignActivityReport` tests)
- **Why tenth:** 6 tests are disabled because the `get_stale_opportunities` database RPC is unimplemented. These tests represent production functionality that is currently untested.
- **Action:** Implement the `get_stale_opportunities` RPC in `supabase/migrations/` and re-enable the 6 disabled tests in `CampaignActivityReport`.

---

## Phase Boundary Recommendations

### Phase 1 (Foundation) — Complete

All 22 features inventoried. Documentation baseline established for all high-risk features. No circular dependencies. CLAUDE.md governance in place.

### Phase 2 (Validation) — Blocked by One Item

The AI Readiness scan scored 89/100 (grade A). The only remaining Phase 2 blocker is the missing `.aiignore` file.

**Action:** Create `.aiignore` to exclude sensitive files from AI context windows. Recommended exclusions: `supabase/migrations/`, `supabase/functions/.env`, `.env.development`, `.env.production`, `.env`, `src/atomic-crm/providers/supabase/composedDataProvider.ts`, `src/atomic-crm/providers/supabase/authProvider.ts`.

### Phase 3 (High-Risk Modules) — Permitted

All four high-risk features now have BRD, PRD, and ADR. Phase 3 work (providers, opportunities, supabase, contacts, organizations, dashboard) may proceed subject to the Caution Zone review rules in CLAUDE.md. Rotate credentials (item 1 above) before any production-touching work.

### Suggested Sequence

1. Create `.aiignore` — unlocks Phase 2 eligibility.
2. Rotate credentials — prerequisite for any production-touching Phase 3 work.
3. Resolve StorageService signed URL gap — address the open PRV-008 violation.
4. Begin Phase 3 with providers (highest risk, best documented) under human review per CLAUDE.md Caution Zone rules.
5. Investigate sales churn before touching the sales module in Phase 3.
