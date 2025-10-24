-- Create partial index for activities lookup by opportunity
-- PARTIAL INDEX only includes interaction records, reducing index size

CREATE INDEX IF NOT EXISTS idx_activities_opportunity_lookup
ON activities(opportunity_id, activity_type, deleted_at)
WHERE activity_type = 'interaction';

COMMENT ON INDEX idx_activities_opportunity_lookup IS
  'Optimizes opportunities_summary view aggregations for interaction counts';
