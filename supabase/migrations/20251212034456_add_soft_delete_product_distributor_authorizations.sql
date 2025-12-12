-- ============================================================================
-- Migration: Add soft-delete support to product_distributor_authorizations
-- Priority: P1 (Security Gap identified in RLS audit 2025-12-12)
-- Issue: Table lacks deleted_at column, inconsistent with soft-delete pattern
-- Risk: Hard deletes lose audit trail, cannot recover authorization data
-- ============================================================================

-- Step 1: Add deleted_at column for soft-delete support
-- This aligns with the soft-delete pattern used across all other tables
ALTER TABLE product_distributor_authorizations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 2: Create partial index for soft-delete filtering performance
-- This optimizes queries that filter on deleted_at IS NULL (the common case)
CREATE INDEX IF NOT EXISTS idx_product_distributor_auth_deleted_at
ON product_distributor_authorizations (deleted_at)
WHERE deleted_at IS NULL;

-- Step 3: Update RLS SELECT policy to filter soft-deleted records
-- This ensures deleted records are hidden from normal queries while
-- maintaining access to non-deleted records for all authenticated users
DROP POLICY IF EXISTS authenticated_select_product_distributor_authorizations
  ON product_distributor_authorizations;

CREATE POLICY authenticated_select_product_distributor_authorizations
  ON product_distributor_authorizations
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Step 4: Add column comment for documentation
COMMENT ON COLUMN product_distributor_authorizations.deleted_at IS
  'Soft-delete timestamp. When set, record is hidden from normal queries. Added 2025-12-12 per RLS security audit.';

-- Step 5: Create index for common lookup patterns (authorization status checks)
-- This optimizes the common query: "Is product X authorized at distributor Y?"
CREATE INDEX IF NOT EXISTS idx_product_distributor_auth_active
ON product_distributor_authorizations (product_id, distributor_id)
WHERE deleted_at IS NULL AND is_authorized = true;
