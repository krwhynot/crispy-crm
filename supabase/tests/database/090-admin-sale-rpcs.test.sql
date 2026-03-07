-- ============================================================================
-- 090-admin-sale-rpcs.test.sql
-- ============================================================================
-- PURPOSE: Security tests for admin_update_sale and admin_restore_sale
-- SECURITY DEFINER RPCs.
--
-- FUNCTIONS TESTED:
--   admin_update_sale(target_user_id, new_role, new_disabled, new_avatar,
--     new_deleted_at, new_first_name, new_last_name, new_email, new_phone)
--   admin_restore_sale(target_user_id, new_email, new_first_name, new_last_name)
--
-- TEST COVERAGE (16 tests):
--   Tests 1-9:   admin_update_sale authorization and behavior
--   Tests 10-16: admin_restore_sale three-branch logic and authorization
--
-- ID SPACE: 90001+ for test data IDs, UUIDs starting with 90000001-...
--
-- STRATEGY: SECURITY DEFINER functions read auth.uid() from the GUC
-- request.jwt.claim.sub, so we SET LOCAL ROLE authenticated + claim.sub
-- to simulate callers. Between tests we RESET ROLE to postgres for
-- privileged setup DML (sales RLS restricts direct writes to admins).
-- ============================================================================

BEGIN;

SELECT plan(16);

-- ============================================================================
-- SETUP: Clean up previous test data (idempotent)
-- ============================================================================
-- Running as postgres (superuser) — no RLS restrictions
DELETE FROM public.sales WHERE user_id IN (
  '90000001-aaaa-aaaa-aaaa-000000000001',
  '90000002-bbbb-bbbb-bbbb-000000000002',
  '90000003-cccc-cccc-cccc-000000000003',
  '90000004-dddd-dddd-dddd-000000000004'
);
DELETE FROM auth.users WHERE id IN (
  '90000001-aaaa-aaaa-aaaa-000000000001',
  '90000002-bbbb-bbbb-bbbb-000000000002',
  '90000003-cccc-cccc-cccc-000000000003',
  '90000004-dddd-dddd-dddd-000000000004'
);

-- ============================================================================
-- SETUP: Create test users via auth.users
-- ============================================================================
-- The handle_new_user() trigger automatically creates sales records with role='rep'

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  -- Admin user
  ('90000001-aaaa-aaaa-aaaa-000000000001', 'admin-rpc-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  -- Rep user (will stay as rep)
  ('90000002-bbbb-bbbb-bbbb-000000000002', 'rep-rpc-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  -- Another rep (target for admin operations)
  ('90000003-cccc-cccc-cccc-000000000003', 'target-rpc-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');

-- Promote first user to admin
UPDATE public.sales SET role = 'admin' WHERE user_id = '90000001-aaaa-aaaa-aaaa-000000000001';

-- ============================================================================
-- SECTION 1: admin_update_sale Tests (Tests 1-9)
-- ============================================================================

-- --------------------------------------------------------------------------
-- Test 1: Admin updates another user's role -> Success, role changed
-- Exercises: Auth check passes, admin privilege, COALESCE on role param
-- --------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '90000001-aaaa-aaaa-aaaa-000000000001';

SELECT results_eq(
  $$ SELECT (admin_update_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    'manager'::user_role
  )).role::text $$,
  ARRAY['manager'],
  'Test 1: Admin can update another user role to manager'
);

-- Reset target back to rep for subsequent tests (still as admin)
SELECT admin_update_sale(
  '90000003-cccc-cccc-cccc-000000000003',
  'rep'::user_role
);

-- --------------------------------------------------------------------------
-- Test 2: Admin updates another user's disabled flag -> Success
-- Exercises: new_disabled param, COALESCE preserves other fields
-- --------------------------------------------------------------------------
SELECT results_eq(
  $$ SELECT (admin_update_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    new_disabled := true
  )).disabled $$,
  ARRAY[true],
  'Test 2: Admin can disable another user'
);

-- Reset disabled flag (still as admin)
SELECT admin_update_sale(
  '90000003-cccc-cccc-cccc-000000000003',
  new_disabled := false
);

-- --------------------------------------------------------------------------
-- Test 3: Admin sets deleted_at (soft-delete) -> Success
-- Exercises: new_deleted_at param, WHERE clause allows when new_deleted_at IS NOT NULL
-- --------------------------------------------------------------------------
SELECT results_eq(
  $$ SELECT (admin_update_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    new_deleted_at := '2026-01-01T00:00:00Z'::timestamptz
  )).deleted_at IS NOT NULL $$,
  ARRAY[true],
  'Test 3: Admin can soft-delete a user by setting deleted_at'
);

-- Restore for subsequent tests via direct DML as postgres
RESET ROLE;
UPDATE public.sales SET deleted_at = NULL WHERE user_id = '90000003-cccc-cccc-cccc-000000000003';

-- --------------------------------------------------------------------------
-- Test 4: Rep tries to change another user's role -> SQLSTATE P0003
-- Exercises: Authorization check 1 (admin-only for role/disabled/deleted_at)
-- --------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '90000002-bbbb-bbbb-bbbb-000000000002';

SELECT throws_ok(
  $$ SELECT admin_update_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    'admin'::user_role
  ) $$,
  'P0003',
  'Only administrators can modify role, disabled status, or delete users',
  'Test 4: Rep cannot change another user role (P0003)'
);

-- --------------------------------------------------------------------------
-- Test 5: Rep tries to change another user's disabled flag -> SQLSTATE P0003
-- Exercises: Authorization check 1 (new_disabled IS NOT NULL for non-admin)
-- --------------------------------------------------------------------------
SELECT throws_ok(
  $$ SELECT admin_update_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    new_disabled := true
  ) $$,
  'P0003',
  'Only administrators can modify role, disabled status, or delete users',
  'Test 5: Rep cannot disable another user (P0003)'
);

-- --------------------------------------------------------------------------
-- Test 6: Rep updates own profile (first_name, email) -> Success
-- Exercises: Authorization check 2 passes (target = self), profile update
-- --------------------------------------------------------------------------
SELECT results_eq(
  $$ SELECT (admin_update_sale(
    '90000002-bbbb-bbbb-bbbb-000000000002',
    new_first_name := 'UpdatedRep',
    new_email := 'updated-rep@test.local'
  )).first_name $$,
  ARRAY['UpdatedRep'],
  'Test 6: Rep can update own profile fields'
);

-- --------------------------------------------------------------------------
-- Test 7: Rep tries to update another user's profile -> SQLSTATE P0003
-- Exercises: Authorization check 2 (non-admin, target != self)
-- --------------------------------------------------------------------------
SELECT throws_ok(
  $$ SELECT admin_update_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    new_first_name := 'Hacked'
  ) $$,
  'P0003',
  'You can only update your own profile',
  'Test 7: Rep cannot update another user profile (P0003)'
);

-- --------------------------------------------------------------------------
-- Test 8: Non-existent target_user_id -> SQLSTATE P0004
-- Exercises: UPDATE returns NULL, triggers P0004 exception
-- --------------------------------------------------------------------------
SET LOCAL request.jwt.claim.sub = '90000001-aaaa-aaaa-aaaa-000000000001';

SELECT throws_ok(
  $$ SELECT admin_update_sale(
    '90000004-dddd-dddd-dddd-000000000004',
    new_first_name := 'Ghost'
  ) $$,
  'P0004',
  'Target user not found',
  'Test 8: Non-existent target user raises P0004'
);

-- --------------------------------------------------------------------------
-- Test 9: Caller with no sales record -> SQLSTATE P0001
-- Exercises: current_user_role IS NULL check after auth passes
-- NOTE: We create an auth user without a sales record by inserting into
-- auth.users and then deleting the auto-created sales record.
-- --------------------------------------------------------------------------
RESET ROLE;

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('90000004-dddd-dddd-dddd-000000000004', 'nosales-rpc-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');

-- Delete the auto-created sales record (as postgres, bypassing RLS)
DELETE FROM public.sales WHERE user_id = '90000004-dddd-dddd-dddd-000000000004';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '90000004-dddd-dddd-dddd-000000000004';

SELECT throws_ok(
  $$ SELECT admin_update_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    new_first_name := 'Nope'
  ) $$,
  'P0001',
  'User profile not found',
  'Test 9: Caller with no sales record raises P0001'
);

-- ============================================================================
-- SECTION 2: admin_restore_sale Tests (Tests 10-16)
-- ============================================================================

-- --------------------------------------------------------------------------
-- Test 10: Admin restores soft-deleted sales record -> Success (Branch 1)
-- Exercises: Path 1 - UPDATE WHERE deleted_at IS NOT NULL, clears deleted_at
-- --------------------------------------------------------------------------
RESET ROLE;

-- Soft-delete the target user's sales record (as postgres, bypassing RLS)
UPDATE public.sales
SET deleted_at = NOW()
WHERE user_id = '90000003-cccc-cccc-cccc-000000000003';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '90000001-aaaa-aaaa-aaaa-000000000001';

SELECT results_eq(
  $$ SELECT (admin_restore_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    'restored@test.local',
    'Restored',
    'User'
  )).deleted_at IS NULL $$,
  ARRAY[true],
  'Test 10: Admin restores soft-deleted record (Branch 1, deleted_at cleared)'
);

-- --------------------------------------------------------------------------
-- Test 11: Admin restores when active row exists -> Updates fields (Branch 2)
-- Exercises: Path 2 - active row found, updates email/name fields
-- --------------------------------------------------------------------------
SELECT results_eq(
  $$ SELECT (admin_restore_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    'active-update@test.local',
    'Active',
    'Updated'
  )).email $$,
  ARRAY['active-update@test.local'],
  'Test 11: Admin updates active row via restore (Branch 2, fields updated)'
);

-- --------------------------------------------------------------------------
-- Test 12: Admin restores when no row exists -> Inserts new row (Branch 3)
-- Exercises: Path 3 - INSERT with ON CONFLICT upsert, default role='rep'
-- --------------------------------------------------------------------------
RESET ROLE;

-- Ensure no sales row exists for dddd UUID
DELETE FROM public.sales WHERE user_id = '90000004-dddd-dddd-dddd-000000000004';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '90000001-aaaa-aaaa-aaaa-000000000001';

SELECT results_eq(
  $$ SELECT (admin_restore_sale(
    '90000004-dddd-dddd-dddd-000000000004',
    'newuser@test.local',
    'New',
    'Person'
  )).role::text $$,
  ARRAY['rep'],
  'Test 12: Admin creates new sales row via restore (Branch 3, role=rep)'
);

-- --------------------------------------------------------------------------
-- Test 13: Rep tries to call admin_restore_sale -> SQLSTATE P0003
-- Exercises: Admin-only authorization check
-- --------------------------------------------------------------------------
SET LOCAL request.jwt.claim.sub = '90000002-bbbb-bbbb-bbbb-000000000002';

SELECT throws_ok(
  $$ SELECT admin_restore_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    'hacked@test.local'
  ) $$,
  'P0003',
  'Only administrators can restore sales records',
  'Test 13: Rep cannot call admin_restore_sale (P0003)'
);

-- --------------------------------------------------------------------------
-- Test 14: Repeated call (idempotent safety) -> No error (Branch 2 on 2nd call)
-- Exercises: Calling restore on an already-active row is safe and updates fields
-- --------------------------------------------------------------------------
SET LOCAL request.jwt.claim.sub = '90000001-aaaa-aaaa-aaaa-000000000001';

-- Row is already active from Test 11. Call again — should succeed via Branch 2.
SELECT lives_ok(
  $$ SELECT admin_restore_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    'idempotent@test.local',
    'Idempotent',
    'Call'
  ) $$,
  'Test 14: Repeated admin_restore_sale on active row is idempotent (Branch 2)'
);

-- --------------------------------------------------------------------------
-- Test 15: COALESCE preserves existing on NULL params -> first_name unchanged
-- Exercises: Branch 2 - COALESCE(new_first_name, first_name) keeps old value
-- --------------------------------------------------------------------------

-- Set a known first_name first (still as admin)
SELECT admin_restore_sale(
  '90000003-cccc-cccc-cccc-000000000003',
  NULL,
  'KnownName',
  NULL
);

-- Now call with NULL first_name — should preserve 'KnownName'
SELECT results_eq(
  $$ SELECT (admin_restore_sale(
    '90000003-cccc-cccc-cccc-000000000003',
    'preserve-test@test.local',
    NULL,
    'NewLast'
  )).first_name $$,
  ARRAY['KnownName'],
  'Test 15: NULL first_name preserves existing value via COALESCE (Branch 2)'
);

-- --------------------------------------------------------------------------
-- Test 16: NULL params preserve existing fields in Branch 1 (restore path)
-- Exercises: Branch 1 COALESCE(new_first_name, first_name) keeps existing
--   when params are NULL. This also validates the NULLIF pattern behavior:
--   in the ON CONFLICT path (Branch 3), COALESCE(NULLIF('',''), existing)
--   would similarly preserve existing values. We test Branch 1 as it is
--   deterministically reachable without concurrent races.
-- --------------------------------------------------------------------------
RESET ROLE;

-- Clean up the dddd user and set up a known row
DELETE FROM public.sales WHERE user_id = '90000004-dddd-dddd-dddd-000000000004';

-- Insert a row directly with known values
INSERT INTO public.sales (user_id, email, first_name, last_name, role, disabled, created_at, updated_at)
VALUES ('90000004-dddd-dddd-dddd-000000000004', 'existing@test.local', 'ExistingFirst', 'ExistingLast', 'rep', false, NOW(), NOW());

-- Soft-delete it so Branch 1 fires
UPDATE public.sales SET deleted_at = NOW() WHERE user_id = '90000004-dddd-dddd-dddd-000000000004';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '90000001-aaaa-aaaa-aaaa-000000000001';

-- Call restore with all NULL params — COALESCE preserves existing values
SELECT results_eq(
  $$ SELECT (admin_restore_sale(
    '90000004-dddd-dddd-dddd-000000000004',
    NULL,
    NULL,
    NULL
  )).first_name $$,
  ARRAY['ExistingFirst'],
  'Test 16: NULL params preserve existing fields via COALESCE in restore (Branch 1)'
);

-- ============================================================================
-- CLEANUP & FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
