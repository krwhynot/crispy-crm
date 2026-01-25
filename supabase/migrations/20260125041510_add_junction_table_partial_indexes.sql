-- Migration: Add partial indexes on junction table foreign keys for RLS EXISTS performance
-- Reference: DATABASE_LAYER.md - "Performance Note: The double EXISTS checks require indexes"
-- These partial indexes optimize RLS policies that use EXISTS subqueries with deleted_at IS NULL

-- ============================================================================
-- OPPORTUNITY_CONTACTS (both FKs missing partial indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_opportunity_contacts_opportunity_id_partial
  ON opportunity_contacts (opportunity_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunity_contacts_contact_id_partial
  ON opportunity_contacts (contact_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PRODUCT_DISTRIBUTORS (both FKs missing partial indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_product_distributors_product_id_partial
  ON product_distributors (product_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_distributors_distributor_id_partial
  ON product_distributors (distributor_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- DISTRIBUTOR_PRINCIPAL_AUTHORIZATIONS (both FKs missing partial indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_dpa_distributor_id_partial
  ON distributor_principal_authorizations (distributor_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dpa_principal_id_partial
  ON distributor_principal_authorizations (principal_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- INTERACTION_PARTICIPANTS (all FKs missing partial indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_interaction_participants_activity_id_partial
  ON interaction_participants (activity_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interaction_participants_contact_id_partial
  ON interaction_participants (contact_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PRODUCT_DISTRIBUTOR_AUTHORIZATIONS (both FKs missing partial indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pda_product_id_partial
  ON product_distributor_authorizations (product_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pda_distributor_id_partial
  ON product_distributor_authorizations (distributor_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PRODUCT_FEATURES (FK missing partial index)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_product_features_product_id_partial
  ON product_features (product_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- OPPORTUNITY_PRODUCTS (product_id_reference missing partial index)
-- Note: opportunity_id already has partial index
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_opportunity_products_product_id_partial
  ON opportunity_products (product_id_reference)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- OPPORTUNITY_PARTICIPANTS (organization_id missing partial index)
-- Note: opportunity_id already has partial index
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_opportunity_participants_org_id_partial
  ON opportunity_participants (organization_id)
  WHERE deleted_at IS NULL;
