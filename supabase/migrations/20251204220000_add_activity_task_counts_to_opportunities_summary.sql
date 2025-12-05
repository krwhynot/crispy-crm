/**
 * Add Activity and Task Count Columns to opportunities_summary View
 *
 * New columns for Kanban card visual cues:
 * - days_since_last_activity: Days since most recent interaction (for activity pulse)
 * - pending_task_count: Number of incomplete tasks
 * - overdue_task_count: Number of tasks past due date
 *
 * Related: OpportunityCard.tsx expandable card feature
 *
 * MIGRATION SAFETY:
 * - Uses DROP VIEW CASCADE to handle any dependent views/policies
 * - Re-applies COMMENT and GRANT after recreation
 * - No known dependencies as of 2025-12-04, but CASCADE is defensive
 */

-- Log dependencies before dropping (informational only)
DO $$
DECLARE
    dep_record RECORD;
    has_deps BOOLEAN := false;
BEGIN
    FOR dep_record IN
        SELECT DISTINCT dependent_ns.nspname AS schema_name, dependent_view.relname AS view_name
        FROM pg_depend
        JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
        JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid
        JOIN pg_namespace AS dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
        WHERE pg_depend.refobjid = 'public.opportunities_summary'::regclass::oid
        AND dependent_view.relname != 'opportunities_summary'
    LOOP
        RAISE WARNING 'Dependent view will be dropped: %.%', dep_record.schema_name, dep_record.view_name;
        has_deps := true;
    END LOOP;

    IF has_deps THEN
        RAISE WARNING 'CASCADE will drop the above views. Re-create them if needed.';
    ELSE
        RAISE NOTICE 'No dependent views found - safe to proceed.';
    END IF;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View opportunities_summary does not exist yet - creating fresh.';
END $$;

-- Drop with CASCADE to handle any dependent views/policies
DROP VIEW IF EXISTS opportunities_summary CASCADE;

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

    -- Computed: days since opportunity entered current stage (existing)
    EXTRACT(DAY FROM (NOW() - COALESCE(o.stage_changed_at, o.created_at)))::integer AS days_in_stage,

    -- NEW: Days since last activity (for activity pulse)
    (SELECT EXTRACT(DAY FROM (NOW() - MAX(a.activity_date)))::integer
     FROM activities a
     WHERE a.opportunity_id = o.id
       AND a.deleted_at IS NULL
    ) AS days_since_last_activity,

    -- NEW: Pending task count (excludes soft-deleted tasks)
    -- NOTE: tasks.completed is nullable with DEFAULT false, so use COALESCE
    -- to handle any rows where completed IS NULL (treats as false/pending)
    (SELECT COUNT(*)::integer
     FROM tasks t
     WHERE t.opportunity_id = o.id
       AND COALESCE(t.completed, false) = false
       AND t.deleted_at IS NULL
    ) AS pending_task_count,

    -- NEW: Overdue task count (excludes soft-deleted tasks)
    -- Same NULL handling for completed column
    (SELECT COUNT(*)::integer
     FROM tasks t
     WHERE t.opportunity_id = o.id
       AND COALESCE(t.completed, false) = false
       AND t.due_date < CURRENT_DATE
       AND t.deleted_at IS NULL
    ) AS overdue_task_count,

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

-- Re-grant permissions
GRANT SELECT ON opportunities_summary TO authenticated;

-- Re-apply view comment (lost during DROP CASCADE)
COMMENT ON VIEW opportunities_summary IS
    'Opportunities with joined organization names, products, and computed columns. '
    'Computed: days_in_stage (since stage_changed_at), days_since_last_activity (from activities), '
    'pending_task_count, overdue_task_count. '
    'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- Verification
DO $$
DECLARE
    activity_col_exists BOOLEAN;
    pending_col_exists BOOLEAN;
    overdue_col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities_summary'
        AND column_name = 'days_since_last_activity'
    ) INTO activity_col_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities_summary'
        AND column_name = 'pending_task_count'
    ) INTO pending_col_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities_summary'
        AND column_name = 'overdue_task_count'
    ) INTO overdue_col_exists;

    IF activity_col_exists AND pending_col_exists AND overdue_col_exists THEN
        RAISE NOTICE 'SUCCESS: All three new columns added to opportunities_summary';
    ELSE
        RAISE EXCEPTION 'FAILED: Missing columns - activity: %, pending: %, overdue: %',
            activity_col_exists, pending_col_exists, overdue_col_exists;
    END IF;
END $$;
