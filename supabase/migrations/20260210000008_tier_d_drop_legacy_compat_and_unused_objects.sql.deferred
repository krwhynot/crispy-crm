-- ============================================================================
-- Migration: Tier D drop legacy compatibility and unused objects
-- ============================================================================
-- Preconditions (manual gate, owner-controlled):
--   1) 10-day no-use window satisfied
--   2) explicit owner signoff recorded
--   3) dependency checks completed
--
-- Safety model:
--   - Uses default RESTRICT behavior (no CASCADE) for views/tables
--   - Hard-blocks if target tables still contain rows
-- ============================================================================

-- ============================================================================
-- PRE-FLIGHT: Block destructive table drops when data still exists
-- ============================================================================
DO $$
DECLARE
  migration_history_rows BIGINT := 0;
  tutorial_progress_rows BIGINT := 0;
BEGIN
  IF to_regclass('public.migration_history') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.migration_history' INTO migration_history_rows;
  END IF;

  IF to_regclass('public.tutorial_progress') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.tutorial_progress' INTO tutorial_progress_rows;
  END IF;

  IF migration_history_rows > 0 THEN
    RAISE EXCEPTION
      'Tier D blocked: migration_history has % row(s). Stop and review business use before dropping.',
      migration_history_rows;
  END IF;

  IF tutorial_progress_rows > 0 THEN
    RAISE EXCEPTION
      'Tier D blocked: tutorial_progress has % row(s). Stop and review business use before dropping.',
      tutorial_progress_rows;
  END IF;

  -- Prevent dropping the "old" duplicate index if the retained index is missing.
  IF to_regclass('public.idx_product_distributor_auth_deleted_at') IS NOT NULL
     AND to_regclass('public.idx_product_distributor_authorizations_deleted_at') IS NULL THEN
    RAISE EXCEPTION
      'Tier D blocked: idx_product_distributor_authorizations_deleted_at is missing; refusing to drop idx_product_distributor_auth_deleted_at.';
  END IF;

  IF to_regclass('public.idx_opportunities_customer_org') IS NOT NULL
     AND to_regclass('public.idx_opportunities_customer_organization_id') IS NULL THEN
    RAISE EXCEPTION
      'Tier D blocked: idx_opportunities_customer_organization_id is missing; refusing to drop idx_opportunities_customer_org.';
  END IF;

  RAISE NOTICE
    'Tier D pre-flight passed: migration_history and tutorial_progress contain zero rows.';
END $$;

-- ============================================================================
-- STEP 1: Remove duplicate indexes (safe no-op when absent)
-- ============================================================================
-- Keep:
--   - idx_product_distributor_authorizations_deleted_at
--   - idx_opportunities_customer_organization_id
-- Drop:
--   - idx_product_distributor_auth_deleted_at
--   - idx_opportunities_customer_org
DROP INDEX IF EXISTS public.idx_product_distributor_auth_deleted_at;
DROP INDEX IF EXISTS public.idx_opportunities_customer_org;

-- ============================================================================
-- STEP 2: Drop deprecated compatibility views
-- ============================================================================
DROP VIEW IF EXISTS public.tasks_summary;
DROP VIEW IF EXISTS public.tasks_v;

-- ============================================================================
-- STEP 3: Drop unused tables
-- ============================================================================
DROP TABLE IF EXISTS public.migration_history;
DROP TABLE IF EXISTS public.tutorial_progress;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.tasks_summary') IS NOT NULL THEN
    RAISE EXCEPTION 'Verification failed: public.tasks_summary still exists.';
  END IF;

  IF to_regclass('public.tasks_v') IS NOT NULL THEN
    RAISE EXCEPTION 'Verification failed: public.tasks_v still exists.';
  END IF;

  IF to_regclass('public.migration_history') IS NOT NULL THEN
    RAISE EXCEPTION 'Verification failed: public.migration_history still exists.';
  END IF;

  IF to_regclass('public.tutorial_progress') IS NOT NULL THEN
    RAISE EXCEPTION 'Verification failed: public.tutorial_progress still exists.';
  END IF;

  RAISE NOTICE
    'Tier D cleanup verification passed: indexes dropped and target views/tables removed.';
END $$;
