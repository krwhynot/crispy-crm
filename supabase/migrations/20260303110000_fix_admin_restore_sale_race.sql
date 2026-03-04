-- Migration: Fix TOCTOU race in admin_restore_sale
-- Context: When re-inviting a deleted user, handle_new_user() trigger and
-- admin_restore_sale() RPC run in separate transactions. The trigger's UPDATE
-- path can INSERT a new sales row before the RPC's bare INSERT executes,
-- causing a unique constraint violation on sales_user_id_key.
-- Fix: Replace bare INSERT with ON CONFLICT (user_id) DO UPDATE (upsert).

CREATE OR REPLACE FUNCTION public.admin_restore_sale(
  target_user_id uuid,
  new_email text DEFAULT NULL,
  new_first_name text DEFAULT NULL,
  new_last_name text DEFAULT NULL
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  current_user_role user_role;
  result_record sales;
BEGIN
  -- Require authenticated caller
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Require admin role
  SELECT role INTO current_user_role
  FROM sales
  WHERE user_id = current_user_id AND deleted_at IS NULL;

  IF current_user_role IS NULL OR current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can restore sales records'
      USING ERRCODE = 'P0003';
  END IF;

  -- Try to restore existing soft-deleted row
  UPDATE sales
  SET
    deleted_at = NULL,
    email = COALESCE(new_email, email),
    first_name = COALESCE(new_first_name, first_name),
    last_name = COALESCE(new_last_name, last_name),
    updated_at = NOW()
  WHERE user_id = target_user_id AND deleted_at IS NOT NULL
  RETURNING * INTO result_record;

  IF result_record IS NOT NULL THEN
    RETURN result_record;
  END IF;

  -- Check if active row already exists (no restore needed)
  SELECT * INTO result_record
  FROM sales
  WHERE user_id = target_user_id AND deleted_at IS NULL;

  IF result_record IS NOT NULL THEN
    -- Active row exists, just update name/email if provided
    UPDATE sales
    SET
      email = COALESCE(new_email, email),
      first_name = COALESCE(new_first_name, first_name),
      last_name = COALESCE(new_last_name, last_name),
      updated_at = NOW()
    WHERE user_id = target_user_id AND deleted_at IS NULL
    RETURNING * INTO result_record;

    RETURN result_record;
  END IF;

  -- No row at all — upsert to handle race with handle_new_user() trigger
  INSERT INTO sales (
    user_id, email, first_name, last_name, role, disabled,
    created_at, updated_at
  ) VALUES (
    target_user_id,
    COALESCE(new_email, ''),
    COALESCE(new_first_name, ''),
    COALESCE(new_last_name, ''),
    'rep',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, sales.email),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), sales.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), sales.last_name),
    deleted_at = NULL,
    updated_at = NOW()
  RETURNING * INTO result_record;

  RETURN result_record;
END;
$$;

ALTER FUNCTION public.admin_restore_sale(uuid, text, text, text) OWNER TO postgres;

COMMENT ON FUNCTION public.admin_restore_sale(uuid, text, text, text)
  IS 'SECURITY DEFINER: Restores soft-deleted or creates missing sales record for orphan recovery. Admin-only. Uses ON CONFLICT upsert to handle trigger race.';

GRANT EXECUTE ON FUNCTION public.admin_restore_sale(uuid, text, text, text) TO authenticated;
