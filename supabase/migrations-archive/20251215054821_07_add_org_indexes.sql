-- Performance indexes for organization queries
-- Schema note: parent_organization_id is BIGINT (existing column)

-- Index on parent (for hierarchy queries)
CREATE INDEX IF NOT EXISTS idx_orgs_parent_organization_id
  ON organizations(parent_organization_id);

-- Index on scope (new column from Prompt 1)
CREATE INDEX IF NOT EXISTS idx_orgs_org_scope
  ON organizations(org_scope)
  WHERE org_scope IS NOT NULL;

-- Index on existing organization_type enum
CREATE INDEX IF NOT EXISTS idx_orgs_organization_type
  ON organizations(organization_type)
  WHERE organization_type IS NOT NULL;

-- Index on status fields (new from Prompt 1)
CREATE INDEX IF NOT EXISTS idx_orgs_status
  ON organizations(status, status_reason)
  WHERE status IS NOT NULL;

-- Index on operating entity flag (new from Prompt 1)
CREATE INDEX IF NOT EXISTS idx_orgs_operating
  ON organizations(is_operating_entity)
  WHERE is_operating_entity = true;

-- Index on territory (new from Prompt 1)
CREATE INDEX IF NOT EXISTS idx_orgs_territory
  ON organizations(territory)
  WHERE territory IS NOT NULL;
