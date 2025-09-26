# Troubleshooting Guide

## Common Migration Issues

### Issue: Migration Fails with "type already exists"

**Error Message:**
```
ERROR: type "organization_type" already exists
```

**Cause:** Previous partial migration or failed rollback left enum types.

**Solution:**
```sql
-- Check existing enum types
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Drop specific enum with CASCADE
DROP TYPE IF EXISTS organization_type CASCADE;
DROP TYPE IF EXISTS contact_role CASCADE;
-- etc. for other enums

-- Retry migration
```

### Issue: "deals table not found"

**Error Message:**
```
ERROR: relation "deals" does not exist
```

**Cause:** Table was already renamed to opportunities in Phase 1.1.

**Solution:**
```sql
-- Use opportunities table instead
SELECT * FROM opportunities;

-- If you need backward compatibility
CREATE VIEW deals AS SELECT * FROM opportunities;
```

### Issue: Foreign Key Violations During Migration

**Error Message:**
```
ERROR: insert or update on table "contact_organizations" violates foreign key constraint
```

**Cause:** Orphaned records or incorrect ID references.

**Solution:**
```sql
-- Find orphaned contacts
SELECT c.* FROM contacts c
LEFT JOIN companies comp ON c.company_id = comp.id
WHERE comp.id IS NULL AND c.company_id IS NOT NULL;

-- Fix or remove orphaned records
UPDATE contacts SET company_id = NULL
WHERE company_id NOT IN (SELECT id FROM companies);

-- Then retry migration
```

## Data Integrity Issues

### Issue: Interactions Without Opportunities

**Error After Fix:**
```
ERROR: Interactions must be linked to an opportunity (Business Rule Q21)
```

**Diagnosis:**
```sql
-- Find problematic interactions
SELECT * FROM activities
WHERE activity_type = 'interaction'
  AND opportunity_id IS NULL;
```

**Solution:**
```sql
-- Option 1: Convert to engagements
UPDATE activities
SET activity_type = 'engagement'
WHERE activity_type = 'interaction'
  AND opportunity_id IS NULL;

-- Option 2: Link to a default opportunity
UPDATE activities
SET opportunity_id = (
    SELECT id FROM opportunities
    WHERE stage = 'lead'
    ORDER BY created_at DESC
    LIMIT 1
)
WHERE activity_type = 'interaction'
  AND opportunity_id IS NULL;

-- Option 3: Delete invalid interactions
DELETE FROM activities
WHERE activity_type = 'interaction'
  AND opportunity_id IS NULL;
```

### Issue: Companies with Conflicting Roles

**Error:**
```
ERROR: A company cannot be both a customer and a distributor (Business Rule Q1)
```

**Diagnosis:**
```sql
-- Find conflicting companies
SELECT id, name, organization_type, is_principal, is_distributor
FROM companies
WHERE (organization_type = 'customer' AND is_distributor = true)
   OR (organization_type = 'customer' AND is_principal = true);
```

**Solution:**
```sql
-- Fix based on actual role
UPDATE companies
SET organization_type = 'distributor'
WHERE is_distributor = true
  AND organization_type = 'customer';

UPDATE companies
SET organization_type = 'principal'
WHERE is_principal = true
  AND organization_type = 'customer';
```

### Issue: Opportunities Without Customers

**Warning:**
```
WARNING: Opportunity 123 has no customer participant
```

**Diagnosis:**
```sql
-- Find opportunities without customers
SELECT o.id, o.name
FROM opportunities o
LEFT JOIN opportunity_participants op
  ON o.id = op.opportunity_id
  AND op.role = 'customer'
WHERE op.id IS NULL
  AND o.deleted_at IS NULL;
```

**Solution:**
```sql
-- Add customer participant based on legacy field
INSERT INTO opportunity_participants (opportunity_id, organization_id, role, is_primary)
SELECT
    o.id,
    COALESCE(o.customer_organization_id, o.company_id),
    'customer',
    true
FROM opportunities o
WHERE o.id NOT IN (
    SELECT opportunity_id
    FROM opportunity_participants
    WHERE role = 'customer'
)
AND (o.customer_organization_id IS NOT NULL OR o.company_id IS NOT NULL);
```

## Performance Issues

### Issue: Slow Opportunity Queries

**Symptoms:** Queries on opportunities_with_participants view are slow.

**Diagnosis:**
```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM opportunities_with_participants
WHERE principal_count > 1;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'opportunities'
ORDER BY idx_scan;
```

**Solution:**
```sql
-- Add missing index if needed
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_status
ON opportunities(stage, status)
WHERE deleted_at IS NULL;

-- Rebuild statistics
ANALYZE opportunities;
ANALYZE opportunity_participants;

-- Consider materialized view for heavy queries
CREATE MATERIALIZED VIEW opportunities_summary AS
SELECT ... FROM opportunities_with_participants;

-- Refresh periodically
REFRESH MATERIALIZED VIEW opportunities_summary;
```

### Issue: Full-Text Search Not Working

**Symptoms:** Search doesn't find expected results.

**Diagnosis:**
```sql
-- Check if search vectors are populated
SELECT COUNT(*)
FROM companies
WHERE search_tsv IS NULL
  AND deleted_at IS NULL;
```

**Solution:**
```sql
-- Manually update search vectors
UPDATE companies
SET search_tsv = to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(industry, '') || ' ' ||
    COALESCE(website, '')
)
WHERE search_tsv IS NULL;

-- Verify trigger exists
SELECT tgname FROM pg_trigger
WHERE tgname = 'trigger_update_companies_search_tsv';

-- Recreate trigger if missing
CREATE TRIGGER trigger_update_companies_search_tsv
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();
```

## Validation Errors

### Issue: Cannot Add Product - "not marked as principal"

**Error:**
```
ERROR: Company 123 is not marked as a principal
```

**Solution:**
```sql
-- Check company flags
SELECT id, name, organization_type, is_principal
FROM companies
WHERE id = 123;

-- Mark as principal if appropriate
UPDATE companies
SET is_principal = true,
    organization_type = 'principal'
WHERE id = 123;

-- Then retry adding product
```

### Issue: CHECK Constraints Not Working

**Symptoms:** Invalid data gets inserted despite CHECK constraints.

**Diagnosis:**
```sql
-- Check if using cross-table CHECK (doesn't work)
SELECT
    conname,
    pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'principal_distributor_relationships'::regclass
  AND contype = 'c';
```

**Solution:**
```sql
-- Apply validation fixes migration
psql -f merged/migrations/fixes/006_validation_fixes.sql

-- Verify triggers are in place
SELECT tgname FROM pg_trigger
WHERE tgname LIKE '%validate%';
```

## Rollback Issues

### Issue: Rollback Fails with Dependencies

**Error:**
```
ERROR: cannot drop type organization_type because other objects depend on it
```

**Solution:**
```sql
-- Use CASCADE carefully
DROP TYPE IF EXISTS organization_type CASCADE;

-- Or identify dependencies first
SELECT
    n.nspname as schema,
    c.relname as table,
    a.attname as column
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
JOIN pg_type t ON a.atttypid = t.oid
WHERE t.typname = 'organization_type';
```

### Issue: Data Loss During Rollback

**Prevention:**
```sql
-- Always create backups before rollback
CREATE TABLE opportunities_backup_20250122 AS
SELECT * FROM opportunities;

-- Verify backup
SELECT COUNT(*) FROM opportunities_backup_20250122;

-- Then proceed with rollback
```

## User Access Issues

### Issue: RLS Policies Blocking Access

**Symptoms:** Users can't see data they should access.

**Diagnosis:**
```sql
-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';

-- Check current user
SELECT current_user, session_user;

-- Test policies
SET LOCAL ROLE authenticated;
SELECT * FROM companies LIMIT 1;
```

**Solution:**
```sql
-- Temporarily disable for debugging
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Fix and re-enable
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Or update policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON companies;
CREATE POLICY "Enable all access for authenticated users" ON companies
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);
```

## Emergency Procedures

### Complete System Reset

```bash
# 1. Backup everything
pg_dump -h localhost -p 54322 -U postgres -d postgres > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Drop and recreate database
psql -U postgres -c "DROP DATABASE postgres;"
psql -U postgres -c "CREATE DATABASE postgres;"

# 3. Restore from last known good backup
psql -U postgres -d postgres < last_known_good.sql
```

### Fixing Corrupt Indexes

```sql
-- Identify corrupt indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND idx_tup_read = 0
  AND idx_tup_fetch = 0;

-- Rebuild all indexes on a table
REINDEX TABLE companies;

-- Or rebuild specific index
REINDEX INDEX idx_companies_search_tsv;

-- Rebuild all indexes in database
REINDEX DATABASE postgres;
```

### Monitoring Health

```sql
-- Check migration status
SELECT * FROM migration_history ORDER BY phase_number;

-- Check for validation errors in last hour
SELECT COUNT(*) AS recent_errors
FROM pg_stat_database
WHERE datname = 'postgres'
  AND xact_rollback > 0;

-- Check table sizes
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Check for long-running queries
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

## Prevention Tips

1. **Always backup before migrations**
```bash
pg_dump -h localhost -p 54322 -U postgres -d postgres > pre_migration_$(date +%Y%m%d).sql
```

2. **Test in development first**
```bash
# Create test database
createdb -h localhost -p 54322 -U postgres test_migration

# Run migrations on test
psql -d test_migration -f merged/migrations/stage1/*.sql
```

3. **Monitor after deployment**
```sql
-- Create monitoring view
CREATE VIEW system_health AS
SELECT
    (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL) as active_companies,
    (SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL) as active_opportunities,
    (SELECT COUNT(*) FROM activities WHERE created_at > NOW() - INTERVAL '24 hours') as recent_activities,
    (SELECT COUNT(*) FROM migration_history WHERE status = 'failed') as failed_migrations;

-- Check regularly
SELECT * FROM system_health;
```

## Getting Help

### Diagnostic Information to Collect

```sql
-- Version info
SELECT version();

-- Migration status
SELECT * FROM migration_history ORDER BY phase_number;

-- Recent errors
SELECT * FROM pg_stat_database WHERE datname = 'postgres';

-- Table counts
SELECT
    'companies' as table_name, COUNT(*) as count FROM companies
UNION ALL SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL SELECT 'opportunities', COUNT(*) FROM opportunities
UNION ALL SELECT 'activities', COUNT(*) FROM activities;
```

### Log Locations

- PostgreSQL logs: `/var/log/postgresql/`
- Supabase logs: `npx supabase db logs`
- Application logs: Check your app's logging configuration

---

**Guide Version**: 1.0
**Last Updated**: 2025-01-22
**For Migration**: MVP+1 (Phases 1.1-1.6)