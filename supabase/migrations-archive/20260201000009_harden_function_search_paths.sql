-- ============================================================================
-- Migration: Harden search_path on all remaining custom functions
-- ============================================================================
-- Purpose: Set explicit search_path on functions that are missing it.
-- This prevents search_path injection attacks and ensures pgTAP 010 tests pass.
--
-- Approach: Uses DO block with exception handling to gracefully skip functions
-- that may not exist on the remote (schema drift from phantom migrations).
-- ============================================================================

DO $$
DECLARE
  fn_sig TEXT;
  fn_list TEXT[] := ARRAY[
    'audit_critical_field_changes()',
    'merge_duplicate_contacts(integer, integer[])',
    'cascade_soft_delete_to_notes()',
    'check_organization_delete_allowed()',
    'protect_audit_fields()',
    'set_default_segment_id()',
    'set_updated_at()',
    'update_updated_at_column()',
    'update_user_favorites_updated_at()'
  ];
  applied INT := 0;
  skipped INT := 0;
BEGIN
  FOREACH fn_sig IN ARRAY fn_list LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = ''public''', fn_sig);
      applied := applied + 1;
      RAISE NOTICE 'Hardened: %', fn_sig;
    EXCEPTION WHEN undefined_function THEN
      skipped := skipped + 1;
      RAISE NOTICE 'Skipped (not found): %', fn_sig;
    END;
  END LOOP;

  RAISE NOTICE 'search_path hardening complete: % applied, % skipped', applied, skipped;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proconfig IS NULL
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'gtrgm_%'
    AND p.proname NOT LIKE 'gin_%'
    AND p.proname NOT LIKE '%trgm%'
    AND p.proname NOT LIKE 'similarity%'
    AND p.proname NOT LIKE 'word_similarity%'
    AND p.proname NOT LIKE 'strict_word_similarity%'
    AND p.proname NOT LIKE 'set_limit%'
    AND p.proname NOT LIKE 'show_%';

  IF missing_count = 0 THEN
    RAISE NOTICE 'All custom functions now have search_path configured.';
  ELSE
    RAISE WARNING '% custom function(s) still missing search_path (may differ between local and remote).', missing_count;
  END IF;
END $$;
