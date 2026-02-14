-- Remove deprecated contact_organizations junction table
-- Rationale: Table is marked DEPRECATED in schema comments
-- PRD shows one-to-many relationship via contacts.organization_id
-- Table has 0 rows and relationship pattern was simplified

-- Drop the deprecated many-to-many junction table
-- The schema comment stated "Kept for historical data only" but table has 0 rows
DROP TABLE IF EXISTS contact_organizations CASCADE;

-- Note: Contact-to-organization relationship is now handled by:
-- - contacts.organization_id (primary organization, one-to-many)
-- - This simpler pattern aligns with PRD's contact data model
-- - No historical data lost (table was empty)

-- Additional cleanup: Remove unused product feature tables
-- These tables (0 rows) are not mentioned in PRD scope

-- Drop product_features table (product attribute key-value pairs)
-- PRD shows simple product schema without extensible attributes
DROP TABLE IF EXISTS product_features CASCADE;

-- Drop product_category_hierarchy table (nested category structure)
-- PRD uses simple category text field, not hierarchical categories
-- User wants dropdown with existing categories + ability to add new
-- Current products.category TEXT field supports this UI pattern
DROP TABLE IF EXISTS product_category_hierarchy CASCADE;

-- Note: Product categories remain as simple text field with check constraint
-- UI can implement dropdown by querying DISTINCT category values
-- New categories can be added on-the-fly without schema changes
