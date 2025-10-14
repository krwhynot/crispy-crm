-- =====================================================================
-- Atomic CRM Consolidated Schema
-- Generated from 68 historical migrations
-- Date: 2025-01-27
--
-- This consolidates all migrations into a single source of truth
-- Previous migrations: 20250923012432 through 20250926125832
-- =====================================================================

-- =====================================================================
-- SECTION 1: EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- SECTION 2: CUSTOM TYPES/ENUMS
-- =====================================================================

-- Activity types
CREATE TYPE activity_type AS ENUM (
    'engagement',
    'interaction'
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

-- Opportunity stages (food service pipeline)
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

-- Pricing model types
CREATE TYPE pricing_model_type AS ENUM (
    'fixed',
    'tiered',
    'volume',
    'subscription',
    'custom'
);

-- Priority levels
CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Product categories (food service)
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

-- Storage temperature requirements
CREATE TYPE storage_temperature AS ENUM (
    'frozen',
    'refrigerated',
    'cool',
    'room_temp',
    'no_requirement'
);

-- Units of measure
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

-- =====================================================================
-- SECTION 3: TABLES (in dependency order)
-- =====================================================================

-- Sales/Users table
CREATE TABLE IF NOT EXISTS public.sales (
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

-- Organizations table (renamed from companies)
CREATE TABLE IF NOT EXISTS public.organizations (
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
CREATE TABLE IF NOT EXISTS public.contacts (
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

COMMENT ON TABLE contacts IS 'Backward compatibility removed - use contact_organizations for relationships';

-- Opportunities table (renamed from deals)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    description text,
    stage opportunity_stage DEFAULT 'new_lead',
    status opportunity_status DEFAULT 'active',
    priority priority_level DEFAULT 'medium',
    probability integer CHECK (probability >= 0 AND probability <= 100) DEFAULT 0,
    amount numeric,
    category text,
    index integer,  -- For Kanban board ordering
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

COMMENT ON TABLE opportunities IS 'Use customer_organization_id (not company_id)';

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
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
CREATE TABLE IF NOT EXISTS public.tasks (
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
    -- Note: archived_at removed per migration #65
);

-- Contact Notes table
CREATE TABLE IF NOT EXISTS public."contactNotes" (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    contact_id bigint NOT NULL REFERENCES contacts(id),
    text text NOT NULL,
    attachments text[],
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Opportunity Notes table
CREATE TABLE IF NOT EXISTS public."opportunityNotes" (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    opportunity_id bigint NOT NULL REFERENCES opportunities(id),
    text text NOT NULL,
    attachments text[],
    sales_id bigint REFERENCES sales(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text UNIQUE NOT NULL,
    color text DEFAULT 'blue-500',
    description text,
    usage_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Contact Organizations junction table
CREATE TABLE IF NOT EXISTS public.contact_organizations (
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

COMMENT ON TABLE contact_organizations IS 'Use is_primary field (not is_primary_contact)';

-- Opportunity Participants junction table
CREATE TABLE IF NOT EXISTS public.opportunity_participants (
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
CREATE TABLE IF NOT EXISTS public.interaction_participants (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    activity_id bigint NOT NULL REFERENCES activities(id),
    contact_id bigint REFERENCES contacts(id),
    organization_id bigint,
    role varchar(20) DEFAULT 'participant',
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Contact Preferred Principals junction table
CREATE TABLE IF NOT EXISTS public.contact_preferred_principals (
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

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
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
CREATE TABLE IF NOT EXISTS public.product_category_hierarchy (
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
CREATE TABLE IF NOT EXISTS public.product_pricing_tiers (
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
CREATE TABLE IF NOT EXISTS public.product_pricing_models (
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
CREATE TABLE IF NOT EXISTS public.product_inventory (
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
CREATE TABLE IF NOT EXISTS public.product_features (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id bigint NOT NULL REFERENCES products(id),
    feature_name text NOT NULL,
    feature_value text,
    display_order integer DEFAULT 0,
    is_highlighted boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Product Distributor Authorizations table
CREATE TABLE IF NOT EXISTS public.product_distributor_authorizations (
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
CREATE TABLE IF NOT EXISTS public.opportunity_products (
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

-- Migration History table (custom tracking)
CREATE TABLE IF NOT EXISTS public.migration_history (
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
-- SECTION 4: INDEXES
-- =====================================================================

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_organizations_search ON organizations USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_organizations_sales_id ON organizations(sales_id);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);

CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_contacts_sales_id ON contacts(sales_id);
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email_gin ON contacts USING gin(email);

CREATE INDEX IF NOT EXISTS idx_opportunities_search ON opportunities USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_opportunities_sales_id ON opportunities(sales_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at ON opportunities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_org ON opportunities(customer_organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_index ON opportunities(index);

CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_activity_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

CREATE INDEX IF NOT EXISTS idx_tasks_opportunity_id ON tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sales_id ON tasks(sales_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_contact_organizations_contact_id ON contact_organizations(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_organizations_organization_id ON contact_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_organizations_primary ON contact_organizations(contact_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_opportunity_participants_opportunity ON opportunity_participants(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_participants_organization ON opportunity_participants(organization_id);

CREATE INDEX IF NOT EXISTS idx_interaction_participants_activity ON interaction_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_interaction_participants_contact ON interaction_participants(contact_id);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_products_principal ON products(principal_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- =====================================================================
-- SECTION 5: FOREIGN KEYS (already defined inline, documenting here)
-- =====================================================================

-- All foreign keys are defined inline with table creation for clarity

-- =====================================================================
-- SECTION 6: RLS POLICIES
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

-- Simple RLS policies (authenticated access only)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'organizations', 'contacts', 'opportunities', 'activities', 'tasks',
        'contactNotes', 'opportunityNotes', 'tags', 'contact_organizations',
        'opportunity_participants', 'interaction_participants', 'contact_preferred_principals',
        'products', 'product_category_hierarchy', 'product_pricing_tiers',
        'product_pricing_models', 'product_inventory', 'product_features',
        'product_distributor_authorizations', 'opportunity_products', 'sales',
        'migration_history'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Authenticated users can access all data" ON %I;
            CREATE POLICY "Authenticated users can access all data" ON %I
                FOR ALL USING (auth.role() = ''authenticated'');
        ', t, t);
    END LOOP;
END $$;

-- =====================================================================
-- SECTION 7: VIEWS
-- =====================================================================

-- Organizations Summary View (SECURITY DEFINER for React Admin)
CREATE OR REPLACE VIEW public.organizations_summary
WITH (security_invoker = false) AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
    o.parent_organization_id,
    o.segment,
    o.priority,
    o.industry,
    o.website,
    o.address,
    o.city,
    o.state,
    o.postal_code,
    o.country,
    o.phone,
    o.email,
    o.logo_url,
    o.linkedin_url,
    o.annual_revenue,
    o.employee_count,
    o.founded_year,
    o.notes,
    o.sales_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    COUNT(DISTINCT co.contact_id) as contact_count,
    COUNT(DISTINCT op.id) as opportunity_count
FROM organizations o
LEFT JOIN contact_organizations co ON o.id = co.organization_id AND co.deleted_at IS NULL
LEFT JOIN opportunities op ON o.id = op.customer_organization_id AND op.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Contacts Summary View (SECURITY DEFINER for React Admin)
CREATE OR REPLACE VIEW public.contacts_summary
WITH (security_invoker = false) AS
SELECT
    c.id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    c.role,
    c.department,
    c.purchase_influence,
    c.decision_authority,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.birthday,
    c.linkedin_url,
    c.twitter_handle,
    c.notes,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.deleted_at,
    c.first_seen,
    c.last_seen,
    c.gender,
    c.tags,
    org.id as organization_id,
    org.name as organization_name,
    org.organization_type
FROM contacts c
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.is_primary = true
LEFT JOIN organizations org ON co.organization_id = org.id
WHERE c.deleted_at IS NULL;

-- Opportunities Summary View (SECURITY DEFINER for React Admin)
CREATE OR REPLACE VIEW public.opportunities_summary
WITH (security_invoker = false) AS
SELECT
    o.id,
    o.name,
    o.description,
    o.stage,
    o.status,
    o.priority,
    o.probability,
    o.amount,
    o.category,
    o.index,
    o.estimated_close_date,
    o.actual_close_date,
    o.customer_organization_id,
    o.principal_organization_id,
    o.distributor_organization_id,
    o.founding_interaction_id,
    o.stage_manual,
    o.status_manual,
    o.next_action,
    o.next_action_date,
    o.competition,
    o.decision_criteria,
    o.contact_ids,
    o.sales_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
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

-- Grant access to views for authenticated and anon roles
GRANT SELECT ON organizations_summary TO authenticated, anon;
GRANT SELECT ON contacts_summary TO authenticated, anon;
GRANT SELECT ON opportunities_summary TO authenticated, anon;

-- =====================================================================
-- SECTION 8: FUNCTIONS & TRIGGERS
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

CREATE OR REPLACE FUNCTION update_products_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.sku, '') || ' ' ||
        COALESCE(NEW.brand, '') || ' ' ||
        COALESCE(NEW.marketing_description, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set primary organization RPC function (migration #66)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers for updated_at
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

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply triggers for search vectors
CREATE TRIGGER update_organizations_search_trigger
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_organizations_search();

CREATE TRIGGER update_contacts_search_trigger
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_contacts_search();

CREATE TRIGGER update_opportunities_search_trigger
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_opportunities_search();

CREATE TRIGGER update_products_search_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_products_search();

-- =====================================================================
-- SECTION 9: INITIAL DATA
-- =====================================================================

-- No initial data required - this is handled by seed scripts

-- =====================================================================
-- SECTION 10: MIGRATION HISTORY UPDATE
-- =====================================================================

-- Record this consolidation in migration history
INSERT INTO public.migration_history (
    phase_number,
    phase_name,
    status,
    started_at,
    completed_at,
    rows_affected
) VALUES (
    '20250127000000',
    'consolidated_fresh_schema',
    'completed',
    now(),
    now(),
    0
);

-- =====================================================================
-- SECTION 11: STORAGE BUCKETS
-- =====================================================================

-- Create attachments storage bucket for avatars, logos, and file attachments
-- Note: File size limits and MIME types are configured via Supabase config.toml or Dashboard
INSERT INTO storage.buckets (id, name)
VALUES ('attachments', 'attachments')
ON CONFLICT (id) DO NOTHING;  -- Idempotent: skip if bucket already exists

-- Storage RLS Policies for authenticated users
-- Drop existing policies if they exist, then create new ones (idempotent)
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Authenticated users can update attachments" ON storage.objects;
CREATE POLICY "Authenticated users can update attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Authenticated users can delete attachments" ON storage.objects;
CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);

-- =====================================================================
-- END OF CONSOLIDATED MIGRATION
-- =====================================================================
-- This represents the complete schema as of 2025-10-12
-- Consolidated from 34 previous migrations + storage compatibility fix
-- =====================================================================
