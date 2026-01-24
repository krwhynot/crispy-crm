-- Migration: Backfill NULL opportunity_owner_id Before Remote Schema
-- Purpose: Ensure all opportunities have an owner before remote_schema.sql
--          applies the NOT NULL constraint
-- Date: 2026-01-23
-- Runs: Immediately before 20260123051958_remote_schema.sql
--
-- CONTEXT:
-- - Migration 20251202045956 already backfilled these values
-- - However, subsequent data-seeding migrations may have created new NULL values
-- - remote_schema.sql (line 556) attempts to add NOT NULL constraint and fails
-- - This migration ensures a clean state immediately before that constraint

-- =====================================================
-- BACKFILL: opportunities.opportunity_owner_id
-- =====================================================
-- Priority for backfill:
-- 1. account_manager_id (if set - business owner)
-- 2. created_by (who created should own)
-- 3. First active admin user (last resort fallback)

DO $$
DECLARE
  v_default_admin_id BIGINT;
  v_backfilled_count INT;
BEGIN
  -- Get first active admin user as fallback
  SELECT id INTO v_default_admin_id
  FROM sales
  WHERE role = 'admin' AND disabled = false
  ORDER BY created_at
  LIMIT 1;

  IF v_default_admin_id IS NULL THEN
    RAISE WARNING 'No admin users found - using first available user';
    SELECT id INTO v_default_admin_id FROM sales ORDER BY created_at LIMIT 1;
  END IF;

  IF v_default_admin_id IS NULL THEN
    RAISE EXCEPTION 'No users exist in sales table - cannot backfill opportunity_owner_id';
  END IF;

  -- Backfill NULL opportunity_owner_id values
  UPDATE opportunities
  SET opportunity_owner_id = COALESCE(
    account_manager_id,  -- First choice: account manager
    created_by,          -- Second choice: creator
    v_default_admin_id   -- Last resort: admin
  )
  WHERE opportunity_owner_id IS NULL;

  GET DIAGNOSTICS v_backfilled_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % opportunities with NULL opportunity_owner_id', v_backfilled_count;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_null_count INT;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM opportunities
  WHERE opportunity_owner_id IS NULL;

  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Opportunities with NULL opportunity_owner_id: %', v_null_count;

  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Backfill failed - % opportunities still have NULL opportunity_owner_id', v_null_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All opportunities now have opportunity_owner_id set';
    RAISE NOTICE 'Ready for remote_schema.sql to apply NOT NULL constraint';
  END IF;
END $$;
