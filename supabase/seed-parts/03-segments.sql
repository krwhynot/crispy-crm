-- ============================================================================
-- PART 3: PLAYBOOK CATEGORIES (9 categories)
-- ============================================================================
-- Fixed set of distributor/organization classification categories aligned with
-- MFB's sales playbook. These categories should not be modified at runtime.
--
-- UUIDs use the 22222222-... prefix for easy identification
-- ============================================================================

INSERT INTO "public"."segments" (id, name, segment_type, display_order, created_at, created_by)
VALUES
  -- Major national distributors
  ('22222222-2222-4222-8222-000000000001', 'Major Broadline', 'playbook', 1, NOW(), NULL),

  -- Regional or specialty-focused distributors
  ('22222222-2222-4222-8222-000000000002', 'Specialty/Regional', 'playbook', 2, NOW(), NULL),

  -- Foodservice management companies (Aramark, Compass, Sodexo)
  ('22222222-2222-4222-8222-000000000003', 'Management Company', 'playbook', 3, NOW(), NULL),

  -- Group Purchasing Organizations
  ('22222222-2222-4222-8222-000000000004', 'GPO', 'playbook', 4, NOW(), NULL),

  -- Higher education foodservice
  ('22222222-2222-4222-8222-000000000005', 'University', 'playbook', 5, NOW(), NULL),

  -- Multi-unit restaurant operators
  ('22222222-2222-4222-8222-000000000006', 'Restaurant Group', 'playbook', 6, NOW(), NULL),

  -- National/regional chain accounts
  ('22222222-2222-4222-8222-000000000007', 'Chain Restaurant', 'playbook', 7, NOW(), NULL),

  -- Hospitality and travel foodservice
  ('22222222-2222-4222-8222-000000000008', 'Hotel & Aviation', 'playbook', 8, NOW(), NULL),

  -- Default for unclassified organizations
  ('22222222-2222-4222-8222-000000000009', 'Unknown', 'playbook', 9, NOW(), NULL)
ON CONFLICT (id) DO UPDATE SET segment_type = 'playbook', display_order = EXCLUDED.display_order;
