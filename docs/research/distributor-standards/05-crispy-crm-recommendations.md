# Crispy CRM Distributor Modeling - Implementation Recommendations

## Executive Summary

This document synthesizes four research analyses into concrete database schema and implementation recommendations for Crispy CRM's distributor organization modeling. Key recommendations: (1) Extend `organizations` table with parent-child hierarchy via `parent_id` for national/regional distributor structures (Sysco Corp → Sysco Chicago), (2) Create `product_distributors` junction table with vendor item numbers (DOT numbers) to support many-to-many product-distributor relationships, (3) Implement separate `authorizations` table for principal-distributor agreements with temporal validity tracking, (4) Use field-based territory assignment for contacts (district_code, territory_name) rather than normalized tables for MVP simplicity. Schema follows PostgreSQL 17 best practices with Zod validation at API boundary per Crispy CRM standards.

---

## Recommended Database Schema

### 1. Organizations Table Updates

Add hierarchy, scope, and profile fields to support national/regional distributor structures and enhanced business metadata.

```sql
-- Phase 1: Add hierarchy and scope columns
ALTER TABLE organizations
  -- Hierarchy support (Sysco Corp → Sysco Chicago)
  ADD COLUMN parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN org_scope TEXT CHECK (org_scope IN ('national', 'regional', 'local')),
  ADD COLUMN is_operating_entity BOOLEAN DEFAULT true,

  -- Organization type (existing: distributor, principal, operator)
  ADD COLUMN org_type TEXT NOT NULL DEFAULT 'distributor'
    CHECK (org_type IN ('distributor', 'principal', 'operator')),

  -- Core profile fields
  ADD COLUMN account_number TEXT UNIQUE, -- Auto-generated: "DIST-0001"
  ADD COLUMN phone TEXT,
  ADD COLUMN email TEXT,
  ADD COLUMN website TEXT,

  -- Status management (dual-field pattern)
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  ADD COLUMN status_reason TEXT
    CHECK (status_reason IN (
      'active_customer',
      'prospect',
      'authorized_distributor',
      'account_closed',
      'out_of_business',
      'disqualified'
    )),

  -- Addresses (flat model for MVP - supports 2 addresses)
  ADD COLUMN billing_street TEXT,
  ADD COLUMN billing_city TEXT,
  ADD COLUMN billing_state TEXT, -- 2-char state code
  ADD COLUMN billing_postal_code TEXT,
  ADD COLUMN billing_country TEXT DEFAULT 'US',
  ADD COLUMN shipping_street TEXT,
  ADD COLUMN shipping_city TEXT,
  ADD COLUMN shipping_state TEXT,
  ADD COLUMN shipping_postal_code TEXT,
  ADD COLUMN shipping_country TEXT DEFAULT 'US',

  -- Integration identifiers
  ADD COLUMN erp_vendor_code TEXT, -- External ERP identifier
  ADD COLUMN duns_number TEXT CHECK (duns_number ~ '^\d{9}$'), -- D&B identifier
  ADD COLUMN edi_id TEXT, -- EDI identifier (GLN)

  -- Payment terms
  ADD COLUMN payment_terms TEXT
    CHECK (payment_terms IN ('net_30', 'net_60', 'net_90', 'cod', 'prepaid', '2_10_net_30')),
  ADD COLUMN credit_limit DECIMAL(12,2),

  -- Territory assignment
  ADD COLUMN territory TEXT,
  ADD COLUMN account_manager_id UUID REFERENCES users(id);

-- Phase 2: Indexes for performance
CREATE INDEX idx_orgs_parent_id ON organizations(parent_id);
CREATE INDEX idx_orgs_org_scope ON organizations(org_scope);
CREATE INDEX idx_orgs_org_type ON organizations(org_type);
CREATE INDEX idx_orgs_operating ON organizations(is_operating_entity) WHERE is_operating_entity = true;
CREATE INDEX idx_orgs_status ON organizations(status, status_reason);
CREATE INDEX idx_orgs_account_number ON organizations(account_number) WHERE account_number IS NOT NULL;
CREATE INDEX idx_orgs_duns ON organizations(duns_number) WHERE duns_number IS NOT NULL;
CREATE INDEX idx_orgs_territory ON organizations(territory) WHERE territory IS NOT NULL;

-- Phase 3: Constraints for data integrity
ALTER TABLE organizations
  -- National entities must have no parent
  ADD CONSTRAINT national_entities_no_parent
    CHECK (org_scope != 'national' OR parent_id IS NULL),

  -- Regional/local entities must have parent (enforced after backfill)
  -- ADD CONSTRAINT regional_local_must_have_parent
  --   CHECK (org_scope = 'national' OR parent_id IS NOT NULL),

  -- Operating entities typically regional/local (not enforced, guidance only)
  -- National brand entities should set is_operating_entity = false

  -- Status reason must match status (simplified check)
  ADD CONSTRAINT status_reason_matches_status
    CHECK (
      (status = 'active' AND status_reason IN ('active_customer', 'prospect', 'authorized_distributor'))
      OR (status = 'inactive' AND status_reason IN ('account_closed', 'out_of_business', 'disqualified'))
      OR status_reason IS NULL
    );

-- Phase 4: Auto-generate account numbers (trigger)
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_number IS NULL THEN
    NEW.account_number := 'ORG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('org_account_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE org_account_number_seq START 1;

CREATE TRIGGER set_account_number
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION generate_account_number();
```

### 2. New: product_distributors Table

Junction table for many-to-many product-distributor relationships with vendor item numbers (DOT numbers: USF#, Sysco#, GFS#).

```sql
CREATE TABLE product_distributors (
  -- Composite primary key (prevents duplicate relationships)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Vendor item number (DOT number: distributor's internal product code)
  vendor_item_number TEXT, -- "USF#4587291", "Sysco#1092847", "GFS#78234"

  -- Authorization status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive')),

  -- Status tracking timestamps
  authorized_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Temporal validity (contract effective dates)
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT 'infinity',

  -- Business context
  notes TEXT, -- Authorization notes, restrictions, pricing notes

  -- Audit fields (Crispy CRM standard)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  PRIMARY KEY (product_id, distributor_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_product_dist_product ON product_distributors(product_id);
CREATE INDEX idx_product_dist_distributor ON product_distributors(distributor_id);
CREATE INDEX idx_product_dist_status ON product_distributors(status);
CREATE INDEX idx_product_dist_vendor_item ON product_distributors(vendor_item_number)
  WHERE vendor_item_number IS NOT NULL;
CREATE INDEX idx_product_dist_valid_period ON product_distributors(valid_from, valid_to);

-- Composite index for active authorization queries
CREATE INDEX idx_product_dist_active ON product_distributors(distributor_id, status)
  WHERE status = 'active' AND valid_to = 'infinity';

-- Trigger to set authorized_at timestamp
CREATE OR REPLACE FUNCTION set_authorization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.authorized_at IS NULL THEN
    NEW.authorized_at := NOW();
  END IF;
  IF NEW.status = 'inactive' AND OLD.status != 'inactive' AND NEW.deactivated_at IS NULL THEN
    NEW.deactivated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_dist_status_change
  BEFORE UPDATE ON product_distributors
  FOR EACH ROW
  EXECUTE FUNCTION set_authorization_timestamp();
```

### 3. New: authorizations Table

High-level principal-distributor authorization agreements (master agreements covering multiple products).

```sql
CREATE TABLE authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties to the agreement
  principal_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Authorization status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive', 'expired')),

  -- Status tracking
  authorized_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Contract terms
  contract_start_date DATE,
  contract_end_date DATE,
  contract_number TEXT, -- External contract reference

  -- Temporal validity (when this record is valid)
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT 'infinity',

  -- Business context
  notes TEXT,
  terms_summary TEXT, -- High-level agreement terms

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Unique constraint: one active agreement per principal-distributor pair
  UNIQUE (principal_id, distributor_id, valid_from)
);

-- Indexes
CREATE INDEX idx_auth_principal ON authorizations(principal_id);
CREATE INDEX idx_auth_distributor ON authorizations(distributor_id);
CREATE INDEX idx_auth_status ON authorizations(status);
CREATE INDEX idx_auth_valid_period ON authorizations(valid_from, valid_to);
CREATE INDEX idx_auth_contract_dates ON authorizations(contract_start_date, contract_end_date);

-- Composite index for active authorizations
CREATE INDEX idx_auth_active ON authorizations(principal_id, distributor_id, status)
  WHERE status = 'active' AND valid_to = 'infinity';

-- Trigger to set status timestamps
CREATE OR REPLACE FUNCTION set_auth_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    NEW.authorized_at := NOW();
  END IF;
  IF NEW.status IN ('inactive', 'expired') AND (OLD IS NULL OR OLD.status NOT IN ('inactive', 'expired')) THEN
    NEW.deactivated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auth_status_change
  BEFORE INSERT OR UPDATE ON authorizations
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_status_timestamp();
```

### 4. Contacts Table Updates

Add manager hierarchy, territory assignment, and lifecycle fields.

```sql
-- Add manager relationship and territory fields
ALTER TABLE contacts
  -- Manager hierarchy (adjacency list pattern)
  ADD COLUMN manager_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Territory assignment (simple field-based for MVP)
  ADD COLUMN district_code TEXT, -- "D1", "D73", "D20"
  ADD COLUMN territory_name TEXT, -- "Western Suburbs", "Downtown Chicago"

  -- Lifecycle status
  ADD COLUMN status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'left_company', 'do_not_contact')),
  ADD COLUMN inactivated_at TIMESTAMPTZ,
  ADD COLUMN inactivation_reason TEXT;

-- Indexes
CREATE INDEX idx_contacts_manager ON contacts(manager_id);
CREATE INDEX idx_contacts_district ON contacts(district_code) WHERE district_code IS NOT NULL;
CREATE INDEX idx_contacts_status ON contacts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_org_dept ON contacts(organization_id, department);
```

---

## Complete Enum Value Definitions

### organizations.org_scope
```sql
'national'   -- Top-level entity (e.g., Sysco Corporation, US Foods)
'regional'   -- Geographic/operational subdivision (e.g., Sysco Chicago, US Foods Denver)
'local'      -- Local branch/warehouse (e.g., Sysco Chicago - West Warehouse)
```

### organizations.org_type
```sql
'distributor'  -- Food distributor (Sysco, US Foods, PFG, GFS)
'principal'    -- Food manufacturer/brand (represented by MFB)
'operator'     -- Restaurant/foodservice end customer
```

### organizations.status
```sql
'active'    -- Currently active relationship
'inactive'  -- Temporarily or permanently inactive
```

### organizations.status_reason
```sql
-- Active reasons
'active_customer'         -- Current buying relationship
'prospect'                -- Potential customer, not yet buying
'authorized_distributor'  -- Approved to carry principals' products

-- Inactive reasons
'account_closed'  -- Relationship terminated
'out_of_business' -- Company no longer operating
'disqualified'    -- Does not meet criteria
```

### organizations.payment_terms
```sql
'net_30'       -- Payment due 30 days after invoice
'net_60'       -- Payment due 60 days after invoice
'net_90'       -- Payment due 90 days after invoice
'cod'          -- Cash on delivery
'prepaid'      -- Payment before delivery
'2_10_net_30'  -- 2% discount if paid within 10 days, otherwise net 30
```

### product_distributors.status
```sql
'pending'   -- Authorization requested, awaiting approval
'active'    -- Currently authorized to distribute
'inactive'  -- Authorization revoked or expired
```

### authorizations.status
```sql
'pending'  -- Agreement in negotiation
'active'   -- Agreement in effect
'inactive' -- Agreement terminated
'expired'  -- Agreement past end date
```

### contacts.department
```sql
'senior_management'    -- C-suite, VP level
'sales_management'     -- Regional/national sales leadership
'district_management'  -- District Sales Manager (DSM)
'area_sales'          -- Area Sales Manager, Territory Manager
'sales_specialist'    -- Product specialists, technical sales
'sales_support'       -- Inside sales, sales coordinators
'procurement'         -- Purchasing, buying department
```

### contacts.status
```sql
'active'          -- Current employee, active contact
'inactive'        -- Temporarily unavailable (leave, furlough)
'left_company'    -- No longer employed
'do_not_contact'  -- Opt-out, GDPR compliance
```

---

## Zod Schema Patterns

### Organization Schema

```typescript
import { z } from 'zod';

// Enums matching database constraints
export const OrgScopeEnum = z.enum(['national', 'regional', 'local']);
export const OrgTypeEnum = z.enum(['distributor', 'principal', 'operator']);
export const OrgStatusEnum = z.enum(['active', 'inactive']);
export const OrgStatusReasonEnum = z.enum([
  'active_customer',
  'prospect',
  'authorized_distributor',
  'account_closed',
  'out_of_business',
  'disqualified',
]);
export const PaymentTermsEnum = z.enum([
  'net_30',
  'net_60',
  'net_90',
  'cod',
  'prepaid',
  '2_10_net_30',
]);

// Organization creation/update schema
export const organizationSchema = z.strictObject({
  // Core identity
  name: z.string().min(1).max(255),
  account_number: z.string().max(50).optional(),
  org_type: OrgTypeEnum,
  org_scope: OrgScopeEnum.nullable(),
  parent_id: z.string().uuid().nullable(),
  is_operating_entity: z.boolean().default(true),

  // Status
  status: OrgStatusEnum.default('active'),
  status_reason: OrgStatusReasonEnum.nullable(),

  // Contact info
  phone: z.string().max(20).nullable(),
  email: z.string().email().max(255).nullable(),
  website: z.string().url().max(255).nullable(),

  // Addresses (flat model)
  billing_street: z.string().max(255).nullable(),
  billing_city: z.string().max(100).nullable(),
  billing_state: z.string().length(2).nullable(), // 2-char state code
  billing_postal_code: z.string().max(20).nullable(),
  billing_country: z.string().length(2).default('US'),
  shipping_street: z.string().max(255).nullable(),
  shipping_city: z.string().max(100).nullable(),
  shipping_state: z.string().length(2).nullable(),
  shipping_postal_code: z.string().max(20).nullable(),
  shipping_country: z.string().length(2).default('US'),

  // Integration
  erp_vendor_code: z.string().max(50).nullable(),
  duns_number: z.string().regex(/^\d{9}$/, 'DUNS must be 9 digits').nullable(),
  edi_id: z.string().max(50).nullable(),

  // Payment
  payment_terms: PaymentTermsEnum.nullable(),
  credit_limit: z.coerce.number().nonnegative().nullable(),

  // Territory
  territory: z.string().max(100).nullable(),
  account_manager_id: z.string().uuid().nullable(),

  // Audit (read-only, not in input)
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
});

// Partial schema for form initial values
export const organizationFormInitialSchema = organizationSchema.partial().parse({
  org_type: 'distributor',
  status: 'active',
  is_operating_entity: true,
  billing_country: 'US',
  shipping_country: 'US',
});

export type Organization = z.infer<typeof organizationSchema>;
```

### Product-Distributor Schema

```typescript
export const ProductDistributorStatusEnum = z.enum(['pending', 'active', 'inactive']);

export const productDistributorSchema = z.strictObject({
  product_id: z.string().uuid(),
  distributor_id: z.string().uuid(),
  vendor_item_number: z.string().max(100).nullable(),
  status: ProductDistributorStatusEnum.default('pending'),
  authorized_at: z.coerce.date().nullable().optional(),
  deactivated_at: z.coerce.date().nullable().optional(),
  valid_from: z.coerce.date().default(() => new Date()),
  valid_to: z.coerce.date().nullable().optional(),
  notes: z.string().max(1000).nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export type ProductDistributor = z.infer<typeof productDistributorSchema>;
```

### Authorization Schema

```typescript
export const AuthorizationStatusEnum = z.enum(['pending', 'active', 'inactive', 'expired']);

export const authorizationSchema = z.strictObject({
  id: z.string().uuid().optional(),
  principal_id: z.string().uuid(),
  distributor_id: z.string().uuid(),
  status: AuthorizationStatusEnum.default('pending'),
  authorized_at: z.coerce.date().nullable().optional(),
  deactivated_at: z.coerce.date().nullable().optional(),
  contract_start_date: z.coerce.date().nullable(),
  contract_end_date: z.coerce.date().nullable(),
  contract_number: z.string().max(100).nullable(),
  valid_from: z.coerce.date().default(() => new Date()),
  valid_to: z.coerce.date().nullable().optional(),
  notes: z.string().max(2000).nullable(),
  terms_summary: z.string().max(1000).nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export type Authorization = z.infer<typeof authorizationSchema>;
```

### Contact Schema Updates

```typescript
export const ContactStatusEnum = z.enum(['active', 'inactive', 'left_company', 'do_not_contact']);
export const DepartmentEnum = z.enum([
  'senior_management',
  'sales_management',
  'district_management',
  'area_sales',
  'sales_specialist',
  'sales_support',
  'procurement',
]);

export const contactSchemaUpdates = z.strictObject({
  // ... existing fields
  manager_id: z.string().uuid().nullable(),
  district_code: z.string().max(20).nullable(),
  territory_name: z.string().max(100).nullable(),
  status: ContactStatusEnum.default('active'),
  inactivated_at: z.coerce.date().nullable().optional(),
  inactivation_reason: z.string().max(500).nullable(),
});
```

---

## Migration Strategy

### Phase 1: Schema Changes (Week 1)

**Goal:** Add all new columns to existing tables as nullable.

```sql
-- Migration 001: Add organizations hierarchy and profile fields
BEGIN;

-- Add all new columns as nullable
ALTER TABLE organizations
  ADD COLUMN parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN org_scope TEXT,
  ADD COLUMN is_operating_entity BOOLEAN DEFAULT true,
  ADD COLUMN org_type TEXT DEFAULT 'distributor',
  ADD COLUMN account_number TEXT,
  ADD COLUMN phone TEXT,
  ADD COLUMN email TEXT,
  ADD COLUMN website TEXT,
  ADD COLUMN status TEXT DEFAULT 'active',
  ADD COLUMN status_reason TEXT,
  ADD COLUMN billing_street TEXT,
  ADD COLUMN billing_city TEXT,
  ADD COLUMN billing_state TEXT,
  ADD COLUMN billing_postal_code TEXT,
  ADD COLUMN billing_country TEXT DEFAULT 'US',
  ADD COLUMN shipping_street TEXT,
  ADD COLUMN shipping_city TEXT,
  ADD COLUMN shipping_state TEXT,
  ADD COLUMN shipping_postal_code TEXT,
  ADD COLUMN shipping_country TEXT DEFAULT 'US',
  ADD COLUMN erp_vendor_code TEXT,
  ADD COLUMN duns_number TEXT,
  ADD COLUMN edi_id TEXT,
  ADD COLUMN payment_terms TEXT,
  ADD COLUMN credit_limit DECIMAL(12,2),
  ADD COLUMN territory TEXT,
  ADD COLUMN account_manager_id UUID REFERENCES users(id);

-- Create indexes
CREATE INDEX idx_orgs_parent_id ON organizations(parent_id);
CREATE INDEX idx_orgs_org_scope ON organizations(org_scope);
CREATE INDEX idx_orgs_org_type ON organizations(org_type);
CREATE INDEX idx_orgs_operating ON organizations(is_operating_entity) WHERE is_operating_entity = true;

-- Create sequence and trigger for account numbers
CREATE SEQUENCE org_account_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_number IS NULL THEN
    NEW.account_number := 'ORG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('org_account_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_account_number
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION generate_account_number();

COMMIT;
```

```sql
-- Migration 002: Create product_distributors junction table
BEGIN;

CREATE TABLE product_distributors (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_item_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  authorized_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT 'infinity',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  PRIMARY KEY (product_id, distributor_id)
);

CREATE INDEX idx_product_dist_product ON product_distributors(product_id);
CREATE INDEX idx_product_dist_distributor ON product_distributors(distributor_id);
CREATE INDEX idx_product_dist_status ON product_distributors(status);
CREATE INDEX idx_product_dist_vendor_item ON product_distributors(vendor_item_number)
  WHERE vendor_item_number IS NOT NULL;

COMMIT;
```

```sql
-- Migration 003: Create authorizations table
BEGIN;

CREATE TABLE authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  authorized_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  contract_start_date DATE,
  contract_end_date DATE,
  contract_number TEXT,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT 'infinity',
  notes TEXT,
  terms_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE (principal_id, distributor_id, valid_from)
);

CREATE INDEX idx_auth_principal ON authorizations(principal_id);
CREATE INDEX idx_auth_distributor ON authorizations(distributor_id);
CREATE INDEX idx_auth_status ON authorizations(status);

COMMIT;
```

```sql
-- Migration 004: Update contacts table
BEGIN;

ALTER TABLE contacts
  ADD COLUMN manager_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN district_code TEXT,
  ADD COLUMN territory_name TEXT,
  ADD COLUMN status TEXT DEFAULT 'active',
  ADD COLUMN inactivated_at TIMESTAMPTZ,
  ADD COLUMN inactivation_reason TEXT;

CREATE INDEX idx_contacts_manager ON contacts(manager_id);
CREATE INDEX idx_contacts_district ON contacts(district_code) WHERE district_code IS NOT NULL;

COMMIT;
```

### Phase 2: Data Backfill (Week 2)

**Goal:** Populate new fields with existing data and defaults.

```sql
-- Backfill 001: Set organization types and scopes for existing records
BEGIN;

-- Set org_type based on existing data patterns
UPDATE organizations
SET org_type = CASE
  -- If already categorized in existing system, use that
  WHEN name ILIKE '%principal%' THEN 'principal'
  WHEN name ILIKE '%restaurant%' OR name ILIKE '%operator%' THEN 'operator'
  ELSE 'distributor' -- Default assumption
END
WHERE org_type IS NULL;

-- Set default org_scope to 'regional' for existing distributors
-- (Will manually set 'national' for Sysco Corp, US Foods, etc. in next step)
UPDATE organizations
SET org_scope = 'regional'
WHERE org_type = 'distributor' AND org_scope IS NULL;

-- Set is_operating_entity to true for all existing records
UPDATE organizations
SET is_operating_entity = true
WHERE is_operating_entity IS NULL;

-- Set default status to 'active' with reason 'active_customer'
UPDATE organizations
SET
  status = 'active',
  status_reason = 'active_customer'
WHERE status IS NULL;

COMMIT;
```

```sql
-- Backfill 002: Identify and configure national distributors
BEGIN;

-- Manually set national-level distributors (brand entities)
UPDATE organizations
SET
  org_scope = 'national',
  is_operating_entity = false
WHERE name IN (
  'Sysco Corporation',
  'US Foods',
  'Performance Food Group',
  'Gordon Food Service'
);

-- Note: Parent-child relationships must be set manually or via import
-- after identifying which regional entities belong to which national parents

COMMIT;
```

```sql
-- Backfill 003: Generate account numbers for existing records
BEGIN;

-- Trigger will auto-generate for new records, backfill existing
UPDATE organizations
SET account_number = 'ORG-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(id::TEXT, 6, '0')
WHERE account_number IS NULL;

COMMIT;
```

### Phase 3: Constraint Enforcement (Week 3)

**Goal:** Add CHECK constraints and make critical fields NOT NULL after backfill is complete.

```sql
-- Constraints 001: Add CHECK constraints to organizations
BEGIN;

-- Add enum-style CHECK constraints
ALTER TABLE organizations
  ADD CONSTRAINT org_scope_values
    CHECK (org_scope IN ('national', 'regional', 'local')),
  ADD CONSTRAINT org_type_values
    CHECK (org_type IN ('distributor', 'principal', 'operator')),
  ADD CONSTRAINT status_values
    CHECK (status IN ('active', 'inactive')),
  ADD CONSTRAINT status_reason_values
    CHECK (status_reason IN (
      'active_customer', 'prospect', 'authorized_distributor',
      'account_closed', 'out_of_business', 'disqualified'
    )),
  ADD CONSTRAINT payment_terms_values
    CHECK (payment_terms IN ('net_30', 'net_60', 'net_90', 'cod', 'prepaid', '2_10_net_30'));

-- Add business logic constraints
ALTER TABLE organizations
  ADD CONSTRAINT national_entities_no_parent
    CHECK (org_scope != 'national' OR parent_id IS NULL),
  ADD CONSTRAINT duns_format
    CHECK (duns_number IS NULL OR duns_number ~ '^\d{9}$'),
  ADD CONSTRAINT state_code_format
    CHECK (
      (billing_state IS NULL OR length(billing_state) = 2) AND
      (shipping_state IS NULL OR length(shipping_state) = 2)
    );

COMMIT;
```

```sql
-- Constraints 002: Add CHECK constraints to product_distributors
BEGIN;

ALTER TABLE product_distributors
  ADD CONSTRAINT pd_status_values
    CHECK (status IN ('pending', 'active', 'inactive'));

COMMIT;
```

```sql
-- Constraints 003: Add CHECK constraints to authorizations
BEGIN;

ALTER TABLE authorizations
  ADD CONSTRAINT auth_status_values
    CHECK (status IN ('pending', 'active', 'inactive', 'expired'));

COMMIT;
```

```sql
-- Constraints 004: Add CHECK constraints to contacts
BEGIN;

ALTER TABLE contacts
  ADD CONSTRAINT contact_status_values
    CHECK (status IN ('active', 'inactive', 'left_company', 'do_not_contact'));

COMMIT;
```

### Phase 4: Application Updates (Week 4)

**Goal:** Update Zod schemas, TypeScript interfaces, and React Admin forms.

**Tasks:**
1. Update `src/atomic-crm/validation/organization.ts` with new Zod schemas
2. Update `unifiedDataProvider.ts` to validate with new schemas
3. Update `OrganizationEdit.tsx` to include new fields in tabbed layout
4. Update `OrganizationList.tsx` to display hierarchy, scope, status
5. Create `ProductDistributorEdit.tsx` for managing DOT numbers
6. Create `AuthorizationList.tsx` and `AuthorizationEdit.tsx` for principal-distributor agreements
7. Update `ContactEdit.tsx` with manager picker, territory fields, status

---

## React Admin UI Recommendations

### Organization List View

**Columns (Distributor Filter):**
1. **Name** - With hierarchy breadcrumb if has parent ("Sysco Corp > Sysco Chicago")
2. **Type Badge** - Color-coded (blue=distributor, green=principal, purple=operator)
3. **Scope Badge** - (National/Regional/Local) - hide if null
4. **Status** - Color badge (green=active, gray=inactive)
5. **Territory** - District assignment
6. **Account Manager** - User reference
7. **Payment Terms** - Display value
8. **Last Activity** - Most recent opportunity/activity date

**Filters:**
- Organization Type (distributor/principal/operator)
- Organization Scope (national/regional/local)
- Status (active/inactive)
- Has Parent (yes/no - for finding top-level orgs)
- Territory

**Default View:**
- Filter to `org_type = 'distributor'` and `is_operating_entity = true` (hide brand-only parents)
- Add toggle "Show all entities" to include non-operating national brands

**List Shell Layout:**
```typescript
<ListShell
  title="Distributors"
  defaultFilters={{ org_type: 'distributor', is_operating_entity: true }}
  columns={[
    { field: 'name', headerName: 'Name', renderCell: (row) => (
      <HierarchyBreadcrumb org={row} />
    )},
    { field: 'org_scope', headerName: 'Scope', renderCell: ScopeBadge },
    { field: 'status', headerName: 'Status', renderCell: StatusBadge },
    { field: 'territory', headerName: 'Territory' },
    { field: 'account_manager', headerName: 'Manager', renderCell: UserReference },
  ]}
/>
```

### Organization Edit Form

**Tab 1: Basic Info**
- Name (required)
- Organization Type (distributor/principal/operator)
- Organization Scope (national/regional/local)
- Parent Organization (dropdown filtered by scope)
- Is Operating Entity (checkbox)
- Status, Status Reason
- Account Number (read-only, auto-generated)

**Tab 2: Contact Info**
- Phone
- Email
- Website

**Tab 3: Addresses**
- Billing Address (street, city, state, postal, country)
- Shipping Address (street, city, state, postal, country)
- "Same as Billing" checkbox to copy billing → shipping

**Tab 4: Business Details**
- Payment Terms (dropdown)
- Credit Limit (currency input)
- Territory (text input)
- Account Manager (user reference picker)

**Tab 5: Integration** (collapsed by default)
- ERP Vendor Code
- DUNS Number (9-digit validation)
- EDI ID

**Validation Rules:**
- National scope → parent_id must be null
- Regional/Local scope → parent_id recommended (warning if missing)
- DUNS must be exactly 9 digits if provided
- Status reason must match status (active reasons for active, inactive reasons for inactive)

**Form Layout Example:**
```typescript
<TabbedForm>
  <FormTab label="Basic Info">
    <TextInput source="name" required />
    <SelectInput source="org_type" choices={orgTypeChoices} required />
    <SelectInput source="org_scope" choices={orgScopeChoices} />
    <ReferenceInput source="parent_id" reference="organizations">
      <SelectInput optionText="name" />
    </ReferenceInput>
    <BooleanInput source="is_operating_entity" />
    <SelectInput source="status" choices={statusChoices} />
    <SelectInput source="status_reason" choices={statusReasonChoices} />
    <TextInput source="account_number" disabled />
  </FormTab>

  <FormTab label="Contact Info">
    <TextInput source="phone" />
    <TextInput source="email" type="email" />
    <TextInput source="website" type="url" />
  </FormTab>

  <FormTab label="Addresses">
    <Typography variant="h6">Billing Address</Typography>
    <TextInput source="billing_street" fullWidth />
    <TextInput source="billing_city" />
    <TextInput source="billing_state" />
    <TextInput source="billing_postal_code" />
    <SelectInput source="billing_country" choices={countryChoices} />

    <BooleanInput
      source="copy_billing_to_shipping"
      label="Same as Billing"
      onChange={(e) => {
        if (e.target.checked) {
          // Copy billing → shipping
        }
      }}
    />

    <Typography variant="h6">Shipping Address</Typography>
    <TextInput source="shipping_street" fullWidth />
    <TextInput source="shipping_city" />
    <TextInput source="shipping_state" />
    <TextInput source="shipping_postal_code" />
    <SelectInput source="shipping_country" choices={countryChoices} />
  </FormTab>

  <FormTab label="Business Details">
    <SelectInput source="payment_terms" choices={paymentTermsChoices} />
    <NumberInput source="credit_limit" />
    <TextInput source="territory" />
    <ReferenceInput source="account_manager_id" reference="users">
      <SelectInput optionText="full_name" />
    </ReferenceInput>
  </FormTab>

  <FormTab label="Integration">
    <TextInput source="erp_vendor_code" />
    <TextInput
      source="duns_number"
      helperText="9-digit D&B identifier"
      validate={validateDUNS}
    />
    <TextInput source="edi_id" />
  </FormTab>
</TabbedForm>
```

### Product-Distributor Management

**Datagrid in Product Edit Form:**

```typescript
// In ProductEdit.tsx, add tab for distributor authorizations
<FormTab label="Distributors">
  <ReferenceManyField
    reference="product_distributors"
    target="product_id"
  >
    <Datagrid>
      <ReferenceField source="distributor_id" reference="organizations">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="vendor_item_number" label="DOT Number" />
      <SelectField source="status" choices={pdStatusChoices} />
      <DateField source="authorized_at" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </ReferenceManyField>

  <Button onClick={handleAddDistributor}>
    Add Distributor Authorization
  </Button>
</FormTab>
```

**Product-Distributor Edit Dialog:**
```typescript
<Dialog>
  <SimpleForm>
    <ReferenceInput source="distributor_id" reference="organizations" filter={{ org_type: 'distributor' }}>
      <SelectInput optionText="name" />
    </ReferenceInput>
    <TextInput source="vendor_item_number" label="Distributor Item # (DOT)" />
    <SelectInput source="status" choices={[
      { id: 'pending', name: 'Pending' },
      { id: 'active', name: 'Active' },
      { id: 'inactive', name: 'Inactive' },
    ]} />
    <DateInput source="valid_from" />
    <DateInput source="valid_to" />
    <TextInput source="notes" multiline rows={3} />
  </SimpleForm>
</Dialog>
```

### Authorization List View

**Columns:**
1. Principal (organization reference)
2. Distributor (organization reference)
3. Status (badge)
4. Contract Start Date
5. Contract End Date
6. Authorized At
7. Actions

**Filters:**
- Principal
- Distributor
- Status
- Contract active (start <= today <= end)

### Hierarchy Display Component

**HierarchyBreadcrumb Component:**
```typescript
interface HierarchyBreadcrumbProps {
  org: Organization;
}

const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({ org }) => {
  const { data: parent } = useGetOne('organizations', { id: org.parent_id }, { enabled: !!org.parent_id });

  if (!parent) {
    return <Typography>{org.name}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{parent.name}</Typography>
      <ChevronRight fontSize="small" />
      <Typography>{org.name}</Typography>
    </Box>
  );
};
```

---

## Trade-offs Acknowledged

### 1. Flat Address Model vs. Normalized Address Table

**Decision:** Start with flat model (billing_*, shipping_* columns on organizations table)

**Rationale:**
- MVP supports 2 addresses (billing + shipping) which covers 90% of use cases
- Zero-join queries for displaying org addresses
- Simpler forms and validation

**Trade-off:**
- Cannot support 3+ addresses (HQ + multiple warehouses) without schema change
- Address rename/update requires touching organizations table

**Migration Path:**
- If distributors need 3+ locations, create `organization_addresses` table
- Migrate existing billing/shipping to address records
- Keep billing_*/shipping_* as denormalized cache for performance

### 2. Product-Distributor Junction vs. Authorization-Only

**Decision:** Use product_distributors junction table with embedded status tracking

**Rationale:**
- Vendor item numbers (DOT numbers) are product-specific, not principal-wide
- Enables granular product-level authorization (distributor carries some products but not all)
- Supports independent lifecycles (product A active, product B pending)

**Alternative Considered:**
- Single `authorizations` table at principal-distributor level only
- Would require separate product_distributors table anyway for DOT numbers

**Trade-off:**
- More complex data model (2 tables instead of 1)
- Must keep product_distributors.status in sync with authorizations.status if both exist

**Recommendation:** Start with product_distributors only for MVP, add authorizations table later if principal-level agreements become important

### 3. Territory as Field vs. Lookup Table

**Decision:** Use simple text fields (district_code, territory_name) on contacts table

**Rationale:**
- 594 distributor reps with stable district assignments (D1, D73, etc.)
- No evidence of territory hierarchies or territory-level reporting needed
- Zero-join queries for filtering/grouping by territory

**Alternative Considered:**
- Normalized `territories` table with hierarchy support
- Would enable territory managers, regional rollups, territory metadata

**Trade-off:**
- Cannot represent territory hierarchies (District → Region → National)
- Territory rename requires UPDATE across all contacts
- No territory-specific attributes (manager, active status)

**Migration Path:**
- If territory hierarchies emerge, create `territories` table
- Backfill from distinct district_code/territory_name values
- Add territory_id FK to contacts

### 4. Manager Adjacency List vs. Closure Table

**Decision:** Use self-referential foreign key (manager_id → contacts.id)

**Rationale:**
- Industry standard pattern (Salesforce, Dynamics 365)
- Simple schema (one field)
- Hierarchy depth likely shallow (3-4 levels: Senior Mgmt → Sales Mgmt → District Mgmt → Area Sales)

**Alternative Considered:**
- Closure table (contact_hierarchy) with pre-computed ancestor-descendant pairs
- Faster descendant queries but complex write logic

**Trade-off:**
- Recursive CTE required for "all descendants" queries
- Performance degrades with deep hierarchies (>10 levels)

**Acceptable Because:**
- Sales hierarchies are typically 3-5 levels
- "All descendants" queries are infrequent (mostly need direct reports)
- PostgreSQL recursive CTEs perform well for small-medium datasets

### 5. Enum-based Status vs. Lookup Tables

**Decision:** Use TEXT fields with CHECK constraints for all status/type enums

**Rationale:**
- Type-safe at database level (CHECK constraints prevent invalid values)
- No join required for status display
- Matches Crispy CRM existing patterns
- Easy to map to TypeScript enums and Zod schemas

**Alternative Considered:**
- Lookup tables (org_types, org_statuses, payment_terms_types, etc.)
- Would enable status metadata (description, display order, is_active)

**Trade-off:**
- Schema migration required to add new enum values
- No status metadata storage
- Cannot disable enum values (must remove from CHECK constraint)

**Acceptable Because:**
- Enums are stable (status values rarely change)
- Metadata not needed for MVP (description can live in UI i18n)
- TypeScript/Zod provide type safety in application layer

---

## Implementation Priority

| Priority | Item | Effort | Impact | Dependencies |
|----------|------|--------|--------|--------------|
| **P0** | Add organizations hierarchy fields (parent_id, org_scope, is_operating_entity) | 2 days | High - Enables Sysco Corp → Sysco Chicago modeling | None |
| **P0** | Add organizations profile fields (status, status_reason, addresses, payment_terms) | 2 days | High - Core distributor metadata | None |
| **P0** | Update OrganizationEdit form with tabbed layout | 3 days | High - User-facing CRUD | P0 schema changes |
| **P1** | Create product_distributors junction table | 2 days | High - Enables DOT number tracking | None |
| **P1** | Add product-distributor management UI | 3 days | High - User-facing for DOT numbers | P1 schema |
| **P1** | Add contacts manager_id and territory fields | 1 day | Medium - Org chart and territory tracking | None |
| **P1** | Update ContactEdit form with manager picker | 2 days | Medium - User-facing | P1 schema |
| **P2** | Create authorizations table | 2 days | Medium - Principal-distributor agreements | None |
| **P2** | Add authorization management UI | 3 days | Medium - User-facing | P2 schema |
| **P2** | Add account_number auto-generation | 1 day | Low - Nice-to-have unique identifier | None |
| **P2** | Add hierarchy breadcrumb display in org list | 2 days | Medium - UX improvement | P0 hierarchy |
| **P3** | Add integration fields (erp_vendor_code, duns_number, edi_id) | 1 day | Low - Future integrations | None |
| **P3** | Create PostgreSQL function for hierarchy queries | 2 days | Low - Performance optimization | P0 hierarchy |
| **P3** | Add Zod validation for all new schemas | 2 days | Medium - Data integrity | All schema changes |
| **P3** | Update unifiedDataProvider with new schemas | 2 days | Medium - API boundary validation | P3 Zod schemas |

**Estimated Total:** 30 developer days (6 weeks for 1 dev, 3 weeks for 2 devs)

**Sprint 1 (P0 - 2 weeks):** Organizations hierarchy + profile + UI
**Sprint 2 (P1 - 2 weeks):** Product-distributors + contacts updates + UI
**Sprint 3 (P2 - 1 week):** Authorizations + account numbers + breadcrumbs
**Sprint 4 (P3 - 1 week):** Integration fields + validation + data provider

---

## Sources Referenced

### Organization Hierarchy Research
- `/home/krwhynot/projects/crispy-crm/docs/research/distributor-standards/01-organization-hierarchy-patterns.md`
  - Self-referential foreign key pattern (parent_id)
  - Scope levels (national/regional/local)
  - Recursive CTE queries for hierarchy traversal
  - PostgreSQL view approach for Supabase
  - Performance considerations and indexing

### Distributor Profile Fields Research
- `/home/krwhynot/projects/crispy-crm/docs/research/distributor-standards/02-distributor-profile-fields.md`
  - Status + Status Reason dual-field pattern
  - Flat address model (billing/shipping)
  - Integration identifiers (DUNS, ERP codes, EDI)
  - Payment terms and credit management
  - Food distribution specific fields (certifications, delivery capabilities)

### Product-Distributor Relationships Research
- `/home/krwhynot/projects/crispy-crm/docs/research/distributor-standards/03-product-distributor-relationships.md`
  - Junction table with attributes pattern
  - Vendor item number (SKU mapping) architecture
  - Authorization status workflow (pending/active/inactive)
  - Temporal validity (valid_from/valid_to)
  - Composite primary key vs. surrogate key trade-offs

### Contact & Territory Modeling Research
- `/home/krwhynot/projects/crispy-crm/docs/research/distributor-standards/04-contact-territory-modeling.md`
  - Manager relationship via adjacency list (self-referential FK)
  - Territory as field vs. lookup table vs. junction table
  - Department enum vs. lookup table
  - Contact lifecycle status tracking
  - Recursive CTE for org chart queries

---

## Next Steps

1. **Review with Stakeholders:** Present schema recommendations and get approval on scope/priority
2. **Create Migrations:** Write SQL migration files for Phase 1 schema changes
3. **Update Zod Schemas:** Implement TypeScript/Zod validation in `src/atomic-crm/validation/`
4. **Update Data Provider:** Add new schemas to `unifiedDataProvider.ts` validation
5. **Build UI Components:** Create/update React Admin forms and list views
6. **Data Migration Planning:** Work with team to identify national vs. regional distributors for backfill
7. **Testing:** Write unit tests for new validation schemas and integration tests for hierarchy queries

---

**Document Version:** 1.0
**Last Updated:** 2025-12-14
**Author:** Research Agent 5 (Synthesis)
**Status:** Ready for Review
