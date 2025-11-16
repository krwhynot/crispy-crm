# Sales Schema Fix - Cloud Deployment Checklist

**Migration:** `20251116210019_fix_sales_schema_consistency.sql`

**Date:** 2025-11-16

**Estimated Downtime:** None (additive changes only)

## Pre-Deployment Verification

- [ ] Dry-run validation passed: `npm run db:cloud:push:dry-run`
- [ ] Local testing completed successfully
- [ ] All tests passing: `npm test && npm run typecheck && npm run lint`
- [ ] No TypeScript errors
- [ ] UI verified locally (no duplicates, no empty rows)

## Deployment Steps

1. [ ] Backup current cloud database (automatic via Supabase)
2. [ ] Run migration: `npm run db:cloud:push`
3. [ ] Monitor Supabase dashboard for migration status
4. [ ] Wait for migration completion (estimated: 30 seconds)

## Post-Deployment Verification

Run these queries in Supabase SQL Editor:

```sql
-- 1. Verify exactly 1 admin
SELECT COUNT(*) FROM sales WHERE role = 'admin';
-- Expected: 1

-- 2. Verify administrator column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'administrator';
-- Expected: 1 row, type = boolean

-- 3. Verify no empty names
SELECT COUNT(*) FROM sales
WHERE first_name = '' OR last_name = '' OR first_name IS NULL OR last_name IS NULL;
-- Expected: 0

-- 4. Verify 1:1 mapping
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_count,
  (SELECT COUNT(*) FROM sales WHERE deleted_at IS NULL) as sales_count;
-- Expected: auth_count = sales_count
```

## UI Verification

1. [ ] Navigate to production URL `/sales`
2. [ ] Verify exactly 1 Admin entry
3. [ ] Verify no empty rows
4. [ ] Verify role badges display correctly (Admin=blue, Manager=green)
5. [ ] Edit a user and verify role dropdown works

## Rollback Plan (if needed)

```sql
-- Remove computed column (safe - data preserved in role column)
ALTER TABLE sales DROP COLUMN IF EXISTS administrator;

-- Note: Duplicates were data issues, not schema - no rollback needed for cleanup
```

## Monitoring

- [ ] Check Supabase logs for errors
- [ ] Monitor user reports for 24 hours
- [ ] Verify no authentication issues

## Success Criteria

- ✓ Migration applied without errors
- ✓ All verification queries pass
- ✓ UI shows correct data (1 admin, no duplicates, no empty rows)
- ✓ No user reports of permission issues
