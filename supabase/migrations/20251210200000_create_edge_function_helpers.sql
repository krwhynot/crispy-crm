-- =====================================================================
-- SECURITY DEFINER functions for Edge Function user management
-- These functions allow Edge Functions to access sales table securely
-- following the principle of least privilege (Zen audit recommendation)
-- =====================================================================

-- Function 1: Get user's sales profile (for auth validation in Edge Function)
-- Returns single row (not SETOF) for compatibility with Supabase JS .single()
CREATE OR REPLACE FUNCTION get_sale_by_user_id(target_user_id UUID)
RETURNS sales
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM sales WHERE user_id = target_user_id AND deleted_at IS NULL LIMIT 1;
$$;

COMMENT ON FUNCTION get_sale_by_user_id IS
  'SECURITY DEFINER: Allows Edge Functions to fetch sales profile for JWT-authenticated user';

-- Function 2: Update user role/disabled (admin operations)
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
  updated_record sales;
BEGIN
  UPDATE sales
  SET
    role = COALESCE(new_role, role),
    disabled = COALESCE(new_disabled, disabled),
    avatar_url = COALESCE(new_avatar, avatar_url),
    updated_at = NOW()
  WHERE user_id = target_user_id
  RETURNING * INTO updated_record;

  RETURN updated_record;
END;
$$;

COMMENT ON FUNCTION admin_update_sale IS
  'SECURITY DEFINER: Admin-only updates for role, disabled, avatar via Edge Function';

-- Grant execute to authenticated (Edge Function validates admin role before calling)
GRANT EXECUTE ON FUNCTION get_sale_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT) TO authenticated;
