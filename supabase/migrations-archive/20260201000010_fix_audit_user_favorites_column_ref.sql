-- ============================================================================
-- Migration: Fix audit_user_favorites() column reference
-- ============================================================================
-- Bug: Function references sales.auth_user_id which does not exist.
-- Fix: Change to sales.user_id (the correct column name).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_user_favorites()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $function$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_key TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_changed_by BIGINT;
  v_record_id BIGINT;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := '{}'::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id := NEW.user_id;
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_user_id := NEW.user_id;
    v_record_id := NEW.id;
    v_old_data := '{}'::jsonb;
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Map user_id (UUID) to sales.id (BIGINT) for audit_trail.changed_by
  -- Fixed: was referencing non-existent sales.auth_user_id, now uses sales.user_id
  SELECT id INTO v_changed_by FROM sales WHERE user_id = v_user_id;

  FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
    CONTINUE WHEN v_key IN ('created_at', 'updated_at', 'user_id', 'updated_by');

    v_old_value := v_old_data->>v_key;
    v_new_value := v_new_data->>v_key;

    IF v_old_value IS DISTINCT FROM v_new_value THEN
      INSERT INTO audit_trail (
        table_name, record_id, field_name, old_value, new_value, changed_by, changed_at
      ) VALUES (
        TG_TABLE_NAME, v_record_id, v_key, v_old_value, v_new_value, v_changed_by, NOW()
      );
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;
