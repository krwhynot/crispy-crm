-- Migration: Add columns to support data import
-- Purpose: Enable import of operator segments, playbook categories, cuisine types, and review flags
-- Author: Claude Code
-- Date: 2025-12-07

-- ============================================
-- 1. ADD ui_group TO segments
-- ============================================
-- Allows classification of operator segments into Commercial vs Institutional groups
-- Used for UI organization in segment selection dropdowns

ALTER TABLE segments
ADD COLUMN IF NOT EXISTS ui_group text;

COMMENT ON COLUMN segments.ui_group IS 'UI grouping for operator segments: Commercial or Institutional';

-- ============================================
-- 2. ADD playbook_category_id TO organizations
-- ============================================
-- Links organizations directly to their playbook category segment
-- Separate from segment_id which is used for operator segments

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS playbook_category_id uuid REFERENCES segments(id) ON DELETE SET NULL;

COMMENT ON COLUMN organizations.playbook_category_id IS 'Reference to playbook category segment for this organization';

-- Create index for efficient playbook category lookups
CREATE INDEX IF NOT EXISTS idx_organizations_playbook_category_id
ON organizations(playbook_category_id)
WHERE playbook_category_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================
-- 3. ADD cuisine TO organizations
-- ============================================
-- Stores the cuisine type for restaurant/operator organizations
-- Examples: Italian, Mexican, American, Asian, etc.

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS cuisine text;

COMMENT ON COLUMN organizations.cuisine IS 'Cuisine type for restaurant/operator organizations';

-- Create index for cuisine filtering
CREATE INDEX IF NOT EXISTS idx_organizations_cuisine
ON organizations(cuisine)
WHERE cuisine IS NOT NULL AND deleted_at IS NULL;

-- ============================================
-- 4. ADD needs_review TO organizations
-- ============================================
-- Flag for marking organizations that need manual review
-- Used during data import to flag records with data quality issues

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS needs_review text;

COMMENT ON COLUMN organizations.needs_review IS 'Flag indicating organization needs manual review, with reason';

-- Create partial index for finding orgs needing review
CREATE INDEX IF NOT EXISTS idx_organizations_needs_review
ON organizations(needs_review)
WHERE needs_review IS NOT NULL AND deleted_at IS NULL;

-- ============================================
-- 5. UPDATE RLS POLICIES (if needed)
-- ============================================
-- The new columns inherit existing RLS policies on the organizations table
-- No additional RLS changes required

-- ============================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================
-- Run these after migration to verify:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'segments' AND column_name = 'ui_group';
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'organizations'
--   AND column_name IN ('playbook_category_id', 'cuisine', 'needs_review');
