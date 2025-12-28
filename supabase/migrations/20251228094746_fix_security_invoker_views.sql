-- ============================================================================
-- Fix SECURITY DEFINER view warnings
-- ============================================================================
-- Date: 2025-12-28
-- Description: PostgreSQL 15+ views without security_invoker=true bypass RLS
--              policies, executing with the view creator's permissions instead
--              of the querying user's permissions. This migration recreates
--              both flagged views with security_invoker=on.
--
-- Views fixed:
--   1. distinct_opportunities_campaigns (used by OpportunityListFilter)
--   2. organization_primary_distributor (convenience view for lookups)
--
-- Security Impact:
--   BEFORE: Views bypass RLS, run as postgres superuser
--   AFTER:  Views respect RLS, run as querying user
-- ============================================================================

-- Fix 1: distinct_opportunities_campaigns
-- Used by: src/atomic-crm/opportunities/OpportunityListFilter.tsx
DROP VIEW IF EXISTS public.distinct_opportunities_campaigns;

CREATE VIEW public.distinct_opportunities_campaigns
WITH (security_invoker = on)
AS
SELECT DISTINCT
    campaign AS id,
    campaign AS name
FROM opportunities
WHERE
    campaign IS NOT NULL
    AND deleted_at IS NULL
ORDER BY name;

COMMENT ON VIEW public.distinct_opportunities_campaigns IS
    'Returns unique opportunity campaigns for filter UI - P0 performance fix';

GRANT SELECT ON public.distinct_opportunities_campaigns TO authenticated;


-- Fix 2: organization_primary_distributor
-- Used by: Fast primary distributor lookups (available for future features)
DROP VIEW IF EXISTS public.organization_primary_distributor;

CREATE VIEW public.organization_primary_distributor
WITH (security_invoker = on)
AS
SELECT
    od.organization_id,
    od.distributor_id,
    d.name AS distributor_name,
    d.city AS distributor_city,
    d.state AS distributor_state
FROM public.organization_distributors od
JOIN public.organizations d ON d.id = od.distributor_id AND d.deleted_at IS NULL
WHERE od.is_primary = true AND od.deleted_at IS NULL;

COMMENT ON VIEW public.organization_primary_distributor IS
    'Convenience view for fast primary distributor lookups. Returns distributor details for each organization''s primary distributor.';

GRANT SELECT ON public.organization_primary_distributor TO authenticated;
GRANT SELECT ON public.organization_primary_distributor TO service_role;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Manual - for reference only)
-- ============================================================================
-- If you need to rollback this migration, the views will need to be recreated
-- without the security_invoker option. However, this is NOT recommended as it
-- would reintroduce the security issue.
-- ============================================================================
