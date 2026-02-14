-- Migration: Complete soft delete cascade for opportunities
-- Purpose: Add missing junction tables to cascade functions
-- Issue: P0 - opportunity_contacts and opportunity_products were not being
--        soft-deleted when parent opportunity was deleted, leaving orphan records
-- Date: 2025-12-21

-- ============================================================================
-- UPDATE archive_opportunity_with_relations
-- Adds: opportunity_contacts, opportunity_products to cascade
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_opportunity_with_relations(opp_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  -- Archive the opportunity
  UPDATE opportunities
  SET deleted_at = NOW()
  WHERE id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to activities
  UPDATE activities
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to opportunity notes
  UPDATE "opportunityNotes"
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to opportunity participants
  UPDATE opportunity_participants
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to tasks
  UPDATE tasks
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- P0 FIX: Cascade archive to opportunity_contacts (junction table)
  -- Previously missing - caused orphan contact associations
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- P0 FIX: Cascade archive to opportunity_products (junction table)
  -- Previously missing - caused orphan product associations
  UPDATE opportunity_products
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;
END;
$$;

-- ============================================================================
-- UPDATE unarchive_opportunity_with_relations
-- Adds: opportunity_contacts, opportunity_products to cascade
-- Ensures symmetry with archive function
-- ============================================================================

CREATE OR REPLACE FUNCTION unarchive_opportunity_with_relations(opp_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  -- Unarchive the opportunity
  UPDATE opportunities
  SET deleted_at = NULL
  WHERE id = opp_id;

  -- Cascade unarchive to activities
  UPDATE activities
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- Cascade unarchive to opportunity notes
  UPDATE "opportunityNotes"
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- Cascade unarchive to opportunity participants
  UPDATE opportunity_participants
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- Cascade unarchive to tasks
  UPDATE tasks
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- P0 FIX: Cascade unarchive to opportunity_contacts (junction table)
  UPDATE opportunity_contacts
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- P0 FIX: Cascade unarchive to opportunity_products (junction table)
  UPDATE opportunity_products
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;
END;
$$;

-- ============================================================================
-- VERIFICATION COMMENT
-- After applying this migration, the cascade covers ALL related tables:
--
-- Tables with deleted_at that ARE NOW cascaded:
-- ✅ opportunities (the parent)
-- ✅ activities
-- ✅ opportunityNotes
-- ✅ opportunity_participants
-- ✅ tasks
-- ✅ opportunity_contacts (NEW)
-- ✅ opportunity_products (NEW)
-- ============================================================================
