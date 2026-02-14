-- Batch 3, Q11: Hybrid cascade - opportunities BLOCK, notes CASCADE
-- Decision: Protect revenue data (opps block org delete), auto-cascade ephemeral context (notes)
-- Rationale: Organizations with active opportunities = revenue risk. Notes are contextual, not critical.

-- ====================
-- FUNCTION 1: Block Organization Delete if Active Opportunities Exist
-- ====================
CREATE OR REPLACE FUNCTION check_organization_delete_allowed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on soft-delete (deleted_at being set from NULL to timestamp)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Check if organization has active (non-deleted) opportunities
    IF EXISTS (
      SELECT 1 FROM opportunities
      WHERE (
        customer_organization_id = OLD.id
        OR principal_organization_id = OLD.id
        OR distributor_organization_id = OLD.id
      )
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot archive organization with active opportunities. Archive or reassign opportunities first.'
        USING HINT = 'Use opportunity reassignment or archive opportunities before archiving organization.',
              ERRCODE = '23503'; -- foreign_key_violation
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_organization_delete_allowed() IS
'Batch 3 Q11: Block org archive if active opportunities exist (protect revenue).
Prevents accidental data loss by requiring explicit opportunity cleanup first.
Raised error provides actionable hint for resolution.';

-- Attach trigger to organizations table
CREATE TRIGGER prevent_org_delete_with_active_opps
  BEFORE UPDATE OF deleted_at ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION check_organization_delete_allowed();

COMMENT ON TRIGGER prevent_org_delete_with_active_opps ON organizations IS
'Prevents soft-delete of organizations with active opportunities.
Fires BEFORE UPDATE to allow transaction rollback.';

-- ====================
-- FUNCTION 2: Cascade Soft-Delete to Notes
-- ====================
CREATE OR REPLACE FUNCTION cascade_soft_delete_to_notes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only cascade on soft-delete (deleted_at being set from NULL to timestamp)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Cascade based on parent table
    CASE TG_TABLE_NAME
      WHEN 'contacts' THEN
        UPDATE "contactNotes" 
        SET deleted_at = NEW.deleted_at
        WHERE contact_id = NEW.id 
          AND deleted_at IS NULL;
        
      WHEN 'opportunities' THEN
        UPDATE "opportunityNotes" 
        SET deleted_at = NEW.deleted_at
        WHERE opportunity_id = NEW.id 
          AND deleted_at IS NULL;
        
      WHEN 'organizations' THEN
        UPDATE "organizationNotes" 
        SET deleted_at = NEW.deleted_at
        WHERE organization_id = NEW.id 
          AND deleted_at IS NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cascade_soft_delete_to_notes() IS
'Batch 3 Q11: Auto-cascade soft-delete to notes (ephemeral context).
Notes are contextual data - when parent is archived, notes become orphaned.
Automatically archives child notes to maintain data consistency.';

-- Attach cascade triggers to parent tables
CREATE TRIGGER cascade_notes_on_contact_delete
  AFTER UPDATE OF deleted_at ON contacts
  FOR EACH ROW 
  EXECUTE FUNCTION cascade_soft_delete_to_notes();

CREATE TRIGGER cascade_notes_on_opportunity_delete
  AFTER UPDATE OF deleted_at ON opportunities
  FOR EACH ROW 
  EXECUTE FUNCTION cascade_soft_delete_to_notes();

CREATE TRIGGER cascade_notes_on_organization_delete
  AFTER UPDATE OF deleted_at ON organizations
  FOR EACH ROW 
  EXECUTE FUNCTION cascade_soft_delete_to_notes();

COMMENT ON TRIGGER cascade_notes_on_contact_delete ON contacts IS
'Auto-cascade soft-delete to contactNotes when contact is archived.';

COMMENT ON TRIGGER cascade_notes_on_opportunity_delete ON opportunities IS
'Auto-cascade soft-delete to opportunityNotes when opportunity is archived.';

COMMENT ON TRIGGER cascade_notes_on_organization_delete ON organizations IS
'Auto-cascade soft-delete to organizationNotes when organization is archived.';

-- ====================
-- MIGRATION SUMMARY
-- ====================
-- This migration implements hybrid soft-delete cascade behavior:
--
-- BLOCK CASCADE (Protective):
-- - Organizations with active opportunities → CANNOT be archived
-- - Forces explicit cleanup: archive opportunities first OR reassign to another org
-- - Prevents accidental revenue data loss
--
-- AUTO CASCADE (Convenience):
-- - Contact archived → contactNotes auto-archived
-- - Opportunity archived → opportunityNotes auto-archived
-- - Organization archived (after opps cleared) → organizationNotes auto-archived
-- - Notes are contextual, not critical - safe to cascade
--
-- Affected tables: organizations (BLOCK), contacts/opportunities/organizations (CASCADE to notes)
--
-- Error handling:
-- - BLOCK raises EXCEPTION with HINT for user guidance
-- - CASCADE is silent (automatic cleanup)
--
-- Rollback: If needed, drop triggers and functions:
--   DROP TRIGGER prevent_org_delete_with_active_opps ON organizations;
--   DROP TRIGGER cascade_notes_on_contact_delete ON contacts;
--   DROP TRIGGER cascade_notes_on_opportunity_delete ON opportunities;
--   DROP TRIGGER cascade_notes_on_organization_delete ON organizations;
--   DROP FUNCTION check_organization_delete_allowed();
--   DROP FUNCTION cascade_soft_delete_to_notes();
