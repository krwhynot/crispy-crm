-- Migration: Refactor organization fields
-- Date: 2025-01-07
-- Purpose:
--   1. Create industries table to normalize industry data
--   2. Remove country and tax_identifier fields from organizations
--   3. Remove 'vendor' from organization_type enum
--   4. Migrate existing industry data to new table
--   5. Add RPC function for get_or_create_industry

BEGIN;

-- =====================================================
-- 1. Create industries table
-- =====================================================
CREATE TABLE industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT industries_name_unique UNIQUE (name)
);

-- Create case-insensitive unique index
CREATE UNIQUE INDEX industries_name_case_insensitive_idx
ON industries (lower(name));

-- =====================================================
-- 2. Enable RLS and create policies
-- =====================================================
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access"
ON industries FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create"
ON industries FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 3. Create get_or_create_industry RPC function
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_industry(p_name TEXT)
RETURNS SETOF industries AS $$
BEGIN
  -- Try to insert, skip if duplicate
  INSERT INTO industries (name, created_by)
  VALUES (trim(p_name), auth.uid())
  ON CONFLICT (lower(name)) DO NOTHING;

  -- Return the record (new or existing)
  RETURN QUERY
  SELECT * FROM industries
  WHERE lower(name) = lower(trim(p_name));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Add industry_id column to organizations (nullable)
-- =====================================================
ALTER TABLE organizations
ADD COLUMN industry_id UUID REFERENCES industries(id);

-- =====================================================
-- 5. Seed "Unknown" industry
-- =====================================================
INSERT INTO industries (name) VALUES ('Unknown');

-- =====================================================
-- 6. Extract and insert unique industries from old column
-- =====================================================
INSERT INTO industries (name)
SELECT DISTINCT ON (lower(trim(industry))) INITCAP(trim(industry))
FROM organizations
WHERE industry IS NOT NULL AND trim(industry) <> ''
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. Backfill industry_id by matching names
-- =====================================================
UPDATE organizations o
SET industry_id = i.id
FROM industries i
WHERE lower(trim(o.industry)) = lower(i.name);

-- =====================================================
-- 8. Set remaining industry_id to "Unknown"
-- =====================================================
UPDATE organizations
SET industry_id = (SELECT id FROM industries WHERE name = 'Unknown')
WHERE industry_id IS NULL;

-- =====================================================
-- 9. Enforce NOT NULL constraint
-- =====================================================
ALTER TABLE organizations
ALTER COLUMN industry_id SET NOT NULL;

-- =====================================================
-- 10. Drop old industry TEXT column
-- =====================================================
ALTER TABLE organizations
DROP COLUMN industry;

-- =====================================================
-- 11. Drop country column
-- =====================================================
ALTER TABLE organizations
DROP COLUMN country;

-- =====================================================
-- 12. Update organization_type enum (remove "vendor")
-- =====================================================

-- First migrate existing vendor records to unknown
UPDATE organizations
SET organization_type = 'unknown'
WHERE organization_type = 'vendor';

-- Rename old enum
ALTER TYPE organization_type RENAME TO organization_type_old;

-- Create new enum without vendor
CREATE TYPE organization_type AS ENUM (
  'customer',
  'principal',
  'distributor',
  'prospect',
  'partner',
  'unknown'
);

-- Update column with cast
ALTER TABLE organizations
ALTER COLUMN organization_type TYPE organization_type
USING organization_type::text::organization_type;

-- Drop old enum
DROP TYPE organization_type_old;

-- =====================================================
-- 13. Set organization_type DEFAULT to 'unknown'
-- =====================================================
ALTER TABLE organizations
ALTER COLUMN organization_type SET DEFAULT 'unknown';

COMMIT;
