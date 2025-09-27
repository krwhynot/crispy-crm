-- =====================================================
-- Fresh CRM Schema - Complete Database Foundation
-- Date: 2025-01-25
-- Description: Comprehensive schema for Atomic CRM with opportunities
--              (not deals), full product catalog, multi-principal support,
--              and activities system
-- =====================================================

-- =====================================================
-- ENUM TYPES
-- =====================================================

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

-- Opportunity stages
CREATE TYPE opportunity_stage AS ENUM (
    'lead',
    'qualified',
    'needs_analysis',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
    'nurturing'
);

-- Opportunity status
CREATE TYPE opportunity_status AS ENUM (
    'active',
    'on_hold',
    'nurturing',
    'stalled',
    'expired'
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

-- Activity types
CREATE TYPE activity_type AS ENUM (
    'engagement',
    'interaction'
);

-- Priority levels
CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
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

-- Storage temperature requirements
CREATE TYPE storage_temperature AS ENUM (
    'frozen',
    'refrigerated',
    'cool',
    'room_temp',
    'no_requirement'
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

-- Pricing model types
CREATE TYPE pricing_model_type AS ENUM (
    'fixed',
    'tiered',
    'volume',
    'subscription',
    'custom'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Sales/Users table (links to auth.users)
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- Organizations table
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    organization_type organization_type DEFAULT 'customer',
    is_principal BOOLEAN DEFAULT false,
    is_distributor BOOLEAN DEFAULT false,
    parent_organization_id BIGINT REFERENCES organizations(id),
    segment TEXT DEFAULT 'Standard',
    priority VARCHAR(1) DEFAULT 'C' CHECK (priority IN ('A', 'B', 'C', 'D')),
    industry TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'USA',
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    linkedin_url TEXT,
    annual_revenue NUMERIC(15,2),
    employee_count INTEGER,
    founded_year INTEGER,
    notes TEXT,
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    import_session_id UUID,
    search_tsv tsvector
);

-- Contacts table
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email JSONB DEFAULT '[]'::jsonb,
    phone JSONB DEFAULT '[]'::jsonb,
    title TEXT,
    role contact_role,
    department TEXT,
    is_primary_contact BOOLEAN DEFAULT false,
    purchase_influence VARCHAR(10) DEFAULT 'Unknown'
        CHECK (purchase_influence IN ('High', 'Medium', 'Low', 'Unknown')),
    decision_authority VARCHAR(20) DEFAULT 'End User'
        CHECK (decision_authority IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper')),
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'USA',
    birthday DATE,
    linkedin_url TEXT,
    twitter_handle TEXT,
    notes TEXT,
    -- Note: Use contact_organizations junction table for many-to-many relationships
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    search_tsv tsvector
);

-- Opportunities table (not deals!)
CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    stage opportunity_stage DEFAULT 'lead',
    status opportunity_status DEFAULT 'active',
    priority priority_level DEFAULT 'medium',
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    amount NUMERIC(12,2),
    category TEXT,
    index INTEGER,
    estimated_close_date DATE,
    actual_close_date DATE,
    customer_organization_id BIGINT REFERENCES organizations(id),
    principal_organization_id BIGINT REFERENCES organizations(id),
    distributor_organization_id BIGINT REFERENCES organizations(id),
    founding_interaction_id BIGINT,
    stage_manual BOOLEAN DEFAULT false,
    status_manual BOOLEAN DEFAULT false,
    next_action TEXT,
    next_action_date DATE,
    competition TEXT,
    decision_criteria TEXT,
    contact_ids BIGINT[] DEFAULT '{}',
    -- Note: Use contact_organizations junction table for many-to-many relationships
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    search_tsv tsvector
);

-- Tags table
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT 'blue-500',
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    reminder_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    priority priority_level DEFAULT 'medium',
    contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id BIGINT REFERENCES organizations(id),
    opportunity_id BIGINT REFERENCES opportunities(id),
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Contact Notes
CREATE TABLE "contactNotes" (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    attachments TEXT[],
    sales_id BIGINT REFERENCES sales(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity Notes (not dealNotes!)
CREATE TABLE "opportunityNotes" (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    attachments TEXT[],
    sales_id BIGINT REFERENCES sales(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RELATIONSHIP TABLES
-- =====================================================

-- Contact-Organization many-to-many relationships
CREATE TABLE contact_organizations (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    is_primary_decision_maker BOOLEAN DEFAULT false,
    is_primary_contact BOOLEAN DEFAULT false,
    role contact_role,
    purchase_influence SMALLINT CHECK (purchase_influence BETWEEN 0 AND 100),
    decision_authority SMALLINT CHECK (decision_authority BETWEEN 0 AND 100),
    relationship_start_date DATE DEFAULT CURRENT_DATE,
    relationship_end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT valid_relationship_dates
        CHECK (relationship_end_date IS NULL OR relationship_end_date > relationship_start_date),
    CONSTRAINT unique_contact_organization_active
        EXCLUDE (contact_id WITH =, organization_id WITH =)
        WHERE (deleted_at IS NULL)
);

-- Contact preferred principals tracking
CREATE TABLE contact_preferred_principals (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    principal_organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    advocacy_strength SMALLINT DEFAULT 50 CHECK (advocacy_strength BETWEEN 0 AND 100),
    last_interaction_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_contact_principal_active
        UNIQUE(contact_id, principal_organization_id, deleted_at)
);

-- Opportunity participants (multi-principal support)
CREATE TABLE opportunity_participants (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'principal', 'distributor', 'partner', 'competitor')),
    is_primary BOOLEAN DEFAULT false,
    commission_rate NUMERIC(5,4) CHECK (commission_rate >= 0 AND commission_rate <= 1),
    territory TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ
);

-- =====================================================
-- ACTIVITIES SYSTEM
-- =====================================================

-- Activities table (engagements and interactions)
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    activity_type activity_type NOT NULL,
    type interaction_type NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    activity_date TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER,
    contact_id BIGINT REFERENCES contacts(id),
    organization_id BIGINT REFERENCES organizations(id),
    opportunity_id BIGINT REFERENCES opportunities(id),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    outcome TEXT,
    sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    attachments TEXT[],
    location TEXT,
    attendees TEXT[],
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT check_interaction_has_opportunity
        CHECK (
            (activity_type = 'interaction' AND opportunity_id IS NOT NULL) OR
            (activity_type = 'engagement')
        ),
    CONSTRAINT check_has_contact_or_org
        CHECK (contact_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- Interaction participants
CREATE TABLE interaction_participants (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    contact_id BIGINT REFERENCES contacts(id),
    organization_id BIGINT REFERENCES organizations(id),
    role VARCHAR(20) DEFAULT 'participant',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT has_contact_or_org CHECK (contact_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- =====================================================
-- PRODUCT CATALOG SYSTEM
-- =====================================================

-- Products table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    principal_id BIGINT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT NOT NULL,
    upc TEXT,
    category product_category NOT NULL,
    subcategory TEXT,
    brand TEXT,
    unit_of_measure unit_of_measure DEFAULT 'each',
    units_per_case INTEGER,
    cases_per_pallet INTEGER,
    weight_per_unit NUMERIC(10,3),
    dimensions JSONB,
    cost_per_unit NUMERIC(12,2),
    list_price NUMERIC(12,2),
    map_price NUMERIC(12,2),
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    lead_time_days INTEGER,
    status product_status DEFAULT 'active',
    storage_temperature storage_temperature DEFAULT 'room_temp',
    shelf_life_days INTEGER,
    expiration_date_required BOOLEAN DEFAULT false,
    lot_tracking_required BOOLEAN DEFAULT false,
    is_seasonal BOOLEAN DEFAULT false,
    season_start_month INTEGER CHECK (season_start_month BETWEEN 1 AND 12),
    season_end_month INTEGER CHECK (season_end_month BETWEEN 1 AND 12),
    specifications JSONB,
    certifications TEXT[],
    allergens TEXT[],
    ingredients TEXT,
    nutritional_info JSONB,
    image_urls TEXT[],
    marketing_description TEXT,
    features TEXT[],
    benefits TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    updated_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    search_tsv tsvector,
    CONSTRAINT unique_sku_per_principal
        UNIQUE (principal_id, sku, deleted_at),
    CONSTRAINT positive_prices
        CHECK (cost_per_unit >= 0 AND list_price >= 0),
    CONSTRAINT valid_seasonality
        CHECK (
            (is_seasonal = false) OR
            (is_seasonal = true AND season_start_month IS NOT NULL AND season_end_month IS NOT NULL)
        )
);

-- Product category hierarchy
CREATE TABLE product_category_hierarchy (
    id BIGSERIAL PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    parent_category_id BIGINT REFERENCES product_category_hierarchy(id),
    category_path TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    icon TEXT,
    description TEXT,
    attributes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product pricing tiers
CREATE TABLE product_pricing_tiers (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tier_name TEXT,
    min_quantity INTEGER NOT NULL,
    max_quantity INTEGER,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2),
    discount_amount NUMERIC(12,2),
    effective_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    CONSTRAINT positive_quantities
        CHECK (min_quantity > 0 AND (max_quantity IS NULL OR max_quantity >= min_quantity)),
    CONSTRAINT positive_price
        CHECK (unit_price > 0),
    CONSTRAINT valid_discount
        CHECK (discount_percent BETWEEN 0 AND 100)
);

-- Product distributor authorizations
CREATE TABLE product_distributor_authorizations (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    distributor_id BIGINT NOT NULL REFERENCES organizations(id),
    is_authorized BOOLEAN DEFAULT true,
    authorization_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    special_pricing JSONB,
    territory_restrictions TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    CONSTRAINT unique_product_distributor
        UNIQUE (product_id, distributor_id)
);

-- Product inventory tracking
CREATE TABLE product_inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_location TEXT,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_committed INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    last_restock_date DATE,
    next_restock_date DATE,
    lot_numbers JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT non_negative_inventory
        CHECK (quantity_on_hand >= 0 AND quantity_committed >= 0)
);

-- Product pricing models
CREATE TABLE product_pricing_models (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    model_type pricing_model_type DEFAULT 'fixed',
    base_price NUMERIC(12,2),
    min_price NUMERIC(12,2),
    max_price NUMERIC(12,2),
    pricing_rules JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id)
);

-- Product features
CREATE TABLE product_features (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_value TEXT,
    display_order INTEGER DEFAULT 0,
    is_highlighted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity products (line items)
CREATE TABLE opportunity_products (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    product_id BIGINT,
    product_id_reference BIGINT REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_category TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(12,2),
    extended_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percent NUMERIC(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    final_price NUMERIC(12,2) GENERATED ALWAYS AS
        (quantity * unit_price * (1 - discount_percent/100)) STORED,
    price_tier_id BIGINT REFERENCES product_pricing_tiers(id),
    cost_per_unit NUMERIC(12,2),
    margin_percent NUMERIC(5,2),
    total_weight NUMERIC(12,3),
    special_pricing_applied BOOLEAN DEFAULT false,
    pricing_notes TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id)
);

-- =====================================================
-- MIGRATION TRACKING
-- =====================================================

CREATE TABLE migration_history (
    id BIGSERIAL PRIMARY KEY,
    phase_number TEXT NOT NULL,
    phase_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    rollback_sql TEXT,
    rows_affected BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Companies indexes
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_organization_type ON organizations(organization_type);
CREATE INDEX idx_organizations_parent_company_id ON organizations(parent_company_id) WHERE parent_company_id IS NOT NULL;
CREATE INDEX idx_organizations_is_principal ON organizations(is_principal) WHERE is_principal = true;
CREATE INDEX idx_organizations_is_distributor ON organizations(is_distributor) WHERE is_distributor = true;
CREATE INDEX idx_organizations_segment ON organizations(segment);
CREATE INDEX idx_organizations_priority ON organizations(priority);
CREATE INDEX idx_organizations_sales_id ON organizations(sales_id);

-- Contacts indexes
CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_is_primary ON contacts(is_primary_contact) WHERE is_primary_contact = true AND deleted_at IS NULL;
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_sales_id ON contacts(sales_id);
CREATE INDEX idx_contacts_role ON contacts(role);
CREATE INDEX idx_contacts_purchase_influence ON contacts(purchase_influence);

-- Opportunities indexes
CREATE INDEX idx_opportunities_stage ON opportunities(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_status ON opportunities(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_customer_org ON opportunities(customer_organization_id);
CREATE INDEX idx_opportunities_principal_org ON opportunities(principal_organization_id) WHERE principal_organization_id IS NOT NULL;
CREATE INDEX idx_opportunities_deleted_at ON opportunities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_priority ON opportunities(priority);
CREATE INDEX idx_opportunities_probability ON opportunities(probability);
CREATE INDEX idx_opportunities_estimated_close ON opportunities(estimated_close_date);
CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX idx_opportunities_sales_id ON opportunities(sales_id);

-- Contact organizations indexes
CREATE INDEX idx_contact_organizations_contact ON contact_organizations(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_organizations_organization ON contact_organizations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_organizations_primary ON contact_organizations(organization_id, is_primary) WHERE deleted_at IS NULL AND is_primary = true;
CREATE INDEX idx_contact_organizations_roles ON contact_organizations(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_organizations_decision_makers ON contact_organizations(organization_id, is_primary_decision_maker) WHERE deleted_at IS NULL AND is_primary_decision_maker = true;

-- Contact preferred principals indexes
CREATE INDEX idx_contact_preferred_principals_contact ON contact_preferred_principals(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_preferred_principals_principal ON contact_preferred_principals(principal_organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_preferred_principals_strength ON contact_preferred_principals(advocacy_strength) WHERE deleted_at IS NULL;

-- Opportunity participants indexes
CREATE INDEX idx_opportunity_participants_opp_id ON opportunity_participants(opportunity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunity_participants_org_id ON opportunity_participants(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunity_participants_role ON opportunity_participants(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunity_participants_primary ON opportunity_participants(opportunity_id, role) WHERE is_primary = true AND deleted_at IS NULL;

-- Activities indexes
CREATE INDEX idx_activities_type ON activities(activity_type, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_date ON activities(activity_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_contact ON activities(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_organization ON activities(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_opportunity ON activities(opportunity_id) WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;
CREATE INDEX idx_activities_follow_up ON activities(follow_up_date) WHERE follow_up_required = true AND deleted_at IS NULL;

-- Interaction participants indexes
CREATE INDEX idx_interaction_participants_activity ON interaction_participants(activity_id);
CREATE INDEX idx_interaction_participants_contact ON interaction_participants(contact_id);
CREATE INDEX idx_interaction_participants_organization ON interaction_participants(organization_id);

-- Products indexes
CREATE INDEX idx_products_principal_id ON products(principal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_upc ON products(upc) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_seasonal ON products(is_seasonal, season_start_month, season_end_month) WHERE is_seasonal = true AND deleted_at IS NULL;

-- Product pricing tiers indexes
CREATE INDEX idx_pricing_tiers_product_id ON product_pricing_tiers(product_id);
CREATE INDEX idx_pricing_tiers_quantity ON product_pricing_tiers(product_id, min_quantity, max_quantity);
CREATE INDEX idx_pricing_tiers_effective ON product_pricing_tiers(effective_date, expiration_date);

-- Product distributor authorizations indexes
CREATE INDEX idx_product_auth_product_id ON product_distributor_authorizations(product_id);
CREATE INDEX idx_product_auth_distributor_id ON product_distributor_authorizations(distributor_id);
CREATE INDEX idx_product_auth_active ON product_distributor_authorizations(is_authorized) WHERE is_authorized = true;

-- Product inventory indexes
CREATE INDEX idx_inventory_product_id ON product_inventory(product_id);
CREATE INDEX idx_inventory_available ON product_inventory(quantity_available);
CREATE INDEX idx_inventory_reorder ON product_inventory(product_id) WHERE quantity_available <= reorder_point;

-- Opportunity products indexes
CREATE INDEX idx_opportunity_products_opp_id ON opportunity_products(opportunity_id);
CREATE INDEX idx_opportunity_products_product_id ON opportunity_products(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_opportunity_products_product_ref ON opportunity_products(product_id_reference) WHERE product_id_reference IS NOT NULL;

-- Notes indexes
CREATE INDEX idx_contact_notes_contact_id ON "contactNotes"(contact_id);
CREATE INDEX idx_opportunity_notes_opportunity_id ON "opportunityNotes"(opportunity_id);

-- Tasks indexes
CREATE INDEX idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX idx_tasks_company_id ON tasks(company_id);
CREATE INDEX idx_tasks_opportunity_id ON tasks(opportunity_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE completed = false;
CREATE INDEX idx_tasks_reminder_date ON tasks(reminder_date) WHERE completed = false;

-- Full-text search indexes (GIN)
CREATE INDEX idx_organizations_search_tsv ON organizations USING GIN(search_tsv);
CREATE INDEX idx_contacts_search_tsv ON contacts USING GIN(search_tsv);
CREATE INDEX idx_opportunities_search_tsv ON opportunities USING GIN(search_tsv);
CREATE INDEX idx_products_search_tsv ON products USING GIN(search_tsv);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_search_tsv()
RETURNS trigger AS $$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.industry, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.address, '') || ' ' ||
            COALESCE(NEW.city, '') || ' ' ||
            COALESCE(NEW.state, '')
        );
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.last_name, '') || ' ' ||
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.department, '') || ' ' ||
            COALESCE(NEW.email::text, '') || ' ' ||
            COALESCE(NEW.phone::text, '')
        );
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.next_action, '') || ' ' ||
            COALESCE(NEW.category, '')
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.sku, '') || ' ' ||
            COALESCE(NEW.upc, '') || ' ' ||
            COALESCE(NEW.brand, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.subcategory, '') || ' ' ||
            COALESCE(array_to_string(NEW.certifications, ' '), '')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
CREATE TRIGGER trigger_update_organizations_search_tsv
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

CREATE TRIGGER trigger_update_contacts_search_tsv
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

CREATE TRIGGER trigger_update_opportunities_search_tsv
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

CREATE TRIGGER trigger_update_products_search_tsv
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

-- Function to auto-calculate probability based on stage
CREATE OR REPLACE FUNCTION calculate_opportunity_probability()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM NEW.stage) AND NOT NEW.stage_manual THEN
        NEW.probability := CASE NEW.stage
            WHEN 'lead' THEN 10
            WHEN 'qualified' THEN 25
            WHEN 'needs_analysis' THEN 40
            WHEN 'proposal' THEN 60
            WHEN 'negotiation' THEN 80
            WHEN 'closed_won' THEN 100
            WHEN 'closed_lost' THEN 0
            WHEN 'nurturing' THEN 15
        END;
    END IF;

    IF NEW.stage IN ('closed_won', 'closed_lost') AND NEW.actual_close_date IS NULL THEN
        NEW.actual_close_date := CURRENT_DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_opportunity_probability
    BEFORE INSERT OR UPDATE OF stage ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION calculate_opportunity_probability();

-- Function to validate principal organization
CREATE OR REPLACE FUNCTION validate_principal_organization()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM organizations
        WHERE id = NEW.principal_organization_id
        AND is_principal = true
    ) THEN
        RAISE EXCEPTION 'Organization % is not marked as principal', NEW.principal_organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_principal_organization_trigger
    BEFORE INSERT OR UPDATE ON contact_preferred_principals
    FOR EACH ROW
    EXECUTE FUNCTION validate_principal_organization();

-- Function to sync primary organization
CREATE OR REPLACE FUNCTION sync_primary_organization()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE contacts
        SET company_id = NEW.organization_id
        WHERE id = NEW.contact_id;

        UPDATE contact_organizations
        SET is_primary = false
        WHERE contact_id = NEW.contact_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_primary_organization
    AFTER INSERT OR UPDATE ON contact_organizations
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION sync_primary_organization();

-- Function to validate opportunity participants
CREATE OR REPLACE FUNCTION validate_opportunity_participants()
RETURNS trigger AS $$
DECLARE
    v_org_type organization_type;
    v_is_principal BOOLEAN;
    v_is_distributor BOOLEAN;
    v_primary_count INTEGER;
BEGIN
    SELECT organization_type, is_principal, is_distributor
    INTO v_org_type, v_is_principal, v_is_distributor
    FROM organizations
    WHERE id = NEW.organization_id;

    IF NEW.role = 'principal' AND NOT v_is_principal THEN
        RAISE EXCEPTION 'Organization % is not marked as a principal', NEW.organization_id;
    END IF;

    IF NEW.role = 'distributor' AND NOT v_is_distributor THEN
        RAISE EXCEPTION 'Organization % is not marked as a distributor', NEW.organization_id;
    END IF;

    IF NEW.is_primary THEN
        SELECT COUNT(*) INTO v_primary_count
        FROM opportunity_participants
        WHERE opportunity_id = NEW.opportunity_id
          AND role = NEW.role
          AND is_primary = true
          AND deleted_at IS NULL
          AND id != COALESCE(NEW.id, -1);

        IF v_primary_count > 0 THEN
            UPDATE opportunity_participants
            SET is_primary = false,
                updated_at = NOW()
            WHERE opportunity_id = NEW.opportunity_id
              AND role = NEW.role
              AND is_primary = true
              AND id != COALESCE(NEW.id, -1)
              AND deleted_at IS NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_opportunity_participants
    BEFORE INSERT OR UPDATE ON opportunity_participants
    FOR EACH ROW
    EXECUTE FUNCTION validate_opportunity_participants();

-- Function to validate activity consistency
CREATE OR REPLACE FUNCTION validate_activity_consistency()
RETURNS trigger AS $$
DECLARE
    v_opp_customer_id BIGINT;
    v_contact_org_id BIGINT;
BEGIN
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        SELECT op.organization_id INTO v_opp_customer_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = NEW.opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        IF NEW.contact_id IS NOT NULL THEN
            SELECT organization_id INTO v_contact_org_id
            FROM contact_organizations
            WHERE contact_id = NEW.contact_id
              AND organization_id = v_opp_customer_id
              AND deleted_at IS NULL
            LIMIT 1;

            IF v_contact_org_id IS NULL THEN
                RAISE WARNING 'Contact % is not associated with opportunity customer organization %',
                              NEW.contact_id, v_opp_customer_id;
            END IF;
        END IF;

        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;

    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_activity_consistency
    BEFORE INSERT OR UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION validate_activity_consistency();

-- Function to validate pricing tiers
CREATE OR REPLACE FUNCTION validate_pricing_tiers()
RETURNS trigger AS $$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_overlap_count
    FROM product_pricing_tiers
    WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, -1)
    AND (
        (NEW.min_quantity BETWEEN min_quantity AND COALESCE(max_quantity, 999999)) OR
        (COALESCE(NEW.max_quantity, 999999) BETWEEN min_quantity AND COALESCE(max_quantity, 999999)) OR
        (min_quantity BETWEEN NEW.min_quantity AND COALESCE(NEW.max_quantity, 999999))
    )
    AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Pricing tier quantities overlap with existing tiers';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_pricing_tiers
    BEFORE INSERT OR UPDATE ON product_pricing_tiers
    FOR EACH ROW
    EXECUTE FUNCTION validate_pricing_tiers();

-- Auth trigger functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.sales (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_update_user()
RETURNS trigger AS $$
BEGIN
    UPDATE public.sales
    SET email = NEW.email,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get contact organizations
CREATE OR REPLACE FUNCTION get_contact_organizations(p_contact_id BIGINT)
RETURNS TABLE (
    organization_id BIGINT,
    organization_name TEXT,
    role contact_role,
    is_primary BOOLEAN,
    is_primary_decision_maker BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.organization_id,
        c.name,
        co.role,
        co.is_primary,
        co.is_primary_decision_maker
    FROM contact_organizations co
    JOIN organizations c ON c.id = co.organization_id
    WHERE co.contact_id = p_contact_id
    AND co.deleted_at IS NULL
    AND c.deleted_at IS NULL
    ORDER BY co.is_primary DESC, c.name;
END;
$$ LANGUAGE plpgsql;

-- Get organization contacts
CREATE OR REPLACE FUNCTION get_organization_contacts(p_organization_id BIGINT)
RETURNS TABLE (
    contact_id BIGINT,
    contact_name TEXT,
    role contact_role,
    is_primary_decision_maker BOOLEAN,
    purchase_influence SMALLINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.contact_id,
        c.name AS contact_name,
        co.role,
        co.is_primary_decision_maker,
        co.purchase_influence
    FROM contact_organizations co
    JOIN contacts c ON c.id = co.contact_id
    WHERE co.organization_id = p_organization_id
    AND co.deleted_at IS NULL
    ORDER BY co.is_primary_decision_maker DESC, co.purchase_influence DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Create opportunity with participants
CREATE OR REPLACE FUNCTION create_opportunity_with_participants(
    p_opportunity_data JSONB,
    p_participants JSONB[]
)
RETURNS BIGINT AS $$
DECLARE
    v_opportunity_id BIGINT;
    v_participant JSONB;
    v_customer_count INTEGER := 0;
    v_principal_count INTEGER := 0;
BEGIN
    FOREACH v_participant IN ARRAY p_participants
    LOOP
        IF v_participant->>'role' = 'customer' THEN
            v_customer_count := v_customer_count + 1;
        ELSIF v_participant->>'role' = 'principal' THEN
            v_principal_count := v_principal_count + 1;
        END IF;
    END LOOP;

    IF v_customer_count = 0 THEN
        RAISE EXCEPTION 'Opportunity must have at least one customer participant';
    END IF;

    INSERT INTO opportunities (
        name,
        description,
        stage,
        status,
        priority,
        amount,
        estimated_close_date,
        sales_id,
        created_at,
        updated_at
    )
    VALUES (
        p_opportunity_data->>'name',
        p_opportunity_data->>'description',
        COALESCE((p_opportunity_data->>'stage')::opportunity_stage, 'lead'),
        COALESCE((p_opportunity_data->>'status')::opportunity_status, 'active'),
        COALESCE((p_opportunity_data->>'priority')::priority_level, 'medium'),
        (p_opportunity_data->>'amount')::NUMERIC,
        (p_opportunity_data->>'estimated_close_date')::DATE,
        (p_opportunity_data->>'sales_id')::BIGINT,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_opportunity_id;

    FOREACH v_participant IN ARRAY p_participants
    LOOP
        INSERT INTO opportunity_participants (
            opportunity_id,
            organization_id,
            role,
            is_primary,
            commission_rate,
            territory,
            notes,
            created_by
        )
        VALUES (
            v_opportunity_id,
            (v_participant->>'organization_id')::BIGINT,
            v_participant->>'role',
            COALESCE((v_participant->>'is_primary')::BOOLEAN, false),
            (v_participant->>'commission_rate')::NUMERIC,
            v_participant->>'territory',
            v_participant->>'notes',
            (v_participant->>'created_by')::BIGINT
        );
    END LOOP;

    RETURN v_opportunity_id;
END;
$$ LANGUAGE plpgsql;

-- Log engagement
CREATE OR REPLACE FUNCTION log_engagement(
    p_type interaction_type,
    p_subject TEXT,
    p_description TEXT DEFAULT NULL,
    p_contact_id BIGINT DEFAULT NULL,
    p_organization_id BIGINT DEFAULT NULL,
    p_activity_date TIMESTAMPTZ DEFAULT NOW(),
    p_duration_minutes INTEGER DEFAULT NULL,
    p_follow_up_required BOOLEAN DEFAULT false,
    p_follow_up_date DATE DEFAULT NULL,
    p_outcome TEXT DEFAULT NULL,
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_activity_id BIGINT;
BEGIN
    IF p_contact_id IS NULL AND p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Engagement must have either a contact or organization';
    END IF;

    IF p_contact_id IS NOT NULL AND p_organization_id IS NULL THEN
        SELECT organization_id INTO p_organization_id
        FROM contact_organizations
        WHERE contact_id = p_contact_id
          AND is_primary_contact = true
          AND deleted_at IS NULL
        LIMIT 1;
    END IF;

    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        follow_up_required,
        follow_up_date,
        outcome,
        created_by
    )
    VALUES (
        'engagement',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Log interaction
CREATE OR REPLACE FUNCTION log_interaction(
    p_opportunity_id BIGINT,
    p_type interaction_type,
    p_subject TEXT,
    p_description TEXT DEFAULT NULL,
    p_contact_id BIGINT DEFAULT NULL,
    p_organization_id BIGINT DEFAULT NULL,
    p_activity_date TIMESTAMPTZ DEFAULT NOW(),
    p_duration_minutes INTEGER DEFAULT NULL,
    p_follow_up_required BOOLEAN DEFAULT false,
    p_follow_up_date DATE DEFAULT NULL,
    p_outcome TEXT DEFAULT NULL,
    p_sentiment VARCHAR DEFAULT NULL,
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_activity_id BIGINT;
    v_customer_org_id BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = p_opportunity_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Opportunity % does not exist or is deleted', p_opportunity_id;
    END IF;

    IF p_organization_id IS NULL THEN
        SELECT op.organization_id INTO v_customer_org_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = p_opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        p_organization_id := v_customer_org_id;
    END IF;

    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        opportunity_id,
        follow_up_required,
        follow_up_date,
        outcome,
        sentiment,
        created_by
    )
    VALUES (
        'interaction',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_opportunity_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_sentiment,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    UPDATE opportunities
    SET updated_at = NOW()
    WHERE id = p_opportunity_id;

    IF p_sentiment = 'positive' AND p_contact_id IS NOT NULL THEN
        UPDATE contact_preferred_principals
        SET last_interaction_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE contact_id = p_contact_id
          AND principal_organization_id IN (
              SELECT organization_id
              FROM opportunity_participants
              WHERE opportunity_id = p_opportunity_id
                AND role = 'principal'
                AND deleted_at IS NULL
          )
          AND deleted_at IS NULL;
    END IF;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate product price
CREATE OR REPLACE FUNCTION calculate_product_price(
    p_product_id BIGINT,
    p_quantity INTEGER,
    p_distributor_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    unit_price NUMERIC,
    total_price NUMERIC,
    discount_applied NUMERIC,
    tier_name TEXT,
    special_pricing BOOLEAN
) AS $$
DECLARE
    v_base_price NUMERIC;
    v_tier_price NUMERIC;
    v_tier_name TEXT;
    v_tier_discount NUMERIC;
    v_special_price NUMERIC;
    v_final_unit_price NUMERIC;
BEGIN
    SELECT list_price INTO v_base_price
    FROM products
    WHERE id = p_product_id;

    IF p_distributor_id IS NOT NULL THEN
        SELECT (special_pricing->>'unit_price')::NUMERIC INTO v_special_price
        FROM product_distributor_authorizations
        WHERE product_id = p_product_id
        AND distributor_id = p_distributor_id
        AND is_authorized = true
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);
    END IF;

    SELECT
        ppt.unit_price,
        ppt.tier_name,
        ppt.discount_percent
    INTO v_tier_price, v_tier_name, v_tier_discount
    FROM product_pricing_tiers ppt
    WHERE ppt.product_id = p_product_id
    AND p_quantity >= ppt.min_quantity
    AND (ppt.max_quantity IS NULL OR p_quantity <= ppt.max_quantity)
    AND (ppt.expiration_date IS NULL OR ppt.expiration_date >= CURRENT_DATE)
    ORDER BY ppt.min_quantity DESC
    LIMIT 1;

    v_final_unit_price := COALESCE(v_special_price, v_tier_price, v_base_price);

    RETURN QUERY
    SELECT
        v_final_unit_price AS unit_price,
        v_final_unit_price * p_quantity AS total_price,
        COALESCE(v_tier_discount, 0) AS discount_applied,
        COALESCE(v_tier_name, 'Standard') AS tier_name,
        v_special_price IS NOT NULL AS special_pricing;
END;
$$ LANGUAGE plpgsql;

-- Check product availability
CREATE OR REPLACE FUNCTION check_product_availability(
    p_product_id BIGINT,
    p_quantity INTEGER,
    p_needed_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    is_available BOOLEAN,
    quantity_available INTEGER,
    can_fulfill_by DATE,
    availability_notes TEXT
) AS $$
DECLARE
    v_quantity_available INTEGER;
    v_lead_time INTEGER;
    v_is_seasonal BOOLEAN;
    v_in_season BOOLEAN;
    v_status product_status;
BEGIN
    SELECT
        COALESCE(pi.quantity_available, 0),
        p.lead_time_days,
        p.is_seasonal,
        CASE
            WHEN p.is_seasonal = false THEN true
            WHEN EXTRACT(MONTH FROM p_needed_date)::INTEGER BETWEEN
                p.season_start_month AND p.season_end_month THEN true
            ELSE false
        END,
        p.status
    INTO v_quantity_available, v_lead_time, v_is_seasonal, v_in_season, v_status
    FROM products p
    LEFT JOIN product_inventory pi ON p.id = pi.product_id
    WHERE p.id = p_product_id;

    RETURN QUERY
    SELECT
        v_quantity_available >= p_quantity AND v_in_season AND v_status = 'active' AS is_available,
        v_quantity_available AS quantity_available,
        CASE
            WHEN v_quantity_available >= p_quantity THEN p_needed_date
            ELSE p_needed_date + INTERVAL '1 day' * COALESCE(v_lead_time, 7)
        END::DATE AS can_fulfill_by,
        CASE
            WHEN v_status != 'active' THEN 'Product is ' || v_status
            WHEN NOT v_in_season THEN 'Product is out of season'
            WHEN v_quantity_available < p_quantity THEN
                'Insufficient inventory. ' || v_quantity_available || ' available, ' ||
                p_quantity || ' requested'
            ELSE 'Available'
        END AS availability_notes;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- Companies summary
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
    c.*,
    COUNT(DISTINCT con.id) AS contact_count,
    COUNT(DISTINCT o.id) AS opportunity_count,
    COUNT(DISTINCT o.id) FILTER (WHERE o.stage = 'closed_won') AS won_opportunities,
    SUM(o.amount) FILTER (WHERE o.stage = 'closed_won') AS total_revenue
FROM organizations c
LEFT JOIN contacts con ON c.id = con.company_id AND con.deleted_at IS NULL
LEFT JOIN opportunities o ON c.id = o.company_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- Contacts summary
CREATE OR REPLACE VIEW contacts_summary AS
SELECT
    c.*,
    comp.name AS company_name,
    COUNT(DISTINCT t.id) FILTER (WHERE t.completed = false) AS open_tasks,
    COUNT(DISTINCT cn.id) AS note_count,
    COUNT(DISTINCT co.organization_id) AS organization_count
FROM contacts c
LEFT JOIN organizations comp ON co.organization_id = comp.id AND co.is_primary = true
LEFT JOIN tasks t ON c.id = t.contact_id AND t.archived_at IS NULL
LEFT JOIN "contactNotes" cn ON c.id = cn.contact_id
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, comp.name;

-- Opportunities summary
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
    o.*,
    c.name as company_name,
    c.industry as company_industry,
    CASE
        WHEN o.stage IN ('closed_won', 'closed_lost') THEN true
        ELSE false
    END AS is_closed,
    CASE
        WHEN o.stage = 'closed_won' THEN true
        ELSE false
    END AS is_won,
    COUNT(DISTINCT op.organization_id) FILTER (WHERE op.role = 'principal') AS principal_count,
    COUNT(DISTINCT op.organization_id) AS participant_count
FROM opportunities o
LEFT JOIN organizations c ON o.customer_organization_id = c.id
LEFT JOIN opportunity_participants op ON o.id = op.opportunity_id AND op.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, c.name, c.industry;

-- Opportunities with participants
CREATE OR REPLACE VIEW opportunities_with_participants AS
SELECT
    o.*,
    (SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'type', c.organization_type
    )
    FROM opportunity_participants op
    JOIN organizations c ON op.organization_id = c.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'customer'
      AND op.is_primary = true
      AND op.deleted_at IS NULL
    LIMIT 1) AS primary_customer,
    (SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'is_primary', op.is_primary
        )
        ORDER BY op.is_primary DESC, c.name
    )
    FROM opportunity_participants op
    JOIN organizations c ON op.organization_id = c.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'principal'
      AND op.deleted_at IS NULL
    ) AS principals,
    (SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'is_primary', op.is_primary,
            'commission_rate', op.commission_rate
        )
        ORDER BY op.is_primary DESC, c.name
    )
    FROM opportunity_participants op
    JOIN organizations c ON op.organization_id = c.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'distributor'
      AND op.deleted_at IS NULL
    ) AS distributors,
    (SELECT COUNT(DISTINCT op.organization_id)
    FROM opportunity_participants op
    WHERE op.opportunity_id = o.id
      AND op.deleted_at IS NULL
    ) AS participant_count,
    (SELECT COUNT(*)
    FROM opportunity_participants op
    WHERE op.opportunity_id = o.id
      AND op.role = 'principal'
      AND op.deleted_at IS NULL
    ) AS principal_count
FROM opportunities o
WHERE o.deleted_at IS NULL;

-- Contact influence profile
CREATE OR REPLACE VIEW contact_influence_profile AS
SELECT
    c.id as contact_id,
    c.name as contact_name,
    COUNT(DISTINCT co.organization_id) as org_count,
    COUNT(DISTINCT co.organization_id) FILTER (WHERE co.is_primary_decision_maker = true) as decision_maker_count,
    AVG(co.purchase_influence) as avg_purchase_influence,
    AVG(co.decision_authority) as avg_decision_authority,
    ARRAY_AGG(DISTINCT comp.name ORDER BY comp.name) as organizations,
    ARRAY_AGG(DISTINCT co.role::text) as roles
FROM contacts c
LEFT JOIN contact_organizations co ON co.contact_id = c.id AND co.deleted_at IS NULL
LEFT JOIN organizations comp ON comp.id = co.organization_id AND comp.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name;

-- Principal advocacy dashboard
CREATE OR REPLACE VIEW principal_advocacy_dashboard AS
SELECT
    p.id as principal_id,
    p.name as principal_name,
    COUNT(DISTINCT cpp.contact_id) as advocate_count,
    AVG(cpp.advocacy_strength) as avg_advocacy_strength,
    COUNT(DISTINCT co.organization_id) as reach_org_count
FROM organizations p
LEFT JOIN contact_preferred_principals cpp ON cpp.principal_organization_id = p.id AND cpp.deleted_at IS NULL
LEFT JOIN contact_organizations co ON co.contact_id = cpp.contact_id AND co.deleted_at IS NULL
WHERE p.is_principal = true
AND p.deleted_at IS NULL
GROUP BY p.id, p.name;

-- Engagement analytics
CREATE OR REPLACE VIEW engagement_analytics AS
SELECT
    DATE_TRUNC('month', activity_date) AS month,
    type AS engagement_type,
    COUNT(*) AS total_count,
    COUNT(DISTINCT contact_id) AS unique_contacts,
    COUNT(DISTINCT organization_id) AS unique_organizations,
    AVG(duration_minutes) AS avg_duration,
    SUM(CASE WHEN follow_up_required THEN 1 ELSE 0 END) AS follow_ups_required,
    SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_sentiment,
    SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_sentiment
FROM activities
WHERE activity_type = 'engagement'
  AND deleted_at IS NULL
GROUP BY DATE_TRUNC('month', activity_date), type;

-- Interaction analytics
CREATE OR REPLACE VIEW interaction_analytics AS
SELECT
    o.id AS opportunity_id,
    o.name AS opportunity_name,
    o.stage AS opportunity_stage,
    COUNT(a.id) AS total_interactions,
    MAX(a.activity_date) AS last_interaction,
    MIN(a.activity_date) AS first_interaction,
    COUNT(DISTINCT a.type) AS interaction_types_used,
    AVG(a.duration_minutes) AS avg_duration,
    SUM(CASE WHEN a.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_interactions,
    SUM(CASE WHEN a.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_interactions,
    EXTRACT(DAY FROM NOW() - MAX(a.activity_date)) AS days_since_last_interaction
FROM opportunities o
LEFT JOIN activities a ON o.id = a.opportunity_id
    AND a.activity_type = 'interaction'
    AND a.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.stage;

-- Contact engagement summary
CREATE OR REPLACE VIEW contact_engagement_summary AS
SELECT
    c.id AS contact_id,
    c.name AS contact_name,
    COUNT(DISTINCT a.id) AS total_activities,
    COUNT(DISTINCT CASE WHEN a.activity_type = 'engagement' THEN a.id END) AS engagements,
    COUNT(DISTINCT CASE WHEN a.activity_type = 'interaction' THEN a.id END) AS interactions,
    COUNT(DISTINCT a.opportunity_id) AS opportunities_touched,
    MAX(a.activity_date) AS last_activity,
    AVG(a.duration_minutes) AS avg_interaction_duration,
    STRING_AGG(DISTINCT a.type::TEXT, ', ') AS activity_types
FROM contacts c
LEFT JOIN activities a ON c.id = a.contact_id AND a.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name;

-- Product catalog
CREATE OR REPLACE VIEW product_catalog AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.category,
    p.status,
    c.name AS principal_name,
    p.list_price,
    p.cost_per_unit,
    p.list_price - p.cost_per_unit AS margin_amount,
    CASE
        WHEN p.cost_per_unit > 0 THEN
            ((p.list_price - p.cost_per_unit) / p.list_price * 100)::NUMERIC(5,2)
        ELSE 0
    END AS margin_percent,
    pi.quantity_available,
    p.is_seasonal,
    CASE
        WHEN p.is_seasonal = false THEN true
        WHEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER BETWEEN
            p.season_start_month AND p.season_end_month THEN true
        ELSE false
    END AS in_season,
    COUNT(DISTINCT ppt.id) AS pricing_tier_count,
    COUNT(DISTINCT pda.distributor_id) AS authorized_distributors
FROM products p
JOIN organizations c ON p.principal_id = c.id
LEFT JOIN product_inventory pi ON p.id = pi.product_id
LEFT JOIN product_pricing_tiers ppt ON p.id = ppt.product_id
LEFT JOIN product_distributor_authorizations pda ON p.id = pda.product_id AND pda.is_authorized = true
WHERE p.deleted_at IS NULL
GROUP BY p.id, c.name, pi.quantity_available;

-- Product performance
CREATE OR REPLACE VIEW product_performance AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    c.name AS principal_name,
    COUNT(DISTINCT op.opportunity_id) AS opportunity_count,
    SUM(op.quantity) AS total_quantity_quoted,
    SUM(op.final_price) AS total_revenue_potential,
    AVG(op.margin_percent) AS avg_margin_percent,
    COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage = 'closed_won') AS won_opportunities,
    SUM(op.final_price) FILTER (WHERE opp.stage = 'closed_won') AS actual_revenue
FROM products p
JOIN organizations c ON p.principal_id = c.id
LEFT JOIN opportunity_products op ON p.id = op.product_id_reference
LEFT JOIN opportunities opp ON op.opportunity_id = opp.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.category, c.name;

-- Backward compatibility view for opportunities
CREATE OR REPLACE VIEW opportunities_legacy AS
SELECT
    o.*,
    (SELECT op.organization_id
     FROM opportunity_participants op
     WHERE op.opportunity_id = o.id
       AND op.role = 'customer'
       AND op.is_primary = true
       AND op.deleted_at IS NULL
     LIMIT 1) AS customer_organization_id_computed,
    (SELECT op.organization_id
     FROM opportunity_participants op
     WHERE op.opportunity_id = o.id
       AND op.role = 'principal'
       AND op.is_primary = true
       AND op.deleted_at IS NULL
     LIMIT 1) AS principal_organization_id_computed,
    (SELECT op.organization_id
     FROM opportunity_participants op
     WHERE op.opportunity_id = o.id
       AND op.role = 'distributor'
       AND op.is_primary = true
       AND op.deleted_at IS NULL
     LIMIT 1) AS distributor_organization_id_computed
FROM opportunities o;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contactNotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunityNotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_preferred_principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_distributor_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_history ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (authenticated users can access everything)
CREATE POLICY "Enable all access for authenticated users" ON sales
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON organizations
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON contacts
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON opportunities
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON tags
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON tasks
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON "contactNotes"
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON "opportunityNotes"
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON contact_organizations
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON contact_preferred_principals
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON opportunity_participants
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON activities
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON interaction_participants
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON products
    FOR ALL TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Enable read access for authenticated users" ON product_category_hierarchy
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON product_pricing_tiers
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON product_distributor_authorizations
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON product_inventory
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON product_pricing_models
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON product_features
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON opportunity_products
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON migration_history
    FOR ALL TO authenticated USING (true);

-- =====================================================
-- AUTH TRIGGERS
-- =====================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_update_user();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert base product categories
INSERT INTO product_category_hierarchy (category_name, level, display_order)
VALUES
    ('Beverages', 0, 1),
    ('Dairy', 0, 2),
    ('Frozen', 0, 3),
    ('Fresh Produce', 0, 4),
    ('Meat & Poultry', 0, 5),
    ('Seafood', 0, 6),
    ('Dry Goods', 0, 7),
    ('Snacks', 0, 8),
    ('Condiments', 0, 9),
    ('Baking Supplies', 0, 10),
    ('Spices & Seasonings', 0, 11),
    ('Canned Goods', 0, 12),
    ('Pasta & Grains', 0, 13),
    ('Oils & Vinegars', 0, 14),
    ('Sweeteners', 0, 15),
    ('Cleaning Supplies', 0, 16),
    ('Paper Products', 0, 17),
    ('Equipment', 0, 18),
    ('Other', 0, 19)
ON CONFLICT (category_name) DO NOTHING;

-- Initial migration history entry
INSERT INTO migration_history (phase_number, phase_name, status, completed_at)
VALUES ('Fresh Schema', 'Complete CRM Schema Creation', 'completed', NOW());

-- =====================================================
-- END OF FRESH CRM SCHEMA
-- =====================================================