-- ============================================================================
-- ADD TEST USERS FOR ROLE TESTING
-- ============================================================================
-- Creates admin, manager, and rep test users for RBAC testing
-- Password for all: password123
-- ============================================================================

DO $$
DECLARE
  admin_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
  manager_user_id UUID := 'm0000000-0000-0000-0000-000000000001';
  rep_user_id UUID := 'r0000000-0000-0000-0000-000000000001';
BEGIN
  -- ========================================
  -- 1. ADMIN USER: admin@test.com
  -- ========================================
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      aud, role,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      is_sso_user, is_anonymous
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@test.com',
      crypt('password123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Test Admin"}'::jsonb,
      'authenticated', 'authenticated',
      '', '', '', '', '', '', '', '',
      false, false
    );
    RAISE NOTICE 'Created auth user: admin@test.com';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sales WHERE email = 'admin@test.com') THEN
    INSERT INTO sales (first_name, last_name, email, role, user_id, is_admin, created_at, updated_at)
    VALUES ('Test', 'Admin', 'admin@test.com', 'admin', admin_user_id, true, NOW(), NOW());
    RAISE NOTICE 'Created sales record: admin@test.com (admin role)';
  END IF;

  -- ========================================
  -- 2. MANAGER USER: manager@mfbroker.com
  -- ========================================
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@mfbroker.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      aud, role,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      is_sso_user, is_anonymous
    ) VALUES (
      manager_user_id,
      '00000000-0000-0000-0000-000000000000',
      'manager@mfbroker.com',
      crypt('password123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Test Manager"}'::jsonb,
      'authenticated', 'authenticated',
      '', '', '', '', '', '', '', '',
      false, false
    );
    RAISE NOTICE 'Created auth user: manager@mfbroker.com';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sales WHERE email = 'manager@mfbroker.com') THEN
    INSERT INTO sales (first_name, last_name, email, role, user_id, created_at, updated_at)
    VALUES ('Test', 'Manager', 'manager@mfbroker.com', 'manager', manager_user_id, NOW(), NOW());
    RAISE NOTICE 'Created sales record: manager@mfbroker.com (manager role)';
  END IF;

  -- ========================================
  -- 3. REP USER: rep@mfbroker.com
  -- ========================================
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'rep@mfbroker.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      aud, role,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      is_sso_user, is_anonymous
    ) VALUES (
      rep_user_id,
      '00000000-0000-0000-0000-000000000000',
      'rep@mfbroker.com',
      crypt('password123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Test Rep"}'::jsonb,
      'authenticated', 'authenticated',
      '', '', '', '', '', '', '', '',
      false, false
    );
    RAISE NOTICE 'Created auth user: rep@mfbroker.com';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sales WHERE email = 'rep@mfbroker.com') THEN
    INSERT INTO sales (first_name, last_name, email, role, user_id, created_at, updated_at)
    VALUES ('Test', 'Rep', 'rep@mfbroker.com', 'rep', rep_user_id, NOW(), NOW());
    RAISE NOTICE 'Created sales record: rep@mfbroker.com (rep role)';
  END IF;

  RAISE NOTICE 'SUCCESS: Test users created for role testing';
END $$;

-- Verification query
SELECT s.email, s.role, s.is_admin, u.email as auth_email
FROM sales s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE s.email IN ('admin@test.com', 'manager@mfbroker.com', 'rep@mfbroker.com')
ORDER BY s.role;
