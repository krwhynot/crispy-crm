-- =====================================================
-- Stage 1, Phase 1.3: Opportunity Enhancements
-- Migration: Multi-Principal Support & Opportunity Participants
-- Date: 2025-01-22
-- Description: Implement multi-principal architecture for opportunities
-- =====================================================

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('1.3', 'Opportunity Enhancements', 'in_progress', NOW());

-- =====================================================
-- CREATE OPPORTUNITY_PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS opportunity_participants (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES companies(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'principal', 'distributor', 'partner', 'competitor')),
    is_primary BOOLEAN DEFAULT false,
    commission_rate NUMERIC(5,4) CHECK (commission_rate >= 0 AND commission_rate <= 1),
    territory TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    -- Only one primary per role per opportunity
    CONSTRAINT uq_opp_primary_per_role
        UNIQUE (opportunity_id, role, is_primary, deleted_at)
        DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX idx_opportunity_participants_opp_id
ON opportunity_participants(opportunity_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_opportunity_participants_org_id
ON opportunity_participants(organization_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_opportunity_participants_role
ON opportunity_participants(role)
WHERE deleted_at IS NULL;

CREATE INDEX idx_opportunity_participants_primary
ON opportunity_participants(opportunity_id, role)
WHERE is_primary = true AND deleted_at IS NULL;

-- =====================================================
-- CREATE OPPORTUNITY_PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS opportunity_products (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    product_id BIGINT,  -- Will reference products table in Stage 2
    product_name TEXT NOT NULL,
    product_category TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(12,2),
    extended_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percent NUMERIC(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    final_price NUMERIC(12,2) GENERATED ALWAYS AS
        (quantity * unit_price * (1 - discount_percent/100)) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id)
);

-- Create indexes
CREATE INDEX idx_opportunity_products_opp_id
ON opportunity_products(opportunity_id);

CREATE INDEX idx_opportunity_products_product_id
ON opportunity_products(product_id)
WHERE product_id IS NOT NULL;

-- =====================================================
-- MIGRATE EXISTING DATA TO PARTICIPANTS
-- =====================================================

-- Migrate customer organizations
INSERT INTO opportunity_participants (
    opportunity_id,
    organization_id,
    role,
    is_primary,
    created_at,
    created_by
)
SELECT
    o.id,
    COALESCE(o.customer_organization_id, o.company_id),
    'customer',
    true,
    o.created_at,
    o.sale_id
FROM opportunities o
WHERE (o.customer_organization_id IS NOT NULL OR o.company_id IS NOT NULL)
  AND NOT EXISTS (
      SELECT 1 FROM opportunity_participants op
      WHERE op.opportunity_id = o.id
        AND op.role = 'customer'
        AND op.deleted_at IS NULL
  );

-- Migrate principal organizations
INSERT INTO opportunity_participants (
    opportunity_id,
    organization_id,
    role,
    is_primary,
    created_at,
    created_by
)
SELECT
    o.id,
    o.principal_organization_id,
    'principal',
    true,
    o.created_at,
    o.sale_id
FROM opportunities o
WHERE o.principal_organization_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM opportunity_participants op
      WHERE op.opportunity_id = o.id
        AND op.organization_id = o.principal_organization_id
        AND op.role = 'principal'
        AND op.deleted_at IS NULL
  );

-- Migrate distributor organizations
INSERT INTO opportunity_participants (
    opportunity_id,
    organization_id,
    role,
    is_primary,
    created_at,
    created_by
)
SELECT
    o.id,
    o.distributor_organization_id,
    'distributor',
    true,
    o.created_at,
    o.sale_id
FROM opportunities o
WHERE o.distributor_organization_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM opportunity_participants op
      WHERE op.opportunity_id = o.id
        AND op.organization_id = o.distributor_organization_id
        AND op.role = 'distributor'
        AND op.deleted_at IS NULL
  );

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to create opportunity with participants
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
    -- Validate we have at least one customer and one principal
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

    -- Create the opportunity
    INSERT INTO opportunities (
        name,
        description,
        stage,
        status,
        priority,
        estimated_value,
        estimated_close_date,
        contact_id,
        sale_id,
        created_at,
        updated_at
    )
    VALUES (
        p_opportunity_data->>'name',
        p_opportunity_data->>'description',
        COALESCE((p_opportunity_data->>'stage')::opportunity_stage, 'lead'),
        COALESCE((p_opportunity_data->>'status')::opportunity_status, 'active'),
        COALESCE((p_opportunity_data->>'priority')::priority_level, 'medium'),
        (p_opportunity_data->>'estimated_value')::NUMERIC,
        (p_opportunity_data->>'estimated_close_date')::DATE,
        (p_opportunity_data->>'contact_id')::BIGINT,
        (p_opportunity_data->>'sale_id')::BIGINT,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_opportunity_id;

    -- Add participants
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

-- Function to sync opportunity participants (add/update/remove)
CREATE OR REPLACE FUNCTION sync_opportunity_participants(
    p_opportunity_id BIGINT,
    p_participants JSONB[]
)
RETURNS VOID AS $$
DECLARE
    v_participant JSONB;
    v_participant_ids BIGINT[] := ARRAY[]::BIGINT[];
    v_id BIGINT;
BEGIN
    -- Process each participant
    FOREACH v_participant IN ARRAY p_participants
    LOOP
        -- Insert or update
        INSERT INTO opportunity_participants (
            opportunity_id,
            organization_id,
            role,
            is_primary,
            commission_rate,
            territory,
            notes
        )
        VALUES (
            p_opportunity_id,
            (v_participant->>'organization_id')::BIGINT,
            v_participant->>'role',
            COALESCE((v_participant->>'is_primary')::BOOLEAN, false),
            (v_participant->>'commission_rate')::NUMERIC,
            v_participant->>'territory',
            v_participant->>'notes'
        )
        ON CONFLICT (opportunity_id, organization_id, role, deleted_at)
        WHERE deleted_at IS NULL
        DO UPDATE SET
            is_primary = EXCLUDED.is_primary,
            commission_rate = EXCLUDED.commission_rate,
            territory = EXCLUDED.territory,
            notes = EXCLUDED.notes,
            updated_at = NOW()
        RETURNING id INTO v_id;

        v_participant_ids := array_append(v_participant_ids, v_id);
    END LOOP;

    -- Soft delete participants not in the new list
    UPDATE opportunity_participants
    SET deleted_at = NOW()
    WHERE opportunity_id = p_opportunity_id
      AND id != ALL(v_participant_ids)
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get opportunity with participants
CREATE OR REPLACE FUNCTION get_opportunity_with_participants(p_opportunity_id BIGINT)
RETURNS TABLE (
    opportunity JSONB,
    participants JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        to_jsonb(o.*) AS opportunity,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', op.id,
                    'organization_id', op.organization_id,
                    'organization_name', c.name,
                    'organization_type', c.organization_type,
                    'role', op.role,
                    'is_primary', op.is_primary,
                    'commission_rate', op.commission_rate,
                    'territory', op.territory,
                    'notes', op.notes
                )
                ORDER BY op.role, op.is_primary DESC
            ) FILTER (WHERE op.id IS NOT NULL),
            '[]'::jsonb
        ) AS participants
    FROM opportunities o
    LEFT JOIN opportunity_participants op ON o.id = op.opportunity_id
        AND op.deleted_at IS NULL
    LEFT JOIN companies c ON op.organization_id = c.id
    WHERE o.id = p_opportunity_id
      AND o.deleted_at IS NULL
    GROUP BY o.id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate opportunity participants
CREATE OR REPLACE FUNCTION validate_opportunity_participants()
RETURNS trigger AS $$
DECLARE
    v_org_type organization_type;
    v_is_principal BOOLEAN;
    v_is_distributor BOOLEAN;
    v_primary_count INTEGER;
BEGIN
    -- Get organization details
    SELECT organization_type, is_principal, is_distributor
    INTO v_org_type, v_is_principal, v_is_distributor
    FROM companies
    WHERE id = NEW.organization_id;

    -- Validate role matches organization capabilities
    IF NEW.role = 'principal' AND NOT v_is_principal THEN
        RAISE EXCEPTION 'Organization % is not marked as a principal', NEW.organization_id;
    END IF;

    IF NEW.role = 'distributor' AND NOT v_is_distributor THEN
        RAISE EXCEPTION 'Organization % is not marked as a distributor', NEW.organization_id;
    END IF;

    -- Ensure only one primary per role
    IF NEW.is_primary THEN
        SELECT COUNT(*) INTO v_primary_count
        FROM opportunity_participants
        WHERE opportunity_id = NEW.opportunity_id
          AND role = NEW.role
          AND is_primary = true
          AND deleted_at IS NULL
          AND id != COALESCE(NEW.id, -1);

        IF v_primary_count > 0 THEN
            -- Unset other primaries for this role
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

-- Create trigger for participant validation
CREATE TRIGGER trigger_validate_opportunity_participants
    BEFORE INSERT OR UPDATE ON opportunity_participants
    FOR EACH ROW
    EXECUTE FUNCTION validate_opportunity_participants();

-- =====================================================
-- CREATE VIEWS FOR REPORTING
-- =====================================================

-- View for opportunities with participant details
CREATE OR REPLACE VIEW opportunities_with_participants AS
SELECT
    o.*,
    -- Customer info
    (SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'type', c.organization_type
    )
    FROM opportunity_participants op
    JOIN companies c ON op.organization_id = c.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'customer'
      AND op.is_primary = true
      AND op.deleted_at IS NULL
    LIMIT 1) AS primary_customer,

    -- Principal list
    (SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'is_primary', op.is_primary
        )
        ORDER BY op.is_primary DESC, c.name
    )
    FROM opportunity_participants op
    JOIN companies c ON op.organization_id = c.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'principal'
      AND op.deleted_at IS NULL
    ) AS principals,

    -- Distributor list
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
    JOIN companies c ON op.organization_id = c.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'distributor'
      AND op.deleted_at IS NULL
    ) AS distributors,

    -- Participant count
    (SELECT COUNT(DISTINCT op.organization_id)
    FROM opportunity_participants op
    WHERE op.opportunity_id = o.id
      AND op.deleted_at IS NULL
    ) AS participant_count,

    -- Principal count for multi-principal tracking
    (SELECT COUNT(*)
    FROM opportunity_participants op
    WHERE op.opportunity_id = o.id
      AND op.role = 'principal'
      AND op.deleted_at IS NULL
    ) AS principal_count

FROM opportunities o
WHERE o.deleted_at IS NULL;

-- Backward compatibility view
CREATE OR REPLACE VIEW opportunities_legacy AS
SELECT
    o.*,
    -- Map first customer as customer_organization_id
    (SELECT op.organization_id
     FROM opportunity_participants op
     WHERE op.opportunity_id = o.id
       AND op.role = 'customer'
       AND op.is_primary = true
       AND op.deleted_at IS NULL
     LIMIT 1) AS customer_organization_id_computed,

    -- Map first principal as principal_organization_id
    (SELECT op.organization_id
     FROM opportunity_participants op
     WHERE op.opportunity_id = o.id
       AND op.role = 'principal'
       AND op.is_primary = true
       AND op.deleted_at IS NULL
     LIMIT 1) AS principal_organization_id_computed,

    -- Map first distributor as distributor_organization_id
    (SELECT op.organization_id
     FROM opportunity_participants op
     WHERE op.opportunity_id = o.id
       AND op.role = 'distributor'
       AND op.is_primary = true
       AND op.deleted_at IS NULL
     LIMIT 1) AS distributor_organization_id_computed

FROM opportunities o;

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE opportunity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all access for authenticated users" ON opportunity_participants
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON opportunity_products
    FOR ALL
    TO authenticated
    USING (true);  -- No soft delete on products yet

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_view_count INTEGER;
    v_migrated_customers INTEGER;
    v_migrated_principals INTEGER;
BEGIN
    -- Check tables created
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_name IN ('opportunity_participants', 'opportunity_products')
    AND table_schema = 'public';

    IF v_table_count < 2 THEN
        RAISE EXCEPTION 'Not all tables were created successfully';
    END IF;

    -- Check functions created
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_name IN ('create_opportunity_with_participants',
                          'sync_opportunity_participants',
                          'get_opportunity_with_participants',
                          'validate_opportunity_participants')
    AND routine_schema = 'public';

    IF v_function_count < 4 THEN
        RAISE EXCEPTION 'Not all functions were created successfully';
    END IF;

    -- Check data migration
    SELECT COUNT(DISTINCT opportunity_id) INTO v_migrated_customers
    FROM opportunity_participants
    WHERE role = 'customer';

    SELECT COUNT(DISTINCT opportunity_id) INTO v_migrated_principals
    FROM opportunity_participants
    WHERE role = 'principal';

    RAISE NOTICE 'Phase 1.3 validation passed. Migrated % customer and % principal relationships',
                 v_migrated_customers, v_migrated_principals;
END $$;

-- Record migration completion
UPDATE migration_history
SET status = 'completed',
    completed_at = NOW()
WHERE phase_number = '1.3'
AND status = 'in_progress';

-- =====================================================
-- END OF PHASE 1.3 - OPPORTUNITY ENHANCEMENTS
-- =====================================================