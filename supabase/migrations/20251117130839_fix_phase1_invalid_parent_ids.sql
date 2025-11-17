-- Fix Phase 1 Invalid Parent IDs
-- Root Cause: Migration 20251117112343 used RETURNING id INTO variable pattern
-- which worked on local (ID 10335) but got different ID in cloud (ID 2831)
-- This left all branches pointing to nonexistent parent IDs
--
-- This migration fixes all Phase 1 parent organizations by:
-- 1. Finding correct parent ID by NAME (not local ID)
-- 2. Updating all branches to point to correct cloud parent ID
-- 3. Validating fix worked

DO $$
DECLARE
  v_us_foods_parent_id BIGINT;
  v_sysco_parent_id BIGINT;
  v_gordon_parent_id BIGINT;
  v_pfg_parent_id BIGINT;
  v_pfs_parent_id BIGINT;
  v_trinity_parent_id BIGINT;
  v_updated_count INT;
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING PHASE 1 INVALID PARENT IDS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- 1. US FOODS CORPORATE
  SELECT id INTO v_us_foods_parent_id
  FROM organizations
  WHERE name = 'US Foods Corporate'
  LIMIT 1;

  IF v_us_foods_parent_id IS NOT NULL THEN
    UPDATE organizations
    SET parent_organization_id = v_us_foods_parent_id
    WHERE (name ILIKE 'US FOODS%' OR name ILIKE 'US Foods%')
    AND id != v_us_foods_parent_id
    AND (parent_organization_id IS NULL OR parent_organization_id != v_us_foods_parent_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '[1/6] US Foods Corporate (ID %): Fixed % branches', v_us_foods_parent_id, v_updated_count;
  ELSE
    RAISE NOTICE '[1/6] US Foods Corporate: SKIPPED (parent not found)';
  END IF;

  -- 2. SYSCO CORPORATION
  SELECT id INTO v_sysco_parent_id
  FROM organizations
  WHERE name = 'Sysco Corporation'
  LIMIT 1;

  IF v_sysco_parent_id IS NOT NULL THEN
    UPDATE organizations
    SET parent_organization_id = v_sysco_parent_id
    WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
    AND id != v_sysco_parent_id
    AND (parent_organization_id IS NULL OR parent_organization_id != v_sysco_parent_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '[2/6] Sysco Corporation (ID %): Fixed % branches', v_sysco_parent_id, v_updated_count;
  ELSE
    RAISE NOTICE '[2/6] Sysco Corporation: SKIPPED (parent not found)';
  END IF;

  -- 3. GORDON FOOD SERVICE (use the one with most branches)
  SELECT id INTO v_gordon_parent_id
  FROM organizations
  WHERE name = 'Gordon Food Service'
  ORDER BY (SELECT COUNT(*) FROM organizations children WHERE children.parent_organization_id = organizations.id) DESC
  LIMIT 1;

  IF v_gordon_parent_id IS NOT NULL THEN
    UPDATE organizations
    SET parent_organization_id = v_gordon_parent_id
    WHERE (
      name ILIKE 'Gordon Food Service%' OR
      name ILIKE 'Gordon FS%' OR
      name ILIKE 'GFS%'
    )
    AND id != v_gordon_parent_id
    AND (parent_organization_id IS NULL OR parent_organization_id != v_gordon_parent_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '[3/6] Gordon Food Service (ID %): Fixed % branches', v_gordon_parent_id, v_updated_count;
  ELSE
    RAISE NOTICE '[3/6] Gordon Food Service: SKIPPED (parent not found)';
  END IF;

  -- 4. PERFORMANCE FOOD GROUP
  SELECT id INTO v_pfg_parent_id
  FROM organizations
  WHERE name = 'Performance Food Group'
  LIMIT 1;

  IF v_pfg_parent_id IS NOT NULL THEN
    UPDATE organizations
    SET parent_organization_id = v_pfg_parent_id
    WHERE (
      name ILIKE 'Performance Food%' OR
      name ILIKE 'PFG%' OR
      name ILIKE '%Performance Foodservice%'
    )
    AND id != v_pfg_parent_id
    AND (parent_organization_id IS NULL OR parent_organization_id != v_pfg_parent_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '[4/6] Performance Food Group (ID %): Fixed % branches', v_pfg_parent_id, v_updated_count;
  ELSE
    RAISE NOTICE '[4/6] Performance Food Group: SKIPPED (parent not found)';
  END IF;

  -- 5. PFS CORPORATE
  SELECT id INTO v_pfs_parent_id
  FROM organizations
  WHERE name = 'PFS Corporate'
  LIMIT 1;

  IF v_pfs_parent_id IS NOT NULL THEN
    UPDATE organizations
    SET parent_organization_id = v_pfs_parent_id
    WHERE name ILIKE 'PFS%'
    AND id != v_pfs_parent_id
    AND (parent_organization_id IS NULL OR parent_organization_id != v_pfs_parent_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '[5/6] PFS Corporate (ID %): Fixed % branches', v_pfs_parent_id, v_updated_count;
  ELSE
    RAISE NOTICE '[5/6] PFS Corporate: SKIPPED (parent not found)';
  END IF;

  -- 6. TRINITY HEALTH SYSTEM
  SELECT id INTO v_trinity_parent_id
  FROM organizations
  WHERE name = 'Trinity Health System'
  LIMIT 1;

  IF v_trinity_parent_id IS NOT NULL THEN
    UPDATE organizations
    SET parent_organization_id = v_trinity_parent_id
    WHERE (
      name ILIKE 'Trinity Health%' OR
      name ILIKE 'THS%'
    )
    AND id != v_trinity_parent_id
    AND (parent_organization_id IS NULL OR parent_organization_id != v_trinity_parent_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '[6/6] Trinity Health System (ID %): Fixed % branches', v_trinity_parent_id, v_updated_count;
  ELSE
    RAISE NOTICE '[6/6] Trinity Health System: SKIPPED (parent not found)';
  END IF;

  -- VALIDATION
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check for any remaining invalid parent IDs
  FOR rec IN
    SELECT
      p.name as parent_name,
      COUNT(*) as invalid_count
    FROM organizations o
    LEFT JOIN organizations p ON o.parent_organization_id = p.id
    WHERE o.parent_organization_id IS NOT NULL
    AND p.id IS NULL
    GROUP BY p.name
  LOOP
    RAISE NOTICE '[WARN] Found % organizations with invalid parent_organization_id', rec.invalid_count;
  END LOOP;

  -- Summary by parent
  FOR rec IN
    SELECT
      p.name as parent_name,
      p.id as parent_id,
      COUNT(*) as branch_count
    FROM organizations o
    JOIN organizations p ON o.parent_organization_id = p.id
    WHERE p.name IN (
      'US Foods Corporate',
      'Sysco Corporation',
      'Gordon Food Service',
      'Performance Food Group',
      'PFS Corporate',
      'Trinity Health System'
    )
    GROUP BY p.id, p.name
    ORDER BY p.name
  LOOP
    RAISE NOTICE '[OK] % (ID %): % valid branches', rec.parent_name, rec.parent_id, rec.branch_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
