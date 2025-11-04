-- Remove Phase 3 features from database to align with PRD scope
-- Rationale: PRD lists these as "Phase 3 Features" (future/post-MVP)
-- Current implementation should focus on MVP requirements only

-- 1. Remove commission_rate field from opportunity_participants
-- Commission tracking is explicitly listed as Phase 3 in PRD
-- Field is unused (verified 0 data)
ALTER TABLE opportunity_participants DROP COLUMN IF EXISTS commission_rate;

-- 2. Drop contact_preferred_principals table
-- This table tracks principal advocacy/preferences but is not mentioned in PRD
-- Table is unused (verified 0 data)
-- Can be re-added in Phase 3 if needed
DROP TABLE IF EXISTS contact_preferred_principals;

-- Note: Keeping test_user_metadata table for testing infrastructure
-- Note: Keeping interaction_participants table for multi-participant meeting tracking

-- If Phase 3 features are implemented, these can be re-added:
-- - commission_rate: Add to opportunity_participants with proper commission tracking schema
-- - contact_preferred_principals: Re-create with advocacy strength and interaction tracking
