-- ============================================================================
-- SOFT DELETE ORPHANED OPPORTUNITIES
-- ============================================================================
-- Converts hard DELETE to soft delete for opportunities with invalid FK refs
-- Original: DELETE FROM opportunities WHERE customer_organization_id NOT IN (SELECT id FROM organizations)
-- ============================================================================

-- Soft delete opportunities with invalid customer_organization_id
-- These are orphaned records that should be archived, not destroyed
UPDATE opportunities
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE customer_organization_id NOT IN (
  SELECT id FROM organizations WHERE deleted_at IS NULL
)
AND deleted_at IS NULL;

-- Log how many were affected (this runs as a DO block for visibility)
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM opportunities
  WHERE deleted_at >= NOW() - INTERVAL '1 minute'
    AND customer_organization_id NOT IN (SELECT id FROM organizations WHERE deleted_at IS NULL);
  RAISE NOTICE 'Soft deleted % orphaned opportunities', affected_count;
END $$;

-- Note: distributor_organization_id was already handled with SET NULL
-- No changes needed for that field
