-- Fix missing permissions on summary views
-- Issue: Views don't inherit RLS or permissions from base tables in PostgreSQL
-- This was causing 403 "permission denied" errors when authenticated users tried to access the views

-- Grant SELECT permissions to authenticated role for all summary views
-- These views are used by the data provider for optimized queries

-- Companies summary view
GRANT SELECT ON companies_summary TO authenticated;
GRANT SELECT ON companies_summary TO anon; -- Allow anon role for public-facing features if needed

-- Contacts summary view
GRANT SELECT ON contacts_summary TO authenticated;
GRANT SELECT ON contacts_summary TO anon;

-- Opportunities summary view
GRANT SELECT ON opportunities_summary TO authenticated;
GRANT SELECT ON opportunities_summary TO anon;

-- Contact engagement summary view
GRANT SELECT ON contact_engagement_summary TO authenticated;
GRANT SELECT ON contact_engagement_summary TO anon;

-- Also grant permissions to service_role for administrative access
GRANT ALL ON companies_summary TO service_role;
GRANT ALL ON contacts_summary TO service_role;
GRANT ALL ON opportunities_summary TO service_role;
GRANT ALL ON contact_engagement_summary TO service_role;

-- Verify the grants (for documentation purposes)
-- You can check grants with:
-- SELECT grantee, privilege_type FROM information_schema.table_privileges
-- WHERE table_name = 'companies_summary' ORDER BY grantee;