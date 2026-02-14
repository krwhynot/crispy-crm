/**
 * Add days_in_stage Computed Column to opportunities_summary View
 *
 * PROBLEM: The Kanban board displays "~0d" for all stages because the
 * opportunities_summary view was missing the days_in_stage computed column.
 *
 * The opportunities table already has:
 * - stage_changed_at column (tracks when stage last changed)
 * - trigger_update_opportunity_stage_changed_at (auto-updates on stage change)
 *
 * This migration adds the computed column using the industry-standard pattern:
 *   EXTRACT(DAY FROM (NOW() - stage_changed_at))
 *
 * INDUSTRY STANDARD (HubSpot, Salesforce, OroCRM):
 * - Track stage entry timestamp (stage_changed_at)
 * - Compute duration dynamically in views
 * - Display as integer days for UX clarity
 *
 * Related: useStageMetrics.ts, OpportunityColumn.tsx, OpportunityCard.tsx
 */

-- Drop and recreate view with days_in_stage computed column
DROP VIEW IF EXISTS opportunities_summary;

CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
SELECT
    o.id,
    o.name,
    o.description,
    o.stage,
    o.status,
    o.priority,
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
    o.opportunity_owner_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    o.search_tsv,
    o.tags,
    o.account_manager_id,
    o.lead_source,
    o.updated_by,
    o.campaign,
    o.related_opportunity_id,
    o.win_reason,
    o.loss_reason,
    o.close_reason_notes,
    o.notes,
    o.stage_changed_at,
    -- Computed: days since opportunity entered current stage
    -- Uses COALESCE to handle NULL stage_changed_at (defaults to created_at)
    EXTRACT(DAY FROM (NOW() - COALESCE(o.stage_changed_at, o.created_at)))::integer AS days_in_stage,
    -- Joined organization names
    cust_org.name AS customer_organization_name,
    prin_org.name AS principal_organization_name,
    dist_org.name AS distributor_organization_name,
    -- Products array (JSONB aggregation)
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', op.id,
                'product_id_reference', op.product_id_reference,
                'product_name', op.product_name,
                'product_category', op.product_category,
                'principal_name', prod_org.name,
                'notes', op.notes
            ) ORDER BY op.created_at
        )
        FROM opportunity_products op
        LEFT JOIN products p ON op.product_id_reference = p.id
        LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id
        WHERE op.opportunity_id = o.id
        ),
        '[]'::jsonb
    ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id;

-- Update comment to document new column
COMMENT ON VIEW opportunities_summary IS
    'Opportunities with joined organization names, products, and computed days_in_stage. '
    'days_in_stage is calculated as days since stage_changed_at (or created_at if NULL). '
    'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- Re-grant permissions (required after DROP VIEW)
GRANT SELECT ON opportunities_summary TO authenticated;

-- Verification: Check the view was created with the new column
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'opportunities_summary'
        AND column_name = 'days_in_stage'
    ) INTO col_exists;

    IF col_exists THEN
        RAISE NOTICE '============================================';
        RAISE NOTICE 'SUCCESS: days_in_stage column added to opportunities_summary';
        RAISE NOTICE '============================================';
    ELSE
        RAISE EXCEPTION 'FAILED: days_in_stage column not found in opportunities_summary';
    END IF;
END $$;
