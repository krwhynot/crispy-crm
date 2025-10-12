-- Migration: Add company_name to contacts_summary view
-- Purpose: Fix missing company_name column that frontend expects
-- Author: Claude
-- Date: 2025-09-29

-- Step 1: Create optimized index for the subquery performance
-- This index speeds up the lookup of primary organization for each contact
CREATE INDEX IF NOT EXISTS idx_contact_orgs_lookup
ON contact_organizations(contact_id, is_primary DESC, created_at ASC);

-- Step 2: Replace the view to include company_name column
-- Using CREATE OR REPLACE for zero-downtime update
CREATE OR REPLACE VIEW contacts_summary AS
SELECT
    c.*,
    -- Aggregate all organization IDs for the contact
    array_agg(DISTINCT co.organization_id) FILTER (WHERE co.organization_id IS NOT NULL) AS organization_ids,
    -- Get the first organization's name as company_name
    -- Prioritizes is_primary=true, then earliest created
    (SELECT o.name
     FROM contact_organizations co2
     JOIN organizations o ON o.id = co2.organization_id
     WHERE co2.contact_id = c.id
     AND o.deleted_at IS NULL
     ORDER BY co2.is_primary DESC, co2.created_at ASC
     LIMIT 1) AS company_name
FROM contacts c
LEFT JOIN contact_organizations co ON co.contact_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- Step 3: Add documentation comment
COMMENT ON VIEW contacts_summary IS 'Contact summary view with organization relationships and primary company name. The company_name field shows the primary organization or the earliest associated organization if no primary is set.';