-- Rollback: Revert principal_organization_id FK to SET NULL
-- Only use this if the RESTRICT migration causes issues

-- Remove the new index
DROP INDEX IF EXISTS idx_opportunities_principal_org_id_restrict;

-- Remove the RESTRICT constraint
ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS fk_opportunities_principal_organization;

-- Restore the original SET NULL constraint
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_principal_organization_id_fkey
FOREIGN KEY (principal_organization_id)
REFERENCES organizations(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT opportunities_principal_organization_id_fkey ON opportunities IS
  'ROLLBACK: Original constraint with SET NULL behavior. Should be migrated to RESTRICT.';
