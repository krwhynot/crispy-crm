-- ============================================================================
-- RESTORE MISSING RLS POLICIES
-- ============================================================================
-- Migration 20251117032253_fix_referential_integrity.sql dropped these policies
-- to remove duplicates but never recreated them. This restores them.
-- ============================================================================

-- ============================================================================
-- ACTIVITIES: Shared Team Access (all team members see all activities)
-- ============================================================================

-- Note: These policies use WITH CHECK (true) to allow any authenticated user
-- to create/modify activities. Activities are team-shared resources in this CRM.

DROP POLICY IF EXISTS authenticated_select_activities ON activities;
CREATE POLICY authenticated_select_activities ON activities
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_activities ON activities;
CREATE POLICY authenticated_insert_activities ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_activities ON activities;
CREATE POLICY authenticated_update_activities ON activities
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_activities ON activities;
CREATE POLICY authenticated_delete_activities ON activities
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- TASKS: Shared Team Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_tasks ON tasks;
CREATE POLICY authenticated_insert_tasks ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_tasks ON tasks;
CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_tasks ON tasks;
CREATE POLICY authenticated_delete_tasks ON tasks
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- TAGS: Shared Team Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_tags ON tags;
CREATE POLICY authenticated_select_tags ON tags
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_tags ON tags;
CREATE POLICY authenticated_insert_tags ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_tags ON tags;
CREATE POLICY authenticated_update_tags ON tags
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_tags ON tags;
CREATE POLICY authenticated_delete_tags ON tags
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- INTERACTION_PARTICIPANTS: Shared Team Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_interaction_participants ON interaction_participants;
CREATE POLICY authenticated_select_interaction_participants ON interaction_participants
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_interaction_participants ON interaction_participants;
CREATE POLICY authenticated_insert_interaction_participants ON interaction_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_interaction_participants ON interaction_participants;
CREATE POLICY authenticated_update_interaction_participants ON interaction_participants
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_interaction_participants ON interaction_participants;
CREATE POLICY authenticated_delete_interaction_participants ON interaction_participants
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- OPPORTUNITY_PARTICIPANTS: Shared Team Access
-- ============================================================================

DROP POLICY IF EXISTS authenticated_select_opportunity_participants ON opportunity_participants;
CREATE POLICY authenticated_select_opportunity_participants ON opportunity_participants
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_insert_opportunity_participants ON opportunity_participants;
CREATE POLICY authenticated_insert_opportunity_participants ON opportunity_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_opportunity_participants ON opportunity_participants;
CREATE POLICY authenticated_update_opportunity_participants ON opportunity_participants
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS authenticated_delete_opportunity_participants ON opportunity_participants;
CREATE POLICY authenticated_delete_opportunity_participants ON opportunity_participants
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- VERIFICATION: Comment documenting policy restoration
-- ============================================================================

COMMENT ON POLICY authenticated_insert_activities ON activities IS
  'Restored by migration 20251123190738. Allows any authenticated user to create activities.';
