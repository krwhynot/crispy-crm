-- =====================================================================
-- Fix Opportunities UPDATE Policy
-- =====================================================================
-- Problem: The current update_opportunities policy only checks account_manager_id,
-- but opportunities have three ownership fields:
--   - account_manager_id
--   - opportunity_owner_id
--   - created_by
--
-- When a rep (non-manager) drags an opportunity where they're the owner
-- but not the account manager, the RLS policy returns 0 rows, causing
-- PostgREST to return a 406 "Cannot coerce to single JSON object" error.
--
-- Fix: Allow reps to update opportunities where they are ANY of:
--   - account_manager_id
--   - opportunity_owner_id
--   - created_by
-- =====================================================================

-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS update_opportunities ON opportunities;

-- Create the fixed policy that checks all ownership fields
CREATE POLICY update_opportunities ON opportunities
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin()
    OR account_manager_id = public.current_sales_id()
    OR opportunity_owner_id = public.current_sales_id()
    OR created_by = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin()
    OR account_manager_id = public.current_sales_id()
    OR opportunity_owner_id = public.current_sales_id()
    OR created_by = public.current_sales_id()
  );

COMMENT ON POLICY update_opportunities ON opportunities IS
  'Reps can update opportunities they own (account_manager, opportunity_owner, or created_by). Managers/admins can update all.';

-- =====================================================================
-- Verification (run manually to test)
-- =====================================================================
-- SELECT
--   polname,
--   polcmd,
--   pg_get_expr(polqual, polrelid) as using_expression,
--   pg_get_expr(polwithcheck, polrelid) as with_check_expression
-- FROM pg_policy
-- WHERE polrelid = 'opportunities'::regclass;
