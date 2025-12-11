-- Migration: Add Defense-in-Depth Authorization to SECURITY DEFINER Functions
-- Purpose: Prevent privilege escalation if Edge Function is bypassed
-- Addresses: Zen Audit finding - IDOR risk in database functions
--
-- Security Model:
--   - admin_update_sale: Only admins can change role/disabled; non-admins can only update self
--   - get_sale_by_user_id: Read-only, safe (returns caller's own data based on JWT)
--   - get_sale_by_id: Read-only, safe (used for lookup, authz checked in Edge Function)

-- =====================================================================
-- Function 1: admin_update_sale - ADD AUTHORIZATION CHECKS
-- =====================================================================
-- This is the critical function that can modify user privileges.
-- We add checks to prevent:
--   1. Non-admins from changing anyone's role or disabled status
--   2. Non-admins from modifying other users' profiles

CREATE OR REPLACE FUNCTION admin_update_sale(
  target_user_id UUID,
  new_role user_role DEFAULT NULL,
  new_disabled BOOLEAN DEFAULT NULL,
  new_avatar TEXT DEFAULT NULL
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

  -- AUTHORIZATION CHECK 1: Only admins can change role or disabled status
  IF (new_role IS NOT NULL OR new_disabled IS NOT NULL)
     AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can modify role or disabled status'
      USING ERRCODE = 'P0001';
  END IF;

  -- AUTHORIZATION CHECK 2: Non-admins can only update their own profile
  IF current_user_role != 'admin' AND target_user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only update your own profile'
      USING ERRCODE = 'P0001';
  END IF;

  -- All checks passed - perform the update
  UPDATE sales
  SET
    role = COALESCE(new_role, role),
    disabled = COALESCE(new_disabled, disabled),
    avatar_url = COALESCE(new_avatar, avatar_url),
    updated_at = NOW()
  WHERE user_id = target_user_id AND deleted_at IS NULL
  RETURNING * INTO updated_record;

  -- Return NULL if no record was updated (target doesn't exist)
  RETURN updated_record;
END;
$$;

COMMENT ON FUNCTION admin_update_sale IS
  'SECURITY DEFINER with built-in authorization: Only admins can modify role/disabled. Non-admins can only update their own profile. Defense-in-depth against IDOR attacks.';

-- =====================================================================
-- Function 2: get_sale_by_user_id - No changes needed
-- =====================================================================
-- This function is read-only and only returns data for a specific user_id.
-- The Edge Function passes auth.uid() as the parameter, so it's self-limiting.
-- No authorization change needed - it's already safe by design.

-- =====================================================================
-- Function 3: get_sale_by_id - Add soft authorization check
-- =====================================================================
-- This function looks up a sales record by ID (not user_id).
-- While primarily used by Edge Function for admin operations,
-- we can add a check to ensure caller is either:
--   a) An admin (can look up anyone)
--   b) Looking up their own record

CREATE OR REPLACE FUNCTION get_sale_by_id(target_sale_id INTEGER)
RETURNS sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role user_role;
  target_record sales;
BEGIN
  -- Get current user from Supabase JWT claims
  current_user_id := auth.uid();

  -- If no authenticated user, deny access
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Look up the target record first
  SELECT * INTO target_record
  FROM sales
  WHERE id = target_sale_id AND deleted_at IS NULL;

  -- If target doesn't exist, return NULL (not an error)
  IF target_record IS NULL THEN
    RETURN NULL;
  END IF;

  -- Look up caller's role
  SELECT role INTO current_user_role
  FROM sales
  WHERE user_id = current_user_id AND deleted_at IS NULL;

  -- AUTHORIZATION CHECK: Must be admin OR looking up own record
  IF current_user_role != 'admin' AND target_record.user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only view your own profile'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN target_record;
END;
$$;

COMMENT ON FUNCTION get_sale_by_id IS
  'SECURITY DEFINER with authorization: Admins can look up any user, non-admins can only look up their own record. Defense-in-depth against IDOR.';

-- =====================================================================
-- Grants remain the same - authenticated can execute
-- =====================================================================
-- The functions now self-authorize, so we keep the grants but the
-- functions will reject unauthorized calls internally.

GRANT EXECUTE ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sale_by_id(INTEGER) TO authenticated;
