-- Migration: Add text length constraints to organizations table
-- Date: 2025-12-25
-- Purpose: Aligns database constraints with Zod validation schema
-- Defense-in-depth: Zod validates at API boundary, DB is last line of defense
-- Reference: src/atomic-crm/validation/organizations.ts

BEGIN;

-- ============================================================================
-- Core identity fields
-- ============================================================================
ALTER TABLE public.organizations
  ADD CONSTRAINT chk_org_name_length
    CHECK (char_length(name) <= 255);

-- ============================================================================
-- Contact fields
-- ============================================================================
ALTER TABLE public.organizations
  ADD CONSTRAINT chk_org_phone_length
    CHECK (phone IS NULL OR char_length(phone) <= 30),
  ADD CONSTRAINT chk_org_email_length
    CHECK (email IS NULL OR char_length(email) <= 254),
  ADD CONSTRAINT chk_org_website_length
    CHECK (website IS NULL OR char_length(website) <= 2048),
  ADD CONSTRAINT chk_org_linkedin_url_length
    CHECK (linkedin_url IS NULL OR char_length(linkedin_url) <= 2048),
  ADD CONSTRAINT chk_org_logo_url_length
    CHECK (logo_url IS NULL OR char_length(logo_url) <= 2048);

-- ============================================================================
-- Address fields
-- ============================================================================
ALTER TABLE public.organizations
  ADD CONSTRAINT chk_org_address_length
    CHECK (address IS NULL OR char_length(address) <= 500),
  ADD CONSTRAINT chk_org_city_length
    CHECK (city IS NULL OR char_length(city) <= 100),
  ADD CONSTRAINT chk_org_state_length
    CHECK (state IS NULL OR char_length(state) <= 100),
  ADD CONSTRAINT chk_org_postal_code_length
    CHECK (postal_code IS NULL OR char_length(postal_code) <= 20);

-- ============================================================================
-- Long text fields
-- ============================================================================
ALTER TABLE public.organizations
  ADD CONSTRAINT chk_org_description_length
    CHECK (description IS NULL OR char_length(description) <= 5000),
  ADD CONSTRAINT chk_org_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 5000);

-- ============================================================================
-- Business fields
-- ============================================================================
ALTER TABLE public.organizations
  ADD CONSTRAINT chk_org_tax_identifier_length
    CHECK (tax_identifier IS NULL OR char_length(tax_identifier) <= 50),
  ADD CONSTRAINT chk_org_territory_length
    CHECK (territory IS NULL OR char_length(territory) <= 100),
  ADD CONSTRAINT chk_org_cuisine_length
    CHECK (cuisine IS NULL OR char_length(cuisine) <= 100);

-- ============================================================================
-- Billing address fields
-- ============================================================================
ALTER TABLE public.organizations
  ADD CONSTRAINT chk_org_billing_street_length
    CHECK (billing_street IS NULL OR char_length(billing_street) <= 255),
  ADD CONSTRAINT chk_org_billing_city_length
    CHECK (billing_city IS NULL OR char_length(billing_city) <= 100),
  ADD CONSTRAINT chk_org_billing_state_length
    CHECK (billing_state IS NULL OR char_length(billing_state) <= 2),
  ADD CONSTRAINT chk_org_billing_postal_code_length
    CHECK (billing_postal_code IS NULL OR char_length(billing_postal_code) <= 20),
  ADD CONSTRAINT chk_org_billing_country_length
    CHECK (billing_country IS NULL OR char_length(billing_country) <= 2);

-- ============================================================================
-- Shipping address fields
-- ============================================================================
ALTER TABLE public.organizations
  ADD CONSTRAINT chk_org_shipping_street_length
    CHECK (shipping_street IS NULL OR char_length(shipping_street) <= 255),
  ADD CONSTRAINT chk_org_shipping_city_length
    CHECK (shipping_city IS NULL OR char_length(shipping_city) <= 100),
  ADD CONSTRAINT chk_org_shipping_state_length
    CHECK (shipping_state IS NULL OR char_length(shipping_state) <= 2),
  ADD CONSTRAINT chk_org_shipping_postal_code_length
    CHECK (shipping_postal_code IS NULL OR char_length(shipping_postal_code) <= 20),
  ADD CONSTRAINT chk_org_shipping_country_length
    CHECK (shipping_country IS NULL OR char_length(shipping_country) <= 2);

-- ============================================================================
-- Update table comment
-- ============================================================================
COMMENT ON TABLE public.organizations IS
  'Organizations table with text length constraints matching Zod validation schema. See src/atomic-crm/validation/organizations.ts for authoritative limits.';

COMMIT;
