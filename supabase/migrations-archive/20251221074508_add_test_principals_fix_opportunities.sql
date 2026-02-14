-- Migration: Add Test Principal Organizations and Fix NULL Principal Opportunities
-- Purpose: Create principal organizations for local test data and assign them to opportunities
-- Context: Grand Rapids campaign opportunities were created with invalid principal_organization_id
--          values that got NULLed by fix_referential_integrity migration
--
-- MFB Domain: Food distribution broker with 9 principals (food manufacturers)
-- These are realistic test principal names for local development

-- =====================================================
-- STEP 1: Create Test Principal Organizations
-- =====================================================

-- Use high IDs to avoid conflicts with existing data
INSERT INTO organizations (id, name, organization_type, created_at)
VALUES
  (90001, 'Midwest Foods Co.', 'principal', CURRENT_TIMESTAMP),
  (90002, 'Great Lakes Provisions', 'principal', CURRENT_TIMESTAMP),
  (90003, 'Heartland Food Products', 'principal', CURRENT_TIMESTAMP),
  (90004, 'Michigan Specialty Foods', 'principal', CURRENT_TIMESTAMP),
  (90005, 'North Star Ingredients', 'principal', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Update sequence to avoid future ID conflicts
SELECT setval('organizations_id_seq', GREATEST(
  (SELECT MAX(id) FROM organizations),
  90010
));

-- =====================================================
-- STEP 2: Fix NULL Principal Opportunities
-- =====================================================

-- Assign opportunities to principals in round-robin fashion based on opportunity ID
-- This distributes test data across principals for realistic testing

-- Opportunities with id % 5 = 0 -> Midwest Foods Co. (90001)
UPDATE opportunities
SET principal_organization_id = 90001
WHERE principal_organization_id IS NULL
  AND deleted_at IS NULL
  AND id % 5 = 0;

-- Opportunities with id % 5 = 1 -> Great Lakes Provisions (90002)
UPDATE opportunities
SET principal_organization_id = 90002
WHERE principal_organization_id IS NULL
  AND deleted_at IS NULL
  AND id % 5 = 1;

-- Opportunities with id % 5 = 2 -> Heartland Food Products (90003)
UPDATE opportunities
SET principal_organization_id = 90003
WHERE principal_organization_id IS NULL
  AND deleted_at IS NULL
  AND id % 5 = 2;

-- Opportunities with id % 5 = 3 -> Michigan Specialty Foods (90004)
UPDATE opportunities
SET principal_organization_id = 90004
WHERE principal_organization_id IS NULL
  AND deleted_at IS NULL
  AND id % 5 = 3;

-- Opportunities with id % 5 = 4 -> North Star Ingredients (90005)
UPDATE opportunities
SET principal_organization_id = 90005
WHERE principal_organization_id IS NULL
  AND deleted_at IS NULL
  AND id % 5 = 4;

-- =====================================================
-- STEP 3: Verify Results
-- =====================================================

DO $$
DECLARE
  null_count INTEGER;
  principal_count INTEGER;
BEGIN
  -- Count remaining NULL principals
  SELECT COUNT(*) INTO null_count
  FROM opportunities
  WHERE principal_organization_id IS NULL AND deleted_at IS NULL;

  -- Count principals created
  SELECT COUNT(*) INTO principal_count
  FROM organizations
  WHERE organization_type = 'principal' AND deleted_at IS NULL;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRINCIPAL ORGANIZATION FIX COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Principals created: %', principal_count;
  RAISE NOTICE 'Opportunities still NULL: %', null_count;

  IF null_count > 0 THEN
    RAISE WARNING 'Some opportunities still have NULL principal_organization_id';
  ELSE
    RAISE NOTICE 'SUCCESS: All opportunities now have principal assignments';
  END IF;
END $$;
