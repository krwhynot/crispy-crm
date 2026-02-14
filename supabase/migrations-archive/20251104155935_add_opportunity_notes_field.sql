-- Add notes field to opportunities table
-- Reference: Phase 3 Epic 1 Story 3 Task 1
-- Rationale: General notes field separate from activity log for quick reference information
-- Example: "Customer requested sample products", "Follow up with decision maker in 2 weeks"

-- 1. Add notes field (TEXT for flexibility, nullable)
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN opportunities.notes IS 'General notes about the opportunity. Separate from activity log for quick reference information. Example: "Customer requested sample products"';

-- 2. Update search trigger to include notes in full-text search
-- Users should be able to search by notes content
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
        COALESCE(NEW.campaign, '') || ' ' ||
        COALESCE(NEW.notes, '')
    );
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_update_opportunities_search_tsv
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunities_search_tsv();

-- Note: No data migration needed - field is nullable and defaults to NULL
-- Existing opportunities remain unchanged

-- Security: Field inherits table-level GRANT permissions and RLS policies
-- No separate permissions needed (follows Engineering Constitution TWO-LAYER SECURITY)
