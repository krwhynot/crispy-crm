-- Remove Financial Tracking: Complete Removal
--
-- Context: Final phase of relationship-focused CRM transformation
-- Previous: October 2025 removed product pricing (list_price, unit_price, etc.)
-- This migration: Remove opportunity/organization financial tracking
--
-- Drops:
-- - opportunities.amount (deal value tracking)
-- - organizations.annual_revenue (company revenue)
-- - opportunity_participants.commission_rate (sales compensation)
-- - pricing_model_type enum (orphaned from previous table removal)

-- Drop opportunity deal value tracking
ALTER TABLE opportunities
  DROP COLUMN IF EXISTS amount;

-- Drop organization revenue tracking
ALTER TABLE organizations
  DROP COLUMN IF EXISTS annual_revenue;

-- Drop sales commission tracking
ALTER TABLE opportunity_participants
  DROP COLUMN IF EXISTS commission_rate;

-- Drop orphaned enum (tables using it were dropped in 20251031132404)
DROP TYPE IF EXISTS pricing_model_type CASCADE;

-- Rationale: Atomic CRM is relationship-focused, not sales-focused
-- Financial data (if needed) is tracked externally in accounting systems
