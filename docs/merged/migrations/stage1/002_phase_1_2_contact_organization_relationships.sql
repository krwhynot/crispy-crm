-- =====================================================
-- Stage 1, Phase 1.2: Contact-Organization Relationships
-- Migration: Many-to-Many Contact Organizations
-- Date: 2025-01-22
-- Description: Implement many-to-many relationships between contacts and organizations
-- =====================================================

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('1.2', 'Contact-Organization Relationships', 'in_progress', NOW());

-- =====================================================
-- CREATE CONTACT_ORGANIZATIONS JUNCTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_organizations (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_primary_decision_maker BOOLEAN DEFAULT false,
    is_primary_contact BOOLEAN DEFAULT false,
    role contact_role,
    purchase_influence VARCHAR(10) DEFAULT 'Unknown'
        CHECK (purchase_influence IN ('High', 'Medium', 'Low', 'Unknown')),
    decision_authority VARCHAR(20) DEFAULT 'End User'
        CHECK (decision_authority IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper')),
    relationship_start_date DATE DEFAULT CURRENT_DATE,
    relationship_end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    UNIQUE(contact_id, organization_id, deleted_at)
);

-- Create indexes for performance
CREATE INDEX idx_contact_organizations_contact_id
ON contact_organizations(contact_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_organizations_organization_id
ON contact_organizations(organization_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_organizations_primary_dm
ON contact_organizations(organization_id)
WHERE is_primary_decision_maker = true AND deleted_at IS NULL;

CREATE INDEX idx_contact_organizations_primary_contact
ON contact_organizations(organization_id)
WHERE is_primary_contact = true AND deleted_at IS NULL;

-- =====================================================
-- CREATE CONTACT_PREFERRED_PRINCIPALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_preferred_principals (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    principal_organization_id BIGINT NOT NULL REFERENCES companies(id),
    advocacy_strength INTEGER DEFAULT 5 CHECK (advocacy_strength >= 1 AND advocacy_strength <= 10),
    advocacy_notes TEXT,
    relationship_type VARCHAR(20) DEFAULT 'professional'
        CHECK (relationship_type IN ('professional', 'personal', 'historical', 'competitive')),
    purchase_influence_for_principal VARCHAR(10) DEFAULT 'Unknown'
        CHECK (purchase_influence_for_principal IN ('High', 'Medium', 'Low', 'Unknown')),
    last_interaction_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_contact_principal_active
        UNIQUE(contact_id, principal_organization_id, deleted_at),
    CONSTRAINT principal_must_be_principal
        CHECK (
            EXISTS (
                SELECT 1 FROM companies
                WHERE id = principal_organization_id
                AND is_principal = true
            )
        )
);

-- Create indexes for advocacy tracking
CREATE INDEX idx_contact_preferred_principals_contact
ON contact_preferred_principals(contact_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_preferred_principals_principal
ON contact_preferred_principals(principal_organization_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_preferred_principals_strength
ON contact_preferred_principals(advocacy_strength)
WHERE deleted_at IS NULL;

-- =====================================================
-- MIGRATE EXISTING DATA
-- =====================================================

-- Migrate existing contact-company relationships to junction table
INSERT INTO contact_organizations (
    contact_id,
    organization_id,
    is_primary_contact,
    is_primary_decision_maker,
    role,
    purchase_influence,
    decision_authority,
    created_at,
    updated_at,
    created_by
)
SELECT
    c.id AS contact_id,
    c.company_id AS organization_id,
    COALESCE(c.is_primary_contact, false),
    false AS is_primary_decision_maker,
    c.role,
    COALESCE(c.purchase_influence, 'Unknown'),
    COALESCE(c.decision_authority, 'End User'),
    c.created_at,
    c.updated_at,
    c.sale_id
FROM contacts c
WHERE c.company_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM contact_organizations co
      WHERE co.contact_id = c.id
        AND co.organization_id = c.company_id
        AND co.deleted_at IS NULL
  );

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get all organizations for a contact
CREATE OR REPLACE FUNCTION get_contact_organizations(p_contact_id BIGINT)
RETURNS TABLE (
    organization_id BIGINT,
    organization_name TEXT,
    organization_type organization_type,
    is_primary_contact BOOLEAN,
    is_primary_decision_maker BOOLEAN,
    role contact_role,
    purchase_influence VARCHAR,
    relationship_start_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.organization_id,
        c.name AS organization_name,
        c.organization_type,
        co.is_primary_contact,
        co.is_primary_decision_maker,
        co.role,
        co.purchase_influence,
        co.relationship_start_date
    FROM contact_organizations co
    JOIN companies c ON c.id = co.organization_id
    WHERE co.contact_id = p_contact_id
      AND co.deleted_at IS NULL
      AND c.deleted_at IS NULL
    ORDER BY co.is_primary_contact DESC, co.relationship_start_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get all contacts for an organization
CREATE OR REPLACE FUNCTION get_organization_contacts(p_organization_id BIGINT)
RETURNS TABLE (
    contact_id BIGINT,
    contact_name TEXT,
    contact_title TEXT,
    is_primary_contact BOOLEAN,
    is_primary_decision_maker BOOLEAN,
    role contact_role,
    purchase_influence VARCHAR,
    decision_authority VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.contact_id,
        c.name AS contact_name,
        c.title AS contact_title,
        co.is_primary_contact,
        co.is_primary_decision_maker,
        co.role,
        co.purchase_influence,
        co.decision_authority
    FROM contact_organizations co
    JOIN contacts c ON c.id = co.contact_id
    WHERE co.organization_id = p_organization_id
      AND co.deleted_at IS NULL
      AND c.deleted_at IS NULL
    ORDER BY co.is_primary_decision_maker DESC, co.is_primary_contact DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to add contact to organization
CREATE OR REPLACE FUNCTION add_contact_to_organization(
    p_contact_id BIGINT,
    p_organization_id BIGINT,
    p_is_primary_contact BOOLEAN DEFAULT false,
    p_is_primary_decision_maker BOOLEAN DEFAULT false,
    p_role contact_role DEFAULT NULL,
    p_purchase_influence VARCHAR DEFAULT 'Unknown',
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_id BIGINT;
BEGIN
    -- If marking as primary contact, unmark others
    IF p_is_primary_contact THEN
        UPDATE contact_organizations
        SET is_primary_contact = false,
            updated_at = NOW()
        WHERE organization_id = p_organization_id
          AND is_primary_contact = true
          AND deleted_at IS NULL;
    END IF;

    -- If marking as primary decision maker, unmark others
    IF p_is_primary_decision_maker THEN
        UPDATE contact_organizations
        SET is_primary_decision_maker = false,
            updated_at = NOW()
        WHERE organization_id = p_organization_id
          AND is_primary_decision_maker = true
          AND deleted_at IS NULL;
    END IF;

    -- Insert or update the relationship
    INSERT INTO contact_organizations (
        contact_id,
        organization_id,
        is_primary_contact,
        is_primary_decision_maker,
        role,
        purchase_influence,
        created_by
    )
    VALUES (
        p_contact_id,
        p_organization_id,
        p_is_primary_contact,
        p_is_primary_decision_maker,
        p_role,
        p_purchase_influence,
        p_created_by
    )
    ON CONFLICT (contact_id, organization_id, deleted_at)
    WHERE deleted_at IS NULL
    DO UPDATE SET
        is_primary_contact = EXCLUDED.is_primary_contact,
        is_primary_decision_maker = EXCLUDED.is_primary_decision_maker,
        role = COALESCE(EXCLUDED.role, contact_organizations.role),
        purchase_influence = EXCLUDED.purchase_influence,
        updated_at = NOW()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track principal advocacy
CREATE OR REPLACE FUNCTION add_principal_advocacy(
    p_contact_id BIGINT,
    p_principal_id BIGINT,
    p_advocacy_strength INTEGER DEFAULT 5,
    p_advocacy_notes TEXT DEFAULT NULL,
    p_relationship_type VARCHAR DEFAULT 'professional',
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_id BIGINT;
    v_is_principal BOOLEAN;
BEGIN
    -- Verify the organization is a principal
    SELECT is_principal INTO v_is_principal
    FROM companies
    WHERE id = p_principal_id;

    IF NOT v_is_principal THEN
        RAISE EXCEPTION 'Organization % is not marked as a principal', p_principal_id;
    END IF;

    -- Insert or update advocacy
    INSERT INTO contact_preferred_principals (
        contact_id,
        principal_organization_id,
        advocacy_strength,
        advocacy_notes,
        relationship_type,
        created_by
    )
    VALUES (
        p_contact_id,
        p_principal_id,
        p_advocacy_strength,
        p_advocacy_notes,
        p_relationship_type,
        p_created_by
    )
    ON CONFLICT (contact_id, principal_organization_id, deleted_at)
    WHERE deleted_at IS NULL
    DO UPDATE SET
        advocacy_strength = EXCLUDED.advocacy_strength,
        advocacy_notes = EXCLUDED.advocacy_notes,
        relationship_type = EXCLUDED.relationship_type,
        updated_at = NOW(),
        last_interaction_date = CURRENT_DATE
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE VIEWS FOR REPORTING
-- =====================================================

-- View for contact influence profile
CREATE OR REPLACE VIEW contact_influence_profile AS
SELECT
    c.id AS contact_id,
    c.name AS contact_name,
    c.title,
    COUNT(DISTINCT co.organization_id) AS organization_count,
    COUNT(DISTINCT cpp.principal_organization_id) AS advocated_principals_count,
    AVG(cpp.advocacy_strength)::NUMERIC(3,1) AS avg_advocacy_strength,
    MAX(CASE WHEN co.is_primary_decision_maker THEN 'Primary DM'
             WHEN co.is_primary_contact THEN 'Primary Contact'
             ELSE 'Contact' END) AS highest_role,
    STRING_AGG(DISTINCT comp.name, ', ' ORDER BY comp.name) AS organizations,
    STRING_AGG(DISTINCT prin.name, ', ' ORDER BY prin.name) AS advocated_principals
FROM contacts c
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.deleted_at IS NULL
LEFT JOIN companies comp ON co.organization_id = comp.id AND comp.deleted_at IS NULL
LEFT JOIN contact_preferred_principals cpp ON c.id = cpp.contact_id AND cpp.deleted_at IS NULL
LEFT JOIN companies prin ON cpp.principal_organization_id = prin.id AND prin.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name, c.title;

-- View for principal advocacy dashboard
CREATE OR REPLACE VIEW principal_advocacy_dashboard AS
SELECT
    p.id AS principal_id,
    p.name AS principal_name,
    COUNT(DISTINCT cpp.contact_id) AS advocate_count,
    COUNT(DISTINCT co.organization_id) AS reached_organizations,
    AVG(cpp.advocacy_strength)::NUMERIC(3,1) AS avg_advocacy_strength,
    COUNT(DISTINCT CASE WHEN cpp.advocacy_strength >= 8 THEN cpp.contact_id END) AS strong_advocates,
    COUNT(DISTINCT CASE WHEN cpp.advocacy_strength BETWEEN 5 AND 7 THEN cpp.contact_id END) AS moderate_advocates,
    COUNT(DISTINCT CASE WHEN cpp.advocacy_strength < 5 THEN cpp.contact_id END) AS weak_advocates
FROM companies p
LEFT JOIN contact_preferred_principals cpp ON p.id = cpp.principal_organization_id AND cpp.deleted_at IS NULL
LEFT JOIN contacts c ON cpp.contact_id = c.id AND c.deleted_at IS NULL
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.deleted_at IS NULL
WHERE p.deleted_at IS NULL
  AND p.is_principal = true
GROUP BY p.id, p.name;

-- =====================================================
-- UPDATE EXISTING VIEWS
-- =====================================================

-- Update contacts summary to show organization count
CREATE OR REPLACE VIEW contacts_summary AS
SELECT
    c.*,
    comp.name AS company_name,
    COUNT(DISTINCT co.organization_id) AS total_organizations,
    COUNT(DISTINCT cpp.principal_organization_id) AS advocated_principals,
    MAX(co.is_primary_decision_maker) AS is_decision_maker_anywhere,
    MAX(co.is_primary_contact) AS is_primary_anywhere
FROM contacts c
LEFT JOIN companies comp ON c.company_id = comp.id
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.deleted_at IS NULL
LEFT JOIN contact_preferred_principals cpp ON c.id = cpp.contact_id AND cpp.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, comp.name;

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE contact_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_preferred_principals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all access for authenticated users" ON contact_organizations
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON contact_preferred_principals
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_view_count INTEGER;
    v_migrated_count INTEGER;
BEGIN
    -- Check tables created
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_name IN ('contact_organizations', 'contact_preferred_principals')
    AND table_schema = 'public';

    IF v_table_count < 2 THEN
        RAISE EXCEPTION 'Not all tables were created successfully';
    END IF;

    -- Check functions created
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_name IN ('get_contact_organizations', 'get_organization_contacts',
                          'add_contact_to_organization', 'add_principal_advocacy')
    AND routine_schema = 'public';

    IF v_function_count < 4 THEN
        RAISE EXCEPTION 'Not all functions were created successfully';
    END IF;

    -- Check views created
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_name IN ('contact_influence_profile', 'principal_advocacy_dashboard')
    AND table_schema = 'public';

    IF v_view_count < 2 THEN
        RAISE WARNING 'Some views may not have been created: % found', v_view_count;
    END IF;

    -- Check data migration
    SELECT COUNT(*) INTO v_migrated_count
    FROM contact_organizations;

    RAISE NOTICE 'Phase 1.2 validation passed. Migrated % contact-organization relationships', v_migrated_count;
END $$;

-- Record migration completion
UPDATE migration_history
SET status = 'completed',
    completed_at = NOW()
WHERE phase_number = '1.2'
AND status = 'in_progress';

-- =====================================================
-- END OF PHASE 1.2 - CONTACT-ORGANIZATION RELATIONSHIPS
-- =====================================================