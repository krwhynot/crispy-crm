-- Campaign Report Stats RPC
-- Replaces client-side aggregations (perPage: 1000 time bombs) with server-side computation
-- Returns campaign options, sales rep activity counts, and activity type breakdown

CREATE OR REPLACE FUNCTION get_campaign_report_stats(
  p_campaign TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'campaign_options', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('name', campaign, 'count', cnt)
        ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT campaign, count(*) as cnt
        FROM opportunities
        WHERE deleted_at IS NULL
          AND campaign IS NOT NULL
          AND campaign != ''
        GROUP BY campaign
      ) sub
    ),
    'sales_rep_options', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', created_by,
          'name', COALESCE(s.first_name || ' ' || s.last_name, 'Unknown Rep'),
          'count', cnt
        )
        ORDER BY cnt DESC
      ), '[]'::jsonb)
      FROM (
        SELECT a.created_by, count(*) as cnt
        FROM activities a
        JOIN opportunities o ON a.opportunity_id = o.id
        WHERE o.deleted_at IS NULL
          AND a.deleted_at IS NULL
          AND (p_campaign IS NULL OR o.campaign = p_campaign)
        GROUP BY a.created_by
      ) sub
      LEFT JOIN sales s ON sub.created_by = s.id
    ),
    'activity_type_counts', (
      SELECT COALESCE(jsonb_object_agg(type, cnt), '{}'::jsonb)
      FROM (
        SELECT a.type, count(*) as cnt
        FROM activities a
        JOIN opportunities o ON a.opportunity_id = o.id
        WHERE o.deleted_at IS NULL
          AND a.deleted_at IS NULL
          AND (p_campaign IS NULL OR o.campaign = p_campaign)
        GROUP BY a.type
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_campaign_report_stats(TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_campaign_report_stats IS
  'Server-side aggregation for Campaign Activity Report. Returns campaign options with counts,
   sales rep activity breakdown, and activity type counts. Replaces client-side Map/forEach
   aggregations that downloaded 1000+ records. Optional p_campaign parameter filters sales_rep
   and activity_type stats to a specific campaign.';
