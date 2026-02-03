-- Migration: optimize_organizations_summary_lateral
-- Purpose: Convert 7 correlated subqueries to LEFT JOIN LATERAL for better query planning
--
-- Performance: Correlated subqueries execute per-row (N+1 pattern). LEFT JOIN LATERAL
-- allows the planner to choose hash/merge joins when beneficial, matching the pattern
-- already used in contacts_summary (see 20251126015956_add_contacts_summary_counts.sql).
--
-- Preserves: All column names/aliases, soft-delete filters, security_invoker, parent JOIN.
-- No schema changes - output contract is identical.

-- Drop and recreate the view with LATERAL joins
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

-- Re-grant permissions (CRITICAL - views lose grants on recreation)
GRANT SELECT ON organizations_summary TO authenticated;

-- Update documentation
COMMENT ON VIEW organizations_summary IS
  'Organization list with hierarchy, rollup metrics, and audit columns. '
  'Parent organization JOIN includes soft-delete filter to prevent displaying deleted parents. '
  'Optimized: 7 correlated subqueries converted to LEFT JOIN LATERAL for better query planning. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';
