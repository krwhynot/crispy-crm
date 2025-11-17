-- Fix distributor parent relationships
-- The previous migration was looking for invalid parent_organization_id values
-- but the actual branches had NULL values, so they weren't being linked

-- Fix Sysco branches (17 expected)
UPDATE organizations
SET parent_organization_id = (
  SELECT id FROM organizations
  WHERE name = 'Sysco Corporation'
  AND deleted_at IS NULL
  LIMIT 1
)
WHERE name ILIKE '%sysco%'
  AND name != 'Sysco Corporation'
  AND parent_organization_id IS NULL
  AND deleted_at IS NULL;

-- Log Sysco updates
DO $$
DECLARE
  sysco_parent_id BIGINT;
  sysco_branches_updated INTEGER;
BEGIN
  SELECT id INTO sysco_parent_id
  FROM organizations
  WHERE name = 'Sysco Corporation'
  AND deleted_at IS NULL
  LIMIT 1;

  GET DIAGNOSTICS sysco_branches_updated = ROW_COUNT;

  IF sysco_parent_id IS NOT NULL THEN
    RAISE NOTICE 'Linked % Sysco branches to parent (ID: %)', sysco_branches_updated, sysco_parent_id;
  END IF;
END $$;

-- Fix US Foods branches (16 expected)
UPDATE organizations
SET parent_organization_id = (
  SELECT id FROM organizations
  WHERE name = 'US Foods'
  AND deleted_at IS NULL
  LIMIT 1
)
WHERE name ILIKE '%us foods%'
  AND name != 'US Foods'
  AND parent_organization_id IS NULL
  AND deleted_at IS NULL;

-- Log US Foods updates
DO $$
DECLARE
  usfoods_parent_id BIGINT;
  usfoods_branches_updated INTEGER;
BEGIN
  SELECT id INTO usfoods_parent_id
  FROM organizations
  WHERE name = 'US Foods'
  AND deleted_at IS NULL
  LIMIT 1;

  GET DIAGNOSTICS usfoods_branches_updated = ROW_COUNT;

  IF usfoods_parent_id IS NOT NULL THEN
    RAISE NOTICE 'Linked % US Foods branches to parent (ID: %)', usfoods_branches_updated, usfoods_parent_id;
  END IF;
END $$;

-- Fix Gordon Food Service branches (14 expected)
UPDATE organizations
SET parent_organization_id = (
  SELECT id FROM organizations
  WHERE name = 'Gordon Food Service'
  AND deleted_at IS NULL
  LIMIT 1
)
WHERE name ILIKE '%gordon food%'
  AND name != 'Gordon Food Service'
  AND parent_organization_id IS NULL
  AND deleted_at IS NULL;

-- Log Gordon Food Service updates
DO $$
DECLARE
  gordon_parent_id BIGINT;
  gordon_branches_updated INTEGER;
BEGIN
  SELECT id INTO gordon_parent_id
  FROM organizations
  WHERE name = 'Gordon Food Service'
  AND deleted_at IS NULL
  LIMIT 1;

  GET DIAGNOSTICS gordon_branches_updated = ROW_COUNT;

  IF gordon_parent_id IS NOT NULL THEN
    RAISE NOTICE 'Linked % Gordon Food Service branches to parent (ID: %)', gordon_branches_updated, gordon_parent_id;
  END IF;
END $$;

-- Fix Performance Food Group branches (6 expected)
UPDATE organizations
SET parent_organization_id = (
  SELECT id FROM organizations
  WHERE name = 'Performance Food Group'
  AND deleted_at IS NULL
  LIMIT 1
)
WHERE name ILIKE '%performance food%'
  AND name != 'Performance Food Group'
  AND parent_organization_id IS NULL
  AND deleted_at IS NULL;

-- Log Performance Food Group updates
DO $$
DECLARE
  pfg_parent_id BIGINT;
  pfg_branches_updated INTEGER;
BEGIN
  SELECT id INTO pfg_parent_id
  FROM organizations
  WHERE name = 'Performance Food Group'
  AND deleted_at IS NULL
  LIMIT 1;

  GET DIAGNOSTICS pfg_branches_updated = ROW_COUNT;

  IF pfg_parent_id IS NOT NULL THEN
    RAISE NOTICE 'Linked % Performance Food Group branches to parent (ID: %)', pfg_branches_updated, pfg_parent_id;
  END IF;
END $$;

-- Fix Shamrock Foods branches (4 expected)
UPDATE organizations
SET parent_organization_id = (
  SELECT id FROM organizations
  WHERE name = 'Shamrock Foods Company'
  AND deleted_at IS NULL
  LIMIT 1
)
WHERE name ILIKE '%shamrock%'
  AND name != 'Shamrock Foods Company'
  AND parent_organization_id IS NULL
  AND deleted_at IS NULL;

-- Log Shamrock Foods updates
DO $$
DECLARE
  shamrock_parent_id BIGINT;
  shamrock_branches_updated INTEGER;
BEGIN
  SELECT id INTO shamrock_parent_id
  FROM organizations
  WHERE name = 'Shamrock Foods Company'
  AND deleted_at IS NULL
  LIMIT 1;

  GET DIAGNOSTICS shamrock_branches_updated = ROW_COUNT;

  IF shamrock_parent_id IS NOT NULL THEN
    RAISE NOTICE 'Linked % Shamrock Foods branches to parent (ID: %)', shamrock_branches_updated, shamrock_parent_id;
  END IF;
END $$;

-- Verify the results
DO $$
DECLARE
  total_parents INTEGER;
  total_branches INTEGER;
  orphaned_distributors INTEGER;
BEGIN
  -- Count parent organizations
  SELECT COUNT(DISTINCT id) INTO total_parents
  FROM organizations
  WHERE name IN (
    'Sysco Corporation',
    'US Foods',
    'Gordon Food Service',
    'Performance Food Group',
    'Shamrock Foods Company'
  )
  AND deleted_at IS NULL;

  -- Count linked branches
  SELECT COUNT(*) INTO total_branches
  FROM organizations
  WHERE parent_organization_id IN (
    SELECT id FROM organizations
    WHERE name IN (
      'Sysco Corporation',
      'US Foods',
      'Gordon Food Service',
      'Performance Food Group',
      'Shamrock Foods Company'
    )
    AND deleted_at IS NULL
  )
  AND deleted_at IS NULL;

  -- Check for any remaining orphaned distributor branches
  SELECT COUNT(*) INTO orphaned_distributors
  FROM organizations
  WHERE organization_type = 'distributor'
    AND parent_organization_id IS NULL
    AND name NOT IN (
      'Sysco Corporation',
      'US Foods',
      'Gordon Food Service',
      'Performance Food Group',
      'Shamrock Foods Company'
    )
    AND (
      name ILIKE '%sysco%' OR
      name ILIKE '%us foods%' OR
      name ILIKE '%gordon food%' OR
      name ILIKE '%performance food%' OR
      name ILIKE '%shamrock%'
    )
    AND deleted_at IS NULL;

  RAISE NOTICE 'Parent-Branch Relationships Fixed:';
  RAISE NOTICE '  Parent organizations: %', total_parents;
  RAISE NOTICE '  Total branches linked: %', total_branches;

  IF orphaned_distributors > 0 THEN
    RAISE WARNING '  Orphaned distributor branches remaining: %', orphaned_distributors;
  ELSE
    RAISE NOTICE '  No orphaned distributor branches found ';
  END IF;
END $$;