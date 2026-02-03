-- Migration: Add segment_name to organizations_summary view
-- Purpose: Enable sorting and display of segment names without client-side JOIN
-- Impact: View recreation (grants must be restored)
--
-- Pattern: LEFT JOIN to segments table for segment_name (similar to parent_organization_name)
-- - Segments table does NOT have deleted_at (static reference data)
-- - Existing index on organizations.segment_id provides JOIN performance

-- Drop and recreate the view with segment_name
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary
WITH (security_invoker = on)
AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.org_scope,
  o.parent_organization_id,
  parent.name AS parent_organization_name,
  o.priority,
  o.segment_id,
  segments.name AS segment_name,
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

  COALESCE(child_branches.cnt, 0)::integer AS child_branch_count,
  COALESCE(branch_contacts.cnt, 0)::integer AS total_contacts_across_branches,
  COALESCE(branch_opportunities.cnt, 0)::integer AS total_opportunities_across_branches,
  COALESCE(direct_opportunities.cnt, 0)::integer AS nb_opportunities,
  COALESCE(direct_contacts.cnt, 0)::integer AS nb_contacts,
  last_opp_activity.val AS last_opportunity_activity,
  COALESCE(org_notes.cnt, 0)::integer AS nb_notes

FROM organizations o

LEFT JOIN organizations parent
  ON o.parent_organization_id = parent.id
  AND parent.deleted_at IS NULL

-- NEW: Join to segments table for segment_name
-- NOTE: Segments table does NOT have deleted_at (static reference data)
LEFT JOIN segments
  ON o.segment_id = segments.id

-- 1. Count of child branch organizations
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM organizations children
  WHERE children.parent_organization_id = o.id
    AND children.deleted_at IS NULL
) child_branches ON true

-- 2. Count of distinct contacts across child branches
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT c.id)::integer AS cnt
  FROM organizations children
  LEFT JOIN contacts c ON c.organization_id = children.id
  WHERE children.parent_organization_id = o.id
    AND children.deleted_at IS NULL
    AND c.deleted_at IS NULL
) branch_contacts ON true

-- 3. Count of distinct opportunities across child branches
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT opp.id)::integer AS cnt
  FROM organizations children
  LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id
  WHERE children.parent_organization_id = o.id
    AND children.deleted_at IS NULL
    AND opp.deleted_at IS NULL
) branch_opportunities ON true

-- 4. Count of direct opportunities
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM opportunities
  WHERE opportunities.principal_organization_id = o.id
    AND opportunities.deleted_at IS NULL
) direct_opportunities ON true

-- 5. Count of direct contacts
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM contacts
  WHERE contacts.organization_id = o.id
    AND contacts.deleted_at IS NULL
) direct_contacts ON true

-- 6. Most recent opportunity activity timestamp
LEFT JOIN LATERAL (
  SELECT MAX(opportunities.updated_at) AS val
  FROM opportunities
  WHERE opportunities.principal_organization_id = o.id
    AND opportunities.deleted_at IS NULL
) last_opp_activity ON true

-- 7. Count of organization notes
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt
  FROM organization_notes
  WHERE organization_notes.organization_id = o.id
    AND organization_notes.deleted_at IS NULL
) org_notes ON true

WHERE o.deleted_at IS NULL;

-- CRITICAL: Re-grant permissions (views lose grants on recreation)
GRANT SELECT ON organizations_summary TO authenticated;

-- Update documentation
COMMENT ON VIEW organizations_summary IS
  'Organization list with hierarchy, rollup metrics, segment_name, org_scope, and audit columns. '
  'Parent organization JOIN includes soft-delete filter to prevent displaying deleted parents. '
  'Segments JOIN provides segment_name for sorting and display (segments are static reference data, no deleted_at). '
  'Optimized: 7 correlated subqueries converted to LEFT JOIN LATERAL for better query planning. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';
