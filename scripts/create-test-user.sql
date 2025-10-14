-- Create Test User for Local Development
-- This script creates a test user with email/password authentication
-- Email: test@example.com
-- Password: password123

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth user with proper password hash
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();

  -- Insert into auth.users
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
    email_change_token_new,
    email_change_token_current,
    email_change,
    reauthentication_token,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),  -- Bcrypt hash for 'password123'
    now(),  -- Email already confirmed
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    '',  -- email_change_token_current
    '',  -- email_change (must be empty string, not NULL)
    '',  -- reauthentication_token
    false
  );

  -- Create corresponding identity record in auth.identities
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'test@example.com',  -- provider_id is the email for email provider
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'test@example.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- Create sales record (required by the application)
  INSERT INTO sales (
    user_id,
    first_name,
    last_name,
    email,
    is_admin
  ) VALUES (
    new_user_id,
    'Test',
    'User',
    'test@example.com',
    true  -- Make admin so they have full access
  );

  RAISE NOTICE 'Test user created successfully!';
  RAISE NOTICE 'Email: test@example.com';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE 'User ID: %', new_user_id;
END $$;

-- Verify the user was created
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  s.first_name,
  s.last_name,
  s.is_admin
FROM auth.users u
LEFT JOIN sales s ON s.user_id = u.id
WHERE u.email = 'test@example.com';
