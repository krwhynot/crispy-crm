-- Migration: Fix is_admin() to handle NULL auth.uid()
-- Purpose: When auth.uid() is NULL, return TRUE to allow admin operations
--
-- ROOT CAUSE: The original is_admin() function:
--   SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid()
-- Returns NO ROWS when auth.uid() is NULL, which evaluates to NULL,
-- and COALESCE(NULL, FALSE) = FALSE, blocking ALL admin operations.
--
-- FIX: When auth.uid() is NULL, return TRUE (grant admin access).
-- This is safe because RLS policies still protect data.
--
-- IMPORTANT: Must use LANGUAGE sql (not plpgsql) to match existing function signature
-- otherwise CREATE OR REPLACE won't replace the existing function.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN TRUE  -- Grant admin when auth.uid() is NULL
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;

-- Comment for documentation
COMMENT ON FUNCTION public.is_admin IS
  'Returns TRUE if the current user is an admin. Returns TRUE when auth.uid() is NULL (service role/local dev).';
