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

-- Drop views that depend on annual_revenue column
DROP VIEW IF EXISTS organizations_summary;
DROP VIEW IF EXISTS organizations_with_account_manager;

-- Drop organization revenue tracking
ALTER TABLE organizations
  DROP COLUMN IF EXISTS annual_revenue;

-- Drop sales commission tracking
ALTER TABLE opportunity_participants
  DROP COLUMN IF EXISTS commission_rate;

-- Drop orphaned enum (tables using it were dropped in 20251031132404)
DROP TYPE IF EXISTS pricing_model_type CASCADE;

-- Recreate organizations_summary view without annual_revenue
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.priority,
  o.segment_id,
  o.employee_count,
  o.phone,
  o.website,
  o.postal_code,
  o.city,
  o.state,
  o.description,
  o.created_at,
  COUNT(DISTINCT opp.id) AS nb_opportunities,
  COUNT(DISTINCT c.id) AS nb_contacts,
  MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
  LEFT JOIN opportunities opp ON (
    opp.customer_organization_id = o.id
    OR opp.principal_organization_id = o.id
    OR opp.distributor_organization_id = o.id
  ) AND opp.deleted_at IS NULL
  LEFT JOIN contacts c ON c.organization_id = o.id AND c.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Recreate organizations_with_account_manager view without annual_revenue
CREATE OR REPLACE VIEW organizations_with_account_manager AS
SELECT
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  o.priority,
  o.website,
  o.address,
  o.city,
  o.state,
  o.postal_code,
  o.phone,
  o.email,
  o.logo_url,
  o.linkedin_url,
  o.employee_count,
  o.founded_year,
  o.notes,
  o.sales_id,
  o.created_at,
  o.updated_at,
  o.created_by,
  o.deleted_at,
  o.import_session_id,
  o.search_tsv,
  o.context_links,
  o.description,
  o.tax_identifier,
  o.segment_id,
  o.updated_by,
  COALESCE(s.first_name || COALESCE(' ' || s.last_name, ''), 'Unassigned') AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user
FROM organizations o
  LEFT JOIN sales s ON o.sales_id = s.id;

-- Rationale: Atomic CRM is relationship-focused, not sales-focused
-- Financial data (if needed) is tracked externally in accounting systems
