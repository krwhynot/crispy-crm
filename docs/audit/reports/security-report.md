# Security Report — Integration Scanner Findings

**Generated:** 2026-03-03
**Baseline run:** incremental (prior run: 2026-03-03T00:00:00Z)
**Source:** `docs/audit/baseline/integration-map.json`, `docs/audit/baseline/audit-meta.json`
**Confidence:** 97%

---

## 1. Security Issue Summary

| Severity | Count | Items |
|----------|-------|-------|
| HIGH | 2 | sec-001, sec-002 |
| MEDIUM | 3 | sec-003, sec-004, sec-005 |
| LOW | 1 | sec-006 |
| **Total** | **6** | |

> **Status:** No change in security issue count from prior audit run. All 6 issues remain open.

---

## 2. Security Observations by Severity

### HIGH — Immediate Action Required

#### sec-001: Development Credentials Committed to Git
- **File:** `.env.development`
- **Type:** Hardcoded credential
- **Description:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are hardcoded in a committed `.env.development` file. Any developer or CI runner with repository access has these credentials.
- **Impact:** Supabase anon key exposure allows unauthenticated API calls to the development Supabase project. Depending on RLS policy coverage, this may allow data reads or writes.
- **Recommendation:**
  1. Add `.env.development` to `.gitignore`.
  2. Remove the file from git history: `git filter-branch` or `git-filter-repo`.
  3. Rotate the anon key via the Supabase dashboard if the repository is shared or has been cloned externally.
  4. Provide `.env.development.example` with placeholder values for developer onboarding.

#### sec-002: Production Credentials Committed to Git
- **File:** `.env.production`
- **Type:** Hardcoded credential
- **Description:** Production `VITE_SUPABASE_URL` and anon key are committed to version control.
- **Impact:** Full exposure of the production Supabase project endpoint and anon key. If the repository is or has ever been public, the key should be considered compromised.
- **Recommendation:**
  1. Immediately add `.env.production` to `.gitignore` and remove from git history.
  2. **Rotate the production anon key** via Supabase dashboard if there is any possibility the repository was publicly accessible.
  3. Inject production credentials via CI/CD secrets (GitHub Actions `secrets.SUPABASE_ANON_KEY`).
  4. Verify RLS policies are comprehensive — even the anon key with tight RLS limits blast radius.

---

### MEDIUM — Address This Sprint

#### sec-003: Insecure Filename Generation and Missing MIME Allowlist in StorageService
- **File:** `src/atomic-crm/providers/supabase/services/StorageService.ts`
- **Type:** Unvalidated input / storage hygiene
- **Rule Violation:** CORE-019 (Storage hygiene baseline)
- **Description:** `Math.random()` is used to generate storage filenames. This is not cryptographically secure and produces predictable patterns. Additionally, no MIME type allowlist validation is enforced before upload.
- **Impact:** An attacker with upload access could enumerate filenames (low entropy). Without MIME validation, unexpected file types could be stored in the attachments bucket.
- **Recommendation:**
  1. Replace `Math.random()` with `crypto.randomUUID()` for filename generation.
  2. Add an explicit MIME allowlist (e.g., `['image/jpeg', 'image/png', 'application/pdf']`) and reject uploads outside the list.
  3. Validate file extension against MIME type to prevent extension spoofing.
  4. Reference: CORE-019, PRV-007, DB-005.

#### sec-004: Unvalidated redirectTo URL in Users Edge Function
- **File:** `supabase/functions/users/index.ts`
- **Type:** Unvalidated input / open redirect risk
- **Description:** The `redirectTo` URL origin fallback behavior relies on the completeness of an `ALLOWED_ORIGINS` list. If `ALLOWED_ORIGINS` is misconfigured or incomplete, an attacker could craft a redirect to an arbitrary origin.
- **Impact:** Open redirect can be used in phishing attacks or OAuth token theft flows.
- **Recommendation:**
  1. Require `SITE_URL` environment variable. Fail fast with a logged error if it is absent or invalid.
  2. Validate `redirectTo` against an explicit allowlist at the start of the function.
  3. Log and reject any `redirectTo` value that does not match an approved origin.

#### sec-005: Service Role Key Committed to Git
- **File:** `supabase/functions/.env`
- **Type:** Hardcoded credential
- **Description:** `LOCAL_SERVICE_ROLE_KEY` is committed to version control. The service role key bypasses all Row Level Security policies entirely.
- **Impact:** Any person or process with repository access has the ability to perform unrestricted database reads and writes on the Supabase project, bypassing all RLS enforcement.
- **Recommendation:**
  1. Add `supabase/functions/.env` to `.gitignore` immediately.
  2. Remove from git history.
  3. Rotate the service role key via the Supabase dashboard.
  4. Provide `supabase/functions/.env.example` with placeholder values.
  5. Inject via CI/CD secrets only.

---

### LOW — Address Before Next Audit

#### sec-006: Static Placeholder Encryption Key
- **File:** `supabase/.env`
- **Type:** Weak credential / unencrypted
- **Description:** `SUPABASE_AUTH_ENCRYPTION_KEY` is set to a static placeholder string rather than a generated key.
- **Impact:** A weak or guessable encryption key reduces the security of encrypted auth tokens.
- **Recommendation:**
  1. Add `supabase/.env` to `.gitignore`.
  2. Generate a real key: `openssl rand -base64 32`.
  3. Store the generated key in a secrets manager or CI/CD secrets store.

---

## 3. AI Guardrail Recommendations

The following files are flagged as requiring human review before any AI-assisted modification. AI agents must not auto-modify these files.

| File | Required Review | Rationale |
|------|----------------|-----------|
| `src/atomic-crm/providers/supabase/authProvider.ts` | Security team | Authentication flow — mistakes lock out all users |
| `src/atomic-crm/providers/supabase/supabase.ts` | Security team | Supabase client initialization and credential loading |
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Lead developer | God class — all DB access routes through this file |
| `supabase/functions/users/index.ts` | Security team | User management and redirectTo validation |
| `supabase/functions/_shared/supabaseAdmin.ts` | Security team | Admin client with service role key — RLS bypass |
| `supabase/functions/_shared/cors-config.ts` | Security team | CORS policy — misconfiguration allows cross-origin attacks |
| `supabase/migrations/` | Lead developer | Production schema changes |
| `src/atomic-crm/providers/supabase/services/StorageService.ts` | Lead developer | File upload handling and storage security |
| `src/config/csp-config.ts` | Security team | Content Security Policy configuration |
| `vite.config.ts` | Lead developer | Build configuration including Sentry plugin |

---

## 4. Integration Security Posture

### External API Integrations

Three external avatar/favicon services are used without a Content Security Policy fallback:

| Integration | Provider | File | Risk |
|-------------|----------|------|------|
| Gravatar | Automattic | `utils/avatar.utils.ts` | External image requests expose user email hashes |
| favicon.show | favicon.show | `utils/avatar.utils.ts` | Third-party CDN trust dependency |
| ui-avatars.com | ui-avatars.com | `utils/avatar.utils.ts` | Data sent to external service (first name/last name) |
| Google Fonts CDN | Google | `src/config/csp-config.ts` | Font loading from Google's CDN — CSP must allow |

Recommendation: Ensure CSP `img-src` and `connect-src` directives in `csp-config.ts` explicitly allowlist these origins. Consider self-hosting fonts to eliminate the Google Fonts CDN dependency.

### Edge Function Security Posture

| Function | Trigger | Auth Required | Notes |
|----------|---------|---------------|-------|
| `daily-digest` | pg_cron 07:00 UTC | Service role | Uses admin client — verify `ALLOWED_ORIGINS` |
| `check-overdue-tasks` | pg_cron 09:00 UTC | Service role | Uses admin client |
| `capture-dashboard-snapshots` | pg_cron 23:00 UTC | Service role | Uses admin client |
| `users` | HTTP REST | Service role | redirectTo validation gap (sec-004) |
| `updatepassword` | HTTP REST | Service role | Admin client for password changes |
| `digest-opt-out` | HTTP REST | **Unauthenticated** | Public endpoint — verify rate limiting and input validation |
| `health-check` | HTTP REST | **Public** | Public endpoint — ensure no sensitive data in response |

The `digest-opt-out` function accepts unauthenticated requests. Ensure it is rate-limited and that the opt-out token is validated server-side before making any database writes.

### RLS Policy Coverage

RLS is reported as 100% in `CLAUDE.md`. The following specific risks remain:

- **`product_distributors` junction table**: DB-008 requires RLS policies to validate authorization for both linked FK records. Zero test coverage exists for this table. Run CMD-006 (`rg "CREATE POLICY" supabase/migrations`) to verify policy existence.
- **`USING (true)` ban**: DB-007 prohibits permissive policies except for explicitly approved service/public reference-data cases. Manual audit recommended after each migration batch.

---

## 5. Confidence Changelog Notes (Security)

From `audit-meta.json`:
- Integration count was corrected from 12 to 20 in the previous audit. This baseline catalogs 18 integrations.
- No new security issues were added or resolved between the initial and incremental audit runs.
- The `sec-001` through `sec-006` findings have been persistent across both audit runs and are confirmed open.

---

*Source: `docs/audit/baseline/integration-map.json`. Confidence: 97%. Human review required for sec-001 and sec-002 actions.*
