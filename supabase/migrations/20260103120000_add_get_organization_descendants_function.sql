-- Add RPC function to get all descendant organization IDs
-- Used by ParentOrganizationInput to exclude descendants from parent selection
-- (prevents UI from allowing cycles before hitting DB trigger)

CREATE OR REPLACE FUNCTION get_organization_descendants(org_id BIGINT)
RETURNS BIGINT[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    ARRAY_AGG(id),
    ARRAY[]::BIGINT[]
  )
  FROM (
    WITH RECURSIVE descendants AS (
      -- Base case: direct children of the given organization
      SELECT id, parent_organization_id
      FROM organizations
      WHERE parent_organization_id = org_id
        AND deleted_at IS NULL

      UNION ALL

      -- Recursive case: children of descendants
      SELECT o.id, o.parent_organization_id
      FROM organizations o
      JOIN descendants d ON o.parent_organization_id = d.id
      WHERE o.deleted_at IS NULL
    )
    SELECT id FROM descendants
  ) AS all_descendants;
$$;

COMMENT ON FUNCTION get_organization_descendants(BIGINT) IS
  'Returns array of all descendant organization IDs for hierarchy cycle prevention in UI';

-- Grant access to authenticated users for RPC calls
GRANT EXECUTE ON FUNCTION get_organization_descendants(BIGINT) TO authenticated;
