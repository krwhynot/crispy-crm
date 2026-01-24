-- Batch 3, Q13: Audit critical fields only - stage, account_manager, status changes
-- Decision: Log only business-critical field changes, not all updates
-- Rationale: Reduce audit storage bloat while enabling key debugging ("who moved this opp backward?")

-- ====================
-- FUNCTION: Audit Critical Field Changes
-- ====================
CREATE OR REPLACE FUNCTION audit_critical_field_changes()
RETURNS TRIGGER AS $$
DECLARE
  critical_fields TEXT[];
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Define critical fields per table (business-impacting changes only)
  critical_fields := CASE TG_TABLE_NAME
    WHEN 'opportunities' THEN
      -- Revenue-impacting fields: stage moves, ownership changes, win/loss reasons
      ARRAY['stage', 'account_manager_id', 'status', 'win_reason', 'loss_reason', 'deleted_at']
    WHEN 'contacts' THEN
      -- Relationship changes: org reassignment, archival
      ARRAY['organization_id', 'deleted_at']
    WHEN 'organizations' THEN
      -- Type/status changes: principal → distributor, active → inactive
      ARRAY['organization_type', 'status', 'deleted_at']
    WHEN 'sales' THEN
      -- Permission changes: role escalation, user disablement
      ARRAY['role', 'disabled']
    ELSE 
      -- No critical fields defined for other tables
      ARRAY[]::TEXT[]
  END;

  -- Log changes to critical fields (only if value actually changed)
  FOREACH field_name IN ARRAY critical_fields LOOP
    -- Dynamically extract old and new values for this field
    EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name)
      INTO old_val, new_val 
      USING OLD, NEW;

    -- Log only if value changed (IS DISTINCT FROM handles NULLs correctly)
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO audit_trail (
        table_name, 
        record_id, 
        field_name, 
        old_value, 
        new_value, 
        changed_by
      )
      VALUES (
        TG_TABLE_NAME, 
        NEW.id, 
        field_name, 
        old_val, 
        new_val, 
        public.current_sales_id()
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_critical_field_changes() IS
'Batch 3 Q13: Log critical field changes only - stage moves, reassignments, status changes.
Uses existing audit_trail table. Enables debugging "who moved this opp backward?" questions.
SECURITY DEFINER: Runs with creator privileges to ensure audit_trail INSERT succeeds.';

-- ====================
-- ATTACH TRIGGERS TO CRITICAL TABLES
-- ====================
-- Check if trigger exists first to avoid duplicates (idempotent migration)
DO $$
BEGIN
  -- Opportunities (most critical - revenue impact)
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_critical_opportunities'
  ) THEN
    CREATE TRIGGER audit_critical_opportunities
      AFTER UPDATE ON opportunities
      FOR EACH ROW 
      EXECUTE FUNCTION audit_critical_field_changes();
  END IF;

  -- Contacts (relationship tracking)
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_critical_contacts'
  ) THEN
    CREATE TRIGGER audit_critical_contacts
      AFTER UPDATE ON contacts
      FOR EACH ROW 
      EXECUTE FUNCTION audit_critical_field_changes();
  END IF;

  -- Organizations (type/status changes)
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_critical_organizations'
  ) THEN
    CREATE TRIGGER audit_critical_organizations
      AFTER UPDATE ON organizations
      FOR EACH ROW 
      EXECUTE FUNCTION audit_critical_field_changes();
  END IF;

  -- Sales (permission escalation tracking)
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_critical_sales'
  ) THEN
    CREATE TRIGGER audit_critical_sales
      AFTER UPDATE ON sales
      FOR EACH ROW 
      EXECUTE FUNCTION audit_critical_field_changes();
  END IF;
END $$;

COMMENT ON TRIGGER audit_critical_opportunities ON opportunities IS
'Logs critical field changes: stage, account_manager_id, status, win_reason, loss_reason, deleted_at';

COMMENT ON TRIGGER audit_critical_contacts ON contacts IS
'Logs critical field changes: organization_id, deleted_at';

COMMENT ON TRIGGER audit_critical_organizations ON organizations IS
'Logs critical field changes: organization_type, status, deleted_at';

COMMENT ON TRIGGER audit_critical_sales ON sales IS
'Logs critical field changes: role, disabled';

-- ====================
-- MIGRATION SUMMARY
-- ====================
-- This migration implements selective audit logging:
--
-- What gets logged:
-- - Opportunities: stage, account_manager_id, status, win/loss reasons, deleted_at
-- - Contacts: organization_id, deleted_at
-- - Organizations: organization_type, status, deleted_at
-- - Sales: role, disabled
--
-- What does NOT get logged:
-- - Routine fields: description, notes, updated_at
-- - Metadata: search_tsv, tags
-- - Non-critical references: founding_interaction_id
--
-- Storage impact: ~10-20 audit rows per day (critical changes only)
-- vs. ~500+ rows per day (all fields)
--
-- Query examples:
-- -- Who changed this opportunity stage?
-- SELECT * FROM audit_trail 
-- WHERE table_name = 'opportunities' 
--   AND record_id = 123 
--   AND field_name = 'stage' 
-- ORDER BY changed_at DESC;
--
-- -- When was this user promoted to manager?
-- SELECT * FROM audit_trail 
-- WHERE table_name = 'sales' 
--   AND record_id = 456 
--   AND field_name = 'role' 
-- ORDER BY changed_at DESC;
--
-- Prerequisites: Requires audit_trail table (created in migration 20251103232837)
--
-- Rollback: Drop triggers and function:
--   DROP TRIGGER audit_critical_opportunities ON opportunities;
--   DROP TRIGGER audit_critical_contacts ON contacts;
--   DROP TRIGGER audit_critical_organizations ON organizations;
--   DROP TRIGGER audit_critical_sales ON sales;
--   DROP FUNCTION audit_critical_field_changes();
