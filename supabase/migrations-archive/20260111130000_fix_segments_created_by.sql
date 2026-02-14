-- ============================================================================
-- Migration: Add NOT NULL constraint to segments.created_by
-- ============================================================================
-- Audit Issue: DB-001 - Audit trail requires attribution for all records
-- Pattern: Backfill nulls before adding constraint (PostgreSQL best practice)
-- Note: During db reset, migrations run BEFORE seed, so no users may exist yet.
--       In that case, we skip the NOT NULL constraint and let seed.sql handle it.
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_null_count INTEGER;
    v_total_count INTEGER;
BEGIN
    -- Check segment counts
    SELECT COUNT(*) INTO v_total_count FROM segments;
    SELECT COUNT(*) INTO v_null_count FROM segments WHERE created_by IS NULL;

    RAISE NOTICE 'Segments: % total, % with NULL created_by', v_total_count, v_null_count;

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
            -- Now safe to add NOT NULL constraint
            ALTER TABLE segments ALTER COLUMN created_by SET NOT NULL;
            RAISE NOTICE 'Added NOT NULL constraint to segments.created_by';
        ELSE
            -- No user exists (likely during db reset before seed runs)
            -- Skip NOT NULL constraint - seed.sql will create segments with created_by
            -- Delete orphaned segments so seed.sql can create fresh ones
            DELETE FROM segments WHERE created_by IS NULL;
            RAISE NOTICE 'No users exist yet. Deleted % segment(s) pending recreation in seed.sql', v_null_count;
            -- Add NOT NULL constraint since table is now empty or all have created_by
            ALTER TABLE segments ALTER COLUMN created_by SET NOT NULL;
            RAISE NOTICE 'Added NOT NULL constraint to segments.created_by';
        END IF;
    ELSE
        -- No NULL values exist
        IF v_total_count = 0 THEN
            RAISE NOTICE 'Segments table is empty - adding NOT NULL constraint';
        ELSE
            RAISE NOTICE 'All segments already have created_by set';
        END IF;
        ALTER TABLE segments ALTER COLUMN created_by SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to segments.created_by';
    END IF;
END $$;

-- Add comment documenting the constraint
COMMENT ON COLUMN segments.created_by IS 'UUID of auth.users who created this segment. Required for audit trail.';
