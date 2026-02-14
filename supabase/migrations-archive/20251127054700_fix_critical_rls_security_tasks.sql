-- ============================================================================
-- CRITICAL SECURITY FIX: RLS Policy Restoration
-- ============================================================================
-- Issue: Migration 20251123190738_restore_activities_rls_policies.sql
--        accidentally restored permissive USING(true) policies for tasks,
--        overwriting the proper ownership-based policies from migrations:
--        - 20251117010529_add_missing_tasks_update_policy.sql
--        - 20251117011028_fix_tasks_select_policy.sql
--
-- Security Impact: Any authenticated user could SELECT, UPDATE, DELETE
--                  ANY task - not just their own tasks
--
-- This migration:
-- 1. Drops the insecure USING(true) policies on tasks
-- 2. Restores proper ownership-based RLS policies using sales_id
-- 3. Preserves manager/admin elevated access via is_manager_or_admin()
-- 4. Maintains INSERT restriction to own tasks only
-- 5. Adds created_by column to tasks for audit trail (matches other tables)
-- ============================================================================

-- ============================================================================
-- STEP 1: Add created_by column to tasks if it doesn't exist
-- ============================================================================
-- This aligns tasks with other tables (contacts, activities, opportunities)
-- that track who created each record for audit purposes

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tasks'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.tasks
        ADD COLUMN created_by BIGINT REFERENCES public.sales(id);

        COMMENT ON COLUMN public.tasks.created_by IS
            'Sales ID of the user who created this task. Added for audit trail consistency.';

        -- Backfill created_by from sales_id for existing records
        -- This is safe because historically tasks were created by their assignee
        UPDATE public.tasks
        SET created_by = sales_id
        WHERE created_by IS NULL AND sales_id IS NOT NULL;
    END IF;
END $$;

-- Create index on created_by for query performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by
ON public.tasks(created_by)
WHERE created_by IS NOT NULL;

-- ============================================================================
-- STEP 2: Drop ALL existing tasks RLS policies
-- ============================================================================
-- Clean slate approach to avoid duplicate/conflicting policies
-- Policy names that may exist from various migrations:

DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;
DROP POLICY IF EXISTS authenticated_insert_tasks ON tasks;
DROP POLICY IF EXISTS authenticated_update_tasks ON tasks;
DROP POLICY IF EXISTS authenticated_delete_tasks ON tasks;
DROP POLICY IF EXISTS select_tasks ON tasks;
DROP POLICY IF EXISTS insert_tasks ON tasks;
DROP POLICY IF EXISTS update_tasks ON tasks;
DROP POLICY IF EXISTS delete_tasks ON tasks;

-- ============================================================================
-- STEP 3: Create proper ownership-based RLS policies
-- ============================================================================
-- Security model for tasks:
-- - SELECT: Users see their own tasks + managers/admins see all
-- - INSERT: Users can only create tasks assigned to themselves
-- - UPDATE: Users can update their own + managers/admins can update all
-- - DELETE: Only admins can delete tasks

-- SELECT Policy: Ownership-based with manager/admin elevation
CREATE POLICY tasks_select_policy ON tasks
    FOR SELECT
    TO authenticated
    USING (
        -- Managers and admins can see all tasks
        public.is_manager_or_admin()
        OR
        -- Regular users can see tasks assigned to them
        sales_id = public.current_sales_id()
        OR
        -- Or tasks they created (even if reassigned)
        created_by = public.current_sales_id()
    );

COMMENT ON POLICY tasks_select_policy ON tasks IS
    'Users see tasks assigned to them or created by them. Managers/admins see all.';

-- INSERT Policy: Users can only create tasks assigned to themselves
CREATE POLICY tasks_insert_policy ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Task must be assigned to the creator OR creator is manager/admin
        sales_id = public.current_sales_id()
        OR
        public.is_manager_or_admin()
    );

COMMENT ON POLICY tasks_insert_policy ON tasks IS
    'Users create tasks assigned to themselves. Managers/admins can assign to others.';

-- UPDATE Policy: Ownership-based with manager/admin elevation
CREATE POLICY tasks_update_policy ON tasks
    FOR UPDATE
    TO authenticated
    USING (
        -- Managers/admins can update any task
        public.is_manager_or_admin()
        OR
        -- Users can update tasks assigned to them
        sales_id = public.current_sales_id()
    )
    WITH CHECK (
        -- Prevent users from reassigning to others (unless manager/admin)
        public.is_manager_or_admin()
        OR
        sales_id = public.current_sales_id()
    );

COMMENT ON POLICY tasks_update_policy ON tasks IS
    'Users update their assigned tasks. Managers/admins update any task.';

-- DELETE Policy: Admin-only for data protection
CREATE POLICY tasks_delete_policy ON tasks
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
    );

COMMENT ON POLICY tasks_delete_policy ON tasks IS
    'Only admins can delete tasks. Use soft-delete patterns in application code.';

-- ============================================================================
-- STEP 4: Trigger to auto-populate created_by on INSERT
-- ============================================================================
-- Ensures created_by is set automatically when tasks are created

CREATE OR REPLACE FUNCTION public.set_task_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only set created_by if not already provided
    IF NEW.created_by IS NULL THEN
        NEW.created_by := public.current_sales_id();
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_task_created_by() IS
    'Auto-populates created_by with current user sales_id on task creation';

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS trigger_set_task_created_by ON tasks;

-- Create trigger for auto-populating created_by
CREATE TRIGGER trigger_set_task_created_by
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_task_created_by();

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================
-- Run these to verify the policies were created correctly:
--
-- -- Check policies exist
-- SELECT policyname, cmd, permissive, qual
-- FROM pg_policies
-- WHERE tablename = 'tasks'
-- ORDER BY cmd;
--
-- -- Expected output:
-- -- tasks_delete_policy | DELETE | PERMISSIVE | is_admin()
-- -- tasks_insert_policy | INSERT | PERMISSIVE | (sales_id = current_sales_id() OR is_manager_or_admin())
-- -- tasks_select_policy | SELECT | PERMISSIVE | (is_manager_or_admin() OR sales_id = current_sales_id() OR created_by = current_sales_id())
-- -- tasks_update_policy | UPDATE | PERMISSIVE | (is_manager_or_admin() OR sales_id = current_sales_id())
--
-- -- Test as regular user (should only see own tasks)
-- SET ROLE authenticated;
-- SELECT * FROM tasks; -- Should filter based on RLS
-- RESET ROLE;
-- ============================================================================
