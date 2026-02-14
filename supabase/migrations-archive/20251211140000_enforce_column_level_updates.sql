-- Migration: Enforce column-level update restrictions
-- Purpose: Prevent admins from changing other users' profile fields
-- Profile fields (first_name, last_name, email, phone) = SELF-UPDATE ONLY
-- Permission fields (role, disabled) = ADMIN ONLY
--
-- CRITICAL FIX (2025-12-11): Use COALESCE to handle NULL auth.uid()
-- Bug: PostgreSQL three-valued logic causes (UUID = NULL) to return NULL, not FALSE
-- When IF NOT NULL is evaluated, it's NULL (not TRUE), so the block was skipped!

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
  -- Get current user (may be NULL for service role)
  current_user_id := auth.uid();

  -- CRITICAL FIX: Use COALESCE to handle NULL properly
  -- If auth.uid() is NULL, treat as NOT self-update (more restrictive)
  is_self_update := COALESCE(NEW.user_id = current_user_id, FALSE);
  caller_is_admin := COALESCE(is_admin(), FALSE);

  -- LOG: Always log what's happening (visible in Supabase Dashboard > Logs > Postgres)
  RAISE LOG '[SALES_TRIGGER] UPDATE on sales.id=% | auth.uid()=% | target_user_id=% | is_self_update=% | caller_is_admin=%',
    NEW.id, current_user_id, NEW.user_id, is_self_update, caller_is_admin;

  -- Profile fields: ONLY the owner can change these
  IF NOT is_self_update THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Cannot modify another user''s first_name (old=%, new=%)', OLD.first_name, NEW.first_name;
      RAISE EXCEPTION 'Cannot modify another user''s first_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Cannot modify another user''s last_name';
      RAISE EXCEPTION 'Cannot modify another user''s last_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Cannot modify another user''s email';
      RAISE EXCEPTION 'Cannot modify another user''s email'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Cannot modify another user''s phone';
      RAISE EXCEPTION 'Cannot modify another user''s phone'
        USING ERRCODE = 'P0003';
    END IF;

    RAISE LOG '[SALES_TRIGGER] ALLOWED: Admin updating non-profile fields for another user';
  ELSE
    RAISE LOG '[SALES_TRIGGER] ALLOWED: Self-update on profile fields';
  END IF;

  -- Permission fields: ONLY admins can change these
  IF NOT caller_is_admin THEN
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
  END IF;

  -- Auto-update timestamp
  NEW.updated_at := NOW();

  RAISE LOG '[SALES_TRIGGER] SUCCESS: Update completed for sales.id=%', NEW.id;

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
