-- Standardize RLS policies across all tables
-- Replace single "Enable all access" policies with 4 separate CRUD policies
-- Following Engineering Constitution: Simple auth.role() = 'authenticated'

-- Drop existing single catch-all policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON contacts;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON opportunities;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON activities;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "contactNotes";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON tags;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON contact_organizations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON opportunity_participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON interaction_participants;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON contact_preferred_principals;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_distributor_authorizations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_features;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_inventory;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_pricing_models;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON product_pricing_tiers;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON opportunity_products;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON migration_history;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON product_category_hierarchy;

-- Organizations table (4 policies)
CREATE POLICY "Enable read for authenticated users on organizations"
    ON organizations FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on organizations"
    ON organizations FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on organizations"
    ON organizations FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on organizations"
    ON organizations FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Contacts table (4 policies)
CREATE POLICY "Enable read for authenticated users on contacts"
    ON contacts FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on contacts"
    ON contacts FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on contacts"
    ON contacts FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on contacts"
    ON contacts FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Opportunities table (4 policies)
CREATE POLICY "Enable read for authenticated users on opportunities"
    ON opportunities FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on opportunities"
    ON opportunities FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on opportunities"
    ON opportunities FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on opportunities"
    ON opportunities FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Activities table (4 policies)
CREATE POLICY "Enable read for authenticated users on activities"
    ON activities FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on activities"
    ON activities FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on activities"
    ON activities FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on activities"
    ON activities FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- ContactNotes table (4 policies)
CREATE POLICY "Enable read for authenticated users on contactNotes"
    ON "contactNotes" FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on contactNotes"
    ON "contactNotes" FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on contactNotes"
    ON "contactNotes" FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on contactNotes"
    ON "contactNotes" FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Tags table (4 policies)
CREATE POLICY "Enable read for authenticated users on tags"
    ON tags FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on tags"
    ON tags FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on tags"
    ON tags FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on tags"
    ON tags FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Contact_organizations table (4 policies)
CREATE POLICY "Enable read for authenticated users on contact_organizations"
    ON contact_organizations FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on contact_organizations"
    ON contact_organizations FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on contact_organizations"
    ON contact_organizations FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on contact_organizations"
    ON contact_organizations FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Opportunity_participants table (4 policies)
CREATE POLICY "Enable read for authenticated users on opportunity_participants"
    ON opportunity_participants FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on opportunity_participants"
    ON opportunity_participants FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on opportunity_participants"
    ON opportunity_participants FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on opportunity_participants"
    ON opportunity_participants FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Interaction_participants table (4 policies)
CREATE POLICY "Enable read for authenticated users on interaction_participants"
    ON interaction_participants FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on interaction_participants"
    ON interaction_participants FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on interaction_participants"
    ON interaction_participants FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on interaction_participants"
    ON interaction_participants FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Contact_preferred_principals table (4 policies)
CREATE POLICY "Enable read for authenticated users on contact_preferred_principals"
    ON contact_preferred_principals FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on contact_preferred_principals"
    ON contact_preferred_principals FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on contact_preferred_principals"
    ON contact_preferred_principals FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on contact_preferred_principals"
    ON contact_preferred_principals FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Products table (4 policies)
CREATE POLICY "Enable read for authenticated users on products"
    ON products FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on products"
    ON products FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on products"
    ON products FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on products"
    ON products FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_category_hierarchy table (4 policies)
CREATE POLICY "Enable read for authenticated users on product_category_hierarchy"
    ON product_category_hierarchy FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on product_category_hierarchy"
    ON product_category_hierarchy FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on product_category_hierarchy"
    ON product_category_hierarchy FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on product_category_hierarchy"
    ON product_category_hierarchy FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_pricing_tiers table (4 policies)
CREATE POLICY "Enable read for authenticated users on product_pricing_tiers"
    ON product_pricing_tiers FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on product_pricing_tiers"
    ON product_pricing_tiers FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on product_pricing_tiers"
    ON product_pricing_tiers FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on product_pricing_tiers"
    ON product_pricing_tiers FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_pricing_models table (4 policies)
CREATE POLICY "Enable read for authenticated users on product_pricing_models"
    ON product_pricing_models FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on product_pricing_models"
    ON product_pricing_models FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on product_pricing_models"
    ON product_pricing_models FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on product_pricing_models"
    ON product_pricing_models FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_inventory table (4 policies)
CREATE POLICY "Enable read for authenticated users on product_inventory"
    ON product_inventory FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on product_inventory"
    ON product_inventory FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on product_inventory"
    ON product_inventory FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on product_inventory"
    ON product_inventory FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_features table (4 policies)
CREATE POLICY "Enable read for authenticated users on product_features"
    ON product_features FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on product_features"
    ON product_features FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on product_features"
    ON product_features FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on product_features"
    ON product_features FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Product_distributor_authorizations table (4 policies)
CREATE POLICY "Enable read for authenticated users on product_distributor_authorizations"
    ON product_distributor_authorizations FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on product_distributor_authorizations"
    ON product_distributor_authorizations FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on product_distributor_authorizations"
    ON product_distributor_authorizations FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on product_distributor_authorizations"
    ON product_distributor_authorizations FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Opportunity_products table (4 policies)
CREATE POLICY "Enable read for authenticated users on opportunity_products"
    ON opportunity_products FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on opportunity_products"
    ON opportunity_products FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on opportunity_products"
    ON opportunity_products FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on opportunity_products"
    ON opportunity_products FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Sales table (4 policies)
CREATE POLICY "Enable read for authenticated users on sales"
    ON sales FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on sales"
    ON sales FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on sales"
    ON sales FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on sales"
    ON sales FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Migration_history table (read-only for authenticated users)
CREATE POLICY "Enable read for authenticated users on migration_history"
    ON migration_history FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');