# Database Migration Strategy

**Project:** Crispy-CRM
**Database:** PostgreSQL 15 (Supabase)
**Date:** 2025-11-02
**Status:** ✅ Reference Documentation

---

## Table of Contents

1. [Migration Execution Plan](#1-migration-execution-plan)
2. [Table Creation Patterns](#2-table-creation-patterns)
3. [Index Strategy](#3-index-strategy)
4. [Row Level Security Policies](#4-row-level-security-policies)
5. [Seed Data Strategy](#5-seed-data-strategy)
6. [Rollback Procedures](#6-rollback-procedures)
7. [Migration Dependencies](#7-migration-dependencies)

---

## Overview

This document provides the complete migration strategy for Crispy-CRM's PostgreSQL database on Supabase. It serves as both a reference guide and a template for future schema changes.

**Key Architectural Decisions:**
- **Backend Platform:** Supabase (PostgreSQL + Auth + Auto-generated APIs) - [ADR-0001](../architecture/adr/0001-use-supabase-for-backend-platform.md)
- **Authentication:** JWT with refresh tokens via Supabase Auth - [ADR-0004](../architecture/adr/0004-use-jwt-authentication-with-refresh-tokens.md)
- **Data Management:** Soft delete for all core entities - [ADR-0005](../architecture/adr/0005-soft-delete-strategy-for-core-entities.md)

**Database Patterns Enforced:**
- ✅ Soft delete with `deleted_at`, `deleted_by` columns
- ✅ Audit fields (`created_at`, `updated_at`, `created_by`, `updated_by`)
- ✅ Two-layer security (GRANT permissions + RLS policies)
- ✅ Partial indexes for active records (`WHERE deleted_at IS NULL`)
- ✅ Conditional unique constraints for soft-deleted records
- ✅ PostgreSQL sequences with GRANT permissions for `authenticated` role

---

## 1. Migration Execution Plan

### 1.1 Supabase CLI Workflow

**Prerequisites:**
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Verify installation
npx supabase --version
```

**Local Development Workflow:**

```bash
# 1. Start local Supabase (PostgreSQL + Auth + APIs)
npm run db:local:start
# Or: npx supabase start

# 2. Create a new migration file (timestamped automatically)
npx supabase migration new <descriptive_migration_name>
# Example: npx supabase migration new add_tasks_table

# 3. Edit migration file in supabase/migrations/<timestamp>_<name>.sql
# Write idempotent SQL (CREATE IF NOT EXISTS, conditional logic)

# 4. Apply migration to local database
npm run db:local:reset
# Or: npx supabase db reset
# Note: Runs ALL migrations + seed.sql automatically

# 5. Verify migration success
npm run dev  # Start UI, test changes
npm test     # Run test suite

# 6. Commit migration to version control
git add supabase/migrations/<timestamp>_*.sql
git commit -m "feat(db): add tasks table with RLS policies"
```

**Cloud Deployment Workflow:**

```bash
# 1. Link to cloud project (one-time setup)
npx supabase link --project-ref <your-project-ref>

# 2. Verify pending migrations
npx supabase db diff

# 3. Deploy migrations to cloud (PRODUCTION - IRREVERSIBLE)
npm run db:cloud:push
# Or: npx supabase db push

# ⚠️ WARNING: Always test locally first!
# ⚠️ No rollback mechanism - plan carefully
# ⚠️ Coordinate with team to avoid conflicts
```

**Best Practices:**

1. **Idempotent Migrations:** Use `CREATE TABLE IF NOT EXISTS`, `DROP TABLE IF EXISTS`, conditional logic
2. **Small Atomic Changes:** One logical change per migration (easier to debug, rollback)
3. **Test Locally First:** ALWAYS run `npm run db:local:reset` and test before cloud push
4. **Descriptive Names:** `add_tasks_table`, not `migration_42`
5. **Sequential Execution:** Migrations run in timestamp order (never rename files)
6. **Data Migrations:** Include data transformations in separate migration (not schema + data in one file)

### 1.2 Migration File Template

```sql
-- ============================================================================
-- Migration: <Short Description>
-- Date: YYYY-MM-DD
-- Author: <Your Name>
--
-- Purpose: <Why this change is needed>
--
-- Dependencies:
--   - Requires: <Previous migrations if any>
--   - Affects: <Tables/views that depend on this>
--
-- Rollback: <How to reverse this change>
-- ============================================================================

BEGIN;

-- Add your schema changes here
-- Follow patterns from this document

COMMIT;
```

### 1.3 Common Migration Patterns

**Adding a New Column (Idempotent):**
```sql
-- Add column only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'website'
  ) THEN
    ALTER TABLE organizations ADD COLUMN website TEXT;
  END IF;
END $$;
```

**Modifying Column Type (Safe):**
```sql
-- Change column type with explicit casting
ALTER TABLE opportunities
  ALTER COLUMN probability TYPE DECIMAL(5,2)
  USING probability::DECIMAL(5,2);
```

**Adding Constraints (Idempotent):**
```sql
-- Add constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_probability'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT valid_probability CHECK (probability BETWEEN 0 AND 1);
  END IF;
END $$;
```

---

## 2. Table Creation Patterns

### 2.1 Primary Key Decision: BIGINT (Industry Standard)

**Decision:** Use BIGINT auto-increment for all primary keys (not UUID).

**Rationale (based on industry research):**
- ✅ **Performance:** Faster joins, smaller indexes, better cache locality
- ✅ **Simplicity:** Standard PostgreSQL pattern, excellent ORM support
- ✅ **Industry Standard:** Salesforce, HubSpot, and major CRMs use sequential integers internally
- ✅ **Right for Scale:** Single-tenant CRM doesn't need UUID's distributed system benefits

**When to use UUID instead:** Only for multi-region distributed systems or public-facing IDs.

### 2.2 Standard Table Structure

All core CRM tables follow this pattern (implements ADR-0005 soft delete):

```sql
CREATE TABLE IF NOT EXISTS <table_name> (
  -- Primary Key (BIGINT auto-increment - industry standard for CRM)
  <table>_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Core Business Fields
  <required_fields> NOT NULL,
  <optional_fields>,

  -- Foreign Keys
  <fk_column> BIGINT REFERENCES <parent_table>(<parent_id>) ON DELETE RESTRICT,

  -- Soft Delete Fields (ADR-0005)
  deleted_at TIMESTAMPTZ,
  deleted_by BIGINT REFERENCES sales(id),

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id)
);

-- Enable Row Level Security (required for all tables)
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Grant base permissions to authenticated role (Layer 1 Security)
GRANT SELECT, INSERT, UPDATE, DELETE ON <table_name> TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE <table_name>_<table>_id_seq TO authenticated;

-- Create RLS policies (Layer 2 Security) - See Section 4

-- Create indexes (partial for active records) - See Section 3
```

### 2.3 Sales Table (User Profiles)

**Critical Foundation Table:** The `sales` table extends Supabase's `auth.users` with CRM-specific profile data.

```sql
-- ============================================================================
-- SALES TABLE (User Profiles)
-- ============================================================================
-- Extends auth.users with CRM profile data
-- Created automatically by trigger when auth.users record inserted
-- Relationship: auth.users (1) → sales (1) via user_id foreign key
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales (
  -- Primary Key
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Link to Supabase Auth
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Profile Information
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT NOT NULL,

  -- Role & Permissions
  role TEXT DEFAULT 'Sales Rep' CHECK (role IN ('Admin', 'Sales Manager', 'Sales Rep', 'Read-Only')),
  active BOOLEAN DEFAULT TRUE,

  -- Metadata
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Grant permissions (Layer 1)
GRANT SELECT, INSERT, UPDATE ON sales TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE sales_id_seq TO authenticated;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_email ON sales(email);
CREATE INDEX IF NOT EXISTS idx_sales_active ON sales(active) WHERE active = TRUE;

-- RLS Policies (Layer 2)
-- All authenticated users can view all sales profiles (for assignment dropdowns, etc.)
CREATE POLICY authenticated_select_sales ON sales
  FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY authenticated_update_own_sales ON sales
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admins can update any profile
CREATE POLICY admin_update_sales ON sales
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- AUTO-CREATE SALES PROFILE TRIGGER
-- ============================================================================
-- When a new user is created in auth.users, automatically create sales record
-- ============================================================================

CREATE OR REPLACE FUNCTION create_sales_from_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sales (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Sales Rep')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_sales_from_user();

-- ============================================================================
-- IMPORTANT: auth.users → sales Relationship
-- ============================================================================
-- All user-related foreign keys in other tables reference sales(id), NOT auth.users(id)
-- This pattern:
--   - Keeps auth schema separate from business logic
--   - Allows CRM-specific profile fields without touching auth schema
--   - Trigger ensures sales record always exists when auth.users exists
-- ============================================================================
```

### 2.4 Organizations Table (Reference Example)

```sql
-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
-- Stores restaurants, distributors, and management companies
-- Implements: Soft delete (ADR-0005), Two-layer security (GRANT + RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  -- Primary Key
  organization_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Core Information
  organization_name TEXT NOT NULL,
  priority_level TEXT CHECK (priority_level IN ('A+', 'A', 'B', 'C', 'D')),
  segment_id BIGINT REFERENCES segments(id) ON DELETE RESTRICT,

  -- Distribution Relationship (Self-reference)
  distributor_id BIGINT REFERENCES organizations(organization_id) ON DELETE RESTRICT,
  distributor_rep_name TEXT,

  -- Account Management
  primary_account_manager_id BIGINT REFERENCES sales(id) ON DELETE RESTRICT,
  secondary_account_manager_id BIGINT REFERENCES sales(id) ON DELETE SET NULL,
  weekly_priority BOOLEAN DEFAULT FALSE,

  -- Contact Information
  linkedin_url TEXT,
  phone JSONB DEFAULT '[]'::jsonb,  -- [{"number": "555-1234", "type": "Work"}]
  street_address TEXT,
  city TEXT,
  state TEXT,  -- Could be ENUM or CHECK constraint
  zip_code TEXT,

  -- Additional
  notes TEXT,

  -- Soft Delete Fields (ADR-0005)
  deleted_at TIMESTAMPTZ,
  deleted_by BIGINT REFERENCES sales(id),

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id)
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Grant permissions (Layer 1)
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE organizations_organization_id_seq TO authenticated;

-- Conditional unique constraint (active records only)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_organization_name
  ON organizations(organization_name)
  WHERE deleted_at IS NULL;

-- Partial indexes (active records only)
CREATE INDEX IF NOT EXISTS idx_organizations_active_priority
  ON organizations(priority_level)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_active_segment
  ON organizations(segment_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_distributor
  ON organizations(distributor_id)
  WHERE deleted_at IS NULL;

-- Foreign key indexes (for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_organizations_primary_account_manager
  ON organizations(primary_account_manager_id);

CREATE INDEX IF NOT EXISTS idx_organizations_secondary_account_manager
  ON organizations(secondary_account_manager_id);

-- RLS Policies (Layer 2) - See Section 4.2 for complete policies
```

### 2.5 Contacts Table

```sql
-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
-- Stores individual contacts (owners, chefs, managers) within organizations
-- Implements: Soft delete, JSONB arrays for email/phone, company isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  -- Primary Key
  contact_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Core Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  organization_id BIGINT REFERENCES organizations(organization_id) ON DELETE RESTRICT,
  position TEXT,  -- 'Owner', 'Chef', 'Manager', 'Buyer', etc.

  -- Contact Methods (JSONB arrays)
  email JSONB DEFAULT '[]'::jsonb,  -- [{"email": "user@example.com", "type": "Work"}]
  phone JSONB DEFAULT '[]'::jsonb,  -- [{"number": "555-1234", "type": "Mobile"}]
  linkedin_url TEXT,

  -- Management
  account_manager_id BIGINT REFERENCES sales(id) ON DELETE RESTRICT,

  -- Address
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),

  -- Additional
  notes TEXT,

  -- Soft Delete Fields
  deleted_at TIMESTAMPTZ,
  deleted_by BIGINT REFERENCES sales(id),

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE contacts_contact_id_seq TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_active_name
  ON contacts(last_name, first_name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_organization
  ON contacts(organization_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_account_manager
  ON contacts(account_manager_id);

-- JSONB GIN indexes for email/phone searches
CREATE INDEX IF NOT EXISTS idx_contacts_email_gin
  ON contacts USING gin(email);

CREATE INDEX IF NOT EXISTS idx_contacts_phone_gin
  ON contacts USING gin(phone);
```

### 2.6 Opportunities Table

```sql
-- ============================================================================
-- OPPORTUNITIES TABLE
-- ============================================================================
-- Stores sales opportunities (deals) with stage tracking and product association
-- Implements: Soft delete, complex validation, optimistic locking
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunities (
  -- Primary Key
  opportunity_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Core Information
  opportunity_name TEXT NOT NULL,
  organization_id BIGINT NOT NULL REFERENCES organizations(organization_id) ON DELETE RESTRICT,

  -- Status & Stage
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'On Hold', 'SOLD-7d', 'open')),
  stage TEXT NOT NULL DEFAULT 'Lead-discovery-1',

  -- Timeline
  start_date DATE NOT NULL,
  expected_sold_date DATE,
  start_of_week DATE,  -- Calculated: Monday of start_date week

  -- Probability & Volume
  probability DECIMAL(5,2) CHECK (probability BETWEEN 0 AND 1),
  cases_per_week_volume INTEGER CHECK (cases_per_week_volume > 0),

  -- Product Information
  principal TEXT,  -- Brand/product line

  -- Ownership & Source
  deal_owner_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  source TEXT,  -- 'MFB', 'Principal', 'Distributor referral', etc.

  -- Closure Information
  loss_reason TEXT CHECK (loss_reason IN ('Competitor', 'Price', 'Other')),

  -- Additional
  notes TEXT,

  -- Optimistic Locking (prevent concurrent updates)
  version INTEGER DEFAULT 1 NOT NULL,

  -- Soft Delete Fields
  deleted_at TIMESTAMPTZ,
  deleted_by BIGINT REFERENCES sales(id),

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id),

  -- Validation Constraints
  CONSTRAINT valid_expected_sold_date CHECK (expected_sold_date IS NULL OR expected_sold_date >= start_date),
  CONSTRAINT sold_requires_details CHECK (
    status != 'SOLD-7d' OR (
      cases_per_week_volume IS NOT NULL AND
      expected_sold_date IS NOT NULL
    )
  ),
  CONSTRAINT closed_requires_loss_reason CHECK (
    status != 'Closed' OR stage = 'SOLD-7' OR loss_reason IS NOT NULL
  )
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON opportunities TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE opportunities_opportunity_id_seq TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_active_organization
  ON opportunities(organization_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_active_status_stage
  ON opportunities(status, stage)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_deal_owner
  ON opportunities(deal_owner_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_start_date
  ON opportunities(start_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_start_of_week
  ON opportunities(start_of_week DESC)
  WHERE deleted_at IS NULL;
```

### 2.7 Products Table

```sql
-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
-- Stores product catalog (NO PRICING - see ADR note below)
-- Implements: Soft delete, simple product tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  -- Primary Key
  product_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Core Information
  product_name TEXT NOT NULL,
  sku TEXT,
  principal TEXT,  -- Brand name
  category TEXT,
  description TEXT,

  -- Status
  active BOOLEAN DEFAULT TRUE,

  -- Soft Delete Fields
  deleted_at TIMESTAMPTZ,
  deleted_by BIGINT REFERENCES sales(id),

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE products_product_id_seq TO authenticated;

-- Conditional unique constraint (active products only)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_product_name
  ON products(product_name)
  WHERE deleted_at IS NULL AND active = TRUE;

CREATE INDEX IF NOT EXISTS idx_products_active
  ON products(active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category)
  WHERE deleted_at IS NULL AND active = TRUE;

-- ============================================================================
-- NOTE: Pricing Removed (2025-10-29)
-- ============================================================================
-- Previous versions included list_price, currency_code, unit_of_measure
-- Pricing is now tracked externally (spreadsheets, quotes) due to:
--   - Price varies by customer, distributor, volume, context
--   - Static catalog pricing added complexity without value
-- See: supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql
-- ============================================================================
```

### 2.8 Opportunity-Products Junction Table (Many-to-Many)

**Industry Standard:** Salesforce uses "OpportunityLineItem", HubSpot uses "Line Items"

```sql
-- ============================================================================
-- OPPORTUNITY_PRODUCTS TABLE (Many-to-Many)
-- ============================================================================
-- Industry standard: Multiple products per opportunity (Salesforce, HubSpot pattern)
-- Links opportunities to products with optional notes
-- Implements: Simple association tracking (no pricing/quantity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunity_products (
  -- Composite Primary Key
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,

  -- Optional tracking
  notes TEXT,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES sales(id),

  PRIMARY KEY (opportunity_id, product_id)
);

ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON opportunity_products TO authenticated;

-- Indexes (for reverse lookups)
CREATE INDEX IF NOT EXISTS idx_opportunity_products_product
  ON opportunity_products(product_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_products_opportunity
  ON opportunity_products(opportunity_id);
```

### 2.9 Activity Log Table

```sql
-- ============================================================================
-- ACTIVITY_LOG TABLE (Polymorphic)
-- ============================================================================
-- Tracks activities (calls, emails, meetings) for opportunities/organizations/contacts
-- Implements: Polymorphic relationships, audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  -- Primary Key
  activity_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Polymorphic Entity Reference
  entity_type TEXT NOT NULL CHECK (entity_type IN ('Opportunity', 'Organization', 'Contact')),
  entity_id BIGINT NOT NULL,

  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN ('Call', 'Email', 'Meeting', 'Sample Delivered', 'Demo', 'Note', 'Status Change', 'Stage Change')),
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  description TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON activity_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE activity_log_activity_id_seq TO authenticated;

-- Composite indexes for polymorphic queries
CREATE INDEX IF NOT EXISTS idx_activity_log_entity
  ON activity_log(entity_type, entity_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_date
  ON activity_log(user_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_type_date
  ON activity_log(activity_type, activity_date DESC);
```

### 2.10 Audit Trail (Field-Level Change Tracking)

**Requirement:** PRD Section 3.1 requires "Old value → New value" change history

**Industry Standard:** Salesforce, HubSpot use dedicated audit tables with triggers

```sql
-- ============================================================================
-- AUDIT_TRAIL TABLE (Field-Level Change History)
-- ============================================================================
-- Tracks every field change across all tables
-- Populated automatically by database triggers
-- Industry standard: Salesforce Field History Tracking pattern
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_trail (
  -- Primary Key
  audit_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- What Changed
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  -- Who & When
  changed_by BIGINT REFERENCES sales(id),
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Context
  change_type TEXT NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT ON audit_trail TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE audit_trail_audit_id_seq TO authenticated;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record
  ON audit_trail(table_name, record_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_changed_by
  ON audit_trail(changed_by, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_field
  ON audit_trail(table_name, field_name, changed_at DESC);

-- RLS: All users can view audit trail (for compliance, history views)
CREATE POLICY authenticated_select_audit_trail ON audit_trail
  FOR SELECT TO authenticated
  USING (true);

-- RLS: Only triggers can insert (prevent manual tampering)
-- Note: Triggers run as SECURITY DEFINER, bypassing RLS

-- ============================================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- ============================================================================
-- Automatically logs field changes for any table
-- Usage: Attach to tables with: CREATE TRIGGER audit_changes ...
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  field_name TEXT;
  old_value TEXT;
  new_value TEXT;
  current_sales_id BIGINT;
BEGIN
  -- Get current user's sales ID
  SELECT id INTO current_sales_id FROM sales WHERE user_id = auth.uid();

  -- Convert rows to JSONB for comparison
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSE  -- UPDATE
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  END IF;

  -- Log each changed field
  IF TG_OP = 'UPDATE' THEN
    FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
      old_value := old_data ->> field_name;
      new_value := new_data ->> field_name;

      -- Only log if value actually changed
      IF old_value IS DISTINCT FROM new_value THEN
        INSERT INTO audit_trail (
          table_name, record_id, field_name,
          old_value, new_value, changed_by, change_type
        ) VALUES (
          TG_TABLE_NAME,
          (new_data ->> TG_ARGV[0])::BIGINT,  -- Primary key column name passed as trigger arg
          field_name,
          old_value,
          new_value,
          current_sales_id,
          TG_OP
        );
      END IF;
    END LOOP;
  ELSIF TG_OP = 'INSERT' THEN
    -- Log creation (all fields)
    FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
      INSERT INTO audit_trail (
        table_name, record_id, field_name,
        old_value, new_value, changed_by, change_type
      ) VALUES (
        TG_TABLE_NAME,
        (new_data ->> TG_ARGV[0])::BIGINT,
        field_name,
        NULL,
        new_data ->> field_name,
        current_sales_id,
        TG_OP
      );
    END LOOP;
  ELSIF TG_OP = 'DELETE' THEN
    -- Log deletion
    INSERT INTO audit_trail (
      table_name, record_id, field_name,
      old_value, new_value, changed_by, change_type
    ) VALUES (
      TG_TABLE_NAME,
      (old_data ->> TG_ARGV[0])::BIGINT,
      'deleted',
      'active',
      'deleted',
      current_sales_id,
      TG_OP
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ATTACH AUDIT TRIGGERS TO TABLES
-- ============================================================================
-- Example: Audit opportunities table
-- First argument is primary key column name
-- ============================================================================

CREATE TRIGGER audit_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes('opportunity_id');

CREATE TRIGGER audit_organizations_changes
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes('organization_id');

CREATE TRIGGER audit_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes('contact_id');

-- Add similar triggers for other tables as needed

-- ============================================================================
-- QUERY EXAMPLES: Viewing Audit History
-- ============================================================================

-- View all changes to opportunity #123
-- SELECT
--   field_name,
--   old_value,
--   new_value,
--   s.full_name AS changed_by,
--   changed_at
-- FROM audit_trail a
-- LEFT JOIN sales s ON a.changed_by = s.id
-- WHERE table_name = 'opportunities' AND record_id = 123
-- ORDER BY changed_at DESC;

-- View all changes by a specific user
-- SELECT
--   table_name,
--   record_id,
--   field_name,
--   old_value || ' → ' || new_value AS change,
--   changed_at
-- FROM audit_trail
-- WHERE changed_by = <sales_id>
-- ORDER BY changed_at DESC
-- LIMIT 50;
```

**Performance Considerations:**
- Audit triggers add ~5-10ms per write operation
- Partition `audit_trail` table by month for large datasets
- Consider async queue for very high-volume tables

**Compliance Benefits:**
- Complete audit trail for regulatory requirements
- Cannot be tampered with (triggers only, SECURITY DEFINER)
- Tracks WHO changed WHAT to WHAT VALUE at WHAT TIME

---

## 3. Index Strategy

### 3.1 Index Types and When to Use Them

**B-Tree Indexes (Default):**
- Use for: Equality checks (`WHERE column = value`), range queries (`WHERE date > X`), sorting (`ORDER BY`)
- Most common index type

**Partial Indexes (Critical for Soft Delete):**
- Use for: Filtering deleted records (`WHERE deleted_at IS NULL`)
- Reduces index size by 50-90% (only indexes active records)
- **Pattern:** All active-record queries should have partial index

**GIN Indexes (Generalized Inverted):**
- Use for: JSONB searches, full-text search, array contains operations
- Required for: `email JSONB` and `phone JSONB` fields

**Composite Indexes:**
- Use for: Multi-column queries (`WHERE status = X AND stage = Y`)
- Column order matters: Most selective column first

### 3.2 Indexing Decision Framework

**When to Add an Index:**
- ✅ Foreign key columns (JOIN performance)
- ✅ Columns in `WHERE` clauses (filter performance)
- ✅ Columns in `ORDER BY` (sort performance)
- ✅ Columns in `GROUP BY` (aggregation performance)
- ✅ UNIQUE constraints (data integrity)

**When NOT to Add an Index:**
- ❌ Low-cardinality columns with few distinct values (e.g., `boolean` flags)
- ❌ Columns rarely queried
- ❌ Small tables (<1000 rows)
- ❌ Columns frequently updated (index maintenance overhead)

### 3.3 Partial Index Pattern (Soft Delete)

**Standard Pattern for Active Records:**
```sql
-- Index active records only (excludes deleted_at IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_<table>_active_<column>
  ON <table>(<column>)
  WHERE deleted_at IS NULL;
```

**Example: Organizations by Priority (Active Only)**
```sql
CREATE INDEX IF NOT EXISTS idx_organizations_active_priority
  ON organizations(priority_level)
  WHERE deleted_at IS NULL;

-- Query usage:
-- SELECT * FROM organizations WHERE priority_level = 'A+' AND deleted_at IS NULL;
-- ✅ Uses partial index (fast)
```

### 3.4 Foreign Key Indexes

**Always index foreign key columns** (improves JOIN and CASCADE performance):

```sql
-- Example: Opportunities referencing organizations
CREATE INDEX IF NOT EXISTS idx_opportunities_organization
  ON opportunities(organization_id)
  WHERE deleted_at IS NULL;

-- Query usage:
-- SELECT o.* FROM opportunities o
-- JOIN organizations org ON o.organization_id = org.organization_id
-- WHERE org.organization_name = 'Alinea' AND o.deleted_at IS NULL;
-- ✅ Uses partial index on opportunities(organization_id)
```

### 3.5 Composite Indexes

**For multi-column filters:**

```sql
-- Opportunities filtered by status AND stage
CREATE INDEX IF NOT EXISTS idx_opportunities_active_status_stage
  ON opportunities(status, stage)
  WHERE deleted_at IS NULL;

-- Query usage:
-- SELECT * FROM opportunities
-- WHERE status = 'Open' AND stage = 'SOLD-7' AND deleted_at IS NULL;
-- ✅ Uses composite index (fast)
```

**Column Order Matters:**
- Most selective column first (fewest distinct values)
- Columns used together in queries

### 3.6 JSONB GIN Indexes

**For searching within JSONB arrays:**

```sql
-- Contacts: Search emails
CREATE INDEX IF NOT EXISTS idx_contacts_email_gin
  ON contacts USING gin(email);

-- Query usage:
-- SELECT * FROM contacts
-- WHERE email @> '[{"email": "chef@alinea.com"}]'::jsonb;
-- ✅ Uses GIN index (fast JSONB containment search)
```

### 3.7 Index Naming Convention

```
idx_<table>_[active_]<column1>[_<column2>][_<type>]

Examples:
- idx_organizations_active_priority      (partial index on active records)
- idx_contacts_organization              (foreign key index)
- idx_opportunities_active_status_stage  (composite partial index)
- idx_contacts_email_gin                 (GIN index for JSONB)
```

### 3.8 Monitoring Index Usage

```sql
-- Check index usage statistics (run in production after 1 week)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Unused indexes (idx_scan = 0) are candidates for removal
```

---

## 4. Row Level Security Policies

### 4.1 Two-Layer Security Model

Crispy-CRM implements **two layers of security** (both required):

**Layer 1: Table Permissions (GRANT)**
- Controls which roles can access tables
- Applied at table level
- RLS can only *restrict* access, not *grant* it

**Layer 2: Row Level Security (RLS)**
- Filters which rows users can see/modify
- Applied at row level
- Reads JWT claims via `auth.uid()` and `auth.jwt()`

**❌ Common Mistake:**
```sql
-- Only creating RLS policy without GRANT = "permission denied" errors
CREATE POLICY my_policy ON my_table FOR SELECT USING (true);
-- ❌ Fails: authenticated role has no SELECT permission
```

**✅ Correct Pattern:**
```sql
-- Step 1: GRANT base permissions (Layer 1)
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;

-- Step 2: CREATE RLS policies to filter rows (Layer 2)
CREATE POLICY my_policy ON my_table FOR SELECT TO authenticated USING (true);
```

### 4.2 RLS Policy Patterns

**Pattern A: Shared Team Access (Default for CRM)**

All team members can access all records (no row filtering):

```sql
-- Organizations: All users can view/edit all organizations
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);  -- Only show active records

CREATE POLICY authenticated_insert_organizations ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (deleted_at IS NULL);  -- Prevent inserting deleted records

CREATE POLICY authenticated_update_organizations ON organizations
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_delete_organizations ON organizations
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);  -- Prevent hard-deleting already soft-deleted records
```

**Pattern B: Owner-Only Access (For Personal Resources)**

Users can only access their own records:

```sql
-- Tasks: Users can only see their own tasks
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (
    sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()) AND
    deleted_at IS NULL
  );

CREATE POLICY authenticated_insert_tasks ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
  );

CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (
    sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()) AND
    deleted_at IS NULL
  );

CREATE POLICY authenticated_delete_tasks ON tasks
  FOR DELETE TO authenticated
  USING (
    sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()) AND
    deleted_at IS NULL
  );
```

**Pattern C: Role-Based Access (Admin vs Regular Users)**

Admins see all, regular users see subset:

```sql
-- Opportunities: Admins see all, Sales Reps see only their deals
CREATE POLICY authenticated_select_opportunities ON opportunities
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth.jwt() ->> 'role' = 'admin' OR
      deal_owner_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
    )
  );

-- Opportunities: Only deal owners and admins can edit
CREATE POLICY authenticated_update_opportunities ON opportunities
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth.jwt() ->> 'role' = 'admin' OR
      deal_owner_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
    )
  );
```

### 4.3 Complete RLS Policy Examples

**⚠️ CRITICAL:** These policies enforce PRD Section 3.1 permissions:
- Sales Reps can only edit THEIR ASSIGNED organizations and OWNED opportunities
- Admins can edit everything
- All users can VIEW all records (for reporting, assignment dropdowns)

**Organizations Table (View All, Edit Assigned Only):**

```sql
-- SELECT: All users can view active organizations (needed for dropdowns, reports)
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: All users can create organizations
CREATE POLICY authenticated_insert_organizations ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (deleted_at IS NULL);

-- UPDATE: Only primary/secondary account managers OR admins can edit
CREATE POLICY authenticated_update_organizations ON organizations
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL AND (
      -- Admins can edit all
      auth.jwt() ->> 'role' = 'admin' OR
      -- Primary account manager can edit
      primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid()) OR
      -- Secondary account manager can edit
      secondary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (deleted_at IS NULL);

-- DELETE: Same ownership rules apply for soft delete
CREATE POLICY authenticated_delete_organizations ON organizations
  FOR DELETE TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth.jwt() ->> 'role' = 'admin' OR
      primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid()) OR
      secondary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
    )
  );
```

**Contacts Table (View All, Edit Assigned Only):**

```sql
-- SELECT: All users can view contacts (needed for opportunity associations, reports)
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: All users can create contacts
CREATE POLICY authenticated_insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (deleted_at IS NULL);

-- UPDATE: Only account manager OR organization managers OR admins can edit
CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL AND (
      -- Admins can edit all
      auth.jwt() ->> 'role' = 'admin' OR
      -- Contact's account manager can edit
      account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid()) OR
      -- Organization's primary account manager can edit their contacts
      organization_id IN (
        SELECT organization_id FROM organizations
        WHERE primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
      ) OR
      -- Organization's secondary account manager can edit their contacts
      organization_id IN (
        SELECT organization_id FROM organizations
        WHERE secondary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
      )
    )
  )
  WITH CHECK (deleted_at IS NULL);

-- DELETE: Same ownership rules
CREATE POLICY authenticated_delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth.jwt() ->> 'role' = 'admin' OR
      account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid()) OR
      organization_id IN (
        SELECT organization_id FROM organizations
        WHERE primary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
          OR secondary_account_manager_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
      )
    )
  );
```

**Opportunities Table (View All, Edit Owned Only) - STRICT:**

```sql
-- SELECT: All users can view opportunities (for pipeline reports, team dashboards)
CREATE POLICY authenticated_select_opportunities ON opportunities
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: All users can create opportunities (automatically become deal owner)
CREATE POLICY authenticated_insert_opportunities ON opportunities
  FOR INSERT TO authenticated
  WITH CHECK (deleted_at IS NULL);

-- UPDATE: Only deal owner OR admins can edit
CREATE POLICY authenticated_update_opportunities ON opportunities
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL AND (
      -- Admins can edit all
      auth.jwt() ->> 'role' = 'admin' OR
      -- Only the deal owner can edit their own opportunities
      deal_owner_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (deleted_at IS NULL);

-- DELETE: Only deal owner OR admins can soft-delete
CREATE POLICY authenticated_delete_opportunities ON opportunities
  FOR DELETE TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth.jwt() ->> 'role' = 'admin' OR
      deal_owner_id IN (SELECT id FROM sales WHERE user_id = auth.uid())
    )
  );
```

**Products Table (Shared Access):**

```sql
CREATE POLICY authenticated_select_products ON products
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY authenticated_insert_products ON products
  FOR INSERT TO authenticated
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_update_products ON products
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_delete_products ON products
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);
```

**Activity Log (User-Specific or Team-Wide):**

```sql
-- Option A: Team-wide access (all users see all activities)
CREATE POLICY authenticated_select_activity_log ON activity_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY authenticated_insert_activity_log ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Option B: User-specific access (users only see their own activities)
-- Uncomment if implementing private activity logs
-- CREATE POLICY authenticated_select_activity_log ON activity_log
--   FOR SELECT TO authenticated
--   USING (user_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
```

### 4.4 Admin-Only Policies (Viewing Deleted Records)

**Separate policies for admins to view trash:**

```sql
-- Admins can view deleted organizations (for trash/restore UI)
CREATE POLICY admin_select_deleted_organizations ON organizations
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NOT NULL AND
    auth.jwt() ->> 'role' = 'admin'
  );

-- Admins can restore deleted organizations (set deleted_at = NULL)
CREATE POLICY admin_restore_organizations ON organizations
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NOT NULL AND
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (deleted_at IS NULL);  -- Allow setting deleted_at back to NULL
```

### 4.5 RLS Helper Functions

**Check current user's role:**

```sql
-- Create helper function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'role';
$$ LANGUAGE sql STABLE;

-- Usage in policies:
USING (current_user_role() = 'admin')
```

**Check if user owns a record:**

```sql
-- Create helper function to check if user owns a sales record
CREATE OR REPLACE FUNCTION current_user_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Usage in policies:
USING (deal_owner_id = current_user_sales_id())
```

---

## 5. Seed Data Strategy

### 5.1 Seed Data Location

**Single source of truth:** `supabase/seed.sql`

- Runs automatically after migrations during `npm run db:local:reset`
- Seeds test user (`admin@test.com` / `password123`) and 1800+ organizations
- Contains production-ready data from CSV imports

**DO NOT:**
- ❌ Create separate seed scripts or commands
- ❌ Use external CSV imports for core seed data
- ❌ Run seed data on production (seed.sql is for local dev only)

### 5.2 Seed Data Structure

**Current seed.sql contents:**
```sql
-- Test user (admin@test.com / password123)
INSERT INTO auth.users (...) VALUES (...);

-- Segments (28 industry categories)
INSERT INTO segments (id, name) VALUES (...);

-- Organizations (1809 deduplicated)
INSERT INTO organizations (...) VALUES (...);

-- Contacts (2013 contacts)
INSERT INTO contacts (...) VALUES (...);

-- Sequence resets (prevent ID conflicts)
SELECT setval('segments_id_seq', (SELECT MAX(id) FROM segments));
SELECT setval('organizations_organization_id_seq', (SELECT MAX(organization_id) FROM organizations));
SELECT setval('contacts_contact_id_seq', (SELECT MAX(contact_id) FROM contacts));
```

### 5.3 Adding New Seed Data

**Pattern for adding test opportunities:**

```sql
-- Add to supabase/seed.sql (after contacts section)

-- ============================================================================
-- OPPORTUNITIES (Sample Sales Pipeline)
-- ============================================================================

INSERT INTO opportunities (
  opportunity_name, organization_id, status, stage, start_date,
  probability, cases_per_week_volume, principal, deal_owner_id
) VALUES
  (
    'Alinea - Duck Bacon Partnership',
    (SELECT organization_id FROM organizations WHERE organization_name = 'Alinea' LIMIT 1),
    'Open',
    'Follow-up-4',
    '2025-10-01',
    0.75,
    10,
    'MFB',
    (SELECT id FROM sales LIMIT 1)  -- First sales user
  ),
  (
    'Girl & the Goat - Sausage Trial',
    (SELECT organization_id FROM organizations WHERE organization_name = 'Girl & the Goat' LIMIT 1),
    'Open',
    'Sampled/Visited invite-3',
    '2025-09-15',
    0.60,
    5,
    'MFB',
    (SELECT id FROM sales LIMIT 1)
  ),
  (
    'Alinea - Pork Belly Expansion',
    (SELECT organization_id FROM organizations WHERE organization_name = 'Alinea' LIMIT 1),
    'SOLD-7d',
    'SOLD-7',
    '2025-08-01',
    1.0,
    15,
    'MFB',
    (SELECT id FROM sales LIMIT 1)
  );

-- Reset sequence
SELECT setval('opportunities_opportunity_id_seq', (SELECT MAX(opportunity_id) FROM opportunities));
```

### 5.4 Best Practices

1. **Realistic Data:** Use real restaurant names (Alinea, Girl & the Goat) for better testing
2. **Variety:** Include different stages, statuses, probabilities for comprehensive testing
3. **Relationships:** Link opportunities to existing organizations from seed data
4. **Sequence Resets:** Always reset sequences after bulk inserts
5. **Transaction Wrapper:** Wrap all seed data in `BEGIN; ... COMMIT;` for atomicity

---

## 6. Rollback Procedures

### 6.1 Understanding Supabase Migration Immutability

**⚠️ CRITICAL:** Supabase migrations are **NOT reversible** via CLI.

- `npx supabase db push` applies migrations permanently
- No `db push --rollback` command exists
- Manual rollback required

### 6.2 Rollback Strategies

**Strategy A: Point-in-Time Recovery (Supabase Cloud)**

Supabase Pro plan includes automatic backups:

```bash
# Restore from backup via Supabase Dashboard
# 1. Go to Supabase Dashboard → Database → Backups
# 2. Select backup timestamp (before bad migration)
# 3. Click "Restore" → Confirm

# ⚠️ WARNING: Restores ENTIRE database (loses all data since backup)
```

**Strategy B: Manual Reverse Migration**

Create a new migration that reverses changes:

```bash
# 1. Create reverse migration
npx supabase migration new rollback_add_tasks_table

# 2. Write reverse SQL
# supabase/migrations/<timestamp>_rollback_add_tasks_table.sql
DROP TABLE IF EXISTS tasks CASCADE;

# 3. Apply to local first
npx supabase db reset

# 4. Test thoroughly
npm test

# 5. Deploy to cloud (if safe)
npx supabase db push
```

**Strategy C: Conditional Migration (Forward-Only)**

Write migrations that can be re-run safely:

```sql
-- Idempotent: Can run multiple times without errors
CREATE TABLE IF NOT EXISTS tasks (...);

-- Add column only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_date DATE;
  END IF;
END $$;
```

### 6.3 Emergency Rollback Checklist

**If bad migration deployed to production:**

1. ☐ **STOP:** Do not push additional migrations
2. ☐ **Assess Impact:** Check which tables/data affected
3. ☐ **Communication:** Notify team of issue
4. ☐ **Backup Decision:**
   - If data loss acceptable → Point-in-time restore
   - If data loss NOT acceptable → Manual reverse migration
5. ☐ **Test Locally:** Verify rollback migration works on local DB
6. ☐ **Deploy Fix:** Apply reverse migration to production
7. ☐ **Verify:** Check application still works
8. ☐ **Post-Mortem:** Document what went wrong, how to prevent

### 6.4 Rollback Examples

**Example 1: Rollback Table Addition**

```sql
-- Original migration: 20251102120000_add_tasks_table.sql
CREATE TABLE tasks (
  task_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  ...
);

-- Rollback migration: 20251102130000_rollback_add_tasks_table.sql
DROP TABLE IF EXISTS tasks CASCADE;  -- CASCADE drops dependent objects
```

**Example 2: Rollback Column Addition**

```sql
-- Original migration: 20251102120000_add_website_column.sql
ALTER TABLE organizations ADD COLUMN website TEXT;

-- Rollback migration: 20251102130000_rollback_add_website_column.sql
ALTER TABLE organizations DROP COLUMN IF EXISTS website;
```

**Example 3: Rollback Data Migration**

```sql
-- Original migration: 20251102120000_update_priority_levels.sql
UPDATE organizations SET priority_level = 'A+' WHERE priority_level = 'Premium';

-- Rollback migration: 20251102130000_rollback_update_priority_levels.sql
UPDATE organizations SET priority_level = 'Premium' WHERE priority_level = 'A+';
```

### 6.5 Prevention Better Than Cure

**Best practices to avoid needing rollbacks:**

1. ✅ **Test locally first:** Always run `npm run db:local:reset` and verify
2. ✅ **Peer review:** Have another developer review migration SQL
3. ✅ **Staging environment:** Deploy to staging before production
4. ✅ **Idempotent migrations:** Use `IF NOT EXISTS`, `IF EXISTS` checks
5. ✅ **Small changes:** One logical change per migration
6. ✅ **Backup verification:** Confirm backups exist before risky migrations
7. ✅ **Read-only check:** Test migration on read-replica first (if available)

---

## 7. Migration Dependencies

### 7.1 Table Creation Order

**Follow this order to satisfy foreign key constraints:**

```
1. auth.users (Supabase managed - exists by default)
2. segments
3. sales (auto-created from auth.users via trigger)
4. organizations (depends on: sales, segments)
5. contacts (depends on: organizations, sales)
6. products (depends on: sales)
7. opportunities (depends on: organizations, sales)
8. opportunity_products (depends on: opportunities, products)
9. activity_log (depends on: sales, polymorphic to opportunities/organizations/contacts)
10. tasks (depends on: sales)
```

### 7.2 Dependency Graph

```
auth.users (Supabase)
    ├─→ sales (trigger: create_sales_from_user)
    │       ├─→ organizations (FK: created_by, updated_by, primary_account_manager_id, secondary_account_manager_id)
    │       │       ├─→ contacts (FK: organization_id, account_manager_id, created_by, updated_by)
    │       │       ├─→ opportunities (FK: organization_id, deal_owner_id, created_by, updated_by)
    │       │       └─→ activity_log (FK: entity_id when entity_type='Organization', user_id)
    │       ├─→ contacts (FK: created_by, updated_by, account_manager_id)
    │       │       └─→ activity_log (FK: entity_id when entity_type='Contact')
    │       ├─→ products (FK: created_by, updated_by)
    │       │       └─→ opportunity_products (FK: product_id)
    │       ├─→ opportunities (FK: deal_owner_id, created_by, updated_by)
    │       │       ├─→ opportunity_products (FK: opportunity_id)
    │       │       └─→ activity_log (FK: entity_id when entity_type='Opportunity')
    │       ├─→ activity_log (FK: user_id)
    │       └─→ tasks (FK: sales_id, created_by, updated_by)
    └─→ segments
            └─→ organizations (FK: segment_id)
```

### 7.3 Migration Checklist (New Table)

When adding a new table, follow this checklist:

```sql
-- ============================================================================
-- NEW TABLE MIGRATION CHECKLIST
-- ============================================================================

-- [ ] 1. CREATE TABLE with all columns
CREATE TABLE IF NOT EXISTS <table_name> (
  -- Primary key
  <table>_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Business fields
  ...,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by BIGINT REFERENCES sales(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id)
);

-- [ ] 2. ENABLE RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- [ ] 3. GRANT permissions (Layer 1)
GRANT SELECT, INSERT, UPDATE, DELETE ON <table_name> TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE <table_name>_<table>_id_seq TO authenticated;

-- [ ] 4. CREATE indexes (partial for active records)
CREATE INDEX IF NOT EXISTS idx_<table>_active_<column>
  ON <table_name>(<column>)
  WHERE deleted_at IS NULL;

-- [ ] 5. CREATE RLS policies (Layer 2)
CREATE POLICY authenticated_select_<table> ON <table_name>
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY authenticated_insert_<table> ON <table_name>
  FOR INSERT TO authenticated
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_update_<table> ON <table_name>
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_delete_<table> ON <table_name>
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);

-- [ ] 6. CREATE triggers (if needed)
-- Example: updated_at auto-update trigger

-- [ ] 7. ADD seed data (supabase/seed.sql)

-- [ ] 8. UPDATE filter registry (src/providers/supabase/filterRegistry.ts)

-- [ ] 9. TEST locally (npm run db:local:reset)

-- [ ] 10. PEER REVIEW before cloud push
```

---

## 8. Related Documentation

**Architecture Decision Records:**
- [ADR-0001: Use Supabase for Backend Platform](../architecture/adr/0001-use-supabase-for-backend-platform.md)
- [ADR-0004: Use JWT Authentication with Refresh Tokens](../architecture/adr/0004-use-jwt-authentication-with-refresh-tokens.md)
- [ADR-0005: Soft Delete Strategy for Core Entities](../architecture/adr/0005-soft-delete-strategy-for-core-entities.md)

**Database Workflows:**
- [Supabase Workflow Overview](../supabase/WORKFLOW.md) - Complete local + cloud guide
- [Production Safety Guide](../../scripts/db/PRODUCTION-WARNING.md) - Must read before production changes
- [Engineering Constitution](../claude/engineering-constitution.md) - Core development principles

**Project Requirements:**
- [Product Requirements Document](../PRD.md) - Complete feature specifications

---

## 9. Quick Reference

**Common Commands:**
```bash
# Local Development
npm run db:local:start          # Start local Supabase
npm run db:local:reset          # Reset DB + seed data
npm run dev                     # Start UI

# Migrations
npx supabase migration new <name>  # Create migration
npx supabase db reset           # Apply all migrations locally
npx supabase db push            # Deploy to cloud (IRREVERSIBLE)

# Verification
npm test                        # Run test suite
npm run validate:colors         # Validate color system
```

**Migration Template:**
```sql
BEGIN;

-- Add idempotent schema changes
CREATE TABLE IF NOT EXISTS <table> (...);
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;
CREATE POLICY ... ON <table> ...;

COMMIT;
```

**Index Template:**
```sql
-- Partial index (active records only)
CREATE INDEX IF NOT EXISTS idx_<table>_active_<column>
  ON <table>(<column>)
  WHERE deleted_at IS NULL;
```

**RLS Policy Template:**
```sql
-- Shared team access (all authenticated users)
CREATE POLICY authenticated_select_<table> ON <table>
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY authenticated_insert_<table> ON <table>
  FOR INSERT TO authenticated
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_update_<table> ON <table>
  FOR UPDATE TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_delete_<table> ON <table>
  FOR DELETE TO authenticated
  USING (deleted_at IS NULL);
```

---

**Last Updated:** 2025-11-02
**Status:** ✅ **Complete Reference Documentation**
**Maintainer:** Engineering Team
