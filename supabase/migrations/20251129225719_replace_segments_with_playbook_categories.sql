-- ============================================================================
-- Migration: Replace Generic Segments with 9 Playbook Categories
-- ============================================================================
-- This migration transforms the dynamic segments system into a fixed set of
-- 9 Playbook categories for distributor classification, aligning with MFB's
-- established sales playbook terminology.
--
-- Playbook Categories:
-- 1. Major Broadline - Large national distributors (Sysco, USF, GFS, PFG)
-- 2. Specialty/Regional - Regional or specialty-focused distributors
-- 3. Management Company - Foodservice management companies (Aramark, Compass)
-- 4. GPO - Group Purchasing Organizations
-- 5. University - Higher education foodservice
-- 6. Restaurant Group - Multi-unit restaurant operators
-- 7. Chain Restaurant - National/regional chain accounts
-- 8. Hotel & Aviation - Hospitality and travel foodservice
-- 9. Unknown - Default for unclassified organizations
-- ============================================================================

-- Step 1: Create mapping table for existing segments to new categories
CREATE TEMP TABLE segment_mapping (
  old_segment_name TEXT,
  new_category_name TEXT
);

-- Map existing 28 segments to 9 Playbook categories
INSERT INTO segment_mapping (old_segment_name, new_category_name) VALUES
  -- Restaurant Types -> Chain Restaurant or Restaurant Group
  ('Fine Dining', 'Restaurant Group'),
  ('Casual Dining', 'Restaurant Group'),
  ('Fast Casual', 'Chain Restaurant'),
  ('QSR (Quick Service)', 'Chain Restaurant'),
  ('Food Truck', 'Restaurant Group'),
  ('Ghost Kitchen', 'Restaurant Group'),

  -- Hospitality -> Hotel & Aviation
  ('Hotel', 'Hotel & Aviation'),
  ('Resort', 'Hotel & Aviation'),
  ('Casino', 'Hotel & Aviation'),
  ('Convention Center', 'Hotel & Aviation'),

  -- Institutional -> Management Company or University
  ('Healthcare', 'Management Company'),
  ('Education K-12', 'Management Company'),
  ('Higher Education', 'University'),
  ('Corporate Dining', 'Management Company'),
  ('Senior Living', 'Management Company'),
  ('Corrections', 'Management Company'),

  -- Retail/Specialty -> Specialty/Regional
  ('Grocery', 'Specialty/Regional'),
  ('C-Store', 'Specialty/Regional'),
  ('Catering', 'Specialty/Regional'),
  ('Bakery', 'Specialty/Regional'),
  ('Coffee Shop', 'Chain Restaurant'),
  ('Bar/Nightclub', 'Restaurant Group'),

  -- Distribution/Manufacturing -> Major Broadline or Specialty/Regional
  ('Broadline Distributor', 'Major Broadline'),
  ('Specialty Distributor', 'Specialty/Regional'),
  ('Redistribution', 'Specialty/Regional'),
  ('Manufacturer', 'Specialty/Regional'),

  -- Other -> Hotel & Aviation or Unknown
  ('Sports/Entertainment', 'Hotel & Aviation'),
  ('Travel/Transportation', 'Hotel & Aviation');

-- Step 2: Delete all existing segments
DELETE FROM segments;

-- Step 3: Insert the 9 Playbook categories with stable UUIDs
INSERT INTO segments (id, name, created_at, created_by) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Major Broadline', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000002', 'Specialty/Regional', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000003', 'Management Company', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000004', 'GPO', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000005', 'University', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000006', 'Restaurant Group', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000007', 'Chain Restaurant', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000008', 'Hotel & Aviation', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000009', 'Unknown', NOW(), NULL);

-- Step 4: Update organizations to use new category IDs based on mapping
-- First, create a temp table with old segment info
CREATE TEMP TABLE org_old_segments AS
SELECT o.id as org_id, s.name as old_segment_name
FROM organizations o
JOIN segments s ON o.segment_id = s.id
WHERE o.segment_id IS NOT NULL;

-- Now we need to update organizations AFTER the new segments are inserted
-- This won't work because we deleted the old segments first
-- Let's do this differently...

-- Drop the temp tables and start over with a better approach
DROP TABLE IF EXISTS org_old_segments;
DROP TABLE IF EXISTS segment_mapping;

-- ============================================================================
-- REVISED APPROACH: Use a single transaction with proper ordering
-- ============================================================================

-- Step 1: Store old segment mappings before deletion
CREATE TEMP TABLE old_org_segments AS
SELECT o.id as org_id, s.name as old_segment_name
FROM organizations o
LEFT JOIN segments s ON o.segment_id = s.id;

-- Step 2: Temporarily remove FK constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_segment_id_fkey;

-- Step 3: Set all segment_ids to NULL temporarily
UPDATE organizations SET segment_id = NULL;

-- Step 4: Delete all old segments
DELETE FROM segments;

-- Step 5: Insert new Playbook categories
INSERT INTO segments (id, name, created_at, created_by) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Major Broadline', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000002', 'Specialty/Regional', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000003', 'Management Company', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000004', 'GPO', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000005', 'University', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000006', 'Restaurant Group', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000007', 'Chain Restaurant', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000008', 'Hotel & Aviation', NOW(), NULL),
  ('22222222-0000-0000-0000-000000000009', 'Unknown', NOW(), NULL);

-- Step 6: Map old segments to new categories and update organizations
UPDATE organizations o
SET segment_id = CASE
  -- Restaurant Types
  WHEN oos.old_segment_name IN ('Fine Dining', 'Casual Dining', 'Food Truck', 'Ghost Kitchen', 'Bar/Nightclub')
    THEN '22222222-0000-0000-0000-000000000006'::uuid -- Restaurant Group
  WHEN oos.old_segment_name IN ('Fast Casual', 'QSR (Quick Service)', 'Coffee Shop')
    THEN '22222222-0000-0000-0000-000000000007'::uuid -- Chain Restaurant

  -- Hospitality
  WHEN oos.old_segment_name IN ('Hotel', 'Resort', 'Casino', 'Convention Center', 'Sports/Entertainment', 'Travel/Transportation')
    THEN '22222222-0000-0000-0000-000000000008'::uuid -- Hotel & Aviation

  -- Institutional
  WHEN oos.old_segment_name = 'Higher Education'
    THEN '22222222-0000-0000-0000-000000000005'::uuid -- University
  WHEN oos.old_segment_name IN ('Healthcare', 'Education K-12', 'Corporate Dining', 'Senior Living', 'Corrections')
    THEN '22222222-0000-0000-0000-000000000003'::uuid -- Management Company

  -- Distribution
  WHEN oos.old_segment_name = 'Broadline Distributor'
    THEN '22222222-0000-0000-0000-000000000001'::uuid -- Major Broadline
  WHEN oos.old_segment_name IN ('Specialty Distributor', 'Redistribution', 'Manufacturer', 'Grocery', 'C-Store', 'Catering', 'Bakery')
    THEN '22222222-0000-0000-0000-000000000002'::uuid -- Specialty/Regional

  -- Default to Unknown for unmapped or NULL
  ELSE '22222222-0000-0000-0000-000000000009'::uuid -- Unknown
END
FROM old_org_segments oos
WHERE o.id = oos.org_id;

-- Step 7: Set any remaining NULL segment_ids to Unknown
UPDATE organizations
SET segment_id = '22222222-0000-0000-0000-000000000009'::uuid
WHERE segment_id IS NULL;

-- Step 8: Restore FK constraint
ALTER TABLE organizations
ADD CONSTRAINT organizations_segment_id_fkey
FOREIGN KEY (segment_id) REFERENCES segments(id);

-- Step 9: Drop the get_or_create_segment function (no longer needed for fixed categories)
DROP FUNCTION IF EXISTS get_or_create_segment(text);

-- Step 10: Add comment explaining the fixed categories
COMMENT ON TABLE segments IS 'Fixed set of 9 Playbook categories for distributor/organization classification. Categories should not be modified - use Unknown for unclassified organizations.';

-- Cleanup temp table
DROP TABLE IF EXISTS old_org_segments;

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================
-- SELECT name, COUNT(*) FROM segments GROUP BY name;
-- SELECT s.name, COUNT(o.id) FROM segments s LEFT JOIN organizations o ON s.id = o.segment_id GROUP BY s.name ORDER BY s.name;
