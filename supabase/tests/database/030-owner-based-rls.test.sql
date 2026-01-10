-- ============================================================================
-- 030-owner-based-rls.test.sql
-- ============================================================================
-- PURPOSE: Verify owner-based access control for personal data tables
--
-- Unlike shared team data, some tables should only be accessible by their owner:
--   - tasks: Personal to-do items (users see only their own tasks)
--   - notifications: Personal notifications (users see only their own)
--   - user_favorites: Personal favorites (users see only their own)
--
-- Security Model:
--   - tasks: Ownership via sales_id = current_sales_id() OR created_by
--   - notifications: Ownership via user_id = auth.uid()
--   - user_favorites: Ownership via user_id = auth.uid()
--
-- Requires: 000-setup-test-hooks.test.sql (pgTAP installation)
--
-- References:
--   - RLS Policies: supabase/migrations/20251127054700_fix_critical_rls_security_tasks.sql
--   - Notifications: supabase/migrations/20251105001240_add_notifications_table.sql
--   - User Favorites: supabase/migrations/20260102142324_create_user_favorites.sql
-- ============================================================================

BEGIN;

SELECT plan(12);

-- ============================================================================
-- SETUP: Create test users and associated data
-- ============================================================================
-- We create two users with distinct UUIDs to test isolation:
--   - User A: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
--   - User B: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

-- Clean up any existing test data from previous runs (within transaction, will rollback)
-- NOTE: Delete child tables first due to FK constraints, then parent tables
-- Also delete by user_id for sales since that's the unique constraint causing issues
DELETE FROM public.tasks WHERE sales_id IN (SELECT id FROM public.sales WHERE user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'));
DELETE FROM public.tasks WHERE id IN (90001, 90002, 90003, 90004);
DELETE FROM public.notifications WHERE id IN (90001, 90002, 90003, 90004);
DELETE FROM public.notifications WHERE user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.user_favorites WHERE id IN (90001, 90002, 90003, 90004);
DELETE FROM public.user_favorites WHERE user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.sales WHERE user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.sales WHERE id IN (90001, 90002);
DELETE FROM auth.users WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Insert test users into auth.users (required for FK constraints)
-- NOTE: The handle_new_user() trigger automatically creates sales records on auth.users INSERT
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user-a@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user-b@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');

-- Sales records are auto-created by trigger. Update them with test IDs for predictable task references.
UPDATE public.sales SET id = 90001 WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.sales SET id = 90002 WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- ============================================================================
-- SETUP: Insert test data for each table
-- ============================================================================

-- Tasks for User A (sales_id = 90001)
INSERT INTO public.tasks (id, title, sales_id, created_by, created_at, updated_at)
VALUES
  (90001, 'User A Task 1', 90001, 90001, NOW(), NOW()),
  (90002, 'User A Task 2', 90001, 90001, NOW(), NOW());

-- Tasks for User B (sales_id = 90002)
INSERT INTO public.tasks (id, title, sales_id, created_by, created_at, updated_at)
VALUES
  (90003, 'User B Task 1', 90002, 90002, NOW(), NOW()),
  (90004, 'User B Task 2', 90002, 90002, NOW(), NOW());

-- Notifications for User A
INSERT INTO public.notifications (id, user_id, type, message, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (90001, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'system', 'User A Notification 1', NOW()),
  (90002, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'system', 'User A Notification 2', NOW());

-- Notifications for User B
INSERT INTO public.notifications (id, user_id, type, message, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (90003, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'system', 'User B Notification 1', NOW()),
  (90004, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'system', 'User B Notification 2', NOW());

-- User favorites for User A
INSERT INTO public.user_favorites (id, user_id, entity_type, entity_id, display_name, created_at)
VALUES
  (90001, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'contacts', 1, 'User A Favorite 1', NOW()),
  (90002, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'organizations', 1, 'User A Favorite 2', NOW());

-- User favorites for User B
INSERT INTO public.user_favorites (id, user_id, entity_type, entity_id, display_name, created_at)
VALUES
  (90003, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'contacts', 2, 'User B Favorite 1', NOW()),
  (90004, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'organizations', 2, 'User B Favorite 2', NOW());

-- ============================================================================
-- SECTION 1: Tasks Owner Isolation Tests
-- ============================================================================

-- Test 1: User A CANNOT see User B's tasks
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT is_empty(
  $$ SELECT id FROM public.tasks WHERE sales_id = 90002 $$,
  'User A cannot see User B tasks (filtered by sales_id = 90002)'
);

-- Test 2: User A CAN see their own tasks
SELECT isnt_empty(
  $$ SELECT id FROM public.tasks WHERE sales_id = 90001 $$,
  'User A can see their own tasks (sales_id = 90001)'
);

-- Test 3: User A sees exactly 2 tasks (their own)
SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.tasks WHERE id IN (90001, 90002, 90003, 90004) $$,
  ARRAY[2],
  'User A should see exactly 2 tasks from test data'
);

-- Switch to User B context
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Test 4: User B CANNOT see User A's tasks
SELECT is_empty(
  $$ SELECT id FROM public.tasks WHERE sales_id = 90001 $$,
  'User B cannot see User A tasks (filtered by sales_id = 90001)'
);

-- Test 5: User B CAN see their own tasks
SELECT isnt_empty(
  $$ SELECT id FROM public.tasks WHERE sales_id = 90002 $$,
  'User B can see their own tasks (sales_id = 90002)'
);

-- ============================================================================
-- SECTION 2: Notifications Owner Isolation Tests
-- ============================================================================

-- Switch to User A context
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Test 6: User A CANNOT see User B's notifications
SELECT is_empty(
  $$ SELECT id FROM public.notifications WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'User A cannot see User B notifications'
);

-- Test 7: User A CAN see their own notifications
SELECT isnt_empty(
  $$ SELECT id FROM public.notifications WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User A can see their own notifications'
);

-- Switch to User B context
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Test 8: User B CANNOT see User A's notifications
SELECT is_empty(
  $$ SELECT id FROM public.notifications WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User B cannot see User A notifications'
);

-- ============================================================================
-- SECTION 3: User Favorites Owner Isolation Tests
-- ============================================================================

-- Switch to User A context
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Test 9: User A CANNOT see User B's favorites
SELECT is_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'User A cannot see User B favorites'
);

-- Test 10: User A CAN see their own favorites
SELECT isnt_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User A can see their own favorites'
);

-- Switch to User B context
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Test 11: User B CANNOT see User A's favorites
SELECT is_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User B cannot see User A favorites'
);

-- Test 12: User B CAN see their own favorites
SELECT isnt_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'User B can see their own favorites'
);

-- ============================================================================
-- CLEANUP & FINISH
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
