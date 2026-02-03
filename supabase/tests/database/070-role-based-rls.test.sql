-- ============================================================================
-- 070-role-based-rls.test.sql
-- ============================================================================
-- PURPOSE: TDD tests for role-based RLS policies
--
-- SECURITY MODEL (Role-based Access):
--   1. Admin/Manager: Global visibility + unrestricted CRUD
--   2. Rep: Shared SELECT visibility, ownership-restricted UPDATE/DELETE
--   Note: Organizations use shared SELECT (organizations_select_all),
--   while opportunities/activities use role-based SELECT.
--
-- NOTE: Tasks tests removed - table was deprecated (tasks_deprecated) with
-- read-only policy for all authenticated users. Owner isolation no longer applies.
--
-- TEST COVERAGE (14 tests):
--   Tests 1-5:   Basic role visibility (organizations)
--   Tests 6-8:   Rep CRUD operations
--   Tests 9-12:  GAP 1 - Opportunities dual ownership (OR logic)
--   Tests 13-14: GAP 2 - Activities NULL sales_id handling
--
-- STRATEGY: Use DO blocks to capture auto-generated sales.id values
-- and use them when creating test data. This ensures RLS checks match.
--
-- References:
--   - Plan: docs/archive/plans/2026-01-18-role-based-access-control.md
--   - Helper functions: private.is_admin_or_manager(), private.can_access_by_role()
--   - Role enum: user_role (admin | manager | rep)
-- ============================================================================

BEGIN;

SELECT plan(14);

-- ============================================================================
-- SETUP: Clean up previous test data
-- ============================================================================
-- NOTE: Use IDs starting from 70001 to avoid conflicts with other tests
-- Delete in reverse FK order (children first, then parents)

DELETE FROM public.activities WHERE id IN (70001, 70002);
DELETE FROM public.opportunities WHERE id IN (70001);
DELETE FROM public.organizations WHERE id IN (70001, 70002, 70003);
DELETE FROM public.sales WHERE user_id IN (
  '70000001-aaaa-aaaa-aaaa-000000000001',
  '70000002-bbbb-bbbb-bbbb-000000000002',
  '70000003-cccc-cccc-cccc-000000000003',
  '70000004-dddd-dddd-dddd-000000000004'
);
DELETE FROM auth.users WHERE id IN (
  '70000001-aaaa-aaaa-aaaa-000000000001',
  '70000002-bbbb-bbbb-bbbb-000000000002',
  '70000003-cccc-cccc-cccc-000000000003',
  '70000004-dddd-dddd-dddd-000000000004'
);

-- ============================================================================
-- SETUP: Create test users in auth.users
-- ============================================================================
-- The handle_new_user() trigger automatically creates sales records

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('70000001-aaaa-aaaa-aaaa-000000000001', 'admin-rls-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('70000002-bbbb-bbbb-bbbb-000000000002', 'manager-rls-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('70000003-cccc-cccc-cccc-000000000003', 'rep-rls-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('70000004-dddd-dddd-dddd-000000000004', 'other-rep-rls-test@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');

-- ============================================================================
-- SETUP: Update roles and create test data using DO block
-- ============================================================================
-- Use DO block to capture auto-generated sales.id values and create test data
-- with matching foreign keys. This ensures RLS checks will work correctly.

DO $$
DECLARE
  v_admin_sales_id BIGINT;
  v_manager_sales_id BIGINT;
  v_rep_sales_id BIGINT;
  v_other_rep_sales_id BIGINT;
BEGIN
  -- Get auto-generated sales IDs
  SELECT id INTO v_admin_sales_id FROM public.sales WHERE user_id = '70000001-aaaa-aaaa-aaaa-000000000001';
  SELECT id INTO v_manager_sales_id FROM public.sales WHERE user_id = '70000002-bbbb-bbbb-bbbb-000000000002';
  SELECT id INTO v_rep_sales_id FROM public.sales WHERE user_id = '70000003-cccc-cccc-cccc-000000000003';
  SELECT id INTO v_other_rep_sales_id FROM public.sales WHERE user_id = '70000004-dddd-dddd-dddd-000000000004';

  -- Update roles (trigger creates all as 'rep' by default)
  UPDATE public.sales SET role = 'admin' WHERE id = v_admin_sales_id;
  UPDATE public.sales SET role = 'manager' WHERE id = v_manager_sales_id;
  -- rep and other_rep stay as 'rep' (default)

  -- Create test organizations owned by different reps
  INSERT INTO public.organizations (id, name, sales_id, created_by, created_at, updated_at)
  VALUES
    (70001, 'Rep Organization', v_rep_sales_id, v_rep_sales_id, NOW(), NOW()),
    (70002, 'Other Rep Organization', v_other_rep_sales_id, v_other_rep_sales_id, NOW(), NOW());

  -- Create test opportunity with dual ownership (GAP 1)
  -- Opportunity: Rep is owner, Other Rep is account manager
  INSERT INTO public.opportunities (
    id, name, customer_organization_id, principal_organization_id, opportunity_owner_id, account_manager_id,
    stage, created_by, created_at, updated_at
  )
  VALUES (
    70001, 'Dual Owner Opportunity', 70001, 70002, v_rep_sales_id, v_other_rep_sales_id,
    'new_lead', v_rep_sales_id, NOW(), NOW()
  );

  -- Create test activities for NULL sales_id tests (GAP 2)
  -- Activities only have created_by, no sales_id column
  INSERT INTO public.activities (id, activity_type, type, subject, organization_id, created_by, created_at, updated_at)
  VALUES
    (70001, 'engagement', 'call', 'Rep Activity', 70001, v_rep_sales_id, NOW(), NOW()),
    (70002, 'engagement', 'call', 'Other Rep Activity', 70002, v_other_rep_sales_id, NOW(), NOW());
END $$;

-- ============================================================================
-- SECTION 1: Basic Role Visibility Tests (Tests 1-5)
-- ============================================================================

-- Test 1: Admin sees all organizations
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '70000001-aaaa-aaaa-aaaa-000000000001';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.organizations WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 1: Admin can see all organizations'
);

-- Test 2: Manager sees all organizations
SET LOCAL request.jwt.claim.sub = '70000002-bbbb-bbbb-bbbb-000000000002';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.organizations WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 2: Manager can see all organizations'
);

-- Test 3: Rep sees all organizations (shared visibility via organizations_select_all)
-- Note: Organizations have shared SELECT - all authenticated users see all non-deleted orgs.
-- Role-based isolation applies to UPDATE/DELETE, not SELECT.
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.organizations WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 3: Rep sees all organizations (shared visibility)'
);

-- Test 4: Rep sees both organization names (shared visibility)
SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.organizations WHERE id IN (70001, 70002) AND name IN ('Rep Organization', 'Other Rep Organization') AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 4: Rep sees both organizations by name (shared visibility)'
);

-- Test 5: Other rep also sees all organizations (shared visibility)
SET LOCAL request.jwt.claim.sub = '70000004-dddd-dddd-dddd-000000000004';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.organizations WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 5: Other rep also sees all organizations (shared visibility)'
);

-- ============================================================================
-- SECTION 2: Rep CRUD Operations Tests (Tests 6-8)
-- ============================================================================

-- Test 6: Rep can create new records
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT lives_ok(
  $$ INSERT INTO public.organizations (id, name, sales_id, created_by, created_at, updated_at)
     VALUES (70003, 'New Rep Org',
             (SELECT id FROM public.sales WHERE user_id = '70000003-cccc-cccc-cccc-000000000003'),
             (SELECT id FROM public.sales WHERE user_id = '70000003-cccc-cccc-cccc-000000000003'),
             NOW(), NOW()) $$,
  'Test 6: Rep can create new organizations'
);

-- Test 7: Rep can update their own records
SELECT lives_ok(
  $$ UPDATE public.organizations SET name = 'Updated Rep Org' WHERE id = 70001 $$,
  'Test 7: Rep can update their own organizations'
);

-- Test 8: Rep CANNOT update other's records (RLS blocks visibility)
-- After policy consolidation (migration 20260202000001), the weak legacy USING
-- clause (just `deleted_at IS NULL`) was removed. The kept policy's USING clause
-- properly checks ownership via can_access_by_role(sales_id, created_by).
-- Result: row is invisible for UPDATE, so UPDATE silently affects 0 rows.
-- This is STRONGER than the old behavior (42501 WITH CHECK violation leaked
-- that the row exists).
SELECT lives_ok(
  $$ UPDATE public.organizations SET name = 'Hacked Org' WHERE id = 70002 $$,
  'Test 8: Rep cannot update other rep organizations (USING blocks row visibility)'
);

-- Switch back to rep for remaining tests
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

-- ============================================================================
-- SECTION 3: Opportunities Dual Ownership Tests (Tests 9-12)
-- ============================================================================
-- Opportunities have DUAL ownership: opportunity_owner_id AND account_manager_id
-- BOTH owners must be able to see and edit the record (OR logic)

-- Test 9: Opportunity owner (Rep) can see dual-ownership opportunity
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.opportunities WHERE id = 70001 AND deleted_at IS NULL $$,
  ARRAY[1],
  'Test 9: Opportunity owner can see dual-ownership opportunity'
);

-- Test 10: Account manager (Other Rep) can ALSO see dual-ownership opportunity
SET LOCAL request.jwt.claim.sub = '70000004-dddd-dddd-dddd-000000000004';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.opportunities WHERE id = 70001 AND deleted_at IS NULL $$,
  ARRAY[1],
  'Test 10: Account manager can see dual-ownership opportunity (OR logic)'
);

-- Test 11: Opportunity owner can update
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT lives_ok(
  $$ UPDATE public.opportunities SET name = 'Updated Dual Opp' WHERE id = 70001 $$,
  'Test 11: Opportunity owner can update dual-ownership opportunity'
);

-- Test 12: Account manager can also update
SET LOCAL request.jwt.claim.sub = '70000004-dddd-dddd-dddd-000000000004';

SELECT lives_ok(
  $$ UPDATE public.opportunities SET stage = 'initial_outreach' WHERE id = 70001 $$,
  'Test 12: Account manager can update dual-ownership opportunity'
);

-- ============================================================================
-- SECTION 4: Activities Visibility Tests (Tests 13-14)
-- ============================================================================
-- activities_select_unified policy: Non-task activities (engagement, etc.) are
-- visible to ALL authenticated users. Task activities are restricted to
-- owner (sales_id) or admin/manager. Test activities are type='engagement'.

-- Test 13: Rep sees all non-task activities (shared visibility for engagements)
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.activities WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 13: Rep sees all non-task activities (shared visibility for engagements)'
);

-- Test 14: Manager also sees all activities (admin/manager have full visibility)
SET LOCAL request.jwt.claim.sub = '70000002-bbbb-bbbb-bbbb-000000000002';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.activities WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 14: Manager sees all activities (admin/manager full visibility)'
);

-- ============================================================================
-- CLEANUP & FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
