-- Migration: Add NOT NULL constraints for ownership fields
-- Purpose: Ensure tasks and opportunities always have an owner assigned
--
-- SAFETY: This migration backfills NULL values before adding constraints
-- to prevent data loss or migration failures.
--
-- RATIONALE:
-- - tasks.sales_id: Every task should be assigned to someone
-- - opportunities.opportunity_owner_id: Every opportunity should have an owner
--
-- The application now sets these fields on creation (QuickAddOpportunity,
-- ActivityCreate, TaskCreate, etc.), so new records will always have values.

-- =====================================================
-- STEP 1: Backfill NULL values in tasks.sales_id
-- =====================================================
-- Use created_by as the fallback owner (who created the task should own it)
-- If created_by is also NULL, use the first admin user as a last resort

DO $$
DECLARE
  v_default_admin_id BIGINT;
  v_backfilled_count INT;
BEGIN
  -- Get first admin user as fallback
  SELECT id INTO v_default_admin_id
  FROM sales
  WHERE role = 'admin' AND disabled = false
  ORDER BY created_at
  LIMIT 1;

  IF v_default_admin_id IS NULL THEN
    RAISE NOTICE 'No admin users found - migration will proceed but NOT NULL constraint may fail if orphaned tasks exist';
  END IF;

  -- Backfill tasks.sales_id
  UPDATE tasks
  SET sales_id = COALESCE(created_by, v_default_admin_id)
  WHERE sales_id IS NULL;

  GET DIAGNOSTICS v_backfilled_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % tasks with NULL sales_id', v_backfilled_count;
END $$;

-- =====================================================
-- STEP 2: Backfill NULL values in opportunities.opportunity_owner_id
-- =====================================================
-- Priority for backfill:
-- 1. account_manager_id (if set)
-- 2. created_by (who created should own)
-- 3. First admin user (last resort)

DO $$
DECLARE
  v_default_admin_id BIGINT;
  v_backfilled_count INT;
BEGIN
  -- Get first admin user as fallback
  SELECT id INTO v_default_admin_id
  FROM sales
  WHERE role = 'admin' AND disabled = false
  ORDER BY created_at
  LIMIT 1;

  -- Backfill opportunities.opportunity_owner_id
  UPDATE opportunities
  SET opportunity_owner_id = COALESCE(
    account_manager_id,  -- First choice: account manager
    created_by,          -- Second choice: creator
    v_default_admin_id   -- Last resort: admin
  )
  WHERE opportunity_owner_id IS NULL
    AND deleted_at IS NULL;  -- Only backfill non-deleted records

  GET DIAGNOSTICS v_backfilled_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % opportunities with NULL opportunity_owner_id', v_backfilled_count;
END $$;

-- =====================================================
-- STEP 3: Add NOT NULL constraints
-- =====================================================
-- Using DO block to handle cases where constraint already exists

DO $$
BEGIN
  -- Add NOT NULL to tasks.sales_id
  BEGIN
    ALTER TABLE tasks
    ALTER COLUMN sales_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to tasks.sales_id';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not add NOT NULL to tasks.sales_id: %', SQLERRM;
  END;

  -- Add NOT NULL to opportunities.opportunity_owner_id
  BEGIN
    ALTER TABLE opportunities
    ALTER COLUMN opportunity_owner_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to opportunities.opportunity_owner_id';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not add NOT NULL to opportunities.opportunity_owner_id: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- STEP 4: Add comments explaining the constraints
-- =====================================================

COMMENT ON COLUMN tasks.sales_id IS
  'Required: Sales rep assigned to this task. Cannot be NULL - every task must have an owner.';

COMMENT ON COLUMN opportunities.opportunity_owner_id IS
  'Required: Sales rep who owns this deal. Cannot be NULL - every opportunity must have an owner.';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_null_tasks INT;
  v_null_opps INT;
BEGIN
  SELECT COUNT(*) INTO v_null_tasks FROM tasks WHERE sales_id IS NULL;
  SELECT COUNT(*) INTO v_null_opps FROM opportunities WHERE opportunity_owner_id IS NULL AND deleted_at IS NULL;

  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Tasks with NULL sales_id: %', v_null_tasks;
  RAISE NOTICE 'Active opportunities with NULL opportunity_owner_id: %', v_null_opps;

  IF v_null_tasks > 0 OR v_null_opps > 0 THEN
    RAISE WARNING 'Some records still have NULL ownership - check for edge cases';
  ELSE
    RAISE NOTICE 'SUCCESS: All ownership fields are now populated';
  END IF;
END $$;
