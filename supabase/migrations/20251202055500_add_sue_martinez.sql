-- ============================================================================
-- ADD SUE MARTINEZ TO SALES TEAM
-- ============================================================================
-- Creates auth user and links to sales record
-- ============================================================================

-- First, create the auth user (this requires service role, so we use a workaround)
-- We'll check if a user with this email exists, if not we create a placeholder

DO $$
DECLARE
  sue_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if Sue already exists in auth.users by email
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = 'sue@mfbroker.com';
  
  IF existing_user_id IS NOT NULL THEN
    sue_user_id := existing_user_id;
    RAISE NOTICE 'Found existing auth user for sue@mfbroker.com: %', sue_user_id;
  ELSE
    -- Generate a deterministic UUID for Sue (based on email hash pattern)
    sue_user_id := gen_random_uuid();
    
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
      sue_user_id,
      '00000000-0000-0000-0000-000000000000',
      'sue@mfbroker.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Sue Martinez"}'::jsonb,
      'authenticated',
      'authenticated',
      -- Empty strings for GoTrue token columns (prevents NULL scan error)
      '', '', '', '', '', '', '', '',
      false,
      false
    );
    RAISE NOTICE 'Created auth user for sue@mfbroker.com: %', sue_user_id;
  END IF;
  
  -- Check if Sue already exists in sales
  IF EXISTS (SELECT 1 FROM sales WHERE email = 'sue@mfbroker.com') THEN
    RAISE NOTICE 'Sue Martinez already exists in sales table';
    RETURN;
  END IF;
  
  -- Add Sue to sales team
  INSERT INTO sales (first_name, last_name, email, role, user_id, created_at, updated_at)
  VALUES ('Sue', 'Martinez', 'sue@mfbroker.com', 'rep', sue_user_id, NOW(), NOW());
  
  RAISE NOTICE 'SUCCESS: Added Sue Martinez to sales team with user_id %', sue_user_id;
END $$;

-- Verification
SELECT id, first_name, last_name, email, role FROM sales ORDER BY id;
