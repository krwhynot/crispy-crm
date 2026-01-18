-- ============================================================================
-- 060-null-safety-rls.test.sql
-- ============================================================================
-- PURPOSE: Test null-safety behavior of RLS helper functions and policies
--
-- COVERAGE:
--   1. Test user setup (admin, manager, rep1, rep2)
--   2. Helper function tests (is_admin, is_manager, is_rep, is_manager_or_admin, current_sales_id)
--   3. RLS policy tests for core tables (contact_notes, tasks, opportunities)
--
-- SECURITY MODEL:
--   - Admin: Full CRUD on all resources
--   - Manager: View all + Edit all + Delete only via manager_or_admin check
--   - Rep: View all + Edit own only + No delete
--   - Personal tables (tasks, notifications): Owner-only access
--
-- References:
--   - Role permissions: supabase/migrations/20251111121526_add_role_based_permissions.sql
--   - Helper functions: supabase/migrations/20251130010932_security_invoker_and_search_path_remediation.sql
--   - is_admin NULL fix: supabase/migrations/20251211180000_fix_is_admin_null_auth.sql
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(20);

-- ============================================================================
-- SETUP: Create test users for each role
-- ============================================================================
-- Test user UUIDs:
--   - Admin:   11111111-1111-1111-1111-111111111111
--   - Manager: 22222222-2222-2222-2222-222222222222
--   - Rep1:    33333333-3333-3333-3333-333333333333
--   - Rep2:    44444444-4444-4444-4444-444444444444
-- ============================================================================

-- Clean up any existing test data (cascade delete for FK constraints)
DELETE FROM public.tasks WHERE sales_id IN (
  SELECT id FROM public.sales WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  )
);
DELETE FROM public.contact_notes WHERE created_by IN (
  SELECT id FROM public.sales WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  )
);
DELETE FROM public.sales WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);
DELETE FROM auth.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- Insert test users into auth.users (trigger auto-creates sales records)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'manager@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'rep1@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'rep2@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');

-- Update roles for test users (trigger auto-created them as 'rep')
UPDATE public.sales SET role = 'admin' WHERE user_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.sales SET role = 'manager' WHERE user_id = '22222222-2222-2222-2222-222222222222';
-- rep1 and rep2 stay as 'rep' (default)

-- Store sales IDs for test data creation
DO $$
DECLARE
  v_admin_sales_id BIGINT;
  v_manager_sales_id BIGINT;
  v_rep1_sales_id BIGINT;
  v_rep2_sales_id BIGINT;
  v_test_org_id BIGINT;
  v_test_contact_id BIGINT;
BEGIN
  SELECT id INTO v_admin_sales_id FROM public.sales WHERE user_id = '11111111-1111-1111-1111-111111111111';
  SELECT id INTO v_manager_sales_id FROM public.sales WHERE user_id = '22222222-2222-2222-2222-222222222222';
  SELECT id INTO v_rep1_sales_id FROM public.sales WHERE user_id = '33333333-3333-3333-3333-333333333333';
  SELECT id INTO v_rep2_sales_id FROM public.sales WHERE user_id = '44444444-4444-4444-4444-444444444444';

  -- Create test organization for FK constraints
  INSERT INTO public.organizations (id, name, created_by)
  VALUES (888801, 'RLS Test Organization', v_admin_sales_id)
  ON CONFLICT (id) DO NOTHING;
  v_test_org_id := 888801;

  -- Create test contact for FK constraints
  INSERT INTO public.contacts (id, name, organization_id, created_by)
  VALUES (888801, 'RLS Test Contact', v_test_org_id, v_admin_sales_id)
  ON CONFLICT (id) DO NOTHING;
  v_test_contact_id := 888801;

  -- Create test tasks for each user
  INSERT INTO public.tasks (id, title, sales_id, created_by)
  VALUES
    (888801, 'Admin Task', v_admin_sales_id, v_admin_sales_id),
    (888802, 'Manager Task', v_manager_sales_id, v_manager_sales_id),
    (888803, 'Rep1 Task', v_rep1_sales_id, v_rep1_sales_id),
    (888804, 'Rep2 Task', v_rep2_sales_id, v_rep2_sales_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create test contact notes for each user
  INSERT INTO public.contact_notes (id, contact_id, text, sales_id, created_by)
  VALUES
    (888801, v_test_contact_id, 'Admin Note', v_admin_sales_id, v_admin_sales_id),
    (888802, v_test_contact_id, 'Manager Note', v_manager_sales_id, v_manager_sales_id),
    (888803, v_test_contact_id, 'Rep1 Note', v_rep1_sales_id, v_rep1_sales_id),
    (888804, v_test_contact_id, 'Rep2 Note', v_rep2_sales_id, v_rep2_sales_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create test opportunity for dual ownership tests
  INSERT INTO public.opportunities (
    id, name, customer_organization_id, principal_organization_id,
    opportunity_owner_id, account_manager_id, stage
  )
  VALUES (
    888801, 'RLS Test Opportunity', v_test_org_id, v_test_org_id,
    v_rep1_sales_id, v_rep2_sales_id, 'new_lead'
  )
  ON CONFLICT (id) DO NOTHING;
END $$;


-- ============================================================================
-- SECTION 1: Helper Function Tests
-- ============================================================================

-- Test 1: is_admin() returns TRUE for admin user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT ok(
  public.is_admin() = TRUE,
  'is_admin() returns TRUE for admin user'
);

-- Test 2: is_admin() returns FALSE for manager user
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

SELECT ok(
  public.is_admin() = FALSE,
  'is_admin() returns FALSE for manager user'
);

-- Test 3: is_admin() returns TRUE when auth.uid() IS NULL (service role/migration)
RESET request.jwt.claim.sub;

SELECT ok(
  public.is_admin() = TRUE,
  'is_admin() returns TRUE when auth.uid() IS NULL (safe for service role)'
);

-- Test 4: is_manager() returns TRUE for manager user
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

SELECT ok(
  public.is_manager() = TRUE,
  'is_manager() returns TRUE for manager user'
);

-- Test 5: is_manager() returns FALSE for admin user
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT ok(
  public.is_manager() = FALSE,
  'is_manager() returns FALSE for admin user (admin is not manager)'
);

-- Test 6: is_rep() returns TRUE for rep user
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

SELECT ok(
  public.is_rep() = TRUE,
  'is_rep() returns TRUE for rep user'
);

-- Test 7: is_rep() returns FALSE for admin user
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT ok(
  public.is_rep() = FALSE,
  'is_rep() returns FALSE for admin user'
);

-- Test 8: is_manager_or_admin() returns TRUE for admin
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT ok(
  public.is_manager_or_admin() = TRUE,
  'is_manager_or_admin() returns TRUE for admin user'
);

-- Test 9: is_manager_or_admin() returns TRUE for manager
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

SELECT ok(
  public.is_manager_or_admin() = TRUE,
  'is_manager_or_admin() returns TRUE for manager user'
);

-- Test 10: is_manager_or_admin() returns FALSE for rep
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

SELECT ok(
  public.is_manager_or_admin() = FALSE,
  'is_manager_or_admin() returns FALSE for rep user'
);

-- Test 11: current_sales_id() returns correct ID for user
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

SELECT ok(
  public.current_sales_id() = (SELECT id FROM public.sales WHERE user_id = '33333333-3333-3333-3333-333333333333'),
  'current_sales_id() returns correct sales ID for authenticated user'
);

-- Test 12: current_sales_id() returns NULL when auth.uid() IS NULL
RESET request.jwt.claim.sub;

SELECT ok(
  public.current_sales_id() IS NULL,
  'current_sales_id() returns NULL when auth.uid() IS NULL'
);


-- ============================================================================
-- SECTION 2: Tasks RLS Policy Tests (Owner-Based Access)
-- ============================================================================

-- Test 13: Rep1 can see their own tasks
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

SELECT isnt_empty(
  $$ SELECT id FROM public.tasks WHERE id = 888803 $$,
  'Rep1 can see their own task (id=888803)'
);

-- Test 14: Rep1 cannot see Rep2's tasks (owner isolation)
SELECT is_empty(
  $$ SELECT id FROM public.tasks WHERE id = 888804 $$,
  'Rep1 cannot see Rep2 task (owner isolation enforced)'
);

-- Test 15: Manager can see all tasks (privileged access)
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.tasks WHERE id IN (888801, 888802, 888803, 888804) $$,
  ARRAY[4],
  'Manager can see all 4 test tasks (privileged access)'
);


-- ============================================================================
-- SECTION 3: Contact Notes RLS Policy Tests (Team Shared Access)
-- ============================================================================

-- Test 16: All authenticated users can read contact_notes (team shared)
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.contact_notes WHERE id IN (888801, 888802, 888803, 888804) $$,
  ARRAY[4],
  'Rep1 can see all 4 contact notes (team shared read access)'
);

-- Test 17: Anonymous users cannot access contact_notes
SET LOCAL ROLE anon;

SELECT is_empty(
  $$ SELECT id FROM public.contact_notes WHERE id = 888801 $$,
  'Anonymous user cannot access contact_notes (authentication required)'
);


-- ============================================================================
-- SECTION 4: Opportunities RLS Policy Tests (Dual Ownership)
-- ============================================================================

-- Opportunity 888801: opportunity_owner_id = rep1, account_manager_id = rep2

-- Test 18: Rep1 (opportunity_owner) can see opportunity
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

SELECT isnt_empty(
  $$ SELECT id FROM public.opportunities WHERE id = 888801 $$,
  'Rep1 (opportunity_owner) can see opportunity 888801'
);

-- Test 19: Rep2 (account_manager) can also see opportunity
SET LOCAL request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

SELECT isnt_empty(
  $$ SELECT id FROM public.opportunities WHERE id = 888801 $$,
  'Rep2 (account_manager) can see opportunity 888801'
);

-- Test 20: Soft-deleted opportunities are filtered out
-- Use admin role who has full permission to modify any opportunity
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

UPDATE public.opportunities SET deleted_at = NOW() WHERE id = 888801;

-- Switch to rep1 to verify they can't see deleted opportunity
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

SELECT is_empty(
  $$ SELECT id FROM public.opportunities WHERE id = 888801 $$,
  'Soft-deleted opportunity is filtered by RLS (deleted_at IS NOT NULL)'
);

-- Restore for cleanup (as admin)
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
UPDATE public.opportunities SET deleted_at = NULL WHERE id = 888801;


-- ============================================================================
-- CLEANUP & FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
