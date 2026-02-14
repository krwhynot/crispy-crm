-- Verify Actual parent_organization_id Values in Sysco Branches
-- Shows the RAW values stored, not just whether joins work

DO $$
DECLARE
  v_sysco_parent_id BIGINT;
  rec RECORD;
  v_null_count INT := 0;
  v_valid_count INT := 0;
  v_invalid_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SYSCO PARENT_ORGANIZATION_ID RAW VALUES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Get the correct Sysco parent ID
  SELECT id INTO v_sysco_parent_id
  FROM organizations
  WHERE name = 'Sysco Corporation'
  LIMIT 1;

  RAISE NOTICE 'Correct Sysco Corporation parent ID: %', v_sysco_parent_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Sysco Branches (showing RAW parent_organization_id values):';
  RAISE NOTICE '';

  -- Show actual parent_organization_id values for all Sysco branches
  FOR rec IN
    SELECT
      id,
      name,
      parent_organization_id,
      CASE
        WHEN parent_organization_id IS NULL THEN 'NULL'
        WHEN parent_organization_id = v_sysco_parent_id THEN 'CORRECT (' || v_sysco_parent_id || ')'
        ELSE 'WRONG (' || parent_organization_id || ')'
      END as status
    FROM organizations
    WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
    AND name != 'Sysco Corporation'
    ORDER BY name
  LOOP
    RAISE NOTICE '  ID % | % | parent_organization_id = %',
      rec.id,
      RPAD(rec.name, 35),
      rec.status;

    IF rec.parent_organization_id IS NULL THEN
      v_null_count := v_null_count + 1;
    ELSIF rec.parent_organization_id = v_sysco_parent_id THEN
      v_valid_count := v_valid_count + 1;
    ELSE
      v_invalid_count := v_invalid_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Branches with NULL parent: %', v_null_count;
  RAISE NOTICE 'Branches with CORRECT parent (% ): %', v_sysco_parent_id, v_valid_count;
  RAISE NOTICE 'Branches with WRONG parent: %', v_invalid_count;
  RAISE NOTICE '';

  IF v_invalid_count > 0 OR v_null_count > 0 THEN
    RAISE NOTICE '[ACTION NEEDED] % branches need parent_organization_id updated to %',
      (v_invalid_count + v_null_count), v_sysco_parent_id;
  ELSE
    RAISE NOTICE '[OK] All Sysco branches correctly linked';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
