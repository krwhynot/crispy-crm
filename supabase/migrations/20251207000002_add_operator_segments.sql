-- ============================================================================
-- Migration: Add Operator Segments for Classification
-- ============================================================================
-- This migration extends the segments table to support operator classification
-- in addition to the existing playbook categories. It adds a two-tier hierarchy
-- of operator segment types (parent/child) based on industry standard foodservice
-- classifications.
--
-- Segment Types:
-- - playbook: Existing distributor classification categories (9 categories)
-- - operator: New operator classification (16 parent + child segments)
--
-- Operator Parent Segments (Commercial):
-- 1. Full-Service Restaurant
-- 2. Limited-Service Restaurant
-- 3. Bars & Lounges
-- 4. Entertainment
-- 5. Hotels & Lodging
-- 6. Catering
-- 7. Travel
-- 8. Restaurant Group
-- 9. Meal Prep Service
--
-- Operator Parent Segments (Institutional):
-- 10. Education - K-12
-- 11. Education - Higher Ed
-- 12. Healthcare
-- 13. Business & Industry
-- 14. Military/Government
-- 15. Recreation/Clubs
-- 16. Vending Services
-- ============================================================================

-- Step 1: Add new columns to segments table
ALTER TABLE segments ADD COLUMN IF NOT EXISTS segment_type TEXT DEFAULT 'playbook'
  CHECK (segment_type IN ('playbook', 'operator'));

ALTER TABLE segments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES segments(id);

ALTER TABLE segments ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_segments_type ON segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_segments_parent ON segments(parent_id) WHERE parent_id IS NOT NULL;

-- Step 3: Mark existing segments as playbook type
UPDATE segments SET segment_type = 'playbook' WHERE segment_type IS NULL;

-- Step 4: Insert operator parent segments (display_order 1-9: Commercial)
INSERT INTO segments (id, name, segment_type, parent_id, display_order, created_at, created_by)
VALUES
  ('33333333-3333-4333-8333-000000000001', 'Full-Service Restaurant', 'operator', NULL, 1, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000002', 'Limited-Service Restaurant', 'operator', NULL, 2, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000003', 'Bars & Lounges', 'operator', NULL, 3, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000004', 'Entertainment', 'operator', NULL, 4, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000005', 'Hotels & Lodging', 'operator', NULL, 5, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000006', 'Catering', 'operator', NULL, 6, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000007', 'Travel', 'operator', NULL, 7, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000008', 'Restaurant Group', 'operator', NULL, 8, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000009', 'Meal Prep Service', 'operator', NULL, 9, NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Insert operator parent segments (display_order 10-16: Institutional)
INSERT INTO segments (id, name, segment_type, parent_id, display_order, created_at, created_by)
VALUES
  ('33333333-3333-4333-8333-000000000010', 'Education - K-12', 'operator', NULL, 10, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000011', 'Education - Higher Ed', 'operator', NULL, 11, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000012', 'Healthcare', 'operator', NULL, 12, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000013', 'Business & Industry', 'operator', NULL, 13, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000014', 'Military/Government', 'operator', NULL, 14, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000015', 'Recreation/Clubs', 'operator', NULL, 15, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000016', 'Vending Services', 'operator', NULL, 16, NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Insert Full-Service Restaurant child segments
INSERT INTO segments (id, name, segment_type, parent_id, display_order, created_at, created_by)
VALUES
  ('33333333-3333-4333-8333-000000000101', 'Fine Dining', 'operator', '33333333-3333-4333-8333-000000000001', 101, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000102', 'Casual Dining', 'operator', '33333333-3333-4333-8333-000000000001', 102, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000103', 'Family Dining', 'operator', '33333333-3333-4333-8333-000000000001', 103, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000104', 'Gastropub', 'operator', '33333333-3333-4333-8333-000000000001', 104, NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Insert Limited-Service Restaurant child segments
INSERT INTO segments (id, name, segment_type, parent_id, display_order, created_at, created_by)
VALUES
  ('33333333-3333-4333-8333-000000000201', 'Fast Food/QSR', 'operator', '33333333-3333-4333-8333-000000000002', 201, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000202', 'Fast Casual', 'operator', '33333333-3333-4333-8333-000000000002', 202, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000203', 'Pizza', 'operator', '33333333-3333-4333-8333-000000000002', 203, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000204', 'Food Truck', 'operator', '33333333-3333-4333-8333-000000000002', 204, NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Insert Entertainment child segments
INSERT INTO segments (id, name, segment_type, parent_id, display_order, created_at, created_by)
VALUES
  ('33333333-3333-4333-8333-000000000401', 'Casinos', 'operator', '33333333-3333-4333-8333-000000000004', 401, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000402', 'Theaters', 'operator', '33333333-3333-4333-8333-000000000004', 402, NOW(), NULL),
  ('33333333-3333-4333-8333-000000000403', 'Stadiums', 'operator', '33333333-3333-4333-8333-000000000004', 403, NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 9: Insert Recreation/Clubs child segments
INSERT INTO segments (id, name, segment_type, parent_id, display_order, created_at, created_by)
VALUES
  ('33333333-3333-4333-8333-000000001501', 'Country Clubs', 'operator', '33333333-3333-4333-8333-000000000015', 1501, NOW(), NULL),
  ('33333333-3333-4333-8333-000000001502', 'Golf Courses', 'operator', '33333333-3333-4333-8333-000000000015', 1502, NOW(), NULL),
  ('33333333-3333-4333-8333-000000001503', 'Fitness Centers', 'operator', '33333333-3333-4333-8333-000000000015', 1503, NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 10: Add comment explaining the extended segments
COMMENT ON TABLE segments IS 'Segments for organization classification. Contains two types: (1) playbook - fixed set of 9 distributor categories, (2) operator - hierarchical operator classifications with parent/child relationships for detailed foodservice categorization.';

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================
-- View all operator segments by type:
-- SELECT segment_type, COUNT(*) FROM segments GROUP BY segment_type;
--
-- View operator hierarchy:
-- SELECT
--   COALESCE(p.name, s.name) as parent_category,
--   CASE WHEN s.parent_id IS NOT NULL THEN s.name ELSE NULL END as child_category,
--   s.display_order
-- FROM segments s
-- LEFT JOIN segments p ON s.parent_id = p.id
-- WHERE s.segment_type = 'operator'
-- ORDER BY s.display_order;
-- ============================================================================
