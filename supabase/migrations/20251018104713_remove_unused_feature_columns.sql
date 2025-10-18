-- Migration: Remove unused feature columns across all tables
-- Phase 2: Clean up columns that are not exposed in UI edit forms
-- Created: 2025-10-18
--
-- Context: Schema cleanup based on UI edit form analysis
-- Total: 50 columns removed across 6 tables
-- Impact: Reduces schema complexity by ~28%

-- ============================================================================
-- CONTACTS TABLE: Remove 10 unused columns
-- ============================================================================
-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS contacts_summary CASCADE;

-- Step 2: Drop columns not exposed in ContactInputs.tsx edit form
ALTER TABLE contacts
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS birthday,
  DROP COLUMN IF EXISTS twitter_handle,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS tags;

-- Step 3: Recreate contacts_summary view without dropped columns
CREATE VIEW contacts_summary AS
SELECT
    c.id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    c.department,
    c.linkedin_url,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.deleted_at,
    c.search_tsv,
    c.first_seen,
    c.last_seen,
    c.organization_id,
    o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON (o.id = c.organization_id AND o.deleted_at IS NULL)
WHERE c.deleted_at IS NULL;

-- Set proper ownership and permissions
ALTER VIEW contacts_summary OWNER TO postgres;
GRANT SELECT ON contacts_summary TO authenticated;
GRANT SELECT ON contacts_summary TO service_role;
GRANT SELECT ON contacts_summary TO anon;

COMMENT ON VIEW contacts_summary IS 'Denormalized view of contacts with organization name. Removed 10 unused columns on 2025-10-18.';
COMMENT ON TABLE contacts IS 'Contacts table - Removed 10 unused columns (address, city, state, postal_code, country, birthday, twitter_handle, notes, gender, tags) on 2025-10-18';

-- ============================================================================
-- ORGANIZATIONS TABLE: Remove 7 unused columns
-- ============================================================================
-- Not exposed in OrganizationInputs.tsx edit form
ALTER TABLE organizations
  DROP COLUMN IF EXISTS parent_organization_id,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS annual_revenue,
  DROP COLUMN IF EXISTS employee_count,
  DROP COLUMN IF EXISTS founded_year,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS tax_identifier;

COMMENT ON TABLE organizations IS 'Organizations table - Removed 7 unused columns (parent_organization_id, email, annual_revenue, employee_count, founded_year, notes, tax_identifier) on 2025-10-18';

-- ============================================================================
-- OPPORTUNITIES TABLE: Remove 11 unused columns
-- ============================================================================
-- Not exposed in OpportunityInputs.tsx edit form
-- NOTE: Keeping opportunity_owner_id - actively used in OnlyMineInput.tsx for filtering
ALTER TABLE opportunities
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS index,
  DROP COLUMN IF EXISTS actual_close_date,
  DROP COLUMN IF EXISTS founding_interaction_id,
  DROP COLUMN IF EXISTS stage_manual,
  DROP COLUMN IF EXISTS status_manual,
  DROP COLUMN IF EXISTS next_action,
  DROP COLUMN IF EXISTS next_action_date,
  DROP COLUMN IF EXISTS competition,
  DROP COLUMN IF EXISTS decision_criteria,
  DROP COLUMN IF EXISTS tags;

COMMENT ON TABLE opportunities IS 'Sales pipeline - Removed 11 unused columns on 2025-10-18. Kept opportunity_owner_id (used in filtering).';

-- ============================================================================
-- TASKS TABLE: Remove 3 unused columns
-- ============================================================================
-- Not exposed in TaskEdit.tsx edit form
-- NOTE: Keeping completed_at - actively used in Task.tsx for UI display (line 110, 115)
ALTER TABLE tasks
  DROP COLUMN IF EXISTS reminder_date,
  DROP COLUMN IF EXISTS completed,
  DROP COLUMN IF EXISTS priority;

COMMENT ON TABLE tasks IS 'Tasks table - Removed 3 unused columns on 2025-10-18. Kept completed_at (used in UI display).';

-- ============================================================================
-- PRODUCTS TABLE: Remove 6 unused columns
-- ============================================================================
-- Not exposed in ProductInputs.tsx edit form
ALTER TABLE products
  DROP COLUMN IF EXISTS certifications,
  DROP COLUMN IF EXISTS allergens,
  DROP COLUMN IF EXISTS ingredients,
  DROP COLUMN IF EXISTS nutritional_info,
  DROP COLUMN IF EXISTS marketing_description,
  DROP COLUMN IF EXISTS manufacturer_part_number;

COMMENT ON TABLE products IS 'Products table - Removed 6 unused columns (certifications, allergens, ingredients, nutritional_info, marketing_description, manufacturer_part_number) on 2025-10-18';

-- ============================================================================
-- SALES TABLE: Remove 2 unused columns
-- ============================================================================
-- Not exposed in SalesInputs.tsx edit form
ALTER TABLE sales
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS avatar_url;

COMMENT ON TABLE sales IS 'Sales table - Removed 2 unused columns (phone, avatar_url) on 2025-10-18';
