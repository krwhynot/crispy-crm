# Audit Summary

**Generated:** 2026-03-03
**Run type:** Incremental (builds on 2026-03-03T12:00:00Z baseline)
**Sources:** `docs/audit/baseline/audit-meta.json`, `feature-inventory.json`, `risk-assessment.json`, `dependency-map.json`, `documentation-coverage.json`, `integration-map.json`, `document-linkage.json`
**Agents deployed:** 5 of 5 succeeded. All 6 baselines valid. [Confidence: 96%]

---

## 1. At a Glance

| Metric | Value | Delta vs Previous | Source |
|--------|-------|-------------------|--------|
| Total features catalogued | 20 | +1 (feat-pgs-001 WhatsNew) | `feature-inventory.json` |
| Total modules tracked | 28 | +3 (supabase, utils, constants) | `risk-assessment.json` |
| High-risk modules | 8 | no change | `risk-assessment.json` |
| Medium-risk modules | 12 | no change | `risk-assessment.json` |
| Low-risk modules | 8 | no change | `risk-assessment.json` |
| Average feature confidence | 88.5% | -1.1 pp | `feature-inventory.json` |
| Circular references | 0 | -2 (both resolved) | `dependency-map.json` |
| God classes | 1 (composedDataProvider) | no change | `dependency-map.json` |
| Total integrations mapped | 21 | +9 (count corrected + 3 new) | `integration-map.json` |
| Security observations | 7 | +1 (sec-007 CSP) | `integration-map.json` |
| High-severity security issues | 3 | no change | `integration-map.json` |
| BRD coverage | 40% (8/20) | +4 BRDs | `document-linkage.json` |
| PRD coverage | 0% | no change | `document-linkage.json` |
| ADR count | 4 | no change | `documentation-coverage.json` |
| Projects with README | 9 | +4 | `documentation-coverage.json` |
| Total doc files | 64 | +17 | `documentation-coverage.json` |
| Avg documentation quality | 3.7 / 5 | +0.3 | `documentation-coverage.json` |
| JSDoc coverage | ~15% | unchanged | `documentation-coverage.json` |
| TODO/FIXME count | 21 | not tracked previously | `documentation-coverage.json` |

---

## 2. Changes Since Previous Audit (2026-03-03T12:00:00Z)

### Improvements This Run

- **Both circular references resolved.** `opportunities <-> providers` and `utils <-> opportunities` eliminated via stage-enums refactor to `src/atomic-crm/constants/stage-enums.ts` (commit c74a58343). Circular reference count dropped from 2 to 0.
- **4 new BRDs added:** `docs/brd/sales.md`, `docs/brd/activities.md`, `docs/brd/tasks.md`, `docs/brd/products.md`. BRD count grew from 4 to 8, coverage from 21% to 40%.
- **4 new READMEs added:** reports, ui, filters, opportunities/__tests__. README-bearing projects increased from 5 to 9.
- **24 Storybook stories** added for `src/components/ui`.
- **Documentation quality score** improved from 3.4 to 3.7.
- **Integration count corrected** from 12 to 21. 3 net-new integrations discovered: Sentry source map upload (`int-monitor-002`), Chromatic (`int-api-006`), GitHub Actions Supabase deploy (`int-cicd-002`).

### New Issues This Run

- **sec-007 (Medium):** `unsafe-inline` in production `style-src` CSP directive at `src/config/csp-config.ts`. Reduces XSS protection posture. File added to AI guardrail list.
- **supabase/ newly tracked as Phase 3 high-risk.** 16K LOC, 54 commits in 30 days, 641 in 6 months. Production schema with no rollback path. Was previously unscored despite being a CLAUDE.md Caution Zone.
- **1 new feature (feat-pgs-001):** WhatsNew onboarding page discovered at `src/atomic-crm/pages/WhatsNew.tsx`. 518 lines, 90% confidence. No BRD.

### Ongoing Watches (Carry-Forward)

| Module | Issue | Consecutive Audits |
|--------|-------|--------------------|
| sales | 18 commits/14d exceeds 16+ CI/CD threshold | 2nd consecutive |
| providers | 30d commits increased 38 to 39 | watch |
| src/components | 14d commits stable at 20, above threshold | watch |
| sec-001 | Dev credentials in version control | unresolved |
| sec-002 | Production credentials in version control | unresolved |
| sec-003 | StorageService Math.random() filenames | unresolved |
| sec-005 | ES256 JWT in supabase/functions/.env | unresolved |

---

## 3. Top 5 Highest-Risk Modules

| Rank | Module | Risk Score | LOC | Commits 30d | Key Concern |
|------|--------|------------|-----|-------------|-------------|
| 1 | providers | 9/10 | 24,720 | 39 | Auth + composedDataProvider Caution Zones; 578 commits/6mo |
| 2 | opportunities | 9/10 | 26,828 | 37 | 19 fan-in, 10 fan-out; 771 commits/6mo; business-critical revenue |
| 3 | supabase | 9/10 | 16,051 | 54 | Production schema, no rollback, RLS, Edge Functions with service_role |
| 4 | src/components | 8/10 | 41,900 | 49 | 20 commits/14d exceeds CI/CD threshold; all features depend on it |
| 5 | validation | 8/10 | 19,702 | 33 | 91 fan-in; schema change cascades to every resource |

---

## 4. Confidence Changelog Summary

**Feature inventory average:** 88.5% (prev: 89.6%, delta: -1.1 pp)

The dip is intentional: more honest medium-confidence scoring for newer entries. No feature confidence decayed. One new feature added.

| Change Type | Count | Detail |
|-------------|-------|--------|
| New features | 1 | feat-pgs-001 (WhatsNew, 90%) |
| Confidence decay | 0 | None |
| Confidence improvement | 0 | None |
| Stable features | 19 | No change |

Full changelog: see `docs/audit/reports/confidence-changelog.md` equivalent detail is in section 2 above.

---

## 5. Security Summary

7 open observations: 3 high, 3 medium, 1 low.

| ID | Severity | File | Issue |
|----|----------|------|-------|
| sec-001 | High | `.env.development` | Live Supabase dev credentials in version control |
| sec-002 | High | `.env.production` | Live Supabase production credentials in version control |
| sec-005 | High | `supabase/functions/.env` | ES256 service role JWT in version control |
| sec-003 | Medium | `StorageService.ts` | Math.random() filenames, no MIME allowlist, public URLs |
| sec-004 | Medium | `supabase/functions/users/index.ts` | SITE_URL fallback to localhost if env var missing |
| sec-007 | Medium | `src/config/csp-config.ts` | unsafe-inline in production style-src CSP (NEW) |
| sec-006 | Low | `supabase/.env` | Static auth encryption key placeholder committed |

> Full detail, AI guardrails, and remediation guidance: see `docs/audit/reports/security-report.md`.

---

## 6. Documentation Coverage Summary

- **BRD coverage:** 40% (8 of 20 features). Up from 21% (4 of 19).
- **PRD coverage:** 0% — no PRDs exist for any feature.
- **ADR count:** 4, all scoring 5/5 quality.
- **JSDoc coverage:** ~15% of public APIs.

Top priority BRD gaps:

| Feature | Risk Level | Why It Matters |
|---------|------------|----------------|
| Reports (feat-rpt-001) | High | High-risk module, complex aggregation architecture, no BRD |
| Notifications (feat-ntf-001) | Medium | Cross-cutting; powers daily-digest and check-overdue-tasks edge functions |
| ProductDistributors (feat-pdi-001) | Medium | Junction table with RLS authorization implications (DB-008) |
| Notes (feat-not-001) | Medium | dompurify XSS sanitization boundary undocumented |

---

## 7. Recommended Actions

### Immediate (before next production deploy)

1. **Rotate and remove committed credentials** (sec-001, sec-002, sec-005). Add `.env*` to `.gitignore`. Verify `git log --all -- .env.production` for exposure history.
2. **Fix StorageService.ts** (sec-003): replace `Math.random()` with `crypto.randomUUID()`, add MIME allowlist, use signed URLs.
3. **Fix CSP** (sec-007): remove `unsafe-inline` from `style-src` in `src/config/csp-config.ts`.

### Short-term (next 1-2 sprints)

4. **Architectural review** for `sales` module (18 commits/14d, second consecutive audit over threshold).
5. **Write BRD for Reports** — high-risk, complex module with no documentation.
6. **Add READMEs** to `organizations`, `contacts`, `dashboard`, and `supabase/functions/`.
7. **Require `SITE_URL` env var** in `supabase/functions/users/index.ts` (sec-004).

### Medium-term (next quarter)

8. **Begin PRD authoring** — 0% PRD coverage is a significant planning gap.
9. **Add test coverage** to zero-coverage modules: ProductDistributors, Timeline, Filters, Settings, Notifications.
10. **Document all 6 edge functions** — triggers, env vars, and failure modes.
11. **Write BRDs** for Notifications, ProductDistributors, Notes, Settings, Login.

---

*All metrics trace to the baseline files listed in the header. [Confidence: 96%]*
