-- Migration: Fix product_distributors RLS Security Vulnerability
-- Issue: CRIT-01 - All 4 policies used USING(true), allowing any authenticated user
--        to read/write ALL product_distributor records (cross-tenant data leakage)
-- Solution: Shared Reference Data pattern - all users read, admins write
-- Date: 2025-12-22

-- ============================================================================
-- DROP VULNERABLE POLICIES
-- These policies allow ANY authenticated user full access - security breach
-- ============================================================================

DROP POLICY IF EXISTS "Users can view product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can insert product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can update product_distributors" ON product_distributors;
DROP POLICY IF EXISTS "Users can delete product_distributors" ON product_distributors;

-- ============================================================================
-- ADD MISSING COLUMNS
-- Original schema lacked soft-delete and audit columns
-- ============================================================================

-- Soft-delete column (required by engineering constitution)
ALTER TABLE product_distributors
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Audit column for tracking who created records
ALTER TABLE product_distributors
ADD COLUMN IF NOT EXISTS created_by BIGINT;

-- ============================================================================
-- CREATE PROPER RLS POLICIES
-- Pattern: Shared Reference Data (product catalog is company-wide)
-- - SELECT: All authenticated users (needed for dropdowns, lookups)
-- - INSERT/UPDATE/DELETE: Admin only (product-distributor mappings are admin data)
-- ============================================================================

-- SELECT: All authenticated users can read non-deleted records
-- Rationale: Sales reps need to see product-distributor mappings for opportunities
CREATE POLICY "Authenticated users can view product_distributors"
  ON product_distributors
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

-- INSERT: Admin only
-- Rationale: Product-distributor mappings (vendor item numbers, authorization status)
-- are managed by admins, not individual sales reps
CREATE POLICY "Admins can insert product_distributors"
  ON product_distributors
  FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Admin only
-- Rationale: Changing vendor item numbers or authorization status requires admin approval
CREATE POLICY "Admins can update product_distributors"
  ON product_distributors
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Admin only (should use soft-delete via UPDATE, but policy still needed)
-- Rationale: Hard deletes should be extremely rare, admin-only operation
CREATE POLICY "Admins can delete product_distributors"
  ON product_distributors
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- PERFORMANCE INDEX
-- Partial index for efficient soft-delete filtering
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_distributors_deleted_at
  ON product_distributors (deleted_at)
  WHERE deleted_at IS NULL;

-- Index for FK lookups (may already exist, IF NOT EXISTS handles gracefully)
CREATE INDEX IF NOT EXISTS idx_product_distributors_product_id
  ON product_distributors (product_id);

CREATE INDEX IF NOT EXISTS idx_product_distributors_distributor_id
  ON product_distributors (distributor_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN product_distributors.deleted_at IS
  'Soft delete timestamp. NULL = active record. Set to NOW() to archive.';

COMMENT ON COLUMN product_distributors.created_by IS
  'ID of the sales user who created this record. For audit trail.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'product_distributors';

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 RLS policies on product_distributors, found %', policy_count;
  END IF;

  RAISE NOTICE 'SUCCESS: product_distributors now has % secure RLS policies', policy_count;
END $$;
