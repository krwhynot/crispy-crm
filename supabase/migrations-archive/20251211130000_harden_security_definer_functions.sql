-- Migration: Harden SECURITY DEFINER Functions
-- Purpose: Address security audit findings:
--   1. get_sale_by_user_id has no authorization (user enumeration risk)
--   2. Missing REVOKE PUBLIC EXECUTE
--   3. admin_update_sale returns NULL silently on missing user
--   4. Proper error codes for HTTP mapping

-- =====================================================================
-- Finding 1: get_sale_by_user_id - Add self-access enforcement
-- =====================================================================
-- Current: Any authenticated user can pass any target_user_id and enumerate users
-- Fix: Only allow self-lookup (caller can only fetch their own record)

CREATE OR REPLACE FUNCTION get_sale_by_user_id(target_user_id UUID)
RETURNS sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  result_record sales;
BEGIN
  current_user_id := auth.uid();

  -- Must be authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Can only look up own record (self-access only)
  IF target_user_id != current_user_id THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = 'P0003'; -- maps to 403
  END IF;

  SELECT * INTO result_record
  FROM sales
  WHERE user_id = target_user_id AND deleted_at IS NULL
  LIMIT 1;

  RETURN result_record;
END;
$$;

COMMENT ON FUNCTION get_sale_by_user_id IS
  'SECURITY DEFINER with self-access enforcement: Users can only fetch their own profile. Prevents user enumeration attacks.';

-- =====================================================================
-- Finding 3: admin_update_sale - Add NOT FOUND error
-- =====================================================================
-- Current: Returns NULL if target user doesn't exist (silent failure)
-- Fix: Raise exception with proper error code

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
    updated_at = NOW()
  WHERE user_id = target_user_id AND deleted_at IS NULL
  RETURNING * INTO updated_record;

  -- NEW: Raise error if target user doesn't exist
  IF updated_record IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0004'; -- maps to 404
  END IF;

  RETURN updated_record;
END;
$$;

COMMENT ON FUNCTION admin_update_sale IS
  'SECURITY DEFINER with authorization: Only admins can modify role/disabled. Non-admins can only update their own profile. Returns 404 if target not found.';

-- =====================================================================
-- Finding 2: REVOKE PUBLIC EXECUTE
-- =====================================================================
-- Belt-and-suspenders: Ensure only authenticated role can execute these functions

REVOKE ALL ON FUNCTION get_sale_by_user_id(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_sale_by_id(INTEGER) FROM PUBLIC;

-- Grant only to authenticated
GRANT EXECUTE ON FUNCTION get_sale_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sale_by_id(INTEGER) TO authenticated;

-- =====================================================================
-- Error Code Reference (for Edge Function mapping)
-- =====================================================================
-- P0001 = 401 Unauthorized (no valid JWT or user profile missing)
-- P0003 = 403 Forbidden (valid JWT but not authorized for this action)
-- P0004 = 404 Not Found (target resource doesn't exist)
