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
-- SECTION 2: created_by defaults verification
-- ============================================================================

-- Test 3: activities.created_by has default
SELECT col_default_is(
  'public', 'activities', 'created_by',
  'get_current_sales_id()',
  'activities.created_by has get_current_sales_id() default'
);

-- Test 4: contacts.created_by has default
SELECT col_default_is(
  'public', 'contacts', 'created_by',
  'get_current_sales_id()',
  'contacts.created_by has get_current_sales_id() default'
);

-- Test 5: organizations.created_by has default
SELECT col_default_is(
  'public', 'organizations', 'created_by',
  'get_current_sales_id()',
  'organizations.created_by has get_current_sales_id() default'
);

-- Test 6: opportunities.created_by has default
SELECT col_default_is(
  'public', 'opportunities', 'created_by',
  'get_current_sales_id()',
  'opportunities.created_by has get_current_sales_id() default'
);

-- Test 7: products.created_by has default
SELECT col_default_is(
  'public', 'products', 'created_by',
  'get_current_sales_id()',
  'products.created_by has get_current_sales_id() default'
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

-- Test 10: Activities has ownership INSERT policy
SELECT policies_are(
  'public', 'activities',
  ARRAY[
    'activities_delete_policy',
    'activities_insert_owner',
    'activities_update_owner_or_privileged',
    'authenticated_select_activities'
  ],
  'activities table has correct ownership policies'
);

-- Test 11: Contacts has ownership policies
SELECT policies_are(
  'public', 'contacts',
  ARRAY[
    'contacts_delete_owner_or_privileged',
    'contacts_insert_owner',
    'contacts_update_owner_or_privileged',
    'select_contacts'
  ],
  'contacts table has correct ownership policies'
);

-- Test 12: Tags has manager/admin policies
SELECT policies_are(
  'public', 'tags',
  ARRAY[
    'authenticated_select_tags',
    'tags_delete_admin',
    'tags_insert_privileged',
    'tags_update_privileged'
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
SELECT matches(
  (SELECT with_check::text FROM pg_policies
   WHERE tablename = 'activities' AND policyname = 'activities_insert_owner'),
  'created_by = current_sales_id',
  'activities INSERT policy checks ownership via current_sales_id()'
);

-- ============================================================================
-- FINISH
-- ============================================================================

SELECT * FROM finish();

ROLLBACK;
