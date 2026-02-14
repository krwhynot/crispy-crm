-- ============================================================
-- SECURITY FIX: Replace Permissive DELETE Policy on product_distributors
-- ============================================================
-- Audit Reference: Full Codebase Audit 2026-01-24
-- Issue: L1 Database - RLS permissive DELETE policy
--
-- Current State Analysis:
--   - INSERT: product_distributors_insert_owner ✓ (ownership check)
--   - SELECT: select_product_distributors ✓ (deleted_at IS NULL - intentional for reference data)
--   - UPDATE: product_distributors_update_owner_or_privileged ✓ (ownership check)
--   - DELETE: delete_product_distributors ✗ (ONLY deleted_at IS NULL - no ownership!)
--
-- Problem: ANY authenticated user can delete ANY product_distributor record
--          as long as it's not already soft-deleted.
--
-- Fix: Add ownership-based access control to DELETE policy to match
--      INSERT and UPDATE patterns.
--
-- Security Model:
--   - DELETE: Owner (created_by), parent record owner, or manager/admin
-- ============================================================

BEGIN;

-- ============================================================
-- FIX DELETE POLICY
-- Current: USING (deleted_at IS NULL) - any user can delete any row
-- Fix: Add ownership check matching INSERT/UPDATE pattern
-- ============================================================

DROP POLICY IF EXISTS "delete_product_distributors" ON product_distributors;

CREATE POLICY "product_distributors_delete_owner_or_privileged"
ON product_distributors FOR DELETE
TO authenticated
USING (
    deleted_at IS NULL
    AND (
        -- Direct ownership
        created_by = current_sales_id()
        -- Privileged users (using public functions for consistency)
        OR is_manager_or_admin()
        -- Owner of the parent product
        OR EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_distributors.product_id
            AND p.deleted_at IS NULL
            AND p.created_by = current_sales_id()
        )
        -- Owner of the parent distributor (organization)
        OR EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = product_distributors.distributor_id
            AND o.deleted_at IS NULL
            AND (o.created_by = current_sales_id() OR o.sales_id = current_sales_id())
        )
    )
);

COMMENT ON POLICY "product_distributors_delete_owner_or_privileged" ON product_distributors IS
    'DELETE requires: soft-delete filter AND (ownership OR parent record ownership OR manager/admin role)';

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================
--
-- 1. Verify DELETE policy has ownership check:
--    SELECT policyname, cmd, qual::text as using_clause
--    FROM pg_policies
--    WHERE tablename = 'product_distributors'
--      AND schemaname = 'public'
--      AND cmd = 'DELETE';
--    Expected: using_clause contains 'created_by = current_sales_id()'
--
-- 2. Verify all 4 policies exist with correct names:
--    SELECT policyname, cmd FROM pg_policies
--    WHERE tablename = 'product_distributors'
--    ORDER BY cmd;
--    Expected:
--      product_distributors_delete_owner_or_privileged | DELETE
--      product_distributors_insert_owner               | INSERT
--      select_product_distributors                     | SELECT
--      product_distributors_update_owner_or_privileged | UPDATE
--
-- ============================================================
