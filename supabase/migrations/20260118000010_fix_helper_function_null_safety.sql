-- =====================================================================
-- Migration: Fix RLS Helper Functions for Null-Safety
-- =====================================================================
-- Purpose: Ensure all helper functions return safe defaults when
-- auth.uid() IS NULL (unauthenticated/service role context).
--
-- ROOT CAUSE: The original helper functions:
--   SELECT role = 'manager' FROM public.sales WHERE user_id = auth.uid()
-- Return NO ROWS when auth.uid() is NULL, which evaluates to NULL,
-- causing unexpected behavior in RLS policy evaluation.
--
-- PATTERN: When auth.uid() is NULL, return a fail-safe default:
--   - Boolean functions: Return FALSE (deny access)
--   - user_role(): Return 'rep' (lowest privilege)
--
-- NOTE: is_admin() already returns TRUE when auth.uid() IS NULL
-- (service role bypass pattern - see migration 20251211180000).
-- current_sales_id() correctly returns NULL when auth.uid() IS NULL.
--
-- IMPORTANT: Must use LANGUAGE sql to match existing function signatures
-- otherwise CREATE OR REPLACE won't replace the existing functions.
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Fix is_manager() - Return FALSE when unauthenticated
-- =====================================================================
-- Original: SELECT role = 'manager' FROM sales WHERE user_id = auth.uid()
-- Problem: Returns NULL when auth.uid() IS NULL (no rows match)
-- Fix: Explicitly check for NULL auth.uid() first, return FALSE

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE  -- Fail-safe: deny when unauthenticated
      ELSE COALESCE(
        (SELECT role = 'manager' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;

COMMENT ON FUNCTION public.is_manager() IS
  'Returns TRUE if current user has manager role. Returns FALSE when auth.uid() is NULL (unauthenticated).';

-- =====================================================================
-- PART 2: Fix is_rep() - Return FALSE when unauthenticated
-- =====================================================================
-- Original: SELECT role = 'rep' FROM sales WHERE user_id = auth.uid()
-- Problem: Returns NULL when auth.uid() IS NULL (no rows match)
-- Fix: Explicitly check for NULL auth.uid() first, return FALSE

CREATE OR REPLACE FUNCTION public.is_rep()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE  -- Fail-safe: deny when unauthenticated
      ELSE COALESCE(
        (SELECT role = 'rep' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;

COMMENT ON FUNCTION public.is_rep() IS
  'Returns TRUE if current user has rep role. Returns FALSE when auth.uid() is NULL (unauthenticated).';

-- =====================================================================
-- PART 3: Fix is_manager_or_admin() - Return FALSE when unauthenticated
-- =====================================================================
-- Original: SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
-- Problem: Returns NULL when auth.uid() IS NULL (no rows match)
-- Fix: Explicitly check for NULL auth.uid() first, return FALSE
--
-- NOTE: This differs from is_admin() which returns TRUE for NULL auth.uid()
-- because is_admin() is used for service role bypass. is_manager_or_admin()
-- should deny access to unauthenticated requests.

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE  -- Fail-safe: deny when unauthenticated
      ELSE COALESCE(
        (SELECT role IN ('admin', 'manager') FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;

COMMENT ON FUNCTION public.is_manager_or_admin() IS
  'Returns TRUE if current user has manager or admin role. Returns FALSE when auth.uid() is NULL (unauthenticated).';

-- =====================================================================
-- PART 4: Fix user_role() - Return 'rep' (lowest privilege) when unauthenticated
-- =====================================================================
-- Original: SELECT role FROM sales WHERE user_id = auth.uid()
-- Problem: Returns NULL when auth.uid() IS NULL (no rows match)
-- Fix: Return 'rep' as the safe default (lowest privilege level)

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN 'rep'::public.user_role  -- Fail-safe: lowest privilege when unauthenticated
      ELSE COALESCE(
        (SELECT role FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        'rep'::public.user_role
      )
    END
$$;

COMMENT ON FUNCTION public.user_role() IS
  'Returns the role of the currently authenticated user. Returns ''rep'' (lowest privilege) when auth.uid() is NULL (unauthenticated).';

-- =====================================================================
-- PART 5: Verification
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Helper Functions Null-Safety Fix';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updated functions:';
  RAISE NOTICE '  - is_manager()        : FALSE when auth.uid() IS NULL';
  RAISE NOTICE '  - is_rep()            : FALSE when auth.uid() IS NULL';
  RAISE NOTICE '  - is_manager_or_admin(): FALSE when auth.uid() IS NULL';
  RAISE NOTICE '  - user_role()         : ''rep'' when auth.uid() IS NULL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Unchanged functions (already correct):';
  RAISE NOTICE '  - is_admin()          : TRUE when auth.uid() IS NULL (service role bypass)';
  RAISE NOTICE '  - current_sales_id()  : NULL when auth.uid() IS NULL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security pattern applied:';
  RAISE NOTICE '  - SECURITY DEFINER retained';
  RAISE NOTICE '  - SET search_path = '''' applied';
  RAISE NOTICE '  - STABLE volatility retained';
  RAISE NOTICE '  - deleted_at IS NULL filter added';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
