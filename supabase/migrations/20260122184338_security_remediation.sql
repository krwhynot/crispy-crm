-- ============================================================
-- SECURITY REMEDIATION: Critical + High Priority Fixes
-- Audit Reference: docs/audits/database-security-audit-2026-01-22.md
-- Generated: 2026-01-22
-- ============================================================

-- ============================================================
-- PHASE 1: CRITICAL - RLS + Policy Restrictions
-- ============================================================

-- 1.1 Enable RLS on task_id_mapping (SEC-001)
-- Rollback: ALTER TABLE task_id_mapping DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_id_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_id_mapping_authenticated_select"
ON task_id_mapping FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "task_id_mapping_service_role_all"
ON task_id_mapping FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 1.2 Fix audit_trail policy - admin only (was USING(true))
-- Rollback: DROP POLICY audit_trail_admin_select; CREATE POLICY authenticated_select_audit_trail...
DROP POLICY IF EXISTS authenticated_select_audit_trail ON audit_trail;

CREATE POLICY "audit_trail_admin_select"
ON audit_trail FOR SELECT
TO authenticated
USING (is_admin());

-- 1.3 Fix products update policy - add ownership check
-- Rollback: DROP POLICY update_products_owned; CREATE POLICY update_products... USING(true)
DROP POLICY IF EXISTS update_products ON products;

CREATE POLICY "update_products_owned"
ON products FOR UPDATE
TO authenticated
USING (is_admin() OR created_by = current_sales_id())
WITH CHECK (is_admin() OR created_by = current_sales_id());

-- 1.4 Fix tags DELETE policy - add ownership check
-- Rollback: DROP POLICY delete_tags_owned; CREATE POLICY authenticated_delete_tags... USING(true)
DROP POLICY IF EXISTS authenticated_delete_tags ON tags;

CREATE POLICY "delete_tags_owned"
ON tags FOR DELETE
TO authenticated
USING (is_admin() OR created_by = current_sales_id());

-- 1.5 Fix tags UPDATE policy - add ownership check
-- Rollback: DROP POLICY update_tags_owned; CREATE POLICY authenticated_update_tags... USING(true)
DROP POLICY IF EXISTS authenticated_update_tags ON tags;

CREATE POLICY "update_tags_owned"
ON tags FOR UPDATE
TO authenticated
USING (is_admin() OR created_by = current_sales_id())
WITH CHECK (true);

-- ============================================================
-- PHASE 2: HIGH - Missing updated_at Triggers (11 tables)
-- ============================================================

-- Ensure trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = COALESCE(NEW.updated_at, NOW());
    IF NEW.updated_at = OLD.updated_at THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2.1 activities
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.2 contacts
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.3 opportunities
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.4 opportunity_participants
DROP TRIGGER IF EXISTS update_opportunity_participants_updated_at ON opportunity_participants;
CREATE TRIGGER update_opportunity_participants_updated_at
    BEFORE UPDATE ON opportunity_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.5 organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.6 product_distributors
DROP TRIGGER IF EXISTS update_product_distributors_updated_at ON product_distributors;
CREATE TRIGGER update_product_distributors_updated_at
    BEFORE UPDATE ON product_distributors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.7 products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.8 sales
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.9 tags
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.10 tasks_deprecated
DROP TRIGGER IF EXISTS update_tasks_deprecated_updated_at ON tasks_deprecated;
CREATE TRIGGER update_tasks_deprecated_updated_at
    BEFORE UPDATE ON tasks_deprecated
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.11 tutorial_progress
DROP TRIGGER IF EXISTS update_tutorial_progress_updated_at ON tutorial_progress;
CREATE TRIGGER update_tutorial_progress_updated_at
    BEFORE UPDATE ON tutorial_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PHASE 3: HIGH - Missing deleted_at Column
-- ============================================================

-- 3.1 Add deleted_at to tutorial_progress
-- Rollback: ALTER TABLE tutorial_progress DROP COLUMN deleted_at;
ALTER TABLE tutorial_progress
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================
-- PHASE 4: HIGH - Missing Soft Delete Filters
-- ============================================================

-- 4.1 Fix organization_distributors SELECT policy
-- Rollback: Restore original policy without deleted_at check
DROP POLICY IF EXISTS authenticated_select_organization_distributors ON organization_distributors;

CREATE POLICY "select_organization_distributors_visible"
ON organization_distributors FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL
    AND (
        is_admin()
        OR distributor_id IN (
            SELECT id FROM organizations
            WHERE deleted_at IS NULL
        )
    )
);

-- 4.2 Consolidate tasks_deprecated policies (has duplicates)
-- Keep read-only access but filter deleted
DROP POLICY IF EXISTS deprecated_read_only ON tasks_deprecated;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks_deprecated;

CREATE POLICY "tasks_deprecated_read_only"
ON tasks_deprecated FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- ============================================================
-- VERIFICATION COMMENTS
-- ============================================================
-- After applying, run these checks:
--
-- 1. RLS enabled on all tables:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public' AND rowsecurity = false;
--    Expected: 0 rows
--
-- 2. No USING(true) on sensitive tables:
--    SELECT tablename, policyname, qual FROM pg_policies
--    WHERE qual = 'true' AND tablename IN ('audit_trail', 'products', 'tags');
--    Expected: 0 rows
--
-- 3. All 11 tables have updated_at trigger:
--    SELECT event_object_table FROM information_schema.triggers
--    WHERE trigger_name LIKE 'update_%_updated_at';
--    Expected: 11 rows
