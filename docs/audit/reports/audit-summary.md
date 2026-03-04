# Audit Executive Summary

**Generated:** 2026-03-03T23:30:00Z
**Baseline sources:** `docs/audit/baseline/audit-meta.json`, `feature-inventory.json`, `risk-assessment.json`, `dependency-map.json`, `documentation-coverage.json`, `integration-map.json`, `document-linkage.json`
**Audit type:** Incremental (previous run: 2026-03-03T20:00:00Z)
**Agents deployed:** 5 | **Succeeded:** 5 | **Failed:** 0

---

## High-Level Metrics

| Metric | Value | Source |
|---|---|---|
| Total internal modules tracked | 33 | `risk-assessment.json` |
| Total features catalogued | 32 | `document-linkage.json` |
| Total NPM packages | 115 (67 prod / 48 dev) | `dependency-map.json` |
| Circular references | 0 | `dependency-map.json` |
| God classes | 1 (`composedDataProvider.ts`) | `dependency-map.json` |
| Shared mutable state instances | 7 | `dependency-map.json` |
| Total documentation files | 175 | `documentation-coverage.json` |
| Average doc quality score | 4.2 / 5 | `documentation-coverage.json` |
| Modules with READMEs | 37 | `documentation-coverage.json` |
| Features with PRD | 7 of 32 | `document-linkage.json` |
| Features with BRD | 8 of 32 | `document-linkage.json` |
| Open security issues | 8 (3 high / 5 low) | `integration-map.json` |
| TODO/FIXME count | 21 | `documentation-coverage.json` |

---

## Risk Distribution

| Risk Level | Module Count | % of Total |
|---|---|---|
| High | 8 | 24% |
| Medium | 12 | 36% |
| Low | 13 | 39% |

Source: `risk-assessment.json`

---

## Top 5 Highest-Risk Modules

| Rank | Module | Risk Score | LOC | 30d Commits | Key Concern |
|---|---|---|---|---|---|
| 1 | `providers` | 95 | 24,967 | 41 | God-class routing hub + active auth rework. CLAUDE.md Caution Zone. |
| 2 | `opportunities` | 93 | 26,753 | 37 | 773 commits in 6mo (highest historical churn), 19 fan-in, revenue-critical. |
| 3 | `supabase` | 92 | 17,070 | 57 | Uncommitted migration in working tree. Production-only schema. |
| 4 | `src/components` | 88 | 41,900 | 49 | Largest codebase by LOC. 3rd consecutive audit above CI/CD threshold. |
| 5 | `validation` | 85 | 19,702 | 33 | 91 fan-in — any schema change cascades to all dependents. |

Source: `risk-assessment.json`

---

## Confidence Trends (this run vs previous run)

| Baseline | Previous | Current | Delta | Notes |
|---|---|---|---|---|
| Feature inventory avg confidence | 0.922 | 0.912 | -0.010 | 7 new infrastructure features added; avg slightly diluted |
| Documentation avg quality | 3.7 | 4.2 | +0.5 | Major improvement: 37 READMEs, 5 new PRDs |
| Total doc files | 64 | 175 | +111 | Documentation sprint completed |
| High-risk module count | — | 8 | stable | `filters` promoted to regression watch priority |
| Security issue count | — | 8 | 0 net | 2 downgraded, 2 new identified |

Source: `audit-meta.json`

---

## Security Summary

| Severity | Count | Description |
|---|---|---|
| High | 3 | Credentials committed to VCS: `.env.development`, `.env.production`, `supabase/functions/.env` |
| Low | 5 | Storage public URLs, CSP unsafe-inline (style-src), missing Sentry in connectSrc, hardcoded prod domains, optional SITE_URL |

Three high-severity credentials in version control require immediate triage. See `security-report.md` for full detail.

---

## Documentation Coverage Summary

| Coverage Type | Count | Coverage % |
|---|---|---|
| Modules with README | 37 / 41 | 90% |
| High-risk modules with README | 8 / 8 | 100% |
| Features with BRD | 8 / 32 | 25% |
| Features with PRD | 7 / 32 | 22% |
| Features with ADR | 4 / 32 | 13% |
| JSDoc coverage (estimated) | ~20% | Low |
| Features missing all docs | 0 | Gap closed this cycle |

All 5 previously flagged `high_risk_no_prd` modules now have PRDs (dashboard, validation, providers, components, supabase). The `high_risk_no_prd` list is now empty.

---

## Regression Testing Priorities

| Priority | Module | Reason |
|---|---|---|
| P0 | `filters` | 0 tests, 16 commits in 30d, consumed by all list views. ⚠️ |
| P1 | `providers/authProvider.ts` | 14+ commits in 14d on auth flow; lockout risk if broken. |
| P1 | `supabase` | Uncommitted migration `20260303110000_fix_admin_restore_sale_race.sql` needs push + pgTAP verification. |
| P2 | `src/components` | Partial test coverage, 49 commits in 30d, 20 module dependents. |
| P2 | `validation` | 91 fan-in; regression here affects the entire codebase. |

---

## Key Actions Required

| Priority | Action | Owner |
|---|---|---|
| P0 | Rotate or gitignore `.env.development`, `.env.production`, `supabase/functions/.env` credentials | Security |
| P0 | Push and verify `20260303110000_fix_admin_restore_sale_race.sql` migration | Engineering |
| P1 | Add test coverage for `filters` module (0 tests, 16 commits in 30d) | Engineering |
| P1 | Resolve CSP divergence: `csp-config.ts` missing `https://*.sentry.io` in `connectSrc` | Security |
| P2 | Write ADRs for `opportunities` and `contacts` (high coupling, no ADR) | Engineering |
| P2 | Upgrade storage service to signed URLs (PRV-008 gap, currently public URLs) | Engineering |
| P3 | Improve JSDoc coverage from ~20% baseline | Engineering |
| P3 | Add root-level `README.md` for human contributor onboarding | Engineering |

---

## Confidence Statement

This summary is derived entirely from JSON baselines generated by automated audit agents. All metrics trace to specific baseline files cited above. Items marked ⚠️ require human review before acting. Overall audit confidence: **High (92%)** — all 5 agents succeeded, all 6 baselines validated.

[Confidence: 92%]
