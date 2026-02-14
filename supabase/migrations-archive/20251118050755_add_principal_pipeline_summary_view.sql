-- Migration: Add principal_pipeline_summary view for Dashboard V3
-- Purpose: Aggregate opportunity pipeline data by principal organization
-- CORRECTED: Fixes LEFT JOIN, removes pipeline_value, proper sales_id aggregation

-- First, add 'note' to interaction_type enum for simple note logging
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'note';

-- Drop existing view to allow column rename (PostgreSQL limitation)
DROP VIEW IF EXISTS principal_pipeline_summary;

-- Create the view with 'id' column for React Admin compatibility
CREATE VIEW principal_pipeline_summary AS
SELECT
  o.id as id,  -- React Admin requires 'id'
  o.id as principal_id,
  o.name as principal_name,

  -- Count only non-closed opportunities (exclude closed_won, closed_lost)
  COUNT(DISTINCT opp.id) FILTER (
    WHERE opp.stage NOT IN ('closed_won', 'closed_lost')
  ) as total_pipeline,

  -- Active this week: opportunities with activity in last 7 days
  COUNT(DISTINCT CASE
    WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      AND opp.stage NOT IN ('closed_won', 'closed_lost')
    THEN opp.id
  END) as active_this_week,

  -- Active last week: opportunities with activity 8-14 days ago
  COUNT(DISTINCT CASE
    WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
      AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      AND opp.stage NOT IN ('closed_won', 'closed_lost')
    THEN opp.id
  END) as active_last_week,

  -- Momentum calculation
  CASE
    -- Stale: has opportunities but no activity in 14 days
    WHEN COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage NOT IN ('closed_won', 'closed_lost')) > 0
      AND COUNT(DISTINCT CASE
        WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        THEN opp.id
      END) = 0
    THEN 'stale'

    -- Increasing: more activity this week than last week
    WHEN COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END) > COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END)
    THEN 'increasing'

    -- Decreasing: less activity this week than last week
    WHEN COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END) < COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END)
    THEN 'decreasing'

    -- Steady: same activity level
    ELSE 'steady'
  END as momentum,

  -- Next action: earliest incomplete task for this principal's opportunities
  (SELECT t.title
   FROM tasks t
   INNER JOIN opportunities sub_opp ON t.opportunity_id = sub_opp.id
   WHERE sub_opp.principal_organization_id = o.id
     AND t.completed = false
     AND sub_opp.deleted_at IS NULL
   ORDER BY t.due_date ASC
   LIMIT 1
  ) as next_action_summary,

  -- Sales ID: account manager from most recent opportunity
  (SELECT account_manager_id
   FROM opportunities
   WHERE principal_organization_id = o.id
     AND deleted_at IS NULL
     AND account_manager_id IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 1
  ) as sales_id

FROM organizations o

--  LEFT JOIN with deleted_at filter IN the JOIN condition
-- This preserves principals with zero opportunities
LEFT JOIN opportunities opp
  ON o.id = opp.principal_organization_id
  AND opp.deleted_at IS NULL

LEFT JOIN activities a
  ON opp.id = a.opportunity_id
  AND a.deleted_at IS NULL

WHERE o.organization_type = 'principal'
  AND o.deleted_at IS NULL

--  Group only by principal fields (sales_id comes from subquery)
GROUP BY o.id, o.name;

-- Grant permissions to authenticated users
-- NOTE: Views inherit RLS from their base tables (organizations, opportunities, activities)
-- All base tables already have RLS policies requiring authenticated role
-- No additional RLS policy needed on the view itself (views can't have RLS policies)
GRANT SELECT ON principal_pipeline_summary TO authenticated;

-- Performance optimization: Index on activity_date for date range queries
CREATE INDEX IF NOT EXISTS idx_activities_activity_date_not_deleted
ON activities(activity_date DESC)
WHERE deleted_at IS NULL;

-- Index on opportunity principal relationship
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_org_not_deleted
ON opportunities(principal_organization_id)
WHERE deleted_at IS NULL;

-- Index for account_manager_id subquery (most recent opportunity)
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_created
ON opportunities(principal_organization_id, created_at DESC)
WHERE deleted_at IS NULL AND account_manager_id IS NOT NULL;
