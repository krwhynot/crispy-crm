-- ============================================================================
-- Create distinct_opportunities_campaigns view for efficient campaign filtering
-- ============================================================================
-- Date: 2025-12-21
-- Description: Creates a view that returns unique opportunity campaigns.
--              This view is used by the OpportunityListFilter component to
--              show all available campaigns without fetching the entire
--              opportunity catalog (previously fetched 1000 records).
--
-- Benefits:
--   - Efficient: Returns only unique campaigns, not all opportunities
--   - Scalable: Works regardless of opportunity count (no pagination limit)
--   - Dynamic: Always reflects current opportunity campaigns
--
-- Performance Impact: P0-PERF-1 fix
--   BEFORE: Fetch 1000 full opportunity records → extract distinct campaigns
--   AFTER:  Fetch ~10-50 rows with 2 fields (id, name)
-- ============================================================================

CREATE OR REPLACE VIEW distinct_opportunities_campaigns AS
  SELECT DISTINCT
    campaign AS id,
    campaign AS name
  FROM opportunities
  WHERE
    campaign IS NOT NULL
    AND deleted_at IS NULL
  ORDER BY name;

-- Add comment for documentation
COMMENT ON VIEW distinct_opportunities_campaigns IS
  'Returns unique opportunity campaigns for filter UI - P0 performance fix';

-- Grant SELECT permission to authenticated users
GRANT SELECT ON distinct_opportunities_campaigns TO authenticated;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Manual - for reference only)
-- ============================================================================
-- If you need to rollback this migration, run:
-- DROP VIEW IF EXISTS distinct_opportunities_campaigns;
-- ============================================================================
