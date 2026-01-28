-- Migration: Restore unique constraint on organization name
-- Purpose: Re-enable case-insensitive unique constraint that was dropped on 2025-12-23
-- Date: 2026-01-27
-- Context: This constraint was originally added in migration 20251122232134 but was temporarily
--          dropped to allow duplicate creation for testing. Now restoring it after cleanup.

-- ========================================
-- Pre-flight check: Verify no duplicates exist
-- ========================================
DO $$
DECLARE
    duplicate_count INTEGER;
    duplicate_record RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESTORING UNIQUE CONSTRAINT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Pre-flight check: Verifying no duplicates exist...';

    -- Count duplicates (case-insensitive, non-deleted only)
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT LOWER(name) as lower_name, COUNT(*) as cnt
        FROM organizations
        WHERE deleted_at IS NULL
        GROUP BY LOWER(name)
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'ERROR: DUPLICATE ORGANIZATIONS DETECTED';
        RAISE NOTICE '========================================';

        FOR duplicate_record IN
            SELECT o.id, o.name, o.created_at, o.sales_id
            FROM organizations o
            WHERE deleted_at IS NULL
            AND LOWER(name) IN (
                SELECT LOWER(name)
                FROM organizations
                WHERE deleted_at IS NULL
                GROUP BY LOWER(name)
                HAVING COUNT(*) > 1
            )
            ORDER BY LOWER(name), created_at
        LOOP
            RAISE NOTICE 'ID: %, Name: "%" Created: %, Sales ID: %',
                duplicate_record.id,
                duplicate_record.name,
                duplicate_record.created_at,
                duplicate_record.sales_id;
        END LOOP;

        RAISE NOTICE '';
        RAISE NOTICE 'Cannot restore unique constraint: % duplicate organization name(s) found.',
            duplicate_count;
        RAISE NOTICE 'Please run cleanup migration first: 20260127210438_cleanup_current_duplicates_and_test_data.sql';
        RAISE NOTICE '========================================';

        RAISE EXCEPTION 'Pre-flight check failed: % duplicate organization name(s) found. Resolve duplicates before restoring constraint.', duplicate_count;
    ELSE
        RAISE NOTICE '✓ No duplicate organization names found';
        RAISE NOTICE '✓ Safe to proceed with constraint creation';
    END IF;
END $$;

-- ========================================
-- Create case-insensitive unique partial index
-- ========================================
-- This index enforces uniqueness on LOWER(name) for non-deleted records only
-- Matches the original constraint from migration 20251122232134
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_unique_idx
ON organizations (LOWER(name))
WHERE deleted_at IS NULL;

-- ========================================
-- Add explanatory comment
-- ========================================
COMMENT ON INDEX organizations_name_unique_idx IS
'Ensures organization names are unique (case-insensitive). Only applies to non-deleted records. Originally added 2025-11-22, dropped 2025-12-23, restored 2026-01-27.';

-- ========================================
-- Post-creation verification
-- ========================================
DO $$
DECLARE
    index_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Verifying constraint creation...';

    -- Verify index exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'organizations'
          AND indexname = 'organizations_name_unique_idx'
    ) INTO index_exists;

    IF index_exists THEN
        RAISE NOTICE '✓ Unique constraint successfully restored';
        RAISE NOTICE '✓ Index: organizations_name_unique_idx';
        RAISE NOTICE '✓ Constraint: UNIQUE (LOWER(name)) WHERE deleted_at IS NULL';
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'CONSTRAINT RESTORATION COMPLETE';
        RAISE NOTICE '========================================';
    ELSE
        RAISE EXCEPTION 'Index creation failed: organizations_name_unique_idx not found';
    END IF;
END $$;
