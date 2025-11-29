-- ============================================================================
-- PART 3: PLAYBOOK CATEGORIES (9 categories)
-- ============================================================================
-- Fixed set of distributor/organization classification categories aligned with
-- MFB's sales playbook. These categories should not be modified at runtime.
--
-- UUIDs use the 22222222-... prefix for easy identification
-- ============================================================================

INSERT INTO "public"."segments" (id, name, created_at, created_by)
VALUES
  -- Major national distributors
  ('22222222-0000-0000-0000-000000000001', 'Major Broadline', NOW(), NULL),

  -- Regional or specialty-focused distributors
  ('22222222-0000-0000-0000-000000000002', 'Specialty/Regional', NOW(), NULL),

  -- Foodservice management companies (Aramark, Compass, Sodexo)
  ('22222222-0000-0000-0000-000000000003', 'Management Company', NOW(), NULL),

  -- Group Purchasing Organizations
  ('22222222-0000-0000-0000-000000000004', 'GPO', NOW(), NULL),

  -- Higher education foodservice
  ('22222222-0000-0000-0000-000000000005', 'University', NOW(), NULL),

  -- Multi-unit restaurant operators
  ('22222222-0000-0000-0000-000000000006', 'Restaurant Group', NOW(), NULL),

  -- National/regional chain accounts
  ('22222222-0000-0000-0000-000000000007', 'Chain Restaurant', NOW(), NULL),

  -- Hospitality and travel foodservice
  ('22222222-0000-0000-0000-000000000008', 'Hotel & Aviation', NOW(), NULL),

  -- Default for unclassified organizations
  ('22222222-0000-0000-0000-000000000009', 'Unknown', NOW(), NULL);
