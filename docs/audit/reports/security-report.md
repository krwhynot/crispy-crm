# Security Report — Integration and Security Observations

**Generated:** 2026-03-03T23:30:00Z
**Baseline source:** `docs/audit/baseline/integration-map.json`
**Audit type:** Incremental (last audit: 2026-03-03T20:00:00Z)

---

## Summary

| Metric | Value |
|---|---|
| Total integrations mapped | 21 |
| Security issues open | 8 |
| High severity | 3 |
| Low severity | 5 |
| Hardcoded credentials found | 3 files |
| AI guardrail-protected paths | 10 |

---

## Security Observations — Full List

### High Severity

| ID | Type | File | Description | Status |
|---|---|---|---|---|
| sec-001 | hardcoded_credential | `.env.development` | Live development Supabase project URL and anon key committed to version control. | ⚠️ Confirmed open |
| sec-002 | hardcoded_credential | `.env.production` | Live production Supabase project URL and anon key committed to version control. | ⚠️ Confirmed open |
| sec-005 | hardcoded_credential | `supabase/functions/.env` | ES256-signed local service role JWT and anon JWT committed to version control. | ⚠️ Confirmed open |

All three high-severity items involve credentials committed to the git repository. Even if the repository is private, committed credentials create rotation risk and CI/CD exposure. Immediate action required.

### Low Severity

| ID | Type | File | Description | Status |
|---|---|---|---|---|
| sec-003 | unencrypted | `src/atomic-crm/providers/supabase/services/StorageService.ts` | PARTIAL RESOLUTION: `crypto.randomUUID()` and MIME allowlist added. Public URLs still used instead of signed URLs (PRV-008 gap). | Partially resolved — downgraded from medium |
| sec-004 | unvalidated_input | `supabase/functions/users/index.ts` | IMPROVED: Origin validation hardened with fail-fast guard. `SITE_URL` env var still optional. | Improved — downgraded from medium |
| sec-006 | unencrypted | `supabase/.env` | Placeholder auth encryption key committed. Local-only development placeholder. | Low risk; local only |
| sec-007 | misconfiguration | `vite.config.ts` | `unsafe-inline` persists in production `style-src`. `csp-config.ts` diverges from enforced CSP in `vite.config.ts` (missing `https://*.sentry.io` in `connectSrc`). | Open |
| sec-008 | hardcoded_credential | `supabase/functions/_shared/cors-config.ts` | Production domain hostnames hardcoded in version-controlled source file. | New this cycle |

---

## Changes Since Last Audit

| Change | Detail |
|---|---|
| RESOLVED (partial) | sec-003: StorageService now uses `crypto.randomUUID()` and enforces MIME allowlist. Public URLs still used — downgraded to low. |
| IMPROVED | sec-004: `users/index.ts` origin validation hardened with fail-fast guard; severity downgraded to low. |
| NEW | sec-008: Production domain hostnames hardcoded in version-controlled `cors-config.ts`. |
| NEW | sec-009 (tracked as sec-007): `csp-config.ts` `connectSrc` missing `https://*.sentry.io` — diverges from enforced CSP in `vite.config.ts`. |
| UPDATED | sec-007: Production `script-src` no longer uses `unsafe-inline`. `unsafe-inline` persists in `style-src` only. |
| UPDATED | int-cicd-002: `supabase-deploy.yml` now deploys `health-check` function. |
| CONFIRMED | sec-001, sec-002, sec-005: credentials still committed; no rotation performed. |

---

## Remediation Roadmap

| Priority | Issue | Recommended Action |
|---|---|---|
| P0 | sec-001, sec-002 | Add `.env.development` and `.env.production` to `.gitignore`. Rotate the exposed Supabase anon keys. Use GitHub Actions secrets or Doppler for CI/CD environment injection. |
| P0 | sec-005 | Remove `supabase/functions/.env` from version control. Rotate the committed JWT tokens. Store secrets in Supabase Vault or GitHub secrets. |
| P1 | sec-007 | Add `https://*.sentry.io` to `connectSrc` in `csp-config.ts`. Reconcile `csp-config.ts` with `vite.config.ts` so one is the single source of truth. |
| P2 | sec-003 | Replace public storage URLs with signed URLs (`StorageService.ts`). Implement PRV-008 fully. |
| P2 | sec-008 | Move production domain constants to environment variables rather than hardcoded strings in `cors-config.ts`. |
| P3 | sec-004 | Make `SITE_URL` a required environment variable with a startup assertion rather than optional. |
| P3 | sec-006 | Document that `supabase/.env` is local-only and add a note in `supabase/README.md`. |

---

## Integration Map — All 21 Integrations

| ID | Category | Name | Provider | Confidence |
|---|---|---|---|---|
| int-auth-001 | auth | Supabase Auth (Client SDK) | Supabase | 99% |
| int-auth-002 | auth | Supabase Auth Admin API (Edge Functions) | Supabase | 99% |
| int-db-001 | database | Supabase PostgreSQL (Data Provider) | Supabase | 99% |
| int-db-002 | database | Supabase PostgreSQL (Edge Function Admin) | Supabase | 99% |
| int-edge-001 | edge_function | daily-digest | Supabase Edge Runtime (Deno) | 99% |
| int-edge-002 | edge_function | check-overdue-tasks | Supabase Edge Runtime (Deno) | 99% |
| int-edge-003 | edge_function | users | Supabase Edge Runtime (Deno) | 99% |
| int-edge-004 | edge_function | updatepassword | Supabase Edge Runtime (Deno) | 99% |
| int-edge-005 | edge_function | digest-opt-out | Supabase Edge Runtime (Deno) | 99% |
| int-edge-006 | edge_function | capture-dashboard-snapshots | Supabase Edge Runtime (Deno) | 99% |
| int-edge-007 | edge_function | health-check | Supabase Edge Runtime (Deno) | 99% |
| int-monitor-001 | monitoring | Sentry Error Monitoring (Runtime) | Sentry | 99% |
| int-monitor-002 | monitoring | Sentry Source Map Upload (Build-time) | Sentry | 97% |
| int-api-001 | api | Gravatar Avatar Service | Gravatar (Automattic) | 97% |
| int-api-002 | api | favicon.show Favicon Service | favicon.show | 97% |
| int-api-003 | api | Direct Domain Favicon Fetch | Target Domain | 97% |
| int-api-004 | api | ui-avatars.com Fallback | ui-avatars.com | 97% |
| int-api-005 | api | Google Fonts CDN | Google | 95% |
| int-api-006 | api (dev) | Chromatic Visual Regression Testing | Chromatic | 92% |
| int-cicd-001 | cicd | GitHub Actions CI Pipeline | GitHub | 97% |
| int-cicd-002 | cicd | GitHub Actions Supabase Deploy | Supabase + GitHub | 99% |
| int-storage-001 | storage | Supabase Storage (Attachments) | Supabase | 97% |

---

## AI Guardrail Recommendations

The following files are flagged as requiring human review before any AI-assisted modification. Auto-modification is disabled for all of these paths.

| Path | Review Required By | Reason |
|---|---|---|
| `src/atomic-crm/providers/supabase/authProvider.ts` | security_team | Auth flow; mistakes lock out all users. Active auth rework in progress. |
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | lead_engineer | God class routing all DB access. Change affects all resources. |
| `supabase/functions/users/index.ts` | security_team | Admin Auth API. Manages user invite, password reset, and orphan recovery. |
| `supabase/functions/_shared/supabaseAdmin.ts` | security_team | Service role client shared across edge functions. |
| `supabase/functions/_shared/cors-config.ts` | security_team | Hardcoded production domains. Incorrect CORS allows cross-origin auth abuse. |
| `supabase/migrations/` | lead_engineer | Production schema. No rollback path. |
| `src/atomic-crm/providers/supabase/services/StorageService.ts` | security_team | File upload service. MIME allowlist and URL signing logic. |
| `src/config/csp-config.ts` | security_team | Content Security Policy config. Divergence from `vite.config.ts` identified. |
| `.github/workflows/supabase-deploy.yml` | lead_engineer | Production deployment pipeline. |
| `src/main.tsx` | security_team | Sentry initialization and root app entrypoint. |

---

## RLS Policy Coverage

RLS is enforced at the PostgreSQL level on all tenant tables. Per `CLAUDE.md` and `DATABASE_LAYER.md`:

- `USING (true)` is banned except for approved `service_role` or public reference-data policies (DB-007).
- All read policies must enforce `deleted_at` soft-delete visibility (DB-003).
- Junction-table policies must validate authorization for both linked FK records (DB-008).
- Junction-table authorization queries must be backed by FK indexes (DB-009).

Current known gaps:
- Storage bucket RLS policies: existence not confirmed in migration files reviewed (sec-003, see `feature-inventory.json` `feat-db-001` assumptions).
- `get_sale_by_id` and `get_sale_by_user_id` SECURITY DEFINER RPCs: role restriction confirmation pending pgTAP coverage.

Run `CMD-006` (`rg "CREATE POLICY" supabase/migrations`) to audit all active RLS policies.

---

## Confidence Statement

Security findings sourced from `integration-map.json`. Severity ratings reflect agent assessment at time of last audit run (2026-03-03T20:00:00Z). High-severity findings (sec-001, sec-002, sec-005) are confirmed present in the working repository. All three require human action — no automated remediation is safe for credential rotation.

[Confidence: 95%]
