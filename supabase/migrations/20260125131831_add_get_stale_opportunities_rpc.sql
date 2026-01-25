-- =====================================================
-- Get Stale Opportunities for Campaign Activity Report
-- =====================================================
--
-- Purpose: Server-side RPC for stale leads feature in Campaign Activity Report
--          Replaces client-side implementation that used perPage: 1000 (time bomb)
--
-- Features:
--   - Returns opportunities for a specific campaign
--   - Filters to active stages only (excludes closed_won, closed_lost)
--   - Uses per-stage stale thresholds from PRD Section 6.3
--   - Calculates days inactive based on last activity date
--   - Optionally filters by date range and sales rep
--
-- Per-Stage Stale Thresholds (PRD Section 6.3):
--   - new_lead: 7 days
--   - initial_outreach: 14 days
--   - sample_visit_offered: 14 days
--   - feedback_logged: 21 days
--   - demo_scheduled: 14 days
--
-- =====================================================

-- =====================================================
-- Type: Stale Opportunity Record (Campaign Report)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stale_opportunity_record') THEN
    CREATE TYPE stale_opportunity_record AS (
      id BIGINT,
      name TEXT,
      stage TEXT,
      customer_organization_name TEXT,
      last_activity_date TIMESTAMPTZ,
      days_inactive INT,
      stage_threshold INT,
      is_stale BOOLEAN
    );
  END IF;
END $$;

-- =====================================================
-- Function: Get Stale Opportunities for Campaign
-- =====================================================
-- Returns opportunities for a campaign that exceed their
-- stage-specific activity thresholds.
--
-- Parameters:
--   p_campaign - Campaign name to filter by
--   p_start_date - Optional start date for activity filter
--   p_end_date - Optional end date for activity filter
--   p_sales_rep_id - Optional sales rep ID to filter by
--
-- Returns: Array of stale_opportunity_record
-- =====================================================

CREATE OR REPLACE FUNCTION get_stale_opportunities(
  p_campaign TEXT,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_sales_rep_id BIGINT DEFAULT NULL
)
RETURNS SETOF stale_opportunity_record
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stage_thresholds AS (
    -- Per-stage stale thresholds from PRD Section 6.3
    SELECT unnest(ARRAY['new_lead', 'initial_outreach', 'sample_visit_offered', 'feedback_logged', 'demo_scheduled']) AS stage,
           unnest(ARRAY[7, 14, 14, 21, 14]) AS threshold_days
  ),
  opportunity_activity AS (
    -- Get last activity date for each opportunity in the campaign
    SELECT
      o.id AS opportunity_id,
      o.name,
      o.stage::TEXT,
      o.customer_organization_id,
      o.created_at,
      COALESCE(
        MAX(a.activity_date),
        o.created_at
      ) AS last_activity_date
    FROM opportunities o
    LEFT JOIN activities a ON o.id = a.opportunity_id
      AND a.deleted_at IS NULL
      AND (p_start_date IS NULL OR a.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR a.activity_date <= p_end_date)
      AND (p_sales_rep_id IS NULL OR a.created_by = p_sales_rep_id)
    WHERE o.campaign = p_campaign
      AND o.deleted_at IS NULL
      AND o.stage NOT IN ('closed_won', 'closed_lost')
      AND (p_sales_rep_id IS NULL OR o.opportunity_owner_id = p_sales_rep_id)
    GROUP BY o.id, o.name, o.stage, o.customer_organization_id, o.created_at
  )
  SELECT
    oa.opportunity_id AS id,
    oa.name,
    oa.stage,
    cust.name AS customer_organization_name,
    oa.last_activity_date,
    EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT AS days_inactive,
    st.threshold_days AS stage_threshold,
    (EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days) AS is_stale
  FROM opportunity_activity oa
  JOIN stage_thresholds st ON oa.stage = st.stage
  LEFT JOIN organizations cust ON oa.customer_organization_id = cust.id
  WHERE EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days
  ORDER BY days_inactive DESC;
$$;

COMMENT ON FUNCTION get_stale_opportunities(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) IS
'Returns stale opportunities for a campaign using per-stage thresholds from PRD Section 6.3.
Replaces client-side calculation that downloaded all opportunities (perPage: 1000 time bomb).
Optionally filters by date range and sales rep. Only returns opportunities that exceed their stage threshold.';

-- =====================================================
-- Grants
-- =====================================================

-- Grant to authenticated role for client-side queries
GRANT EXECUTE ON FUNCTION get_stale_opportunities(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) TO authenticated;

-- Grant to service_role for Edge Functions
GRANT EXECUTE ON FUNCTION get_stale_opportunities(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BIGINT) TO service_role;

-- =====================================================
-- End of Migration
-- =====================================================
