-- =====================================================================
-- Add is_manager() Helper Function
-- =====================================================================
-- Completes the RBAC helper function set for granular role checking.
-- Existing: is_admin(), is_manager_or_admin(), current_sales_id(), user_role()
-- Adding: is_manager(), is_rep()
-- =====================================================================

-- Check if current user is specifically a manager (not admin)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT role = 'manager' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_manager() IS 'Returns true if current user has manager role (not admin)';

-- Check if current user is a rep
CREATE OR REPLACE FUNCTION public.is_rep()
RETURNS BOOLEAN AS $$
  SELECT role = 'rep' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_rep() IS 'Returns true if current user has rep role';

-- =====================================================================
-- Verification
-- =====================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RBAC Helper Functions Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  - user_role()          - Returns user role enum';
  RAISE NOTICE '  - is_admin()           - True if admin';
  RAISE NOTICE '  - is_manager()         - True if manager (NEW)';
  RAISE NOTICE '  - is_rep()             - True if rep (NEW)';
  RAISE NOTICE '  - is_manager_or_admin()- True if manager OR admin';
  RAISE NOTICE '  - current_sales_id()   - Returns sales record ID';
  RAISE NOTICE '========================================';
END $$;
