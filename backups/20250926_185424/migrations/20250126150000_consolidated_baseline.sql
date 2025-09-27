-- =====================================================================
-- Migration: 20250126150000_consolidated_baseline.sql
-- Purpose: Complete baseline schema consolidating 68 previous migrations
-- Date: 2025-01-26 15:00:00
-- =====================================================================
--
-- IMPORTANT: This is a baseline migration representing the complete
-- database schema as of 2025-01-26. It consolidates all previous
-- migrations into a single source of truth.
--
-- Dependencies: None (baseline)
-- Rollback: Not applicable for baseline
-- Testing: Must be tested in staging before production
-- =====================================================================

-- =====================================================================
-- SECTION 1: EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- SECTION 2: CUSTOM TYPES
-- =====================================================================

-- Organization types
CREATE TYPE organization_type AS ENUM (
    'customer',
    'principal',
    'distributor',
    'prospect',
    'vendor',
    'partner',
    'unknown'
);

-- Opportunity stages
CREATE TYPE opportunity_stage AS ENUM (
    'new_lead',
    'initial_outreach',
    'sample_visit_offered',
    'awaiting_response',
    'feedback_logged',
    'demo_scheduled',
    'closed_won',
    'closed_lost'
);

-- Opportunity status
CREATE TYPE opportunity_status AS ENUM (
    'active',
    'on_hold',
    'nurturing',
    'stalled',
    'expired'
);

-- Priority levels
CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Contact roles
CREATE TYPE contact_role AS ENUM (
    'decision_maker',
    'influencer',
    'buyer',
    'end_user',
    'gatekeeper',
    'champion',
    'technical',
    'executive'
);

-- Activity types
CREATE TYPE activity_type AS ENUM (
    'engagement',
    'interaction'
);

-- Interaction types
CREATE TYPE interaction_type AS ENUM (
    'call',
    'email',
    'meeting',
    'demo',
    'proposal',
    'follow_up',
    'trade_show',
    'site_visit',
    'contract_review',
    'check_in',
    'social'
);

-- Product categories
CREATE TYPE product_category AS ENUM (
    'beverages',
    'dairy',
    'frozen',
    'fresh_produce',
    'meat_poultry',
    'seafood',
    'dry_goods',
    'snacks',
    'condiments',
    'baking_supplies',
    'spices_seasonings',
    'canned_goods',
    'pasta_grains',
    'oils_vinegars',
    'sweeteners',
    'cleaning_supplies',
    'paper_products',
    'equipment',
    'other'
);

-- Product status
CREATE TYPE product_status AS ENUM (
    'active',
    'discontinued',
    'seasonal',
    'coming_soon',
    'out_of_stock',
    'limited_availability'
);

-- Storage temperature
CREATE TYPE storage_temperature AS ENUM (
    'frozen',
    'refrigerated',
    'cool',
    'room_temp',
    'no_requirement'
);

-- Unit of measure
CREATE TYPE unit_of_measure AS ENUM (
    'each',
    'case',
    'pallet',
    'pound',
    'ounce',
    'gallon',
    'quart',
    'pint',
    'liter',
    'kilogram',
    'gram',
    'dozen',
    'gross',
    'box',
    'bag',
    'container'
);

-- Pricing model type
CREATE TYPE pricing_model_type AS ENUM (
    'fixed',
    'tiered',
    'volume',
    'subscription',
    'custom'
);

-- =====================================================================
-- SECTION 3: CORE TABLES
-- =====================================================================

-- Sales table (users)
CREATE TABLE IF NOT EXISTS sales (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid UNIQUE REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    first_name text,
    last_name text,
    email text,
    phone text,
    avatar_url text,
    is_admin boolean DEFAULT false,
    deleted_at timestamptz,
    disabled boolean DEFAULT false
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    organization_type organization_type DEFAULT 'customer',
    is_principal boolean DEFAULT false,
    is_distributor boolean DEFAULT false,
    parent_organization_id bigint REFERENCES organizations(id),
    segment text DEFAULT 'Standard',
    priority varchar(1) CHECK (priority IN ('A', 'B', 'C', 'D')) DEFAULT 'C',
    industry text,
    website text,
    address text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'USA',
    phone text,
    email text,
    logo_url text,
    linkedin_url text,
    annual_revenue numeric,
    employee_count integer,
    founded_year integer,
    notes text,
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    deleted_at timestamptz,
    import_session_id uuid,
    search_tsv tsvector
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    first_name text,
    last_name text,
    email jsonb DEFAULT '[]'::jsonb,
    phone jsonb DEFAULT '[]'::jsonb,
    title text,
    role contact_role,
    department text,
    purchase_influence varchar(10) CHECK (purchase_influence IN ('High', 'Medium', 'Low', 'Unknown')) DEFAULT 'Unknown',
    decision_authority varchar(20) CHECK (decision_authority IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper')) DEFAULT 'End User',
    address text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'USA',
    birthday date,
    linkedin_url text,
    twitter_handle text,
    notes text,
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    deleted_at timestamptz,
    search_tsv tsvector,
    first_seen timestamptz DEFAULT now(),
    last_seen timestamptz DEFAULT now(),
    gender text,
    tags bigint[] DEFAULT '{}'
);

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    description text,
    stage opportunity_stage DEFAULT 'new_lead',
    status opportunity_status DEFAULT 'active',
    priority priority_level DEFAULT 'medium',
    probability integer CHECK (probability >= 0 AND probability <= 100) DEFAULT 0,
    amount numeric,
    category text,
    index integer,
    estimated_close_date date,
    actual_close_date date,
    customer_organization_id bigint,
    principal_organization_id bigint,
    distributor_organization_id bigint,
    founding_interaction_id bigint,
    stage_manual boolean DEFAULT false,
    status_manual boolean DEFAULT false,
    next_action text,
    next_action_date date,
    competition text,
    decision_criteria text,
    contact_ids bigint[] DEFAULT '{}',
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    deleted_at timestamptz,
    search_tsv tsvector
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    activity_type activity_type NOT NULL,
    type interaction_type NOT NULL,
    subject text NOT NULL,
    description text,
    activity_date timestamptz DEFAULT now(),
    duration_minutes integer,
    contact_id bigint REFERENCES contacts(id),
    organization_id bigint,
    opportunity_id bigint REFERENCES opportunities(id),
    follow_up_required boolean DEFAULT false,
    follow_up_date date,
    follow_up_notes text,
    outcome text,
    sentiment varchar(10) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    attachments text[],
    location text,
    attendees text[],
    tags text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    deleted_at timestamptz
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    description text,
    due_date date,
    reminder_date date,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    priority priority_level DEFAULT 'medium',
    contact_id bigint REFERENCES contacts(id),
    opportunity_id bigint REFERENCES opportunities(id),
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Contact Notes table
CREATE TABLE IF NOT EXISTS "contactNotes" (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    contact_id bigint NOT NULL REFERENCES contacts(id),
    text text NOT NULL,
    attachments text[],
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Opportunity Notes table
CREATE TABLE IF NOT EXISTS "opportunityNotes" (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    opportunity_id bigint NOT NULL REFERENCES opportunities(id),
    text text NOT NULL,
    attachments text[],
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text UNIQUE NOT NULL,
    color text DEFAULT 'blue-500',
    description text,
    usage_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- SECTION 4: JUNCTION TABLES
-- =====================================================================

-- Contact Organizations junction table
CREATE TABLE IF NOT EXISTS contact_organizations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    contact_id bigint NOT NULL REFERENCES contacts(id),
    organization_id bigint NOT NULL,
    is_primary boolean DEFAULT false,
    is_primary_decision_maker boolean DEFAULT false,
    role contact_role,
    purchase_influence smallint CHECK (purchase_influence >= 0 AND purchase_influence <= 100),
    decision_authority smallint CHECK (decision_authority >= 0 AND decision_authority <= 100),
    relationship_start_date date DEFAULT CURRENT_DATE,
    relationship_end_date date,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    deleted_at timestamptz
);

-- Opportunity Participants junction table
CREATE TABLE IF NOT EXISTS opportunity_participants (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    opportunity_id bigint NOT NULL REFERENCES opportunities(id),
    organization_id bigint NOT NULL,
    role varchar(20) CHECK (role IN ('customer', 'principal', 'distributor', 'partner', 'competitor')) NOT NULL,
    is_primary boolean DEFAULT false,
    commission_rate numeric CHECK (commission_rate >= 0 AND commission_rate <= 1),
    territory text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    deleted_at timestamptz
);

-- Interaction Participants junction table
CREATE TABLE IF NOT EXISTS interaction_participants (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    activity_id bigint NOT NULL REFERENCES activities(id),
    contact_id bigint REFERENCES contacts(id),
    organization_id bigint,
    role varchar(20) DEFAULT 'participant',
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Contact Preferred Principals junction table
CREATE TABLE IF NOT EXISTS contact_preferred_principals (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    contact_id bigint NOT NULL REFERENCES contacts(id),
    principal_organization_id bigint NOT NULL,
    advocacy_strength smallint CHECK (advocacy_strength >= 0 AND advocacy_strength <= 100) DEFAULT 50,
    last_interaction_date date,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    deleted_at timestamptz
);

-- =====================================================================
-- SECTION 5: PRODUCT TABLES
-- =====================================================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    principal_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    sku text NOT NULL,
    upc text,
    category product_category NOT NULL,
    subcategory text,
    brand text,
    unit_of_measure unit_of_measure DEFAULT 'each',
    units_per_case integer,
    cases_per_pallet integer,
    weight_per_unit numeric,
    dimensions jsonb,
    cost_per_unit numeric,
    list_price numeric,
    map_price numeric,
    min_order_quantity integer DEFAULT 1,
    max_order_quantity integer,
    lead_time_days integer,
    status product_status DEFAULT 'active',
    storage_temperature storage_temperature DEFAULT 'room_temp',
    shelf_life_days integer,
    expiration_date_required boolean DEFAULT false,
    lot_tracking_required boolean DEFAULT false,
    is_seasonal boolean DEFAULT false,
    season_start_month integer CHECK (season_start_month >= 1 AND season_start_month <= 12),
    season_end_month integer CHECK (season_end_month >= 1 AND season_end_month <= 12),
    specifications jsonb,
    certifications text[],
    allergens text[],
    ingredients text,
    nutritional_info jsonb,
    image_urls text[],
    marketing_description text,
    features text[],
    benefits text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id),
    updated_by bigint REFERENCES sales(id),
    deleted_at timestamptz,
    search_tsv tsvector
);

-- Product Category Hierarchy table
CREATE TABLE IF NOT EXISTS product_category_hierarchy (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category_name text UNIQUE NOT NULL,
    parent_category_id bigint REFERENCES product_category_hierarchy(id),
    category_path text,
    level integer DEFAULT 0,
    display_order integer DEFAULT 0,
    icon text,
    description text,
    attributes jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Product Pricing Tiers table
CREATE TABLE IF NOT EXISTS product_pricing_tiers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id bigint NOT NULL REFERENCES products(id),
    tier_name text,
    min_quantity integer NOT NULL,
    max_quantity integer,
    unit_price numeric NOT NULL CHECK (unit_price > 0),
    discount_percent numeric CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount numeric,
    effective_date date DEFAULT CURRENT_DATE,
    expiration_date date,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id)
);

-- Product Pricing Models table
CREATE TABLE IF NOT EXISTS product_pricing_models (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id bigint NOT NULL REFERENCES products(id),
    model_type pricing_model_type DEFAULT 'fixed',
    base_price numeric,
    min_price numeric,
    max_price numeric,
    pricing_rules jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id)
);

-- Product Inventory table
CREATE TABLE IF NOT EXISTS product_inventory (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id bigint NOT NULL REFERENCES products(id),
    warehouse_location text,
    quantity_on_hand integer DEFAULT 0,
    quantity_committed integer DEFAULT 0,
    quantity_available integer GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
    reorder_point integer,
    reorder_quantity integer,
    last_restock_date date,
    next_restock_date date,
    lot_numbers jsonb,
    updated_at timestamptz DEFAULT now()
);

-- Product Features table
CREATE TABLE IF NOT EXISTS product_features (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id bigint NOT NULL REFERENCES products(id),
    feature_name text NOT NULL,
    feature_value text,
    display_order integer DEFAULT 0,
    is_highlighted boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Product Distributor Authorizations table
CREATE TABLE IF NOT EXISTS product_distributor_authorizations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id bigint NOT NULL REFERENCES products(id),
    distributor_id bigint NOT NULL,
    is_authorized boolean DEFAULT true,
    authorization_date date DEFAULT CURRENT_DATE,
    expiration_date date,
    special_pricing jsonb,
    territory_restrictions text[],
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id)
);

-- Opportunity Products table
CREATE TABLE IF NOT EXISTS opportunity_products (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    opportunity_id bigint NOT NULL REFERENCES opportunities(id),
    product_id bigint,
    product_id_reference bigint REFERENCES products(id),
    product_name text NOT NULL,
    product_category text,
    quantity integer DEFAULT 1,
    unit_price numeric,
    extended_price numeric GENERATED ALWAYS AS (quantity::numeric * unit_price) STORED,
    discount_percent numeric CHECK (discount_percent >= 0 AND discount_percent <= 100) DEFAULT 0,
    final_price numeric GENERATED ALWAYS AS ((quantity::numeric * unit_price) * (1 - discount_percent / 100)) STORED,
    price_tier_id bigint REFERENCES product_pricing_tiers(id),
    cost_per_unit numeric,
    margin_percent numeric,
    total_weight numeric,
    special_pricing_applied boolean DEFAULT false,
    pricing_notes text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by bigint REFERENCES sales(id)
);

-- =====================================================================
-- SECTION 6: UTILITY TABLES
-- =====================================================================

-- Migration History table (for tracking migrations)
CREATE TABLE IF NOT EXISTS migration_history (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    phase_number text NOT NULL,
    phase_name text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    started_at timestamptz,
    completed_at timestamptz,
    error_message text,
    rollback_sql text,
    rows_affected bigint,
    created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- SECTION 7: INDEXES
-- =====================================================================

-- Primary indexes for search and performance
CREATE INDEX IF NOT EXISTS idx_organizations_search ON organizations USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_organizations_sales_id ON organizations(sales_id);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_contacts_sales_id ON contacts(sales_id);
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_search ON opportunities USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_opportunities_sales_id ON opportunities(sales_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at ON opportunities(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_opportunity_id ON tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sales_id ON tasks(sales_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_contact_organizations_contact_id ON contact_organizations(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_organizations_organization_id ON contact_organizations(organization_id);

-- =====================================================================
-- SECTION 8: FUNCTIONS
-- =====================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Search vector update functions
CREATE OR REPLACE FUNCTION update_organizations_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.industry, '') || ' ' ||
        COALESCE(NEW.city, '') || ' ' ||
        COALESCE(NEW.state, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_contacts_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.first_name, '') || ' ' ||
        COALESCE(NEW.last_name, '') || ' ' ||
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.department, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_opportunities_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set primary organization function
CREATE OR REPLACE FUNCTION set_primary_organization(
    p_contact_id bigint,
    p_organization_id bigint
) RETURNS void AS $$
BEGIN
    -- First, set all organizations for this contact to non-primary
    UPDATE contact_organizations
    SET is_primary = false
    WHERE contact_id = p_contact_id;

    -- Then set the specified organization as primary
    UPDATE contact_organizations
    SET is_primary = true
    WHERE contact_id = p_contact_id
        AND organization_id = p_organization_id;

    -- If no rows were updated, insert a new relationship
    IF NOT FOUND THEN
        INSERT INTO contact_organizations (contact_id, organization_id, is_primary)
        VALUES (p_contact_id, p_organization_id, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SECTION 9: TRIGGERS
-- =====================================================================

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Search vector triggers
CREATE TRIGGER update_organizations_search_trigger
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_organizations_search();

CREATE TRIGGER update_contacts_search_trigger
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_contacts_search();

CREATE TRIGGER update_opportunities_search_trigger
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_opportunities_search();

-- =====================================================================
-- SECTION 10: VIEWS
-- =====================================================================

-- Organizations Summary View
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
    o.*,
    COUNT(DISTINCT co.contact_id) as contact_count,
    COUNT(DISTINCT op.id) as opportunity_count
FROM organizations o
LEFT JOIN contact_organizations co ON o.id = co.organization_id AND co.deleted_at IS NULL
LEFT JOIN opportunities op ON o.id = op.customer_organization_id AND op.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Contacts Summary View
CREATE OR REPLACE VIEW contacts_summary AS
SELECT
    c.*,
    org.id as organization_id,
    org.name as organization_name,
    org.organization_type
FROM contacts c
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.is_primary = true
LEFT JOIN organizations org ON co.organization_id = org.id
WHERE c.deleted_at IS NULL;

-- Opportunities Summary View
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
    o.*,
    cust.name as customer_name,
    prin.name as principal_name,
    dist.name as distributor_name,
    s.first_name || ' ' || s.last_name as sales_name
FROM opportunities o
LEFT JOIN organizations cust ON o.customer_organization_id = cust.id
LEFT JOIN organizations prin ON o.principal_organization_id = prin.id
LEFT JOIN organizations dist ON o.distributor_organization_id = dist.id
LEFT JOIN sales s ON o.sales_id = s.id
WHERE o.deleted_at IS NULL;

-- =====================================================================
-- SECTION 11: ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contactNotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunityNotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_preferred_principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_distributor_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_history ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (authenticated access only)
CREATE POLICY "Authenticated users can access all data" ON organizations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON contacts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON opportunities
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON activities
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON tasks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON "contactNotes"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON "opportunityNotes"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON tags
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON contact_organizations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON opportunity_participants
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON interaction_participants
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON contact_preferred_principals
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON product_category_hierarchy
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON product_pricing_tiers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON product_pricing_models
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON product_inventory
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON product_features
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON product_distributor_authorizations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON opportunity_products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON sales
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access all data" ON migration_history
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================================
-- SECTION 12: GRANTS FOR VIEWS
-- =====================================================================

-- Grant access to views for authenticated and anon roles
GRANT SELECT ON organizations_summary TO authenticated, anon;
GRANT SELECT ON contacts_summary TO authenticated, anon;
GRANT SELECT ON opportunities_summary TO authenticated, anon;

-- =====================================================================
-- END OF BASELINE MIGRATION
-- =====================================================================
-- This baseline represents the complete schema as of 2025-01-26
-- All future migrations should be incremental changes from this point
-- =====================================================================