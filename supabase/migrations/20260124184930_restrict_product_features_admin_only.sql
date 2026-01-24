-- Migration: Fix product_features RLS Security Vulnerability
-- Issue: All write policies use auth.uid() IS NOT NULL, allowing any authenticated user
--        to INSERT/UPDATE/DELETE product feature records (cross-tenant data leakage)
-- Solution: Shared Reference Data pattern - all users read, admins write
-- Date: 2026-01-24

-- ============================================================================
-- DROP VULNERABLE POLICIES
-- These policies allow ANY authenticated user write access - security breach
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_insert_product_features" ON product_features;
DROP POLICY IF EXISTS "authenticated_update_product_features" ON product_features;
DROP POLICY IF EXISTS "authenticated_delete_product_features" ON product_features;

-- Keep SELECT policy (all authenticated users need to read features)
-- DROP POLICY IF EXISTS "authenticated_select_product_features" ON product_features;

-- ============================================================================
-- ADD MISSING COLUMNS
-- Original schema lacked soft-delete and audit columns
-- ============================================================================

-- Soft-delete column (required by engineering constitution)
ALTER TABLE product_features
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Audit column for tracking who created records
ALTER TABLE product_features
ADD COLUMN IF NOT EXISTS created_by BIGINT;

-- Updated_at column for audit trail
ALTER TABLE product_features
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- CREATE PROPER RLS POLICIES
-- Pattern: Shared Reference Data (product features are company-wide)
-- - SELECT: All authenticated users (needed for product displays, comparisons)
-- - INSERT/UPDATE/DELETE: Admin only (product features are admin data)
-- ============================================================================

-- SELECT: Keep existing policy but enhance with soft-delete filter
DROP POLICY IF EXISTS "authenticated_select_product_features" ON product_features;

CREATE POLICY "Authenticated users can view product_features"
  ON product_features
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

-- INSERT: Admin only
-- Rationale: Product features (specs, highlights) are managed by admins,
-- not individual sales reps
DROP POLICY IF EXISTS "Admins can insert product_features" ON product_features;
CREATE POLICY "Admins can insert product_features"
  ON product_features
  FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Admin only
-- Rationale: Changing product specifications requires admin approval
DROP POLICY IF EXISTS "Admins can update product_features" ON product_features;
CREATE POLICY "Admins can update product_features"
  ON product_features
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Admin only (should use soft-delete via UPDATE, but policy still needed)
-- Rationale: Hard deletes should be extremely rare, admin-only operation
DROP POLICY IF EXISTS "Admins can delete product_features" ON product_features;
CREATE POLICY "Admins can delete product_features"
  ON product_features
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- PERFORMANCE INDEXES
-- Partial index for efficient soft-delete filtering
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_features_deleted_at
  ON product_features (deleted_at)
  WHERE deleted_at IS NULL;

-- Index for FK lookups (may already exist, IF NOT EXISTS handles gracefully)
CREATE INDEX IF NOT EXISTS idx_product_features_product_id
  ON product_features (product_id);

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps
-- ============================================================================

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_product_features_updated_at ON product_features;
CREATE TRIGGER set_product_features_updated_at
  BEFORE UPDATE ON product_features
  FOR EACH ROW
  EXECUTE FUNCTION update_product_features_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN product_features.deleted_at IS
  'Soft delete timestamp. NULL = active record. Set to NOW() to archive.';

COMMENT ON COLUMN product_features.created_by IS
  'ID of the sales user who created this record. For audit trail.';

COMMENT ON COLUMN product_features.updated_at IS
  'Timestamp of last update. Auto-updated by trigger.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  column_exists BOOLEAN;
BEGIN
  -- Verify policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'product_features';

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 RLS policies on product_features, found %', policy_count;
  END IF;

  -- Verify soft-delete column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_features'
      AND column_name = 'deleted_at'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column deleted_at not found on product_features';
  END IF;

  -- Verify updated_at column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_features'
      AND column_name = 'updated_at'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column updated_at not found on product_features';
  END IF;

  RAISE NOTICE 'SUCCESS: product_features now has % secure RLS policies with soft-delete support', policy_count;
END $$;
