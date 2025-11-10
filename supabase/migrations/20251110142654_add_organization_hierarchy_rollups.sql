-- Drop existing view if it exists
DROP VIEW IF EXISTS organizations_summary;

-- Create updated view with hierarchy rollup fields
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  parent.name as parent_organization_name,
  o.priority,
  o.sales_id,
  o.created_at,
  o.deleted_at,

  -- Branch counts for parent orgs
  (SELECT COUNT(*)
   FROM organizations children
   WHERE children.parent_organization_id = o.id
     AND children.deleted_at IS NULL) as child_branch_count,

  -- Rollup metrics across all branches
  (SELECT COUNT(DISTINCT c.id)
   FROM organizations children
   LEFT JOIN contacts c ON c.organization_id = children.id
   WHERE children.parent_organization_id = o.id
     AND children.deleted_at IS NULL
     AND c.deleted_at IS NULL) as total_contacts_across_branches,

  (SELECT COUNT(DISTINCT opp.id)
   FROM organizations children
   LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id
   WHERE children.parent_organization_id = o.id
     AND children.deleted_at IS NULL
     AND opp.deleted_at IS NULL) as total_opportunities_across_branches,

  -- Direct counts (existing logic)
  (SELECT COUNT(*) FROM contacts WHERE organization_id = o.id
   AND deleted_at IS NULL) as nb_contacts,
  (SELECT COUNT(*) FROM opportunities WHERE principal_organization_id = o.id
   AND deleted_at IS NULL) as nb_opportunities

FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON organizations_summary TO authenticated;

-- Add comment
COMMENT ON VIEW organizations_summary IS 'Organization summary with hierarchy rollup metrics (child_branch_count, total_contacts_across_branches, total_opportunities_across_branches)';
