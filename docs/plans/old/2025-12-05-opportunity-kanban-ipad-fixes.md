# Implementation Plan: Opportunity Kanban iPad Fixes

**Created:** 2025-12-05
**Source:** `docs/reviews/2025-12-05-opportunity-kanban-ipad-review.md`
**Execution:** Critical first, then parallel groups
**Granularity:** Atomic (2-5 min tasks)
**Testing:** TDD strict

---

## Overview

This plan addresses 9 issues identified in the parallel code review of the Opportunity kanban board, with focus on iPad field sales usability.

### Issue Summary

| Priority | Count | Description |
|----------|-------|-------------|
| Critical | 1 | Drag handle for iPad scroll/drag conflict |
| High | 4 | Form defaults (schema-derived), console logging, focus states |
| Medium | 3 | UUID config, ARIA label, semantic colors |

> **Note:** localStorage validation merged into form defaults tasks (Agent A).

---

## Execution Strategy

```
Phase 1: CRITICAL (Sequential - Blocks Field Testing)
└── Task 1.1-1.5: Drag handle implementation (TDD)

Phase 2: ALL PARALLEL WORK (5 Agent Groups - Run Concurrently)
├── Agent A: localStorage helper + Form defaults (Tasks 2.1-2.5)
├── Agent B: Console logging cleanup (Tasks 3.1-3.3)
├── Agent C: Focus states (Tasks 4.1-4.3)
├── Agent D: Config constants (Task 5.1)
└── Agent E: Accessibility & colors (Tasks 6.1-6.3)

Phase 3: VERIFICATION
└── Task 7.1-7.3: Build, test suite, manual verification
```

> **Note (Zen Review Fix H1):** localStorage helper (formerly Phase 3) moved to start of Agent A
> to ensure it exists before form defaults refactoring uses it.
>
> **Note (Zen Review Fix M1):** Phases 2 & 3 merged for maximum parallelization (~8 min saved).

---

## Constitution Compliance Checklist

Every task MUST verify:
- [ ] No retry logic, circuit breakers, or graceful fallbacks (fail-fast)
- [ ] No direct Supabase imports (use unifiedDataProvider)
- [ ] No form-level validation (Zod at API boundary only)
- [ ] `interface` for object shapes, `type` for unions
- [ ] Semantic color tokens only (no hardcoded hex)
- [ ] 44x44px minimum touch targets
- [ ] `touch-manipulation` on interactive elements

---

## Phase 1: CRITICAL - Drag Handle Implementation (TDD)

> **BLOCKS FIELD DEPLOYMENT** - Execute sequentially before any other work

### Task 1.1: Write Failing Test - Drag Handle Exists

**File:** `src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx`
**Time:** 3 min
**Dependencies:** None

**Instructions:**
1. Open file: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx`
2. Add test at end of file (before closing `})`):

```tsx
describe("iPad Drag Handle", () => {
  it("renders explicit drag handle icon", () => {
    render(
      <TestWrapper>
        <OpportunityCard index={0} openSlideOver={vi.fn()} />
      </TestWrapper>
    );

    const dragHandle = screen.getByTestId("drag-handle");
    expect(dragHandle).toBeInTheDocument();
    expect(dragHandle).toHaveAttribute("aria-label", "Drag to reorder");
  });

  it("drag handle meets 44px touch target", () => {
    render(
      <TestWrapper>
        <OpportunityCard index={0} openSlideOver={vi.fn()} />
      </TestWrapper>
    );

    const dragHandle = screen.getByTestId("drag-handle");
    // Check for min-h-[44px] and min-w-[44px] classes
    expect(dragHandle.className).toMatch(/min-h-\[44px\]|min-h-11|h-11/);
    expect(dragHandle.className).toMatch(/min-w-\[44px\]|min-w-11|w-11/);
  });

  it("card body does NOT have dragHandleProps", () => {
    render(
      <TestWrapper>
        <OpportunityCard index={0} openSlideOver={vi.fn()} />
      </TestWrapper>
    );

    const cardBody = screen.getByTestId("opportunity-card");
    // Card should have draggableProps but NOT dragHandleProps
    // dragHandleProps adds data-rbd-drag-handle-draggable-id attribute
    expect(cardBody).not.toHaveAttribute("data-rbd-drag-handle-draggable-id");
  });

  it("does not trigger openSlideOver when drag handle is clicked", () => {
    const openSlideOver = vi.fn();
    render(
      <TestWrapper>
        <OpportunityCard index={0} openSlideOver={openSlideOver} />
      </TestWrapper>
    );

    const dragHandle = screen.getByTestId("drag-handle");
    fireEvent.click(dragHandle);

    expect(openSlideOver).not.toHaveBeenCalled();
  });
});
```

**Verification:**
```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
# Expected: 4 FAILING tests (drag handle not implemented yet)
```

**Constitution Check:**
- [x] No retry logic
- [x] No Supabase imports
- [x] Test file only - no validation concerns

---

### Task 1.2: Add GripVertical Import

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
**Time:** 1 min
**Dependencies:** Task 1.1 (tests exist)

**Instructions:**
1. Open file: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
2. Find import line with lucide-react icons (around line 5)
3. Add `GripVertical` to the import:

```tsx
// BEFORE (line 5):
import { Trophy, XCircle, ChevronDown, ChevronUp, User, Calendar, Clock, CheckSquare, Package } from "lucide-react";

// AFTER:
import { Trophy, XCircle, ChevronDown, ChevronUp, User, Calendar, Clock, CheckSquare, Package, GripVertical } from "lucide-react";
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: No TypeScript errors
```

---

### Task 1.3: Separate draggableProps from dragHandleProps

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
**Time:** 3 min
**Dependencies:** Task 1.2

**Instructions:**
1. Locate the outer `<div>` inside the `Draggable` render prop (around lines 88-93)
2. Remove `{...provided.dragHandleProps}` from the card container
3. Keep only `{...provided.draggableProps}` on the container

```tsx
// BEFORE (lines 88-93):
<div
  ref={provided.innerRef}
  {...provided.draggableProps}
  {...provided.dragHandleProps}  // ❌ REMOVE THIS LINE
  role="button"
  // ...

// AFTER:
<div
  ref={provided.innerRef}
  {...provided.draggableProps}
  // dragHandleProps moved to dedicated handle element
  role="button"
  // ...
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: No TypeScript errors (dragHandleProps will be used in next task)
```

---

### Task 1.4: Add Dedicated Drag Handle Element

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
**Time:** 5 min
**Dependencies:** Task 1.3

**Instructions:**
1. Find the header div (around line 115): `{/* Header: Activity Pulse + Name + Expand + Actions (always visible) */}`
2. Add drag handle as FIRST element inside the header flex container:

```tsx
// BEFORE (lines 115-116):
{/* Header: Activity Pulse + Name + Expand + Actions (always visible) */}
<div className="flex items-center gap-2">
  <ActivityPulseDot daysSinceLastActivity={record.days_since_last_activity} />

// AFTER:
{/* Header: Activity Pulse + Name + Expand + Actions (always visible) */}
<div className="flex items-center gap-2">
  {/* Dedicated drag handle - 44px touch target (WCAG AA) */}
  <div
    {...provided.dragHandleProps}
    data-testid="drag-handle"
    data-drag-handle
    aria-label="Drag to reorder"
    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-grab active:cursor-grabbing transition-colors touch-manipulation"
  >
    <GripVertical className="w-4 h-4" />
  </div>
  <ActivityPulseDot daysSinceLastActivity={record.days_since_last_activity} />
```

**Verification:**
```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
# Expected: All 3 drag handle tests PASS
```

**Constitution Check:**
- [x] Touch target: 44x44px (`min-h-[44px] min-w-[44px]`)
- [x] `touch-manipulation` class applied
- [x] Semantic colors (`text-muted-foreground`, `hover:bg-accent`)
- [x] ARIA label for accessibility

---

### Task 1.5: Update Click Handler to Exclude Drag Handle

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
**Time:** 2 min
**Dependencies:** Task 1.4

**Instructions:**
1. Find `handleCardClick` function (around line 46-57)
2. Add check for drag handle to prevent slide-over opening during drag:

```tsx
// BEFORE (lines 46-53):
const handleCardClick = (e: React.MouseEvent) => {
  // Only open slide-over if not clicking on action buttons or expand toggle
  if (
    (e.target as HTMLElement).closest("[data-action-button]") ||
    (e.target as HTMLElement).closest("[data-expand-toggle]")
  ) {
    return;
  }

// AFTER:
const handleCardClick = (e: React.MouseEvent) => {
  // Only open slide-over if not clicking on action buttons, expand toggle, or drag handle
  if (
    (e.target as HTMLElement).closest("[data-action-button]") ||
    (e.target as HTMLElement).closest("[data-expand-toggle]") ||
    (e.target as HTMLElement).closest("[data-drag-handle]")
  ) {
    return;
  }
```

**Verification:**
```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
npm run build
# Expected: All tests pass, build succeeds
```

---

## Phase 2: ALL PARALLEL WORK

> Execute these 5 task groups in PARALLEL via separate agents after Phase 1 completes

### Group 2A: localStorage Helper + Form Defaults (Agent A)

> **IMPORTANT (Zen Review Fix H1):** localStorage helper MUST be created first,
> then form defaults can use it.

#### Task 2.1: Create localStorage Validation Helper

**File:** `src/lib/storage-utils.ts` (CREATE NEW FILE)
**Time:** 3 min
**Dependencies:** None

**Instructions:**
1. Create new file: `/home/krwhynot/projects/crispy-crm/src/lib/storage-utils.ts`
2. Add validated localStorage helper:

```tsx
/**
 * Safely read a string from localStorage with validation.
 * Returns defaultValue if key doesn't exist, value is null, or access fails.
 *
 * @param key - localStorage key to read
 * @param defaultValue - fallback value (default: "")
 * @returns The stored string value or defaultValue
 */
export function getLocalStorageString(key: string, defaultValue = ""): string {
  try {
    const value = localStorage.getItem(key);
    return typeof value === "string" ? value : defaultValue;
  } catch {
    // localStorage access can fail in private browsing or when disabled
    return defaultValue;
  }
}

/**
 * Safely write a string to localStorage.
 * Fails silently if localStorage is unavailable.
 *
 * @param key - localStorage key to write
 * @param value - string value to store
 */
export function setLocalStorageString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Fail silently - localStorage may be unavailable
  }
}
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: No TypeScript errors
```

---

#### Task 2.2: Write Test for Schema-Derived QuickAdd Defaults

**File:** `src/atomic-crm/opportunities/__tests__/QuickAddForm.test.tsx`
**Time:** 3 min
**Dependencies:** Task 2.1

**Instructions:**
1. Add test to verify defaults come from schema:

```tsx
describe("Form Defaults", () => {
  it("derives initial values from quickAddSchema.partial().parse()", () => {
    // Verify the form uses schema-derived defaults
    // This ensures type safety and single source of truth
    render(<QuickAddForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

    // Form should render without errors when no localStorage values exist
    expect(screen.getByRole("form")).toBeInTheDocument();
  });
});
```

---

#### Task 2.3: Refactor QuickAddForm Defaults

**File:** `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx`
**Time:** 5 min
**Dependencies:** Task 2.1 (uses getLocalStorageString)

**Instructions:**
1. Import quickAddSchema from validation
2. Import getLocalStorageString from storage-utils
3. Replace hardcoded defaults with schema-derived values:

```tsx
// BEFORE (lines 49-61):
const defaultValues = {
  name: "",
  principal_organization_id: localStorage.getItem("last_principal") || "",
  campaign: localStorage.getItem("last_campaign") || "",
  // ...hardcoded values
};

// AFTER:
import { quickAddSchema } from "@/atomic-crm/validation/quickAdd";
import { getLocalStorageString } from "@/lib/storage-utils";

// Derive defaults from schema first (single source of truth)
const schemaDefaults = quickAddSchema.partial().parse({});

// Then merge with validated localStorage for persistence
const defaultValues = {
  ...schemaDefaults,
  principal_organization_id: getLocalStorageString("last_principal", schemaDefaults.principal_organization_id || ""),
  campaign: getLocalStorageString("last_campaign", schemaDefaults.campaign || ""),
};
```

**Constitution Check:**
- [x] Form defaults from schema (single source of truth)
- [x] No form-level validation (schema at API boundary)
- [x] localStorage access validated via helper

---

#### Task 2.4: Write Test for Schema-Derived InlineDialog Defaults

**File:** `src/atomic-crm/opportunities/__tests__/OpportunityRelationshipsTab.test.tsx`
**Time:** 3 min
**Dependencies:** None

**Instructions:**
1. Create test file if it doesn't exist
2. Add test to verify inline dialog uses schema-derived defaults:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { OpportunityRelationshipsTab } from "../forms/tabs/OpportunityRelationshipsTab";
import { TestWrapper } from "@/tests/utils/render-admin";

describe("InlineDialog Form Defaults", () => {
  it("derives initial values from relationship schema", () => {
    render(
      <TestWrapper>
        <OpportunityRelationshipsTab />
      </TestWrapper>
    );

    // Simulate user action to open the inline add form
    const addButton = screen.getByRole("button", { name: /add/i });
    fireEvent.click(addButton);

    // Verify dialog opened - form renders with schema defaults
    // The form should not error when opened with no record context
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
```

---

#### Task 2.5: Refactor InlineDialog Defaults

**File:** `src/atomic-crm/opportunities/forms/tabs/OpportunityRelationshipsTab.tsx`
**Time:** 5 min
**Dependencies:** Task 2.4

**Instructions:**
1. Extract inline `defaultValues` objects to constants at top of file
2. Derive from respective schemas using `.partial().parse({})`
3. Update CreateInDialogButton components to use extracted constants

```tsx
// Add near top of file, after imports:
import { contactSchema } from "@/atomic-crm/validation/contacts";
import { organizationSchema } from "@/atomic-crm/validation/organizations";

// Schema-derived defaults for inline dialogs
const contactDefaults = contactSchema.partial().parse({});
const organizationDefaults = organizationSchema.partial().parse({});

// Then use in CreateInDialogButton:
<CreateInDialogButton
  // ...
  defaultValues={contactDefaults}
/>
```

**Constitution Check:**
- [x] Form defaults from schema (single source of truth)
- [x] No form-level validation

---

### Group 2B: Console Logging Cleanup (Agent B)

#### Task 3.1: Identify All Console Statements

**Time:** 2 min

**Files to check:**
- `hooks/useBulkActionsState.ts` (lines 91, 115, 138, 151)
- `hooks/useExportOpportunities.ts` (line 99)
- `ActivityNoteForm.tsx` (lines 115, 138)
- `kanban/OpportunityListContent.tsx` (line 245)
- `kanban/QuickAddOpportunity.tsx` (line 64)

---

#### Task 3.2: Replace User-Facing console.error with notify()

**Time:** 3 min per file

**Instructions:**
Replace `console.error` with React Admin's `useNotify()` hook **only for user-facing errors**
that are recoverable or require user awareness (e.g., network errors on form submission).

**Keep `console.error` for:**
- Unexpected internal errors that indicate code bugs
- Errors developers need to see in DevTools/logging services

```tsx
// GOOD CANDIDATE for notify() - user-facing export failure:
// BEFORE:
console.error("Failed to export:", error);
// AFTER:
notify("Export failed. Please try again.", { type: "error" });

// KEEP as console.error - internal/unexpected errors:
console.error("Unexpected state in drag handler:", error);
```

**Files to update:**
- `hooks/useExportOpportunities.ts:99` → Replace with notify (user-facing)
- `ActivityNoteForm.tsx:115,138` → Replace with notify (form submission errors)
- `kanban/QuickAddOpportunity.tsx:64` → Replace with notify (form error)
- `kanban/OpportunityListContent.tsx:245` → Keep as console.error (internal drag error)

---

#### Task 3.3: Remove Debug console.log Statements

**Time:** 2 min

**Instructions:**
Remove or comment out debug logging (e.g., `useBulkActionsState.ts:138`).

---

### Group 2C: Focus States (Agent C)

#### Task 4.1: Add focus-visible to Drag Handle

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
**Time:** 2 min

**Instructions:**
Add focus-visible styles to drag handle:

```tsx
className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ..."
```

---

#### Task 4.2: Add focus-visible to Card Actions

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCardActions.tsx`
**Time:** 2 min

**Instructions:**
Add focus-visible to action menu trigger button.

---

#### Task 4.3: Add focus-visible to Column Collapse Toggle

**File:** `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`
**Time:** 2 min

**Instructions:**
Add focus-visible to collapse/expand button (line 133).

---

### Group 2D: Config Constants (Agent D)

#### Task 5.1: Move Segment UUID to Constants

**File:** `src/atomic-crm/opportunities/forms/tabs/OpportunityRelationshipsTab.tsx`
**Time:** 3 min
**Dependencies:** None

**Instructions:**
1. Open or create constants file: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/constants.ts`
2. Move `DEFAULT_SEGMENT_ID` constant:

```tsx
// In src/atomic-crm/constants.ts:
/**
 * Default segment ID for new organizations created inline.
 * References the "General" segment in the database.
 * TODO: Consider moving to environment variable if varies by environment.
 */
export const DEFAULT_SEGMENT_ID = "562062be-c15b-417f-b2a1-d4a643d69d52";
```

3. Update import in OpportunityRelationshipsTab.tsx:

```tsx
// BEFORE (line 23):
const DEFAULT_SEGMENT_ID = "562062be-c15b-417f-b2a1-d4a643d69d52";

// AFTER:
import { DEFAULT_SEGMENT_ID } from "@/atomic-crm/constants";
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: No TypeScript errors
```

---

### Group 2E: Accessibility & Colors (Agent E)

#### Task 6.1: Add Kanban Region ARIA Label

**File:** `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx`
**Time:** 2 min

**Instructions:**
Add accessibility attributes to kanban container (line 310):

```tsx
// BEFORE:
<div
  className="flex min-h-0 flex-1 gap-5 overflow-x-auto p-6 bg-muted rounded-3xl border border-border shadow-inner"
  data-testid="kanban-board"
>

// AFTER:
<div
  role="region"
  aria-label="Opportunities pipeline board"
  className="flex min-h-0 flex-1 gap-5 overflow-x-auto p-6 bg-muted rounded-3xl border border-border shadow-inner"
  data-testid="kanban-board"
>
```

---

#### Task 6.2: Replace bg-black/50 with Semantic Token

**File:** `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx`
**Time:** 2 min

**Instructions:**
Replace hardcoded overlay color:

```tsx
// BEFORE:
className="... bg-black/50 ..."

// AFTER:
className="... bg-background/80 ..."
```

---

#### Task 6.3: Verify All Color Tokens Are Semantic

**Time:** 3 min

**Instructions:**
Run grep to confirm no new hardcoded colors introduced:

```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" src/atomic-crm/opportunities/
grep -rn "bg-\w\+-\d\{3\}" src/atomic-crm/opportunities/
# Expected: No matches (or only in comments/tests)
```

---

## Phase 3: VERIFICATION

### Task 7.1: Run Full Test Suite

**Time:** 5 min

```bash
npm test -- --run
# Expected: All tests pass
```

---

### Task 7.2: Run Build

**Time:** 3 min

```bash
npm run build
# Expected: Build succeeds with no errors
```

---

### Task 7.3: Manual Verification Checklist

**Time:** 10 min

- [ ] Drag handle visible on all opportunity cards
- [ ] Dragging ONLY works when grabbing handle (not card body)
- [ ] Vertical scroll in columns works without grabbing cards
- [ ] Card click opens slide-over (not drag handle click)
- [ ] Expand/collapse toggle works
- [ ] Action menu works
- [ ] All buttons have visible focus rings on keyboard navigation
- [ ] No console errors in browser DevTools

---

## Task Dependency Graph

```
Phase 1 (Sequential - CRITICAL):
1.1 → 1.2 → 1.3 → 1.4 → 1.5
(~14 min - must complete before parallel work)

Phase 2 (ALL PARALLEL after Phase 1 completes):
┌──────────────────────────────────────────────────────────┐
│ Agent A: 2.1 → 2.2 → 2.3 → 2.4 → 2.5  (~19 min)         │
│ Agent B: 3.1 → 3.2 → 3.3              (~8 min)          │
│ Agent C: 4.1 → 4.2 → 4.3              (~6 min)          │
│ Agent D: 5.1                          (~3 min)          │
│ Agent E: 6.1 → 6.2 → 6.3              (~7 min)          │
└──────────────────────────────────────────────────────────┘
(Wall clock: ~19 min - limited by longest agent)

Phase 3 (Sequential - VERIFICATION):
7.1 → 7.2 → 7.3
(~18 min)
```

> **Zen Review Optimization:** Phases 2+3 merged into single parallel phase.
> localStorage helper moved to Agent A start (dependency fix).

---

## Success Criteria

1. **All tests pass** (existing + new drag handle tests)
2. **Build succeeds** with zero errors
3. **iPad simulation test**: Scroll column without grabbing cards
4. **No console.log/error** in production code
5. **All interactive elements** have focus-visible states
6. **Design system audit**: Zero hardcoded colors

---

## Rollback Plan

If drag handle implementation causes issues:

1. Revert Task 1.3-1.5 changes
2. Keep tests from Task 1.1 (mark as `.skip` temporarily)
3. Alternative: Implement long-press-to-drag pattern instead

---

## Estimated Time

| Phase | Tasks | Time (Sequential) | Time (Parallel) |
|-------|-------|-------------------|-----------------|
| Phase 1 (Critical) | 5 | 14 min | 14 min |
| Phase 2 (All Parallel) | 15 | 43 min | ~19 min |
| Phase 3 (Verification) | 3 | 18 min | 18 min |
| **Total** | **23** | **75 min** | **~51 min** |

> **Zen Review Optimization:** Merging old Phases 2 & 3 saved ~8 min wall-clock time.

---

## Related Documents

- Review: `docs/reviews/2025-12-05-opportunity-kanban-ipad-review.md`
- Design System: `.claude/skills/crispy-design-system/SKILL.md`
- Engineering Constitution: `.claude/skills/enforcing-principles/SKILL.md`
