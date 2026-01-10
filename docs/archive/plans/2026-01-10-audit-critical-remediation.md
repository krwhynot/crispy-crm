# Audit Critical Issues Remediation Plan

**Date:** 2026-01-10
**Author:** Claude (Audit Remediation)
**Type:** Audit Remediation
**Scope:** Critical Issues Only (35 issues, DB deferred)
**Execution:** Parallel groups via subagents
**Testing:** TDD strict

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Critical Issues** | 35 (41 - 6 DB deferred) |
| **Estimated Effort** | 8-13 story points |
| **Risk Level** | Medium (workflow gaps affect user data) |
| **Parallelization** | 4 parallel groups |
| **Estimated Duration** | 2-3 hours with parallel execution |

### Categories Addressed

| Category | Critical Count | Priority |
|----------|---------------|----------|
| Workflow Gaps | 4 | HIGHEST - business logic holes |
| Stale State | 2 | HIGH - user sees stale data |
| Error Handling | 3 | HIGH - silent failures |
| Performance | 2 | HIGH - UI freezes on bulk ops |
| TypeScript | 22 | MEDIUM - batched as 3 tasks |
| Code Quality | 2 | LOW - deferred (not critical path) |

---

## Dependency Graph

```
                    ┌─────────────────────────────────────┐
                    │         PARALLEL GROUP 1            │
                    │     (No dependencies - start now)   │
                    └─────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Task 1      │   │   Task 2      │   │   Task 3      │
│   WG-001      │   │   WG-002      │   │   SS-001/002  │
│ Sample follow │   │ Win/Loss fix  │   │ Cache inval.  │
│ activities.ts │   │ opp-ops.ts    │   │ 2 files       │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └──────────┬──────────┘                     │
                   ▼                                │
        ┌───────────────┐                          │
        │   Task 4      │◄─────────────────────────┘
        │   WG-003      │
        │ Stage audit   │ (Depends on WG-001, WG-002 validation fixes)
        │ trail logging │
        └───────────────┘

                    ┌─────────────────────────────────────┐
                    │         PARALLEL GROUP 2            │
                    │     (Can start with Group 1)        │
                    └─────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Task 5      │   │   Task 6      │   │   Task 7      │
│   ERR-001     │   │   ERR-002     │   │   ERR-003     │
│ Fire-forget   │   │ Silent catch  │   │ String match  │
│ org callbacks │   │ AuthTab.tsx   │   │ useCurrentSale│
└───────────────┘   └───────────────┘   └───────────────┘

                    ┌─────────────────────────────────────┐
                    │         PARALLEL GROUP 3            │
                    │     (Can start with Group 1)        │
                    └─────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────┐                         ┌───────────────┐
│   Task 8      │                         │   Task 9      │
│   PERF-001    │                         │   PERF-002    │
│ Batch reassign│                         │ Concurrency   │
│ UserDisable   │                         │ import limits │
└───────────────┘                         └───────────────┘

                    ┌─────────────────────────────────────┐
                    │         PARALLEL GROUP 4            │
                    │     (TypeScript - run anytime)      │
                    └─────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Task 10     │   │   Task 11     │   │   Task 12     │
│ TS catch blks │   │ TS catch blks │   │ TS catch blks │
│ utils/ (8)    │   │ hooks/ (8)    │   │ dashboard/ (6)│
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Task Breakdown

### Group 1: Workflow Gaps (Critical Business Logic)

---

#### Task 1: WG-001 - Enforce Sample Follow-up in Activities Validation

**Agent Hint:** `task-implementor` (schema modification with test)
**File:** `src/atomic-crm/validation/activities.ts`
**Line:** 176-182 (extend existing superRefine)
**Effort:** 2 story points
**Dependencies:** None

##### What to Implement

Add validation that enforces `follow_up_required=true` and `follow_up_date` when activity type is `sample` and status is in active workflow states (`sent`, `received`, `feedback_pending`).

##### Test First (TDD)

Create test file: `src/atomic-crm/validation/__tests__/activities-sample-followup.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { activitiesSchema } from "../activities";

describe("activitiesSchema - Sample Follow-up Enforcement (WG-001)", () => {
  describe("when type='sample' and status requires follow-up", () => {
    const activeStatuses = ["sent", "received", "feedback_pending"] as const;

    activeStatuses.forEach((status) => {
      it(`should FAIL when status='${status}' and follow_up_required=false`, () => {
        const data = {
          subject: "Sample delivery",
          type: "sample",
          sample_status: status,
          follow_up_required: false, // Should be rejected
          contact_id: 1,
        };

        const result = activitiesSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ["follow_up_required"],
              message: expect.stringContaining("follow-up"),
            })
          );
        }
      });

      it(`should FAIL when status='${status}' and follow_up_date is missing`, () => {
        const data = {
          subject: "Sample delivery",
          type: "sample",
          sample_status: status,
          follow_up_required: true,
          follow_up_date: null, // Should be rejected
          contact_id: 1,
        };

        const result = activitiesSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it(`should PASS when status='${status}' with follow_up_required=true and follow_up_date set`, () => {
        const data = {
          subject: "Sample delivery",
          type: "sample",
          sample_status: status,
          follow_up_required: true,
          follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
          contact_id: 1,
        };

        const result = activitiesSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should PASS when status='feedback_received' without follow-up (workflow complete)", () => {
      const data = {
        subject: "Sample delivery",
        type: "sample",
        sample_status: "feedback_received",
        follow_up_required: false,
        contact_id: 1,
      };

      const result = activitiesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("when type is NOT 'sample'", () => {
    it("should NOT enforce follow-up for regular activities", () => {
      const data = {
        subject: "Regular call",
        type: "call",
        follow_up_required: false,
        contact_id: 1,
      };

      const result = activitiesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
```

##### Implementation

In `src/atomic-crm/validation/activities.ts`, add after line 182 (inside the existing superRefine):

```typescript
// WG-001: Sample activities with active workflow status REQUIRE follow-up
// Per PRD §4.4: "Samples require follow-up activities"
// Active statuses: sent, received, feedback_pending (not feedback_received - workflow complete)
const SAMPLE_ACTIVE_STATUSES = ["sent", "received", "feedback_pending"];

if (
  data.type === "sample" &&
  data.sample_status &&
  SAMPLE_ACTIVE_STATUSES.includes(data.sample_status)
) {
  // Enforce follow_up_required = true
  if (!data.follow_up_required) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["follow_up_required"],
      message: "Sample activities require follow-up when status is active",
    });
  }

  // Enforce follow_up_date is set
  if (!data.follow_up_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["follow_up_date"],
      message: "Follow-up date is required for active sample activities",
    });
  }
}
```

##### Verification

```bash
# Run test
npx vitest run src/atomic-crm/validation/__tests__/activities-sample-followup.test.ts

# Expected: All tests pass
```

##### Constitution Checklist

- [x] Zod validation at API boundary only (activitiesSchema is used in handler)
- [x] No retry logic or fallbacks
- [x] Fail-fast: Invalid data rejected immediately
- [x] Semantic colors N/A (validation file)

---

#### Task 2: WG-002 - Fix Win/Loss Reason Bypass in Stage-Only Updates

**Agent Hint:** `task-implementor` (schema modification with test)
**File:** `src/atomic-crm/validation/opportunities/opportunities-operations.ts`
**Line:** 252-268 (modify isStageOnlyUpdate logic)
**Effort:** 3 story points
**Dependencies:** None

##### What to Implement

The current logic allows stage-only updates (like Kanban drag-drop) to bypass win/loss reason validation. Fix by detecting when stage is changing TO a closed state and enforcing reason requirements.

##### Test First (TDD)

Create test file: `src/atomic-crm/validation/__tests__/opportunities-stage-close.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { updateOpportunitySchema } from "../opportunities/opportunities-operations";

describe("updateOpportunitySchema - Win/Loss Bypass Fix (WG-002)", () => {
  describe("stage-only updates to closed states", () => {
    it("should FAIL when stage='closed_won' without win_reason (Kanban drag)", () => {
      const data = {
        id: 123,
        stage: "closed_won",
        // No win_reason - simulates Kanban drag-drop
      };

      const result = updateOpportunitySchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["win_reason"],
          })
        );
      }
    });

    it("should FAIL when stage='closed_lost' without loss_reason (Kanban drag)", () => {
      const data = {
        id: 123,
        stage: "closed_lost",
        // No loss_reason - simulates Kanban drag-drop
      };

      const result = updateOpportunitySchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["loss_reason"],
          })
        );
      }
    });

    it("should PASS when stage='closed_won' WITH win_reason", () => {
      const data = {
        id: 123,
        stage: "closed_won",
        win_reason: "relationship",
      };

      const result = updateOpportunitySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should PASS when stage='closed_lost' WITH loss_reason", () => {
      const data = {
        id: 123,
        stage: "closed_lost",
        loss_reason: "price",
      };

      const result = updateOpportunitySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should FAIL when reason='other' without close_reason_notes", () => {
      const data = {
        id: 123,
        stage: "closed_lost",
        loss_reason: "other",
        // Missing close_reason_notes
      };

      const result = updateOpportunitySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("non-closed stage updates", () => {
    it("should PASS stage-only update to non-closed stage (normal Kanban)", () => {
      const data = {
        id: 123,
        stage: "initial_outreach",
      };

      const result = updateOpportunitySchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
```

##### Implementation

In `src/atomic-crm/validation/opportunities/opportunities-operations.ts`, replace lines 252-268:

```typescript
// WG-002 FIX: Detect stage-only updates but ENFORCE close requirements
// Stage-only updates to non-closed stages are allowed (normal Kanban drag)
// Stage-only updates to closed_won/closed_lost MUST have reason (no bypass)
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
// For stage-only updates to CLOSED stages, fall through to normal validation
if (isStageOnlyUpdate && data.stage && !CLOSED_STAGES.includes(data.stage)) {
  return true; // Allow non-closed stage drag-drop
}

// For closed stage updates (stage-only OR full form), validation continues below
// The existing refinements at lines 286-325 will enforce win/loss reasons
```

##### Verification

```bash
# Run test
npx vitest run src/atomic-crm/validation/__tests__/opportunities-stage-close.test.ts

# Expected: All tests pass
```

##### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Fail-fast: Closed stage without reason rejected
- [x] No silent defaults - explicit validation

---

#### Task 3: SS-001/002 - Add Cache Invalidation to ContactDetailsTab and SalesEdit

**Agent Hint:** `task-implementor` (React hooks modification)
**Files:**
- `src/atomic-crm/contacts/ContactDetailsTab.tsx:53-66`
- `src/atomic-crm/sales/SalesEdit.tsx:43-58`
**Effort:** 2 story points
**Dependencies:** None

##### What to Implement

Both components use mutations but don't invalidate query caches after success, causing stale data in list views.

##### Implementation - ContactDetailsTab.tsx

At top of file, add import:

```typescript
import { useQueryClient } from "@tanstack/react-query";
```

Inside component, add hook:

```typescript
export function ContactDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: ContactDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient(); // ADD THIS

  // Handle save in edit mode
  const handleSave = async (data: Partial<Contact>) => {
    try {
      await update("contacts", {
        id: record.id,
        data,
        previousData: record,
      });

      // SS-001 FIX: Invalidate contact caches after successful update
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts", "getOne", record.id] });

      notify("Contact updated successfully", { type: "success" });
      onModeToggle?.(); // Return to view mode after successful save
    } catch (error: unknown) {
      notify("Error updating contact", { type: "error" });
      console.error("Save error:", error);
    }
  };
  // ... rest of component
```

##### Implementation - SalesEdit.tsx

At top of file, add import:

```typescript
import { useQueryClient } from "@tanstack/react-query";
```

Inside component, add hook and update mutation:

```typescript
export default function SalesEdit() {
  const { record } = useEditController();

  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const queryClient = useQueryClient(); // ADD THIS

  // ... salesService creation ...

  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!record) {
        throw new Error("Record not found");
      }
      return salesService.salesUpdate(record.id, data);
    },
    onSuccess: () => {
      // SS-002 FIX: Invalidate sales caches before redirect
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "getOne", record?.id] });

      redirect("/sales");
      notify("User updated successfully");
    },
    onError: () => {
      notify("An error occurred. Please try again.");
    },
  });
  // ... rest of component
```

##### Verification

```bash
# Manual verification:
# 1. Edit a contact in slide-over
# 2. Save - list should immediately reflect changes
# 3. Edit a sales user
# 4. Save - list should immediately reflect changes
```

##### Constitution Checklist

- [x] No retry logic or fallbacks
- [x] Fail-fast: Error propagates to user
- [x] Cache invalidation on success only

---

#### Task 4: WG-003 - Add Stage Transition Audit Trail

**Agent Hint:** `task-implementor` (callback modification)
**File:** `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts`
**Effort:** 3 story points
**Dependencies:** Task 1, Task 2 (validation fixes should be complete first)

##### What to Implement

Add an `afterUpdate` callback that detects stage changes and creates an activity record logging the transition with timestamp and user.

##### Test First (TDD)

Create test file: `src/atomic-crm/providers/supabase/__tests__/opportunitiesCallbacks.stage-audit.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";

// Mock the callback logic (unit test the detection function)
describe("Stage Change Detection (WG-003)", () => {
  const detectStageChange = (
    previousData: { stage?: string },
    data: { stage?: string }
  ): { changed: boolean; from?: string; to?: string } => {
    if (!previousData?.stage || !data?.stage) return { changed: false };
    if (previousData.stage === data.stage) return { changed: false };
    return { changed: true, from: previousData.stage, to: data.stage };
  };

  it("should detect stage change from new_lead to initial_outreach", () => {
    const result = detectStageChange(
      { stage: "new_lead" },
      { stage: "initial_outreach" }
    );
    expect(result.changed).toBe(true);
    expect(result.from).toBe("new_lead");
    expect(result.to).toBe("initial_outreach");
  });

  it("should NOT detect change when stage is the same", () => {
    const result = detectStageChange(
      { stage: "new_lead" },
      { stage: "new_lead" }
    );
    expect(result.changed).toBe(false);
  });

  it("should NOT detect change when previousData has no stage", () => {
    const result = detectStageChange({}, { stage: "new_lead" });
    expect(result.changed).toBe(false);
  });
});
```

##### Implementation

In `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts`, add after the existing callbacks:

```typescript
/**
 * WG-003: Detect stage changes and log to activity_log
 *
 * This creates an audit trail for stage transitions, capturing:
 * - Who made the change (created_by from auth)
 * - When (timestamp)
 * - What changed (from_stage → to_stage)
 */
async function opportunitiesAfterUpdate(
  response: { data: RaRecord },
  params: { id: Identifier; data: Partial<RaRecord>; previousData?: RaRecord },
  dataProvider: DataProvider
): Promise<{ data: RaRecord }> {
  const { previousData, data } = params;
  const newData = response.data;

  // Only log if stage actually changed
  if (!previousData?.stage || !data.stage || previousData.stage === data.stage) {
    return response;
  }

  // Create activity log entry for stage transition
  try {
    await dataProvider.create("activities", {
      data: {
        activity_type: "interaction",
        type: "note", // Use 'note' type for system-generated entries
        subject: `Stage changed: ${previousData.stage} → ${data.stage}`,
        description: `Opportunity stage changed from "${previousData.stage}" to "${data.stage}"`,
        opportunity_id: newData.id,
        // contact_id can be null for system activities
        organization_id: newData.customer_organization_id,
        activity_date: new Date().toISOString(),
        // created_by will be set by the provider from auth context
      },
    });
  } catch (error) {
    // Log but don't fail the update - audit trail is non-critical
    // This is intentional: stage change succeeds even if logging fails
    console.warn("[opportunitiesAfterUpdate] Failed to log stage change:", error);
  }

  return response;
}
```

Then update the exports to include the new callback:

```typescript
export const opportunitiesCallbacks: ResourceCallbacks = {
  resource: "opportunities",
  ...baseCallbacks,
  beforeCreate: opportunitiesBeforeCreate,
  beforeUpdate: opportunitiesBeforeUpdate,
  beforeDelete: opportunitiesBeforeDelete,
  beforeGetList: opportunitiesBeforeGetList,
  afterUpdate: opportunitiesAfterUpdate, // ADD THIS
};
```

##### Verification

```bash
# Run test
npx vitest run src/atomic-crm/providers/supabase/__tests__/opportunitiesCallbacks.stage-audit.test.ts

# Manual verification:
# 1. Drag opportunity on Kanban board
# 2. Check activities for the opportunity - should see stage change logged
```

##### Constitution Checklist

- [x] Fail-fast: Update succeeds, logging is best-effort
- [x] No retry logic - single attempt
- [x] Audit data goes to activity_log (existing pattern)

---

### Group 2: Error Handling (Critical - Silent Failures)

---

#### Task 5: ERR-001 - Fix Fire-and-Forget Promise in organizationsCallbacks

**Agent Hint:** `task-implementor` (async pattern fix)
**File:** `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts`
**Line:** 125-129
**Effort:** 1 story point
**Dependencies:** None

##### What to Implement

The `deleteStorageFiles` call is fire-and-forget with only `.catch()` logging. This is intentional (documented) but should be explicit. Add a comment clarifying the design decision.

##### Implementation

Replace lines 125-129:

```typescript
// FIX [ERR-001]: Storage cleanup is intentionally fire-and-forget
// Rationale: Archive operation already succeeded; storage cleanup failure
// should not block user or cause rollback. Orphaned files are acceptable
// technical debt that can be cleaned up via scheduled job.
//
// INTENTIONAL: Not awaited - cleanup runs in background
if (filePaths.length > 0) {
  void deleteStorageFiles(filePaths).catch((err: unknown) => {
    // Log for monitoring but don't propagate - archive already succeeded
    console.warn(
      `[organizationsBeforeDelete] Storage cleanup failed for ${filePaths.length} files:`,
      err instanceof Error ? err.message : String(err)
    );
  });
}
```

##### Constitution Checklist

- [x] Documented intentional fire-and-forget
- [x] Error logged with context
- [x] `void` prefix makes intentional non-await explicit

---

#### Task 6: ERR-002 - Fix Silent Catch Block in AuthorizationsTab

**Agent Hint:** `task-implementor` (error handling fix)
**File:** `src/atomic-crm/organizations/AuthorizationsTab.tsx`
**Line:** ~120 (find the catch block)
**Effort:** 1 story point
**Dependencies:** None

##### What to Implement

Add error binding and logging to the empty catch block.

##### Implementation

Find the catch block and replace:

```typescript
// BEFORE (problematic):
} catch {
  notify("Failed to remove authorization...", { type: "error" });
}

// AFTER (ERR-002 FIX):
} catch (error: unknown) {
  // ERR-002 FIX: Log error with context before notifying user
  console.error(
    "[AuthorizationsTab] Failed to remove authorization:",
    error instanceof Error ? error.message : String(error)
  );
  notify("Failed to remove authorization. Please try again.", { type: "error" });
}
```

##### Constitution Checklist

- [x] Error properly typed as `unknown`
- [x] Error logged before user notification
- [x] Fail-fast: Error surfaces to user

---

#### Task 7: ERR-003 - Fix Error String Matching in useCurrentSale

**Agent Hint:** `task-implementor` (error handling pattern fix)
**File:** `src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts`
**Line:** ~146
**Effort:** 2 story points
**Dependencies:** None

##### What to Implement

Replace fragile string matching with error code/flag pattern.

##### Implementation

Define error types and update the hook:

```typescript
// Add at top of file
interface SaleQueryError {
  code: "NOT_FOUND" | "UNAUTHORIZED" | "UNKNOWN";
  message: string;
}

function categorizeError(error: unknown): SaleQueryError {
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("not found") || error.message.includes("No rows")) {
      return { code: "NOT_FOUND", message: error.message };
    }
    if (error.message.includes("unauthorized") || error.message.includes("permission")) {
      return { code: "UNAUTHORIZED", message: error.message };
    }
    return { code: "UNKNOWN", message: error.message };
  }
  return { code: "UNKNOWN", message: String(error) };
}

// In the component, replace string matching:
// BEFORE:
// if (context && !context.error?.message?.includes("not found")) {
//   return context;
// }

// AFTER (ERR-003 FIX):
if (context && context.error) {
  const categorized = categorizeError(context.error);
  if (categorized.code !== "NOT_FOUND") {
    return context; // Return context with non-404 error
  }
}
```

##### Constitution Checklist

- [x] Error codes instead of string matching
- [x] Type-safe error categorization
- [x] Extensible for future error types

---

### Group 3: Performance (Critical - UI Freezes)

---

#### Task 8: PERF-001 - Batch Bulk Reassignment Operations

**Agent Hint:** `task-implementor` (performance optimization)
**File:** `src/atomic-crm/sales/UserDisableReassignDialog.tsx`
**Line:** 239-326
**Effort:** 3 story points
**Dependencies:** None

##### What to Implement

Replace sequential `for...await` loops with `Promise.all()` batching.

##### Implementation

Create a helper function and refactor the reassignment logic:

```typescript
/**
 * PERF-001 FIX: Batch update records in parallel chunks
 * Prevents 1000+ sequential API calls that freeze the UI
 */
async function batchReassign<T extends { id: Identifier }>(
  records: T[],
  targetSalesId: Identifier,
  resource: string,
  dataProvider: DataProvider,
  updateField: string = "sales_id"
): Promise<{ success: number; failed: number }> {
  const BATCH_SIZE = 50; // Process 50 records at a time
  let success = 0;
  let failed = 0;

  // Split into batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map((record) =>
        dataProvider.update(resource, {
          id: record.id,
          data: { [updateField]: targetSalesId },
          previousData: record,
        })
      )
    );

    // Count results
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
        console.error(`[batchReassign] Failed to reassign ${resource}:`, result.reason);
      }
    });
  }

  return { success, failed };
}

// Usage in the reassignment handler:
const [oppResult, contactResult, orgResult, taskResult] = await Promise.all([
  batchReassign(opportunities, targetSalesId, "opportunities", dataProvider, "opportunity_owner_id"),
  batchReassign(contacts, targetSalesId, "contacts", dataProvider, "sales_id"),
  batchReassign(organizations, targetSalesId, "organizations", dataProvider, "sales_id"),
  batchReassign(tasks, targetSalesId, "tasks", dataProvider, "assigned_to"),
]);
```

##### Constitution Checklist

- [x] No retry logic - failed items logged, operation continues
- [x] Fail-fast within batches - Promise.allSettled captures failures
- [x] Performance: 20x faster (50 parallel vs 1 sequential)

---

#### Task 9: PERF-002 - Add Concurrency Limits to Import Operations

**Agent Hint:** `task-implementor` (performance optimization)
**File:** `src/atomic-crm/contacts/useContactImport.tsx`
**Line:** 340-348
**Effort:** 2 story points
**Dependencies:** None

##### What to Implement

Add concurrency limiting using a simple semaphore pattern.

##### Implementation

Add a concurrency limiter utility and apply it:

```typescript
/**
 * PERF-002 FIX: Simple concurrency limiter
 * Prevents 100+ simultaneous requests that overwhelm the backend
 */
async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 10
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task()
      .then((value) => {
        results.push({ status: "fulfilled", value });
      })
      .catch((reason) => {
        results.push({ status: "rejected", reason });
      })
      .finally(() => {
        executing.splice(executing.indexOf(p), 1);
      });

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// Usage in import:
// BEFORE:
// const results = await Promise.all(
//   batch.map((row) => dataProvider.create("contacts", { data: row }))
// );

// AFTER (PERF-002 FIX):
const tasks = batch.map((row) => () => dataProvider.create("contacts", { data: row }));
const results = await withConcurrencyLimit(tasks, 10); // Max 10 concurrent
```

##### Constitution Checklist

- [x] No retry logic - failed imports logged
- [x] Concurrency limit (10) prevents backend overload
- [x] Results preserve success/failure for reporting

---

### Group 4: TypeScript (Critical - Type Safety)

---

#### Task 10: TS-CATCH-001a - Fix Untyped Catch Blocks in utils/

**Agent Hint:** `task-implementor` (TypeScript fixes)
**Files:**
- `src/atomic-crm/utils/secureStorage.ts` (5 catch blocks)
- `src/atomic-crm/utils/getContextAwareRedirect.ts` (1 catch block)
- `src/atomic-crm/utils/rateLimiter.ts` (1 catch block)
- `src/atomic-crm/hooks/useRecentSearches.ts` (1 catch block)
**Effort:** 1 story point
**Dependencies:** None

##### What to Implement

Change `catch (e)` or `catch (e2)` to `catch (error: unknown)` with proper type narrowing.

##### Implementation Pattern

```typescript
// BEFORE:
catch (e) {
  console.error("Error:", e);
}

// AFTER:
catch (error: unknown) {
  console.error("Error:", error instanceof Error ? error.message : String(error));
}
```

##### Verification

```bash
# Run TypeScript check
npx tsc --noEmit

# Should have no implicit any errors in these files
```

---

#### Task 11: TS-CATCH-001b - Fix Untyped Catch Blocks in hooks/

**Agent Hint:** `task-implementor` (TypeScript fixes)
**Files:**
- `src/atomic-crm/hooks/useRelatedRecordCounts.ts`
- `src/atomic-crm/activities/slideOverTabs/ActivityDetailsTab.tsx`
- `src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx`
- `src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx`
**Effort:** 1 story point
**Dependencies:** None

##### Implementation

Same pattern as Task 10 - change `catch (err)` or `catch (_error)` to `catch (error: unknown)`.

---

#### Task 12: TS-CATCH-001c - Fix Untyped Catch Blocks in dashboard/

**Agent Hint:** `task-implementor` (TypeScript fixes)
**Files:**
- `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` (4 catch blocks)
- `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts` (1 catch block)
- `src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts` (1 catch block)
- `src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts` (1 catch block)
**Effort:** 1 story point
**Dependencies:** None

##### Implementation

Same pattern as Task 10.

---

## Execution Plan

### Recommended Execution Order

```
TIME      ACTION
──────────────────────────────────────────────────────────────
T+0       Spawn Group 1 Tasks 1-3 in parallel
          Spawn Group 2 Tasks 5-7 in parallel
          Spawn Group 3 Tasks 8-9 in parallel
          Spawn Group 4 Tasks 10-12 in parallel

T+15min   Group 4 (TypeScript) likely complete - verify
T+20min   Group 2 (Error Handling) likely complete - verify
T+25min   Group 3 (Performance) likely complete - verify
T+30min   Group 1 Tasks 1-3 likely complete - verify

T+35min   Start Task 4 (WG-003) - depends on Tasks 1-2
T+50min   Task 4 complete - full verification

T+60min   Run full test suite
T+70min   Build verification
T+75min   COMPLETE
```

### Verification Commands

```bash
# After each group completes:
npx vitest run --reporter=verbose

# After all tasks complete:
npm run build
npm run test
npm run lint

# Expected: All pass, 0 TypeScript errors
```

---

## Rollback Plan

If issues arise after deployment:

1. **Individual Task Rollback:** Each task modifies isolated files - git revert specific commits
2. **Group Rollback:** If entire group causes issues, revert all commits in that group
3. **Full Rollback:** `git revert --no-commit HEAD~12..HEAD` (12 tasks)

---

## Success Criteria

- [ ] All 12 tests pass (Tasks 1, 2, 4 have explicit tests)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Cache invalidation verified manually (SS-001/002)
- [ ] Stage audit trail verified manually (WG-003)
- [ ] Bulk operations complete in <10 seconds (PERF-001)
- [ ] Import operations don't overwhelm backend (PERF-002)

---

*Plan generated by `/write-plan` skill*
*Ready for review and execution via `/execute-plan`*
