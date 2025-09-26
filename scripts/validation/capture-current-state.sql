-- Capture Current State Script
-- Task 5.1a: Captures comprehensive system state before migration
-- Used for comparison and rollback verification

-- Set up capture environment
SET work_mem = '256MB';
SET statement_timeout = '30min';

-- Create state capture tables if not exists
CREATE TABLE IF NOT EXISTS migration_state_capture (
    id SERIAL PRIMARY KEY,
    capture_run_id UUID DEFAULT gen_random_uuid(),
    capture_type TEXT NOT NULL,
    entity_name TEXT,
    state_key TEXT,
    state_value TEXT,
    numeric_value BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear previous capture for this run
DO $$
DECLARE
    current_capture_id UUID := gen_random_uuid();
BEGIN
    -- Store the capture ID for this session
    PERFORM set_config('migration.capture_run_id', current_capture_id::text, false);

    RAISE NOTICE 'Starting state capture with ID: %', current_capture_id;
END $$;

-- ===========================================
-- Section 1: Record Counts and Totals
-- ===========================================

-- Companies count and key metrics
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'companies',
    'total_active',
    COUNT(*)::TEXT,
    COUNT(*)
FROM companies
WHERE deleted_at IS NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'companies',
    'total_deleted',
    COUNT(*)::TEXT,
    COUNT(*)
FROM companies
WHERE deleted_at IS NOT NULL;

-- Contacts count and key metrics
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'contacts',
    'total_active',
    COUNT(*)::TEXT,
    COUNT(*)
FROM contacts
WHERE deleted_at IS NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'contacts',
    'contacts_with_company',
    COUNT(*)::TEXT,
    COUNT(*)
FROM contacts
WHERE deleted_at IS NULL AND company_id IS NOT NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'contacts',
    'contacts_without_company',
    COUNT(*)::TEXT,
    COUNT(*)
FROM contacts
WHERE deleted_at IS NULL AND company_id IS NULL;

-- Deals count and key metrics
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'deals',
    'total_active',
    COUNT(*)::TEXT,
    COUNT(*)
FROM deals
WHERE deleted_at IS NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'deals',
    'deals_with_company',
    COUNT(*)::TEXT,
    COUNT(*)
FROM deals
WHERE deleted_at IS NULL AND company_id IS NOT NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'deals',
    'deals_with_contacts',
    COUNT(*)::TEXT,
    COUNT(*)
FROM deals
WHERE deleted_at IS NULL AND contact_ids IS NOT NULL AND jsonb_array_length(contact_ids) > 0;

-- Tasks count
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'tasks',
    'total_active',
    COUNT(*)::TEXT,
    COUNT(*)
FROM tasks
WHERE deleted_at IS NULL;

-- Notes count
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'contact_notes',
    'total_active',
    COUNT(*)::TEXT,
    COUNT(*)
FROM "contactNotes"
WHERE deleted_at IS NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'deal_notes',
    'total_active',
    COUNT(*)::TEXT,
    COUNT(*)
FROM "dealNotes"
WHERE deleted_at IS NULL;

-- Tags count
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'record_count',
    'tags',
    'total_active',
    COUNT(*)::TEXT,
    COUNT(*)
FROM tags
WHERE deleted_at IS NULL;

-- ===========================================
-- Section 2: Unique Values and Distributions
-- ===========================================

-- Unique companies per contact distribution
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'distribution',
    'contacts',
    'unique_companies',
    COUNT(DISTINCT company_id)::TEXT,
    COUNT(DISTINCT company_id)
FROM contacts
WHERE deleted_at IS NULL AND company_id IS NOT NULL;

-- Deal stages distribution
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'distribution',
    'deals',
    'stage_' || COALESCE(stage, 'null'),
    COUNT(*)::TEXT,
    COUNT(*)
FROM deals
WHERE deleted_at IS NULL
GROUP BY stage;

-- Company sectors distribution
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'distribution',
    'companies',
    'sector_' || COALESCE(sector, 'null'),
    COUNT(*)::TEXT,
    COUNT(*)
FROM companies
WHERE deleted_at IS NULL
GROUP BY sector;

-- ===========================================
-- Section 3: Financial and Business Metrics
-- ===========================================

-- Deal value metrics
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'business_metric',
    'deals',
    'total_value',
    COALESCE(SUM(amount), 0)::TEXT,
    COALESCE(SUM(amount), 0)
FROM deals
WHERE deleted_at IS NULL AND amount IS NOT NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'business_metric',
    'deals',
    'average_value',
    COALESCE(ROUND(AVG(amount), 2), 0)::TEXT,
    COALESCE(ROUND(AVG(amount), 2), 0)
FROM deals
WHERE deleted_at IS NULL AND amount IS NOT NULL;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'business_metric',
    'deals',
    'deals_with_amount',
    COUNT(*)::TEXT,
    COUNT(*)
FROM deals
WHERE deleted_at IS NULL AND amount IS NOT NULL;

-- ===========================================
-- Section 4: Relationship Mapping
-- ===========================================

-- Contact-Company relationships (to be preserved in junction table)
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
WITH contact_company_mapping AS (
    SELECT
        c.id as contact_id,
        c.company_id,
        co.name as company_name,
        c.name as contact_name,
        c.is_primary_contact
    FROM contacts c
    JOIN companies co ON c.company_id = co.id
    WHERE c.deleted_at IS NULL AND co.deleted_at IS NULL
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'relationship_mapping',
    'contact_company',
    'contact_' || contact_id || '_company_' || company_id,
    json_build_object(
        'contact_id', contact_id,
        'company_id', company_id,
        'contact_name', contact_name,
        'company_name', company_name,
        'is_primary_contact', COALESCE(is_primary_contact, false)
    )::TEXT,
    contact_id
FROM contact_company_mapping;

-- Deal-Contact relationships (contact_ids arrays)
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
WITH deal_contact_mapping AS (
    SELECT
        d.id as deal_id,
        d.contact_ids,
        d.company_id,
        d.stage,
        d.amount
    FROM deals d
    WHERE d.deleted_at IS NULL
    AND d.contact_ids IS NOT NULL
    AND jsonb_array_length(d.contact_ids) > 0
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'relationship_mapping',
    'deal_contact',
    'deal_' || deal_id,
    json_build_object(
        'deal_id', deal_id,
        'contact_ids', contact_ids,
        'company_id', company_id,
        'stage', stage,
        'amount', amount
    )::TEXT,
    deal_id
FROM deal_contact_mapping;

-- ===========================================
-- Section 5: Schema and Constraint Information
-- ===========================================

-- Capture current table schemas
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'schema_info',
    'companies',
    'columns',
    string_agg(
        column_name || ':' || data_type ||
        CASE WHEN is_nullable = 'YES' THEN ':nullable' ELSE ':not_null' END,
        ',' ORDER BY ordinal_position
    )
FROM information_schema.columns
WHERE table_name = 'companies' AND table_schema = 'public';

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'schema_info',
    'contacts',
    'columns',
    string_agg(
        column_name || ':' || data_type ||
        CASE WHEN is_nullable = 'YES' THEN ':nullable' ELSE ':not_null' END,
        ',' ORDER BY ordinal_position
    )
FROM information_schema.columns
WHERE table_name = 'contacts' AND table_schema = 'public';

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'schema_info',
    'deals',
    'columns',
    string_agg(
        column_name || ':' || data_type ||
        CASE WHEN is_nullable = 'YES' THEN ':nullable' ELSE ':not_null' END,
        ',' ORDER BY ordinal_position
    )
FROM information_schema.columns
WHERE table_name = 'deals' AND table_schema = 'public';

-- Capture current indexes
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'schema_info',
    t.tablename,
    'indexes',
    string_agg(i.indexname, ',' ORDER BY i.indexname)
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('companies', 'contacts', 'deals', 'tasks', 'contactNotes', 'dealNotes', 'tags')
GROUP BY t.tablename;

-- Capture current foreign key constraints
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'schema_info',
    tc.table_name,
    'foreign_keys',
    string_agg(
        tc.constraint_name || ':' || kcu.column_name || '->' ||
        ccu.table_name || '.' || ccu.column_name,
        ',' ORDER BY tc.constraint_name
    )
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('companies', 'contacts', 'deals', 'tasks', 'contactNotes', 'dealNotes', 'tags')
GROUP BY tc.table_name;

-- ===========================================
-- Section 6: RLS Policies and Security
-- ===========================================

-- Capture current RLS policies
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'security_info',
    c.relname,
    'rls_policies',
    string_agg(
        p.polname || ':' || p.polcmd || ':' ||
        CASE WHEN p.polpermissive THEN 'permissive' ELSE 'restrictive' END,
        ',' ORDER BY p.polname
    )
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname IN ('companies', 'contacts', 'deals', 'tasks', 'contactNotes', 'dealNotes', 'tags')
GROUP BY c.relname;

-- Capture current RLS enabled status
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'security_info',
    tablename,
    'rls_enabled',
    CASE WHEN rowsecurity THEN 'enabled' ELSE 'disabled' END
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE t.schemaname = 'public'
AND t.tablename IN ('companies', 'contacts', 'deals', 'tasks', 'contactNotes', 'dealNotes', 'tags');

-- ===========================================
-- Section 7: Data Quality Snapshots
-- ===========================================

-- Sample of companies data
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'data_sample',
    'companies',
    'sample_records',
    json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'sector', sector,
            'size', size,
            'created_at', created_at,
            'deleted_at', deleted_at
        ) ORDER BY id
    )::TEXT
FROM (
    SELECT * FROM companies ORDER BY id LIMIT 5
) sample;

-- Sample of contacts data
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'data_sample',
    'contacts',
    'sample_records',
    json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'company_id', company_id,
            'email', email,
            'phone', phone,
            'is_primary_contact', is_primary_contact,
            'created_at', created_at,
            'deleted_at', deleted_at
        ) ORDER BY id
    )::TEXT
FROM (
    SELECT * FROM contacts ORDER BY id LIMIT 5
) sample;

-- Sample of deals data
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'data_sample',
    'deals',
    'sample_records',
    json_agg(
        json_build_object(
            'id', id,
            'title', title,
            'stage', stage,
            'amount', amount,
            'company_id', company_id,
            'contact_ids', contact_ids,
            'created_at', created_at,
            'deleted_at', deleted_at
        ) ORDER BY id
    )::TEXT
FROM (
    SELECT * FROM deals ORDER BY id LIMIT 5
) sample;

-- ===========================================
-- Section 8: System Information
-- ===========================================

-- Database version and settings
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'system_info',
    'database',
    'version',
    version();

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'system_info',
    'database',
    'current_database',
    current_database();

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'system_info',
    'database',
    'current_user',
    current_user;

INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'system_info',
    'database',
    'timezone',
    current_setting('timezone');

-- Database size information
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'system_info',
    'database',
    'size_bytes',
    pg_database_size(current_database())::TEXT,
    pg_database_size(current_database());

-- ===========================================
-- Section 9: Summary and Verification
-- ===========================================

-- Create summary of captured state
INSERT INTO migration_state_capture (
    capture_run_id, capture_type, entity_name, state_key, state_value, numeric_value
)
SELECT
    current_setting('migration.capture_run_id')::UUID,
    'summary',
    'capture_complete',
    'total_records_captured',
    COUNT(*)::TEXT,
    COUNT(*)
FROM migration_state_capture
WHERE capture_run_id = current_setting('migration.capture_run_id')::UUID;

-- Display capture summary
SELECT
    capture_type,
    entity_name,
    COUNT(*) as items_captured,
    SUM(COALESCE(numeric_value, 0)) as total_numeric_value
FROM migration_state_capture
WHERE capture_run_id = current_setting('migration.capture_run_id')::UUID
GROUP BY capture_type, entity_name
ORDER BY capture_type, entity_name;

-- Display key metrics
SELECT
    'CAPTURE SUMMARY' as section,
    state_key as metric,
    state_value as value
FROM migration_state_capture
WHERE capture_run_id = current_setting('migration.capture_run_id')::UUID
AND capture_type = 'record_count'
AND entity_name IN ('companies', 'contacts', 'deals')
ORDER BY
    CASE entity_name
        WHEN 'companies' THEN 1
        WHEN 'contacts' THEN 2
        WHEN 'deals' THEN 3
        ELSE 4
    END,
    state_key;

-- Final output
DO $$
DECLARE
    capture_id UUID := current_setting('migration.capture_run_id')::UUID;
    total_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records
    FROM migration_state_capture
    WHERE capture_run_id = capture_id;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CURRENT STATE CAPTURE COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Capture Run ID: %', capture_id;
    RAISE NOTICE 'Total Records Captured: %', total_records;
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '';
    RAISE NOTICE 'State captured for tables:';
    RAISE NOTICE '- companies, contacts, deals';
    RAISE NOTICE '- tasks, contactNotes, dealNotes, tags';
    RAISE NOTICE '';
    RAISE NOTICE 'Captured information includes:';
    RAISE NOTICE '- Record counts and distributions';
    RAISE NOTICE '- Relationship mappings';
    RAISE NOTICE '- Schema and constraint definitions';
    RAISE NOTICE '- RLS policies and security settings';
    RAISE NOTICE '- Data samples for verification';
    RAISE NOTICE '- System configuration';
    RAISE NOTICE '';
    RAISE NOTICE 'Use this capture for:';
    RAISE NOTICE '- Pre/post migration comparison';
    RAISE NOTICE '- Rollback verification';
    RAISE NOTICE '- Data integrity validation';
    RAISE NOTICE '========================================';
END $$;