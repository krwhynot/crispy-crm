-- Migration: Resolve field name mismatches between UI and database
-- Phase 3: Align database column names with UI form field sources
-- Created: 2025-10-18
--
-- Context: UI components use different source names than database columns
-- This migration renames database columns to match UI sources for consistency
-- and to prevent potential bugs from data provider mapping assumptions

-- ============================================================================
-- ORGANIZATIONS TABLE: Rename logo_url to logo
-- ============================================================================
-- UI uses: <ImageEditorField source="logo" ... />
-- DB has: logo_url column
-- Resolution: Rename DB column to match UI (shorter, clearer name)
ALTER TABLE organizations
  RENAME COLUMN logo_url TO logo;

COMMENT ON COLUMN organizations.logo IS 'Organization logo image URL (renamed from logo_url 2025-10-18 to match UI source field)';

-- ============================================================================
-- SALES TABLE: Rename is_admin to administrator
-- ============================================================================
-- UI uses: <BooleanInput source="administrator" />
-- DB has: is_admin column
-- Resolution: Rename DB column to match UI (more semantic name)
ALTER TABLE sales
  RENAME COLUMN is_admin TO administrator;

COMMENT ON COLUMN sales.administrator IS 'Administrator privileges flag (renamed from is_admin 2025-10-18 to match UI source field)';
