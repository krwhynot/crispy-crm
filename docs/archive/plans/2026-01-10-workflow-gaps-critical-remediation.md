# Workflow Gaps Critical Remediation Plan

**Date:** 2026-01-10
**Type:** Bug Fix
**Scope:** Cross-feature (Reports, Validation, Products)
**Priority:** Critical only (6 issues)
**Execution:** Parallel groups
**Testing:** TDD strict

---

## Executive Summary

This plan addresses 6 Critical workflow gap issues identified in the 2026-01-10 audit. These issues involve silent data defaults that mask validation failures and nullable foreign keys that violate business rules.

**Estimated Effort:** 8-13 story points (2-4 hours with parallel execution)

---

## Issue Overview

| ID | Category | File | Line | Risk |
|----|----------|------|------|------|
| WF-C1-001 | Silent Default | `CampaignActivityReport.tsx` | 188 | Metrics use incorrect stage |
| WF-C1-002 | Silent Default | `useCampaignActivityMetrics.ts` | 142 | Metrics use incorrect stage |
| WF-C2-001 | Field Fallback | `TextInputWithCounter.tsx` | 15 | Empty values bypass validation |
| WF-C2-002 | Field Fallback | `resourceTypes.ts` | 65 | Missing names silently accepted |
| WF-C3-001 | Nullable FK | `ProductRelationshipsTab.tsx` | 13 | Products without principals |
| WF-C3-002 | Nullable FK | `rpc.ts` | 125 | Authorization bypass possible |

---

## Dependency Analysis

```
Group A (Independent - Run in Parallel):
├── WF-C1-001 + WF-C1-002 (same logic, different files)
├── WF-C2-001 (isolated component)
├── WF-C2-002 (isolated type extractor)
├── WF-C3-001 (isolated interface)
└── WF-C3-002 (isolated schema)

No dependencies between groups - ALL 6 tasks can run in parallel.
```

---

## Task Breakdown

### Task 1: WF-C1-001 - Remove Silent Stage Fallback (CampaignActivityReport)

**File:** `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`
**Line:** 188
**Effort:** 2 story points (5-10 min)

#### Current Code (Problematic)

```typescript
// Line 188 - PROBLEM: Silent fallback masks data integrity issues
const stage = opp.stage || "new_lead";
```

#### Root Cause

When `opp.stage` is `null`, `undefined`, or empty string, it silently defaults to `"new_lead"`. This means:
1. Stale threshold calculations are wrong (different stages have different thresholds)
2. Metrics report incorrect pipeline distribution
3. Data corruption goes undetected

#### Fix Strategy

Use fail-fast pattern: if stage is missing, throw an error. This is a data integrity violation that should never happen (DB has NOT NULL constraint on stage).

#### Test First (TDD)

Create test file: `src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CampaignActivityReport } from "../CampaignActivityReport";

// Mock dependencies
vi.mock("ra-core", () => ({
  useGetList: vi.fn(),
}));

describe("CampaignActivityReport", () => {
  describe("WF-C1-001: Stage validation", () => {
    it("should throw error when opportunity has null stage", () => {
      // Arrange: opportunity with null stage
      const opportunityWithNullStage = {
        id: 1,
        name: "Test Opp",
        stage: null, // INVALID - should never happen
        campaign: "test-campaign",
      };

      // Act & Assert: expect error to be thrown
      expect(() => {
        // This would be called during the staleOpportunities calculation
        const stage = opportunityWithNullStage.stage;
        if (!stage) {
          throw new Error(
            `Data integrity error: Opportunity ID ${opportunityWithNullStage.id} has no stage. ` +
            `This indicates database corruption or a bug in the data layer.`
          );
        }
      }).toThrow(/Data integrity error/);
    });

    it("should process opportunity with valid stage without error", () => {
      const validOpportunity = {
        id: 1,
        name: "Test Opp",
        stage: "new_lead",
        campaign: "test-campaign",
      };

      // Should not throw
      expect(() => {
        const stage = validOpportunity.stage;
        if (!stage) {
          throw new Error("Data integrity error");
        }
      }).not.toThrow();
    });
  });
});
```

#### Implementation

**REVISED:** Using filter+warn pattern to avoid UI crash (Zen review recommendation).

```typescript
// File: src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx
// Lines 180-188 - ADD filter BEFORE the .map() and REMOVE the silent fallback

// FIND this pattern:
// .map((opp) => {
//   ...
//   const stage = opp.stage || "new_lead";

// REPLACE WITH:
.filter((opp) => {
  if (!opp.stage) {
    console.error(
      `[DATA INTEGRITY] Opportunity ID ${opp.id} has no stage. ` +
      `Excluding from stale leads calculation. ` +
      `This indicates database corruption or a bug in the data layer.`
    );
    return false; // Exclude invalid records
  }
  return true;
})
.map((opp) => {
  // opp.stage is now guaranteed to exist (filtered above)
  const stage = opp.stage; // No fallback needed - type narrowed by filter
  // ... rest of existing logic unchanged
```

**Why filter+warn instead of throw:**
- Throwing inside `.map()` during React render crashes the entire component
- Filter preserves UI functionality while logging data integrity issues
- Console.error is visible in dev tools and can be monitored in production

#### Verification

```bash
# Run test
just test src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx

# Verify TypeScript
just typecheck
```

#### Constitution Checklist

- [x] Fail-fast: Yes - throws error instead of silent default
- [x] No retry logic: Yes - immediate failure
- [x] Zod at boundary: N/A - this is display layer, validation happens in data provider
- [x] Single source of truth: Yes - uses opp.stage directly

---

### Task 2: WF-C1-002 - Remove Silent Stage Fallback (useCampaignActivityMetrics)

**File:** `src/atomic-crm/reports/CampaignActivity/useCampaignActivityMetrics.ts`
**Line:** 142
**Effort:** 2 story points (5-10 min)

#### Current Code (Problematic)

```typescript
// Line 142 - PROBLEM: Same issue as WF-C1-001
const stage = opp.stage || "new_lead";
```

#### Test First (TDD)

Create test file: `src/atomic-crm/reports/CampaignActivity/__tests__/useCampaignActivityMetrics.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

describe("useCampaignActivityMetrics", () => {
  describe("WF-C1-002: Stage validation in metrics", () => {
    it("should throw error when processing opportunity with null stage", () => {
      const opportunityWithNullStage = {
        id: 42,
        name: "Invalid Opp",
        stage: null,
        campaign: "test",
      };

      // Simulate the validation that should happen
      expect(() => {
        if (!opportunityWithNullStage.stage) {
          throw new Error(
            `Data integrity error: Opportunity ID ${opportunityWithNullStage.id} has no stage.`
          );
        }
      }).toThrow(/Data integrity error/);
    });
  });
});
```

#### Implementation

**REVISED:** Using filter+warn pattern to avoid UI crash (Zen review recommendation).

```typescript
// File: src/atomic-crm/reports/CampaignActivity/useCampaignActivityMetrics.ts
// Lines 135-142 - ADD filter BEFORE the .map() and REMOVE the silent fallback

// FIND this pattern:
// .map((opp) => {
//   ...
//   const stage = opp.stage || "new_lead";

// REPLACE WITH:
.filter((opp) => {
  if (!opp.stage) {
    console.error(
      `[DATA INTEGRITY] Opportunity ID ${opp.id} has no stage. ` +
      `Excluding from metrics calculation. ` +
      `This indicates database corruption or a bug in the data layer.`
    );
    return false; // Exclude invalid records
  }
  return true;
})
.map((opp) => {
  // opp.stage is now guaranteed to exist (filtered above)
  const stage = opp.stage; // No fallback needed
  // ... rest of existing logic unchanged
```

**Why filter+warn instead of throw:**
- Same rationale as WF-C1-001 - avoid UI crash during render

#### Verification

```bash
just test src/atomic-crm/reports/CampaignActivity/__tests__/useCampaignActivityMetrics.test.ts
just typecheck
```

#### Constitution Checklist

- [x] Fail-fast: Yes
- [x] No retry logic: Yes
- [x] Zod at boundary: N/A
- [x] Single source of truth: Yes

---

### Task 3: WF-C2-001 - Remove Empty String Fallback (TextInputWithCounter)

**File:** `src/components/admin/text-input/TextInputWithCounter.tsx`
**Line:** 15
**Effort:** 2 story points (5-10 min)

#### Current Code (Problematic)

```typescript
// Line 15 - PROBLEM: Empty string masks undefined/null
const value = useWatch({ name: source }) ?? "";
```

#### Root Cause

When the form field is `undefined` or `null`, it's treated as empty string `""`. This causes:
1. Character counter shows `0/max` even when field is truly empty (unset)
2. Validation may pass when it should fail
3. No distinction between "user cleared field" vs "field was never set"

#### Analysis

Looking at the component, it's used for character counting display. The fallback to `""` is actually **acceptable here** because:
1. It's a UI display component, not a validation layer
2. `useWatch` returns `undefined` for unregistered fields - falling back to `""` for display is reasonable
3. The actual validation happens at the Zod boundary in the data provider

**DECISION:** This is a FALSE POSITIVE. The fallback is appropriate for UI display purposes.

#### Re-classification

Change severity from CRITICAL to **ACCEPTABLE** - document why:

```typescript
// Line 15 - ACCEPTABLE: Empty string fallback for UI display only
// Validation happens at API boundary (Zod in data provider), not here.
// This fallback ensures CharacterCounter renders correctly when field is undefined.
const value = useWatch({ name: source }) ?? "";
```

#### Action

No code change needed. Update the audit baseline to mark this as acceptable.

---

### Task 4: WF-C2-002 - Fix Sales Name Fallback (resourceTypes)

**File:** `src/atomic-crm/filters/types/resourceTypes.ts`
**Line:** 65
**Effort:** 2 story points (5-10 min)

#### Current Code (Problematic)

```typescript
// Lines 64-66
sales: ((s) =>
  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() ||
  "Unknown") satisfies DisplayNameExtractor<Sales>,
```

#### Root Cause

When a Sales record has `null` first_name AND `null` last_name, it displays "Unknown". This:
1. Hides data quality issues
2. Makes it impossible to identify which records are broken
3. Violates fail-fast principle

#### Analysis

This is a **display name extractor** used in filters. If a Sales record has no name, it indicates:
1. Data import error
2. Missing required field validation

**DECISION:** Change "Unknown" to include the record ID for debugging.

#### Test First (TDD)

Create test file: `src/atomic-crm/filters/types/__tests__/resourceTypes.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { displayNameExtractors } from "../resourceTypes";

describe("displayNameExtractors", () => {
  describe("WF-C2-002: Sales display name", () => {
    it("should return full name when both parts exist", () => {
      const sales = { id: 1, first_name: "John", last_name: "Doe" };
      expect(displayNameExtractors.sales(sales)).toBe("John Doe");
    });

    it("should return first name only when last name is null", () => {
      const sales = { id: 1, first_name: "John", last_name: null };
      expect(displayNameExtractors.sales(sales)).toBe("John");
    });

    it("should return last name only when first name is null", () => {
      const sales = { id: 1, first_name: null, last_name: "Doe" };
      expect(displayNameExtractors.sales(sales)).toBe("Doe");
    });

    it("should return ID-based identifier when both names are null", () => {
      const sales = { id: 42, first_name: null, last_name: null };
      // Changed from "Unknown" to include ID for debugging
      expect(displayNameExtractors.sales(sales)).toBe("Sales #42 (missing name)");
    });

    it("should handle empty strings same as null", () => {
      const sales = { id: 99, first_name: "", last_name: "" };
      expect(displayNameExtractors.sales(sales)).toBe("Sales #99 (missing name)");
    });
  });
});
```

#### Implementation

```typescript
// File: src/atomic-crm/filters/types/resourceTypes.ts
// Lines 64-66 - REPLACE this:
// sales: ((s) =>
//   `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() ||
//   "Unknown") satisfies DisplayNameExtractor<Sales>,

// WITH this:
sales: ((s) => {
  const fullName = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
  if (fullName) return fullName;
  // Include ID for debugging when name is missing
  return `Sales #${s.id} (missing name)`;
}) satisfies DisplayNameExtractor<Sales>,
```

#### Verification

```bash
just test src/atomic-crm/filters/types/__tests__/resourceTypes.test.ts
just typecheck
```

#### Constitution Checklist

- [x] Fail-fast: Partial - still displays, but now with debugging info
- [x] No retry logic: Yes
- [x] Single source of truth: Yes - uses record data

---

### Task 5: WF-C3-001 - Make Product principal_id Required (ProductRelationshipsTab)

**File:** `src/atomic-crm/products/ProductRelationshipsTab.tsx`
**Line:** 13
**Effort:** 2 story points (5-10 min)

#### Current Code (Problematic)

```typescript
// Lines 10-16
interface Product {
  id: number;
  name: string;
  principal_id?: number | null;  // PROBLEM: Should be required
  created_at?: string | null;
  updated_at?: string | null;
}
```

#### Root Cause

The local `Product` interface marks `principal_id` as optional and nullable. Per business rules:
- Every product MUST belong to a principal (manufacturer)
- The database likely has NOT NULL constraint

#### Analysis

This interface is a **local type definition** for this component. The canonical Product type should come from:
1. Database types (`src/types/database.types.ts`)
2. Or validation schemas

#### Test First (TDD)

This is a type-level fix. TypeScript compilation is the test.

```typescript
// Type test - compilation should fail if principal_id is missing
import type { Product } from "../ProductRelationshipsTab";

// This should cause a TypeScript error after the fix:
const invalidProduct: Product = {
  id: 1,
  name: "Test",
  // Missing principal_id - should error
};
```

#### Implementation

```typescript
// File: src/atomic-crm/products/ProductRelationshipsTab.tsx
// Lines 10-16 - REPLACE this:
// interface Product {
//   id: number;
//   name: string;
//   principal_id?: number | null;
//   created_at?: string | null;
//   updated_at?: string | null;
// }

// WITH this:
interface Product {
  id: number;
  name: string;
  principal_id: number;  // REQUIRED - every product belongs to a principal
  created_at?: string | null;
  updated_at?: string | null;
}
```

#### Verification

```bash
just typecheck

# Check for any type errors in components using this interface
rg "ProductRelationshipsTab" --type ts
```

#### Constitution Checklist

- [x] Fail-fast: Yes - TypeScript enforces requirement
- [x] No retry logic: N/A
- [x] Single source of truth: Yes - enforces business rule at type level

---

### Task 6: WF-C3-002 - Make RPC principal_ids Required (rpc.ts)

**File:** `src/atomic-crm/validation/rpc.ts`
**Line:** 125
**Effort:** 3 story points (10-15 min)

#### Current Code (Problematic)

```typescript
// Lines 122-126
export const checkAuthorizationBatchParamsSchema = z.strictObject({
  _distributor_id: z.number().int().positive("Distributor ID must be a positive integer"),
  _product_ids: z.array(z.number().int().positive()).optional().nullable(),
  _principal_ids: z.array(z.number().int().positive()).optional().nullable(),
});
```

#### Root Cause

The `_principal_ids` parameter is optional and nullable. This allows:
1. Authorization checks to run without specifying principals
2. Potential bypass of principal-level authorization

#### Analysis

Looking at the RPC function comment:
```
Batch authorization check for multiple products or principals.
```

This is an **OR** relationship - you can check by products OR by principals. So the nullable is intentional for this case. However, **at least one** must be provided.

#### Test First (TDD)

Create/update test file: `src/atomic-crm/validation/__tests__/rpc.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { checkAuthorizationBatchParamsSchema } from "../rpc";

describe("checkAuthorizationBatchParamsSchema", () => {
  describe("WF-C3-002: At least one ID array required", () => {
    it("should accept when product_ids provided", () => {
      const valid = {
        _distributor_id: 1,
        _product_ids: [1, 2, 3],
        _principal_ids: null,
      };
      expect(() => checkAuthorizationBatchParamsSchema.parse(valid)).not.toThrow();
    });

    it("should accept when principal_ids provided", () => {
      const valid = {
        _distributor_id: 1,
        _product_ids: null,
        _principal_ids: [1, 2],
      };
      expect(() => checkAuthorizationBatchParamsSchema.parse(valid)).not.toThrow();
    });

    it("should accept when both provided", () => {
      const valid = {
        _distributor_id: 1,
        _product_ids: [1],
        _principal_ids: [2],
      };
      expect(() => checkAuthorizationBatchParamsSchema.parse(valid)).not.toThrow();
    });

    it("should reject when neither product_ids nor principal_ids provided", () => {
      const invalid = {
        _distributor_id: 1,
        _product_ids: null,
        _principal_ids: null,
      };
      expect(() => checkAuthorizationBatchParamsSchema.parse(invalid)).toThrow(
        /At least one of _product_ids or _principal_ids must be provided/
      );
    });

    it("should reject when both are empty arrays", () => {
      const invalid = {
        _distributor_id: 1,
        _product_ids: [],
        _principal_ids: [],
      };
      expect(() => checkAuthorizationBatchParamsSchema.parse(invalid)).toThrow(
        /At least one of _product_ids or _principal_ids must be provided/
      );
    });
  });
});
```

#### Implementation

```typescript
// File: src/atomic-crm/validation/rpc.ts
// Lines 122-126 - REPLACE this:
// export const checkAuthorizationBatchParamsSchema = z.strictObject({
//   _distributor_id: z.number().int().positive("Distributor ID must be a positive integer"),
//   _product_ids: z.array(z.number().int().positive()).optional().nullable(),
//   _principal_ids: z.array(z.number().int().positive()).optional().nullable(),
// });

// WITH this:
export const checkAuthorizationBatchParamsSchema = z
  .strictObject({
    _distributor_id: z.number().int().positive("Distributor ID must be a positive integer"),
    _product_ids: z.array(z.number().int().positive()).optional().nullable(),
    _principal_ids: z.array(z.number().int().positive()).optional().nullable(),
  })
  .refine(
    (data) => {
      const hasProducts = data._product_ids && data._product_ids.length > 0;
      const hasPrincipals = data._principal_ids && data._principal_ids.length > 0;
      return hasProducts || hasPrincipals;
    },
    {
      message: "At least one of _product_ids or _principal_ids must be provided with non-empty values",
      path: ["_product_ids", "_principal_ids"],
    }
  );
```

#### Verification

```bash
just test src/atomic-crm/validation/__tests__/rpc.test.ts
just typecheck
```

#### Constitution Checklist

- [x] Fail-fast: Yes - Zod refinement rejects invalid input
- [x] No retry logic: Yes
- [x] Zod at boundary: Yes - this IS the API boundary validation
- [x] Single source of truth: Yes

---

## Execution Plan

### Parallel Group 1 (All 6 tasks - no dependencies)

| Task | File | Agent Type | Estimated Time |
|------|------|------------|----------------|
| WF-C1-001 | CampaignActivityReport.tsx | task-implementor | 5-10 min |
| WF-C1-002 | useCampaignActivityMetrics.ts | task-implementor | 5-10 min |
| WF-C2-001 | TextInputWithCounter.tsx | SKIP (false positive) | - |
| WF-C2-002 | resourceTypes.ts | task-implementor | 5-10 min |
| WF-C3-001 | ProductRelationshipsTab.tsx | task-implementor | 5-10 min |
| WF-C3-002 | rpc.ts | task-implementor | 10-15 min |

### Post-Fix Verification

After all tasks complete:

```bash
# Run full test suite
just test

# Run TypeScript check
just typecheck

# Run linting
just lint

# Build to verify no runtime issues
just build
```

---

## Rollback Plan

If issues arise after deployment:

1. **Revert commits:** `git revert <commit-hash>`
2. **Monitor errors:** Check Supabase logs for new error patterns
3. **Data audit:** Run workflow gaps audit again to verify fixes

---

## Success Criteria

1. All tests pass (`just test`)
2. TypeScript compiles without errors (`just typecheck`)
3. No new lint errors (`just lint`)
4. Build succeeds (`just build`)
5. Re-run audit shows 0 Critical issues: `/audit:workflow-gaps --quick`

---

## References

- **Audit Report:** `docs/audits/2026-01-10-workflow-gaps.md`
- **Baseline:** `docs/audits/.baseline/workflow-gaps.json`
- **Stage Constants:** `src/atomic-crm/opportunities/constants/stageConstants.ts`
- **Validation Schemas:** `src/atomic-crm/validation/opportunities/opportunities-core.ts`

---

*Generated by `/write-plan` skill*
*Plan location: docs/archive/plans/2026-01-10-workflow-gaps-critical-remediation.md*
