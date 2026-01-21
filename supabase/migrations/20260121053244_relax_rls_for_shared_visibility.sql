-- Migration: Relax RLS Policies for Shared Visibility
-- Issue: Rep users see empty lists due to restrictive RLS policies
-- Solution: Everyone sees contacts/orgs/opportunities/activities, but reps only see their own tasks
--
-- Rollback: See comments below for original policy definitions

-- ============================================================
-- CONTACTS: Allow all authenticated users to see all contacts
-- ============================================================

-- Original policy (for rollback):
-- CREATE POLICY "contacts_select_role_based" ON contacts FOR SELECT USING (
--   (deleted_at IS NULL) AND (
--     private.is_admin_or_manager() OR
--     private.can_access_by_role(sales_id, created_by)
--   )
-- );

DROP POLICY IF EXISTS "contacts_select_role_based" ON contacts;

CREATE POLICY "contacts_select_all"
  ON contacts FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================
-- ORGANIZATIONS: Allow all authenticated users to see all orgs
-- ============================================================

-- Original policy (for rollback):
-- CREATE POLICY "organizations_select_role_based" ON organizations FOR SELECT USING (
--   (deleted_at IS NULL) AND (
--     private.is_admin_or_manager() OR
--     private.can_access_by_role(sales_id, created_by)
--   )
-- );

DROP POLICY IF EXISTS "organizations_select_role_based" ON organizations;

CREATE POLICY "organizations_select_all"
  ON organizations FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================
-- OPPORTUNITIES: Allow all authenticated users to see all opps
-- ============================================================

-- Original policy (for rollback):
-- CREATE POLICY "opportunities_select_role_based" ON opportunities FOR SELECT USING (
--   (deleted_at IS NULL) AND (
--     private.is_admin_or_manager() OR
--     private.can_access_by_role(opportunity_owner_id, created_by) OR
--     (account_manager_id IS NOT NULL AND private.can_access_by_role(account_manager_id, NULL))
--   )
-- );

DROP POLICY IF EXISTS "opportunities_select_role_based" ON opportunities;

CREATE POLICY "opportunities_select_all"
  ON opportunities FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- ============================================================
-- ACTIVITIES: Unified policy with task-specific visibility
-- - Non-task activities: everyone sees all
-- - Task activities: admin/manager sees all, reps see only their own
-- ============================================================

-- Original policies (for rollback):
-- CREATE POLICY "activities_select_all" ON activities FOR SELECT USING (deleted_at IS NULL);
-- CREATE POLICY "activities_select_role_based" ON activities FOR SELECT USING (
--   (deleted_at IS NULL) AND (
--     private.is_admin_or_manager() OR
--     private.can_access_by_role(NULL, created_by)
--   )
-- );

DROP POLICY IF EXISTS "activities_select_all" ON activities;
DROP POLICY IF EXISTS "activities_select_role_based" ON activities;

CREATE POLICY "activities_select_unified"
  ON activities FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Non-task activities: everyone sees all
      activity_type != 'task'
      -- Task activities: admin/manager sees all, rep sees own
      OR private.is_admin_or_manager()
      OR sales_id = current_sales_id()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "contacts_select_all" ON contacts IS
  'All authenticated users can view all non-deleted contacts (shared visibility)';
COMMENT ON POLICY "organizations_select_all" ON organizations IS
  'All authenticated users can view all non-deleted organizations (shared visibility)';
COMMENT ON POLICY "opportunities_select_all" ON opportunities IS
  'All authenticated users can view all non-deleted opportunities (shared visibility)';
COMMENT ON POLICY "activities_select_unified" ON activities IS
  'Non-task activities visible to all; tasks visible to owner or admin/manager';
