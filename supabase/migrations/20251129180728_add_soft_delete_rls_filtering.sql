-- ============================================================================
-- Migration: Add Soft-Delete Filtering to RLS SELECT Policies (Security Fix)
-- ============================================================================
--
-- SECURITY ISSUE: 17 tables with soft-delete (deleted_at column) do not filter
-- deleted records in their SELECT RLS policies. This means authenticated users
-- can query soft-deleted records that should be hidden.
--
-- DEFENSE IN DEPTH: While application queries may filter deleted_at IS NULL,
-- RLS provides a database-level guarantee that deleted records are invisible.
--
-- EXCEPTION: organizationNotes already has deleted_at IS NULL in its policy.
--
-- PATTERN: DROP + CREATE to modify policies (PostgreSQL doesn't support ALTER
-- POLICY to change USING expression). Preserve existing conditions with AND.
--
-- IDEMPOTENCY: Using DROP POLICY IF EXISTS ensures safe re-runs.
-- ============================================================================

-- ============================================================================
-- SECTION 1: Simple Policies (USING true -> deleted_at IS NULL)
-- ============================================================================
-- These policies had USING (true), now become USING (deleted_at IS NULL)

-- 1. activities
DROP POLICY IF EXISTS "authenticated_select_activities" ON activities;
CREATE POLICY "authenticated_select_activities"
ON activities
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 2. contactNotes
DROP POLICY IF EXISTS "select_contactnotes" ON "contactNotes";
CREATE POLICY "select_contactnotes"
ON "contactNotes"
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 3. contacts
DROP POLICY IF EXISTS "select_contacts" ON contacts;
CREATE POLICY "select_contacts"
ON contacts
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 4. interaction_participants
DROP POLICY IF EXISTS "interaction_participants_select_policy" ON interaction_participants;
CREATE POLICY "interaction_participants_select_policy"
ON interaction_participants
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 5. opportunities
DROP POLICY IF EXISTS "select_opportunities" ON opportunities;
CREATE POLICY "select_opportunities"
ON opportunities
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 6. opportunityNotes
DROP POLICY IF EXISTS "select_opportunitynotes" ON "opportunityNotes";
CREATE POLICY "select_opportunitynotes"
ON "opportunityNotes"
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 7. opportunity_participants
DROP POLICY IF EXISTS "opportunity_participants_select_policy" ON opportunity_participants;
CREATE POLICY "opportunity_participants_select_policy"
ON opportunity_participants
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 8. organizations
DROP POLICY IF EXISTS "select_organizations" ON organizations;
CREATE POLICY "select_organizations"
ON organizations
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 9. products
DROP POLICY IF EXISTS "select_products" ON products;
CREATE POLICY "select_products"
ON products
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 10. sales
-- NOTE: Sales records represent team members. Soft-deleted sales means
-- the user was deactivated but their historical data should remain linked.
-- We still filter deleted sales from listing views.
DROP POLICY IF EXISTS "select_sales" ON sales;
CREATE POLICY "select_sales"
ON sales
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 11. segments
DROP POLICY IF EXISTS "Allow authenticated read access" ON segments;
CREATE POLICY "Allow authenticated read access"
ON segments
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 12. tags
DROP POLICY IF EXISTS "authenticated_select_tags" ON tags;
CREATE POLICY "authenticated_select_tags"
ON tags
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- ============================================================================
-- SECTION 2: Policies with auth.uid() IS NOT NULL check
-- ============================================================================
-- These policies checked auth.uid() IS NOT NULL, which is redundant when
-- policy is TO authenticated. We preserve auth.uid() check for clarity.

-- 13. distributor_principal_authorizations
DROP POLICY IF EXISTS "authenticated_select_distributor_principal_authorizations" ON distributor_principal_authorizations;
CREATE POLICY "authenticated_select_distributor_principal_authorizations"
ON distributor_principal_authorizations
FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

-- 14. product_distributor_authorizations
DROP POLICY IF EXISTS "authenticated_select_product_distributor_authorizations" ON product_distributor_authorizations;
CREATE POLICY "authenticated_select_product_distributor_authorizations"
ON product_distributor_authorizations
FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

-- ============================================================================
-- SECTION 3: Policies with user-specific filtering
-- ============================================================================
-- These policies already filter by user ownership. Add deleted_at check.

-- 15. notifications (user_id = auth.uid())
DROP POLICY IF EXISTS "authenticated_select_own_notifications" ON notifications;
CREATE POLICY "authenticated_select_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND user_id = auth.uid());

-- ============================================================================
-- SECTION 4: Policies with complex ownership logic
-- ============================================================================
-- These policies have complex EXISTS subqueries. Add deleted_at at start.

-- 16. tasks (role-based + ownership)
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
CREATE POLICY "tasks_select_policy"
ON tasks
FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL
    AND (
        is_manager_or_admin()
        OR sales_id = current_sales_id()
        OR created_by = current_sales_id()
    )
);

-- 17. opportunity_products (complex EXISTS with join)
DROP POLICY IF EXISTS "Users can view opportunity products in their company" ON opportunity_products;
CREATE POLICY "Users can view opportunity products in their company"
ON opportunity_products
FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL
    AND EXISTS (
        SELECT 1
        FROM opportunities o
        JOIN sales s ON s.id = o.opportunity_owner_id
        WHERE o.id = opportunity_products.opportunity_id
        AND s.user_id = auth.uid()
    )
);

-- ============================================================================
-- SECTION 5: Junction table without direct soft-delete filter
-- ============================================================================
-- opportunity_contacts doesn't have deleted_at, but we should consider
-- filtering based on parent opportunity's deleted_at status.
-- This is a design decision - for now, leave as-is since the junction
-- records should be cleaned up by cascade when opportunity is deleted.

-- ============================================================================
-- SKIP: organizationNotes already has deleted_at IS NULL in policy
-- ============================================================================
-- Current policy: USING ((deleted_at IS NULL) AND (auth.uid() IS NOT NULL))
-- No action needed.

-- ============================================================================
-- VERIFICATION QUERIES (Run manually to confirm fix)
-- ============================================================================
--
-- Check all SELECT policies now include deleted_at filtering:
--   SELECT tablename, policyname, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   AND cmd = 'SELECT'
--   AND qual NOT LIKE '%deleted_at IS NULL%'
--   AND tablename IN (
--       'activities', 'contactNotes', 'contacts', 'interaction_participants',
--       'opportunities', 'opportunityNotes', 'opportunity_participants',
--       'organizations', 'products', 'sales', 'segments', 'tags',
--       'distributor_principal_authorizations', 'product_distributor_authorizations',
--       'notifications', 'tasks', 'opportunity_products'
--   );
--   Expected: 0 rows (all should have deleted_at filtering now)
--
-- ============================================================================

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- Fixed 17 SELECT RLS policies to include deleted_at IS NULL filtering:
--
-- Section 1 (Simple true -> deleted_at IS NULL):
--   - activities
--   - contactNotes
--   - contacts
--   - interaction_participants
--   - opportunities
--   - opportunityNotes
--   - opportunity_participants
--   - organizations
--   - products
--   - sales
--   - segments
--   - tags
--
-- Section 2 (Added to auth.uid() check):
--   - distributor_principal_authorizations
--   - product_distributor_authorizations
--
-- Section 3 (Added to user filtering):
--   - notifications
--
-- Section 4 (Added to complex logic):
--   - tasks
--   - opportunity_products
--
-- Skipped (already has filtering):
--   - organizationNotes
--
-- ============================================================================
