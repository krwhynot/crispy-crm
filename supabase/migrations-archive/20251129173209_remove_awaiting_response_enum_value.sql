-- ============================================================================
-- Migration: Remove deprecated 'awaiting_response' from opportunity_stage enum
-- PRD Reference: Section 5.3 - Pipeline reduced from 8 to 7 stages
-- Prerequisite: Migration 20251128070000 already migrated all data to feedback_logged
-- ============================================================================
--
-- SAFETY CHECKS (verified before creating this migration):
--   SELECT COUNT(*) FROM opportunities WHERE stage = 'awaiting_response';
--   Result: 0 records
--
-- ============================================================================
-- POSTGRESQL ENUM MIGRATION PATTERN
-- ============================================================================
-- PostgreSQL does not support DROP VALUE from enum types directly.
-- We must recreate the enum type without the deprecated value.
--
-- DEPENDENCY CASCADE ORDER (critical - follow this exact sequence):
--   1. Safety check - verify no records use the deprecated value
--   2. Drop dependent VIEWS (they reference the column type)
--   3. Drop partial INDEXES with WHERE clauses referencing enum values
--   4. Disable TRIGGERS that compare OLD.column vs NEW.column
--   5. Create new enum type (with _v2 suffix)
--   6. ALTER COLUMN TYPE using text cast: column::text::new_enum
--   7. Drop old enum, rename new enum to original name
--   8. Re-enable triggers
--   9. Recreate indexes
--  10. Recreate views
--
-- ROLLBACK STRATEGY:
--   This migration is NOT easily reversible. To rollback:
--   1. Create a new migration that adds back the enum value
--   2. Follow the same cascade pattern in reverse
--   3. Note: Adding enum values is simpler (ALTER TYPE ... ADD VALUE)
--
-- DEPENDENT OBJECTS (discovered via pg_depend queries):
--   Views:
--     - dashboard_pipeline_summary
--     - dashboard_principal_summary
--     - opportunities_summary
--     - principal_opportunities
--     - principal_pipeline_summary
--   Indexes (with enum in WHERE clause):
--     - idx_opportunities_stage
--     - idx_opportunities_closed_stage_reason
--   Triggers (compare OLD.stage vs NEW.stage):
--     - trigger_update_opportunity_stage_changed_at
--     - audit_opportunities_changes
--     - check_concurrent_opportunity_update
-- ============================================================================

-- ============================================================================
-- STEP 1: Safety check - abort if any records still use deprecated value
-- ============================================================================
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count
  FROM opportunities
  WHERE stage = 'awaiting_response';

  IF record_count > 0 THEN
    RAISE EXCEPTION 'Cannot remove enum value: % opportunities still use awaiting_response. Run migration 20251128070000 first.', record_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop dependent views (will recreate after enum change)
-- Views reference the column type and block ALTER COLUMN TYPE
-- ============================================================================
DROP VIEW IF EXISTS dashboard_pipeline_summary CASCADE;
DROP VIEW IF EXISTS dashboard_principal_summary CASCADE;
DROP VIEW IF EXISTS opportunities_summary CASCADE;
DROP VIEW IF EXISTS principal_opportunities CASCADE;
DROP VIEW IF EXISTS principal_pipeline_summary CASCADE;

-- ============================================================================
-- STEP 3: Drop partial indexes with enum values in WHERE clause
-- Indexes like WHERE stage IN ('closed_won', 'closed_lost') block type change
-- Discovery query:
--   SELECT indexname, indexdef FROM pg_indexes
--   WHERE tablename = 'opportunities' AND indexdef LIKE '%stage%';
-- ============================================================================
DROP INDEX IF EXISTS idx_opportunities_closed_stage_reason;
DROP INDEX IF EXISTS idx_opportunities_stage;

-- ============================================================================
-- STEP 4: Disable triggers that compare OLD.stage vs NEW.stage
-- Triggers compiled with old enum type cause "operator does not exist" errors
-- Discovery query:
--   SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger
--   WHERE tgrelid = 'opportunities'::regclass AND NOT tgisinternal;
-- ============================================================================
ALTER TABLE opportunities DISABLE TRIGGER trigger_update_opportunity_stage_changed_at;
ALTER TABLE opportunities DISABLE TRIGGER audit_opportunities_changes;
ALTER TABLE opportunities DISABLE TRIGGER check_concurrent_opportunity_update;

-- ============================================================================
-- STEP 5: Create new enum type without 'awaiting_response'
-- ============================================================================
CREATE TYPE opportunity_stage_v2 AS ENUM (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
);

-- ============================================================================
-- STEP 6: Update opportunities table to use new enum type
-- The text cast (stage::text::opportunity_stage_v2) is required
-- ============================================================================
-- Remove default temporarily
ALTER TABLE opportunities
  ALTER COLUMN stage DROP DEFAULT;

-- Convert column to new enum type
ALTER TABLE opportunities
  ALTER COLUMN stage TYPE opportunity_stage_v2
  USING stage::text::opportunity_stage_v2;

-- Restore default
ALTER TABLE opportunities
  ALTER COLUMN stage SET DEFAULT 'new_lead'::opportunity_stage_v2;

-- ============================================================================
-- STEP 7: Drop old enum type and rename new one
-- ============================================================================
DROP TYPE opportunity_stage;
ALTER TYPE opportunity_stage_v2 RENAME TO opportunity_stage;

-- ============================================================================
-- STEP 8: Update default value reference to use renamed type
-- ============================================================================
ALTER TABLE opportunities
  ALTER COLUMN stage SET DEFAULT 'new_lead'::opportunity_stage;

-- ============================================================================
-- STEP 9: Add documentation
-- ============================================================================
COMMENT ON TYPE opportunity_stage IS
  'Pipeline stages (7): new_lead -> initial_outreach -> sample_visit_offered -> feedback_logged -> demo_scheduled -> closed_won/closed_lost. Removed awaiting_response per PRD v1.18.';

-- ============================================================================
-- STEP 10: Re-enable triggers (now compatible with renamed enum type)
-- ============================================================================
ALTER TABLE opportunities ENABLE TRIGGER trigger_update_opportunity_stage_changed_at;
ALTER TABLE opportunities ENABLE TRIGGER audit_opportunities_changes;
ALTER TABLE opportunities ENABLE TRIGGER check_concurrent_opportunity_update;

-- ============================================================================
-- STEP 11: Recreate indexes with new enum type
-- ============================================================================
CREATE INDEX idx_opportunities_stage
ON opportunities(stage)
WHERE deleted_at IS NULL;

CREATE INDEX idx_opportunities_closed_stage_reason
ON opportunities(stage, win_reason, loss_reason)
WHERE stage IN ('closed_won', 'closed_lost');

-- ============================================================================
-- STEP 12: Recreate dependent views
-- ============================================================================

-- View: dashboard_pipeline_summary
CREATE VIEW dashboard_pipeline_summary AS
SELECT account_manager_id,
    stage,
    count(*) AS count,
    count(
        CASE
            WHEN ((EXTRACT(epoch FROM (now() - created_at)) / (86400)::numeric) >= (30)::numeric) THEN 1
            ELSE NULL::integer
        END) AS stuck_count,
    ( SELECT count(*) AS count
           FROM opportunities
          WHERE ((opportunities.account_manager_id = o.account_manager_id) AND (opportunities.status = 'active'::opportunity_status))) AS total_active,
    ( SELECT count(*) AS count
           FROM opportunities
          WHERE ((opportunities.account_manager_id = o.account_manager_id) AND (opportunities.status = 'active'::opportunity_status) AND ((EXTRACT(epoch FROM (now() - opportunities.created_at)) / (86400)::numeric) >= (30)::numeric))) AS total_stuck
   FROM opportunities o
  WHERE (status = 'active'::opportunity_status)
  GROUP BY account_manager_id, stage;

-- View: dashboard_principal_summary
CREATE VIEW dashboard_principal_summary AS
WITH principal_opportunities AS (
         SELECT o.principal_organization_id,
            o.id AS opportunity_id,
            o.stage,
            o.estimated_close_date,
            o.account_manager_id,
            (EXTRACT(epoch FROM (now() - o.created_at)) / (86400)::numeric) AS days_in_stage
           FROM opportunities o
          WHERE ((o.status = 'active'::opportunity_status) AND (o.principal_organization_id IS NOT NULL))
        ), principal_activities AS (
         SELECT po.principal_organization_id,
            count(a.id) AS weekly_activity_count
           FROM (principal_opportunities po
             LEFT JOIN activities a ON (((a.opportunity_id = po.opportunity_id) AND (a.created_at >= (now() - '7 days'::interval)))))
          GROUP BY po.principal_organization_id
        ), principal_reps AS (
         SELECT po.principal_organization_id,
            array_agg(DISTINCT ((s.first_name || ' '::text) || s.last_name) ORDER BY ((s.first_name || ' '::text) || s.last_name)) AS assigned_reps
           FROM (principal_opportunities po
             JOIN sales s ON ((s.id = po.account_manager_id)))
          GROUP BY po.principal_organization_id
        ), principal_aggregates AS (
         SELECT po.principal_organization_id,
            count(DISTINCT po.opportunity_id) AS opportunity_count,
            max(po.days_in_stage) AS max_days_in_stage,
            bool_or((po.days_in_stage > (14)::numeric)) AS is_stuck,
            max(a.created_at) AS last_activity_date,
            ( SELECT a2.type
                   FROM (activities a2
                     JOIN principal_opportunities po2 ON (((a2.opportunity_id = po2.opportunity_id) AND (po2.principal_organization_id = po.principal_organization_id))))
                  ORDER BY a2.created_at DESC
                 LIMIT 1) AS last_activity_type,
            (EXTRACT(epoch FROM (now() - max(a.created_at))) / (86400)::numeric) AS days_since_last_activity
           FROM (principal_opportunities po
             LEFT JOIN activities a ON ((a.opportunity_id = po.opportunity_id)))
          GROUP BY po.principal_organization_id
        )
 SELECT org.id,
    org.name AS principal_name,
    pa.opportunity_count,
    COALESCE(pact.weekly_activity_count, (0)::bigint) AS weekly_activity_count,
    COALESCE(prep.assigned_reps, ARRAY[]::text[]) AS assigned_reps,
    pa.last_activity_date,
    pa.last_activity_type,
    pa.days_since_last_activity,
        CASE
            WHEN (pa.days_since_last_activity IS NULL) THEN 'urgent'::text
            WHEN (pa.days_since_last_activity > (7)::numeric) THEN 'urgent'::text
            WHEN (pa.days_since_last_activity > (3)::numeric) THEN 'warning'::text
            ELSE 'good'::text
        END AS status_indicator,
    pa.max_days_in_stage,
    pa.is_stuck,
    NULL::text AS next_action,
    (((COALESCE(pa.days_since_last_activity, (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN pa.is_stuck THEN 50
            ELSE 0
        END)::numeric) - ((pa.opportunity_count)::numeric * 0.5)) AS priority_score
   FROM (((organizations org
     JOIN principal_aggregates pa ON ((pa.principal_organization_id = org.id)))
     LEFT JOIN principal_activities pact ON ((pact.principal_organization_id = org.id)))
     LEFT JOIN principal_reps prep ON ((prep.principal_organization_id = org.id)))
  WHERE (org.organization_type = 'principal'::organization_type)
  ORDER BY (((COALESCE(pa.days_since_last_activity, (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN pa.is_stuck THEN 50
            ELSE 0
        END)::numeric) - ((pa.opportunity_count)::numeric * 0.5));

-- View: opportunities_summary
CREATE VIEW opportunities_summary AS
SELECT o.id,
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
    cust_org.name AS customer_organization_name,
    prin_org.name AS principal_organization_name,
    dist_org.name AS distributor_organization_name,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', op.id, 'product_id_reference', op.product_id_reference, 'product_name', op.product_name, 'product_category', op.product_category, 'principal_name', prod_org.name, 'notes', op.notes) ORDER BY op.created_at) AS jsonb_agg
           FROM ((opportunity_products op
             LEFT JOIN products p ON ((op.product_id_reference = p.id)))
             LEFT JOIN organizations prod_org ON ((p.principal_id = prod_org.id)))
          WHERE (op.opportunity_id = o.id)), '[]'::jsonb) AS products
   FROM (((opportunities o
     LEFT JOIN organizations cust_org ON ((o.customer_organization_id = cust_org.id)))
     LEFT JOIN organizations prin_org ON ((o.principal_organization_id = prin_org.id)))
     LEFT JOIN organizations dist_org ON ((o.distributor_organization_id = dist_org.id)));

-- View: principal_opportunities
CREATE VIEW principal_opportunities AS
SELECT o.id,
    o.id AS opportunity_id,
    o.name AS opportunity_name,
    o.stage,
    o.estimated_close_date,
    o.updated_at AS last_activity,
    o.customer_organization_id,
    org.name AS customer_name,
    p.id AS principal_id,
    p.name AS principal_name,
    o.opportunity_owner_id AS sales_id,
    (EXTRACT(epoch FROM (now() - o.updated_at)) / (86400)::numeric) AS days_since_activity,
        CASE
            WHEN ((EXTRACT(epoch FROM (now() - o.updated_at)) / (86400)::numeric) < (7)::numeric) THEN 'active'::text
            WHEN ((EXTRACT(epoch FROM (now() - o.updated_at)) / (86400)::numeric) < (14)::numeric) THEN 'cooling'::text
            ELSE 'at_risk'::text
        END AS health_status
   FROM ((opportunities o
     LEFT JOIN organizations org ON ((o.customer_organization_id = org.id)))
     LEFT JOIN organizations p ON ((o.principal_organization_id = p.id)))
  WHERE ((o.deleted_at IS NULL) AND (o.stage <> 'closed_lost'::opportunity_stage) AND (p.organization_type = 'principal'::organization_type))
  ORDER BY p.name, o.stage;

-- View: principal_pipeline_summary
CREATE VIEW principal_pipeline_summary AS
SELECT o.id,
    o.id AS principal_id,
    o.name AS principal_name,
    count(DISTINCT opp.id) FILTER (WHERE (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage]))) AS total_pipeline,
    count(DISTINCT
        CASE
            WHEN ((a.activity_date >= (CURRENT_DATE - '7 days'::interval)) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage]))) THEN opp.id
            ELSE NULL::bigint
        END) AS active_this_week,
    count(DISTINCT
        CASE
            WHEN ((a.activity_date >= (CURRENT_DATE - '14 days'::interval)) AND (a.activity_date < (CURRENT_DATE - '7 days'::interval)) AND (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage]))) THEN opp.id
            ELSE NULL::bigint
        END) AS active_last_week,
        CASE
            WHEN ((count(DISTINCT opp.id) FILTER (WHERE (opp.stage <> ALL (ARRAY['closed_won'::opportunity_stage, 'closed_lost'::opportunity_stage]))) > 0) AND (count(DISTINCT
            CASE
                WHEN (a.activity_date >= (CURRENT_DATE - '14 days'::interval)) THEN opp.id
                ELSE NULL::bigint
            END) = 0)) THEN 'stale'::text
            WHEN (count(DISTINCT
            CASE
                WHEN (a.activity_date >= (CURRENT_DATE - '7 days'::interval)) THEN opp.id
                ELSE NULL::bigint
            END) > count(DISTINCT
            CASE
                WHEN ((a.activity_date >= (CURRENT_DATE - '14 days'::interval)) AND (a.activity_date < (CURRENT_DATE - '7 days'::interval))) THEN opp.id
                ELSE NULL::bigint
            END)) THEN 'increasing'::text
            WHEN (count(DISTINCT
            CASE
                WHEN (a.activity_date >= (CURRENT_DATE - '7 days'::interval)) THEN opp.id
                ELSE NULL::bigint
            END) < count(DISTINCT
            CASE
                WHEN ((a.activity_date >= (CURRENT_DATE - '14 days'::interval)) AND (a.activity_date < (CURRENT_DATE - '7 days'::interval))) THEN opp.id
                ELSE NULL::bigint
            END)) THEN 'decreasing'::text
            ELSE 'steady'::text
        END AS momentum,
    ( SELECT t.title
           FROM (tasks t
             JOIN opportunities sub_opp ON ((t.opportunity_id = sub_opp.id)))
          WHERE ((sub_opp.principal_organization_id = o.id) AND (t.completed = false) AND (sub_opp.deleted_at IS NULL))
          ORDER BY t.due_date
         LIMIT 1) AS next_action_summary,
    ( SELECT opportunities.account_manager_id
           FROM opportunities
          WHERE ((opportunities.principal_organization_id = o.id) AND (opportunities.deleted_at IS NULL) AND (opportunities.account_manager_id IS NOT NULL))
          ORDER BY opportunities.created_at DESC
         LIMIT 1) AS sales_id
   FROM ((organizations o
     LEFT JOIN opportunities opp ON (((o.id = opp.principal_organization_id) AND (opp.deleted_at IS NULL))))
     LEFT JOIN activities a ON (((opp.id = a.opportunity_id) AND (a.deleted_at IS NULL))))
  WHERE ((o.organization_type = 'principal'::organization_type) AND (o.deleted_at IS NULL))
  GROUP BY o.id, o.name;

-- ============================================================================
-- VERIFICATION QUERIES (run manually after migration):
-- ============================================================================
--
-- 1. Verify enum has 7 values without 'awaiting_response':
--   SELECT enumlabel FROM pg_enum
--   WHERE enumtypid = 'opportunity_stage'::regtype
--   ORDER BY enumsortorder;
--   Expected: new_lead, initial_outreach, sample_visit_offered, feedback_logged,
--             demo_scheduled, closed_won, closed_lost
--
-- 2. Verify indexes were recreated:
--   SELECT indexname FROM pg_indexes
--   WHERE tablename = 'opportunities' AND indexname LIKE 'idx_opportunities%';
--
-- 3. Verify triggers are enabled:
--   SELECT tgname, tgenabled FROM pg_trigger
--   WHERE tgrelid = 'opportunities'::regclass
--   AND tgname IN ('trigger_update_opportunity_stage_changed_at',
--                  'audit_opportunities_changes',
--                  'check_concurrent_opportunity_update');
--   Expected: tgenabled = 'O' (origin) for all three
--
-- 4. Verify views exist:
--   SELECT viewname FROM pg_views
--   WHERE schemaname = 'public'
--   AND viewname IN ('dashboard_pipeline_summary', 'dashboard_principal_summary',
--                    'opportunities_summary', 'principal_opportunities',
--                    'principal_pipeline_summary');
--   Expected: 5 rows
-- ============================================================================
