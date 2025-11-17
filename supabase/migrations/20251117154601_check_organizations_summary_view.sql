-- Check the actual view definition in the database
DO $$
DECLARE
  view_def TEXT;
  has_parent_id BOOLEAN := false;
  has_parent_name BOOLEAN := false;
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ORGANIZATIONS_SUMMARY VIEW ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Get the full view definition
  SELECT pg_get_viewdef('organizations_summary'::regclass, true) INTO view_def;

  -- Check if parent_organization_id exists in the view
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations_summary'
      AND column_name = 'parent_organization_id'
  ) INTO has_parent_id;

  -- Check if parent_organization_name exists in the view
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations_summary'
      AND column_name = 'parent_organization_name'
  ) INTO has_parent_name;

  RAISE NOTICE 'View columns check:';
  RAISE NOTICE '  - parent_organization_id: %', CASE WHEN has_parent_id THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '  - parent_organization_name: %', CASE WHEN has_parent_name THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '';

  -- Show all columns in the view
  RAISE NOTICE 'All columns in organizations_summary:';
  FOR rec IN
    SELECT column_name, data_type, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations_summary'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  % | % | %', LPAD(rec.ordinal_position::text, 2), RPAD(rec.column_name, 30), rec.data_type;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'First 100 chars of view definition:';
  RAISE NOTICE '%', LEFT(view_def, 100);

  IF NOT has_parent_id OR NOT has_parent_name THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: Parent columns are MISSING from the view!';
    RAISE NOTICE 'The migration 20251110142654 should have added these columns.';
    RAISE NOTICE 'Something has overwritten the view definition after the migration.';
    RAISE NOTICE '';
    RAISE NOTICE 'ACTION REQUIRED: Re-apply the view definition from the migration.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Parent columns exist in the view as expected.';
    RAISE NOTICE 'The issue may be in the data provider or frontend code.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;