-- Fix audit_trail USING(true) vulnerability
-- ==========================================
-- Issue: Current policy allows ANY authenticated user to view entire audit trail
--
-- Current policy:
--   authenticated_select_audit_trail: USING (true)
--   ^ Exposes all audit records to all users!
--
-- Impact: Sensitive operational data (who did what, when) is exposed
--         to all authenticated users regardless of role.
--
-- Fix: Restrict audit trail access to admin and manager roles only.
--      Uses existing helper functions: is_admin(), is_manager_or_admin()
-- ==========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "authenticated_select_audit_trail"
  ON "public"."audit_trail";

-- Create properly restricted policy (admin/manager only)
CREATE POLICY "audit_trail_admin_manager_only"
ON "public"."audit_trail"
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR public.is_manager_or_admin()
);

COMMENT ON POLICY "audit_trail_admin_manager_only" ON "public"."audit_trail" IS
'RLS FIX 2026-01-26: Audit trail restricted to admin/manager roles only. Regular users cannot view audit history.';
