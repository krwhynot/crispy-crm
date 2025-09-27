-- =====================================================================
-- Migration History Reset
-- Date: Fri Sep 26 18:56:04 CDT 2025
-- =====================================================================

BEGIN;

-- 1. Verify backup exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migration_history_backup_20250127'
    ) THEN
        RAISE EXCEPTION 'Backup table % does not exist. Run backup first!', 'migration_history_backup_20250127';
    END IF;
END $$;

-- 2. Clear current migration history
TRUNCATE TABLE supabase_migrations.schema_migrations;

-- 3. Insert consolidated migration entry
INSERT INTO supabase_migrations.schema_migrations (version, name, executed_at)
VALUES (
    '20250127000000',
    'consolidated_fresh_schema',
    now()
);

-- 4. Verify single entry
DO $$
DECLARE
    migration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migration_count FROM supabase_migrations.schema_migrations;

    IF migration_count != 1 THEN
        RAISE EXCEPTION 'Migration count is %, expected 1', migration_count;
    END IF;
END $$;

-- 5. Add audit entry
INSERT INTO public.migration_history (
    phase_number,
    phase_name,
    status,
    started_at,
    completed_at,
    rows_affected
) VALUES (
    '20250127_consolidation',
    'migration_system_cleanup',
    'completed',
    now(),
    now(),
    68
);

COMMIT;

-- =====================================================================
-- Verification
-- =====================================================================

SELECT
    'Current Migrations' as check_type,
    COUNT(*) as count,
    MIN(version) as first_version,
    MAX(version) as last_version
FROM supabase_migrations.schema_migrations

UNION ALL

SELECT
    'Backed Up Migrations' as check_type,
    COUNT(*) as count,
    MIN(version) as first_version,
    MAX(version) as last_version
FROM public.migration_history_backup_20250127;
