-- ============================================================================
-- 000-setup-test-hooks.test.sql
-- ============================================================================
-- PURPOSE: Initialize pgTAP testing infrastructure for Crispy CRM
-- RUNS FIRST: Alphabetically ordered (000) to ensure setup before other tests
--
-- This file installs:
--   1. pgTAP extension for database testing
--   2. Supabase test helpers for user/auth simulation
--   3. Verifies setup with sanity checks
--
-- References:
--   - Supabase Testing Guide: https://supabase.com/docs/guides/local-development/testing
--   - pgTAP Documentation: https://pgtap.org
--   - Test Helpers: https://database.dev/basejump/supabase_test_helpers
-- ============================================================================

-- Install pgtap extension for testing (if not already present)
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================================
-- SANITY CHECK: Verify pgTAP is available
-- ============================================================================
BEGIN;
SELECT plan(3);

-- Test 1: Verify pgtap extension is installed
SELECT has_extension('pgtap', 'pgTAP extension should be installed');

-- Test 2: Verify we can use pgTAP functions
SELECT pass('pgTAP functions are accessible');

-- Test 3: Verify extensions schema exists
SELECT has_schema('extensions', 'extensions schema should exist');

SELECT * FROM finish();
ROLLBACK;
