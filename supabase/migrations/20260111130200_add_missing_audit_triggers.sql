-- ============================================================================
-- Migration: Add audit_changes() triggers to missing tables
-- ============================================================================
-- Audit Issue: DB-003 - Missing audit triggers on tutorial_progress,
--                       dashboard_snapshots, user_favorites
-- Pattern: AFTER INSERT OR UPDATE OR DELETE triggers per audit_trail_system.sql
-- Reference: 20251103232837_create_audit_trail_system.sql
-- ============================================================================

-- Step 1: Add audit trigger to tutorial_progress
-- Note: tutorial_progress has sales_id (not created_by/updated_by), so we need
-- a wrapper function that adapts the schema for audit_changes()
CREATE OR REPLACE FUNCTION audit_tutorial_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_key TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_changed_by BIGINT;
  v_record_id BIGINT;
BEGIN
  -- Get sales_id as the changed_by (tutorial_progress uses sales_id, not updated_by)
  IF TG_OP = 'DELETE' THEN
    v_changed_by := OLD.sales_id;
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := '{}'::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    v_changed_by := NEW.sales_id;
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_changed_by := NEW.sales_id;
    v_record_id := NEW.id;
    v_old_data := '{}'::jsonb;
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Loop through all keys in the new data
  FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
    -- Skip audit metadata fields and timestamps
    CONTINUE WHEN v_key IN ('created_at', 'updated_at', 'sales_id');

    v_old_value := v_old_data->>v_key;
    v_new_value := v_new_data->>v_key;

    -- Only log if value actually changed
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
$$;

CREATE TRIGGER audit_tutorial_progress_changes
  AFTER INSERT OR UPDATE OR DELETE ON tutorial_progress
  FOR EACH ROW
  EXECUTE FUNCTION audit_tutorial_progress();

-- Step 2: Add audit trigger to dashboard_snapshots
-- Note: dashboard_snapshots uses sales_id for ownership
CREATE OR REPLACE FUNCTION audit_dashboard_snapshots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_key TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_changed_by BIGINT;
  v_record_id BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_changed_by := OLD.sales_id;
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := '{}'::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    v_changed_by := NEW.sales_id;
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_changed_by := NEW.sales_id;
    v_record_id := NEW.id;
    v_old_data := '{}'::jsonb;
    v_new_data := to_jsonb(NEW);
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
    CONTINUE WHEN v_key IN ('created_at', 'sales_id');

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
$$;

CREATE TRIGGER audit_dashboard_snapshots_changes
  AFTER INSERT OR UPDATE OR DELETE ON dashboard_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION audit_dashboard_snapshots();

-- Step 3: Add audit trigger to user_favorites
-- Note: user_favorites uses user_id (UUID) for ownership, need to map to sales.id
CREATE OR REPLACE FUNCTION audit_user_favorites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  SELECT id INTO v_changed_by FROM sales WHERE auth_user_id = v_user_id;

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
$$;

CREATE TRIGGER audit_user_favorites_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_favorites();

-- Step 4: Add comments
COMMENT ON FUNCTION audit_tutorial_progress IS 'Audit trigger for tutorial_progress table. Maps sales_id to changed_by.';
COMMENT ON FUNCTION audit_dashboard_snapshots IS 'Audit trigger for dashboard_snapshots table. Maps sales_id to changed_by.';
COMMENT ON FUNCTION audit_user_favorites IS 'Audit trigger for user_favorites table. Maps user_id (UUID) to sales.id for changed_by.';
