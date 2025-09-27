-- =====================================================================
-- Migration History Reset for Consolidation
-- Date: 2025-01-27
-- Purpose: Reset migration tracking to single consolidated entry
-- =====================================================================

BEGIN;

-- 1. Create backup of current migration history
CREATE TABLE IF NOT EXISTS public.migration_history_backup_20250127 AS
SELECT * FROM supabase_migrations.schema_migrations;

-- 2. Verify backup was created
DO $$
DECLARE
    backup_count INTEGER;
    original_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM supabase_migrations.schema_migrations;
    SELECT COUNT(*) INTO backup_count FROM public.migration_history_backup_20250127;

    IF backup_count != original_count THEN
        RAISE EXCEPTION 'Backup verification failed. Original: %, Backup: %', original_count, backup_count;
    END IF;

    RAISE NOTICE 'Backup verified: % migrations backed up', backup_count;
END $$;

-- 3. Clear current migration history
TRUNCATE TABLE supabase_migrations.schema_migrations;

-- 4. Insert consolidated migration entry
-- Note: Supabase migration table doesn't have executed_at column
INSERT INTO supabase_migrations.schema_migrations (
    version,
    name,
    statements,
    created_by,
    idempotency_key
)
VALUES (
    '20250127000000',
    'consolidated_fresh_schema',
    ARRAY['-- Consolidated migration containing entire schema'],
    'manual_consolidation',
    'consolidation_' || gen_random_uuid()::text
);

-- 5. Verify single entry exists
DO $$
DECLARE
    migration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migration_count FROM supabase_migrations.schema_migrations;

    IF migration_count != 1 THEN
        RAISE EXCEPTION 'Migration count is %, expected 1', migration_count;
    END IF;

    RAISE NOTICE 'Migration history reset successful: % migration registered', migration_count;
END $$;

-- 6. Create audit trail
CREATE TABLE IF NOT EXISTS public.migration_consolidation_audit (
    id SERIAL PRIMARY KEY,
    consolidation_date TIMESTAMPTZ DEFAULT now(),
    previous_migration_count INTEGER,
    new_migration_count INTEGER,
    backup_table_name TEXT,
    notes TEXT
);

INSERT INTO public.migration_consolidation_audit (
    previous_migration_count,
    new_migration_count,
    backup_table_name,
    notes
)
SELECT
    (SELECT COUNT(*) FROM public.migration_history_backup_20250127) as previous_migration_count,
    1 as new_migration_count,
    'public.migration_history_backup_20250127' as backup_table_name,
    'Consolidated 68 migrations into single baseline schema' as notes;

COMMIT;

-- =====================================================================
-- Post-Reset Verification
-- =====================================================================

-- Check current state
SELECT
    'Current Migration State' as status,
    version,
    name
FROM supabase_migrations.schema_migrations;

-- Verify backup exists
SELECT
    'Backup Migration Count' as status,
    COUNT(*) as count,
    MIN(version) as earliest,
    MAX(version) as latest
FROM public.migration_history_backup_20250127;

-- Show audit trail
SELECT * FROM public.migration_consolidation_audit
ORDER BY consolidation_date DESC
LIMIT 1;