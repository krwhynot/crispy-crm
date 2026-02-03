-- ============================================================================
-- 030-owner-based-rls.test.sql
-- ============================================================================
-- PURPOSE: Verify owner-based access control for personal data tables
--
-- Unlike shared team data, some tables should only be accessible by their owner:
--   - notifications: Personal notifications (users see only their own)
--   - user_favorites: Personal favorites (users see only their own)
--
-- NOTE: tasks table was deprecated (renamed to tasks_deprecated) with a
-- read-only policy allowing all authenticated users. Owner isolation tests
-- for tasks are no longer applicable.
--
-- Security Model:
--   - notifications: Ownership via user_id = auth.uid()
--   - user_favorites: Ownership via user_id = auth.uid()
--
-- Requires: 000-setup-test-hooks.test.sql (pgTAP installation)
--
-- References:
--   - Notifications: supabase/migrations/20251105001240_add_notifications_table.sql
--   - User Favorites: supabase/migrations/20260102142324_create_user_favorites.sql
-- ============================================================================

BEGIN;

SELECT plan(7);

-- ============================================================================
-- SETUP: Create test users and associated data
-- ============================================================================
-- We create two users with distinct UUIDs to test isolation:
--   - User A: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
--   - User B: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

-- Clean up any existing test data from previous runs (within transaction, will rollback)
-- NOTE: Delete child tables first due to FK constraints, then parent tables
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

-- Sales records are auto-created by trigger. Update them with test IDs for predictable references.
UPDATE public.sales SET id = 90001 WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.sales SET id = 90002 WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- ============================================================================
-- SETUP: Insert test data for each table
-- ============================================================================

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
-- SECTION 1: Notifications Owner Isolation Tests
-- ============================================================================

-- Switch to User A context
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Test 1: User A CANNOT see User B's notifications
SELECT is_empty(
  $$ SELECT id FROM public.notifications WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'User A cannot see User B notifications'
);

-- Test 2: User A CAN see their own notifications
SELECT isnt_empty(
  $$ SELECT id FROM public.notifications WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User A can see their own notifications'
);

-- Switch to User B context
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Test 3: User B CANNOT see User A's notifications
SELECT is_empty(
  $$ SELECT id FROM public.notifications WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User B cannot see User A notifications'
);

-- ============================================================================
-- SECTION 2: User Favorites Owner Isolation Tests
-- ============================================================================

-- Switch to User A context
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Test 4: User A CANNOT see User B's favorites
SELECT is_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'User A cannot see User B favorites'
);

-- Test 5: User A CAN see their own favorites
SELECT isnt_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User A can see their own favorites'
);

-- Switch to User B context
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Test 6: User B CANNOT see User A's favorites
SELECT is_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'User B cannot see User A favorites'
);

-- Test 7: User B CAN see their own favorites
SELECT isnt_empty(
  $$ SELECT id FROM public.user_favorites WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'User B can see their own favorites'
);

-- ============================================================================
-- CLEANUP & FINISH
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
