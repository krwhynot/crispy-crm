# Audit Remediation Plan: Critical Fixes

**Plan ID:** `audit-remediation-2026-01-11`
**Created:** 2026-01-11
**Status:** Ready for Execution
**Source:** `docs/audits/2026-01-11-full-audit.md`

---

## Executive Summary

| Attribute | Value |
|-----------|-------|
| **Type** | Bug Fix |
| **Scope** | Full Stack |
| **Priority Focus** | Stale State + Workflow Gaps (user-facing) |
| **Total Story Points** | 34 SP |
| **Estimated Duration** | 3-4 hours with parallel execution |
| **Risk Level** | Medium (validation changes need careful testing) |
| **Parallelization** | 6 parallel groups possible |

### Issues Addressed

| Category | Critical | Tasks |
|----------|----------|-------|
| Stale State | 2 | 2 (query key fixes) |
| Workflow Gaps | 2 | 2 (validation + notification) |
| Error Handling | 3 | 3 (logging improvements) |
| Code Quality | 3 | 3 (z.any + file splits) |
| TypeScript | 1 | 1 (test utility fix) |
| **Total** | **11** | **11 tasks** |

> **Note:** Data Integrity (4 critical - historical migrations) and DB Hardening (1 critical - FK behavior) are excluded as per plan scope. Historical migrations should NOT be modified. Consider creating new migrations if needed.

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PARALLEL GROUP 1 (Quick Wins)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Task 1   │  │ Task 2   │  │ Task 9   │  │ Task 11  │            │
│  │ SS-001   │  │ SS-002   │  │ TS-001   │  │ Test 1   │            │
│  │ Contact  │  │ Sales    │  │ Render   │  │ Products │            │
│  │ Keys     │  │ Keys     │  │ Admin    │  │ Split P1 │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PARALLEL GROUP 2 (Error Handling)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │ Task 5   │  │ Task 6   │  │ Task 7   │                          │
│  │ EH-001   │  │ EH-002   │  │ EH-003   │                          │
│  │ Record   │  │ Org      │  │ Storage  │                          │
│  │ Counts   │  │ Callback │  │ Cleanup  │                          │
│  └──────────┘  └──────────┘  └──────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PARALLEL GROUP 3 (Workflow)                      │
│  ┌──────────┐  ┌──────────┐                                         │
│  │ Task 3   │  │ Task 4   │                                         │
│  │ WG-001   │  │ WG-002   │                                         │
│  │ Stage    │  │ Activity │                                         │
│  │ Validate │  │ Notify   │                                         │
│  └──────────┘  └──────────┘                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SEQUENTIAL (Code Quality)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │ Task 8   │  │ Task 10  │  │ Task 12  │                          │
│  │ CQ-001   │──▶│ Test 2   │──▶│ Verify   │                          │
│  │ z.any()  │  │ Import   │  │ All      │                          │
│  └──────────┘  │ Split    │  └──────────┘                          │
│               └──────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Task Breakdown

---

### Task 1: Fix Hardcoded Query Keys in ContactDetailsTab [Confidence: 95%]

**Agent Hint:** `provider-agent` (query key factory pattern)
**File:** `src/atomic-crm/contacts/ContactDetailsTab.tsx`
**Lines:** 64-65
**Effort:** 2 SP
**Dependencies:** None

#### What to Implement

Replace hardcoded `["contacts"]` query key strings with the centralized `contactKeys` factory to ensure cache invalidation always works correctly.

#### Test First (TDD)

Create test file `src/atomic-crm/contacts/__tests__/ContactDetailsTab.invalidation.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { contactKeys } from "@/atomic-crm/queryKeys";
import { ContactDetailsTab } from "../ContactDetailsTab";

describe("ContactDetailsTab - Cache Invalidation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("should invalidate contactKeys.all after successful update", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const mockContact = {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: ["john@example.com"],
    };

    renderWithAdminContext(
      <ContactDetailsTab record={mockContact} mode="edit" />,
      { queryClient }
    );

    // Simulate form submission (implementation-specific)
    // After successful update:
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: contactKeys.all,
      });
    });
  });

  it("should use contactKeys.detail(id) for specific record invalidation", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const mockContact = { id: 42, first_name: "Jane" };

    // After successful update:
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: contactKeys.detail(42),
      });
    });
  });
});
```

#### Code Change

```typescript
// src/atomic-crm/contacts/ContactDetailsTab.tsx

// ADD this import at top of file (line ~1-22)
import { contactKeys } from "@/atomic-crm/queryKeys";

// REPLACE lines 64-65:
// OLD (hardcoded):
queryClient.invalidateQueries({ queryKey: ["contacts"] });
queryClient.invalidateQueries({ queryKey: ["contacts", "getOne", record.id] });

// NEW (factory pattern):
queryClient.invalidateQueries({ queryKey: contactKeys.all });
queryClient.invalidateQueries({ queryKey: contactKeys.detail(record.id) });
```

#### Verification

```bash
# Run specific test
npm run test -- src/atomic-crm/contacts/__tests__/ContactDetailsTab.invalidation.test.tsx

# Expected output:
# ✓ should invalidate contactKeys.all after successful update
# ✓ should use contactKeys.detail(id) for specific record invalidation
```

#### Constitution Checklist

- [x] Zod validation at API boundary only (N/A - no validation changes)
- [x] No retry logic or fallbacks
- [x] Semantic Tailwind colors only (N/A - no style changes)
- [x] Uses query key factory pattern ✅

---

### Task 2: Fix Hardcoded Query Keys in SalesEdit [Confidence: 95%]

**Agent Hint:** `provider-agent` (query key factory pattern)
**File:** `src/atomic-crm/sales/SalesEdit.tsx`
**Lines:** 54-55
**Effort:** 2 SP
**Dependencies:** None

#### What to Implement

Replace hardcoded `["sales"]` query key strings with the centralized `saleKeys` factory.

#### Test First (TDD)

Create test file `src/atomic-crm/sales/__tests__/SalesEdit.invalidation.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { saleKeys } from "@/atomic-crm/queryKeys";

describe("SalesEdit - Cache Invalidation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it("should use saleKeys.all for list invalidation", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    // Simulate successful mutation onSuccess callback
    queryClient.invalidateQueries({ queryKey: saleKeys.all });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: saleKeys.all,
    });
  });

  it("should use saleKeys.detail(id) for specific record", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const recordId = 123;

    queryClient.invalidateQueries({ queryKey: saleKeys.detail(recordId) });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: saleKeys.detail(123),
    });
  });
});
```

#### Code Change

```typescript
// src/atomic-crm/sales/SalesEdit.tsx

// ADD this import at top of file (after line 6)
import { saleKeys } from "@/atomic-crm/queryKeys";

// REPLACE lines 54-55 in onSuccess callback:
// OLD (hardcoded):
queryClient.invalidateQueries({ queryKey: ["sales"] });
queryClient.invalidateQueries({ queryKey: ["sales", "getOne", record?.id] });

// NEW (factory pattern):
queryClient.invalidateQueries({ queryKey: saleKeys.all });
queryClient.invalidateQueries({ queryKey: saleKeys.detail(record?.id ?? 0) });
```

#### Verification

```bash
npm run test -- src/atomic-crm/sales/__tests__/SalesEdit.invalidation.test.tsx
```

#### Constitution Checklist

- [x] Zod validation at API boundary only (N/A)
- [x] No retry logic or fallbacks
- [x] Uses query key factory pattern ✅

---

### Task 3: Fix Stage Close Validation Bypass [Confidence: 75%]

**Agent Hint:** `schema-agent` (Zod validation logic)
**File:** `src/atomic-crm/validation/opportunities/opportunities-operations.ts`
**Lines:** 244-296
**Effort:** 5 SP
**Dependencies:** None
**Risk:** Medium - requires careful testing of Kanban drag-drop scenarios

#### What to Implement

The current validation has a logic gap: stage-only updates to closed stages return `true` at line 278 BEFORE the win/loss reason refinements at lines 298-323 can run. Fix the order so closed stage validation is always enforced.

#### Test First (TDD)

Add tests to `src/atomic-crm/validation/__tests__/opportunities-operations.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { updateOpportunitySchema } from "../opportunities/opportunities-operations";

describe("updateOpportunitySchema - Stage Close Validation", () => {
  describe("WG-001: Stage close must require reasons", () => {
    it("should REJECT closed_won without win_reason (stage-only update)", () => {
      const stageOnlyUpdate = {
        id: 1,
        stage: "closed_won",
        // No win_reason provided
      };

      const result = updateOpportunitySchema.safeParse(stageOnlyUpdate);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes("win_reason"))).toBe(true);
      }
    });

    it("should REJECT closed_lost without loss_reason (stage-only update)", () => {
      const stageOnlyUpdate = {
        id: 1,
        stage: "closed_lost",
        // No loss_reason provided
      };

      const result = updateOpportunitySchema.safeParse(stageOnlyUpdate);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes("loss_reason"))).toBe(true);
      }
    });

    it("should ACCEPT closed_won WITH win_reason", () => {
      const validClose = {
        id: 1,
        stage: "closed_won",
        win_reason: "quality",
      };

      const result = updateOpportunitySchema.safeParse(validClose);
      expect(result.success).toBe(true);
    });

    it("should ACCEPT closed_lost WITH loss_reason", () => {
      const validClose = {
        id: 1,
        stage: "closed_lost",
        loss_reason: "price",
      };

      const result = updateOpportunitySchema.safeParse(validClose);
      expect(result.success).toBe(true);
    });

    it("should ACCEPT non-closed stage drag-drop (no reason required)", () => {
      const stageOnlyUpdate = {
        id: 1,
        stage: "demo_scheduled",
      };

      const result = updateOpportunitySchema.safeParse(stageOnlyUpdate);
      expect(result.success).toBe(true);
    });
  });
});
```

#### Code Change

```typescript
// src/atomic-crm/validation/opportunities/opportunities-operations.ts
// Lines 244-296 - Modify the first refinement

.refine(
  (data) => {
    // Only validate contact_ids if it's actually being updated
    if (data.contact_ids === undefined) {
      return true;
    }

    // Detect stage-only updates
    const CLOSED_STAGES = ["closed_won", "closed_lost"];
    const stageOnlyFields = new Set([
      "id",
      "stage",
      "win_reason",
      "loss_reason",
      "close_reason_notes",
      "contact_ids",
    ]);
    const providedFields = Object.keys(data).filter(
      (key) => data[key as keyof typeof data] !== undefined
    );
    const isStageOnlyUpdate = providedFields.every((field) => stageOnlyFields.has(field));

    // For stage-only updates to NON-closed stages, skip contact validation
    if (isStageOnlyUpdate && data.stage && !CLOSED_STAGES.includes(data.stage)) {
      return true;
    }

    // WG-001 FIX: For closed stage updates, DO NOT return true here!
    // Let the refinement continue to contact validation, then fall through
    // to win/loss refinements below which will enforce reason requirements.
    // REMOVED: The early return at line 278 that bypassed validation

    // Skip validation for full form submissions (5+ fields heuristic)
    if (providedFields.length >= 5) {
      return true;
    }

    // If user is specifically editing contacts, enforce minimum
    return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
  },
  {
    message: "At least one contact is required",
    path: ["contact_ids"],
  }
)
```

**Key Change:** Remove lines 277-279 (the early return for closed stage updates). The win/loss reason refinements at lines 298-323 will now correctly validate closed stages.

#### Verification

```bash
npm run test -- src/atomic-crm/validation/__tests__/opportunities-operations.test.ts

# Expected: All "Stage Close Validation" tests pass
```

#### Constitution Checklist

- [x] Zod validation at API boundary only ✅ (this IS the API boundary)
- [x] No retry logic or fallbacks
- [x] Fail-fast on validation errors ✅

---

### Task 4: Add User Notification for Activity Log Failure [Confidence: 85%]

**Agent Hint:** `component-agent` (React notification handling)
**File:** `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx`
**Lines:** 179-195
**Effort:** 3 SP
**Dependencies:** None

#### What to Implement

Currently, activity logging failures are silently caught with only `console.error`. Add a user notification so users know the audit trail was not created.

#### Test First (TDD)

Add test to `src/atomic-crm/opportunities/kanban/__tests__/OpportunityListContent.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";

describe("OpportunityListContent - Activity Logging", () => {
  it("should notify user when activity creation fails", async () => {
    const mockNotify = vi.fn();
    const mockDataProvider = {
      create: vi.fn().mockRejectedValue(new Error("Activity creation failed")),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    };

    // Setup: Render with mocked providers
    // Action: Trigger stage change drag-drop
    // Assert: notify was called with warning type

    expect(mockNotify).toHaveBeenCalledWith(
      expect.stringContaining("activity"),
      expect.objectContaining({ type: "warning" })
    );
  });
});
```

#### Code Change

```typescript
// src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx
// Lines 179-195 - Modify the catch block

try {
  await dataProvider.create("activities", {
    data: {
      activity_type: "engagement",
      type: "note",
      subject: `Stage changed from ${getOpportunityStageLabel(oldStage)} to ${getOpportunityStageLabel(newStage)}`,
      activity_date: new Date().toISOString(),
      opportunity_id: opportunityId,
      organization_id: draggedItem.customer_organization_id,
    },
  });

  queryClient.invalidateQueries({ queryKey: activityKeys.all });
  queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
} catch (error: unknown) {
  // WG-002 FIX: Notify user that activity log failed (audit trail incomplete)
  console.error("Failed to create stage change activity:", error);
  notify(
    "Stage updated but activity log failed. The change is saved but may not appear in the activity timeline.",
    { type: "warning" }
  );
}
```

#### Verification

```bash
npm run test -- src/atomic-crm/opportunities/kanban/__tests__/OpportunityListContent.test.tsx
```

#### Constitution Checklist

- [x] Zod validation at API boundary only (N/A)
- [x] No retry logic or fallbacks ✅ (we notify but don't retry)
- [x] User feedback on error ✅

---

### Task 5: Add Structured Logging to useRelatedRecordCounts [Confidence: 85%]

**Agent Hint:** `provider-agent` (error handling pattern)
**File:** `src/atomic-crm/hooks/useRelatedRecordCounts.ts`
**Lines:** 127-134
**Effort:** 3 SP
**Dependencies:** None

#### What to Implement

Replace silent `console.debug` with structured error logging that distinguishes permission errors from other failures, enabling better debugging.

#### Code Change

```typescript
// src/atomic-crm/hooks/useRelatedRecordCounts.ts
// Lines 127-134 - Replace the catch block

} catch (error: unknown) {
  // EH-001 FIX: Structured logging with error categorization
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError = errorMessage.toLowerCase().includes("permission") ||
                            errorMessage.includes("403") ||
                            errorMessage.includes("RLS");

  if (isPermissionError) {
    // Expected case: user doesn't have access to this resource type
    console.debug(
      `[useRelatedRecordCounts] Permission denied for ${rel.resource}:`,
      errorMessage
    );
  } else {
    // Unexpected error: log as warning for visibility
    console.warn(
      `[useRelatedRecordCounts] Failed to fetch count for ${rel.resource}:`,
      { error: errorMessage, resourceId: id, relationship: rel }
    );
  }

  return { label: rel.label, count: 0 };
}
```

#### Verification

```bash
# Manual verification: Check browser console during delete confirmation
# - Permission errors should appear as debug (verbose level)
# - Other errors should appear as warnings (visible by default)
```

#### Constitution Checklist

- [x] Zod validation at API boundary only (N/A)
- [x] No retry logic or fallbacks ✅
- [x] Fail-fast: errors logged, not swallowed silently ✅

---

### Task 6: Add Structured Logging to organizationsCallbacks [Confidence: 85%]

**Agent Hint:** `provider-agent` (callback error handling)
**File:** `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts`
**Lines:** 130-136
**Effort:** 3 SP
**Dependencies:** None

#### What to Implement

Improve the catch block to include more context and use consistent logging format.

#### Code Change

```typescript
// src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts
// Lines 129-137 - Improve the catch block

if (filePaths.length > 0) {
  void deleteStorageFiles(filePaths).catch((err: unknown) => {
    // EH-002 FIX: Structured logging with context for debugging
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn(
      `[organizationsBeforeDelete] Storage cleanup failed`,
      {
        organizationId: params.id,
        fileCount: filePaths.length,
        files: filePaths.slice(0, 5), // First 5 for debugging, avoid huge logs
        error: errorMessage,
        note: "Archive succeeded - orphaned files can be cleaned up later"
      }
    );
  });
}
```

#### Constitution Checklist

- [x] No retry logic ✅ (intentional fire-and-forget)
- [x] Error logged with context ✅

---

### Task 7: Add Structured Logging to storageCleanup [Confidence: 85%]

**Agent Hint:** `provider-agent` (utility error handling)
**File:** `src/atomic-crm/providers/supabase/utils/storageCleanup.ts`
**Lines:** 101-112
**Effort:** 3 SP
**Dependencies:** None

#### What to Implement

Improve error logging in the storage cleanup utility to include file paths and operation context.

#### Code Change

```typescript
// src/atomic-crm/providers/supabase/utils/storageCleanup.ts
// Lines 101-112 - Improve error handling

try {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

  if (error) {
    // EH-003 FIX: Structured error with context
    console.warn(
      `[StorageCleanup] Delete operation failed`,
      {
        bucket: STORAGE_BUCKET,
        fileCount: paths.length,
        paths: paths.slice(0, 5), // First 5 for debugging
        error: error.message,
        errorCode: error.name,
      }
    );
  } else {
    devLog("StorageCleanup", `Deleted ${paths.length} files from storage`);
  }
} catch (error: unknown) {
  // EH-003 FIX: Catch unexpected errors with full context
  console.warn(
    `[StorageCleanup] Unexpected error during cleanup`,
    {
      bucket: STORAGE_BUCKET,
      fileCount: paths.length,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
  );
}
```

#### Constitution Checklist

- [x] No retry logic ✅
- [x] Error logged with context ✅

---

### Task 8: Replace z.any() with Typed Schema in products.ts [Confidence: 70%]

**Agent Hint:** `schema-agent` (Zod schema design)
**File:** `src/atomic-crm/validation/products.ts`
**Lines:** 70, 175, 214
**Effort:** 5 SP
**Dependencies:** None
**Risk:** Medium - need to verify nutritional_info data structure in database

#### What to Implement

Replace `z.record(z.string(), z.any())` with a properly typed schema for nutritional information.

#### Test First (TDD)

Add test to `src/atomic-crm/validation/__tests__/products.test.ts`:

```typescript
describe("CQ-001: nutritional_info schema", () => {
  it("should accept valid nutritional info record", () => {
    const validProduct = {
      name: "Test Product",
      organization_id: 1,
      nutritional_info: {
        "calories": "200",
        "protein_g": "15",
        "carbs_g": "25",
        "fat_g": "8",
        "serving_size": "100g",
      },
    };

    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("should reject non-string values in nutritional_info", () => {
    const invalidProduct = {
      name: "Test Product",
      organization_id: 1,
      nutritional_info: {
        "calories": 200, // number instead of string - should fail
      },
    };

    const result = createProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it("should accept null/undefined nutritional_info", () => {
    const productNoNutrition = {
      name: "Test Product",
      organization_id: 1,
      nutritional_info: null,
    };

    const result = createProductSchema.safeParse(productNoNutrition);
    expect(result.success).toBe(true);
  });
});
```

#### Code Change

```typescript
// src/atomic-crm/validation/products.ts

// REPLACE (3 occurrences at lines 70, 175, 214):
// OLD:
nutritional_info: z.record(z.string(), z.any()).nullish(),

// NEW - Type-safe schema for nutritional information:
nutritional_info: z
  .record(
    z.string().max(50), // Key names (e.g., "calories", "protein_g")
    z.string().max(100)  // Values as strings (can be "200", "15g", "N/A")
  )
  .nullish(),
```

**Note:** If numeric values are needed, consider:
```typescript
// Alternative: Allow string or number values
nutritional_info: z
  .record(
    z.string().max(50),
    z.union([z.string().max(100), z.number()])
  )
  .nullish(),
```

#### Verification

```bash
npm run test -- src/atomic-crm/validation/__tests__/products.test.ts --grep "nutritional_info"
```

#### Constitution Checklist

- [x] Zod validation at API boundary only ✅
- [x] Uses z.string().max() for string limits ✅
- [x] No z.any() - replaced with typed schema ✅

---

### Task 9: Fix Implicit any in render-admin.tsx [Confidence: 90%]

**Agent Hint:** `test-agent` (test utility type safety)
**File:** `src/tests/utils/render-admin.tsx`
**Line:** 53
**Effort:** 2 SP
**Dependencies:** None

#### What to Implement

Replace the implicit `any` type in the RenderAdminOptions interface with `Record<string, unknown>`.

#### Code Change

```typescript
// src/tests/utils/render-admin.tsx
// Find the interface definition around line 53

// OLD:
interface RenderAdminOptions {
  // ...
  record?: any;
  // ...
}

// NEW:
interface RenderAdminOptions {
  // ...
  record?: Record<string, unknown>;
  // ...
}
```

#### Verification

```bash
npm run typecheck
# Should pass without errors related to render-admin.tsx
```

#### Constitution Checklist

- [x] TypeScript: No implicit any ✅
- [x] Uses Record<string, unknown> instead of any ✅

---

### Task 10: Split products.test.ts (Part 1) [Confidence: 80%]

**Agent Hint:** `test-agent` (test organization)
**File:** `src/atomic-crm/validation/__tests__/products.test.ts` (835 lines)
**Effort:** 5 SP
**Dependencies:** Task 8 (schema changes)

#### What to Implement

Split the large test file into focused test files:
1. `products-base.test.ts` - Base schema validation
2. `products-create.test.ts` - Create schema tests
3. `products-update.test.ts` - Update schema tests
4. `products-edge-cases.test.ts` - Edge cases and skipped tests

#### File Structure

```
src/atomic-crm/validation/__tests__/
├── products-base.test.ts       (~200 lines)
├── products-create.test.ts     (~250 lines)
├── products-update.test.ts     (~200 lines)
└── products-edge-cases.test.ts (~200 lines - includes TODO/skipped tests)
```

#### Verification

```bash
# Run all product tests
npm run test -- src/atomic-crm/validation/__tests__/products

# All tests should still pass after split
```

---

### Task 11: Split useImportWizard.test.ts [Confidence: 80%]

**Agent Hint:** `test-agent` (test organization)
**File:** `src/atomic-crm/contacts/__tests__/useImportWizard.test.ts` (814 lines)
**Effort:** 5 SP
**Dependencies:** None

#### What to Implement

Split into focused test files:
1. `useImportWizard-parsing.test.ts` - CSV parsing tests
2. `useImportWizard-preview.test.ts` - Preview state tests
3. `useImportWizard-processing.test.ts` - Import processing tests
4. `useImportWizard-errors.test.ts` - Error handling tests

---

### Task 12: Final Verification [Confidence: 95%]

**Agent Hint:** `test-agent` (verification)
**Effort:** 2 SP
**Dependencies:** All other tasks

#### What to Implement

Run full test suite and type checking to verify all fixes.

#### Verification Commands

```bash
# Type checking
npm run typecheck

# Full test suite
npm run test

# Specific audit-related tests
npm run test -- --grep "invalidat|activity|nutritional"

# Build verification
npm run build
```

#### Expected Results

- All tests pass
- No TypeScript errors
- Build succeeds
- No new warnings

---

## Execution Order

### Phase 1: Parallel Group (Tasks 1, 2, 9, 11) - ~30 min
- Query key fixes (independent)
- TypeScript fix (independent)
- Test file split 1 (independent)

### Phase 2: Parallel Group (Tasks 5, 6, 7) - ~20 min
- Error handling improvements (independent)

### Phase 3: Parallel Group (Tasks 3, 4) - ~30 min
- Workflow validation fixes (can run in parallel)

### Phase 4: Sequential (Tasks 8, 10, 12) - ~40 min
- Schema changes, then dependent test split, then verification

**Total Estimated Time:** 2-2.5 hours with parallel execution

---

## Rollback Plan

If issues arise after deployment:

1. **Query Key Fixes (Tasks 1, 2):** Revert to hardcoded strings - low risk
2. **Validation Fix (Task 3):** Revert to previous refinement order - test closed stage flows
3. **Error Logging (Tasks 5, 6, 7):** Safe to revert - only logging changes
4. **Schema Changes (Task 8):** May need database migration if data format changes

---

## Post-Implementation

After all tasks complete:

1. Re-run `/audit:full --quick` to verify critical count reduction
2. Update baseline: `docs/audits/.baseline/full-audit.json`
3. Commit with message: `fix(audit): resolve 11 critical issues from 2026-01-11 audit`

---

*Plan created by `/write-plan` skill*
*Source: docs/audits/2026-01-11-full-audit.md*
