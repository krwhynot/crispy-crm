-- Migration: Grant table permissions to authenticated role (with correct table names)
-- Issue: The authenticated role was missing basic CRUD permissions on tables
-- This is required IN ADDITION to RLS policies for access to work

-- Grant all necessary permissions to authenticated role for all tables
-- Using exact table names with proper casing

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."contactNotes" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_preferred_principals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interaction_participants TO authenticated;
GRANT SELECT ON public.migration_history TO authenticated; -- Read-only for migration history
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."opportunityNotes" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_category_hierarchy TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_distributor_authorizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_features TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_pricing_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_pricing_tiers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
-- sales already has permissions, but include for completeness
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

-- Grant usage on all sequences (for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verification query
DO $$
DECLARE
  granted_count integer;
  total_tables integer;
BEGIN
  -- Count tables with SELECT permission for authenticated
  SELECT COUNT(DISTINCT table_name) INTO granted_count
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT';

  -- Count total tables in public schema
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables
  WHERE schemaname = 'public';

  RAISE NOTICE 'Granted permissions on % out of % tables', granted_count, total_tables;

  IF granted_count = total_tables THEN
    RAISE NOTICE 'SUCCESS: All tables now have proper permissions for authenticated role';
  ELSE
    RAISE WARNING 'Some tables may still be missing permissions';
  END IF;
END $$;