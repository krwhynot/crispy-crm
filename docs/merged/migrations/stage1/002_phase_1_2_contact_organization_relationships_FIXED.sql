-- =====================================================
-- Phase 1.2: Contact-Organization Many-to-Many Relationships
-- =====================================================
-- Purpose: Enable contacts to work with multiple organizations
-- Breaking Changes: contact.company_id becomes primary relationship

BEGIN;

-- =====================================================
-- CONTACT-ORGANIZATION JUNCTION TABLE
-- =====================================================

-- Create junction table for many-to-many relationships
CREATE TABLE IF NOT EXISTS contact_organizations (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    -- FIXED: Proper unique constraint for active records only
    CONSTRAINT unique_contact_organization_active
        EXCLUDE (contact_id WITH =, organization_id WITH =)
        WHERE (deleted_at IS NULL)
);

-- Create indexes for performance
CREATE INDEX idx_contact_organizations_contact
ON contact_organizations(contact_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_organizations_organization
ON contact_organizations(organization_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_organizations_primary
ON contact_organizations(organization_id, is_primary)
WHERE deleted_at IS NULL AND is_primary = true;

CREATE INDEX idx_contact_organizations_roles
ON contact_organizations(role)
WHERE deleted_at IS NULL;

CREATE INDEX idx_contact_organizations_decision_makers
ON contact_organizations(organization_id, is_primary_decision_maker)
WHERE deleted_at IS NULL AND is_primary_decision_maker = true;

-- =====================================================
-- CONTACT PRINCIPAL PREFERENCES
-- =====================================================

-- Create validation function for principal organizations
CREATE OR REPLACE FUNCTION validate_principal_organization()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM companies
        WHERE id = NEW.principal_organization_id
        AND is_principal = true
    ) THEN
        RAISE EXCEPTION 'Organization % is not marked as principal', NEW.principal_organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Track which principals each contact advocates for
CREATE TABLE IF NOT EXISTS contact_preferred_principals (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    principal_organization_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    advocacy_strength SMALLINT DEFAULT 50 CHECK (advocacy_strength BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_contact_principal_active
        UNIQUE(contact_id, principal_organization_id, deleted_at)
);

-- Apply the trigger to validate principal organizations
CREATE TRIGGER validate_principal_organization_trigger
    BEFORE INSERT OR UPDATE ON contact_preferred_principals
    FOR EACH ROW
    EXECUTE FUNCTION validate_principal_organization();

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
-- BACKUP EXISTING RELATIONSHIPS BEFORE MIGRATION
-- =====================================================

-- Create backup columns to preserve original data
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS company_id_backup BIGINT,
ADD COLUMN IF NOT EXISTS migration_timestamp TIMESTAMPTZ;

-- Store original values before any changes
UPDATE contacts
SET company_id_backup = company_id,
    migration_timestamp = NOW()
WHERE company_id_backup IS NULL;

-- =====================================================
-- MIGRATE EXISTING DATA
-- =====================================================

-- Populate junction table from existing contact-company relationships
INSERT INTO contact_organizations (
    contact_id,
    organization_id,
    is_primary,
    is_primary_decision_maker,
    is_primary_contact,
    role,
    relationship_start_date,
    notes,
    created_at,
    updated_at,
    created_by
)
SELECT
    c.id,
    c.company_id,
    true, -- Existing relationships are primary
    COALESCE(c.title ILIKE '%director%' OR c.title ILIKE '%vp%' OR c.title ILIKE '%president%', false),
    true, -- Assume existing contacts are primary contacts
    CASE
        WHEN c.title ILIKE '%ceo%' OR c.title ILIKE '%president%' OR c.title ILIKE '%owner%'
            THEN 'executive'::contact_role
        WHEN c.title ILIKE '%director%' OR c.title ILIKE '%vp%' OR c.title ILIKE '%head%'
            THEN 'decision_maker'::contact_role
        WHEN c.title ILIKE '%manager%' OR c.title ILIKE '%lead%'
            THEN 'influencer'::contact_role
        WHEN c.title ILIKE '%engineer%' OR c.title ILIKE '%developer%' OR c.title ILIKE '%analyst%'
            THEN 'technical'::contact_role
        ELSE 'end_user'::contact_role  -- FIXED: Changed from 'user' to 'end_user'
    END,
    COALESCE(c.created_at::date, CURRENT_DATE),
    'Migrated from original company_id relationship',
    c.created_at,
    c.updated_at,
    c.sales_id
FROM contacts c
WHERE c.company_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM contact_organizations co
    WHERE co.contact_id = c.id
    AND co.organization_id = c.company_id
    AND co.deleted_at IS NULL
);

-- Add trigger to maintain company_id for backward compatibility
CREATE OR REPLACE FUNCTION sync_primary_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- When a primary organization is set, update the contact's company_id
    IF NEW.is_primary = true THEN
        UPDATE contacts
        SET company_id = NEW.organization_id
        WHERE id = NEW.contact_id;

        -- Ensure only one primary per contact
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

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all organizations for a contact
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
    JOIN companies c ON c.id = co.organization_id
    WHERE co.contact_id = p_contact_id
    AND co.deleted_at IS NULL
    AND c.deleted_at IS NULL
    ORDER BY co.is_primary DESC, c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all contacts for an organization
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
        CONCAT(c.first_name, ' ', c.last_name) as contact_name,
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

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Contact influence profile across organizations
CREATE OR REPLACE VIEW contact_influence_profile AS
SELECT
    c.id as contact_id,
    CONCAT(c.first_name, ' ', c.last_name) as contact_name,
    COUNT(DISTINCT co.organization_id) as org_count,
    COUNT(DISTINCT co.organization_id) FILTER (WHERE co.is_primary_decision_maker = true) as decision_maker_count,
    AVG(co.purchase_influence) as avg_purchase_influence,
    AVG(co.decision_authority) as avg_decision_authority,
    ARRAY_AGG(DISTINCT comp.name ORDER BY comp.name) as organizations,
    ARRAY_AGG(DISTINCT co.role::text) as roles
FROM contacts c
LEFT JOIN contact_organizations co ON co.contact_id = c.id AND co.deleted_at IS NULL
LEFT JOIN companies comp ON comp.id = co.organization_id AND comp.deleted_at IS NULL
GROUP BY c.id, c.first_name, c.last_name;

-- Principal advocacy dashboard
CREATE OR REPLACE VIEW principal_advocacy_dashboard AS
SELECT
    p.id as principal_id,
    p.name as principal_name,
    COUNT(DISTINCT cpp.contact_id) as advocate_count,
    AVG(cpp.advocacy_strength) as avg_advocacy_strength,
    COUNT(DISTINCT co.organization_id) as reach_org_count
FROM companies p
LEFT JOIN contact_preferred_principals cpp ON cpp.principal_organization_id = p.id AND cpp.deleted_at IS NULL
LEFT JOIN contact_organizations co ON co.contact_id = cpp.contact_id AND co.deleted_at IS NULL
WHERE p.is_principal = true
AND p.deleted_at IS NULL
GROUP BY p.id, p.name;

-- =====================================================
-- DATA VALIDATION
-- =====================================================

-- Validate migration success
DO $$
DECLARE
    v_original_count INTEGER;
    v_migrated_count INTEGER;
BEGIN
    -- Count original relationships
    SELECT COUNT(*) INTO v_original_count
    FROM contacts
    WHERE company_id IS NOT NULL;

    -- Count migrated relationships
    SELECT COUNT(DISTINCT contact_id) INTO v_migrated_count
    FROM contact_organizations
    WHERE is_primary = true
    AND deleted_at IS NULL;

    -- Validate counts match
    IF v_original_count != v_migrated_count THEN
        RAISE WARNING 'Migration validation failed: % original relationships, % migrated relationships',
            v_original_count, v_migrated_count;
        -- Don't fail transaction, just warn
    ELSE
        RAISE NOTICE 'Migration successful: % relationships migrated', v_migrated_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK SCRIPT (Save separately)
-- =====================================================
-- BEGIN;
-- -- Restore original relationships
-- UPDATE contacts c
-- SET company_id = c.company_id_backup
-- WHERE c.company_id_backup IS NOT NULL;
--
-- -- Drop new tables and functions
-- DROP TABLE IF EXISTS contact_preferred_principals CASCADE;
-- DROP TABLE IF EXISTS contact_organizations CASCADE;
-- DROP FUNCTION IF EXISTS validate_principal_organization() CASCADE;
-- DROP FUNCTION IF EXISTS sync_primary_organization() CASCADE;
-- DROP FUNCTION IF EXISTS get_contact_organizations(BIGINT) CASCADE;
-- DROP FUNCTION IF EXISTS get_organization_contacts(BIGINT) CASCADE;
-- DROP VIEW IF EXISTS contact_influence_profile CASCADE;
-- DROP VIEW IF EXISTS principal_advocacy_dashboard CASCADE;
--
-- -- Remove backup columns
-- ALTER TABLE contacts
-- DROP COLUMN IF EXISTS company_id_backup,
-- DROP COLUMN IF EXISTS migration_timestamp;
--
-- COMMIT;