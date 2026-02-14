-- Migration: Document existing cloud objects for repo parity
-- Purpose: These objects already exist in cloud but weren't tracked in migrations
-- Action: Uses IF NOT EXISTS to safely apply to both environments
--
-- Background: During migration drift reconciliation (2024-12-12), we discovered:
-- 1. digest_opt_in column existed in cloud but had no migration
-- 2. service_role_full_access policy existed in cloud but had no migration
-- This migration documents these objects for repo completeness.

-- 1. Add digest_opt_in column (for daily digest email preference)
-- This column controls whether users receive the daily digest email
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS digest_opt_in BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.sales.digest_opt_in IS
  'User preference for receiving daily digest emails. Defaults to true.';

-- 2. Add service_role_full_access policy (for Edge Functions)
-- This policy allows Edge Functions (running as service_role) full access to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY "service_role_full_access" ON public.sales
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON POLICY "service_role_full_access" ON public.sales IS
  'Allows service_role (Edge Functions) full access to sales table. Required for daily-digest and other background functions.';
