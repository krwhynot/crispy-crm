-- =====================================================================
-- CRITICAL: Restore Auth Triggers for User-Sales Sync
-- =====================================================================
-- ⚠️ WARNING: This migration CANNOT be automated by db dump tools
-- Supabase's 'db dump --schema public' excludes auth schema objects.
-- IF YOU CONSOLIDATE MIGRATIONS, THIS FILE MUST BE PRESERVED.
-- =====================================================================
--
-- Background:
-- When users sign up via auth.users, triggers automatically create
-- corresponding sales records. Without these triggers, the 1:1 mapping
-- between auth.users and sales is broken, causing blank pages.
--
-- This migration:
-- 1. Restores the missing triggers on auth.users
-- 2. Backfills sales records for any existing users without them
-- =====================================================================

-- =====================================================================
-- PART 1: Restore Triggers
-- =====================================================================

-- Drop existing triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Trigger 1: Auto-create sales record when user signs up
-- Calls: public.handle_new_user() function (already exists in database)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Sync email updates from auth.users to sales
-- Calls: public.handle_update_user() function (already exists in database)
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_user();

-- =====================================================================
-- PART 2: Backfill Missing Sales Records
-- =====================================================================
-- Find all users in auth.users who don't have a sales record and create one
-- This fixes users who were created while the trigger was missing

INSERT INTO public.sales (user_id, email, first_name, last_name, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.sales s ON u.id = s.user_id
WHERE s.id IS NULL  -- Only insert if sales record doesn't exist
  AND u.deleted_at IS NULL;  -- Skip soft-deleted users

-- Log how many records were backfilled
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backfilled_count
  FROM auth.users u
  LEFT JOIN public.sales s ON u.id = s.user_id
  WHERE s.id IS NULL AND u.deleted_at IS NULL;

  IF backfilled_count > 0 THEN
    RAISE NOTICE 'Backfilled % sales records for existing users', backfilled_count;
  ELSE
    RAISE NOTICE 'No backfill needed - all users have sales records';
  END IF;
END $$;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- After this migration runs, verify:
-- 1. SELECT COUNT(*) FROM auth.users;
-- 2. SELECT COUNT(*) FROM sales;
-- These counts should match (1:1 mapping restored)
