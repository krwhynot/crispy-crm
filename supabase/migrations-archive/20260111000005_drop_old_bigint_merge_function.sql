-- ============================================================================
-- DROP OLD BIGINT MERGE FUNCTION
-- ============================================================================
-- Removes the legacy bigint-parameter version that uses hard DELETE
-- Keeps only the integer-parameter version that uses soft DELETE
-- ============================================================================

-- Drop the old bigint version (uses hard DELETE)
DROP FUNCTION IF EXISTS merge_duplicate_contacts(BIGINT, BIGINT[]);

-- Verify only one function remains
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'merge_duplicate_contacts';

  IF func_count = 1 THEN
    RAISE NOTICE 'SUCCESS: Only soft-delete merge_duplicate_contacts(INTEGER, INTEGER[]) remains';
  ELSE
    RAISE WARNING 'Expected 1 merge function, found: %', func_count;
  END IF;
END $$;
