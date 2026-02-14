-- Migration: Fix security issues in exec_sql function
-- Purpose: Address schema injection and NULL JWT claim bypass vulnerabilities
-- Security Fixes:
--   1. SET search_path = public to prevent schema injection attacks
--   2. Use COALESCE to properly reject NULL JWT claims (NULL != 'service_role' returns NULL, not TRUE)
--   3. Explicit REVOKE/GRANT to restrict execution to service_role only

-- Recreate function with security fixes
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  jwt_role text;
BEGIN
  -- Extract role from JWT claims, defaulting to empty string if NULL
  -- This prevents NULL bypass: NULL != 'service_role' returns NULL (falsy), skipping the exception
  jwt_role := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    ''
  );

  -- Only allow service role to execute
  IF jwt_role != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: exec_sql requires service_role';
  END IF;

  -- Execute the query and return results as JSONB
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Revoke default public access
REVOKE EXECUTE ON FUNCTION exec_sql(text) FROM PUBLIC;

-- Grant access only to service_role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

COMMENT ON FUNCTION exec_sql IS 'Execute arbitrary SQL and return results as JSONB (service_role only, security hardened)';
