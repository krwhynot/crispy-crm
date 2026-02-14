-- Remove product pricing infrastructure to align with PRD scope
-- Rationale: PRD states "No Currency/Pricing: Products are catalog items only"
-- Previous migration (20251028040008) removed pricing fields from products table
-- This completes the cleanup by removing supporting pricing tables

-- 1. Drop product_pricing_tiers (tiered volume pricing)
-- Table tracks quantity-based pricing tiers
-- Unused (0 rows), contradicts catalog-only model
DROP TABLE IF EXISTS product_pricing_tiers CASCADE;

-- 2. Drop product_pricing_models (pricing strategy definitions)
-- Table defines pricing model types (fixed, tiered, volume, subscription, custom)
-- Unused (0 rows), pricing belongs outside product catalog
DROP TABLE IF EXISTS product_pricing_models CASCADE;

-- 3. Drop product_distributor_authorizations (distributor-specific pricing/territory)
-- Table tracks which distributors can sell which products
-- Unused (0 rows), includes territory_restrictions array field
-- Product authorization tracking not in PRD scope
DROP TABLE IF EXISTS product_distributor_authorizations CASCADE;

-- Note: Products table now only contains catalog information
-- Pricing negotiation and quotes should be handled outside the product catalog
-- If Phase 3 requires pricing, tables can be recreated with updated schema
