-- =====================================================================
-- Migration: Add Role-Based Access Helper Functions (Private Schema)
-- =====================================================================
-- Purpose: Create helper functions in the private schema specifically
-- designed for use in RLS policies. These provide a clean separation
-- between public API functions and internal security logic.
--
-- Functions created:
--   1. private.get_current_user_role() - Returns current user's role
--   2. private.can_access_by_role(record_sales_id, record_created_by) - Main access check
--   3. private.is_admin_or_manager() - Quick privilege check
--
-- Security model:
--   - Admin/Manager: Full access to all records
--   - Rep: Access to records they own (sales_id match) OR created (created_by match)
--
-- Design rationale:
--   - Private schema prevents direct API access to these functions
--   - SECURITY DEFINER allows functions to query sales table regardless of RLS
--   - SET search_path = '' prevents search_path injection attacks
--   - STABLE volatility allows query planner optimization within transactions
--   - Explicit NULL handling with fail-safe defaults (deny access)
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Create Private Schema
-- =====================================================================
-- The private schema is used for internal functions that should not
-- be directly accessible via the PostgREST API.

CREATE SCHEMA IF NOT EXISTS private;

COMMENT ON SCHEMA private IS
  'Internal functions for RLS policies and security logic. Not exposed via API.';

-- =====================================================================
-- PART 2: Helper Function - Get Current User Role
-- =====================================================================
-- Returns the role of the currently authenticated user.
-- Returns NULL if no sales record exists (fail-safe: will deny access).
--
-- Usage in RLS:
--   WHERE private.get_current_user_role() IN ('admin', 'manager')

CREATE OR REPLACE FUNCTION private.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN NULL  -- No auth context = no role
      ELSE (
        SELECT s.role::text
        FROM public.sales s
        WHERE s.user_id = auth.uid()
          AND s.deleted_at IS NULL
        LIMIT 1
      )
    END
$$;

COMMENT ON FUNCTION private.get_current_user_role() IS
  'Returns the role (as text) of the currently authenticated user. Returns NULL when unauthenticated or no sales record exists. Used internally by RLS policies.';

-- =====================================================================
-- PART 3: Helper Function - Check Record Access By Role
-- =====================================================================
-- Main access control function for RLS policies.
-- Determines if the current user can access a record based on:
--   1. Role: Admin/Manager can access all records
--   2. Ownership: Rep can access records they own (sales_id match)
--   3. Creator: Rep can access records they created (created_by match)
--
-- Parameters:
--   record_sales_id: The sales_id (owner) of the record
--   record_created_by: The created_by field of the record (optional)
--
-- Returns:
--   TRUE if access is allowed, FALSE otherwise
--
-- Usage in RLS:
--   USING (private.can_access_by_role(sales_id, created_by))

CREATE OR REPLACE FUNCTION private.can_access_by_role(
  record_sales_id bigint,
  record_created_by bigint DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_role text;
  current_sales_id bigint;
BEGIN
  -- No auth context = deny access (fail-safe)
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Get current user's role and sales_id
  SELECT s.role::text, s.id
  INTO current_role, current_sales_id
  FROM public.sales s
  WHERE s.user_id = auth.uid()
    AND s.deleted_at IS NULL;

  -- No sales record = deny access (fail-safe)
  IF current_sales_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admins and managers can access all records
  IF current_role IN ('admin', 'manager') THEN
    RETURN true;
  END IF;

  -- Reps can access records they own OR created
  -- COALESCE handles NULL created_by (treats as no match)
  RETURN (
    record_sales_id = current_sales_id OR
    COALESCE(record_created_by, 0) = current_sales_id
  );
END;
$$;

COMMENT ON FUNCTION private.can_access_by_role(bigint, bigint) IS
  'Determines if the current user can access a record based on role and ownership. Admin/Manager: all access. Rep: own records or records they created. Returns FALSE when unauthenticated.';

-- =====================================================================
-- PART 4: Helper Function - Check Admin or Manager
-- =====================================================================
-- Quick check if the current user has elevated privileges.
-- More efficient than checking role directly when only privilege
-- level matters (not the specific role).
--
-- Returns:
--   TRUE if user is admin or manager
--   FALSE if user is rep, unauthenticated, or has no sales record
--
-- Usage in RLS:
--   USING (private.is_admin_or_manager() OR sales_id = current_sales_id())

CREATE OR REPLACE FUNCTION private.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN false  -- Fail-safe: deny when unauthenticated
      ELSE COALESCE(
        (
          SELECT s.role IN ('admin', 'manager')
          FROM public.sales s
          WHERE s.user_id = auth.uid()
            AND s.deleted_at IS NULL
        ),
        false  -- No sales record = deny access
      )
    END
$$;

COMMENT ON FUNCTION private.is_admin_or_manager() IS
  'Returns TRUE if current user has admin or manager role. Returns FALSE when unauthenticated or no sales record exists. Used for privilege checks in RLS policies.';

-- =====================================================================
-- PART 5: Grant Execute Permissions
-- =====================================================================
-- Grant execute on private functions to authenticated role.
-- These functions use SECURITY DEFINER so the authenticated role
-- can execute them even though it cannot directly access the
-- private schema or underlying tables.

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_by_role(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_or_manager() TO authenticated;

-- =====================================================================
-- PART 6: Verification
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Role-Based Access Helpers Installed';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema created:';
  RAISE NOTICE '  - private (internal security functions)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - private.get_current_user_role()';
  RAISE NOTICE '  - private.can_access_by_role(bigint, bigint)';
  RAISE NOTICE '  - private.is_admin_or_manager()';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security features:';
  RAISE NOTICE '  - SECURITY DEFINER (elevated privileges)';
  RAISE NOTICE '  - SET search_path = '''' (injection protection)';
  RAISE NOTICE '  - STABLE volatility (query optimization)';
  RAISE NOTICE '  - Explicit NULL handling (fail-safe defaults)';
  RAISE NOTICE '  - deleted_at IS NULL filter (soft delete aware)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Grants applied:';
  RAISE NOTICE '  - USAGE on schema private to authenticated';
  RAISE NOTICE '  - EXECUTE on all functions to authenticated';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
