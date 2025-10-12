-- Migration: Fix RLS policies - change from public to authenticated role
-- Issue: All policies were incorrectly targeting 'public' role with auth.uid() IS NOT NULL
-- This creates an impossible condition since public/anon requests always have NULL uid
-- Solution: Change all policies to target 'authenticated' role

-- Activities table
ALTER POLICY "authenticated_delete_activities" ON "public"."activities" TO authenticated;
ALTER POLICY "authenticated_insert_activities" ON "public"."activities" TO authenticated;
ALTER POLICY "authenticated_select_activities" ON "public"."activities" TO authenticated;
ALTER POLICY "authenticated_update_activities" ON "public"."activities" TO authenticated;

-- ContactNotes table
ALTER POLICY "authenticated_delete_contactNotes" ON "public"."contactNotes" TO authenticated;
ALTER POLICY "authenticated_insert_contactNotes" ON "public"."contactNotes" TO authenticated;
ALTER POLICY "authenticated_select_contactNotes" ON "public"."contactNotes" TO authenticated;
ALTER POLICY "authenticated_update_contactNotes" ON "public"."contactNotes" TO authenticated;

-- Contact Organizations table
ALTER POLICY "authenticated_delete_contact_organizations" ON "public"."contact_organizations" TO authenticated;
ALTER POLICY "authenticated_insert_contact_organizations" ON "public"."contact_organizations" TO authenticated;
ALTER POLICY "authenticated_select_contact_organizations" ON "public"."contact_organizations" TO authenticated;
ALTER POLICY "authenticated_update_contact_organizations" ON "public"."contact_organizations" TO authenticated;

-- Contact Preferred Principals table
ALTER POLICY "authenticated_delete_contact_preferred_principals" ON "public"."contact_preferred_principals" TO authenticated;
ALTER POLICY "authenticated_insert_contact_preferred_principals" ON "public"."contact_preferred_principals" TO authenticated;
ALTER POLICY "authenticated_select_contact_preferred_principals" ON "public"."contact_preferred_principals" TO authenticated;
ALTER POLICY "authenticated_update_contact_preferred_principals" ON "public"."contact_preferred_principals" TO authenticated;

-- Contacts table
ALTER POLICY "authenticated_delete_contacts" ON "public"."contacts" TO authenticated;
ALTER POLICY "authenticated_insert_contacts" ON "public"."contacts" TO authenticated;
ALTER POLICY "authenticated_select_contacts" ON "public"."contacts" TO authenticated;
ALTER POLICY "authenticated_update_contacts" ON "public"."contacts" TO authenticated;

-- Interaction Participants table
ALTER POLICY "authenticated_delete_interaction_participants" ON "public"."interaction_participants" TO authenticated;
ALTER POLICY "authenticated_insert_interaction_participants" ON "public"."interaction_participants" TO authenticated;
ALTER POLICY "authenticated_select_interaction_participants" ON "public"."interaction_participants" TO authenticated;
ALTER POLICY "authenticated_update_interaction_participants" ON "public"."interaction_participants" TO authenticated;

-- Migration History table
ALTER POLICY "authenticated_select_migration_history" ON "public"."migration_history" TO authenticated;

-- Opportunities table
ALTER POLICY "authenticated_delete_opportunities" ON "public"."opportunities" TO authenticated;
ALTER POLICY "authenticated_insert_opportunities" ON "public"."opportunities" TO authenticated;
ALTER POLICY "authenticated_select_opportunities" ON "public"."opportunities" TO authenticated;
ALTER POLICY "authenticated_update_opportunities" ON "public"."opportunities" TO authenticated;

-- OpportunityNotes table
ALTER POLICY "authenticated_delete_opportunityNotes" ON "public"."opportunityNotes" TO authenticated;
ALTER POLICY "authenticated_insert_opportunityNotes" ON "public"."opportunityNotes" TO authenticated;
ALTER POLICY "authenticated_select_opportunityNotes" ON "public"."opportunityNotes" TO authenticated;
ALTER POLICY "authenticated_update_opportunityNotes" ON "public"."opportunityNotes" TO authenticated;

-- Opportunity Participants table
ALTER POLICY "authenticated_delete_opportunity_participants" ON "public"."opportunity_participants" TO authenticated;
ALTER POLICY "authenticated_insert_opportunity_participants" ON "public"."opportunity_participants" TO authenticated;
ALTER POLICY "authenticated_select_opportunity_participants" ON "public"."opportunity_participants" TO authenticated;
ALTER POLICY "authenticated_update_opportunity_participants" ON "public"."opportunity_participants" TO authenticated;

-- Opportunity Products table
ALTER POLICY "authenticated_delete_opportunity_products" ON "public"."opportunity_products" TO authenticated;
ALTER POLICY "authenticated_insert_opportunity_products" ON "public"."opportunity_products" TO authenticated;
ALTER POLICY "authenticated_select_opportunity_products" ON "public"."opportunity_products" TO authenticated;
ALTER POLICY "authenticated_update_opportunity_products" ON "public"."opportunity_products" TO authenticated;

-- Organizations table
ALTER POLICY "authenticated_delete_organizations" ON "public"."organizations" TO authenticated;
ALTER POLICY "authenticated_insert_organizations" ON "public"."organizations" TO authenticated;
ALTER POLICY "authenticated_select_organizations" ON "public"."organizations" TO authenticated;
ALTER POLICY "authenticated_update_organizations" ON "public"."organizations" TO authenticated;

-- Product Category Hierarchy table
ALTER POLICY "authenticated_delete_product_category_hierarchy" ON "public"."product_category_hierarchy" TO authenticated;
ALTER POLICY "authenticated_insert_product_category_hierarchy" ON "public"."product_category_hierarchy" TO authenticated;
ALTER POLICY "authenticated_select_product_category_hierarchy" ON "public"."product_category_hierarchy" TO authenticated;
ALTER POLICY "authenticated_update_product_category_hierarchy" ON "public"."product_category_hierarchy" TO authenticated;

-- Product Distributor Authorizations table
ALTER POLICY "authenticated_delete_product_distributor_authorizations" ON "public"."product_distributor_authorizations" TO authenticated;
ALTER POLICY "authenticated_insert_product_distributor_authorizations" ON "public"."product_distributor_authorizations" TO authenticated;
ALTER POLICY "authenticated_select_product_distributor_authorizations" ON "public"."product_distributor_authorizations" TO authenticated;
ALTER POLICY "authenticated_update_product_distributor_authorizations" ON "public"."product_distributor_authorizations" TO authenticated;

-- Product Features table
ALTER POLICY "authenticated_delete_product_features" ON "public"."product_features" TO authenticated;
ALTER POLICY "authenticated_insert_product_features" ON "public"."product_features" TO authenticated;
ALTER POLICY "authenticated_select_product_features" ON "public"."product_features" TO authenticated;
ALTER POLICY "authenticated_update_product_features" ON "public"."product_features" TO authenticated;

-- Product Inventory table
ALTER POLICY "authenticated_delete_product_inventory" ON "public"."product_inventory" TO authenticated;
ALTER POLICY "authenticated_insert_product_inventory" ON "public"."product_inventory" TO authenticated;
ALTER POLICY "authenticated_select_product_inventory" ON "public"."product_inventory" TO authenticated;
ALTER POLICY "authenticated_update_product_inventory" ON "public"."product_inventory" TO authenticated;

-- Product Pricing Models table
ALTER POLICY "authenticated_delete_product_pricing_models" ON "public"."product_pricing_models" TO authenticated;
ALTER POLICY "authenticated_insert_product_pricing_models" ON "public"."product_pricing_models" TO authenticated;
ALTER POLICY "authenticated_select_product_pricing_models" ON "public"."product_pricing_models" TO authenticated;
ALTER POLICY "authenticated_update_product_pricing_models" ON "public"."product_pricing_models" TO authenticated;

-- Product Pricing Tiers table
ALTER POLICY "authenticated_delete_product_pricing_tiers" ON "public"."product_pricing_tiers" TO authenticated;
ALTER POLICY "authenticated_insert_product_pricing_tiers" ON "public"."product_pricing_tiers" TO authenticated;
ALTER POLICY "authenticated_select_product_pricing_tiers" ON "public"."product_pricing_tiers" TO authenticated;
ALTER POLICY "authenticated_update_product_pricing_tiers" ON "public"."product_pricing_tiers" TO authenticated;

-- Products table
ALTER POLICY "authenticated_delete_products" ON "public"."products" TO authenticated;
ALTER POLICY "authenticated_insert_products" ON "public"."products" TO authenticated;
ALTER POLICY "authenticated_select_products" ON "public"."products" TO authenticated;
ALTER POLICY "authenticated_update_products" ON "public"."products" TO authenticated;

-- Sales table
ALTER POLICY "authenticated_delete_sales" ON "public"."sales" TO authenticated;
ALTER POLICY "authenticated_insert_sales" ON "public"."sales" TO authenticated;
ALTER POLICY "authenticated_select_sales" ON "public"."sales" TO authenticated;
ALTER POLICY "authenticated_update_sales" ON "public"."sales" TO authenticated;

-- Tags table
ALTER POLICY "authenticated_delete_tags" ON "public"."tags" TO authenticated;
ALTER POLICY "authenticated_insert_tags" ON "public"."tags" TO authenticated;
ALTER POLICY "authenticated_select_tags" ON "public"."tags" TO authenticated;
ALTER POLICY "authenticated_update_tags" ON "public"."tags" TO authenticated;

-- Tasks table
ALTER POLICY "authenticated_delete_tasks" ON "public"."tasks" TO authenticated;
ALTER POLICY "authenticated_insert_tasks" ON "public"."tasks" TO authenticated;
ALTER POLICY "authenticated_select_tasks" ON "public"."tasks" TO authenticated;
ALTER POLICY "authenticated_update_tasks" ON "public"."tasks" TO authenticated;

-- Verification query to confirm all policies are now targeting authenticated role
DO $$
DECLARE
  incorrect_policy_count integer;
BEGIN
  SELECT COUNT(*) INTO incorrect_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND 'public' = ANY(roles)
    AND (qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%');

  IF incorrect_policy_count > 0 THEN
    RAISE WARNING 'Found % policies still targeting public role with auth.uid() checks', incorrect_policy_count;
  ELSE
    RAISE NOTICE 'All RLS policies successfully updated to target authenticated role';
  END IF;
END $$;