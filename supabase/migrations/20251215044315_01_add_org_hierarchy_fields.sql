-- Parent/child hierarchy support for distributors
-- Enables: Sysco Corp (national) -> Sysco Chicago (regional)

ALTER TABLE organizations
  ADD COLUMN parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN org_scope TEXT CHECK (org_scope IN ('national', 'regional', 'local')),
  ADD COLUMN is_operating_entity BOOLEAN DEFAULT true;

COMMENT ON COLUMN organizations.parent_id IS 'Self-referential FK for org hierarchy';
COMMENT ON COLUMN organizations.org_scope IS 'Geographic scope: national, regional, or local';
COMMENT ON COLUMN organizations.is_operating_entity IS 'TRUE = transact here, FALSE = brand/grouping only';
