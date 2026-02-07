-- ============================================================
-- Migration: Add related_opportunity_id integrity constraints
-- Description: Enforce business rules for opportunity relationships
-- Author: Database Engineer
-- Date: 2026-02-07
-- Business rule: Related opportunities must have same principal
-- ============================================================

-- STEP 1: Pre-flight validation - check for existing violations
DO $$
DECLARE
  self_link_count INTEGER;
  principal_mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO self_link_count
  FROM opportunities
  WHERE related_opportunity_id = id
    AND deleted_at IS NULL;

  SELECT COUNT(*) INTO principal_mismatch_count
  FROM opportunities child
  JOIN opportunities parent ON child.related_opportunity_id = parent.id
  WHERE child.principal_organization_id != parent.principal_organization_id
    AND child.deleted_at IS NULL
    AND parent.deleted_at IS NULL;

  RAISE NOTICE '=== PRE-FLIGHT CHECK ===';
  RAISE NOTICE 'Self-links found: %', self_link_count;
  RAISE NOTICE 'Principal mismatches found: %', principal_mismatch_count;
END $$;

-- ============================================
-- CONSTRAINTS
-- ============================================

-- STEP 2A: CHECK constraint for self-link prevention
ALTER TABLE opportunities
ADD CONSTRAINT no_self_related_opportunity
CHECK (id != related_opportunity_id OR related_opportunity_id IS NULL);

COMMENT ON CONSTRAINT no_self_related_opportunity ON opportunities IS
  'Business rule: Opportunity cannot be related to itself';

-- ============================================
-- TRIGGERS
-- ============================================

-- STEP 2B: Trigger for principal matching validation
CREATE OR REPLACE FUNCTION validate_related_opportunity_principal()
RETURNS TRIGGER AS $$
DECLARE
  v_related_principal BIGINT;
BEGIN
  IF NEW.related_opportunity_id IS NOT NULL THEN
    SELECT principal_organization_id INTO v_related_principal
    FROM opportunities
    WHERE id = NEW.related_opportunity_id
      AND deleted_at IS NULL;

    IF v_related_principal IS NULL THEN
      RAISE EXCEPTION 'Related opportunity % not found or deleted',
        NEW.related_opportunity_id;
    END IF;

    IF v_related_principal != NEW.principal_organization_id THEN
      RAISE EXCEPTION 'Related opportunity must have same principal_organization_id. Expected %, got %',
        NEW.principal_organization_id, v_related_principal;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_related_opportunity_principal
  BEFORE INSERT OR UPDATE OF related_opportunity_id, principal_organization_id
  ON opportunities
  FOR EACH ROW
  WHEN (NEW.related_opportunity_id IS NOT NULL)
  EXECUTE FUNCTION validate_related_opportunity_principal();

-- ============================================
-- VERIFICATION
-- ============================================

-- STEP 3: Post-flight verification
DO $$
DECLARE
  constraint_exists BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'no_self_related_opportunity'
  ) INTO constraint_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_related_opportunity_principal'
  ) INTO trigger_exists;

  IF constraint_exists AND trigger_exists THEN
    RAISE NOTICE 'SUCCESS: All constraints and triggers created';
  ELSE
    RAISE EXCEPTION 'VERIFICATION FAILED: constraint=%, trigger=%',
      constraint_exists, trigger_exists;
  END IF;
END $$;
