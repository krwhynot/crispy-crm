-- Fix opportunity_contacts SELECT policy bypass vulnerability
-- ============================================================
-- Issue: Two PERMISSIVE SELECT policies create OR logic bypass
--
-- Policy 1: authenticated_select_opportunity_contacts
--   USING (deleted_at IS NULL)
--   ^ ANY authenticated user can see ALL records - NO ownership check!
--
-- Policy 2: opportunity_contacts_select_through_opportunities
--   USING (deleted_at IS NULL AND <proper ownership checks>)
--   ^ Correctly restricts access through opportunity ownership
--
-- Impact: The permissive policy without ownership checks completely
--         bypasses the security of the properly-restricted policy.
--         PostgreSQL OR's PERMISSIVE policies together.
--
-- Fix: Drop the overly permissive policy, keep only the ownership-checked one.
-- ============================================================

-- Drop the permissive bypass policy
DROP POLICY IF EXISTS "authenticated_select_opportunity_contacts"
  ON "public"."opportunity_contacts";

-- Verify the proper policy remains:
-- "opportunity_contacts_select_through_opportunities" has ownership checks:
--   - User is participant on the opportunity
--   - User created the opportunity
--   - User is opportunity owner
--   - User is account manager

COMMENT ON TABLE opportunity_contacts IS
'RLS FIX 2026-01-26: SELECT policy consolidated - only ownership-based access via opportunity_contacts_select_through_opportunities';
