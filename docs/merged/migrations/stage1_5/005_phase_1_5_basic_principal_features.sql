-- =====================================================
-- Stage 1.5 (MVP+1): Basic Principal Features
-- Migration: Simple Principal-Distributor Relationships & Products
-- Date: 2025-01-22
-- Description: Minimal additions for principal functionality
-- =====================================================

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('1.5', 'Basic Principal Features', 'in_progress', NOW());

-- =====================================================
-- SIMPLE PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,

    -- Principal ownership
    principal_id BIGINT NOT NULL REFERENCES companies(id),

    -- Basic product info
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    category TEXT,

    -- Simple pricing
    unit_price NUMERIC(12,2),
    unit_cost NUMERIC(12,2),

    -- Basic availability
    is_active BOOLEAN DEFAULT true,
    min_order_quantity INTEGER DEFAULT 1,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,

    -- Ensure unique SKU per principal
    CONSTRAINT unique_sku_per_principal
        UNIQUE (principal_id, sku)
        WHERE deleted_at IS NULL
);

-- Create indexes
CREATE INDEX idx_products_principal ON products(principal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category) WHERE deleted_at IS NULL;

-- =====================================================
-- SIMPLE PRINCIPAL-DISTRIBUTOR RELATIONSHIPS
-- =====================================================

CREATE TABLE IF NOT EXISTS principal_distributor_relationships (
    id BIGSERIAL PRIMARY KEY,

    -- The relationship
    principal_id BIGINT NOT NULL REFERENCES companies(id),
    distributor_id BIGINT NOT NULL REFERENCES companies(id),

    -- Basic contract info
    relationship_status TEXT DEFAULT 'active'
        CHECK (relationship_status IN ('active', 'pending', 'terminated')),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,

    -- Simple commission (flat rate)
    commission_percent NUMERIC(5,2)
        CHECK (commission_percent >= 0 AND commission_percent <= 100),

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,

    -- One active relationship per principal-distributor pair
    CONSTRAINT unique_principal_distributor_active
        UNIQUE (principal_id, distributor_id)
        WHERE deleted_at IS NULL AND relationship_status = 'active',

    -- Validate principal flag
    CONSTRAINT must_be_principal
        CHECK (EXISTS (
            SELECT 1 FROM companies
            WHERE id = principal_id AND is_principal = true
        )),

    -- Validate distributor flag
    CONSTRAINT must_be_distributor
        CHECK (EXISTS (
            SELECT 1 FROM companies
            WHERE id = distributor_id AND is_distributor = true
        ))
);

-- Create indexes
CREATE INDEX idx_pd_relationships_principal ON principal_distributor_relationships(principal_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_pd_relationships_distributor ON principal_distributor_relationships(distributor_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_pd_relationships_active ON principal_distributor_relationships(principal_id, distributor_id)
    WHERE relationship_status = 'active' AND deleted_at IS NULL;

-- =====================================================
-- LINK EXISTING OPPORTUNITY_PRODUCTS TO PRODUCTS
-- =====================================================

-- Update the opportunity_products table to properly reference products
ALTER TABLE opportunity_products
ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id);

-- =====================================================
-- SIMPLE HELPER FUNCTIONS
-- =====================================================

-- Function to get distributor's authorized products
CREATE OR REPLACE FUNCTION get_distributor_products(
    p_distributor_id BIGINT
)
RETURNS TABLE (
    product_id BIGINT,
    product_name TEXT,
    sku TEXT,
    category TEXT,
    unit_price NUMERIC,
    principal_id BIGINT,
    principal_name TEXT,
    commission_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        p.category,
        p.unit_price,
        p.principal_id,
        prin.name AS principal_name,
        pdr.commission_percent
    FROM products p
    JOIN companies prin ON p.principal_id = prin.id
    JOIN principal_distributor_relationships pdr
        ON pdr.principal_id = p.principal_id
        AND pdr.distributor_id = p_distributor_id
    WHERE p.is_active = true
        AND p.deleted_at IS NULL
        AND pdr.relationship_status = 'active'
        AND pdr.deleted_at IS NULL
        AND prin.deleted_at IS NULL
    ORDER BY prin.name, p.category, p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get principal's distributors
CREATE OR REPLACE FUNCTION get_principal_distributors(
    p_principal_id BIGINT
)
RETURNS TABLE (
    distributor_id BIGINT,
    distributor_name TEXT,
    relationship_status TEXT,
    commission_percent NUMERIC,
    start_date DATE,
    opportunity_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pdr.distributor_id,
        d.name AS distributor_name,
        pdr.relationship_status,
        pdr.commission_percent,
        pdr.start_date,
        COUNT(DISTINCT op.opportunity_id) AS opportunity_count
    FROM principal_distributor_relationships pdr
    JOIN companies d ON pdr.distributor_id = d.id
    LEFT JOIN opportunity_participants op
        ON op.organization_id = pdr.distributor_id
        AND op.role = 'distributor'
    WHERE pdr.principal_id = p_principal_id
        AND pdr.deleted_at IS NULL
        AND d.deleted_at IS NULL
    GROUP BY pdr.distributor_id, d.name, pdr.relationship_status,
             pdr.commission_percent, pdr.start_date
    ORDER BY pdr.relationship_status, d.name;
END;
$$ LANGUAGE plpgsql;

-- Simple function to add a product
CREATE OR REPLACE FUNCTION add_product(
    p_principal_id BIGINT,
    p_name TEXT,
    p_sku TEXT,
    p_category TEXT DEFAULT NULL,
    p_unit_price NUMERIC DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_product_id BIGINT;
    v_is_principal BOOLEAN;
BEGIN
    -- Verify the company is a principal
    SELECT is_principal INTO v_is_principal
    FROM companies
    WHERE id = p_principal_id;

    IF NOT COALESCE(v_is_principal, false) THEN
        RAISE EXCEPTION 'Company % is not marked as a principal', p_principal_id;
    END IF;

    -- Insert the product
    INSERT INTO products (
        principal_id,
        name,
        sku,
        category,
        unit_price,
        description,
        created_by
    )
    VALUES (
        p_principal_id,
        p_name,
        p_sku,
        p_category,
        p_unit_price,
        p_description,
        p_created_by
    )
    RETURNING id INTO v_product_id;

    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SIMPLE VIEWS
-- =====================================================

-- View showing principal product counts
CREATE OR REPLACE VIEW principal_product_summary AS
SELECT
    c.id AS principal_id,
    c.name AS principal_name,
    COUNT(DISTINCT p.id) AS product_count,
    COUNT(DISTINCT p.id) FILTER (WHERE p.is_active) AS active_product_count,
    COUNT(DISTINCT p.category) AS category_count,
    COUNT(DISTINCT pdr.distributor_id) AS distributor_count,
    AVG(pdr.commission_percent) AS avg_commission_percent
FROM companies c
LEFT JOIN products p ON c.id = p.principal_id AND p.deleted_at IS NULL
LEFT JOIN principal_distributor_relationships pdr
    ON c.id = pdr.principal_id
    AND pdr.relationship_status = 'active'
    AND pdr.deleted_at IS NULL
WHERE c.is_principal = true
    AND c.deleted_at IS NULL
GROUP BY c.id, c.name;

-- View showing distributor relationships
CREATE OR REPLACE VIEW distributor_relationship_summary AS
SELECT
    d.id AS distributor_id,
    d.name AS distributor_name,
    COUNT(DISTINCT pdr.principal_id) AS principal_count,
    COUNT(DISTINCT p.id) AS available_products,
    AVG(pdr.commission_percent) AS avg_commission,
    STRING_AGG(DISTINCT prin.name, ', ' ORDER BY prin.name) AS principal_names
FROM companies d
LEFT JOIN principal_distributor_relationships pdr
    ON d.id = pdr.distributor_id
    AND pdr.relationship_status = 'active'
    AND pdr.deleted_at IS NULL
LEFT JOIN companies prin
    ON pdr.principal_id = prin.id
    AND prin.deleted_at IS NULL
LEFT JOIN products p
    ON prin.id = p.principal_id
    AND p.is_active = true
    AND p.deleted_at IS NULL
WHERE d.is_distributor = true
    AND d.deleted_at IS NULL
GROUP BY d.id, d.name;

-- =====================================================
-- POPULATE RELATIONSHIPS FROM EXISTING DATA
-- =====================================================

-- Create principal-distributor relationships from opportunity participants
INSERT INTO principal_distributor_relationships (
    principal_id,
    distributor_id,
    relationship_status,
    commission_percent,
    notes,
    created_by
)
SELECT DISTINCT
    prin_part.organization_id AS principal_id,
    dist_part.organization_id AS distributor_id,
    'active' AS relationship_status,
    15.0 AS commission_percent, -- Default 15%
    'Auto-created from opportunity participants' AS notes,
    o.created_by
FROM opportunities o
JOIN opportunity_participants prin_part
    ON o.id = prin_part.opportunity_id
    AND prin_part.role = 'principal'
JOIN opportunity_participants dist_part
    ON o.id = dist_part.opportunity_id
    AND dist_part.role = 'distributor'
JOIN companies prin
    ON prin_part.organization_id = prin.id
    AND prin.is_principal = true
JOIN companies dist
    ON dist_part.organization_id = dist.id
    AND dist.is_distributor = true
WHERE NOT EXISTS (
    SELECT 1
    FROM principal_distributor_relationships pdr
    WHERE pdr.principal_id = prin_part.organization_id
    AND pdr.distributor_id = dist_part.organization_id
    AND pdr.deleted_at IS NULL
)
AND o.deleted_at IS NULL
AND prin_part.deleted_at IS NULL
AND dist_part.deleted_at IS NULL;

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE principal_distributor_relationships ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Enable all access for authenticated users" ON products
    FOR ALL TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON principal_distributor_relationships
    FOR ALL TO authenticated
    USING (deleted_at IS NULL);

-- =====================================================
-- VALIDATION
-- =====================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_view_count INTEGER;
    v_relationship_count INTEGER;
BEGIN
    -- Check tables created
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_name IN ('products', 'principal_distributor_relationships')
    AND table_schema = 'public';

    IF v_table_count < 2 THEN
        RAISE EXCEPTION 'Not all tables were created successfully';
    END IF;

    -- Check functions created
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_name IN ('get_distributor_products',
                          'get_principal_distributors',
                          'add_product')
    AND routine_schema = 'public';

    IF v_function_count < 3 THEN
        RAISE WARNING 'Some functions may not have been created';
    END IF;

    -- Check views created
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_name IN ('principal_product_summary',
                        'distributor_relationship_summary')
    AND table_schema = 'public';

    IF v_view_count < 2 THEN
        RAISE WARNING 'Some views may not have been created';
    END IF;

    -- Check auto-created relationships
    SELECT COUNT(*) INTO v_relationship_count
    FROM principal_distributor_relationships
    WHERE notes LIKE 'Auto-created%';

    RAISE NOTICE 'Phase 1.5 validation passed. Created % auto-generated relationships',
                 v_relationship_count;
END $$;

-- Record migration completion
UPDATE migration_history
SET status = 'completed',
    completed_at = NOW()
WHERE phase_number = '1.5'
AND status = 'in_progress';

-- =====================================================
-- END OF PHASE 1.5 - BASIC PRINCIPAL FEATURES
-- =====================================================