-- Migration: Add Organization Hierarchy Cycle Protection
-- Date: 2025-11-17
-- Purpose: Prevent self-parenting and circular parent relationships in organizations table
-- Reference: docs/archive/plans/2025-11-17-organization-hierarchies-implementation-plan.md

-- =====================================================
-- Function: Detect Cycles in Organization Hierarchy
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_organization_cycle()
RETURNS TRIGGER AS $$
DECLARE
  v_current_parent_id BIGINT;
  v_depth INTEGER := 0;
  v_max_depth INTEGER := 10; -- Prevent infinite loops
BEGIN
  -- Skip if parent is not being set
  IF NEW.parent_organization_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent self-parenting
  IF NEW.parent_organization_id = NEW.id THEN
    RAISE EXCEPTION 'Organization cannot be its own parent (ID: %)', NEW.id;
  END IF;

  -- Walk up the parent chain to detect cycles
  v_current_parent_id := NEW.parent_organization_id;

  WHILE v_current_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
    -- If we encounter our own ID while walking up, there's a cycle
    IF v_current_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Cycle detected: Organization % would create a circular parent relationship', NEW.id;
    END IF;

    -- Move up to the next parent
    SELECT parent_organization_id
    INTO v_current_parent_id
    FROM organizations
    WHERE id = v_current_parent_id;

    v_depth := v_depth + 1;
  END LOOP;

  -- If we hit max depth, the hierarchy is too deep (likely a cycle we didn't catch)
  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'Maximum hierarchy depth exceeded (% levels). Possible cycle.', v_max_depth;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: Check for Cycles Before Insert or Update
-- =====================================================

CREATE TRIGGER check_organization_cycle
  BEFORE INSERT OR UPDATE OF parent_organization_id ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_organization_cycle();

-- =====================================================
-- Rollback Instructions
-- =====================================================
-- To disable the trigger (emergency):
--   ALTER TABLE organizations DISABLE TRIGGER check_organization_cycle;
--
-- To re-enable:
--   ALTER TABLE organizations ENABLE TRIGGER check_organization_cycle;
--
-- To fully remove:
--   DROP TRIGGER IF EXISTS check_organization_cycle ON organizations;
--   DROP FUNCTION IF EXISTS prevent_organization_cycle();
