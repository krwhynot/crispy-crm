-- =====================================================================
-- Restore Auth Triggers for User-Sales Sync
-- =====================================================================
-- These triggers were excluded when dumping only the public schema.
-- They ensure auth.users table stays in sync with public.sales table.
--
-- Background: The public.sales table relies on triggers on auth.users
-- to automatically create and sync sales records when users sign up
-- or update their information.
-- =====================================================================

-- Drop existing triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Trigger 1: Auto-create sales record when user signs up
-- Calls: public.handle_new_user() function (defined in cloud schema)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Sync email updates from auth.users to sales
-- Calls: public.handle_update_user() function (defined in cloud schema)
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_user();
