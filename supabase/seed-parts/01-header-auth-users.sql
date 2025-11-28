-- ============================================================================
-- CRISPY-CRM SEED DATA
-- Generated: 2025-11-28
-- Version: 2.0 (Minimal - ~500 records)
-- ============================================================================
--
-- Contents:
--   - 6 Users (Full MFB team)
--   - 9 Principals (manufacturers)
--   - 10 Distributors
--   - 20 Customers (operators/restaurants)
--   - ~80 Contacts (2-3 per org)
--   - 36 Products (4 per principal)
--   - 50 Opportunities (even stage distribution)
--   - 150 Activities (all 13 types)
--   - 40 Tasks (including overdue)
--   - 75 Notes
--   - 10 Tags
--   - 28 Segments
--
-- Test credentials:
--   Admin: admin@test.com / password123
--   Rep:   brent@mfb.com / password123
--         michelle@mfb.com / password123
--         gary@mfb.com / password123
--         dale@mfb.com / password123
--         sue@mfb.com / password123
-- ============================================================================

-- Clean up existing data (in correct order for FK constraints)
-- Note: contact_organizations, contact_tags, contact_preferred_principals were deprecated/removed
TRUNCATE TABLE "public"."organizationNotes" CASCADE;
TRUNCATE TABLE "public"."contactNotes" CASCADE;
TRUNCATE TABLE "public"."opportunityNotes" CASCADE;
TRUNCATE TABLE "public"."tasks" CASCADE;
TRUNCATE TABLE "public"."activities" CASCADE;
TRUNCATE TABLE "public"."opportunity_products" CASCADE;
TRUNCATE TABLE "public"."opportunities" CASCADE;
TRUNCATE TABLE "public"."tags" CASCADE;
TRUNCATE TABLE "public"."contacts" CASCADE;
TRUNCATE TABLE "public"."products" CASCADE;
TRUNCATE TABLE "public"."organizations" CASCADE;
TRUNCATE TABLE "public"."segments" CASCADE;
TRUNCATE TABLE "public"."sales" CASCADE;

-- Clean auth.users (local dev only - will fail gracefully in cloud)
DELETE FROM auth.users WHERE email IN (
  'admin@test.com',
  'brent@mfb.com',
  'michelle@mfb.com',
  'gary@mfb.com',
  'dale@mfb.com',
  'sue@mfb.com'
);

-- ============================================================================
-- PART 1: AUTH USERS (6 users)
-- ============================================================================
-- MFB Team Structure:
--   - Brent Gustafson (Admin/Owner)
--   - Michelle Gustafson (Manager)
--   - Gary (Sales Rep)
--   - Dale (Sales Rep)
--   - Sue (Sales Rep)
--   - Admin Test User (for testing)
-- ============================================================================

-- User UUIDs (fixed for referential integrity)
-- These will be referenced by the sales table
DO $$
DECLARE
  v_admin_uid UUID := 'a0000000-0000-0000-0000-000000000001';
  v_brent_uid UUID := 'b0000000-0000-0000-0000-000000000001';
  v_michelle_uid UUID := 'c0000000-0000-0000-0000-000000000001';
  v_gary_uid UUID := 'd0000000-0000-0000-0000-000000000001';
  v_dale_uid UUID := 'e0000000-0000-0000-0000-000000000001';
  v_sue_uid UUID := 'f0000000-0000-0000-0000-000000000001';
BEGIN
  -- Admin Test User
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token
  ) VALUES (
    v_admin_uid,
    '00000000-0000-0000-0000-000000000000',
    'admin@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '', '', '', '', '', '', '', ''
  );

  -- Brent Gustafson (Owner/Admin)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_brent_uid,
    '00000000-0000-0000-0000-000000000000',
    'brent@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Brent Gustafson"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Michelle Gustafson (Manager)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_michelle_uid,
    '00000000-0000-0000-0000-000000000000',
    'michelle@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Michelle Gustafson"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Gary (Sales Rep)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_gary_uid,
    '00000000-0000-0000-0000-000000000000',
    'gary@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Gary"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Dale (Sales Rep)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_dale_uid,
    '00000000-0000-0000-0000-000000000000',
    'dale@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dale"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Sue (Sales Rep)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_sue_uid,
    '00000000-0000-0000-0000-000000000000',
    'sue@mfb.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Sue"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );
END $$;
