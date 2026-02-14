-- Add campaign and related_opportunity_id fields to opportunities table
-- Reference: Trade show workflow requirements from UI analysis
-- Rationale: Enable grouping related opportunities from same event (e.g., "Winter Fancy Food Show 2025")
--           and linking child opportunities to parent opportunity for follow-up tracking

-- 1. Add campaign field (TEXT for flexibility)
-- Examples: "Winter Fancy Food Show 2025", "Q1 2025 Direct Sales", "Summer Trade Show Circuit"
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS campaign TEXT;

COMMENT ON COLUMN opportunities.campaign IS 'Campaign name for grouping related opportunities from same marketing event or sales initiative. Example: "Winter Fancy Food Show 2025"';

-- 2. Add related_opportunity_id field (self-referencing foreign key)
-- Pattern: Parent-child relationship for follow-up opportunities
-- Example: Trade show visit (parent) -> Follow-up sampling visit (child)
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS related_opportunity_id BIGINT REFERENCES opportunities(id);

COMMENT ON COLUMN opportunities.related_opportunity_id IS 'Optional reference to parent opportunity for follow-up tracking. Example: Initial trade show contact -> Follow-up sampling visit';

-- 3. Create index on campaign for filtering/grouping queries
-- Query pattern: "Show me all opportunities from Winter Fancy Food Show 2025"
CREATE INDEX IF NOT EXISTS idx_opportunities_campaign
  ON opportunities(campaign)
  WHERE campaign IS NOT NULL;

-- 4. Create index on related_opportunity_id for parent-child queries
-- Query pattern: "Show me all follow-up opportunities for this parent opportunity"
CREATE INDEX IF NOT EXISTS idx_opportunities_related_opportunity_id
  ON opportunities(related_opportunity_id)
  WHERE related_opportunity_id IS NOT NULL;

-- 5. Update search trigger to include campaign in full-text search
-- Users should be able to search by campaign name
DROP TRIGGER IF EXISTS trigger_update_opportunities_search_tsv ON opportunities;

CREATE OR REPLACE FUNCTION public.update_opportunities_search_tsv()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.campaign, '')
    );
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_update_opportunities_search_tsv
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunities_search_tsv();

-- Note: No data migration needed - both fields are nullable and default to NULL
-- Existing opportunities remain unchanged

-- Future enhancement: Add campaign_id FK to separate campaigns table if campaigns
-- need metadata (dates, budget, team members) beyond just a name string
