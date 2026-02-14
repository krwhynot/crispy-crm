-- ============================================================================
-- POPULATE SALES TEAM NAMES
-- ============================================================================
-- The cloud DB has sales users with emails but no first/last names
-- This makes the dashboard show "team member" instead of actual names
-- ============================================================================

-- Update names based on email patterns
UPDATE sales SET 
  first_name = 'Admin',
  last_name = 'User'
WHERE email = 'admin@test.com' AND (first_name IS NULL OR first_name = '');

UPDATE sales SET 
  first_name = 'Kyle',
  last_name = 'Ramsy'
WHERE email = 'kjramsy@gmail.com' AND (first_name IS NULL OR first_name = '');

UPDATE sales SET 
  first_name = 'Gary',
  last_name = 'Ramsy'
WHERE email = 'gramsy@masterfoodbrokers.com' AND (first_name IS NULL OR first_name = '');

UPDATE sales SET 
  first_name = 'Test',
  last_name = 'User'
WHERE email = 'test@gmail.com' AND (first_name IS NULL OR first_name = '');

UPDATE sales SET 
  first_name = 'Account',
  last_name = 'User'
WHERE email = 'account@gmail.com' AND (first_name IS NULL OR first_name = '');

UPDATE sales SET 
  first_name = 'Sue',
  last_name = 'Martinez'
WHERE email = 'sue@mfbroker.com' AND (first_name IS NULL OR first_name = '');

-- Verification
DO $$
DECLARE
  team_member RECORD;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'UPDATED SALES TEAM NAMES';
  RAISE NOTICE '============================================';
  
  FOR team_member IN 
    SELECT id, first_name, last_name, email FROM sales ORDER BY id
  LOOP
    RAISE NOTICE '  [%] % % (%)', 
      team_member.id,
      COALESCE(team_member.first_name, '(none)'),
      COALESCE(team_member.last_name, '(none)'),
      team_member.email;
  END LOOP;
  
  RAISE NOTICE '============================================';
END $$;
