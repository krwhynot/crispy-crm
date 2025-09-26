# Migrations & Seed Data Playbook

## Overview
This playbook provides step-by-step guidance for modifying database schema, managing migrations, seeding test data, and handling rollbacks in the Atomic CRM system.

## Migration Conventions

### Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Examples:
- `20250125000000_fresh_crm_schema.sql`
- `20250126143000_add_opportunity_indexes.sql`
- `20250127090000_create_product_inventory_table.sql`

### Migration Structure
```sql
-- Migration: 20250127090000_add_customer_segments.sql
-- Description: Add customer segmentation support
-- Author: John Doe
-- Date: 2025-01-27

-- UP Migration
BEGIN;

-- Add new column
ALTER TABLE organizations
ADD COLUMN customer_segment text;

-- Add check constraint
ALTER TABLE organizations
ADD CONSTRAINT valid_customer_segment
CHECK (customer_segment IN ('enterprise', 'mid-market', 'small-business', 'startup'));

-- Create index for performance
CREATE INDEX idx_organizations_customer_segment
ON organizations(customer_segment)
WHERE deleted_at IS NULL;

-- Backfill existing data
UPDATE organizations
SET customer_segment = CASE
  WHEN employee_count > 1000 THEN 'enterprise'
  WHEN employee_count > 100 THEN 'mid-market'
  WHEN employee_count > 10 THEN 'small-business'
  ELSE 'startup'
END
WHERE customer_segment IS NULL;

COMMIT;

-- DOWN Migration (stored separately)
-- ALTER TABLE organizations DROP COLUMN customer_segment;
```

## Common Migration Patterns

### 1. Adding a New Column
```sql
-- Safe column addition with default
ALTER TABLE opportunities
ADD COLUMN forecast_category text DEFAULT 'pipeline';

-- Add after data population
ALTER TABLE opportunities
ALTER COLUMN forecast_category DROP DEFAULT;

-- Add constraint after backfill
ALTER TABLE opportunities
ADD CONSTRAINT valid_forecast_category
CHECK (forecast_category IN ('pipeline', 'best_case', 'commit', 'closed'));
```

### 2. Creating a Junction Table
```sql
CREATE TABLE opportunity_products (
  opportunity_id bigint NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL,
  discount_percent numeric(5, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (opportunity_id, product_id)
);

-- Essential indexes
CREATE INDEX idx_opportunity_products_opportunity
ON opportunity_products(opportunity_id);

CREATE INDEX idx_opportunity_products_product
ON opportunity_products(product_id);

-- Enable RLS
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_policy"
ON opportunity_products
FOR ALL
TO authenticated
USING (true);
```

### 3. Adding JSONB Fields
```sql
-- Add flexible metadata field
ALTER TABLE products
ADD COLUMN custom_attributes jsonb DEFAULT '{}';

-- Add GIN index for JSONB queries
CREATE INDEX idx_products_custom_attributes
ON products USING gin(custom_attributes);

-- Example query usage
-- SELECT * FROM products WHERE custom_attributes @> '{"organic": true}';
```

### 4. Creating Materialized Views
```sql
CREATE MATERIALIZED VIEW opportunity_pipeline_summary AS
SELECT
  o.stage,
  COUNT(*) as opportunity_count,
  SUM(o.amount) as total_value,
  AVG(o.probability) as avg_probability,
  COUNT(DISTINCT o.customer_organization_id) as unique_customers,
  DATE_TRUNC('month', o.created_at) as month
FROM opportunities o
WHERE o.deleted_at IS NULL
  AND o.status = 'active'
GROUP BY o.stage, DATE_TRUNC('month', o.created_at);

-- Create indexes on materialized view
CREATE INDEX idx_pipeline_summary_stage
ON opportunity_pipeline_summary(stage);

CREATE INDEX idx_pipeline_summary_month
ON opportunity_pipeline_summary(month);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY opportunity_pipeline_summary;
```

### 5. Adding Enum Types
```sql
-- Create new enum
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');

-- Add column using enum
ALTER TABLE tasks
ADD COLUMN priority task_priority DEFAULT 'medium';

-- To modify enum (add value)
ALTER TYPE task_priority ADD VALUE 'critical' BEFORE 'urgent';
```

## Seed Data Management

### Development Seed Script
```javascript
// scripts/seed-data.js
const { createClient } = require('@supabase/supabase-js');
const faker = require('faker');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedOrganizations() {
  const organizations = [];

  // Create principals (manufacturers)
  for (let i = 0; i < 5; i++) {
    organizations.push({
      name: faker.company.companyName() + ' Manufacturing',
      organization_type: 'principal',
      is_principal: true,
      is_distributor: false,
      segment: faker.random.arrayElement(['Enterprise', 'Mid-Market']),
      industry: 'Food & Beverage',
      website: faker.internet.url(),
      city: faker.address.city(),
      state: faker.address.stateAbbr(),
      country: 'USA',
      annual_revenue: faker.datatype.number({ min: 1000000, max: 100000000 }),
      employee_count: faker.datatype.number({ min: 50, max: 500 })
    });
  }

  // Create distributors
  for (let i = 0; i < 3; i++) {
    organizations.push({
      name: faker.company.companyName() + ' Distribution',
      organization_type: 'distributor',
      is_principal: false,
      is_distributor: true,
      segment: 'Mid-Market',
      industry: 'Distribution',
      website: faker.internet.url(),
      city: faker.address.city(),
      state: faker.address.stateAbbr(),
      country: 'USA'
    });
  }

  // Create customers
  for (let i = 0; i < 20; i++) {
    organizations.push({
      name: faker.company.companyName(),
      organization_type: 'customer',
      is_principal: false,
      is_distributor: false,
      segment: faker.random.arrayElement(['Enterprise', 'Mid-Market', 'Small Business']),
      priority: faker.random.arrayElement(['A', 'B', 'C', 'D']),
      industry: faker.company.bsNoun(),
      website: faker.internet.url(),
      phone: faker.phone.phoneNumber(),
      email: faker.internet.email(),
      city: faker.address.city(),
      state: faker.address.stateAbbr(),
      country: 'USA',
      annual_revenue: faker.datatype.number({ min: 100000, max: 50000000 }),
      employee_count: faker.datatype.number({ min: 10, max: 1000 })
    });
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert(organizations)
    .select();

  console.log(`Seeded ${data.length} organizations`);
  return data;
}

async function seedContacts(organizations) {
  const contacts = [];

  for (const org of organizations.filter(o => o.organization_type === 'customer')) {
    // Create 2-5 contacts per customer
    const contactCount = faker.datatype.number({ min: 2, max: 5 });

    for (let i = 0; i < contactCount; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();

      contacts.push({
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        email: [{
          type: 'work',
          value: faker.internet.email(firstName, lastName, org.name.toLowerCase().replace(/\s+/g, '')),
          primary: true
        }],
        phone: [{
          type: faker.random.arrayElement(['mobile', 'office']),
          value: faker.phone.phoneNumber(),
          primary: true
        }],
        title: faker.name.jobTitle(),
        department: faker.name.jobArea(),
        role: faker.random.arrayElement(['decision_maker', 'influencer', 'buyer', 'end_user']),
        is_primary_contact: i === 0,
        purchase_influence: faker.random.arrayElement(['High', 'Medium', 'Low']),
        decision_authority: faker.random.arrayElement(['Decision Maker', 'Influencer', 'None'])
      });
    }
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert(contacts)
    .select();

  console.log(`Seeded ${data.length} contacts`);
  return data;
}

async function seedOpportunities(organizations, contacts) {
  const opportunities = [];
  const customers = organizations.filter(o => o.organization_type === 'customer');
  const principals = organizations.filter(o => o.organization_type === 'principal');
  const distributors = organizations.filter(o => o.organization_type === 'distributor');

  const stages = [
    'new_lead',
    'initial_outreach',
    'sample_visit_offered',
    'awaiting_response',
    'feedback_logged',
    'demo_scheduled'
  ];

  for (let i = 0; i < 50; i++) {
    const customer = faker.random.arrayElement(customers);
    const stage = faker.random.arrayElement(stages);

    opportunities.push({
      name: `${faker.company.bs()} - ${customer.name}`,
      description: faker.lorem.paragraph(),
      stage: stage,
      status: 'active',
      priority: faker.random.arrayElement(['low', 'medium', 'high', 'critical']),
      amount: faker.datatype.number({ min: 10000, max: 500000 }),
      category: faker.random.arrayElement(['New Business', 'Expansion', 'Renewal']),
      estimated_close_date: faker.date.between(new Date(), new Date(2025, 11, 31)),
      customer_organization_id: customer.id,
      principal_organization_id: faker.random.arrayElement(principals)?.id,
      distributor_organization_id: faker.random.arrayElement(distributors)?.id,
      next_action: faker.lorem.sentence(),
      next_action_date: faker.date.soon(),
      competition: faker.company.companyName(),
      decision_criteria: faker.lorem.words(5)
    });
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert(opportunities)
    .select();

  console.log(`Seeded ${data.length} opportunities`);
  return data;
}

async function seedProducts(principals) {
  const products = [];
  const categories = [
    'beverages', 'dairy', 'frozen', 'fresh_produce',
    'meat_poultry', 'snacks', 'condiments'
  ];

  for (const principal of principals) {
    // Create 10-20 products per principal
    const productCount = faker.datatype.number({ min: 10, max: 20 });

    for (let i = 0; i < productCount; i++) {
      products.push({
        principal_id: principal.id,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        sku: faker.datatype.alphaNumeric(10).toUpperCase(),
        upc: faker.datatype.number({ min: 100000000000, max: 999999999999 }).toString(),
        category: faker.random.arrayElement(categories),
        brand: principal.name.split(' ')[0],
        unit_of_measure: faker.random.arrayElement(['case', 'each', 'pound']),
        units_per_case: faker.datatype.number({ min: 6, max: 24 }),
        cost_per_unit: parseFloat(faker.commerce.price(5, 50)),
        list_price: parseFloat(faker.commerce.price(10, 100)),
        min_order_quantity: faker.datatype.number({ min: 1, max: 10 }),
        lead_time_days: faker.datatype.number({ min: 3, max: 14 }),
        status: 'active',
        is_seasonal: faker.datatype.boolean(),
        shelf_life_days: faker.datatype.number({ min: 30, max: 365 })
      });
    }
  }

  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select();

  console.log(`Seeded ${data.length} products`);
  return data;
}

async function main() {
  console.log('Starting seed process...');

  try {
    // Clear existing data (optional)
    if (process.argv.includes('--clean')) {
      console.log('Cleaning existing data...');
      await supabase.rpc('truncate_all_tables');
    }

    // Seed in order of dependencies
    const organizations = await seedOrganizations();
    const contacts = await seedContacts(organizations);
    const opportunities = await seedOpportunities(organizations, contacts);
    const products = await seedProducts(
      organizations.filter(o => o.is_principal)
    );

    // Create relationships
    await createContactOrganizationRelationships(contacts, organizations);
    await createOpportunityParticipants(opportunities, organizations);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
```

### Test Data Scenarios
```sql
-- Scenario 1: High-value opportunity pipeline
INSERT INTO opportunities (name, stage, amount, probability, customer_organization_id)
VALUES
  ('Enterprise Deal Q1', 'demo_scheduled', 500000, 85, 1),
  ('Mid-Market Expansion', 'feedback_logged', 250000, 70, 2),
  ('Small Business Package', 'initial_outreach', 50000, 20, 3);

-- Scenario 2: Multi-stakeholder opportunity
WITH opp AS (
  INSERT INTO opportunities (name, stage, amount)
  VALUES ('Complex Multi-Party Deal', 'awaiting_response', 750000)
  RETURNING id
)
INSERT INTO opportunity_participants (opportunity_id, organization_id, role)
SELECT opp.id, org_id, role
FROM opp,
  VALUES
    (1, 'customer'),
    (2, 'principal'),
    (3, 'distributor'),
    (4, 'partner')
  AS t(org_id, role);

-- Scenario 3: Contact with multiple organizations
WITH contact AS (
  INSERT INTO contacts (name, email)
  VALUES ('Jane Consultant', '[{"type":"work","value":"jane@consulting.com"}]'::jsonb)
  RETURNING id
)
INSERT INTO contact_organizations (contact_id, organization_id, role, is_primary)
SELECT contact.id, org_id, role, is_primary
FROM contact,
  VALUES
    (1, 'consultant', true),
    (2, 'advisor', false),
    (3, 'board_member', false)
  AS t(org_id, role, is_primary);
```

## Rollback Strategies

### Immediate Rollback (Within Transaction)
```sql
BEGIN;
-- Migration changes
ALTER TABLE opportunities ADD COLUMN test_field text;
-- Test the change
SELECT * FROM opportunities LIMIT 1;
-- If problematic
ROLLBACK;
```

### Timestamp-Based Rollback
```sql
-- Track migration history
CREATE TABLE migration_history (
  id bigint PRIMARY KEY,
  migration_name text NOT NULL,
  applied_at timestamptz DEFAULT now(),
  rollback_sql text,
  rolled_back_at timestamptz
);

-- Store rollback SQL
INSERT INTO migration_history (migration_name, rollback_sql)
VALUES (
  '20250127090000_add_forecast_field',
  'ALTER TABLE opportunities DROP COLUMN forecast_category;'
);

-- Execute rollback
UPDATE migration_history
SET rolled_back_at = now()
WHERE migration_name = '20250127090000_add_forecast_field';
```

### Data-Safe Rollback Pattern
```sql
-- Instead of dropping, rename and deprecate
ALTER TABLE opportunities
RENAME COLUMN old_field TO old_field_deprecated;

-- Add deprecation date
COMMENT ON COLUMN opportunities.old_field_deprecated IS
  'Deprecated: 2025-01-27. Remove after 2025-02-27';

-- Later, after verification
ALTER TABLE opportunities
DROP COLUMN old_field_deprecated;
```

## Migration Testing

### Pre-Migration Checklist
```bash
#!/bin/bash
# pre-migration.sh

echo "Pre-migration checks..."

# 1. Backup current schema
pg_dump --schema-only $DATABASE_URL > backup_schema_$(date +%Y%m%d).sql

# 2. Check for long-running queries
psql $DATABASE_URL -c "
  SELECT pid, usename, query, state
  FROM pg_stat_activity
  WHERE state != 'idle'
    AND query_start < now() - interval '5 minutes';
"

# 3. Verify no locks on target tables
psql $DATABASE_URL -c "
  SELECT t.relname, l.locktype, l.mode
  FROM pg_locks l
  JOIN pg_class t ON l.relation = t.oid
  WHERE t.relname = 'opportunities';
"

# 4. Test migration on copy
echo "Testing migration on database copy..."
```

### Migration Validation
```sql
-- Post-migration validation queries
-- 1. Check constraint validity
SELECT conname, contype, convalidated
FROM pg_constraint
WHERE conrelid = 'opportunities'::regclass
  AND NOT convalidated;

-- 2. Verify indexes are valid
SELECT indexrelid::regclass, indisvalid
FROM pg_index
WHERE indrelid = 'opportunities'::regclass
  AND NOT indisvalid;

-- 3. Check for orphaned records
SELECT COUNT(*)
FROM opportunity_contacts oc
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities o
  WHERE o.id = oc.opportunity_id
);

-- 4. Validate RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'opportunities';
```

## Using Supabase MCP Tools

### Apply Migration
```typescript
// Using MCP tool
await mcp.supabase.apply_migration({
  project_id: 'your-project-id',
  name: 'add_opportunity_forecast',
  query: `
    ALTER TABLE opportunities
    ADD COLUMN forecast_category text DEFAULT 'pipeline';
  `
});
```

### Execute Test Query
```typescript
// Test migration result
const result = await mcp.supabase.execute_sql({
  project_id: 'your-project-id',
  query: 'SELECT COUNT(*) FROM opportunities WHERE forecast_category IS NOT NULL'
});
```

## Best Practices

### DO's
✅ Always test migrations on a copy first
✅ Include rollback SQL in migration files
✅ Use transactions for multi-step migrations
✅ Add data validation after migration
✅ Document breaking changes
✅ Use `IF NOT EXISTS` for idempotency
✅ Add indexes CONCURRENTLY in production

### DON'Ts
❌ Drop columns immediately (deprecate first)
❌ Rename columns without aliases
❌ Change column types without casting
❌ Add NOT NULL without defaults
❌ Create unique constraints without checking duplicates
❌ Run migrations during peak usage
❌ Forget to update RLS policies

This playbook ensures safe, reliable database evolution with comprehensive rollback capabilities and testing procedures.