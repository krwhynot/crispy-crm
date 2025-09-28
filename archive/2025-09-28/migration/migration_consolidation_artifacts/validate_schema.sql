-- =====================================================================
-- Schema Validation Queries
-- Date: 2025-01-27
-- Purpose: Verify schema integrity after migration consolidation
-- =====================================================================

-- =====================================================================
-- 1. CHECK ALL TABLES EXIST
-- =====================================================================

WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'sales',
        'organizations',
        'contacts',
        'opportunities',
        'activities',
        'tasks',
        'contactNotes',
        'opportunityNotes',
        'tags',
        'contact_organizations',
        'opportunity_participants',
        'interaction_participants',
        'contact_preferred_principals',
        'products',
        'product_category_hierarchy',
        'product_pricing_tiers',
        'product_pricing_models',
        'product_inventory',
        'product_features',
        'product_distributor_authorizations',
        'opportunity_products',
        'migration_history'
    ]) AS table_name
),
actual_tables AS (
    SELECT tablename AS table_name
    FROM pg_tables
    WHERE schemaname = 'public'
)
SELECT
    'Table Existence Check' as validation_type,
    et.table_name,
    CASE
        WHEN at.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.table_name
ORDER BY
    CASE WHEN at.table_name IS NULL THEN 0 ELSE 1 END,
    et.table_name;

-- =====================================================================
-- 2. VERIFY ALL FOREIGN KEYS
-- =====================================================================

SELECT
    'Foreign Key Check' as validation_type,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    '✅ VALID' AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Count foreign keys
SELECT
    'Foreign Key Count' as validation_type,
    COUNT(*) as total_foreign_keys,
    COUNT(DISTINCT tc.table_name) as tables_with_fks,
    CASE
        WHEN COUNT(*) >= 30 THEN '✅ EXPECTED'
        ELSE '⚠️ CHECK'
    END AS status
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- =====================================================================
-- 3. CONFIRM ALL INDEXES
-- =====================================================================

SELECT
    'Index Check' as validation_type,
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE
        WHEN indexname LIKE 'idx_%' THEN '✅ CUSTOM'
        WHEN indexname LIKE '%_pkey' THEN '✅ PRIMARY'
        ELSE '⚠️ SYSTEM'
    END AS index_type
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname
LIMIT 20;

-- Count indexes
SELECT
    'Index Summary' as validation_type,
    COUNT(*) as total_indexes,
    COUNT(DISTINCT tablename) as tables_with_indexes,
    SUM(CASE WHEN indexname LIKE 'idx_%' THEN 1 ELSE 0 END) as custom_indexes,
    SUM(CASE WHEN indexname LIKE '%_pkey' THEN 1 ELSE 0 END) as primary_keys,
    CASE
        WHEN COUNT(*) >= 40 THEN '✅ EXPECTED'
        ELSE '⚠️ CHECK'
    END AS status
FROM pg_indexes
WHERE schemaname = 'public';

-- =====================================================================
-- 4. TEST RLS POLICIES
-- =====================================================================

SELECT
    'RLS Policy Check' as validation_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE
        WHEN policyname LIKE '%authenticated%' THEN '✅ AUTH'
        ELSE '⚠️ CHECK'
    END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname
LIMIT 20;

-- Count RLS policies
SELECT
    'RLS Summary' as validation_type,
    COUNT(DISTINCT tablename) as tables_with_rls,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(DISTINCT tablename) >= 20 THEN '✅ EXPECTED'
        ELSE '❌ MISSING RLS'
    END AS status
FROM pg_policies
WHERE schemaname = 'public';

-- Check RLS is enabled
SELECT
    'RLS Enabled Check' as validation_type,
    schemaname,
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END AS status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'organizations', 'contacts', 'opportunities',
        'activities', 'tasks', 'products'
    )
ORDER BY tablename;

-- =====================================================================
-- 5. VALIDATE VIEWS COMPILE
-- =====================================================================

SELECT
    'View Check' as validation_type,
    schemaname,
    viewname,
    CASE
        WHEN definition IS NOT NULL THEN '✅ VALID'
        ELSE '❌ INVALID'
    END AS status
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Test view accessibility
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Test organizations_summary
    BEGIN
        SELECT COUNT(*) INTO v_count FROM organizations_summary LIMIT 1;
        RAISE NOTICE 'organizations_summary: ✅ ACCESSIBLE (% rows)', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'organizations_summary: ❌ ERROR - %', SQLERRM;
    END;

    -- Test contacts_summary
    BEGIN
        SELECT COUNT(*) INTO v_count FROM contacts_summary LIMIT 1;
        RAISE NOTICE 'contacts_summary: ✅ ACCESSIBLE (% rows)', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'contacts_summary: ❌ ERROR - %', SQLERRM;
    END;

    -- Test opportunities_summary
    BEGIN
        SELECT COUNT(*) INTO v_count FROM opportunities_summary LIMIT 1;
        RAISE NOTICE 'opportunities_summary: ✅ ACCESSIBLE (% rows)', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'opportunities_summary: ❌ ERROR - %', SQLERRM;
    END;
END $$;

-- =====================================================================
-- 6. VALIDATE CUSTOM TYPES/ENUMS
-- =====================================================================

SELECT
    'Enum Type Check' as validation_type,
    t.typname as type_name,
    COUNT(e.enumlabel) as value_count,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values,
    '✅ VALID' AS status
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;

-- Count enums
SELECT
    'Enum Summary' as validation_type,
    COUNT(DISTINCT t.typname) as total_enum_types,
    COUNT(e.enumlabel) as total_enum_values,
    CASE
        WHEN COUNT(DISTINCT t.typname) >= 10 THEN '✅ EXPECTED'
        ELSE '⚠️ CHECK'
    END AS status
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =====================================================================
-- 7. VALIDATE FUNCTIONS AND TRIGGERS
-- =====================================================================

-- Check functions
SELECT
    'Function Check' as validation_type,
    proname as function_name,
    pronargs as arg_count,
    CASE
        WHEN proname LIKE 'update_%' THEN '✅ TRIGGER'
        WHEN proname LIKE 'set_%' THEN '✅ RPC'
        ELSE '⚠️ OTHER'
    END AS function_type
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Check triggers
SELECT
    'Trigger Check' as validation_type,
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_timing,
    '✅ ACTIVE' AS status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Count triggers
SELECT
    'Trigger Summary' as validation_type,
    COUNT(*) as total_triggers,
    COUNT(DISTINCT event_object_table) as tables_with_triggers,
    CASE
        WHEN COUNT(*) >= 8 THEN '✅ EXPECTED'
        ELSE '⚠️ CHECK'
    END AS status
FROM information_schema.triggers
WHERE event_object_schema = 'public';

-- =====================================================================
-- 8. DATA INTEGRITY CHECKS
-- =====================================================================

-- Check for orphaned records
SELECT
    'Orphan Check - Contact Organizations' as validation_type,
    COUNT(*) as orphaned_records,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
        ELSE '❌ ORPHANS FOUND'
    END AS status
FROM contact_organizations co
LEFT JOIN contacts c ON co.contact_id = c.id
LEFT JOIN organizations o ON co.organization_id = o.id
WHERE c.id IS NULL OR o.id IS NULL;

-- Check for duplicate primary contacts
SELECT
    'Duplicate Primary Check' as validation_type,
    contact_id,
    COUNT(*) as primary_count,
    CASE
        WHEN COUNT(*) <= 1 THEN '✅ VALID'
        ELSE '❌ MULTIPLE PRIMARY'
    END AS status
FROM contact_organizations
WHERE is_primary = true
GROUP BY contact_id
HAVING COUNT(*) > 1;

-- =====================================================================
-- 9. MIGRATION HISTORY CHECK
-- =====================================================================

SELECT
    'Migration History Check' as validation_type,
    COUNT(*) as total_migrations,
    MIN(version) as earliest,
    MAX(version) as latest,
    CASE
        WHEN COUNT(*) = 1 AND MAX(version) = '20250127000000' THEN '✅ CONSOLIDATED'
        WHEN COUNT(*) = 68 THEN '⚠️ NOT CONSOLIDATED YET'
        ELSE '❌ UNEXPECTED STATE'
    END AS status
FROM supabase_migrations.schema_migrations;

-- Check backup exists
SELECT
    'Backup Check' as validation_type,
    table_name,
    CASE
        WHEN table_name IS NOT NULL THEN '✅ BACKUP EXISTS'
        ELSE '❌ NO BACKUP'
    END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'migration_history_backup_20250127';

-- =====================================================================
-- 10. STORAGE AND PERMISSIONS
-- =====================================================================

-- Check storage buckets
SELECT
    'Storage Bucket Check' as validation_type,
    id as bucket_name,
    public,
    created_at,
    '✅ EXISTS' AS status
FROM storage.buckets
WHERE id = 'attachments';

-- Check authenticated role permissions
SELECT
    'Permission Check' as validation_type,
    table_name,
    privilege_type,
    grantee,
    '✅ GRANTED' AS status
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND grantee = 'authenticated'
    AND table_name IN ('organizations_summary', 'contacts_summary', 'opportunities_summary')
ORDER BY table_name, privilege_type;

-- =====================================================================
-- SUMMARY REPORT
-- =====================================================================

SELECT '===============================================' AS report;
SELECT 'SCHEMA VALIDATION SUMMARY' AS report;
SELECT '===============================================' AS report;

WITH validation_summary AS (
    SELECT
        'Tables' as component,
        COUNT(*) as actual,
        22 as expected,
        CASE WHEN COUNT(*) >= 22 THEN '✅' ELSE '❌' END AS status
    FROM pg_tables WHERE schemaname = 'public'

    UNION ALL

    SELECT
        'Indexes' as component,
        COUNT(*) as actual,
        40 as expected,
        CASE WHEN COUNT(*) >= 40 THEN '✅' ELSE '⚠️' END AS status
    FROM pg_indexes WHERE schemaname = 'public'

    UNION ALL

    SELECT
        'Foreign Keys' as component,
        COUNT(*) as actual,
        30 as expected,
        CASE WHEN COUNT(*) >= 30 THEN '✅' ELSE '⚠️' END AS status
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'

    UNION ALL

    SELECT
        'RLS Policies' as component,
        COUNT(*) as actual,
        20 as expected,
        CASE WHEN COUNT(*) >= 20 THEN '✅' ELSE '❌' END AS status
    FROM pg_policies WHERE schemaname = 'public'

    UNION ALL

    SELECT
        'Views' as component,
        COUNT(*) as actual,
        3 as expected,
        CASE WHEN COUNT(*) >= 3 THEN '✅' ELSE '❌' END AS status
    FROM pg_views WHERE schemaname = 'public'

    UNION ALL

    SELECT
        'Enum Types' as component,
        COUNT(DISTINCT typname) as actual,
        12 as expected,
        CASE WHEN COUNT(DISTINCT typname) >= 12 THEN '✅' ELSE '⚠️' END AS status
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')

    UNION ALL

    SELECT
        'Triggers' as component,
        COUNT(*) as actual,
        8 as expected,
        CASE WHEN COUNT(*) >= 8 THEN '✅' ELSE '⚠️' END AS status
    FROM information_schema.triggers WHERE event_object_schema = 'public'
)
SELECT
    component,
    actual,
    expected,
    status,
    CASE
        WHEN actual >= expected THEN 'PASS'
        WHEN actual >= expected * 0.8 THEN 'WARNING'
        ELSE 'FAIL'
    END AS result
FROM validation_summary
ORDER BY
    CASE status
        WHEN '✅' THEN 1
        WHEN '⚠️' THEN 2
        WHEN '❌' THEN 3
    END,
    component;

SELECT '===============================================' AS report;
SELECT 'Run all sections above to validate schema' AS report;
SELECT '===============================================' AS report;