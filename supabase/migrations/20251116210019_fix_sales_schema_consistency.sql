-- =====================================================================
-- Fix Sales Schema Consistency: Eliminate Duplicates & Add Computed Column
-- =====================================================================
-- Resolves:
-- 1. Duplicate Admin records (trigger + seed fallback both creating)
-- 2. Missing 'administrator' field (frontend expects it, DB doesn't have it)
-- 3. Orphaned sales records (no corresponding auth.users)
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Add Computed Column for Backward Compatibility
-- =====================================================================
-- Frontend expects 'administrator' boolean field
-- Database has 'role' enum ('admin', 'manager', 'rep')
-- Solution: Computed column maps role='admin' to administrator=true

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS administrator BOOLEAN
GENERATED ALWAYS AS (role = 'admin') STORED;

COMMENT ON COLUMN sales.administrator IS
  'Computed column for backward compatibility. Maps from role enum. Frontend should migrate to using role directly.';

-- =====================================================================
-- PART 2: Clean Up Duplicate Admin Records
-- =====================================================================
-- Issue: admin@test.com appears twice (trigger + seed fallback)
-- Strategy: Keep only sales records that have valid user_id in auth.users

-- First, identify duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) - 1 INTO duplicate_count
  FROM sales
  WHERE email = 'admin@test.com';

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate admin@test.com records - cleaning up', duplicate_count;
  END IF;
END $$;

-- Delete sales records with no corresponding auth.users (orphaned)
-- This handles duplicates created by seed fallback logic
DELETE FROM sales
WHERE id IN (
  SELECT s.id
  FROM sales s
  LEFT JOIN auth.users u ON s.user_id = u.id
  WHERE s.email = 'admin@test.com'
    AND u.id IS NULL  -- No matching auth.users record
);

-- =====================================================================
-- PART 3: Clean Up All Orphaned Sales Records
-- =====================================================================
-- Remove any sales records that don't have valid auth.users

DELETE FROM sales
WHERE user_id IS NOT NULL  -- Has a user_id set
  AND user_id NOT IN (SELECT id FROM auth.users WHERE deleted_at IS NULL);

-- Also remove sales records with NULL user_id (should never happen with trigger)
DELETE FROM sales
WHERE user_id IS NULL;

-- =====================================================================
-- PART 4: Ensure All Sales Records Have Names
-- =====================================================================
-- Backfill first_name/last_name from auth.users metadata where missing

UPDATE sales s
SET
  first_name = COALESCE(s.first_name, u.raw_user_meta_data->>'first_name', ''),
  last_name = COALESCE(s.last_name, u.raw_user_meta_data->>'last_name', '')
FROM auth.users u
WHERE s.user_id = u.id
  AND (s.first_name IS NULL OR s.first_name = '' OR s.last_name IS NULL OR s.last_name = '');

-- =====================================================================
-- PART 5: Verify 1:1 Mapping
-- =====================================================================
-- Ensure auth.users count matches sales count

DO $$
DECLARE
  auth_count INTEGER;
  sales_count INTEGER;
  missing_sales INTEGER;
BEGIN
  -- Count active users
  SELECT COUNT(*) INTO auth_count
  FROM auth.users
  WHERE deleted_at IS NULL;

  -- Count active sales
  SELECT COUNT(*) INTO sales_count
  FROM sales
  WHERE deleted_at IS NULL;

  -- Check for users without sales records
  SELECT COUNT(*) INTO missing_sales
  FROM auth.users u
  LEFT JOIN sales s ON u.id = s.user_id
  WHERE u.deleted_at IS NULL AND s.id IS NULL;

  -- Report results
  IF auth_count = sales_count THEN
    RAISE NOTICE ' 1:1 mapping verified: % auth.users = % sales records', auth_count, sales_count;
  ELSE
    RAISE WARNING '  Mismatch: % auth.users vs % sales records', auth_count, sales_count;

    IF missing_sales > 0 THEN
      RAISE WARNING '  Found % auth.users without sales records - trigger may have failed', missing_sales;
    END IF;
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- =====================================================================
-- Run these manually after migration to verify success:

-- 1. Count admin records (should be exactly 1)
-- SELECT COUNT(*) FROM sales WHERE role = 'admin';
-- SELECT COUNT(*) FROM sales WHERE email = 'admin@test.com';

-- 2. Verify administrator computed column works
-- SELECT first_name, last_name, role, administrator FROM sales WHERE role = 'admin';

-- 3. Check for empty names (should be 0)
-- SELECT COUNT(*) FROM sales WHERE first_name = '' OR last_name = '' OR first_name IS NULL OR last_name IS NULL;

-- 4. Verify 1:1 mapping
-- SELECT
--   (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_count,
--   (SELECT COUNT(*) FROM sales WHERE deleted_at IS NULL) as sales_count;
