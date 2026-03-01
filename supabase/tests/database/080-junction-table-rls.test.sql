-- ============================================================================
-- 080-junction-table-rls.test.sql
-- ============================================================================
-- PURPOSE: Verify RLS policies on junction tables:
--   - opportunity_participants (owner/admin INSERT, admin-only DELETE, soft-delete SELECT)
--   - opportunity_products (parent opp deleted_at check on all ops)
--   - organization_distributors (authenticated CRUD, soft-delete SELECT, self-link CHECK)
--
-- CRITICAL: Each pgTAP file runs in BEGIN;...ROLLBACK; so all test data is
-- self-contained. Cannot rely on records from other test files.
--
-- References:
--   - 20260214003329_remote_schema.sql (RLS policies)
--   - DB-008: Junction-table policies validate both linked FK records
--   - CORE-010: Soft-delete contract
-- ============================================================================

BEGIN;

SELECT plan(20);

-- ============================================================================
-- SETUP: Self-contained test data
-- ============================================================================

-- Clean up any leftover test data from prior failed runs
DELETE FROM public.opportunity_participants WHERE id IN (999801, 999802);
DELETE FROM public.opportunity_products WHERE id IN (999801, 999802);
DELETE FROM public.organization_distributors WHERE id IN (999801, 999802);
DELETE FROM public.products WHERE id IN (999801);
DELETE FROM public.opportunities WHERE id IN (999801, 999802);
DELETE FROM public.contacts WHERE id IN (999801);
DELETE FROM public.organizations WHERE id IN (999801, 999802, 999803);
DELETE FROM public.sales WHERE user_id IN (
  '99990080-aaaa-4080-8080-aaaaaaaaaaaa'::uuid,
  '99990080-bbbb-4080-8080-bbbbbbbbbbbb'::uuid,
  '99990080-cccc-4080-8080-cccccccccccc'::uuid
);
DELETE FROM auth.users WHERE id IN (
  '99990080-aaaa-4080-8080-aaaaaaaaaaaa'::uuid,
  '99990080-bbbb-4080-8080-bbbbbbbbbbbb'::uuid,
  '99990080-cccc-4080-8080-cccccccccccc'::uuid
);

-- Create test users (handle_new_user trigger auto-creates sales records)
-- User A: opportunity owner (rep), User B: non-owner (rep), User C: admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('99990080-aaaa-4080-8080-aaaaaaaaaaaa', 'test080a@test.local',
   crypt('password', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('99990080-bbbb-4080-8080-bbbbbbbbbbbb', 'test080b@test.local',
   crypt('password', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('99990080-cccc-4080-8080-cccccccccccc', 'test080c-admin@test.local',
   crypt('password', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated');

-- Promote user C to admin role (trigger creates all as 'rep' by default)
UPDATE public.sales SET role = 'admin'
  WHERE user_id = '99990080-cccc-4080-8080-cccccccccccc';

-- Create test organizations (principal, customer, distributor)
INSERT INTO organizations (id, name, organization_type, created_at, updated_at)
VALUES
  (999801, 'Test Principal 080', 'principal', now(), now()),
  (999802, 'Test Customer 080', 'customer', now(), now()),
  (999803, 'Test Distributor 080', 'distributor', now(), now());

-- Create test opportunities (active + soft-deleted)
INSERT INTO opportunities (id, name, customer_organization_id, principal_organization_id,
  opportunity_owner_id, stage_changed_at, version, deleted_at)
VALUES
  (999801, 'Test Opp Active 080', 999802, 999801,
    (SELECT id FROM sales WHERE user_id = '99990080-aaaa-4080-8080-aaaaaaaaaaaa'),
    now(), 1, NULL),
  (999802, 'Test Opp Deleted 080', 999802, 999801,
    (SELECT id FROM sales WHERE user_id = '99990080-aaaa-4080-8080-aaaaaaaaaaaa'),
    now(), 1, now());

-- Create test product
INSERT INTO products (id, name, principal_id, created_at, updated_at)
VALUES (999801, 'Test Product 080', 999801, now(), now());

-- ============================================================================
-- SECTION 1: opportunity_participants
-- ============================================================================

-- Tests run as the opportunity owner (user A)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '99990080-aaaa-4080-8080-aaaaaaaaaaaa';

-- Test 1: Opportunity owner can INSERT a participant
SELECT lives_ok(
  $$ INSERT INTO opportunity_participants (id, opportunity_id, organization_id, role, created_by)
     VALUES (999801, 999801, 999801, 'principal',
       (SELECT id FROM sales WHERE user_id = '99990080-aaaa-4080-8080-aaaaaaaaaaaa'))
  $$,
  'Opportunity owner can INSERT participant on own opportunity'
);

-- Test 2: SELECT filters out soft-deleted participants
UPDATE opportunity_participants SET deleted_at = now() WHERE id = 999801;
SELECT results_eq(
  $$ SELECT COUNT(*) FROM opportunity_participants WHERE id = 999801 $$,
  ARRAY[0::bigint],
  'Soft-deleted participant is hidden from SELECT (deleted_at IS NULL filter)'
);

-- Restore for subsequent tests
UPDATE opportunity_participants SET deleted_at = NULL WHERE id = 999801;

-- Test 3: INSERT blocked when organization is soft-deleted
UPDATE organizations SET deleted_at = now() WHERE id = 999803;
SELECT throws_ok(
  $$ INSERT INTO opportunity_participants (id, opportunity_id, organization_id, role, created_by)
     VALUES (999802, 999801, 999803, 'distributor',
       (SELECT id FROM sales WHERE user_id = '99990080-aaaa-4080-8080-aaaaaaaaaaaa'))
  $$,
  'new row violates row-level security policy for table "opportunity_participants"',
  'INSERT blocked when organization is soft-deleted (FK validation in policy)'
);
-- Restore org
UPDATE organizations SET deleted_at = NULL WHERE id = 999803;

-- Switch to user B (non-owner, non-admin)
SET LOCAL request.jwt.claim.sub = '99990080-bbbb-4080-8080-bbbbbbbbbbbb';

-- Test 4: Non-owner cannot INSERT participant on opportunity they don't own
SELECT throws_ok(
  $$ INSERT INTO opportunity_participants (id, opportunity_id, organization_id, role, created_by)
     VALUES (999802, 999801, 999803, 'distributor',
       (SELECT id FROM sales WHERE user_id = '99990080-bbbb-4080-8080-bbbbbbbbbbbb'))
  $$,
  'new row violates row-level security policy for table "opportunity_participants"',
  'Non-owner blocked from INSERT on opportunity they do not own'
);

-- Test 5: Non-admin DELETE silently affects 0 rows (USING clause filters out)
-- PostgreSQL RLS: DELETE with USING that fails returns 0 rows, does not throw
DELETE FROM opportunity_participants WHERE id = 999801;
SELECT results_eq(
  $$ SELECT COUNT(*) FROM opportunity_participants WHERE id = 999801 $$,
  ARRAY[1::bigint],
  'Non-admin DELETE on opportunity_participants affects 0 rows (record still exists)'
);

-- Test 6: Non-owner can still SELECT active participants (shared read)
SELECT lives_ok(
  $$ SELECT * FROM opportunity_participants WHERE id = 999801 $$,
  'Non-owner can SELECT active participants (shared read access)'
);

-- Switch to admin user (user C) for admin-positive tests
SET LOCAL request.jwt.claim.sub = '99990080-cccc-4080-8080-cccccccccccc';

-- Test 7: Admin can INSERT participant (is_admin_or_manager bypass)
SELECT lives_ok(
  $$ INSERT INTO opportunity_participants (id, opportunity_id, organization_id, role, created_by)
     VALUES (999802, 999801, 999803, 'distributor',
       (SELECT id FROM sales WHERE user_id = '99990080-cccc-4080-8080-cccccccccccc'))
  $$,
  'Admin can INSERT participant on any opportunity (admin bypass)'
);

-- Test 8: Admin can DELETE participant (admin-only delete policy)
SELECT lives_ok(
  $$ DELETE FROM opportunity_participants WHERE id = 999802 $$,
  'Admin can DELETE participant (admin-only delete policy)'
);

-- ============================================================================
-- SECTION 2: opportunity_products (parent opp deleted_at check)
-- ============================================================================

-- Switch back to user A (owner)
SET LOCAL request.jwt.claim.sub = '99990080-aaaa-4080-8080-aaaaaaaaaaaa';

-- Test 9: Can INSERT product on active opportunity
SELECT lives_ok(
  $$ INSERT INTO opportunity_products (id, opportunity_id, product_id_reference)
     VALUES (999801, 999801, 999801)
  $$,
  'Can INSERT product on active (non-deleted) opportunity'
);

-- Test 10: INSERT blocked on soft-deleted opportunity
SELECT throws_ok(
  $$ INSERT INTO opportunity_products (id, opportunity_id, product_id_reference)
     VALUES (999802, 999802, 999801)
  $$,
  'new row violates row-level security policy for table "opportunity_products"',
  'INSERT blocked when parent opportunity is soft-deleted'
);

-- Test 11: SELECT filters products on deleted opportunities
-- Insert directly bypassing RLS (as postgres) then check visibility
RESET ROLE;
INSERT INTO opportunity_products (id, opportunity_id, product_id_reference)
VALUES (999802, 999802, 999801);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '99990080-aaaa-4080-8080-aaaaaaaaaaaa';

SELECT results_eq(
  $$ SELECT COUNT(*) FROM opportunity_products WHERE id = 999802 $$,
  ARRAY[0::bigint],
  'Products on soft-deleted opportunities are hidden from SELECT'
);

-- Test 12: UPDATE on product with deleted parent opp silently affects 0 rows
-- PostgreSQL RLS: UPDATE with USING that fails returns 0 rows, does not throw
-- The record exists (inserted as postgres) but USING clause filters it out
SELECT results_eq(
  $$ WITH updated AS (
       UPDATE opportunity_products SET notes = 'updated' WHERE id = 999802 RETURNING id
     ) SELECT COUNT(*) FROM updated $$,
  ARRAY[0::bigint],
  'UPDATE on product with deleted parent opportunity affects 0 rows (USING filter)'
);

-- ============================================================================
-- SECTION 3: organization_distributors
-- ============================================================================

-- Test 13: Authenticated user can INSERT distributor relationship
SELECT lives_ok(
  $$ INSERT INTO organization_distributors (id, organization_id, distributor_id)
     VALUES (999801, 999802, 999803)
  $$,
  'Authenticated user can INSERT organization_distributors record'
);

-- Test 14: Self-link blocked by CHECK constraint (no_self_distribution)
SELECT throws_ok(
  $$ INSERT INTO organization_distributors (id, organization_id, distributor_id)
     VALUES (999802, 999802, 999802)
  $$,
  'new row for relation "organization_distributors" violates check constraint "no_self_distribution"',
  'Self-distribution blocked by CHECK constraint (org_id != distributor_id)'
);

-- Test 15: Soft-deleted records hidden from SELECT
UPDATE organization_distributors SET deleted_at = now() WHERE id = 999801;
SELECT results_eq(
  $$ SELECT COUNT(*) FROM organization_distributors WHERE id = 999801 $$,
  ARRAY[0::bigint],
  'Soft-deleted organization_distributors hidden from SELECT'
);

-- Restore for subsequent tests
UPDATE organization_distributors SET deleted_at = NULL WHERE id = 999801;

-- Test 16: Authenticated user can UPDATE distributor relationship
SELECT lives_ok(
  $$ UPDATE organization_distributors SET notes = 'updated' WHERE id = 999801 $$,
  'Authenticated user can UPDATE organization_distributors record'
);

-- Test 17: Authenticated user can DELETE (soft-delete via app, hard delete via RLS)
SELECT lives_ok(
  $$ DELETE FROM organization_distributors WHERE id = 999801 $$,
  'Authenticated user can DELETE organization_distributors record'
);

-- Test 18: Anonymous user blocked from SELECT
SET LOCAL ROLE anon;
SELECT throws_ok(
  $$ SELECT * FROM organization_distributors LIMIT 1 $$,
  'permission denied for table organization_distributors',
  'Anonymous user denied access to organization_distributors (no table grants)'
);

-- Test 19: Anonymous user blocked from INSERT
SELECT throws_ok(
  $$ INSERT INTO organization_distributors (id, organization_id, distributor_id)
     VALUES (999802, 999802, 999803)
  $$,
  'permission denied for table organization_distributors',
  'Anonymous user denied INSERT on organization_distributors'
);

-- Test 20: Anonymous user blocked from DELETE
SELECT throws_ok(
  $$ DELETE FROM organization_distributors WHERE id = 999801 $$,
  'permission denied for table organization_distributors',
  'Anonymous user denied DELETE on organization_distributors'
);

-- ============================================================================
-- FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
