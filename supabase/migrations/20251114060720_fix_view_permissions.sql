-- =====================================================
-- Migration: Fix view permissions for Dashboard V2
-- Purpose: Ensure principal_opportunities and priority_tasks are accessible
-- Issue: Initial migrations granted to 'authenticated' only, needed 'anon' for public API
-- Resolution: Set proper ownership and grant to both roles
-- =====================================================

-- =====================================================
-- Set View Ownership
-- =====================================================

-- Views must be owned by postgres for GRANT statements to work correctly
ALTER VIEW principal_opportunities OWNER TO postgres;
ALTER VIEW priority_tasks OWNER TO postgres;

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant read access to authenticated users (logged-in team members)
-- Grant read access to anon role (for public API access with RLS)
GRANT SELECT ON principal_opportunities TO authenticated, anon;
GRANT SELECT ON priority_tasks TO authenticated, anon;

-- =====================================================
-- Notes
-- =====================================================

-- This migration corrects permissions for views created in:
--   - 20251113235406_principal_opportunities_view.sql
--   - 20251114001720_priority_tasks_view.sql
--
-- Previous migrations only granted to 'authenticated', causing 401 errors
-- when accessing via Postgrest API with anon key.
--
-- Best practice: Always grant to both 'authenticated' and 'anon' roles
-- for views that will be accessed via the API.
