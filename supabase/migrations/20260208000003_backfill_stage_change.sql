-- ============================================================================
-- Migration: Backfill historical stage changes
-- ============================================================================
-- Part of Timeline/Activity System Remediation
-- Updates historical stage change activities from type='note' to type='stage_change'
--
-- SAFE-BY-DEFAULT PROTOCOL: Run preview queries BEFORE executing UPDATE
-- ============================================================================

-- ============================================================================
-- STEP 1: PREVIEW QUERY (Run this FIRST and manually review sample)
-- ============================================================================
-- Run this query and review the results before proceeding:
/*
SELECT id, subject, description, created_at, opportunity_id
FROM activities
WHERE type = 'note'
  AND subject ~ '^Stage changed from [a-z_]+ to [a-z_]+$'
  AND description LIKE 'Pipeline stage automatically updated%'
  AND opportunity_id IS NOT NULL
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- Expected: All rows should be trigger-generated stage changes
-- Red flags: User-authored notes, unexpected descriptions
*/

-- ============================================================================
-- STEP 2: COUNT AFFECTED ROWS (Document this before proceeding)
-- ============================================================================
/*
SELECT COUNT(*) AS will_update FROM activities
WHERE type = 'note'
  AND subject ~ '^Stage changed from [a-z_]+ to [a-z_]+$'
  AND description LIKE 'Pipeline stage automatically updated%'
  AND opportunity_id IS NOT NULL
  AND deleted_at IS NULL;

-- Document this number: ___________
*/

-- ============================================================================
-- STEP 3: AUDIT NON-MATCHING ENTRIES (Review for false positives)
-- ============================================================================
-- Check for entries that LOOK like stage changes but DON'T match tight predicate
/*
SELECT id, subject, description, created_at
FROM activities
WHERE type = 'note'
  AND subject LIKE 'Stage changed%'
  AND NOT (
    subject ~ '^Stage changed from [a-z_]+ to [a-z_]+$'
    AND description LIKE 'Pipeline stage automatically updated%'
  )
  AND opportunity_id IS NOT NULL
  AND deleted_at IS NULL;

-- If results > 0: These are client-side format variations or user notes
-- Decision: Include in backfill (if safe) or exclude (if user-authored)
*/

-- ============================================================================
-- STEP 4: EXECUTE UPDATE (Only after Steps 1-3 reviewed and approved)
-- ============================================================================

DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- First, count what we're about to update for logging
  SELECT COUNT(*) INTO affected_count
  FROM activities
  WHERE type = 'note'
    AND subject ~ '^Stage changed from [a-z_]+ to [a-z_]+$'
    AND description LIKE 'Pipeline stage automatically updated%'
    AND opportunity_id IS NOT NULL
    AND deleted_at IS NULL;

  RAISE NOTICE 'Backfill: About to update % stage change activities', affected_count;

  -- Execute the update with tightened predicate
  UPDATE activities
  SET type = 'stage_change'
  WHERE type = 'note'
    AND subject ~ '^Stage changed from [a-z_]+ to [a-z_]+$'
    AND description LIKE 'Pipeline stage automatically updated%'
    AND opportunity_id IS NOT NULL
    AND deleted_at IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Backfill: Updated % rows to type=stage_change', affected_count;
END $$;

-- ============================================================================
-- VERIFICATION QUERY (Run after migration to confirm)
-- ============================================================================
/*
-- Count stage_change entries (should match Step 2 count + any new ones)
SELECT COUNT(*) AS stage_change_count FROM activities WHERE type = 'stage_change';

-- Verify no duplicates remain
SELECT opportunity_id, subject, COUNT(*) as count
FROM activities
WHERE subject LIKE 'Stage changed%'
  AND opportunity_id IS NOT NULL
  AND deleted_at IS NULL
GROUP BY opportunity_id, subject, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates after Phase 1 client-side removal)
*/

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================
/*
UPDATE activities
SET type = 'note'
WHERE type = 'stage_change'
  AND subject ~ '^Stage changed from [a-z_]+ to [a-z_]+$';
*/
