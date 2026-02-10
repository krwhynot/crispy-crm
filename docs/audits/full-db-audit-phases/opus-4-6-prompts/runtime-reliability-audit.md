# Runtime Reliability & Performance Audit

**Date:** 2026-02-10
**Auditor:** Claude Code (Opus 4.6)
**Scope:** Edge Functions, Cron Jobs, View Security, Index Health, RLS Performance
**Overall Confidence:** [Confidence: 88%]

---

## 1) Executive Summary

This audit evaluates the runtime health of Crispy-CRM's cloud infrastructure following the Phase 1-6 database audit. Five areas were assessed:

| Area | Status | Severity |
|---|---|---|
| Edge Functions | 1 of 2 operational (`daily-digest` deferred non-MVP) | **RESOLVED** |
| Cron Jobs | `capture-dashboard-snapshots` verified E2E, `daily-digest` deferred | **RESOLVED** |
| View Security | ~~2 views bypass RLS~~ Fixed via `security_invoker = true` | **RESOLVED** |
| Index Health | ~~3 duplicate~~ Dropped + 56 unused indexes (expected for dev) | LOW |
| RLS Performance | 4 policies with per-row auth re-evaluation | WARN |

**Remediation applied this session:**
- S1+S2: Fixed SECURITY DEFINER on `entity_timeline` and `activities_summary` (migration `20260210141757`)
- R1: `capture-dashboard-snapshots` verified — 8 rows in `dashboard_snapshots` (Feb 10 15:17 UTC)
- R2: Dropped 3 duplicate notes timeline indexes (migration `20260210141757`)
- R3: Dropped 2 redundant tags policies (migration `20260210141757`)
- Vault `service_role_key` updated to correct JWT
- Service_role grants added for EF-accessed tables + sequence (migration `20260210150802`)

---

## 2) Edge Functions

### Inventory (8 deployed)

| Function | Status | Last Call | Result | Cron-Driven |
|---|---|---|---|---|
| `capture-dashboard-snapshots` | **OPERATIONAL** | Feb 10 15:17 UTC | **200** (8 rows) | Yes (23:00 daily) |
| `daily-digest` | ACTIVE | Feb 10 07:00 UTC | 401 | Yes (07:00 daily) |
| `check-overdue-tasks` | ACTIVE | — | — | No |
| `digest-opt-out` | ACTIVE | — | — | No |
| `health-check` | ACTIVE | — | — | No |
| `updatePassword` | ACTIVE | — | — | No |
| `users` | ACTIVE | — | — | No |
| `admin-reset-password` | ACTIVE | — | — | No |

### F1: `capture-dashboard-snapshots` — RESOLVED [Confidence: 99%]

**Original issue:** 404 at Feb 9 23:00 UTC (EF not yet deployed).

**Resolution chain (5 issues found and fixed):**
1. **404** — EF not deployed at cron time. Self-resolved after deployment at Feb 10 ~07:22 UTC.
2. **401** — Vault `service_role_key` contained stale/wrong key (publishable key format `sb_*`, 41 chars). Fixed by updating Vault with correct JWT (`eyJ*`, 219 chars) via `vault.update_secret()`.
3. **500** — `permission denied for table sales`. Service_role lacked table-level GRANT. Fixed with `GRANT SELECT ON sales/activities/opportunities TO service_role` + `GRANT ALL ON dashboard_snapshots TO service_role`.
4. **200 + 0 rows** — `permission denied for sequence dashboard_snapshots_id_seq`. PostgreSQL `GRANT ALL ON TABLE` does NOT cascade to sequences. Fixed with `GRANT USAGE, SELECT ON SEQUENCE dashboard_snapshots_id_seq TO service_role`.
5. **200 + 8 rows** — Fully operational after `NOTIFY pgrst, 'reload schema'`.

**Verification:** Manual trigger at Feb 10 15:17 UTC produced 8 rows in `dashboard_snapshots` (one per active sales user). Dale Ramsy: 18 activities, 2 tasks completed. Data is correct.

**Migration:** `20260210150802_grant_service_role_access_for_edge_functions.sql`

### F2: `daily-digest` — 401 (KNOWN, DEFERRED) [Confidence: 98%]

**Status:** Deferred as non-MVP per Phase 6 handoff (BLP #11). Auth failure documented. The 401 suggests the service role key in Vault either doesn't match or the EF's auth check has a bug.

**Action:** No action until owner changes scope. GitHub issue #7 tracks this.

### F3: `get_organization_descendants` — 404 (NOT AN EF)

This is an RPC function, not an Edge Function. The 404 from an OPTIONS preflight is expected — there is no EF by this name. Likely a stale CORS preflight from the app calling `supabase.rpc('get_organization_descendants')`.

**Action:** None needed.

---

## 3) Cron Jobs

### Job Inventory

| Job ID | Schedule | Function | Active | Status |
|---|---|---|---|---|
| 2 | `0 7 * * *` (7 AM UTC) | `invoke_daily_digest_function()` | Yes | SQL succeeds, EF returns 401 |
| 3 | `0 23 * * *` (11 PM UTC) | `invoke_snapshot_capture_function()` | Yes | **Verified E2E** — 8 rows captured |

### Silent Failure Pattern [Confidence: 92%]

Both cron jobs use the same fire-and-forget pattern via `pg_net`:

```
pg_cron → SQL function → Vault secrets → pg_net.http_post() → Edge Function
```

**Critical gap:** `pg_net` is asynchronous. The SQL function returns "1 row" (success) regardless of whether the EF responds 200, 401, or 404. The `cron.job_run_details` shows all runs as `succeeded` with `return_message: "1 row"` — this means "the SQL executed", NOT "the EF succeeded."

**Run history (last 20 runs):**
- Job 2 (daily-digest): 10 runs, all `succeeded` — but EF returns 401 every time
- Job 3 (snapshots): 10 runs, all `succeeded` — but EF returned 404 until deployment

**Impact:** There is zero observability into whether cron-driven EFs actually complete their work. The only way to verify is checking target table row counts or EF logs.

**Recommendation:** Add a `cron_execution_log` table or check `net._http_response` for status codes after each run. This would surface the 401/404 failures that are currently invisible.

---

## 4) View Security — SECURITY DEFINER (ERROR)

### Affected Views

| View | security_invoker | Risk |
|---|---|---|
| `activities_summary` | **false** | Bypasses RLS on `activities`, `sales`, `contacts`, `organizations`, `opportunities` |
| `entity_timeline` | **false** | Bypasses RLS on `activities`, `contact_notes`, `organization_notes`, `opportunity_notes` |

### All Other Views (24 total) — SECURE

All other public views have `security_invoker = true` or `on`. Only these 2 views are problematic.

### Root Cause [Confidence: 90%]

- `activities_summary`: Likely created before the project standardized on `security_invoker = true`. The view joins 5 tables and was probably created early in development.
- `entity_timeline`: Recently recreated (Phase 5, commit `e72071c`) with UNION ALL for notes. The `CREATE OR REPLACE VIEW` statement in the migration did NOT include `WITH (security_invoker = true)` — an oversight.

### Impact

With `security_invoker = false` (SECURITY DEFINER), these views execute as the **view owner** (typically `postgres` superuser), not the calling user. This means:
- RLS policies on `activities`, `contact_notes`, `organization_notes`, `opportunity_notes` are **bypassed**
- Any authenticated user querying these views sees ALL non-deleted rows, regardless of their role or company
- For single-tenant MVP this is functionally harmless but architecturally dangerous

### Remediation

```sql
ALTER VIEW public.entity_timeline SET (security_invoker = true);
ALTER VIEW public.activities_summary SET (security_invoker = true);
```

**Risk of fix:** LOW. Current RLS policies on underlying tables use `auth.uid() IS NOT NULL` (authenticated access), not company-scoped isolation. Switching to security_invoker won't break existing queries as long as the user is authenticated.

**Priority:** HIGH — fix before any multi-tenant or role-based access work.

---

## 5) Index Health

### 5a: Duplicate Indexes (4 pairs)

| Duplicate Index | Identical To | Table | Action |
|---|---|---|---|
| `idx_contact_notes_timeline` | `idx_contact_notes_contact_date` | contact_notes | DROP duplicate |
| `idx_opportunity_notes_timeline` | `idx_opportunity_notes_opportunity_date` | opportunity_notes | DROP duplicate |
| `idx_organization_notes_timeline` | `idx_organization_notes_org_date` | organization_notes | DROP duplicate |
| `idx_product_distributor_auth_deleted_at` | `idx_product_distributor_authorizations_deleted_at` | product_distributor_authorizations | DROP duplicate (already in Tier D) |

**Root cause for first 3:** The Phase 5 `entity_timeline` migration created `idx_*_timeline` indexes with the exact same definition as pre-existing `idx_*_date` indexes. Both are `(entity_id, date DESC) WHERE (deleted_at IS NULL)`.

**Impact:** Each duplicate index doubles write overhead on INSERT/UPDATE/DELETE for those tables. With 0 rows in notes tables currently, impact is negligible but should be cleaned before production use.

### 5b: Unused Indexes (56 total)

The Supabase performance advisor flagged 56 indexes that have never been scanned. This is expected for a development/beta environment with low traffic. These should be re-evaluated after production traffic establishes usage patterns.

**Action:** No immediate action. Re-audit after 30 days of production traffic. Any index still unused after sustained traffic is a drop candidate.

### 5c: Unindexed Foreign Keys (2)

Flagged by advisor but not critical for current scale. Monitor query performance.

---

## 6) RLS Performance — `auth_rls_initplan`

### Affected Policies

| Table | Policy Issue |
|---|---|
| `tags` | `auth.<function>()` re-evaluated per row |
| `product_features` | `auth.<function>()` re-evaluated per row |
| `migration_history` | `auth.<function>()` re-evaluated per row |
| `opportunity_products` | `auth.<function>()` re-evaluated per row |

### Explanation

When RLS policies call `auth.uid()` or `auth.jwt()` directly, PostgreSQL may re-evaluate the function for EVERY row. Wrapping in a subquery forces a single evaluation:

**Before (per-row):**
```sql
USING (auth.uid() IS NOT NULL)
```

**After (single evaluation):**
```sql
USING ((SELECT auth.uid()) IS NOT NULL)
```

### Impact

At current scale (< 10K rows per table), the performance impact is negligible. At scale (100K+ rows), this could add measurable latency to list queries.

**Action:** LOW priority. Fix opportunistically when touching these tables' policies.

---

## 7) Duplicate Permissive Policies — Tags Table

### Current State

| Policy | Command | Condition |
|---|---|---|
| `delete_tags_admin` | DELETE | `is_admin()` |
| `tags_delete_privileged` | DELETE | `private.is_admin_or_manager()` |
| `tags_soft_delete_authenticated` | UPDATE | `auth.uid() IS NOT NULL` |
| `update_tags_admin` | UPDATE | `is_admin()` |
| `tags_insert_privileged` | INSERT | `private.is_admin_or_manager()` |
| `tags_service_role` | ALL | `true` (service_role) |
| `authenticated_select_tags` | SELECT | `deleted_at IS NULL` |

### Issues

1. **Duplicate DELETE policies:** `delete_tags_admin` (admin only) and `tags_delete_privileged` (admin or manager) — permissive policies are OR'd together, so `tags_delete_privileged` is the effective policy. `delete_tags_admin` is redundant.

2. **Duplicate UPDATE policies:** `update_tags_admin` (admin only) and `tags_soft_delete_authenticated` (any authenticated user) — the soft-delete policy is more permissive, making `update_tags_admin` redundant.

**Action:** Drop `delete_tags_admin` and `update_tags_admin` as they're subsumed by the broader policies.

---

## 8) Auth Configuration

### Leaked Password Protection: DISABLED

The Supabase security advisor flagged that leaked password protection is disabled. This feature checks passwords against the HaveIBeenPwned database during signup/password change.

**Action:** Enable via Supabase Dashboard > Authentication > Security > Leaked Password Protection.

### Auth DB Connections: Absolute (10)

Auth DB pool connections are set to an absolute number (10) rather than a percentage of available connections. This could be suboptimal depending on the compute tier.

**Action:** LOW priority. Review if connection pool exhaustion becomes an issue.

---

## 9) Prioritized Remediation Plan

### Tier 1 — Security (Fix immediately)

| # | Finding | Migration | Status |
|---|---|---|---|
| S1 | `entity_timeline` SECURITY DEFINER | `20260210141757` | **DONE** |
| S2 | `activities_summary` SECURITY DEFINER | `20260210141757` | **DONE** |
| S3 | Enable leaked password protection | Dashboard toggle | PENDING (owner action) |

### Tier 2 — Reliability (Fix this week)

| # | Finding | Action | Status |
|---|---|---|---|
| R1 | Verify `capture-dashboard-snapshots` works | Manual trigger + verify 8 rows | **DONE** |
| R2 | Drop 3 duplicate notes timeline indexes | `20260210141757` | **DONE** |
| R3 | Drop 2 redundant tags policies | `20260210141757` | **DONE** |

### Tier 3 — Performance (Fix when touching)

| # | Finding | Action | Status |
|---|---|---|---|
| P1 | 4 RLS initplan warnings | Wrap `auth.*()` in `(SELECT ...)` | PENDING |
| P2 | 56 unused indexes | Re-audit after 30 days production traffic | Deferred |
| P3 | Cron observability gap | Add response logging or health check | Deferred |

### Tier 4 — Deferred

| # | Finding | Action | Status |
|---|---|---|---|
| D1 | `daily-digest` 401 auth failure | Fix auth flow | Non-MVP (GH #7) |
| ~~D2~~ | ~~Vault key freshness~~ | ~~Verify after first success~~ | **RESOLVED** (Vault key updated, EF verified) |
| D3 | Connection pooling review | Profile under load | No load baseline |

---

## 10) Recommended Next Actions

1. ~~Apply S1+S2 migration~~ — **DONE** (`20260210141757`)
2. ~~Apply R2+R3 migration~~ — **DONE** (`20260210141757`)
3. ~~Verify R1~~ — **DONE** (8 rows captured Feb 10 15:17 UTC)
4. **Enable S3** (leaked password protection) — dashboard toggle (owner action)
5. **Establish baselines** — after 7 days of production traffic, re-run `pg_stat_statements` and unused index analysis

---

*Audit generated from: Supabase MCP advisor data, cloud SQL queries, Edge Function logs, and cron job history.*
