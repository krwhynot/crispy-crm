-- Batch merge all duplicate contacts
-- This script merges all duplicate groups, keeping the oldest record

DO $$
DECLARE
  dup_record RECORD;
  merge_result JSONB;
  total_merged INT := 0;
  total_groups INT := 0;
  errors TEXT[] := '{}';
BEGIN
  RAISE NOTICE 'Starting batch duplicate merge...';

  -- Loop through all duplicate groups
  FOR dup_record IN
    SELECT keeper_id, duplicate_ids, normalized_name, organization_name
    FROM contact_duplicates
    ORDER BY duplicate_count DESC
  LOOP
    total_groups := total_groups + 1;

    BEGIN
      -- Call the merge function for each group
      SELECT merge_duplicate_contacts(dup_record.keeper_id, dup_record.duplicate_ids) INTO merge_result;
      total_merged := total_merged + (merge_result->>'duplicates_removed')::INT;

      RAISE NOTICE 'Merged group %: % at % - removed % duplicates',
        total_groups,
        dup_record.normalized_name,
        COALESCE(dup_record.organization_name, 'No Org'),
        merge_result->>'duplicates_removed';

    EXCEPTION WHEN OTHERS THEN
      errors := array_append(errors, FORMAT('Group %s (%s): %s', total_groups, dup_record.normalized_name, SQLERRM));
      RAISE NOTICE 'Error merging group %: %', total_groups, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Batch merge complete!';
  RAISE NOTICE 'Total groups processed: %', total_groups;
  RAISE NOTICE 'Total duplicates removed: %', total_merged;
  RAISE NOTICE 'Errors: %', array_length(errors, 1);

  IF array_length(errors, 1) > 0 THEN
    RAISE NOTICE 'Error details:';
    FOR i IN 1..array_length(errors, 1) LOOP
      RAISE NOTICE '  - %', errors[i];
    END LOOP;
  END IF;

END $$;

-- Show remaining duplicates (should be 0)
SELECT
  COUNT(*) as remaining_duplicate_groups,
  COALESCE(SUM(duplicate_count - 1), 0) as remaining_extra_records
FROM contact_duplicates;
