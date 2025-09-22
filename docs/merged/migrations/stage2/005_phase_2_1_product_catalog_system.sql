-- =====================================================
-- Stage 2, Phase 2.1: Product Catalog System
-- Migration: Complete Product Management for Principals
-- Date: 2025-01-22
-- Description: Implement comprehensive product catalog with categories,
--              pricing tiers, seasonality, and specifications
-- =====================================================

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('2.1', 'Product Catalog System', 'in_progress', NOW());

-- =====================================================
-- ENUM TYPES FOR PRODUCTS
-- =====================================================

-- Product categories specific to food brokerage
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

-- Temperature requirements
CREATE TYPE storage_temperature AS ENUM (
    'frozen',        -- Below 0°F
    'refrigerated',  -- 33-40°F
    'cool',         -- 50-60°F
    'room_temp',    -- 60-75°F
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

-- =====================================================
-- PRODUCTS TABLE (ENHANCED)
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,

    -- Principal ownership
    principal_id BIGINT NOT NULL REFERENCES companies(id),

    -- Basic product information
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT NOT NULL,
    upc TEXT,
    category product_category NOT NULL,
    subcategory TEXT,
    brand TEXT,

    -- Physical specifications
    unit_of_measure unit_of_measure DEFAULT 'each',
    units_per_case INTEGER,
    cases_per_pallet INTEGER,
    weight_per_unit NUMERIC(10,3), -- in pounds
    dimensions JSONB, -- {length, width, height, unit}

    -- Pricing
    cost_per_unit NUMERIC(12,2),
    list_price NUMERIC(12,2),
    map_price NUMERIC(12,2), -- Minimum Advertised Price

    -- Inventory and availability
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    lead_time_days INTEGER,
    status product_status DEFAULT 'active',

    -- Storage and handling
    storage_temperature storage_temperature DEFAULT 'room_temp',
    shelf_life_days INTEGER,
    expiration_date_required BOOLEAN DEFAULT false,
    lot_tracking_required BOOLEAN DEFAULT false,

    -- Seasonality
    is_seasonal BOOLEAN DEFAULT false,
    season_start_month INTEGER CHECK (season_start_month BETWEEN 1 AND 12),
    season_end_month INTEGER CHECK (season_end_month BETWEEN 1 AND 12),

    -- Additional specifications
    specifications JSONB, -- Flexible attributes
    certifications TEXT[], -- Organic, Non-GMO, Kosher, etc.
    allergens TEXT[],
    ingredients TEXT,
    nutritional_info JSONB,

    -- Marketing
    image_urls TEXT[],
    marketing_description TEXT,
    features TEXT[],
    benefits TEXT[],

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    updated_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    search_tsv tsvector,

    -- Constraints
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

-- Create indexes for performance
CREATE INDEX idx_products_principal_id ON products(principal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_upc ON products(upc) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_seasonal ON products(is_seasonal, season_start_month, season_end_month)
    WHERE is_seasonal = true AND deleted_at IS NULL;
CREATE INDEX idx_products_search_tsv ON products USING GIN(search_tsv);

-- =====================================================
-- PRODUCT CATEGORIES HIERARCHY
-- =====================================================

CREATE TABLE IF NOT EXISTS product_category_hierarchy (
    id BIGSERIAL PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    parent_category_id BIGINT REFERENCES product_category_hierarchy(id),
    category_path TEXT, -- Materialized path for easy querying
    level INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    icon TEXT,
    description TEXT,
    attributes JSONB, -- Category-specific attributes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert base categories matching the enum
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
    ('Baking Supplies', 0, 10)
ON CONFLICT (category_name) DO NOTHING;

-- =====================================================
-- PRODUCT PRICING TIERS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_pricing_tiers (
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

    -- Constraints
    CONSTRAINT positive_quantities
        CHECK (min_quantity > 0 AND (max_quantity IS NULL OR max_quantity >= min_quantity)),
    CONSTRAINT positive_price
        CHECK (unit_price > 0),
    CONSTRAINT valid_discount
        CHECK (discount_percent BETWEEN 0 AND 100)
);

-- Create indexes
CREATE INDEX idx_pricing_tiers_product_id ON product_pricing_tiers(product_id);
CREATE INDEX idx_pricing_tiers_quantity ON product_pricing_tiers(product_id, min_quantity, max_quantity);
CREATE INDEX idx_pricing_tiers_effective ON product_pricing_tiers(effective_date, expiration_date);

-- =====================================================
-- PRODUCT DISTRIBUTOR AUTHORIZATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_distributor_authorizations (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    distributor_id BIGINT NOT NULL REFERENCES companies(id),
    is_authorized BOOLEAN DEFAULT true,
    authorization_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    special_pricing JSONB, -- Override pricing for this distributor
    territory_restrictions TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),

    -- Unique authorization per product-distributor
    CONSTRAINT unique_product_distributor
        UNIQUE (product_id, distributor_id)
);

-- Create indexes
CREATE INDEX idx_product_auth_product_id ON product_distributor_authorizations(product_id);
CREATE INDEX idx_product_auth_distributor_id ON product_distributor_authorizations(distributor_id);
CREATE INDEX idx_product_auth_active ON product_distributor_authorizations(is_authorized)
    WHERE is_authorized = true;

-- =====================================================
-- PRODUCT INVENTORY TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS product_inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_location TEXT,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_committed INTEGER DEFAULT 0, -- Allocated to orders
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    last_restock_date DATE,
    next_restock_date DATE,
    lot_numbers JSONB, -- Array of {lot_number, quantity, expiration_date}
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT non_negative_inventory
        CHECK (quantity_on_hand >= 0 AND quantity_committed >= 0)
);

-- Create indexes
CREATE INDEX idx_inventory_product_id ON product_inventory(product_id);
CREATE INDEX idx_inventory_available ON product_inventory(quantity_available);
CREATE INDEX idx_inventory_reorder ON product_inventory(product_id)
    WHERE quantity_available <= reorder_point;

-- =====================================================
-- ENHANCE OPPORTUNITY_PRODUCTS TABLE
-- =====================================================

-- Add product reference and pricing details
ALTER TABLE opportunity_products
ADD COLUMN IF NOT EXISTS product_id_reference BIGINT REFERENCES products(id),
ADD COLUMN IF NOT EXISTS price_tier_id BIGINT REFERENCES product_pricing_tiers(id),
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS total_weight NUMERIC(12,3),
ADD COLUMN IF NOT EXISTS special_pricing_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pricing_notes TEXT;

-- Update foreign key to reference products table
UPDATE opportunity_products op
SET product_id_reference = p.id
FROM products p
WHERE p.principal_id IN (
    SELECT organization_id
    FROM opportunity_participants
    WHERE opportunity_id = op.opportunity_id
    AND role = 'principal'
)
AND p.name = op.product_name
AND p.deleted_at IS NULL;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate product price based on quantity
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
    -- Get base price
    SELECT list_price INTO v_base_price
    FROM products
    WHERE id = p_product_id;

    -- Check for distributor special pricing
    IF p_distributor_id IS NOT NULL THEN
        SELECT (special_pricing->>'unit_price')::NUMERIC INTO v_special_price
        FROM product_distributor_authorizations
        WHERE product_id = p_product_id
        AND distributor_id = p_distributor_id
        AND is_authorized = true
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);
    END IF;

    -- Get applicable pricing tier
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

    -- Determine final price
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

-- Function to get products by principal with availability
CREATE OR REPLACE FUNCTION get_principal_products(
    p_principal_id BIGINT,
    p_include_discontinued BOOLEAN DEFAULT false,
    p_distributor_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    product_id BIGINT,
    product_name TEXT,
    sku TEXT,
    category product_category,
    status product_status,
    list_price NUMERIC,
    quantity_available INTEGER,
    is_authorized BOOLEAN,
    is_seasonal BOOLEAN,
    in_season BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        p.category,
        p.status,
        p.list_price,
        COALESCE(pi.quantity_available, 0) AS quantity_available,
        CASE
            WHEN p_distributor_id IS NULL THEN true
            ELSE COALESCE(pda.is_authorized, false)
        END AS is_authorized,
        p.is_seasonal,
        CASE
            WHEN p.is_seasonal = false THEN true
            WHEN EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER BETWEEN
                p.season_start_month AND p.season_end_month THEN true
            ELSE false
        END AS in_season
    FROM products p
    LEFT JOIN product_inventory pi ON p.id = pi.product_id
    LEFT JOIN product_distributor_authorizations pda
        ON p.id = pda.product_id AND pda.distributor_id = p_distributor_id
    WHERE p.principal_id = p_principal_id
    AND p.deleted_at IS NULL
    AND (p_include_discontinued OR p.status != 'discontinued')
    ORDER BY p.category, p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to check product availability
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
    -- Get product details
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

    -- Determine availability
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
-- TRIGGERS
-- =====================================================

-- Trigger to update product search vector
CREATE OR REPLACE FUNCTION update_product_search_tsv()
RETURNS trigger AS $$
BEGIN
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_search_tsv
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_search_tsv();

-- Trigger to validate pricing tiers don't overlap
CREATE OR REPLACE FUNCTION validate_pricing_tiers()
RETURNS trigger AS $$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    -- Check for overlapping quantity ranges
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

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View for product catalog with current pricing
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
JOIN companies c ON p.principal_id = c.id
LEFT JOIN product_inventory pi ON p.id = pi.product_id
LEFT JOIN product_pricing_tiers ppt ON p.id = ppt.product_id
LEFT JOIN product_distributor_authorizations pda ON p.id = pda.product_id AND pda.is_authorized = true
WHERE p.deleted_at IS NULL
GROUP BY p.id, c.name, pi.quantity_available;

-- View for product performance
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
JOIN companies c ON p.principal_id = c.id
LEFT JOIN opportunity_products op ON p.id = op.product_id_reference
LEFT JOIN opportunities opp ON op.opportunity_id = opp.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.category, c.name;

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_distributor_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (all authenticated users can access)
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

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Sample product categories with hierarchy
INSERT INTO product_category_hierarchy (category_name, parent_category_id, level, category_path)
SELECT 'Soft Drinks', id, 1, 'Beverages/Soft Drinks' FROM product_category_hierarchy WHERE category_name = 'Beverages'
UNION ALL
SELECT 'Juices', id, 1, 'Beverages/Juices' FROM product_category_hierarchy WHERE category_name = 'Beverages'
UNION ALL
SELECT 'Cheese', id, 1, 'Dairy/Cheese' FROM product_category_hierarchy WHERE category_name = 'Dairy'
UNION ALL
SELECT 'Milk', id, 1, 'Dairy/Milk' FROM product_category_hierarchy WHERE category_name = 'Dairy'
ON CONFLICT (category_name) DO NOTHING;

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_enum_count INTEGER;
    v_function_count INTEGER;
    v_view_count INTEGER;
BEGIN
    -- Check tables created
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_name IN ('products', 'product_category_hierarchy',
                        'product_pricing_tiers', 'product_distributor_authorizations',
                        'product_inventory')
    AND table_schema = 'public';

    IF v_table_count < 5 THEN
        RAISE EXCEPTION 'Not all product tables were created successfully';
    END IF;

    -- Check enums created
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type
    WHERE typname IN ('product_category', 'storage_temperature',
                     'product_status', 'unit_of_measure')
    AND typtype = 'e';

    IF v_enum_count < 4 THEN
        RAISE EXCEPTION 'Not all product enums were created successfully';
    END IF;

    -- Check functions created
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_name IN ('calculate_product_price', 'get_principal_products',
                          'check_product_availability')
    AND routine_schema = 'public';

    IF v_function_count < 3 THEN
        RAISE WARNING 'Some product functions may not have been created';
    END IF;

    -- Check views created
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_name IN ('product_catalog', 'product_performance')
    AND table_schema = 'public';

    IF v_view_count < 2 THEN
        RAISE WARNING 'Some product views may not have been created';
    END IF;

    RAISE NOTICE 'Phase 2.1 validation passed. Product catalog system created successfully';
END $$;

-- Record migration completion
UPDATE migration_history
SET status = 'completed',
    completed_at = NOW()
WHERE phase_number = '2.1'
AND status = 'in_progress';

-- =====================================================
-- END OF PHASE 2.1 - PRODUCT CATALOG SYSTEM
-- =====================================================