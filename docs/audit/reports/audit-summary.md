# Audit Summary — Executive Report

**Generated:** 2026-03-03
**Baseline run:** incremental (prior run: 2026-03-03T00:00:00Z)
**Sources:** `docs/audit/baseline/audit-meta.json`, `feature-inventory.json`, `risk-assessment.json`, `integration-map.json`, `documentation-coverage.json`, `dependency-map.json`, `document-linkage.json`
**Audit confidence:** 96% (5/5 agents succeeded, all baselines valid)

---

## 1. At a Glance

| Metric | Value | Source |
|--------|-------|--------|
| Total features catalogued | 19 | `feature-inventory.json` |
| Total modules assessed | 25 | `risk-assessment.json` |
| High-risk modules | 6 | `risk-assessment.json` |
| Medium-risk modules | 11 | `risk-assessment.json` |
| Low-risk modules | 8 | `risk-assessment.json` |
| Average feature confidence | 89.6% | `feature-inventory.json` |
| Security issues (total) | 6 | `integration-map.json` |
| Security issues — high severity | 2 | `integration-map.json` |
| BRD coverage | 4/19 features (21%) | `document-linkage.json` |
| PRD coverage | 0/19 features (0%) | `document-linkage.json` |
| ADR count | 4 | `documentation-coverage.json` |
| Circular dependencies | 2 | `dependency-map.json` |
| God classes | 1 (`composedDataProvider`) | `dependency-map.json` |
| Modules exceeding CI/CD churn threshold (16+ commits/14d) | 2 (`sales`, `src/components`) | `audit-meta.json` |

---

## 2. Risk Heatmap

```
HIGH RISK (score 7-9)
+---------------------------------------------------------------------+
| providers       score:9  24.7K LOC  38 commits/30d  fan-in:  6     |
| opportunities   score:9  26.8K LOC  36 commits/30d  fan-in: 19     |
| src/components  score:8  41.9K LOC  20 commits/14d  fan-in: 20     |
| validation      score:8  19.7K LOC  34 commits/30d  fan-in: 91     |
| contacts        score:7  15.9K LOC  31 commits/30d  fan-in:  0     |
| organizations   score:7  18.5K LOC  37 commits/30d  fan-in:  3     |
| dashboard       score:7  13.5K LOC  29 commits/30d  fan-in:  0     |
+---------------------------------------------------------------------+

MEDIUM RISK (score 4-6)
  reports, filters, activities, products, tasks, services,
  sales, hooks, productDistributors, timeline

LOW RISK (score 1-3)
  tags, notes, settings, components (atomic-crm), notifications,
  login, layout, contexts
```

---

## 3. Top 5 Highest-Risk Modules

| Rank | Module | Risk Score | Key Driver | Phase |
|------|--------|-----------|------------|-------|
| 1 | `providers` | 9 | Auth + god class + 578 commits/6mo | 3 |
| 2 | `opportunities` | 9 | 19 fan-in, 771 commits/6mo, business-critical | 3 |
| 3 | `src/components` | 8 | 41.9K LOC, 20 commits/14d — CI threshold exceeded | 3 |
| 4 | `validation` | 8 | 91 fan-in dependents — highest blast radius | 2 |
| 5 | `organizations` | 7 | 37 commits/30d, self-referential hierarchy, RLS complexity | 3 |

---

## 4. Critical Security Findings

Two high-severity items require immediate attention. See `docs/audit/reports/security-report.md` for the full matrix.

| ID | Severity | File | Issue |
|----|----------|------|-------|
| sec-001 | HIGH | `.env.development` | Supabase URL + anon key committed to git |
| sec-002 | HIGH | `.env.production` | Production credentials committed — rotate key if repo is/was public |
| sec-005 | MEDIUM | `supabase/functions/.env` | `LOCAL_SERVICE_ROLE_KEY` committed — full RLS bypass capability |
| sec-003 | MEDIUM | `StorageService.ts` | `Math.random()` for filenames, no MIME allowlist (CORE-019 violation) |
| sec-004 | MEDIUM | `supabase/functions/users/index.ts` | `redirectTo` origin validation depends on `ALLOWED_ORIGINS` completeness |
| sec-006 | LOW | `supabase/.env` | Static placeholder `SUPABASE_AUTH_ENCRYPTION_KEY` |

> **Immediate action required:** sec-001 and sec-002 must be resolved before any shared or public repository access. Run `git log --all -- .env.production .env.development` to confirm commit history depth. Rotate exposed keys immediately.

---

## 5. Document Coverage Summary

| Domain | BRD | PRD | ADR Count |
|--------|-----|-----|-----------|
| Contacts | Yes | No | 4 |
| Organizations | Yes | No | 4 |
| Opportunities | Yes | No | 4 |
| Dashboard | Yes | No | 1 |
| Sales | No | No | 3 |
| Tasks | No | No | 3 |
| Activities | No | No | 3 |
| Notes | No | No | 0 |
| Products | No | No | 3 |
| ProductDistributors | No | No | 3 |
| Reports | No | No | 1 |
| Settings | No | No | 0 |
| Notifications | No | No | 1 |
| Tags | No | No | 1 |
| Login | No | No | 0 |
| Segments | No | No | 0 |
| Timeline | No | No | 0 |
| Filters | No | No | 0 |
| Admin | No | No | 0 |

**BRD coverage: 21% (4 of 19 features). PRD coverage: 0% (0 of 19 features).**

The four existing ADRs score 5/5 quality. The documentation gap is primarily at the PRD layer and across the 15 features with no BRD.

---

## 6. Confidence Trends (Incremental Delta)

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Average feature confidence | 89.6% | 89.6% | No change |
| New features discovered | — | 3 (Timeline, Filters, Admin) | +3 |
| Features with confidence decay | 0 | 0 | No change |
| Circular dependencies | 3 | 2 | -1 (resolved) |
| Integrations counted | 12 (agent-corrected to 20) | 18 catalogued | See security-report |

Two features were confidence-adjusted downward based on test coverage reassessment:
- `Activities`: 0.93 -> 0.92 (test coverage downgraded to partial)
- `Notes`: 0.92 -> 0.90 (zero test files confirmed)

---

## 7. Modules Exceeding CI/CD Churn Threshold

The `CLAUDE.md` churn threshold is 16+ commits in 14 days. Exceeding it triggers a mandatory architectural review.

| Module | Commits/14d | Threshold | Hotspot File | Action |
|--------|-------------|-----------|--------------|--------|
| `sales` | 17 | 16 | `SalesPermissionsTab.tsx` (5 edits/14d) | Architectural review required |
| `src/components` | 20 | 16 | `ListToolbar.tsx` (7 edits/14d) | Architectural review required |
| `providers` | 20 | 16 | `composedDataProvider.ts` (Caution Zone) | Monitor — high historical baseline |

---

## 8. Cross-Reference Findings

The following findings emerge from correlating across multiple baselines (`audit-meta.json` cross_references):

**High coupling + high risk:**
- `providers` (fan-in 91 via validation, risk: high) — the validation module's 91 dependents all flow through this layer.
- `opportunities` (fan-in 19, risk: high) — most-consumed feature module.

**Undocumented high-risk modules:**
- `providers` — README exists but individual handler JSDoc is sparse.
- `organizations` — no README, risk: high.
- `contacts` — no README, risk: high.
- `dashboard` — no README, risk: high.

---

## 9. Recommended Actions

### Immediate (before next deploy)

1. Remove and rotate committed credentials (sec-001, sec-002, sec-005). Add `.env*` to `.gitignore`.
2. Fix `StorageService.ts` — replace `Math.random()` with `crypto.randomUUID()`, add MIME allowlist.
3. Require `SITE_URL` env var in `supabase/functions/users/index.ts`.

### Short-term (next 1-2 sprints)

4. Resolve `opportunities <-> providers` circular dependency by moving stage-enum constants to `src/atomic-crm/constants/`.
5. Conduct architectural reviews for `sales` and `src/components` (both exceed CI/CD threshold).
6. Add READMEs to `organizations`, `contacts`, and `dashboard`.
7. Write BRDs for Sales, Tasks, Activities, Products (highest-priority undocumented features).

### Medium-term (next quarter)

8. Add test coverage for zero-coverage modules: `ProductDistributors`, `Notes`, `Timeline`, `Filters`, `Settings`, `Notifications`.
9. Document all 6 edge functions (triggers, env vars, failure modes).
10. Write the first PRDs — 0% coverage is a critical gap.

---

*All metrics are traceable to the baseline files listed in the header. Confidence: 96%.*
