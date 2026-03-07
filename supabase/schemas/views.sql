-- ==========================================================================
-- Crispy CRM — Views (Reference Snapshot)
-- Last synced: 2026-03-04 | Migrations: 20260214003329..20260303120000
-- WARNING: Read-only reference. Do NOT execute directly. Use migrations.
-- Total: 24 named views + 3 camelCase compatibility aliases = 27 views
-- ==========================================================================

-- =========================================================================
-- SECTION 1: Summary Views (list/read workloads)
-- =========================================================================

-- --------------------------------------------------------------------------
-- 1. contacts_summary — Final: migration 20260214003333
-- --------------------------------------------------------------------------
CREATE VIEW contacts_summary WITH (security_invoker = true) AS
SELECT
  c.id, c.name, c.first_name, c.last_name, c.email, c.phone,
  c.title, c.department, c.address, c.city, c.state, c.postal_code,
  c.country, c.birthday, c.linkedin_url, c.twitter_handle,
  c.notes, c.sales_id, c.secondary_sales_id, c.created_at, c.updated_at,
  c.created_by, c.deleted_at, c.search_tsv, c.first_seen, c.last_seen,
  c.gender, c.tags, c.organization_id, c.status,
  o.name AS company_name,
  COALESCE(notes_count.cnt, 0) AS nb_notes,
  COALESCE(tasks_count.cnt, 0) AS nb_tasks,
  COALESCE(activities_count.cnt, 0) AS nb_activities
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt FROM contact_notes cn
  WHERE cn.contact_id = c.id AND cn.deleted_at IS NULL
) notes_count ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt FROM activities a
  WHERE a.contact_id = c.id AND a.activity_type = 'task' AND a.deleted_at IS NULL
) tasks_count ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS cnt FROM activities a
  WHERE a.contact_id = c.id AND a.deleted_at IS NULL
) activities_count ON true
WHERE c.deleted_at IS NULL;

-- --------------------------------------------------------------------------
-- 2. organizations_summary — Final: migration 20260214003333
-- --------------------------------------------------------------------------
CREATE VIEW organizations_summary WITH (security_invoker = on) AS
SELECT
  o.id, o.name, o.organization_type, o.org_scope, o.parent_organization_id,
  parent.name AS parent_organization_name,
  o.priority, o.segment_id, segments.name AS segment_name,
  o.sales_id, o.secondary_sales_id, o.employee_count, o.phone,
  o.website, o.postal_code, o.city, o.state, o.description,
  o.created_at, o.updated_at, o.deleted_at, o.email, o.linkedin_url,
  o.search_tsv, o.tags,
  COALESCE(child_branches.cnt, 0)::integer AS child_branch_count,
  COALESCE(branch_contacts.cnt, 0)::integer AS total_contacts_across_branches,
  COALESCE(branch_opportunities.cnt, 0)::integer AS total_opportunities_across_branches,
  COALESCE(direct_opportunities.cnt, 0)::integer AS nb_opportunities,
  COALESCE(direct_contacts.cnt, 0)::integer AS nb_contacts,
  last_opp_activity.val AS last_opportunity_activity,
  COALESCE(org_notes.cnt, 0)::integer AS nb_notes
FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id AND parent.deleted_at IS NULL
LEFT JOIN segments ON o.segment_id = segments.id
LEFT JOIN LATERAL (SELECT COUNT(*)::integer AS cnt FROM organizations children WHERE children.parent_organization_id = o.id AND children.deleted_at IS NULL) child_branches ON true
LEFT JOIN LATERAL (SELECT COUNT(DISTINCT c.id)::integer AS cnt FROM organizations children LEFT JOIN contacts c ON c.organization_id = children.id WHERE children.parent_organization_id = o.id AND children.deleted_at IS NULL AND c.deleted_at IS NULL) branch_contacts ON true
LEFT JOIN LATERAL (SELECT COUNT(DISTINCT opp.id)::integer AS cnt FROM organizations children LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id WHERE children.parent_organization_id = o.id AND children.deleted_at IS NULL AND opp.deleted_at IS NULL) branch_opportunities ON true
LEFT JOIN LATERAL (SELECT COUNT(*)::integer AS cnt FROM opportunities WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL) direct_opportunities ON true
LEFT JOIN LATERAL (SELECT COUNT(*)::integer AS cnt FROM contacts WHERE contacts.organization_id = o.id AND contacts.deleted_at IS NULL) direct_contacts ON true
LEFT JOIN LATERAL (SELECT MAX(opportunities.updated_at) AS val FROM opportunities WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL) last_opp_activity ON true
LEFT JOIN LATERAL (SELECT COUNT(*)::integer AS cnt FROM organization_notes WHERE organization_notes.organization_id = o.id AND organization_notes.deleted_at IS NULL) org_notes ON true
WHERE o.deleted_at IS NULL;

-- --------------------------------------------------------------------------
-- 3. opportunities_summary — Final: migration 20260214003330
-- --------------------------------------------------------------------------
CREATE VIEW opportunities_summary WITH (security_invoker = on) AS
SELECT
  o.id, o.name, o.description, o.stage, o.status, o.priority, o.index,
  o.estimated_close_date, o.actual_close_date,
  o.customer_organization_id, o.principal_organization_id,
  o.distributor_organization_id, o.founding_interaction_id,
  o.stage_manual, o.status_manual, o.next_action, o.next_action_date,
  o.competition, o.decision_criteria, o.contact_ids,
  o.opportunity_owner_id, o.created_at, o.updated_at, o.created_by,
  o.deleted_at, o.search_tsv, o.tags, o.account_manager_id,
  o.lead_source, o.updated_by, o.campaign, o.related_opportunity_id,
  o.primary_contact_id,
  cust_org.name AS customer_organization_name,
  prin_org.name AS principal_organization_name,
  dist_org.name AS distributor_organization_name,
  primary_contact.first_name || ' ' || primary_contact.last_name AS primary_contact_name,
  activity_stats.last_activity_date,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', op.id, 'product_id_reference', op.product_id_reference,
      'product_name', op.product_name, 'product_category', op.product_category,
      'principal_name', prod_org.name, 'notes', op.notes
    ) ORDER BY op.created_at)
    FROM opportunity_products op
    LEFT JOIN products p ON op.product_id_reference = p.id AND p.deleted_at IS NULL
    LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id AND prod_org.deleted_at IS NULL
    WHERE op.opportunity_id = o.id AND op.deleted_at IS NULL),
    '[]'::jsonb
  ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id AND cust_org.deleted_at IS NULL
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id AND prin_org.deleted_at IS NULL
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id AND dist_org.deleted_at IS NULL
LEFT JOIN contacts primary_contact ON o.primary_contact_id = primary_contact.id AND primary_contact.deleted_at IS NULL
LEFT JOIN (
  SELECT opportunity_id, MAX(activity_date) AS last_activity_date
  FROM activities WHERE deleted_at IS NULL GROUP BY opportunity_id
) activity_stats ON activity_stats.opportunity_id = o.id
WHERE o.deleted_at IS NULL;

-- --------------------------------------------------------------------------
-- 4. activities_summary — Final: migration 20260224120000
-- --------------------------------------------------------------------------
CREATE VIEW activities_summary WITH (security_invoker = true) AS
SELECT
  a.id, a.type, a.subject, a.description, a.activity_date, a.duration_minutes,
  a.contact_id, a.organization_id, a.opportunity_id,
  a.follow_up_required, a.follow_up_date, a.outcome,
  a.created_at, a.updated_at, a.created_by, a.updated_by, a.deleted_at,
  a.activity_type,
  a.due_date, a.reminder_date, a.completed, a.completed_at, a.priority,
  a.sales_id, a.snooze_until, a.overdue_notified_at, a.related_task_id,
  a.sample_status, a.sentiment,
  s.first_name AS creator_first_name, s.last_name AS creator_last_name,
  s.email AS creator_email, s.avatar_url AS creator_avatar_url,
  c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
  o.name AS organization_name,
  opp.name AS opportunity_name,
  opp.principal_organization_id AS principal_organization_id,
  prin_org.name AS principal_organization_name,
  opp.campaign AS opportunity_campaign,
  opp.deleted_at AS opportunity_deleted_at
FROM activities a
LEFT JOIN sales s ON a.created_by = s.id AND s.deleted_at IS NULL
LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
LEFT JOIN organizations o ON a.organization_id = o.id AND o.deleted_at IS NULL
LEFT JOIN opportunities opp ON a.opportunity_id = opp.id
LEFT JOIN organizations prin_org ON opp.principal_organization_id = prin_org.id
WHERE a.deleted_at IS NULL;

-- --------------------------------------------------------------------------
-- 5. products_summary — Final: base migration
-- --------------------------------------------------------------------------
-- Products with feature counts and distributor counts

-- --------------------------------------------------------------------------
-- 6. product_distributors_summary — Final: base migration
-- --------------------------------------------------------------------------
-- Products + distributor pricing summary

-- =========================================================================
-- SECTION 2: Account Manager Views
-- =========================================================================

-- --------------------------------------------------------------------------
-- 7. contacts_with_account_manager — Final: migration 20260214003333
-- --------------------------------------------------------------------------
CREATE VIEW contacts_with_account_manager WITH (security_invoker = on) AS
SELECT
  c.*,
  COALESCE(s.first_name || COALESCE(' ' || s.last_name, ''), 'Unassigned') AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user,
  COALESCE(s2.first_name || COALESCE(' ' || s2.last_name, ''), NULL) AS secondary_account_manager_name,
  s2.user_id IS NOT NULL AS secondary_account_manager_is_user
FROM contacts c
LEFT JOIN sales s ON c.sales_id = s.id
LEFT JOIN sales s2 ON c.secondary_sales_id = s2.id;

-- --------------------------------------------------------------------------
-- 8. organizations_with_account_manager — Final: migration 20260214003333
-- --------------------------------------------------------------------------
CREATE VIEW organizations_with_account_manager WITH (security_invoker = on) AS
SELECT
  o.*,
  COALESCE(s.first_name || COALESCE(' ' || s.last_name, ''), 'Unassigned') AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user,
  COALESCE(s2.first_name || COALESCE(' ' || s2.last_name, ''), NULL) AS secondary_account_manager_name,
  s2.user_id IS NOT NULL AS secondary_account_manager_is_user
FROM organizations o
LEFT JOIN sales s ON o.sales_id = s.id
LEFT JOIN sales s2 ON o.secondary_sales_id = s2.id;

-- =========================================================================
-- SECTION 3: Pipeline & Dashboard Views
-- =========================================================================

-- --------------------------------------------------------------------------
-- 9. principal_pipeline_summary — Final: migration 20260214003333
-- --------------------------------------------------------------------------
CREATE VIEW principal_pipeline_summary WITH (security_invoker = true) AS
SELECT
  o.id, o.id AS principal_id, o.name AS principal_name,
  o.created_at, o.updated_at, o.deleted_at,
  count(DISTINCT opp.id) FILTER (WHERE opp.stage NOT IN ('closed_won', 'closed_lost')) AS total_pipeline,
  count(DISTINCT CASE WHEN a.activity_date >= CURRENT_DATE - '7 days'::interval AND opp.stage NOT IN ('closed_won', 'closed_lost') THEN opp.id END) AS active_this_week,
  count(DISTINCT CASE WHEN a.activity_date >= CURRENT_DATE - '14 days'::interval AND a.activity_date < CURRENT_DATE - '7 days'::interval AND opp.stage NOT IN ('closed_won', 'closed_lost') THEN opp.id END) AS active_last_week,
  -- momentum: 'stale' | 'increasing' | 'decreasing' | 'steady'
  CASE ... END AS momentum,
  (SELECT task.subject FROM activities task JOIN opportunities sub_opp ON task.opportunity_id = sub_opp.id
   WHERE sub_opp.principal_organization_id = o.id AND task.activity_type = 'task'
     AND task.completed = false AND task.deleted_at IS NULL AND sub_opp.deleted_at IS NULL
   ORDER BY task.due_date NULLS LAST LIMIT 1) AS next_action_summary,
  (SELECT opportunities.account_manager_id FROM opportunities
   WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL
     AND opportunities.account_manager_id IS NOT NULL
   ORDER BY opportunities.created_at DESC LIMIT 1) AS sales_id,
  (SELECT opportunities.opportunity_owner_id FROM opportunities
   WHERE opportunities.principal_organization_id = o.id AND opportunities.deleted_at IS NULL
     AND opportunities.opportunity_owner_id IS NOT NULL
   ORDER BY opportunities.created_at DESC LIMIT 1) AS opportunity_owner_id,
  -- Task metrics (30-day window)
  (SELECT count(*) FROM activities t JOIN opportunities t_opp ON t.opportunity_id = t_opp.id
   WHERE t_opp.principal_organization_id = o.id AND t.activity_type = 'task'
     AND t.completed = true AND t.completed_at >= CURRENT_DATE - '30 days'::interval
     AND t.deleted_at IS NULL AND t_opp.deleted_at IS NULL) AS completed_tasks_30d,
  (SELECT count(*) FROM activities t JOIN opportunities t_opp ON t.opportunity_id = t_opp.id
   WHERE t_opp.principal_organization_id = o.id AND t.activity_type = 'task'
     AND t.deleted_at IS NULL AND t_opp.deleted_at IS NULL
     AND (t.due_date >= CURRENT_DATE - '30 days'::interval OR t.created_at >= CURRENT_DATE - '30 days'::interval)) AS total_tasks_30d
FROM organizations o
LEFT JOIN opportunities opp ON o.id = opp.principal_organization_id AND opp.deleted_at IS NULL
LEFT JOIN activities a ON opp.id = a.opportunity_id AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal' AND o.deleted_at IS NULL
GROUP BY o.id, o.name, o.created_at, o.updated_at, o.deleted_at;

-- --------------------------------------------------------------------------
-- 10. principal_opportunities — Opportunities grouped by principal
-- --------------------------------------------------------------------------
-- Base migration — counts/stages per principal

-- --------------------------------------------------------------------------
-- 11. dashboard_pipeline_summary — Per-stage opportunity counts
-- --------------------------------------------------------------------------
-- Base migration — from dashboard_snapshots

-- --------------------------------------------------------------------------
-- 12. dashboard_principal_summary — Principal-level metrics
-- --------------------------------------------------------------------------
-- Base migration — from dashboard_snapshots

-- =========================================================================
-- SECTION 4: Timeline & Activity Views
-- =========================================================================

-- --------------------------------------------------------------------------
-- 13. activities_with_task_details — Activities LEFT JOIN related_task
-- --------------------------------------------------------------------------
-- Base migration

-- --------------------------------------------------------------------------
-- 14. entity_timeline — UNION of stage changes, notes, activities, milestones
-- --------------------------------------------------------------------------
-- Base migration

-- --------------------------------------------------------------------------
-- 15. opportunity_stage_changes — Audit trail stage change records
-- --------------------------------------------------------------------------
-- Base migration — filtered view of audit_trail

-- --------------------------------------------------------------------------
-- 16. priority_tasks — Upcoming/overdue tasks with priority ordering
-- --------------------------------------------------------------------------
-- Base migration

-- =========================================================================
-- SECTION 5: Authorization & Reference Views
-- =========================================================================

-- --------------------------------------------------------------------------
-- 17. authorization_status — Distributor-principal-product authorization check
-- --------------------------------------------------------------------------
-- Base migration

-- --------------------------------------------------------------------------
-- 18. organization_primary_distributor — Primary distributor lookup
-- --------------------------------------------------------------------------
-- Base migration

-- =========================================================================
-- SECTION 6: Choice / Distinct Views (for dropdowns/filters)
-- =========================================================================

-- --------------------------------------------------------------------------
-- 19. campaign_choices — DISTINCT campaigns WHERE deleted_at IS NULL
-- --------------------------------------------------------------------------
-- Base migration

-- --------------------------------------------------------------------------
-- 20. distinct_opportunities_campaigns — DISTINCT campaign values
-- --------------------------------------------------------------------------
-- Base migration

-- --------------------------------------------------------------------------
-- 21. distinct_product_categories — DISTINCT product categories
-- --------------------------------------------------------------------------
-- Base migration

-- =========================================================================
-- SECTION 7: camelCase Compatibility Aliases (3)
-- =========================================================================

-- --------------------------------------------------------------------------
-- 22. "contactNotes" — Alias for contact_notes
-- --------------------------------------------------------------------------
CREATE VIEW "contactNotes" AS SELECT * FROM contact_notes;

-- --------------------------------------------------------------------------
-- 23. "opportunityNotes" — Alias for opportunity_notes
-- --------------------------------------------------------------------------
CREATE VIEW "opportunityNotes" AS SELECT * FROM opportunity_notes;

-- --------------------------------------------------------------------------
-- 24. "organizationNotes" — Alias for organization_notes
-- --------------------------------------------------------------------------
CREATE VIEW "organizationNotes" AS SELECT * FROM organization_notes;
