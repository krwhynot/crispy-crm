-- Migration: Add soft delete cascading functionality for opportunities
-- Purpose: Ensure that when an opportunity is archived/unarchived, all related records
--          (activities, notes, tasks, participants) are cascaded appropriately
-- Status: P1 fix for data consistency
-- Date: 2025-10-28

-- Add deleted_at column to opportunityNotes if not exists
ALTER TABLE "opportunityNotes"
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to tasks if not exists
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create function to unarchive opportunity with cascading relations
-- This restores an opportunity and all its related records from soft delete
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
END;
$$;

-- Create function to archive opportunity with cascading relations
-- This soft-deletes an opportunity and all its related records
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
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION unarchive_opportunity_with_relations(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_opportunity_with_relations(BIGINT) TO authenticated;
