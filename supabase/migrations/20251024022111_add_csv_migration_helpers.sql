-- Migration: Helper functions for CSV import with automatic contact backfill
-- Purpose: Support opportunity CSV migration with contact relationship management

-- Function to backfill opportunity contacts from interactions
CREATE OR REPLACE FUNCTION backfill_opportunity_contacts(p_opportunity_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_interaction_contacts BIGINT[];
BEGIN
  -- Get all unique contact IDs from interactions for this opportunity
  SELECT ARRAY_AGG(DISTINCT contact_id)
  INTO v_interaction_contacts
  FROM activities
  WHERE opportunity_id = p_opportunity_id
    AND activity_type = 'interaction'
    AND contact_id IS NOT NULL
    AND deleted_at IS NULL;

  -- If we found contacts, add them to opportunity.contact_ids
  IF v_interaction_contacts IS NOT NULL AND array_length(v_interaction_contacts, 1) > 0 THEN
    UPDATE opportunities
    SET contact_ids = (
      SELECT ARRAY_AGG(DISTINCT c)
      FROM UNNEST(
        COALESCE(contact_ids, ARRAY[]::BIGINT[]) || v_interaction_contacts
      ) AS c
    )
    WHERE id = p_opportunity_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_opportunity_contacts IS
  'Adds interaction contacts to opportunity.contact_ids if not already present. Used during CSV migration.';

GRANT EXECUTE ON FUNCTION backfill_opportunity_contacts TO authenticated;
