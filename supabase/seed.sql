-- Seed data for development
-- This file runs automatically after migrations on `supabase db reset`
--
-- Seeds:
-- - Test user (admin@test.com / password123)
-- - 16 Principal organizations

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

-- Insert Principal Organizations
-- Note: created_by and updated_by will be auto-populated by database defaults
INSERT INTO organizations (name, organization_type) VALUES
  ('Kaufholds', 'principal'),
  ('Frites Street', 'principal'),
  ('Better Balance', 'principal'),
  ('VAF', 'principal'),
  ('Ofk', 'principal'),
  ('Annasea', 'principal'),
  ('Wicks', 'principal'),
  ('RJC', 'principal'),
  ('Kayco', 'principal'),
  ('Abdale', 'principal'),
  ('Mccrum', 'principal'),
  ('Rapid Rasoi', 'principal'),
  ('SWAP', 'principal'),
  ('Never Better', 'principal'),
  ('TCFB', 'principal'),
  ('Mrs Ressler''s', 'principal');

-- ============================================================================
