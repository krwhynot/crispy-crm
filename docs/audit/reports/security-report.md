# Security Report — Integration and Security Observations

**Generated:** 2026-03-03
**Run type:** Incremental (builds on 2026-03-03T12:00:00Z baseline)
**Sources:** `docs/audit/baseline/integration-map.json`, `docs/audit/baseline/audit-meta.json`
[Confidence: 97%]

---

## Summary

| Category | Count | Change vs Previous |
|----------|-------|-------------------|
| Total integrations mapped | 21 | +9 (count corrected + 3 new) |
| Open security observations | 7 | +1 (sec-007 added this run) |
| High severity | 3 | no change |
| Medium severity | 3 | +1 (sec-007) |
| Low severity | 1 | no change |
| Hardcoded credentials | 3 | no change |
| AI guardrail files | 8 | +1 (csp-config.ts added) |

---

## Security Observations — Full Matrix

### High Severity

| ID | File | Type | Description | Status | Action Required |
|----|------|------|-------------|--------|-----------------|
| sec-001 | `.env.development` | hardcoded_credential | Live Supabase dev URL and anon key committed to version control. | Unresolved (carry-forward) | Remove from git history. Add `.env*` to `.gitignore`. Rotate dev anon key in Supabase dashboard. |
| sec-002 | `.env.production` | hardcoded_credential | Live production Supabase URL and anon key committed to version control. If this repository has ever been public or shared, the key is compromised. | Unresolved (carry-forward) | Rotate production anon key immediately. Run `git log --all -- .env.production` to assess exposure window. Use GitHub secret scanning or `git filter-repo` to purge from history. |
| sec-005 | `supabase/functions/.env` | hardcoded_credential | ES256 service role JWT in version control. Service role bypasses all RLS policies — full database access if extracted. | Updated this run (ES256 token confirmed) | Rotate service role key immediately. Remove file from git. Use Supabase vault or CI/CD secrets for Edge Function environment. |

> These three issues must be resolved before any external sharing of this repository. [Confidence: 99%]

### Medium Severity

| ID | File | Type | Description | Status | Action Required |
|----|------|------|-------------|--------|-----------------|
| sec-003 | `src/atomic-crm/providers/supabase/services/StorageService.ts` | unvalidated_input | `Math.random()` used for filenames (predictable, guessable), no MIME type allowlist enforced, public URLs returned instead of signed URLs. Violates CORE-019 and PRV-007. | Unresolved (carry-forward) | Replace `Math.random()` with `crypto.randomUUID()`. Add MIME allowlist (e.g., image/jpeg, image/png, application/pdf). Switch to signed URLs per PRV-008. |
| sec-004 | `supabase/functions/users/index.ts` | unvalidated_input | `SITE_URL` env var has a `localhost` fallback. In production, if `SITE_URL` is not set, redirect URLs point to localhost — allowing auth redirect hijacking. | Unresolved (carry-forward) | Make `SITE_URL` a required env var. Add startup assertion: `if (!Deno.env.get('SITE_URL')) throw new Error('SITE_URL required')`. |
| sec-007 | `src/config/csp-config.ts` | misconfiguration | Production Content Security Policy includes `unsafe-inline` in `style-src`. This weakens XSS protection by permitting inline styles, which can be exploited in certain XSS vectors. | NEW this run | Migrate to CSS classes or a nonce-based CSP. Remove `unsafe-inline` from `style-src`. Re-test UI rendering after removal. |

### Low Severity

| ID | File | Type | Description | Status | Action Required |
|----|------|------|-------------|--------|-----------------|
| sec-006 | `supabase/.env` | unencrypted | Static placeholder `SUPABASE_AUTH_ENCRYPTION_KEY` committed. Placeholder value is not the production key, but its presence normalizes committing secrets to this path. | Unresolved (carry-forward) | Replace with a `.env.example` file containing placeholder documentation. Add `supabase/.env` to `.gitignore`. |

---

## Integration Security Posture

### Integration Map (21 total)

| ID | Category | Name | Auth Method | Security Notes |
|----|----------|------|-------------|----------------|
| int-auth-001 | auth | Supabase Auth Client SDK | api_key | Standard anon key. RLS enforces access. |
| int-auth-002 | auth | Supabase Auth Admin API (Edge) | api_key | Service role — full RLS bypass. Guarded by guardrail list. |
| int-db-001 | database | Supabase PostgreSQL (Data Provider) | api_key | All reads/writes via composedDataProvider. RLS active. |
| int-db-002 | database | Supabase PostgreSQL (Edge Admin) | api_key | Service role access from edge functions. |
| int-edge-001 | edge_functions | daily-digest | (pg_cron 07:00 UTC) | Server-side, scheduled. Needs env var validation. |
| int-edge-002 | edge_functions | check-overdue-tasks | (pg_cron 09:00 UTC) | Server-side, scheduled. |
| int-edge-003 | edge_functions | users | HTTP REST | Manages auth users. See sec-004. |
| int-edge-004 | edge_functions | updatepassword | HTTP REST | Password reset flow. |
| int-edge-005 | edge_functions | digest-opt-out | HTTP REST (unauthenticated) | ⚠️ Unauthenticated endpoint — verify rate limiting and CSRF protection. |
| int-edge-006 | edge_functions | capture-dashboard-snapshots | (pg_cron 23:00 UTC) | Server-side, scheduled. |
| int-edge-007 | edge_functions | health-check | HTTP REST (public) | Public endpoint — ensure it does not leak internal state. |
| int-monitor-001 | monitoring | Sentry Error Monitoring | api_key | Runtime error reporting. |
| int-monitor-002 | monitoring | Sentry Source Map Upload | api_key | Build-time only. NEW this run. Auth token scoped to source maps. |
| int-api-001 | api | Gravatar | none | Outbound only. Contact email hashed before send. |
| int-api-002 | api | favicon.show | none | Outbound only. Domain name only, no PII. |
| int-api-003 | api | Direct Domain Favicon Fetch | none | Outbound only. Domain name only. |
| int-api-004 | api | ui-avatars.com | none | Outbound only. Initials only. |
| int-api-005 | api | Google Fonts CDN | none | Whitelist in CSP. Covered by style-src. |
| int-api-006 | api | Chromatic Visual Regression | api_key | NEW this run. Dev/CI only, not production. |
| int-cicd-001 | cicd | GitHub Actions CI | oauth | CI pipeline. Secrets stored in GitHub repo secrets. |
| int-cicd-002 | cicd | GitHub Actions Supabase Deploy | api_key | NEW this run. Deploys migrations to production. Key must be in GitHub secrets, not code. |

---

## Unauthenticated Endpoints

Two Edge Functions expose unauthenticated HTTP endpoints. These require specific scrutiny:

| Function | Path | Risk | Verification Needed |
|----------|------|------|---------------------|
| digest-opt-out | `supabase/functions/digest-opt-out/index.ts` | Medium | Verify rate limiting. Confirm opt-out token is unguessable (not sequential). Check for CSRF exposure. |
| health-check | `supabase/functions/health-check/index.ts` | Low | Confirm response body does not expose internal version strings, env var names, or infrastructure details. |

---

## AI Guardrail Recommendations

The following files are flagged for human review before any automated modification. They are designated `auto_modify: false` in `integration-map.json`.

| File | Reason |
|------|--------|
| `src/atomic-crm/providers/supabase/authProvider.ts` | Auth flow — mistakes lock out all users |
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Handler routing hub — changes affect all resources simultaneously |
| `supabase/functions/users/index.ts` | User management with Auth Admin API |
| `supabase/functions/_shared/supabaseAdmin.ts` | Service role client — full RLS bypass |
| `supabase/migrations/` | Production schema — irreversible without `db reset` |
| `src/atomic-crm/providers/supabase/services/StorageService.ts` | Open security observation sec-003 |
| `src/config/csp-config.ts` | CSP — affects XSS protection posture (NEW this run) |
| `.github/workflows/supabase-deploy.yml` | Production deployment pipeline |

---

## RLS Policy Coverage

RLS is described as 100% enabled across all tables in CLAUDE.md. The following areas require audit verification via CMD-006 (`rg "CREATE POLICY" supabase/migrations`):

| Area | Rule | Risk if Missing |
|------|------|-----------------|
| Junction tables (product_distributors, contact_organizations) | DB-008: Policies must validate both FK sides | Unauthorized cross-tenant data access |
| Junction table FK indexes | DB-009: Authorization queries backed by FK indexes | Full table scans on authorization check |
| Soft-delete visibility | DB-003: All reads must hide `deleted_at IS NOT NULL` rows | Soft-deleted records visible to users |
| `USING (true)` policies | DB-007: Banned except approved service/public cases | Open read access to all rows |
| Storage objects | DB-005: `storage.objects` must have RLS enabled | Private files accessible without auth |

> Run CMD-006 after any migration change: `rg "CREATE POLICY" supabase/migrations`

---

## Changes Since Previous Audit

| Change | Type | Detail |
|--------|------|--------|
| sec-007 added | New observation | `unsafe-inline` in production CSP `style-src` at `src/config/csp-config.ts` |
| sec-005 updated | Severity confirmed | ES256 JWT token confirmed (previously "service role key placeholder") |
| sec-003 confirmed | Carry-forward | StorageService Math.random() still unresolved |
| sec-001, sec-002 confirmed | Carry-forward | .env files with live keys still in version control |
| int-monitor-002 added | New integration | Sentry source map upload via sentryVitePlugin in vite.config.ts |
| int-api-006 added | New integration | Chromatic visual regression testing service |
| int-cicd-002 added | New integration | GitHub Actions Supabase deploy workflow |
| csp-config.ts added to guardrails | Guardrail expanded | File added due to sec-007 finding |
| Integration count corrected | Baseline correction | 12 to 21; 9 integrations were previously uncounted |

---

*Source: `docs/audit/baseline/integration-map.json`. [Confidence: 97%]*
