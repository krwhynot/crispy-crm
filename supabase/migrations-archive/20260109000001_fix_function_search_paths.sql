-- ============================================================================
-- Migration: fix_function_search_paths.sql
-- ============================================================================
-- PURPOSE: Fix security vulnerability - functions missing search_path configuration
--
-- ISSUE: Functions without explicit search_path are vulnerable to schema poisoning
--        attacks where malicious functions in pg_temp can be invoked instead of
--        legitimate system functions. This is especially critical for SECURITY DEFINER
--        functions which run with elevated privileges.
--
-- AFFECTED FUNCTIONS:
--   1. merge_duplicate_contacts (CRITICAL - SECURITY DEFINER)
--   2. get_organization_descendants
--   3. increment_opportunity_version
--   4. sync_opportunity_with_contacts
--
-- FIX: Set search_path = '' (empty string) to require fully-qualified function names,
--      preventing pg_temp schema poisoning attacks.
--
-- REFERENCES:
--   - Supabase Security Advisor: https://supabase.com/docs/guides/database/database-advisors
--   - PostgreSQL Security: https://www.postgresql.org/docs/current/sql-createfunction.html
--   - CWE-426: Untrusted Search Path
--
-- TEST VERIFICATION: supabase/tests/database/010-function-security.test.sql
-- ============================================================================

-- CRITICAL FIX: merge_duplicate_contacts is SECURITY DEFINER (elevated privileges)
-- This function runs as the owner, so schema poisoning here is especially dangerous
ALTER FUNCTION public.merge_duplicate_contacts SET search_path = '';

-- Standard fixes for SECURITY INVOKER functions (still best practice)
ALTER FUNCTION public.get_organization_descendants SET search_path = '';
ALTER FUNCTION public.increment_opportunity_version SET search_path = '';
ALTER FUNCTION public.sync_opportunity_with_contacts SET search_path = '';

-- ============================================================================
-- VERIFICATION (run after migration):
-- ============================================================================
-- SELECT proname, proconfig FROM pg_proc
-- WHERE proname IN ('merge_duplicate_contacts', 'get_organization_descendants',
--                   'increment_opportunity_version', 'sync_opportunity_with_contacts')
--   AND pronamespace = 'public'::regnamespace;
--
-- Expected: All should have proconfig = {search_path=""} or similar
-- ============================================================================
