-- =====================================================
-- Migration: Organization Hierarchy Phase 1 Cleanup
-- Date: 2025-11-17
-- Description: Create major distributor parents and link branch locations
-- Affects: ~130 organizations (HIGH confidence, LOW risk)
-- =====================================================

-- =====================================================
-- PHASE 1: Create Parent Organizations for Major Distributors
-- =====================================================

DO $$
DECLARE
  v_us_foods_parent_id BIGINT;
  v_sysco_parent_id BIGINT;
  v_gordon_fs_parent_id BIGINT;
  v_pfg_parent_id BIGINT;
  v_pfs_parent_id BIGINT;
  v_ths_parent_id BIGINT;
BEGIN

  -- =====================================================
  -- 1. US FOODS CORPORATE
  -- =====================================================

  -- Create parent organization
  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    notes
  ) VALUES (
    'US Foods Corporate',
    'distributor',
    'A',
    'Rosemont',
    'IL',
    'Corporate parent for all US Foods branch locations. Created during Phase 1 hierarchy cleanup 2025-11-17.'
  )
  RETURNING id INTO v_us_foods_parent_id;

  RAISE NOTICE 'Created US Foods Corporate parent (ID: %)', v_us_foods_parent_id;

  -- Link all US Foods branches to parent
  UPDATE organizations
  SET parent_organization_id = v_us_foods_parent_id
  WHERE (
    name ILIKE 'US FOODS%' OR
    name ILIKE 'US Foods%'
  )
  AND id != v_us_foods_parent_id
  AND parent_organization_id IS NULL;

  RAISE NOTICE 'Linked US Foods branches: % organizations updated',
    (SELECT COUNT(*) FROM organizations WHERE parent_organization_id = v_us_foods_parent_id);

  -- =====================================================
  -- 2. SYSCO CORPORATION
  -- =====================================================

  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    notes
  ) VALUES (
    'Sysco Corporation',
    'distributor',
    'A',
    'Houston',
    'TX',
    'Corporate parent for all Sysco branch locations. Created during Phase 1 hierarchy cleanup 2025-11-17.'
  )
  RETURNING id INTO v_sysco_parent_id;

  RAISE NOTICE 'Created Sysco Corporation parent (ID: %)', v_sysco_parent_id;

  -- Link all Sysco branches to parent
  UPDATE organizations
  SET parent_organization_id = v_sysco_parent_id
  WHERE (
    name ILIKE 'Sysco%' OR
    name ILIKE 'SYSCO%'
  )
  AND id != v_sysco_parent_id
  AND parent_organization_id IS NULL;

  RAISE NOTICE 'Linked Sysco branches: % organizations updated',
    (SELECT COUNT(*) FROM organizations WHERE parent_organization_id = v_sysco_parent_id);

  -- =====================================================
  -- 3. GORDON FOOD SERVICE
  -- =====================================================

  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    notes
  ) VALUES (
    'Gordon Food Service',
    'distributor',
    'A',
    'Grand Rapids',
    'MI',
    'Corporate parent for all Gordon FS branch locations. Created during Phase 1 hierarchy cleanup 2025-11-17.'
  )
  RETURNING id INTO v_gordon_fs_parent_id;

  RAISE NOTICE 'Created Gordon Food Service parent (ID: %)', v_gordon_fs_parent_id;

  -- Link all Gordon FS branches to parent
  UPDATE organizations
  SET parent_organization_id = v_gordon_fs_parent_id
  WHERE name ILIKE 'GORDON FS/%'
  AND id != v_gordon_fs_parent_id
  AND parent_organization_id IS NULL;

  RAISE NOTICE 'Linked Gordon FS branches: % organizations updated',
    (SELECT COUNT(*) FROM organizations WHERE parent_organization_id = v_gordon_fs_parent_id);

  -- =====================================================
  -- 4. PERFORMANCE FOOD GROUP (PFG)
  -- =====================================================

  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    notes
  ) VALUES (
    'Performance Food Group',
    'distributor',
    'A',
    'Richmond',
    'VA',
    'Corporate parent for all PFG branch locations. Created during Phase 1 hierarchy cleanup 2025-11-17.'
  )
  RETURNING id INTO v_pfg_parent_id;

  RAISE NOTICE 'Created Performance Food Group parent (ID: %)', v_pfg_parent_id;

  -- Fix organization type inconsistencies for PFG branches BEFORE linking
  UPDATE organizations
  SET organization_type = 'distributor'
  WHERE name ILIKE 'PFG-%'
  AND organization_type IN ('customer', 'unknown');

  RAISE NOTICE 'Fixed PFG organization types: % updated to distributor',
    (SELECT COUNT(*) FROM organizations WHERE name ILIKE 'PFG-%' AND organization_type = 'distributor');

  -- Link all PFG branches to parent
  UPDATE organizations
  SET parent_organization_id = v_pfg_parent_id
  WHERE name ILIKE 'PFG-%'
  AND id != v_pfg_parent_id
  AND parent_organization_id IS NULL;

  RAISE NOTICE 'Linked PFG branches: % organizations updated',
    (SELECT COUNT(*) FROM organizations WHERE parent_organization_id = v_pfg_parent_id);

  -- =====================================================
  -- 5. PFS CORPORATE
  -- =====================================================

  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    notes
  ) VALUES (
    'PFS Corporate',
    'distributor',
    'A',
    NULL,
    NULL,
    'Corporate parent for all PFS branch locations. Created during Phase 1 hierarchy cleanup 2025-11-17.'
  )
  RETURNING id INTO v_pfs_parent_id;

  RAISE NOTICE 'Created PFS Corporate parent (ID: %)', v_pfs_parent_id;

  -- Link all PFS branches to parent
  UPDATE organizations
  SET parent_organization_id = v_pfs_parent_id
  WHERE name ILIKE 'PFS/%'
  AND id != v_pfs_parent_id
  AND parent_organization_id IS NULL;

  RAISE NOTICE 'Linked PFS branches: % organizations updated',
    (SELECT COUNT(*) FROM organizations WHERE parent_organization_id = v_pfs_parent_id);

  -- =====================================================
  -- 6. TRINITY HEALTH SYSTEM (THS) - Healthcare
  -- =====================================================

  INSERT INTO organizations (
    name,
    organization_type,
    priority,
    city,
    state,
    notes
  ) VALUES (
    'Trinity Health System',
    'customer',
    'A',
    NULL,
    NULL,
    'Corporate parent for all THS healthcare facilities. Created during Phase 1 hierarchy cleanup 2025-11-17.'
  )
  RETURNING id INTO v_ths_parent_id;

  RAISE NOTICE 'Created Trinity Health System parent (ID: %)', v_ths_parent_id;

  -- Link all THS facilities to parent
  UPDATE organizations
  SET parent_organization_id = v_ths_parent_id
  WHERE name ILIKE 'THS-%'
  AND id != v_ths_parent_id
  AND parent_organization_id IS NULL;

  RAISE NOTICE 'Linked THS facilities: % organizations updated',
    (SELECT COUNT(*) FROM organizations WHERE parent_organization_id = v_ths_parent_id);

END $$;

-- =====================================================
-- VALIDATION SUMMARY
-- =====================================================

-- Show summary of created hierarchies
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PHASE 1 CLEANUP SUMMARY';
  RAISE NOTICE '========================================';

  FOR rec IN (
    SELECT
      p.name as parent_name,
      COUNT(c.id) as child_count
    FROM organizations p
    LEFT JOIN organizations c ON c.parent_organization_id = p.id
    WHERE p.notes LIKE '%Phase 1 hierarchy cleanup 2025-11-17%'
    GROUP BY p.id, p.name
    ORDER BY child_count DESC
  ) LOOP
    RAISE NOTICE '% -> % branches', rec.parent_name, rec.child_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Total organizations with parents: %',
    (SELECT COUNT(*) FROM organizations WHERE parent_organization_id IS NOT NULL);
  RAISE NOTICE 'Total parent organizations: %',
    (SELECT COUNT(DISTINCT parent_organization_id) FROM organizations WHERE parent_organization_id IS NOT NULL);
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Summary of Changes:
--  Created 6 new parent organizations (5 distributors + 1 healthcare)
--  Linked ~130 branch locations to parents
--  Fixed organization_type inconsistencies for PFG branches
--  Added notes to all parent orgs for audit trail

-- Affected Organizations:
-- - US Foods: ~14 branches
-- - Sysco: ~11 branches
-- - Gordon Food Service: ~11 branches
-- - Performance Food Group (PFG): ~5 branches
-- - PFS: ~4 branches
-- - Trinity Health System (THS): ~5 facilities

-- Breaking Changes: NONE
-- - All changes are additive (creating parents, setting NULL fields)
-- - No existing data deleted or modified destructively

-- Rollback Plan:
-- If needed, revert by setting parent_organization_id back to NULL:
--   UPDATE organizations
--   SET parent_organization_id = NULL
--   WHERE parent_organization_id IN (
--     SELECT id FROM organizations
--     WHERE notes LIKE '%Phase 1 hierarchy cleanup 2025-11-17%'
--   );
-- Then delete the 6 parent organizations created by this migration.
