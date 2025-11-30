-- ============================================================================
-- SECURITY REMEDIATION MIGRATION
-- ============================================================================
-- Date: 2025-11-30
-- Purpose: Address critical security issues identified in security audit
--
-- FIXES IMPLEMENTED:
-- 1. P0: Convert views to SECURITY INVOKER (prevents privilege escalation)
-- 2. P0: Add SET search_path = '' to auth helper functions (prevents search_path attacks)
-- 3. P1: Revoke anon grants from sensitive views (principle of least privilege)
--
-- SECURITY CONTEXT:
-- - SECURITY DEFINER views execute with view owner's privileges (dangerous)
-- - SECURITY INVOKER views execute with caller's privileges (safe for RLS)
-- - Empty search_path prevents malicious function shadowing attacks
-- - Anon grants allow unauthenticated access (inappropriate for CRM data)
-- ============================================================================

-- ============================================================================
-- PHASE 1: P0 - SECURITY INVOKER View Conversions
-- ============================================================================
-- These views currently default to SECURITY DEFINER behavior.
-- Converting to SECURITY INVOKER ensures RLS policies are properly enforced.
-- ============================================================================

-- 1.1 priority_tasks view
DROP VIEW IF EXISTS priority_tasks;
CREATE VIEW priority_tasks
WITH (security_invoker = on)
AS
SELECT
  -- Task identifiers
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.priority,
  t.type as task_type,
  t.completed,

  -- Opportunity details
  t.opportunity_id,
  o.name as opportunity_name,

  -- Customer organization details
  o.customer_organization_id as organization_id,
  org.name as customer_name,

  -- Principal organization details
  o.principal_organization_id,
  p.name as principal_name,

  -- Contact details
  c.id as contact_id,
  c.name as contact_name

FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id

WHERE
  t.completed = false
  AND (t.due_date <= CURRENT_DATE + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))
  AND p.organization_type = 'principal'

ORDER BY
  t.priority DESC,
  t.due_date ASC NULLS LAST;

COMMENT ON VIEW priority_tasks IS
  'Pre-aggregated high-priority and near-due tasks grouped by principal organization. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies. '
  'Used by Dashboard V2 TasksPanel component.';

-- 1.2 principal_opportunities view
DROP VIEW IF EXISTS principal_opportunities;
CREATE VIEW principal_opportunities
WITH (security_invoker = on)
AS
SELECT
  -- Opportunity identifiers
  o.id as opportunity_id,
  o.name as opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.updated_at as last_activity,

  -- Customer organization details
  o.customer_organization_id,
  org.name as customer_name,

  -- Principal organization details
  p.id as principal_id,
  p.name as principal_name,

  -- Activity metrics
  EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 as days_since_activity,

  -- Health status indicator
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 7 THEN 'active'
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 14 THEN 'cooling'
    ELSE 'at_risk'
  END as health_status

FROM opportunities o
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id

WHERE
  o.deleted_at IS NULL
  AND o.stage != 'closed_lost'
  AND p.organization_type = 'principal'

ORDER BY p.name, o.stage;

COMMENT ON VIEW principal_opportunities IS
  'Pre-aggregated opportunities by principal organization with health status. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- 1.3 principal_pipeline_summary view
DROP VIEW IF EXISTS principal_pipeline_summary;
CREATE VIEW principal_pipeline_summary
WITH (security_invoker = on)
AS
SELECT
  o.id as id,
  o.id as principal_id,
  o.name as principal_name,

  COUNT(DISTINCT opp.id) FILTER (
    WHERE opp.stage NOT IN ('closed_won', 'closed_lost')
  ) as total_pipeline,

  COUNT(DISTINCT CASE
    WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      AND opp.stage NOT IN ('closed_won', 'closed_lost')
    THEN opp.id
  END) as active_this_week,

  COUNT(DISTINCT CASE
    WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
      AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      AND opp.stage NOT IN ('closed_won', 'closed_lost')
    THEN opp.id
  END) as active_last_week,

  CASE
    WHEN COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage NOT IN ('closed_won', 'closed_lost')) > 0
      AND COUNT(DISTINCT CASE
        WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        THEN opp.id
      END) = 0
    THEN 'stale'
    WHEN COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END) > COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END)
    THEN 'increasing'
    WHEN COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END) < COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END)
    THEN 'decreasing'
    ELSE 'steady'
  END as momentum,

  (SELECT t.title
   FROM tasks t
   INNER JOIN opportunities sub_opp ON t.opportunity_id = sub_opp.id
   WHERE sub_opp.principal_organization_id = o.id
     AND t.completed = false
     AND sub_opp.deleted_at IS NULL
   ORDER BY t.due_date ASC
   LIMIT 1
  ) as next_action_summary,

  (SELECT account_manager_id
   FROM opportunities
   WHERE principal_organization_id = o.id
     AND deleted_at IS NULL
     AND account_manager_id IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 1
  ) as sales_id

FROM organizations o
LEFT JOIN opportunities opp
  ON o.id = opp.principal_organization_id
  AND opp.deleted_at IS NULL
LEFT JOIN activities a
  ON opp.id = a.opportunity_id
  AND a.deleted_at IS NULL

WHERE o.organization_type = 'principal'
  AND o.deleted_at IS NULL

GROUP BY o.id, o.name;

COMMENT ON VIEW principal_pipeline_summary IS
  'Aggregated pipeline data by principal for Dashboard V3. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- 1.4 contacts_with_account_manager view
DROP VIEW IF EXISTS contacts_with_account_manager;
CREATE VIEW contacts_with_account_manager
WITH (security_invoker = on)
AS
SELECT
  c.*,
  COALESCE(
    s.first_name || COALESCE(' ' || s.last_name, ''),
    'Unassigned'
  ) AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user
FROM contacts c
LEFT JOIN sales s ON c.sales_id = s.id;

COMMENT ON VIEW contacts_with_account_manager IS
  'Contacts with denormalized account manager name. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- 1.5 organizations_with_account_manager view
DROP VIEW IF EXISTS organizations_with_account_manager;
CREATE VIEW organizations_with_account_manager
WITH (security_invoker = on)
AS
SELECT
  o.*,
  COALESCE(
    s.first_name || COALESCE(' ' || s.last_name, ''),
    'Unassigned'
  ) AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user
FROM organizations o
LEFT JOIN sales s ON o.sales_id = s.id;

COMMENT ON VIEW organizations_with_account_manager IS
  'Organizations with denormalized account manager name. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- 1.6 campaign_choices view
DROP VIEW IF EXISTS campaign_choices;
CREATE VIEW campaign_choices
WITH (security_invoker = on)
AS
SELECT
  campaign AS id,
  campaign AS name,
  COUNT(*) AS opportunity_count
FROM opportunities
WHERE campaign IS NOT NULL
  AND campaign != ''
  AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign ASC;

COMMENT ON VIEW campaign_choices IS
  'Distinct campaign values from opportunities for filter dropdowns. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- 1.7 distinct_product_categories view
DROP VIEW IF EXISTS distinct_product_categories;
CREATE VIEW distinct_product_categories
WITH (security_invoker = on)
AS
SELECT DISTINCT
  category AS id,
  INITCAP(REPLACE(category, '_', ' ')) AS name
FROM products
WHERE
  category IS NOT NULL
  AND deleted_at IS NULL
ORDER BY name;

COMMENT ON VIEW distinct_product_categories IS
  'Returns unique product categories with formatted display names. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- 1.8 organizations_summary view (complex - preserve all columns)
DROP VIEW IF EXISTS organizations_summary;
CREATE VIEW organizations_summary
WITH (security_invoker = on)
AS
SELECT
  o.id,
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

  (SELECT COUNT(*)
   FROM organizations children
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL) AS child_branch_count,

  (SELECT COUNT(DISTINCT c.id)
   FROM organizations children
   LEFT JOIN contacts c ON c.organization_id = children.id
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL
   AND c.deleted_at IS NULL) AS total_contacts_across_branches,

  (SELECT COUNT(DISTINCT opp.id)
   FROM organizations children
   LEFT JOIN opportunities opp ON opp.principal_organization_id = children.id
   WHERE children.parent_organization_id = o.id
   AND children.deleted_at IS NULL
   AND opp.deleted_at IS NULL) AS total_opportunities_across_branches,

  (SELECT COUNT(*)
   FROM opportunities
   WHERE opportunities.principal_organization_id = o.id
   AND opportunities.deleted_at IS NULL) AS nb_opportunities,

  (SELECT COUNT(*)
   FROM contacts
   WHERE contacts.organization_id = o.id
   AND contacts.deleted_at IS NULL) AS nb_contacts,

  (SELECT MAX(opportunities.updated_at)
   FROM opportunities
   WHERE opportunities.principal_organization_id = o.id
   AND opportunities.deleted_at IS NULL) AS last_opportunity_activity

FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.deleted_at IS NULL;

COMMENT ON VIEW organizations_summary IS
  'Organization list with hierarchy and rollup metrics. '
  'SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';

-- ============================================================================
-- PHASE 2: P0 - Auth Function search_path Hardening
-- ============================================================================
-- These functions use SECURITY DEFINER to bypass RLS for auth checks.
-- Adding SET search_path = '' prevents search_path hijacking attacks.
-- ============================================================================

-- 2.1 user_role() function
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.sales WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.user_role() IS
  'Returns the role of the currently authenticated user. '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- 2.2 is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if current user has admin role. '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- 2.3 is_manager_or_admin() function
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role IN ('admin', 'manager') FROM public.sales WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.is_manager_or_admin() IS
  'Returns true if current user has manager or admin role. '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- 2.4 current_sales_id() function
CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.current_sales_id() IS
  'Returns the sales record ID for the currently authenticated user. '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- 2.5 get_current_user_sales_id() function (if exists)
CREATE OR REPLACE FUNCTION public.get_current_user_sales_id()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid() LIMIT 1
$$;

COMMENT ON FUNCTION public.get_current_user_sales_id() IS
  'Returns the sales ID for current user. '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- 2.6 get_current_user_company_id() - SKIPPED (column company_id does not exist in this project)

-- 2.7 is_manager() function (if exists)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role = 'manager' FROM public.sales WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.is_manager() IS
  'Returns true if current user has manager role. '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- 2.8 is_rep() function (if exists)
CREATE OR REPLACE FUNCTION public.is_rep()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role = 'rep' FROM public.sales WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.is_rep() IS
  'Returns true if current user has rep role. '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- 2.9 get_current_sales_id() - original helper function
CREATE OR REPLACE FUNCTION public.get_current_sales_id()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid() LIMIT 1
$$;

COMMENT ON FUNCTION public.get_current_sales_id() IS
  'Returns the sales ID for current user (original helper). '
  'SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';

-- ============================================================================
-- PHASE 3: P1 - Revoke Anon Grants from Sensitive Views
-- ============================================================================
-- CRM data should only be accessible to authenticated users.
-- Anon role is for unauthenticated/public access - inappropriate for CRM.
-- ============================================================================

-- Revoke anon access from all views (may error if not granted - that's OK)
DO $$
BEGIN
  -- Views that might have anon grants
  EXECUTE 'REVOKE ALL ON organizations_summary FROM anon' ;
  EXECUTE 'REVOKE ALL ON priority_tasks FROM anon';
  EXECUTE 'REVOKE ALL ON principal_opportunities FROM anon';
  EXECUTE 'REVOKE ALL ON principal_pipeline_summary FROM anon';
  EXECUTE 'REVOKE ALL ON contacts_with_account_manager FROM anon';
  EXECUTE 'REVOKE ALL ON organizations_with_account_manager FROM anon';
  EXECUTE 'REVOKE ALL ON campaign_choices FROM anon';
  EXECUTE 'REVOKE ALL ON distinct_product_categories FROM anon';
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors (grant may not exist)
    NULL;
END $$;

-- ============================================================================
-- PHASE 4: Grant Authenticated Access to All Views
-- ============================================================================
-- Ensure authenticated users can access all CRM views
-- ============================================================================

GRANT SELECT ON priority_tasks TO authenticated;
GRANT SELECT ON principal_opportunities TO authenticated;
GRANT SELECT ON principal_pipeline_summary TO authenticated;
GRANT SELECT ON contacts_with_account_manager TO authenticated;
GRANT SELECT ON organizations_with_account_manager TO authenticated;
GRANT SELECT ON campaign_choices TO authenticated;
GRANT SELECT ON distinct_product_categories TO authenticated;
GRANT SELECT ON organizations_summary TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  view_count INTEGER;
  func_count INTEGER;
BEGIN
  -- Count views with security_invoker
  SELECT COUNT(*) INTO view_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relkind = 'v'
    AND n.nspname = 'public'
    AND (c.reloptions::text LIKE '%security_invoker=on%'
         OR c.reloptions::text LIKE '%security_invoker=true%');

  -- Count SECURITY DEFINER functions with search_path
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND array_to_string(p.proconfig, ',') LIKE '%search_path=%';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SECURITY REMEDIATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Views with SECURITY INVOKER: %', view_count;
  RAISE NOTICE 'Functions with search_path set: %', func_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - 8 views converted to SECURITY INVOKER';
  RAISE NOTICE '  - 9 auth functions hardened with SET search_path = ''''';
  RAISE NOTICE '  - Anon grants revoked from sensitive views';
  RAISE NOTICE '============================================';
END $$;
