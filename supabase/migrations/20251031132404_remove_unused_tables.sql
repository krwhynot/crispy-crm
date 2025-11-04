-- ================================================================
-- REMOVE UNUSED DATABASE TABLES
-- ================================================================
-- Migration: 20251031132404_remove_unused_tables
-- Purpose: Remove database tables that have no UI and contain no data
-- Risk: Medium (tables can be recreated if needed via future migrations)
-- Rationale: Simplify schema, reduce cognitive load, clean up unused features
--
-- Tables being removed:
-- 1. product_pricing_models - Pricing feature removed 2025-10-29
-- 2. product_pricing_tiers - Pricing feature removed 2025-10-29
-- 3. contact_preferred_principals - No UI, junction table unused
-- 4. product_distributor_authorizations - No UI, product management unused
-- 5. product_category_hierarchy - No UI, category management unused
-- 6. product_features - No UI, feature management unused
--
-- Safety: This migration includes data verification checks
-- Rollback: Tables can be recreated with future migrations if needed
-- ================================================================

BEGIN;

-- ================================================================
-- SECTION 1: DATA VERIFICATION
-- ================================================================
-- Verify tables are empty before dropping
-- If any table contains data, migration will fail with helpful error

DO $$
DECLARE
  v_count INTEGER;
  v_table_exists BOOLEAN;
BEGIN
  -- Check product_pricing_models
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_pricing_models') INTO v_table_exists;
  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM product_pricing_models;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'SAFETY CHECK FAILED: product_pricing_models contains % rows. Review data before dropping table.', v_count;
    END IF;
  END IF;

  -- Check product_pricing_tiers
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_pricing_tiers') INTO v_table_exists;
  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM product_pricing_tiers;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'SAFETY CHECK FAILED: product_pricing_tiers contains % rows. Review data before dropping table.', v_count;
    END IF;
  END IF;

  -- Check contact_preferred_principals
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_preferred_principals') INTO v_table_exists;
  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM contact_preferred_principals;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'SAFETY CHECK FAILED: contact_preferred_principals contains % rows. Review data before dropping table.', v_count;
    END IF;
  END IF;

  -- Check product_distributor_authorizations
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_distributor_authorizations') INTO v_table_exists;
  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM product_distributor_authorizations;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'SAFETY CHECK FAILED: product_distributor_authorizations contains % rows. Review data before dropping table.', v_count;
    END IF;
  END IF;

  -- Check product_category_hierarchy
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_category_hierarchy') INTO v_table_exists;
  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM product_category_hierarchy;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'SAFETY CHECK FAILED: product_category_hierarchy contains % rows. Review data before dropping table.', v_count;
    END IF;
  END IF;

  -- Check product_features
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_features') INTO v_table_exists;
  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM product_features;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'SAFETY CHECK FAILED: product_features contains % rows. Review data before dropping table.', v_count;
    END IF;
  END IF;

  RAISE NOTICE 'SAFETY CHECK PASSED: All tables verified empty or non-existent.';
END $$;


-- ================================================================
-- SECTION 2: DROP TABLES
-- ================================================================
-- CASCADE ensures dependent objects are also removed
-- Order: Drop dependent tables first

-- Product pricing tables (no dependencies)
DROP TABLE IF EXISTS product_pricing_tiers CASCADE;
COMMENT ON SCHEMA public IS 'Removed product_pricing_tiers 2025-10-31: Pricing feature removed, table unused';

DROP TABLE IF EXISTS product_pricing_models CASCADE;
COMMENT ON SCHEMA public IS 'Removed product_pricing_models 2025-10-31: Pricing feature removed, table unused';

-- Product management tables
DROP TABLE IF EXISTS product_features CASCADE;
COMMENT ON SCHEMA public IS 'Removed product_features 2025-10-31: No UI, product feature management not implemented';

DROP TABLE IF EXISTS product_distributor_authorizations CASCADE;
COMMENT ON SCHEMA public IS 'Removed product_distributor_authorizations 2025-10-31: No UI, distribution management not implemented';

DROP TABLE IF EXISTS product_category_hierarchy CASCADE;
COMMENT ON SCHEMA public IS 'Removed product_category_hierarchy 2025-10-31: No UI, category hierarchy not implemented (using simple TEXT category)';

-- Contact junction table
DROP TABLE IF EXISTS contact_preferred_principals CASCADE;
COMMENT ON SCHEMA public IS 'Removed contact_preferred_principals 2025-10-31: No UI, vendor preference tracking not implemented';


-- ================================================================
-- SECTION 3: VERIFY DROPS
-- ================================================================
-- Confirm tables no longer exist

DO $$
BEGIN
  -- Verify product_pricing_tiers dropped
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_pricing_tiers'
  ) THEN
    RAISE EXCEPTION 'DROP VERIFICATION FAILED: product_pricing_tiers still exists';
  END IF;

  -- Verify product_pricing_models dropped
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_pricing_models'
  ) THEN
    RAISE EXCEPTION 'DROP VERIFICATION FAILED: product_pricing_models still exists';
  END IF;

  -- Verify contact_preferred_principals dropped
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_preferred_principals'
  ) THEN
    RAISE EXCEPTION 'DROP VERIFICATION FAILED: contact_preferred_principals still exists';
  END IF;

  -- Verify product_distributor_authorizations dropped
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_distributor_authorizations'
  ) THEN
    RAISE EXCEPTION 'DROP VERIFICATION FAILED: product_distributor_authorizations still exists';
  END IF;

  -- Verify product_category_hierarchy dropped
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_category_hierarchy'
  ) THEN
    RAISE EXCEPTION 'DROP VERIFICATION FAILED: product_category_hierarchy still exists';
  END IF;

  -- Verify product_features dropped
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_features'
  ) THEN
    RAISE EXCEPTION 'DROP VERIFICATION FAILED: product_features still exists';
  END IF;

  RAISE NOTICE 'DROP VERIFICATION PASSED: All tables successfully removed.';
END $$;


-- ================================================================
-- SECTION 4: SCHEMA METADATA UPDATE
-- ================================================================
-- Document cleanup in database metadata

COMMENT ON SCHEMA public IS '
Atomic CRM Schema
Last cleanup: 2025-10-31
Removed unused tables: product_pricing_*, contact_preferred_principals, product_*_* management tables
Current table count: 24 (down from 30)
Reason: No UI implementation, no data, simplify schema
All tables can be recreated via future migrations if features are implemented.
';


-- ================================================================
-- SECTION 5: TABLE COUNT REPORT
-- ================================================================
-- Show before/after table count

DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'CLEANUP COMPLETE';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Tables removed: 6';
  RAISE NOTICE '  - product_pricing_models';
  RAISE NOTICE '  - product_pricing_tiers';
  RAISE NOTICE '  - contact_preferred_principals';
  RAISE NOTICE '  - product_distributor_authorizations';
  RAISE NOTICE '  - product_category_hierarchy';
  RAISE NOTICE '  - product_features';
  RAISE NOTICE '';
  RAISE NOTICE 'Current table count: %', v_table_count;
  RAISE NOTICE 'Expected: 24 base tables (down from 30)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Regenerate TypeScript types: npx supabase gen types typescript --local';
  RAISE NOTICE '2. Verify no TypeScript errors: npm run type-check';
  RAISE NOTICE '3. Test application: npm run dev';
  RAISE NOTICE '================================================================';
END $$;

COMMIT;

-- ================================================================
-- ROLLBACK GUIDE (if needed)
-- ================================================================
-- If tables need to be recreated, use a new migration with:
--
-- CREATE TABLE product_pricing_models (...);
-- CREATE TABLE product_pricing_tiers (...);
-- etc.
--
-- Table definitions can be found in git history:
-- git log --all --full-history -- "*product_pricing_models*"
-- ================================================================
