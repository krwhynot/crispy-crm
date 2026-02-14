-- Prevent deleting parent organizations with child branches
CREATE OR REPLACE FUNCTION prevent_parent_org_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM organizations
    WHERE parent_organization_id = OLD.id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization with child branches. Remove branches first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
CREATE TRIGGER check_parent_deletion
  BEFORE DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_parent_org_deletion();

-- Add comment
COMMENT ON FUNCTION prevent_parent_org_deletion() IS 'Prevents deletion of organizations that have child branches. Protects hierarchy integrity.';
