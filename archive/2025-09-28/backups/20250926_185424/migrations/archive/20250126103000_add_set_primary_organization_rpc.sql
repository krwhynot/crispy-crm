-- Create RPC function to replace trigger functionality for primary organization management
-- This provides atomic transaction control before removing backward compatibility triggers

CREATE OR REPLACE FUNCTION set_primary_organization(
  p_contact_id BIGINT,
  p_organization_id BIGINT
) RETURNS VOID AS $$
BEGIN
  -- Atomic transaction: clear all primary flags, then set the new one
  UPDATE contact_organizations
  SET is_primary = false
  WHERE contact_id = p_contact_id
  AND deleted_at IS NULL;

  UPDATE contact_organizations
  SET is_primary = true
  WHERE contact_id = p_contact_id
  AND organization_id = p_organization_id
  AND deleted_at IS NULL;

  -- Verify exactly one primary exists
  IF (SELECT COUNT(*) FROM contact_organizations
      WHERE contact_id = p_contact_id
      AND is_primary = true
      AND deleted_at IS NULL) != 1 THEN
    RAISE EXCEPTION 'Failed to set exactly one primary organization';
  END IF;
END;
$$ LANGUAGE plpgsql;