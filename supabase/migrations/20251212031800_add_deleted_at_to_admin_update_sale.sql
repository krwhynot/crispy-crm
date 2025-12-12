-- Migration: Add new_deleted_at parameter to admin_update_sale
-- Purpose: Fix Edge Function 500 error when admin edits user profiles
-- Root Cause: Edge Function passes 5 parameters but function only accepted 4
--
-- The Edge Function at supabase/functions/users/index.ts calls:
--   admin_update_sale(target_user_id, new_role, new_disabled, new_avatar, new_deleted_at)
-- But the existing function only accepted 4 parameters (missing new_deleted_at)

-- Create the 5-parameter version of admin_update_sale
CREATE OR REPLACE FUNCTION admin_update_sale(
  target_user_id UUID,
  new_role user_role DEFAULT NULL,
  new_disabled BOOLEAN DEFAULT NULL,
  new_avatar TEXT DEFAULT NULL,
  new_deleted_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role user_role;
  updated_record sales;
BEGIN
  -- Get current user from Supabase JWT claims
  current_user_id := auth.uid();

  -- If no authenticated user, deny access
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Look up caller's role from sales table
  SELECT role INTO current_user_role
  FROM sales
  WHERE user_id = current_user_id AND deleted_at IS NULL;

  -- If caller has no sales record, deny access
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0001';
  END IF;

  -- AUTHORIZATION CHECK 1: Only admins can change role, disabled status, or soft-delete
  IF (new_role IS NOT NULL OR new_disabled IS NOT NULL OR new_deleted_at IS NOT NULL)
     AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can modify role, disabled status, or delete users'
      USING ERRCODE = 'P0003'; -- maps to 403
  END IF;

  -- AUTHORIZATION CHECK 2: Non-admins can only update their own profile
  IF current_user_role != 'admin' AND target_user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only update your own profile'
      USING ERRCODE = 'P0003'; -- maps to 403
  END IF;

  -- All checks passed - perform the update
  UPDATE sales
  SET
    role = COALESCE(new_role, role),
    disabled = COALESCE(new_disabled, disabled),
    avatar_url = COALESCE(new_avatar, avatar_url),
    deleted_at = COALESCE(new_deleted_at, deleted_at),
    updated_at = NOW()
  WHERE user_id = target_user_id AND (deleted_at IS NULL OR new_deleted_at IS NOT NULL)
  RETURNING * INTO updated_record;

  -- Raise error if target user doesn't exist
  IF updated_record IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0004'; -- maps to 404
  END IF;

  RETURN updated_record;
END;
$$;

COMMENT ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT, TIMESTAMPTZ) IS
  'SECURITY DEFINER with authorization: Only admins can modify role/disabled/deleted_at. Non-admins can only update their own avatar. 5-parameter version supports soft-delete.';

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT, TIMESTAMPTZ) TO authenticated;

-- Error Code Reference:
-- P0001 = 401 Unauthorized (no valid JWT or user profile missing)
-- P0003 = 403 Forbidden (valid JWT but not authorized for this action)
-- P0004 = 404 Not Found (target resource doesn't exist)
