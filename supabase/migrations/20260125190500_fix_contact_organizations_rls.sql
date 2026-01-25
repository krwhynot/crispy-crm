-- ============================================================================
-- Migration: contact_organizations Junction Table Dual-Authorization RLS
-- Date: 2026-01-25
-- Reference: DATABASE_LAYER.md - Junction Table Security
-- Priority: P0 (Security - Cross-team data leakage)
-- ============================================================================
--
-- SECURITY ISSUES FIXED:
-- 1. SELECT policy: Only checks auth.uid() IS NOT NULL - no ownership verification
--    - Current: USING (auth.uid() IS NOT NULL)
--    - Fix: Dual-authorization - verify access to BOTH contact AND organization
--
-- 2. INSERT policy: Only checks authentication - allows linking unauthorized records
--    - Current: WITH CHECK (auth.uid() IS NOT NULL)
--    - Fix: Verify ownership of BOTH contact and organization before creating link
--
-- 3. UPDATE policy: Permissive - no ownership checks
--    - Current: USING/WITH CHECK (auth.uid() IS NOT NULL)
--    - Fix: Verify ownership of BOTH sides before allowing update
--
-- 4. DELETE policy: Permissive - no ownership checks
--    - Current: USING (auth.uid() IS NOT NULL)
--    - Fix: Verify ownership of BOTH sides before allowing delete
--
-- PATTERN: Junction Table Dual-Authorization
-- - User must be authorized to access BOTH foreign key sides
-- - Ownership check: created_by OR sales_id OR admin/manager privilege
-- - All operations verify both contacts AND organizations tables
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_contact_organizations" ON contact_organizations;
DROP POLICY IF EXISTS "authenticated_insert_contact_organizations" ON contact_organizations;
DROP POLICY IF EXISTS "authenticated_update_contact_organizations" ON contact_organizations;
DROP POLICY IF EXISTS "authenticated_delete_contact_organizations" ON contact_organizations;

-- ============================================================================
-- CREATE DUAL-AUTHORIZATION RLS POLICIES
-- Pattern: Verify access to BOTH contact AND organization for all operations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT: Dual-authorization - can only see mappings where user owns both sides
-- ----------------------------------------------------------------------------
-- User can view contact_organization records IF:
--   1. Record is not soft-deleted AND
--   2. User owns or is assigned to the contact (created_by OR sales_id) AND
--   3. User owns or is assigned to the organization (created_by OR sales_id)
-- OR user is admin/manager (can see all records)

CREATE POLICY "contact_organizations_select_dual_auth"
  ON contact_organizations
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Admin/Manager bypass
      private.is_admin_or_manager()
      OR (
        -- Dual-authorization: User must have access to BOTH sides
        EXISTS (
          SELECT 1 FROM contacts c
          WHERE c.id = contact_organizations.contact_id
            AND c.deleted_at IS NULL
            AND (c.created_by = current_sales_id() OR c.sales_id = current_sales_id())
        )
        AND EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = contact_organizations.organization_id
            AND o.deleted_at IS NULL
            AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
        )
      )
    )
  );

COMMENT ON POLICY "contact_organizations_select_dual_auth" ON contact_organizations IS
  'SELECT requires soft-delete filter AND dual-authorization (access to both contact and organization) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- INSERT: Dual-authorization - can only create mappings for owned resources
-- ----------------------------------------------------------------------------
-- User can insert contact_organization records IF:
--   User owns or is assigned to BOTH the contact AND the organization
-- OR user is admin/manager

CREATE POLICY "contact_organizations_insert_dual_auth"
  ON contact_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin/Manager bypass
    private.is_admin_or_manager()
    OR (
      -- Dual-authorization: User must own BOTH sides to create link
      EXISTS (
        SELECT 1 FROM contacts c
        WHERE c.id = contact_organizations.contact_id
          AND c.deleted_at IS NULL
          AND (c.created_by = current_sales_id() OR c.sales_id = current_sales_id())
      )
      AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = contact_organizations.organization_id
          AND o.deleted_at IS NULL
          AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
      )
    )
  );

COMMENT ON POLICY "contact_organizations_insert_dual_auth" ON contact_organizations IS
  'INSERT requires dual-authorization (ownership of both contact and organization) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- UPDATE: Dual-authorization - can only update mappings where user owns both sides
-- ----------------------------------------------------------------------------
-- User can update contact_organization records IF:
--   1. Record is not soft-deleted AND
--   2. User owns BOTH the contact AND the organization (current values)
-- AND the new values after update still belong to user
-- OR user is admin/manager

CREATE POLICY "contact_organizations_update_dual_auth"
  ON contact_organizations
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Admin/Manager bypass
      private.is_admin_or_manager()
      OR (
        -- Dual-authorization: User must own BOTH current sides
        EXISTS (
          SELECT 1 FROM contacts c
          WHERE c.id = contact_organizations.contact_id
            AND c.deleted_at IS NULL
            AND (c.created_by = current_sales_id() OR c.sales_id = current_sales_id())
        )
        AND EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = contact_organizations.organization_id
            AND o.deleted_at IS NULL
            AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
        )
      )
    )
  )
  WITH CHECK (
    -- Same check for the new values after update
    private.is_admin_or_manager()
    OR (
      EXISTS (
        SELECT 1 FROM contacts c
        WHERE c.id = contact_organizations.contact_id
          AND c.deleted_at IS NULL
          AND (c.created_by = current_sales_id() OR c.sales_id = current_sales_id())
      )
      AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = contact_organizations.organization_id
          AND o.deleted_at IS NULL
          AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
      )
    )
  );

COMMENT ON POLICY "contact_organizations_update_dual_auth" ON contact_organizations IS
  'UPDATE requires soft-delete filter AND dual-authorization (ownership of both contact and organization) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- DELETE: Dual-authorization - can only delete mappings where user owns both sides
-- ----------------------------------------------------------------------------
-- User can delete (soft-delete) contact_organization records IF:
--   1. Record is not already soft-deleted AND
--   2. User owns BOTH the contact AND the organization
-- OR user is admin/manager

CREATE POLICY "contact_organizations_delete_dual_auth"
  ON contact_organizations
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Admin/Manager bypass
      private.is_admin_or_manager()
      OR (
        -- Dual-authorization: User must own BOTH sides to delete
        EXISTS (
          SELECT 1 FROM contacts c
          WHERE c.id = contact_organizations.contact_id
            AND c.deleted_at IS NULL
            AND (c.created_by = current_sales_id() OR c.sales_id = current_sales_id())
        )
        AND EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = contact_organizations.organization_id
            AND o.deleted_at IS NULL
            AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
        )
      )
    )
  );

COMMENT ON POLICY "contact_organizations_delete_dual_auth" ON contact_organizations IS
  'DELETE requires soft-delete filter AND dual-authorization (ownership of both contact and organization) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- Service Role Bypass (for Edge Functions and admin operations)
-- ----------------------------------------------------------------------------
CREATE POLICY "contact_organizations_service_role_bypass"
  ON contact_organizations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "contact_organizations_service_role_bypass" ON contact_organizations IS
  'Service role (Edge Functions) has full access for automated operations';

-- ============================================================================
-- PERFORMANCE INDEXES FOR EXISTS SUBQUERIES
-- ============================================================================
-- Without these indexes, the EXISTS subqueries will cause full table scans
-- Partial indexes (WHERE deleted_at IS NULL) improve query performance

-- Index for contact_id lookups in dual-auth checks
CREATE INDEX IF NOT EXISTS idx_contact_organizations_contact_id_active
  ON contact_organizations (contact_id)
  WHERE deleted_at IS NULL;

-- Index for organization_id lookups in dual-auth checks
CREATE INDEX IF NOT EXISTS idx_contact_organizations_organization_id_active
  ON contact_organizations (organization_id)
  WHERE deleted_at IS NULL;

-- Index for contacts.created_by (used in EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_contacts_created_by_active
  ON contacts (created_by)
  WHERE deleted_at IS NULL;

-- Index for contacts.sales_id (used in EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_contacts_sales_id_active
  ON contacts (sales_id)
  WHERE deleted_at IS NULL;

-- Note: organizations indexes already created in product_distributors migration
-- (idx_organizations_created_by_active and idx_organizations_sales_id_active)

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify security
-- ============================================================================

-- 1. Verify exactly 5 policies exist (4 CRUD + 1 service_role)
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'contact_organizations'
    AND schemaname = 'public';

  IF policy_count != 5 THEN
    RAISE EXCEPTION 'Expected 5 RLS policies on contact_organizations, found %', policy_count;
  END IF;

  RAISE NOTICE 'SUCCESS: contact_organizations has % policies', policy_count;
END $$;

-- 2. Verify all policies have proper names and dual-authorization
-- Expected output:
--   contact_organizations_select_dual_auth | SELECT
--   contact_organizations_insert_dual_auth | INSERT
--   contact_organizations_update_dual_auth | UPDATE
--   contact_organizations_delete_dual_auth | DELETE
--   contact_organizations_service_role_bypass | ALL
--
-- Run manually:
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'contact_organizations'
--   AND schemaname = 'public'
-- ORDER BY cmd, policyname;

-- 3. Verify SELECT policy has dual-authorization (check for EXISTS clauses)
-- Run manually:
-- SELECT policyname, qual::text
-- FROM pg_policies
-- WHERE tablename = 'contact_organizations'
--   AND schemaname = 'public'
--   AND cmd = 'SELECT';
-- Expected: Should contain "EXISTS ( SELECT 1" for both contacts and organizations

-- 4. Verify indexes created for performance
-- Run manually:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('contact_organizations', 'contacts', 'organizations')
--   AND indexname LIKE '%active%'
-- ORDER BY tablename, indexname;

-- ============================================================================
-- SECURITY TEST CASES
-- ============================================================================

-- Test 1: Non-owner should NOT see contact-organization mappings
-- (Assumes sales_user_1 owns contact_id=1, sales_user_2 does NOT)
-- SET LOCAL ROLE sales_user_2;
-- SELECT * FROM contact_organizations WHERE contact_id = 1;
-- Expected: 0 rows (access denied)

-- Test 2: Admin should see ALL mappings
-- SET LOCAL ROLE admin_user;
-- SELECT COUNT(*) FROM contact_organizations WHERE deleted_at IS NULL;
-- Expected: All active records

-- Test 3: Owner should see only THEIR mappings
-- SET LOCAL ROLE sales_user_1;
-- SELECT * FROM contact_organizations WHERE contact_id = 1;
-- Expected: Rows where user owns BOTH contact AND organization

-- Test 4: Non-owner should NOT be able to insert mappings
-- SET LOCAL ROLE sales_user_2;
-- INSERT INTO contact_organizations (contact_id, organization_id, created_by)
-- VALUES (1, 1, current_sales_id());
-- Expected: Permission denied (user doesn't own contact_id=1)

-- Test 5: EXPLAIN should show index usage
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM contact_organizations WHERE contact_id = 1 AND deleted_at IS NULL;
-- Expected: Index Scan using idx_contact_organizations_contact_id_active
