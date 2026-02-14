-- ============================================================================
-- Migration: RLS Initplan Wrappers (Performance)
-- ============================================================================
-- Wraps bare auth.uid() calls with (SELECT auth.uid()) to enable PostgreSQL
-- initplan caching. Without the wrapper, auth.uid() may re-evaluate per row.
-- With (SELECT auth.uid()), the planner evaluates it once per query.
--
-- Change type: ALTER POLICY only -- no renames, no logic change.
-- Each ALTER POLICY ... USING/WITH CHECK replaces the ENTIRE clause,
-- so the full expression is reproduced with only auth.uid() wrapped.
--
-- Cross-reference: Policies dropped in Migration 000001 are excluded.
-- Row-correlated helpers (can_access_by_role) are out of scope.
-- ============================================================================

-- ============================================================================
-- 1. sales: update_sales
-- ============================================================================
-- Original USING:  is_admin() OR (user_id = auth.uid())
-- Original CHECK:  is_admin() OR (user_id = auth.uid())
-- ============================================================================

ALTER POLICY "update_sales" ON sales
  USING (is_admin() OR (user_id = (SELECT auth.uid())))
  WITH CHECK (is_admin() OR (user_id = (SELECT auth.uid())));

-- ============================================================================
-- 2. user_favorites: select_own
-- ============================================================================
-- Original USING: (deleted_at IS NULL) AND (user_id = auth.uid())
-- ============================================================================

ALTER POLICY "select_own" ON user_favorites
  USING ((deleted_at IS NULL) AND (user_id = (SELECT auth.uid())));

-- ============================================================================
-- 3. user_favorites: insert_own
-- ============================================================================
-- Original CHECK: (user_id = auth.uid())
-- ============================================================================

ALTER POLICY "insert_own" ON user_favorites
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 4. user_favorites: update_own
-- ============================================================================
-- Original USING: (user_id = auth.uid()) AND (deleted_at IS NULL)
-- Original CHECK: (user_id = auth.uid())
-- ============================================================================

ALTER POLICY "update_own" ON user_favorites
  USING ((user_id = (SELECT auth.uid())) AND (deleted_at IS NULL))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5. user_favorites: delete_own
-- ============================================================================
-- Original USING: (user_id = auth.uid())
-- ============================================================================

ALTER POLICY "delete_own" ON user_favorites
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 6. organization_distributors: authenticated_select_organization_distributors
-- ============================================================================
-- Original USING: (deleted_at IS NULL) AND (auth.uid() IS NOT NULL)
-- ============================================================================

ALTER POLICY "authenticated_select_organization_distributors" ON organization_distributors
  USING ((deleted_at IS NULL) AND ((SELECT auth.uid()) IS NOT NULL));

-- ============================================================================
-- 7. organization_distributors: authenticated_delete_organization_distributors
-- ============================================================================
-- Original USING: (auth.uid() IS NOT NULL)
-- ============================================================================

ALTER POLICY "authenticated_delete_organization_distributors" ON organization_distributors
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- 8. organization_distributors: authenticated_insert_organization_distributors
-- ============================================================================
-- Original CHECK: (auth.uid() IS NOT NULL)
-- ============================================================================

ALTER POLICY "authenticated_insert_organization_distributors" ON organization_distributors
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- 9. organization_distributors: authenticated_update_organization_distributors
-- ============================================================================
-- Original USING: (auth.uid() IS NOT NULL)
-- Original CHECK: (auth.uid() IS NOT NULL)
-- ============================================================================

ALTER POLICY "authenticated_update_organization_distributors" ON organization_distributors
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  bare_count INTEGER;
BEGIN
  -- Check no bare auth.uid() in target table policies
  -- Note: pg_policies.qual/with_check text representation includes
  -- the (SELECT ...) wrapper when present.
  SELECT COUNT(*) INTO bare_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('sales', 'user_favorites', 'organization_distributors')
    AND (
      (qual IS NOT NULL AND qual::text ~ 'auth\.uid\(\)' AND qual::text NOT LIKE '%SELECT auth.uid()%')
      OR (with_check IS NOT NULL AND with_check::text ~ 'auth\.uid\(\)' AND with_check::text NOT LIKE '%SELECT auth.uid()%')
    );

  IF bare_count = 0 THEN
    RAISE NOTICE 'Initplan wrapping verified: no bare auth.uid() in target table policies.';
  ELSE
    RAISE WARNING '% policy expression(s) still have bare auth.uid() calls.', bare_count;
  END IF;
END $$;
