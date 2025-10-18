-- Migration: Remove unused feature columns across all tables
-- Phase 2: Clean up columns that are not exposed in UI edit forms
-- Created: 2025-10-18
--
-- Context: Schema cleanup based on UI edit form AND codebase analysis
-- Verified each column for usage in backend validation, filtering, and UI display
-- Total: 37 columns removed across 6 tables (Contacts: 10, Orgs: 7, Opps: 11, Tasks: 3, Products: 6, Sales: 0)
-- Impact: Reduces schema complexity by ~20%

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

-- Update search trigger function to remove reference to dropped columns
CREATE OR REPLACE FUNCTION update_organizations_search_tsv() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.website, '')), 'D');
    RETURN NEW;
END;
$$;

COMMENT ON TABLE organizations IS 'Organizations table - Removed is_principal, is_distributor (replaced by organization_type enum), and 7 other unused columns on 2025-10-18';

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
-- SALES TABLE: No columns to remove
-- ============================================================================
-- NOTE: phone, avatar_url, is_admin all used in validation/sales.ts Zod schema
-- These columns are NOT exposed in edit forms but ARE used in validation layer
-- Keeping all columns per codebase analysis

COMMENT ON TABLE sales IS 'Sales table - No unused columns found after codebase analysis on 2025-10-18';

-- ============================================================================
-- UPDATE SEARCH TRIGGER FUNCTIONS
-- ============================================================================
-- Fix generic search function to remove references to all dropped columns
CREATE OR REPLACE FUNCTION update_search_tsv() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.city, '') || ' ' ||
            COALESCE(NEW.state, '')
        );
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.last_name, '') || ' ' ||
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.department, '') || ' ' ||
            COALESCE(NEW.email::text, '') || ' ' ||
            COALESCE(NEW.phone::text, '')
        );
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '')
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.sku, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Also update the legacy update_products_search function (if it exists)
CREATE OR REPLACE FUNCTION update_products_search() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.sku, '')
    );
    RETURN NEW;
END;
$$;

-- CRITICAL: Also update products_search_trigger function from base migration
CREATE OR REPLACE FUNCTION products_search_trigger() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.sku, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category::text, '')
    );
    RETURN NEW;
END;
$$;
