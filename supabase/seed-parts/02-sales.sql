-- ============================================================================
-- PART 2: SALES TABLE (6 reps)
-- ============================================================================
-- Links auth.users to the CRM sales rep profiles
-- is_admin determines admin access (no role column in schema)
-- Note: auth.users trigger auto-creates basic sales records,
--       so we DELETE and re-INSERT with full details
-- ============================================================================

-- Delete auto-created records from trigger (will be recreated below)
DELETE FROM "public"."sales" WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001'
);

INSERT INTO "public"."sales" (id, user_id, first_name, last_name, email, phone, is_admin, role, avatar_url, created_at, updated_at)
VALUES
  -- Admin Test User (id=1)
  (1, 'a0000000-0000-0000-0000-000000000001', 'Admin', 'User', 'admin@test.com', '555-000-0001', true, 'admin', NULL, NOW(), NOW()),

  -- Brent Gustafson - Owner/Admin (id=2)
  (2, 'b0000000-0000-0000-0000-000000000001', 'Brent', 'Gustafson', 'brent@mfbroker.com', '555-000-0002', true, 'admin', NULL, NOW(), NOW()),

  -- Michelle Gustafson - Manager (id=3)
  (3, 'c0000000-0000-0000-0000-000000000001', 'Michelle', 'Gustafson', 'michelle@mfbroker.com', '555-000-0003', false, 'manager', NULL, NOW(), NOW()),

  -- Gary - Sales Rep (id=4)
  (4, 'd0000000-0000-0000-0000-000000000001', 'Gary', 'Thompson', 'gary@mfbroker.com', '555-000-0004', false, 'rep', NULL, NOW(), NOW()),

  -- Dale - Sales Rep (id=5)
  (5, 'e0000000-0000-0000-0000-000000000001', 'Dale', 'Anderson', 'dale@mfbroker.com', '555-000-0005', false, 'rep', NULL, NOW(), NOW()),

  -- Sue - Sales Rep (id=6)
  (6, 'f0000000-0000-0000-0000-000000000001', 'Sue', 'Martinez', 'sue@mfbroker.com', '555-000-0006', false, 'rep', NULL, NOW(), NOW());

-- Reset the sequence to continue after our inserts
SELECT setval(pg_get_serial_sequence('sales', 'id'), 6, true);
