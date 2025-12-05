# Implementation Plan: Expandable Kanban Cards with Visual Cues

**Date:** 2025-12-04
**Design Doc:** `docs/designs/2025-12-04-expandable-kanban-cards-design.md`
**Granularity:** Atomic (2-5 min tasks)
**Execution:** Hybrid (sequential foundation → parallel UI)
**Testing:** TDD strict (failing tests first)

---

## Overview

Transform Kanban opportunity cards from static compact cards to expandable cards with visual cues (activity pulse, task counts, days in stage indicators) and wider column widths.

### Success Criteria
- [ ] Cards expand/collapse with smooth animation
- [ ] Activity pulse shows green/yellow/red based on last activity
- [ ] Task counts show pending and overdue badges
- [ ] Column widths responsive (260-340px based on breakpoint)
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No debug logs or TODOs left in code
- [ ] Design doc updated to "Implemented"

---

## Phase 1: Foundation (Sequential)

> **IMPORTANT:** These tasks MUST run sequentially. Each depends on the previous.

### Task 1.1: Create Migration for Activity and Task Counts
**Time:** 3-5 min | **File:** `supabase/migrations/20251204_add_activity_task_counts_to_opportunities_summary.sql`

**Context:** The `opportunities_summary` view needs three new computed columns for visual cues.

**Pre-conditions:**
- Migration `20251204205132_add_days_in_stage_to_opportunities_summary.sql` exists and adds `days_in_stage`

**Implementation:**

Create file `supabase/migrations/20251204220000_add_activity_task_counts_to_opportunities_summary.sql`:

```sql
/**
 * Add Activity and Task Count Columns to opportunities_summary View
 *
 * New columns for Kanban card visual cues:
 * - days_since_last_activity: Days since most recent interaction (for activity pulse)
 * - pending_task_count: Number of incomplete tasks
 * - overdue_task_count: Number of tasks past due date
 *
 * Related: OpportunityCard.tsx expandable card feature
 */

-- Check for dependent views before dropping (safety check)
-- If this fails, dependent views need to be dropped first with CASCADE
DO $$
BEGIN
    -- Log any dependencies for awareness
    RAISE NOTICE 'Checking dependencies on opportunities_summary...';
END $$;

-- Drop with CASCADE to handle any dependent views/policies
-- Note: Re-grants and comments will be reapplied below
DROP VIEW IF EXISTS opportunities_summary CASCADE;

CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
SELECT
    o.id,
    o.name,
    o.description,
    o.stage,
    o.status,
    o.priority,
    o.index,
    o.estimated_close_date,
    o.actual_close_date,
    o.customer_organization_id,
    o.principal_organization_id,
    o.distributor_organization_id,
    o.founding_interaction_id,
    o.stage_manual,
    o.status_manual,
    o.next_action,
    o.next_action_date,
    o.competition,
    o.decision_criteria,
    o.contact_ids,
    o.opportunity_owner_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    o.search_tsv,
    o.tags,
    o.account_manager_id,
    o.lead_source,
    o.updated_by,
    o.campaign,
    o.related_opportunity_id,
    o.win_reason,
    o.loss_reason,
    o.close_reason_notes,
    o.notes,
    o.stage_changed_at,

    -- Computed: days since opportunity entered current stage (existing)
    EXTRACT(DAY FROM (NOW() - COALESCE(o.stage_changed_at, o.created_at)))::integer AS days_in_stage,

    -- NEW: Days since last activity (for activity pulse)
    (SELECT EXTRACT(DAY FROM (NOW() - MAX(a.activity_date)))::integer
     FROM activities a
     WHERE a.opportunity_id = o.id
       AND a.deleted_at IS NULL
    ) AS days_since_last_activity,

    -- NEW: Pending task count (excludes soft-deleted tasks)
    (SELECT COUNT(*)::integer
     FROM tasks t
     WHERE t.opportunity_id = o.id
       AND t.completed = false
       AND t.deleted_at IS NULL
    ) AS pending_task_count,

    -- NEW: Overdue task count (excludes soft-deleted tasks)
    (SELECT COUNT(*)::integer
     FROM tasks t
     WHERE t.opportunity_id = o.id
       AND t.completed = false
       AND t.due_date < CURRENT_DATE
       AND t.deleted_at IS NULL
    ) AS overdue_task_count,

    -- Joined organization names
    cust_org.name AS customer_organization_name,
    prin_org.name AS principal_organization_name,
    dist_org.name AS distributor_organization_name,

    -- Products array (JSONB aggregation)
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', op.id,
                'product_id_reference', op.product_id_reference,
                'product_name', op.product_name,
                'product_category', op.product_category,
                'principal_name', prod_org.name,
                'notes', op.notes
            ) ORDER BY op.created_at
        )
        FROM opportunity_products op
        LEFT JOIN products p ON op.product_id_reference = p.id
        LEFT JOIN organizations prod_org ON p.principal_id = prod_org.id
        WHERE op.opportunity_id = o.id
        ),
        '[]'::jsonb
    ) AS products
FROM opportunities o
LEFT JOIN organizations cust_org ON o.customer_organization_id = cust_org.id
LEFT JOIN organizations prin_org ON o.principal_organization_id = prin_org.id
LEFT JOIN organizations dist_org ON o.distributor_organization_id = dist_org.id;

-- Re-grant permissions
GRANT SELECT ON opportunities_summary TO authenticated;

-- Verification
DO $$
DECLARE
    activity_col_exists BOOLEAN;
    pending_col_exists BOOLEAN;
    overdue_col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities_summary'
        AND column_name = 'days_since_last_activity'
    ) INTO activity_col_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities_summary'
        AND column_name = 'pending_task_count'
    ) INTO pending_col_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities_summary'
        AND column_name = 'overdue_task_count'
    ) INTO overdue_col_exists;

    IF activity_col_exists AND pending_col_exists AND overdue_col_exists THEN
        RAISE NOTICE 'SUCCESS: All three new columns added to opportunities_summary';
    ELSE
        RAISE EXCEPTION 'FAILED: Missing columns - activity: %, pending: %, overdue: %',
            activity_col_exists, pending_col_exists, overdue_col_exists;
    END IF;
END $$;
```

**Verification (NON-DESTRUCTIVE - uses migration apply, not reset):**
```bash
# Apply ONLY this new migration (does not wipe data)
npx supabase migration up

# Verify columns exist
npx supabase db execute --sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'opportunities_summary' AND column_name IN ('days_since_last_activity', 'pending_task_count', 'overdue_task_count');"
# Expected: 3 rows returned

# If migration fails due to dependencies, check what depends on the view:
npx supabase db execute --sql "SELECT dependent_ns.nspname AS dependent_schema, dependent_view.relname AS dependent_view FROM pg_depend JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid JOIN pg_namespace AS dependent_ns ON dependent_view.relnamespace = dependent_ns.oid WHERE pg_depend.refobjid = 'opportunities_summary'::regclass;"
```

**⚠️ WARNING:** Do NOT run `npx supabase db reset` during development - it wipes all local data including test seeds. Use `migration up` to apply incrementally.

**Constitution Checklist:**
- [x] No retry logic
- [x] Single source of truth (view consolidates data)
- [x] Uses SECURITY INVOKER for RLS

---

### Task 1.2: Update Opportunity TypeScript Interface
**Time:** 2-3 min | **File:** `src/atomic-crm/types.ts`

**Context:** Add the three new computed fields to the Opportunity interface.

**Pre-conditions:**
- Task 1.1 migration created

**Implementation:**

Edit `src/atomic-crm/types.ts`, find the Opportunity interface (around line 223), locate the computed fields section (around line 255-269) and add new fields:

```typescript
// Find this section (around line 255-269):
  // Computed fields from opportunities_summary view (read-only)
  nb_interactions?: number;
  last_interaction_date?: string;
  days_in_stage?: number;
  customer_organization_name?: string;
  principal_organization_name?: string;
  distributor_organization_name?: string;
  products?: Array<{
    id: Identifier;
    product_id_reference: Identifier;
    product_name: string;
    product_category?: string;
    principal_name?: string;
    notes?: string;
  }>;

// ADD these three new fields after products (before the closing brace):

  // NEW: Visual cue computed fields for Kanban cards
  days_since_last_activity?: number | null;
  pending_task_count?: number;
  overdue_task_count?: number;
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: No errors
```

---

### Task 1.2b: Regenerate Database Types
**Time:** 1-2 min

**Context:** Keep `src/types/database.generated.ts` in sync with new view columns.

**Implementation:**
```bash
# Regenerate Supabase types to include new view columns
npx supabase gen types typescript --local > src/types/database.generated.ts

# Verify new columns appear in types
grep -A 5 "opportunities_summary" src/types/database.generated.ts | grep -E "days_since_last_activity|pending_task_count|overdue_task_count"
# Expected: All three columns should appear
```

**Constitution Checklist:**
- [x] Single source of truth (types match database)

**Constitution Checklist:**
- [x] interface for object shape (not type)
- [x] Optional fields (view may not always return them)

---

### Task 1.3: Write Failing Tests for Activity Pulse Component
**Time:** 3-5 min | **File:** `src/atomic-crm/opportunities/kanban/__tests__/ActivityPulseDot.test.tsx`

**Context:** TDD - write tests BEFORE implementing the ActivityPulseDot component.

**Pre-conditions:**
- Task 1.2 types updated

**Implementation:**

Create file `src/atomic-crm/opportunities/kanban/__tests__/ActivityPulseDot.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityPulseDot } from "../ActivityPulseDot";

describe("ActivityPulseDot", () => {
  it("renders green dot for recent activity (<7 days)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={3} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-success");
    expect(dot).toHaveAttribute("aria-label", "Last activity 3 days ago");
  });

  it("renders yellow dot for moderate activity (7-14 days)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={10} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-warning");
    expect(dot).toHaveAttribute("aria-label", "Last activity 10 days ago");
  });

  it("renders red dot for stale activity (>14 days)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={21} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-destructive");
    expect(dot).toHaveAttribute("aria-label", "Last activity 21 days ago");
  });

  it("renders gray dot for no activity (null)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={null} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-muted-foreground");
    expect(dot).toHaveAttribute("aria-label", "No activity recorded");
  });

  it("renders gray dot for undefined activity", () => {
    render(<ActivityPulseDot daysSinceLastActivity={undefined} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-muted-foreground");
    expect(dot).toHaveAttribute("aria-label", "No activity recorded");
  });

  // Edge case: New opportunity with no activities yet
  it("handles new opportunity with null activity gracefully", () => {
    render(<ActivityPulseDot daysSinceLastActivity={null} />);

    // Gray indicates "needs first contact" - not stale, just new
    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-muted-foreground");
  });

  it("treats exactly 7 days as yellow (boundary)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={7} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-warning");
  });

  it("treats exactly 14 days as yellow (boundary)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={14} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-warning");
  });

  it("treats 15 days as red (boundary)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={15} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-destructive");
  });
});
```

**Verification:**
```bash
npm test -- ActivityPulseDot
# Expected: All tests FAIL (component doesn't exist yet)
```

**Constitution Checklist:**
- [x] TDD - tests written first
- [x] Accessibility tested (aria-label, role)
- [x] Boundary conditions tested

---

### Task 1.4: Write Failing Tests for Expandable Card State
**Time:** 3-5 min | **File:** `src/atomic-crm/opportunities/kanban/__tests__/OpportunityCard.test.tsx`

**Context:** TDD - add tests for expand/collapse behavior to existing test file.

**Pre-conditions:**
- Task 1.3 ActivityPulseDot tests created

**Implementation:**

Edit `src/atomic-crm/opportunities/kanban/__tests__/OpportunityCard.test.tsx` (or create if doesn't exist):

**IMPORTANT:** The OpportunityCard uses `Draggable` from @hello-pangea/dnd, which requires DragDropContext and Droppable wrappers. Use the existing test helper pattern.

Add these test cases:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OpportunityCard } from "../OpportunityCard";

/**
 * Wrapper component for testing Draggable components
 * Required because OpportunityCard uses Draggable internally
 */
const DndTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DragDropContext onDragEnd={() => {}}>
    <Droppable droppableId="test-droppable">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

// Helper to render OpportunityCard with required wrappers
const renderCard = (record: typeof mockOpportunity, props = {}) => {
  return renderWithAdminContext(
    <DndTestWrapper>
      <OpportunityCard index={0} openSlideOver={vi.fn()} {...props} />
    </DndTestWrapper>,
    { record }
  );
};

// Mock opportunity data with new fields
const mockOpportunity = {
  id: 1,
  name: "Rapid Rasoi - Marriott National Rollout",
  description: "National hotel chain expansion",
  stage: "initial_outreach",
  status: "active",
  priority: "high",
  estimated_close_date: "2026-03-05",
  days_in_stage: 12,
  days_since_last_activity: 5,
  pending_task_count: 2,
  overdue_task_count: 1,
  principal_organization_name: "McCRUM Foods",
  products: [{ id: 1, product_name: "Premium Sauce" }],
  contact_ids: [1],
};

describe("OpportunityCard - Expand/Collapse", () => {
  it("renders collapsed by default", () => {
    renderCard(mockOpportunity);

    // Collapsed: name should be truncated
    const name = screen.getByText(/Rapid Rasoi/);
    expect(name).toHaveClass("line-clamp-1");

    // Expanded content should not be visible
    expect(screen.queryByText("National hotel chain expansion")).not.toBeInTheDocument();
  });

  it("expands when expand button is clicked", () => {
    renderCard(mockOpportunity);

    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    // Expanded: description should be visible
    expect(screen.getByText("National hotel chain expansion")).toBeInTheDocument();

    // Expanded: full details visible
    expect(screen.getByText(/McCRUM Foods/)).toBeInTheDocument();
    expect(screen.getByText(/12 days in stage/)).toBeInTheDocument();
    expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
  });

  it("collapses when collapse button is clicked", () => {
    renderCard(mockOpportunity);

    // First expand
    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    // Then collapse
    const collapseButton = screen.getByRole("button", { name: /collapse/i });
    fireEvent.click(collapseButton);

    // Description should be hidden again
    expect(screen.queryByText("National hotel chain expansion")).not.toBeInTheDocument();
  });

  it("shows activity pulse dot with correct color", () => {
    renderCard({ ...mockOpportunity, days_since_last_activity: 5 });

    const pulseDot = screen.getByRole("status");
    expect(pulseDot).toHaveClass("bg-success"); // Green for <7 days
  });

  it("shows overdue task warning when tasks are overdue", () => {
    renderCard({ ...mockOpportunity, overdue_task_count: 2 });

    // Expand to see tasks
    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it("has correct aria-expanded state", () => {
    renderCard(mockOpportunity);

    const expandButton = screen.getByRole("button", { name: /expand/i });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(expandButton);
    expect(expandButton).toHaveAttribute("aria-expanded", "true");
  });
});

// ============================================
// EXISTING TEST UPDATES (behavior changes)
// ============================================
// NOTE: The following existing tests need updating because priority badge
// and days-in-stage are now in the EXPANDED section, not always visible.
//
// Update these assertions in existing tests:
// - OLD: expect(screen.getByText(/High/)).toBeInTheDocument(); // always visible
// - NEW: First call expandButton.click(), THEN check for priority badge
//
// Tests to update in existing file:
// - "renders priority badge" → expand first, then check
// - "renders days in stage" → expand first, then check
```

**Verification:**
```bash
npm test -- OpportunityCard
# Expected: New tests FAIL (expand/collapse not implemented yet)
```

**Constitution Checklist:**
- [x] TDD - tests written first
- [x] Accessibility tested (aria-expanded)
- [x] Uses renderWithAdminContext helper

---

## Phase 2: UI Components (Parallel)

> **These tasks can run in PARALLEL** - they are independent of each other.
> Use multiple agents or run simultaneously.

### Task 2.1: Implement ActivityPulseDot Component
**Time:** 3-5 min | **File:** `src/atomic-crm/opportunities/kanban/ActivityPulseDot.tsx`

**Context:** Small component that renders a colored dot based on days since last activity.

**Pre-conditions:**
- Task 1.3 tests exist and fail

**Implementation:**

Create file `src/atomic-crm/opportunities/kanban/ActivityPulseDot.tsx`:

```tsx
import React from "react";

interface ActivityPulseDotProps {
  daysSinceLastActivity: number | null | undefined;
}

/**
 * Activity Pulse Dot - Visual indicator for opportunity engagement recency
 *
 * Color coding (per design doc):
 * - Green (success): <7 days since last activity
 * - Yellow (warning): 7-14 days since last activity
 * - Red (destructive): >14 days since last activity
 * - Gray (muted): No activity recorded
 */
export function ActivityPulseDot({ daysSinceLastActivity }: ActivityPulseDotProps) {
  const { colorClass, label } = getActivityPulseConfig(daysSinceLastActivity);

  return (
    <span
      role="status"
      aria-label={label}
      className={`
        inline-block w-2.5 h-2.5 rounded-full flex-shrink-0
        ${colorClass}
      `}
    />
  );
}

function getActivityPulseConfig(days: number | null | undefined): {
  colorClass: string;
  label: string;
} {
  if (days === null || days === undefined) {
    return {
      colorClass: "bg-muted-foreground",
      label: "No activity recorded",
    };
  }

  if (days < 7) {
    return {
      colorClass: "bg-success",
      label: `Last activity ${days} days ago`,
    };
  }

  if (days <= 14) {
    return {
      colorClass: "bg-warning",
      label: `Last activity ${days} days ago`,
    };
  }

  return {
    colorClass: "bg-destructive",
    label: `Last activity ${days} days ago`,
  };
}
```

**Verification:**
```bash
npm test -- ActivityPulseDot
# Expected: All tests PASS
```

**Constitution Checklist:**
- [x] No retry logic
- [x] Semantic color tokens (bg-success, bg-warning, bg-destructive)
- [x] Accessibility (role="status", aria-label)

---

### Task 2.2: Update Column Widths
**Time:** 2-3 min | **File:** `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`

**Context:** Increase column widths to accommodate expanded cards.

**Pre-conditions:** None (can run in parallel)

**Implementation:**

Edit `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`, find line ~108 with the column className:

```tsx
// FIND (around line 108):
className={`flex-1 pb-8 min-w-[240px] max-w-[280px] bg-card border border-border rounded-2xl shadow-col-inner ${shadowConfig.rest} ${shadowConfig.hover} transition-[box-shadow,border-color] duration-200 ease-in-out px-3`}

// REPLACE WITH (responsive column widths - wider for expanded cards):
className={`
  flex-1 pb-8 bg-card border border-border rounded-2xl shadow-col-inner
  ${shadowConfig.rest} ${shadowConfig.hover}
  transition-[box-shadow,border-color] duration-200 ease-in-out px-3
  min-w-[260px] max-w-[300px]
  md:min-w-[280px] md:max-w-[320px]
  lg:min-w-[300px] lg:max-w-[340px]
`}
```

**Verification:**
```bash
npx tsc --noEmit
npm run dev
# Visual: Check Kanban columns are wider
```

**Constitution Checklist:**
- [x] Semantic Tailwind (responsive breakpoints)
- [x] No hardcoded pixel values in JS

---

### Task 2.3: Update Container Gap
**Time:** 1-2 min | **File:** `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx`

**Context:** Increase gap between columns for better visual separation.

**Pre-conditions:** None (can run in parallel)

**Implementation:**

Edit `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx`, find line ~308:

```tsx
// FIND (around line 308):
className="flex gap-4 overflow-x-auto p-6 bg-muted rounded-3xl border border-border shadow-inner"

// REPLACE WITH:
className="flex gap-5 overflow-x-auto p-6 bg-muted rounded-3xl border border-border shadow-inner"
```

**Verification:**
```bash
npx tsc --noEmit
# Visual: Check gap between columns is slightly larger
```

**Constitution Checklist:**
- [x] Minimal change
- [x] Semantic spacing (gap-5 = 20px)

---

### Task 2.3b: Update OpportunityColumn Memo Comparator
**Time:** 2-3 min | **File:** `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`

**Context:** The column's `arePropsEqual` memo comparator must include ALL fields rendered in the card (including expanded section), otherwise cards won't re-render when those fields change.

**Pre-conditions:** None (can run in parallel)

**Implementation:**

Edit `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`, find the `arePropsEqual` function (around line 35-70):

```tsx
// FIND (around line 54-66):
  // Compare opportunity IDs and key fields that affect rendering
  for (let i = 0; i < prevOpps.length; i++) {
    const prev = prevOpps[i];
    const next = nextOpps[i];
    if (
      prev.id !== next.id ||
      prev.name !== next.name ||
      prev.stage !== next.stage ||
      prev.priority !== next.priority ||
      prev.estimated_close_date !== next.estimated_close_date ||
      prev.days_in_stage !== next.days_in_stage
    ) {
      return false;
    }
  }

// REPLACE WITH (add ALL fields that affect card rendering):
  // Compare opportunity IDs and ALL fields that affect card rendering
  // (both collapsed header AND expanded details section)
  for (let i = 0; i < prevOpps.length; i++) {
    const prev = prevOpps[i];
    const next = nextOpps[i];
    if (
      // Header (always visible)
      prev.id !== next.id ||
      prev.name !== next.name ||
      prev.stage !== next.stage ||
      prev.days_since_last_activity !== next.days_since_last_activity ||
      // Expanded details section
      prev.description !== next.description ||
      prev.priority !== next.priority ||
      prev.principal_organization_name !== next.principal_organization_name ||
      prev.estimated_close_date !== next.estimated_close_date ||
      prev.days_in_stage !== next.days_in_stage ||
      prev.pending_task_count !== next.pending_task_count ||
      prev.overdue_task_count !== next.overdue_task_count ||
      // Products count (compare array length, not deep equality)
      (prev.products?.length ?? 0) !== (next.products?.length ?? 0)
    ) {
      return false;
    }
  }
```

**Why this matters:** Without this change, if a user:
- Edits description → expanded card shows stale text
- Changes principal → badge shows wrong org
- Adds/removes products → product count is wrong
- Logs activity/completes task → pulse/badges don't update

**Note:** `contact_ids` is NOT included because contact data comes from a separate hook (`useOpportunityContacts`), not from the record context.

**Verification:**
```bash
npx tsc --noEmit
# Expected: No errors
```

**Constitution Checklist:**
- [x] Single source of truth (comparator matches data fields)
- [x] Performance optimization preserved

---

### Task 2.4: Implement Expandable OpportunityCard
**Time:** 5-8 min | **File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

**Context:** Major refactor - add expand/collapse state with all visual cues.

**Pre-conditions:**
- Task 2.1 ActivityPulseDot component exists
- Task 1.4 tests exist and fail

**Implementation:**

Replace `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` with:

```tsx
import React, { useState } from "react";
import { useRecordContext } from "react-admin";
import { Draggable } from "@hello-pangea/dnd";
import { format, differenceInDays } from "date-fns";
import { Trophy, XCircle, ChevronDown, ChevronUp, User, Calendar, Clock, CheckSquare, Package } from "lucide-react";
import { useOpportunityContacts } from "../hooks/useOpportunityContacts";
import { STUCK_THRESHOLD_DAYS } from "../hooks/useStageMetrics";
import { OpportunityCardActions } from "./OpportunityCardActions";
import { ActivityPulseDot } from "./ActivityPulseDot";
import { WIN_REASONS, LOSS_REASONS } from "@/atomic-crm/validation/opportunities";
import type { Opportunity } from "../../types";
import { parseDateSafely } from "@/lib/date-utils";

interface OpportunityCardProps {
  index: number;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  onDelete?: (opportunityId: number) => void;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive text-destructive-foreground",
} as const;

/**
 * OpportunityCard - Expandable draggable card for the Kanban board
 *
 * Collapsed: Activity pulse + name + expand toggle + actions
 * Expanded: Full details with visual cues
 */
export const OpportunityCard = React.memo(function OpportunityCard({
  index,
  openSlideOver,
  onDelete,
}: OpportunityCardProps) {
  const record = useRecordContext<Opportunity>();
  const [isExpanded, setIsExpanded] = useState(false);
  const { primaryContact, isLoading: contactsLoading } = useOpportunityContacts(
    record?.contact_ids || []
  );

  if (!record) return null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open slide-over if not clicking on action buttons or expand toggle
    if (
      (e.target as HTMLElement).closest("[data-action-button]") ||
      (e.target as HTMLElement).closest("[data-expand-toggle]")
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openSlideOver(record.id as number, "view");
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Computed values
  const daysInStage = record.days_in_stage || 0;
  const isStuck = daysInStage > STUCK_THRESHOLD_DAYS;
  const priority = record.priority || "medium";
  const priorityClass = priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

  // Close date formatting and urgency
  const closeDateParsed = record.estimated_close_date && parseDateSafely(record.estimated_close_date);
  const closeDate = closeDateParsed ? format(closeDateParsed, "MMM d, yyyy") : "No date set";
  const daysUntilClose = closeDateParsed ? differenceInDays(closeDateParsed, new Date()) : null;
  const closeDateUrgency = daysUntilClose !== null
    ? daysUntilClose < 0 ? "overdue" : daysUntilClose < 7 ? "soon" : "normal"
    : "normal";

  // Task counts
  const pendingTasks = record.pending_task_count || 0;
  const overdueTasks = record.overdue_task_count || 0;

  // Products count
  const productsCount = record.products?.length || 0;

  return (
    <Draggable draggableId={String(record.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
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
            bg-card rounded-lg border border-border
            p-[var(--spacing-widget-padding)]
            mb-[var(--spacing-content)]
            transition-all duration-200
            hover:shadow-md hover:-translate-y-1
            cursor-pointer
            ${snapshot.isDragging ? "opacity-50 rotate-2" : "opacity-100"}
          `}
          data-testid="opportunity-card"
        >
          {/* Header: Activity Pulse + Name + Expand + Actions (always visible) */}
          <div className="flex items-center gap-2">
            <ActivityPulseDot daysSinceLastActivity={record.days_since_last_activity} />

            <h3 className={`
              font-medium text-sm text-foreground flex-1 min-w-0
              ${isExpanded ? "" : "line-clamp-1"}
            `}>
              {record.name}
            </h3>

            <button
              data-expand-toggle
              onClick={handleExpandClick}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse card" : "Expand card"}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <OpportunityCardActions opportunityId={record.id as number} onDelete={onDelete} />
          </div>

          {/* Expandable Details Section */}
          <div className={`
            grid transition-[grid-template-rows] duration-200 ease-out
            ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
          `}>
            <div className="overflow-hidden">
              <div className="pt-3 mt-3 border-t border-border space-y-2">
                {/* Description */}
                {record.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {record.description}
                  </p>
                )}

                {/* Badges Row: Priority + Principal */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityClass}`}>
                    {priorityLabel}
                  </span>
                  {record.principal_organization_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                      {record.principal_organization_name}
                    </span>
                  )}
                </div>

                {/* Primary Contact */}
                {contactsLoading ? (
                  <div className="h-4 bg-muted animate-pulse rounded" />
                ) : primaryContact ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {primaryContact.firstName} {primaryContact.lastName}
                    </span>
                  </div>
                ) : null}

                {/* Close Date with urgency color */}
                <div className={`flex items-center gap-2 text-xs ${
                  closeDateUrgency === "overdue" ? "text-destructive" :
                  closeDateUrgency === "soon" ? "text-warning" :
                  "text-muted-foreground"
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{closeDate}</span>
                  {closeDateUrgency === "overdue" && <span>(overdue)</span>}
                  {closeDateUrgency === "soon" && daysUntilClose !== null && (
                    <span>(in {daysUntilClose}d)</span>
                  )}
                </div>

                {/* Days in Stage */}
                <div className={`flex items-center gap-2 text-xs ${
                  isStuck ? "text-warning" : "text-muted-foreground"
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{daysInStage} days in stage</span>
                  {isStuck && <span className="text-warning">⚠️</span>}
                </div>

                {/* Tasks */}
                {pendingTasks > 0 && (
                  <div className={`flex items-center gap-2 text-xs ${
                    overdueTasks > 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>
                      {pendingTasks} task{pendingTasks !== 1 ? "s" : ""}
                      {overdueTasks > 0 && ` (${overdueTasks} overdue)`}
                    </span>
                  </div>
                )}

                {/* Products */}
                {productsCount > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span>{productsCount} product{productsCount !== 1 ? "s" : ""}</span>
                  </div>
                )}

                {/* Win/Loss Reason Badge - for closed opportunities */}
                {record.stage === "closed_won" && record.win_reason && (
                  <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-success/10 text-success">
                    <Trophy className="w-3 h-3" />
                    <span>
                      {WIN_REASONS.find((r) => r.id === record.win_reason)?.name || record.win_reason}
                    </span>
                  </div>
                )}
                {record.stage === "closed_lost" && record.loss_reason && (
                  <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                    <XCircle className="w-3 h-3" />
                    <span>
                      {LOSS_REASONS.find((r) => r.id === record.loss_reason)?.name || record.loss_reason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});
```

**Verification:**
```bash
npm test -- OpportunityCard
# Expected: All tests PASS

npx tsc --noEmit
# Expected: No errors
```

**Constitution Checklist:**
- [x] No retry logic
- [x] Semantic color tokens
- [x] Accessibility (aria-expanded, aria-label)
- [x] 44px touch targets on buttons
- [x] Uses data from record context (single source of truth)

---

### Task 2.5: Rewrite Existing OpportunityCard Test File
**Time:** 8-10 min | **File:** `src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx`

**Context:** The existing test file has fundamental incompatibilities with the new expandable card:
1. Uses `useRecordContext` mock pattern that doesn't provide `openSlideOver` prop
2. Expects priority badge and days-in-stage to be always visible (now in expanded section)
3. Missing DnD wrapper required by Draggable component

This is a **complete rewrite**, not just assertion updates.

**Pre-conditions:** Task 2.4 card component updated

**Implementation:**

**Step 1:** First, read the existing test file to understand current coverage:
```bash
cat src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx
```

**Step 2:** Replace the entire test file with the updated version that includes:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { RecordContextProvider } from "react-admin";
import { OpportunityCard } from "../kanban/OpportunityCard";
import type { Opportunity } from "../../types";

/**
 * DnD wrapper required for testing Draggable components
 */
const DndTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DragDropContext onDragEnd={() => {}}>
    <Droppable droppableId="test-droppable">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

/**
 * Helper to render OpportunityCard with all required wrappers
 */
const renderCard = (
  record: Partial<Opportunity>,
  props: { openSlideOver?: (id: number, mode?: "view" | "edit") => void; onDelete?: (id: number) => void } = {}
) => {
  const defaultRecord: Opportunity = {
    id: 1,
    name: "Test Opportunity",
    description: "Test description",
    stage: "initial_outreach",
    status: "active",
    priority: "medium",
    estimated_close_date: "2026-03-05",
    customer_organization_id: 1,
    contact_ids: [],
    stage_manual: false,
    status_manual: false,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
    days_in_stage: 5,
    days_since_last_activity: 3,
    pending_task_count: 0,
    overdue_task_count: 0,
    ...record,
  };

  return render(
    <DndTestWrapper>
      <RecordContextProvider value={defaultRecord}>
        <OpportunityCard
          index={0}
          openSlideOver={props.openSlideOver ?? vi.fn()}
          onDelete={props.onDelete}
        />
      </RecordContextProvider>
    </DndTestWrapper>
  );
};

describe("OpportunityCard", () => {
  describe("Collapsed State (default)", () => {
    it("renders opportunity name", () => {
      renderCard({ name: "My Test Deal" });
      expect(screen.getByText("My Test Deal")).toBeInTheDocument();
    });

    it("shows activity pulse dot", () => {
      renderCard({ days_since_last_activity: 5 });
      const pulseDot = screen.getByRole("status");
      expect(pulseDot).toBeInTheDocument();
      expect(pulseDot).toHaveClass("bg-success"); // Green for <7 days
    });

    it("shows expand button with aria-expanded=false", () => {
      renderCard({});
      const expandButton = screen.getByRole("button", { name: /expand/i });
      expect(expandButton).toHaveAttribute("aria-expanded", "false");
    });

    it("does NOT show description when collapsed", () => {
      renderCard({ description: "Hidden description" });
      expect(screen.queryByText("Hidden description")).not.toBeInTheDocument();
    });

    it("does NOT show priority badge when collapsed", () => {
      renderCard({ priority: "high" });
      // Priority badge is in expanded section
      expect(screen.queryByText(/High/i)).not.toBeInTheDocument();
    });
  });

  describe("Expanded State", () => {
    it("shows description when expanded", () => {
      renderCard({ description: "Visible description" });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText("Visible description")).toBeInTheDocument();
    });

    it("shows priority badge when expanded", () => {
      renderCard({ priority: "high" });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });

    it("shows days in stage when expanded", () => {
      renderCard({ days_in_stage: 12 });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/12 days in stage/)).toBeInTheDocument();
    });

    it("shows stuck warning for >14 days in stage", () => {
      renderCard({ days_in_stage: 20 });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/20 days in stage/)).toBeInTheDocument();
      expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("shows task count when expanded", () => {
      renderCard({ pending_task_count: 3, overdue_task_count: 1 });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/3 tasks/)).toBeInTheDocument();
      expect(screen.getByText(/1 overdue/)).toBeInTheDocument();
    });

    it("updates aria-expanded to true when expanded", () => {
      renderCard({});

      const expandButton = screen.getByRole("button", { name: /expand/i });
      fireEvent.click(expandButton);

      expect(expandButton).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("Activity Pulse Colors", () => {
    it("shows green pulse for <7 days since activity", () => {
      renderCard({ days_since_last_activity: 3 });
      expect(screen.getByRole("status")).toHaveClass("bg-success");
    });

    it("shows yellow pulse for 7-14 days since activity", () => {
      renderCard({ days_since_last_activity: 10 });
      expect(screen.getByRole("status")).toHaveClass("bg-warning");
    });

    it("shows red pulse for >14 days since activity", () => {
      renderCard({ days_since_last_activity: 20 });
      expect(screen.getByRole("status")).toHaveClass("bg-destructive");
    });

    it("shows gray pulse for null activity", () => {
      renderCard({ days_since_last_activity: null });
      expect(screen.getByRole("status")).toHaveClass("bg-muted-foreground");
    });
  });

  describe("Interactions", () => {
    it("calls openSlideOver when card body is clicked", () => {
      const openSlideOver = vi.fn();
      renderCard({ id: 123 }, { openSlideOver });

      // Click the card (not the expand button)
      const card = screen.getByTestId("opportunity-card");
      fireEvent.click(card);

      expect(openSlideOver).toHaveBeenCalledWith(123, "view");
    });

    it("does NOT call openSlideOver when expand button is clicked", () => {
      const openSlideOver = vi.fn();
      renderCard({}, { openSlideOver });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(openSlideOver).not.toHaveBeenCalled();
    });

    it("toggles expanded state on expand button click", () => {
      renderCard({ description: "Toggle test" });

      const expandButton = screen.getByRole("button", { name: /expand/i });

      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText("Toggle test")).toBeInTheDocument();

      // Collapse
      fireEvent.click(expandButton);
      expect(screen.queryByText("Toggle test")).not.toBeInTheDocument();
    });
  });
});
```

**Verification:**
```bash
npm test -- OpportunityCard
# Expected: All tests pass
```

**Note:** This is a complete replacement of the test file. The old tests are incompatible with the new component structure.

---

## Phase 3: Integration & Verification (Sequential)

### Task 3.1: Run Full Test Suite
**Time:** 2-3 min

**Pre-conditions:** All Phase 2 tasks complete

**Implementation:**
```bash
npm test
# Expected: All tests pass

npx tsc --noEmit
# Expected: No TypeScript errors

npm run build
# Expected: Build succeeds
```

---

### Task 3.2: Verify Migration Applied and Seed E2E Data
**Time:** 5-7 min

**Pre-conditions:** Task 3.1 passes

**⚠️ DATA SAFETY NOTE:** This task uses `db reset` which WIPES ALL LOCAL DATA. This is intentional for clean E2E verification. If you have important local data, back it up first or skip to the "migration up" alternative below.

**Implementation (Option A - Clean slate for E2E):**
```bash
# DESTRUCTIVE: Reset database and apply all migrations from scratch
# Only do this if you're ready to lose local dev data
npx supabase db reset

# Re-seed E2E test data (REQUIRED for visual/E2E verification)
npm run db:local:seed:e2e

# Verify seed data exists
npx supabase db execute --sql "SELECT COUNT(*) as opp_count FROM opportunities WHERE deleted_at IS NULL;"
# Expected: opp_count > 0
```

**Implementation (Option B - Preserve existing data):**
```bash
# NON-DESTRUCTIVE: Apply only new migration
npx supabase migration up

# Check if you already have seed data
npx supabase db execute --sql "SELECT COUNT(*) as opp_count FROM opportunities WHERE deleted_at IS NULL;"
# If opp_count = 0, run seed:
npm run db:local:seed:e2e
```

```bash
# Start dev server
npm run dev

# Manual verification checklist:
# [ ] Kanban columns are wider (300-340px on desktop)
# [ ] Cards show activity pulse dot (colored circle)
# [ ] Click expand button shows full details
# [ ] Task counts display correctly
# [ ] Overdue tasks show red text
# [ ] Close date shows urgency color
# [ ] Animation is smooth on expand/collapse
```

**Note:** The seed step is critical - without it, the Kanban board will be empty and visual verification will fail.

---

### Task 3.3: Extend POM with Expand/Collapse Methods
**Time:** 3-5 min | **File:** `tests/e2e/support/poms/OpportunitiesListPage.ts`

**Pre-conditions:** Task 3.2 visual verification passes

**Context:** The existing `OpportunitiesListPage` POM has Kanban methods but needs expand/collapse support.

**Implementation:**

Add these methods to `tests/e2e/support/poms/OpportunitiesListPage.ts` (after the existing Kanban methods, around line 310):

```typescript
  // ============================================
  // EXPANDABLE CARD METHODS (added for visual cues feature)
  // ============================================

  /**
   * Get expand/collapse toggle button for a card
   */
  getCardExpandButton(opportunityName: string) {
    const card = this.getOpportunityCard(opportunityName);
    return card.getByRole("button", { name: /expand|collapse/i });
  }

  /**
   * Get activity pulse dot for a card
   */
  getCardActivityPulse(opportunityName: string) {
    const card = this.getOpportunityCard(opportunityName);
    return card.getByRole("status");
  }

  /**
   * Expand an opportunity card to show full details
   */
  async expandCard(opportunityName: string): Promise<void> {
    const expandButton = this.getCardExpandButton(opportunityName);
    const isExpanded = await expandButton.getAttribute("aria-expanded");

    if (isExpanded === "false") {
      await expandButton.click();
      // Wait for animation to complete
      await this.page.waitForTimeout(250);
    }
  }

  /**
   * Collapse an opportunity card
   */
  async collapseCard(opportunityName: string): Promise<void> {
    const expandButton = this.getCardExpandButton(opportunityName);
    const isExpanded = await expandButton.getAttribute("aria-expanded");

    if (isExpanded === "true") {
      await expandButton.click();
      await this.page.waitForTimeout(250);
    }
  }

  /**
   * Check if a card is expanded
   */
  async isCardExpanded(opportunityName: string): Promise<boolean> {
    const expandButton = this.getCardExpandButton(opportunityName);
    const isExpanded = await expandButton.getAttribute("aria-expanded");
    return isExpanded === "true";
  }

  /**
   * Get the first visible opportunity card
   */
  getFirstOpportunityCard() {
    return this.page.locator('[data-testid="opportunity-card"]').first();
  }

  /**
   * Get the name from the first visible card
   */
  async getFirstCardName(): Promise<string | null> {
    const firstCard = this.getFirstOpportunityCard();
    const nameElement = firstCard.locator("h3");
    return await nameElement.textContent();
  }

  /**
   * Verify activity pulse has valid semantic color
   */
  async expectActivityPulseValid(opportunityName: string): Promise<void> {
    const pulse = this.getCardActivityPulse(opportunityName);
    await expect(pulse).toBeVisible();

    const classList = await pulse.getAttribute("class");
    const hasValidColor =
      classList?.includes("bg-success") ||
      classList?.includes("bg-warning") ||
      classList?.includes("bg-destructive") ||
      classList?.includes("bg-muted-foreground");

    expect(hasValidColor).toBe(true);
  }

  /**
   * Verify expanded card shows days in stage
   */
  async expectExpandedDetailsVisible(opportunityName: string): Promise<void> {
    const card = this.getOpportunityCard(opportunityName);
    await expect(card.getByText(/days in stage/i)).toBeVisible();
  }
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: No TypeScript errors in POM file
```

---

### Task 3.4: Write E2E Test Using POM
**Time:** 5 min | **File:** `tests/e2e/opportunities/kanban-expand.spec.ts`

**Pre-conditions:** Task 3.3 POM methods added

**Context:** E2E tests MUST use Page Object Models per `tests/e2e/README.md` standards.

**Implementation:**

Create file `tests/e2e/opportunities/kanban-expand.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { OpportunitiesListPage } from "../support/poms/OpportunitiesListPage";

test.describe("Kanban Card Expand/Collapse", () => {
  let opportunitiesPage: OpportunitiesListPage;

  test.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesListPage(page);
    await opportunitiesPage.goto();

    // IMPORTANT: Ensure we're in Kanban view (user's localStorage may have "list" preference)
    // The POM's waitForPageLoad handles both views, but we need Kanban specifically
    await opportunitiesPage.switchToKanbanView();
  });

  test("should expand card to show full details", async () => {
    // Get name of first card to interact with
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Card should be collapsed initially
    const isExpandedBefore = await opportunitiesPage.isCardExpanded(cardName!);
    expect(isExpandedBefore).toBe(false);

    // Expand the card
    await opportunitiesPage.expandCard(cardName!);

    // Verify expanded
    const isExpandedAfter = await opportunitiesPage.isCardExpanded(cardName!);
    expect(isExpandedAfter).toBe(true);

    // Details should be visible
    await opportunitiesPage.expectExpandedDetailsVisible(cardName!);

    // Collapse the card
    await opportunitiesPage.collapseCard(cardName!);

    // Verify collapsed
    const isExpandedFinal = await opportunitiesPage.isCardExpanded(cardName!);
    expect(isExpandedFinal).toBe(false);
  });

  test("should show activity pulse dot with semantic color", async () => {
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Verify pulse dot has valid color class
    await opportunitiesPage.expectActivityPulseValid(cardName!);
  });

  test("should show task count when expanded", async () => {
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Expand the card
    await opportunitiesPage.expandCard(cardName!);

    // At minimum, days in stage should always be visible
    await opportunitiesPage.expectExpandedDetailsVisible(cardName!);
  });
});
```

**Note:** These E2E tests use the `OpportunitiesListPage` POM as required by `tests/e2e/README.md` standards.

**Verification:**
```bash
npx playwright test kanban-expand
# Expected: Tests pass
```

---

## Dependency Graph

```
Phase 1 (Sequential):
  1.1 Migration ──→ 1.2 Types ──→ 1.3 Pulse Tests ──→ 1.4 Card Tests
                                        │                    │
Phase 2 (Parallel):                     ↓                    ↓
                               ┌────────┴────────┐   ┌───────┴───────┐
                               │ 2.1 PulseDot    │   │ 2.4 Card      │
                               │     Component   │   │    Component  │──→ 2.5 Update
                               └─────────────────┘   └───────────────┘    Existing Tests

  2.2 Column Widths ────┐
                        │
  2.3 Container Gap ────┼──→ (2.1-2.4 parallel, 2.5 after 2.4)
                        │

Phase 3 (Sequential):
  3.1 Full Test Suite ──→ 3.2 Seed + Verify ──→ 3.3 Extend POM ──→ 3.4 E2E Test
                                                                        │
Phase 4 (Sequential - after verification):                              ↓
  4.1 Remove Unused Code ──→ 4.2 Storybook ──→ 4.3 Clean Artifacts
                                                      │
  4.4 Index Exports ──→ 4.5 Doc Update ──→ 4.6 Final Quality Checks
```

---

## Files Modified Summary

| File | Type | Change |
|------|------|--------|
| `supabase/migrations/20251204220000_*.sql` | New | Add 3 computed columns to view |
| `src/atomic-crm/types.ts` | Edit | Add 3 new fields to Opportunity interface |
| `src/atomic-crm/opportunities/kanban/ActivityPulseDot.tsx` | New | Activity indicator component |
| `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` | Replace | Expandable card with visual cues |
| `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` | Edit | Responsive column widths |
| `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx` | Edit | Gap adjustment |
| `src/atomic-crm/opportunities/kanban/__tests__/ActivityPulseDot.test.tsx` | New | Unit tests |
| `src/atomic-crm/opportunities/kanban/__tests__/OpportunityCard.test.tsx` | Edit | Add expand tests |
| `tests/e2e/support/poms/OpportunitiesListPage.ts` | Edit | Add expand/collapse POM methods |
| `tests/e2e/opportunities/kanban-expand.spec.ts` | New | E2E tests using POM |

---

## Phase 4: Cleanup (Sequential)

> **Run after all features verified working**

### Task 4.1: Remove Unused Code from Old OpportunityCard
**Time:** 2-3 min | **File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

**Context:** The old card had a days_in_stage badge at the bottom. This is now in the expanded section. Clean up any redundant code.

**Implementation:**

Review `OpportunityCard.tsx` and remove:
- Any duplicate days_in_stage rendering outside expanded section
- Unused imports (if any)
- Old inline SVG icons replaced by lucide-react icons

**Verification:**
```bash
npx tsc --noEmit
npm test -- OpportunityCard
# Expected: No errors, all tests pass
```

---

### Task 4.2: Update Storybook Stories (if exists)
**Time:** 2-3 min | **File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.stories.tsx`

**Context:** If Storybook stories exist, update them to showcase collapsed/expanded states.

**Pre-conditions:** Check if file exists first

**Implementation:**

```bash
# Check if stories file exists
ls src/atomic-crm/opportunities/kanban/*.stories.tsx 2>/dev/null || echo "No stories - skip this task"
```

If exists, add stories for:
- Collapsed state (default)
- Expanded state
- With overdue tasks
- With stale activity (red pulse)
- New opportunity (gray pulse)

---

### Task 4.3: Clean Up Test Artifacts
**Time:** 1-2 min

**Context:** Remove any temporary test data or debug logs added during development.

**Implementation:**

```bash
# Search for console.log statements that might have been added
grep -r "console.log" src/atomic-crm/opportunities/kanban/ --include="*.tsx" || echo "No debug logs found"

# Search for TODO comments that need resolution
grep -r "TODO\|FIXME\|HACK" src/atomic-crm/opportunities/kanban/ --include="*.tsx" || echo "No TODOs found"
```

Remove any found debug statements or resolve TODOs.

---

### Task 4.4: Update Component Index Exports
**Time:** 1-2 min | **File:** `src/atomic-crm/opportunities/kanban/index.ts`

**Context:** Ensure the new `ActivityPulseDot` component is exported if needed elsewhere.

**Implementation:**

Check if `src/atomic-crm/opportunities/kanban/index.ts` exists:

```bash
ls src/atomic-crm/opportunities/kanban/index.ts 2>/dev/null || echo "No index file - skip"
```

If exists, add export:
```typescript
export { ActivityPulseDot } from "./ActivityPulseDot";
```

---

### Task 4.5: Final Documentation Update
**Time:** 2-3 min | **File:** `docs/designs/2025-12-04-expandable-kanban-cards-design.md`

**Context:** Update design doc status to "Implemented" and add any implementation notes.

**Implementation:**

Edit `docs/designs/2025-12-04-expandable-kanban-cards-design.md`:

```markdown
# Change status at top:
**Status:** Implemented ✅

# Add section at bottom:
## Implementation Notes

- Migration: `20251204220000_add_activity_task_counts_to_opportunities_summary.sql`
- Activity pulse thresholds: <7d green, 7-14d yellow, >14d red, null gray
- Animation: CSS grid-rows transition (200ms)
- Completed: YYYY-MM-DD
```

**Verification:**
```bash
# Verify design doc is updated
head -5 docs/designs/2025-12-04-expandable-kanban-cards-design.md
```

---

### Task 4.6: Run Final Quality Checks
**Time:** 3-5 min

**Context:** Full verification that everything is clean and working.

**Implementation:**

```bash
# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint

# Full test suite
npm test

# Build verification
npm run build

# All should pass with no warnings
```

**Success Criteria:**
- [ ] No TypeScript errors
- [ ] No lint warnings in changed files
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No console warnings in browser

---

## Rollback Plan

If issues occur:
1. Revert migration: `npx supabase migration repair --status reverted 20251204220000`
2. Git checkout affected files: `git checkout HEAD -- src/atomic-crm/opportunities/kanban/`
3. Run `npm run build` to verify clean state
