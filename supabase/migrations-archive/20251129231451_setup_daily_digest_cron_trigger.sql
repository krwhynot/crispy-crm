-- =====================================================
-- Setup pg_cron + pg_net for Daily Digest Edge Function Trigger
-- =====================================================
--
-- Purpose: Schedule daily execution of the daily-digest Edge Function
-- Schedule: 7:00 AM UTC every day (0 7 * * *)
--
-- Architecture:
--   - Uses pg_cron for scheduling (runs at 7 AM UTC daily)
--   - Uses pg_net for async HTTP POST to Edge Function
--   - Uses Supabase Vault for secure API key storage
--   - Edge Function handles fail-fast per-user processing
--
-- Timezone Conversions:
--   7 AM UTC = 2 AM EST / 3 AM EDT (Eastern US)
--   7 AM UTC = 11 PM PST (previous day) / 12 AM PDT (Western US)
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

-- pg_cron: Scheduling jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- pg_net: Async HTTP requests (should already exist)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- =====================================================
-- Step 2: Store secrets in Vault (if not already present)
-- =====================================================
-- NOTE: These must be set up manually or via seed.sql for local dev
-- The actual secrets are environment-specific and should NOT be in migrations

-- Check if project_url secret exists, create placeholder comment
DO $$
BEGIN
  -- This is informational - secrets must be added via:
  -- Local: supabase/seed.sql (for local dev)
  -- Cloud: Supabase Dashboard -> Project Settings -> Vault
  RAISE NOTICE 'Ensure vault secrets are configured:';
  RAISE NOTICE '  - project_url: Your Supabase project URL (e.g., https://xyz.supabase.co)';
  RAISE NOTICE '  - service_role_key: Your service role API key';
  RAISE NOTICE 'For local dev, add to supabase/seed.sql';
  RAISE NOTICE 'For cloud, use Supabase Dashboard -> Vault';
END $$;

-- =====================================================
-- Step 3: Create helper function to invoke Edge Function
-- =====================================================

CREATE OR REPLACE FUNCTION invoke_daily_digest_function()
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
    RAISE WARNING 'daily-digest: project_url not found in Vault, skipping';
    RETURN;
  END IF;

  IF v_service_key IS NULL THEN
    RAISE WARNING 'daily-digest: service_role_key not found in Vault, skipping';
    RETURN;
  END IF;

  -- Build Edge Function URL
  v_function_url := v_project_url || '/functions/v1/daily-digest';

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

  RAISE NOTICE 'daily-digest: Invoked Edge Function, request_id=%', v_request_id;
END;
$$;

COMMENT ON FUNCTION invoke_daily_digest_function() IS
'Invokes the daily-digest Edge Function via pg_net HTTP POST.
Uses Vault secrets for secure authentication.
Called by pg_cron at 7 AM UTC daily.';

-- Grant execute to postgres role (pg_cron runs as postgres)
GRANT EXECUTE ON FUNCTION invoke_daily_digest_function() TO postgres;

-- =====================================================
-- Step 4: Schedule the cron job (7 AM UTC daily)
-- =====================================================

-- First, remove any existing daily-digest cron job to avoid duplicates
SELECT cron.unschedule('daily-digest-7am')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-digest-7am'
);

-- Schedule new cron job
SELECT cron.schedule(
  'daily-digest-7am',           -- Job name (unique identifier)
  '0 7 * * *',                  -- Cron expression: 7:00 AM UTC every day
  $$ SELECT invoke_daily_digest_function(); $$
);

-- =====================================================
-- Step 5: Verify setup
-- =====================================================

-- Log successful setup
DO $$
BEGIN
  RAISE NOTICE '=== Daily Digest Cron Setup Complete ===';
  RAISE NOTICE 'Job Name: daily-digest-7am';
  RAISE NOTICE 'Schedule: 0 7 * * * (7:00 AM UTC daily)';
  RAISE NOTICE 'Function: invoke_daily_digest_function()';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify: SELECT * FROM cron.job WHERE jobname = ''daily-digest-7am'';';
  RAISE NOTICE 'To test manually: SELECT invoke_daily_digest_function();';
  RAISE NOTICE 'To check results: SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;';
END $$;

-- =====================================================
-- Utility: Manual test and monitoring queries
-- =====================================================

-- View scheduled jobs:
-- SELECT * FROM cron.job WHERE jobname LIKE '%digest%';

-- View job run history:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-digest-7am')
-- ORDER BY start_time DESC LIMIT 10;

-- View pg_net responses:
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;

-- Manual trigger for testing:
-- SELECT invoke_daily_digest_function();

-- Unschedule if needed:
-- SELECT cron.unschedule('daily-digest-7am');

-- =====================================================
-- End of Migration
-- =====================================================
