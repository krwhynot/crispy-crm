-- Migration: Fix Permissive RLS Policies on product_distributors
-- Date: 2026-01-24
-- Purpose: Replace USING (true) with role-based access control
-- Reference: DATABASE_LAYER.md - "No USING (true) policies except service_role"
--
-- SECURITY ISSUE (P0):
-- The original migration (20251215054822_08_create_product_distributors.sql)
-- used permissive USING (true) policies, allowing ANY authenticated user to
-- UPDATE and DELETE product-distributor mappings.
--
-- FIX:
-- - SELECT: All authenticated users (team collaboration - shared catalog)
-- - INSERT: All authenticated users (team can add new mappings)
-- - UPDATE: Admin-only (prevent unauthorized DOT number changes)
-- - DELETE: Admin-only (prevent unauthorized unmapping)
--
-- This aligns with the established pattern for products table in
-- migration 20251108213039_fix_rls_policies_role_based_access.sql

-- ============================================================================
-- DROP PERMISSIVE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can insert product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can update product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can delete product_distributors" ON product_distributors;

-- ============================================================================
-- CREATE SECURED POLICIES
-- ============================================================================

-- SELECT: All authenticated team members can view product-distributor mappings
-- (Shared catalog model - required for UI dropdowns and references)
CREATE POLICY authenticated_select_product_distributors ON product_distributors
  FOR SELECT
  TO authenticated
  USING (true);  -- Shared team model: all authenticated users are trusted

-- INSERT: All authenticated team members can create new mappings
-- (Allows sales reps to map products to distributors during opportunity entry)
CREATE POLICY authenticated_insert_product_distributors ON product_distributors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Shared team model: collaborative data entry

-- UPDATE: Admin-only (prevents unauthorized DOT number or status changes)
CREATE POLICY authenticated_update_product_distributors ON product_distributors
  FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can modify product-distributor mappings
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- DELETE: Admin-only (prevents unauthorized removal of distributor relationships)
CREATE POLICY authenticated_delete_product_distributors ON product_distributors
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can remove product-distributor mappings
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify policies are correctly applied:
--
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'product_distributors'
-- ORDER BY cmd;
--
-- Expected results:
-- - authenticated_select_product_distributors: USING (true)
-- - authenticated_insert_product_distributors: WITH CHECK (true)
-- - authenticated_update_product_distributors: USING (is_admin check)
-- - authenticated_delete_product_distributors: USING (is_admin check)
