-- =====================================================================
-- FIX: "Database error querying schema" Authentication Issue
-- =====================================================================
-- Diagnosis: Triggers on auth.users may have permission issues
-- Solution: Ensure proper ownership and grants for auth trigger functions
-- =====================================================================

-- =====================================================================
-- PART 1: Verify and fix function ownership
-- =====================================================================

-- Change function ownership to supabase_auth_admin (required for auth schema access)
ALTER FUNCTION public.handle_new_user() OWNER TO supabase_auth_admin;
ALTER FUNCTION public.handle_update_user() OWNER TO supabase_auth_admin;

-- Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_update_user() TO authenticated;

-- Grant execute permission to service_role (for admin operations)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_update_user() TO service_role;

-- =====================================================================
-- PART 2: Ensure triggers exist (idempotent)
-- =====================================================================

-- Drop and recreate triggers to ensure they're properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Recreate trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Recreate trigger for user updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_user();

-- =====================================================================
-- PART 3: Verification and Diagnostics
-- =====================================================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_owner TEXT;
BEGIN
  -- Check if triggers exist
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND t.tgname IN ('on_auth_user_created', 'on_auth_user_updated');

  -- Check function ownership
  SELECT pg_catalog.pg_get_userbyid(p.proowner) INTO function_owner
  FROM pg_proc p
  WHERE p.proname = 'handle_new_user'
  LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Auth Trigger Diagnostics';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Triggers on auth.users: %', trigger_count;
  RAISE NOTICE 'Function owner: %', function_owner;

  IF trigger_count = 2 AND function_owner = 'supabase_auth_admin' THEN
    RAISE NOTICE 'Status:  All checks passed';
  ELSIF trigger_count != 2 THEN
    RAISE WARNING 'Status:  Missing triggers (expected 2, found %)', trigger_count;
  ELSE
    RAISE WARNING 'Status:  Function ownership issue (owner: %)', function_owner;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================================
-- Expected Output:
-- NOTICE: Triggers on auth.users: 2
-- NOTICE: Function owner: supabase_auth_admin
-- NOTICE: Status:  All checks passed
-- =====================================================================
