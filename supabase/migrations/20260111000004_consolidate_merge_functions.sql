-- ============================================================================
-- CONSOLIDATE DUPLICATE MERGE FUNCTIONS
-- ============================================================================
-- Ensures only one merge_duplicate_contacts function exists (the soft delete version)
-- Drop any other variants that might exist from previous iterations
-- ============================================================================

-- Drop any old function variants (different signatures)
DROP FUNCTION IF EXISTS merge_duplicate_contacts(INTEGER, INTEGER[], BOOLEAN);
DROP FUNCTION IF EXISTS merge_contacts(INTEGER, INTEGER[]);
DROP FUNCTION IF EXISTS consolidate_duplicate_contacts(INTEGER, INTEGER[]);

-- The correct function was created in 20260111000001
-- This migration just cleans up any duplicates

-- Verify only one function exists
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname LIKE '%merge%contact%';

  IF func_count > 1 THEN
    RAISE WARNING 'Multiple merge functions found: %. Review manually.', func_count;
  ELSIF func_count = 1 THEN
    RAISE NOTICE 'Consolidation complete: 1 merge function exists (soft delete version)';
  ELSE
    RAISE WARNING 'No merge functions found - this may indicate an issue';
  END IF;
END $$;
