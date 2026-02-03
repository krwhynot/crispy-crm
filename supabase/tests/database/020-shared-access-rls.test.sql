-- ============================================================================
-- 020-shared-access-rls.test.sql
-- ============================================================================
-- PURPOSE: Verify shared team access RLS model for Crispy CRM
--
-- SECURITY MODEL (Single-Tenant CRM):
--   1. Authentication boundary - must be logged in
--   2. Audit trail - track changes
--   3. Soft deletes - prevent data loss
--
-- Tables with SHARED ACCESS (all authenticated users can read/write):
--   - activities
--   - contacts
--   - contact_notes
--   - organizations
--   - organization_notes
--   - opportunities
--   - opportunity_notes
--   - products
--   - segments
--   - tags
--
-- FIX (Feb 2026): Added self-contained test user guard to avoid
-- segments.created_by NOT NULL violation when no sales records exist.
-- Uses dedicated auth.users insert (handle_new_user trigger creates sales row).
--
-- References:
--   - Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
--   - pgTAP: https://pgtap.org
-- ============================================================================

BEGIN;

-- Plan: 30 tests total
-- - 10 tables x 2 tests (authenticated SELECT + anonymous denied)
-- + 10 soft-delete filter tests
SELECT plan(30);

-- ============================================================================
-- SETUP: Create test data for soft-delete filtering verification
-- ============================================================================

-- Guard: create a dedicated test user so sales records are guaranteed to exist.
-- The handle_new_user() trigger auto-creates a sales record on auth.users INSERT.
DELETE FROM public.sales WHERE user_id = '99990020-aaaa-aaaa-aaaa-000000000001';
DELETE FROM auth.users WHERE id = '99990020-aaaa-aaaa-aaaa-000000000001';

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('99990020-aaaa-aaaa-aaaa-000000000001', 'test-020@test.local', 'password', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');

-- Insert test organization (needed as FK for other tables)
INSERT INTO organizations (id, name, deleted_at)
VALUES
  (999901, 'Test Org Active', NULL),
  (999902, 'Test Org Deleted', NOW());

-- Insert test contact (needed as FK for notes)
INSERT INTO contacts (id, name, organization_id, deleted_at)
VALUES
  (999901, 'Test Contact Active', 999901, NULL),
  (999902, 'Test Contact Deleted', 999901, NOW());

-- Insert test opportunity (needed as FK for notes)
-- principal_organization_id is required (NOT NULL constraint)
INSERT INTO opportunities (id, name, customer_organization_id, principal_organization_id, opportunity_owner_id, deleted_at, stage)
VALUES
  (999901, 'Test Opp Active', 999901, 999901, (SELECT id FROM sales WHERE user_id = '99990020-aaaa-aaaa-aaaa-000000000001'), NULL, 'new_lead'),
  (999902, 'Test Opp Deleted', 999901, 999901, (SELECT id FROM sales WHERE user_id = '99990020-aaaa-aaaa-aaaa-000000000001'), NOW(), 'new_lead');

-- Insert test products
INSERT INTO products (id, principal_id, name, category, deleted_at)
VALUES
  (999901, 999901, 'Test Product Active', 'Test', NULL),
  (999902, 999901, 'Test Product Deleted', 'Test', NOW());

-- Insert test segments (created_by is UUID, use auth user UUID directly)
INSERT INTO segments (id, name, created_by, deleted_at)
VALUES
  ('99990001-0000-0000-0000-000000000001', 'Test Segment Active', '99990020-aaaa-aaaa-aaaa-000000000001'::uuid, NULL),
  ('99990001-0000-0000-0000-000000000002', 'Test Segment Deleted', '99990020-aaaa-aaaa-aaaa-000000000001'::uuid, NOW());

-- Insert test tags
INSERT INTO tags (id, name, deleted_at)
VALUES
  (999901, 'test-tag-active', NULL),
  (999902, 'test-tag-deleted', NOW());

-- Insert test activities (use 'engagement' type to avoid opportunity_id requirement)
INSERT INTO activities (id, activity_type, type, subject, organization_id, deleted_at)
VALUES
  (999901, 'engagement', 'check_in', 'Test Activity Active', 999901, NULL),
  (999902, 'engagement', 'check_in', 'Test Activity Deleted', 999901, NOW());

-- Insert test contact notes
INSERT INTO contact_notes (id, contact_id, text, deleted_at)
VALUES
  (999901, 999901, 'Test Contact Note Active', NULL),
  (999902, 999901, 'Test Contact Note Deleted', NOW());

-- Insert test organization notes
INSERT INTO organization_notes (id, organization_id, text, deleted_at)
VALUES
  (999901, 999901, 'Test Org Note Active', NULL),
  (999902, 999901, 'Test Org Note Deleted', NOW());

-- Insert test opportunity notes
INSERT INTO opportunity_notes (id, opportunity_id, text, deleted_at)
VALUES
  (999901, 999901, 'Test Opp Note Active', NULL),
  (999902, 999901, 'Test Opp Note Deleted', NOW());

-- ============================================================================
-- SECTION 1: Authenticated users CAN access shared tables
-- ============================================================================

-- Set up as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- Test 1: Authenticated user can SELECT from contacts
SELECT lives_ok(
  $$ SELECT * FROM contacts LIMIT 1 $$,
  'Authenticated user can SELECT from contacts'
);

-- Test 2: Authenticated user can SELECT from organizations
SELECT lives_ok(
  $$ SELECT * FROM organizations LIMIT 1 $$,
  'Authenticated user can SELECT from organizations'
);

-- Test 3: Authenticated user can SELECT from activities
SELECT lives_ok(
  $$ SELECT * FROM activities LIMIT 1 $$,
  'Authenticated user can SELECT from activities'
);

-- Test 4: Authenticated user can SELECT from opportunities
SELECT lives_ok(
  $$ SELECT * FROM opportunities LIMIT 1 $$,
  'Authenticated user can SELECT from opportunities'
);

-- Test 5: Authenticated user can SELECT from products
SELECT lives_ok(
  $$ SELECT * FROM products LIMIT 1 $$,
  'Authenticated user can SELECT from products'
);

-- Test 6: Authenticated user can SELECT from segments
SELECT lives_ok(
  $$ SELECT * FROM segments LIMIT 1 $$,
  'Authenticated user can SELECT from segments'
);

-- Test 7: Authenticated user can SELECT from tags
SELECT lives_ok(
  $$ SELECT * FROM tags LIMIT 1 $$,
  'Authenticated user can SELECT from tags'
);

-- Test 8: Authenticated user can SELECT from contact_notes
SELECT lives_ok(
  $$ SELECT * FROM contact_notes LIMIT 1 $$,
  'Authenticated user can SELECT from contact_notes'
);

-- Test 9: Authenticated user can SELECT from organization_notes
SELECT lives_ok(
  $$ SELECT * FROM organization_notes LIMIT 1 $$,
  'Authenticated user can SELECT from organization_notes'
);

-- Test 10: Authenticated user can SELECT from opportunity_notes
SELECT lives_ok(
  $$ SELECT * FROM opportunity_notes LIMIT 1 $$,
  'Authenticated user can SELECT from opportunity_notes'
);

-- ============================================================================
-- SECTION 2: Anonymous users CANNOT access shared tables
-- ============================================================================

-- Switch to anonymous role
SET LOCAL ROLE anon;

-- Test 11: Anonymous user cannot SELECT from contacts
-- NOTE: PostgreSQL RLS returns 0 rows for roles without matching policies (not permission denied)
-- This is correct security behavior - anon users see nothing
SELECT is_empty(
  $$ SELECT * FROM contacts $$,
  'Anonymous user gets empty results from contacts (RLS filters all rows)'
);

-- Test 12: Anonymous user cannot SELECT from organizations
SELECT is_empty(
  $$ SELECT * FROM organizations $$,
  'Anonymous user gets empty results from organizations (RLS filters all rows)'
);

-- Test 13: Anonymous user cannot SELECT from activities
SELECT is_empty(
  $$ SELECT * FROM activities $$,
  'Anonymous user gets empty results from activities (RLS filters all rows)'
);

-- Test 14: Anonymous user cannot SELECT from opportunities
SELECT is_empty(
  $$ SELECT * FROM opportunities $$,
  'Anonymous user gets empty results from opportunities (RLS filters all rows)'
);

-- Test 15: Anonymous user cannot SELECT from products
SELECT is_empty(
  $$ SELECT * FROM products $$,
  'Anonymous user gets empty results from products (RLS filters all rows)'
);

-- Test 16: Anonymous user cannot SELECT from segments
SELECT is_empty(
  $$ SELECT * FROM segments $$,
  'Anonymous user gets empty results from segments (RLS filters all rows)'
);

-- Test 17: Anonymous user cannot SELECT from tags
SELECT is_empty(
  $$ SELECT * FROM tags $$,
  'Anonymous user gets empty results from tags (RLS filters all rows)'
);

-- Test 18: Anonymous user cannot SELECT from contact_notes
SELECT is_empty(
  $$ SELECT * FROM contact_notes $$,
  'Anonymous user gets empty results from contact_notes (RLS filters all rows)'
);

-- Test 19: Anonymous user cannot SELECT from organization_notes
SELECT is_empty(
  $$ SELECT * FROM organization_notes $$,
  'Anonymous user gets empty results from organization_notes (RLS filters all rows)'
);

-- Test 20: Anonymous user cannot SELECT from opportunity_notes
SELECT is_empty(
  $$ SELECT * FROM opportunity_notes $$,
  'Anonymous user gets empty results from opportunity_notes (RLS filters all rows)'
);

-- ============================================================================
-- SECTION 3: Soft-delete filtering works (deleted_at IS NULL filter)
-- ============================================================================

-- Switch back to authenticated role for soft-delete tests
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- Test 21: Soft-deleted contacts are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM contacts WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted contacts are filtered by RLS (deleted_at IS NULL)'
);

-- Test 22: Soft-deleted organizations are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM organizations WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted organizations are filtered by RLS (deleted_at IS NULL)'
);

-- Test 23: Soft-deleted activities are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM activities WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted activities are filtered by RLS (deleted_at IS NULL)'
);

-- Test 24: Soft-deleted opportunities are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM opportunities WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted opportunities are filtered by RLS (deleted_at IS NULL)'
);

-- Test 25: Soft-deleted products are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM products WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted products are filtered by RLS (deleted_at IS NULL)'
);

-- Test 26: Soft-deleted segments are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM segments WHERE id = '99990001-0000-0000-0000-000000000002' $$,
  ARRAY[0::bigint],
  'Soft-deleted segments are filtered by RLS (deleted_at IS NULL)'
);

-- Test 27: Soft-deleted tags are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM tags WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted tags are filtered by RLS (deleted_at IS NULL)'
);

-- Test 28: Soft-deleted contact_notes are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM contact_notes WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted contact_notes are filtered by RLS (deleted_at IS NULL)'
);

-- Test 29: Soft-deleted organization_notes are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM organization_notes WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted organization_notes are filtered by RLS (deleted_at IS NULL)'
);

-- Test 30: Soft-deleted opportunity_notes are filtered out
SELECT results_eq(
  $$ SELECT COUNT(*) FROM opportunity_notes WHERE id = 999902 $$,
  ARRAY[0::bigint],
  'Soft-deleted opportunity_notes are filtered by RLS (deleted_at IS NULL)'
);

-- ============================================================================
-- FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
