-- Migration: Fix Permissive RLS Policies
-- Date: 2025-11-16
-- Purpose: Drop permissive policies that override admin-only restrictions
-- Reference: tests/integration/RLS-TEST-FINDINGS.md

-- ============================================================================
-- REMOVE PERMISSIVE POLICIES
-- ============================================================================
-- These policies from migration 20251111121526 have USING (true) which allows
-- all authenticated users to update/delete, overriding the restrictive
-- admin-only policies from migration 20251108213039.

-- Drop permissive UPDATE policies for shared resources
DROP POLICY IF EXISTS update_contacts ON contacts;
DROP POLICY IF EXISTS update_organizations ON organizations;
DROP POLICY IF EXISTS update_opportunities ON opportunities;

-- Drop permissive SELECT policy for tasks (will replace with personal filter)
DROP POLICY IF EXISTS select_tasks ON tasks;
DROP POLICY IF EXISTS authenticated_select_tasks ON tasks;

-- ============================================================================
-- ENSURE ADMIN-ONLY POLICIES EXIST
-- ============================================================================
-- These restrictive policies should already exist from migration 20251108213039.
-- We recreate them here with IF NOT EXISTS for safety.

-- Contacts: Admin-only UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contacts'
    AND policyname = 'authenticated_update_contacts'
  ) THEN
    CREATE POLICY authenticated_update_contacts ON contacts
      FOR UPDATE TO authenticated
      USING (
        (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
      );
  END IF;
END $$;

-- Organizations: Admin-only UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organizations'
    AND policyname = 'authenticated_update_organizations'
  ) THEN
    CREATE POLICY authenticated_update_organizations ON organizations
      FOR UPDATE TO authenticated
      USING (
        (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
      );
  END IF;
END $$;

-- Opportunities: Admin-only UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'opportunities'
    AND policyname = 'authenticated_update_opportunities'
  ) THEN
    CREATE POLICY authenticated_update_opportunities ON opportunities
      FOR UPDATE TO authenticated
      USING (
        (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
      );
  END IF;
END $$;

-- ============================================================================
-- FIX TASKS PERSONAL FILTERING
-- ============================================================================
-- Tasks should only be visible to the user who created them
-- Per CLAUDE.md line 106: "users can only see tasks where created_by matches their record"

CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (created_by IN (SELECT id FROM sales WHERE user_id = auth.uid()));

-- ============================================================================
-- VERIFICATION NOTES
-- ============================================================================
-- After applying this migration, verify with:
--
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('contacts', 'organizations', 'opportunities', 'tasks')
-- ORDER BY tablename, cmd, policyname;
--
-- Expected results:
-- - contacts: Only authenticated_update_contacts with is_admin check
-- - organizations: Only authenticated_update_organizations with is_admin check
-- - opportunities: Only authenticated_update_opportunities with is_admin check
-- - tasks: authenticated_select_tasks with created_by personal filter
