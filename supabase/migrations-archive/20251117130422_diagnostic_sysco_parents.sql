-- Diagnostic Migration: Investigate Sysco Parent Organization Issue
-- This migration outputs diagnostic information and makes NO schema changes
-- Safe to run and rollback

DO $$
DECLARE
  v_sysco_parent_count INT;
  v_sysco_parent_id BIGINT;
  v_sysco_branches_count INT;
  v_sysco_linked_count INT;
  v_phase1_parents_count INT;
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SYSCO PARENT DIAGNOSTIC';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Step 1: Check for Phase 1 parent organizations
  RAISE NOTICE 'Step 1: Checking for Phase 1 parent organizations...';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_phase1_parents_count
  FROM organizations
  WHERE name IN (
    'US Foods Corporate',
    'Sysco Corporation',
    'Gordon Food Service',
    'Performance Food Group',
    'PFS Corporate',
    'Trinity Health System'
  );

  RAISE NOTICE 'Phase 1 parents found: % of 6 expected', v_phase1_parents_count;
  RAISE NOTICE '';

  -- List all Phase 1 parents
  RAISE NOTICE 'Phase 1 Parents in Database:';
  FOR rec IN
    SELECT
      id,
      name,
      organization_type,
      city,
      state,
      (SELECT COUNT(*) FROM organizations children WHERE children.parent_organization_id = parents.id) as branch_count
    FROM organizations parents
    WHERE name IN (
      'US Foods Corporate',
      'Sysco Corporation',
      'Gordon Food Service',
      'Performance Food Group',
      'PFS Corporate',
      'Trinity Health System'
    )
    ORDER BY name
  LOOP
    RAISE NOTICE '  - % (ID: %, Type: %, Branches: %)', rec.name, rec.id, rec.organization_type, rec.branch_count;
  END LOOP;

  -- Step 2: Check specifically for Sysco Corporation
  RAISE NOTICE '';
  RAISE NOTICE 'Step 2: Checking Sysco Corporation parent...';
  RAISE NOTICE '';

  SELECT COUNT(*), MAX(id) INTO v_sysco_parent_count, v_sysco_parent_id
  FROM organizations
  WHERE name = 'Sysco Corporation';

  IF v_sysco_parent_count > 0 THEN
    RAISE NOTICE '[OK] Sysco Corporation parent EXISTS (ID: %)', v_sysco_parent_id;
  ELSE
    RAISE NOTICE '[FAIL] Sysco Corporation parent DOES NOT EXIST';
  END IF;

  -- Step 3: Count Sysco branches
  RAISE NOTICE '';
  RAISE NOTICE 'Step 3: Counting Sysco branch organizations...';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_sysco_branches_count
  FROM organizations
  WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
  AND name != 'Sysco Corporation';

  RAISE NOTICE 'Total Sysco branches: %', v_sysco_branches_count;

  -- Step 4: Check how many are linked
  SELECT COUNT(*) INTO v_sysco_linked_count
  FROM organizations
  WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
  AND name != 'Sysco Corporation'
  AND parent_organization_id IS NOT NULL;

  RAISE NOTICE 'Branches with parent_organization_id set: %', v_sysco_linked_count;

  -- Step 5: Show sample Sysco branches
  RAISE NOTICE '';
  RAISE NOTICE 'Sample Sysco Branches (first 10):';
  FOR rec IN
    SELECT
      id,
      name,
      organization_type,
      parent_organization_id,
      CASE
        WHEN parent_organization_id IS NULL THEN 'NO PARENT'
        ELSE COALESCE((SELECT name FROM organizations p WHERE p.id = parent_organization_id), 'INVALID ID')
      END as parent_name
    FROM organizations
    WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
    AND name != 'Sysco Corporation'
    ORDER BY name
    LIMIT 10
  LOOP
    RAISE NOTICE '  - % (ID: %, Parent: %)', rec.name, rec.id, rec.parent_name;
  END LOOP;

  -- Step 6: Analysis
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  IF v_sysco_parent_count = 0 THEN
    RAISE NOTICE '[FAIL] ROOT CAUSE: Sysco Corporation parent was NOT created in cloud database';
    RAISE NOTICE '   - Migration 20251117112343_organization_hierarchy_phase1_cleanup.sql';
    RAISE NOTICE '   - Either failed to run OR the INSERT statement did not execute';
    RAISE NOTICE '';
    RAISE NOTICE '[FIX] RECOMMENDED FIX:';
    RAISE NOTICE '   - Create new migration to INSERT Sysco Corporation parent';
    RAISE NOTICE '   - Link all Sysco branches to new parent';
  ELSIF v_sysco_linked_count = 0 THEN
    RAISE NOTICE '[WARN] ISSUE: Parent exists but NO branches are linked';
    RAISE NOTICE '   - Migration UPDATE statement failed or did not match any rows';
    RAISE NOTICE '   - Pattern used: name ILIKE ''Sysco%%'' OR name ILIKE ''SYSCO%%''';
    RAISE NOTICE '';
    RAISE NOTICE '[FIX] RECOMMENDED FIX:';
    RAISE NOTICE '   - Create migration to UPDATE organizations SET parent_organization_id = %', v_sysco_parent_id;
    RAISE NOTICE '   - WHERE clause: name ILIKE ''Sysco%%'' OR name ILIKE ''SYSCO%%''';
  ELSIF v_sysco_linked_count < v_sysco_branches_count THEN
    RAISE NOTICE '[WARN] PARTIAL SUCCESS: Some branches linked, but not all';
    RAISE NOTICE '   - Linked: % of % total branches', v_sysco_linked_count, v_sysco_branches_count;
    RAISE NOTICE '   - May need to adjust WHERE clause or manually link remaining';
  ELSE
    RAISE NOTICE '[OK] SUCCESS: All Sysco branches are properly linked to parent';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This migration made NO schema changes.';
  RAISE NOTICE 'Safe to rollback or delete after reviewing output.';
  RAISE NOTICE '';
END $$;
