-- Create audit trail system for field-level change tracking
-- Reference: docs/architecture/adr/0006-field-level-audit-trail-with-database-triggers.md
-- Rationale: PRD requires change history visibility for Opportunities (and by extension Organizations, Contacts)
-- Pattern: Database triggers writing to audit_trail table (industry standard, tamper-proof)

-- 1. Create audit_trail table
CREATE TABLE audit_trail (
  audit_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by BIGINT REFERENCES sales(id),
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE audit_trail IS 'Field-level change tracking for Organizations, Contacts, Opportunities. Values stored as TEXT for simplicity.';

-- 2. Create performance index
-- Optimized for queries like: "Show me all changes to opportunity #123"
CREATE INDEX idx_audit_trail_table_record
  ON audit_trail(table_name, record_id, changed_at DESC);

-- Additional index for user-specific queries: "Show me all changes by Sarah"
CREATE INDEX idx_audit_trail_changed_by
  ON audit_trail(changed_by, changed_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- 4. Grant base permissions (Layer 1)
GRANT SELECT, INSERT ON audit_trail TO authenticated;
GRANT USAGE ON SEQUENCE audit_trail_audit_id_seq TO authenticated;

-- 5. Create RLS policy (Layer 2)
-- Audit trail is read-only for users, write-only for triggers
CREATE POLICY authenticated_select_audit_trail ON audit_trail
  FOR SELECT TO authenticated
  USING (true);  -- All team members can view audit history

-- No INSERT/UPDATE/DELETE policies - only triggers write to this table

-- 6. Create generic audit trigger function
-- Pattern: Compares OLD and NEW row, writes changes to audit_trail
-- SECURITY DEFINER ensures triggers can write even without user INSERT permission
CREATE OR REPLACE FUNCTION public.audit_changes()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_key TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_changed_by BIGINT;
  v_record_id BIGINT;
BEGIN
  -- Get the sales.id (user identifier) from the changed record
  -- Pattern: All audited tables have created_by/updated_by fields
  IF TG_OP = 'DELETE' THEN
    v_changed_by := OLD.updated_by;  -- Last person who touched the record
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := '{}'::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    v_changed_by := NEW.updated_by;
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_changed_by := NEW.created_by;
    v_record_id := NEW.id;
    v_old_data := '{}'::jsonb;
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Loop through all keys in the new data
  FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
    -- Skip audit metadata fields and timestamps to avoid noise
    CONTINUE WHEN v_key IN ('created_at', 'updated_at', 'created_by', 'updated_by');

    v_old_value := v_old_data->>v_key;
    v_new_value := v_new_data->>v_key;

    -- Only log if value actually changed
    IF v_old_value IS DISTINCT FROM v_new_value THEN
      INSERT INTO audit_trail (
        table_name,
        record_id,
        field_name,
        old_value,
        new_value,
        changed_by,
        changed_at
      ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        v_key,
        v_old_value,
        v_new_value,
        v_changed_by,
        NOW()
      );
    END IF;
  END LOOP;

  -- For DELETE, also capture fields that existed in OLD but not in NEW
  IF TG_OP = 'DELETE' THEN
    FOR v_key IN SELECT jsonb_object_keys(v_old_data) LOOP
      CONTINUE WHEN v_key IN ('created_at', 'updated_at', 'created_by', 'updated_by');
      CONTINUE WHEN v_new_data ? v_key;  -- Skip if already processed above

      v_old_value := v_old_data->>v_key;

      INSERT INTO audit_trail (
        table_name,
        record_id,
        field_name,
        old_value,
        new_value,
        changed_by,
        changed_at
      ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        v_key,
        v_old_value,
        NULL,
        v_changed_by,
        NOW()
      );
    END LOOP;
  END IF;

  -- Trigger functions must return something
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.audit_changes IS 'Generic trigger function for field-level change tracking. Compares OLD and NEW rows, writes changes to audit_trail table.';

-- 7. Attach triggers to audited tables
-- Pattern: AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW

CREATE TRIGGER audit_organizations_changes
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes();

-- Note: Soft deletes (deleted_at) are captured as UPDATE operations
-- Hard deletes trigger DELETE operation logging

-- Future optimization: Table partitioning by changed_at (monthly/quarterly)
-- See ADR-0006 for partitioning implementation when audit_trail grows beyond 1M rows
