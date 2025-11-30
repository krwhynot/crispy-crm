-- Migration: add_nb_notes_to_organizations_summary
-- Purpose: Add nb_notes count to organizations_summary view for tab badge display
--
-- This enables the OrganizationSlideOver component to show notes count in tab badges.
--
-- Security: Uses security_invoker to enforce RLS from underlying tables
-- Performance: Creates partial index on organization_notes.organization_id for efficient count
-- Soft-delete: Subquery filters deleted_at IS NULL
--
-- NOTE: Uses organization_notes (snake_case table) not "organizationNotes" (view)
--       per P3 rename migration 20251129230942

-- =============================================================================
-- STEP 1: Add performance index for organization_notes.organization_id
-- =============================================================================
-- Partial index excludes soft-deleted rows for efficient count lookups

CREATE INDEX IF NOT EXISTS idx_organization_notes_organization_id
ON organization_notes(organization_id)
WHERE deleted_at IS NULL;

-- =============================================================================
-- STEP 2: Drop and recreate organizations_summary view with nb_notes
-- =============================================================================
-- Adding notes count alongside existing metrics

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
  o.employee_count,
  o.phone,
  o.website,
  o.postal_code,
  o.city,
  o.state,
  o.description,
  o.created_at,

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

  -- NEW: Notes count for tab badge display
  -- Uses snake_case table name per P3 rename migration
  (SELECT COUNT(*)
   FROM organization_notes
   WHERE organization_notes.organization_id = o.id
   AND organization_notes.deleted_at IS NULL) AS nb_notes

FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;

-- =============================================================================
-- STEP 3: Re-grant permissions (CRITICAL - views lose grants on recreation)
-- =============================================================================
GRANT SELECT ON organizations_summary TO authenticated;

-- =============================================================================
-- STEP 4: Update documentation
-- =============================================================================
COMMENT ON VIEW organizations_summary IS
  'Organization list with hierarchy and rollup metrics. '
  'Includes nb_notes for organization notes count. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';
