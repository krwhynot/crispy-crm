-- Cleanup Duplicate RLS Policies
--
-- Problem: Previous migrations created policies with capitalized table names in the policy name
-- (e.g., authenticated_delete_contactNotes), while the new secure policies use lowercase
-- (e.g., authenticated_delete_contactnotes).
--
-- PostgreSQL evaluates multiple policies with OR logic - if ANY policy allows access,
-- the action is permitted. This means the old permissive policies are defeating
-- the new admin-only restrictions!
--
-- Fix: Drop all old permissive policies with capitalized names.

-- ============================================================================
-- CONTACT NOTES: Remove old permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_contactNotes" ON "contactNotes";
DROP POLICY IF EXISTS "authenticated_insert_contactNotes" ON "contactNotes";
DROP POLICY IF EXISTS "authenticated_update_contactNotes" ON "contactNotes";
DROP POLICY IF EXISTS "authenticated_delete_contactNotes" ON "contactNotes";

-- ============================================================================
-- OPPORTUNITY NOTES: Remove old permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_opportunityNotes" ON "opportunityNotes";
DROP POLICY IF EXISTS "authenticated_insert_opportunityNotes" ON "opportunityNotes";
DROP POLICY IF EXISTS "authenticated_update_opportunityNotes" ON "opportunityNotes";
DROP POLICY IF EXISTS "authenticated_delete_opportunityNotes" ON "opportunityNotes";

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After this migration, only the lowercase policy names should exist:
-- - authenticated_select_contactnotes (USING true - shared)
-- - authenticated_insert_contactnotes (WITH CHECK true - shared)
-- - authenticated_update_contactnotes (USING is_admin - admin-only)
-- - authenticated_delete_contactnotes (USING is_admin - admin-only)
