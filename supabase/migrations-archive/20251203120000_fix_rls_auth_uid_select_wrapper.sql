-- =====================================================
-- Migration: Fix RLS policies to use (SELECT auth.uid()) for performance
-- =====================================================
-- Impact: 94.97% query performance improvement
-- Source: backend-database-best-practices.md
--
-- Problem: Calling auth.uid() without SELECT wrapper causes function to be
--          evaluated for EVERY row during RLS policy evaluation
--
-- Solution: Wrap auth.uid() in SELECT to cache the result:
--          BAD:  auth.uid() = user_id
--          GOOD: (SELECT auth.uid()) = user_id
--
-- Pattern Applied:
--   - auth.uid() → (SELECT auth.uid())
--   - auth.uid() IS NOT NULL → (SELECT auth.uid()) IS NOT NULL
--   - user_id = auth.uid() → user_id = (SELECT auth.uid())
--
-- Note: Policies using helper functions like current_sales_id() are ALREADY
--       optimized internally and are NOT changed in this migration.
-- =====================================================

-- ============================================================================
-- SECTION 1: notifications table policies
-- ============================================================================
-- Table: notifications
-- Created in: 20251105001240_add_notifications_table.sql

-- SELECT policy: authenticated_select_own_notifications
DROP POLICY IF EXISTS "authenticated_select_own_notifications" ON notifications;
CREATE POLICY "authenticated_select_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- UPDATE policy: authenticated_update_own_notifications
DROP POLICY IF EXISTS "authenticated_update_own_notifications" ON notifications;
CREATE POLICY "authenticated_update_own_notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- SECTION 2: distributor_principal_authorizations policies
-- ============================================================================
-- Table: distributor_principal_authorizations
-- Created in: 20251129050428_add_distributor_principal_authorizations.sql
-- Updated in: 20251129180728_add_soft_delete_rls_filtering.sql

-- SELECT policy
DROP POLICY IF EXISTS "authenticated_select_distributor_principal_authorizations" ON distributor_principal_authorizations;
CREATE POLICY "authenticated_select_distributor_principal_authorizations"
ON distributor_principal_authorizations
FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND (SELECT auth.uid()) IS NOT NULL);

-- INSERT policy
DROP POLICY IF EXISTS "authenticated_insert_distributor_principal_authorizations" ON distributor_principal_authorizations;
CREATE POLICY "authenticated_insert_distributor_principal_authorizations"
ON distributor_principal_authorizations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- UPDATE policy
DROP POLICY IF EXISTS "authenticated_update_distributor_principal_authorizations" ON distributor_principal_authorizations;
CREATE POLICY "authenticated_update_distributor_principal_authorizations"
ON distributor_principal_authorizations
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL)
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- DELETE policy
DROP POLICY IF EXISTS "authenticated_delete_distributor_principal_authorizations" ON distributor_principal_authorizations;
CREATE POLICY "authenticated_delete_distributor_principal_authorizations"
ON distributor_principal_authorizations
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SECTION 3: product_distributor_authorizations policies
-- ============================================================================
-- Table: product_distributor_authorizations
-- Created in: 20251129051625_add_product_distributor_authorizations.sql
-- Updated in: 20251129180728_add_soft_delete_rls_filtering.sql

-- SELECT policy
DROP POLICY IF EXISTS "authenticated_select_product_distributor_authorizations" ON product_distributor_authorizations;
CREATE POLICY "authenticated_select_product_distributor_authorizations"
ON product_distributor_authorizations
FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND (SELECT auth.uid()) IS NOT NULL);

-- INSERT policy
DROP POLICY IF EXISTS "authenticated_insert_product_distributor_authorizations" ON product_distributor_authorizations;
CREATE POLICY "authenticated_insert_product_distributor_authorizations"
ON product_distributor_authorizations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- UPDATE policy
DROP POLICY IF EXISTS "authenticated_update_product_distributor_authorizations" ON product_distributor_authorizations;
CREATE POLICY "authenticated_update_product_distributor_authorizations"
ON product_distributor_authorizations
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL)
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- DELETE policy
DROP POLICY IF EXISTS "authenticated_delete_product_distributor_authorizations" ON product_distributor_authorizations;
CREATE POLICY "authenticated_delete_product_distributor_authorizations"
ON product_distributor_authorizations
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- SECTION 4: Policies using helper functions (ALREADY OPTIMIZED - INFORMATIONAL ONLY)
-- ============================================================================
-- The following tables use helper functions that internally wrap auth.uid()
-- in SELECT statements. These are ALREADY OPTIMIZED and NOT modified here:
--
-- Tables using current_sales_id():
--   - tasks (via tasks_select_policy)
--   - opportunity_products (via "Users can view opportunity products in their company")
--
-- Helper function reference (from 20251130010932_security_invoker_and_search_path_remediation.sql):
--   CREATE FUNCTION public.current_sales_id() RETURNS BIGINT
--   LANGUAGE sql STABLE SECURITY INVOKER
--   RETURN (SELECT id FROM public.sales WHERE user_id = auth.uid() LIMIT 1)
--
-- The SELECT wrapper is INSIDE the helper function, providing the same
-- performance benefit. No changes needed.

-- ============================================================================
-- SECTION 5: Policies already using SELECT wrapper (NO CHANGES)
-- ============================================================================
-- These policies were already correctly implemented:
--
-- From 20251018203500_update_rls_for_shared_team_access.sql:
--   - activities: USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))
--
-- From 20251116124147_fix_permissive_rls_policies.sql:
--   - organization_notes: USING (created_by IN (SELECT id FROM sales WHERE user_id = auth.uid()))
--
-- From 20251029051540_create_opportunity_products_table.sql:
--   - Multiple EXISTS subqueries already use: s.user_id = auth.uid() within subquery
--     (auth.uid() evaluated once per policy check, not per row)

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all auth.uid() calls now use SELECT wrapper:
--
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     qual LIKE '%auth.uid()%'
--     OR with_check LIKE '%auth.uid()%'
--   )
--   AND qual NOT LIKE '%SELECT auth.uid()%'
--   AND with_check NOT LIKE '%SELECT auth.uid()%'
-- ORDER BY tablename, cmd;
--
-- Expected result: 0 rows (all auth.uid() calls should be wrapped)

-- ============================================================================
-- PERFORMANCE IMPACT
-- ============================================================================
-- Based on backend-database-best-practices.md:
--
-- Before (unwrapped):
--   - auth.uid() called for EVERY row during RLS evaluation
--   - 10,000 rows = 10,000 auth.uid() function calls
--
-- After (SELECT wrapped):
--   - auth.uid() called ONCE per policy evaluation
--   - 10,000 rows = 1 auth.uid() function call
--   - 94.97% reduction in overhead
--
-- Tables affected (by row count priority):
--   1. distributor_principal_authorizations (shared team data)
--   2. product_distributor_authorizations (shared team data)
--   3. notifications (per-user data)
--
-- Expected impact: Immediate improvement on all SELECT, INSERT, UPDATE, DELETE
-- operations on these tables for authenticated users.
