-- Migration: Fix principal_organization_id FK to use RESTRICT instead of SET NULL
-- Purpose: Prevent orphaning opportunities when a principal organization is deleted
-- Risk: Will fail if any DELETE attempts on principals with active opportunities
--
-- Background:
-- The existing FK uses ON DELETE SET NULL which would orphan opportunities
-- by setting their principal_organization_id to NULL. Per engineering
-- constitution P13 (soft-deletes), we should use RESTRICT to prevent
-- deletion of principals that have associated opportunities.
--
-- Note: 370 opportunities currently have NULL principal_organization_id.
-- This is a separate data quality issue - RESTRICT only prevents DELETE
-- operations, it does not require the column to be NOT NULL.

-- =====================================================
-- STEP 1: Drop the existing FK constraint (SET NULL)
-- =====================================================
ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS opportunities_principal_organization_id_fkey;

-- =====================================================
-- STEP 2: Add new FK constraint with RESTRICT behavior
-- =====================================================
-- ON DELETE RESTRICT: Prevents deletion of principal organizations that
-- have opportunities referencing them. Users must first reassign or
-- soft-delete the opportunities before the principal can be deleted.

ALTER TABLE opportunities
ADD CONSTRAINT fk_opportunities_principal_organization
FOREIGN KEY (principal_organization_id)
REFERENCES organizations(id)
ON DELETE RESTRICT;

-- =====================================================
-- STEP 3: Add documentation comment
-- =====================================================
COMMENT ON CONSTRAINT fk_opportunities_principal_organization ON opportunities IS
  'Prevents deletion of principal organizations with active opportunities. '
  'Use soft-delete (deleted_at) to archive principals instead of hard delete. '
  'Per engineering constitution P13: soft-deletes with ON DELETE RESTRICT.';

-- =====================================================
-- STEP 4: Verify index exists for FK performance
-- =====================================================
-- Index already exists: idx_opportunities_principal_organization_id
-- Created in 20251018152315_cloud_schema_fresh.sql
-- Just verify and add if missing
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_org_id_restrict
ON opportunities(principal_organization_id)
WHERE deleted_at IS NULL AND principal_organization_id IS NOT NULL;

COMMENT ON INDEX idx_opportunities_principal_org_id_restrict IS
  'Optimizes FK lookups and principal deletion checks. '
  'Excludes soft-deleted opportunities and NULL principals.';
