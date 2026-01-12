# Implementation Plan: Workflow Gaps Remediation

**Date:** 2026-01-12
**Author:** Claude Code
**Status:** Ready for Review
**Estimated Effort:** 8 Story Points

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 12 (6 implementation + 6 tests) |
| **Story Points** | 8 |
| **Risk Level** | Medium |
| **Complexity** | Simple → Moderate |
| **Parallelization** | 2 parallel tracks |
| **Estimated Time** | 2-3 hours |

### Plan Overview

This plan addresses 6 workflow gap issues identified in the 2026-01-12 audit:

**Critical (3):** Remove silent Zod schema defaults that bypass explicit user decisions
**High (3):** Add activity logging to 3 mutation paths missing audit trail

### Key Context for Agents

- **Activity logging pattern EXISTS** - use `dataProvider.create("activities", {...})`
- **DB has column defaults** - `status='active'`, `priority='medium'` at PostgreSQL level
- **Removing Zod defaults is SAFE** - DB defaults will catch any missing values
- **Goal:** Force UI to be explicit, not break existing functionality

---

## Plan Summary

**Type:** Bug Fix
**Scope:** Cross-feature (Validation schemas + Activity logging)
**Areas:** Opportunities/Pipeline, Activities/Tasks
**Granularity:** Atomic (2-5 min tasks)
**Execution:** Parallel groups
**Database:** No changes (DB defaults already exist)
**Testing:** TDD strict - failing tests first

---

## Dependency Graph

```
                    ┌─────────────────────────────────────────────┐
                    │           PARALLEL TRACK 1                  │
                    │         (Schema Defaults)                   │
                    └─────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────┐
        │                               │                           │
        ▼                               ▼                           ▼
┌───────────────┐               ┌───────────────┐           ┌───────────────┐
│   Task 1      │               │   Task 2      │           │   Task 3      │
│ Test: status  │               │ Test: status  │           │ Test: priority│
│ in create     │               │ in quickCreate│           │ in quickCreate│
│   schema      │               │    schema     │           │    schema     │
└───────┬───────┘               └───────┬───────┘           └───────┬───────┘
        │                               │                           │
        ▼                               ▼                           ▼
┌───────────────┐               ┌───────────────┐           ┌───────────────┐
│   Task 4      │               │   Task 5      │           │   Task 6      │
│ Remove status │               │ Remove status │           │Remove priority│
│    default    │               │    default    │           │    default    │
└───────────────┘               └───────────────┘           └───────────────┘


                    ┌─────────────────────────────────────────────┐
                    │           PARALLEL TRACK 2                  │
                    │         (Activity Logging)                  │
                    └─────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────┐
        │                               │                           │
        ▼                               ▼                           ▼
┌───────────────┐               ┌───────────────┐           ┌───────────────┐
│   Task 7      │               │   Task 8      │           │   Task 9      │
│ Test: SlideOver               │ Test: Product │           │ Test: Contact │
│ activity log  │               │ sync activity │           │ link activity │
└───────┬───────┘               └───────┬───────┘           └───────┬───────┘
        │                               │                           │
        ▼                               ▼                           ▼
┌───────────────┐               ┌───────────────┐           ┌───────────────┐
│   Task 10     │               │   Task 11     │           │   Task 12     │
│ Add SlideOver │               │ Add Product   │           │ Add Contact   │
│ activity log  │               │ sync activity │           │ link activity │
└───────────────┘               └───────────────┘           └───────────────┘


LEGEND:
  Track 1 (Tasks 1-6) and Track 2 (Tasks 7-12) can run in PARALLEL
  Within each track, test tasks (odd) must complete before implementation (even)
```

---

## Track 1: Remove Silent Schema Defaults (Critical)

### Task 1: Test - status default rejection in createOpportunitySchema [Confidence: 95%]

**Agent Hint:** `test-agent` (writing failing tests for schema validation)
**File:** `src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Write a failing test that verifies `createOpportunitySchema` does NOT auto-fill `status` when omitted. The test should FAIL initially (proving the default exists), then PASS after Task 4.

#### Code Example

```typescript
// Add to existing test file or create new one
describe("createOpportunitySchema - WF-C1-001", () => {
  it("should NOT have a silent status default - status must be explicit", () => {
    // ✅ Constitution: Fail-fast - no implicit values
    const inputWithoutStatus = {
      name: "Test Opportunity",
      principal_organization_id: 1,
      customer_organization_id: 2,
      stage: "new_lead",
      // status intentionally omitted
      priority: "high",
    };

    // This should either:
    // 1. Throw a Zod validation error (status required), OR
    // 2. Return parsed data WITHOUT status field (let DB default handle it)

    // Currently FAILS because schema adds default "active"
    const result = createOpportunitySchema.safeParse(inputWithoutStatus);

    if (result.success) {
      // If parsing succeeds, status should NOT be auto-filled
      expect(result.data).not.toHaveProperty("status");
    }
    // If parsing fails, that's also acceptable (status required)
  });
});
```

#### Verification

```bash
# Run test - should FAIL initially
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts --reporter=verbose
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Fail-fast principle enforced

---

### Task 2: Test - status default rejection in quickCreateOpportunitySchema [Confidence: 95%]

**Agent Hint:** `test-agent` (writing failing tests for schema validation)
**File:** `src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Write a failing test for `quickCreateOpportunitySchema` status default.

#### Code Example

```typescript
describe("quickCreateOpportunitySchema - WF-C1-002", () => {
  it("should NOT have a silent status default - status must be explicit", () => {
    // ✅ Constitution: Fail-fast - no implicit values for business-critical fields
    const inputWithoutStatus = {
      name: "Quick Add Opportunity",
      principal_organization_id: 1,
      customer_organization_id: 2,
      stage: "new_lead",
      // status intentionally omitted
      priority: "high",
    };

    const result = quickCreateOpportunitySchema.safeParse(inputWithoutStatus);

    if (result.success) {
      // Status should NOT be auto-filled by Zod
      expect(result.data).not.toHaveProperty("status");
    }
  });
});
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts --reporter=verbose
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Fail-fast principle enforced

---

### Task 3: Test - priority default rejection in quickCreateOpportunitySchema [Confidence: 95%]

**Agent Hint:** `test-agent` (writing failing tests for schema validation)
**File:** `src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Write a failing test for `quickCreateOpportunitySchema` priority default.

#### Code Example

```typescript
describe("quickCreateOpportunitySchema - WF-C1-003", () => {
  it("should NOT have a silent priority default - priority must be explicit", () => {
    // ✅ Constitution: Fail-fast - no implicit values
    const inputWithoutPriority = {
      name: "Quick Add Opportunity",
      principal_organization_id: 1,
      customer_organization_id: 2,
      stage: "new_lead",
      status: "active",
      // priority intentionally omitted
    };

    const result = quickCreateOpportunitySchema.safeParse(inputWithoutPriority);

    if (result.success) {
      // Priority should NOT be auto-filled by Zod
      expect(result.data).not.toHaveProperty("priority");
    }
  });
});
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts --reporter=verbose
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Fail-fast principle enforced

---

### Task 4: Remove status default from createOpportunitySchema [Confidence: 90%]

**Agent Hint:** `schema-agent` (Zod schema modification)
**File:** `src/atomic-crm/validation/opportunities/opportunities-operations.ts`
**Line:** 204
**Effort:** 0.5 story points
**Dependencies:** Task 1 (test must exist first)

#### What to Implement

Remove the `.default("active")` from the status field in `createOpportunitySchema`. The database has a column default, so this is safe.

#### Code Example

```typescript
// BEFORE (line ~204):
status: z.literal("active").optional().default("active"),

// AFTER:
status: z.literal("active").optional(),
// ✅ Constitution: Let DB default handle this, don't mask with Zod default
// ✅ DB has: status opportunity_status DEFAULT 'active'::opportunity_status
```

#### Verification

```bash
# Test should now PASS
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts --reporter=verbose

# Type check
npx tsc --noEmit
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Fail-fast principle enforced
- [x] Removed silent default (explicit over implicit)

---

### Task 5: Remove status default from quickCreateOpportunitySchema [Confidence: 90%]

**Agent Hint:** `schema-agent` (Zod schema modification)
**File:** `src/atomic-crm/validation/opportunities/opportunities-operations.ts`
**Line:** 252
**Effort:** 0.5 story points
**Dependencies:** Task 2 (test must exist first)

#### What to Implement

Remove the `.default("active")` from the status field in `quickCreateOpportunitySchema`.

#### Code Example

```typescript
// BEFORE (line ~252):
status: z.literal("active").optional().default("active"),

// AFTER:
status: z.literal("active").optional(),
// ✅ Constitution: Explicit over implicit - DB default handles fallback
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts --reporter=verbose
npx tsc --noEmit
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Fail-fast principle enforced
- [x] Removed silent default

---

### Task 6: Remove priority default from quickCreateOpportunitySchema [Confidence: 90%]

**Agent Hint:** `schema-agent` (Zod schema modification)
**File:** `src/atomic-crm/validation/opportunities/opportunities-operations.ts`
**Line:** 253
**Effort:** 0.5 story points
**Dependencies:** Task 3 (test must exist first)

#### What to Implement

Remove the `.default("medium")` from the priority field in `quickCreateOpportunitySchema`.

#### Code Example

```typescript
// BEFORE (line ~253):
priority: opportunityPrioritySchema.default("medium"),

// AFTER:
priority: opportunityPrioritySchema.optional(),
// ✅ Constitution: Explicit over implicit - DB default handles fallback
// ✅ DB has: priority priority_level DEFAULT 'medium'::priority_level
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/validation/opportunities/__tests__/opportunities-operations.test.ts --reporter=verbose
npx tsc --noEmit
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] Fail-fast principle enforced
- [x] Removed silent default

---

## Track 2: Add Activity Logging (High)

### Task 7: Test - SlideOver detail updates create activity log [Confidence: 85%]

**Agent Hint:** `test-agent` (component integration test)
**File:** `src/atomic-crm/opportunities/slideOverTabs/__tests__/OpportunitySlideOverDetailsTab.test.tsx`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Write a test that verifies updating opportunity details via SlideOver creates an activity record.

#### Code Example

```typescript
import { renderWithAdminContext } from "@/test/renderWithAdminContext";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OpportunitySlideOverDetailsTab } from "../OpportunitySlideOverDetailsTab";
import { mockDataProvider } from "@/test/mockDataProvider";

describe("OpportunitySlideOverDetailsTab - WF-H2-003", () => {
  it("should create activity log when details are updated", async () => {
    const createSpy = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const updateSpy = vi.fn().mockResolvedValue({ data: { id: 1 } });

    const dataProvider = mockDataProvider({
      create: createSpy,
      update: updateSpy,
    });

    renderWithAdminContext(
      <OpportunitySlideOverDetailsTab record={mockOpportunity} />,
      { dataProvider }
    );

    // Simulate field update and save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      // ✅ Verify activity was created
      expect(createSpy).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          data: expect.objectContaining({
            activity_type: "interaction",
            opportunity_id: mockOpportunity.id,
          }),
        })
      );
    });
  });
});
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/opportunities/slideOverTabs/__tests__/OpportunitySlideOverDetailsTab.test.tsx --reporter=verbose
```

#### Constitution Checklist

- [x] Uses renderWithAdminContext (not bare render)
- [x] Tests behavior, not implementation

---

### Task 8: Test - Product sync creates activity log [Confidence: 85%]

**Agent Hint:** `test-agent` (component integration test)
**File:** `src/atomic-crm/opportunities/slideOverTabs/__tests__/OpportunityProductsTab.test.tsx`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Write a test that verifies syncing products creates an activity record.

#### Code Example

```typescript
describe("OpportunityProductsTab - WF-H2-004", () => {
  it("should create activity log when products are synced", async () => {
    const createSpy = vi.fn().mockResolvedValue({ data: { id: 1 } });
    const updateSpy = vi.fn().mockResolvedValue({ data: { id: 1 } });

    const dataProvider = mockDataProvider({
      create: createSpy,
      update: updateSpy,
    });

    renderWithAdminContext(
      <OpportunityProductsTab record={mockOpportunity} />,
      { dataProvider }
    );

    // Simulate product selection and sync
    // ... (specific to component implementation)

    await waitFor(() => {
      // ✅ Verify activity was created for product sync
      expect(createSpy).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          data: expect.objectContaining({
            activity_type: "interaction",
            type: "note",
            subject: expect.stringContaining("product"),
            opportunity_id: mockOpportunity.id,
          }),
        })
      );
    });
  });
});
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/opportunities/slideOverTabs/__tests__/OpportunityProductsTab.test.tsx --reporter=verbose
```

#### Constitution Checklist

- [x] Uses renderWithAdminContext
- [x] Tests behavior, not implementation

---

### Task 9: Test - Contact linking creates activity log [Confidence: 85%]

**Agent Hint:** `test-agent` (component integration test)
**File:** `src/atomic-crm/contacts/__tests__/OpportunitiesTab.test.tsx`
**Effort:** 1 story point
**Dependencies:** None

#### What to Implement

Write a test that verifies linking a contact to an opportunity creates an activity record.

#### Code Example

```typescript
describe("OpportunitiesTab (Contact) - WF-H2-005", () => {
  it("should create activity log when contact is linked to opportunity", async () => {
    const createSpy = vi.fn().mockResolvedValue({ data: { id: 1 } });

    const dataProvider = mockDataProvider({
      create: createSpy,
    });

    renderWithAdminContext(
      <OpportunitiesTab contact={mockContact} />,
      { dataProvider }
    );

    // Simulate linking contact to opportunity
    // ... (specific to component implementation)

    await waitFor(() => {
      // ✅ Verify activity was created for contact link
      expect(createSpy).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          data: expect.objectContaining({
            activity_type: "interaction",
            type: "note",
            subject: expect.stringContaining("contact"),
            opportunity_id: expect.any(Number),
          }),
        })
      );
    });
  });
});
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/contacts/__tests__/OpportunitiesTab.test.tsx --reporter=verbose
```

#### Constitution Checklist

- [x] Uses renderWithAdminContext
- [x] Tests behavior, not implementation

---

### Task 10: Add activity logging to SlideOver detail updates [Confidence: 85%]

**Agent Hint:** `component-agent` (React component modification)
**File:** `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx`
**Line:** ~49 (after successful update)
**Effort:** 1 story point
**Dependencies:** Task 7 (test must exist first)

#### What to Implement

Add activity creation after successful opportunity update in SlideOver. Follow the existing pattern from `OpportunityListContent.tsx:233`.

#### Code Example

```typescript
// In the update success handler (onSuccess or after await update()):

// ✅ WF-H2-003 FIX: Log activity for detail updates
try {
  await dataProvider.create("activities", {
    data: {
      activity_type: "interaction", // Must be "interaction" when opportunity_id is set
      type: "note",
      subject: `Details updated`, // Keep concise - full audit in DB updated_at
      activity_date: new Date().toISOString(),
      opportunity_id: record.id,
      organization_id: record.customer_organization_id,
    },
  });

  queryClient.invalidateQueries({ queryKey: activityKeys.all });
} catch (error: unknown) {
  // ✅ Constitution: Fail-fast - notify user of audit trail gap
  console.error("Failed to create detail update activity:", error);
  notify("Failed to log activity. Please manually add a note for this update.", {
    type: "warning",
    autoHideDuration: 8000,
  });
}
```

#### Verification

```bash
# Test should now PASS
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/opportunities/slideOverTabs/__tests__/OpportunitySlideOverDetailsTab.test.tsx --reporter=verbose

# Type check
npx tsc --noEmit
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic (single attempt, then warn user)
- [x] Fail-fast principle (notify on failure)
- [x] Uses activity_type: "interaction" (required when opportunity_id set)

---

### Task 11: Add activity logging to product sync [Confidence: 85%]

**Agent Hint:** `component-agent` (React component modification)
**File:** `src/atomic-crm/opportunities/slideOverTabs/OpportunityProductsTab.tsx`
**Line:** ~95 (after successful product sync)
**Effort:** 1 story point
**Dependencies:** Task 8 (test must exist first)

#### What to Implement

Add activity creation after successful product sync. Include product names in the subject for audit trail.

#### Code Example

```typescript
// After successful product sync (in onSuccess handler):

// ✅ WF-H2-004 FIX: Log activity for product sync
try {
  const productNames = productsToSync.map(p => p.name).join(", ");
  const subject = productsToSync.length > 0
    ? `Products updated: ${productNames.substring(0, 100)}${productNames.length > 100 ? "..." : ""}`
    : "Products cleared";

  await dataProvider.create("activities", {
    data: {
      activity_type: "interaction",
      type: "note",
      subject,
      activity_date: new Date().toISOString(),
      opportunity_id: record.id,
      organization_id: record.customer_organization_id,
    },
  });

  queryClient.invalidateQueries({ queryKey: activityKeys.all });
} catch (error: unknown) {
  // ✅ Constitution: Fail-fast - notify user
  console.error("Failed to create product sync activity:", error);
  notify("Failed to log product change. Please manually add a note.", {
    type: "warning",
    autoHideDuration: 8000,
  });
}
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/opportunities/slideOverTabs/__tests__/OpportunityProductsTab.test.tsx --reporter=verbose
npx tsc --noEmit
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic
- [x] Fail-fast principle
- [x] Uses activity_type: "interaction"

---

### Task 12: Add activity logging to contact linking [Confidence: 85%]

**Agent Hint:** `component-agent` (React component modification)
**File:** `src/atomic-crm/contacts/OpportunitiesTab.tsx`
**Line:** ~93 (after successful contact link)
**Effort:** 1 story point
**Dependencies:** Task 9 (test must exist first)

#### What to Implement

Add activity creation after successfully linking a contact to an opportunity.

#### Code Example

```typescript
// After successful opportunity_contacts create:

// ✅ WF-H2-005 FIX: Log activity for contact linking
try {
  await dataProvider.create("activities", {
    data: {
      activity_type: "interaction",
      type: "note",
      subject: `Contact linked: ${contact.first_name} ${contact.last_name}`,
      activity_date: new Date().toISOString(),
      opportunity_id: opportunityId,
      // organization_id from the opportunity, not the contact
      organization_id: opportunity.customer_organization_id,
    },
  });

  queryClient.invalidateQueries({ queryKey: activityKeys.all });
} catch (error: unknown) {
  // ✅ Constitution: Fail-fast - notify user
  console.error("Failed to create contact link activity:", error);
  notify("Failed to log contact link. Please manually add a note.", {
    type: "warning",
    autoHideDuration: 8000,
  });
}
```

#### Verification

```bash
cd /home/krwhynot/projects/crispy-crm && npx vitest run src/atomic-crm/contacts/__tests__/OpportunitiesTab.test.tsx --reporter=verbose
npx tsc --noEmit
```

#### Constitution Checklist

- [x] Zod validation at API boundary only
- [x] No retry logic
- [x] Fail-fast principle
- [x] Uses activity_type: "interaction"

---

## Execution Instructions

### Parallel Execution Groups

**Group A (Track 1 - Schema):** Tasks 1, 2, 3 → Then 4, 5, 6
**Group B (Track 2 - Logging):** Tasks 7, 8, 9 → Then 10, 11, 12

Both groups can run simultaneously.

### Recommended Agent Assignment

| Task | Agent Type | Reason |
|------|------------|--------|
| 1-3 | `test-agent` | Writing Zod schema validation tests |
| 4-6 | `schema-agent` | Modifying Zod schemas |
| 7-9 | `test-agent` | Writing React component tests |
| 10-12 | `component-agent` | Modifying React components |

### Post-Implementation Verification

```bash
# 1. Run all new tests
cd /home/krwhynot/projects/crispy-crm && npx vitest run --reporter=verbose

# 2. Type check entire project
npx tsc --noEmit

# 3. Build check
npm run build

# 4. Manual E2E verification (optional but recommended)
# - Create opportunity via QuickAdd - verify status/priority fields visible
# - Update opportunity in SlideOver - verify activity created
# - Sync products - verify activity created
# - Link contact - verify activity created
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| UI breaks without status/priority | DB has column defaults - safe fallback |
| Activity logging fails | Fail-fast with user notification, not silent |
| Tests flaky with async activity creation | Use `waitFor` with appropriate timeout |
| Duplicate activity logs | Single creation point, no retry logic |

---

## Success Criteria

- [ ] All 6 tests pass
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] Manual E2E shows activity logging working
- [ ] No console errors in browser

---

## Related Documents

- Audit Report: `docs/audits/2026-01-12-workflow-gaps.md`
- Baseline: `docs/audits/.baseline/workflow-gaps.json`
- Engineering Constitution: `CLAUDE.md`
- Provider Rules: `.claude/rules/PROVIDER_RULES.md`

---

*Generated by `/write-plan` skill on 2026-01-12*
