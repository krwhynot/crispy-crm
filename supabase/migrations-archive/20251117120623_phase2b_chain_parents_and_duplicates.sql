-- Phase 2B: Chain Parents and Duplicate Consolidation
-- Based on Google Maps verification (2025-11-17)
--
-- Summary:
-- - Create 2 parent organizations (Dave & Buster's, Notre Dame Dining)
-- - Link 4 children to parents
-- - Update 2 official names from Google verification
-- - Mark 5 duplicates for manual consolidation
-- - Flag 4 organizations for research
--
-- Reference: /tmp/phase2b_analysis.md

-- ============================================================================
-- SECTION 1: Create Parent Organizations
-- ============================================================================

DO $$
DECLARE
  v_dave_busters_parent_id BIGINT;
  v_notre_dame_parent_id BIGINT;
BEGIN
  RAISE NOTICE '=== SECTION 1: Creating Parent Organizations ===';

  -- 1. Create "Dave & Buster's" parent (national chain)
  INSERT INTO organizations (
    name,
    organization_type,
    description,
    created_at,
    updated_at
  ) VALUES (
    'Dave & Buster''s',
    'customer',
    'National entertainment and restaurant chain - PARENT ORGANIZATION (created from Google Maps verification)',
    now(),
    now()
  ) RETURNING id INTO v_dave_busters_parent_id;

  RAISE NOTICE 'Created Dave & Buster''s parent: ID %', v_dave_busters_parent_id;

  -- Link children: IDs 287 (Rosemont), 288 (Schaumburg)
  UPDATE organizations
  SET parent_organization_id = v_dave_busters_parent_id,
      updated_at = now()
  WHERE id IN (287, 288);

  RAISE NOTICE '  -> Linked 2 children (IDs 287, 288)';

  -- 2. Create "University of Notre Dame - Campus Dining" parent
  INSERT INTO organizations (
    name,
    organization_type,
    description,
    created_at,
    updated_at
  ) VALUES (
    'University of Notre Dame - Campus Dining',
    'customer',
    'Campus dining services parent organization (created from Google Maps verification)',
    now(),
    now()
  ) RETURNING id INTO v_notre_dame_parent_id;

  RAISE NOTICE 'Created Notre Dame Dining parent: ID %', v_notre_dame_parent_id;

  -- Link child: ID 10206 (South Dining Hall)
  -- Note: ID 1338 is a duplicate of 10206 and will be consolidated separately
  UPDATE organizations
  SET parent_organization_id = v_notre_dame_parent_id,
      updated_at = now()
  WHERE id = 10206;

  RAISE NOTICE '  -> Linked 1 child (ID 10206)';

  RAISE NOTICE 'SECTION 1 COMPLETE: 2 parents created, 3 children linked';
END $$;

-- ============================================================================
-- SECTION 2: Update Official Names from Google Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SECTION 2: Updating Official Names ===';

  -- 1. Fix "Girl in the goat" -> "Girl & The Goat" (ID 441)
  UPDATE organizations
  SET name = 'Girl & The Goat',
      description = COALESCE(description, '') ||
        E'\n\n[Name corrected from "Girl in the goat" per Google Maps official name - 2025-11-17]',
      updated_at = now()
  WHERE id = 441;

  RAISE NOTICE 'Updated ID 441: "Girl in the goat" -> "Girl & The Goat"';

  -- 2. Fix "AL PEAKE & SONS INC." -> "Al Peake & Sons & Daughter Too Foodservice" (ID 20)
  UPDATE organizations
  SET name = 'Al Peake & Sons & Daughter Too Foodservice',
      description = COALESCE(description, '') ||
        E'\n\n[Name corrected from "AL PEAKE & SONS INC." per Google Maps official name - 2025-11-17]',
      updated_at = now()
  WHERE id = 20;

  RAISE NOTICE 'Updated ID 20: "AL PEAKE & SONS INC." -> "Al Peake & Sons & Daughter Too Foodservice"';

  RAISE NOTICE 'SECTION 2 COMPLETE: 2 names updated to official Google names';
END $$;

-- ============================================================================
-- SECTION 3: Mark Duplicates for Manual Consolidation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SECTION 3: Marking Duplicates for Consolidation ===';

  -- GROUP 1: 7 Monks Taproom duplicates
  -- Keep: ID 10005 "7 MONKS TAPROOM - GRAND RAPIDS" (customer)
  -- Merge: ID 5 "7 Monks Taproom Grand Rapids" (unknown)
  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\nWARNING: DUPLICATE DETECTED (Phase 2B - 2025-11-17)\n' ||
      'This is a duplicate of ID 10005 "7 MONKS TAPROOM - GRAND RAPIDS".\n' ||
      'Same location per Google Maps (740 Michigan St NE, Grand Rapids, MI).\n' ||
      'ACTION REQUIRED: Consolidate to ID 10005, migrate contacts/opportunities, then delete this record.',
      updated_at = now()
  WHERE id = 5;

  RAISE NOTICE 'Marked ID 5 as duplicate of ID 10005 (7 Monks Taproom)';

  -- GROUP 2: Notre Dame Dining duplicates
  -- Keep: ID 10206 "Notre Dame-110 South Dining Hall" (customer)
  -- Merge: ID 1338 "Notre Dame-110 South Dining Hall" (unknown)
  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\nWARNING: DUPLICATE DETECTED (Phase 2B - 2025-11-17)\n' ||
      'This is an exact duplicate of ID 10206 (same name).\n' ||
      'ACTION REQUIRED: Consolidate to ID 10206, migrate contacts/opportunities, then delete this record.',
      updated_at = now()
  WHERE id = 1338;

  RAISE NOTICE 'Marked ID 1338 as duplicate of ID 10206 (Notre Dame Dining)';

  -- GROUP 3: Al Peake & Sons duplicates
  -- Keep: ID 20 "Al Peake & Sons & Daughter Too Foodservice" (distributor)
  -- Merge: ID 1533 "Al Peake & Sons" (distributor)
  -- Merge: ID 21 "Al Peake amd Sons" (distributor) - NOTE: typo "amd" should be "and"
  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\nWARNING: DUPLICATE DETECTED (Phase 2B - 2025-11-17)\n' ||
      'This is a duplicate of ID 20 "Al Peake & Sons & Daughter Too Foodservice".\n' ||
      'Google Maps shows ONE business in Toledo, OH.\n' ||
      'ACTION REQUIRED: Consolidate to ID 20, migrate contacts/opportunities, then delete this record.',
      updated_at = now()
  WHERE id = 1533;

  RAISE NOTICE 'Marked ID 1533 as duplicate of ID 20 (Al Peake & Sons)';

  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\nWARNING: DUPLICATE DETECTED (Phase 2B - 2025-11-17)\n' ||
      'This is a duplicate of ID 20 "Al Peake & Sons & Daughter Too Foodservice".\n' ||
      'NOTE: Name has typo "amd" (should be "and").\n' ||
      'Google Maps shows ONE business in Toledo, OH.\n' ||
      'ACTION REQUIRED: Consolidate to ID 20, migrate contacts/opportunities, then delete this record.',
      updated_at = now()
  WHERE id = 21;

  RAISE NOTICE 'Marked ID 21 as duplicate of ID 20 (Al Peake & Sons - with typo)';

  RAISE NOTICE 'SECTION 3 COMPLETE: 4 duplicates marked (3 groups)';
END $$;

-- ============================================================================
-- SECTION 4: Flag Organizations for Research
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SECTION 4: Flagging Organizations for Research ===';

  -- Girl & The Goat variants (likely sister restaurants)
  -- ID 442: "Girl in the goat1" at 1340 W Fulton St -> possibly "Little Goat Diner"
  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\n[RESEARCH] RESEARCH NEEDED (Phase 2B - 2025-11-17)\n' ||
      'Address: 1340 W Fulton St (different from main Girl & The Goat at 809 W Randolph St)\n' ||
      'This may be "Little Goat Diner" (sister restaurant by chef Stephanie Izard).\n' ||
      'ACTION: Verify actual business name and update. May need parent "Stephanie Izard Restaurants".',
      updated_at = now()
  WHERE id = 442;

  RAISE NOTICE 'Flagged ID 442 for research (possibly Little Goat Diner)';

  -- ID 443: "Girl in the goat2" at 2429 N Lincoln Ave -> possibly "Duck Duck Goat"
  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\n[RESEARCH] RESEARCH NEEDED (Phase 2B - 2025-11-17)\n' ||
      'Address: 2429 N Lincoln Ave (different from main Girl & The Goat at 809 W Randolph St)\n' ||
      'This may be "Duck Duck Goat" (sister restaurant by chef Stephanie Izard).\n' ||
      'ACTION: Verify actual business name and update. May need parent "Stephanie Izard Restaurants".',
      updated_at = now()
  WHERE id = 443;

  RAISE NOTICE 'Flagged ID 443 for research (possibly Duck Duck Goat)';

  -- Portillo's entries (need address verification to determine if duplicate or separate locations)
  -- ID 855: "Portillo's" (customer)
  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\n[RESEARCH] ADDRESS VERIFICATION NEEDED (Phase 2B - 2025-11-17)\n' ||
      'Portillo''s is a major chain (60+ locations).\n' ||
      'ACTION: Verify if IDs 855 & 856 are duplicates or separate locations.\n' ||
      'If separate: create parent "Portillo''s" and link both.\n' ||
      'If duplicate: consolidate to one record.',
      updated_at = now()
  WHERE id = 855;

  RAISE NOTICE 'Flagged ID 855 for address verification (Portillo''s)';

  -- ID 856: "Portillo's Hot Dogs" (unknown)
  UPDATE organizations
  SET description = COALESCE(description, '') ||
      E'\n\n[RESEARCH] ADDRESS VERIFICATION NEEDED (Phase 2B - 2025-11-17)\n' ||
      'Portillo''s is a major chain (60+ locations).\n' ||
      'ACTION: Verify if IDs 855 & 856 are duplicates or separate locations.\n' ||
      'If separate: create parent "Portillo''s" and link both.\n' ||
      'If duplicate: consolidate to one record.',
      updated_at = now()
  WHERE id = 856;

  RAISE NOTICE 'Flagged ID 856 for address verification (Portillo''s Hot Dogs)';

  RAISE NOTICE 'SECTION 4 COMPLETE: 4 organizations flagged for research';
END $$;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

DO $$
DECLARE
  v_new_parents_count INT;
  v_children_linked_count INT;
  v_names_updated_count INT;
  v_duplicates_marked_count INT;
  v_research_flagged_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VALIDATION SUMMARY ===';

  -- Count new parents created
  SELECT COUNT(*)
  INTO v_new_parents_count
  FROM organizations
  WHERE name IN ('Dave & Buster''s', 'University of Notre Dame - Campus Dining')
    AND description LIKE '%PARENT ORGANIZATION%';

  RAISE NOTICE 'New parents created: % (expected: 2)', v_new_parents_count;

  -- Count children linked to new parents
  SELECT COUNT(*)
  INTO v_children_linked_count
  FROM organizations
  WHERE parent_organization_id IN (
    SELECT id FROM organizations
    WHERE name IN ('Dave & Buster''s', 'University of Notre Dame - Campus Dining')
  );

  RAISE NOTICE 'Children linked to new parents: % (expected: 3)', v_children_linked_count;

  -- Count names updated
  SELECT COUNT(*)
  INTO v_names_updated_count
  FROM organizations
  WHERE id IN (441, 20)
    AND description LIKE '%Name corrected from%';

  RAISE NOTICE 'Official names updated: % (expected: 2)', v_names_updated_count;

  -- Count duplicates marked
  SELECT COUNT(*)
  INTO v_duplicates_marked_count
  FROM organizations
  WHERE id IN (5, 1338, 1533, 21)
    AND description LIKE '%DUPLICATE DETECTED%';

  RAISE NOTICE 'Duplicates marked for consolidation: % (expected: 4)', v_duplicates_marked_count;

  -- Count research flags
  SELECT COUNT(*)
  INTO v_research_flagged_count
  FROM organizations
  WHERE id IN (442, 443, 855, 856)
    AND (description LIKE '%RESEARCH NEEDED%' OR description LIKE '%ADDRESS VERIFICATION NEEDED%');

  RAISE NOTICE 'Organizations flagged for research: % (expected: 4)', v_research_flagged_count;

  RAISE NOTICE '';
  RAISE NOTICE '=== PHASE 2B MIGRATION COMPLETE ===';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review marked duplicates and manually consolidate';
  RAISE NOTICE '  2. Research flagged organizations (Girl & The Goat variants, Portillo''s)';
  RAISE NOTICE '  3. Optional Phase 2C: Create "Stephanie Izard Restaurants" parent if IDs 442, 443 confirmed';
END $$;
