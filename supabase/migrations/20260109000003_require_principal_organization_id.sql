-- ============================================================================
-- Migration: require_principal_organization_id.sql
-- ============================================================================
-- PURPOSE: Make principal_organization_id required on opportunities table
--
-- BUSINESS RULE:
-- MFB is a food distribution broker. Every opportunity represents a deal
-- for a specific principal (manufacturer). Opportunities without a principal
-- are orphaned records that violate the business model.
--
-- PRE-CONDITION CHECK:
-- Verify no null values exist before applying constraint:
--   SELECT COUNT(*) FROM opportunities WHERE principal_organization_id IS NULL;
--   Expected: 0
--
-- AFFECTED:
-- - opportunities.principal_organization_id column
-- - Zod schema in src/atomic-crm/validation/opportunities.ts (updated separately)
--
-- ROLLBACK:
--   ALTER TABLE opportunities ALTER COLUMN principal_organization_id DROP NOT NULL;
-- ============================================================================

-- Add NOT NULL constraint
-- This enforces the business rule at the database level
ALTER TABLE opportunities
ALTER COLUMN principal_organization_id SET NOT NULL;

-- ============================================================================
-- VERIFICATION (run after migration):
-- ============================================================================
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'opportunities' AND column_name = 'principal_organization_id';
-- Expected: is_nullable = 'NO'
-- ============================================================================
