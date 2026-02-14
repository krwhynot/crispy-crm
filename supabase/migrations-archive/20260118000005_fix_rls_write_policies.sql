-- ============================================================================
-- Migration: Fix RLS Write Policies (Security Lockdown)
-- ============================================================================
-- Purpose: Restricts write operations (UPDATE/DELETE) to record owners or
--          privileged roles (managers/admins). Preserves "Team Read" (SELECT)
--          for collaboration.
--
-- Critical Security Gap Fixed:
-- Previously, any authenticated user could update/delete notes and tasks.
-- Now, only the record creator OR managers/admins can modify records.
--
-- Affected Tables:
--   - contact_notes: Owner-only UPDATE, privileged-only DELETE
--   - tasks: Self-assignment for INSERT, owner-only UPDATE
--   - opportunities: Dual ownership (opportunity_owner OR account_manager)
--
-- Dependencies:
--   - is_manager_or_admin() [EXISTS]
--   - current_sales_id() [EXISTS - will be hardened]
--
-- Engineering Constitution: Fail-fast, explicit security, no silent failures
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. HELPER FUNCTIONS
-- ============================================================================

-- 1.1 Harden current_sales_id() - Null-safe version
-- Returns NULL if user is not authenticated, preventing silent policy bypass
CREATE OR REPLACE FUNCTION current_sales_id()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Fail-fast: Return NULL if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return the sales.id for the current authenticated user
  RETURN (SELECT id FROM sales WHERE user_id = auth.uid());
END;
$$;

COMMENT ON FUNCTION current_sales_id() IS
  'Returns the sales.id for the current authenticated user. NULL-safe.';

-- 1.2 NEW: is_owner_or_privileged(owner_id) - Ownership check with privilege escalation
-- Returns TRUE if:
--   - owner_id matches current user's sales_id (record owner)
--   - OR current user is a manager/admin (privilege escalation)
CREATE OR REPLACE FUNCTION is_owner_or_privileged(owner_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Fail-fast: No owner_id means no ownership
  IF owner_id IS NULL THEN
    RETURN is_manager_or_admin(); -- Only privileged users can touch orphan records
  END IF;

  -- Check: Is current user the owner OR a privileged user?
  RETURN (owner_id = current_sales_id()) OR is_manager_or_admin();
END;
$$;

COMMENT ON FUNCTION is_owner_or_privileged(BIGINT) IS
  'Returns TRUE if owner_id matches current user OR user is manager/admin.';

-- ============================================================================
-- 2. CONTACT NOTES - Lockdown
-- ============================================================================
-- Current: Any authenticated user can UPDATE/DELETE
-- New: Only creator can UPDATE, only managers can DELETE

-- 2.1 Drop existing overly-permissive policies
DROP POLICY IF EXISTS "update_contact_notes" ON contact_notes;
DROP POLICY IF EXISTS "delete_contact_notes" ON contact_notes;

-- 2.2 UPDATE: Owner or privileged users only
-- Uses created_by as the ownership column (who created the note)
CREATE POLICY "update_contact_notes_owner_or_privileged"
ON contact_notes FOR UPDATE TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (is_owner_or_privileged(created_by));

COMMENT ON POLICY "update_contact_notes_owner_or_privileged" ON contact_notes IS
  'Only note creator or managers/admins can update. Soft-deleted notes are immutable.';

-- 2.3 DELETE: Privileged users only (managers/admins)
-- Soft delete is handled at app layer, but hard delete needs tight control
CREATE POLICY "delete_contact_notes_privileged_only"
ON contact_notes FOR DELETE TO authenticated
USING (is_manager_or_admin());

COMMENT ON POLICY "delete_contact_notes_privileged_only" ON contact_notes IS
  'Only managers/admins can hard-delete notes. Use soft delete (deleted_at) normally.';

-- ============================================================================
-- 3. TASKS - Lockdown
-- ============================================================================
-- Current: Any authenticated user can INSERT/UPDATE tasks for anyone
-- New: INSERT only for self or by managers, UPDATE by owner or privileged

-- 3.1 Drop existing overly-permissive policies
DROP POLICY IF EXISTS "update_tasks" ON tasks;
DROP POLICY IF EXISTS "insert_tasks" ON tasks;
DROP POLICY IF EXISTS "authenticated_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "authenticated_update_tasks" ON tasks;

-- 3.2 INSERT: Self-assignment or manager-assigned
-- Users can only create tasks for themselves, managers can assign to anyone
CREATE POLICY "insert_tasks_self_or_mgr"
ON tasks FOR INSERT TO authenticated
WITH CHECK (sales_id = current_sales_id() OR is_manager_or_admin());

COMMENT ON POLICY "insert_tasks_self_or_mgr" ON tasks IS
  'Users can create tasks for themselves. Managers can assign tasks to anyone.';

-- 3.3 UPDATE: Owner or privileged users only
-- Uses sales_id as ownership (the task assignee owns their tasks)
CREATE POLICY "update_tasks_owner_or_privileged"
ON tasks FOR UPDATE TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (is_owner_or_privileged(sales_id));

COMMENT ON POLICY "update_tasks_owner_or_privileged" ON tasks IS
  'Only task assignee or managers/admins can update. Soft-deleted tasks are immutable.';

-- ============================================================================
-- 4. OPPORTUNITIES - Dual Ownership Support
-- ============================================================================
-- Current: May allow updates by non-owners
-- New: Only opportunity_owner OR account_manager can update

-- 4.1 Drop existing policy
DROP POLICY IF EXISTS "update_opportunities" ON opportunities;
DROP POLICY IF EXISTS "authenticated_update_opportunities" ON opportunities;

-- 4.2 UPDATE: Dual ownership model
-- Both the opportunity owner AND account manager can update
-- This supports the MFB workflow where both roles collaborate on deals
CREATE POLICY "update_opportunities_dual_ownership"
ON opportunities FOR UPDATE TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (
  is_owner_or_privileged(opportunity_owner_id) OR
  is_owner_or_privileged(account_manager_id)
);

COMMENT ON POLICY "update_opportunities_dual_ownership" ON opportunities IS
  'Opportunity owner, account manager, or managers/admins can update. Supports MFB dual-ownership.';

-- ============================================================================
-- 5. VERIFICATION QUERIES (for manual testing)
-- ============================================================================
-- Run these after migration to verify policies are in place:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('contact_notes', 'tasks', 'opportunities')
-- ORDER BY tablename, cmd;

COMMIT;
