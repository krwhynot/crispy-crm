-- Verification Queries

-- 1. Check backup tables exist
SELECT
    'migration_history_backup_20250127' as backup_table,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FAILED' END as status
FROM public.migration_history_backup_20250127
UNION ALL
SELECT
    'custom_migration_backup_20250127' as backup_table,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) >= 0 THEN 'OK' ELSE 'FAILED' END as status
FROM public.custom_migration_backup_20250127;

-- 2. Compare migration counts
WITH original AS (
    SELECT COUNT(*) as count FROM supabase_migrations.schema_migrations
),
backup AS (
    SELECT COUNT(*) as count FROM public.migration_history_backup_20250127
)
SELECT
    'Migration Count Match' as check_name,
    o.count = b.count as matches,
    o.count as original_count,
    b.count as backup_count
FROM original o, backup b;

-- 3. List all public schema tables
SELECT
    table_name,
    table_type,
    CASE
        WHEN table_name LIKE '%backup%' THEN 'BACKUP'
        WHEN table_name LIKE '%_view%' THEN 'VIEW'
        WHEN table_name LIKE '%_summary%' THEN 'VIEW'
        ELSE 'TABLE'
    END as category
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY category, table_name;
