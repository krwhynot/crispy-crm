-- Migration: Remove deprecated organization boolean flags
-- Phase 1: Clean up legacy columns replaced by organization_type enum
-- Created: 2025-10-18
--
-- Context: is_principal and is_distributor were replaced by the organization_type enum
-- which provides better type safety and eliminates redundant boolean flags.

-- Remove deprecated boolean flags from organizations table
ALTER TABLE organizations
  DROP COLUMN IF EXISTS is_principal,
  DROP COLUMN IF EXISTS is_distributor;

-- Add comment documenting the change
COMMENT ON TABLE organizations IS 'Organizations table - is_principal and is_distributor removed 2025-10-18, use organization_type enum instead';
