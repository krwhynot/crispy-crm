# Pricing Reference Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all residual pricing references from codebase following October 2025 database migration that removed pricing from products and opportunities.

**Architecture:** Phased cleanup approach targeting obsolete database function types, test mock data, outdated documentation types, and example comments. Focus on moderate cleanup scope - remove product/opportunity pricing only while preserving legitimate financial tracking elsewhere.

**Tech Stack:** TypeScript, Vitest, Faker.js for test data

---

## Audit Summary

**Pricing references found in 4 categories:**

1. **Database Function Types (High Priority)** - `calculate_product_price` and `check_product_availability` functions in generated types that reference removed pricing fields
2. **Test Mock Data (High Priority)** - `createMockProduct` in mock-providers.ts includes `unit_price` field
3. **Documentation Types (Medium Priority)** - Outdated `docs/database/types/database.types.ts` with pricing fields
4. **Example Comments (Low Priority)** - JSDoc examples mentioning "price" fields

**Legitimate references to KEEP:**
- "PricewaterhouseCoopers" in test data (company name)
- `minimum_order_quantity` in filterRegistry (valid business field, not pricing)
- Comments about "no pricing/quantity" (documenting the removal)

---

## Task 1: Remove Obsolete Database Function from Generated Types

**Context:** The `calculate_product_price` function type exists in `src/types/database.generated.ts` but the actual database function was removed with the October migration. This is dead code.

**Files:**
- Modify: `src/types/database.generated.ts:1805-1817`

**Step 1: Verify function doesn't exist in database**

Run:
```bash
npx supabase db dump --schema public --data-only=false | grep "calculate_product_price"
```

Expected: No output (function removed in migration)

**Step 2: Remove calculate_product_price function type**

In `src/types/database.generated.ts`, remove lines 1805-1817:

```typescript
// REMOVE THIS:
      calculate_product_price: {
        Args: {
          p_distributor_id?: number
          p_product_id: number
          p_quantity: number
        }
        Returns: {
          discount_applied: number
          special_pricing: boolean
          tier_name: string
          total_price: number
          unit_price: number
        }[]
      }
```

**Step 3: Remove check_product_availability function type**

In `src/types/database.generated.ts`, remove lines 1819-1830:

```typescript
// REMOVE THIS:
      check_product_availability: {
        Args: {
          p_needed_date?: string
          p_product_id: number
          p_quantity: number
        }
        Returns: {
          availability_notes: string
          can_fulfill_by: string
          is_available: boolean
          quantity_available: number
        }[]
      }
```

**Step 4: Run type check**

Run:
```bash
npm run type-check
```

Expected: No errors (no code references these functions)

**Step 5: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/types/database.generated.ts
git commit -m "refactor: remove obsolete pricing function types from generated database schema

Remove calculate_product_price and check_product_availability function
types that reference removed pricing fields. These functions were removed
in October 2025 pricing migration.

Related: supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql"
```

---

## Task 2: Update Test Mock Data to Match Current Schema

**Context:** The `createMockProduct` helper in test utilities includes `unit_price` field which no longer exists in the database. This causes test data to not match the actual schema.

**Files:**
- Modify: `src/tests/utils/mock-providers.ts:268`

**Step 1: Identify current product schema**

Check validation schema:
```bash
grep -A 20 "export const productSchema" src/atomic-crm/validation/products.ts
```

Expected: No `unit_price` field in schema

**Step 2: Remove unit_price from mock product**

In `src/tests/utils/mock-providers.ts`, modify `createMockProduct` function around line 268:

```typescript
// BEFORE:
export const createMockProduct = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.commerce.productName(),
  sku: faker.commerce.isbn(),
  category: faker.commerce.department(),
  unit_price: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }), // REMOVE THIS LINE
  description: faker.commerce.productDescription(),
  is_active: true,
  certifications: [],
  allergens: [],
  image_urls: [],
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// AFTER:
export const createMockProduct = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.commerce.productName(),
  sku: faker.commerce.isbn(),
  category: faker.commerce.department(),
  description: faker.commerce.productDescription(),
  is_active: true,
  certifications: [],
  allergens: [],
  image_urls: [],
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});
```

**Step 3: Check for additional product status field**

Verify if `is_active` should be `status` instead:

```bash
grep "status.*productStatusSchema" src/atomic-crm/validation/products.ts
```

If schema uses `status` enum instead of `is_active` boolean, update mock:

```typescript
// Update if needed:
  status: 'active',  // instead of is_active: true
```

**Step 4: Run type check**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 5: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass (mock data now matches current schema)

**Step 6: Commit**

```bash
git add src/tests/utils/mock-providers.ts
git commit -m "test: remove unit_price from product mock data

Update createMockProduct to match current schema after October 2025
pricing removal. Product catalog no longer stores pricing information.

Related: supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql"
```

---

## Task 3: Remove Outdated Documentation Types

**Context:** The `docs/database/types/database.types.ts` file contains outdated type definitions with pricing fields. This is documentation that doesn't match the actual schema.

**Files:**
- Modify: `docs/database/types/database.types.ts:250-287`

**Step 1: Verify this is documentation only**

Check if this file is imported anywhere:

```bash
grep -r "docs/database/types/database.types" src/
```

Expected: No imports (documentation file only)

**Step 2: Update OpportunityProduct interface**

In `docs/database/types/database.types.ts`, update lines 250-261:

```typescript
// BEFORE:
export interface OpportunityProduct extends BaseEntity {
  opportunity_id: number;
  product_id?: number | null;
  product_name: string;
  product_category?: string | null;
  quantity: number;                    // REMOVE
  unit_price?: number | null;          // REMOVE
  extended_price?: number | null;      // REMOVE (Generated)
  discount_percent: number;            // REMOVE
  final_price?: number | null;         // REMOVE (Generated)
  notes?: string | null;
}

// AFTER:
export interface OpportunityProduct extends BaseEntity {
  opportunity_id: number;
  product_id?: number | null;
  product_name: string;
  product_category?: string | null;
  notes?: string | null;
}
```

**Step 3: Update Product interface**

In `docs/database/types/database.types.ts`, update lines 277-287:

```typescript
// BEFORE:
export interface Product extends BaseEntity {
  principal_id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  unit_price?: number | null;      // REMOVE
  unit_cost?: number | null;       // REMOVE (if not used elsewhere)
  is_active: boolean;
  min_order_quantity: number;
}

// AFTER:
export interface Product extends BaseEntity {
  principal_id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  status: 'active' | 'discontinued' | 'coming_soon';  // Matches productStatusSchema
  min_order_quantity: number;
}
```

**Step 4: Add documentation comment**

Add comment explaining the pricing removal:

```typescript
/**
 * OpportunityProduct - Product associations for opportunities
 *
 * Note: As of October 2025, pricing was removed from the product catalog.
 * Products are tracked for association only. Pricing is handled externally
 * via quotes and negotiations.
 *
 * Migration: supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql
 */
export interface OpportunityProduct extends BaseEntity {
  // ... rest of interface
}
```

**Step 5: Verify documentation accuracy**

Compare with actual generated types:

```bash
diff <(grep -A 10 "opportunity_products:" src/types/database.generated.ts) \
     <(cat docs/database/types/database.types.ts | grep -A 10 "OpportunityProduct")
```

Expected: Structures should match

**Step 6: Run type check**

Run:
```bash
npm run type-check
```

Expected: No errors (documentation file not imported)

**Step 7: Commit**

```bash
git add docs/database/types/database.types.ts
git commit -m "docs: update database types to reflect pricing removal

Remove pricing fields from OpportunityProduct and Product documentation
types to match current schema. Add comment explaining October 2025
architectural decision.

Related: supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql"
```

---

## Task 4: Update JSDoc Example Comments

**Context:** Two component files have JSDoc examples using "price" as an example field name. While not harmful, updating them improves consistency and avoids confusion.

**Files:**
- Modify: `src/components/admin/date-field.tsx:27`
- Modify: `src/components/admin/reference-array-field.tsx:36`

**Step 1: Update DateField example**

In `src/components/admin/date-field.tsx`, update JSDoc example around line 27:

```typescript
// BEFORE:
/**
 * <DateField source="price" locales="fr-FR" options={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }} />
 */

// AFTER:
/**
 * <DateField source="created_at" locales="fr-FR" options={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }} />
 */
```

**Step 2: Update ReferenceArrayField example**

In `src/components/admin/reference-array-field.tsx`, update JSDoc example around line 36:

```typescript
// BEFORE:
/**
 *         <DataTable.NumberCol source="price" options={{ style: 'currency', currency: 'USD' }} />
 */

// AFTER:
/**
 *         <DataTable.NumberCol source="quantity" options={{ maximumFractionDigits: 0 }} />
 */
```

**Step 3: Run type check**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 4: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/admin/date-field.tsx src/components/admin/reference-array-field.tsx
git commit -m "docs: update JSDoc examples to avoid pricing field references

Replace 'price' field examples with 'created_at' and 'quantity' to better
reflect current schema and avoid confusion after pricing removal."
```

---

## Task 5: Final Verification

**Context:** Comprehensive verification that all pricing cleanup is complete and no regressions were introduced.

**Step 1: Search for remaining pricing references**

Run comprehensive search:

```bash
grep -r "unit_price\|list_price\|discount_percent\|currency_code\|unit_of_measure" \
  src/ \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules
```

Expected output:
- No matches OR
- Only matches in comments documenting the removal (e.g., "no pricing/quantity")
- "PricewaterhouseCoopers" (company name - legitimate)

**Step 2: Run full type check**

Run:
```bash
npm run type-check
```

Expected: ✅ No TypeScript errors

**Step 3: Run full test suite**

Run:
```bash
npm test
```

Expected: ✅ All tests pass (660 passed)

**Step 4: Run build**

Run:
```bash
npm run build
```

Expected: ✅ Build succeeds with no errors

**Step 5: Run linter**

Run:
```bash
npm run lint
```

Expected: ✅ No new linting errors

**Step 6: Review git diff**

```bash
git diff main --stat
```

Expected:
- 4 files modified
- Reasonable line count changes (removals primarily)

**Step 7: Create summary commit if needed**

If all verification passes, optionally create summary:

```bash
# Only if you made verification fixes
git add -A
git commit -m "chore: final pricing cleanup verification and fixes

Verified all pricing references removed with no regressions:
- Type check: passing
- Tests: 660 passing
- Build: successful
- Lint: no new errors"
```

---

## Completion Checklist

After completing all tasks, verify:

- ✅ Database function types removed from generated types
- ✅ Test mock data updated to match current schema
- ✅ Documentation types updated with explanatory comments
- ✅ JSDoc examples use non-pricing field names
- ✅ All tests passing (660 passed)
- ✅ Type check passing
- ✅ Build successful
- ✅ Lint passing
- ✅ Clean commit history with descriptive messages

## Reference Documents

- Design: `docs/plans/2025-11-02-pricing-cleanup-design.md`
- Migration: `supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql`
- CLAUDE.md: Lines 17-33 (Pricing Removal section)
- Product validation: `src/atomic-crm/validation/products.ts`
- Opportunities validation: `src/atomic-crm/validation/opportunities.ts`

## Notes for Implementer

**Testing strategy:**
- Mock data changes are the highest risk (could break tests)
- Verify tests pass after each commit to catch issues early
- Generated types changes are safe (no code references removed functions)

**Scope discipline:**
- Keep "minimum_order_quantity" - this is a valid business field, not pricing
- Keep comments like "no pricing/quantity" - they document the architectural decision
- Keep "PricewaterhouseCoopers" - company name, not a pricing reference

**Boy Scout Rule:**
- If you find `is_active` vs `status` inconsistency, fix it
- If you find other schema mismatches in mock data, fix them
- Document any additional issues found for future cleanup
