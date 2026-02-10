# Tier D Execution Runbook

Use this runbook to execute Tier D cleanup safely after Tier A/B/C completion.

## Scope

Tier D targets:
- Drop views: `public.tasks_summary`, `public.tasks_v`
- Drop tables: `public.migration_history`, `public.tutorial_progress`
- Drop duplicate indexes:
  - `public.idx_product_distributor_auth_deleted_at`
  - `public.idx_opportunities_customer_org`

Migration file:
- `supabase/migrations/20260210000008_tier_d_drop_legacy_compat_and_unused_objects.sql`

Related app cleanup already done:
- Removed dead error map key in `src/atomic-crm/utils/errorMessages.ts`

## Gate Conditions (must all be true)

1. 10-day no-use window is satisfied.
2. Explicit owner signoff is recorded for Tier D targets.
3. Dependency checks pass (no active business-logic conflict).

If any condition fails, stop.

## Ownership Split

- Claude/Codex:
  - Run checks, dry-run, migration prep, verification queries, type regeneration.
- Owner:
  - Final signoff before cloud apply.
  - Approval for destructive actions.

## Step 1: Pre-Execution Safety Snapshot

1. Confirm cloud backups/PITR are enabled in Supabase Dashboard.
2. Export a schema snapshot (optional but recommended):
```bash
npm run db:cloud:diff
```
3. Record current migration state:
```bash
npm run db:cloud:status
```

## Step 2: Preflight SQL Checks (cloud)

Run these in Supabase SQL Editor or via MCP SQL execution.

```sql
-- A) Tier D table rows must be zero
select 'migration_history' as object, count(*) as rows from public.migration_history
union all
select 'tutorial_progress' as object, count(*) as rows from public.tutorial_progress;

-- B) Compatibility views still exist before drop
select to_regclass('public.tasks_summary') as tasks_summary_regclass,
       to_regclass('public.tasks_v') as tasks_v_regclass;

-- C) Dependency check for target objects
select
  c.relname as object_name,
  d.refobjid::regclass as depends_on
from pg_depend d
join pg_class c on c.oid = d.objid
where d.refobjid in (
  'public.tasks_summary'::regclass,
  'public.tasks_v'::regclass,
  'public.migration_history'::regclass,
  'public.tutorial_progress'::regclass
)
order by 1,2;

-- D) Duplicate-index replacement indexes must exist
select
  to_regclass('public.idx_product_distributor_auth_deleted_at') as old_pda_idx,
  to_regclass('public.idx_product_distributor_authorizations_deleted_at') as keep_pda_idx,
  to_regclass('public.idx_opportunities_customer_org') as old_opp_idx,
  to_regclass('public.idx_opportunities_customer_organization_id') as keep_opp_idx;
```

Stop if:
- Any row count is non-zero.
- Dependency check shows active object dependencies that were not approved.
- Replacement indexes are missing while old index exists.

## Step 3: Dry Run

```bash
npm run db:cloud:push:dry-run
```

Expected: migration `20260210000008` shows pending/applicable with no destructive surprises outside Tier D scope.

## Step 4: Apply Migration

After owner signoff:

```bash
npm run db:cloud:push
```

## Step 5: Post-Apply Verification

Run:

```sql
-- Targets should be gone
select to_regclass('public.tasks_summary') as tasks_summary_regclass,
       to_regclass('public.tasks_v') as tasks_v_regclass,
       to_regclass('public.migration_history') as migration_history_regclass,
       to_regclass('public.tutorial_progress') as tutorial_progress_regclass;

-- Dropped duplicate indexes should be gone
select to_regclass('public.idx_product_distributor_auth_deleted_at') as old_pda_idx,
       to_regclass('public.idx_opportunities_customer_org') as old_opp_idx;

-- Replacement indexes should remain
select to_regclass('public.idx_product_distributor_authorizations_deleted_at') as keep_pda_idx,
       to_regclass('public.idx_opportunities_customer_organization_id') as keep_opp_idx;
```

Expected:
- Dropped objects return `NULL`.
- Kept indexes return non-`NULL`.

## Step 6: Regenerate Types + Validate Repo

1. Regenerate types:
```bash
npm run gen:types
```

2. Quick reference check:
```bash
rg -n "tasks_v|tasks_summary|migration_history|tutorial_progress" src
```

Expected:
- No runtime references in app code.
- Any remaining mentions are in historical docs only.

3. Optional validation:
```bash
npm run typecheck
npm run test:ci
```

## Step 7: Rollback Plan

Tier D is destructive. Preferred rollback path:
- Restore cloud database using Supabase PITR to pre-Tier-D timestamp.

Only use manual object recreation if PITR is unavailable or explicitly rejected.

## Completion Checklist

- [ ] Gate conditions satisfied (10-day no-use + signoff + dependency checks)
- [ ] Preflight SQL checks pass
- [ ] Dry-run pass
- [ ] Migration applied
- [ ] Post-apply verification pass
- [ ] Types regenerated
- [ ] Repo checks pass
- [ ] Tier D completion recorded in `phase-4-report.md`
