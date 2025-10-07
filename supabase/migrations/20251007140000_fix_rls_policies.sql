-- Fix missing grants on organizations_summary view
-- Migration: 20251007140000_fix_rls_policies.sql
-- Description: Adds missing SELECT grants to organizations_summary view
--
-- ROOT CAUSE:
-- The organizations_summary view was dropped and recreated multiple times:
--   - 20250926213954_fix_rls_and_orgs_view.sql (no grants)
--   - 20251005221416_fix_security_warnings.sql (no grants)
--   - 20251007130000_rename_organization_summary_counts.sql (no grants)
-- Each recreation lost the grants, causing 403 "permission denied" errors.
--
-- FIX:
-- Add grants matching contacts_summary pattern (which works correctly)

-- ============================================================================
-- Grant SELECT on organizations_summary view to authenticated users
-- ============================================================================

GRANT SELECT ON organizations_summary TO authenticated;
GRANT SELECT ON organizations_summary TO anon;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- After migration, verify grants exist:
-- SELECT table_name, privilege_type, grantee
-- FROM information_schema.table_privileges
-- WHERE table_name = 'organizations_summary'
--   AND grantee IN ('authenticated', 'anon');
