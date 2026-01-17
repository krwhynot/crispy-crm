-- ============================================================================
-- Migration: Add NOT NULL constraint to segments.created_by
-- ============================================================================
-- Audit Issue: DB-001 - Audit trail requires attribution for all records
-- Pattern: Backfill nulls before adding constraint (PostgreSQL best practice)
-- ============================================================================

-- Step 1: Backfill NULL created_by values with system user
-- Using the first admin user as the default attribution for historical records
-- If no admin exists yet (e.g., fresh install), use the first available user
DO $$
DECLARE
    v_user_id UUID;
    v_null_count INTEGER;
BEGIN
    -- Check if there are any NULL values
    SELECT COUNT(*) INTO v_null_count FROM segments WHERE created_by IS NULL;

    IF v_null_count > 0 THEN
        -- Try to find an admin user first
        SELECT user_id INTO v_user_id
        FROM sales
        WHERE role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1;

        -- Fall back to any user if no admin exists
        IF v_user_id IS NULL THEN
            SELECT user_id INTO v_user_id
            FROM sales
            ORDER BY created_at ASC
            LIMIT 1;
        END IF;

        -- Fall back to any auth user if no sales record exists
        IF v_user_id IS NULL THEN
            SELECT id INTO v_user_id
            FROM auth.users
            ORDER BY created_at ASC
            LIMIT 1;
        END IF;

        IF v_user_id IS NOT NULL THEN
            UPDATE segments SET created_by = v_user_id WHERE created_by IS NULL;
            RAISE NOTICE 'Backfilled % segment(s) with created_by = %', v_null_count, v_user_id;
        ELSE
            -- If still no user, delete the orphaned segments (they have no owner)
            DELETE FROM segments WHERE created_by IS NULL;
            RAISE NOTICE 'Deleted % orphaned segment(s) with no available user to assign', v_null_count;
        END IF;
    ELSE
        RAISE NOTICE 'No NULL created_by values in segments table';
    END IF;
END $$;

-- Step 2: Add NOT NULL constraint
-- This will fail if any NULL values remain (fail-fast principle)
ALTER TABLE segments ALTER COLUMN created_by SET NOT NULL;

-- Step 3: Add comment documenting the constraint
COMMENT ON COLUMN segments.created_by IS 'UUID of auth.users who created this segment. Required for audit trail.';
