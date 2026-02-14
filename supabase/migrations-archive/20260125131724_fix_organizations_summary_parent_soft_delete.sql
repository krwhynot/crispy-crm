-- Migration: fix_organizations_summary_parent_soft_delete
-- Purpose: Add soft-delete filter to parent organization JOIN in organizations_summary view
--
-- Fixes: Parent organizations with deleted_at IS NOT NULL appearing in parent_organization_name
-- Required for: Data integrity - prevent displaying deleted parent organizations
--
-- Change:
--   Before: LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
--   After:  LEFT JOIN organizations parent ON o.parent_organization_id = parent.id AND parent.deleted_at IS NULL

-- Drop and recreate the view with the parent soft-delete filter
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary
WITH (security_invoker = on)
AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  parent.name AS parent_organization_name,
  o.priority,
  o.segment_id,
  o.sales_id,
  o.employee_count,
  o.phone,
  o.website,
  o.postal_code,
  o.city,
  o.state,
  o.description,
  o.created_at,
  o.updated_at,
  o.deleted_at,
  o.email,
  o.linkedin_url,

  (SELECT COUNT(*)
   FROM organizations children
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL) AS child_branch_count,

  (SELECT COUNT(DISTINCT c.id)
   FROM organizations children
   LEFT JOIN contacts c ON c.organization_id = children.id
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL
   AND c.deleted_at IS NULL) AS total_contacts_across_branches,

  (SELECT COUNT(DISTINCT opp.id)
   FROM organizations children
   LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL
   AND opp.deleted_at IS NULL) AS total_opportunities_across_branches,

  (SELECT COUNT(*)
   FROM opportunities
   WHERE opportunities.principal_organization_id = o.id
   AND opportunities.deleted_at IS NULL) AS nb_opportunities,

  (SELECT COUNT(*)
   FROM contacts
   WHERE contacts.organization_id = o.id
   AND contacts.deleted_at IS NULL) AS nb_contacts,

  (SELECT MAX(opportunities.updated_at)
   FROM opportunities
   WHERE opportunities.principal_organization_id = o.id
   AND opportunities.deleted_at IS NULL) AS last_opportunity_activity,

  (SELECT COUNT(*)
   FROM organization_notes
   WHERE organization_notes.organization_id = o.id
   AND organization_notes.deleted_at IS NULL) AS nb_notes

FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id AND parent.deleted_at IS NULL
WHERE o.deleted_at IS NULL;

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON organizations_summary TO authenticated;

-- Update documentation
COMMENT ON VIEW organizations_summary IS
  'Organization list with hierarchy, rollup metrics, and audit columns. '
  'Parent organization JOIN includes soft-delete filter to prevent displaying deleted parents. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';
