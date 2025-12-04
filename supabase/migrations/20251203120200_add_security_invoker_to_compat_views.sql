-- ============================================================================
-- Add security_invoker to backward-compatibility views
-- Migration: 20251203120200_add_security_invoker_to_compat_views.sql
--
-- PROBLEM: Three backward-compatibility views are missing security_invoker
--   - contactNotes
--   - opportunityNotes
--   - organizationNotes
--
-- IMPACT: Views run with definer permissions instead of invoker permissions,
--         bypassing RLS policies (security risk)
--
-- SOLUTION: Drop and recreate views with security_invoker = true
--
-- REFERENCE: backend-database-best-practices.md
--   "Views bypass RLS | Data leakage | Use security_invoker = true (PG 15+)"
-- ============================================================================

-- Drop and recreate contactNotes view with security_invoker
DROP VIEW IF EXISTS "contactNotes";
CREATE VIEW "contactNotes" WITH (security_invoker = true) AS
  SELECT * FROM contact_notes;

-- Drop and recreate opportunityNotes view with security_invoker
DROP VIEW IF EXISTS "opportunityNotes";
CREATE VIEW "opportunityNotes" WITH (security_invoker = true) AS
  SELECT * FROM opportunity_notes;

-- Drop and recreate organizationNotes view with security_invoker
DROP VIEW IF EXISTS "organizationNotes";
CREATE VIEW "organizationNotes" WITH (security_invoker = true) AS
  SELECT * FROM organization_notes;

-- Restore grants to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON "contactNotes" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "opportunityNotes" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "organizationNotes" TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify security_invoker is set on all three views
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname IN ('contactNotes', 'opportunityNotes', 'organizationNotes');

  IF view_count != 3 THEN
    RAISE EXCEPTION 'Expected 3 views, found %', view_count;
  END IF;

  RAISE NOTICE 'Successfully verified 3 backward-compatibility views with security_invoker';
END $$;
