-- ============================================================================
-- ADD BRENT RAMSY TO SALES TEAM
-- ============================================================================
-- Creates auth user and links to sales record as Account Manager (rep role)
-- Email: bramsy@masterfoodbokers.com
-- Password: Welcome123!
-- ============================================================================

DO $$
DECLARE
  brent_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if Brent Ramsy already exists in auth.users by email
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'bramsy@masterfoodbokers.com';

  IF existing_user_id IS NOT NULL THEN
    brent_user_id := existing_user_id;
    RAISE NOTICE 'Found existing auth user for bramsy@masterfoodbokers.com: %', brent_user_id;
  ELSE
    -- Generate a random UUID for Brent
    brent_user_id := gen_random_uuid();

    -- Insert into auth.users (requires elevated privileges)
    -- IMPORTANT: Token columns MUST be empty strings, NOT NULL!
    -- GoTrue's Go code crashes on NULL varchar columns (sql.Scan error)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      -- GoTrue token columns - MUST be empty strings to avoid Go scan errors
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
      brent_user_id,
      '00000000-0000-0000-0000-000000000000',
      'bramsy@masterfoodbokers.com',
      crypt('Welcome123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Brent Ramsy"}'::jsonb,
      'authenticated',
      'authenticated',
      -- Empty strings for GoTrue token columns (prevents NULL scan error)
      '', '', '', '', '', '', '', '',
      false,
      false
    );
    RAISE NOTICE 'Created auth user for bramsy@masterfoodbokers.com: %', brent_user_id;
  END IF;

  -- Check if Brent Ramsy already exists in sales
  IF EXISTS (SELECT 1 FROM sales WHERE email = 'bramsy@masterfoodbokers.com') THEN
    RAISE NOTICE 'Brent Ramsy already exists in sales table';
    RETURN;
  END IF;

  -- Add Brent Ramsy to sales team as Account Manager (rep role)
  INSERT INTO sales (first_name, last_name, email, role, user_id, created_at, updated_at)
  VALUES ('Brent', 'Ramsy', 'bramsy@masterfoodbokers.com', 'rep'::user_role, brent_user_id, NOW(), NOW());

  RAISE NOTICE 'SUCCESS: Added Brent Ramsy to sales team with user_id %', brent_user_id;
END $$;

-- Verification query
SELECT id, first_name, last_name, email, role FROM sales ORDER BY id;
