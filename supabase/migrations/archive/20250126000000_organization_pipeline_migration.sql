-- =====================================================
-- Organization & Pipeline Migration
-- Date: 2025-01-26
-- Description: Comprehensive migration to rename companies→organizations
--              and update opportunity_stage enum to 8-stage food service workflow
-- Migration includes: table rename, FK updates, view recreation, function updates
-- =====================================================

-- =====================================================
-- PHASE 1: DROP DEPENDENT OBJECTS IN REVERSE ORDER
-- =====================================================

-- Drop all dependent views (8 views total)
DROP VIEW IF EXISTS companies_summary CASCADE;
DROP VIEW IF EXISTS opportunities_summary CASCADE;
DROP VIEW IF EXISTS opportunities_with_participants CASCADE;
DROP VIEW IF EXISTS contacts_summary CASCADE;
DROP VIEW IF EXISTS contact_influence_profile CASCADE;
DROP VIEW IF EXISTS principal_advocacy_dashboard CASCADE;
DROP VIEW IF EXISTS product_catalog CASCADE;
DROP VIEW IF EXISTS product_performance CASCADE;

-- Drop indexes on foreign key columns that reference companies
DROP INDEX IF EXISTS idx_contacts_company_id;
DROP INDEX IF EXISTS idx_opportunities_company_id;
DROP INDEX IF EXISTS idx_tasks_company_id;

-- Drop RLS policy on companies table
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON companies;

-- Drop trigger for companies search vector
DROP TRIGGER IF EXISTS trigger_update_companies_search_tsv ON companies;

-- =====================================================
-- PHASE 2: RENAME COMPANIES TABLE TO ORGANIZATIONS
-- =====================================================

-- Rename the main table
ALTER TABLE companies RENAME TO organizations;

-- =====================================================
-- PHASE 3: UPDATE OPPORTUNITY STAGE ENUM
-- =====================================================

-- Drop and recreate opportunity_stage enum with new food service stages
ALTER TYPE opportunity_stage RENAME TO opportunity_stage_old;

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

-- Update opportunities table to use new enum
ALTER TABLE opportunities ALTER COLUMN stage DROP DEFAULT;
ALTER TABLE opportunities ALTER COLUMN stage TYPE opportunity_stage USING (
    CASE stage::text
        WHEN 'lead' THEN 'new_lead'::opportunity_stage
        WHEN 'qualified' THEN 'initial_outreach'::opportunity_stage
        WHEN 'needs_analysis' THEN 'sample_visit_offered'::opportunity_stage
        WHEN 'proposal' THEN 'awaiting_response'::opportunity_stage
        WHEN 'negotiation' THEN 'feedback_logged'::opportunity_stage
        WHEN 'nurturing' THEN 'demo_scheduled'::opportunity_stage
        WHEN 'closed_won' THEN 'closed_won'::opportunity_stage
        WHEN 'closed_lost' THEN 'closed_lost'::opportunity_stage
        ELSE 'new_lead'::opportunity_stage
    END
);
ALTER TABLE opportunities ALTER COLUMN stage SET DEFAULT 'new_lead'::opportunity_stage;

-- Drop old enum type
DROP TYPE opportunity_stage_old;

-- =====================================================
-- PHASE 4: UPDATE FOREIGN KEY CONSTRAINT NAMES
-- =====================================================

-- Update foreign key constraints to reference organizations
-- Self-referencing constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS companies_parent_company_id_fkey;
ALTER TABLE organizations ADD CONSTRAINT organizations_parent_organization_id_fkey
    FOREIGN KEY (parent_company_id) REFERENCES organizations(id);

-- Contacts table
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_company_id_fkey;
ALTER TABLE contacts ADD CONSTRAINT contacts_organization_id_fkey
    FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Opportunities table - multiple FK constraints
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_customer_organization_id_fkey;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_customer_organization_id_fkey
    FOREIGN KEY (customer_organization_id) REFERENCES organizations(id);

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_principal_organization_id_fkey;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_principal_organization_id_fkey
    FOREIGN KEY (principal_organization_id) REFERENCES organizations(id);

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_distributor_organization_id_fkey;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_distributor_organization_id_fkey
    FOREIGN KEY (distributor_organization_id) REFERENCES organizations(id);

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_company_id_fkey;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_organization_id_fkey
    FOREIGN KEY (company_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Contact organizations junction table
ALTER TABLE contact_organizations DROP CONSTRAINT IF EXISTS contact_organizations_organization_id_fkey;
ALTER TABLE contact_organizations ADD CONSTRAINT contact_organizations_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Contact preferred principals table
ALTER TABLE contact_preferred_principals DROP CONSTRAINT IF EXISTS contact_preferred_principals_principal_organization_id_fkey;
ALTER TABLE contact_preferred_principals ADD CONSTRAINT contact_preferred_principals_principal_organization_id_fkey
    FOREIGN KEY (principal_organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Opportunity participants table
ALTER TABLE opportunity_participants DROP CONSTRAINT IF EXISTS opportunity_participants_organization_id_fkey;
ALTER TABLE opportunity_participants ADD CONSTRAINT opportunity_participants_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Activities table
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_organization_id_fkey;
ALTER TABLE activities ADD CONSTRAINT activities_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Tasks table
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_company_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_organization_id_fkey
    FOREIGN KEY (company_id) REFERENCES organizations(id);

-- Products table
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_principal_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_principal_organization_id_fkey
    FOREIGN KEY (principal_id) REFERENCES organizations(id);

-- Product distributor authorizations table
ALTER TABLE product_distributor_authorizations DROP CONSTRAINT IF EXISTS product_distributor_authorizations_distributor_id_fkey;
ALTER TABLE product_distributor_authorizations ADD CONSTRAINT product_distributor_authorizations_distributor_organization_id_fkey
    FOREIGN KEY (distributor_id) REFERENCES organizations(id);

-- Interaction participants table
ALTER TABLE interaction_participants DROP CONSTRAINT IF EXISTS interaction_participants_organization_id_fkey;
ALTER TABLE interaction_participants ADD CONSTRAINT interaction_participants_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- =====================================================
-- PHASE 5: RECREATE INDEXES WITH ORGANIZATIONS NAMING
-- =====================================================

-- Organizations table indexes (renamed from companies indexes)
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_organization_type ON organizations(organization_type);
CREATE INDEX idx_organizations_parent_organization_id ON organizations(parent_company_id) WHERE parent_company_id IS NOT NULL;
CREATE INDEX idx_organizations_is_principal ON organizations(is_principal) WHERE is_principal = true;
CREATE INDEX idx_organizations_is_distributor ON organizations(is_distributor) WHERE is_distributor = true;
CREATE INDEX idx_organizations_segment ON organizations(segment);
CREATE INDEX idx_organizations_priority ON organizations(priority);
CREATE INDEX idx_organizations_sales_id ON organizations(sales_id);
CREATE INDEX idx_organizations_search_tsv ON organizations USING GIN(search_tsv);

-- Recreate the dropped FK indexes
CREATE INDEX idx_contacts_organization_id ON contacts(company_id);
CREATE INDEX idx_opportunities_organization_id ON opportunities(company_id);
CREATE INDEX idx_tasks_organization_id ON tasks(company_id);

-- =====================================================
-- PHASE 6: UPDATE FUNCTIONS
-- =====================================================

-- Update search vector function to handle organizations table
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

-- Update principal organization validation function
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

-- Update primary organization sync function
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

-- Update opportunity participants validation function
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

-- Update contact organizations helper function
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
        o.name,
        co.role,
        co.is_primary,
        co.is_primary_decision_maker
    FROM contact_organizations co
    JOIN organizations o ON o.id = co.organization_id
    WHERE co.contact_id = p_contact_id
    AND co.deleted_at IS NULL
    AND o.deleted_at IS NULL
    ORDER BY co.is_primary DESC, o.name;
END;
$$ LANGUAGE plpgsql;

-- Update opportunity probability calculation for new stages
CREATE OR REPLACE FUNCTION calculate_opportunity_probability()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM NEW.stage) AND NOT NEW.stage_manual THEN
        NEW.probability := CASE NEW.stage
            WHEN 'new_lead' THEN 5
            WHEN 'initial_outreach' THEN 15
            WHEN 'sample_visit_offered' THEN 30
            WHEN 'awaiting_response' THEN 45
            WHEN 'feedback_logged' THEN 65
            WHEN 'demo_scheduled' THEN 80
            WHEN 'closed_won' THEN 100
            WHEN 'closed_lost' THEN 0
        END;
    END IF;

    IF NEW.stage IN ('closed_won', 'closed_lost') AND NEW.actual_close_date IS NULL THEN
        NEW.actual_close_date := CURRENT_DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 7: RECREATE ALL VIEWS WITH ORGANIZATIONS REFERENCES
-- =====================================================

-- Organizations summary (renamed from companies_summary)
CREATE OR REPLACE VIEW companies_summary AS
SELECT
    o.*,
    COUNT(DISTINCT con.id) AS contact_count,
    COUNT(DISTINCT opp.id) AS opportunity_count,
    COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage = 'closed_won') AS won_opportunities,
    SUM(opp.amount) FILTER (WHERE opp.stage = 'closed_won') AS total_revenue
FROM organizations o
LEFT JOIN contacts con ON o.id = con.company_id AND con.deleted_at IS NULL
LEFT JOIN opportunities opp ON o.id = opp.company_id AND opp.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- Contacts summary
CREATE OR REPLACE VIEW contacts_summary AS
SELECT
    c.*,
    org.name AS company_name,
    COUNT(DISTINCT t.id) FILTER (WHERE t.completed = false) AS open_tasks,
    COUNT(DISTINCT cn.id) AS note_count,
    COUNT(DISTINCT co.organization_id) AS organization_count
FROM contacts c
LEFT JOIN organizations org ON c.company_id = org.id
LEFT JOIN tasks t ON c.id = t.contact_id AND t.archived_at IS NULL
LEFT JOIN "contactNotes" cn ON c.id = cn.contact_id
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, org.name;

-- Opportunities summary
CREATE OR REPLACE VIEW opportunities_summary AS
SELECT
    o.*,
    org.name as company_name,
    org.industry as company_industry,
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
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN opportunity_participants op ON o.id = op.opportunity_id AND op.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, org.name, org.industry;

-- Opportunities with participants
CREATE OR REPLACE VIEW opportunities_with_participants AS
SELECT
    o.*,
    (SELECT jsonb_build_object(
        'id', org.id,
        'name', org.name,
        'type', org.organization_type
    )
    FROM opportunity_participants op
    JOIN organizations org ON op.organization_id = org.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'customer'
      AND op.is_primary = true
      AND op.deleted_at IS NULL
    LIMIT 1) AS primary_customer,
    (SELECT jsonb_agg(
        jsonb_build_object(
            'id', org.id,
            'name', org.name,
            'is_primary', op.is_primary
        )
        ORDER BY op.is_primary DESC, org.name
    )
    FROM opportunity_participants op
    JOIN organizations org ON op.organization_id = org.id
    WHERE op.opportunity_id = o.id
      AND op.role = 'principal'
      AND op.deleted_at IS NULL
    ) AS principals,
    (SELECT jsonb_agg(
        jsonb_build_object(
            'id', org.id,
            'name', org.name,
            'is_primary', op.is_primary,
            'commission_rate', op.commission_rate
        )
        ORDER BY op.is_primary DESC, org.name
    )
    FROM opportunity_participants op
    JOIN organizations org ON op.organization_id = org.id
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
    ARRAY_AGG(DISTINCT org.name ORDER BY org.name) as organizations,
    ARRAY_AGG(DISTINCT co.role::text) as roles
FROM contacts c
LEFT JOIN contact_organizations co ON co.contact_id = c.id AND co.deleted_at IS NULL
LEFT JOIN organizations org ON org.id = co.organization_id AND org.deleted_at IS NULL
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

-- Product catalog
CREATE OR REPLACE VIEW product_catalog AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.category,
    p.status,
    org.name AS principal_name,
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
JOIN organizations org ON p.principal_id = org.id
LEFT JOIN product_inventory pi ON p.id = pi.product_id
LEFT JOIN product_pricing_tiers ppt ON p.id = ppt.product_id
LEFT JOIN product_distributor_authorizations pda ON p.id = pda.product_id AND pda.is_authorized = true
WHERE p.deleted_at IS NULL
GROUP BY p.id, org.name, pi.quantity_available;

-- Product performance
CREATE OR REPLACE VIEW product_performance AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    org.name AS principal_name,
    COUNT(DISTINCT op.opportunity_id) AS opportunity_count,
    SUM(op.quantity) AS total_quantity_quoted,
    SUM(op.final_price) AS total_revenue_potential,
    AVG(op.margin_percent) AS avg_margin_percent,
    COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage = 'closed_won') AS won_opportunities,
    SUM(op.final_price) FILTER (WHERE opp.stage = 'closed_won') AS actual_revenue
FROM products p
JOIN organizations org ON p.principal_id = org.id
LEFT JOIN opportunity_products op ON p.id = op.product_id_reference
LEFT JOIN opportunities opp ON op.opportunity_id = opp.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.category, org.name;

-- =====================================================
-- PHASE 8: CREATE RLS POLICY FOR ORGANIZATIONS TABLE
-- =====================================================

CREATE POLICY "Enable all access for authenticated users" ON organizations
    FOR ALL TO authenticated USING (deleted_at IS NULL);

-- =====================================================
-- PHASE 9: UPDATE GRANT PERMISSIONS FOR NEW VIEWS
-- =====================================================

-- Grant access to all views for authenticated users
GRANT SELECT ON companies_summary TO authenticated;
GRANT SELECT ON opportunities_summary TO authenticated;
GRANT SELECT ON opportunities_with_participants TO authenticated;
GRANT SELECT ON contacts_summary TO authenticated;
GRANT SELECT ON contact_influence_profile TO authenticated;
GRANT SELECT ON principal_advocacy_dashboard TO authenticated;
GRANT SELECT ON product_catalog TO authenticated;
GRANT SELECT ON product_performance TO authenticated;

-- =====================================================
-- PHASE 10: RECREATE TRIGGER FOR ORGANIZATIONS SEARCH_TSV
-- =====================================================

CREATE TRIGGER trigger_update_organizations_search_tsv
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_search_tsv();

-- =====================================================
-- MIGRATION HISTORY TRACKING
-- =====================================================

INSERT INTO migration_history (phase_number, phase_name, status, completed_at, rows_affected)
VALUES ('20250126000000', 'Organization Pipeline Migration', 'completed', NOW(),
    (SELECT COUNT(*) FROM organizations) +
    (SELECT COUNT(*) FROM opportunities) +
    (SELECT COUNT(*) FROM contacts) +
    (SELECT COUNT(*) FROM contact_organizations) +
    (SELECT COUNT(*) FROM opportunity_participants)
);

-- =====================================================
-- END OF ORGANIZATION PIPELINE MIGRATION
-- =====================================================