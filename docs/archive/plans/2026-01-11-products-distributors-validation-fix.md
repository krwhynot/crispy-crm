# Implementation Plan: Products with Distributors Validation Bug Fix

**Created:** 2026-01-11
**Status:** Draft
**Type:** Bug Fix
**Scope:** Single Feature (Data Provider/Validation)
**Estimated Effort:** 3 Story Points
**Risk:** Low-Medium
**Complexity:** Simple

---

## Executive Summary

| Metric | Value | Confidence |
|--------|-------|------------|
| **Total Tasks** | 5 | 95% |
| **Effort** | 3 story points | 85% |
| **Risk Level** | Low-Medium | 90% |
| **Parallelization** | Sequential (TDD approach) | 100% |
| **Critical Path** | Test → Schema → ValidationService → Verify | 95% |

**AI Estimation Source:** GPT-5.2 consensus (8/10 confidence)

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

When `update()` is called:
1. `withValidation.update()` calls `ValidationService.validate('products', 'update', data)`
2. `ValidationService` uses `validateProductUpdate()` from `products.ts`
3. `validateProductUpdate()` uses `productUpdateSchema = productSchema.strip()`
4. `productSchema` uses `z.strictObject()` which rejects unknown keys
5. **The form sends `distributor_ids` and `product_distributors` fields**
6. `z.strictObject()` throws "Unrecognized keys" error
7. `customProductsHandler.update()` **never runs** to strip these fields

### Evidence

- `src/atomic-crm/validation/products.ts:48` - `productSchema = z.strictObject({...})`
- `src/atomic-crm/validation/products.ts:78` - `productUpdateSchema = productSchema.strip()`
- `src/atomic-crm/providers/supabase/handlers/productsHandler.ts:316` - wrapper order
- `src/atomic-crm/products/ProductDistributorInput.tsx:19,59` - form sends `distributor_ids` and `product_distributors`

---

## Solution Design [Confidence: 90%]

**Approach:** Update `ValidationService.ts` to use a validation function that accepts distributor fields via `.passthrough()`.

**Why NOT reorder wrappers:**
- The wrapper order is documented as intentional for error logging coverage
- Reordering could bypass validation or lifecycle callbacks
- Higher systemic risk for a single-resource fix

**Implementation:**
1. Create `validateProductUpdateWithDistributors()` in `products.ts` that uses `.strip()` (not `.strictObject()`) to allow and strip unknown keys
2. Update `ValidationService.ts` to use the new validator for products update
3. Ensure product base fields are still validated strictly

---

## Task Breakdown

### Task 1: Write Failing Test [TDD]

**Agent Hint:** `test-agent` (Vitest test patterns)
**File:** `src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Create a test that reproduces the bug - calling `ValidationService.validate('products', 'update', data)` with `distributor_ids` and `product_distributors` fields should NOT throw.

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

  describe('update validation', () => {
    it('should accept product update with distributor fields', async () => {
      // ✅ Constitution: TDD - this test should FAIL before fix
      const productDataWithDistributors = {
        id: 1,
        name: 'Test Product',
        principal_id: 123,
        category: 'beverages',
        status: 'active',
        // Form-only fields that should be allowed (then stripped by handler)
        distributor_ids: [1, 2, 3],
        product_distributors: {
          1: { vendor_item_number: 'DOT-001' },
          2: { vendor_item_number: 'DOT-002' },
        },
      };

      // Should NOT throw - distributor fields should be allowed
      await expect(
        service.validate('products', 'update', productDataWithDistributors)
      ).resolves.not.toThrow();
    });

    it('should still validate required product fields', async () => {
      // ✅ Constitution: Fail-fast - invalid data should still fail
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

    it('should accept product update without distributor fields', async () => {
      // Regression test: normal updates should still work
      const normalProductUpdate = {
        id: 1,
        name: 'Updated Product',
        principal_id: 123,
        category: 'frozen',
        status: 'active',
      };

      await expect(
        service.validate('products', 'update', normalProductUpdate)
      ).resolves.not.toThrow();
    });
  });
});
```

#### Verification

```bash
# Run test - should FAIL (red phase)
npx vitest run src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts
```

**Expected output:** Test fails with "Unrecognized keys" error

#### Constitution Checklist
- [x] TDD: Failing test written BEFORE implementation
- [x] Fail-fast: Test verifies invalid data still fails
- [x] No retry logic in test

---

### Task 2: Create Permissive Update Validator

**Agent Hint:** `schema-agent` (Zod validation patterns)
**File:** `src/atomic-crm/validation/products.ts`
**Line:** After line 116 (after `validateProductUpdate`)
**Effort:** 0.5 story points
**Dependencies:** Task 1

#### What to Implement

Add a new validation function that uses `.strip()` instead of `.strictObject()` to allow distributor fields to pass through (they'll be stripped by the handler).

#### Code Example

```typescript
// Add after line 116 in src/atomic-crm/validation/products.ts

/**
 * Update schema that allows form-only distributor fields
 *
 * The form sends distributor_ids and product_distributors which are
 * handled by productsHandler.update() - we need to let them through
 * validation so the handler can process them.
 *
 * Uses .strip() to:
 * 1. Allow unknown keys (unlike strictObject)
 * 2. Strip them from the validated output
 *
 * ✅ Constitution: Zod at API boundary - handler strips before DB write
 */
export const productUpdatePermissiveSchema = z.object({
  // Required fields for update (id comes from params, not data)
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

  // Form-only fields - explicitly allowed, will be stripped
  // These are handled by productsHandler.update() before DB write
  distributor_ids: z.array(z.coerce.number().int().positive()).optional(),
  product_distributors: z.record(
    z.coerce.number(),
    z.object({ vendor_item_number: z.string().nullable() })
  ).optional(),
}).strip(); // ✅ Strip unknown keys (safer than .passthrough())

/**
 * Validation function for product updates with distributor fields
 * Used by ValidationService for 'products' update operations
 */
export async function validateProductUpdateWithDistributors(data: unknown): Promise<void> {
  const result = productUpdatePermissiveSchema.safeParse(data);

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
- [x] Uses `.strip()` not `.passthrough()` (safer)
- [x] Explicit distributor field types (not z.any())
- [x] String `.max()` limits on all strings
- [x] No retry logic

---

### Task 3: Update ValidationService Registry

**Agent Hint:** `provider-agent` (DataProvider patterns)
**File:** `src/atomic-crm/providers/supabase/services/ValidationService.ts`
**Line:** 147-150
**Effort:** 0.5 story points
**Dependencies:** Task 2

#### What to Implement

Update the products validation registry entry to use the new permissive validator for updates.

#### Code Example

```typescript
// In src/atomic-crm/providers/supabase/services/ValidationService.ts

// Add import at top (around line 38)
import {
  validateProductForm,
  validateProductUpdate,
  validateProductUpdateWithDistributors  // ✅ Add this import
} from "../../../validation/products";

// Update the products entry in validationRegistry (lines 147-150)
// Change FROM:
products: {
  create: async (data: unknown) => validateProductForm(data),
  update: async (data: unknown) => validateProductUpdate(data),
},

// Change TO:
products: {
  create: async (data: unknown) => validateProductForm(data),
  // ✅ FIX: Use permissive validator that allows distributor fields
  // These fields are handled by productsHandler.update() before DB write
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
- [x] Comment explains why permissive validator is used

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
| Task 1: Write Failing Test | 95% | Low |
| Task 2: Create Permissive Validator | 90% | Low |
| Task 3: Update ValidationService | 95% | Low |
| Task 4: Run Tests | 95% | Low |
| Task 5: Integration Verification | 85% | Medium |

- **Overall Confidence:** 90%
- **Highest Risk:** Task 5 (E2E manual testing - depends on running app)
- **Verification Needed:**
  - [ ] Test file compiles and runs
  - [ ] New validator correctly allows distributor fields
  - [ ] ValidationService import works
  - [ ] E2E product save works

---

## Files Modified

| File | Change Type | Lines |
|------|-------------|-------|
| `src/atomic-crm/validation/products.ts` | ADD | +45 |
| `src/atomic-crm/providers/supabase/services/ValidationService.ts` | MODIFY | ~5 |
| `src/atomic-crm/providers/supabase/services/__tests__/ValidationService.products.test.ts` | NEW | +60 |

**Total:** ~110 lines changed

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
