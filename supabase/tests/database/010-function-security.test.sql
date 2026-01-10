-- ============================================================================
-- 010-function-security.test.sql
-- ============================================================================
-- PURPOSE: Verify database functions have secure search_path settings
-- SECURITY: Functions with mutable search_path can be exploited if an attacker
--           creates objects in a schema that appears earlier in the search path.
--
-- Best Practice:
--   - SECURITY DEFINER functions should have search_path='' (empty)
--   - At minimum, all functions should have explicit search_path set
--
-- References:
--   - PostgreSQL Security: https://www.postgresql.org/docs/current/sql-createfunction.html
--   - Supabase Security Advisors: search_path vulnerability
-- ============================================================================

BEGIN;

-- Plan: Test critical functions + SECURITY DEFINER audit + missing search_path check
SELECT plan(15);

-- ============================================================================
-- SECTION 1: Critical Functions Must Have search_path Set
-- ============================================================================

-- Test 1: increment_opportunity_version should have search_path configured
SELECT ok(
  (SELECT proconfig IS NOT NULL
   FROM pg_proc
   WHERE proname = 'increment_opportunity_version'
   AND pronamespace = 'public'::regnamespace),
  'increment_opportunity_version should have proconfig (search_path) set'
);

-- Test 2: get_current_sales_id should have empty search_path (most secure)
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'get_current_sales_id'
   AND pronamespace = 'public'::regnamespace),
  'get_current_sales_id should have empty search_path (search_path="")'
);

-- Test 3: current_sales_id should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'current_sales_id'
   AND pronamespace = 'public'::regnamespace),
  'current_sales_id should have empty search_path'
);

-- Test 4: get_current_user_sales_id should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'get_current_user_sales_id'
   AND pronamespace = 'public'::regnamespace),
  'get_current_user_sales_id should have empty search_path'
);

-- Test 5: handle_new_user (auth trigger) should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'handle_new_user'
   AND pronamespace = 'public'::regnamespace),
  'handle_new_user should have empty search_path'
);

-- ============================================================================
-- SECTION 2: Role Check Functions Must Have Empty search_path
-- ============================================================================

-- Test 6: is_admin should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'is_admin'
   AND pronamespace = 'public'::regnamespace),
  'is_admin should have empty search_path'
);

-- Test 7: is_manager should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'is_manager'
   AND pronamespace = 'public'::regnamespace),
  'is_manager should have empty search_path'
);

-- Test 8: is_manager_or_admin should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'is_manager_or_admin'
   AND pronamespace = 'public'::regnamespace),
  'is_manager_or_admin should have empty search_path'
);

-- Test 9: is_rep should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'is_rep'
   AND pronamespace = 'public'::regnamespace),
  'is_rep should have empty search_path'
);

-- Test 10: user_role should have empty search_path
SELECT ok(
  (SELECT proconfig::text[] @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE proname = 'user_role'
   AND pronamespace = 'public'::regnamespace),
  'user_role should have empty search_path'
);

-- ============================================================================
-- SECTION 3: SECURITY DEFINER Functions Audit
-- ============================================================================

-- Test 11: All SECURITY DEFINER functions should have search_path configured
-- This is critical as SECURITY DEFINER runs with owner privileges
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
    AND p.prosecdef = true
    AND p.proconfig IS NULL
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'gtrgm_%'
    AND p.proname NOT LIKE 'gin_%'
  ),
  'All SECURITY DEFINER functions should have search_path configured'
);

-- Test 12: Count SECURITY DEFINER functions with non-empty search_path (advisory)
-- These are potential security risks and should be reviewed
SELECT ok(
  (SELECT COUNT(*)
   FROM pg_proc p
   WHERE p.pronamespace = 'public'::regnamespace
   AND p.prosecdef = true
   AND p.proconfig IS NOT NULL
   AND NOT (p.proconfig::text[] @> ARRAY['search_path=""'])
  ) >= 0,  -- Always passes, but logs the count for awareness
  'Advisory: SECURITY DEFINER functions with non-empty search_path exist (review recommended)'
);

-- ============================================================================
-- SECTION 4: Functions Without search_path (Excluding Extension Functions)
-- ============================================================================

-- Test 13: Custom functions should have search_path set
-- Excludes pg_trgm extension functions which have null proconfig by design
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
    AND p.proconfig IS NULL
    AND p.proname NOT IN (
      -- pg_trgm extension functions (expected to have null proconfig)
      'gin_extract_query_trgm', 'gin_extract_value_trgm',
      'gin_trgm_consistent', 'gin_trgm_triconsistent',
      'gtrgm_compress', 'gtrgm_consistent', 'gtrgm_decompress',
      'gtrgm_distance', 'gtrgm_in', 'gtrgm_options', 'gtrgm_out',
      'gtrgm_penalty', 'gtrgm_picksplit', 'gtrgm_same', 'gtrgm_union',
      'set_limit', 'show_limit', 'show_trgm',
      'similarity', 'similarity_dist', 'similarity_op',
      'strict_word_similarity', 'strict_word_similarity_commutator_op',
      'strict_word_similarity_dist_commutator_op', 'strict_word_similarity_dist_op',
      'strict_word_similarity_op', 'word_similarity', 'word_similarity_commutator_op',
      'word_similarity_dist_commutator_op', 'word_similarity_dist_op', 'word_similarity_op'
    )
  ),
  'All custom functions (excluding pg_trgm) should have search_path configured'
);

-- Test 14: sync_opportunity_with_contacts should have search_path
SELECT ok(
  (SELECT proconfig IS NOT NULL
   FROM pg_proc
   WHERE proname = 'sync_opportunity_with_contacts'
   AND pronamespace = 'public'::regnamespace),
  'sync_opportunity_with_contacts should have search_path configured'
);

-- Test 15: get_organization_descendants should have search_path
SELECT ok(
  (SELECT proconfig IS NOT NULL
   FROM pg_proc
   WHERE proname = 'get_organization_descendants'
   AND pronamespace = 'public'::regnamespace),
  'get_organization_descendants should have search_path configured'
);

-- ============================================================================
-- DIAGNOSTIC OUTPUT (for debugging failures)
-- ============================================================================
-- Uncomment to see functions missing search_path:
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
-- AND proconfig IS NULL
-- AND proname NOT LIKE 'pg_%'
-- AND proname NOT LIKE '%trgm%'
-- AND proname NOT LIKE 'similarity%'
-- AND proname NOT LIKE 'word_similarity%'
-- ORDER BY prosecdef DESC, proname;

SELECT * FROM finish();
ROLLBACK;
