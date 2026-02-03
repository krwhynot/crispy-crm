-- ============================================================================
-- Migration: Fix Security Definer Views
-- ============================================================================
-- Supabase linter flagged activities_summary as SECURITY DEFINER.
-- Audit found 7 views total missing security_invoker = on.
--
-- Root cause: migration 20260102180656 dropped + recreated 5 views without
-- preserving the security_invoker setting added in 20251130010932/20251130011911.
-- Two more views (activities_summary, opportunity_stage_changes) were created
-- after the security remediation without the setting.
--
-- Fix: ALTER VIEW SET (security_invoker = on) -- no DROP/CREATE needed on PG 17.
-- All views already have GRANT SELECT to authenticated.
--
-- Uses DO block with exception handling to gracefully skip views that may not
-- exist on the remote (schema drift from phantom migrations).
-- ============================================================================

DO $$
DECLARE
  view_name TEXT;
  view_list TEXT[] := ARRAY[
    'activities_summary',
    'authorization_status',
    'dashboard_principal_summary',
    'opportunity_stage_changes',
    'organizations_with_account_manager',
    'principal_opportunities',
    'principal_pipeline_summary'
  ];
  applied INT := 0;
  skipped INT := 0;
BEGIN
  FOREACH view_name IN ARRAY view_list LOOP
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on)', view_name);
      applied := applied + 1;
      RAISE NOTICE 'Fixed: %', view_name;
    EXCEPTION WHEN undefined_table THEN
      skipped := skipped + 1;
      RAISE NOTICE 'Skipped (not found): %', view_name;
    END;
  END LOOP;

  RAISE NOTICE 'Security invoker fix complete: % applied, % skipped', applied, skipped;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  definer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO definer_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND NOT (
      COALESCE(c.reloptions, '{}') @> ARRAY['security_invoker=on']
      OR COALESCE(c.reloptions, '{}') @> ARRAY['security_invoker=true']
    );

  IF definer_count = 0 THEN
    RAISE NOTICE 'All public views now use SECURITY INVOKER.';
  ELSE
    RAISE WARNING '% public view(s) still using SECURITY DEFINER (may differ between local and remote).', definer_count;
  END IF;
END $$;
