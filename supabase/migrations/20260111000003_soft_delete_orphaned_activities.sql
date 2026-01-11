-- ============================================================================
-- SOFT DELETE ORPHANED ACTIVITIES
-- ============================================================================
-- Converts hard DELETE to soft delete for activities with invalid created_by
-- Original: DELETE FROM activities WHERE created_by NOT IN (SELECT id FROM sales)
-- ============================================================================

-- Soft delete activities with invalid created_by
UPDATE activities
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE created_by IS NOT NULL
  AND created_by NOT IN (SELECT id FROM sales WHERE deleted_at IS NULL)
  AND deleted_at IS NULL;

-- Log affected count
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM activities
  WHERE deleted_at >= NOW() - INTERVAL '1 minute'
    AND created_by IS NOT NULL
    AND created_by NOT IN (SELECT id FROM sales WHERE deleted_at IS NULL);
  RAISE NOTICE 'Soft deleted % orphaned activities', affected_count;
END $$;
