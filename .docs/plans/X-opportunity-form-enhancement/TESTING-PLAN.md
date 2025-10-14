# Testing Plan - Opportunity Form Enhancement

**Purpose:** Increase implementation confidence from 40% to 95%+ through systematic testing
**Target:** Complete before staging deployment
**Estimated Effort:** 15-20 hours total

---

## Testing Phases Overview

| Phase | Focus Area | Confidence Gain | Duration | Blocker? |
|-------|-----------|----------------|----------|----------|
| Phase 1A | Data Provider Integration | 30% → 90% | 8 hours | ✅ YES |
| Phase 1B | Database Migration | 70% → 95% | 4 hours | ✅ YES |
| Phase 2A | Validation Schema | 85% → 98% | 2 hours | ⚠️ Recommended |
| Phase 2B | React Admin Forms | 90% → 98% | 3 hours | ⚠️ Recommended |
| Phase 3 | Display Components | 80% → 95% | 2 hours | Optional |

**Total Confidence Gain:** 40% → 95%+

---

## PHASE 1A: Data Provider Integration Tests (CRITICAL)

**Priority:** P0 (BLOCKER)
**Duration:** 8 hours
**Confidence Impact:** 30% → 90%

### Test File Structure

```
src/atomic-crm/providers/supabase/
├── unifiedDataProvider.opportunities.test.ts  (NEW)
├── opportunityProducts.integration.test.ts    (NEW)
└── rpcFunction.integration.test.ts            (NEW)
```

---

### Test 1.1: getOne - Fetch Opportunity with Products

**File:** `unifiedDataProvider.opportunities.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unifiedDataProvider } from './unifiedDataProvider';
import { supabase } from '@/supabaseClient';

describe('Opportunity Data Provider - getOne', () => {
  let testOpportunityId: number;

  beforeAll(async () => {
    // Create test opportunity with products
    const { data: opportunity } = await supabase
      .from('opportunities')
      .insert({
        name: 'Test Opportunity',
        opportunity_context: 'Site Visit',
        stage: 'new_lead',
        priority: 'medium',
        probability: 50,
        expected_closing_date: '2025-12-31',
        opportunity_owner_id: 1,
        contact_ids: [1],
      })
      .select()
      .single();

    testOpportunityId = opportunity.id;

    // Add test products
    await supabase
      .from('opportunity_products')
      .insert([
        {
          opportunity_id: testOpportunityId,
          product_id_reference: 1,
          product_name: 'Test Product 1',
          quantity: 10,
          unit_price: 25.50,
        },
        {
          opportunity_id: testOpportunityId,
          product_id_reference: 2,
          product_name: 'Test Product 2',
          quantity: 5,
          unit_price: 100.00,
        },
      ]);
  });

  afterAll(async () => {
    // Cleanup
    await supabase
      .from('opportunity_products')
      .delete()
      .eq('opportunity_id', testOpportunityId);

    await supabase
      .from('opportunities')
      .delete()
      .eq('id', testOpportunityId);
  });

  it('should fetch opportunity with nested products', async () => {
    const result = await unifiedDataProvider.getOne('opportunities', {
      id: testOpportunityId,
    });

    // Verify opportunity data
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe(testOpportunityId);
    expect(result.data.name).toBe('Test Opportunity');
    expect(result.data.opportunity_context).toBe('Site Visit');

    // Verify products are included
    expect(result.data.products).toBeDefined();
    expect(Array.isArray(result.data.products)).toBe(true);
    expect(result.data.products).toHaveLength(2);

    // Verify product structure
    const product1 = result.data.products[0];
    expect(product1.product_name).toBe('Test Product 1');
    expect(product1.quantity).toBe(10);
    expect(product1.unit_price).toBe(25.50);
    expect(product1.extended_price).toBe(255.00); // Generated column
  });

  it('should handle opportunity with no products', async () => {
    // Create opportunity without products
    const { data: emptyOpp } = await supabase
      .from('opportunities')
      .insert({
        name: 'Empty Opportunity',
        stage: 'new_lead',
        expected_closing_date: '2025-12-31',
        opportunity_owner_id: 1,
        contact_ids: [1],
      })
      .select()
      .single();

    const result = await unifiedDataProvider.getOne('opportunities', {
      id: emptyOpp.id,
    });

    expect(result.data.products).toBeDefined();
    expect(Array.isArray(result.data.products)).toBe(true);
    expect(result.data.products).toHaveLength(0);

    // Cleanup
    await supabase.from('opportunities').delete().eq('id', emptyOpp.id);
  });

  it('should include denormalized organization names from view', async () => {
    const result = await unifiedDataProvider.getOne('opportunities', {
      id: testOpportunityId,
    });

    // Verify view includes denormalized fields
    expect(result.data.customer_organization_name).toBeDefined();
    // Note: May be null if no organization linked, that's OK
  });
});
```

---

### Test 1.2: getList - Fetch Opportunities with Products

```typescript
describe('Opportunity Data Provider - getList', () => {
  it('should fetch list with products for each opportunity', async () => {
    const result = await unifiedDataProvider.getList('opportunities', {
      pagination: { page: 1, perPage: 10 },
      sort: { field: 'id', order: 'DESC' },
      filter: {},
    });

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.total).toBeGreaterThan(0);

    // Verify each opportunity has products array
    result.data.forEach(opp => {
      expect(opp.products).toBeDefined();
      expect(Array.isArray(opp.products)).toBe(true);
    });
  });

  it('should apply filters correctly', async () => {
    const result = await unifiedDataProvider.getList('opportunities', {
      pagination: { page: 1, perPage: 10 },
      sort: { field: 'id', order: 'DESC' },
      filter: { stage: ['new_lead', 'qualified'] },
    });

    result.data.forEach(opp => {
      expect(['new_lead', 'qualified']).toContain(opp.stage);
    });
  });

  it('should handle pagination correctly', async () => {
    const page1 = await unifiedDataProvider.getList('opportunities', {
      pagination: { page: 1, perPage: 2 },
      sort: { field: 'id', order: 'ASC' },
      filter: {},
    });

    const page2 = await unifiedDataProvider.getList('opportunities', {
      pagination: { page: 2, perPage: 2 },
      sort: { field: 'id', order: 'ASC' },
      filter: {},
    });

    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(2);
    expect(page1.data[0].id).not.toBe(page2.data[0].id);
  });
});
```

---

### Test 1.3: RPC Function - Create Opportunity with Products

**File:** `rpcFunction.integration.test.ts`

```typescript
describe('RPC sync_opportunity_with_products - Create', () => {
  it('should create opportunity with multiple products atomically', async () => {
    const { data, error } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        name: 'RPC Test Opportunity',
        opportunity_context: 'Food Show',
        stage: 'new_lead',
        priority: 'high',
        amount: 1000,
        probability: 75,
        expected_closing_date: '2025-12-31',
        customer_organization_id: 1,
        principal_organization_id: 1,
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [
        {
          product_id_reference: 1,
          product_name: 'Product A',
          quantity: 10,
          unit_price: 50.00,
          notes: 'Test product A',
        },
        {
          product_id_reference: 2,
          product_name: 'Product B',
          quantity: 5,
          unit_price: 100.00,
          notes: 'Test product B',
        },
      ],
      products_to_update: [],
      product_ids_to_delete: [],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('RPC Test Opportunity');
    expect(data.products).toHaveLength(2);

    // Verify extended_price was calculated
    expect(data.products[0].extended_price).toBe(500.00); // 10 * 50
    expect(data.products[1].extended_price).toBe(500.00); // 5 * 100

    // Cleanup
    await supabase.from('opportunities').delete().eq('id', data.id);
  });

  it('should rollback if product insert fails', async () => {
    // Test atomicity - if products fail, opportunity should not be created
    const { error } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        name: 'Should Fail',
        stage: 'new_lead',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [
        {
          product_id_reference: 99999, // Invalid FK - should fail
          product_name: 'Invalid Product',
          quantity: 1,
          unit_price: 10,
        },
      ],
      products_to_update: [],
      product_ids_to_delete: [],
    });

    expect(error).not.toBeNull();

    // Verify opportunity was not created
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('*')
      .eq('name', 'Should Fail');

    expect(opportunities).toHaveLength(0);
  });

  it('should reject generated columns in input', async () => {
    // This should fail if RPC tries to insert extended_price
    const { error } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        name: 'Test',
        stage: 'new_lead',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [
        {
          product_id_reference: 1,
          product_name: 'Test',
          quantity: 1,
          unit_price: 10,
          extended_price: 999, // This should be ignored/rejected
        },
      ],
      products_to_update: [],
      product_ids_to_delete: [],
    });

    // Should succeed - RPC ignores extended_price
    expect(error).toBeNull();
  });
});
```

---

### Test 1.4: RPC Function - Update Products

```typescript
describe('RPC sync_opportunity_with_products - Update', () => {
  let testOppId: number;
  let productIds: number[];

  beforeAll(async () => {
    // Create test opportunity with products
    const { data } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        name: 'Update Test',
        stage: 'new_lead',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [
        { product_id_reference: 1, product_name: 'P1', quantity: 5, unit_price: 10 },
        { product_id_reference: 2, product_name: 'P2', quantity: 3, unit_price: 20 },
      ],
      products_to_update: [],
      product_ids_to_delete: [],
    });

    testOppId = data.id;
    productIds = data.products.map(p => p.id);
  });

  afterAll(async () => {
    await supabase.from('opportunities').delete().eq('id', testOppId);
  });

  it('should update existing product quantities', async () => {
    const { data, error } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        id: testOppId,
        name: 'Update Test',
        stage: 'new_lead',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [],
      products_to_update: [
        {
          id: productIds[0],
          product_id_reference: 1,
          product_name: 'P1',
          quantity: 10, // Changed from 5
          unit_price: 10,
        },
      ],
      product_ids_to_delete: [],
    });

    expect(error).toBeNull();
    expect(data.products[0].quantity).toBe(10);
    expect(data.products[0].extended_price).toBe(100); // Recalculated
  });

  it('should delete products', async () => {
    const { data, error } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        id: testOppId,
        name: 'Update Test',
        stage: 'new_lead',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [],
      products_to_update: [],
      product_ids_to_delete: [productIds[1]], // Delete second product
    });

    expect(error).toBeNull();
    expect(data.products).toHaveLength(1);
    expect(data.products[0].id).toBe(productIds[0]);
  });

  it('should handle create, update, delete in one call', async () => {
    const { data, error } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        id: testOppId,
        name: 'Mixed Operations',
        stage: 'qualified',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [
        { product_id_reference: 3, product_name: 'P3', quantity: 7, unit_price: 30 },
      ],
      products_to_update: [
        { id: productIds[0], product_id_reference: 1, product_name: 'P1', quantity: 15, unit_price: 12 },
      ],
      product_ids_to_delete: [],
    });

    expect(error).toBeNull();
    expect(data.products).toHaveLength(2); // Updated P1 + new P3
    expect(data.name).toBe('Mixed Operations');
    expect(data.stage).toBe('qualified');
  });
});
```

---

### Test 1.5: Data Provider create/update with Products

```typescript
describe('Opportunity Data Provider - create with products', () => {
  it('should create opportunity and products via data provider', async () => {
    const result = await unifiedDataProvider.create('opportunities', {
      data: {
        name: 'Provider Test',
        opportunity_context: 'Demo Request',
        stage: 'new_lead',
        priority: 'medium',
        probability: 50,
        expected_closing_date: '2025-12-31',
        customer_organization_id: 1,
        contact_ids: [1],
        opportunity_owner_id: 1,
        products_to_sync: [
          {
            product_id_reference: 1,
            product_name: 'Test Product',
            quantity: 5,
            unit_price: 25.00,
          },
        ],
      },
    });

    expect(result.data).toBeDefined();
    expect(result.data.id).toBeDefined();
    expect(result.data.products).toHaveLength(1);

    // Cleanup
    await supabase.from('opportunities').delete().eq('id', result.data.id);
  });

  it('should validate opportunity data before RPC call', async () => {
    await expect(
      unifiedDataProvider.create('opportunities', {
        data: {
          // Missing required field: name
          stage: 'new_lead',
          expected_closing_date: '2025-12-31',
          contact_ids: [],
          products_to_sync: [],
        },
      })
    ).rejects.toThrow(/Validation failed/);
  });

  it('should validate products before RPC call', async () => {
    await expect(
      unifiedDataProvider.create('opportunities', {
        data: {
          name: 'Test',
          stage: 'new_lead',
          expected_closing_date: '2025-12-31',
          contact_ids: [1],
          opportunity_owner_id: 1,
          products_to_sync: [
            {
              // Missing required field: product_id_reference
              product_name: 'Invalid',
              quantity: 1,
            },
          ],
        },
      })
    ).rejects.toThrow();
  });
});

describe('Opportunity Data Provider - update with products', () => {
  let testOppId: number;
  let originalProductId: number;

  beforeAll(async () => {
    const { data } = await supabase.rpc('sync_opportunity_with_products', {
      opportunity_data: {
        name: 'Update Via Provider Test',
        stage: 'new_lead',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
      },
      products_to_create: [
        { product_id_reference: 1, product_name: 'Original', quantity: 1, unit_price: 10 },
      ],
      products_to_update: [],
      product_ids_to_delete: [],
    });

    testOppId = data.id;
    originalProductId = data.products[0].id;
  });

  afterAll(async () => {
    await supabase.from('opportunities').delete().eq('id', testOppId);
  });

  it('should update opportunity with product changes', async () => {
    const result = await unifiedDataProvider.update('opportunities', {
      id: testOppId,
      data: {
        name: 'Updated Name',
        stage: 'qualified',
        expected_closing_date: '2025-12-31',
        contact_ids: [1],
        opportunity_owner_id: 1,
        products_to_sync: [
          {
            id: originalProductId,
            product_id_reference: 1,
            product_name: 'Original',
            quantity: 5, // Changed
            unit_price: 15, // Changed
          },
          {
            // New product
            product_id_reference: 2,
            product_name: 'New Product',
            quantity: 3,
            unit_price: 20,
          },
        ],
      },
      previousData: {
        products: [
          { id: originalProductId, product_id_reference: 1, quantity: 1, unit_price: 10 },
        ],
      },
    });

    expect(result.data.name).toBe('Updated Name');
    expect(result.data.products).toHaveLength(2);
    expect(result.data.products[0].quantity).toBe(5);
  });
});
```

---

## PHASE 1B: Database Migration Testing (CRITICAL)

**Priority:** P0 (BLOCKER)
**Duration:** 4 hours
**Confidence Impact:** 70% → 95%

### Migration Test Procedure

**File:** `/supabase/migrations/test_20250930150000.sh`

```bash
#!/bin/bash
# Database Migration Testing Script
# Run on STAGING database only

set -e  # Exit on error

echo "=== Phase 1B: Database Migration Test ==="
echo "Database: $DATABASE_URL"
echo "Starting at: $(date)"

# 1. Pre-Migration Dependency Check
echo -e "\n[1/8] Running dependency checks..."
psql $DATABASE_URL -f supabase/migrations/pre_migration_check.sql > migration_dependencies.txt

echo "Found dependencies:"
cat migration_dependencies.txt

read -p "Review dependencies. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration aborted"
    exit 1
fi

# 2. Backup current view definition
echo -e "\n[2/8] Backing up current schema..."
pg_dump $DATABASE_URL --schema-only > backup_schema_$(date +%Y%m%d_%H%M%S).sql
echo "Backup saved"

# 3. Test migration in transaction (with rollback)
echo -e "\n[3/8] Testing migration (will rollback)..."
psql $DATABASE_URL <<EOF
BEGIN;

-- Execute migration
\i supabase/migrations/20250930150000_add_opportunity_context_and_owner.sql

-- Verify changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('opportunity_context', 'opportunity_owner_id');

-- Check view exists
SELECT table_name
FROM information_schema.views
WHERE table_name = 'opportunities_summary';

-- Check trigger function
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'update_opportunities_search';

-- Rollback (this was just a test)
ROLLBACK;
EOF

echo "Dry run completed successfully"

# 4. Execute actual migration
read -p "Execute migration for real? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration skipped"
    exit 0
fi

echo -e "\n[4/8] Executing migration..."
psql $DATABASE_URL -f supabase/migrations/20250930150000_add_opportunity_context_and_owner.sql

# 5. Verify schema changes
echo -e "\n[5/8] Verifying schema..."
psql $DATABASE_URL <<EOF
-- Check renamed columns exist
SELECT COUNT(*) as opportunity_context_exists
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'opportunity_context';

SELECT COUNT(*) as opportunity_owner_id_exists
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'opportunity_owner_id';

-- Check old columns don't exist
SELECT COUNT(*) as category_gone
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'category';

SELECT COUNT(*) as sales_id_gone
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'sales_id';
EOF

# 6. Test view queries
echo -e "\n[6/8] Testing view queries..."
psql $DATABASE_URL <<EOF
-- Query view to ensure it works
SELECT id, name, opportunity_context, opportunity_owner_id
FROM opportunities_summary
LIMIT 5;

-- Check products JSON is valid
SELECT id, jsonb_array_length(products::jsonb) as product_count
FROM opportunities_summary
LIMIT 5;
EOF

# 7. Test RPC function
echo -e "\n[7/8] Testing RPC function..."
psql $DATABASE_URL <<EOF
-- Test RPC with minimal data
SELECT sync_opportunity_with_products(
  '{"name": "RPC Test", "stage": "new_lead", "expected_closing_date": "2025-12-31", "contact_ids": [1], "opportunity_owner_id": 1}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ARRAY[]::int[]
);

-- Clean up test data
DELETE FROM opportunities WHERE name = 'RPC Test';
EOF

# 8. Test application queries
echo -e "\n[8/8] Testing application compatibility..."
psql $DATABASE_URL <<EOF
-- Simulate typical application queries
SELECT * FROM opportunities_summary WHERE opportunity_owner_id = 1 LIMIT 1;
SELECT * FROM opportunities WHERE opportunity_context = 'Site Visit' LIMIT 1;
EOF

echo -e "\n=== Migration Test Complete ==="
echo "Completed at: $(date)"
echo -e "\nNext steps:"
echo "1. Run application smoke tests"
echo "2. Monitor logs for errors"
echo "3. Have rollback script ready: 20250930150000_rollback.sql"
```

---

### Migration Rollback Test

**File:** `/supabase/migrations/test_rollback.sh`

```bash
#!/bin/bash
# Test rollback procedure

echo "=== Testing Migration Rollback ==="

# This should only be run if migration was successful
# and you want to verify rollback works

read -p "This will rollback the migration. Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo "Executing rollback..."
psql $DATABASE_URL -f supabase/migrations/20250930150000_add_opportunity_context_and_owner_rollback.sql

echo "Verifying rollback..."
psql $DATABASE_URL <<EOF
-- Check old columns are back
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('category', 'sales_id');

-- Check new columns are gone
SELECT COUNT(*) as should_be_zero
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('opportunity_context', 'opportunity_owner_id');
EOF

echo "Rollback test complete"
```

---

## PHASE 2A: Validation Schema Tests

**Priority:** P1 (Recommended)
**Duration:** 2 hours
**Confidence Impact:** 85% → 98%

### Test File

**File:** `src/atomic-crm/validation/opportunities.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  validateOpportunityProduct,
  opportunityProductSchema,
  opportunityContextSchema,
} from './opportunities';

describe('Opportunity Product Validation', () => {
  it('should accept valid product data', () => {
    const validProduct = {
      product_id_reference: 1,
      product_name: 'Test Product',
      product_category: 'Equipment',
      quantity: 10,
      unit_price: 25.50,
      discount_percent: 10,
      notes: 'Test notes',
    };

    expect(() => validateOpportunityProduct(validProduct)).not.toThrow();
  });

  it('should reject missing product_id_reference', () => {
    const invalid = {
      product_name: 'Test',
      quantity: 1,
      unit_price: 10,
    };

    expect(() => validateOpportunityProduct(invalid)).toThrow(/Product is required/);
  });

  it('should reject discount_percent > 100', () => {
    const invalid = {
      product_id_reference: 1,
      product_name: 'Test',
      quantity: 1,
      unit_price: 10,
      discount_percent: 150, // Invalid
    };

    expect(() => validateOpportunityProduct(invalid)).toThrow();
  });

  it('should reject negative quantity', () => {
    const invalid = {
      product_id_reference: 1,
      product_name: 'Test',
      quantity: -5, // Invalid
      unit_price: 10,
    };

    expect(() => validateOpportunityProduct(invalid)).toThrow();
  });

  it('should handle optional fields', () => {
    const minimal = {
      product_id_reference: 1,
      product_name: 'Test',
    };

    expect(() => validateOpportunityProduct(minimal)).not.toThrow();
  });

  it('should NOT validate extended_price (generated column)', () => {
    const withGeneratedField = {
      product_id_reference: 1,
      product_name: 'Test',
      extended_price: 999, // Should be ignored/stripped
    };

    // Validation should pass (field ignored)
    const result = opportunityProductSchema.parse(withGeneratedField);
    expect(result.extended_price).toBeUndefined();
  });
});

describe('Opportunity Context Validation', () => {
  it('should accept valid context values', () => {
    const validContexts = [
      'Site Visit',
      'Food Show',
      'New Product Interest',
      'Follow-up',
      'Demo Request',
      'Sampling',
      'Custom',
    ];

    validContexts.forEach(context => {
      expect(() => opportunityContextSchema.parse(context)).not.toThrow();
    });
  });

  it('should reject invalid context value', () => {
    expect(() => opportunityContextSchema.parse('Invalid Context')).toThrow();
  });

  it('should accept undefined (optional field)', () => {
    expect(() => opportunityContextSchema.parse(undefined)).not.toThrow();
  });
});
```

---

## PHASE 2B: React Admin Form Tests

**Priority:** P1 (Recommended)
**Duration:** 3 hours
**Confidence Impact:** 90% → 98%

### Test File

**File:** `src/atomic-crm/opportunities/OpportunityProductsInput.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContext, Form } from 'react-admin';
import { OpportunityProductsInput } from './OpportunityProductsInput';

describe('OpportunityProductsInput', () => {
  const mockDataProvider = {
    getList: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
    getOne: vi.fn(() => Promise.resolve({ data: {} })),
    getMany: vi.fn(() => Promise.resolve({ data: [] })),
    getManyReference: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
    create: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    update: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    updateMany: vi.fn(() => Promise.resolve({ data: [] })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    deleteMany: vi.fn(() => Promise.resolve({ data: [] })),
  };

  const Wrapper = ({ children }) => (
    <AdminContext dataProvider={mockDataProvider}>
      <Form defaultValues={{ principal_organization_id: null, products: [] }}>
        {children}
      </Form>
    </AdminContext>
  );

  it('should render with empty products array', () => {
    render(
      <Wrapper>
        <OpportunityProductsInput />
      </Wrapper>
    );

    expect(screen.getByText(/Product Line Items/i)).toBeInTheDocument();
  });

  it('should show message when no principal selected', () => {
    render(
      <Wrapper>
        <OpportunityProductsInput />
      </Wrapper>
    );

    expect(
      screen.getByText(/Select a principal organization to add products/i)
    ).toBeInTheDocument();
  });

  it('should enable product selection when principal is set', async () => {
    const WrapperWithPrincipal = ({ children }) => (
      <AdminContext dataProvider={mockDataProvider}>
        <Form defaultValues={{ principal_organization_id: 1, products: [] }}>
          {children}
        </Form>
      </AdminContext>
    );

    render(
      <WrapperWithPrincipal>
        <OpportunityProductsInput />
      </WrapperWithPrincipal>
    );

    // Product input should not be disabled
    // (Implementation detail - adjust based on actual component)
  });

  it('should add product row when Add button clicked', async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <OpportunityProductsInput />
      </Wrapper>
    );

    // SimpleFormIterator adds "Add" button
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    // Should show product input fields
    // (Implementation detail - verify based on actual component)
  });
});
```

---

## PHASE 3: Display Component Tests

**Priority:** P2 (Optional)
**Duration:** 2 hours
**Confidence Impact:** 80% → 95%

### Test File

**File:** `src/atomic-crm/opportunities/OpportunityCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpportunityCardContent } from './OpportunityCard';

describe('OpportunityCard - Product Display', () => {
  it('should handle opportunity with no products', () => {
    const opportunity = {
      id: 1,
      name: 'Test Opportunity',
      products: [],
    };

    render(<OpportunityCardContent opportunity={opportunity} />);

    // Should not show products section
    expect(screen.queryByText(/Products:/i)).not.toBeInTheDocument();
  });

  it('should display single product name', () => {
    const opportunity = {
      id: 1,
      name: 'Test Opportunity',
      products: [{ id: 1, product_name: 'Widget A' }],
    };

    render(<OpportunityCardContent opportunity={opportunity} />);

    expect(screen.getByText(/Widget A/i)).toBeInTheDocument();
  });

  it('should display "+N more" for multiple products', () => {
    const opportunity = {
      id: 1,
      name: 'Test Opportunity',
      products: [
        { id: 1, product_name: 'Widget A' },
        { id: 2, product_name: 'Widget B' },
        { id: 3, product_name: 'Widget C' },
      ],
    };

    render(<OpportunityCardContent opportunity={opportunity} />);

    expect(screen.getByText(/Widget A \+2 more/i)).toBeInTheDocument();
  });

  it('should handle null product_name', () => {
    const opportunity = {
      id: 1,
      name: 'Test Opportunity',
      products: [
        { id: 1, product_name: null },
        { id: 2, product_name: 'Widget B' },
      ],
    };

    render(<OpportunityCardContent opportunity={opportunity} />);

    // Should show count instead of null
    expect(screen.getByText(/2 products/i)).toBeInTheDocument();
  });

  it('should handle undefined products array', () => {
    const opportunity = {
      id: 1,
      name: 'Test Opportunity',
      products: undefined,
    };

    render(<OpportunityCardContent opportunity={opportunity} />);

    // Should not crash
    expect(screen.queryByText(/Products:/i)).not.toBeInTheDocument();
  });
});
```

---

## Testing Execution Checklist

### Pre-Testing Setup

- [ ] **Install testing dependencies**
  ```bash
  npm install --save-dev vitest @testing-library/react @testing-library/user-event
  ```

- [ ] **Create test database**
  ```bash
  # Use staging database, NOT production
  export DATABASE_URL="postgresql://..."
  ```

- [ ] **Configure Vitest**
  ```typescript
  // vitest.config.ts
  export default {
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
  ```

---

### Phase 1A Execution (8 hours)

- [ ] **Day 1 Morning (4 hours)**
  - [ ] Write Test 1.1: getOne with products
  - [ ] Write Test 1.2: getList with products
  - [ ] Run tests, fix data provider if needed

- [ ] **Day 1 Afternoon (4 hours)**
  - [ ] Write Test 1.3: RPC create
  - [ ] Write Test 1.4: RPC update
  - [ ] Write Test 1.5: Data provider create/update
  - [ ] Run full test suite
  - [ ] **GATE: All tests must pass before Phase 1B**

---

### Phase 1B Execution (4 hours)

- [ ] **Day 2 Morning (4 hours)**
  - [ ] Create pre-migration check script
  - [ ] Create test migration script
  - [ ] Run dependency analysis on staging
  - [ ] Execute dry-run migration (with rollback)
  - [ ] Execute actual migration on staging
  - [ ] Run post-migration verification
  - [ ] Test rollback procedure
  - [ ] Test application queries
  - [ ] **GATE: Migration must succeed before continuing**

---

### Phase 2 Execution (5 hours)

- [ ] **Day 2 Afternoon (3 hours)**
  - [ ] Write validation schema tests
  - [ ] Write form component tests
  - [ ] Run tests, fix validation if needed

- [ ] **Day 3 Morning (2 hours)**
  - [ ] Write display component tests
  - [ ] Full test suite run
  - [ ] Code coverage check (aim for >80%)

---

### Phase 3: Integration Testing (2 hours)

- [ ] **Day 3 Afternoon (2 hours)**
  - [ ] Manual QA: Full create flow
  - [ ] Manual QA: Full edit flow
  - [ ] Manual QA: Display views
  - [ ] Performance check: Query times
  - [ ] Browser testing: Chrome, Firefox, Safari

---

## Success Criteria

### Phase 1A: Data Provider
- ✅ All 15+ integration tests pass
- ✅ Supabase query logs show correct SQL
- ✅ No N+1 queries detected
- ✅ RPC atomicity confirmed

### Phase 1B: Migration
- ✅ Dry-run completes without errors
- ✅ Migration executes successfully
- ✅ View queries work
- ✅ RPC function works
- ✅ Rollback tested
- ✅ Application compatibility verified

### Phase 2: Validation & Forms
- ✅ All unit tests pass
- ✅ Edge cases covered
- ✅ Form UX validated

### Phase 3: Display
- ✅ Visual QA complete
- ✅ No UI crashes
- ✅ Defensive coding verified

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tests reveal data provider bugs | High | High | Fix immediately, retest |
| Migration fails on staging | Medium | Critical | Use rollback, investigate, retry |
| RPC atomicity fails | Low | Critical | Review transaction boundaries |
| Performance degradation | Medium | Medium | Add indexes, optimize queries |
| Edge cases missed | Medium | Low | Comprehensive manual QA |

---

## Post-Testing Deliverables

After all phases complete:

1. **Test Results Report** - Document all test outcomes
2. **Migration Success Log** - Staging migration evidence
3. **Performance Benchmarks** - Query execution times
4. **Code Coverage Report** - Aim for 80%+
5. **Known Issues List** - Any remaining edge cases
6. **Production Deployment Plan** - Based on test results

---

## Confidence Progression

```
Start:              ████████░░░░░░░░░░░░ 40%
After Phase 1A:     ██████████████░░░░░░ 70%
After Phase 1B:     ████████████████░░░░ 80%
After Phase 2:      ██████████████████░░ 90%
After Phase 3:      ███████████████████░ 95%
```

**Target:** 95%+ confidence for production deployment

---

**Document Status:** READY FOR EXECUTION
**Last Updated:** 2025-09-30
**Owner:** [Assign test execution owner]
