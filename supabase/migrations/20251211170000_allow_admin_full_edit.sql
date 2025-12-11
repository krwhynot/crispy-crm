-- Migration: Allow admins full edit access to all user fields
-- Purpose: Admins should be able to edit ANY field for ANY user
--
-- REQUIREMENTS (as clarified by user):
-- 1. Admins CAN edit their own profile (first_name, last_name, email, phone)
-- 2. Admins CAN change any user's permissions (role, disabled)
-- 3. Admins CAN edit another user's profile fields ← NEW
-- 4. Non-admins can only edit their own profile fields
-- 5. Non-admins cannot change permissions (role, disabled)

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
  -- Get current user (may be NULL for service role or local dev)
  current_user_id := auth.uid();

  -- LOG: Always log what's happening
  RAISE LOG '[SALES_TRIGGER] UPDATE on sales.id=% | auth.uid()=% | target_user_id=%',
    NEW.id, current_user_id, NEW.user_id;

  -- Check if caller is admin
  caller_is_admin := COALESCE(is_admin(), FALSE);

  -- ADMIN BYPASS: Admins can edit ANY field for ANY user
  IF caller_is_admin THEN
    RAISE LOG '[SALES_TRIGGER] ALLOWED: Admin has full edit access';
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- NON-ADMIN PATH: Enforce restrictions

  -- When auth.uid() is NULL, we cannot determine the caller identity
  -- For non-admins, this is a problem - block the update
  IF current_user_id IS NULL THEN
    RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin with NULL auth.uid() cannot update';
    RAISE EXCEPTION 'Authentication required for this operation'
      USING ERRCODE = 'P0003';
  END IF;

  -- Check if this is a self-update
  is_self_update := (NEW.user_id = current_user_id);

  RAISE LOG '[SALES_TRIGGER] is_self_update=% | caller_is_admin=%', is_self_update, caller_is_admin;

  -- Profile fields: Non-admins can only change their OWN profile
  IF NOT is_self_update THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s first_name';
      RAISE EXCEPTION 'Cannot modify another user''s first_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s last_name';
      RAISE EXCEPTION 'Cannot modify another user''s last_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s email';
      RAISE EXCEPTION 'Cannot modify another user''s email'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s phone';
      RAISE EXCEPTION 'Cannot modify another user''s phone'
        USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- Permission fields: ONLY admins can change these (already handled above for admins)
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin tried to modify role';
    RAISE EXCEPTION 'Only administrators can modify role'
      USING ERRCODE = 'P0003';
  END IF;
  IF NEW.disabled IS DISTINCT FROM OLD.disabled THEN
    RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin tried to modify disabled status';
    RAISE EXCEPTION 'Only administrators can modify disabled status'
      USING ERRCODE = 'P0003';
  END IF;

  -- Auto-update timestamp
  NEW.updated_at := NOW();

  RAISE LOG '[SALES_TRIGGER] SUCCESS: Self-update completed for sales.id=%', NEW.id;

  RETURN NEW;
END;
$$;

-- Comment for documentation
COMMENT ON FUNCTION enforce_sales_column_restrictions IS
  'Enforces column-level security: Admins have full access. Non-admins can only edit their own profile fields and cannot change permissions.';
