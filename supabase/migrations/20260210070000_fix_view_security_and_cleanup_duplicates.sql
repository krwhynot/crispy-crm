-- S1+S2: Fix SECURITY DEFINER views (ERROR-level security finding)
-- Both views currently bypass RLS by executing as the view owner (postgres).
-- Setting security_invoker = true makes them execute as the calling user,
-- ensuring RLS policies on underlying tables are respected.

ALTER VIEW public.entity_timeline SET (security_invoker = true);
ALTER VIEW public.activities_summary SET (security_invoker = true);

-- R2: Drop 3 duplicate notes timeline indexes
-- These were created by the entity_timeline migration but are identical
-- to pre-existing indexes on the same columns with the same WHERE clause.
--
-- idx_contact_notes_timeline = idx_contact_notes_contact_date
-- idx_opportunity_notes_timeline = idx_opportunity_notes_opportunity_date
-- idx_organization_notes_timeline = idx_organization_notes_org_date

DROP INDEX IF EXISTS public.idx_contact_notes_timeline;
DROP INDEX IF EXISTS public.idx_opportunity_notes_timeline;
DROP INDEX IF EXISTS public.idx_organization_notes_timeline;

-- R3: Drop 2 redundant tags policies
-- delete_tags_admin (admin only) is subsumed by tags_delete_privileged (admin or manager)
-- update_tags_admin (admin only) is subsumed by tags_soft_delete_authenticated (any authenticated)

DROP POLICY IF EXISTS "delete_tags_admin" ON public.tags;
DROP POLICY IF EXISTS "update_tags_admin" ON public.tags;
