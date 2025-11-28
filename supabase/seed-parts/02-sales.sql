-- ============================================================================
-- PART 2: SALES TABLE (6 reps)
-- ============================================================================
-- Links auth.users to the CRM sales rep profiles
-- Role enum: 'admin', 'manager', 'rep'
-- ============================================================================

INSERT INTO "public"."sales" (id, user_id, first_name, last_name, role, is_admin, avatar, created_at, updated_at)
VALUES
  -- Admin Test User (id=1)
  (1, 'a0000000-0000-0000-0000-000000000001', 'Admin', 'User', 'admin', true, NULL, NOW(), NOW()),

  -- Brent Gustafson - Owner/Admin (id=2)
  (2, 'b0000000-0000-0000-0000-000000000001', 'Brent', 'Gustafson', 'admin', true, NULL, NOW(), NOW()),

  -- Michelle Gustafson - Manager (id=3)
  (3, 'c0000000-0000-0000-0000-000000000001', 'Michelle', 'Gustafson', 'manager', false, NULL, NOW(), NOW()),

  -- Gary - Sales Rep (id=4)
  (4, 'd0000000-0000-0000-0000-000000000001', 'Gary', 'Thompson', 'rep', false, NULL, NOW(), NOW()),

  -- Dale - Sales Rep (id=5)
  (5, 'e0000000-0000-0000-0000-000000000001', 'Dale', 'Anderson', 'rep', false, NULL, NOW(), NOW()),

  -- Sue - Sales Rep (id=6)
  (6, 'f0000000-0000-0000-0000-000000000001', 'Sue', 'Martinez', 'rep', false, NULL, NOW(), NOW());

-- Reset the sequence to continue after our inserts
SELECT setval(pg_get_serial_sequence('sales', 'id'), 6, true);
