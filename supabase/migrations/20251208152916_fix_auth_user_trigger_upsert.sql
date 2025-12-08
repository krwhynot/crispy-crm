-- ============================================================================
-- FIX: Make handle_new_user trigger fire on INSERT OR UPDATE
-- ============================================================================
-- Problem: When auth.users uses ON CONFLICT DO UPDATE, the INSERT-only trigger
-- doesn't fire, so no sales record is created.
-- Solution: Fire on INSERT OR UPDATE and use UPSERT in the function.
-- ============================================================================

-- Drop existing INSERT-only trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger to fire on INSERT OR UPDATE
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update function to use UPSERT pattern (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Use UPSERT to handle both INSERT and UPDATE paths
  INSERT INTO public.sales (
    user_id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'rep'),
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the trigger behavior
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Creates/updates sales record when auth user is inserted or updated. Uses UPSERT for idempotency.';
