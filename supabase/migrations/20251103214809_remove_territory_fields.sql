-- Remove territory fields from database
-- Rationale: PRD states "No Team Hierarchy: Flat structure, no territory or team concepts"
-- The CRM uses principal-based organization (brands/manufacturers), not geographic territories
-- Both fields are unused (verified 0 data in production)

-- Remove territory field from opportunity_participants
-- This field was never used and contradicts the principal-based sales model
ALTER TABLE opportunity_participants DROP COLUMN IF EXISTS territory;

-- Remove territory_restrictions field from product_distributor_authorizations
-- Product authorization should be based on principal relationships, not geographic territories
ALTER TABLE product_distributor_authorizations DROP COLUMN IF EXISTS territory_restrictions;

-- Note: If Phase 3 territory management is implemented, these fields can be re-added
-- with proper schema design that aligns with the principal-based model
