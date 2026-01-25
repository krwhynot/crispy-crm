-- Migration: Fix opportunities_summary Soft-Delete Filter
-- Issue: View missing WHERE o.deleted_at IS NULL filter on base table
-- Impact: Deleted opportunities appear in UI (CRITICAL - only broken view remaining)
-- Solution: Add soft-delete filter to main query and organization JOINs
-- Date: 2026-01-25

-- ============================================================================
-- DROP EXISTING VIEW
-- ============================================================================

DROP VIEW IF EXISTS opportunities_summary CASCADE;

-- ============================================================================
-- RECREATE VIEW WITH SOFT-DELETE FILTER
-- All CTEs already filter deleted_at - just need to add WHERE clause
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
-- Uses FILTER clause for efficient conditional aggregation
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
-- Gets ALL 4 columns in a single query instead of 4 separate queries!
-- Uses ROW_NUMBER() to pick the most urgent task per opportunity
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

    -- Computed: days in current stage (inline calculation - no subquery needed)
    EXTRACT(DAY FROM (NOW() - COALESCE(o.stage_changed_at, o.created_at)))::integer AS days_in_stage,

    -- From activity_stats CTE (was: correlated subquery)
    a.days_since_last_activity,

    -- From task_stats CTE (was: 2 separate correlated subqueries)
    COALESCE(ts.pending_task_count, 0) AS pending_task_count,
    COALESCE(ts.overdue_task_count, 0) AS overdue_task_count,

    -- From next_tasks CTE (was: 4 separate correlated subqueries with SAME filter!)
    nt.next_task_id,
    nt.next_task_title,
    nt.next_task_due_date,
    nt.next_task_priority,

    -- Organization names (existing JOINs - now with soft-delete filters)
    cust_org.name AS customer_organization_name,
    prin_org.name AS principal_organization_name,
    dist_org.name AS distributor_organization_name,

    -- From product_aggregates CTE (was: correlated subquery with JSONB)
    COALESCE(pa.products, '[]'::jsonb) AS products

FROM opportunities o
-- Organization JOINs with soft-delete filters (FIXED)
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id AND cust_org.deleted_at IS NULL
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id AND prin_org.deleted_at IS NULL
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id AND dist_org.deleted_at IS NULL
-- CTE JOINs (unchanged)
LEFT JOIN activity_stats a ON a.opportunity_id = o.id
LEFT JOIN task_stats ts ON ts.opportunity_id = o.id
LEFT JOIN next_tasks nt ON nt.opportunity_id = o.id AND nt.rn = 1
LEFT JOIN product_aggregates pa ON pa.opportunity_id = o.id
-- CRITICAL FIX: Filter out soft-deleted opportunities
WHERE o.deleted_at IS NULL;

-- ============================================================================
-- RE-GRANT PERMISSIONS (lost during DROP CASCADE)
-- ============================================================================

GRANT SELECT ON opportunities_summary TO authenticated;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW opportunities_summary IS
    'OPTIMIZED VIEW: Uses CTEs instead of correlated subqueries. '
    'Performance: O(n*8) reduced to O(n+4) - handles 1000+ opportunities without browser crash. '
    'Columns: days_in_stage, days_since_last_activity, pending/overdue task counts, '
    'next_task (id/title/due_date/priority), organization names, products JSONB array. '
    'SECURITY: Uses SECURITY INVOKER to enforce RLS policies on underlying tables. '
    'SOFT-DELETE: Filters deleted opportunities and organizations.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    col_count INTEGER;
    expected_cols TEXT[] := ARRAY[
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
    total_opps INTEGER;
    deleted_opps INTEGER;
    view_opps INTEGER;
BEGIN
    -- Check all computed columns exist
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

    -- Get total column count
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'opportunities_summary';

    RAISE NOTICE 'SUCCESS: opportunities_summary has % columns including all computed fields', col_count;
    RAISE NOTICE 'PERFORMANCE: View now uses CTEs for O(n+4) complexity instead of O(n*8)';

    -- Verify soft-delete filtering works
    SELECT COUNT(*) INTO total_opps FROM opportunities;
    SELECT COUNT(*) INTO deleted_opps FROM opportunities WHERE deleted_at IS NOT NULL;
    SELECT COUNT(*) INTO view_opps FROM opportunities_summary;

    RAISE NOTICE 'SOFT-DELETE CHECK: Base table has % opportunities (% deleted)', total_opps, deleted_opps;
    RAISE NOTICE 'SOFT-DELETE CHECK: View shows % opportunities', view_opps;

    IF view_opps != (total_opps - deleted_opps) THEN
        RAISE WARNING 'Soft-delete filtering may not be working correctly';
    ELSE
        RAISE NOTICE 'SOFT-DELETE CHECK: ✓ All deleted opportunities filtered correctly';
    END IF;
END $$;
