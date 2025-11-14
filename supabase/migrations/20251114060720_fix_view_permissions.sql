-- Fix permissions for principal_opportunities and priority_tasks views
-- These views need proper GRANT permissions for authenticated and anon roles

-- Grant SELECT permissions to authenticated and anon users
GRANT SELECT ON principal_opportunities TO authenticated, anon;
GRANT SELECT ON priority_tasks TO authenticated, anon;

-- Ensure views are owned by postgres (required for GRANT to work)
ALTER VIEW principal_opportunities OWNER TO postgres;
ALTER VIEW priority_tasks OWNER TO postgres;

-- Re-grant after ownership change
GRANT SELECT ON principal_opportunities TO authenticated, anon;
GRANT SELECT ON priority_tasks TO authenticated, anon;
