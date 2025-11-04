-- Remove food-specific fields from products table to align with PRD
-- Rationale: PRD shows basic Product schema (name, category, description, status)
-- PRD states "Certifications: None required"
-- Fields are nullable and unused (0 products in database)

-- Remove food-specific metadata fields
ALTER TABLE products DROP COLUMN IF EXISTS nutritional_info;
ALTER TABLE products DROP COLUMN IF EXISTS allergens;
ALTER TABLE products DROP COLUMN IF EXISTS certifications;
ALTER TABLE products DROP COLUMN IF EXISTS ingredients;
ALTER TABLE products DROP COLUMN IF EXISTS marketing_description;

-- Note: Products table now matches PRD's simple catalog model:
-- - Core: name, sku, category, description
-- - Status: status enum (active, discontinued, seasonal, etc.)
-- - Relationships: principal_id, distributor_id
-- - Audit: created_at, updated_at, created_by, updated_by, deleted_at

-- If food-specific tracking becomes needed in future, these can be re-added
-- or moved to a separate product_metadata JSONB field for flexibility
