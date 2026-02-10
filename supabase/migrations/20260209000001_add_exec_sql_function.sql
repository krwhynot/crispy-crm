-- Migration: Add exec_sql RPC function for schema introspection
-- Purpose: Allow service role to execute arbitrary SQL queries for metadata extraction
-- Security: Restricted to service_role only via RLS

-- Create function to execute arbitrary SQL (service role only)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow service role to execute
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: exec_sql requires service_role';
  END IF;

  -- Execute the query and return results as JSONB
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION exec_sql IS 'Execute arbitrary SQL and return results as JSONB (service_role only)';
