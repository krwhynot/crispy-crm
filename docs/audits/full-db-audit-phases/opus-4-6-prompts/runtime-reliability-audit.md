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
| Edge Functions | 1 of 2 operational, 1 timing-resolved | WARN |
| Cron Jobs | SQL invocations healthy, EF outcomes unverifiable | WARN |
| View Security | 2 views bypass RLS (SECURITY DEFINER) | **ERROR** |
| Index Health | 3 duplicate + 56 unused indexes | LOW |
| RLS Performance | 4 policies with per-row auth re-evaluation | WARN |

**Top Priority:** Fix `entity_timeline` and `activities_summary` SECURITY DEFINER — these views bypass RLS, meaning any authenticated user can read all rows regardless of row-level policies on underlying tables.

---

## 2) Edge Functions

### Inventory (8 deployed)

| Function | Status | Last Call | Result | Cron-Driven |
|---|---|---|---|---|
| `capture-dashboard-snapshots` | ACTIVE | Feb 9 23:00 UTC | 404 | Yes (23:00 daily) |
| `daily-digest` | ACTIVE | Feb 10 07:00 UTC | 401 | Yes (07:00 daily) |
| `check-overdue-tasks` | ACTIVE | — | — | No |
| `digest-opt-out` | ACTIVE | — | — | No |
| `health-check` | ACTIVE | — | — | No |
| `updatePassword` | ACTIVE | — | — | No |
| `users` | ACTIVE | — | — | No |
| `admin-reset-password` | ACTIVE | — | — | No |

### F1: `capture-dashboard-snapshots` — 404 (TIMING, NOT REGRESSION) [Confidence: 95%]

**Causal chain:**
1. Cron job 3 fired at **Feb 9, 23:00 UTC** (runid 129)
2. `invoke_snapshot_capture_function()` retrieved Vault secrets, constructed URL, fired `pg_net` POST
3. Hit `/functions/v1/capture-dashboard-snapshots` → **404** because EF was not yet deployed
4. EF was deployed at **Feb 10, ~07:22 UTC** (8+ hours AFTER the cron run)
5. Next cron run: **Feb 10, 23:00 UTC** — should succeed

**Evidence:**
- EF `created_at` timestamp: `1770708357451` ms = Feb 10 ~07:22 UTC
- 404 log timestamp: `1770678000959` us = Feb 9 23:00 UTC
- `function_id: null` in 404 log confirms no matching EF existed at call time
- `dashboard_snapshots` table: **0 rows** — confirms EF has never executed successfully

**Vault secrets:** Both `project_url` and `service_role_key` exist (created Nov 29, 2025).

**Auth flow:** EF uses `verify_jwt: true` + manual service key check in code. The `invoke_snapshot_capture_function()` SQL passes `Bearer <service_role_key>` via `pg_net`. This should authenticate correctly IF the Vault `service_role_key` matches the project's actual service role key.

**Risk:** LOW — self-resolving on next cron run (Feb 10 23:00 UTC). Monitor `dashboard_snapshots` row count after.

**Action:** Verify Feb 10 23:00 run succeeds. If 0 rows after, check Vault key freshness.

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
| 3 | `0 23 * * *` (11 PM UTC) | `invoke_snapshot_capture_function()` | Yes | SQL succeeds, EF returned 404 (timing) |

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

| # | Finding | Migration | Effort |
|---|---|---|---|
| S1 | `entity_timeline` SECURITY DEFINER | `ALTER VIEW ... SET (security_invoker = true)` | Trivial |
| S2 | `activities_summary` SECURITY DEFINER | `ALTER VIEW ... SET (security_invoker = true)` | Trivial |
| S3 | Enable leaked password protection | Dashboard toggle | Trivial |

### Tier 2 — Reliability (Fix this week)

| # | Finding | Action | Effort |
|---|---|---|---|
| R1 | Verify `capture-dashboard-snapshots` works | Check after Feb 10 23:00 UTC cron run | Monitor |
| R2 | Drop 3 duplicate notes timeline indexes | Migration | Trivial |
| R3 | Drop 2 redundant tags policies | Migration | Trivial |

### Tier 3 — Performance (Fix when touching)

| # | Finding | Action | Effort |
|---|---|---|---|
| P1 | 4 RLS initplan warnings | Wrap `auth.*()` in `(SELECT ...)` | Low |
| P2 | 56 unused indexes | Re-audit after 30 days production traffic | Deferred |
| P3 | Cron observability gap | Add response logging or health check | Medium |

### Tier 4 — Deferred

| # | Finding | Action | Blocker |
|---|---|---|---|
| D1 | `daily-digest` 401 auth failure | Fix auth flow | Non-MVP (GH #7) |
| D2 | `capture-dashboard-snapshots` Vault key freshness | Verify after first success | Pending R1 |
| D3 | Connection pooling review | Profile under load | No load baseline |

---

## 10) Recommended Next Actions

1. **Apply S1+S2 migration** (view security fix) — single migration, zero risk
2. **Apply R2+R3 migration** (cleanup duplicates) — can combine with S1+S2
3. **Monitor R1** — check `dashboard_snapshots` row count after Feb 10 23:00 UTC
4. **Enable S3** (leaked password protection) — dashboard toggle
5. **Establish baselines** — after 7 days of production traffic, re-run `pg_stat_statements` and unused index analysis

---

*Audit generated from: Supabase MCP advisor data, cloud SQL queries, Edge Function logs, and cron job history.*
