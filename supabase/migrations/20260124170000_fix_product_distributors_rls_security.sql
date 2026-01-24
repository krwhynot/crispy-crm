-- Migration: Fix DELETE Policy Security Gap on product_distributors
-- Date: 2026-01-24
-- Purpose: Add admin/owner restriction to DELETE policy
-- Reference: DATABASE_LAYER.md - "No USING (true) policies except service_role"
--
-- SECURITY ISSUE (P0):
-- The current DELETE policy only checks `deleted_at IS NULL`, allowing ANY
-- authenticated user to delete ANY product-distributor mapping.
--
-- Current State Analysis:
-- - SELECT: ✅ Filters deleted_at IS NULL (correct)
-- - INSERT: ✅ Owner-based with admin/manager bypass (correct)
-- - UPDATE: ✅ Owner-or-privileged pattern (correct)
-- - DELETE: ❌ Only checks deleted_at - NO authorization check!
--
-- FIX:
-- Replace DELETE policy to require owner OR admin/manager privilege,
-- matching the pattern used for INSERT and UPDATE.

-- ============================================================================
-- DROP INSECURE DELETE POLICY
-- ============================================================================
-- The current policy allows ANY authenticated user to delete ANY record

DROP POLICY IF EXISTS "delete_product_distributors" ON product_distributors;

-- Also drop legacy policy names in case they exist
DROP POLICY IF EXISTS "Users can delete product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "authenticated_delete_product_distributors" ON product_distributors;

-- ============================================================================
-- CREATE SECURED DELETE POLICY
-- ============================================================================
-- Match the owner-or-privileged pattern used by UPDATE policy

CREATE POLICY delete_product_distributors_owner_or_privileged ON product_distributors
  FOR DELETE
  TO authenticated
  USING (
    -- Must not be soft-deleted AND (owner OR admin/manager)
    deleted_at IS NULL
    AND (
      created_by = current_sales_id()
      OR private.is_admin_or_manager()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify the fix:
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'product_distributors'
-- ORDER BY cmd;
--
-- Expected DELETE policy:
-- - policyname: delete_product_distributors_owner_or_privileged
-- - qual: (deleted_at IS NULL) AND ((created_by = current_sales_id()) OR private.is_admin_or_manager())
--
-- Security test (should fail for non-owner, non-admin):
-- DELETE FROM product_distributors WHERE product_id = 1 AND distributor_id = 2;
