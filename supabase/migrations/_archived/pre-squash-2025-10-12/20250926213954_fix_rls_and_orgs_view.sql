-- Fix RLS policies for tasks table
-- Previous policies used 'true' instead of checking authentication
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON tasks;

CREATE POLICY "Enable read access for authenticated users" ON tasks
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON tasks
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON tasks
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON tasks
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Fix RLS policies for opportunityNotes table
-- Previous policies used 'true' instead of checking authentication
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "opportunityNotes";

CREATE POLICY "Enable read access for authenticated users" ON "opportunityNotes"
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON "opportunityNotes"
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON "opportunityNotes"
    FOR UPDATE TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON "opportunityNotes"
    FOR DELETE TO authenticated
    USING (auth.role() = 'authenticated');

-- Fix organizations_summary view to include created_at column
-- Previous view was missing created_at which caused ordering errors
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary AS
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
    o.created_at, -- Added to support ordering by created_at
    count(DISTINCT opp.id) AS opportunities_count,
    count(DISTINCT co.contact_id) AS contacts_count,
    max(opp.updated_at) AS last_opportunity_activity
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