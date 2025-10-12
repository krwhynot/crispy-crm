-- Remove SECURITY DEFINER from views to respect RLS policies
-- Per Supabase security advisor recommendations

-- Fix contacts_summary view
DROP VIEW IF EXISTS contacts_summary CASCADE;
CREATE VIEW contacts_summary AS
SELECT
    c.*,
    array_agg(DISTINCT co.organization_id) FILTER (WHERE co.organization_id IS NOT NULL) as organization_ids
FROM contacts c
LEFT JOIN contact_organizations co ON co.contact_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- Fix product_catalog view
DROP VIEW IF EXISTS product_catalog CASCADE;
CREATE VIEW product_catalog AS
SELECT
    p.*,
    pt.tier_name,
    pt.min_quantity,
    pt.max_quantity,
    pt.unit_price,
    pt.discount_percent
FROM products p
LEFT JOIN product_pricing_tiers pt ON pt.product_id = p.id
WHERE p.deleted_at IS NULL
ORDER BY p.name, pt.tier_name;

-- Fix product_performance view
DROP VIEW IF EXISTS product_performance CASCADE;
CREATE VIEW product_performance AS
SELECT
    p.id,
    p.name,
    p.sku,
    p.category,
    COUNT(DISTINCT op.opportunity_id) as opportunity_count,
    SUM(op.quantity) as total_quantity_sold,
    SUM(op.quantity * op.unit_price) as total_revenue,
    AVG(op.discount_percent) as avg_discount
FROM products p
LEFT JOIN opportunity_products op ON op.product_id_reference = p.id
LEFT JOIN opportunities o ON o.id = op.opportunity_id AND o.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.sku, p.category;

-- Fix opportunities_summary view
DROP VIEW IF EXISTS opportunities_summary CASCADE;
CREATE VIEW opportunities_summary AS
SELECT
    o.*,
    c1.name as customer_name,
    c2.name as principal_name,
    c3.name as distributor_name,
    s.first_name || ' ' || s.last_name as sales_rep_name,
    COUNT(DISTINCT op.id) as item_count,
    SUM(op.quantity * op.unit_price * (1 - COALESCE(op.discount_percent, 0) / 100)) as total_amount
FROM opportunities o
LEFT JOIN organizations c1 ON c1.id = o.customer_organization_id
LEFT JOIN organizations c2 ON c2.id = o.principal_organization_id
LEFT JOIN organizations c3 ON c3.id = o.distributor_organization_id
LEFT JOIN sales s ON s.id = o.sales_id
LEFT JOIN opportunity_products op ON op.opportunity_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY
    o.id, o.name, o.stage, o.status, o.priority, o.probability, o.amount, o.category,
    o.index, o.estimated_close_date, o.actual_close_date,
    o.customer_organization_id, o.principal_organization_id, o.distributor_organization_id,
    o.founding_interaction_id, o.stage_manual, o.status_manual, o.next_action,
    o.next_action_date, o.competition, o.decision_criteria, o.contact_ids,
    o.sales_id, o.created_at, o.updated_at, o.created_by, o.deleted_at, o.search_tsv, o.tags,
    c1.name, c2.name, c3.name, s.first_name, s.last_name;