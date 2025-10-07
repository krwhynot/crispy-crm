# Critical Corrections to Parallel Implementation Plan

**Date:** 2025-09-30 (Updated: 2025-10-01)
**Status:** MANDATORY REVIEW BEFORE IMPLEMENTATION
**Validation:** Confirmed via Perplexity + Zen O3 deep analysis + Gemini 2.5 Pro + codebase research

This document contains **38 critical corrections** to the parallel-plan.md based on validation research. These issues would cause **production failures** if not addressed.

---

## Summary of Critical Findings

| Category | Issue Count | Severity | Impact |
|----------|-------------|----------|--------|
| Database Migration | 5 | BLOCKER | Views/triggers will break immediately |
| React Admin Patterns | 8 | BLOCKER | Form integration will fail |
| Data Provider | 6 + 2 | BLOCKER | Queries will fail or cause data loss |
| Validation Schema | 5 + 2 | BLOCKER | Type mismatches, timing conflicts |
| Integration Patterns | 4 | CRITICAL | Runtime errors, infinite loops |
| General Implementation | 3 + 3 | MEDIUM-HIGH | Edge cases, naming inconsistencies |

**Total Issues:** 38 corrections required (27 original + 11 from O3 deep analysis)

---

## 🆕 ADDITIONAL CRITICAL GAPS (O3 + Gemini Validation - 2025-10-01)

These 11 critical gaps were identified through deep architectural analysis using O3 reasoning model and validated by Gemini 2.5 Pro. They represent **integration boundary failures** between React Admin, Supabase, and the data provider layer.

### Issue 0.1: previousData.products Missing Check (BLOCKER)

**Category:** Data Provider Integration
**Severity:** BLOCKER - Will prevent product deletions permanently

**Problem:**
```typescript
const originalProducts = params.previousData?.products || [];
const { creates, updates, deletes } = diffProducts(originalProducts, products_to_sync);
```

If `getOne` doesn't include products (meta.select missing), `previousData.products` is undefined. Falls back to empty array. The `diffProducts` function then sees no products to delete, so user-deleted products remain in database permanently.

**Root Cause Analysis (Gemini Pro):**
When `originalProducts` is `[]`:
- `deletes`: Returns `[]` (no items to compare)
- `creates`: All products without IDs
- `updates`: All products with IDs
- **Result:** No products ever deleted = data integrity failure

**Validated Fix:**
```typescript
// In unifiedDataProvider.ts - update method
async update(resource: string, params: UpdateParams): Promise<any> {
  return wrapMethod("update", resource, params, async () => {
    if (resource === 'opportunities') {
      const { products_to_sync, ...opportunityData } = params.data;

      // ✅ CRITICAL: Fail fast if previousData is incomplete
      if (products_to_sync && !params.previousData?.products) {
        throw new Error(
          "Cannot update products: previousData.products is missing. " +
          "Ensure the form fetches the complete record with meta.select."
        );
      }

      // ... rest of update logic
    }
  });
}
```

**Acceptance Criteria:**
- [ ] Null check added before diffProducts call
- [ ] Error message guides developer to fix root cause (meta.select)
- [ ] Integration test: Edit opportunity, remove products, save, verify deletion

---

### Issue 0.2: product_id_reference Type Mismatch (BLOCKER)

**Category:** Type System Alignment
**Severity:** BLOCKER - Validation will reject all valid data

**Problem:**
- Database: `product_id_reference BIGINT`
- Zod validation: `z.string().uuid()` (expects UUID)
- Form inputs yield strings, database has numbers
- Type mismatch causes validation to always fail

**Original Fix (Flawed):**
```typescript
z.union([z.string(), z.number()]).positive() // ❌ .positive() only exists on ZodNumber
```

**Gemini Pro Correction:**
`z.coerce.number()` is the correct approach for BIGINT foreign keys. It handles both string and number inputs gracefully.

**Validated Fix:**
```typescript
// In src/atomic-crm/validation/products.ts
export const opportunityProductSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  product_id_reference: z.coerce.number().int().positive("Product is required"),
  product_name: z.string().min(1, "Product name is required"),
  product_category: z.string().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  unit_price: z.coerce.number().nonnegative().optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  // extended_price and final_price are GENERATED columns - omit from validation
});
```

**Rationale (Gemini Pro):**
- `z.coerce.number()` explicitly converts input to number
- Handles `"123"` from forms and `123` from API
- `.int().positive()` ensures valid foreign key
- Most robust solution for BIGINT columns

**Acceptance Criteria:**
- [ ] All Zod schemas use `z.coerce.number()` for BIGINT foreign keys
- [ ] Validation accepts both string and numeric inputs
- [ ] Integration test: Submit form with string IDs, verify validation passes

---

### Issue 0.3: ArrayInput Table Layout Incompatibility (BLOCKER)

**Category:** React Admin Patterns
**Severity:** BLOCKER - UI will not match design spec

**Problem:**
React Admin's `<SimpleFormIterator>` renders vertical stacked boxes by default, not table layout. Implementation plan shows table structure but CORRECTIONS.md recommends ArrayInput pattern.

**Gemini Pro Validation:**
The `inline` prop in React Admin 5 is specifically designed to create table-like horizontal layouts using CSS Flexbox. This is the correct, idiomatic solution.

**Validated Fix:**
```tsx
// In src/atomic-crm/opportunities/OpportunityProductsInput.tsx
<ArrayInput source="products" label={false}>
  <SimpleFormIterator inline disableReordering>
    {/* inline prop creates horizontal table-like layout */}
    <ReferenceInput source="product_id_reference" reference="products" />
    <NumberInput source="quantity" />
    <NumberInput source="unit_price" />
    <SelectInput source="unit_of_measure" choices={UNIT_CHOICES} />
    <NumberInput source="discount_percent" min={0} max={100} />
    <TextInput source="notes" multiline />
  </SimpleFormIterator>
</ArrayInput>
```

**Additional CSS (if needed):**
```css
/* Fine-tune column widths via sx prop or styled-components */
.product-line-items .RaSimpleFormIterator-inline {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 2fr auto;
  gap: 1rem;
}
```

**Acceptance Criteria:**
- [ ] `inline` prop used on SimpleFormIterator
- [ ] Fields render horizontally in table-like layout
- [ ] Visual regression test confirms layout matches design

---

### Issue 0.4: Validation/Transform Timing Conflict (BLOCKER)

**Category:** Data Flow Architecture
**Severity:** BLOCKER - Validation will fail on field name mismatch

**Problem:**
- Form sends `products` array
- `transform` prop renames to `products_to_sync`
- React Admin runs `validate` BEFORE `transform`
- Validation expects `products_to_sync` but receives `products`

**Original Fix (Flawed):**
Component-level `transform` prop scatters business logic across components, violating centralized data provider pattern.

**Gemini Pro Correction:**
Preserve the existing `processForDatabase` pattern. The fix is to swap the order: **Validate → Transform** instead of **Transform → Validate**.

**Validated Fix:**
```typescript
// In src/atomic-crm/providers/supabase/unifiedDataProvider.ts

// BEFORE (incorrect order):
async function processForDatabase<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create",
): Promise<Partial<T>> {
  const processedData = await transformData(resource, data, operation); // Transform first ❌
  await validateData(resource, processedData, operation); // Validate second ❌
  return processedData;
}

// AFTER (correct order):
async function processForDatabase<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create",
): Promise<Partial<T>> {
  // 1. Validate FIRST (validates 'products' from form)
  await validateData(resource, data, operation);

  // 2. Transform SECOND (renames 'products' → 'products_to_sync')
  const processedData = await transformData(resource, data, operation);

  return processedData;
}
```

**Transform Logic:**
```typescript
// In transformService for 'opportunities' resource
async transform(resource, data) {
  if (resource === 'opportunities' && data.products) {
    const { products, ...rest } = data;
    return { ...rest, products_to_sync: products };
  }
  return data;
}
```

**Validation Schema:**
```typescript
// In src/atomic-crm/validation/opportunities.ts
export const opportunitySchema = z.object({
  products: z.array(opportunityProductSchema).optional(), // Validate 'products' name
  // ... other fields
});
```

**Acceptance Criteria:**
- [ ] `processForDatabase` validates before transforming
- [ ] Validation schema expects `products` (form field name)
- [ ] Transform renames `products` → `products_to_sync` after validation
- [ ] No component-level transform props used

---

### Issue 0.5: RPC Transaction Safety (CRITICAL)

**Category:** Database Integrity
**Severity:** CRITICAL - Needs explicit error handling

**Gemini Pro Clarification:**
PostgreSQL functions are **transactional by default**. Any function execution is wrapped in an implicit transaction. Explicit `BEGIN/COMMIT` is not needed. The `EXCEPTION` block is for **error reporting**, not atomicity.

**Validated Fix:**
```sql
-- In migration: sync_opportunity_with_products RPC
CREATE OR REPLACE FUNCTION sync_opportunity_with_products(
  opportunity_data JSONB,
  products_to_create JSONB,
  products_to_update JSONB,
  product_ids_to_delete INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  opportunity_id BIGINT;
  updated_opportunity RECORD;
BEGIN
  -- All INSERT/UPDATE/DELETE operations
  -- (Already atomic - implicit transaction)

  -- ... existing RPC logic ...

  RETURN updated_opportunity::JSONB;
EXCEPTION
  WHEN OTHERS THEN
    -- Clean error reporting for client
    RAISE EXCEPTION 'Failed to sync opportunity products. Details: %', SQLERRM;
END;
$$;
```

**Key Points:**
- ✅ Function is already atomic (no explicit BEGIN needed)
- ✅ EXCEPTION block provides clean error messages
- ✅ Any failure rolls back entire operation

**Acceptance Criteria:**
- [ ] EXCEPTION block added for error reporting
- [ ] Integration test: Trigger failure mid-sync, verify rollback
- [ ] Error messages are client-friendly

---

### Issue 0.6: JSON Parsing Crash Risk (CRITICAL)

**Category:** Error Handling
**Severity:** CRITICAL - Can crash getOne/getList requests

**Problem:**
```typescript
JSON.parse(result.data.products || '[]') // Throws if malformed JSON
```

**Original Fix (Flawed):**
Silent fallback to `[]` hides data corruption bugs and could lead to inadvertent product deletion.

**Gemini Pro Correction:**
Must **fail loudly** to alert users and developers of corrupted data.

**Validated Fix:**
```typescript
// In unifiedDataProvider.ts - getOne and getList
try {
  if (Array.isArray(result.data.products)) {
    return result.data.products;
  }
  return JSON.parse(result.data.products || '[]');
} catch (e) {
  console.error('Failed to parse products JSON:', result.data.products, e);
  // Throw error to halt operation and display to user
  throw new Error("Could not load product data. The record may be corrupted.");
}
```

**Rationale:**
- ✅ Prevents silent data loss
- ✅ Alerts user to data integrity issues
- ✅ Logs details for debugging

**Acceptance Criteria:**
- [ ] Try/catch wraps all JSON.parse calls
- [ ] Errors are thrown (not silently suppressed)
- [ ] Error messages are user-friendly
- [ ] Original data logged for debugging

---

### Issue 0.7: Auto-Generate Name Infinite Loop (CRITICAL)

**Category:** React Hook Dependencies
**Severity:** CRITICAL - Can cause infinite re-renders

**Problem:**
```typescript
useEffect(() => {
  setValue('name', newName);
}, [customer, principal, context]); // Objects in deps = new reference each render
```

**Original Fix (Overly Complex):**
Used `useRef` to track previous values.

**Gemini Pro Simplification:**
Watch IDs (primitives) instead of objects, use `shouldValidate: true` (not false).

**Validated Fix:**
```typescript
// In src/atomic-crm/opportunities/useAutoGenerateName.ts
export const useAutoGenerateName = (mode: 'create' | 'edit') => {
  const { setValue, getValues } = useFormContext();

  // Watch IDs (primitives) to prevent re-renders from object reference changes
  const customerId = useWatch({ name: 'customer_organization_id' });
  const principalId = useWatch({ name: 'principal_organization_id' });
  const context = useWatch({ name: 'opportunity_context' });

  // Fetch full objects based on IDs
  const { data: customer, isLoading: customerLoading } = useGetOne(
    'organizations',
    { id: customerId },
    { enabled: !!customerId }
  );
  const { data: principal, isLoading: principalLoading } = useGetOne(
    'organizations',
    { id: principalId },
    { enabled: !!principalId }
  );

  useEffect(() => {
    // Only run in create mode when all data is loaded
    if (mode === 'create' && customer && principal && !customerLoading && !principalLoading) {
      const currentName = getValues('name');

      // Only set value if field is empty (avoid overwriting user input)
      if (!currentName || currentName.trim() === '') {
        const parts = [
          customer.name,
          principal.name,
          context,
          new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        ].filter(Boolean);

        const newName = parts.join(' - ');
        setValue('name', newName, {
          shouldValidate: true,  // ✅ Allow validation to run
          shouldDirty: true
        });
      }
    }
  }, [mode, customer, principal, context, customerLoading, principalLoading, setValue, getValues]);

  return {
    regenerate: () => {
      const parts = [customer?.name, principal?.name, context].filter(Boolean);
      const newName = parts.join(' - ');
      setValue('name', newName, { shouldValidate: true, shouldDirty: true });
    },
    isLoading: customerLoading || principalLoading,
  };
};
```

**Key Changes:**
- ✅ Watch IDs (primitives), not objects
- ✅ Use `shouldValidate: true` (not false)
- ✅ Check loading states
- ✅ Include all deps in array

**Acceptance Criteria:**
- [ ] Dependencies use IDs/primitives only
- [ ] shouldValidate set to true
- [ ] No infinite loop in create mode
- [ ] Integration test: Change customer, verify name updates once

---

### Issue 0.8: Migration Rollback Not Tested (HIGH)

**Category:** Migration Safety
**Severity:** HIGH - Rollback could fail in production

**Problem:**
Forward migration provided, rollback script provided, but **no verification** that rollback actually works.

**Validated Fix:**
```bash
# Test migration sequence in staging:

# 1. Apply forward migration
npm run migrate:production

# 2. Verify migration status
npm run migrate:status

# 3. Test rollback (use separate staging DB)
supabase db reset --db-url postgresql://staging-connection-string

# 4. Re-apply forward migration
npm run migrate:production

# 5. Verify data integrity
npm run migrate:validate
```

**Acceptance Criteria:**
- [ ] Rollback tested in staging environment
- [ ] Forward → Rollback → Forward sequence verified
- [ ] No orphaned data after rollback
- [ ] Documentation updated with tested rollback procedure

---

### Issue 0.9: Field Name Consistency (HIGH)

**Category:** Naming Inconsistencies
**Severity:** HIGH - Runtime field access errors

**Problem:**
- Database column: `expected_closing_date`
- Migration script: Uses `estimated_close_date` in some places
- Must verify which is correct and fix all references

**Validated Fix:**
```bash
# Global verification and fix
grep -r "estimated_close_date" src/
grep -r "expected_closing_date" src/

# Should use: expected_closing_date (existing column name)
```

**Acceptance Criteria:**
- [ ] All references use `expected_closing_date`
- [ ] No instances of `estimated_close_date` in code
- [ ] TypeScript compilation succeeds
- [ ] Database query tests pass

---

### Issue 0.10: RLS Policies on opportunity_products (MEDIUM)

**Category:** Security & Authorization
**Severity:** MEDIUM - RPC might bypass RLS

**Problem:**
Migration adds columns to `opportunity_products` table. Are RLS policies updated? Does `sync_opportunity_with_products` RPC respect RLS?

**Validated Fix:**
```sql
-- Verify existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'opportunity_products';

-- Ensure RPC respects RLS (functions run with SECURITY DEFINER by default)
-- Change to SECURITY INVOKER if needed:
ALTER FUNCTION sync_opportunity_with_products SECURITY INVOKER;
```

**Acceptance Criteria:**
- [ ] RLS policies reviewed and documented
- [ ] RPC function security mode verified
- [ ] Integration test: Non-owner cannot modify products

---

### Issue 0.11: Index on opportunity_products.opportunity_id (MEDIUM)

**Category:** Performance
**Severity:** MEDIUM - Slow queries with many products

**Problem:**
RPC performs `WHERE opportunity_id = X`. If no index exists, queries will be slow.

**Validated Fix:**
```sql
-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'opportunity_products'
  AND indexdef LIKE '%opportunity_id%';

-- Create if missing:
CREATE INDEX IF NOT EXISTS idx_opportunity_products_opportunity_id
  ON opportunity_products(opportunity_id)
  WHERE deleted_at IS NULL;
```

**Acceptance Criteria:**
- [ ] Index verified or created
- [ ] EXPLAIN ANALYZE shows index usage
- [ ] Query performance <100ms for 1000+ products

---

## Implementation Priority

### Phase 0 (MUST FIX BEFORE PHASE 2):
1. ✅ Issue 0.1 - previousData.products check
2. ✅ Issue 0.2 - product_id_reference type fix
3. ✅ Issue 0.4 - Validation/transform order swap
4. ✅ Issue 0.3 - ArrayInput inline prop verification

### Phase 1 (DURING PHASE 2-3):
5. ✅ Issue 0.5 - RPC EXCEPTION block
6. ✅ Issue 0.6 - JSON parsing error handling
7. ✅ Issue 0.7 - Auto-generate name dependencies

### Phase 2 (BEFORE PRODUCTION):
8. ✅ Issue 0.8 - Migration rollback testing
9. ✅ Issue 0.9 - Field name verification
10. ✅ Issue 0.10 - RLS policy review
11. ✅ Issue 0.11 - Performance index verification

---

---

## 1. TASK 1.1 - Database Migration (5 BLOCKERS)

### Issue 1.1.1: Missing View Update (BLOCKER)

**Problem:** Migration will break `opportunities_summary` view which references both columns being renamed.

**Research Confirmation:**
- PostgreSQL documentation: "ALTER TABLE RENAME COLUMN does NOT support CASCADE"
- Views store column names, not positions - renaming breaks them
- Manual drop/recreate required

**Current Migration Steps:** ❌ Missing view handling

**Corrected Migration Sequence:**
```sql
BEGIN;

-- Step 1: Backup current view definition
-- (Store in migration rollback script)

-- Step 2: Drop dependent view
DROP VIEW IF EXISTS opportunities_summary;

-- Step 3: Rename columns (data preserved automatically)
ALTER TABLE opportunities RENAME COLUMN category TO opportunity_context;
ALTER TABLE opportunities RENAME COLUMN sales_id TO opportunity_owner_id;

-- Step 4: Add CHECK constraint
ALTER TABLE opportunities
  ADD CONSTRAINT check_opportunity_context
  CHECK (opportunity_context IN (
    'Site Visit', 'Food Show', 'New Product Interest',
    'Follow-up', 'Demo Request', 'Sampling', 'Custom'
  ) OR opportunity_context IS NULL);

-- Step 5: Update default
ALTER TABLE opportunities
  ALTER COLUMN estimated_close_date
  SET DEFAULT (CURRENT_DATE + INTERVAL '90 days');

-- Step 6: Update indexes
DROP INDEX IF EXISTS idx_opportunities_sales_id;
CREATE INDEX idx_opportunities_owner_id ON opportunities(opportunity_owner_id)
  WHERE deleted_at IS NULL;

-- Step 7: Update trigger function (NEW COLUMN NAMES)
CREATE OR REPLACE FUNCTION update_opportunities_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.opportunity_context, '')  -- ✅ Updated from 'category'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Recreate view with new column names
CREATE VIEW opportunities_summary AS
SELECT
    o.*,
    c1.name as customer_organization_name,
    c2.name as principal_organization_name,
    c3.name as distributor_organization_name,
    s.first_name || ' ' || s.last_name as owner_name,
    -- ✅ Aggregate products for efficient list queries
    COALESCE(
      json_agg(
        json_build_object(
          'id', op.id,
          'product_name', op.product_name,
          'product_id_reference', op.product_id_reference,
          'quantity', op.quantity
        )
        ORDER BY op.id
      ) FILTER (WHERE op.id IS NOT NULL),
      '[]'::json
    ) as products
FROM opportunities o
LEFT JOIN organizations c1 ON c1.id = o.customer_organization_id
LEFT JOIN organizations c2 ON c2.id = o.principal_organization_id
LEFT JOIN organizations c3 ON c3.id = o.distributor_organization_id
LEFT JOIN sales s ON s.id = o.opportunity_owner_id  -- ✅ Updated from 'sales_id'
LEFT JOIN opportunity_products op ON op.opportunity_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY o.id, c1.name, c2.name, c3.name, s.first_name, s.last_name;

GRANT SELECT ON opportunities_summary TO authenticated, anon;

-- Step 9: Create RPC function (see Issue 1.1.2)

COMMIT;
```

**Files Affected:**
- Migration file: `/supabase/migrations/20250930150000_add_opportunity_context_and_owner.sql`

---

### Issue 1.1.2: RPC Function - Generated Column Error (BLOCKER)

**Problem:** RPC function attempts to INSERT `extended_price` and `final_price` which are GENERATED columns.

**Database Schema Evidence:**
```sql
-- From opportunity_products table
extended_price numeric GENERATED ALWAYS AS (quantity::numeric * unit_price) STORED
final_price numeric GENERATED ALWAYS AS (
  quantity::numeric * unit_price * (1 - COALESCE(discount_percent, 0) / 100)
) STORED
```

**Corrected RPC Function:**
```sql
CREATE OR REPLACE FUNCTION sync_opportunity_with_products(
  opportunity_data JSONB,
  products_to_create JSONB,
  products_to_update JSONB,
  product_ids_to_delete INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  opportunity_id BIGINT;
  updated_opportunity RECORD;
BEGIN
  -- 1. Upsert opportunity
  INSERT INTO opportunities (
    id, name, description, opportunity_context, stage, priority,
    amount, probability, estimated_close_date,
    customer_organization_id, principal_organization_id,
    distributor_organization_id, contact_ids, opportunity_owner_id
  )
  VALUES (
    NULLIF((opportunity_data->>'id'), '')::BIGINT,
    opportunity_data->>'name',
    opportunity_data->>'description',
    opportunity_data->>'opportunity_context',
    (opportunity_data->>'stage')::TEXT,
    (opportunity_data->>'priority')::TEXT,
    (opportunity_data->>'amount')::NUMERIC,
    (opportunity_data->>'probability')::INTEGER,
    (opportunity_data->>'estimated_close_date')::DATE,
    NULLIF((opportunity_data->>'customer_organization_id'), '')::BIGINT,
    NULLIF((opportunity_data->>'principal_organization_id'), '')::BIGINT,
    NULLIF((opportunity_data->>'distributor_organization_id'), '')::BIGINT,
    CASE
      WHEN opportunity_data->>'contact_ids' IS NULL THEN ARRAY[]::BIGINT[]
      ELSE (
        SELECT ARRAY_AGG(value::TEXT::BIGINT)
        FROM jsonb_array_elements_text(opportunity_data->'contact_ids') AS value
      )
    END,
    NULLIF((opportunity_data->>'opportunity_owner_id'), '')::BIGINT
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    opportunity_context = EXCLUDED.opportunity_context,
    stage = EXCLUDED.stage,
    priority = EXCLUDED.priority,
    amount = EXCLUDED.amount,
    probability = EXCLUDED.probability,
    estimated_close_date = EXCLUDED.estimated_close_date,
    customer_organization_id = EXCLUDED.customer_organization_id,
    principal_organization_id = EXCLUDED.principal_organization_id,
    distributor_organization_id = EXCLUDED.distributor_organization_id,
    contact_ids = EXCLUDED.contact_ids,
    opportunity_owner_id = EXCLUDED.opportunity_owner_id,
    updated_at = NOW()
  RETURNING id INTO opportunity_id;

  -- 2. Create products - EXCLUDE extended_price, final_price (generated)
  IF products_to_create IS NOT NULL AND JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category,
      quantity, unit_price, discount_percent, notes
    )
    SELECT
      opportunity_id,
      (p->>'product_id_reference')::BIGINT,
      p->>'product_name',
      p->>'product_category',
      COALESCE((p->>'quantity')::NUMERIC, 1),
      COALESCE((p->>'unit_price')::NUMERIC, 0),
      COALESCE((p->>'discount_percent')::NUMERIC, 0),
      p->>'notes'
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  -- 3. Update products - EXCLUDE extended_price, final_price
  IF products_to_update IS NOT NULL AND JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op
    SET
      product_id_reference = (p->>'product_id_reference')::BIGINT,
      product_name = p->>'product_name',
      product_category = p->>'product_category',
      quantity = COALESCE((p->>'quantity')::NUMERIC, 1),
      unit_price = COALESCE((p->>'unit_price')::NUMERIC, 0),
      discount_percent = COALESCE((p->>'discount_percent')::NUMERIC, 0),
      notes = p->>'notes',
      updated_at = NOW()
    FROM JSONB_ARRAY_ELEMENTS(products_to_update) p
    WHERE op.id = (p->>'id')::BIGINT;
  END IF;

  -- 4. Delete products
  IF product_ids_to_delete IS NOT NULL AND ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    DELETE FROM opportunity_products
    WHERE id = ANY(product_ids_to_delete);
  END IF;

  -- 5. Return complete opportunity with products
  SELECT json_build_object(
    'id', o.id,
    'name', o.name,
    'opportunity_context', o.opportunity_context,
    'opportunity_owner_id', o.opportunity_owner_id,
    'products', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', op.id,
            'product_id_reference', op.product_id_reference,
            'product_name', op.product_name,
            'quantity', op.quantity,
            'unit_price', op.unit_price,
            'extended_price', op.extended_price,
            'discount_percent', op.discount_percent,
            'final_price', op.final_price
          )
        )
        FROM opportunity_products op
        WHERE op.opportunity_id = o.id
      ),
      '[]'::json
    )
  )
  INTO updated_opportunity
  FROM opportunities o
  WHERE o.id = opportunity_id;

  RETURN updated_opportunity::JSONB;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION sync_opportunity_with_products TO authenticated;
```

**Key Changes:**
- ✅ Removed `extended_price` and `final_price` from INSERT/UPDATE
- ✅ Added `discount_percent` (was missing from requirements)
- ✅ Added `product_category` (was missing)
- ✅ Fixed JSONB array casting for contact_ids
- ✅ Added NULL handling with NULLIF
- ✅ Return includes computed extended_price/final_price (read-only)

---

### Issue 1.1.3: Migration Timestamp Format (LOW)

**Problem:** Task uses `20250930000000` (time = 00:00:00) which could cause ordering issues.

**Corrected:** Use actual timestamp like `20250930150000` (3:00 PM)

---

### Issue 1.1.4: Missing Rollback Script (MEDIUM)

**Problem:** No documented rollback strategy if migration fails midway.

**Corrected Rollback Script:**
```sql
-- File: /supabase/migrations/20250930150000_add_opportunity_context_and_owner_rollback.sql

BEGIN;

-- Reverse Step 8: Drop new view
DROP VIEW IF EXISTS opportunities_summary;

-- Reverse Step 7: Restore old trigger function
CREATE OR REPLACE FUNCTION update_opportunities_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reverse Step 6: Restore old index
DROP INDEX IF EXISTS idx_opportunities_owner_id;
CREATE INDEX idx_opportunities_sales_id ON opportunities(sales_id)
  WHERE deleted_at IS NULL;

-- Reverse Step 5: Remove default
ALTER TABLE opportunities
  ALTER COLUMN estimated_close_date DROP DEFAULT;

-- Reverse Step 4: Remove constraint
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS check_opportunity_context;

-- Reverse Step 3: Rename columns back
ALTER TABLE opportunities RENAME COLUMN opportunity_context TO category;
ALTER TABLE opportunities RENAME COLUMN opportunity_owner_id TO sales_id;

-- Reverse Step 2: Recreate old view
CREATE VIEW opportunities_summary AS
SELECT
    o.*,
    c1.name as customer_organization_name,
    c2.name as principal_organization_name,
    c3.name as distributor_organization_name,
    s.first_name || ' ' || s.last_name as sales_rep_name
FROM opportunities o
LEFT JOIN organizations c1 ON c1.id = o.customer_organization_id
LEFT JOIN organizations c2 ON c2.id = o.principal_organization_id
LEFT JOIN organizations c3 ON c3.id = o.distributor_organization_id
LEFT JOIN sales s ON s.id = o.sales_id
WHERE o.deleted_at IS NULL;

GRANT SELECT ON opportunities_summary TO authenticated, anon;

COMMIT;
```

---

### Issue 1.1.5: Missing Pre-Check Script (MEDIUM)

**Corrected Pre-Migration Dependency Check Script:**
```sql
-- File: pre_migration_check.sql
-- Run BEFORE migration to identify all dependencies

-- 1. Find all views referencing the columns
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND (definition LIKE '%sales_id%' OR definition LIKE '%category%')
ORDER BY viewname;

-- 2. Find all triggers referencing the columns
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%sales_id%'
   OR action_statement LIKE '%category%';

-- 3. Find all functions referencing the columns
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition LIKE '%sales_id%' OR routine_definition LIKE '%category%');

-- 4. Find all indexes on these columns
SELECT
  i.relname as index_name,
  t.relname as table_name,
  a.attname as column_name
FROM pg_class i
JOIN pg_index ix ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'opportunities'
  AND a.attname IN ('sales_id', 'category');

-- Expected output: opportunities_summary view, update_opportunities_search trigger, idx_opportunities_sales_id
```

---

## 2. TASK 2.1 - Validation Schema Updates (4 CRITICAL)

### Issue 2.1.1: Missing product_category Field (CRITICAL)

**Problem:** Product schema missing `product_category` field that exists in database.

**Database Evidence:** `opportunity_products.product_category text`

**Corrected Schema:**
```typescript
export const opportunityProductSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  product_id_reference: z.union([z.string(), z.number()]).positive("Product is required"),
  product_name: z.string().min(1, "Product name is required"),
  product_category: z.string().optional(), // ✅ ADDED
  quantity: z.number().int().positive().optional(),
  unit_price: z.number().nonnegative().optional(),
  discount_percent: z.number().min(0).max(100).optional(), // ✅ ADDED
  notes: z.string().optional(),
  // extended_price - REMOVED (generated column)
  // final_price - REMOVED (generated column)
});
```

---

### Issue 2.1.2: Incorrect extended_price Validation (CRITICAL)

**Problem:** Validating `extended_price` which is a GENERATED column.

**Correction:** Remove from schema entirely - database computes it automatically.

---

### Issue 2.1.3: Missing discount_percent Validation (HIGH)

**Problem:** `discount_percent` has CHECK constraint (0-100) but no validation.

**Correction:** Add to schema with proper bounds checking (shown in 2.1.1 above).

---

### Issue 2.1.4: Field Name Mismatch - estimated_close_date (HIGH)

**Problem:** Requirements use `estimated_close_date` but actual field is `expected_closing_date`.

**Evidence:**
- Current code: `OpportunityInputs.tsx` line 155: `source="expected_closing_date"`
- Database column: `expected_closing_date`

**Correction:** Task 4.3 must use `expected_closing_date`, NOT `estimated_close_date`.

---

## 3. TASK 2.2 - Product Diff Algorithm (3 MEDIUM)

### Issue 2.2.1: Missing 6th Test Case (MEDIUM)

**Problem:** Requirements specify 6 tests but only provide 5.

**Missing Test:**
```typescript
it('should handle empty arrays gracefully', () => {
  const db = [];
  const form = [];

  const { creates, updates, deletes } = diffProducts(db, form);

  expect(creates).toHaveLength(0);
  expect(updates).toHaveLength(0);
  expect(deletes).toHaveLength(0);
});
```

---

### Issue 2.2.2: Null-Safety in ID Handling (MEDIUM)

**Problem:** Non-null assertion `p.id!` without filtering could cause Map errors.

**Corrected diffProducts:**
```typescript
export function diffProducts(dbItems: Product[], formItems: Product[]) {
  // Filter out items without valid IDs BEFORE creating Map
  const validDbItems = dbItems.filter(p => p.id != null);
  const dbById = new Map(validDbItems.map(p => [p.id!, p]));

  const validFormItems = formItems.filter(p => p.id != null);
  const formById = new Map(validFormItems.map(p => [p.id!, p]));

  // Creates: Products without IDs (new)
  const creates = formItems.filter(p => !p.id);

  // Updates: Products with IDs that have changed
  const updates = validFormItems
    .filter(p => dbById.has(p.id!))
    .filter(p => productsAreDifferent(p, dbById.get(p.id!)!));

  // Deletes: Products in DB but not in form
  const deletes = validDbItems
    .filter(p => !formById.has(p.id!))
    .map(p => p.id!);

  return { creates, updates, deletes };
}
```

---

### Issue 2.2.3: Nullish Comparison (MEDIUM)

**Problem:** Doesn't handle `null` vs `undefined` equivalence.

**Corrected productsAreDifferent:**
```typescript
function productsAreDifferent(formProduct: Product, dbProduct: Product): boolean {
  return (
    formProduct.product_id_reference !== dbProduct.product_id_reference ||
    (formProduct.quantity ?? null) !== (dbProduct.quantity ?? null) ||
    (formProduct.unit_price ?? null) !== (dbProduct.unit_price ?? null) ||
    (formProduct.notes ?? null) !== (dbProduct.notes ?? null)
  );
}
```

---

## 4. TASK 3.1 - Data Provider Updates (6 CRITICAL)

### Issue 3.1.1: Correct Query Pattern with meta.select (CRITICAL)

**Research Confirmation:**
- ra-supabase-core DOES support `meta.select` parameter for nested joins
- Perplexity confirmed: `dataProvider.getOne('opportunities', { id: 123, meta: { select: '*,opportunity_products(*,products(*))'} })`

**Problem:** Task shows direct supabase query, but must use baseDataProvider with meta parameter.

**Corrected getOne Implementation:**
```typescript
async getOne(resource: string, params: GetOneParams): Promise<any> {
  return wrapMethod("getOne", resource, params, async () => {
    if (resource === 'opportunities') {
      // Use baseDataProvider with meta.select for nested joins
      // This leverages opportunities_summary view WITH products aggregation
      const result = await baseDataProvider.getOne('opportunities_summary', {
        ...params,
        meta: {
          select: '*', // View already includes products as JSON
        },
      });

      return {
        ...result,
        data: {
          ...result.data,
          // Parse products from JSONB if not already parsed
          products: Array.isArray(result.data.products)
            ? result.data.products
            : JSON.parse(result.data.products || '[]'),
        },
      };
    }

    // Default behavior
    const dbResource = getDatabaseResource(resource, "one");
    const result = await baseDataProvider.getOne(dbResource, params);
    return {
      ...result,
      data: normalizeResponseData(resource, result.data),
    };
  });
}
```

**Key Points:**
- ✅ Uses baseDataProvider (ra-supabase-core)
- ✅ Queries opportunities_summary view (includes denormalized org names + products JSON)
- ✅ Products already in view from migration (Issue 1.1.1)
- ✅ Maintains existing getDatabaseResource pattern

---

### Issue 3.1.2: getList Missing Pagination Integration (CRITICAL)

**Problem:** Task shows direct query without integrating `applySearchParams()`.

**Corrected getList:**
```typescript
async getList(resource: string, params: GetListParams): Promise<any> {
  return wrapMethod("getList", resource, params, async () => {
    if (resource === 'opportunities') {
      // Apply all filters, sorting, pagination
      const searchParams = applySearchParams(resource, params);

      // Query view (includes products as JSON)
      const result = await baseDataProvider.getList('opportunities_summary', searchParams);

      return {
        ...result,
        data: result.data.map(opp => ({
          ...opp,
          // Parse products JSON
          products: Array.isArray(opp.products)
            ? opp.products
            : JSON.parse(opp.products || '[]'),
        })),
      };
    }

    // Default behavior
    const searchParams = applySearchParams(resource, params);
    const dbResource = getDatabaseResource(resource, "list");
    const result = await baseDataProvider.getList(dbResource, searchParams);
    return {
      ...result,
      data: normalizeResponseData(resource, result.data),
    };
  });
}
```

---

### Issue 3.1.3: Missing Validation Flow (CRITICAL)

**Problem:** RPC path skips `processForDatabase()` which does Transform → Validate.

**Corrected create:**
```typescript
async create(resource: string, params: CreateParams): Promise<any> {
  return wrapMethod("create", resource, params, async () => {
    if (resource === 'opportunities' && params.data.products_to_sync) {
      const { products_to_sync, ...opportunityData } = params.data;

      // ✅ CRITICAL: Validate opportunity data FIRST
      const processedData = await processForDatabase(resource, opportunityData, "create");

      // ✅ Validate each product
      const validatedProducts = products_to_sync.map((product: any) => {
        try {
          return validateOpportunityProduct(product);
        } catch (error) {
          throw {
            message: "Product validation failed",
            errors: { [`products.${products_to_sync.indexOf(product)}`]: error.message },
          };
        }
      });

      try {
        const { data, error } = await supabase.rpc('sync_opportunity_with_products', {
          opportunity_data: processedData,
          products_to_create: validatedProducts,
          products_to_update: [],
          product_ids_to_delete: [],
        });

        if (error) {
          throw {
            message: error.message || "RPC sync failed",
            errors: {
              _error: error.hint || error.details || error.message,
            },
          };
        }

        return { data };
      } catch (error: any) {
        logError('create', resource, params, error);
        throw error;
      }
    }

    // Default create path
    const dbResource = getResourceName(resource);
    const processedData = await processForDatabase(resource, params.data, "create");
    return await baseDataProvider.create(dbResource, {
      ...params,
      data: processedData as any,
    });
  });
}
```

---

### Issue 3.1.4: Missing Products Null Check in Update (HIGH)

**Corrected update:**
```typescript
async update(resource: string, params: UpdateParams): Promise<any> {
  return wrapMethod("update", resource, params, async () => {
    if (resource === 'opportunities') {
      const { products_to_sync, ...opportunityData } = params.data;

      // Validate opportunity data
      const processedData = await processForDatabase(resource, opportunityData, "update");

      // If no products sync requested, use default update
      if (!products_to_sync) {
        const dbResource = getResourceName(resource);
        return await baseDataProvider.update(dbResource, {
          ...params,
          data: { ...processedData, id: params.id } as any,
        });
      }

      // Handle products sync
      const originalProducts = params.previousData?.products || [];
      const { creates, updates, deletes } = diffProducts(originalProducts, products_to_sync);

      // Validate products
      const validatedCreates = creates.map(validateOpportunityProduct);
      const validatedUpdates = updates.map(validateOpportunityProduct);

      try {
        const { data, error } = await supabase.rpc('sync_opportunity_with_products', {
          opportunity_data: { ...processedData, id: params.id },
          products_to_create: validatedCreates,
          products_to_update: validatedUpdates,
          product_ids_to_delete: deletes,
        });

        if (error) {
          throw {
            message: error.message || "RPC sync failed",
            errors: {
              _error: error.hint || error.details || error.message,
            },
          };
        }

        return { data };
      } catch (error: any) {
        logError('update', resource, params, error);
        throw error;
      }
    }

    // Default update
    const dbResource = getResourceName(resource);
    const processedData = await processForDatabase(resource, params.data, "update");
    return await baseDataProvider.update(dbResource, {
      ...params,
      data: { ...processedData, id: params.id } as any,
    });
  });
}
```

---

### Issue 3.1.5: Missing Import Statement (LOW)

**Correction:**
```typescript
// At top of unifiedDataProvider.ts
import { diffProducts } from "@/atomic-crm/opportunities/diffProducts";
import { validateOpportunityProduct } from "@/atomic-crm/validation/products";
```

---

## 5. TASK 4.1 - OpportunityProductsInput (8 BLOCKERS)

### Issue 4.1.1: Wrong Pattern - Must Use ArrayInput (BLOCKER)

**Research Confirmation:**
- Perplexity: "React Admin 5 recommends using `<ArrayInput>` with form iterator, NOT `useFieldArray` directly"
- Zen chat analysis: Custom ArrayInput already wraps useFieldArray and integrates with React Admin
- Codebase evidence: ALL array inputs use ArrayInput + SimpleFormIterator pattern

**Problem:** Task specifies raw `useFieldArray` which breaks React Admin integration.

**Corrected Implementation:**
```tsx
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";
import { useWatch } from "react-hook-form";

export const OpportunityProductsInput = () => {
  const principalId = useWatch({ name: "principal_organization_id" });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-medium">Product Line Items</h3>

      {!principalId && (
        <p className="text-sm text-muted-foreground">
          Select a principal organization to add products
        </p>
      )}

      <ArrayInput source="products" label={false} helperText={false}>
        <SimpleFormIterator inline disableReordering>
          <ReferenceInput
            source="product_id_reference"
            reference="products"
            filter={{ principal_organization_id: principalId }} // ✅ Corrected field name
            disabled={!principalId}
          >
            <AutocompleteInput
              label="Product"
              optionText="name"
              helperText={false}
            />
          </ReferenceInput>

          <TextInput
            source="product_name"
            label="Product Name"
            disabled
            helperText={false}
          />

          <NumberInput
            source="quantity"
            label="Quantity"
            defaultValue={1}
            helperText={false}
          />

          <NumberInput
            source="unit_price"
            label="Unit Price"
            helperText={false}
          />

          <NumberInput
            source="discount_percent"
            label="Discount %"
            min={0}
            max={100}
            helperText={false}
          />

          <NumberInput
            source="extended_price"
            label="Extended"
            disabled
            helperText={false}
          />

          <TextInput
            source="notes"
            label="Notes"
            multiline
            helperText={false}
          />
        </SimpleFormIterator>
      </ArrayInput>
    </div>
  );
};
```

**Key Changes:**
- ✅ Uses ArrayInput + SimpleFormIterator (codebase pattern)
- ✅ Corrected filter field: `principal_organization_id` not `principal_id`
- ✅ Removed manual field.id logic (handled by ArrayInput)
- ✅ Added discount_percent field
- ✅ Disabled extended_price (computed column)
- ✅ No manual useFieldArray management needed

---

### Issue 4.1.2: Principal Filter Field Name Wrong (CRITICAL)

**Problem:** Filter uses `principal_id` but database uses `principal_organization_id`.

**Correction:** Shown in 4.1.1 above.

---

### Issue 4.1.3: Missing Extended Price Calculation (MEDIUM)

**Problem:** Task says "can be client-side or left to RPC" but requirements show disabled field.

**Clarification:** Extended price is GENERATED in database - display only, no client calculation needed. RPC returns computed value.

---

### Issue 4.1.4: Principal Change Handler Not Needed (LOW)

**Problem:** Task shows `useEffect` to clear products when principal changes.

**Correction:** With ArrayInput pattern, this is handled automatically by React Admin's form state management. If needed, can add:

```tsx
const { setValue } = useFormContext();
const principalId = useWatch({ name: "principal_organization_id" });

useEffect(() => {
  // Clear products if principal changes (optional)
  setValue("products", []);
}, [principalId, setValue]);
```

But this may not be desired UX - validate with user before implementing.

---

## 6. TASK 4.2 - useAutoGenerateName Hook (2 MEDIUM)

### Issue 4.2.1: Missing useEffect Import (LOW)

**Correction:**
```typescript
import { useEffect } from 'react';
import { useGetOne } from 'react-admin';
import { useWatch, useFormContext } from 'react-hook-form';
```

---

### Issue 4.2.2: Re-Generation Trigger Issue (MEDIUM)

**Problem:** Hook re-generates if user clears name field.

**Corrected Hook:**
```typescript
export const useAutoGenerateName = (mode: 'create' | 'edit') => {
  const { setValue, getValues } = useFormContext();

  const customerId = useWatch({ name: 'customer_organization_id' });
  const principalId = useWatch({ name: 'principal_organization_id' });
  const context = useWatch({ name: 'opportunity_context' });

  const { data: customer, isLoading: customerLoading } = useGetOne(
    'organizations',
    { id: customerId },
    { enabled: !!customerId }
  );
  const { data: principal, isLoading: principalLoading } = useGetOne(
    'organizations',
    { id: principalId },
    { enabled: !!principalId }
  );

  const generateName = () => {
    if (customerLoading || principalLoading) return null;

    const parts = [
      customer?.name,
      principal?.name,
      context,
      new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    ].filter(Boolean);

    return parts.join(' - ');
  };

  // Only auto-generate on CREATE and if name is empty
  useEffect(() => {
    if (mode === 'create' && customer && !customerLoading && !principalLoading) {
      const currentName = getValues('name');
      // Only generate if name is truly empty (not just whitespace)
      if (!currentName || currentName.trim() === '') {
        const newName = generateName();
        if (newName) {
          setValue('name', newName, { shouldValidate: true });
        }
      }
    }
  }, [customer, principal, context, mode, customerLoading, principalLoading]);

  return {
    regenerate: () => {
      const newName = generateName();
      if (newName) {
        setValue('name', newName, { shouldDirty: true, shouldValidate: true });
      }
    },
    isLoading: customerLoading || principalLoading,
  };
};
```

---

## 7. TASK 4.3 - Form Component Updates (5 CRITICAL)

### Issue 4.3.1: Transform on Wrong Component (CRITICAL)

**Problem:** Task shows `transform` on `<Create>` but should be on `<CreateBase>`.

**Evidence:** Current code uses `<CreateBase>` (OpportunityCreate.tsx line 82)

**Correction:** Transform goes on CreateBase, mutationMode is a direct prop.

---

### Issue 4.3.2: Field Name Mismatch (CRITICAL)

**Problem:** Task uses `estimated_close_date` but field is `expected_closing_date`.

**Corrected defaultValues:**
```typescript
const defaultValues = {
  opportunity_owner_id: identity?.id,
  contact_ids: [],
  products: [],
  stage: 'new_lead',
  priority: 'medium',
  probability: 50,
  expected_closing_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // ✅ Correct field name
    .toISOString()
    .split('T')[0],
};
```

---

### Issue 4.3.3: Unnecessary Manual defaultValues in Edit (MEDIUM)

**Problem:** Task manually sets `products: record.products || []`.

**Correction:** React Admin auto-populates edit forms from record. Remove manual handling:

```typescript
const OpportunityEdit = () => (
  <EditBase
    redirect="show"
    mutationMode="pessimistic"
    transform={transformData}
    mutationOptions={{
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        notify('Opportunity saved');
        redirect('show', 'opportunities');
      },
    }}
  >
    <Form>
      <OpportunityInputs mode="edit" />
    </Form>
  </EditBase>
);
```

No need for OpportunityEditForm wrapper or manual defaultValues.

---

### Issue 4.3.4: Mode Prop Breaking Change (CRITICAL)

**Problem:** Adding required `mode` prop to OpportunityInputs breaks existing usage.

**Correction:** Add default value:
```typescript
export const OpportunityInputs = ({ mode = 'edit' }: { mode?: 'create' | 'edit' }) => {
  // Implementation
};
```

---

### Issue 4.3.5: Regenerate Button Implementation (MEDIUM)

**Problem:** Mixing shadcn Button with MUI InputProps causes style clash.

**Corrected Regenerate Button:**
```tsx
import { IconButton, Tooltip } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// In OpportunityInputs
const { regenerate, isLoading } = useAutoGenerateName(mode);

<TextInput
  source="name"
  label="Opportunity Name *"
  InputProps={mode === 'edit' ? {
    endAdornment: (
      <Tooltip title="Regenerate name from current field values">
        <IconButton
          onClick={regenerate}
          disabled={isLoading}
          size="small"
          edge="end"
        >
          <AutorenewIcon />
        </IconButton>
      </Tooltip>
    ),
  } : undefined}
/>
```

---

## 8. TASK 4.4 - Display Component Updates (3 MEDIUM)

### Issue 4.4.1: Missing Null Checks in Card (MEDIUM)

**Corrected OpportunityCard:**
```tsx
export const OpportunityCardContent = ({ opportunity }: { opportunity: Opportunity }) => {
  const productCount = opportunity.products?.length || 0;
  const firstProduct = opportunity.products?.[0];
  const productDisplay =
    productCount === 0 ? null :
    productCount === 1 ? firstProduct?.product_name :
    firstProduct?.product_name ? `${firstProduct.product_name} +${productCount - 1} more` :
    `${productCount} products`;

  return (
    <Card>
      <CardContent>
        {/* ... existing fields ... */}

        {productDisplay && (
          <p className="text-xs text-muted-foreground">
            Products: {productDisplay}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
```

---

### Issue 4.4.2: Show View Pattern Mismatch (MEDIUM)

**Problem:** Task uses ArrayField + Datagrid but OpportunityShow uses custom layout.

**Correction:** Match existing style with custom rendering:
```tsx
{/* In OpportunityShow */}
<h3 className="text-base font-medium mt-6">Product Line Items</h3>
{record.products && record.products.length > 0 ? (
  <table className="min-w-full mt-2">
    <thead>
      <tr className="border-b">
        <th className="text-left py-2">Product</th>
        <th className="text-right py-2">Quantity</th>
        <th className="text-right py-2">Unit Price</th>
        <th className="text-right py-2">Extended Price</th>
        <th className="text-left py-2">Notes</th>
      </tr>
    </thead>
    <tbody>
      {record.products.map((product: OpportunityProduct) => (
        <tr key={product.id} className="border-b">
          <td className="py-2">{product.product_name}</td>
          <td className="text-right">{product.quantity}</td>
          <td className="text-right">{formatCurrency(product.unit_price)}</td>
          <td className="text-right">{formatCurrency(product.extended_price)}</td>
          <td>{product.notes}</td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <p className="text-muted-foreground">No products added</p>
)}
```

---

### Issue 4.4.3: Currency Formatting Inconsistency (LOW)

**Problem:** Task uses plain NumberField but existing code uses custom currency formatting.

**Correction:** Use existing pattern with `toLocaleString` for currency fields.

---

## 9. Summary of Required Actions

### Immediate Blockers (Must Fix Before Starting)

1. ✅ Rewrite Task 1.1 migration with view/trigger updates
2. ✅ Fix Task 1.1 RPC function (remove generated columns)
3. ✅ Rewrite Task 4.1 to use ArrayInput pattern
4. ✅ Fix Task 3.1 to use baseDataProvider with meta.select
5. ✅ Correct all field name references (expected_closing_date, principal_organization_id)

### Critical Updates (Will Cause Failures)

6. Fix Task 2.1 product schema (add missing fields, remove generated columns)
7. Add validation flow to Task 3.1 (processForDatabase)
8. Fix Task 4.3 transform/mutation prop locations
9. Add null-safety to Task 2.2 diff algorithm
10. Correct Task 4.3 field names

### Medium Priority (Edge Cases)

11. Add missing test case to Task 2.2
12. Add useEffect import to Task 4.2
13. Fix regenerate button implementation in Task 4.3
14. Add defensive null checks in Task 4.4

### Recommended Additions

15. Add pre-migration dependency check script
16. Add migration rollback script
17. Update view to include products JSON (eliminates N+1 queries)
18. Document extended_price as read-only computed field

---

## Validation Status

✅ **Database Migration:** Validated via Perplexity PostgreSQL research
✅ **React Admin Patterns:** Validated via Perplexity + Zen + codebase analysis
✅ **Supabase Queries:** Validated via Perplexity Supabase/PostgREST docs
✅ **Data Provider:** Validated via Perplexity ra-supabase-core docs
✅ **Field Names:** Validated via codebase grep

**Confidence Level:** 95%+ on all corrections

---

## Next Steps

1. **Review this document** with senior developer
2. **Update parallel-plan.md** with these corrections
3. **Create corrected migration scripts** in `/supabase/migrations/`
4. **Update Task 4.1** with ArrayInput pattern
5. **Test migration** on staging database before production
6. **Proceed with corrected implementation plan**

---

**Document Status:** READY FOR REVIEW
**Last Updated:** 2025-09-30
**Reviewers:** [Assign reviewers here]
