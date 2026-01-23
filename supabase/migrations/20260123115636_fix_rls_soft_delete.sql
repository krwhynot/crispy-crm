-- ============================================================
-- DI-003: Append soft-delete filter to SELECT policies
-- ============================================================
-- Security Fix: RLS policies MUST enforce soft-delete at the database level.
-- Relying only on frontend filtering is a security vulnerability.
--
-- Tables affected (have deleted_at column but SELECT policies missing filter):
--   1. notifications - authenticated_select_own_notifications
--   2. organization_distributors - authenticated_select_organization_distributors
--   3. tasks_deprecated - deprecated_read_only
--   4. user_favorites - select_own
--   5. opportunity_contacts - "Users can view opportunity_contacts through opportunities"
--
-- NOT modified:
--   - Tables without deleted_at column (audit_trail, dashboard_snapshots, etc.)
--   - Policies that already have deleted_at IS NULL filter
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: NOTIFICATIONS
-- Table has: deleted_at (TIMESTAMPTZ)
-- Original: USING (user_id = auth.uid())
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_own_notifications" ON notifications;

CREATE POLICY "authenticated_select_own_notifications"
ON notifications FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL  -- Added: DI-003 soft-delete filter
    AND user_id = (SELECT auth.uid())
);

COMMENT ON POLICY "authenticated_select_own_notifications" ON notifications IS
    'SELECT requires user ownership AND soft-delete filter (DI-003)';

-- ============================================================
-- SECTION 2: ORGANIZATION_DISTRIBUTORS
-- Table has: deleted_at (TIMESTAMPTZ)
-- Original: USING (auth.uid() IS NOT NULL)
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_organization_distributors" ON organization_distributors;

CREATE POLICY "authenticated_select_organization_distributors"
ON organization_distributors FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL  -- Added: DI-003 soft-delete filter
    AND auth.uid() IS NOT NULL
);

COMMENT ON POLICY "authenticated_select_organization_distributors" ON organization_distributors IS
    'SELECT requires authentication AND soft-delete filter (DI-003)';

-- ============================================================
-- SECTION 3: TASKS_DEPRECATED
-- Table has: deleted_at (TIMESTAMPTZ)
-- Original: USING (true)
-- Note: Already had this fix in 20260122184338 but not applied to cloud
-- ============================================================

DROP POLICY IF EXISTS "deprecated_read_only" ON tasks_deprecated;
DROP POLICY IF EXISTS "tasks_deprecated_read_only" ON tasks_deprecated;

CREATE POLICY "tasks_deprecated_read_only"
ON tasks_deprecated FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL  -- Added: DI-003 soft-delete filter
);

COMMENT ON POLICY "tasks_deprecated_read_only" ON tasks_deprecated IS
    'Read-only access to deprecated tasks with soft-delete filter (DI-003)';

-- ============================================================
-- SECTION 4: USER_FAVORITES
-- Table has: deleted_at (TIMESTAMPTZ)
-- Original: USING (user_id = auth.uid())
-- ============================================================

DROP POLICY IF EXISTS "select_own" ON user_favorites;

CREATE POLICY "select_own"
ON user_favorites FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL  -- Added: DI-003 soft-delete filter
    AND user_id = auth.uid()
);

COMMENT ON POLICY "select_own" ON user_favorites IS
    'SELECT requires user ownership AND soft-delete filter (DI-003)';

-- ============================================================
-- SECTION 5: OPPORTUNITY_CONTACTS (complex ownership policy)
-- Table has: deleted_at (TIMESTAMPTZ)
-- Note: There are TWO policies - one already has soft-delete filter:
--   - authenticated_select_opportunity_contacts: USING (deleted_at IS NULL) - OK
--   - "Users can view opportunity_contacts through opportunities": MISSING filter
-- ============================================================

DROP POLICY IF EXISTS "Users can view opportunity_contacts through opportunities" ON opportunity_contacts;

CREATE POLICY "opportunity_contacts_select_through_opportunities"
ON opportunity_contacts FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL  -- Added: DI-003 soft-delete filter
    AND EXISTS (
        SELECT 1
        FROM opportunities o
        WHERE o.id = opportunity_contacts.opportunity_id
          AND o.deleted_at IS NULL  -- Also check parent isn't soft-deleted
          AND (
              EXISTS (
                  SELECT 1
                  FROM opportunity_participants op
                  JOIN sales s ON s.id = get_current_sales_id()
                  WHERE op.opportunity_id = o.id
              )
              OR o.created_by = get_current_sales_id()
              OR o.opportunity_owner_id = get_current_sales_id()
              OR o.account_manager_id = get_current_sales_id()
          )
    )
);

COMMENT ON POLICY "opportunity_contacts_select_through_opportunities" ON opportunity_contacts IS
    'SELECT via opportunity ownership with soft-delete filter (DI-003)';

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================
--
-- 1. Verify all SELECT policies on soft-delete tables have the filter:
--    SELECT tablename, policyname, qual::text as using_clause
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND cmd = 'SELECT'
--      AND tablename IN ('notifications', 'organization_distributors',
--                        'tasks_deprecated', 'user_favorites', 'opportunity_contacts')
--    ORDER BY tablename;
--    Expected: All should contain 'deleted_at IS NULL'
--
-- 2. Count policies missing soft-delete filter:
--    SELECT tablename, policyname
--    FROM pg_policies p
--    WHERE schemaname = 'public'
--      AND cmd = 'SELECT'
--      AND qual::text NOT LIKE '%deleted_at IS NULL%'
--      AND EXISTS (
--          SELECT 1 FROM information_schema.columns c
--          WHERE c.table_name = p.tablename
--            AND c.column_name = 'deleted_at'
--            AND c.table_schema = 'public'
--      );
--    Expected: 0 rows (all tables with deleted_at have filtered SELECT policies)
--
-- ============================================================
