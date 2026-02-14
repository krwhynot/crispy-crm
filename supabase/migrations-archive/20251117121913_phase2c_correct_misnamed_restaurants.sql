-- Phase 2C: Correct Misnamed Restaurants
-- Based on Google Maps verification (2025-11-17)
--
-- Summary:
-- - Correct 3 restaurant names from Google verification
-- - Mark 1 organization for deletion (no address, unverifiable)
--
-- Reference: Phase 2C research findings

-- ============================================================================
-- SECTION 1: Correct Restaurant Names from Google Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== SECTION 1: Correcting Misnamed Restaurants ===';

  -- 1. Fix ID 442: "Girl in the goat1" -> "Ever Restaurant"
  UPDATE organizations
  SET name = 'Ever Restaurant',
      address = '1340 W Fulton St, Chicago, IL 60607',
      description = COALESCE(description, '') ||
        E'\n\n[Name corrected from "Girl in the goat1" per Google Maps verification - 2025-11-17]\n' ||
        'Google Maps: Ever Restaurant (4.8 stars) at 1340 W Fulton St.\n' ||
        'NOT related to Girl & The Goat restaurant.',
      updated_at = now()
  WHERE id = 442;

  RAISE NOTICE 'Updated ID 442: "Girl in the goat1" -> "Ever Restaurant"';

  -- 2. Fix ID 443: "Girl in the goat2" -> "Galit"
  UPDATE organizations
  SET name = 'Galit',
      address = '2429 N Lincoln Ave, Chicago, IL 60614',
      description = COALESCE(description, '') ||
        E'\n\n[Name corrected from "Girl in the goat2" per Google Maps verification - 2025-11-17]\n' ||
        'Google Maps: Galit (4.5 stars, Mediterranean) at 2429 N Lincoln Ave.\n' ||
        'NOT related to Girl & The Goat restaurant.',
      updated_at = now()
  WHERE id = 443;

  RAISE NOTICE 'Updated ID 443: "Girl in the goat2" -> "Galit"';

  -- 3. Fix ID 855: "Portillo's" -> "Swift & Sons"
  UPDATE organizations
  SET name = 'Swift & Sons',
      address = '1000 W Fulton Market, Chicago, IL 60607',
      description = COALESCE(description, '') ||
        E'\n\n[Name corrected from "Portillo''s" per Google Maps verification - 2025-11-17]\n' ||
        'Google Maps: Swift & Sons (4.6 stars, steakhouse) at 1000 W Fulton Market.\n' ||
        'NOT Portillo''s restaurant.',
      updated_at = now()
  WHERE id = 855;

  RAISE NOTICE 'Updated ID 855: "Portillo''s" -> "Swift & Sons"';

  RAISE NOTICE 'SECTION 1 COMPLETE: 3 restaurant names corrected';
END $$;

-- ============================================================================
-- SECTION 2: Delete Unverifiable Entry
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SECTION 2: Deleting Unverifiable Entry ===';

  -- ID 856: "Portillo's Hot Dogs" has NO ADDRESS and cannot be verified
  -- No address = no way to associate contacts/opportunities = useless placeholder
  DELETE FROM organizations WHERE id = 856;

  RAISE NOTICE 'Deleted ID 856 (no address, unverifiable placeholder)';

  RAISE NOTICE 'SECTION 2 COMPLETE: 1 placeholder entry deleted';
END $$;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

DO $$
DECLARE
  v_names_corrected_count INT;
  v_deletion_marked_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VALIDATION SUMMARY ===';

  -- Count names corrected
  SELECT COUNT(*)
  INTO v_names_corrected_count
  FROM organizations
  WHERE id IN (442, 443, 855)
    AND (name IN ('Ever Restaurant', 'Galit', 'Swift & Sons'));

  RAISE NOTICE 'Restaurant names corrected: % (expected: 3)', v_names_corrected_count;

  -- Count deletions (should be 0 remaining)
  SELECT COUNT(*)
  INTO v_deletion_marked_count
  FROM organizations
  WHERE id = 856;

  RAISE NOTICE 'ID 856 still exists (expected: 0): %', v_deletion_marked_count;

  RAISE NOTICE '';
  RAISE NOTICE '=== PHASE 2C MIGRATION COMPLETE ===';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify corrected names in UI';
  RAISE NOTICE '  2. Review Phase 2C completion report for full findings';
END $$;
