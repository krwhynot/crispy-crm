-- ============================================================================
-- 070-role-based-rls.test.sql
-- ============================================================================
-- PURPOSE: TDD tests for role-based RLS policies
--
-- SECURITY MODEL (Role-based Access):
--   1. Admin/Manager: Can see ALL records (global visibility)
--   2. Rep: Can only see records they own (sales_id or created_by match)
--   3. Tasks: Personal access only (even managers cannot see others' tasks)
--
-- TEST COVERAGE (17 tests):
--   Tests 1-5:   Basic role visibility (organizations)
--   Tests 6-8:   Rep CRUD operations
--   Tests 9-11:  Tasks visibility (personal access)
--   Tests 12-15: GAP 1 - Opportunities dual ownership (OR logic)
--   Tests 16-17: GAP 2 - Activities NULL sales_id handling
--
-- References:
--   - Plan: docs/archive/plans/2026-01-18-role-based-access-control.md
--   - Helper functions: is_admin(), is_manager(), is_manager_or_admin(), current_sales_id()
--   - Role enum: user_role (admin | manager | rep)
-- ============================================================================

BEGIN;

SELECT plan(17);

-- ============================================================================
-- SETUP: Clean up previous test data
-- ============================================================================
-- NOTE: Use IDs starting from 70001 to avoid conflicts with other tests
-- Delete in reverse FK order (children first, then parents)

DELETE FROM public.activities WHERE id IN (70001, 70002);
DELETE FROM public.opportunities WHERE id IN (70001);
DELETE FROM public.tasks WHERE id IN (70001, 70002);
DELETE FROM public.organizations WHERE id IN (70001, 70002, 70003);
DELETE FROM public.sales WHERE id IN (70001, 70002, 70003, 70004);
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
-- SETUP: Update sales records with test IDs and roles
-- ============================================================================
-- Sales records auto-created by trigger - update with predictable IDs and roles

UPDATE public.sales SET id = 70001, role = 'admin' WHERE user_id = '70000001-aaaa-aaaa-aaaa-000000000001';
UPDATE public.sales SET id = 70002, role = 'manager' WHERE user_id = '70000002-bbbb-bbbb-bbbb-000000000002';
UPDATE public.sales SET id = 70003, role = 'rep' WHERE user_id = '70000003-cccc-cccc-cccc-000000000003';
UPDATE public.sales SET id = 70004, role = 'rep' WHERE user_id = '70000004-dddd-dddd-dddd-000000000004';

-- ============================================================================
-- SETUP: Create test organizations owned by different reps
-- ============================================================================

INSERT INTO public.organizations (id, name, sales_id, created_by, created_at, updated_at)
VALUES
  (70001, 'Rep Organization', 70003, 70003, NOW(), NOW()),
  (70002, 'Other Rep Organization', 70004, 70004, NOW(), NOW());

-- ============================================================================
-- SETUP: Create test tasks for task visibility tests
-- ============================================================================

INSERT INTO public.tasks (id, title, sales_id, created_by, created_at, updated_at)
VALUES
  (70001, 'Rep Task', 70003, 70003, NOW(), NOW());

-- ============================================================================
-- SETUP: Create test opportunity with dual ownership (GAP 1)
-- ============================================================================
-- Opportunity: Rep (70003) is owner, Other Rep (70004) is account manager

INSERT INTO public.opportunities (
  id, name, principal_organization_id, opportunity_owner_id, account_manager_id,
  stage, created_by, created_at, updated_at
)
VALUES (
  70001, 'Dual Owner Opportunity', 70001, 70003, 70004,
  'new_lead', 70003, NOW(), NOW()
);

-- ============================================================================
-- SETUP: Create test activities for NULL sales_id tests (GAP 2)
-- ============================================================================
-- Activities only have created_by, no sales_id column

INSERT INTO public.activities (id, type, subject, created_by, created_at, updated_at)
VALUES
  (70001, 'call', 'Rep Activity', 70003, NOW(), NOW()),
  (70002, 'call', 'Other Rep Activity', 70004, NOW(), NOW());

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

-- Test 3: Rep sees only their own organizations
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.organizations WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[1],
  'Test 3: Rep can only see their own organizations'
);

-- Test 4: Rep sees correct organization name
SELECT results_eq(
  $$ SELECT name FROM public.organizations WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY['Rep Organization'::text],
  'Test 4: Rep sees correct organization (Rep Organization)'
);

-- Test 5: Other rep sees only their organization
SET LOCAL request.jwt.claim.sub = '70000004-dddd-dddd-dddd-000000000004';

SELECT results_eq(
  $$ SELECT name FROM public.organizations WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY['Other Rep Organization'::text],
  'Test 5: Other rep sees only their organization'
);

-- ============================================================================
-- SECTION 2: Rep CRUD Operations Tests (Tests 6-8)
-- ============================================================================

-- Test 6: Rep can create new records
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT lives_ok(
  $$ INSERT INTO public.organizations (id, name, sales_id, created_by, created_at, updated_at)
     VALUES (70003, 'New Rep Org', 70003, 70003, NOW(), NOW()) $$,
  'Test 6: Rep can create new organizations'
);

-- Test 7: Rep can update their own records
SELECT lives_ok(
  $$ UPDATE public.organizations SET name = 'Updated Rep Org' WHERE id = 70001 $$,
  'Test 7: Rep can update their own organizations'
);

-- Test 8: Rep CANNOT update other's records (RLS violation)
SELECT throws_ok(
  $$ UPDATE public.organizations SET name = 'Hacked Org' WHERE id = 70002 $$,
  '42501', -- RLS policy violation error code
  NULL,
  'Test 8: Rep cannot update other rep organizations (RLS enforced)'
);

-- ============================================================================
-- SECTION 3: Tasks Visibility Tests (Tests 9-11)
-- ============================================================================
-- Tasks are personal - only owners can see their tasks
-- Note: This tests the CURRENT behavior; manager visibility is a separate feature

-- Test 9: Rep sees their own tasks
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT isnt_empty(
  $$ SELECT id FROM public.tasks WHERE id = 70001 AND deleted_at IS NULL $$,
  'Test 9: Rep can see their own tasks'
);

-- Test 10: Other rep cannot see rep's tasks (personal access)
SET LOCAL request.jwt.claim.sub = '70000004-dddd-dddd-dddd-000000000004';

SELECT is_empty(
  $$ SELECT id FROM public.tasks WHERE id = 70001 AND deleted_at IS NULL $$,
  'Test 10: Other rep cannot see rep tasks (personal access enforced)'
);

-- Test 11: Manager can see all tasks
SET LOCAL request.jwt.claim.sub = '70000002-bbbb-bbbb-bbbb-000000000002';

SELECT isnt_empty(
  $$ SELECT id FROM public.tasks WHERE id = 70001 AND deleted_at IS NULL $$,
  'Test 11: Manager can see all tasks'
);

-- ============================================================================
-- SECTION 4: GAP 1 - Opportunities Dual Ownership Tests (Tests 12-15)
-- ============================================================================
-- Opportunities have DUAL ownership: opportunity_owner_id AND account_manager_id
-- BOTH owners must be able to see and edit the record (OR logic)

-- Test 12: Opportunity owner (Rep) can see dual-ownership opportunity
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.opportunities WHERE id = 70001 AND deleted_at IS NULL $$,
  ARRAY[1],
  'Test 12: Opportunity owner can see dual-ownership opportunity'
);

-- Test 13: Account manager (Other Rep) can ALSO see dual-ownership opportunity
SET LOCAL request.jwt.claim.sub = '70000004-dddd-dddd-dddd-000000000004';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.opportunities WHERE id = 70001 AND deleted_at IS NULL $$,
  ARRAY[1],
  'Test 13: Account manager can see dual-ownership opportunity (OR logic)'
);

-- Test 14: Opportunity owner can update
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT lives_ok(
  $$ UPDATE public.opportunities SET name = 'Updated Dual Opp' WHERE id = 70001 $$,
  'Test 14: Opportunity owner can update dual-ownership opportunity'
);

-- Test 15: Account manager can also update
SET LOCAL request.jwt.claim.sub = '70000004-dddd-dddd-dddd-000000000004';

SELECT lives_ok(
  $$ UPDATE public.opportunities SET stage = 'initial_outreach' WHERE id = 70001 $$,
  'Test 15: Account manager can update dual-ownership opportunity'
);

-- ============================================================================
-- SECTION 5: GAP 2 - Activities NULL sales_id Tests (Tests 16-17)
-- ============================================================================
-- Activities table does NOT have a sales_id column, only created_by
-- Must verify NULL handling doesn't cause errors or accidental blocks

-- Test 16: Rep sees only activities they created (NULL sales_id handled)
SET LOCAL request.jwt.claim.sub = '70000003-cccc-cccc-cccc-000000000003';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.activities WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[1],
  'Test 16: Rep sees only their activities (NULL sales_id handled correctly)'
);

-- Test 17: Manager sees all activities (NULL sales_id no issue for managers)
SET LOCAL request.jwt.claim.sub = '70000002-bbbb-bbbb-bbbb-000000000002';

SELECT results_eq(
  $$ SELECT COUNT(*)::integer FROM public.activities WHERE id IN (70001, 70002) AND deleted_at IS NULL $$,
  ARRAY[2],
  'Test 17: Manager sees all activities despite NULL sales_id'
);

-- ============================================================================
-- CLEANUP & FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
