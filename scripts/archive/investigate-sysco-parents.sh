#!/bin/bash
# Investigation script for Sysco parent organization issue

echo "========================================"
echo "SYSCO PARENT INVESTIGATION"
echo "========================================"
echo ""

echo "Step 1: Checking for Phase 1 parent organizations..."
echo "Expected parents: US Foods, Sysco, Gordon FS, PFG, PFS, Trinity Health"
echo ""

npx supabase db execute --linked <<'SQL'
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
ORDER BY name;
SQL

echo ""
echo "Step 2: Checking Sysco branch organizations..."
echo ""

npx supabase db execute --linked <<'SQL'
SELECT
  id,
  name,
  organization_type,
  parent_organization_id,
  CASE
    WHEN parent_organization_id IS NULL THEN 'NO PARENT'
    ELSE (SELECT name FROM organizations p WHERE p.id = parent_organization_id)
  END as parent_name
FROM organizations
WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
AND name != 'Sysco Corporation'
ORDER BY name
LIMIT 15;
SQL

echo ""
echo "Step 3: Analysis Summary..."
echo ""

npx supabase db execute --linked <<'SQL'
DO $$
DECLARE
  v_sysco_parent_count INT;
  v_sysco_branches_count INT;
  v_sysco_linked_count INT;
BEGIN
  -- Count Sysco Corporation parent
  SELECT COUNT(*) INTO v_sysco_parent_count
  FROM organizations
  WHERE name = 'Sysco Corporation';

  -- Count Sysco branches
  SELECT COUNT(*) INTO v_sysco_branches_count
  FROM organizations
  WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
  AND name != 'Sysco Corporation';

  -- Count branches with parent set
  SELECT COUNT(*) INTO v_sysco_linked_count
  FROM organizations
  WHERE (name ILIKE 'Sysco%' OR name ILIKE 'SYSCO%')
  AND name != 'Sysco Corporation'
  AND parent_organization_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sysco Corporation parent exists: %', CASE WHEN v_sysco_parent_count > 0 THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE 'Total Sysco branches: %', v_sysco_branches_count;
  RAISE NOTICE 'Branches with parent set: %', v_sysco_linked_count;
  RAISE NOTICE '';

  IF v_sysco_parent_count = 0 THEN
    RAISE NOTICE '❌ ROOT CAUSE: Sysco Corporation parent was NOT created';
    RAISE NOTICE '   Migration 20251117112343 likely failed or was not applied to cloud';
  ELSIF v_sysco_linked_count = 0 THEN
    RAISE NOTICE '⚠️  ISSUE: Parent exists but no branches are linked';
    RAISE NOTICE '   The UPDATE statement in migration failed to link branches';
  ELSE
    RAISE NOTICE '✅ Parent structure appears correct';
  END IF;

  RAISE NOTICE '========================================';
END $$;
SQL

echo ""
echo "Investigation complete!"
