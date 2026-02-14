-- =====================================================
-- Migration: Allow DELETE for All Authenticated Roles
-- Date: 2026-01-02
-- Purpose: Enable bulk delete operations for all roles (admin, manager, rep)
--
-- CONTEXT:
-- Previously, DELETE was restricted to admin-only via RLS policies.
-- This prevented managers and reps from using bulk delete in the UI.
-- React Admin ties checkbox visibility to canDelete permission, so
-- this also enables bulk selection checkboxes for all users.
--
-- SECURITY MODEL:
-- - All authenticated users can DELETE contacts and organizations
-- - Soft delete pattern preserved (data provider sets deleted_at)
-- - RLS ensures only non-deleted records can be targeted
-- - Sales table remains admin-only (not affected by this migration)
-- =====================================================

-- =====================================================
-- CONTACTS: Allow all authenticated users to DELETE
-- =====================================================

-- Drop existing admin-only DELETE policies
DROP POLICY IF EXISTS authenticated_delete_contacts ON contacts;
DROP POLICY IF EXISTS delete_contacts ON contacts;

-- Create new permissive DELETE policy for all authenticated users
CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

COMMENT ON POLICY delete_contacts ON contacts IS
  'All authenticated users can delete contacts. Only non-deleted records can be targeted (prevents re-deleting).';

-- =====================================================
-- ORGANIZATIONS: Allow all authenticated users to DELETE
-- =====================================================

-- Drop existing admin-only DELETE policies
DROP POLICY IF EXISTS authenticated_delete_organizations ON organizations;
DROP POLICY IF EXISTS delete_organizations ON organizations;

-- Create new permissive DELETE policy for all authenticated users
CREATE POLICY delete_organizations ON organizations
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

COMMENT ON POLICY delete_organizations ON organizations IS
  'All authenticated users can delete organizations. Only non-deleted records can be targeted (prevents re-deleting).';
