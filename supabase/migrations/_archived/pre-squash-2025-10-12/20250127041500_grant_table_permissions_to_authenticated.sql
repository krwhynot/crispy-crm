-- Migration: Grant table permissions to authenticated role
-- Issue: The authenticated role was missing basic CRUD permissions on tables
-- This is required IN ADDITION to RLS policies for access to work

-- Grant all necessary permissions to authenticated role for all tables
-- Following the pattern that already works for the sales table

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contactNotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_preferred_principals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interaction_participants TO authenticated;
GRANT SELECT ON public.migration_history TO authenticated; -- Read-only for migration history
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunityNotes TO authenticated;
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

-- Grant usage on sequences (for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verification query
DO $$
DECLARE
  missing_tables text[];
BEGIN
  -- Check which tables still lack permissions
  SELECT ARRAY_AGG(DISTINCT t.tablename) INTO missing_tables
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.table_privileges tp
      WHERE tp.table_schema = 'public'
        AND tp.table_name = t.tablename
        AND tp.grantee = 'authenticated'
        AND tp.privilege_type = 'SELECT'
    );

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE WARNING 'Tables still missing SELECT permission for authenticated: %', missing_tables;
  ELSE
    RAISE NOTICE 'All tables now have proper permissions for authenticated role';
  END IF;
END $$;