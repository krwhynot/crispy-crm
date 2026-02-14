-- Migration: Add tags support to organizations
-- Purpose: Enable tag management for organizations (matches contacts pattern)
-- Impact: Adds column to organizations table, recreates organizations_summary view
--
-- This enables the OrganizationSlideOver component to manage tags via colored badges.
-- Pattern matches the existing contacts.tags implementation.
--
-- Security: View uses security_invoker to enforce RLS from underlying tables
-- Performance: GIN index enables efficient array containment queries

-- =============================================================================
-- STEP 1: Add tags column to organizations table
-- =============================================================================
-- Matches contacts table pattern: tags bigint[] DEFAULT '{}'::bigint[]
-- Stores array of foreign keys to tags table

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS tags bigint[] DEFAULT '{}'::bigint[];

-- =============================================================================
-- STEP 2: Add GIN index for efficient array queries
-- =============================================================================
-- Enables fast @> (contains) and && (overlaps) operators for tag filtering
-- Matches idx_opportunities_tags pattern

CREATE INDEX IF NOT EXISTS idx_organizations_tags
ON organizations USING gin (tags);

-- =============================================================================
-- STEP 3: Recreate organizations_summary view with tags column
-- =============================================================================
-- Copied from 20260206000001_add_search_tsv_to_organizations_summary.sql
-- Only change: Added o.tags to SELECT list

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
  o.search_tsv,
  o.tags,  -- NEW: Add tags array column for UI display

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

-- Join to segments table for segment_name
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

-- =============================================================================
-- STEP 4: Re-grant permissions (CRITICAL - views lose grants on recreation)
-- =============================================================================
GRANT SELECT ON organizations_summary TO authenticated;

-- =============================================================================
-- STEP 5: Update documentation
-- =============================================================================
COMMENT ON VIEW organizations_summary IS
  'Organization list with hierarchy, rollup metrics, segment_name, org_scope, search_tsv, tags, and audit columns. '
  'Includes tags array for UI tag management (matches contacts_summary pattern). '
  'Includes search_tsv for PostgreSQL full-text search support (FTS migration). '
  'Parent organization JOIN includes soft-delete filter to prevent displaying deleted parents. '
  'Segments JOIN provides segment_name for sorting and display. '
  'Optimized: 7 correlated subqueries converted to LEFT JOIN LATERAL for better query planning. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';
