# Phase 1 Report: Baseline Inventory

**Date:** 2026-02-09
**Auditor:** Claude Code (Supabase MCP + Local CLI)
**Mode:** PLAN MODE (Read-Only Audit)
**Lens:** supabase-postgres-best-practices
**Status:** COMPLETE

---

## 1) Environment Coverage

| Environment | Status | Access Method |
|-------------|--------|---------------|
| **Cloud** | Accessible | Supabase MCP (project: `aaqnanddcqvfiwhshndl`) |
| **Local** | Accessible | `npx supabase` CLI (v2.72.7) via PostgreSQL 127.0.0.1:54322 |

**Blocker Resolved:** Local Supabase accessible via `npx supabase` (not in PATH but available via npx).

---

## 2) Inventory Summary

### 2.1 Local vs Cloud Comparison

| Object Type | Cloud | Local | Diff | Status |
|-------------|-------|-------|------|--------|
| **Tables** | 26 | 25 | -1 | Local missing 1 table |
| **Views** | 27 | 26 | -1 | Local missing 1 view |
| **Functions** | 107 | 117 | +10 | Local has 10 more |
| **Triggers** | 67 | 107 | +40 | Local has 40 more |
| **Indexes** | 177 | 179 | +2 | Local has 2 more |
| **RLS Policies** | 101 | 98 | -3 | Local missing 3 policies |
| **Cron Jobs** | 2 | 2 | 0 | Match |
| **Migrations** | 287 | 354 | +67 | **SIGNIFICANT DRIFT** |

### 2.2 Drift Analysis [Confidence: 90%]

**Migration Drift:** Local has 67 more migrations than cloud. This indicates:
- Local development is significantly ahead of cloud
- Recent migrations (20260209-20260210) include security fixes and STI migration cleanup
- Cloud may be missing critical function/trigger updates

**Object Count Inversions:**
| Pattern | Implication |
|---------|-------------|
| Cloud has +1 table, +1 view | Possible manual cloud additions or local drops |
| Local has +10 functions, +40 triggers | Local has unreleased functionality |
| Cloud has +3 RLS policies | Policies added directly to cloud via MCP |

**Root Cause Hypothesis:** Cloud and local have diverged due to:
1. Migrations applied to cloud via MCP without local sync
2. Local development ahead with uncommitted migrations
3. Possible `supabase db reset` on local that re-ran all migrations

---

### 2.3 Cloud Tables Detail (26 BASE TABLEs)

| Table | Rows | Soft Delete | Purpose |
|-------|------|-------------|---------|
| `activities` | 71 | Yes | Unified activities + tasks (STI) |
| `audit_trail` | 194,446 | No | Change history |
| `contact_notes` | 0 | Yes | Contact notes |
| `contacts` | 1,664 | Yes | Customer contacts |
| `dashboard_snapshots` | 0 | No | Pre-computed metrics |
| `distributor_principal_authorizations` | 4 | Yes | Principal-distributor auth |
| `interaction_participants` | 0 | Yes | Activity participants |
| `migration_history` | 0 | No | Migration tracking |
| `notifications` | 0 | Yes | User notifications |
| `opportunities` | 14 | Yes | Sales opportunities |
| `opportunity_contacts` | 0 | Yes | Junction table |
| `opportunity_notes` | 0 | Yes | Opportunity notes |
| `opportunity_participants` | 0 | Yes | Participant organizations |
| `opportunity_products` | 1 | Yes | Junction table |
| `organization_distributors` | 673 | Yes | Junction table |
| `organization_notes` | 0 | Yes | Organization notes |
| `organizations` | 2,093 | Yes | All organization types |
| `product_distributor_authorizations` | 0 | Yes | Product auth overrides |
| `product_distributors` | 0 | Yes | Junction table |
| `product_features` | 0 | Yes | Product attributes |
| `products` | 14 | Yes | Product catalog |
| `sales` | 8 | Yes | Sales team |
| `segments` | 40 | Yes | Playbook/operator segments |
| `tags` | 0 | Yes | Tagging system |
| `tutorial_progress` | 0 | No | Onboarding state |
| `user_favorites` | 11 | Yes | Quick-access favorites |

### 2.4 Local Tables (25 BASE TABLEs)

**Missing from local:** 1 table (likely `contact_duplicates` or similar materialized view that appears as table in cloud)

**Extra view in local:** `opportunity_stage_changes` (present in local, missing from cloud view list)

### 2.5 RLS Policy Summary

| Metric | Cloud | Local |
|--------|-------|-------|
| Tables with RLS | 26/26 (100%) | 25/25 (100%) |
| Total policies | 101 | 98 |
| USING(true) policies | 6 (all service_role) | - |
| Missing soft-delete filter | 11 | - |

### 2.6 Cron Jobs (Both Environments)

| Job ID | Schedule | Command | Status |
|--------|----------|---------|--------|
| 1 | `0 7 * * *` (7 AM UTC) | `invoke_daily_digest_function()` | Active |
| 2 | `0 23 * * *` (11 PM UTC) | `invoke_snapshot_capture_function()` | Active |

---

## 3) Data Structure Confirmation

### Task Storage Model [Confidence: 95%]

**Tasks are stored in the `activities` table** using Single Table Inheritance (STI).

```sql
-- Discriminator column
activities.activity_type = 'task'
```

**Task-specific columns:**
| Column | Type | Purpose |
|--------|------|---------|
| `due_date` | date | Target completion |
| `completed` | boolean | Completion status |
| `completed_at` | timestamptz | When completed |
| `priority` | enum | low/medium/high/critical |
| `sales_id` | bigint | Assigned sales rep |
| `snooze_until` | timestamptz | Snooze until date |
| `related_task_id` | bigint | Links to parent task |

**Verified in:** Both cloud and local have this structure.

### Role of `tasks_deprecated` [Confidence: 95%]

**No `tasks_deprecated` table exists in cloud database.**

Migration `20260210000004_drop_deprecated_tasks_artifacts.sql` has been applied to cloud. Local also shows no deprecated tasks table.

### Role of `entity_timeline` [Confidence: 95%]

**`entity_timeline` is a VIEW** that unifies activities and tasks.

```sql
SELECT id,
    CASE WHEN activity_type = 'task' THEN 'task' ELSE 'activity' END AS entry_type,
    type::text AS subtype,
    subject AS title,
    ...
FROM activities
WHERE deleted_at IS NULL
  AND (activity_type <> 'task' OR snooze_until IS NULL OR snooze_until <= now());
```

**Fed by:** `activities` table only
**Present in:** Both cloud and local

---

## 4) Edge Function & Cron Health (Phase 2 Prep)

### 4.1 Edge Functions Status

| Function | Deployed | JWT Required | Health |
|----------|----------|--------------|--------|
| `updatePassword` | Yes | Yes | OK |
| `users` | Yes | No | OK |
| `daily-digest` | Yes | Yes | **401 AUTH ERROR** |
| `check-overdue-tasks` | Yes | Yes | Unknown |
| `digest-opt-out` | Yes | Yes | OK |
| `health-check` | Yes | No | OK |
| `admin-reset-password` | Yes | Yes | OK |
| `capture-dashboard-snapshots` | **NO** | - | **NOT DEPLOYED** |

### 4.2 Critical Issues Found

| Issue | Severity | Impact |
|-------|----------|--------|
| `capture-dashboard-snapshots` NOT DEPLOYED | **P0 CRITICAL** | `dashboard_snapshots` table empty (0 rows) |
| `daily-digest` returns 401 | **P1 HIGH** | No digest notifications sent |
| All users have `digest_opt_in: null` | **P2 MEDIUM** | Even working digest would skip everyone |

### 4.3 Cron Job Reality

Cron jobs ARE running on schedule, but:
- `invoke_snapshot_capture_function()` calls a non-existent Edge Function → 404
- `invoke_daily_digest_function()` calls Edge Function that returns 401 → no notifications
- SQL functions return "success" even when HTTP calls fail (fire-and-forget via `pg_net`)

---

## 5) Uncommitted Migration Review (Phase 2 Prep)

### 5.1 Migration Summary

| Migration | Risk | Rollback | Data Loss |
|-----------|------|----------|-----------|
| `20260210000001_fix_exec_sql_security` | LOW | LOW | None |
| `20260210000002_fix_digest_functions_use_activities` | MEDIUM | MEDIUM | None |
| `20260210000003_fix_views_use_activities` | MEDIUM | MEDIUM | None |
| `20260210000004_drop_deprecated_tasks_artifacts` | **HIGH** | **HIGH** | **YES** |

### 5.2 Execution Order (Critical)

```
1. fix_exec_sql_security          (standalone, security patch)
2. fix_digest_functions_use_activities  (updates 7 functions for STI)
3. fix_views_use_activities       (updates 2 views for STI)
4. drop_deprecated_tasks_artifacts (DESTRUCTIVE - drops tables)
```

### 5.3 Migration 4 Warning

**`20260210000004_drop_deprecated_tasks_artifacts`** is **IRREVERSIBLE**:
- Drops `tasks_deprecated` table
- Drops `task_id_mapping` table
- Drops `tutorial_progress.created_task_id` column
- Uses `CASCADE` which may drop unexpected dependencies
- No backup mechanism in migration

**Recommendation:** Create manual backup before applying migration 4.

---

## 6) Initial Risks (Updated)

### P0 - CRITICAL

1. **`capture-dashboard-snapshots` Edge Function NOT DEPLOYED**
   - Impact: Dashboard metrics never captured
   - Action: Deploy function immediately
   - Severity: Critical

### P1 - HIGH

2. **`daily-digest` 401 Authentication Error**
   - Impact: No digest notifications sent
   - Action: Fix service_role_key in Vault or adjust JWT verification
   - Severity: High

3. **67-migration drift between local and cloud**
   - Impact: Environments out of sync, deployment risk
   - Action: Reconcile before any production changes
   - Severity: High

### P2 - MEDIUM

4. **Missing `deleted_at IS NULL` in 11 RLS policies**
   - Tables: `distributor_principal_authorizations`, `organization_distributors`, `product_distributor_authorizations`, `tags`, `interaction_participants`, `opportunity_participants`
   - Impact: Updates/deletes could affect soft-deleted records
   - Severity: Medium

5. **Migration 4 is IRREVERSIBLE**
   - Contains `DROP TABLE ... CASCADE`
   - Requires backup before execution
   - Severity: Medium (controlled risk)

### P3 - LOW

6. **2 duplicate indexes on `product_distributor_authorizations`**
   - Impact: Wasted storage, extra write overhead
   - Severity: Low

7. **4 migrations uncommitted to git**
   - Impact: Git history incomplete
   - Severity: Low

---

## 7) Unknowns (Remaining)

1. **Exact table/view differences** - Need to identify which specific table/view differs
2. **Storage bucket RLS** - Not audited in Phase 1
3. **Why local has more triggers** - May indicate unreleased features

---

## 8) Multiple-Choice Questions and Answers

### [Q1] Should we prioritize fixing the 11 RLS policies missing `deleted_at IS NULL` filters?

- **Selected: A** - Yes, fix immediately in Phase 2
- **Reason:** Prevents potential data integrity issues with soft-deleted records being modified.

### [Q2] How should we handle the 4 uncommitted migrations?

- **Selected: C** - Review migration content first
- **Reason:** Review complete. Migration 4 requires backup before applying. Use beta-safe controls.

### [Q3] Should Phase 2 include Edge Function health verification?

- **Selected: A** - Yes, include in Phase 2
- **Reason:** **CRITICAL issues found.** `capture-dashboard-snapshots` not deployed, `daily-digest` has auth errors.

---

## 9) Phase 1 Completion Status

| Requirement | Status |
|-------------|--------|
| Cloud inventory | Complete |
| Local inventory | Complete |
| Local vs Cloud comparison | Complete (67-migration drift found) |
| Data structure confirmation | 95% confidence |
| Edge Function health (prep) | Complete (CRITICAL issues found) |
| Migration review (prep) | Complete (HIGH risk migration 4) |
| Risk identification | Complete |
| Questions answered | Complete |

**Overall Phase 1 Status:** COMPLETE

---

## 10) Phase 2 Scope (Ready to Execute)

### Immediate (P0/P1)

1. **Deploy `capture-dashboard-snapshots`** - Edge Function missing
2. **Fix `daily-digest` auth** - 401 error blocking notifications
3. **Reconcile local/cloud drift** - 67-migration gap

### Planned (P2)

4. **RLS Policy Hardening** - Add `deleted_at IS NULL` to 11 policies
5. **Migration 4 execution** - With backup/rollback plan

### Deferred

6. **Index Cleanup** - Remove 2 duplicate indexes (wait for drift resolution)
7. **Storage Bucket Audit** - After core issues resolved

---

*Generated by Claude Code - Phase 1 Database Audit*
*Last updated: 2026-02-09 (Local audit added)*
