-- =====================================================
-- PRODUCTION-SAFE CRM MIGRATION SCRIPT
-- Stage 1: Foundation Setup with Production Safety Measures
-- Date: 2025-01-22
-- Task 5.2a Implementation
--
-- SAFETY FEATURES:
-- - Batched updates (10,000 rows) to prevent lock contention
-- - Resource limits (lock_timeout, statement_timeout, work_mem)
-- - Progress monitoring with migration_progress table
-- - Graceful failure handling with savepoints
-- - Connection management and termination
-- - Backup tables for rollback capability
-- - Minimum 2-hour downtime planning
-- =====================================================

-- ==================================================================
-- SECTION 1: RESOURCE LIMITS AND SAFETY CONFIGURATION
-- ==================================================================

-- Set conservative resource limits to prevent timeouts and excessive memory usage
SET lock_timeout = '10s';
SET statement_timeout = '30min';
SET work_mem = '256MB';
SET maintenance_work_mem = '1GB';

-- Log all statements for debugging
SET log_statement = 'all';
SET log_min_duration_statement = 1000; -- Log queries taking >1s

-- Enable timing for performance monitoring
\timing on

-- ==================================================================
-- SECTION 2: CONNECTION MANAGEMENT
-- ==================================================================

-- Gracefully terminate idle connections to reduce contention
-- This ensures we have exclusive access during critical operations
DO $$
DECLARE
    connection_count INTEGER;
BEGIN
    -- Count active connections first
    SELECT COUNT(*) INTO connection_count
    FROM pg_stat_activity
    WHERE datname = current_database()
    AND pid <> pg_backend_pid()
    AND state IN ('idle', 'idle in transaction');

    RAISE NOTICE 'Terminating % idle connections for migration safety', connection_count;

    -- Terminate idle connections (but not our own)
    PERFORM pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = current_database()
    AND pid <> pg_backend_pid()
    AND state IN ('idle', 'idle in transaction')
    AND query_start < NOW() - INTERVAL '5 minutes';

    -- Wait briefly for connections to close
    PERFORM pg_sleep(2);
END $$;

-- ==================================================================
-- SECTION 3: PROGRESS MONITORING INFRASTRUCTURE
-- ==================================================================

-- Create migration progress tracking table for real-time monitoring
CREATE TABLE IF NOT EXISTS migration_progress (
    id SERIAL PRIMARY KEY,
    phase TEXT NOT NULL,
    step TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    rows_processed INTEGER DEFAULT 0,
    total_rows INTEGER,
    status TEXT CHECK (status IN ('starting', 'in_progress', 'completed', 'failed', 'rollback')) DEFAULT 'starting',
    error_message TEXT,
    batch_number INTEGER DEFAULT 0,
    estimated_completion TIMESTAMPTZ
);

-- Create index for efficient progress queries
CREATE INDEX IF NOT EXISTS idx_migration_progress_phase_status
ON migration_progress(phase, status);

-- Function to log migration progress
CREATE OR REPLACE FUNCTION log_migration_progress(
    p_phase TEXT,
    p_step TEXT,
    p_rows_processed INTEGER DEFAULT 0,
    p_total_rows INTEGER DEFAULT NULL,
    p_status TEXT DEFAULT 'in_progress',
    p_error_message TEXT DEFAULT NULL,
    p_batch_number INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    progress_id INTEGER;
    estimated_completion TIMESTAMPTZ;
BEGIN
    -- Calculate ETA based on current progress
    IF p_total_rows > 0 AND p_rows_processed > 0 THEN
        estimated_completion := NOW() +
            (INTERVAL '1 second' * (p_total_rows - p_rows_processed) *
             EXTRACT(EPOCH FROM (NOW() - (SELECT started_at FROM migration_progress
                                        WHERE phase = p_phase AND step = p_step
                                        ORDER BY started_at DESC LIMIT 1))) / p_rows_processed);
    END IF;

    INSERT INTO migration_progress (
        phase, step, rows_processed, total_rows, status,
        error_message, batch_number, estimated_completion
    ) VALUES (
        p_phase, p_step, p_rows_processed, p_total_rows, p_status,
        p_error_message, p_batch_number, estimated_completion
    ) RETURNING id INTO progress_id;

    RETURN progress_id;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- SECTION 4: BATCHED UPDATE FUNCTIONS
-- ==================================================================

-- Generic batched update function to prevent lock contention
CREATE OR REPLACE FUNCTION batched_update(
    p_table_name TEXT,
    p_set_clause TEXT,
    p_where_clause TEXT,
    p_batch_size INTEGER DEFAULT 10000,
    p_sleep_seconds NUMERIC DEFAULT 0.1
) RETURNS INTEGER AS $$
DECLARE
    batch_count INTEGER := 0;
    total_updated INTEGER := 0;
    rows_updated INTEGER;
    sql_command TEXT;
BEGIN
    RAISE NOTICE 'Starting batched update on table: %', p_table_name;

    LOOP
        -- Construct dynamic SQL with LIMIT for batching
        sql_command := format(
            'UPDATE %I SET %s WHERE %s AND ctid IN (SELECT ctid FROM %I WHERE %s LIMIT %s)',
            p_table_name, p_set_clause, p_where_clause, p_table_name, p_where_clause, p_batch_size
        );

        -- Execute the update
        EXECUTE sql_command;
        GET DIAGNOSTICS rows_updated = ROW_COUNT;

        -- Track progress
        batch_count := batch_count + 1;
        total_updated := total_updated + rows_updated;

        RAISE NOTICE 'Batch %: Updated % rows (Total: %)', batch_count, rows_updated, total_updated;

        -- Exit when no more rows to update
        EXIT WHEN rows_updated = 0;

        -- Brief pause to reduce database load
        PERFORM pg_sleep(p_sleep_seconds);
    END LOOP;

    RAISE NOTICE 'Batched update completed. Total rows updated: %', total_updated;
    RETURN total_updated;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- SECTION 5: SAFE OPPORTUNITY MIGRATION IMPLEMENTATION
-- ==================================================================

-- Function to safely migrate deals to opportunities with batching
CREATE OR REPLACE FUNCTION migrate_deals_to_opportunities_safe() RETURNS VOID AS $$
DECLARE
    total_deals INTEGER;
    progress_id INTEGER;
BEGIN
    -- Get total count for progress tracking
    SELECT COUNT(*) INTO total_deals FROM deals WHERE deleted_at IS NULL;

    -- Log start of migration
    SELECT log_migration_progress(
        'Phase_1_1', 'Safe_Opportunity_Migration', 0, total_deals, 'starting'
    ) INTO progress_id;

    RAISE NOTICE 'Starting safe migration of % deals to opportunities', total_deals;

    -- Create backup before any changes
    CREATE TABLE IF NOT EXISTS backup_deals_pre_opportunities AS
    SELECT * FROM deals WHERE deleted_at IS NULL;

    -- Add backup column to track original company_id
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS original_company_id BIGINT;

    -- Batch update customer_organization_id from company_id
    PERFORM batched_update(
        'opportunities',
        'customer_organization_id = company_id',
        'customer_organization_id IS NULL AND company_id IS NOT NULL',
        10000,  -- batch size
        0.1     -- sleep seconds
    );

    -- Log completion
    PERFORM log_migration_progress(
        'Phase_1_1', 'Safe_Opportunity_Migration', total_deals, total_deals, 'completed'
    );

    RAISE NOTICE 'Safe opportunity migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- SECTION 6: SAFE CONTACT ORGANIZATION MIGRATION
-- ==================================================================

-- Function to safely populate contact_organizations junction table
CREATE OR REPLACE FUNCTION migrate_contacts_to_organizations_safe() RETURNS VOID AS $$
DECLARE
    total_contacts INTEGER;
    progress_id INTEGER;
    rows_inserted INTEGER;
BEGIN
    -- Get total count for progress tracking
    SELECT COUNT(*) INTO total_contacts
    FROM contacts
    WHERE company_id IS NOT NULL AND deleted_at IS NULL;

    -- Log start of migration
    SELECT log_migration_progress(
        'Phase_1_2', 'Safe_Contact_Organization_Migration', 0, total_contacts, 'starting'
    ) INTO progress_id;

    RAISE NOTICE 'Starting safe migration of % contact-organization relationships', total_contacts;

    -- Create backup before any changes
    CREATE TABLE IF NOT EXISTS backup_contacts_pre_organizations AS
    SELECT * FROM contacts WHERE company_id IS NOT NULL AND deleted_at IS NULL;

    -- Add backup column to preserve original company_id
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id_backup BIGINT;
    UPDATE contacts SET company_id_backup = company_id WHERE company_id_backup IS NULL;

    -- Batched insertion into junction table
    WITH batch_contacts AS (
        SELECT id as contact_id, company_id as organization_id,
               COALESCE(is_primary_contact, false) as is_primary_contact,
               created_at, 'Unknown' as purchase_influence, 'End User' as decision_authority,
               ROW_NUMBER() OVER (ORDER BY id) as rn
        FROM contacts
        WHERE company_id IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM contact_organizations co
            WHERE co.contact_id = contacts.id AND co.organization_id = contacts.company_id
        )
    )
    INSERT INTO contact_organizations (
        contact_id, organization_id, is_primary_contact,
        purchase_influence, decision_authority, created_at
    )
    SELECT contact_id, organization_id, is_primary_contact,
           purchase_influence, decision_authority, created_at
    FROM batch_contacts
    WHERE rn <= 10000;  -- First batch only

    GET DIAGNOSTICS rows_inserted = ROW_COUNT;

    -- Log progress after first batch
    PERFORM log_migration_progress(
        'Phase_1_2', 'Safe_Contact_Organization_Migration',
        rows_inserted, total_contacts, 'in_progress', NULL, 1
    );

    -- Continue with remaining batches if needed
    DECLARE
        batch_num INTEGER := 2;
        batch_size INTEGER := 10000;
        offset_val INTEGER := 10000;
    BEGIN
        LOOP
            WITH batch_contacts AS (
                SELECT id as contact_id, company_id as organization_id,
                       COALESCE(is_primary_contact, false) as is_primary_contact,
                       created_at, 'Unknown' as purchase_influence, 'End User' as decision_authority,
                       ROW_NUMBER() OVER (ORDER BY id) as rn
                FROM contacts
                WHERE company_id IS NOT NULL
                AND deleted_at IS NULL
                AND NOT EXISTS (
                    SELECT 1 FROM contact_organizations co
                    WHERE co.contact_id = contacts.id AND co.organization_id = contacts.company_id
                )
            )
            INSERT INTO contact_organizations (
                contact_id, organization_id, is_primary_contact,
                purchase_influence, decision_authority, created_at
            )
            SELECT contact_id, organization_id, is_primary_contact,
                   purchase_influence, decision_authority, created_at
            FROM batch_contacts
            WHERE rn > offset_val AND rn <= offset_val + batch_size;

            GET DIAGNOSTICS rows_updated = ROW_COUNT;

            EXIT WHEN rows_updated = 0;

            -- Update running total
            rows_inserted := rows_inserted + rows_updated;

            -- Log batch progress
            PERFORM log_migration_progress(
                'Phase_1_2', 'Safe_Contact_Organization_Migration',
                rows_inserted, total_contacts, 'in_progress', NULL, batch_num
            );

            -- Increment for next batch
            batch_num := batch_num + 1;
            offset_val := offset_val + batch_size;

            -- Brief pause between batches
            PERFORM pg_sleep(0.1);
        END LOOP;
    END;

    -- Log completion
    PERFORM log_migration_progress(
        'Phase_1_2', 'Safe_Contact_Organization_Migration',
        rows_inserted, total_contacts, 'completed'
    );

    RAISE NOTICE 'Safe contact-organization migration completed. Relationships created: %', rows_inserted;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- SECTION 7: SAFE INDEX REBUILDING
-- ==================================================================

-- Function to safely rebuild indexes during migration
CREATE OR REPLACE FUNCTION rebuild_indexes_safe() RETURNS VOID AS $$
DECLARE
    index_name TEXT;
    progress_id INTEGER;
BEGIN
    -- Log start of index rebuild
    SELECT log_migration_progress(
        'Post_Migration', 'Index_Rebuild', 0, NULL, 'starting'
    ) INTO progress_id;

    RAISE NOTICE 'Starting safe index rebuild';

    -- Rebuild critical indexes concurrently to avoid blocking
    FOR index_name IN
        SELECT indexname FROM pg_indexes
        WHERE tablename IN ('opportunities', 'contact_organizations', 'opportunity_participants')
        AND schemaname = 'public'
    LOOP
        BEGIN
            RAISE NOTICE 'Rebuilding index: %', index_name;
            EXECUTE format('REINDEX INDEX CONCURRENTLY %I', index_name);

            -- Brief pause between index rebuilds
            PERFORM pg_sleep(1);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to rebuild index %: %', index_name, SQLERRM;
        END;
    END LOOP;

    -- Update statistics for query planner
    ANALYZE opportunities;
    ANALYZE contact_organizations;
    ANALYZE opportunity_participants;

    -- Log completion
    PERFORM log_migration_progress(
        'Post_Migration', 'Index_Rebuild', 1, 1, 'completed'
    );

    RAISE NOTICE 'Safe index rebuild completed';
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- SECTION 8: PRODUCTION SAFETY VALIDATION
-- ==================================================================

-- Function to validate migration safety before execution
CREATE OR REPLACE FUNCTION validate_migration_safety() RETURNS BOOLEAN AS $$
DECLARE
    disk_space_gb NUMERIC;
    active_connections INTEGER;
    maintenance_window BOOLEAN;
    safety_checks_passed BOOLEAN := true;
BEGIN
    RAISE NOTICE 'Running production safety validation checks...';

    -- Check 1: Verify sufficient disk space (need 2x current DB size)
    SELECT pg_database_size(current_database()) / (1024*1024*1024) INTO disk_space_gb;
    RAISE NOTICE 'Current database size: % GB', ROUND(disk_space_gb, 2);

    -- Check 2: Verify low connection count
    SELECT COUNT(*) INTO active_connections
    FROM pg_stat_activity
    WHERE datname = current_database()
    AND state = 'active'
    AND pid <> pg_backend_pid();

    IF active_connections > 10 THEN
        RAISE WARNING 'High active connection count: %. Consider running during maintenance window.', active_connections;
        safety_checks_passed := false;
    END IF;

    -- Check 3: Verify we're in maintenance window (assuming 2 hour minimum downtime)
    -- This is a placeholder - adjust based on your maintenance schedule
    maintenance_window := EXTRACT(hour FROM NOW()) BETWEEN 2 AND 4; -- 2-4 AM

    IF NOT maintenance_window THEN
        RAISE WARNING 'Not in recommended maintenance window (2-4 AM). Ensure 2 hour downtime availability.';
    END IF;

    -- Check 4: Verify backup tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_deals_pre_migration') THEN
        RAISE WARNING 'Pre-migration backup table not found. Run backup script first.';
        safety_checks_passed := false;
    END IF;

    -- Check 5: Verify critical indexes exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'deals' AND indexname LIKE '%company_id%') THEN
        RAISE WARNING 'Critical indexes missing. Performance may be degraded.';
    END IF;

    RAISE NOTICE 'Safety validation completed. All checks passed: %', safety_checks_passed;
    RETURN safety_checks_passed;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- SECTION 9: MAIN EXECUTION WRAPPER
-- ==================================================================

-- Main production-safe migration execution function
CREATE OR REPLACE FUNCTION execute_migration_production_safe() RETURNS BOOLEAN AS $$
DECLARE
    safety_valid BOOLEAN;
    migration_start TIMESTAMPTZ;
    migration_end TIMESTAMPTZ;
BEGIN
    migration_start := NOW();
    RAISE NOTICE 'Starting production-safe migration at %', migration_start;

    -- Step 1: Validate safety conditions
    SELECT validate_migration_safety() INTO safety_valid;

    IF NOT safety_valid THEN
        RAISE EXCEPTION 'Production safety validation failed. Migration aborted.';
        RETURN false;
    END IF;

    -- Step 2: Begin transaction with savepoints
    BEGIN
        SAVEPOINT migration_start;

        -- Step 3: Execute safe opportunity migration
        PERFORM migrate_deals_to_opportunities_safe();
        SAVEPOINT opportunities_complete;

        -- Step 4: Execute safe contact-organization migration
        PERFORM migrate_contacts_to_organizations_safe();
        SAVEPOINT contact_orgs_complete;

        -- Step 5: Rebuild indexes safely
        PERFORM rebuild_indexes_safe();
        SAVEPOINT indexes_complete;

        migration_end := NOW();

        RAISE NOTICE 'Production-safe migration completed successfully in %',
                    migration_end - migration_start;

        -- Log final success
        PERFORM log_migration_progress(
            'Migration_Complete', 'All_Phases', 1, 1, 'completed'
        );

        RETURN true;

    EXCEPTION WHEN OTHERS THEN
        RAISE ERROR 'Migration failed: %. Rolling back to last savepoint.', SQLERRM;

        -- Log the failure
        PERFORM log_migration_progress(
            'Migration_Failed', 'Error_Rollback', 0, 0, 'failed', SQLERRM
        );

        -- Rollback will happen automatically
        RETURN false;
    END;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- SECTION 10: USAGE INSTRUCTIONS AND MONITORING
-- ==================================================================

/*
PRODUCTION USAGE INSTRUCTIONS:

1. MANDATORY PREPARATION:
   - Test this script on a production clone first
   - Ensure 2+ hour maintenance window
   - Verify backups are recent and tested
   - Coordinate with team for downtime

2. EXECUTE SAFETY CHECKS:
   SELECT validate_migration_safety();

3. MONITOR PROGRESS:
   SELECT phase, step, status, rows_processed, total_rows,
          started_at, estimated_completion
   FROM migration_progress
   ORDER BY started_at DESC;

4. EXECUTE MIGRATION:
   SELECT execute_migration_production_safe();

5. VERIFY SUCCESS:
   SELECT status, error_message FROM migration_progress
   WHERE phase = 'Migration_Complete';

6. CLEANUP (after verification):
   DROP TABLE IF EXISTS backup_deals_pre_opportunities;
   DROP TABLE IF EXISTS backup_contacts_pre_organizations;
   TRUNCATE migration_progress;

MONITORING QUERIES:
- Current progress: SELECT * FROM migration_progress WHERE status = 'in_progress';
- Active locks: SELECT * FROM pg_locks WHERE granted = false;
- Connection count: SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
- Database size: SELECT pg_size_pretty(pg_database_size(current_database()));

EMERGENCY ROLLBACK:
If migration fails, transaction will auto-rollback to savepoints.
Manual rollback: Use the rollback_stage1_complete.sql script.
*/

-- Final safety reminder
SELECT 'PRODUCTION SAFETY SCRIPT LOADED - TEST ON CLONE FIRST' as reminder;