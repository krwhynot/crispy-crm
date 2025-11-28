-- ============================================================================
-- PART 3: SEGMENTS (28 segments)
-- ============================================================================
-- Organization classification segments from original data
-- Uses UUID primary keys
-- ============================================================================

INSERT INTO "public"."segments" (id, name, created_at, created_by)
VALUES
  -- Restaurant Types
  ('11111111-0000-0000-0000-000000000001', 'Fine Dining', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000002', 'Casual Dining', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000003', 'Fast Casual', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000004', 'QSR (Quick Service)', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000005', 'Food Truck', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000006', 'Ghost Kitchen', NOW(), NULL),

  -- Hospitality
  ('11111111-0000-0000-0000-000000000007', 'Hotel', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000008', 'Resort', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000009', 'Casino', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000010', 'Convention Center', NOW(), NULL),

  -- Institutional
  ('11111111-0000-0000-0000-000000000011', 'Healthcare', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000012', 'Education K-12', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000013', 'Higher Education', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000014', 'Corporate Dining', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000015', 'Senior Living', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000016', 'Corrections', NOW(), NULL),

  -- Retail/Specialty
  ('11111111-0000-0000-0000-000000000017', 'Grocery', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000018', 'C-Store', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000019', 'Catering', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000020', 'Bakery', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000021', 'Coffee Shop', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000022', 'Bar/Nightclub', NOW(), NULL),

  -- Distribution/Manufacturing
  ('11111111-0000-0000-0000-000000000023', 'Broadline Distributor', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000024', 'Specialty Distributor', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000025', 'Redistribution', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000026', 'Manufacturer', NOW(), NULL),

  -- Other
  ('11111111-0000-0000-0000-000000000027', 'Sports/Entertainment', NOW(), NULL),
  ('11111111-0000-0000-0000-000000000028', 'Travel/Transportation', NOW(), NULL);
