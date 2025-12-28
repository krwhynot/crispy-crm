-- Migration: Clean up admin_update_sale function overloads
-- Purpose: Remove old 4-param and 5-param versions to prevent PostgreSQL
--          function resolution ambiguity when edge function uses named params
--
-- Root cause: Edge function was timing out because PostgreSQL couldn't
-- unambiguously resolve which admin_update_sale overload to call
-- when using named parameters with DEFAULT NULL values.
--
-- Solution: Keep only the 9-param version which handles all use cases.

-- Drop old 4-param overload (original version from create_edge_function_helpers)
DROP FUNCTION IF EXISTS admin_update_sale(UUID, user_role, BOOLEAN, TEXT);

-- Drop old 5-param overload (added deleted_at support)
DROP FUNCTION IF EXISTS admin_update_sale(UUID, user_role, BOOLEAN, TEXT, TIMESTAMPTZ);

-- Ensure permissions are correct on the 9-param version
-- (DROP may have cascaded GRANT if there were dependencies)
GRANT EXECUTE ON FUNCTION admin_update_sale(
  UUID,
  user_role,
  BOOLEAN,
  TEXT,
  TIMESTAMPTZ,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) TO authenticated;

-- Revoke from PUBLIC for defense-in-depth
REVOKE ALL ON FUNCTION admin_update_sale(
  UUID,
  user_role,
  BOOLEAN,
  TEXT,
  TIMESTAMPTZ,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC;
