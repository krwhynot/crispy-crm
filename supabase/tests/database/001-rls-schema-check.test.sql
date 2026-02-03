-- ============================================================================
-- 001-rls-schema-check.test.sql
-- ============================================================================
-- PURPOSE: Verify Row Level Security (RLS) is enabled on all public tables
--
-- This test ensures that RLS is enabled on all tables that store business data.
-- RLS provides the first line of defense by ensuring users can only access
-- data they are authorized to see, even if application-level bugs exist.
--
-- Requires: 000-setup-test-hooks.test.sql (pgTAP installation)
--
-- References:
--   - Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
--   - Security Model: /docs/SECURITY_MODEL.md
-- ============================================================================

BEGIN;

-- We test 26 tables for RLS enabled status
SELECT plan(26);

-- ============================================================================
-- HELPER: Check if RLS is enabled on a table
-- Uses pg_class.relrowsecurity to verify RLS status
-- ============================================================================

-- Core business tables
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'activities' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on activities table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'contact_notes' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on contact_notes table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'contacts' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on contacts table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'interaction_participants' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on interaction_participants table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'opportunities' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on opportunities table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'opportunity_notes' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on opportunity_notes table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'opportunity_participants' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on opportunity_participants table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'organization_notes' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on organization_notes table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'organizations' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on organizations table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'products' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on products table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'product_distributors' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on product_distributors table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'sales' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on sales table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'segments' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on segments table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'tags' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on tags table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'tasks_deprecated' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on tasks_deprecated table'
);

-- Notification and audit tables
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'notifications' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on notifications table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'audit_trail' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on audit_trail table'
);

-- Tutorial and user preference tables
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'tutorial_progress' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on tutorial_progress table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_favorites' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on user_favorites table'
);

-- Junction tables for relationships
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'opportunity_contacts' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on opportunity_contacts table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'opportunity_products' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on opportunity_products table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'distributor_principal_authorizations' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on distributor_principal_authorizations table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'product_distributor_authorizations' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on product_distributor_authorizations table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'organization_distributors' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on organization_distributors table'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'dashboard_snapshots' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on dashboard_snapshots table'
);

-- Migration tracking (also needs RLS for admin-only access)
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'migration_history' AND relnamespace = 'public'::regnamespace),
    'RLS should be enabled on migration_history table'
);

SELECT * FROM finish();
ROLLBACK;
