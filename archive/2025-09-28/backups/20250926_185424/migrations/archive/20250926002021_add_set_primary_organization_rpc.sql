-- Add RPC function for atomic primary organization management
-- This function replaces trigger-based logic for setting primary organization relationships
-- before removing backward compatibility triggers per Constitution Principle #8

CREATE OR REPLACE FUNCTION set_primary_organization(
  p_contact_id BIGINT,
  p_organization_id BIGINT
) RETURNS VOID AS $$
BEGIN
  -- Atomic transaction: clear all primary flags for this contact
  UPDATE contact_organizations
  SET is_primary = false
  WHERE contact_id = p_contact_id
  AND deleted_at IS NULL;

  -- Set the new primary organization for this contact
  UPDATE contact_organizations
  SET is_primary = true
  WHERE contact_id = p_contact_id
  AND organization_id = p_organization_id
  AND deleted_at IS NULL;

  -- Verify exactly one primary organization exists for this contact
  IF (SELECT COUNT(*) FROM contact_organizations
      WHERE contact_id = p_contact_id
      AND is_primary = true
      AND deleted_at IS NULL) != 1 THEN
    RAISE EXCEPTION 'Failed to set exactly one primary organization for contact_id %', p_contact_id;
  END IF;
END;
$$ LANGUAGE plpgsql;