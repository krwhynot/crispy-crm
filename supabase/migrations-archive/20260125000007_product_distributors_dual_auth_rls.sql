-- ============================================================================
-- Migration: product_distributors Junction Table Dual-Authorization RLS
-- Date: 2026-01-25
-- Reference: DATABASE_LAYER.md - Junction Table Security
-- Priority: P0 (Security - Cross-team data leakage)
-- ============================================================================
--
-- SECURITY ISSUES FIXED:
-- 1. SELECT policy: ANY authenticated user can view ALL product-distributor mappings
--    - Current: USING (deleted_at IS NULL) - no ownership check
--    - Fix: Dual-authorization - verify access to BOTH product AND distributor
--
-- 2. UPDATE policy: Only checks soft-delete in USING clause, not ownership
--    - Current: USING (deleted_at IS NULL)
--    - Fix: Verify ownership of BOTH sides before allowing update
--
-- 3. Duplicate DELETE policies: Two policies from different migration attempts
--    - Current: 'delete_product_distributors_owner_or_privileged' AND 'product_distributors_delete_owner_or_privileged'
--    - Fix: Single policy with dual-authorization
--
-- PATTERN: Junction Table Dual-Authorization
-- - User must be authorized to access BOTH foreign key sides
-- - Ownership check: created_by OR sales_id OR admin/manager privilege
-- - All operations verify both products AND distributors tables
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP ALL EXISTING POLICIES (including duplicates)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can insert product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can update product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can delete product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Authenticated users can view product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Admins can insert product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Admins can update product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Admins can delete product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "select_product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "product_distributors_insert_owner" ON product_distributors;
DROP POLICY IF EXISTS "product_distributors_update_owner_or_privileged" ON product_distributors;
DROP POLICY IF EXISTS "delete_product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "delete_product_distributors_owner_or_privileged" ON product_distributors;
DROP POLICY IF EXISTS "product_distributors_delete_owner_or_privileged" ON product_distributors;

-- ============================================================================
-- CREATE DUAL-AUTHORIZATION RLS POLICIES
-- Pattern: Verify access to BOTH product AND distributor for all operations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT: Dual-authorization - can only see mappings where user owns both sides
-- ----------------------------------------------------------------------------
-- User can view product_distributor records IF:
--   1. Record is not soft-deleted AND
--   2. User owns or is assigned to the product (created_by) AND
--   3. User owns or is assigned to the distributor (created_by OR sales_id)
-- OR user is admin/manager (can see all records)

CREATE POLICY "product_distributors_select_dual_auth"
  ON product_distributors
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
          SELECT 1 FROM products p
          WHERE p.id = product_distributors.product_id
            AND p.deleted_at IS NULL
            AND p.created_by = current_sales_id()
        )
        AND EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = product_distributors.distributor_id
            AND o.deleted_at IS NULL
            AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
        )
      )
    )
  );

COMMENT ON POLICY "product_distributors_select_dual_auth" ON product_distributors IS
  'SELECT requires soft-delete filter AND dual-authorization (access to both product and distributor) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- INSERT: Dual-authorization - can only create mappings for owned resources
-- ----------------------------------------------------------------------------
-- User can insert product_distributor records IF:
--   User owns or is assigned to BOTH the product AND the distributor
-- OR user is admin/manager

CREATE POLICY "product_distributors_insert_dual_auth"
  ON product_distributors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin/Manager bypass
    private.is_admin_or_manager()
    OR (
      -- Dual-authorization: User must own BOTH sides to create link
      EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_distributors.product_id
          AND p.deleted_at IS NULL
          AND p.created_by = current_sales_id()
      )
      AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = product_distributors.distributor_id
          AND o.deleted_at IS NULL
          AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
      )
    )
  );

COMMENT ON POLICY "product_distributors_insert_dual_auth" ON product_distributors IS
  'INSERT requires dual-authorization (ownership of both product and distributor) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- UPDATE: Dual-authorization - can only update mappings where user owns both sides
-- ----------------------------------------------------------------------------
-- User can update product_distributor records IF:
--   1. Record is not soft-deleted AND
--   2. User owns BOTH the product AND the distributor
-- OR user is admin/manager

CREATE POLICY "product_distributors_update_dual_auth"
  ON product_distributors
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Admin/Manager bypass
      private.is_admin_or_manager()
      OR (
        -- Dual-authorization: User must own BOTH sides to update
        EXISTS (
          SELECT 1 FROM products p
          WHERE p.id = product_distributors.product_id
            AND p.deleted_at IS NULL
            AND p.created_by = current_sales_id()
        )
        AND EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = product_distributors.distributor_id
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
        SELECT 1 FROM products p
        WHERE p.id = product_distributors.product_id
          AND p.deleted_at IS NULL
          AND p.created_by = current_sales_id()
      )
      AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = product_distributors.distributor_id
          AND o.deleted_at IS NULL
          AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
      )
    )
  );

COMMENT ON POLICY "product_distributors_update_dual_auth" ON product_distributors IS
  'UPDATE requires soft-delete filter AND dual-authorization (ownership of both product and distributor) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- DELETE: Dual-authorization - can only delete mappings where user owns both sides
-- ----------------------------------------------------------------------------
-- User can delete (soft-delete) product_distributor records IF:
--   1. Record is not already soft-deleted AND
--   2. User owns BOTH the product AND the distributor
-- OR user is admin/manager

CREATE POLICY "product_distributors_delete_dual_auth"
  ON product_distributors
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
          SELECT 1 FROM products p
          WHERE p.id = product_distributors.product_id
            AND p.deleted_at IS NULL
            AND p.created_by = current_sales_id()
        )
        AND EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = product_distributors.distributor_id
            AND o.deleted_at IS NULL
            AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
        )
      )
    )
  );

COMMENT ON POLICY "product_distributors_delete_dual_auth" ON product_distributors IS
  'DELETE requires soft-delete filter AND dual-authorization (ownership of both product and distributor) OR admin/manager privilege';

-- ----------------------------------------------------------------------------
-- Service Role Bypass (for Edge Functions and admin operations)
-- ----------------------------------------------------------------------------
CREATE POLICY "product_distributors_service_role_bypass"
  ON product_distributors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "product_distributors_service_role_bypass" ON product_distributors IS
  'Service role (Edge Functions) has full access for automated operations';

-- ============================================================================
-- PERFORMANCE INDEXES FOR EXISTS SUBQUERIES
-- ============================================================================
-- Without these indexes, the EXISTS subqueries will cause full table scans
-- Partial indexes (WHERE deleted_at IS NULL) improve query performance

-- Index for product_id lookups in dual-auth checks
CREATE INDEX IF NOT EXISTS idx_product_distributors_product_id_active
  ON product_distributors (product_id)
  WHERE deleted_at IS NULL;

-- Index for distributor_id lookups in dual-auth checks
CREATE INDEX IF NOT EXISTS idx_product_distributors_distributor_id_active
  ON product_distributors (distributor_id)
  WHERE deleted_at IS NULL;

-- Index for products.created_by (used in EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_products_created_by_active
  ON products (created_by)
  WHERE deleted_at IS NULL;

-- Index for organizations.created_by (used in EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_organizations_created_by_active
  ON organizations (created_by)
  WHERE deleted_at IS NULL;

-- Index for organizations.sales_id (used in EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_organizations_sales_id_active
  ON organizations (sales_id)
  WHERE deleted_at IS NULL;

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
  WHERE tablename = 'product_distributors'
    AND schemaname = 'public';

  IF policy_count != 5 THEN
    RAISE EXCEPTION 'Expected 5 RLS policies on product_distributors, found %', policy_count;
  END IF;

  RAISE NOTICE 'SUCCESS: product_distributors has % policies', policy_count;
END $$;

-- 2. Verify all policies have proper names and dual-authorization
-- Expected output:
--   product_distributors_select_dual_auth | SELECT
--   product_distributors_insert_dual_auth | INSERT
--   product_distributors_update_dual_auth | UPDATE
--   product_distributors_delete_dual_auth | DELETE
--   product_distributors_service_role_bypass | ALL
--
-- Run manually:
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'product_distributors'
--   AND schemaname = 'public'
-- ORDER BY cmd, policyname;

-- 3. Verify SELECT policy has dual-authorization (check for EXISTS clauses)
-- Run manually:
-- SELECT policyname, qual::text
-- FROM pg_policies
-- WHERE tablename = 'product_distributors'
--   AND schemaname = 'public'
--   AND cmd = 'SELECT';
-- Expected: Should contain "EXISTS ( SELECT 1" for both products and organizations

-- 4. Verify indexes created for performance
-- Run manually:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('product_distributors', 'products', 'organizations')
--   AND indexname LIKE '%active%'
-- ORDER BY tablename, indexname;

-- ============================================================================
-- SECURITY TEST CASES
-- ============================================================================

-- Test 1: Non-owner should NOT see product-distributor mappings
-- (Assumes sales_user_1 owns product_id=1, sales_user_2 does NOT)
-- SET LOCAL ROLE sales_user_2;
-- SELECT * FROM product_distributors WHERE product_id = 1;
-- Expected: 0 rows (access denied)

-- Test 2: Admin should see ALL mappings
-- SET LOCAL ROLE admin_user;
-- SELECT COUNT(*) FROM product_distributors WHERE deleted_at IS NULL;
-- Expected: All active records

-- Test 3: Owner should see only THEIR mappings
-- SET LOCAL ROLE sales_user_1;
-- SELECT * FROM product_distributors WHERE product_id = 1;
-- Expected: Rows where user owns BOTH product AND distributor

-- Test 4: Non-owner should NOT be able to insert mappings
-- SET LOCAL ROLE sales_user_2;
-- INSERT INTO product_distributors (product_id, distributor_id, created_by)
-- VALUES (1, 1, current_sales_id());
-- Expected: Permission denied (user doesn't own product_id=1)

-- Test 5: EXPLAIN should show index usage
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM product_distributors WHERE product_id = 1 AND deleted_at IS NULL;
-- Expected: Index Scan using idx_product_distributors_product_id_active
