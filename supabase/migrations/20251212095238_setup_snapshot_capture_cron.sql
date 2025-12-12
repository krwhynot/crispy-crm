-- =====================================================
-- Setup pg_cron for Dashboard Snapshot Capture
-- =====================================================
--
-- Purpose: Schedule daily execution of capture-dashboard-snapshots Edge Function
-- Schedule: 23:00 UTC every day (0 23 * * *) - end of day snapshot
-- Issue: PERF-02 + FUNC-01 - Week-over-week trends require historical data
--
-- Architecture:
--   - Uses pg_cron for scheduling (runs at 11 PM UTC daily)
--   - Uses pg_net for async HTTP POST to Edge Function
--   - Uses Supabase Vault for secure API key storage
--   - Edge Function processes each user independently (fail-fast)
--
-- Timezone Conversions:
--   23:00 UTC = 6 PM EST / 7 PM EDT (Eastern US)
--   23:00 UTC = 3 PM PST / 4 PM PDT (Western US)
--
-- Security:
--   - Service role key stored in Vault (not in code)
--   - Project URL stored in Vault (not in code)
--   - Uses SECURITY DEFINER for controlled access
--
-- Fail-Fast Pattern:
--   - pg_net handles Edge Function timeout (5 minute default)
--   - Edge Function processes users independently
--   - One user's failure doesn't block others
--
-- =====================================================

-- =====================================================
-- Step 1: Ensure required extensions are enabled
-- =====================================================

-- pg_cron: Scheduling jobs (should already exist from digest setup)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- pg_net: Async HTTP requests (should already exist)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- =====================================================
-- Step 2: Verify Vault secrets (same as digest)
-- =====================================================
-- NOTE: These must already be configured from daily-digest setup
--   - project_url: Your Supabase project URL
--   - service_role_key: Your service role API key

DO $$
BEGIN
  RAISE NOTICE 'Using existing vault secrets from daily-digest setup:';
  RAISE NOTICE '  - project_url';
  RAISE NOTICE '  - service_role_key';
END $$;

-- =====================================================
-- Step 3: Create helper function to invoke Edge Function
-- =====================================================

CREATE OR REPLACE FUNCTION invoke_snapshot_capture_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_project_url TEXT;
  v_service_key TEXT;
  v_function_url TEXT;
  v_request_id BIGINT;
BEGIN
  -- Retrieve secrets from Vault
  SELECT decrypted_secret INTO v_project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  -- Validate secrets exist
  IF v_project_url IS NULL THEN
    RAISE WARNING 'snapshot-capture: project_url not found in Vault, skipping';
    RETURN;
  END IF;

  IF v_service_key IS NULL THEN
    RAISE WARNING 'snapshot-capture: service_role_key not found in Vault, skipping';
    RETURN;
  END IF;

  -- Build Edge Function URL
  v_function_url := v_project_url || '/functions/v1/capture-dashboard-snapshots';

  -- Invoke Edge Function asynchronously via pg_net
  -- The function processes each user independently (fail-fast pattern)
  SELECT net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000  -- 5 minute timeout
  ) INTO v_request_id;

  RAISE NOTICE 'snapshot-capture: Invoked Edge Function, request_id=%', v_request_id;
END;
$$;

COMMENT ON FUNCTION invoke_snapshot_capture_function() IS
'Invokes the capture-dashboard-snapshots Edge Function via pg_net HTTP POST.
Uses Vault secrets for secure authentication.
Called by pg_cron at 23:00 UTC daily (end of day).
Creates historical snapshots for week-over-week trend accuracy (PERF-02/FUNC-01).';

-- Grant execute to postgres role (pg_cron runs as postgres)
GRANT EXECUTE ON FUNCTION invoke_snapshot_capture_function() TO postgres;

-- =====================================================
-- Step 4: Schedule the cron job (23:00 UTC daily)
-- =====================================================

-- First, remove any existing snapshot-capture cron job to avoid duplicates
SELECT cron.unschedule('snapshot-capture-23h')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'snapshot-capture-23h'
);

-- Schedule new cron job (end of day snapshot)
SELECT cron.schedule(
  'snapshot-capture-23h',          -- Job name (unique identifier)
  '0 23 * * *',                    -- Cron expression: 11:00 PM UTC every day
  $$ SELECT invoke_snapshot_capture_function(); $$
);

-- =====================================================
-- Step 5: Verify setup
-- =====================================================

-- Log successful setup
DO $$
BEGIN
  RAISE NOTICE '=== Dashboard Snapshot Capture Cron Setup Complete ===';
  RAISE NOTICE 'Job Name: snapshot-capture-23h';
  RAISE NOTICE 'Schedule: 0 23 * * * (11:00 PM UTC daily)';
  RAISE NOTICE 'Function: invoke_snapshot_capture_function()';
  RAISE NOTICE 'Purpose: Historical KPI snapshots for week-over-week trends';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify: SELECT * FROM cron.job WHERE jobname = ''snapshot-capture-23h'';';
  RAISE NOTICE 'To test manually: SELECT invoke_snapshot_capture_function();';
  RAISE NOTICE 'To check results: SELECT * FROM dashboard_snapshots ORDER BY created_at DESC LIMIT 10;';
END $$;

-- =====================================================
-- Utility: Manual test and monitoring queries
-- =====================================================

-- View scheduled jobs:
-- SELECT * FROM cron.job WHERE jobname LIKE '%snapshot%';

-- View job run history:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'snapshot-capture-23h')
-- ORDER BY start_time DESC LIMIT 10;

-- View pg_net responses:
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;

-- View recent snapshots:
-- SELECT
--   s.snapshot_date,
--   sa.first_name || ' ' || sa.last_name as sales_name,
--   s.open_opportunities_count,
--   s.activities_count,
--   s.created_at
-- FROM dashboard_snapshots s
-- JOIN sales sa ON s.sales_id = sa.id
-- ORDER BY s.created_at DESC
-- LIMIT 20;

-- Manual trigger for testing:
-- SELECT invoke_snapshot_capture_function();

-- Unschedule if needed:
-- SELECT cron.unschedule('snapshot-capture-23h');

-- =====================================================
-- End of Migration
-- =====================================================
