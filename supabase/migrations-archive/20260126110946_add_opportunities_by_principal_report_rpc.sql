-- Opportunities by Principal Report RPC
-- Replaces client-side grouping/aggregation (perPage: 1000 time bomb) with server-side computation
-- Returns principal groups with opportunity counts, stage breakdown, and summary statistics

CREATE OR REPLACE FUNCTION get_opportunities_by_principal_report(
  p_principal_organization_id BIGINT DEFAULT NULL,
  p_stage TEXT[] DEFAULT NULL,
  p_opportunity_owner_id BIGINT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'principalId', principal_organization_id,
      'principalName', COALESCE(principal_organization_name, 'No Principal Assigned'),
      'totalCount', total_count,
      'stageBreakdown', stage_breakdown
    )
    ORDER BY total_count DESC
  ), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      o.principal_organization_id,
      COALESCE(prin_org.name, 'No Principal Assigned') as principal_organization_name,
      COUNT(*) as total_count,
      jsonb_object_agg(
        COALESCE(o.stage::TEXT, 'Unknown'),
        stage_count
      ) as stage_breakdown
    FROM opportunities o
    LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
    LEFT JOIN LATERAL (
      SELECT o2.stage, COUNT(*) as stage_count
      FROM opportunities o2
      WHERE o2.principal_organization_id IS NOT DISTINCT FROM o.principal_organization_id
        AND o2.deleted_at IS NULL
        AND o2.status = 'active'
        AND (p_principal_organization_id IS NULL OR o2.principal_organization_id = p_principal_organization_id)
        AND (p_stage IS NULL OR o2.stage = ANY(p_stage))
        AND (p_opportunity_owner_id IS NULL OR o2.opportunity_owner_id = p_opportunity_owner_id)
        AND (p_start_date IS NULL OR o2.estimated_close_date >= p_start_date)
        AND (p_end_date IS NULL OR o2.estimated_close_date <= p_end_date)
      GROUP BY o2.stage
    ) stage_agg ON true
    WHERE o.deleted_at IS NULL
      AND o.status = 'active'
      AND (p_principal_organization_id IS NULL OR o.principal_organization_id = p_principal_organization_id)
      AND (p_stage IS NULL OR o.stage = ANY(p_stage))
      AND (p_opportunity_owner_id IS NULL OR o.opportunity_owner_id = p_opportunity_owner_id)
      AND (p_start_date IS NULL OR o.estimated_close_date >= p_start_date)
      AND (p_end_date IS NULL OR o.estimated_close_date <= p_end_date)
    GROUP BY o.principal_organization_id, prin_org.name
  ) grouped;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_opportunities_by_principal_report(BIGINT, TEXT[], BIGINT, DATE, DATE) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_opportunities_by_principal_report IS
  'Server-side aggregation for Opportunities by Principal Report. Returns principal groups
   with opportunity counts and stage breakdown. Replaces client-side Map/forEach aggregations
   that downloaded 1000+ records. Filters: principal_id, stage array, owner_id, date range.';
