-- Migration: Fix Auth User Deletion FK Violation
-- Problem: Deleting auth.users fails with 500 because CASCADE on sales
--          hits RESTRICT FKs on dashboard_snapshots and other tables.
-- Solution: SET NULL on auth FKs + BEFORE DELETE trigger soft-deletes
--           sales row + handle_new_user() restores on re-invite.

-- ============================================================
-- Step 1: Fix blocking FKs to auth.users(id)
-- ============================================================

-- 1a. sales: CASCADE → SET NULL
--     When auth user is deleted, keep the sales row but clear user_id.
--     The BEFORE DELETE trigger (Step 2) will soft-delete the row first.
ALTER TABLE public.sales DROP CONSTRAINT sales_user_id_fkey;
ALTER TABLE public.sales ADD CONSTRAINT sales_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1b. segments: NO ACTION → SET NULL
--     Segments track who created them; losing creator reference is acceptable.
ALTER TABLE public.segments DROP CONSTRAINT industries_created_by_fkey;
ALTER TABLE public.segments ADD CONSTRAINT industries_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- Step 2: BEFORE DELETE trigger to soft-delete the sales row
-- ============================================================
-- Fires BEFORE the FK SET NULL clears user_id, so we can still match.
-- This ensures the sales row (and all its downstream FK references)
-- survives the auth user deletion.

CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.sales
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE user_id = OLD.id AND deleted_at IS NULL;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_soft_delete_sales_on_user_delete ON auth.users;
CREATE TRIGGER trg_soft_delete_sales_on_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deletion();

-- ============================================================
-- Step 3: Replace handle_new_user() with restore logic
-- ============================================================
-- INSERT path: tries to restore a soft-deleted sales row by email match.
--   - 1 match  → restore (re-link user_id, clear deleted_at)
--   - 0 matches → normal insert
--   - 2+ matches → raise exception (admin must resolve duplicates first)
-- UPDATE path: upsert-if-missing safety net, sync email only on conflict.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO '' AS $$
DECLARE
  restored_id bigint;
  candidate_count int;
  parsed_role public.user_role;
BEGIN
  -- === UPDATE path: sync email, upsert if row somehow missing ===
  IF TG_OP = 'UPDATE' THEN
    BEGIN
      parsed_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    EXCEPTION WHEN OTHERS THEN
      parsed_role := 'rep';
    END;

    INSERT INTO public.sales (
      user_id, email, first_name, last_name, role, created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(parsed_role, 'rep'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
    RETURN NEW;
  END IF;

  -- === INSERT path only below ===

  BEGIN
    parsed_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    parsed_role := 'rep';
  END;

  -- Try to restore a soft-deleted sales row by case-insensitive email match
  SELECT count(*) INTO candidate_count
  FROM public.sales
  WHERE lower(email) = lower(NEW.email)
    AND deleted_at IS NOT NULL
    AND user_id IS NULL;

  IF candidate_count = 1 THEN
    UPDATE public.sales
    SET user_id = NEW.id,
        email = NEW.email,
        first_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), first_name),
        last_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), last_name),
        deleted_at = NULL,
        updated_at = NOW()
    WHERE lower(email) = lower(NEW.email)
      AND deleted_at IS NOT NULL
      AND user_id IS NULL
    RETURNING id INTO restored_id;
  ELSIF candidate_count > 1 THEN
    RAISE EXCEPTION 'Cannot auto-restore: % soft-deleted sales rows match email %. Use admin_resolve_duplicate_sales() to resolve manually.',
      candidate_count, NEW.email;
  END IF;

  -- If no restore (0 candidates), normal insert
  IF restored_id IS NULL THEN
    INSERT INTO public.sales (
      user_id, email, first_name, last_name, role, created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(parsed_role, 'rep'),
      NEW.created_at,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Step 4: Admin RPC to resolve duplicate-email collisions
-- ============================================================
-- When handle_new_user() encounters 2+ soft-deleted sales rows
-- matching the same email, an admin must pick which one to keep.
-- Non-kept rows get their email tombstoned (__retired__<id>__<email>)
-- so they become invisible to the email-based restore logic,
-- while preserving all FK references intact.

CREATE OR REPLACE FUNCTION public.admin_resolve_duplicate_sales(
  target_email text,
  keep_sales_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  current_user_role user_role;
  valid_candidate boolean;
BEGIN
  -- Admin-only guard
  SELECT role INTO current_user_role FROM public.sales
  WHERE user_id = auth.uid() AND deleted_at IS NULL;

  IF current_user_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can resolve duplicate sales rows';
  END IF;

  -- Validate keep_sales_id belongs to the candidate set
  SELECT EXISTS (
    SELECT 1 FROM public.sales
    WHERE id = keep_sales_id
      AND lower(email) = lower(target_email)
      AND deleted_at IS NOT NULL
      AND user_id IS NULL
  ) INTO valid_candidate;

  IF NOT valid_candidate THEN
    RAISE EXCEPTION 'sales_id % is not a valid soft-deleted candidate for email %',
      keep_sales_id, target_email;
  END IF;

  -- Retire non-kept duplicates by tombstoning their email
  UPDATE public.sales
  SET email = '__retired__' || id || '__' || email,
      updated_at = NOW()
  WHERE lower(email) = lower(target_email)
    AND deleted_at IS NOT NULL
    AND user_id IS NULL
    AND id != keep_sales_id;
END;
$$;

COMMENT ON FUNCTION public.admin_resolve_duplicate_sales(text, bigint)
IS 'Retires duplicate soft-deleted sales rows by tombstoning email. Preserves all FK references. Admin-only. Use when handle_new_user() raises candidate_count > 1 exception.';

GRANT EXECUTE ON FUNCTION public.admin_resolve_duplicate_sales(text, bigint) TO authenticated;
