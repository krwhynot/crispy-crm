-- Migration: Enforce column-level update restrictions
-- Purpose: Prevent admins from changing other users' profile fields
-- Profile fields (first_name, last_name, email, phone) = SELF-UPDATE ONLY
-- Permission fields (role, disabled) = ADMIN ONLY

-- Create the enforcement trigger function
CREATE OR REPLACE FUNCTION enforce_sales_column_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_self_update BOOLEAN;
  caller_is_admin BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  is_self_update := (NEW.user_id = current_user_id);
  caller_is_admin := is_admin();

  -- Profile fields: ONLY the owner can change these
  IF NOT is_self_update THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
      RAISE EXCEPTION 'Cannot modify another user''s first_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN
      RAISE EXCEPTION 'Cannot modify another user''s last_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Cannot modify another user''s email'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      RAISE EXCEPTION 'Cannot modify another user''s phone'
        USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- Permission fields: ONLY admins can change these
  IF NOT caller_is_admin THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only administrators can modify role'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.disabled IS DISTINCT FROM OLD.disabled THEN
      RAISE EXCEPTION 'Only administrators can modify disabled status'
        USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- Auto-update timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS enforce_sales_column_restrictions_trigger ON sales;

-- Create the trigger
CREATE TRIGGER enforce_sales_column_restrictions_trigger
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION enforce_sales_column_restrictions();

-- Comment for documentation
COMMENT ON FUNCTION enforce_sales_column_restrictions IS
  'Enforces column-level security: profile fields (first_name, last_name, email, phone) are self-update only. Permission fields (role, disabled) are admin-only.';
