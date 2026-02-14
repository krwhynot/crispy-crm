-- ============================================================================
-- Migration: Fix current_sales_id() search_path regression
-- ============================================================================
-- SECURITY FIX: Migration 20260118000005_fix_rls_write_policies.sql overwrote
-- the secure empty search_path (set in 20251130010932) with 'SET search_path = public'.
-- This is a SECURITY DEFINER function used in every RLS policy via
-- (SELECT current_sales_id()). Empty search_path prevents schema shadowing attacks.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.current_sales_id() IS
  'Returns sales record ID for authenticated user. SECURITY DEFINER with empty search_path.';
