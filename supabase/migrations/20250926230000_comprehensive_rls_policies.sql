-- Comprehensive RLS policies for all tables
-- This migration ensures all tables with RLS enabled have proper policies

-- Helper function to create standard CRUD policies for a table
-- We'll create policies for each operation separately for better control

-- Organizations table
CREATE POLICY "Enable read for authenticated" ON organizations
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON organizations
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON organizations
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Contacts table
CREATE POLICY "Enable read for authenticated" ON contacts
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON contacts
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON contacts
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON contacts
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Opportunities table
CREATE POLICY "Enable read for authenticated" ON opportunities
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON opportunities
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON opportunities
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON opportunities
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Activities table
CREATE POLICY "Enable read for authenticated" ON activities
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON activities
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON activities
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON activities
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Tasks table
CREATE POLICY "Enable read for authenticated" ON tasks
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON tasks
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON tasks
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON tasks
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- ContactNotes table
CREATE POLICY "Enable read for authenticated" ON "contactNotes"
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON "contactNotes"
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON "contactNotes"
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON "contactNotes"
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- OpportunityNotes table
CREATE POLICY "Enable read for authenticated" ON "opportunityNotes"
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON "opportunityNotes"
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON "opportunityNotes"
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON "opportunityNotes"
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Tags table
CREATE POLICY "Enable read for authenticated" ON tags
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON tags
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON tags
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON tags
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Contact_organizations table
CREATE POLICY "Enable read for authenticated" ON contact_organizations
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON contact_organizations
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON contact_organizations
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON contact_organizations
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Opportunity_participants table
CREATE POLICY "Enable read for authenticated" ON opportunity_participants
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON opportunity_participants
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON opportunity_participants
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON opportunity_participants
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Interaction_participants table
CREATE POLICY "Enable read for authenticated" ON interaction_participants
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON interaction_participants
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON interaction_participants
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON interaction_participants
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Contact_preferred_principals table
CREATE POLICY "Enable read for authenticated" ON contact_preferred_principals
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON contact_preferred_principals
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON contact_preferred_principals
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON contact_preferred_principals
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Products table
CREATE POLICY "Enable read for authenticated" ON products
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON products
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON products
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON products
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_category_hierarchy table
CREATE POLICY "Enable read for authenticated" ON product_category_hierarchy
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON product_category_hierarchy
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON product_category_hierarchy
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON product_category_hierarchy
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_pricing_tiers table
CREATE POLICY "Enable read for authenticated" ON product_pricing_tiers
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON product_pricing_tiers
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON product_pricing_tiers
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON product_pricing_tiers
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_pricing_models table
CREATE POLICY "Enable read for authenticated" ON product_pricing_models
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON product_pricing_models
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON product_pricing_models
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON product_pricing_models
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_inventory table
CREATE POLICY "Enable read for authenticated" ON product_inventory
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON product_inventory
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON product_inventory
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON product_inventory
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_features table
CREATE POLICY "Enable read for authenticated" ON product_features
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON product_features
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON product_features
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON product_features
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_distributor_authorizations table
CREATE POLICY "Enable read for authenticated" ON product_distributor_authorizations
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON product_distributor_authorizations
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON product_distributor_authorizations
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON product_distributor_authorizations
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Opportunity_products table
CREATE POLICY "Enable read for authenticated" ON opportunity_products
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON opportunity_products
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON opportunity_products
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON opportunity_products
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Sales table
CREATE POLICY "Enable read for authenticated" ON sales
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON sales
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON sales
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON sales
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Migration_history table (read-only for authenticated users)
CREATE POLICY "Enable read for authenticated" ON migration_history
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');