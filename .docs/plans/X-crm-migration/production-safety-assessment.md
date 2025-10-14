# Stage 1 CRM Migration - Production Safety Assessment

## Executive Summary

**CRITICAL: This migration is NOT safe for production execution in its current form**

The Stage 1 Phase 1.1 migration contains multiple critical issues that would cause:
- Complete application downtime (10-30+ minutes minimum)
- Risk of data corruption if migration fails mid-execution
- No automated rollback capability
- Potential for resource exhaustion on large databases
- Security gaps during RLS policy recreation

## Critical Issues Identified

### 1. Transaction Management ❌ CRITICAL

**Current State:**
- No transaction wrapping around migration
- No savepoints between phases
- Validation uses RAISE EXCEPTION without transaction context
- Migration history updates are not atomic

**Impact:**
- Partial migration on failure leaves database inconsistent
- Cannot rollback to clean state
- Application will be broken if migration fails after table rename

**Required Fixes:**
```sql
-- Wrap entire migration in transaction
BEGIN;

-- Set appropriate lock timeout
SET lock_timeout = '10s';
SET statement_timeout = '30min';

-- Create savepoints between major operations
SAVEPOINT before_table_rename;
-- ... do rename ...
RELEASE SAVEPOINT before_table_rename;

-- Commit only after all validation passes
COMMIT;
```

### 2. Lock Contention ❌ CRITICAL

**Current State:**
- ALTER TABLE acquires ACCESS EXCLUSIVE locks
- Non-concurrent index creation blocks reads
- Table rename blocks all access
- CASCADE drops affect dependent objects

**Impact:**
- Complete table lockout during migration
- Application requests will timeout/fail
- User-facing downtime of 10-30+ minutes

**Required Fixes:**
```sql
-- Use CONCURRENTLY for index creation
CREATE INDEX CONCURRENTLY idx_companies_deleted_at ON companies(deleted_at);

-- Add columns with minimal locking
ALTER TABLE companies
ADD COLUMN organization_type organization_type DEFAULT 'customer';
-- Then in separate transaction:
ALTER TABLE companies
ALTER COLUMN organization_type SET NOT NULL;

-- Consider using view + table swap pattern for rename
```

### 3. Downtime Requirements ⚠️ HIGH

**Current State:**
- Migration requires full application shutdown
- No online migration path available
- No connection management strategy

**Impact:**
- Planned maintenance window required
- All users must be offline
- No graceful degradation possible

**Required Implementation:**
```sql
-- Terminate existing connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
  AND application_name != 'migration';

-- Prevent new connections
ALTER DATABASE production_db CONNECTION LIMIT 1;

-- Run migration

-- Restore connections
ALTER DATABASE production_db CONNECTION LIMIT -1;
```

### 4. Resource Usage ⚠️ HIGH

**Current State:**
- Unbatched UPDATE on potentially millions of rows
- Multiple GIN index creations without throttling
- No work_mem or maintenance_work_mem tuning
- Triggers fire on every row update

**Impact:**
- Potential OOM on large tables
- Massive WAL generation
- I/O saturation
- CPU spike from trigger execution

**Required Fixes:**
```sql
-- Batch large updates
DO $$
DECLARE
    batch_size INT := 10000;
    rows_updated INT;
BEGIN
    LOOP
        UPDATE opportunities
        SET customer_organization_id = company_id
        WHERE customer_organization_id IS NULL
          AND company_id IS NOT NULL
          AND ctid IN (
            SELECT ctid FROM opportunities
            WHERE customer_organization_id IS NULL
              AND company_id IS NOT NULL
            LIMIT batch_size
          );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        EXIT WHEN rows_updated = 0;

        -- Allow other transactions
        PERFORM pg_sleep(0.1);
        VACUUM opportunities;
    END LOOP;
END $$;

-- Increase memory for index creation
SET maintenance_work_mem = '1GB';
```

### 5. Monitoring Gaps ⚠️ MEDIUM

**Current State:**
- No progress tracking for long operations
- Basic migration_history insufficient
- No resource monitoring
- No completion estimates

**Required Implementation:**
```sql
-- Progress tracking function
CREATE OR REPLACE FUNCTION log_migration_progress(
    phase TEXT,
    step TEXT,
    progress_pct INT
) RETURNS void AS $$
BEGIN
    INSERT INTO migration_progress
    (phase, step, progress_pct, timestamp)
    VALUES (phase, step, progress_pct, NOW());

    RAISE NOTICE 'Migration Progress: % - % (%%)', phase, step, progress_pct;
END;
$$ LANGUAGE plpgsql;

-- Monitor long-running queries
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE application_name = 'migration';
```

### 6. Emergency Procedures ❌ CRITICAL

**Current State:**
- No rollback script
- No backup verification
- Destructive CASCADE operations
- No abort procedure

**Impact:**
- Cannot recover from failed migration
- Data loss risk
- Extended downtime for manual recovery

**Required Implementation:**
```sql
-- Create backup tables before migration
CREATE TABLE companies_backup_20250122 AS SELECT * FROM companies;
CREATE TABLE contacts_backup_20250122 AS SELECT * FROM contacts;
CREATE TABLE deals_backup_20250122 AS SELECT * FROM deals;

-- Store view definitions before dropping
CREATE TABLE dropped_views_backup AS
SELECT viewname, definition
FROM pg_views
WHERE viewname IN ('deals_summary', 'init_state');

-- Rollback procedure
CREATE OR REPLACE FUNCTION rollback_migration_1_1()
RETURNS void AS $$
BEGIN
    -- Restore original table names
    ALTER TABLE opportunities RENAME TO deals;

    -- Restore columns
    ALTER TABLE companies
    DROP COLUMN IF EXISTS organization_type,
    DROP COLUMN IF EXISTS is_principal;
    -- ... etc

    -- Recreate views from backup
    -- Restore RLS policies
END;
$$ LANGUAGE plpgsql;
```

### 7. Connection Management ⚠️ HIGH

**Current State:**
- No connection termination strategy
- No prevention of new connections
- No handling of active transactions

**Required Implementation:**
```sql
-- Pre-migration connection management
DO $$
DECLARE
    active_count INT;
BEGIN
    -- Count active connections
    SELECT COUNT(*) INTO active_count
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid();

    IF active_count > 0 THEN
        RAISE NOTICE 'Active connections: %', active_count;

        -- Soft termination (cancel queries)
        PERFORM pg_cancel_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid();

        -- Wait for graceful disconnect
        PERFORM pg_sleep(5);

        -- Force termination if needed
        PERFORM pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid();
    END IF;
END $$;
```

## Additional Critical Issues

### RLS Policy Bug
The migration drops and recreates RLS policies assuming "authenticated" role, but original policies might be for different roles:

```sql
-- WRONG: Assumes all policies are for authenticated
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON companies;

-- CORRECT: Preserve existing policy definitions
CREATE TABLE rls_policy_backup AS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('companies', 'contacts', 'deals');
```

### View Compatibility Issue
The backward compatibility view won't work for DML:

```sql
-- Current (broken for INSERT/UPDATE/DELETE)
CREATE OR REPLACE VIEW deals AS
SELECT * FROM opportunities;

-- Correct implementation with rules
CREATE OR REPLACE VIEW deals AS
SELECT * FROM opportunities;

CREATE RULE deals_insert AS ON INSERT TO deals
DO INSTEAD INSERT INTO opportunities VALUES (NEW.*);

CREATE RULE deals_update AS ON UPDATE TO deals
DO INSTEAD UPDATE opportunities SET ... WHERE id = OLD.id;

CREATE RULE deals_delete AS ON DELETE TO deals
DO INSTEAD DELETE FROM opportunities WHERE id = OLD.id;
```

## Recommended Execution Strategy

### Phase 1: Pre-Migration (T-24 hours)
1. **Full backup** using pg_dump
2. **Validate backup** restoration on test server
3. **Analyze tables** for accurate statistics
4. **Test migration** on production clone
5. **Notify users** of maintenance window

### Phase 2: Connection Management (T-30 minutes)
1. **Enable read-only mode** in application
2. **Start monitoring** dashboard
3. **Log active connections**
4. **Begin connection drainage**

### Phase 3: Migration Execution
1. **Set maintenance mode** in load balancer
2. **Terminate connections** gracefully
3. **Create backup tables** within database
4. **Execute migration** in transaction
5. **Run validation** checks
6. **Commit or rollback** based on validation

### Phase 4: Post-Migration (Immediate)
1. **Verify data integrity** with spot checks
2. **Test critical queries** performance
3. **Re-enable connections** gradually
4. **Monitor error rates** closely
5. **Keep backup** for 48 hours minimum

## Migration Execution Script Template

```bash
#!/bin/bash
set -e

# Configuration
DB_NAME="production"
MIGRATION_USER="migration_admin"
BACKUP_DIR="/backups/migration_$(date +%Y%m%d_%H%M%S)"

# Pre-flight checks
echo "Starting pre-migration checks..."
psql -U $MIGRATION_USER -d $DB_NAME -c "
    SELECT
        pg_database_size('$DB_NAME') as db_size,
        count(*) as table_count
    FROM information_schema.tables
    WHERE table_schema = 'public';
"

# Create backup
echo "Creating backup..."
pg_dump -U $MIGRATION_USER -d $DB_NAME -Fd -j 4 -f $BACKUP_DIR

# Set maintenance mode
echo "Entering maintenance mode..."
psql -U $MIGRATION_USER -d $DB_NAME -c "
    ALTER DATABASE $DB_NAME CONNECTION LIMIT 1;
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
"

# Execute migration
echo "Executing migration..."
psql -U $MIGRATION_USER -d $DB_NAME \
    -v ON_ERROR_STOP=1 \
    --single-transaction \
    -f migration_1_1_fixed.sql

# Validate
echo "Running validation..."
psql -U $MIGRATION_USER -d $DB_NAME -f validation_1_1.sql

# Re-enable connections
echo "Re-enabling connections..."
psql -U $MIGRATION_USER -d $DB_NAME -c "
    ALTER DATABASE $DB_NAME CONNECTION LIMIT -1;
"

echo "Migration completed successfully"
```

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Transaction failure | High | Critical | Add proper transaction boundaries and savepoints |
| Lock timeout | High | High | Use CONCURRENTLY, batch updates, increase timeouts |
| Resource exhaustion | Medium | Critical | Batch operations, tune memory, monitor resources |
| Data corruption | Low | Critical | Full backup, validation checks, atomic operations |
| Rollback failure | Medium | Critical | Test rollback procedure, maintain backup tables |
| Extended downtime | High | High | Optimize operations, parallel index creation where possible |

## Recommendations Summary

1. **DO NOT EXECUTE** this migration in production without fixes
2. **Require minimum 2-hour maintenance window** for safety
3. **Test thoroughly** on production-sized dataset first
4. **Implement all transaction management** fixes
5. **Create comprehensive rollback** procedure
6. **Use batched updates** for large tables
7. **Monitor resources** throughout execution
8. **Keep backups** for minimum 48 hours
9. **Consider splitting** into smaller migrations
10. **Document every step** for audit trail

## Next Steps

1. Rewrite migration with proper transaction management
2. Implement batched update strategies
3. Create and test rollback procedures
4. Add comprehensive monitoring
5. Test on production clone with full dataset
6. Create runbook for operations team
7. Schedule maintenance window with stakeholders
8. Prepare incident response plan

---

**Status: BLOCKED - Requires significant revision before production deployment**

*Generated: 2025-01-22*
*Reviewer: Production Database Operations Specialist*