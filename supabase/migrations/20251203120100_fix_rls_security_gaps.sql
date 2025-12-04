-- Migration: Verify RLS security and performance index coverage
-- Reference: Code Review - Database Security Audit (2025-12-03)
--
-- FINDINGS FROM AUDIT:
-- 1. audit_trail: RLS enabled + SELECT policy exists. INSERT grant was REVOKED in migration 20251129230248.
--    Status: SECURE (no changes needed)
-- 2. sales.user_id: Index idx_sales_user_id exists from migration 20251130042855.
--    Status: OPTIMIZED (no changes needed)
-- 3. opportunity_contacts.created_by: Column does not exist in schema.
--    Status: N/A (no index needed)
--
-- CONCLUSION:
-- All reported security gaps have already been addressed in previous migrations.
-- This migration serves as verification only.

-- =====================================================
-- NO CHANGES NEEDED - VERIFICATION ONLY
-- =====================================================

-- =====================================================
-- VERIFICATION BLOCK
-- =====================================================

DO $$
DECLARE
  v_audit_policy_count INT;
  v_audit_grant_insert BOOLEAN;
  v_sales_index_exists BOOLEAN;
  v_opp_contacts_has_created_by BOOLEAN;
BEGIN
  -- Check 1: Verify audit_trail has SELECT policy
  SELECT COUNT(*) INTO v_audit_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'audit_trail'
    AND policyname = 'authenticated_select_audit_trail';

  -- Check 2: Verify INSERT grant was revoked from audit_trail
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name = 'audit_trail'
      AND privilege_type = 'INSERT'
      AND grantee = 'authenticated'
  ) INTO v_audit_grant_insert;

  -- Check 3: Verify sales.user_id index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'sales'
      AND indexname = 'idx_sales_user_id'
  ) INTO v_sales_index_exists;

  -- Check 4: Verify opportunity_contacts does NOT have created_by column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'opportunity_contacts'
      AND column_name = 'created_by'
  ) INTO v_opp_contacts_has_created_by;

  -- Report findings
  RAISE NOTICE '=== SECURITY & PERFORMANCE VERIFICATION ===';
  RAISE NOTICE '';
  RAISE NOTICE '1. audit_trail RLS:';
  RAISE NOTICE '   - SELECT policy exists: %', (v_audit_policy_count = 1);
  RAISE NOTICE '   - INSERT grant revoked: %', (NOT v_audit_grant_insert);
  RAISE NOTICE '   - Status: %', CASE
    WHEN v_audit_policy_count = 1 AND NOT v_audit_grant_insert
    THEN 'SECURE ✓'
    ELSE 'INSECURE ✗'
  END;
  RAISE NOTICE '';
  RAISE NOTICE '2. sales.user_id index:';
  RAISE NOTICE '   - idx_sales_user_id exists: %', v_sales_index_exists;
  RAISE NOTICE '   - Status: %', CASE
    WHEN v_sales_index_exists THEN 'OPTIMIZED ✓'
    ELSE 'MISSING ✗'
  END;
  RAISE NOTICE '';
  RAISE NOTICE '3. opportunity_contacts.created_by:';
  RAISE NOTICE '   - Column exists: %', v_opp_contacts_has_created_by;
  RAISE NOTICE '   - Status: %', CASE
    WHEN NOT v_opp_contacts_has_created_by THEN 'N/A (column does not exist) ✓'
    ELSE 'EXISTS (unexpected)'
  END;
  RAISE NOTICE '';
  RAISE NOTICE '=== OVERALL STATUS ===';

  IF v_audit_policy_count = 1 AND NOT v_audit_grant_insert AND v_sales_index_exists AND NOT v_opp_contacts_has_created_by THEN
    RAISE NOTICE 'SUCCESS: All security and performance checks passed ✓';
  ELSE
    RAISE WARNING 'FAILED: One or more checks failed - review output above';
  END IF;
END $$;
