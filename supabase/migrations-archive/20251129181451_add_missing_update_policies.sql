-- ============================================================================
-- Migration: Add Missing UPDATE Policies (Security Fix)
-- ============================================================================
--
-- SECURITY ISSUE: contacts and organizations tables are missing UPDATE policies.
-- Without UPDATE policies, PostgreSQL RLS defaults to DENY ALL updates.
-- This causes the application to fail when users try to edit these records.
--
-- ARCHITECTURE: Single Company with Shared Team Access
-- This CRM uses a shared team model where all authenticated users collaborate
-- on the same customer base. All team members can view and edit contacts and
-- organizations - they are shared resources.
--
-- POLICY PATTERN:
-- - USING (deleted_at IS NULL): Users can only update non-deleted records
-- - WITH CHECK (true): No restrictions on what values can be written
--
-- This matches the existing INSERT policy pattern (WITH CHECK true) while
-- adding soft-delete protection consistent with SELECT policies.
--
-- IDEMPOTENCY: Using DROP POLICY IF EXISTS ensures safe re-runs.
-- ============================================================================

-- ============================================================================
-- SECTION 1: Add UPDATE policy for contacts
-- ============================================================================
-- Contacts are shared resources in the team model.
-- All authenticated users can update any non-deleted contact.

DROP POLICY IF EXISTS "update_contacts" ON contacts;
CREATE POLICY "update_contacts"
ON contacts
FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);

COMMENT ON POLICY "update_contacts" ON contacts IS
'Shared team model: All authenticated users can update non-deleted contacts';

-- ============================================================================
-- SECTION 2: Add UPDATE policy for organizations
-- ============================================================================
-- Organizations are shared resources in the team model.
-- All authenticated users can update any non-deleted organization.

DROP POLICY IF EXISTS "update_organizations" ON organizations;
CREATE POLICY "update_organizations"
ON organizations
FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);

COMMENT ON POLICY "update_organizations" ON organizations IS
'Shared team model: All authenticated users can update non-deleted organizations';

-- ============================================================================
-- VERIFICATION QUERIES (Run manually to confirm fix)
-- ============================================================================
--
-- Check UPDATE policies now exist for both tables:
--   SELECT tablename, policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   AND tablename IN ('contacts', 'organizations')
--   AND cmd = 'UPDATE';
--   Expected: 2 rows (one per table)
--
-- ============================================================================

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- Added 2 UPDATE RLS policies:
--   - contacts: update_contacts (shared team model, soft-delete protected)
--   - organizations: update_organizations (shared team model, soft-delete protected)
--
-- Both policies:
--   - Allow all authenticated users to update records
--   - Filter out soft-deleted records (deleted_at IS NULL)
--   - No restrictions on write values (WITH CHECK true)
--
-- This completes the CRUD policy set for both tables:
--   SELECT: deleted_at IS NULL
--   INSERT: true
--   UPDATE: deleted_at IS NULL (NEW)
--   DELETE: is_admin() only
-- ============================================================================
