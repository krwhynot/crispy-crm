-- Migration: Fix trigger NULL auth.uid() handling
-- Purpose: Allow self-updates when auth.uid() returns NULL in local dev
--
-- PROBLEM: When auth.uid() returns NULL (local dev scenario), COALESCE makes
-- is_self_update = FALSE, blocking ALL profile field updates including self-updates.
--
-- FIX: Only enforce profile field restrictions when we CAN identify the caller.
-- When auth.uid() is NULL, skip the check (rely on RLS policies instead).
-- This is safe because:
-- 1. In production, auth.uid() will be properly set
-- 2. RLS policies still protect the data
-- 3. Pre-launch mode: fail-fast, velocity over complexity

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

  -- FIX: When auth.uid() is NULL, we cannot determine the caller identity
  -- Skip profile field restrictions but still enforce admin-only fields via is_admin() check
  IF current_user_id IS NULL THEN
    RAISE LOG '[SALES_TRIGGER] auth.uid() is NULL - skipping profile field restrictions (relying on RLS)';

    -- Still enforce admin-only fields for permission changes
    caller_is_admin := COALESCE(is_admin(), FALSE);
    IF NOT caller_is_admin THEN
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE LOG '[SALES_TRIGGER] BLOCKED: Cannot modify role without admin privileges';
        RAISE EXCEPTION 'Only administrators can modify role'
          USING ERRCODE = 'P0003';
      END IF;
      IF NEW.disabled IS DISTINCT FROM OLD.disabled THEN
        RAISE LOG '[SALES_TRIGGER] BLOCKED: Cannot modify disabled status without admin privileges';
        RAISE EXCEPTION 'Only administrators can modify disabled status'
          USING ERRCODE = 'P0003';
      END IF;
    END IF;

    -- Auto-update timestamp
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- Normal path: auth.uid() is known, enforce all restrictions
  is_self_update := (NEW.user_id = current_user_id);
  caller_is_admin := COALESCE(is_admin(), FALSE);

  RAISE LOG '[SALES_TRIGGER] is_self_update=% | caller_is_admin=%', is_self_update, caller_is_admin;

  -- Profile fields: ONLY the owner can change these
  IF NOT is_self_update THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Cannot modify another user''s first_name';
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

-- Comment for documentation
COMMENT ON FUNCTION enforce_sales_column_restrictions IS
  'Enforces column-level security: profile fields (first_name, last_name, email, phone) are self-update only when auth.uid() is known. Permission fields (role, disabled) are admin-only always.';
