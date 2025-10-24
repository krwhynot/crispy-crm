-- Seed data for development
-- This file runs automatically after migrations on `supabase db reset`
--
-- NOTE: This seeds only the test user. To seed the full migration data
-- (segments, organizations, contacts), run the script after reset:
-- ./scripts/seed-migration-data.sh

-- ============================================================================
-- Create test user (admin@test.com / password123)
-- ============================================================================

-- Note: Password is auto-confirmed in local environment
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at;

-- Note: Sales record is auto-created by database trigger when auth.users is inserted

-- ============================================================================
-- Organizations Seed Data
-- ============================================================================
-- Note: This section uses \copy which must be run via psql client.
-- Supabase CLI's db reset doesn't support \copy commands in seed.sql.
--
-- To seed organizations data, run after db reset:
--   npm run db:local:seed-orgs
--
-- Or manually:
--   psql $DB_URL -c "\copy organizations (name, organization_type, parent_organization_id, priority, segment_id, website, phone, email, address, city, state, postal_code, notes, logo_url, linkedin_url, annual_revenue, employee_count, founded_year, tax_identifier, context_links, sales_id, created_by, updated_by, deleted_at, import_session_id) FROM '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_final.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '')"
--
-- ============================================================================
