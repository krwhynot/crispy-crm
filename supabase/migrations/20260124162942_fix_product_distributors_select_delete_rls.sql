-- ============================================================
-- SECURITY FIX: Replace Permissive SELECT/DELETE Policies on product_distributors
-- ============================================================
-- Audit Reference: Full Codebase Audit 2026-01-24
-- Issue: L1 Database - RLS permissive policies
--
-- The original migration (20251215054822_08_create_product_distributors.sql)
-- created USING (true) policies for all operations.
-- Migration 20260123144656 fixed INSERT and UPDATE, but SELECT and DELETE
-- still allow any authenticated user to access/delete any row.
--
-- Security Model (matching established patterns):
--   - SELECT: Authenticated users can view all (reference data for dropdowns)
--             but filtered by deleted_at IS NULL for soft-delete support
--   - DELETE: Owner (created_by), parent record owner, or manager/admin
--
-- Note: product_distributors is reference/configuration data that should
-- be viewable by all authenticated users (needed for product-distributor
-- assignment dropdowns), but only modifiable by owners or privileged users.
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: FIX SELECT POLICY
-- Current: USING (true) - allows viewing ALL rows including soft-deleted
-- Fix: Allow authenticated users but enforce soft-delete filter
-- ============================================================

DROP POLICY IF EXISTS "Users can view product_distributors" ON product_distributors;

CREATE POLICY "product_distributors_select_authenticated"
ON product_distributors FOR SELECT
TO authenticated
USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
);

COMMENT ON POLICY "product_distributors_select_authenticated" ON product_distributors IS
    'Authenticated users can view non-deleted product_distributors (reference data for dropdowns)';

-- ============================================================
-- SECTION 2: FIX DELETE POLICY
-- Current: USING (true) - any user can delete any row
-- Fix: Only owner, parent record owner, or manager/admin can delete
-- ============================================================

DROP POLICY IF EXISTS "Users can delete product_distributors" ON product_distributors;

CREATE POLICY "product_distributors_delete_owner_or_privileged"
ON product_distributors FOR DELETE
TO authenticated
USING (
    -- Direct ownership
    created_by = current_sales_id()
    -- Privileged users
    OR private.is_admin_or_manager()
    -- Owner of the parent product
    OR EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_distributors.product_id
        AND p.created_by = current_sales_id()
    )
    -- Owner of the parent distributor (organization)
    OR EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = product_distributors.distributor_id
        AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
    )
);

COMMENT ON POLICY "product_distributors_delete_owner_or_privileged" ON product_distributors IS
    'DELETE requires ownership (created_by, parent product owner, or parent distributor owner) or manager/admin role';

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================
--
-- 1. Verify no more USING (true) on product_distributors:
--    SELECT policyname, cmd, qual::text as using_clause
--    FROM pg_policies
--    WHERE tablename = 'product_distributors'
--      AND schemaname = 'public';
--    Expected: No policies with qual = 'true'
--
-- 2. Verify all 4 policies exist:
--    SELECT policyname, cmd FROM pg_policies
--    WHERE tablename = 'product_distributors'
--    ORDER BY cmd;
--    Expected: 4 rows (DELETE, INSERT, SELECT, UPDATE)
--
-- 3. Test soft-delete filtering:
--    -- As authenticated user, this should return 0 rows for deleted records
--    SELECT * FROM product_distributors WHERE deleted_at IS NOT NULL;
--
-- ============================================================
