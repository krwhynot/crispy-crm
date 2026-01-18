-- =====================================================================
-- Migration: Update RLS Policies for Role-Based Access
-- =====================================================================
-- Purpose: Replace permissive SELECT policies with role-based policies
-- that use the private schema helper functions.
--
-- Security Model:
--   - Admin/Manager: Full access to all records
--   - Rep: Access to records they own (sales_id match) OR created (created_by match)
--
-- Tables affected:
--   - organizations (drop select_organizations, create organizations_select_role_based)
--   - contacts (drop select_contacts, create contacts_select_role_based)
--   - opportunities (update to use dual ownership: owner_id OR account_manager_id)
--   - activities (update to use created_by since no sales_id column)
--   - contact_notes, organization_notes, opportunity_notes
--
-- References:
--   - Helper functions: supabase/migrations/20260118140000_add_role_based_access_helpers.sql
--   - Plan: docs/archive/plans/2026-01-18-role-based-access-control.md
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Organizations - Replace SELECT Policy
-- =====================================================================

-- Drop the old permissive policy
DROP POLICY IF EXISTS "select_organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "authenticated_select_organizations" ON public.organizations;

-- Create role-based SELECT policy
CREATE POLICY "organizations_select_role_based" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(sales_id, created_by)
    )
  );

-- =====================================================================
-- PART 2: Organizations - Update UPDATE Policy for Role-Based Access
-- =====================================================================

-- Drop old update policy
DROP POLICY IF EXISTS "update_organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;

-- Create role-based UPDATE policy
CREATE POLICY "organizations_update_role_based" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(sales_id, created_by)
    )
  )
  WITH CHECK (
    private.is_admin_or_manager()
    OR private.can_access_by_role(sales_id, created_by)
  );

-- =====================================================================
-- PART 3: Contacts - Replace SELECT Policy
-- =====================================================================

DROP POLICY IF EXISTS "select_contacts" ON public.contacts;
DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
DROP POLICY IF EXISTS "authenticated_select_contacts" ON public.contacts;

CREATE POLICY "contacts_select_role_based" ON public.contacts
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(sales_id, created_by)
    )
  );

-- =====================================================================
-- PART 4: Opportunities - Replace SELECT Policy (Dual Ownership)
-- =====================================================================
-- Opportunities have BOTH opportunity_owner_id AND account_manager_id
-- Either owner should be able to see and edit the record

DROP POLICY IF EXISTS "select_opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_select_policy" ON public.opportunities;
DROP POLICY IF EXISTS "authenticated_select_opportunities" ON public.opportunities;

CREATE POLICY "opportunities_select_role_based" ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(opportunity_owner_id, created_by)
      OR (account_manager_id IS NOT NULL AND private.can_access_by_role(account_manager_id, NULL))
    )
  );

-- Update policy for dual ownership
DROP POLICY IF EXISTS "update_opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_update_policy" ON public.opportunities;

CREATE POLICY "opportunities_update_dual_ownership" ON public.opportunities
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(opportunity_owner_id, created_by)
      OR (account_manager_id IS NOT NULL AND private.can_access_by_role(account_manager_id, NULL))
    )
  )
  WITH CHECK (
    private.is_admin_or_manager()
    OR private.can_access_by_role(opportunity_owner_id, created_by)
    OR (account_manager_id IS NOT NULL AND private.can_access_by_role(account_manager_id, NULL))
  );

-- =====================================================================
-- PART 5: Activities - Replace SELECT Policy (No sales_id column)
-- =====================================================================
-- Activities table has created_by but NO sales_id column
-- Use NULL for first parameter to can_access_by_role

DROP POLICY IF EXISTS "select_activities" ON public.activities;
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
DROP POLICY IF EXISTS "authenticated_select_activities" ON public.activities;

CREATE POLICY "activities_select_role_based" ON public.activities
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(NULL, created_by)
    )
  );

-- =====================================================================
-- PART 6: Notes Tables - Replace SELECT Policies
-- =====================================================================

-- Contact Notes
DROP POLICY IF EXISTS "select_contact_notes" ON public.contact_notes;
DROP POLICY IF EXISTS "contact_notes_select_policy" ON public.contact_notes;

CREATE POLICY "contact_notes_select_role_based" ON public.contact_notes
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(sales_id, created_by)
    )
  );

-- Organization Notes
DROP POLICY IF EXISTS "select_organization_notes" ON public.organization_notes;
DROP POLICY IF EXISTS "organization_notes_select_policy" ON public.organization_notes;

CREATE POLICY "organization_notes_select_role_based" ON public.organization_notes
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(sales_id, NULL)
    )
  );

-- Opportunity Notes
DROP POLICY IF EXISTS "select_opportunity_notes" ON public.opportunity_notes;
DROP POLICY IF EXISTS "opportunity_notes_select_policy" ON public.opportunity_notes;

CREATE POLICY "opportunity_notes_select_role_based" ON public.opportunity_notes
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_admin_or_manager()
      OR private.can_access_by_role(sales_id, created_by)
    )
  );

-- =====================================================================
-- VERIFICATION
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Role-Based RLS Policies Updated';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - organizations (SELECT, UPDATE)';
  RAISE NOTICE '  - contacts (SELECT)';
  RAISE NOTICE '  - opportunities (SELECT, UPDATE - dual ownership)';
  RAISE NOTICE '  - activities (SELECT - created_by only)';
  RAISE NOTICE '  - contact_notes (SELECT)';
  RAISE NOTICE '  - organization_notes (SELECT)';
  RAISE NOTICE '  - opportunity_notes (SELECT)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security model:';
  RAISE NOTICE '  - Admin/Manager: Full access';
  RAISE NOTICE '  - Rep: Own records only (sales_id OR created_by)';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
