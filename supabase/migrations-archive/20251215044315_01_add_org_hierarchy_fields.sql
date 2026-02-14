-- Organization hierarchy scope and operating entity fields
-- Note: parent_organization_id already exists as BIGINT FK

-- Add new hierarchy metadata columns only
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_scope TEXT CHECK (org_scope IN ('national', 'regional', 'local')),
  ADD COLUMN IF NOT EXISTS is_operating_entity BOOLEAN DEFAULT true;

COMMENT ON COLUMN organizations.org_scope IS 'Geographic scope: national, regional, or local';
COMMENT ON COLUMN organizations.is_operating_entity IS 'TRUE = transact here, FALSE = brand/grouping only';
