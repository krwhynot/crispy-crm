-- Atomic sync of opportunity-contact relationships
-- Uses SECURITY INVOKER so RLS policies on opportunity_contacts are respected
-- The existing RLS policies check opportunity ownership (created_by, owner, account_manager)

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

  -- Delete existing junction rows for this opportunity
  -- RLS policy "Users can delete opportunity_contacts" enforces authorization
  DELETE FROM opportunity_contacts
  WHERE opportunity_id = p_opportunity_id;

  -- Insert new relationships (if any)
  -- DISTINCT handles duplicate IDs from frontend
  -- UNIQUE constraint (opportunity_id, contact_id) provides additional protection
  IF array_length(v_contact_ids, 1) > 0 THEN
    INSERT INTO opportunity_contacts (opportunity_id, contact_id)
    SELECT DISTINCT p_opportunity_id, unnest(v_contact_ids)
    ON CONFLICT (opportunity_id, contact_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant execute to authenticated users (RLS handles authorization)
GRANT EXECUTE ON FUNCTION sync_opportunity_with_contacts(BIGINT, BIGINT[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION sync_opportunity_with_contacts IS 'Atomically syncs opportunity-contact relationships. Deletes all existing contacts for the opportunity, then inserts the new set. Uses SECURITY INVOKER so RLS policies are respected.';
