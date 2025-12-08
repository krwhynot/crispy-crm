-- Migration: Remove 'partner' and 'unknown' from organization_type enum
-- Reason: Client decision - only 4 valid types needed (customer, prospect, principal, distributor)
-- Prerequisites: No records exist with partner/unknown types (verified before migration)

BEGIN;

-- ============================================================================
-- STEP 1: Safety check - abort if any records use 'unknown' or 'partner'
-- Using text cast to avoid enum comparison errors if value doesn't exist
-- ============================================================================
DO $$
DECLARE
    unknown_count INTEGER;
    partner_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unknown_count
    FROM organizations
    WHERE organization_type::text = 'unknown'
    AND deleted_at IS NULL;

    SELECT COUNT(*) INTO partner_count
    FROM organizations
    WHERE organization_type::text = 'partner'
    AND deleted_at IS NULL;

    IF unknown_count > 0 THEN
        RAISE EXCEPTION 'Cannot remove enum values: % unknown records exist. Migrate first.', unknown_count;
    END IF;

    IF partner_count > 0 THEN
        RAISE EXCEPTION 'Cannot remove enum values: % partner records exist. Migrate first.', partner_count;
    END IF;

    RAISE NOTICE 'Safety check passed: 0 unknown and 0 partner records';
END $$;

-- ============================================================================
-- STEP 2: Drop all dependent views (CASCADE)
-- These will be recreated after enum change
-- ============================================================================
DROP VIEW IF EXISTS public.authorization_status CASCADE;
DROP VIEW IF EXISTS public.priority_tasks CASCADE;
DROP VIEW IF EXISTS public.principal_opportunities CASCADE;
DROP VIEW IF EXISTS public.principal_pipeline_summary CASCADE;
DROP VIEW IF EXISTS public.organizations_with_account_manager CASCADE;
DROP VIEW IF EXISTS public.dashboard_principal_summary CASCADE;
DROP VIEW IF EXISTS public.organizations_summary CASCADE;

-- ============================================================================
-- STEP 3: Cleanup any failed previous runs
-- ============================================================================
DROP TYPE IF EXISTS organization_type_v2 CASCADE;

-- ============================================================================
-- STEP 4: Create new enum type without partner/unknown
-- ============================================================================
CREATE TYPE organization_type_v2 AS ENUM (
    'customer',
    'prospect',
    'principal',
    'distributor'
);

-- ============================================================================
-- STEP 5: Update column to use new enum
-- ============================================================================
-- Remove default first
ALTER TABLE organizations ALTER COLUMN organization_type DROP DEFAULT;

-- Convert column using a temporary text column approach
ALTER TABLE organizations ADD COLUMN org_type_temp TEXT;
UPDATE organizations SET org_type_temp = organization_type::text;
ALTER TABLE organizations DROP COLUMN organization_type;
ALTER TABLE organizations ADD COLUMN organization_type organization_type_v2;
UPDATE organizations SET organization_type = org_type_temp::organization_type_v2;
ALTER TABLE organizations DROP COLUMN org_type_temp;

-- Set new default (prospect is safest default for new orgs)
ALTER TABLE organizations
    ALTER COLUMN organization_type SET DEFAULT 'prospect'::organization_type_v2;

-- ============================================================================
-- STEP 6: Drop old enum and rename new one
-- ============================================================================
DROP TYPE IF EXISTS organization_type CASCADE;
ALTER TYPE organization_type_v2 RENAME TO organization_type;

-- ============================================================================
-- STEP 7: Recreate authorization_status view
-- ============================================================================
CREATE OR REPLACE VIEW public.authorization_status
WITH (security_invoker = on)
AS
SELECT dpa.id AS authorization_id,
    dpa.distributor_id,
    d.name AS distributor_name,
    d.organization_type = 'distributor'::organization_type AS is_distributor,
    dpa.principal_id,
    p.name AS principal_name,
    p.organization_type = 'principal'::organization_type AS is_principal,
    dpa.is_authorized,
    dpa.authorization_date,
    dpa.expiration_date,
    dpa.territory_restrictions,
    dpa.notes,
    CASE
        WHEN dpa.is_authorized = false THEN false
        WHEN dpa.deleted_at IS NOT NULL THEN false
        WHEN dpa.expiration_date IS NOT NULL AND dpa.expiration_date < CURRENT_DATE THEN false
        ELSE true
    END AS is_currently_valid,
    dpa.created_at,
    dpa.updated_at,
    dpa.deleted_at
FROM distributor_principal_authorizations dpa
LEFT JOIN organizations d ON dpa.distributor_id = d.id
LEFT JOIN organizations p ON dpa.principal_id = p.id
WHERE dpa.deleted_at IS NULL;

GRANT SELECT ON public.authorization_status TO authenticated;

-- ============================================================================
-- STEP 8: Recreate organizations_summary view (with computed columns)
-- ============================================================================
CREATE OR REPLACE VIEW public.organizations_summary
WITH (security_invoker = on)
AS
SELECT o.id,
    o.name,
    o.organization_type,
    o.parent_organization_id,
    parent.name AS parent_organization_name,
    o.priority,
    o.segment_id,
    o.employee_count,
    o.phone,
    o.website,
    o.postal_code,
    o.city,
    o.state,
    o.description,
    o.created_at,
    (SELECT count(*) FROM organizations children WHERE children.parent_organization_id = o.id AND children.deleted_at IS NULL) AS child_branch_count,
    (SELECT count(DISTINCT c.id) FROM organizations children LEFT JOIN contacts c ON c.organization_id = children.id WHERE children.parent_organization_id = o.id AND children.deleted_at IS NULL AND c.deleted_at IS NULL) AS total_contacts_across_branches,
    (SELECT count(DISTINCT opp.id) FROM organizations children LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id WHERE children.parent_organization_id = o.id AND children.deleted_at IS NULL AND opp.deleted_at IS NULL) AS total_opportunities_across_branches,
    (SELECT count(*) FROM opportunities WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL) AS nb_opportunities,
    (SELECT count(*) FROM contacts WHERE contacts.organization_id = o.id AND contacts.deleted_at IS NULL) AS nb_contacts,
    (SELECT max(opportunities.updated_at) FROM opportunities WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL) AS last_opportunity_activity,
    (SELECT count(*) FROM organization_notes WHERE organization_notes.organization_id = o.id AND organization_notes.deleted_at IS NULL) AS nb_notes
FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;

GRANT SELECT ON public.organizations_summary TO authenticated;

-- ============================================================================
-- STEP 9: Recreate organizations_with_account_manager view
-- ============================================================================
CREATE OR REPLACE VIEW public.organizations_with_account_manager
WITH (security_invoker = on)
AS
SELECT o.id,
    o.name,
    o.organization_type,
    o.priority,
    o.website,
    o.address,
    o.city,
    o.state,
    o.postal_code,
    o.phone,
    o.email,
    o.logo_url,
    o.linkedin_url,
    o.employee_count,
    o.founded_year,
    o.notes,
    o.sales_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    o.import_session_id,
    o.search_tsv,
    o.context_links,
    o.description,
    o.tax_identifier,
    o.segment_id,
    o.updated_by,
    o.parent_organization_id,
    COALESCE(s.first_name || COALESCE(' '::text || s.last_name, ''::text), 'Unassigned'::text) AS account_manager_name,
    s.user_id IS NOT NULL AS account_manager_is_user
FROM organizations o
LEFT JOIN sales s ON o.sales_id = s.id;

GRANT SELECT ON public.organizations_with_account_manager TO authenticated;

-- ============================================================================
-- STEP 10: Recreate principal_opportunities view
-- ============================================================================
CREATE OR REPLACE VIEW public.principal_opportunities
WITH (security_invoker = on)
AS
SELECT o.id AS opportunity_id,
    o.name AS opportunity_name,
    o.stage,
    o.estimated_close_date,
    o.updated_at AS last_activity,
    o.customer_organization_id,
    org.name AS customer_name,
    p.id AS principal_id,
    p.name AS principal_name,
    EXTRACT(epoch FROM now() - o.updated_at) / 86400::numeric AS days_since_activity,
    CASE
        WHEN (EXTRACT(epoch FROM now() - o.updated_at) / 86400::numeric) < 7::numeric THEN 'active'::text
        WHEN (EXTRACT(epoch FROM now() - o.updated_at) / 86400::numeric) < 14::numeric THEN 'cooling'::text
        ELSE 'at_risk'::text
    END AS health_status
FROM opportunities o
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
WHERE o.deleted_at IS NULL AND o.stage <> 'closed_lost'::opportunity_stage AND p.organization_type = 'principal'::organization_type
ORDER BY p.name, o.stage;

GRANT SELECT ON public.principal_opportunities TO authenticated;

-- ============================================================================
-- STEP 11: Recreate dashboard_principal_summary view
-- ============================================================================
CREATE OR REPLACE VIEW public.dashboard_principal_summary
WITH (security_invoker = on)
AS
WITH principal_opportunities AS (
    SELECT o.principal_organization_id,
        o.id AS opportunity_id,
        o.stage,
        o.estimated_close_date,
        o.account_manager_id,
        EXTRACT(epoch FROM now() - o.created_at) / 86400::numeric AS days_in_stage
    FROM opportunities o
    WHERE o.status = 'active'::opportunity_status AND o.principal_organization_id IS NOT NULL
), principal_activities AS (
    SELECT po.principal_organization_id,
        count(a.id) AS weekly_activity_count
    FROM principal_opportunities po
    LEFT JOIN activities a ON a.opportunity_id = po.opportunity_id AND a.created_at >= (now() - '7 days'::interval)
    GROUP BY po.principal_organization_id
), principal_reps AS (
    SELECT po.principal_organization_id,
        array_agg(DISTINCT (s.first_name || ' '::text) || s.last_name ORDER BY ((s.first_name || ' '::text) || s.last_name)) AS assigned_reps
    FROM principal_opportunities po
    JOIN sales s ON s.id = po.account_manager_id
    GROUP BY po.principal_organization_id
), principal_aggregates AS (
    SELECT po.principal_organization_id,
        count(DISTINCT po.opportunity_id) AS opportunity_count,
        max(po.days_in_stage) AS max_days_in_stage,
        bool_or(po.days_in_stage > 14::numeric) AS is_stuck,
        max(a.created_at) AS last_activity_date,
        (SELECT a2.type
            FROM activities a2
            JOIN principal_opportunities po2 ON a2.opportunity_id = po2.opportunity_id AND po2.principal_organization_id = po.principal_organization_id
            ORDER BY a2.created_at DESC
            LIMIT 1) AS last_activity_type,
        EXTRACT(epoch FROM now() - max(a.created_at)) / 86400::numeric AS days_since_last_activity
    FROM principal_opportunities po
    LEFT JOIN activities a ON a.opportunity_id = po.opportunity_id
    GROUP BY po.principal_organization_id
)
SELECT org.id,
    org.name AS principal_name,
    pa.opportunity_count,
    COALESCE(pact.weekly_activity_count, 0::bigint) AS weekly_activity_count,
    COALESCE(prep.assigned_reps, ARRAY[]::text[]) AS assigned_reps,
    pa.last_activity_date,
    pa.last_activity_type,
    pa.days_since_last_activity,
    CASE
        WHEN pa.days_since_last_activity IS NULL THEN 'urgent'::text
        WHEN pa.days_since_last_activity > 7::numeric THEN 'urgent'::text
        WHEN pa.days_since_last_activity > 3::numeric THEN 'warning'::text
        ELSE 'good'::text
    END AS status_indicator,
    pa.max_days_in_stage,
    pa.is_stuck,
    NULL::text AS next_action,
    COALESCE(pa.days_since_last_activity, 30::numeric) * 2::numeric +
        CASE
            WHEN pa.is_stuck THEN 50
            ELSE 0
        END::numeric - pa.opportunity_count::numeric * 0.5 AS priority_score
FROM organizations org
JOIN principal_aggregates pa ON pa.principal_organization_id = org.id
LEFT JOIN principal_activities pact ON pact.principal_organization_id = org.id
LEFT JOIN principal_reps prep ON prep.principal_organization_id = org.id
WHERE org.organization_type = 'principal'::organization_type
ORDER BY (COALESCE(pa.days_since_last_activity, 30::numeric) * 2::numeric +
    CASE
        WHEN pa.is_stuck THEN 50
        ELSE 0
    END::numeric - pa.opportunity_count::numeric * 0.5);

GRANT SELECT ON public.dashboard_principal_summary TO authenticated;

-- ============================================================================
-- STEP 12: Recreate principal_pipeline_summary view
-- ============================================================================
CREATE OR REPLACE VIEW public.principal_pipeline_summary
WITH (security_invoker = on)
AS
SELECT o.id,
    o.id AS principal_id,
    o.name AS principal_name,
    count(DISTINCT opp.id) FILTER (WHERE opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) AS total_pipeline,
    count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) THEN opp.id
            ELSE NULL::bigint
        END) AS active_this_week,
    count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) THEN opp.id
            ELSE NULL::bigint
        END) AS active_last_week,
    CASE
        WHEN count(DISTINCT opp.id) FILTER (WHERE opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage])) > 0 AND count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) = 0 THEN 'stale'::text
        WHEN count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) > count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) THEN 'increasing'::text
        WHEN count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) < count(DISTINCT
        CASE
            WHEN a.activity_date >= (CURRENT_DATE - '14 days'::interval) AND a.activity_date < (CURRENT_DATE - '7 days'::interval) THEN opp.id
            ELSE NULL::bigint
        END) THEN 'decreasing'::text
        ELSE 'steady'::text
    END AS momentum,
    (SELECT t.title
        FROM tasks t
        JOIN opportunities sub_opp ON t.opportunity_id = sub_opp.id
        WHERE sub_opp.principal_organization_id = o.id AND t.completed = false AND sub_opp.deleted_at IS NULL
        ORDER BY t.due_date
        LIMIT 1) AS next_action_summary,
    (SELECT opportunities.account_manager_id
        FROM opportunities
        WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL AND opportunities.account_manager_id IS NOT NULL
        ORDER BY opportunities.created_at DESC
        LIMIT 1) AS sales_id
FROM organizations o
LEFT JOIN opportunities opp ON o.id = opp.principal_organization_id AND opp.deleted_at IS NULL
LEFT JOIN activities a ON opp.id = a.opportunity_id AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'::organization_type AND o.deleted_at IS NULL
GROUP BY o.id, o.name;

GRANT SELECT ON public.principal_pipeline_summary TO authenticated;

-- ============================================================================
-- STEP 13: Recreate priority_tasks view
-- ============================================================================
CREATE OR REPLACE VIEW public.priority_tasks
WITH (security_invoker = on)
AS
SELECT t.id AS task_id,
    t.title AS task_title,
    t.due_date,
    t.priority,
    t.type AS task_type,
    t.completed,
    t.opportunity_id,
    o.name AS opportunity_name,
    o.customer_organization_id AS organization_id,
    org.name AS customer_name,
    o.principal_organization_id,
    p.name AS principal_name,
    c.id AS contact_id,
    c.name AS contact_name
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE t.completed = false AND (t.due_date <= (CURRENT_DATE + '7 days'::interval) OR (t.priority = ANY (ARRAY['high'::priority_level, 'critical'::priority_level]))) AND p.organization_type = 'principal'::organization_type
ORDER BY t.priority DESC, t.due_date;

GRANT SELECT ON public.priority_tasks TO authenticated;

-- ============================================================================
-- STEP 14: Add documentation
-- ============================================================================
COMMENT ON TYPE organization_type IS
'Organization classification: customer (active buyer), prospect (potential), principal (manufacturer/brand), distributor (distribution partner). Removed partner/unknown per client decision 2024-12.';

COMMIT;
