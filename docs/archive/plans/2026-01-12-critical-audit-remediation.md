# Critical Audit Issues Remediation Plan

**Date:** 2026-01-12
**Author:** Claude Code
**Status:** Ready for Execution
**Scope:** Critical + Top High Priority Issues (10 total)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 10 |
| **Parallel Groups** | 3 |
| **Estimated Effort** | 8 story points |
| **Risk Level** | Medium |
| **Complexity** | Moderate |

**Issues Addressed:**
- 4 Critical: TypeScript type safety (z.any, as unknown), DRY violation
- 6 High: Stale state cache invalidation

---

## Plan Summary

**Type:** Refactoring
**Scope:** Cross-feature (validation, providers, components)
**Areas:** Opportunities validation, Tasks, Products, Activities, Utils
**Granularity:** Standard (5-15 min tasks)
**Execution:** Parallel groups
**Database:** No DB changes
**Testing:** TDD strict

---

## Dependency Analysis

```
Group 1 (Independent - Run in Parallel):
├── Task 1: TS-001 z.any() in Zod schemas
├── Task 2: CQ-001 formatFullName consolidation
├── Task 3: EH-001 useNotifyWithRetry JSDoc
└── Task 4: SS-001 TaskSlideOverDetailsTab cache

Group 2 (Independent - Run in Parallel):
├── Task 5: SS-002 TaskList CompletionCheckbox cache
├── Task 6: SS-003 TaskActionMenu cache
├── Task 7: SS-004 ProductDetailsTab cache
└── Task 8: SS-005 ActivityDetailsTab cache

Group 3 (Sequential - After Group 1):
├── Task 9: TS-002 segmentsHandler type guards (depends on Task 1 patterns)
└── Task 10: Update imports after formatFullName consolidation (depends on Task 2)
```

---

## Task Breakdown

### Task 1: Replace z.any() with Proper JSONB Schema

**Agent Hint:** `task-implementor` (Zod schema modification)
**Files:**
- `src/atomic-crm/validation/opportunities/opportunities-core.ts:210`
- `src/atomic-crm/validation/opportunities/opportunities-operations.ts:146`
**Effort:** 2 story points
**Dependencies:** None

#### What to Implement

Replace `z.any()` for the `products` field with a proper JSONB array schema that matches the actual data structure from the opportunities view.

#### TDD Test (Write First)

```typescript
// File: src/atomic-crm/validation/opportunities/__tests__/products-schema.test.ts

import { describe, it, expect } from "vitest";
import { opportunityProductSchema } from "../opportunities-core";

describe("opportunityProductSchema", () => {
  it("validates valid product array from JSONB", () => {
    const validProducts = [
      { id: 1, name: "Widget A", quantity: 10 },
      { id: 2, name: "Widget B", quantity: 5 },
    ];

    const result = opportunityProductSchema.safeParse(validProducts);
    expect(result.success).toBe(true);
  });

  it("accepts null for no products", () => {
    const result = opportunityProductSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("accepts empty array", () => {
    const result = opportunityProductSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("rejects invalid product structure", () => {
    const invalidProducts = [{ invalid: "structure" }];
    const result = opportunityProductSchema.safeParse(invalidProducts);
    expect(result.success).toBe(false);
  });
});
```

#### Code Example

```typescript
// In opportunities-core.ts

// Define the product item schema for JSONB array
const opportunityProductItemSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  quantity: z.number().optional(),
  // Add other fields based on actual JSONB structure
}).passthrough(); // Allow additional fields from JSONB

// Export for testing
export const opportunityProductSchema = z
  .array(opportunityProductItemSchema)
  .optional()
  .nullable();

// Replace z.any() with:
products: opportunityProductSchema, // ✅ Type-safe JSONB array
```

#### Verification

- [ ] `npm test -- --grep "products-schema"`
- [ ] `npx tsc --noEmit`
- [ ] No `z.any()` in validation files: `rg "z\.any\(\)" src/atomic-crm/validation`

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Uses z.strictObject pattern where appropriate
- [x] Includes .max() limits on strings (N/A - numeric fields)

---

### Task 2: Consolidate formatFullName Implementations

**Agent Hint:** `task-implementor` (DRY refactoring)
**Files:**
- `src/atomic-crm/utils/formatters.ts` (PRIMARY - keep this)
- `src/atomic-crm/utils/formatName.ts` (rename function)
- `src/atomic-crm/utils/index.ts` (fix exports)
- `src/atomic-crm/contacts/formatters.ts` (update import)
**Effort:** 2 story points
**Dependencies:** None

#### What to Implement

The codebase has 3 `formatFullName` implementations with different signatures:
1. `formatters.ts`: `formatFullName(firstName, lastName)` - KEEP THIS
2. `formatName.ts`: `formatFullName(name)` - RENAME to `formatSingleName`
3. `contacts/formatters.ts`: re-export - UPDATE

#### TDD Test (Write First)

```typescript
// File: src/atomic-crm/utils/__tests__/formatName.test.ts

import { describe, it, expect } from "vitest";
import { formatSingleName } from "../formatName";

describe("formatSingleName (renamed from formatFullName)", () => {
  it("trims and returns single name", () => {
    expect(formatSingleName("  John  ")).toBe("John");
  });

  it("returns placeholder for null/undefined", () => {
    expect(formatSingleName(null)).toBe("--");
    expect(formatSingleName(undefined)).toBe("--");
  });

  it("returns placeholder for empty/whitespace", () => {
    expect(formatSingleName("")).toBe("--");
    expect(formatSingleName("   ")).toBe("--");
  });
});
```

#### Code Example

```typescript
// File: src/atomic-crm/utils/formatName.ts

import { EMPTY_PLACEHOLDER } from "./constants";

/**
 * Formats a single name field (trims whitespace).
 *
 * @deprecated Prefer formatFullName(firstName, lastName) for contact names.
 * Use this only for single-field name formatting.
 */
export function formatSingleName(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed || EMPTY_PLACEHOLDER;
}

// Keep formatName as-is (different function)
export function formatName(record: { first_name?: string | null; last_name?: string | null }): string {
  // ... existing implementation
}
```

```typescript
// File: src/atomic-crm/utils/index.ts

// Remove duplicate export, keep only one formatFullName
export { formatName, formatSingleName } from "./formatName";
export {
  formatFullName, // ✅ Single source - firstName + lastName signature
  formatSalesRep,
  formatCurrency,
  formatDate,
  EMPTY_PLACEHOLDER,
} from "./formatters";
```

#### Verification

- [ ] `npm test -- --grep "formatFullName\|formatSingleName"`
- [ ] `npx tsc --noEmit`
- [ ] Single export: `rg "export.*formatFullName" src/atomic-crm/utils`

#### Constitution Checklist

- [x] Single Source of Truth - one formatFullName
- [x] No magic defaults
- [x] Clear JSDoc documentation

---

### Task 3: Add JSDoc to useNotifyWithRetry

**Agent Hint:** `task-implementor` (documentation)
**File:** `src/atomic-crm/hooks/useNotifyWithRetry.tsx:31`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Add JSDoc clarifying that the retry mechanism is USER-INITIATED (button click), not automatic retry, which complies with fail-fast principle.

#### Code Example

```typescript
/**
 * Hook that provides notification with optional user-initiated retry.
 *
 * **Fail-Fast Compliance:** This hook does NOT implement automatic retry.
 * The retry button allows users to manually retry failed operations after
 * reviewing the error. This is an intentional UX pattern that:
 *
 * 1. Shows errors immediately (fail-fast)
 * 2. Gives users control over retry timing
 * 3. Prevents infinite retry loops
 *
 * @example
 * ```tsx
 * const { notifyWithRetry } = useNotifyWithRetry();
 *
 * try {
 *   await saveData();
 * } catch (error) {
 *   notifyWithRetry("Save failed", {
 *     onRetry: () => saveData(),
 *     type: "error"
 *   });
 * }
 * ```
 *
 * @returns Object with notifyWithRetry function
 */
export function useNotifyWithRetry() {
  // ... existing implementation
}
```

#### Verification

- [ ] JSDoc renders in IDE hover
- [ ] `npx tsc --noEmit`

#### Constitution Checklist

- [x] Documents fail-fast compliance
- [x] Clarifies user-initiated vs automatic retry

---

### Task 4: Add Cache Invalidation to TaskSlideOverDetailsTab

**Agent Hint:** `task-implementor` (cache pattern)
**File:** `src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx:55-68`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Add `queryClient.invalidateQueries` after successful task updates to ensure list views reflect changes.

#### TDD Test (Write First)

```typescript
// Add to existing TaskSlideOver.test.tsx or create new test

it("invalidates task cache after successful save", async () => {
  const mockInvalidateQueries = vi.fn();
  vi.mock("@tanstack/react-query", () => ({
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  }));

  // ... render and trigger save

  await waitFor(() => {
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tasks"],
    });
  });
});
```

#### Code Example

```typescript
// File: src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx

import { useQueryClient } from "@tanstack/react-query";

export function TaskSlideOverDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: TaskSlideOverDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient(); // ✅ Add this
  const { taskTypes } = useFormOptions();

  const handleSave = async (data: Partial<Task>) => {
    try {
      await update("tasks", {
        id: record.id,
        data,
        previousData: record,
      });

      // ✅ Invalidate cache after successful update
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      notify("Task updated successfully", { type: "success" });
      onModeToggle?.();
    } catch (error: unknown) {
      notify("Error updating task", { type: "error" });
      console.error("Error updating task:", error instanceof Error ? error.message : String(error));
    }
  };

  const handleCompletionToggle = async (checked: boolean) => {
    try {
      await update("tasks", {
        id: record.id,
        data: {
          completed: checked,
          completed_at: checked ? new Date().toISOString() : null,
        },
        previousData: record,
      });

      // ✅ Invalidate cache after completion toggle
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      notify(checked ? "Task marked complete" : "Task marked incomplete", { type: "success" });
    } catch (error: unknown) {
      notify("Error updating task", { type: "error" });
      console.error("Completion toggle error:", error);
    }
  };
  // ... rest of component
}
```

#### Verification

- [ ] `npm test -- --grep "TaskSlideOver"`
- [ ] Manual: Edit task in SlideOver, verify list updates without refresh

#### Constitution Checklist

- [x] No automatic retry on failure
- [x] Fail-fast: errors shown immediately
- [x] Cache invalidation is targeted (not useRefresh)

---

### Task 5: Add Cache Invalidation to TaskList CompletionCheckbox

**Agent Hint:** `task-implementor` (cache pattern)
**File:** `src/atomic-crm/tasks/TaskList.tsx:275-290`
**Effort:** 1 story point
**Dependencies:** None

#### Code Example

```typescript
// In TaskList.tsx, CompletionCheckbox component

const CompletionCheckbox = React.memo(function CompletionCheckbox({ task }: { task: Task }) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient(); // ✅ Add this

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    try {
      await update("tasks", {
        id: task.id,
        data: {
          completed: checked,
          completed_at: checked ? new Date().toISOString() : null,
        },
        previousData: task,
      });

      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      notify(checked ? "Task completed" : "Task reopened", { type: "success" });
    } catch {
      notify("Failed to update task", { type: "error" });
    }
  };
  // ...
});
```

#### Verification

- [ ] `npm test -- --grep "TaskList"`
- [ ] Manual: Check/uncheck task, verify count updates

#### Constitution Checklist

- [x] Targeted invalidation (not full refresh)
- [x] No retry logic

---

### Task 6: Add Cache Invalidation to TaskActionMenu

**Agent Hint:** `task-implementor` (cache pattern)
**File:** `src/atomic-crm/tasks/components/TaskActionMenu.tsx:60-80`
**Effort:** 1 story point
**Dependencies:** None

#### Code Example

```typescript
// In TaskActionMenu.tsx

const queryClient = useQueryClient(); // ✅ Add this

const handlePostpone = async (days: number) => {
  try {
    await update("tasks", {
      id: taskId,
      data: { due_date: addDays(new Date(), days).toISOString() },
      previousData: task,
    });

    // ✅ Invalidate cache
    queryClient.invalidateQueries({ queryKey: ["tasks"] });

    notify(`Task postponed ${days} day(s)`, { type: "success" });
  } catch {
    notify("Failed to postpone task", { type: "error" });
  }
};

const handleDelete = async () => {
  try {
    await deleteOne("tasks", { id: taskId, previousData: task });

    // ✅ Invalidate cache
    queryClient.invalidateQueries({ queryKey: ["tasks"] });

    notify("Task deleted", { type: "success" });
  } catch {
    notify("Failed to delete task", { type: "error" });
  }
};
```

#### Verification

- [ ] `npm test -- --grep "TaskActionMenu"`
- [ ] Manual: Postpone/delete task, verify list updates

#### Constitution Checklist

- [x] Targeted invalidation
- [x] No retry logic

---

### Task 7: Add Cache Invalidation to ProductDetailsTab

**Agent Hint:** `task-implementor` (cache pattern)
**File:** `src/atomic-crm/products/ProductDetailsTab.tsx:108-130`
**Effort:** 1 story point
**Dependencies:** None

#### Code Example

```typescript
// In ProductDetailsTab.tsx

import { useQueryClient } from "@tanstack/react-query";

export function ProductDetailsTab({ record, mode, onModeToggle, onDirtyChange }: ProductDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient(); // ✅ Add this

  const handleSave = async (formData: Partial<Product>) => {
    try {
      const allFormValues = getValuesRef.current?.() ?? formData;
      await update("products", {
        id: record.id,
        data: allFormValues,
        previousData: record,
      });

      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["products"] });

      notify("Product updated successfully", { type: "success" });
      onModeToggle?.();
    } catch (error: unknown) {
      notify("Error updating product", { type: "error" });
      console.error("Error updating product:", error);
    }
  };
  // ...
}
```

#### Verification

- [ ] `npm test -- --grep "ProductDetailsTab"`
- [ ] Manual: Edit product, verify list updates

#### Constitution Checklist

- [x] Targeted invalidation
- [x] No retry logic

---

### Task 8: Add Cache Invalidation to ActivityDetailsTab

**Agent Hint:** `task-implementor` (cache pattern)
**File:** `src/atomic-crm/activities/slideOverTabs/ActivityDetailsTab.tsx:62-75`
**Effort:** 1 story point
**Dependencies:** None

#### Code Example

```typescript
// In ActivityDetailsTab.tsx

import { useQueryClient } from "@tanstack/react-query";

export function ActivityDetailsTab({ record, mode, onModeToggle, onDirtyChange }: ActivityDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient(); // ✅ Add this

  const handleSave = async (data: Partial<ActivityRecord>) => {
    try {
      await update("activities", {
        id: record.id,
        data,
        previousData: record,
      });

      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["activities"] });

      notify("Activity updated successfully", { type: "success" });
      onModeToggle?.();
    } catch (error: unknown) {
      notify("Error updating activity", { type: "error" });
      console.error("Error updating activity:", error);
    }
  };
  // ...
}
```

#### Verification

- [ ] `npm test -- --grep "ActivityDetailsTab"`
- [ ] Manual: Edit activity, verify list updates

#### Constitution Checklist

- [x] Targeted invalidation
- [x] No retry logic

---

### Task 9: Replace as unknown Casts in segmentsHandler

**Agent Hint:** `task-implementor` (TypeScript refactoring)
**File:** `src/atomic-crm/providers/supabase/handlers/segmentsHandler.ts`
**Lines:** 91, 117, 137, 162
**Effort:** 2 story points
**Dependencies:** Task 1 (patterns established)

#### What to Implement

Replace `as unknown as RecordType` double-casts with proper type guards or generic constraints.

#### TDD Test (Write First)

```typescript
// File: src/atomic-crm/providers/supabase/handlers/__tests__/segmentsHandler.test.ts

import { describe, it, expect } from "vitest";
import { isSegmentRecord } from "../segmentsHandler";

describe("isSegmentRecord type guard", () => {
  it("returns true for valid segment", () => {
    const segment = { id: 1, name: "Test", filter: {} };
    expect(isSegmentRecord(segment)).toBe(true);
  });

  it("returns false for invalid structure", () => {
    expect(isSegmentRecord(null)).toBe(false);
    expect(isSegmentRecord({ invalid: true })).toBe(false);
  });
});
```

#### Code Example

```typescript
// File: segmentsHandler.ts

// Add type guard
export function isSegmentRecord(value: unknown): value is Segment {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}

// Replace double-cast with type guard
async getOne<RecordType extends RaRecord = Segment>(
  resource: string,
  params: GetOneParams
): Promise<GetOneResult<RecordType>> {
  const { data, error } = await supabase
    .from("segments")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) throw new HttpError(error.message, 500);

  // ✅ Use type guard instead of double-cast
  if (!isSegmentRecord(data)) {
    throw new HttpError("Invalid segment data", 500);
  }

  return { data: data as RecordType };
}
```

#### Verification

- [ ] `npm test -- --grep "segmentsHandler"`
- [ ] `npx tsc --noEmit`
- [ ] No `as unknown as` in handler: `rg "as unknown as" src/atomic-crm/providers/supabase/handlers/segmentsHandler.ts`

#### Constitution Checklist

- [x] Fail-fast: throws on invalid data
- [x] Type-safe without double-casts
- [x] Explicit error handling

---

### Task 10: Update Imports After formatFullName Consolidation

**Agent Hint:** `task-implementor` (import cleanup)
**Files:** All files importing formatFullName
**Effort:** 1 story point
**Dependencies:** Task 2

#### What to Implement

After Task 2 consolidates formatFullName, update any broken imports across the codebase.

#### Verification Steps

```bash
# Find all imports
rg "import.*formatFullName" src/

# Verify no TypeScript errors
npx tsc --noEmit

# Run affected tests
npm test -- --grep "formatFullName"
```

#### Code Changes

Update imports in:
- `src/atomic-crm/contacts/ContactList.tsx` - Should import from `@/atomic-crm/utils`
- `src/atomic-crm/contacts/formatters.ts` - Remove re-export, import directly

#### Constitution Checklist

- [x] Single import source
- [x] No circular dependencies

---

## Execution Plan

### Group 1 (Parallel) - ~15 minutes

| Task | Agent | Est. Time |
|------|-------|-----------|
| Task 1: z.any() schema | task-implementor | 5-8 min |
| Task 2: formatFullName DRY | task-implementor | 5-8 min |
| Task 3: JSDoc | task-implementor | 2-3 min |
| Task 4: Task cache | task-implementor | 3-5 min |

### Group 2 (Parallel) - ~12 minutes

| Task | Agent | Est. Time |
|------|-------|-----------|
| Task 5: TaskList cache | task-implementor | 3-5 min |
| Task 6: TaskActionMenu cache | task-implementor | 3-5 min |
| Task 7: Product cache | task-implementor | 3-5 min |
| Task 8: Activity cache | task-implementor | 3-5 min |

### Group 3 (Sequential) - ~10 minutes

| Task | Agent | Est. Time | Depends On |
|------|-------|-----------|------------|
| Task 9: segmentsHandler | task-implementor | 5-8 min | Task 1 |
| Task 10: Import cleanup | task-implementor | 2-3 min | Task 2 |

**Total Estimated Time:** ~35-40 minutes with parallel execution

---

## Success Criteria

### Must Pass

- [ ] `npm run build` - No build errors
- [ ] `npx tsc --noEmit` - No TypeScript errors
- [ ] `npm test` - All tests pass
- [ ] No `z.any()` in validation schemas
- [ ] No duplicate `formatFullName` exports
- [ ] All cache invalidations in place

### Audit Verification

After completion, run targeted audits:

```bash
# TypeScript audit
rg "z\.any\(\)" src/atomic-crm/validation
rg "as unknown as" src/atomic-crm/providers --type ts

# Code quality
rg "export.*formatFullName" src/

# Stale state - verify invalidateQueries present
rg "invalidateQueries" src/atomic-crm/tasks
rg "invalidateQueries" src/atomic-crm/products
rg "invalidateQueries" src/atomic-crm/activities
```

---

## Rollback Plan

If issues arise:

1. **Checkpoint:** Create before execution with `~/.claude/checkpoint-manager.sh force`
2. **Rollback command:** `git reset --hard <checkpoint-hash>`
3. **Partial rollback:** Revert specific files with `git checkout <hash> -- <file>`

---

## Post-Execution

After successful completion:

1. Update audit baseline: Run `/audit:full` to capture new state
2. Verify issue counts decreased
3. Document any new issues discovered during remediation

---

*Generated by `/write-plan` command*
*Plan location: docs/archive/plans/2026-01-12-critical-audit-remediation.md*
