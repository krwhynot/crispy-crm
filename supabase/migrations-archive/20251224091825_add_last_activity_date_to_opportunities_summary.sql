-- Migration: Add missing last_activity_date to opportunities_summary view
-- Issue: CTE computes last_activity_date but it was not exposed in SELECT clause
-- Fix: Add a.last_activity_date to the view output
-- Date: 2025-12-24

-- ============================================================================
-- LOG DEPENDENCIES BEFORE DROP
-- ============================================================================

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

-- ============================================================================
-- DROP EXISTING VIEW
-- ============================================================================

DROP VIEW IF EXISTS opportunities_summary CASCADE;

-- ============================================================================
-- CREATE VIEW WITH last_activity_date EXPOSED
-- ============================================================================

CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
-- CTE 1: Pre-compute activity statistics (1 table scan)
WITH activity_stats AS (
    SELECT
        opportunity_id,
        MAX(activity_date) AS last_activity_date,
        EXTRACT(DAY FROM (NOW() - MAX(activity_date)))::integer AS days_since_last_activity
    FROM activities
    WHERE deleted_at IS NULL
    GROUP BY opportunity_id
),

-- CTE 2: Pre-compute task counts (1 table scan)
task_stats AS (
    SELECT
        opportunity_id,
        COUNT(*) FILTER (
            WHERE COALESCE(completed, false) = false
        )::integer AS pending_task_count,
        COUNT(*) FILTER (
            WHERE COALESCE(completed, false) = false
            AND due_date < CURRENT_DATE
        )::integer AS overdue_task_count
    FROM tasks
    WHERE deleted_at IS NULL
    GROUP BY opportunity_id
),

-- CTE 3: Pre-compute next task using window function (1 table scan)
next_tasks AS (
    SELECT
        opportunity_id,
        id AS next_task_id,
        title AS next_task_title,
        due_date AS next_task_due_date,
        priority AS next_task_priority,
        ROW_NUMBER() OVER (
            PARTITION BY opportunity_id
            ORDER BY due_date ASC NULLS LAST, priority DESC
        ) AS rn
    FROM tasks
    WHERE deleted_at IS NULL
        AND COALESCE(completed, false) = false
        AND (snooze_until IS NULL OR snooze_until <= NOW())
),

-- CTE 4: Pre-aggregate products with JSONB (1 table scan)
product_aggregates AS (
    SELECT
        op.opportunity_id,
        jsonb_agg(
            jsonb_build_object(
                'id', op.id,
                'product_id_reference', op.product_id_reference,
                'product_name', op.product_name,
                'product_category', op.product_category,
                'principal_name', prod_org.name,
                'notes', op.notes
            ) ORDER BY op.created_at
        ) AS products
    FROM opportunity_products op
    LEFT JOIN products p ON op.product_id_reference = p.id
    LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id
    WHERE op.deleted_at IS NULL
    GROUP BY op.opportunity_id
)

-- Main query: LEFT JOIN all CTEs to opportunities
SELECT
    -- Base opportunity columns
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

    -- Computed: days in current stage
    EXTRACT(DAY FROM (NOW() - COALESCE(o.stage_changed_at, o.created_at)))::integer AS days_in_stage,

    -- From activity_stats CTE (FIX: now includes last_activity_date)
    a.last_activity_date,
    a.days_since_last_activity,

    -- From task_stats CTE
    COALESCE(ts.pending_task_count, 0) AS pending_task_count,
    COALESCE(ts.overdue_task_count, 0) AS overdue_task_count,

    -- From next_tasks CTE
    nt.next_task_id,
    nt.next_task_title,
    nt.next_task_due_date,
    nt.next_task_priority,

    -- Organization names
    cust_org.name AS customer_organization_name,
    prin_org.name AS principal_organization_name,
    dist_org.name AS distributor_organization_name,

    -- From product_aggregates CTE
    COALESCE(pa.products, '[]'::jsonb) AS products

FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id
LEFT JOIN activity_stats a ON a.opportunity_id = o.id
LEFT JOIN task_stats ts ON ts.opportunity_id = o.id
LEFT JOIN next_tasks nt ON nt.opportunity_id = o.id AND nt.rn = 1
LEFT JOIN product_aggregates pa ON pa.opportunity_id = o.id;

-- ============================================================================
-- RE-GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON opportunities_summary TO authenticated;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW opportunities_summary IS
    'Optimized opportunities view with computed fields. '
    'Includes: last_activity_date, days_since_last_activity, days_in_stage, '
    'pending/overdue task counts, next_task details, organization names, products. '
    'Uses CTEs for O(n+4) performance. SECURITY INVOKER enforces RLS.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    col_count INTEGER;
    expected_cols TEXT[] := ARRAY[
        'last_activity_date',
        'days_in_stage',
        'days_since_last_activity',
        'pending_task_count',
        'overdue_task_count',
        'next_task_id',
        'next_task_title',
        'next_task_due_date',
        'next_task_priority',
        'products'
    ];
    missing_cols TEXT[] := '{}';
    col TEXT;
BEGIN
    FOREACH col IN ARRAY expected_cols LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'opportunities_summary'
            AND column_name = col
        ) THEN
            missing_cols := array_append(missing_cols, col);
        END IF;
    END LOOP;

    IF array_length(missing_cols, 1) > 0 THEN
        RAISE EXCEPTION 'Missing columns in opportunities_summary: %', missing_cols;
    END IF;

    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'opportunities_summary';

    RAISE NOTICE 'SUCCESS: opportunities_summary has % columns including last_activity_date', col_count;
END $$;
