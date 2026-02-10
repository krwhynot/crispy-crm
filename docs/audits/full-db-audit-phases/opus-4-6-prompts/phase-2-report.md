# Phase 2 Report: Deep Analysis

**Date:** 2026-02-09
**Auditor:** Claude Code (Opus 4.6, Docker local + Supabase MCP cloud)
**Mode:** PLAN MODE (Read-Only)
**Lens:** supabase-postgres-best-practices
**Status:** COMPLETE
**Overall Confidence:** [Confidence: 91%]

> Historical snapshot note: this report reflects Phase 2 findings at the time it was produced.
> Current owner-approved business logic and latest execution outcomes are in `business-logic-policy.md`, `phase-3-report.md`, and `phase-4-report.md`.

---

## 1) Phase 1 Assertion Verification

| Assertion | Status | Notes |
|-----------|--------|-------|
| Tasks stored in `activities` via STI | **CONFIRMED** | All 6 views use `activity_type = 'task'`, zero references to old `tasks` table [100%] |
| `tasks_deprecated` dropped in cloud | **CONFIRMED** | Table does not exist in either environment. Migration 20260210000004 applied [100%] |
| `entity_timeline` is a VIEW from `activities` | **CONFIRMED** | Single-source VIEW on `activities` with STI branching [100%] |
| 67-migration gap exists | **SUPERSEDED** | Phase 1 migration counts were 354 in both environments. The "gap" was the 4 untracked migration files, now committed. No migration gap exists. [95%] |
| `capture-dashboard-snapshots` NOT deployed | **CONFIRMED** | Edge Function logs show `POST | 404` daily. Not in deployed function list. Source code exists locally and is ready for deployment. [100%] |
| `daily-digest` returns 401 | **CONFIRMED** | Edge Function logs show `POST | 401`. Root cause analyzed below (Section 4). [100%] |
| 11 RLS policies missing soft-delete filter | **SUPERSEDED** | Only **4 SELECT policies** missing soft-delete: `audit_trail`, `dashboard_snapshots`, `migration_history`, `tutorial_progress`. These are non-entity tables where deleted_at filtering is arguable. The 11-count was incorrect or referred to a different metric. [90%] |
| 2 cron jobs calling failing endpoints | **PARTIALLY CONFIRMED** | `capture-dashboard-snapshots` fails with 404 (confirmed). `daily-digest` fails with 401 (confirmed). But the cron SQL functions execute successfully — the failures are in the downstream HTTP calls via `pg_net`. [95%] |

### Supersession Details

**67-Migration Gap (Superseded):** Phase 1 reported 354 migrations in both environments. The actual drift was 4 untracked SQL files in git + 33 missing triggers/functions on cloud. The trigger gap is NOT a migration gap — all migrations are applied to both environments. The functions/triggers are missing because some migrations use `CREATE OR REPLACE FUNCTION` which may have failed silently when pushed via `supabase db push` while dependencies weren't available, or were created via `supabase db reset` locally (which replays ALL migrations) but only new ones were pushed to cloud.

**RLS Soft-Delete Gap (Superseded):** Cloud query of all SELECT policies without `deleted_at` filter returned only 4 tables, not 11. The discrepancy suggests Phase 1 may have counted policies across all operations (INSERT, UPDATE, DELETE) or included views. Current finding: 4 SELECT policies lack soft-delete filter, all on non-entity tables.

---

## 2) Track A: Drift Analysis

### Object-Level Drift Matrix

| Object | Type | Local State | Cloud State | Classification | Root Cause | [Confidence] |
|--------|------|-------------|-------------|----------------|------------|--------------|
| Triggers | Count | 85 | 52 | **DANGEROUS** | 34 triggers for audit, timestamps, cascade missing from cloud | [95%] |
| Functions | Count | 117 | 96 | **DANGEROUS** | ~21 functions for audit protection, cascades, timestamps missing from cloud | [90%] |
| Views | Count | 26 | 27 | **SUSPICIOUS** | `contact_duplicates`, `duplicate_stats` cloud-only; `opportunity_stage_changes` local-only | [85%] |
| RLS Policies | Count | 98 | 91 | **SUSPICIOUS** | 7 additional local policies, some duplicate DELETE policies | [80%] |
| Tables | Count | 26 | 26 | **EXPECTED** | Identical structure | [100%] |
| Indexes | Count | ~160 | ~160 | **EXPECTED** | Identical index set | [90%] |
| Foreign Keys | Count | 68 | 68 | **EXPECTED** | Identical FK structure | [100%] |
| Migrations | Count | 355 | 355 | **EXPECTED** | Now in sync (migration 000005 added) | [100%] |
| Edge Functions | N/A | N/A (runtime stopped) | 7 deployed | N/A | Local edge runtime not running | [100%] |

### Trigger Gap Detail (34 triggers in 5 deployment batches)

| Batch | Category | Trigger Count | Function Count | Risk | Dependencies |
|-------|----------|---------------|----------------|------|--------------|
| 1 | Core Timestamps (`update_*_updated_at`) | 11 | 1 | LOW | `updated_at` columns exist |
| 2 | Extended Timestamps | 5 | 1 (reuse) | LOW | Batch 1 function |
| 3A | Audit Field Immutability (`protect_*_audit`) | 5 | 1 | LOW | `current_sales_id()`, audit columns |
| 3B | Cascade Soft-Delete + Block | 4 | 2 | MEDIUM | Note tables, opportunities FK check |
| 3C | Notes Timestamps | 6 | 3 | LOW | Batch 1-2 |
| 4 | Critical Field Audit Logging | 4 | 1 | MEDIUM-HIGH | `audit_trail` table, SECURITY DEFINER |
| 5 | Timeline Event Logging | 7 | 4 | MEDIUM | Activities RLS, SECURITY DEFINER |

### Cloud Trigger Integrity Check

All 52 cloud triggers reference **existing** functions (zero orphaned triggers). This supersedes Phase 1's note about `audit_user_favorites` trigger referencing a nonexistent function. [Confidence: 100%]

### Migration Gap Analysis

**There is no migration gap.** Both environments have 355 migrations (354 original + migration 000005 added during this session). The drift is in **runtime state** — functions and triggers that exist in migrations but weren't properly applied to cloud, likely due to:

1. `supabase db reset` locally replays ALL migrations sequentially (correct dependency order)
2. `supabase db push` to cloud applies only NEW migrations, which may have failed silently for `CREATE OR REPLACE FUNCTION` when dependencies weren't ready

### Deployment Risk Assessment

**If local trigger migrations are pushed to cloud as-is:**
- **Batch 1-2 (Timestamps):** Safe. Additive only. All tables have `updated_at` columns. [95%]
- **Batch 3A (Audit Immutability):** Safe. Requires `current_sales_id()` which exists on cloud. [90%]
- **Batch 3B (Cascade Soft-Delete):** **CAUTION.** The `prevent_org_delete_with_active_opps` trigger will block org archival if active opportunities exist. Cloud has 14 non-deleted opportunities. [85%]
- **Batch 4 (Critical Audit):** Requires `audit_trail` table (exists on cloud with 194k rows). SECURITY DEFINER function. [85%]
- **Batch 5 (Timeline):** Creates activity records automatically. SECURITY DEFINER functions. [80%]

---

## 3) Track B: Dependency Graphs

### Digest System Path

```
CURRENT PATH (what actually happens):
pg_cron (0 7 * * * UTC)
  -> SELECT invoke_daily_digest_function()
    -> Vault: project_url + service_role_key [OK]
    -> pg_net.http_post('{url}/functions/v1/daily-digest', Bearer {service_role_key})
      -> Supabase Edge Runtime: verify_jwt=true [ACCEPTS service_role JWT]
        -> daily-digest v6: checks token === CRON_SECRET || SERVICE_ROLE_KEY
          -> Token comparison FAILS (Vault key vs env var mismatch?)
            -> Returns 401 "Unauthorized"
  -> pg_cron logs: "succeeded" (SQL function returned, pg_net is fire-and-forget)

RESULT: Silent failure. Cron appears healthy, digest never runs.

TARGET PATH (what should happen):
pg_cron -> invoke_daily_digest_function() -> pg_net -> daily-digest Edge Function
  -> Authenticate via service_role_key
  -> For each active sales user with digest_opt_in=true:
    -> get_user_digest_summary(sales_id) [uses activities table, STI-correct]
    -> If actionable items (tasks due, overdue, stale deals):
      -> INSERT INTO notifications
  -> Return summary JSON
```

**Root Cause Analysis (daily-digest 401):**

The deployed `daily-digest` v6 (last updated 2025-12-08) checks:
```typescript
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (token === CRON_SECRET || token === SERVICE_ROLE_KEY) { /* authenticated */ }
```

The `invoke_daily_digest_function()` sends the Vault `service_role_key` as Bearer token. Possible causes:
1. **`CRON_SECRET` not configured** as Edge Function secret, AND
2. **Token string comparison fails** because the Vault `service_role_key` value doesn't exactly match `SUPABASE_SERVICE_ROLE_KEY` env var (encoding/whitespace difference)
3. **Deployed `_shared/supabaseAdmin.ts` is stale** — the v6 deployed version uses direct initialization while the local codebase has lazy initialization with `LOCAL_*` prefix support

**Fix:** Redeploy `daily-digest` with current codebase. If `CRON_SECRET` isn't set as an Edge Function env var, either set it or remove the check. [Confidence: 80%] To Increase: Check Edge Function env vars via Supabase dashboard.

### Dashboard Snapshot Path

```
CURRENT PATH (what actually happens):
pg_cron (0 23 * * * UTC)
  -> SELECT invoke_snapshot_capture_function()
    -> Vault: project_url + service_role_key [OK]
    -> pg_net.http_post('{url}/functions/v1/capture-dashboard-snapshots', Bearer {service_role_key})
      -> Supabase Edge Runtime: 404 NOT FOUND
  -> pg_cron logs: "succeeded" (pg_net fire-and-forget)

RESULT: Silent failure. 0 rows in dashboard_snapshots. Has been running daily for 60+ days.

TARGET PATH (after deployment):
pg_cron -> invoke_snapshot_capture_function() -> pg_net -> capture-dashboard-snapshots
  -> Authenticate via service_role_key
  -> For each active sales user (parallel via Promise.allSettled):
    -> Calculate 8 metrics (activities, tasks, deals, stale deals)
    -> UPSERT INTO dashboard_snapshots (sales_id, snapshot_date)
  -> Return summary { total_users, successful, failed }
```

**Source Code Status:** Complete (339 lines in `supabase/functions/capture-dashboard-snapshots/index.ts`). Ready for deployment. [Confidence: 95%]

### Entity Timeline Chain

| Layer | Object | Type | Status | Source |
|-------|--------|------|--------|--------|
| 1 | `entity_timeline` | VIEW | HEALTHY | `activities` WHERE `deleted_at IS NULL` |
| 2 | `activities` | TABLE (STI) | HEALTHY | Base table for tasks + activities |
| 3 | `tasks_v` | VIEW | HEALTHY | Compat view: `activities WHERE activity_type = 'task'` |
| 4 | `tasks_summary` | VIEW | HEALTHY | Compat view with aggregations |
| 5 | `priority_tasks` | VIEW | HEALTHY | Filtered view for priority ordering |

All layers reference `activities` table only. No legacy `tasks` references remain. [Confidence: 100%]

### Replacement Target Map

| Legacy Object | Status | Replacement | Notes |
|---------------|--------|-------------|-------|
| `tasks_deprecated` | DROPPED | `activities WHERE activity_type = 'task'` | Clean |
| `task_id_mapping` | DROPPED | N/A (migration rollback helper) | Clean |
| `test_user_metadata` | DROPPED | N/A (test artifact) | Clean |
| `tasks_v` view | ACTIVE (compat) | Direct `activities` queries | Keep for backward compat |
| `tasks_summary` view | ACTIVE (compat) | `activities_summary` filtered | Keep for backward compat |

---

## 4) Track C: Operations Health

### Job Inventory

| Job | Schedule | Execution Path | Status | Failure Point | Silent? |
|-----|----------|----------------|--------|---------------|---------|
| Daily Digest | `0 7 * * *` | `invoke_daily_digest_function()` -> `daily-digest` Edge Function | **FAILING** | HTTP 401 at Edge Function auth | **YES** (pg_net fire-and-forget) |
| Snapshot Capture | `0 23 * * *` | `invoke_snapshot_capture_function()` -> `capture-dashboard-snapshots` Edge Function | **FAILING** | HTTP 404 (function not deployed) | **YES** (pg_net fire-and-forget) |

### Failing Path Analysis

**Daily Digest (401):**
- SQL function executes successfully (Vault secrets retrieved)
- HTTP POST sent with Bearer token
- Edge runtime accepts JWT (verify_jwt: true passes)
- Edge Function internal auth check rejects token
- Likely cause: env var mismatch or stale deployment
- Impact: No daily digest notifications for any user
- Duration of failure: Unknown, possibly since 2025-12-08 (last deployment)

**Snapshot Capture (404):**
- SQL function executes successfully
- HTTP POST sent to non-existent Edge Function endpoint
- Supabase returns 404
- Impact: `dashboard_snapshots` table stays at 0 rows, `useMyPerformance` hook falls back to live queries (no trends)
- Duration of failure: Since table creation (2025-12-12, ~60 days)

### Silent Failure Inventory

| Job/Function | Appears To | Actually Does | Impact |
|-------------|------------|---------------|--------|
| `invoke_daily_digest_function()` | Succeeds (cron shows "1 row") | HTTP call silently fails with 401 | No digest notifications |
| `invoke_snapshot_capture_function()` | Succeeds (cron shows "1 row") | HTTP call silently fails with 404 | No dashboard metric snapshots |
| `cleanup_old_notifications` trigger | Cleans old notifications | May be cleaning all notifications if timing is wrong | Possibly explains 0 notification rows |

**pg_net Fire-and-Forget Pattern:**
Both cron failures share the same root cause pattern: `pg_net.http_post()` is async and fire-and-forget. The SQL function considers itself successful after dispatching the HTTP request, regardless of the response. This is by design (avoid blocking pg_cron) but creates an observability gap.

### Edge Function Security Assessment

| Function | `verify_jwt` | Internal Auth | Security Status |
|----------|-------------|---------------|-----------------|
| `daily-digest` | true | Bearer token check (CRON_SECRET or SERVICE_ROLE_KEY) | **OVER-SECURED** - double auth may cause failures |
| `check-overdue-tasks` | true | Unknown (not inspected) | Standard |
| `capture-dashboard-snapshots` | N/A | Bearer token check vs SERVICE_ROLE_KEY | **NOT DEPLOYED** |
| `users` | **false** | Manual Bearer + `auth.getUser()` + role check | **ADEQUATE** - internal auth compensates [100%] |
| `health-check` | **false** | Unknown | Standard for health checks |
| `updatePassword` | true | Standard | Standard |
| `admin-reset-password` | true | Standard | Standard |
| `digest-opt-out` | true | Standard | Standard |

---

## 5) Cross-Reference Synthesis

### Drift Items Causing Operational Failures

| Drift | Causes Failure In | Mechanism |
|-------|-------------------|-----------|
| `capture-dashboard-snapshots` not deployed | Snapshot cron produces 404 | Edge Function doesn't exist on cloud |
| `daily-digest` stale deployment (v6) | Digest cron produces 401 | Deployed auth logic doesn't match current invoker pattern |
| 34 missing triggers | No direct operational failure | **Data integrity gap** — `updated_at` not auto-managed, audit fields not protected, soft-delete not cascaded |

### Dependency-Aware Fix Ordering

**Phase A: Fix Silent Failures (zero risk to existing data)**
1. Deploy `capture-dashboard-snapshots` Edge Function
2. Redeploy `daily-digest` Edge Function with current codebase
3. Verify both cron chains work end-to-end

**Phase B: Deploy Triggers (incremental, per user's Q1 answer)**
1. Batch 1: Core Timestamps (11 triggers) — no dependencies
2. Batch 2: Extended Timestamps (5 triggers) — depends on Batch 1
3. Batch 3A/3B/3C: Audit + Cascade (15 triggers) — parallel after Batch 2
4. Batch 4: Critical Audit Logging (4 triggers) — after Batch 3
5. Batch 5: Timeline Events (7 triggers) — after Batch 4

**Phase C: Cleanup (after monitoring)**
1. Resolve duplicate RLS DELETE policies
2. Sync view drift (3 views with no cross-env equivalent)
3. Remove possibly redundant indexes

### Circular Dependencies

None identified. All dependency chains are acyclic. [Confidence: 95%]

---

## 6) Updated Risk Register

| ID | Severity | Finding | Source | User Impact | Technical Mechanism | Status |
|----|----------|---------|--------|-------------|---------------------|--------|
| **P1-1** | HIGH | Cloud missing 34 data-integrity triggers | Phase 1 (CONFIRMED, refined) | `updated_at` not auto-managed; audit fields unprotected; soft-delete not cascaded to notes | Local migrations applied via `db reset` but functions/triggers not pushed to cloud | CONFIRMED |
| **P1-2** | HIGH | Phantom snapshot cron job | Phase 1 (CONFIRMED) | Dashboard metric trends unavailable; `useMyPerformance` falls back to live queries | `capture-dashboard-snapshots` Edge Function not deployed; source exists locally | CONFIRMED |
| **P1-3** | MEDIUM | Duplicate RLS DELETE policies | Phase 1 (CONFIRMED, downgraded) | Potentially wider delete access than intended on notes tables | Multiple permissive policies OR'd together | CONFIRMED |
| **P2-1** | HIGH | **daily-digest returns 401** | Phase 2 (NEW) | Zero daily digest notifications for all users since ~Dec 2025 | Deployed Edge Function v6 auth check rejects service_role_key from Vault | NEW |
| **P2-2** | MEDIUM | `users` Edge Function without JWT | Phase 1 (RESOLVED) | No security concern | Function implements internal auth via `auth.getUser()` + role check | RESOLVED |
| **P2-3** | LOW | Possibly duplicate indexes | Phase 1 (CARRIED) | Wasted storage, marginally slower writes | `idx_opportunities_customer_org` vs `idx_opportunities_customer_organization_id` | CARRIED |
| **P2-4** | LOW | 3 views with no cross-env equivalent | Phase 1 (CARRIED) | Testing gap | `contact_duplicates`, `duplicate_stats` cloud-only; `opportunity_stage_changes` local-only | CARRIED |
| **P2-5** | LOW | 4 SELECT policies missing soft-delete filter | Phase 2 (NEW, supersedes Phase 1 "11 policies") | Deleted records in `audit_trail`, `dashboard_snapshots`, `migration_history`, `tutorial_progress` may be visible | Non-entity tables where soft-delete filtering is arguable | NEW |
| **P2-6** | INFO | `notifications` table always 0 rows | Phase 2 (NEW) | Digests never fire (401), and `cleanup_old_notifications` trigger may clean remaining | Could indicate cleanup trigger is too aggressive, or simply no notifications ever created | NEW |

---

## 7) Unknowns

| # | Unknown | What Would Resolve It | Blocking Phase |
|---|---------|----------------------|----------------|
| 1 | Why does `daily-digest` v6 reject the service_role_key? | Check Edge Function env vars in Supabase dashboard; compare Vault `service_role_key` with `SUPABASE_SERVICE_ROLE_KEY` | Phase 3 (deployment) |
| 2 | Is `CRON_SECRET` set as an Edge Function env var? | Supabase dashboard -> Edge Functions -> Env vars | Phase 3 |
| 3 | Why do `contact_duplicates` and `duplicate_stats` views only exist on cloud? | Search migration files for these view names | Phase 3 (low priority) |
| 4 | Is `cleanup_old_notifications` trigger too aggressive? | Review trigger code; check if it deletes ALL notifications vs old ones only | Phase 3 |

---

## 8) Multiple-Choice Questions (Answered by User)

### [Q1] Cloud missing ~33 data-integrity triggers

**Selected:** B — Audit first, then deploy incrementally
**Reason:** 33 trigger changes are high blast radius for beta data. Audit completed in this phase; 5-batch incremental deployment plan documented.

### [Q2] `capture-dashboard-snapshots` Edge Function missing

**Selected:** A — Build/deploy the missing Edge Function
**Reason:** Dropping cron/table is premature; restore intended behavior first. Source code is complete (339 lines). Temporarily pause cron only if deployment can't happen immediately.

### [Q3] Four migration files not committed to git

**Selected:** A — Review/consolidate and commit to git now
**Reason:** Already applied to DB; this is a version-control sync issue. **DONE** — 5 migration files committed in this session (4 original + 1 supplementary view fix).

---

*Generated by Claude Code (Opus 4.6) - Phase 2 Database Audit*
*Completed 2026-02-09*
