-- ============================================================
-- Migration: Enable pg_trgm extension for fuzzy text search
-- Purpose: Optimize ILIKE '%term%' queries on searchable columns
-- ============================================================

-- Enable pg_trgm extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- CONTACTS TABLE INDEXES
-- ============================================================

-- Primary name search (most common)
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON contacts USING GIN (name gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- First/last name for partial matching
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm
  ON contacts USING GIN (first_name gin_trgm_ops)
  WHERE deleted_at IS NULL AND first_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm
  ON contacts USING GIN (last_name gin_trgm_ops)
  WHERE deleted_at IS NULL AND last_name IS NOT NULL;

-- ============================================================
-- ORGANIZATIONS TABLE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm
  ON organizations USING GIN (name gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON EXTENSION pg_trgm IS
  'Enables fuzzy text search with similarity() and typo tolerance';
