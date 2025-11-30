-- ============================================================================
-- P1 Security and Performance Fixes
-- Migration: 20251129230248_p1_security_and_performance_fixes.sql
--
-- This migration addresses findings from the Full Spectrum Database Audit:
-- 1. Revoke excessive grants (TRIGGER, REFERENCES, TRUNCATE)
-- 2. Add missing FK indexes for query performance
-- 3. Add deleted_at to opportunity_contacts for soft delete support
-- ============================================================================

-- ============================================================================
-- SECTION 1: REVOKE EXCESSIVE GRANTS
-- ============================================================================
-- These grants allow authenticated users to perform administrative operations
-- that should be restricted to service_role or postgres only.

-- contactNotes - Remove admin-level grants from authenticated users
REVOKE TRIGGER ON "contactNotes" FROM authenticated;
REVOKE REFERENCES ON "contactNotes" FROM authenticated;
REVOKE TRUNCATE ON "contactNotes" FROM authenticated;

-- sales - Remove admin-level grants from authenticated users
REVOKE TRIGGER ON sales FROM authenticated;
REVOKE REFERENCES ON sales FROM authenticated;
REVOKE TRUNCATE ON sales FROM authenticated;

-- audit_trail - Remove write access (audit should be append-only via triggers)
-- Note: INSERT is handled by SECURITY DEFINER trigger function audit_changes()
REVOKE INSERT ON audit_trail FROM authenticated;
REVOKE UPDATE ON audit_trail FROM authenticated;
REVOKE DELETE ON audit_trail FROM authenticated;

-- ============================================================================
-- SECTION 2: ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================
-- Foreign keys without indexes cause slow joins and constraint checks.
-- These were identified as high-traffic FK columns without index coverage.

-- opportunities.founding_interaction_id - Links to first activity
CREATE INDEX IF NOT EXISTS idx_opportunities_founding_interaction_id
ON opportunities(founding_interaction_id)
WHERE founding_interaction_id IS NOT NULL;

-- opportunities.updated_by - Audit trail lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_updated_by
ON opportunities(updated_by)
WHERE updated_by IS NOT NULL;

-- organizations.parent_organization_id - Hierarchy traversal
CREATE INDEX IF NOT EXISTS idx_organizations_parent_organization_id
ON organizations(parent_organization_id)
WHERE parent_organization_id IS NOT NULL;

-- organizations.created_by - Audit trail lookups
CREATE INDEX IF NOT EXISTS idx_organizations_created_by
ON organizations(created_by)
WHERE created_by IS NOT NULL;

-- organizations.updated_by - Audit trail lookups
CREATE INDEX IF NOT EXISTS idx_organizations_updated_by
ON organizations(updated_by)
WHERE updated_by IS NOT NULL;

-- organizations.segment_id - Industry segment filtering
CREATE INDEX IF NOT EXISTS idx_organizations_segment_id
ON organizations(segment_id)
WHERE segment_id IS NOT NULL;

-- contacts.created_by - Audit trail lookups
CREATE INDEX IF NOT EXISTS idx_contacts_created_by
ON contacts(created_by)
WHERE created_by IS NOT NULL;

-- contacts.updated_by - Audit trail lookups
CREATE INDEX IF NOT EXISTS idx_contacts_updated_by
ON contacts(updated_by)
WHERE updated_by IS NOT NULL;

-- ============================================================================
-- SECTION 3: ADD SOFT DELETE TO JUNCTION TABLE
-- ============================================================================
-- opportunity_contacts was missing deleted_at, causing hard deletes
-- when contacts are removed from opportunities (loses historical data).

ALTER TABLE opportunity_contacts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for filtering out soft-deleted records
CREATE INDEX IF NOT EXISTS idx_opportunity_contacts_deleted_at
ON opportunity_contacts(deleted_at)
WHERE deleted_at IS NULL;

-- Update RLS policy to filter soft-deleted records (if exists)
-- First, drop the old policy if it doesn't filter deleted_at
DO $$
BEGIN
  -- Check if policy exists and update it
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'opportunity_contacts'
    AND policyname = 'authenticated_select_opportunity_contacts'
  ) THEN
    DROP POLICY authenticated_select_opportunity_contacts ON opportunity_contacts;
  END IF;
END $$;

-- Recreate SELECT policy with soft delete filter
CREATE POLICY authenticated_select_opportunity_contacts ON opportunity_contacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================================
-- SECTION 4: DOCUMENT CHANGES
-- ============================================================================

COMMENT ON INDEX idx_opportunities_founding_interaction_id IS
  'FK index for founding_interaction_id - audit finding 2025-11-29';

COMMENT ON INDEX idx_organizations_parent_organization_id IS
  'FK index for hierarchy traversal - audit finding 2025-11-29';

COMMENT ON COLUMN opportunity_contacts.deleted_at IS
  'Soft delete timestamp - added per audit finding 2025-11-29';
