-- ============================================================================
-- FIX: Kyle Ramsy Admin Role + Cleanup Orphaned Auth User
-- ============================================================================
-- Issue: Kyle Ramsy (kjramsy@gmail.com) has role='rep' but needs 'admin'
--        to create organizations (RLS policy requires admin/manager)
--
-- Cleanup: Orphaned auth user bramsy@masterfoodbokers.com (typo - missing 'r')
--          is a duplicate of bramsy@masterfoodbrokers.com
-- ============================================================================

-- 1. Update Kyle Ramsy to admin role
UPDATE sales
SET role = 'admin', updated_at = NOW()
WHERE email = 'kjramsy@gmail.com';

-- 2. Delete orphaned auth user with typo email
-- This user has no linked sales record and is a duplicate
DELETE FROM auth.users
WHERE email = 'bramsy@masterfoodbokers.com';

-- ============================================================================
-- VERIFICATION (run after migration)
-- ============================================================================
-- SELECT id, email, role FROM sales WHERE email = 'kjramsy@gmail.com';
-- Expected: role = 'admin'
--
-- SELECT COUNT(*) FROM auth.users u
-- LEFT JOIN sales s ON s.user_id = u.id
-- WHERE s.id IS NULL;
-- Expected: 0 (no orphaned users)
-- ============================================================================
