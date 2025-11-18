# E2E Test Fixtures

This directory contains seed data and fixtures for end-to-end testing.

## Dashboard V3 Seed Data

**File:** `dashboard-v3-seed.sql`

Creates the minimum test data required for Dashboard V3 E2E tests to run successfully.

### What It Creates

1. **Sales Record** - Links `test@example.com` auth user to sales table
2. **Organizations** - 1 principal org + 1 customer org
3. **Opportunities** - 2 opportunities (active + cooling)
4. **Activities** - 5 activities (3 this week, 2 last week)
5. **Tasks** - 6 tasks across all time buckets:
   - 2 overdue
   - 2 today
   - 1 tomorrow
   - 1 upcoming

### Data Created

```
Organizations:
  └─ E2E Test Principal Org (principal)
      └─ E2E Test Customer (customer)

Opportunities:
  ├─ E2E Test Active Deal (discovery, 3 activities this week)
  └─ E2E Test Cooling Deal (proposal, 2 activities last week)

Tasks:
  ├─ OVERDUE
  │   ├─ Call back prospect (high)
  │   └─ Send proposal revision (critical)
  ├─ TODAY
  │   ├─ Prepare demo materials (high)
  │   └─ Review contract terms (medium)
  ├─ TOMORROW
  │   └─ Schedule follow-up call (medium)
  └─ UPCOMING
      └─ Send thank you note (low)

Activities:
  ├─ This Week (3) - Active Deal → increasing momentum
  └─ Last Week (2) - Cooling Deal → decreasing momentum
```

### Prerequisites

1. **Auth User Exists:**
   ```
   Email: test@example.com
   Password: (any secure password)
   ```

   Create via:
   - Supabase Dashboard → Authentication → Users → Add User
   - Or sign up via app: `http://127.0.0.1:5173/signup`

2. **Migration Applied:**
   ```bash
   # Verify
   npm run db:cloud:status | grep 20251118050755

   # Apply if missing
   npm run db:cloud:push
   ```

### Usage

**Automated (recommended):**
```bash
# Seed local database
./scripts/seed-e2e-dashboard-v3.sh

# Seed cloud database (use with caution!)
./scripts/seed-e2e-dashboard-v3.sh --cloud
```

**Manual:**
```bash
# Get database URL
DB_URL=$(npx supabase status | grep "DB URL" | awk '{print $3}')

# Apply seed file
psql $DB_URL -f tests/e2e/fixtures/dashboard-v3-seed.sql
```

### Verification

After seeding, verify data in Supabase Studio:

1. **Organizations:** Should see "E2E Test Principal Org"
2. **Opportunities:** Should see 2 "E2E Test" opportunities
3. **Tasks:** Should see 6 tasks for test user
4. **Pipeline View:**
   ```sql
   SELECT * FROM principal_pipeline_summary
   WHERE principal_name LIKE 'E2E Test%';
   ```

Expected output:
```
principal_name          | total_pipeline | active_this_week | active_last_week | momentum
------------------------|----------------|------------------|------------------|----------
E2E Test Principal Org  |              2 |                1 |                  | increasing
```

### Cleanup

**Remove test data:**
```sql
-- Delete in reverse order of dependencies
DELETE FROM tasks WHERE title LIKE 'E2E Test:%';
DELETE FROM activities WHERE subject LIKE '%E2E%';
DELETE FROM opportunities WHERE name LIKE 'E2E Test%';
DELETE FROM organizations WHERE name LIKE 'E2E Test%';

-- Optional: Remove test user sales record link
UPDATE sales
SET user_id = NULL
WHERE email = 'test@example.com';
```

### Troubleshooting

**Error: Auth user not found**
- Create test user via Supabase dashboard first
- Or run signup flow in app

**Error: Migration not applied**
- Run: `npm run db:cloud:push` (for cloud)
- Or: `npx supabase db reset` (for local)

**Error: Permission denied**
- Verify RLS policies grant access to authenticated users
- Check `GRANT` statements are in migrations

**Duplicate key violations**
- Seed file uses `ON CONFLICT DO NOTHING` - safe to re-run
- If still failing, manually delete existing E2E test data first

## Adding New Fixtures

When adding new E2E test suites:

1. Create seed SQL file: `<feature>-seed.sql`
2. Create seed script: `scripts/seed-e2e-<feature>.sh`
3. Document in this README
4. Update `.gitignore` if needed (e.g., for binary fixtures)

### Seed File Template

```sql
-- Feature Name E2E Test Data Seed
-- Description of what this creates
-- Prerequisites

DO $$
DECLARE
  v_sales_id BIGINT;
BEGIN
  -- Get test user sales ID
  SELECT id INTO v_sales_id FROM sales WHERE email = 'test@example.com';

  IF v_sales_id IS NULL THEN
    RAISE EXCEPTION 'Test user not found';
  END IF;

  -- Create test data
  -- ...

  -- Report
  RAISE NOTICE 'Seed complete: % records created', COUNT(*);
END $$;
```

## Best Practices

1. **Idempotent** - Use `ON CONFLICT DO NOTHING` for safe re-runs
2. **Prefixed** - Name test data with "E2E Test" prefix for easy identification
3. **Minimal** - Create only data needed for tests to pass
4. **Linked** - Always link to test user (test@example.com)
5. **Verifiable** - Include verification queries at end
6. **Documented** - Document what data is created and why

## Related Documentation

- [Dashboard V3 E2E Testing Guide](../../../docs/testing/dashboard-v3-e2e-guide.md)
- [Supabase Workflow](../../../docs/supabase/WORKFLOW.md)
