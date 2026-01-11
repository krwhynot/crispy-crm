-- ============================================================================
-- CONVERT MERGE DUPLICATE CONTACTS TO SOFT DELETE
-- ============================================================================
-- Replaces hard DELETE with UPDATE deleted_at = NOW()
-- Original: DELETE FROM contacts WHERE id = ANY(p_duplicate_ids)
-- New: UPDATE contacts SET deleted_at = NOW() WHERE id = ANY(p_duplicate_ids)
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS merge_duplicate_contacts(INTEGER, INTEGER[]);

-- Recreate with soft delete
CREATE OR REPLACE FUNCTION merge_duplicate_contacts(
  p_keeper_id INTEGER,
  p_duplicate_ids INTEGER[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interactions_moved INTEGER := 0;
  v_tasks_moved INTEGER := 0;
  v_contacts_archived INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Validate keeper exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM contacts
    WHERE id = p_keeper_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Keeper contact % does not exist or is deleted', p_keeper_id;
  END IF;

  -- Move interactions to keeper
  UPDATE activities
  SET contact_id = p_keeper_id
  WHERE contact_id = ANY(p_duplicate_ids)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS v_interactions_moved = ROW_COUNT;

  -- Move tasks to keeper
  UPDATE tasks
  SET contact_id = p_keeper_id
  WHERE contact_id = ANY(p_duplicate_ids)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS v_tasks_moved = ROW_COUNT;

  -- ✅ SOFT DELETE duplicate contacts (not hard DELETE)
  UPDATE contacts
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = ANY(p_duplicate_ids)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS v_contacts_archived = ROW_COUNT;

  -- Return summary
  v_result := jsonb_build_object(
    'success', true,
    'keeper_id', p_keeper_id,
    'duplicates_archived', v_contacts_archived,
    'interactions_transferred', v_interactions_moved,
    'tasks_transferred', v_tasks_moved,
    'soft_delete', true
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION merge_duplicate_contacts(INTEGER, INTEGER[]) TO authenticated;

-- Add comment documenting the change
COMMENT ON FUNCTION merge_duplicate_contacts IS
  'Merges duplicate contacts by transferring activities/tasks to keeper and SOFT DELETING duplicates (sets deleted_at). v2: converted from hard DELETE 2026-01-11.';
