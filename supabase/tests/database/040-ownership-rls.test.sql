-- ============================================================================
-- 040-ownership-rls.test.sql
-- ============================================================================
-- PURPOSE: Verify ownership-based RLS policy structure for Crispy CRM
--
-- SECURITY MODEL (Single-Tenant CRM - Ownership Based):
--   1. All authenticated users can READ shared data
--   2. Only OWNERS can INSERT/UPDATE their own records
--   3. MANAGERS/ADMINS can modify any record
--   4. Reference data (tags, segments, products) restricted to manager/admin
--
-- TEST STRATEGY:
--   - Verify created_by defaults are set
--   - Verify helper function exists
--   - Verify permissive policies are removed
--   - Verify ownership policies are in place
--
-- MIGRATION ALIGNMENT (Feb 2026):
--   Policy names updated to match renames introduced by migrations:
--   - 20260121000004: activities_delete_unified, activities_update_unified
--   - 20260121053244: activities_select_unified, contacts_select_all
--   - 20260122184338: delete_tags_admin, update_tags_admin
--   - 20260125000001: delete_activities, delete_contacts (legacy duplicates)
--   - 20260125233756: activities_insert_policy
--
-- ============================================================================

BEGIN;

SELECT plan(15);

-- ============================================================================
-- SECTION 1: Helper function verification
-- ============================================================================

-- Test 1: is_owner_or_privileged function exists
SELECT has_function(
  'public',
  'is_owner_or_privileged',
  ARRAY['bigint'],
  'is_owner_or_privileged helper function exists'
);

-- Test 2: Function has correct security settings (search_path hardened)
SELECT ok(
  (SELECT proconfig::text LIKE '%search_path%'
   FROM pg_proc
   WHERE proname = 'is_owner_or_privileged'),
  'is_owner_or_privileged has search_path hardened'
);

-- ============================================================================
-- SECTION 2: created_by has NO database default (set by application layer)
-- ============================================================================
-- The canonical schema (20260214003329) defines created_by as bare bigint
-- with no DEFAULT. The provider layer sets created_by explicitly.
-- Only notes/junction tables (contact_notes, opportunity_notes, opportunity_products)
-- retain the get_current_sales_id() default.

-- Test 3: activities.created_by has no default
SELECT col_hasnt_default(
  'public', 'activities', 'created_by',
  'activities.created_by has no DB default (set by application layer)'
);

-- Test 4: contacts.created_by has no default
SELECT col_hasnt_default(
  'public', 'contacts', 'created_by',
  'contacts.created_by has no DB default (set by application layer)'
);

-- Test 5: organizations.created_by has no default
SELECT col_hasnt_default(
  'public', 'organizations', 'created_by',
  'organizations.created_by has no DB default (set by application layer)'
);

-- Test 6: opportunities.created_by has no default
SELECT col_hasnt_default(
  'public', 'opportunities', 'created_by',
  'opportunities.created_by has no DB default (set by application layer)'
);

-- Test 7: products.created_by has no default
SELECT col_hasnt_default(
  'public', 'products', 'created_by',
  'products.created_by has no DB default (set by application layer)'
);

-- ============================================================================
-- SECTION 3: Permissive policy removal verification
-- ============================================================================

-- Test 8: No INSERT policies with WITH CHECK (true) on business tables
SELECT is_empty(
  $$
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'INSERT'
      AND with_check::text = 'true'
      AND tablename IN (
        'activities', 'contacts', 'contact_notes', 'organizations',
        'organization_notes', 'opportunity_notes', 'products',
        'product_distributors', 'segments', 'tags',
        'interaction_participants', 'opportunity_participants'
      )
  $$,
  'No INSERT policies with permissive WITH CHECK (true) on business tables'
);

-- Test 9: No UPDATE policies with USING (true) on business tables
SELECT is_empty(
  $$
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'UPDATE'
      AND qual::text = 'true'
      AND tablename IN (
        'activities', 'contacts', 'contact_notes', 'organizations',
        'organization_notes', 'opportunity_notes', 'products',
        'product_distributors', 'segments', 'tags'
      )
  $$,
  'No UPDATE policies with permissive USING (true) on business tables'
);

-- ============================================================================
-- SECTION 4: Ownership policy existence verification
-- ============================================================================

-- Test 10: Activities has ownership policies
-- Policy names from canonical schema (20260214003329_remote_schema.sql):
--   activities_select, activities_insert, activities_update, activities_delete, activities_service_role
SELECT policies_are(
  'public', 'activities',
  ARRAY[
    'activities_delete',
    'activities_insert',
    'activities_select',
    'activities_service_role',
    'activities_update'
  ],
  'activities table has correct ownership policies'
);

-- Test 11: Contacts has ownership policies
-- Policy names from canonical schema: contacts_select_all, contacts_insert_owner,
-- contacts_update_owner_or_privileged, delete_contacts
SELECT policies_are(
  'public', 'contacts',
  ARRAY[
    'contacts_insert_owner',
    'contacts_select_all',
    'contacts_update_owner_or_privileged',
    'delete_contacts'
  ],
  'contacts table has correct ownership policies'
);

-- Test 12: Tags has manager/admin policies
-- Policy names from canonical schema: authenticated_select_tags, tags_insert_privileged,
-- tags_delete_privileged, tags_soft_delete_authenticated, tags_service_role
SELECT policies_are(
  'public', 'tags',
  ARRAY[
    'authenticated_select_tags',
    'tags_delete_privileged',
    'tags_insert_privileged',
    'tags_service_role',
    'tags_soft_delete_authenticated'
  ],
  'tags table has correct manager/admin policies'
);

-- Test 13: Products has manager/admin policies
SELECT policies_are(
  'public', 'products',
  ARRAY[
    'delete_products',
    'products_insert_privileged',
    'products_update_privileged',
    'select_products'
  ],
  'products table has correct manager/admin policies'
);

-- Test 14: Segments has manager/admin policies
SELECT policies_are(
  'public', 'segments',
  ARRAY[
    'segments_delete_admin',
    'segments_insert_privileged',
    'segments_update_privileged',
    'select_segments'
  ],
  'segments table has correct manager/admin policies'
);

-- ============================================================================
-- SECTION 5: Policy content verification
-- ============================================================================

-- Test 15: Activities INSERT policy checks created_by = current_sales_id()
-- Policy name in canonical schema: activities_insert
SELECT matches(
  (SELECT with_check::text FROM pg_policies
   WHERE tablename = 'activities' AND policyname = 'activities_insert'),
  'created_by = .*current_sales_id',
  'activities INSERT policy checks ownership via current_sales_id()'
);

-- ============================================================================
-- FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
