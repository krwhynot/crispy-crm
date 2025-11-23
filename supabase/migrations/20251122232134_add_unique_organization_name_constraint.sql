-- Migration: Add unique constraint on organization name
-- Purpose: Prevent duplicate organization names (case-insensitive)
-- Only applies to non-deleted records

-- Step 1: Report existing duplicates (for manual review)
-- This creates a temporary view to help identify duplicates before adding constraint
DO $$
DECLARE
    duplicate_count INTEGER;
    duplicate_record RECORD;
BEGIN
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
        RAISE NOTICE '========================================';
        RAISE NOTICE 'DUPLICATE ORGANIZATIONS DETECTED: %', duplicate_count;
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
            RAISE NOTICE 'ID: %, Name: %, Created: %, Sales ID: %',
                duplicate_record.id,
                duplicate_record.name,
                duplicate_record.created_at,
                duplicate_record.sales_id;
        END LOOP;

        RAISE NOTICE '========================================';
        RAISE NOTICE 'Please review and merge/delete duplicates before re-running migration.';
        RAISE NOTICE 'To soft-delete: UPDATE organizations SET deleted_at = NOW() WHERE id = <id>';
        RAISE NOTICE '========================================';

        -- Fail the migration so duplicates can be reviewed
        RAISE EXCEPTION 'Cannot add unique constraint: % duplicate organization name(s) found. Please resolve duplicates first.', duplicate_count;
    ELSE
        RAISE NOTICE 'No duplicate organization names found. Proceeding with constraint creation.';
    END IF;
END $$;

-- Step 2: Create case-insensitive unique partial index
-- Only enforces uniqueness for non-deleted records
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_unique_idx
ON organizations (LOWER(name))
WHERE deleted_at IS NULL;

-- Step 3: Add a comment explaining the constraint
COMMENT ON INDEX organizations_name_unique_idx IS
'Ensures organization names are unique (case-insensitive). Only applies to non-deleted records.';
