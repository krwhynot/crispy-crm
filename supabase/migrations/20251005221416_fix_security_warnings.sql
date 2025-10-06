-- =====================================================================
-- SECURITY HARDENING MIGRATION
-- =====================================================================
-- Purpose: Fix Supabase database linter security warnings
-- Date: 2025-10-05
-- Priority: CRITICAL (must apply before production launch)
--
-- Fixes:
-- 1. SECURITY DEFINER views (2 ERRORs) - Change to security_invoker = true
-- 2. Function search_path warnings (19 WARNs) - Add SET search_path = 'public'
--
-- Reference: https://supabase.com/docs/guides/database/database-linter
-- =====================================================================

-- =====================================================================
-- PART 1: FIX SECURITY DEFINER VIEWS (CRITICAL)
-- =====================================================================
-- Issue: Views bypass RLS policies, creating privilege escalation risk
-- Fix: Change from security_invoker = false to security_invoker = true
-- Impact: Views will now respect RLS policies (same as current behavior
--         since RLS is permissive, but prevents future privilege escalation
--         when RLS becomes more restrictive)
-- =====================================================================

-- Drop and recreate contacts_summary view with security_invoker = true
DROP VIEW IF EXISTS public.contacts_summary;

CREATE OR REPLACE VIEW public.contacts_summary
WITH (security_invoker = true) AS
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
    c.search_tsv,
    c.first_seen,
    c.last_seen,
    c.gender,
    c.tags,
    ARRAY_AGG(DISTINCT co.organization_id) FILTER (WHERE co.organization_id IS NOT NULL) AS organization_ids,
    (
        SELECT o.name
        FROM contact_organizations co2
        JOIN organizations o ON o.id = co2.organization_id
        WHERE co2.contact_id = c.id
        AND o.deleted_at IS NULL
        ORDER BY co2.is_primary DESC, co2.created_at
        LIMIT 1
    ) AS company_name
FROM contacts c
LEFT JOIN contact_organizations co ON co.contact_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

COMMENT ON VIEW public.contacts_summary IS 'Denormalized contact view with organization data - respects RLS policies';

-- Drop and recreate organizations_summary view with security_invoker = true
DROP VIEW IF EXISTS public.organizations_summary;

CREATE OR REPLACE VIEW public.organizations_summary
WITH (security_invoker = true) AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
    o.segment,
    o.priority,
    o.industry,
    o.annual_revenue,
    o.employee_count,
    o.created_at,
    COUNT(DISTINCT opp.id) AS opportunities_count,
    COUNT(DISTINCT co.contact_id) AS contacts_count,
    MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
LEFT JOIN opportunities opp ON (
    (opp.customer_organization_id = o.id OR
     opp.principal_organization_id = o.id OR
     opp.distributor_organization_id = o.id)
    AND opp.deleted_at IS NULL
)
LEFT JOIN contact_organizations co ON co.organization_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY o.id;

COMMENT ON VIEW public.organizations_summary IS 'Denormalized organization view with aggregated counts - respects RLS policies';

-- =====================================================================
-- PART 2: FIX FUNCTION SEARCH_PATH WARNINGS (19 FUNCTIONS)
-- =====================================================================
-- Issue: Functions don't specify search_path, vulnerable to schema injection
-- Fix: Set search_path = 'public' to lock schema resolution
-- Impact: Functions will only look in public schema, preventing potential
--         schema injection attacks
-- =====================================================================

-- Trigger functions (search text updates)
ALTER FUNCTION public.update_search_tsv() SET search_path = 'public';
ALTER FUNCTION public.update_organizations_search_tsv() SET search_path = 'public';
ALTER FUNCTION public.products_search_trigger() SET search_path = 'public';

-- Organization management functions
ALTER FUNCTION public.set_primary_organization(bigint, bigint) SET search_path = 'public';
ALTER FUNCTION public.get_contact_organizations(bigint) SET search_path = 'public';
ALTER FUNCTION public.get_organization_contacts(bigint) SET search_path = 'public';

-- Opportunity management functions
ALTER FUNCTION public.calculate_opportunity_probability() SET search_path = 'public';
ALTER FUNCTION public.create_opportunity_with_participants(jsonb, jsonb[]) SET search_path = 'public';
ALTER FUNCTION public.sync_opportunity_with_products(jsonb, jsonb, jsonb, integer[]) SET search_path = 'public';

-- Validation functions
ALTER FUNCTION public.validate_principal_organization() SET search_path = 'public';
ALTER FUNCTION public.validate_opportunity_participants() SET search_path = 'public';
ALTER FUNCTION public.validate_activity_consistency() SET search_path = 'public';
ALTER FUNCTION public.validate_pricing_tiers() SET search_path = 'public';

-- User management functions (auth triggers)
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.handle_update_user() SET search_path = 'public';

-- Activity logging functions
ALTER FUNCTION public.log_engagement(interaction_type, text, text, bigint, bigint, timestamp with time zone, integer, boolean, date, text, bigint) SET search_path = 'public';
ALTER FUNCTION public.log_interaction(bigint, interaction_type, text, text, bigint, bigint, timestamp with time zone, integer, boolean, date, text, character varying, bigint) SET search_path = 'public';

-- Product pricing functions
ALTER FUNCTION public.calculate_product_price(bigint, integer, bigint) SET search_path = 'public';
ALTER FUNCTION public.check_product_availability(bigint, integer, date) SET search_path = 'public';

-- =====================================================================
-- VERIFICATION QUERIES (commented out - uncomment to verify)
-- =====================================================================

-- Verify views are now security_invoker = true:
-- SELECT
--     viewname,
--     pg_catalog.pg_get_viewdef(c.oid, true) as definition
-- FROM pg_views v
-- JOIN pg_class c ON c.relname = v.viewname
-- WHERE schemaname = 'public'
-- AND viewname IN ('contacts_summary', 'organizations_summary');

-- Verify functions have search_path set:
-- SELECT
--     proname as function_name,
--     proconfig as settings
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
-- AND proname IN (
--     'update_search_tsv', 'update_organizations_search_tsv',
--     'products_search_trigger', 'set_primary_organization'
-- );

-- =====================================================================
-- ROLLBACK SECTION (commented out)
-- =====================================================================
-- To rollback this migration, recreate views with security_invoker = false
-- and remove search_path settings from functions
--
-- DROP VIEW IF EXISTS public.contacts_summary;
-- CREATE OR REPLACE VIEW public.contacts_summary
-- WITH (security_invoker = false) AS ...
--
-- DROP VIEW IF EXISTS public.organizations_summary;
-- CREATE OR REPLACE VIEW public.organizations_summary
-- WITH (security_invoker = false) AS ...
--
-- ALTER FUNCTION public.update_search_tsv() RESET search_path;
-- [repeat for all 19 functions]

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
-- All security warnings from Supabase linter have been addressed:
-- ✅ SECURITY DEFINER views now respect RLS policies
-- ✅ All functions have locked search_path to prevent schema injection
--
-- Next step: Enable "Leaked Password Protection" in Supabase Dashboard
-- (Authentication → Policies → HIBP Protection)
-- =====================================================================
