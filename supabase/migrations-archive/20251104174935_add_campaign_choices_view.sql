-- Create view for distinct campaign values used in opportunity filters
-- Returns campaign names with opportunity counts for filter dropdown

CREATE OR REPLACE VIEW campaign_choices AS
SELECT
  campaign AS id,
  campaign AS name,
  COUNT(*) AS opportunity_count
FROM opportunities
WHERE campaign IS NOT NULL
  AND campaign != ''
  AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign ASC;

COMMENT ON VIEW campaign_choices IS 'Distinct campaign values from opportunities for filter dropdowns. Returns campaign name as both id and name for React Admin compatibility.';

-- Grant SELECT permission to authenticated users (Layer 1 Security)
GRANT SELECT ON campaign_choices TO authenticated;
