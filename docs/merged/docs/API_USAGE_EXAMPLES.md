# API Usage Examples

## Common Use Cases with SQL/Function Examples

### 1. Contact Management

#### Adding a Contact to Multiple Organizations
```sql
-- Create a contact
INSERT INTO contacts (name, title, email_jsonb, created_at, created_by)
VALUES ('Jane Smith', 'Procurement Director',
        '{"primary": "jane@company.com"}', NOW(), 1)
RETURNING id;  -- Returns: 123

-- Add to multiple organizations
SELECT add_contact_to_organization(
    p_contact_id := 123,
    p_organization_id := 45,  -- First company
    p_is_primary_contact := true,
    p_role := 'decision_maker'::contact_role,
    p_purchase_influence := 'High'
);

SELECT add_contact_to_organization(
    p_contact_id := 123,
    p_organization_id := 67,  -- Second company
    p_role := 'influencer'::contact_role,
    p_purchase_influence := 'Medium'
);

-- View all organizations for a contact
SELECT * FROM get_contact_organizations(123);
```

#### Finding Decision Makers
```sql
-- Get all primary decision makers
SELECT
    c.name AS contact_name,
    comp.name AS company_name,
    co.purchase_influence
FROM contact_organizations co
JOIN contacts c ON co.contact_id = c.id
JOIN companies comp ON co.organization_id = comp.id
WHERE co.is_primary_decision_maker = true
  AND co.deleted_at IS NULL;
```

### 2. Opportunity Management

#### Creating Multi-Principal Opportunities
```sql
-- Method 1: Using the helper function
SELECT create_opportunity_with_participants(
    p_opportunity_data := '{
        "name": "Q1 2025 Hotel Chain Supply Deal",
        "stage": "qualified",
        "status": "active",
        "priority": "high",
        "estimated_value": 250000,
        "estimated_close_date": "2025-03-31",
        "contact_id": 123,
        "sale_id": 1
    }'::jsonb,
    p_participants := ARRAY[
        '{"organization_id": 45, "role": "customer", "is_primary": true}'::jsonb,
        '{"organization_id": 12, "role": "principal", "is_primary": true}'::jsonb,
        '{"organization_id": 23, "role": "principal", "is_primary": false}'::jsonb,
        '{"organization_id": 34, "role": "distributor", "is_primary": true, "commission_rate": 0.15}'::jsonb
    ]
);

-- Method 2: Manual insertion
BEGIN;
    -- Create opportunity
    INSERT INTO opportunities (name, stage, status, priority, estimated_value, sale_id)
    VALUES ('Direct Principal Deal', 'proposal', 'active', 'medium', 50000, 1)
    RETURNING id INTO v_opp_id;

    -- Add participants
    INSERT INTO opportunity_participants (opportunity_id, organization_id, role, is_primary)
    VALUES
        (v_opp_id, 45, 'customer', true),
        (v_opp_id, 12, 'principal', true);
COMMIT;
```

#### Retrieving Opportunities with All Participants
```sql
-- Get opportunity with all details
SELECT * FROM get_opportunity_with_participants(1);

-- View opportunities with multiple principals
SELECT
    id,
    name,
    stage,
    estimated_value,
    principal_count,
    principals
FROM opportunities_with_participants
WHERE principal_count > 1;
```

### 3. Activity Tracking

#### Logging Engagements (No Opportunity)
```sql
-- Log a general check-in call
SELECT log_engagement(
    p_type := 'call'::interaction_type,
    p_subject := 'Quarterly relationship check-in',
    p_description := 'Discussed upcoming needs and market trends',
    p_contact_id := 123,
    p_organization_id := 45,
    p_duration_minutes := 30,
    p_outcome := 'Positive - considering new products for Q2'
);

-- Log a trade show meeting
SELECT log_engagement(
    p_type := 'trade_show'::interaction_type,
    p_subject := 'Met at Food Service Expo 2025',
    p_description := 'Initial introduction to company products',
    p_organization_id := 89,  -- No specific contact
    p_follow_up_required := true,
    p_follow_up_date := '2025-02-15'
);
```

#### Logging Interactions (With Opportunity)
```sql
-- Log a product demo
SELECT log_interaction(
    p_opportunity_id := 456,
    p_type := 'demo'::interaction_type,
    p_subject := 'Product tasting and demonstration',
    p_description := 'Demonstrated new organic dairy line',
    p_contact_id := 123,
    p_duration_minutes := 90,
    p_sentiment := 'positive',
    p_outcome := 'Very interested, requested pricing',
    p_follow_up_required := true,
    p_follow_up_date := CURRENT_DATE + INTERVAL '3 days'
);

-- Log a negotiation call
SELECT log_interaction(
    p_opportunity_id := 456,
    p_type := 'call'::interaction_type,
    p_subject := 'Pricing negotiation',
    p_sentiment := 'neutral',
    p_outcome := 'Requested 10% discount for volume commitment'
);
```

#### Converting Engagement to Interaction
```sql
-- When an engagement leads to an opportunity
BEGIN;
    -- Create the opportunity
    INSERT INTO opportunities (name, stage, customer_organization_id)
    VALUES ('New opportunity from trade show', 'lead', 89)
    RETURNING id INTO v_opp_id;

    -- Convert the engagement
    SELECT convert_engagement_to_interaction(
        p_activity_id := 789,  -- The original engagement
        p_opportunity_id := v_opp_id
    );
COMMIT;
```

### 4. Principal & Product Management

#### Setting Up Principal-Distributor Relationships
```sql
-- Mark companies with appropriate flags
UPDATE companies SET is_principal = true
WHERE id IN (12, 23, 34);

UPDATE companies SET is_distributor = true
WHERE id IN (45, 56, 67);

-- Create relationship
INSERT INTO principal_distributor_relationships (
    principal_id,
    distributor_id,
    relationship_status,
    commission_percent,
    start_date
) VALUES (
    12,  -- Principal company
    45,  -- Distributor company
    'active',
    15.0,  -- 15% commission
    CURRENT_DATE
);
```

#### Adding Products
```sql
-- Add products for a principal
SELECT add_product(
    p_principal_id := 12,
    p_name := 'Organic Whole Milk - Gallon',
    p_sku := 'OWM-GAL-001',
    p_category := 'Dairy',
    p_unit_price := 5.99,
    p_description := 'USDA Organic certified whole milk'
);

SELECT add_product(
    p_principal_id := 12,
    p_name := 'Grass-Fed Butter - 1lb',
    p_sku := 'GFB-1LB-001',
    p_category := 'Dairy',
    p_unit_price := 7.49
);

-- View distributor's available products
SELECT * FROM get_distributor_products(45);
```

### 5. Reporting Queries

#### Contact Influence Analysis
```sql
-- Top influencers across multiple organizations
SELECT
    contact_name,
    organization_count,
    advocated_principals_count,
    avg_advocacy_strength,
    organizations
FROM contact_influence_profile
WHERE organization_count > 1
ORDER BY avg_advocacy_strength DESC;
```

#### Principal Performance
```sql
-- Principal dashboard
SELECT
    principal_name,
    distributor_count,
    product_count,
    active_product_count,
    avg_commission_percent
FROM principal_product_summary
ORDER BY product_count DESC;
```

#### Activity Timeline
```sql
-- Get complete activity history for an organization
SELECT * FROM get_activity_timeline(
    p_entity_type := 'organization',
    p_entity_id := 45,
    p_limit := 50
);

-- Get interactions for an opportunity
SELECT * FROM get_activity_timeline(
    p_entity_type := 'opportunity',
    p_entity_id := 456,
    p_limit := 20
);
```

#### Opportunity Pipeline
```sql
-- Active opportunities by stage
SELECT
    stage,
    COUNT(*) as count,
    SUM(estimated_value) as total_value,
    AVG(probability) as avg_probability
FROM opportunities
WHERE deleted_at IS NULL
  AND status = 'active'
GROUP BY stage
ORDER BY
    CASE stage
        WHEN 'lead' THEN 1
        WHEN 'qualified' THEN 2
        WHEN 'needs_analysis' THEN 3
        WHEN 'proposal' THEN 4
        WHEN 'negotiation' THEN 5
        WHEN 'closed_won' THEN 6
        WHEN 'closed_lost' THEN 7
    END;
```

### 6. Advanced Scenarios

#### Finding Orphaned Records
```sql
-- Contacts without organizations
SELECT c.*
FROM contacts c
LEFT JOIN contact_organizations co ON c.id = co.contact_id
WHERE co.id IS NULL
  AND c.deleted_at IS NULL;

-- Opportunities without participants
SELECT o.*
FROM opportunities o
LEFT JOIN opportunity_participants op ON o.id = op.opportunity_id
WHERE op.id IS NULL
  AND o.deleted_at IS NULL;
```

#### Multi-Principal Deal Analysis
```sql
-- Opportunities with competing principals
WITH multi_principal_opps AS (
    SELECT
        o.id,
        o.name,
        o.estimated_value,
        jsonb_agg(
            jsonb_build_object(
                'principal_id', op.organization_id,
                'principal_name', c.name,
                'is_primary', op.is_primary
            ) ORDER BY op.is_primary DESC
        ) as principals
    FROM opportunities o
    JOIN opportunity_participants op ON o.id = op.opportunity_id
    JOIN companies c ON op.organization_id = c.id
    WHERE op.role = 'principal'
      AND op.deleted_at IS NULL
    GROUP BY o.id, o.name, o.estimated_value
    HAVING COUNT(*) > 1
)
SELECT * FROM multi_principal_opps
ORDER BY estimated_value DESC;
```

#### Contact Advocacy Network
```sql
-- Which contacts advocate for which principals
SELECT
    c.name as contact_name,
    comp.name as contact_company,
    prin.name as advocated_principal,
    cpp.advocacy_strength,
    cpp.relationship_type,
    cpp.last_interaction_date
FROM contact_preferred_principals cpp
JOIN contacts c ON cpp.contact_id = c.id
JOIN companies prin ON cpp.principal_organization_id = prin.id
LEFT JOIN contact_organizations co ON c.id = co.contact_id AND co.is_primary_contact = true
LEFT JOIN companies comp ON co.organization_id = comp.id
WHERE cpp.deleted_at IS NULL
  AND cpp.advocacy_strength >= 7  -- Strong advocates
ORDER BY cpp.advocacy_strength DESC;
```

### 7. Bulk Operations

#### Bulk Import Contacts
```sql
-- Import multiple contacts at once
WITH new_contacts AS (
    INSERT INTO contacts (name, title, email_jsonb, created_by)
    VALUES
        ('John Doe', 'Buyer', '{"primary": "john@hotel.com"}', 1),
        ('Jane Smith', 'CFO', '{"primary": "jane@restaurant.com"}', 1),
        ('Bob Johnson', 'Owner', '{"primary": "bob@store.com"}', 1)
    RETURNING id, name
),
org_assignments AS (
    INSERT INTO contact_organizations (contact_id, organization_id, role)
    SELECT
        nc.id,
        45,  -- Assign all to same org initially
        'influencer'::contact_role
    FROM new_contacts nc
)
SELECT * FROM new_contacts;
```

#### Update All Principal Relationships
```sql
-- Bulk update commission rates
UPDATE principal_distributor_relationships
SET commission_percent =
    CASE
        WHEN distributor_id IN (SELECT id FROM companies WHERE priority = 'A') THEN 18.0
        WHEN distributor_id IN (SELECT id FROM companies WHERE priority = 'B') THEN 16.0
        ELSE 14.0
    END
WHERE relationship_status = 'active'
  AND deleted_at IS NULL;
```

## Error Handling Examples

### Common Validation Errors
```sql
-- This will fail: Interaction without opportunity
INSERT INTO activities (activity_type, type, subject, opportunity_id)
VALUES ('interaction', 'call', 'Test call', NULL);
-- ERROR: Interactions must be linked to an opportunity (Business Rule Q21)

-- This will fail: Company as both customer and distributor
UPDATE companies
SET organization_type = 'customer', is_distributor = true
WHERE id = 1;
-- ERROR: A company cannot be both a customer and a distributor (Business Rule Q1)

-- This will fail: Non-principal adding products
SELECT add_product(
    p_principal_id := 999,  -- Not marked as principal
    p_name := 'Test Product',
    p_sku := 'TEST-001'
);
-- ERROR: Company 999 is not marked as a principal
```

## Performance Tips

1. **Use indexes for common queries**
```sql
-- Already created indexes
-- idx_opportunities_stage
-- idx_contacts_deleted_at
-- idx_activities_opportunity
```

2. **Use batch operations when possible**
```sql
-- Good: Single query
INSERT INTO opportunity_participants (opportunity_id, organization_id, role)
VALUES (1, 2, 'customer'), (1, 3, 'principal'), (1, 4, 'distributor');

-- Bad: Multiple queries
INSERT INTO opportunity_participants VALUES (1, 2, 'customer');
INSERT INTO opportunity_participants VALUES (1, 3, 'principal');
INSERT INTO opportunity_participants VALUES (1, 4, 'distributor');
```

3. **Use views for complex repeated queries**
```sql
-- Use the pre-built views
SELECT * FROM opportunities_with_participants;
-- Instead of writing complex joins repeatedly
```

---

**API Version**: MVP+1
**Last Updated**: 2025-01-22
**Database**: PostgreSQL 15+