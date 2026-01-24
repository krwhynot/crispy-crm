-- Batch 3, Q15: Enforce audit field immutability via triggers
-- Decision: DB triggers enforce immutability (defense-in-depth against app bugs)
-- Rationale: created_at/created_by must never change. Auto-set updated_at/updated_by on every update.

-- ====================
-- FUNCTION: Protect Audit Fields
-- ====================
CREATE OR REPLACE FUNCTION protect_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect created_at (immutable - record birth timestamp)
  IF TG_OP = 'UPDATE' AND OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    NEW.created_at := OLD.created_at; -- Silently restore original value
  END IF;

  -- Protect created_by (immutable - record creator)
  IF TG_OP = 'UPDATE' AND OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    NEW.created_by := OLD.created_by; -- Silently restore original value
  END IF;

  -- Auto-set updated_at (always current timestamp on update)
  NEW.updated_at := NOW();

  -- Auto-set updated_by (current user performing update)
  -- Only set if function returns valid sales_id (authenticated context)
  IF public.current_sales_id() IS NOT NULL THEN
    NEW.updated_by := public.current_sales_id();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION protect_audit_fields() IS
'Batch 3 Q15: Enforce audit field immutability. Defense-in-depth against application bugs.
- created_at/created_by: IMMUTABLE (silently restored if changed)
- updated_at/updated_by: AUTO-SET (always current timestamp/user)
Silent restore pattern: No errors raised, invalid changes are corrected transparently.';

-- ====================
-- ATTACH TO CORE TABLES
-- ====================
-- Apply to all tables with audit fields (created_at, created_by, updated_at, updated_by)

-- Contacts
CREATE TRIGGER protect_contacts_audit
  BEFORE UPDATE ON contacts 
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_fields();

COMMENT ON TRIGGER protect_contacts_audit ON contacts IS
'Enforces audit field immutability: created_at/created_by cannot change, updated_at/updated_by auto-set';

-- Organizations
CREATE TRIGGER protect_organizations_audit
  BEFORE UPDATE ON organizations 
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_fields();

COMMENT ON TRIGGER protect_organizations_audit ON organizations IS
'Enforces audit field immutability: created_at/created_by cannot change, updated_at/updated_by auto-set';

-- Opportunities
CREATE TRIGGER protect_opportunities_audit
  BEFORE UPDATE ON opportunities 
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_fields();

COMMENT ON TRIGGER protect_opportunities_audit ON opportunities IS
'Enforces audit field immutability: created_at/created_by cannot change, updated_at/updated_by auto-set';

-- Activities
CREATE TRIGGER protect_activities_audit
  BEFORE UPDATE ON activities 
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_fields();

COMMENT ON TRIGGER protect_activities_audit ON activities IS
'Enforces audit field immutability: created_at/created_by cannot change, updated_at/updated_by auto-set';

-- Products
CREATE TRIGGER protect_products_audit
  BEFORE UPDATE ON products 
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_fields();

COMMENT ON TRIGGER protect_products_audit ON products IS
'Enforces audit field immutability: created_at/created_by cannot change, updated_at/updated_by auto-set';

-- ====================
-- MIGRATION SUMMARY
-- ====================
-- This migration adds database-level enforcement of audit field integrity:
--
-- IMMUTABLE FIELDS (Silent Restore):
-- - created_at: Record birth timestamp (never changes)
-- - created_by: Record creator (never changes)
-- - If application attempts to change these, original values are silently restored
--
-- AUTO-SET FIELDS (Automatic Update):
-- - updated_at: Always set to NOW() on UPDATE
-- - updated_by: Always set to current_sales_id() on UPDATE (if authenticated)
--
-- Why silent restore vs. RAISE EXCEPTION?
-- - Application bugs shouldn't crash transactions
-- - Defensive programming: correct the error, don't block legitimate updates
-- - Audit trail already logs changes (Migration 5), so tampering is detectable
--
-- Trigger execution order:
-- 1. BEFORE UPDATE: protect_audit_fields (this migration) - corrects invalid changes
-- 2. AFTER UPDATE: audit_critical_field_changes (Migration 5) - logs what changed
--
-- Coverage:
-- - contacts, organizations, opportunities, activities, products
-- - Add to other tables as needed (pattern is reusable)
--
-- Testing:
-- -- Try to change created_at (should be silently restored)
-- UPDATE contacts SET created_at = NOW(), first_name = 'Test' WHERE id = 1;
-- SELECT created_at FROM contacts WHERE id = 1; -- Should show original created_at
--
-- -- Verify updated_at is auto-set
-- UPDATE contacts SET first_name = 'Test2' WHERE id = 1;
-- SELECT updated_at FROM contacts WHERE id = 1; -- Should show current timestamp
--
-- Rollback: Drop triggers and function:
--   DROP TRIGGER protect_contacts_audit ON contacts;
--   DROP TRIGGER protect_organizations_audit ON organizations;
--   DROP TRIGGER protect_opportunities_audit ON opportunities;
--   DROP TRIGGER protect_activities_audit ON activities;
--   DROP TRIGGER protect_products_audit ON products;
--   DROP FUNCTION protect_audit_fields();
