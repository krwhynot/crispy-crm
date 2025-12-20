# Pipeline Phase 1 MVP - Card Redesign Implementation Plan

> **For Executing Agent:**
> 1. **FIRST:** Read `docs/claude/engineering-constitution.md`
> 2. **THEN:** Use `/atomic-crm-constitution` to verify each task
> 3. Follow tasks exactly. Do not improvise. Zero context assumed.

**Goal:** Transform existing Kanban cards from name-based to principal-centric identity with stage-specific rotting thresholds.

**Architecture:**
- Replace `ActivityPulseDot` (activity recency) with `StageStatusDot` (stage duration)
- Card layout: Principal → Distributor → Operator (no opportunity name)
- Per-stage rotting thresholds in TypeScript constants (no DB changes)
- Principal color stripe via CSS variables

**Task Granularity:** standard (5-15 min)

**Parallelization:**
- Group A (Tasks 1-3): Independent - can run simultaneously
- Group B (Tasks 4-5): Depend on Group A completion
- Group C (Tasks 6-7): Integration testing + Cleanup - can run in parallel, both depend on Group B

**Constitution Principles In Play:**
- [x] Error handling (fail fast - NO retry logic)
- [x] Validation (Zod at API boundary only) - N/A for this feature
- [x] Form state (derived from schema) - N/A for this feature
- [x] Data access (unified provider only) - using existing view fields
- [x] Types (`interface` for objects, `type` for unions)

---

## Task Dependencies

| Task | Depends On | Can Parallelize With |
|------|------------|---------------------|
| 1    | None       | 2, 3                |
| 2    | None       | 1, 3                |
| 3    | None       | 1, 2                |
| 4    | 1, 2       | 5                   |
| 5    | 3          | 4                   |
| 6    | 4, 5       | 7                   |
| 7    | 4          | 6                   |

---

## Task 1: Create Stage Threshold Constants

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Using unified data provider - N/A (constants only)
- [x] `interface` for objects, `type` for unions

**Files:**
- Create: `src/atomic-crm/opportunities/constants/stageThresholds.ts`
- Test: `src/atomic-crm/opportunities/__tests__/stageThresholds.test.ts`

### Step 1: Write the failing test

Create test file at `src/atomic-crm/opportunities/__tests__/stageThresholds.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  STAGE_ROTTING_THRESHOLDS,
  isRotting,
  getWarningThreshold,
  getStageStatus,
  type StageStatus,
} from "../constants/stageThresholds";

describe("stageThresholds", () => {
  describe("STAGE_ROTTING_THRESHOLDS", () => {
    it("defines thresholds for all 7 pipeline stages", () => {
      const stages = [
        "new_lead",
        "initial_outreach",
        "sample_visit_offered",
        "feedback_logged",
        "demo_scheduled",
        "closed_won",
        "closed_lost",
      ];
      stages.forEach((stage) => {
        expect(STAGE_ROTTING_THRESHOLDS).toHaveProperty(stage);
      });
    });

    it("returns null for closed stages", () => {
      expect(STAGE_ROTTING_THRESHOLDS.closed_won).toBeNull();
      expect(STAGE_ROTTING_THRESHOLDS.closed_lost).toBeNull();
    });

    it("has correct threshold for new_lead (7 days)", () => {
      expect(STAGE_ROTTING_THRESHOLDS.new_lead).toBe(7);
    });

    it("has correct threshold for demo_scheduled (5 days)", () => {
      expect(STAGE_ROTTING_THRESHOLDS.demo_scheduled).toBe(5);
    });
  });

  describe("isRotting", () => {
    it("returns true when days exceeds threshold", () => {
      expect(isRotting("new_lead", 8)).toBe(true);
      expect(isRotting("new_lead", 10)).toBe(true);
    });

    it("returns false when days equals threshold", () => {
      expect(isRotting("new_lead", 7)).toBe(false);
    });

    it("returns false when days below threshold", () => {
      expect(isRotting("new_lead", 5)).toBe(false);
    });

    it("returns false for closed stages", () => {
      expect(isRotting("closed_won", 100)).toBe(false);
      expect(isRotting("closed_lost", 100)).toBe(false);
    });
  });

  describe("getWarningThreshold", () => {
    it("returns 75% of rotting threshold", () => {
      // new_lead: 7 * 0.75 = 5.25 → 5
      expect(getWarningThreshold("new_lead")).toBe(5);
      // sample_visit_offered: 14 * 0.75 = 10.5 → 10
      expect(getWarningThreshold("sample_visit_offered")).toBe(10);
    });

    it("returns null for closed stages", () => {
      expect(getWarningThreshold("closed_won")).toBeNull();
      expect(getWarningThreshold("closed_lost")).toBeNull();
    });
  });

  describe("getStageStatus", () => {
    it("returns 'rotting' when over threshold", () => {
      expect(getStageStatus("new_lead", 8)).toBe("rotting");
    });

    it("returns 'expired' when close date passed", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getStageStatus("new_lead", 3, yesterday)).toBe("expired");
    });

    it("returns 'warning' when in warning zone", () => {
      // new_lead warning at 5 days (75% of 7)
      expect(getStageStatus("new_lead", 6)).toBe("warning");
    });

    it("returns 'healthy' when below warning", () => {
      expect(getStageStatus("new_lead", 3)).toBe("healthy");
    });

    it("returns 'closed' for closed stages", () => {
      expect(getStageStatus("closed_won", 100)).toBe("closed");
      expect(getStageStatus("closed_lost", 50)).toBe("closed");
    });

    it("prioritizes expired over rotting", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      // Both rotting AND expired - should show expired (more urgent)
      expect(getStageStatus("new_lead", 100, yesterday)).toBe("expired");
    });
  });
});
```

### Step 2: Verify test fails

```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/stageThresholds.test.ts
```

**Expected output:** Test fails with "Cannot find module '../constants/stageThresholds'"

### Step 3: Implement minimal code

Create `src/atomic-crm/opportunities/constants/stageThresholds.ts`:

```typescript
/**
 * Per-stage rotting thresholds for the opportunity pipeline
 *
 * PRD Reference: Pipeline PRD Section "Stage Configuration"
 * - Thresholds define when an opportunity is "stuck" in a stage
 * - Closed stages (won/lost) have no rotting threshold (null)
 *
 * WARNING: Do NOT add retry/backoff logic. These are simple lookups.
 */

import type { OpportunityStageValue } from "@/atomic-crm/validation/opportunities";

/**
 * Days before an opportunity is considered "rotting" in each stage.
 * null = no rotting (closed stages)
 */
export const STAGE_ROTTING_THRESHOLDS: Record<OpportunityStageValue, number | null> = {
  new_lead: 7,
  initial_outreach: 10,
  sample_visit_offered: 14,
  feedback_logged: 7,
  demo_scheduled: 5,
  closed_won: null,
  closed_lost: null,
};

/**
 * Status indicator for stage health
 * Order matters for priority: rotting/expired > warning > healthy > closed
 */
export type StageStatus = "rotting" | "expired" | "warning" | "healthy" | "closed";

/**
 * Check if an opportunity is rotting (over threshold for its stage)
 *
 * @param stage - Current pipeline stage
 * @param daysInStage - Number of days in current stage
 * @returns true if rotting, false otherwise
 */
export function isRotting(stage: string, daysInStage: number): boolean {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];
  return threshold !== null && daysInStage > threshold;
}

/**
 * Get warning threshold (75% of rotting threshold)
 *
 * @param stage - Current pipeline stage
 * @returns Warning threshold in days, or null for closed stages
 */
export function getWarningThreshold(stage: string): number | null {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];
  return threshold !== null ? Math.floor(threshold * 0.75) : null;
}

/**
 * Determine stage status for visual indicators
 *
 * Priority order (first match wins):
 * 1. closed - Closed stages never rot
 * 2. expired - Past expected close date (most urgent)
 * 3. rotting - Over stage threshold
 * 4. warning - 75%+ of threshold
 * 5. healthy - Below warning threshold
 *
 * @param stage - Current pipeline stage
 * @param daysInStage - Number of days in current stage
 * @param expectedCloseDate - Optional expected close date
 * @returns StageStatus for visual indicator
 */
export function getStageStatus(
  stage: string,
  daysInStage: number,
  expectedCloseDate?: Date | null
): StageStatus {
  // Closed stages are never rotting
  if (stage === "closed_won" || stage === "closed_lost") {
    return "closed";
  }

  // Expired close date takes priority
  if (expectedCloseDate && expectedCloseDate < new Date()) {
    return "expired";
  }

  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];

  // No threshold defined (shouldn't happen for open stages)
  if (threshold === null) {
    return "healthy";
  }

  // Rotting: over threshold
  if (daysInStage > threshold) {
    return "rotting";
  }

  // Warning: 75%+ of threshold
  const warningThreshold = Math.floor(threshold * 0.75);
  if (daysInStage > warningThreshold) {
    return "warning";
  }

  return "healthy";
}
```

### Step 4: Verify test passes

```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/stageThresholds.test.ts
```

**Expected output:** All tests pass

### Step 5: Constitution compliance check

- [x] No retry logic or circuit breakers
- [x] Simple pure functions with no side effects
- [x] TypeScript `type` for union (`StageStatus`)
- [x] Proper JSDoc comments

### Step 6: Commit (DO NOT PUSH)

```bash
git add src/atomic-crm/opportunities/constants/stageThresholds.ts
git add src/atomic-crm/opportunities/__tests__/stageThresholds.test.ts
git commit -m "feat(pipeline): add per-stage rotting thresholds

- Create stageThresholds.ts with STAGE_ROTTING_THRESHOLDS constant
- Add isRotting(), getWarningThreshold(), getStageStatus() helpers
- Different thresholds per stage (7-14 days) vs old single 14-day constant
- Add comprehensive unit tests

PRD Reference: Pipeline Phase 1 MVP

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create StageStatusDot Component

**Depends on:** None - can start immediately (parallel with Task 1)

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Using semantic colors from design system
- [x] `interface` for props, `type` for status union

**Files:**
- Create: `src/atomic-crm/opportunities/kanban/StageStatusDot.tsx`
- Test: `src/atomic-crm/opportunities/kanban/__tests__/StageStatusDot.test.tsx`

### Step 1: Write the failing test

Create test file at `src/atomic-crm/opportunities/kanban/__tests__/StageStatusDot.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StageStatusDot } from "../StageStatusDot";

describe("StageStatusDot", () => {
  it("renders with accessible role", () => {
    render(<StageStatusDot status="healthy" daysInStage={3} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays days in stage text", () => {
    render(<StageStatusDot status="healthy" daysInStage={5} />);
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("renders red dot for rotting status", () => {
    render(<StageStatusDot status="rotting" daysInStage={15} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-destructive");
  });

  it("renders red dot for expired status", () => {
    render(<StageStatusDot status="expired" daysInStage={5} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-destructive");
  });

  it("renders yellow dot for warning status", () => {
    render(<StageStatusDot status="warning" daysInStage={6} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-warning");
  });

  it("renders green dot for healthy status", () => {
    render(<StageStatusDot status="healthy" daysInStage={2} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-success");
  });

  it("renders gray dot for closed status", () => {
    render(<StageStatusDot status="closed" daysInStage={100} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-muted-foreground");
  });

  it("has appropriate aria-label for screen readers", () => {
    render(<StageStatusDot status="rotting" daysInStage={12} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", expect.stringContaining("12 days"));
  });

  it("shows singular 'day' for 1 day", () => {
    render(<StageStatusDot status="healthy" daysInStage={1} />);
    expect(screen.getByText("1 day")).toBeInTheDocument();
  });
});
```

### Step 2: Verify test fails

```bash
npm test -- --run src/atomic-crm/opportunities/kanban/__tests__/StageStatusDot.test.tsx
```

**Expected output:** Test fails with "Cannot find module '../StageStatusDot'"

### Step 3: Implement minimal code

Create `src/atomic-crm/opportunities/kanban/StageStatusDot.tsx`:

```typescript
import React from "react";
import type { StageStatus } from "../constants/stageThresholds";

interface StageStatusDotProps {
  /** Status derived from getStageStatus() */
  status: StageStatus;
  /** Number of days in current stage */
  daysInStage: number;
}

/**
 * StageStatusDot - Visual indicator for opportunity stage health
 *
 * Replaces ActivityPulseDot with stage-duration-based status:
 * - Red (destructive): Rotting or expired close date
 * - Yellow (warning): 75%+ of threshold
 * - Green (success): Healthy
 * - Gray (muted): Closed stages
 *
 * PRD Reference: Pipeline PRD "Status Indicator Logic" table
 */
export function StageStatusDot({ status, daysInStage }: StageStatusDotProps) {
  const { colorClass, label } = getStatusConfig(status, daysInStage);

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center gap-1.5 text-xs"
    >
      <span
        data-testid="status-dot"
        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`}
      />
      <span className="text-muted-foreground">
        {daysInStage} {daysInStage === 1 ? "day" : "days"}
      </span>
    </span>
  );
}

function getStatusConfig(
  status: StageStatus,
  daysInStage: number
): { colorClass: string; label: string } {
  const dayText = `${daysInStage} ${daysInStage === 1 ? "day" : "days"} in stage`;

  switch (status) {
    case "rotting":
      return {
        colorClass: "bg-destructive",
        label: `${dayText} - needs attention`,
      };
    case "expired":
      return {
        colorClass: "bg-destructive",
        label: `${dayText} - close date passed`,
      };
    case "warning":
      return {
        colorClass: "bg-warning",
        label: `${dayText} - approaching threshold`,
      };
    case "healthy":
      return {
        colorClass: "bg-success",
        label: `${dayText} - on track`,
      };
    case "closed":
      return {
        colorClass: "bg-muted-foreground",
        label: `${dayText} - closed`,
      };
  }
}
```

### Step 4: Verify test passes

```bash
npm test -- --run src/atomic-crm/opportunities/kanban/__tests__/StageStatusDot.test.tsx
```

**Expected output:** All tests pass

### Step 5: Constitution compliance check

- [x] No retry logic or circuit breakers
- [x] Uses semantic colors (`bg-destructive`, `bg-warning`, `bg-success`)
- [x] Proper accessibility (`role="status"`, `aria-label`)
- [x] `interface` for props

### Step 6: Commit (DO NOT PUSH)

```bash
git add src/atomic-crm/opportunities/kanban/StageStatusDot.tsx
git add src/atomic-crm/opportunities/kanban/__tests__/StageStatusDot.test.tsx
git commit -m "feat(pipeline): add StageStatusDot component

- Create StageStatusDot to replace ActivityPulseDot
- Stage-duration-based status (not activity recency)
- Uses semantic colors: destructive/warning/success/muted
- Accessible with role='status' and aria-label

PRD Reference: Pipeline Phase 1 MVP

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Principal Color CSS Variables

**Depends on:** None - can start immediately (parallel with Tasks 1, 2)

**Constitution Check:**
- [x] Using semantic CSS variables (not hex codes)
- [x] OKLCH color format for consistency with design system

**Files:**
- Modify: `src/index.css` (add after line ~720, after tag colors)
- Test: Visual verification (CSS variables don't have unit tests)

### Step 1: Read current CSS file location

The principal colors section should be added after the tag colors section (around line 720).

### Step 2: Add principal color CSS variables

Add the following to `src/index.css` in the `:root` section, after the tag color definitions (around line ~720):

```css
  /* ========================================
     PRINCIPAL BRAND COLORS
     ========================================

     Used for card left-border stripes in Kanban view.
     Each principal gets a unique OKLCH color.
     Hue rotation ensures visual distinction.

     PRD Reference: Pipeline PRD "Principal Color Mapping"
  */

  /* McCRUM - Forest green (brand-adjacent) */
  --principal-mccrum: oklch(45% 0.12 142);

  /* SWAP - Clay/terracotta (accent family) */
  --principal-swap: oklch(55% 0.10 72);

  /* Rapid Rasoi - Blue-violet (distinct) */
  --principal-rapid-rasoi: oklch(50% 0.11 280);

  /* Bake'n Joy - Golden amber */
  --principal-bakenjoy: oklch(60% 0.13 85);

  /* Idahoan - Sage green */
  --principal-idahoan: oklch(52% 0.08 150);

  /* Kettle Cuisine - Deep teal */
  --principal-kettle-cuisine: oklch(48% 0.09 200);

  /* Rich Products - Warm brown */
  --principal-rich-products: oklch(45% 0.08 60);

  /* Simplot - Blue */
  --principal-simplot: oklch(50% 0.10 250);

  /* Tyson - Red-orange */
  --principal-tyson: oklch(55% 0.14 30);

  /* Fallback for unknown principals */
  --principal-default: var(--muted);
```

### Step 3: Verify changes work

Open browser DevTools and verify:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--principal-mccrum')
// Should return an oklch color value
```

### Step 4: Constitution compliance check

- [x] Using OKLCH format (design system standard)
- [x] Semantic variable naming (`--principal-*`)
- [x] No hex codes
- [x] Fallback to semantic token (`--muted`)

### Step 5: Commit (DO NOT PUSH)

```bash
git add src/index.css
git commit -m "style(pipeline): add principal brand color CSS variables

- Add 9 principal colors using OKLCH format
- Hue rotation for visual distinction between principals
- Fallback to --muted for unknown principals
- Used for Kanban card left-border stripes

PRD Reference: Pipeline Phase 1 MVP

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Refactor OpportunityCard Layout

**Depends on:** Task 1 (stageThresholds), Task 2 (StageStatusDot)

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Using semantic colors only
- [x] Data from existing view fields (unified provider)

**Files:**
- Modify: `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
- Modify: `src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx`

### Step 1: Write the failing test

Update `src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx` to add new tests:

```typescript
// Add these tests to existing test file

describe("OpportunityCard - Principal-Centric Layout", () => {
  const mockOpportunity = {
    id: 1,
    name: "Test Deal",
    stage: "new_lead",
    days_in_stage: 5,
    estimated_close_date: "2026-01-15",
    principal_organization_name: "McCRUM",
    distributor_organization_name: "Sysco Foods",
    customer_organization_name: "Chili's Corporate",
    contact_ids: [],
  };

  it("displays principal name prominently", () => {
    render(
      <DndContext>
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>
      </DndContext>
    );
    expect(screen.getByText("McCRUM")).toBeInTheDocument();
  });

  it("displays distributor name", () => {
    render(
      <DndContext>
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>
      </DndContext>
    );
    expect(screen.getByText("Sysco Foods")).toBeInTheDocument();
  });

  it("displays operator (customer) name", () => {
    render(
      <DndContext>
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>
      </DndContext>
    );
    expect(screen.getByText("Chili's Corporate")).toBeInTheDocument();
  });

  it("does NOT display opportunity name", () => {
    render(
      <DndContext>
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>
      </DndContext>
    );
    // The name should not appear in the collapsed card
    expect(screen.queryByText("Test Deal")).not.toBeInTheDocument();
  });

  it("shows StageStatusDot instead of ActivityPulseDot", () => {
    render(
      <DndContext>
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>
      </DndContext>
    );
    // Should show days in stage, not activity recency
    expect(screen.getByText(/5 days/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has principal color stripe on left border", () => {
    render(
      <DndContext>
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>
      </DndContext>
    );
    const card = screen.getByTestId("opportunity-card");
    expect(card).toHaveClass("border-l-4");
  });

  it("does not have expand/collapse toggle", () => {
    render(
      <DndContext>
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>
      </DndContext>
    );
    expect(screen.queryByLabelText(/expand/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/collapse/i)).not.toBeInTheDocument();
  });
});
```

### Step 2: Verify test fails

```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
```

**Expected output:** Tests fail (old layout still in place)

### Step 3: Implement card refactor

Replace the content of `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`:

```typescript
import React from "react";
import { useRecordContext } from "react-admin";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { OpportunityCardActions } from "./OpportunityCardActions";
import { StageStatusDot } from "./StageStatusDot";
import { getStageStatus } from "../constants/stageThresholds";
import type { Opportunity } from "../../types";
import { parseDateSafely } from "@/lib/date-utils";

interface OpportunityCardProps {
  index: number;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  onDelete?: (opportunityId: number) => void;
}

/**
 * OpportunityCard - Principal-centric Kanban card
 *
 * PRD Reference: Pipeline PRD "Opportunity Card Design"
 *
 * Layout (no expand/collapse):
 * ┌────────────────────────────────────┐
 * │ ████ McCRUM                     ⋯ │  ← Principal + color stripe + actions
 * │ Sysco Foods                       │  ← Distributor
 * │ Chili's Corporate                 │  ← Operator (customer)
 * │ 🔴 12 days                        │  ← Days in stage + status dot
 * └────────────────────────────────────┘
 */
export const OpportunityCard = React.memo(function OpportunityCard({
  index,
  openSlideOver,
  onDelete,
}: OpportunityCardProps) {
  const record = useRecordContext<Opportunity>();

  if (!record) return null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open slide-over if not clicking on action buttons or drag handle
    if (
      (e.target as HTMLElement).closest("[data-action-button]") ||
      (e.target as HTMLElement).closest("[data-drag-handle]")
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openSlideOver(record.id as number, "view");
  };

  // Stage status calculation
  const daysInStage = record.days_in_stage || 0;
  const expectedCloseDate = record.estimated_close_date
    ? parseDateSafely(record.estimated_close_date)
    : null;
  const stageStatus = getStageStatus(record.stage, daysInStage, expectedCloseDate);

  // Principal color stripe
  const principalSlug = record.principal_organization_name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <Draggable draggableId={String(record.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick(e as unknown as React.MouseEvent);
            }
          }}
          className={`
            bg-card rounded-lg border border-border border-l-4
            p-3 space-y-1
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            cursor-pointer
            ${snapshot.isDragging ? "opacity-50 rotate-2" : "opacity-100"}
          `}
          style={{
            borderLeftColor: principalSlug
              ? `var(--principal-${principalSlug}, var(--muted))`
              : "var(--muted)",
          }}
          data-testid="opportunity-card"
          data-tutorial="opp-card"
        >
          {/* Row 1: Drag Handle + Principal + Actions */}
          <div className="flex items-center gap-1.5">
            {/* Drag handle - 44px touch target (WCAG AA) */}
            <div
              {...provided.dragHandleProps}
              data-testid="drag-handle"
              data-drag-handle
              aria-label="Drag to reorder"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-grab active:cursor-grabbing transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 -ml-1"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Principal name (primary identifier) */}
            <h3 className="font-semibold text-base text-foreground flex-1 min-w-0 truncate">
              {record.principal_organization_name || "No Principal"}
            </h3>

            {/* Actions menu */}
            <OpportunityCardActions opportunityId={record.id as number} onDelete={onDelete} />
          </div>

          {/* Row 2: Distributor */}
          <p className="text-sm text-muted-foreground truncate pl-10">
            {record.distributor_organization_name || "No Distributor"}
          </p>

          {/* Row 3: Operator (Customer) */}
          <p className="text-sm text-muted-foreground truncate pl-10">
            {record.customer_organization_name || "No Operator"}
          </p>

          {/* Row 4: Stage Status (days + dot) */}
          <div className="pl-10">
            <StageStatusDot status={stageStatus} daysInStage={daysInStage} />
          </div>
        </div>
      )}
    </Draggable>
  );
});
```

### Step 4: Verify test passes

```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
```

**Expected output:** All tests pass

### Step 5: Update kanban index exports

Update `src/atomic-crm/opportunities/kanban/index.ts` to export the new component:

```typescript
// Add to existing exports
export { StageStatusDot } from "./StageStatusDot";
```

### Step 6: Constitution compliance check

- [x] No retry logic or circuit breakers
- [x] Uses semantic colors via CSS variables
- [x] Data from existing view fields (no new queries)
- [x] Proper accessibility (role, aria-label, tabIndex)

### Step 7: Commit (DO NOT PUSH)

```bash
git add src/atomic-crm/opportunities/kanban/OpportunityCard.tsx
git add src/atomic-crm/opportunities/kanban/index.ts
git add src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
git commit -m "refactor(pipeline): principal-centric card layout

- Replace opportunity name with Principal → Distributor → Operator
- Replace ActivityPulseDot with StageStatusDot
- Remove expand/collapse toggle (always show 4 fields)
- Add principal color stripe on left border
- Keep drag handle and actions menu

BREAKING: Cards no longer show opportunity.name

PRD Reference: Pipeline Phase 1 MVP

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Add Status-Based Card Sorting

**Depends on:** Task 3 (stageThresholds for status calculation)

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Pure sorting logic (no side effects)

**Files:**
- Modify: `src/atomic-crm/opportunities/constants/stages.ts`
- Test: `src/atomic-crm/opportunities/__tests__/stages.test.ts`

### Step 1: Write the failing test

Create or update `src/atomic-crm/opportunities/__tests__/stages.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getOpportunitiesByStage, sortOpportunitiesByStatus } from "../constants/stages";
import type { Opportunity } from "../../types";

describe("sortOpportunitiesByStatus", () => {
  const createOpp = (
    id: number,
    stage: string,
    daysInStage: number,
    estimatedCloseDate?: string
  ): Opportunity =>
    ({
      id,
      stage,
      days_in_stage: daysInStage,
      estimated_close_date: estimatedCloseDate,
      principal_organization_name: `Principal ${id}`,
    }) as Opportunity;

  it("sorts rotting opportunities to the top", () => {
    const opps = [
      createOpp(1, "new_lead", 3), // healthy
      createOpp(2, "new_lead", 10), // rotting (>7)
      createOpp(3, "new_lead", 5), // healthy
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // Rotting first
  });

  it("sorts expired before rotting", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const opps = [
      createOpp(1, "new_lead", 10), // rotting
      createOpp(2, "new_lead", 3, yesterday.toISOString()), // expired
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // Expired first
  });

  it("sorts warning after red (rotting/expired)", () => {
    const opps = [
      createOpp(1, "new_lead", 6), // warning (>5.25)
      createOpp(2, "new_lead", 10), // rotting
      createOpp(3, "new_lead", 2), // healthy
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // Rotting first
    expect(sorted[1].id).toBe(1); // Warning second
    expect(sorted[2].id).toBe(3); // Healthy last
  });

  it("sorts by days_in_stage descending within same status", () => {
    const opps = [
      createOpp(1, "new_lead", 8), // rotting
      createOpp(2, "new_lead", 12), // rotting (more days)
      createOpp(3, "new_lead", 9), // rotting
    ];

    const sorted = sortOpportunitiesByStatus(opps);
    expect(sorted[0].id).toBe(2); // 12 days
    expect(sorted[1].id).toBe(3); // 9 days
    expect(sorted[2].id).toBe(1); // 8 days
  });
});
```

### Step 2: Verify test fails

```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/stages.test.ts
```

**Expected output:** Test fails (function doesn't exist)

### Step 3: Implement sorting logic

**IMPORTANT:** This task REPLACES the existing `stages.ts` file entirely. The current file sorts by `created_at` - we're changing to status-based sorting.

Replace the entire contents of `src/atomic-crm/opportunities/constants/stages.ts`:

```typescript
import type { Opportunity } from "../../types";
import { OPPORTUNITY_STAGES } from "./stageConstants";
import { getStageStatus, type StageStatus } from "./stageThresholds";
import { parseDateSafely } from "@/lib/date-utils";

export type OpportunitiesByStage = Record<Opportunity["stage"], Opportunity[]>;

/**
 * Status priority for sorting (lower = higher priority = shown first)
 *
 * PRD Reference: Pipeline PRD "Card Sorting Within Columns"
 */
const STATUS_PRIORITY: Record<StageStatus, number> = {
  expired: 0,   // Most urgent - past close date
  rotting: 1,   // Over threshold
  warning: 2,   // Approaching threshold
  healthy: 3,   // On track
  closed: 4,    // Completed
};

/**
 * Sort opportunities by status priority, then by days in stage descending
 *
 * PRD Reference: Pipeline PRD "Card Sorting Within Columns"
 * 1. Red (rotting/expired) - top of column
 * 2. Yellow (warning) - middle
 * 3. Green (healthy) - bottom
 * 4. Within each group: Sort by days_in_stage descending (oldest first)
 *
 * @param opportunities - Array of opportunities to sort
 * @returns Sorted array (new array, does not mutate input)
 */
export function sortOpportunitiesByStatus(opportunities: Opportunity[]): Opportunity[] {
  return [...opportunities].sort((a, b) => {
    const aCloseDate = a.estimated_close_date
      ? parseDateSafely(a.estimated_close_date)
      : null;
    const bCloseDate = b.estimated_close_date
      ? parseDateSafely(b.estimated_close_date)
      : null;

    const aStatus = getStageStatus(a.stage, a.days_in_stage || 0, aCloseDate);
    const bStatus = getStageStatus(b.stage, b.days_in_stage || 0, bCloseDate);

    const aPriority = STATUS_PRIORITY[aStatus];
    const bPriority = STATUS_PRIORITY[bStatus];

    // Primary sort: by status priority (red before yellow before green)
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Secondary sort: by days in stage descending (oldest first)
    return (b.days_in_stage || 0) - (a.days_in_stage || 0);
  });
}

/**
 * Get opportunities grouped by stage with status-based sorting
 *
 * CHANGED: Now applies status-based sorting instead of created_at sorting.
 * Red/rotting opportunities appear at top of each column.
 */
export const getOpportunitiesByStage = (
  unorderedOpportunities: Opportunity[],
  opportunityStages?: { value: string; label: string }[]
): OpportunitiesByStage => {
  // Use centralized stages if no stages provided
  const stages =
    opportunityStages ||
    OPPORTUNITY_STAGES.map((stage) => ({
      value: stage.value,
      label: stage.label,
    }));

  if (!stages.length) return {} as OpportunitiesByStage;

  const opportunitiesByStage: Record<Opportunity["stage"], Opportunity[]> =
    unorderedOpportunities.reduce(
      (acc, opportunity) => {
        if (acc[opportunity.stage]) {
          acc[opportunity.stage].push(opportunity);
        }
        return acc;
      },
      stages.reduce(
        (obj, stage) => ({ ...obj, [stage.value]: [] }),
        {} as Record<Opportunity["stage"], Opportunity[]>
      )
    );

  // CHANGED: Sort each column by status priority (red first, then yellow, then green)
  // Previously sorted by created_at DESC
  stages.forEach((stage) => {
    if (opportunitiesByStage[stage.value]) {
      opportunitiesByStage[stage.value] = sortOpportunitiesByStatus(
        opportunitiesByStage[stage.value]
      );
    }
  });

  return opportunitiesByStage;
};
```

### Step 4: Verify test passes

```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/stages.test.ts
```

**Expected output:** All tests pass

### Step 5: Constitution compliance check

- [x] No retry logic or circuit breakers
- [x] Pure functions (no side effects)
- [x] Returns new array (immutable)

### Step 6: Commit (DO NOT PUSH)

```bash
git add src/atomic-crm/opportunities/constants/stages.ts
git add src/atomic-crm/opportunities/__tests__/stages.test.ts
git commit -m "feat(pipeline): add status-based card sorting within columns

- Add sortOpportunitiesByStatus() function
- Red (rotting/expired) cards sort to top
- Yellow (warning) cards in middle
- Green (healthy) cards at bottom
- Within same status: oldest first (days_in_stage desc)

PRD Reference: Pipeline Phase 1 MVP

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Integration Testing

**Depends on:** All prior tasks (4, 5)

**Constitution Check:**
- [x] Verify all acceptance criteria from PRD

**Files:**
- Test: `src/atomic-crm/opportunities/__tests__/OpportunityPipeline.integration.test.tsx`

### Step 1: Write integration test

Create `src/atomic-crm/opportunities/__tests__/OpportunityPipeline.integration.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AdminContext, RecordContextProvider } from "react-admin";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { OpportunityCard } from "../kanban/OpportunityCard";
import { sortOpportunitiesByStatus } from "../constants/stages";
import type { Opportunity } from "../../types";

// Mock data provider
const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AdminContext dataProvider={mockDataProvider}>
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test-column">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  </AdminContext>
);

describe("Pipeline Phase 1 MVP - Integration Tests", () => {
  describe("Acceptance Criteria: Principal-Centric Cards", () => {
    const mockOpportunity: Opportunity = {
      id: 1,
      name: "Hidden Deal Name",
      stage: "new_lead",
      days_in_stage: 5,
      estimated_close_date: "2026-01-15",
      principal_organization_name: "McCRUM",
      distributor_organization_name: "Sysco Foods",
      customer_organization_name: "Chili's Corporate",
      contact_ids: [],
      status: "active",
      priority: "medium",
      description: "",
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
      stage_manual: false,
      status_manual: false,
    } as Opportunity;

    it("AC1: Cards show Principal/Distributor/Operator (no name)", () => {
      render(
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>,
        { wrapper }
      );

      // Should show principal-centric identity
      expect(screen.getByText("McCRUM")).toBeInTheDocument();
      expect(screen.getByText("Sysco Foods")).toBeInTheDocument();
      expect(screen.getByText("Chili's Corporate")).toBeInTheDocument();

      // Should NOT show opportunity name
      expect(screen.queryByText("Hidden Deal Name")).not.toBeInTheDocument();
    });

    it("AC2: Status dot reflects stage-specific thresholds", () => {
      // new_lead threshold is 7 days
      const rottingOpp = { ...mockOpportunity, days_in_stage: 10 };

      render(
        <RecordContextProvider value={rottingOpp}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>,
        { wrapper }
      );

      const statusDot = screen.getByTestId("status-dot");
      expect(statusDot).toHaveClass("bg-destructive");
    });

    it("AC3: Principal color stripe visible on left edge", () => {
      render(
        <RecordContextProvider value={mockOpportunity}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>,
        { wrapper }
      );

      const card = screen.getByTestId("opportunity-card");
      expect(card).toHaveClass("border-l-4");
      // CSS variable is applied via style attribute
      expect(card).toHaveStyle({ borderLeftColor: expect.stringContaining("--principal-mccrum") });
    });

    it("AC4: Red cards sort to top of each column", () => {
      const opps: Opportunity[] = [
        { ...mockOpportunity, id: 1, days_in_stage: 3 }, // healthy
        { ...mockOpportunity, id: 2, days_in_stage: 10 }, // rotting
        { ...mockOpportunity, id: 3, days_in_stage: 6 }, // warning
      ];

      const sorted = sortOpportunitiesByStatus(opps);

      expect(sorted[0].id).toBe(2); // Rotting first
      expect(sorted[1].id).toBe(3); // Warning second
      expect(sorted[2].id).toBe(1); // Healthy last
    });
  });

  describe("Per-Stage Thresholds", () => {
    const baseOpp: Opportunity = {
      id: 1,
      name: "Test",
      stage: "new_lead",
      days_in_stage: 0,
      contact_ids: [],
      status: "active",
      priority: "medium",
      description: "",
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
      stage_manual: false,
      status_manual: false,
    } as Opportunity;

    it("new_lead threshold is 7 days", () => {
      const healthy = { ...baseOpp, stage: "new_lead", days_in_stage: 6 };
      const rotting = { ...baseOpp, stage: "new_lead", days_in_stage: 8 };

      render(
        <RecordContextProvider value={healthy}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>,
        { wrapper }
      );
      expect(screen.getByTestId("status-dot")).toHaveClass("bg-success");

      // Re-render with rotting opportunity
      render(
        <RecordContextProvider value={rotting}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>,
        { wrapper }
      );
      expect(screen.getAllByTestId("status-dot")[1]).toHaveClass("bg-destructive");
    });

    it("demo_scheduled threshold is 5 days (most urgent)", () => {
      const rotting = { ...baseOpp, stage: "demo_scheduled", days_in_stage: 6 };

      render(
        <RecordContextProvider value={rotting}>
          <OpportunityCard index={0} openSlideOver={vi.fn()} />
        </RecordContextProvider>,
        { wrapper }
      );
      expect(screen.getByTestId("status-dot")).toHaveClass("bg-destructive");
    });
  });
});
```

### Step 2: Run integration tests

```bash
npm test -- --run src/atomic-crm/opportunities/__tests__/OpportunityPipeline.integration.test.tsx
```

**Expected output:** All tests pass

### Step 3: Run full test suite

```bash
npm test -- --run
```

**Expected output:** All tests pass, no regressions

### Step 4: Manual verification

Start the dev server and verify:

```bash
npm run dev
```

1. Navigate to Opportunities page
2. Verify cards show Principal → Distributor → Operator
3. Verify status dots reflect correct colors
4. Verify red cards appear at top of columns
5. Verify principal color stripes on left edge

### Step 5: Commit (DO NOT PUSH)

```bash
git add src/atomic-crm/opportunities/__tests__/OpportunityPipeline.integration.test.tsx
git commit -m "test(pipeline): add integration tests for Phase 1 MVP

- Test all 4 acceptance criteria from PRD
- Test per-stage threshold behavior
- Verify principal-centric card layout
- Verify status-based sorting

PRD Reference: Pipeline Phase 1 MVP

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Final Integration

After all tasks complete:

### Squash commits (optional)

```bash
git rebase -i HEAD~7
# Mark all but first as 'squash'
```

### Push to remote

```bash
git push origin feature/pipeline-phase1-mvp
```

### Create PR

```bash
gh pr create --title "feat(pipeline): Phase 1 MVP - Principal-centric cards" --body "## Summary
- Cards now show Principal → Distributor → Operator (no opportunity name)
- Per-stage rotting thresholds (7-14 days) instead of single 14-day constant
- Status dot reflects stage duration, not activity recency
- Principal color stripe on left edge of cards
- Red/rotting cards sort to top of columns

## Acceptance Criteria
- [x] Cards show Principal/Distributor/Operator (no name)
- [x] Status dot reflects stage-specific thresholds
- [x] Principal color stripe visible on left edge
- [x] Red cards sort to top of each column

## Test Plan
- [x] Unit tests for stageThresholds
- [x] Unit tests for StageStatusDot
- [x] Unit tests for OpportunityCard
- [x] Unit tests for sorting logic
- [x] Integration tests for full flow

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Task 7: Cleanup Deprecated Code

**Depends on:** Task 4 (card refactor must be complete)

**Can parallelize with:** Task 6 (integration testing)

**Constitution Check:**
- [x] Boy Scout Rule - leave code cleaner than you found it
- [x] No retry logic / circuit breakers
- [x] Remove unused code completely (no commented-out code)

**Files:**
- Delete: `src/atomic-crm/opportunities/kanban/ActivityPulseDot.tsx`
- Delete: `src/atomic-crm/opportunities/kanban/__tests__/ActivityPulseDot.test.tsx`
- Modify: `src/atomic-crm/opportunities/hooks/useStageMetrics.ts` (remove STUCK_THRESHOLD_DAYS)
- Modify: `src/atomic-crm/opportunities/kanban/index.ts` (update exports)

### Step 1: Verify ActivityPulseDot is no longer imported

Run grep to confirm no remaining imports:

```bash
grep -r "ActivityPulseDot" --include="*.tsx" --include="*.ts" src/
```

**Expected output:** Only `ActivityPulseDot.tsx` and its test file should appear. No other files should import it.

If other files still import it, **STOP** and fix those files first.

### Step 2: Delete ActivityPulseDot component

```bash
rm src/atomic-crm/opportunities/kanban/ActivityPulseDot.tsx
```

### Step 3: Delete ActivityPulseDot test file

```bash
rm src/atomic-crm/opportunities/kanban/__tests__/ActivityPulseDot.test.tsx
```

### Step 4: Remove STUCK_THRESHOLD_DAYS from useStageMetrics

Edit `src/atomic-crm/opportunities/hooks/useStageMetrics.ts`:

**Find and remove:**
```typescript
// DELETE THIS CONSTANT - now using per-stage thresholds in stageThresholds.ts
export const STUCK_THRESHOLD_DAYS = 14;
```

**Also remove any references to STUCK_THRESHOLD_DAYS** in the same file. The hook may use it for `isStuck` calculations - those should now use `getStageStatus()` from `stageThresholds.ts` instead.

If `useStageMetrics` uses `STUCK_THRESHOLD_DAYS`:
```typescript
// BEFORE (REMOVE)
const isStuck = daysInStage > STUCK_THRESHOLD_DAYS;

// AFTER (REPLACE WITH)
import { getStageStatus } from "../constants/stageThresholds";
const status = getStageStatus(stage, daysInStage);
const isStuck = status === "rotting" || status === "expired";
```

### Step 5: Update kanban index exports

Edit `src/atomic-crm/opportunities/kanban/index.ts`:

**Remove:**
```typescript
export { ActivityPulseDot } from "./ActivityPulseDot";
```

**Keep (should already be added by Task 4):**
```typescript
export { StageStatusDot } from "./StageStatusDot";
```

### Step 6: Verify no broken imports

```bash
npm run build
```

**Expected output:** Build succeeds with no errors

### Step 7: Run tests to confirm no regressions

```bash
npm test -- --run
```

**Expected output:** All tests pass. If any tests fail due to missing `STUCK_THRESHOLD_DAYS`, update them to use the new `stageThresholds` functions.

### Step 8: Constitution compliance check

- [x] Removed unused code completely (no commented-out code)
- [x] No retry logic added
- [x] Exports updated correctly
- [x] Build passes
- [x] Tests pass

### Step 9: Commit (DO NOT PUSH)

```bash
git add -A
git commit -m "chore(pipeline): cleanup deprecated ActivityPulseDot and STUCK_THRESHOLD_DAYS

- Delete ActivityPulseDot component (replaced by StageStatusDot)
- Delete ActivityPulseDot test file
- Remove STUCK_THRESHOLD_DAYS constant (replaced by per-stage thresholds)
- Update kanban index exports

BREAKING: STUCK_THRESHOLD_DAYS is no longer exported from useStageMetrics.
Use getStageStatus() from stageThresholds.ts instead.

PRD Reference: Pipeline Phase 1 MVP

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Rollback Plan

If issues arise:

```bash
# Revert to previous commit
git revert HEAD~7..HEAD

# Or revert specific commit
git revert <commit-sha>
```

Key files that can be reverted independently:
- `OpportunityCard.tsx` - core card layout
- `stageThresholds.ts` - threshold constants
- `StageStatusDot.tsx` - status indicator
- `src/index.css` - principal colors (CSS-only)
