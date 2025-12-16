-- ============================================
-- Cleanup Row Styling Test Data
-- Run after manual testing is complete
--
-- Run with: npx supabase db execute --file scripts/cleanup-row-styling-test.sql
-- Or paste directly into Supabase SQL Editor (http://localhost:54323)
-- ============================================

-- Show what will be deleted
SELECT
  id,
  name,
  stage,
  estimated_close_date
FROM opportunities
WHERE name LIKE '%🧪 TEST:%' AND deleted_at IS NULL;

-- Soft delete test opportunities (preserves audit trail)
UPDATE opportunities
SET deleted_at = NOW()
WHERE name LIKE '%🧪 TEST:%' AND deleted_at IS NULL;

-- Verify cleanup
DO $$
DECLARE
  v_remaining INT;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM opportunities
  WHERE name LIKE '%🧪 TEST:%' AND deleted_at IS NULL;

  IF v_remaining = 0 THEN
    RAISE NOTICE '✅ All test opportunities have been soft-deleted';
  ELSE
    RAISE WARNING '⚠️ % test records remain active', v_remaining;
  END IF;
END $$;
