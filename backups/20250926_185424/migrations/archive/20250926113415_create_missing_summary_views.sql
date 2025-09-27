-- Migration: Create missing summary views with correct table references
-- Purpose: Fix 404 errors by creating views that reference 'organizations' not 'companies'
-- Author: Engineering Team
-- Date: 2025-09-26
-- Principles: Fail fast (no IF EXISTS), no backward compatibility

BEGIN;

-- =====================================================
-- ORGANIZATIONS_SUMMARY VIEW
-- =====================================================
-- Provides aggregated view of organizations with related counts
CREATE VIEW organizations_summary AS
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
    -- Aggregated counts
    COUNT(DISTINCT co.contact_id) FILTER (WHERE co.deleted_at IS NULL) AS contacts_count,
    COUNT(DISTINCT opp.id) FILTER (WHERE opp.deleted_at IS NULL) AS opportunities_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL) AS activities_count,
    MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
LEFT JOIN contact_organizations co ON o.id = co.organization_id
LEFT JOIN opportunities opp ON (
    o.id = opp.customer_organization_id
    OR o.id = opp.principal_organization_id
    OR o.id = opp.distributor_organization_id
)
LEFT JOIN activities a ON o.id = a.organization_id
WHERE o.deleted_at IS NULL
GROUP BY o.id;

-- =====================================================
-- CONTACTS_SUMMARY VIEW
-- =====================================================
-- Provides aggregated view of contacts with organization relationships
CREATE VIEW contacts_summary AS
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
    -- Primary organization name
    (SELECT org.name
     FROM contact_organizations co
     JOIN organizations org ON co.organization_id = org.id
     WHERE co.contact_id = c.id
       AND co.is_primary = true
       AND co.deleted_at IS NULL
       AND org.deleted_at IS NULL
     LIMIT 1) AS company_name,
    -- Aggregated counts
    COUNT(DISTINCT t.id) FILTER (WHERE t.completed = false AND t.archived_at IS NULL) AS open_tasks,
    COUNT(DISTINCT cn.id) AS note_count,
    COUNT(DISTINCT co.organization_id) FILTER (WHERE co.deleted_at IS NULL) AS organization_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL) AS activities_count
FROM contacts c
LEFT JOIN tasks t ON c.id = t.contact_id
LEFT JOIN "contactNotes" cn ON c.id = cn.contact_id
LEFT JOIN contact_organizations co ON c.id = co.contact_id
LEFT JOIN activities a ON c.id = a.contact_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- =====================================================
-- OPPORTUNITIES_SUMMARY VIEW
-- =====================================================
-- Provides aggregated view of opportunities with related organization names
CREATE VIEW opportunities_summary AS
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
    -- Organization names for display
    cust.name AS customer_name,
    prin.name AS principal_name,
    dist.name AS distributor_name,
    -- Aggregated counts
    COUNT(DISTINCT opn.id) AS note_count,
    COUNT(DISTINCT op.id) FILTER (WHERE op.deleted_at IS NULL) AS participant_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL) AS activities_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.completed = false AND t.archived_at IS NULL) AS open_tasks
FROM opportunities o
LEFT JOIN organizations cust ON o.customer_organization_id = cust.id AND cust.deleted_at IS NULL
LEFT JOIN organizations prin ON o.principal_organization_id = prin.id AND prin.deleted_at IS NULL
LEFT JOIN organizations dist ON o.distributor_organization_id = dist.id AND dist.deleted_at IS NULL
LEFT JOIN "opportunityNotes" opn ON o.id = opn.opportunity_id
LEFT JOIN opportunity_participants op ON o.id = op.opportunity_id
LEFT JOIN activities a ON o.id = a.opportunity_id
LEFT JOIN tasks t ON o.id = t.opportunity_id
WHERE o.deleted_at IS NULL
GROUP BY
    o.id,
    cust.name,
    prin.name,
    dist.name;

-- Grant appropriate permissions
GRANT SELECT ON organizations_summary TO authenticated;
GRANT SELECT ON contacts_summary TO authenticated;
GRANT SELECT ON opportunities_summary TO authenticated;

COMMIT;