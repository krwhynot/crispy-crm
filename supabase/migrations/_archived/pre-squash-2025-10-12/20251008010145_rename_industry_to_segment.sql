-- Migration: Rename industry to segment
-- Date: 2025-10-08
-- Purpose: Rename industries table and related fields to segments for better business terminology
-- This is a pure terminology change with no semantic data changes

BEGIN;

-- =====================================================
-- 1. Rename industries table to segments
-- =====================================================
ALTER TABLE industries RENAME TO segments;

-- =====================================================
-- 2. Rename industry_id column to segment_id in organizations
-- =====================================================
ALTER TABLE organizations
  RENAME COLUMN industry_id TO segment_id;

-- Update column comment
COMMENT ON COLUMN organizations.segment_id IS 'Optional foreign key to segments table. NULL indicates segment is not specified. UI defaults to "Unknown" segment for better UX.';

-- =====================================================
-- 3. Recreate organizations_summary view with new column name
-- =====================================================
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
    o.priority,
    o.segment_id,
    o.annual_revenue,
    o.employee_count,
    o.created_at,
    count(DISTINCT opp.id) AS nb_opportunities,
    count(DISTINCT co.contact_id) AS nb_contacts,
    max(opp.updated_at) AS last_opportunity_activity
FROM organizations o
LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
) AND opp.deleted_at IS NULL
LEFT JOIN contact_organizations co ON co.organization_id = o.id AND co.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

COMMENT ON VIEW organizations_summary IS
'Denormalized view of organizations with aggregated counts. Uses nb_* prefix to match React Admin UI convention.';

-- =====================================================
-- 4. Rename RPC function get_or_create_industry to get_or_create_segment
-- =====================================================
DROP FUNCTION IF EXISTS get_or_create_industry(TEXT);

CREATE OR REPLACE FUNCTION get_or_create_segment(p_name TEXT)
RETURNS SETOF segments AS $$
BEGIN
  -- Try to insert, skip if duplicate
  INSERT INTO segments (name, created_by)
  VALUES (trim(p_name), auth.uid())
  ON CONFLICT (lower(name)) DO NOTHING;

  -- Return the record (new or existing)
  RETURN QUERY
  SELECT * FROM segments
  WHERE lower(name) = lower(trim(p_name));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_segment(TEXT) IS
'Get or create a segment by name. Returns the segment record (new or existing). Case-insensitive lookup.';

COMMIT;
