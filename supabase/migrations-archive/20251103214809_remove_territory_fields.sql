-- Remove territory field from database
-- Rationale: PRD states "No Team Hierarchy: Flat structure, no territory or team concepts"
-- The CRM uses principal-based organization (brands/manufacturers), not geographic territories
-- Field is unused (verified 0 data in production)

-- Remove territory field from opportunity_participants
-- This field was never used and contradicts the principal-based sales model
ALTER TABLE opportunity_participants DROP COLUMN IF EXISTS territory;

-- Note: product_distributor_authorizations table was already removed in migration 20251031132404
-- No action needed for territory_restrictions field

-- Note: If Phase 3 territory management is implemented, this field can be re-added
-- with proper schema design that aligns with the principal-based model
