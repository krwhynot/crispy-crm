-- ============================================================================
-- Migration: harden_rls_ownership_policies.sql
-- ============================================================================
-- PURPOSE: Harden RLS policies with ownership-based access control
--
-- SECURITY MODEL (Single-Tenant CRM - Ownership Based):
--   - All authenticated users can READ data (shared team access)
--   - Only OWNERS can modify their own records
--   - MANAGERS/ADMINS can modify any record
--   - Soft deletes enforced via deleted_at filters
--
-- NOTE: This is NOT multi-tenant isolation. The organization_id columns
-- reference CUSTOMER organizations, not tenant boundaries. All users
-- work for the same company (MFB).
--
-- PATTERN:
--   INSERT: creator must set created_by = their own sales_id
--   UPDATE: owner OR manager/admin can modify
--   DELETE: owner OR admin can delete (soft delete via deleted_at)
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Add created_by defaults where missing
-- ============================================================================
-- These ensure the column auto-populates if not provided by the app

ALTER TABLE activities
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

ALTER TABLE contacts
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

ALTER TABLE organizations
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

ALTER TABLE opportunities
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

ALTER TABLE products
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

-- segments.created_by is UUID type (references auth.uid directly)
ALTER TABLE segments
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE product_distributors
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

ALTER TABLE organization_distributors
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

ALTER TABLE distributor_principal_authorizations
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

ALTER TABLE product_distributor_authorizations
  ALTER COLUMN created_by SET DEFAULT get_current_sales_id();

-- Tags: No created_by column, reference data managed by manager/admin
-- Skip adding column - keep reference data simple

-- ============================================================================
-- STEP 2: Create helper function for ownership check
-- ============================================================================

CREATE OR REPLACE FUNCTION is_owner_or_privileged(owner_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT owner_id = public.current_sales_id()
      OR public.is_manager_or_admin()
$$;

-- ============================================================================
-- STEP 3: Harden ACTIVITIES policies
-- ============================================================================

-- Keep SELECT as-is (soft-delete filtered, shared read)
-- Keep DELETE as-is (already owner-based)

-- Fix INSERT: require ownership
DROP POLICY IF EXISTS "authenticated_insert_activities" ON activities;
CREATE POLICY "activities_insert_owner" ON activities
  FOR INSERT TO authenticated
  WITH CHECK (created_by = current_sales_id());

-- Fix UPDATE: require ownership or privilege
DROP POLICY IF EXISTS "authenticated_update_activities" ON activities;
CREATE POLICY "activities_update_owner_or_privileged" ON activities
  FOR UPDATE TO authenticated
  USING (is_owner_or_privileged(created_by))
  WITH CHECK (is_owner_or_privileged(created_by));

-- ============================================================================
-- STEP 4: Harden CONTACTS policies
-- ============================================================================

-- Keep SELECT as-is (soft-delete filtered, shared read)

-- Fix INSERT: require ownership
DROP POLICY IF EXISTS "insert_contacts" ON contacts;
CREATE POLICY "contacts_insert_owner" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (created_by = current_sales_id());

-- Fix UPDATE: owner or account manager or privileged
DROP POLICY IF EXISTS "update_contacts" ON contacts;
CREATE POLICY "contacts_update_owner_or_privileged" ON contacts
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id()
         OR sales_id = current_sales_id()
         OR is_manager_or_admin())
  )
  WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR is_manager_or_admin()
  );

-- Fix DELETE: owner or privileged
DROP POLICY IF EXISTS "delete_contacts" ON contacts;
CREATE POLICY "contacts_delete_owner_or_privileged" ON contacts
  FOR DELETE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id() OR is_manager_or_admin())
  );

-- ============================================================================
-- STEP 5: Harden CONTACT_NOTES policies
-- ============================================================================

-- Keep SELECT as-is (soft-delete filtered)

-- Fix INSERT: require ownership
DROP POLICY IF EXISTS "insert_contact_notes" ON contact_notes;
CREATE POLICY "contact_notes_insert_owner" ON contact_notes
  FOR INSERT TO authenticated
  WITH CHECK (created_by = current_sales_id() OR sales_id = current_sales_id());

-- Fix UPDATE: owner or privileged
DROP POLICY IF EXISTS "update_contact_notes" ON contact_notes;
CREATE POLICY "contact_notes_update_owner_or_privileged" ON contact_notes
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id()
         OR sales_id = current_sales_id()
         OR is_manager_or_admin())
  )
  WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR is_manager_or_admin()
  );

-- Fix DELETE: owner or privileged
DROP POLICY IF EXISTS "delete_contact_notes" ON contact_notes;
CREATE POLICY "contact_notes_delete_owner_or_privileged" ON contact_notes
  FOR DELETE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id()
         OR sales_id = current_sales_id()
         OR is_manager_or_admin())
  );

-- ============================================================================
-- STEP 6: Harden ORGANIZATIONS policies
-- ============================================================================

-- Keep SELECT as-is (soft-delete filtered, shared read)

-- Fix INSERT: require ownership
DROP POLICY IF EXISTS "insert_organizations" ON organizations;
CREATE POLICY "organizations_insert_owner" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = current_sales_id());

-- Fix UPDATE: owner or account manager or privileged
DROP POLICY IF EXISTS "update_organizations" ON organizations;
CREATE POLICY "organizations_update_owner_or_privileged" ON organizations
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id()
         OR sales_id = current_sales_id()
         OR is_manager_or_admin())
  )
  WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR is_manager_or_admin()
  );

-- Fix DELETE: owner or admin only
DROP POLICY IF EXISTS "delete_organizations" ON organizations;
CREATE POLICY "organizations_delete_owner_or_admin" ON organizations
  FOR DELETE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id() OR is_admin())
  );

-- ============================================================================
-- STEP 7: Harden ORGANIZATION_NOTES policies
-- ============================================================================

-- Keep SELECT as-is

-- Fix INSERT: require ownership
DROP POLICY IF EXISTS "insert_organization_notes" ON organization_notes;
CREATE POLICY "organization_notes_insert_owner" ON organization_notes
  FOR INSERT TO authenticated
  WITH CHECK (sales_id = current_sales_id());

-- Fix UPDATE: owner or privileged
DROP POLICY IF EXISTS "update_organization_notes" ON organization_notes;
CREATE POLICY "organization_notes_update_owner_or_privileged" ON organization_notes
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (sales_id = current_sales_id() OR is_manager_or_admin())
  )
  WITH CHECK (sales_id = current_sales_id() OR is_manager_or_admin());

-- Remove duplicate camelCase policies if they exist
DROP POLICY IF EXISTS "authenticated_delete_organizationNotes" ON organization_notes;
DROP POLICY IF EXISTS "authenticated_update_organizationNotes" ON organization_notes;

-- ============================================================================
-- STEP 8: Harden OPPORTUNITY_NOTES policies
-- ============================================================================

-- Keep SELECT as-is

-- Fix INSERT: require ownership
DROP POLICY IF EXISTS "insert_opportunity_notes" ON opportunity_notes;
CREATE POLICY "opportunity_notes_insert_owner" ON opportunity_notes
  FOR INSERT TO authenticated
  WITH CHECK (created_by = current_sales_id() OR sales_id = current_sales_id());

-- Fix UPDATE: owner or privileged
DROP POLICY IF EXISTS "update_opportunity_notes" ON opportunity_notes;
CREATE POLICY "opportunity_notes_update_owner_or_privileged" ON opportunity_notes
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id()
         OR sales_id = current_sales_id()
         OR is_manager_or_admin())
  )
  WITH CHECK (
    created_by = current_sales_id()
    OR sales_id = current_sales_id()
    OR is_manager_or_admin()
  );

-- ============================================================================
-- STEP 9: Harden PRODUCTS policies (Reference Data - Admin/Manager)
-- ============================================================================

-- Keep SELECT as-is
-- Keep DELETE as-is (already admin only)

-- Fix INSERT: manager/admin only for reference data
DROP POLICY IF EXISTS "insert_products" ON products;
CREATE POLICY "products_insert_privileged" ON products
  FOR INSERT TO authenticated
  WITH CHECK (is_manager_or_admin());

-- Fix UPDATE: manager/admin only for reference data
DROP POLICY IF EXISTS "update_products" ON products;
CREATE POLICY "products_update_privileged" ON products
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL AND is_manager_or_admin())
  WITH CHECK (is_manager_or_admin());

-- ============================================================================
-- STEP 10: Harden PRODUCT_DISTRIBUTORS policies
-- ============================================================================

-- Keep SELECT as-is

-- Fix INSERT: require ownership
DROP POLICY IF EXISTS "insert_product_distributors" ON product_distributors;
CREATE POLICY "product_distributors_insert_owner" ON product_distributors
  FOR INSERT TO authenticated
  WITH CHECK (created_by = current_sales_id() OR is_manager_or_admin());

-- Fix UPDATE: owner or privileged
DROP POLICY IF EXISTS "update_product_distributors" ON product_distributors;
CREATE POLICY "product_distributors_update_owner_or_privileged" ON product_distributors
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (created_by = current_sales_id() OR is_manager_or_admin())
  )
  WITH CHECK (created_by = current_sales_id() OR is_manager_or_admin());

-- ============================================================================
-- STEP 11: Harden SEGMENTS policies (Reference Data - Admin/Manager)
-- NOTE: segments.created_by is UUID (auth.uid), not BIGINT (sales_id)
-- ============================================================================

-- Keep SELECT as-is

-- Fix INSERT: manager/admin for reference data
DROP POLICY IF EXISTS "insert_segments" ON segments;
CREATE POLICY "segments_insert_privileged" ON segments
  FOR INSERT TO authenticated
  WITH CHECK (is_manager_or_admin());

-- Fix UPDATE: manager/admin for reference data
DROP POLICY IF EXISTS "update_segments" ON segments;
CREATE POLICY "segments_update_privileged" ON segments
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL AND is_manager_or_admin())
  WITH CHECK (is_manager_or_admin());

-- Fix DELETE: admin only for reference data
DROP POLICY IF EXISTS "delete_segments" ON segments;
CREATE POLICY "segments_delete_admin" ON segments
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL AND is_admin());

-- ============================================================================
-- STEP 12: Harden TAGS policies (Reference Data - Admin/Manager)
-- ============================================================================

-- Keep SELECT as-is

-- Fix INSERT: manager/admin for reference data
DROP POLICY IF EXISTS "authenticated_insert_tags" ON tags;
CREATE POLICY "tags_insert_privileged" ON tags
  FOR INSERT TO authenticated
  WITH CHECK (is_manager_or_admin());

-- Fix UPDATE: manager/admin for reference data
DROP POLICY IF EXISTS "authenticated_update_tags" ON tags;
CREATE POLICY "tags_update_privileged" ON tags
  FOR UPDATE TO authenticated
  USING (is_manager_or_admin())
  WITH CHECK (is_manager_or_admin());

-- Fix DELETE: admin only for reference data
DROP POLICY IF EXISTS "authenticated_delete_tags" ON tags;
CREATE POLICY "tags_delete_admin" ON tags
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- STEP 13: Harden INTERACTION_PARTICIPANTS policies
-- ============================================================================
-- Keep SELECT and UPDATE as-is (already have ownership checks)

-- Fix INSERT: require ownership (trigger already sets created_by)
DROP POLICY IF EXISTS "interaction_participants_insert_policy" ON interaction_participants;
CREATE POLICY "interaction_participants_insert_owner" ON interaction_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = current_sales_id()
    OR owns_activity(activity_id)
    OR is_manager_or_admin()
  );

-- ============================================================================
-- STEP 14: Harden OPPORTUNITY_PARTICIPANTS policies
-- ============================================================================
-- Keep SELECT and UPDATE as-is (already have ownership checks)

-- Fix INSERT: require ownership (trigger already sets created_by)
DROP POLICY IF EXISTS "opportunity_participants_insert_policy" ON opportunity_participants;
CREATE POLICY "opportunity_participants_insert_owner" ON opportunity_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = current_sales_id()
    OR owns_opportunity(opportunity_id)
    OR is_manager_or_admin()
  );

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration):
-- ============================================================================
--
-- 1. Check all policies use ownership checks:
--    SELECT tablename, policyname, cmd, with_check
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND with_check::text = 'true';
--    Expected: Empty result (no more WITH CHECK (true))
--
-- 2. Check helper function exists:
--    SELECT proname FROM pg_proc WHERE proname = 'is_owner_or_privileged';
--    Expected: 1 row
--
-- ============================================================================

COMMENT ON FUNCTION is_owner_or_privileged IS
  'RLS helper: Returns true if the given owner_id matches current user or user is manager/admin';
