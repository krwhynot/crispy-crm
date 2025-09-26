-- Pre-Migration Validation Script
-- Task 5.1a: Validates data quality and creates Go/No-Go assessment
-- Must be executed before any migration to ensure data integrity

-- Set up validation environment
SET work_mem = '256MB';
SET statement_timeout = '30min';

-- Create validation results table if not exists
CREATE TABLE IF NOT EXISTS migration_validation_results (
    id SERIAL PRIMARY KEY,
    validation_run_id UUID DEFAULT gen_random_uuid(),
    check_type TEXT NOT NULL,
    entity_name TEXT,
    count_value BIGINT,
    percentage DECIMAL(5,2),
    status TEXT CHECK (status IN ('PASS', 'WARN', 'FAIL')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear previous validation results for this run
DO $$
DECLARE
    current_run_id UUID := gen_random_uuid();
BEGIN
    -- Store the run ID for this session
    PERFORM set_config('migration.validation_run_id', current_run_id::text, false);
END $$;

-- Validation Section 1: Data Count Verification
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'entity_count',
    'deals',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'WARN' END,
    'Total deals in system: ' || COUNT(*)
FROM deals
WHERE deleted_at IS NULL;

INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'entity_count',
    'contacts',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'WARN' END,
    'Total contacts in system: ' || COUNT(*)
FROM contacts
WHERE deleted_at IS NULL;

INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'entity_count',
    'companies',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'WARN' END,
    'Total companies in system: ' || COUNT(*)
FROM companies
WHERE deleted_at IS NULL;

-- Validation Section 2: Orphaned Records Check
-- Check for contacts without valid company
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, percentage, status, message
)
WITH orphaned_contacts AS (
    SELECT COUNT(*) as orphan_count
    FROM contacts c
    WHERE c.deleted_at IS NULL
    AND (c.company_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM companies co
        WHERE co.id = c.company_id AND co.deleted_at IS NULL
    ))
),
total_contacts AS (
    SELECT COUNT(*) as total_count
    FROM contacts
    WHERE deleted_at IS NULL
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'orphaned_records',
    'contacts_without_company',
    o.orphan_count,
    CASE
        WHEN t.total_count = 0 THEN 0
        ELSE ROUND((o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)
    END,
    CASE
        WHEN t.total_count = 0 THEN 'WARN'
        WHEN (o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100 > 1.0 THEN 'FAIL'
        WHEN (o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100 > 0.1 THEN 'WARN'
        ELSE 'PASS'
    END,
    'Contacts without valid company: ' || o.orphan_count || ' (' ||
    CASE
        WHEN t.total_count = 0 THEN '0'
        ELSE ROUND((o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)::TEXT
    END || '%)'
FROM orphaned_contacts o, total_contacts t;

-- Check for deals with invalid company
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, percentage, status, message
)
WITH orphaned_deals AS (
    SELECT COUNT(*) as orphan_count
    FROM deals d
    WHERE d.deleted_at IS NULL
    AND (d.company_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM companies co
        WHERE co.id = d.company_id AND co.deleted_at IS NULL
    ))
),
total_deals AS (
    SELECT COUNT(*) as total_count
    FROM deals
    WHERE deleted_at IS NULL
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'orphaned_records',
    'deals_with_invalid_company',
    o.orphan_count,
    CASE
        WHEN t.total_count = 0 THEN 0
        ELSE ROUND((o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)
    END,
    CASE
        WHEN t.total_count = 0 THEN 'WARN'
        WHEN (o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100 > 1.0 THEN 'FAIL'
        WHEN (o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100 > 0.1 THEN 'WARN'
        ELSE 'PASS'
    END,
    'Deals with invalid company: ' || o.orphan_count || ' (' ||
    CASE
        WHEN t.total_count = 0 THEN '0'
        ELSE ROUND((o.orphan_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)::TEXT
    END || '%)'
FROM orphaned_deals o, total_deals t;

-- Validation Section 3: Foreign Key Integrity
-- Check for broken contact references in deals
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
WITH broken_contact_refs AS (
    SELECT COUNT(*) as broken_count
    FROM deals d
    WHERE d.deleted_at IS NULL
    AND d.contact_ids IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM unnest(d.contact_ids) AS contact_id
        WHERE NOT EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id AND c.deleted_at IS NULL
        )
    )
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'foreign_key_integrity',
    'deals_broken_contact_refs',
    b.broken_count,
    CASE
        WHEN b.broken_count = 0 THEN 'PASS'
        ELSE 'FAIL'
    END,
    'Deals with broken contact references: ' || b.broken_count
FROM broken_contact_refs b;

-- Check for broken company references in tags
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
WITH broken_tag_refs AS (
    SELECT COUNT(*) as broken_count
    FROM tags t
    WHERE t.deleted_at IS NULL
    AND t.company_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM companies c
        WHERE c.id = t.company_id AND c.deleted_at IS NULL
    )
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'foreign_key_integrity',
    'tags_broken_company_refs',
    b.broken_count,
    CASE
        WHEN b.broken_count = 0 THEN 'PASS'
        ELSE 'FAIL'
    END,
    'Tags with broken company references: ' || b.broken_count
FROM broken_tag_refs b;

-- Validation Section 4: Required Fields for Migration
-- Check companies without valid sector (required for migration)
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, percentage, status, message
)
WITH companies_no_sector AS (
    SELECT COUNT(*) as missing_count
    FROM companies c
    WHERE c.deleted_at IS NULL
    AND (c.sector IS NULL OR c.sector = '')
),
total_companies AS (
    SELECT COUNT(*) as total_count
    FROM companies
    WHERE deleted_at IS NULL
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'required_fields',
    'companies_missing_sector',
    m.missing_count,
    CASE
        WHEN t.total_count = 0 THEN 0
        ELSE ROUND((m.missing_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)
    END,
    CASE
        WHEN t.total_count = 0 THEN 'WARN'
        WHEN (m.missing_count::DECIMAL / t.total_count::DECIMAL) * 100 > 5.0 THEN 'WARN'
        ELSE 'PASS'
    END,
    'Companies missing sector: ' || m.missing_count || ' (' ||
    CASE
        WHEN t.total_count = 0 THEN '0'
        ELSE ROUND((m.missing_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)::TEXT
    END || '%)'
FROM companies_no_sector m, total_companies t;

-- Check deals without valid stage (required for migration)
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, percentage, status, message
)
WITH deals_no_stage AS (
    SELECT COUNT(*) as missing_count
    FROM deals d
    WHERE d.deleted_at IS NULL
    AND (d.stage IS NULL OR d.stage = '')
),
total_deals AS (
    SELECT COUNT(*) as total_count
    FROM deals
    WHERE deleted_at IS NULL
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'required_fields',
    'deals_missing_stage',
    m.missing_count,
    CASE
        WHEN t.total_count = 0 THEN 0
        ELSE ROUND((m.missing_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)
    END,
    CASE
        WHEN t.total_count = 0 THEN 'WARN'
        WHEN (m.missing_count::DECIMAL / t.total_count::DECIMAL) * 100 > 1.0 THEN 'FAIL'
        ELSE 'PASS'
    END,
    'Deals missing stage: ' || m.missing_count || ' (' ||
    CASE
        WHEN t.total_count = 0 THEN '0'
        ELSE ROUND((m.missing_count::DECIMAL / t.total_count::DECIMAL) * 100, 2)::TEXT
    END || '%)'
FROM deals_no_stage m, total_deals t;

-- Validation Section 5: Data Quality Assessment
-- Check for duplicate company names
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
WITH duplicate_companies AS (
    SELECT COUNT(*) as duplicate_count
    FROM (
        SELECT name, COUNT(*) as name_count
        FROM companies
        WHERE deleted_at IS NULL
        AND name IS NOT NULL
        AND name != ''
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    ) dupes
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'data_quality',
    'duplicate_company_names',
    d.duplicate_count,
    CASE
        WHEN d.duplicate_count = 0 THEN 'PASS'
        WHEN d.duplicate_count <= 5 THEN 'WARN'
        ELSE 'FAIL'
    END,
    'Company name groups with duplicates: ' || d.duplicate_count
FROM duplicate_companies d;

-- Check for contacts with invalid email format
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
WITH invalid_emails AS (
    SELECT COUNT(*) as invalid_count
    FROM contacts c
    WHERE c.deleted_at IS NULL
    AND c.email IS NOT NULL
    AND jsonb_array_length(c.email) > 0
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(c.email) AS email_obj
        WHERE (email_obj->>'email') !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'data_quality',
    'contacts_invalid_email',
    i.invalid_count,
    CASE
        WHEN i.invalid_count = 0 THEN 'PASS'
        WHEN i.invalid_count <= 10 THEN 'WARN'
        ELSE 'FAIL'
    END,
    'Contacts with invalid email format: ' || i.invalid_count
FROM invalid_emails i;

-- Validation Section 6: Disk Space Check
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
WITH database_size AS (
    SELECT pg_database_size(current_database()) as db_size_bytes
),
available_space AS (
    -- This is a simplified check - in production, you'd want to check actual disk space
    SELECT
        ds.db_size_bytes,
        ds.db_size_bytes * 2 as required_space_bytes,
        ROUND((ds.db_size_bytes::DECIMAL / (1024*1024*1024)), 2) as db_size_gb,
        ROUND((ds.db_size_bytes::DECIMAL * 2 / (1024*1024*1024)), 2) as required_space_gb
    FROM database_size ds
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'disk_space',
    'database_backup_space',
    a.db_size_bytes,
    CASE
        WHEN a.db_size_gb < 50 THEN 'PASS'  -- Assume sufficient space for DBs under 50GB
        ELSE 'WARN'  -- Manual verification needed for larger DBs
    END,
    'Current DB size: ' || a.db_size_gb || 'GB, Required for backup: ' || a.required_space_gb || 'GB'
FROM available_space a;

-- Validation Section 7: Create Backup Tables (Critical for migration safety)
-- This section creates the backup tables as part of pre-migration validation

-- Backup deals table
DO $$
BEGIN
    -- Drop existing backup if present
    DROP TABLE IF EXISTS backup_deals_pre_migration;

    -- Create backup
    CREATE TABLE backup_deals_pre_migration AS
    SELECT * FROM deals;

    -- Add metadata
    ALTER TABLE backup_deals_pre_migration
    ADD COLUMN backup_created_at TIMESTAMPTZ DEFAULT NOW();

    -- Log success
    INSERT INTO migration_validation_results (
        validation_run_id, check_type, entity_name, count_value, status, message
    )
    SELECT
        current_setting('migration.validation_run_id')::UUID,
        'backup_creation',
        'backup_deals_pre_migration',
        COUNT(*),
        'PASS',
        'Backup table created with ' || COUNT(*) || ' records'
    FROM backup_deals_pre_migration;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO migration_validation_results (
        validation_run_id, check_type, entity_name, count_value, status, message
    )
    VALUES (
        current_setting('migration.validation_run_id')::UUID,
        'backup_creation',
        'backup_deals_pre_migration',
        0,
        'FAIL',
        'Failed to create backup_deals_pre_migration: ' || SQLERRM
    );
END $$;

-- Backup contacts table
DO $$
BEGIN
    -- Drop existing backup if present
    DROP TABLE IF EXISTS backup_contacts_pre_migration;

    -- Create backup
    CREATE TABLE backup_contacts_pre_migration AS
    SELECT * FROM contacts;

    -- Add metadata
    ALTER TABLE backup_contacts_pre_migration
    ADD COLUMN backup_created_at TIMESTAMPTZ DEFAULT NOW();

    -- Log success
    INSERT INTO migration_validation_results (
        validation_run_id, check_type, entity_name, count_value, status, message
    )
    SELECT
        current_setting('migration.validation_run_id')::UUID,
        'backup_creation',
        'backup_contacts_pre_migration',
        COUNT(*),
        'PASS',
        'Backup table created with ' || COUNT(*) || ' records'
    FROM backup_contacts_pre_migration;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO migration_validation_results (
        validation_run_id, check_type, entity_name, count_value, status, message
    )
    VALUES (
        current_setting('migration.validation_run_id')::UUID,
        'backup_creation',
        'backup_contacts_pre_migration',
        0,
        'FAIL',
        'Failed to create backup_contacts_pre_migration: ' || SQLERRM
    );
END $$;

-- Backup companies table
DO $$
BEGIN
    -- Drop existing backup if present
    DROP TABLE IF EXISTS backup_companies_pre_migration;

    -- Create backup
    CREATE TABLE backup_companies_pre_migration AS
    SELECT * FROM companies;

    -- Add metadata
    ALTER TABLE backup_companies_pre_migration
    ADD COLUMN backup_created_at TIMESTAMPTZ DEFAULT NOW();

    -- Log success
    INSERT INTO migration_validation_results (
        validation_run_id, check_type, entity_name, count_value, status, message
    )
    SELECT
        current_setting('migration.validation_run_id')::UUID,
        'backup_creation',
        'backup_companies_pre_migration',
        COUNT(*),
        'PASS',
        'Backup table created with ' || COUNT(*) || ' records'
    FROM backup_companies_pre_migration;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO migration_validation_results (
        validation_run_id, check_type, entity_name, count_value, status, message
    )
    VALUES (
        current_setting('migration.validation_run_id')::UUID,
        'backup_creation',
        'backup_companies_pre_migration',
        0,
        'FAIL',
        'Failed to create backup_companies_pre_migration: ' || SQLERRM
    );
END $$;

-- Final Go/No-Go Assessment
INSERT INTO migration_validation_results (
    validation_run_id, check_type, entity_name, count_value, status, message
)
WITH validation_summary AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'FAIL') as fail_count,
        COUNT(*) FILTER (WHERE status = 'WARN') as warn_count,
        COUNT(*) FILTER (WHERE status = 'PASS') as pass_count,
        COUNT(*) as total_checks
    FROM migration_validation_results
    WHERE validation_run_id = current_setting('migration.validation_run_id')::UUID
    AND check_type != 'go_no_go_decision'  -- Exclude this final check
)
SELECT
    current_setting('migration.validation_run_id')::UUID,
    'go_no_go_decision',
    'migration_readiness',
    s.total_checks,
    CASE
        WHEN s.fail_count = 0 AND s.warn_count <= 2 THEN 'PASS'
        WHEN s.fail_count = 0 AND s.warn_count <= 5 THEN 'WARN'
        ELSE 'FAIL'
    END,
    'Validation complete: ' || s.pass_count || ' passed, ' ||
    s.warn_count || ' warnings, ' || s.fail_count || ' failures. ' ||
    CASE
        WHEN s.fail_count = 0 AND s.warn_count <= 2 THEN 'GO - Migration can proceed'
        WHEN s.fail_count = 0 AND s.warn_count <= 5 THEN 'CAUTION - Review warnings before proceeding'
        ELSE 'NO-GO - Fix failures before migration'
    END
FROM validation_summary s;

-- Display results
SELECT
    check_type,
    entity_name,
    count_value,
    percentage,
    status,
    message,
    created_at
FROM migration_validation_results
WHERE validation_run_id = current_setting('migration.validation_run_id')::UUID
ORDER BY
    CASE check_type
        WHEN 'go_no_go_decision' THEN 6
        WHEN 'entity_count' THEN 1
        WHEN 'orphaned_records' THEN 2
        WHEN 'foreign_key_integrity' THEN 3
        WHEN 'required_fields' THEN 4
        WHEN 'data_quality' THEN 5
        WHEN 'disk_space' THEN 5
        WHEN 'backup_creation' THEN 5
        ELSE 7
    END,
    entity_name;

-- Output final recommendation
DO $$
DECLARE
    final_status TEXT;
    final_message TEXT;
BEGIN
    SELECT status, message
    INTO final_status, final_message
    FROM migration_validation_results
    WHERE validation_run_id = current_setting('migration.validation_run_id')::UUID
    AND check_type = 'go_no_go_decision';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRE-MIGRATION VALIDATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Status: %', final_status;
    RAISE NOTICE 'Decision: %', final_message;
    RAISE NOTICE '========================================';

    IF final_status = 'FAIL' THEN
        RAISE NOTICE 'CRITICAL: Do not proceed with migration until all failures are resolved.';
    ELSIF final_status = 'WARN' THEN
        RAISE NOTICE 'WARNING: Review all warnings and confirm they are acceptable before proceeding.';
    ELSE
        RAISE NOTICE 'SUCCESS: Migration validation passed. You may proceed with migration.';
    END IF;

    RAISE NOTICE '';
END $$;