# Phase 3 Report: Decisions & Cleanup Plan

**Date:** 2026-02-09
**Auditor:** Claude Code (Opus 4.6, Docker local + Supabase MCP cloud)
**Mode:** PLAN MODE (Read-Only - no migrations applied, no data modified)
**Lens:** supabase-postgres-best-practices
**Status:** COMPLETE
**Overall Confidence:** [Confidence: 89%]

---

## 1) Phase 2 Assertion Verification

| Assertion | Status | Notes |
|-----------|--------|-------|
| Drift classifications still accurate | **CONFIRMED** | Cloud: 52 triggers, 110 functions, 27 views. Local: 85 triggers. All counts match Phase 2. [100%] |
| Dependency graphs complete | **CONFIRMED** | No new objects created. Digest path, snapshot path, timeline chain unchanged. [95%] |
| Operational failures still present | **CONFIRMED** | Edge Function logs: `capture-dashboard-snapshots` -> 404, `daily-digest` -> 401. Both failures persist. [100%] |
| No new migrations since Phase 2 | **CONFIRMED** | Latest migration: `add_missing_cols_principal_pipeline_summary` (applied during Phase 2 session). Total: 355 in both environments. [100%] |
| Risk register items current | **CONFIRMED** | All 8 items (P1-1 through P2-6) still active. P2-2 remains RESOLVED. [95%] |
| Data reconciliation baselines | **N/A** | No legacy-to-canonical data migration pending. STI migration (tasks -> activities) completed in migration 20260121000002. Zero rows remain in legacy format. [100%] |

### Resolved Unknowns from Phase 2

| # | Unknown | Resolution | Impact on Phase 3 |
|---|---------|------------|-------------------|
| 4 | Is `cleanup_old_notifications` trigger too aggressive? | **RESOLVED.** Trigger soft-deletes (`UPDATE deleted_at = NOW()`) notifications older than 30 days. Does NOT hard-delete. Does NOT delete recent notifications. Behavior is correct. | No action needed. KEEP trigger. |

### Still Unknown

| # | Unknown | Blocking? |
|---|---------|-----------|
| 1 | Why does `daily-digest` v6 reject the service_role_key? | Yes (Tier B deployment). Mitigation: redeploy with current codebase. |
| 2 | Is `CRON_SECRET` set as an Edge Function env var? | Yes (Tier B). Mitigation: check via dashboard before deployment. |
| 3 | Why do `contact_duplicates`/`duplicate_stats` exist cloud-only? | No. Low priority. |

---

## 2) Legacy Object Decision Table

### Views

| Object | Type | Decision | Reasoning | Business Impact if Wrong | Tech Risk | Data Preservation Risk | Rollback | Confidence | Blockers |
|--------|------|----------|-----------|--------------------------|-----------|----------------------|----------|------------|----------|
| `tasks_v` | VIEW | **DEPRECATE** | Backward-compat view over `activities WHERE activity_type='task'`. Not referenced in app code (`src/`). Only in auto-generated types. Still referenced by `tasks_summary` view. | If removed prematurely: `tasks_summary` breaks. | Low — view is read-only, no data at risk. | None — view holds no data. | Trivial: `CREATE VIEW tasks_v AS ...` | [90%] | Must deprecate `tasks_summary` first OR update `tasks_summary` to query `activities` directly. |
| `tasks_summary` | VIEW | **DEPRECATE** | Backward-compat aggregation view. Not referenced in app code. Only in auto-generated types. Depends on `tasks_v`. | None for current app — no code references it. | Low — read-only view. | None. | Trivial: recreate view. | [90%] | None after confirming zero app references. |
| `contactNotes` | VIEW | **KEEP** | CamelCase alias for `contact_notes`. Actively used by app: query keys, handlers, resource mapping in `notesHandler.ts`, `resources.ts`. | Removing would break entire notes feature. | N/A — must keep. | N/A. | N/A. | [100%] | None. |
| `opportunityNotes` | VIEW | **KEEP** | CamelCase alias for `opportunity_notes`. Actively used by app. | Removing would break opportunity notes. | N/A. | N/A. | N/A. | [100%] | None. |
| `organizationNotes` | VIEW | **KEEP** | CamelCase alias for `organization_notes`. Actively used by app. | Removing would break organization notes. | N/A. | N/A. | N/A. | [100%] | None. |
| `contact_duplicates` | VIEW | **KEEP** | Cloud-only view for duplicate detection. Not in app code yet but serves operational/admin use. | Dropping loses duplicate detection capability. | Low. | None — view holds no data. | Trivial: recreate. | [75%] To Increase: verify if any admin workflow uses it. |
| `duplicate_stats` | VIEW | **KEEP** | Cloud-only aggregation of duplicate data. Companion to `contact_duplicates`. | Same as above. | Low. | None. | Trivial. | [75%] |
| `opportunity_stage_changes` | VIEW | **FIX** | Local-only view for stage change history. Useful for reporting but not deployed to cloud. | No cloud reporting on stage transitions. | Low — additive deployment. | None. | Trivial: drop view. | [85%] | Deploy to cloud via Tier B action. |

### Tables

| Object | Type | Decision | Reasoning | Business Impact if Wrong | Tech Risk | Data Preservation Risk | Rollback | Confidence | Blockers |
|--------|------|----------|-----------|--------------------------|-----------|----------------------|----------|------------|----------|
| `migration_history` | TABLE | **DEPRECATE** | 0 rows in both environments. Not referenced in app code. Appears to be an abandoned app-level migration tracking feature (distinct from Supabase's `schema_migrations`). | None — table is empty and unused. | Low. | None — 0 rows. | Trivial: `CREATE TABLE migration_history (...)`. | [85%] | Verify no background process writes to it. |
| `tutorial_progress` | TABLE | **DEPRECATE** | 0 rows in both environments. Not referenced in app code. FK to `created_task_id` already removed (migration 000004). Tutorial feature not adopted. | None — feature unused. | Low. | None — 0 rows. | Moderate: recreate table + RLS + indexes. | [80%] To Increase: confirm no planned feature work references it. |
| `dashboard_snapshots` | TABLE | **FIX** | 0 rows because Edge Function not deployed (404). Table is actively referenced by `useMyPerformance.ts` for week-over-week trend comparisons. Must deploy Edge Function to populate. | Removing would break dashboard trends feature. | N/A — must keep and fix. | N/A. | N/A. | [95%] | Deploy `capture-dashboard-snapshots` Edge Function (Tier B). |

### Functions

| Object | Type | Decision | Reasoning | Business Impact if Wrong | Tech Risk | Data Preservation Risk | Rollback | Confidence | Blockers |
|--------|------|----------|-----------|--------------------------|-----------|----------------------|----------|------------|----------|
| `exec_sql` | FUNCTION | **KEEP** | Not used in app code but used by 7 admin/import scripts. Properly hardened (SECURITY DEFINER, service_role only, COALESCE null-bypass protection, SET search_path). | Removing breaks import and seeding workflows. | Medium — it's an arbitrary SQL execution surface. | None. | Trivial: recreate function. | [90%] | None. |
| 34 missing cloud triggers | TRIGGERS | **FIX** | Critical data-integrity gap (P1-1). Cloud lacks `updated_at` auto-management, audit field protection, soft-delete cascades, and timeline event logging. | Without fix: `updated_at` stale, audit fields overwritable, deleted parents leave visible child notes. | Medium-High — 34 triggers across 5 batches. | None — additive triggers. | Moderate: `DROP TRIGGER ... ON table;` for each trigger. | [85%] | Deploy in 5 batches per Phase 2 plan. |
| `daily-digest` Edge Function | EDGE FN | **FIX** | Deployed v6 returns 401. Stale since 2025-12-08. No daily digest notifications reaching users. | Users miss overdue task notifications and daily summaries. | Low — redeployment is standard. | None. | Revert to v6 (keep current deployment as rollback). | [80%] | Verify env vars before deployment. |
| `capture-dashboard-snapshots` Edge Function | EDGE FN | **FIX** | Not deployed to cloud. Source code exists locally (339 lines). `dashboard_snapshots` table has 0 rows for 60+ days. | Dashboard trends feature non-functional. | Low — new deployment. | None. | Remove deployed function. | [95%] | None — source is ready. |
| `cleanup_old_notifications` | TRIGGER | **KEEP** | Soft-deletes notifications older than 30 days. Behavior is correct and appropriate. AFTER INSERT trigger on `notifications`. | N/A. | N/A. | N/A. | N/A. | [100%] | None. |

### RLS Policies

| Object | Type | Decision | Reasoning | Business Impact if Wrong | Tech Risk | Data Preservation Risk | Rollback | Confidence | Blockers |
|--------|------|----------|-----------|--------------------------|-----------|----------------------|----------|------------|----------|
| Duplicate DELETE policies (notes tables) | POLICY | **FIX** | Multiple permissive DELETE policies OR'd together on `contact_notes`, `opportunity_notes`, `organization_notes`. Most permissive policy wins, potentially widening delete access. | Unintended delete access for non-privileged users. | Low — policy drop is clean. | None. | `CREATE POLICY ... ON table FOR DELETE ...` | [80%] | Audit exact policy overlap before removing. |
| 4 SELECT policies missing soft-delete (P2-5) | POLICY | **FIX** | `audit_trail`, `dashboard_snapshots`, `migration_history`, `tutorial_progress` SELECT policies don't filter `deleted_at IS NULL`. | Deleted records visible via API queries. | Low — additive filter. | None. | Drop and recreate without filter. | [85%] | None. |

### Indexes

| Object | Type | Decision | Reasoning | Business Impact if Wrong | Tech Risk | Data Preservation Risk | Rollback | Confidence | Blockers |
|--------|------|----------|-----------|--------------------------|-----------|----------------------|----------|------------|----------|
| `idx_opportunities_customer_org` | INDEX | **REMOVE** | Potentially duplicates `idx_opportunities_customer_organization_id`. Both index `customer_organization_id`. | If not a true duplicate, removing could slow one query path. | Low — `CREATE INDEX CONCURRENTLY` restores it. | None. | `CREATE INDEX CONCURRENTLY ...` | [70%] To Increase: compare exact index definitions (columns, WHERE clause, method). |
| Duplicate `deleted_at` indexes on `product_distributor_authorizations` | INDEX | **REMOVE** | Two indexes on same column: `idx_product_distributor_auth_deleted_at` and `idx_product_distributor_authorizations_deleted_at`. | None — redundant index. | Low. | None. | `CREATE INDEX CONCURRENTLY ...` | [85%] | Verify definitions are truly identical. |

---

## 3) Canonical Structure Declaration

### Task Model (Canonical)

**Canonical storage:** `activities` table with `activity_type = 'task'` discriminator (Single Table Inheritance).

| Aspect | Detail |
|--------|--------|
| **Table** | `activities` |
| **Filter** | `WHERE activity_type = 'task'` |
| **Key columns** | `subject` (title), `due_date`, `reminder_date`, `completed`, `completed_at`, `priority`, `snooze_until`, `overdue_notified_at` |
| **Shared columns** | `contact_id`, `organization_id`, `opportunity_id`, `sales_id`, `created_by`, `description` |
| **RLS** | Standard activities RLS applies to tasks |
| **Soft delete** | `deleted_at IS NULL` filter in views and RLS |

**Compatibility layer (DEPRECATE):**
- `tasks_v` view: `SELECT ... FROM activities WHERE activity_type = 'task'` — NOT used by app code
- `tasks_summary` view: aggregation over `tasks_v` — NOT used by app code
- `priority_tasks` view: filtered priority ordering — KEEP (used for task prioritization)

### Timeline Model (Canonical)

**Canonical view:** `entity_timeline`

```
activities table (STI: tasks + activities)
  |
  v
entity_timeline VIEW (security_invoker=true)
  - Filters: deleted_at IS NULL, snoozed tasks hidden
  - Normalizes: tasks use due_date, activities use activity_date
  - Maps: subject -> title, activity_type -> entry_type
  |
  v
Frontend: EntityTimeline component reads from entity_timeline
```

**Single source:** Only the `activities` table feeds the timeline. No secondary sources.

### Digest Path (Canonical — Target State)

```
pg_cron (0 7 * * * UTC)
  -> SELECT invoke_daily_digest_function()
    -> Vault: project_url + service_role_key
    -> pg_net.http_post('{url}/functions/v1/daily-digest', Bearer {service_role_key})
      -> Edge Runtime: verify_jwt=true [accepts service_role JWT]
        -> daily-digest Edge Function (CURRENT CODEBASE, not stale v6):
          1. Authenticate via service_role_key comparison
          2. For each active sales user with digest_opt_in=true:
             a. get_user_digest_summary(sales_id) [queries activities WHERE activity_type='task']
             b. If actionable items (tasks due, overdue, stale deals):
                -> INSERT INTO notifications
          3. Return summary JSON

Supporting functions (all STI-correct):
  - check_overdue_tasks(sales_id)
  - get_overdue_tasks_for_user(sales_id)
  - get_tasks_due_today_for_user(sales_id)
  - get_user_digest_summary(sales_id)
  - generate_daily_digest() / generate_daily_digest_v2()

Cleanup: cleanup_old_notifications trigger soft-deletes notifications > 30 days old
```

### Dashboard Snapshot Path (Canonical — Target State)

```
pg_cron (0 23 * * * UTC)
  -> SELECT invoke_snapshot_capture_function()
    -> Vault: project_url + service_role_key
    -> pg_net.http_post('{url}/functions/v1/capture-dashboard-snapshots', Bearer {key})
      -> Edge Runtime: verify_jwt (TBD — source uses internal auth)
        -> capture-dashboard-snapshots Edge Function:
          1. Authenticate via SERVICE_ROLE_KEY comparison
          2. For each active sales user (Promise.allSettled):
             a. Calculate 8 metrics (activities, tasks, deals, stale deals)
             b. UPSERT INTO dashboard_snapshots (sales_id, snapshot_date)
          3. Return summary { total_users, successful, failed }

Consumer: useMyPerformance.ts reads dashboard_snapshots for week-over-week trends
```

### Compatibility-Only Objects

| Object | Type | Purpose | Used by App? | Removal Timeline | Removal Blockers |
|--------|------|---------|-------------|------------------|------------------|
| `tasks_v` | VIEW | Backward-compat task-only view over activities | NO | After `tasks_summary` is deprecated or updated | `tasks_summary` depends on it |
| `tasks_summary` | VIEW | Backward-compat task aggregation view | NO | Safe to deprecate now | None — no app references |
| `contactNotes` | VIEW | CamelCase alias for `contact_notes` | **YES** | **NOT removable** — actively used by handlers/resources | App code uses camelCase names |
| `opportunityNotes` | VIEW | CamelCase alias for `opportunity_notes` | **YES** | **NOT removable** | Same as above |
| `organizationNotes` | VIEW | CamelCase alias for `organization_notes` | **YES** | **NOT removable** | Same as above |
| `migration_history` | TABLE | Abandoned app-level migration tracking | NO | After confirming no background process writes to it | 0 rows, low risk |
| `tutorial_progress` | TABLE | Unused tutorial tracking feature | NO | After confirming no planned feature work | 0 rows, FK already cleaned |

---

## 4) Phased Cleanup Plan

### Tier A: Safety & Observability (Zero Risk)

| # | Action | Description | Environment | Validation Check | Depends On |
|---|--------|-------------|-------------|------------------|------------|
| A1 | Capture trigger inventory baseline | `SELECT tgname, tgrelid::regclass, tgfoid::regproc FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace='public'::regnamespace) ORDER BY tgrelid::regclass, tgname;` — save output as baseline for rollback verification | Cloud | Output saved to audit doc | None |
| A2 | Capture RLS policy baseline | `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;` — save output | Cloud | Output saved | None |
| A3 | Capture index baseline | `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname;` — save output | Cloud | Output saved | None |
| A4 | Verify Edge Function env vars | Check Supabase dashboard: Edge Functions -> Settings -> Env vars. Record which secrets are configured (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`). | Cloud (Dashboard) | Env vars documented | None |
| A5 | Verify Vault secrets | `SELECT name FROM vault.secrets WHERE name IN ('project_url', 'service_role_key');` — confirm both exist | Cloud | Both secrets present | None |
| A6 | Capture function list baseline | `SELECT proname, prosrc IS NOT NULL as has_body FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' ORDER BY proname;` — save output | Cloud | Output saved | None |
| A7 | Add deprecation comments to compat views | `COMMENT ON VIEW tasks_v IS 'DEPRECATED: Compatibility view. Not used by app code. Target removal after tasks_summary updated.';` Same for `tasks_summary`. | Both | `SELECT obj_description(...)` returns deprecation comment | None |
| A8 | Verify PITR availability | Confirm Supabase project has Point-In-Time Recovery enabled (Pro plan feature). Document latest restore point. | Cloud (Dashboard) | PITR status documented | None |

### Tier B: Low-Risk Fixes (Easily Reversible)

| # | Action | Description | Environment | Rollback | Validation Check | Risk | Depends On |
|---|--------|-------------|-------------|----------|------------------|------|------------|
| B1 | Deploy `capture-dashboard-snapshots` Edge Function | Deploy from `supabase/functions/capture-dashboard-snapshots/index.ts` using Supabase MCP `deploy_edge_function`. Set `verify_jwt: false` (function implements internal auth). | Cloud | `supabase functions delete capture-dashboard-snapshots` | Call function via curl with service_role_key Bearer token; verify 200 response and row in `dashboard_snapshots` | LOW | A4, A5 |
| B2 | Redeploy `daily-digest` Edge Function | Redeploy from current codebase (`supabase/functions/daily-digest/`). Ensure `_shared/supabaseAdmin.ts` is included (lazy initialization pattern). | Cloud | Previous v6 is lost; if new version fails, pause cron until fixed | Call function via curl; verify 200 (or expected auth behavior); check for notification row | LOW-MEDIUM | A4, B1 (deploy snapshots first as lower-risk test) |
| B3 | Add soft-delete filter to `audit_trail` SELECT policy | Update SELECT policy: add `AND deleted_at IS NULL` to USING clause. | Cloud then Local | Drop and recreate policy without filter | `SELECT * FROM audit_trail WHERE deleted_at IS NOT NULL;` returns 0 rows via API | LOW | A2 |
| B4 | Add soft-delete filter to `dashboard_snapshots` SELECT policy | Same pattern as B3. | Cloud then Local | Same pattern | Same pattern | LOW | A2 |
| B5 | Add soft-delete filter to `migration_history` SELECT policy | Same pattern as B3. | Cloud then Local | Same pattern | Same pattern | LOW | A2 |
| B6 | Add soft-delete filter to `tutorial_progress` SELECT policy | Same pattern as B3. | Cloud then Local | Same pattern | Same pattern | LOW | A2 |
| B7 | Deploy `opportunity_stage_changes` view to cloud | Create view on cloud matching local definition. | Cloud | `DROP VIEW opportunity_stage_changes;` | `SELECT count(*) FROM opportunity_stage_changes;` returns result | LOW | None |
| B8 | Deploy triggers — Batch 1: Core Timestamps (11 triggers) | Create `update_updated_at_column()` function + 11 `update_*_updated_at` triggers on: activities, contacts, contact_notes, dashboard_snapshots, distributor_principal_authorizations, migration_history, notifications, opportunities, opportunity_contacts, opportunity_notes, organizations | Cloud | `DROP TRIGGER update_*_updated_at ON *; DROP FUNCTION update_updated_at_column;` | For each table: `UPDATE table SET id=id WHERE id=(SELECT id FROM table LIMIT 1); SELECT updated_at FROM table WHERE id=...;` — verify `updated_at` changed | LOW | A1 |
| B9 | Deploy triggers — Batch 2: Extended Timestamps (5 triggers) | 5 more `update_*_updated_at` triggers on: opportunity_participants, opportunity_products, organization_distributors, product_distributor_authorizations, product_distributors | Cloud | Drop 5 triggers | Same verification pattern | LOW | B8 |

### Tier C: Medium-Risk Deprecations (Reversible with Effort)

| # | Action | Description | Environment | Rollback | Validation Check | Risk | Depends On |
|---|--------|-------------|-------------|----------|------------------|------|------------|
| C1 | Deploy triggers — Batch 3A: Audit Field Immutability (5 triggers) | Create `protect_audit_fields()` function + 5 `protect_*_audit` triggers on: activities, contacts, opportunities, organizations, products. Requires `current_sales_id()` function (exists on cloud). | Cloud | Drop 5 triggers + function | Attempt `UPDATE contacts SET created_at = NOW() WHERE id=(SELECT id FROM contacts LIMIT 1);` — should be rejected | MEDIUM | B8, B9 |
| C2 | Deploy triggers — Batch 3B: Cascade Soft-Delete + Block (4 triggers) | Create `cascade_soft_delete_to_notes()` + `check_organization_delete_allowed()` functions. Create 3 cascade triggers + 1 block trigger. | Cloud | Drop 4 triggers + 2 functions | Soft-delete a test contact; verify `contact_notes` for that contact are also soft-deleted. Attempt soft-delete of org with active opportunities; verify rejection. | MEDIUM | B8 |
| C3 | Deploy triggers — Batch 3C: Notes Timestamps (6 triggers) | Notes-specific `updated_at` and audit triggers for `organization_notes`, `contact_notes`, `opportunity_notes`. | Cloud | Drop 6 triggers | Update a note; verify `updated_at` changed | LOW-MEDIUM | B8, B9 |
| C4 | Fix duplicate DELETE policies on notes tables | Identify the most permissive DELETE policy on each notes table. Drop extras that widen access. Keep the correctly scoped one. | Cloud then Local | Recreate dropped policies (saved in A2 baseline) | For each notes table: verify DELETE still works for authorized users; verify DELETE fails for unauthorized users | MEDIUM | A2 |
| C5 | Deploy triggers — Batch 4: Critical Field Audit Logging (4 triggers) | Create `audit_critical_field_changes()` SECURITY DEFINER function + 4 triggers on: contacts, opportunities, organizations, sales. Logs to `audit_trail`. | Cloud | Drop 4 triggers + function | Update a contact's `sales_id`; verify new row in `audit_trail` with old/new values | MEDIUM-HIGH | B8, C1, A1 |
| C6 | Deploy triggers — Batch 5: Timeline Event Logging (7 triggers) | Create 4 SECURITY DEFINER functions for timeline event logging + 7 triggers across activities, contacts, opportunities, organizations. Auto-creates activity records for entity changes. | Cloud | Drop 7 triggers + 4 functions | Create a new contact; verify an activity record is auto-created in `activities` | MEDIUM | B8, C5 |

### Tier D: High-Risk Removals (Require Backup)

| # | Action | Description | Environment | Rollback | Validation Check | Risk | Depends On | Backup Step |
|---|--------|-------------|-------------|----------|------------------|------|------------|-------------|
| D1 | Remove duplicate `deleted_at` index on `product_distributor_authorizations` | `DROP INDEX idx_product_distributor_auth_deleted_at;` (keep the longer-named one) | Cloud then Local | `CREATE INDEX CONCURRENTLY ...` (definition from A3 baseline) | `SELECT indexname FROM pg_indexes WHERE tablename='product_distributor_authorizations';` — verify only one `deleted_at` index | LOW | A3 |
| D2 | Remove duplicate `customer_org` index on `opportunities` | Verify both definitions are identical first. If so: `DROP INDEX idx_opportunities_customer_org;` | Cloud then Local | `CREATE INDEX CONCURRENTLY ...` (from A3) | Verify `idx_opportunities_customer_organization_id` still exists; run `EXPLAIN` on a query using `customer_organization_id` filter | LOW-MEDIUM | A3 |
| D3 | Drop `migration_history` table | After 30+ day observation period with no writes: `DROP TABLE migration_history CASCADE;` | Cloud then Local | Recreate table from migration definition + RLS policies + indexes | `SELECT count(*) FROM migration_history;` should error (table gone) | LOW | A2, verify 0 writes over observation period |
| D4 | Drop `tasks_summary` view | `DROP VIEW tasks_summary;` | Both | `CREATE VIEW tasks_summary AS ...` (definition from baseline) | No app errors; TypeScript build passes | LOW | Verify zero app code references (confirmed in Phase 3 research) |
| D5 | Drop `tasks_v` view | `DROP VIEW tasks_v;` — only after D4 (tasks_summary depends on it) | Both | `CREATE VIEW tasks_v AS ...` | No app errors; TypeScript build passes | LOW | D4 |
| D6 | Drop `tutorial_progress` table | After confirming no planned feature work: `DROP TABLE tutorial_progress CASCADE;` Remove associated RLS policies, indexes. | Cloud then Local | Recreate from migration definition | `SELECT count(*) FROM tutorial_progress;` should error | LOW-MEDIUM | Verify no feature plans reference it |

### Stop/Go Gates

| Gate | Between | Go Condition | No-Go Action |
|------|---------|--------------|--------------|
| Gate 1 | Tier A -> B | All baselines captured (A1-A6), PITR confirmed (A8), env vars documented (A4) | Complete missing baseline captures |
| Gate 2 | Tier B -> C | All Tier B actions validated: Edge Functions responding (B1-B2), RLS policies updated (B3-B6), Batch 1-2 triggers verified (B8-B9) | Fix failing deployments; roll back if needed |
| Gate 3 | Tier C -> D | All Tier C triggers verified: audit protection working (C1), cascade soft-delete working (C2), audit logging working (C5-C6), duplicate policies resolved (C4) | Fix trigger issues; assess if MEDIUM-HIGH risk items need rewrite |
| Gate 4 | D3-D6 require | 30-day observation period for `migration_history` and `tutorial_progress` — zero writes | Extend observation; investigate unexpected writes |

---

## 5) Rollback Procedures

### Tier A Rollback

Tier A actions are non-destructive (baseline captures + deprecation comments). No rollback needed. To remove deprecation comments: `COMMENT ON VIEW tasks_v IS NULL;`

### Tier B Rollback

**B1 (Snapshot Edge Function):**
```
supabase functions delete capture-dashboard-snapshots
-- Cron will resume returning 404 (same as before)
-- dashboard_snapshots table retains any rows captured during deployment
```

**B2 (Daily Digest Edge Function):**
```
-- Cannot revert to exact v6 binary. If new version fails:
-- Option 1: Fix and redeploy
-- Option 2: Pause cron: SELECT cron.unschedule('invoke_daily_digest_function');
-- State during rollback: No digest notifications (same as current broken state)
```

**B3-B6 (RLS soft-delete filters):**
```
-- For each policy, remove the added AND clause:
-- Save current policy definition BEFORE modifying
-- DROP POLICY "policy_name" ON table_name;
-- CREATE POLICY "policy_name" ON table_name FOR SELECT USING (original_clause);
-- Use A2 baseline for exact original definitions
```

**B7 (opportunity_stage_changes view):**
```
DROP VIEW IF EXISTS opportunity_stage_changes;
-- Cloud returns to previous state (view didn't exist)
```

**B8-B9 (Timestamp triggers):**
```
-- Drop all triggers in reverse order:
DROP TRIGGER IF EXISTS update_*_updated_at ON table_name;
-- After all triggers removed:
DROP FUNCTION IF EXISTS update_updated_at_column();
-- State: updated_at not auto-managed (same as current cloud state)
```

### Tier C Rollback

**C1 (Audit Immutability):**
```
DROP TRIGGER IF EXISTS protect_activities_audit ON activities;
DROP TRIGGER IF EXISTS protect_contacts_audit ON contacts;
DROP TRIGGER IF EXISTS protect_opportunities_audit ON opportunities;
DROP TRIGGER IF EXISTS protect_organizations_audit ON organizations;
DROP TRIGGER IF EXISTS protect_products_audit ON products;
DROP FUNCTION IF EXISTS protect_audit_fields();
-- State: audit fields (created_at, updated_at) can be manually overwritten
```

**C2 (Cascade Soft-Delete):**
```
DROP TRIGGER IF EXISTS cascade_notes_on_contact_delete ON contacts;
DROP TRIGGER IF EXISTS cascade_notes_on_opportunity_delete ON opportunities;
DROP TRIGGER IF EXISTS cascade_notes_on_organization_delete ON organizations;
DROP TRIGGER IF EXISTS prevent_org_delete_with_active_opps ON organizations;
DROP FUNCTION IF EXISTS cascade_soft_delete_to_notes();
DROP FUNCTION IF EXISTS check_organization_delete_allowed();
-- State: soft-deleting parent doesn't cascade to notes (same as current cloud)
-- CAUTION: Any notes already cascade-deleted during Tier C won't be un-deleted
```

**C4 (Duplicate DELETE policies):**
```
-- Recreate dropped policies from A2 baseline:
-- CREATE POLICY "policy_name" ON table FOR DELETE USING (original_clause);
```

**C5-C6 (Audit Logging + Timeline):**
```
-- Drop triggers and functions in reverse dependency order:
-- Batch 5 (timeline) first, then Batch 4 (audit logging)
-- State: no automatic audit trail entries or timeline events
-- CAUTION: Audit entries created during Tier C remain in audit_trail
```

### Tier D Rollback

**D1-D2 (Index removal):**
```
-- Recreate from A3 baseline using CONCURRENTLY:
CREATE INDEX CONCURRENTLY idx_name ON table (columns) WHERE condition;
-- Minimal impact — queries may be slightly slower until index rebuilt
```

**D3 (migration_history table):**
```
-- Full recreation required from original migration definition
-- Must recreate: table structure, RLS policies, indexes, GRANTs
-- Data loss: None (table had 0 rows)
-- Use PITR if needed (A8 verified)
```

**D4-D5 (tasks_v/tasks_summary views):**
```
-- Recreate views from baseline definitions
-- Order: tasks_v first (dependency), then tasks_summary
-- No data loss — views are virtual
```

**D6 (tutorial_progress table):**
```
-- Full recreation required
-- Must recreate: table, RLS, indexes, GRANTs
-- Data loss: None (0 rows)
-- Use PITR if needed
```

---

## 6) Validation Checklists

### Tier A Validation

- [ ] A1: Trigger baseline saved (file/doc with 52 trigger definitions)
- [ ] A2: RLS policy baseline saved (file/doc with 91 policy definitions)
- [ ] A3: Index baseline saved (file/doc with ~160 index definitions)
- [ ] A4: Edge Function env vars documented (CRON_SECRET present/absent, SERVICE_ROLE_KEY present/absent)
- [ ] A5: Vault secrets `project_url` and `service_role_key` confirmed present
- [ ] A6: Function list baseline saved (110 function names)
- [ ] A7: `tasks_v` and `tasks_summary` have DEPRECATED comments
- [ ] A8: PITR status confirmed and documented

### Tier B Validation

- [ ] B1: `capture-dashboard-snapshots` responds 200 with valid service_role Bearer token
- [ ] B1: At least 1 row exists in `dashboard_snapshots` after manual trigger or cron run
- [ ] B2: `daily-digest` responds 200 (or expected auth success) with service_role Bearer token
- [ ] B2: Notification row created (or function logs show "no actionable items" — both are success states)
- [ ] B3-B6: `SELECT * FROM [table] WHERE deleted_at IS NOT NULL;` via API returns 0 rows for all 4 tables
- [ ] B7: `SELECT count(*) FROM opportunity_stage_changes;` succeeds on cloud
- [ ] B8: All 11 Batch 1 triggers verified — `updated_at` auto-updates on row modification
- [ ] B9: All 5 Batch 2 triggers verified — same pattern
- [ ] Cloud trigger count: 52 + 16 = 68 distinct triggers

### Tier C Validation

- [ ] C1: `UPDATE contacts SET created_at = '2020-01-01' WHERE id=...;` is rejected (immutability protection)
- [ ] C2: Soft-deleting a contact cascades `deleted_at` to its `contact_notes`
- [ ] C2: Attempting soft-delete of organization with active opportunities is rejected
- [ ] C3: Updating a note auto-sets `updated_at`
- [ ] C4: Only 1 DELETE policy per notes table (no duplicates). Authorized users can delete. Unauthorized users cannot.
- [ ] C5: Changing `contacts.sales_id` creates a row in `audit_trail` with old/new values
- [ ] C6: Creating a new entity auto-creates a timeline activity record
- [ ] Cloud trigger count: 68 + 22 = ~85 triggers (matching local — adjusted for trigger aliases)

### Tier D Validation

- [ ] D1: Only 1 `deleted_at` index on `product_distributor_authorizations`
- [ ] D2: Only 1 `customer_organization_id` index on `opportunities` (if confirmed duplicate)
- [ ] D3: `SELECT * FROM migration_history;` returns ERROR (table gone)
- [ ] D4: `SELECT * FROM tasks_summary;` returns ERROR
- [ ] D5: `SELECT * FROM tasks_v;` returns ERROR
- [ ] D6: `SELECT * FROM tutorial_progress;` returns ERROR
- [ ] TypeScript build passes: `npx tsc --noEmit` (types may need regeneration)
- [ ] App functional test: login, navigate contacts, opportunities, dashboard — no errors

---

## 7) Sequencing Diagram

```
TIER A (all parallel, no dependencies):
  A1 ─┐
  A2 ─┤
  A3 ─┤─── All complete ──> GATE 1
  A4 ─┤
  A5 ─┤
  A6 ─┤
  A7 ─┤
  A8 ─┘

TIER B:
  B1 (deploy snapshots EF) ──────┐
       |                          |
  B2 (redeploy digest EF) ───────┤
                                  |
  B3 ─┐                          |
  B4 ─┤─ (RLS fixes, parallel)───┤─── All complete ──> GATE 2
  B5 ─┤                          |
  B6 ─┘                          |
                                  |
  B7 (stage_changes view) ───────┤
                                  |
  B8 (Batch 1: 11 triggers) ─────┤
       |                          |
  B9 (Batch 2: 5 triggers) ──────┘
       (depends on B8)

TIER C:
  C1 (Batch 3A: audit immutability) ──┐
       (depends on B8-B9)              |
                                       |
  C2 (Batch 3B: cascade + block) ─────┤
       (depends on B8)                 |
                                       |
  C3 (Batch 3C: notes timestamps) ────┤─── All complete ──> GATE 3
       (depends on B8-B9)             |
                                       |
  C4 (fix duplicate DELETEs) ─────────┤
       (independent)                   |
                                       |
  C5 (Batch 4: audit logging) ────────┤
       (depends on C1)                 |
                                       |
  C6 (Batch 5: timeline events) ──────┘
       (depends on C5)

TIER D:
  D1 (drop dup index: pda) ──┐
  D2 (drop dup index: opps) ─┤── (parallel, independent)
                              |
  D4 (drop tasks_summary) ───┤
       |                      |
  D5 (drop tasks_v) ─────────┤── (D5 depends on D4)
                              |
  D3 (drop migration_history)┤── (after 30-day observation)
  D6 (drop tutorial_progress)┘── (after confirming no feature plans)
```

**Parallelism notes:**
- All Tier A actions can run in parallel
- B1, B3-B6, B7 can run in parallel
- B2 should follow B1 (snapshots is lower-risk test)
- B9 depends on B8 (reuses same function)
- C1, C2, C3 can run in parallel after B8-B9
- C4 is independent of trigger work
- C5 depends on C1 (same audit infrastructure)
- C6 depends on C5 (builds on audit foundation)
- D1, D2 are independent and can run in parallel
- D4 must precede D5 (dependency)
- D3, D6 require separate 30-day observation gates

---

## 8) Updated Risk Register

| ID | Severity | Finding | Source | Status | Mitigation (this plan) |
|----|----------|---------|--------|--------|----------------------|
| **P1-1** | HIGH | Cloud missing 34 data-integrity triggers | Phase 1 | OPEN -> **PLAN: Tiers B-C** | 5-batch incremental deployment (B8-B9, C1-C3, C5-C6) |
| **P1-2** | HIGH | Phantom snapshot cron (404) | Phase 1 | OPEN -> **PLAN: Tier B** | Deploy Edge Function (B1) |
| **P1-3** | MEDIUM | Duplicate RLS DELETE policies on notes | Phase 1 | OPEN -> **PLAN: Tier C** | Audit and remove duplicates (C4) |
| **P2-1** | HIGH | daily-digest returns 401 | Phase 2 | OPEN -> **PLAN: Tier B** | Redeploy with current codebase (B2) |
| **P2-2** | MEDIUM | `users` EF without JWT | Phase 1 | **RESOLVED** | Internal auth compensates [100%] |
| **P2-3** | LOW | Possibly duplicate indexes | Phase 1 | OPEN -> **PLAN: Tier D** | Remove after verification (D1-D2) |
| **P2-4** | LOW | 3 views with no cross-env equivalent | Phase 1 | OPEN -> **PLAN: Tier B** | Deploy `opportunity_stage_changes` to cloud (B7). Keep `contact_duplicates`/`duplicate_stats` cloud-only. |
| **P2-5** | LOW | 4 SELECT policies missing soft-delete | Phase 2 | OPEN -> **PLAN: Tier B** | Add `deleted_at IS NULL` filter (B3-B6) |
| **P2-6** | INFO | `notifications` table always 0 rows | Phase 2 | **RESOLVED** | Will populate once daily-digest fixed (B2). `cleanup_old_notifications` is correct (only soft-deletes >30 day old). |

**Risk Reduction Summary:**
- After Tier A: 0 risks mitigated (baselines only)
- After Tier B: 4 risks mitigated (P1-2, P2-1, P2-4, P2-5) + partial P1-1 (Batch 1-2 triggers)
- After Tier C: 2 more mitigated (P1-1 complete, P1-3)
- After Tier D: 1 more mitigated (P2-3)
- Total: 7 of 8 open risks addressed. P2-2 already resolved. P2-6 resolved by analysis.

---

## 9) Multiple-Choice Questions

### [Q1] Edge Function deployment strategy for `daily-digest`

The `daily-digest` Edge Function returns 401 (Phase 2 P2-1). The fix requires redeployment. However, we haven't verified whether `CRON_SECRET` is configured as an env var. How should we approach this?

A) Redeploy with current codebase as-is (Recommended) - The current codebase checks `CRON_SECRET || SERVICE_ROLE_KEY`; the Vault sends `service_role_key` as Bearer token; if `SUPABASE_SERVICE_ROLE_KEY` env var is set correctly, it should authenticate. If it fails, we learn from the logs.
B) Check env vars via dashboard first, then redeploy with targeted auth fix - Safer but requires manual dashboard inspection. If `CRON_SECRET` is missing AND `SERVICE_ROLE_KEY` comparison fails, we'd need to either set the env var or simplify the auth check.
C) Simplify auth to only check `SERVICE_ROLE_KEY` and redeploy - Removes the `CRON_SECRET` check entirely. Simpler but loses the ability to use a separate cron-specific secret in the future.

### [Q2] Timeline for Tier D removals (deprecated views and unused tables)

Tier D includes dropping `tasks_v`, `tasks_summary`, `migration_history`, and `tutorial_progress`. These are all confirmed unused by app code. When should we execute Tier D?

A) Execute Tier D immediately after Tier C gate passes (Recommended) - Views have 0 app references; tables have 0 rows. Risk is minimal. TypeScript types will need regeneration but no runtime impact.
B) Wait 30 days after Tier C, monitoring for any unexpected references - More conservative. Gives time for any edge cases (admin scripts, data exports) to surface.
C) Only remove views (D4-D5) now; defer table drops (D3, D6) for 30 days - Compromise: views are zero-risk virtual objects; tables might have unexpected future use.

### [Q3] How to handle the `contact_duplicates` / `duplicate_stats` cloud-only views?

These views exist only on cloud (not in local migrations). They serve duplicate detection. No app code references them.

A) Create matching migrations so local has them too (Recommended) - Establishes version control for these views. Enables local testing of duplicate detection. Eliminates drift.
B) Drop them from cloud since they're not in VCS and not used by app - Clean removal but loses admin/operational tooling.
C) Leave them cloud-only and document in audit as known drift - Lowest effort but perpetuates undocumented schema drift.

---

*Generated by Claude Code (Opus 4.6) - Phase 3 Database Audit*
*Completed 2026-02-09*
