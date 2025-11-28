-- Remove contact duplicate detection artifacts
-- Per PRD Decision #32 and #44: Admin-only SQL cleanup is sufficient for duplicates
-- These artifacts are no longer needed as DataQualityTab has been removed

-- Drop the merge function first (depends on nothing)
DROP FUNCTION IF EXISTS merge_duplicate_contacts(UUID, UUID[]);

-- Drop the stats view (depends on contact_duplicates)
DROP VIEW IF EXISTS duplicate_stats;

-- Drop the main duplicates view
DROP VIEW IF EXISTS contact_duplicates;

-- Note: The contact_name_normalized column on contacts table is kept for
-- future lightweight duplicate detection if needed via direct SQL queries
