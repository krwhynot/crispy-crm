-- Fix RLS policies to use auth.uid() instead of auth.role()
-- Following Engineering Constitution: Simple, consistent approach
-- This fixes "permission denied" errors by properly checking for authenticated users

BEGIN;

-- Drop all existing policies that use the incorrect auth.role() check
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN (
            'tasks',
            'opportunityNotes',
            'contacts',
            'opportunities',
            'activities',
            'organizations',
            'tags',
            'contact_organizations',
            'opportunity_participants',
            'interaction_participants',
            'contact_preferred_principals',
            'products',
            'product_category_hierarchy',
            'product_pricing_tiers',
            'product_pricing_models',
            'product_inventory',
            'product_features',
            'product_distributor_authorizations',
            'opportunity_products',
            'sales',
            'contactNotes'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Create correct policies using auth.uid() IS NOT NULL
-- This properly checks if a user is authenticated

-- Tasks table
CREATE POLICY "authenticated_select_tasks" ON public.tasks FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_tasks" ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_tasks" ON public.tasks FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_tasks" ON public.tasks FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- OpportunityNotes table (camelCase)
CREATE POLICY "authenticated_select_opportunityNotes" ON public."opportunityNotes" FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_opportunityNotes" ON public."opportunityNotes" FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_opportunityNotes" ON public."opportunityNotes" FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_opportunityNotes" ON public."opportunityNotes" FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Contacts table
CREATE POLICY "authenticated_select_contacts" ON public.contacts FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_contacts" ON public.contacts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_contacts" ON public.contacts FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_contacts" ON public.contacts FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Opportunities table
CREATE POLICY "authenticated_select_opportunities" ON public.opportunities FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_opportunities" ON public.opportunities FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_opportunities" ON public.opportunities FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_opportunities" ON public.opportunities FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Activities table
CREATE POLICY "authenticated_select_activities" ON public.activities FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_activities" ON public.activities FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_activities" ON public.activities FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_activities" ON public.activities FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Organizations table
CREATE POLICY "authenticated_select_organizations" ON public.organizations FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_organizations" ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_organizations" ON public.organizations FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_organizations" ON public.organizations FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Tags table
CREATE POLICY "authenticated_select_tags" ON public.tags FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_tags" ON public.tags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_tags" ON public.tags FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_tags" ON public.tags FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- ContactNotes table (camelCase)
CREATE POLICY "authenticated_select_contactNotes" ON public."contactNotes" FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_contactNotes" ON public."contactNotes" FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_contactNotes" ON public."contactNotes" FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_contactNotes" ON public."contactNotes" FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Contact_organizations table
CREATE POLICY "authenticated_select_contact_organizations" ON public.contact_organizations FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_contact_organizations" ON public.contact_organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_contact_organizations" ON public.contact_organizations FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_contact_organizations" ON public.contact_organizations FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Opportunity_participants table
CREATE POLICY "authenticated_select_opportunity_participants" ON public.opportunity_participants FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_opportunity_participants" ON public.opportunity_participants FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_opportunity_participants" ON public.opportunity_participants FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_opportunity_participants" ON public.opportunity_participants FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Interaction_participants table
CREATE POLICY "authenticated_select_interaction_participants" ON public.interaction_participants FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_interaction_participants" ON public.interaction_participants FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_interaction_participants" ON public.interaction_participants FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_interaction_participants" ON public.interaction_participants FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Contact_preferred_principals table
CREATE POLICY "authenticated_select_contact_preferred_principals" ON public.contact_preferred_principals FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_contact_preferred_principals" ON public.contact_preferred_principals FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_contact_preferred_principals" ON public.contact_preferred_principals FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_contact_preferred_principals" ON public.contact_preferred_principals FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Products table
CREATE POLICY "authenticated_select_products" ON public.products FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_products" ON public.products FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_products" ON public.products FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_products" ON public.products FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Product_category_hierarchy table
CREATE POLICY "authenticated_select_product_category_hierarchy" ON public.product_category_hierarchy FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_product_category_hierarchy" ON public.product_category_hierarchy FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_product_category_hierarchy" ON public.product_category_hierarchy FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_product_category_hierarchy" ON public.product_category_hierarchy FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Product_pricing_tiers table
CREATE POLICY "authenticated_select_product_pricing_tiers" ON public.product_pricing_tiers FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_product_pricing_tiers" ON public.product_pricing_tiers FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_product_pricing_tiers" ON public.product_pricing_tiers FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_product_pricing_tiers" ON public.product_pricing_tiers FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Product_pricing_models table
CREATE POLICY "authenticated_select_product_pricing_models" ON public.product_pricing_models FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_product_pricing_models" ON public.product_pricing_models FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_product_pricing_models" ON public.product_pricing_models FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_product_pricing_models" ON public.product_pricing_models FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Product_inventory table
CREATE POLICY "authenticated_select_product_inventory" ON public.product_inventory FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_product_inventory" ON public.product_inventory FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_product_inventory" ON public.product_inventory FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_product_inventory" ON public.product_inventory FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Product_features table
CREATE POLICY "authenticated_select_product_features" ON public.product_features FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_product_features" ON public.product_features FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_product_features" ON public.product_features FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_product_features" ON public.product_features FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Product_distributor_authorizations table
CREATE POLICY "authenticated_select_product_distributor_authorizations" ON public.product_distributor_authorizations FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_product_distributor_authorizations" ON public.product_distributor_authorizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_product_distributor_authorizations" ON public.product_distributor_authorizations FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_product_distributor_authorizations" ON public.product_distributor_authorizations FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Opportunity_products table
CREATE POLICY "authenticated_select_opportunity_products" ON public.opportunity_products FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_opportunity_products" ON public.opportunity_products FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_opportunity_products" ON public.opportunity_products FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_opportunity_products" ON public.opportunity_products FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Sales table
CREATE POLICY "authenticated_select_sales" ON public.sales FOR SELECT
    USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_sales" ON public.sales FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_sales" ON public.sales FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_sales" ON public.sales FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Migration_history table (read-only)
CREATE POLICY "authenticated_select_migration_history" ON public.migration_history FOR SELECT
    USING (auth.uid() IS NOT NULL);

COMMIT;