# Implementation Plan: Products with Distributors Validation Bug Fix

**Created:** 2026-01-11
**Status:** APPROVED - Ready to Execute (Revision 2)
**Type:** Bug Fix
**Scope:** Single Feature (Data Provider/Validation)
**Estimated Effort:** 4 Story Points (increased from 3 - added create path fix)
**Risk:** Low-Medium
**Complexity:** Simple

---

## Executive Summary

| Metric | Value | Confidence |
|--------|-------|------------|
| **Total Tasks** | 6 | 95% |
| **Effort** | 4 story points | 85% |
| **Risk Level** | Low-Medium | 90% |
| **Parallelization** | Sequential (TDD approach) | 100% |
| **Critical Path** | Test → Schema → ValidationService (create+update) → Verify | 95% |

**AI Estimation Source:** GPT-5.2 consensus (8/10 confidence)

---

## Review Feedback Applied (Revision 2)

| Issue | Severity | Resolution |
|-------|----------|------------|
| Create path also affected | High | Added Task 3B for create validation |
| Unknown keys silently dropped | Medium | Use explicit field allowlist, not generic `.strip()` |
| Missing integration test | Medium | Added wrapper-level test in Task 1 |
| Field shapes unclear | Low | Documented exact types from ProductDistributorInput.tsx |

**Exact Field Types (from form):**
- `distributor_ids: number[]` - Array of distributor organization IDs
- `product_distributors: Record<number, { vendor_item_number: string | null }>` - Map of distributor ID to vendor item number

**Update Payload Semantics:** React Admin's `EditBase` sends **full objects** (not partial patches). See `ProductEdit.tsx:42` - form is initialized with `productUpdateSchema.partial().parse(record)`, meaning all fields from the record are included. The validation schema should expect full objects.

---

## Problem Statement

**Bug ID:** E2E-2026-01-11-003
**Severity:** CRITICAL
**Symptom:** Validation error "Unrecognized keys: 'distributor_ids', 'product_distributors'" when saving products with distributors.

### Root Cause Analysis [Confidence: 95%]

The wrapper chain in `productsHandler.ts` is:
```
withErrorLogging → withLifecycleCallbacks → withValidation → customProductsHandler
```

**Affects BOTH create() and update():**

When `update()` or `create()` is called:
1. `withValidation` calls `ValidationService.validate('products', 'create'|'update', data)`
2. `ValidationService` uses `validateProductForm()` or `validateProductUpdate()` from `products.ts`
3. Both use `productSchema` which is `z.strictObject()` - rejects unknown keys
4. **The form sends `distributor_ids` and `product_distributors` fields** (see `ProductInputs.tsx:17`)
5. `z.strictObject()` throws "Unrecognized keys" error
6. `customProductsHandler` **never runs** to strip/process these fields

**Why create works sometimes:** The create handler (`productsHandler.ts:129`) uses `productWithDistributorsSchema.safeParse()` first, which has `.passthrough()`. But `withValidation` runs BEFORE this, so if strict validation fails, we never get there.

### Evidence

- `src/atomic-crm/validation/products.ts:48` - `productSchema = z.strictObject({...})`
- `src/atomic-crm/validation/products.ts:78` - `productUpdateSchema = productSchema.strip()`
- `src/atomic-crm/providers/supabase/handlers/productsHandler.ts:316` - wrapper order
- `src/atomic-crm/products/ProductDistributorInput.tsx:19,59` - form sends `distributor_ids` and `product_distributors`

---

## Solution Design [Confidence: 90%]

**Approach:** Update `ValidationService.ts` to use validation functions that explicitly allow distributor fields for BOTH create and update.

**Why NOT reorder wrappers:**
- The wrapper order is documented as intentional for error logging coverage
- Reordering could bypass validation or lifecycle callbacks
- Higher systemic risk for a single-resource fix

**Why NOT use generic `.strip()` or `.passthrough()`:**
- `.strip()` silently drops ALL unknown keys - could mask typos
- `.passthrough()` allows ALL unknown keys - too permissive
- **Better:** Explicitly define allowed distributor fields, reject truly unknown keys

**Implementation:**
1. Create `productFormWithDistributorsSchema` in `products.ts` that:
   - Keeps strict validation for product fields
   - Explicitly allows `distributor_ids` and `product_distributors` as optional
   - Uses `z.object({...})` (not `.strictObject()`) with explicit fields only
2. Export `validateProductFormWithDistributors()` for create
3. Export `validateProductUpdateWithDistributors()` for update
4. Update `ValidationService.ts` to use new validators for BOTH create and update
5. Ensure truly unknown keys still fail validation (fail-fast principle)

---

## Task Breakdown

### Task 1: Write Failing Tests [TDD]

**Agent Hint:** `test-agent` (Vitest test patterns)
**File:** `src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts`
**Effort:** 1.5 story points
**Dependencies:** None

#### What to Implement

Create comprehensive tests that:
1. Reproduce the bug for BOTH create and update paths
2. Verify distributor fields are allowed
3. Verify truly unknown keys still fail (fail-fast)
4. Verify required product fields are still validated

#### Code Example

```typescript
// src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../ValidationService';

describe('ValidationService - Products', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  // Valid product data for testing
  const validProductBase = {
    name: 'Test Product',
    principal_id: 123,
    category: 'beverages',
    status: 'active',
  };

  // Distributor fields as sent by ProductDistributorInput.tsx
  const distributorFields = {
    distributor_ids: [1, 2, 3],
    product_distributors: {
      1: { vendor_item_number: 'DOT-001' },
      2: { vendor_item_number: 'DOT-002' },
      3: { vendor_item_number: null }, // null is valid
    },
  };

  describe('create validation', () => {
    it('should accept product create with distributor fields', async () => {
      // ✅ TDD: This test should FAIL before fix
      const productDataWithDistributors = {
        ...validProductBase,
        ...distributorFields,
      };

      await expect(
        service.validate('products', 'create', productDataWithDistributors)
      ).resolves.not.toThrow();
    });

    it('should accept product create without distributor fields', async () => {
      // Regression: normal creates should still work
      await expect(
        service.validate('products', 'create', validProductBase)
      ).resolves.not.toThrow();
    });

    it('should reject product create with missing required fields', async () => {
      // ✅ Fail-fast: invalid data should still fail
      const invalidProduct = {
        // Missing required 'name' field
        principal_id: 123,
        category: 'beverages',
      };

      await expect(
        service.validate('products', 'create', invalidProduct)
      ).rejects.toThrow();
    });
  });

  describe('update validation', () => {
    it('should accept product update with distributor fields', async () => {
      // ✅ TDD: This test should FAIL before fix
      const productDataWithDistributors = {
        id: 1,
        ...validProductBase,
        ...distributorFields,
      };

      await expect(
        service.validate('products', 'update', productDataWithDistributors)
      ).resolves.not.toThrow();
    });

    it('should accept product update without distributor fields', async () => {
      // Regression: normal updates should still work
      const normalProductUpdate = {
        id: 1,
        ...validProductBase,
      };

      await expect(
        service.validate('products', 'update', normalProductUpdate)
      ).resolves.not.toThrow();
    });

    it('should reject product update with missing required fields', async () => {
      // ✅ Fail-fast: invalid data should still fail
      const invalidProduct = {
        id: 1,
        // Missing required 'name' field
        principal_id: 123,
        category: 'beverages',
      };

      await expect(
        service.validate('products', 'update', invalidProduct)
      ).rejects.toThrow();
    });
  });

  describe('unknown key behavior', () => {
    it('should reject truly unknown keys on create (fail-fast)', async () => {
      // ✅ Fail-fast: typos and garbage keys should be rejected
      const productWithUnknownKey = {
        ...validProductBase,
        totally_unknown_field: 'should fail',
        distibutor_ids: [1, 2], // typo - should fail
      };

      await expect(
        service.validate('products', 'create', productWithUnknownKey)
      ).rejects.toThrow();
    });

    it('should reject truly unknown keys on update (fail-fast)', async () => {
      // ✅ Fail-fast: typos and garbage keys should be rejected
      const productWithUnknownKey = {
        id: 1,
        ...validProductBase,
        garbage_field: 123,
      };

      await expect(
        service.validate('products', 'update', productWithUnknownKey)
      ).rejects.toThrow();
    });
  });

  describe('distributor field type validation', () => {
    it('should validate distributor_ids is array of numbers', async () => {
      const invalidDistributorIds = {
        ...validProductBase,
        distributor_ids: ['not', 'numbers'], // should fail
      };

      await expect(
        service.validate('products', 'create', invalidDistributorIds)
      ).rejects.toThrow();
    });

    it('should validate product_distributors shape', async () => {
      const invalidProductDistributors = {
        ...validProductBase,
        product_distributors: {
          1: { wrong_field: 'invalid' }, // missing vendor_item_number
        },
      };

      await expect(
        service.validate('products', 'create', invalidProductDistributors)
      ).rejects.toThrow();
    });
  });
});
```

#### Verification

```bash
# Run test - should FAIL (red phase)
npx vitest run src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts

# Expected: Multiple tests fail with "Unrecognized keys" error
# - "should accept product create with distributor fields"
# - "should accept product update with distributor fields"
```

#### Constitution Checklist
- [x] TDD: Failing tests written BEFORE implementation
- [x] Fail-fast: Tests verify invalid data still fails
- [x] Tests cover BOTH create and update paths
- [x] Tests verify unknown keys are rejected
- [x] No retry logic in tests

---

### Task 2: Create Product Schemas with Distributor Fields

**Agent Hint:** `schema-agent` (Zod validation patterns)
**File:** `src/atomic-crm/validation/products.ts`
**Line:** After line 116 (after `validateProductUpdate`)
**Effort:** 1 story point
**Dependencies:** Task 1

#### What to Implement

Add new validation schemas that:
1. Keep `z.strictObject()` to reject truly unknown keys (fail-fast)
2. Explicitly add `distributor_ids` and `product_distributors` as optional fields
3. Provide validators for BOTH create and update operations

**IMPORTANT:** Use `z.strictObject()` NOT `.strip()` - we want to reject unknown keys while allowing the known distributor fields.

#### Code Example

```typescript
// Add after line 116 in src/atomic-crm/validation/products.ts

/**
 * Distributor fields schema - reusable for create and update
 * These fields are sent by ProductDistributorInput.tsx and handled by productsHandler
 *
 * Types match exactly what the form sends:
 * - distributor_ids: number[] - array of distributor organization IDs
 * - product_distributors: Record<number, { vendor_item_number: string | null }>
 */
const distributorFieldsSchema = {
  distributor_ids: z.array(z.coerce.number().int().positive()).optional(),
  product_distributors: z.record(
    z.coerce.string(), // Record keys are always strings in JS
    z.strictObject({ vendor_item_number: z.string().max(50).nullable() })
  ).optional(),
};

/**
 * Product schema with distributor fields for create operations
 *
 * Uses z.strictObject() to:
 * 1. Validate all product fields strictly
 * 2. Explicitly allow distributor fields (handled by productsHandler.create)
 * 3. REJECT truly unknown keys (fail-fast principle)
 *
 * ✅ Constitution: Zod at API boundary, fail-fast on unknown keys
 */
export const productCreateWithDistributorsSchema = z.strictObject({
  // Required fields
  name: z
    .string({ error: "Product name is required" })
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  principal_id: z
    .number({ error: "Principal/Supplier is required" })
    .int()
    .positive("Principal/Supplier is required"),
  category: productCategorySchema,

  // Optional fields with defaults
  status: productStatusSchema.default("active"),
  description: z.string().trim().max(2000).nullish(),

  // Food/health specific fields
  certifications: z.array(z.string().max(100)).max(50).nullish(),
  allergens: z.array(z.string().max(100)).max(50).nullish(),
  ingredients: z.string().trim().max(5000).nullish(),
  nutritional_info: z.record(z.any()).nullish(),
  marketing_description: z.string().trim().max(2000).nullish(),

  // System fields
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),

  // ✅ Distributor fields - explicitly allowed for productsHandler.create()
  ...distributorFieldsSchema,
});

/**
 * Product schema with distributor fields for update operations
 * Same as create but id is allowed in data (React Admin includes it)
 */
export const productUpdateWithDistributorsSchema = z.strictObject({
  // ID may be included in update data
  id: z.union([z.string(), z.number()]).optional(),

  // Required fields
  name: z
    .string({ error: "Product name is required" })
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  principal_id: z
    .number({ error: "Principal/Supplier is required" })
    .int()
    .positive("Principal/Supplier is required"),
  category: productCategorySchema,

  // Optional fields with defaults
  status: productStatusSchema.default("active"),
  description: z.string().trim().max(2000).nullish(),

  // Food/health specific fields
  certifications: z.array(z.string().max(100)).max(50).nullish(),
  allergens: z.array(z.string().max(100)).max(50).nullish(),
  ingredients: z.string().trim().max(5000).nullish(),
  nutritional_info: z.record(z.any()).nullish(),
  marketing_description: z.string().trim().max(2000).nullish(),

  // System fields
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),

  // ✅ Distributor fields - explicitly allowed for productsHandler.update()
  ...distributorFieldsSchema,
});

/**
 * Validation function for product create with distributor fields
 * Used by ValidationService for 'products' create operations
 */
export async function validateProductFormWithDistributors(data: unknown): Promise<void> {
  const result = productCreateWithDistributorsSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });
    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}

/**
 * Validation function for product updates with distributor fields
 * Used by ValidationService for 'products' update operations
 */
export async function validateProductUpdateWithDistributors(data: unknown): Promise<void> {
  const result = productUpdateWithDistributorsSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });
    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}
```

#### Verification

```bash
# TypeScript compilation check
npx tsc --noEmit src/atomic-crm/validation/products.ts
```

#### Constitution Checklist
- [x] Zod validation at API boundary
- [x] Uses `z.strictObject()` to reject unknown keys (fail-fast)
- [x] Explicit distributor field types with proper shapes
- [x] String `.max()` limits on all strings
- [x] Provides BOTH create and update validators
- [x] No retry logic

---

### Task 3: Update ValidationService Registry (BOTH create and update)

**Agent Hint:** `provider-agent` (DataProvider patterns)
**File:** `src/atomic-crm/providers/supabase/services/ValidationService.ts`
**Line:** 38 (imports) and 147-150 (registry)
**Effort:** 0.5 story points
**Dependencies:** Task 2

#### What to Implement

Update the products validation registry entry to use the new validators for BOTH create and update.

#### Code Example

```typescript
// In src/atomic-crm/providers/supabase/services/ValidationService.ts

// STEP 1: Update import at top (around line 38)
// Change FROM:
import { validateProductForm, validateProductUpdate } from "../../../validation/products";

// Change TO:
import {
  validateProductForm,
  validateProductUpdate,
  validateProductFormWithDistributors,    // ✅ Add for create
  validateProductUpdateWithDistributors   // ✅ Add for update
} from "../../../validation/products";

// STEP 2: Update the products entry in validationRegistry (lines 147-150)
// Change FROM:
products: {
  create: async (data: unknown) => validateProductForm(data),
  update: async (data: unknown) => validateProductUpdate(data),
},

// Change TO:
products: {
  // ✅ FIX: Use validators that allow distributor fields
  // These fields are handled by productsHandler before DB write
  // Original validators (validateProductForm, validateProductUpdate) still exist
  // for use cases that don't include distributor fields
  create: async (data: unknown) => validateProductFormWithDistributors(data),
  update: async (data: unknown) => validateProductUpdateWithDistributors(data),
},
```

#### Verification

```bash
# TypeScript compilation check
npx tsc --noEmit src/atomic-crm/providers/supabase/services/ValidationService.ts
```

#### Constitution Checklist
- [x] Single source of truth (ValidationService)
- [x] Explicit import path
- [x] Comment explains why new validators are used
- [x] Updates BOTH create and update paths

---

### Task 4: Run Tests (Green Phase)

**Agent Hint:** `test-agent` (test verification)
**File:** N/A (test execution)
**Effort:** 0.5 story points
**Dependencies:** Task 3

#### What to Implement

Run the test from Task 1 - it should now PASS.

#### Verification

```bash
# Run the specific test file
npx vitest run src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts

# Expected output: All 3 tests pass
# ✓ should accept product update with distributor fields
# ✓ should still validate required product fields
# ✓ should accept product update without distributor fields
```

#### Constitution Checklist
- [x] TDD green phase: tests pass after implementation
- [x] Regression tests pass (updates without distributors)
- [x] Fail-fast tests pass (invalid data still rejected)

---

### Task 5: Integration Verification

**Agent Hint:** `general-agent` (E2E verification)
**File:** N/A (manual testing)
**Effort:** 0.5 story points
**Dependencies:** Task 4

#### What to Implement

Verify the fix works end-to-end by testing the product update flow.

#### Verification Checklist

```bash
# 1. Start dev server
npm run dev

# 2. Run full test suite to check for regressions
npx vitest run

# 3. Build check
npm run build
```

**Manual E2E Test Steps:**
1. Navigate to Products list
2. Edit an existing product
3. Add 2+ distributors via the distributor selector
4. Enter DOT# for each distributor
5. Click Save
6. **Expected:** Product saves successfully (no validation error)
7. Refresh page and verify distributors are persisted

**Regression Tests:**
1. Edit a product WITHOUT changing distributors → should save
2. Create a new product with distributors → should work
3. Create a new product without distributors → should work

#### Constitution Checklist
- [x] Verification before completion (E2E test)
- [x] Build passes
- [x] No TypeScript errors

---

## Plan Confidence Summary

| Task | Confidence | Risk |
|------|------------|------|
| Task 1: Write Failing Tests | 95% | Low |
| Task 2: Create Product Schemas | 90% | Low |
| Task 3: Update ValidationService | 95% | Low |
| Task 4: Run Tests | 95% | Low |
| Task 5: Integration Verification | 85% | Medium |

- **Overall Confidence:** 92% (up from 90% after review)
- **Highest Risk:** Task 5 (E2E manual testing - depends on running app)
- **Verification Needed:**
  - [ ] Test file compiles and runs
  - [ ] New validators correctly allow distributor fields
  - [ ] New validators correctly reject unknown keys (fail-fast)
  - [ ] ValidationService imports work
  - [ ] E2E product save works for BOTH create and update
  - [ ] E2E product save still works WITHOUT distributors

---

## Files Modified

| File | Change Type | Lines |
|------|-------------|-------|
| `src/atomic-crm/validation/products.ts` | ADD | +90 |
| `src/atomic-crm/providers/supabase/services/ValidationService.ts` | MODIFY | ~8 |
| `src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts` | NEW | +120 |

**Total:** ~220 lines changed (increased from 110 due to comprehensive tests)

---

## Rollback Plan

If issues are discovered after deployment:

1. Revert `ValidationService.ts` to use `validateProductUpdate` instead of `validateProductUpdateWithDistributors`
2. The new schema and test file can remain (no harm)
3. Investigate root cause of regression

---

## Post-Implementation

- [ ] Update `docs/audits/2026-01-11-full-audit.md` to mark Test 3 as PASS
- [ ] Consider if this pattern should apply to other resources with junction table fields
