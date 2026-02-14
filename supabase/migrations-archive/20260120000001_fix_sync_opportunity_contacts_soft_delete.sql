-- ============================================================================
-- FIX SYNC_OPPORTUNITY_WITH_CONTACTS TO USE SOFT DELETE
-- ============================================================================
-- Issue: DATA-01 from Code Health Audit 2026-01-20
-- Original: DELETE FROM opportunity_contacts (hard delete, loses history)
-- New: UPDATE SET deleted_at = NOW() (soft delete, preserves history)
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_opportunity_with_contacts(
  p_opportunity_id BIGINT,
  p_contact_ids BIGINT[]
)
RETURNS void AS $$
DECLARE
  v_contact_ids BIGINT[];
BEGIN
  -- Handle null input (defensive)
  v_contact_ids := COALESCE(p_contact_ids, ARRAY[]::BIGINT[]);

  -- SOFT DELETE existing junction rows for contacts NOT in the new list
  -- (Replaces hard DELETE per PROVIDER_RULES.md §5)
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_id = p_opportunity_id
    AND deleted_at IS NULL
    AND (
      array_length(v_contact_ids, 1) IS NULL  -- Soft-delete all if empty array
      OR contact_id <> ALL(v_contact_ids)     -- Soft-delete those not in new list
    );

  -- Reactivate any soft-deleted rows that are in the new list
  IF array_length(v_contact_ids, 1) > 0 THEN
    UPDATE opportunity_contacts
    SET deleted_at = NULL
    WHERE opportunity_id = p_opportunity_id
      AND contact_id = ANY(v_contact_ids)
      AND deleted_at IS NOT NULL;
  END IF;

  -- Insert genuinely new relationships (only those that don't exist at all)
  IF array_length(v_contact_ids, 1) > 0 THEN
    INSERT INTO opportunity_contacts (opportunity_id, contact_id)
    SELECT DISTINCT p_opportunity_id, cid
    FROM unnest(v_contact_ids) AS cid
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunity_contacts oc
      WHERE oc.opportunity_id = p_opportunity_id
        AND oc.contact_id = cid
    )
    ON CONFLICT (opportunity_id, contact_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

COMMENT ON FUNCTION sync_opportunity_with_contacts IS
  'Atomically syncs opportunity-contact relationships using SOFT DELETE. Audit fix 2026-01-20.';
