# Implementation Plan: Kanban Density & Principal-Grouped View

**Created:** 2025-12-20
**Type:** Mixed (Feature + Bug Fix)
**Scope:** Full Stack (Frontend only - DB fields exist)
**Execution:** Parallel groups

---

## Summary

Improve Opportunity Kanban to show more cards per column and add Principal-grouped view to answer "What's the ONE thing I need to do this week for each principal?"

### User Requirements (UX Discovery)

| Requirement | Answer | Implementation |
|-------------|--------|----------------|
| Card must show | Principal, Distributor, Operator, **Days since last activity** | Fix bug: currently shows `days_in_stage` |
| Needs attention | Stuck in stage, Close date passed | Already implemented ✅ |
| Card click | Slide-over panel | Already works ✅ |
| ONE thing per principal | Separate view grouped by principal | **New feature** |
| Success metric | % of closes | Add to Principal View headers |

### Industry Standard Reference

[Microsoft Dynamics 365 Sales (2024 Wave 2)](https://learn.microsoft.com/en-us/dynamics365/release-plan/2024wave2/sales/dynamics365-sales/analyze-opportunities-better-grouping-them-aggregating-their-values) - Dynamic grouping by Account/Principal with aggregated metrics.

---

## Parallel Execution Groups

```
┌─────────────────────────────────────────────────────────────────────┐
│ GROUP A (Bug Fix)           GROUP B (Density)         GROUP C (Badge)│
│ P1: days_since_last_activity P2A: Tighter padding    P3: Past due   │
│                                                                      │
│ ─────────────────── DEPENDENCY BARRIER ───────────────────────────  │
│                                                                      │
│ GROUP D (New Feature - Sequential)                                   │
│ P4: Principal-Grouped View                                           │
│ P5: Close Rate Metrics                                               │
│                                                                      │
│ ─────────────────── OPTIONAL FOLLOW-UP ─────────────────────────── │
│                                                                      │
│ P2B: Two-Line Card Layout (if density still insufficient)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## TASK 1: Fix Days Since Last Activity Display (Bug Fix)

**Parallel Group:** A
**Estimated Time:** 10-15 min
**Dependencies:** None

### Context for Agent

The `OpportunityCard` component currently displays `days_in_stage` but the user requirement is to show `days_since_last_activity`. The field already exists in the `opportunities_summary` database view and is available on the `Opportunity` type.

### Files to Modify

1. `src/atomic-crm/opportunities/kanban/StageStatusDot.tsx`
2. `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

### Implementation Steps

#### Step 1.1: Update StageStatusDot Props

**File:** `src/atomic-crm/opportunities/kanban/StageStatusDot.tsx`

```tsx
// BEFORE (around line 5-10)
interface StageStatusDotProps {
  status: StageStatus;
  daysInStage: number;
}

// AFTER
interface StageStatusDotProps {
  status: StageStatus;
  daysSinceLastActivity: number | null;  // Primary display value
  daysInStage?: number;                   // Kept for aria-label context
}
```

#### Step 1.2: Update StageStatusDot Display Logic

**File:** `src/atomic-crm/opportunities/kanban/StageStatusDot.tsx`

```tsx
// Update the display text (around line 25-35)
export function StageStatusDot({ status, daysSinceLastActivity, daysInStage }: StageStatusDotProps) {
  const displayText = daysSinceLastActivity !== null
    ? `${daysSinceLastActivity} days`
    : "No activity";

  // Status dot color logic remains unchanged (uses status prop)
  // ...existing status class logic...

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label={`Last activity: ${displayText}`}>
      <span className={`w-2 h-2 rounded-full ${statusClass}`} />
      <span className="text-xs text-muted-foreground">{displayText}</span>
    </div>
  );
}
```

#### Step 1.3: Update OpportunityCard to Pass New Prop

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

```tsx
// Around line 75-80, add days_since_last_activity extraction
const daysSinceLastActivity = record.days_since_last_activity ?? null;
const daysInStage = record.days_in_stage || 0;

// Around line 150-152, update component call
<StageStatusDot
  status={stageStatus}
  daysSinceLastActivity={daysSinceLastActivity}
  daysInStage={daysInStage}
/>
```

### Verification

```bash
# Start dev server and navigate to Opportunities Kanban
npm run dev
# Open http://localhost:5173/#/opportunities
# Verify cards show "X days" (last activity) not days in stage
# Verify cards with no activities show "No activity"
```

### Constitution Checklist
- [ ] No direct Supabase imports (uses existing data provider)
- [ ] Semantic colors only (text-muted-foreground)
- [ ] Touch targets N/A (display only)
- [ ] Fail-fast: shows "No activity" when null, no fallback to days_in_stage

---

## TASK 2A: Card Density - Tighter Padding

**Parallel Group:** B
**Estimated Time:** 5-10 min
**Dependencies:** None

### Context for Agent

Reduce card padding to fit more cards per column without scrolling. Current card shows ~3-4 per column, target is ~5 cards.

### Files to Modify

1. `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

### Implementation Steps

#### Step 2A.1: Reduce Card Padding

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

```tsx
// Around line 106-114, update className
className={`
  bg-card rounded-lg border border-border border-l-4
  p-2 space-y-0.5  // Changed from p-3 space-y-1
  hover:shadow-md
  cursor-pointer
  ${isDragging && !isDragOverlay ? "opacity-50" : "opacity-100"}
  ${isDragOverlay ? "shadow-xl" : ""}
`}
```

### Verification

```bash
# Visual check: cards should be ~25% shorter
# Count visible cards per column without scrolling
# Target: 5 cards visible vs previous 3-4
```

### Constitution Checklist
- [ ] Touch targets: Drag handle remains 44px (min-h-[44px] min-w-[44px])
- [ ] Semantic colors: No changes to colors
- [ ] iPad viewport: Test at 1024x768

---

## TASK 3: Expired Close Date Badge

**Parallel Group:** C
**Estimated Time:** 5-10 min
**Dependencies:** None

### Context for Agent

Add visual badge when opportunity's close date has passed. The `stageStatus` already calculates "expired" status, we just need to display it.

### Files to Modify

1. `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

### Implementation Steps

#### Step 3.1: Add Past Due Badge

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

```tsx
// Around line 149-152, update the status row
{/* Row 4: Stage Status (days + dot) + Optional expired badge */}
<div className="pl-10 flex items-center gap-2">
  <StageStatusDot
    status={stageStatus}
    daysSinceLastActivity={daysSinceLastActivity}
    daysInStage={daysInStage}
  />
  {stageStatus === "expired" && (
    <span
      className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium"
      role="status"
      aria-label="Close date has passed"
    >
      Past due
    </span>
  )}
</div>
```

### Verification

```bash
# Find or create an opportunity with past close date
# Verify "Past due" badge appears next to status dot
# Badge should use destructive color (red semantic)
```

### Constitution Checklist
- [ ] Semantic colors: bg-destructive/10, text-destructive
- [ ] Accessibility: role="status", aria-label
- [ ] No hardcoded hex values

---

## TASK 4: Principal-Grouped View (New Feature)

**Parallel Group:** D (Sequential - after A, B, C complete)
**Estimated Time:** 45-60 min (4 subtasks)
**Dependencies:** Tasks 1-3 should be complete first (shared card improvements)

### Context for Agent

Create new view that groups opportunities by Principal (manufacturer) instead of Stage. Follows [Dynamics 365 pattern](https://learn.microsoft.com/en-us/dynamics365/release-plan/2024wave2/sales/dynamics365-sales/analyze-opportunities-better-grouping-them-aggregating-their-values) of horizontal columns with aggregated metrics.

### Files to Create

1. `src/atomic-crm/opportunities/PrincipalGroupedList.tsx` (NEW)
2. `src/atomic-crm/opportunities/kanban/PrincipalColumn.tsx` (NEW)
3. `src/atomic-crm/opportunities/kanban/PrincipalCard.tsx` (NEW)

### Files to Modify

4. `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx`
5. `src/atomic-crm/opportunities/OpportunityList.tsx`

### Subtask 4.1: Create PrincipalCard Component

**File:** `src/atomic-crm/opportunities/kanban/PrincipalCard.tsx` (NEW)

```tsx
import React from "react";
import { StageStatusDot } from "./StageStatusDot";
import { getOpportunityStageLabel } from "../constants/stageConstants";
import { getStageStatus } from "../constants/stageThresholds";
import type { Opportunity } from "../../types";
import { parseDateSafely } from "@/lib/date-utils";

interface PrincipalCardProps {
  opportunity: Opportunity;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

/**
 * PrincipalCard - Compact card for Principal-grouped view
 *
 * Shows: Distributor, Operator, Stage + Status
 * (Principal is shown in column header, not on card)
 */
export const PrincipalCard = React.memo(function PrincipalCard({
  opportunity,
  openSlideOver,
}: PrincipalCardProps) {
  const daysInStage = opportunity.days_in_stage || 0;
  const daysSinceLastActivity = opportunity.days_since_last_activity ?? null;
  const expectedCloseDate = opportunity.estimated_close_date
    ? parseDateSafely(opportunity.estimated_close_date)
    : null;
  const stageStatus = getStageStatus(opportunity.stage, daysInStage, expectedCloseDate);

  const handleClick = () => {
    openSlideOver(opportunity.id as number, "view");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="bg-card rounded-lg border border-border p-2 hover:shadow-md cursor-pointer space-y-0.5"
      data-testid="principal-card"
    >
      {/* Row 1: Distributor */}
      <p className="font-medium text-sm text-foreground truncate">
        {opportunity.distributor_organization_name || "No Distributor"}
      </p>

      {/* Row 2: Operator (Customer) */}
      <p className="text-xs text-muted-foreground truncate">
        {opportunity.customer_organization_name || "No Operator"}
      </p>

      {/* Row 3: Stage + Status */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-xs text-muted-foreground truncate max-w-[60%]">
          {getOpportunityStageLabel(opportunity.stage)}
        </span>
        <StageStatusDot
          status={stageStatus}
          daysSinceLastActivity={daysSinceLastActivity}
        />
      </div>
    </div>
  );
});
```

### Subtask 4.2: Create PrincipalColumn Component

**File:** `src/atomic-crm/opportunities/kanban/PrincipalColumn.tsx` (NEW)

```tsx
import React, { useMemo } from "react";
import { PrincipalCard } from "./PrincipalCard";
import type { Opportunity } from "../../types";

interface PrincipalColumnProps {
  principalName: string;
  opportunities: Opportunity[];
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

/**
 * PrincipalColumn - Column for Principal-grouped view
 *
 * Shows: Principal name, count, win rate, sorted opportunities
 */
export const PrincipalColumn = React.memo(function PrincipalColumn({
  principalName,
  opportunities,
  openSlideOver,
}: PrincipalColumnProps) {
  // Calculate close rate metrics
  const metrics = useMemo(() => {
    const wonCount = opportunities.filter(o => o.stage === "closed_won").length;
    const lostCount = opportunities.filter(o => o.stage === "closed_lost").length;
    const totalClosed = wonCount + lostCount;
    const closeRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : null;
    const openCount = opportunities.length - totalClosed;

    return { wonCount, lostCount, totalClosed, closeRate, openCount, total: opportunities.length };
  }, [opportunities]);

  // Sort: Red status first → Earlier stages → Most days descending
  const sortedOpportunities = useMemo(() => {
    const stageOrder = ["new_lead", "initial_outreach", "sample_visit_offered", "feedback_logged", "demo_scheduled", "closed_won", "closed_lost"];

    return [...opportunities]
      .filter(o => o.stage !== "closed_won" && o.stage !== "closed_lost") // Hide closed in main view
      .sort((a, b) => {
        // Red status (rotting/expired) first
        const aUrgent = (a.days_in_stage || 0) > 14 || (a.estimated_close_date && new Date(a.estimated_close_date) < new Date());
        const bUrgent = (b.days_in_stage || 0) > 14 || (b.estimated_close_date && new Date(b.estimated_close_date) < new Date());
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;

        // Then by stage order (earlier first)
        const aStageIdx = stageOrder.indexOf(a.stage);
        const bStageIdx = stageOrder.indexOf(b.stage);
        if (aStageIdx !== bStageIdx) return aStageIdx - bStageIdx;

        // Then by days in stage descending
        return (b.days_in_stage || 0) - (a.days_in_stage || 0);
      });
  }, [opportunities]);

  return (
    <div
      className="flex flex-col bg-card border border-border rounded-xl shadow-elevation-1 hover:shadow-elevation-2 transition-shadow min-w-[240px] max-w-[280px] h-full max-h-full overflow-hidden shrink-0"
      data-testid="principal-column"
    >
      {/* Column Header */}
      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base text-foreground truncate">
            {principalName}
          </h2>
          <span className="text-sm text-muted-foreground">
            ({metrics.openCount})
          </span>
        </div>
        {metrics.closeRate !== null && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {metrics.closeRate}% win rate ({metrics.wonCount}W / {metrics.lostCount}L)
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sortedOpportunities.map((opportunity) => (
          <PrincipalCard
            key={opportunity.id}
            opportunity={opportunity}
            openSlideOver={openSlideOver}
          />
        ))}
        {sortedOpportunities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No open opportunities
          </p>
        )}
      </div>
    </div>
  );
});
```

### Subtask 4.3: Create PrincipalGroupedList Component

**File:** `src/atomic-crm/opportunities/PrincipalGroupedList.tsx` (NEW)

```tsx
import { useListContext } from "react-admin";
import { useMemo } from "react";
import { PrincipalColumn } from "./kanban/PrincipalColumn";
import type { Opportunity } from "../types";

interface PrincipalGroupedListProps {
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

/**
 * PrincipalGroupedList - Groups opportunities by Principal
 *
 * Answers: "What's the ONE thing I need to do this week for each principal?"
 * Pattern: Microsoft Dynamics 365 Sales account grouping
 */
export const PrincipalGroupedList = ({ openSlideOver }: PrincipalGroupedListProps) => {
  const { data: opportunities, isPending } = useListContext<Opportunity>();

  // Group by principal
  const opportunitiesByPrincipal = useMemo(() => {
    if (!opportunities) return {};

    const grouped: Record<string, Opportunity[]> = {};

    for (const opp of opportunities) {
      const principal = opp.principal_organization_name || "No Principal";
      if (!grouped[principal]) {
        grouped[principal] = [];
      }
      grouped[principal].push(opp);
    }

    // Sort principals alphabetically
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [opportunities]);

  if (isPending) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      <div
        className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3 bg-muted rounded-2xl border border-border shadow-inner"
        role="region"
        aria-label="Opportunities grouped by principal"
      >
        {Object.entries(opportunitiesByPrincipal).map(([principal, opps]) => (
          <PrincipalColumn
            key={principal}
            principalName={principal}
            opportunities={opps}
            openSlideOver={openSlideOver}
          />
        ))}
      </div>
    </div>
  );
};
```

### Subtask 4.4: Update View Switcher

**File:** `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx`

```tsx
// Add to imports
import { Building2 } from "lucide-react";

// Update type (around line 5-10)
export type OpportunityView = "kanban" | "list" | "campaign" | "principal";

// Add 4th button in the ToggleGroup (around line 45-60)
<ToggleGroupItem
  value="principal"
  aria-label="Principal view"
  className="min-h-[44px] min-w-[44px]"
>
  <Building2 className="h-4 w-4" />
</ToggleGroupItem>
```

**File:** `src/atomic-crm/opportunities/OpportunityList.tsx`

```tsx
// Add import
import { PrincipalGroupedList } from "./PrincipalGroupedList";

// Add case in view rendering (around line 80-100)
{view === "principal" && (
  <PrincipalGroupedList openSlideOver={openSlideOver} />
)}
```

### Verification

```bash
# Start dev server
npm run dev

# Navigate to Opportunities page
# Click the Building2 icon (4th view option)
# Verify columns are grouped by Principal name
# Verify each column shows win rate in header
# Verify cards show Distributor, Operator, Stage
# Click a card - should open slide-over panel
```

### Constitution Checklist
- [ ] No direct Supabase imports (uses useListContext)
- [ ] Semantic colors only (bg-muted, text-foreground, etc.)
- [ ] Touch targets: Cards are clickable (full card is target)
- [ ] Accessibility: role="region", aria-label
- [ ] Fail-fast: No retry logic, shows "No open opportunities" when empty

---

## TASK 5: Close Rate in Principal View Headers

**Parallel Group:** D (After Task 4)
**Estimated Time:** Already included in Task 4
**Dependencies:** Task 4

> This is already implemented in Task 4's `PrincipalColumn` component. The column header shows:
> - Principal name
> - Count of open opportunities
> - Win rate percentage (X% win rate)
> - Win/Loss breakdown (XW / YL)

---

## TASK 2B: Two-Line Card Layout (Optional Follow-Up)

**Parallel Group:** Optional
**Estimated Time:** 20-30 min
**Dependencies:** Tasks 1-5 complete, user validation that more density is needed

### Context for Agent

If card density from Task 2A is insufficient, implement more aggressive two-line layout:

```
┌────────────────────────────────────┐
│ ████ McCRUM                     ⋯ │  Principal + actions
│ Sysco → Chili's         🔴 3d     │  Distributor → Operator + days
└────────────────────────────────────┘
```

### Implementation Sketch

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

```tsx
// Replace rows 2-4 with single row
<div className="flex items-center justify-between pl-10">
  <p className="text-sm text-muted-foreground truncate flex-1">
    <span>{record.distributor_organization_name || "—"}</span>
    <span className="mx-1">→</span>
    <span>{record.customer_organization_name || "—"}</span>
  </p>
  <StageStatusDot
    status={stageStatus}
    daysSinceLastActivity={daysSinceLastActivity}
  />
</div>
```

**Note:** Only implement after validating Task 2A with user.

---

## Test Plan

### Unit Tests (After Implementation)

**File:** `src/atomic-crm/opportunities/kanban/__tests__/OpportunityCard.test.tsx`

```tsx
describe("OpportunityCard", () => {
  it("displays days since last activity instead of days in stage", () => {
    renderCard({ days_since_last_activity: 7, days_in_stage: 14 });
    expect(screen.getByText(/7 days/)).toBeInTheDocument();
  });

  it("shows 'No activity' when days_since_last_activity is null", () => {
    renderCard({ days_since_last_activity: null });
    expect(screen.getByText(/No activity/)).toBeInTheDocument();
  });

  it("shows 'Past due' badge when status is expired", () => {
    renderCard({
      estimated_close_date: "2024-01-01", // past date
      stage: "demo_scheduled"
    });
    expect(screen.getByText(/Past due/)).toBeInTheDocument();
  });
});
```

**File:** `src/atomic-crm/opportunities/__tests__/PrincipalGroupedList.test.tsx`

```tsx
describe("PrincipalGroupedList", () => {
  it("groups opportunities by principal name", () => {
    renderWithOpportunities([
      { id: 1, principal_organization_name: "McCRUM" },
      { id: 2, principal_organization_name: "SWAP" },
      { id: 3, principal_organization_name: "McCRUM" },
    ]);

    expect(screen.getAllByTestId("principal-column")).toHaveLength(2);
    expect(screen.getByText("McCRUM")).toBeInTheDocument();
    expect(screen.getByText("SWAP")).toBeInTheDocument();
  });

  it("calculates win rate correctly", () => {
    renderWithOpportunities([
      { id: 1, principal_organization_name: "McCRUM", stage: "closed_won" },
      { id: 2, principal_organization_name: "McCRUM", stage: "closed_won" },
      { id: 3, principal_organization_name: "McCRUM", stage: "closed_lost" },
    ]);

    expect(screen.getByText(/67% win rate/)).toBeInTheDocument();
  });
});
```

---

## Files Summary

### Modified Files
| File | Task |
|------|------|
| `src/atomic-crm/opportunities/kanban/StageStatusDot.tsx` | 1 |
| `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` | 1, 2A, 3 |
| `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx` | 4 |
| `src/atomic-crm/opportunities/OpportunityList.tsx` | 4 |

### New Files
| File | Task |
|------|------|
| `src/atomic-crm/opportunities/kanban/PrincipalCard.tsx` | 4 |
| `src/atomic-crm/opportunities/kanban/PrincipalColumn.tsx` | 4 |
| `src/atomic-crm/opportunities/PrincipalGroupedList.tsx` | 4 |

---

## Execution Order

```
PARALLEL GROUP A/B/C (can run simultaneously):
├── Agent 1: Task 1 (days_since_last_activity fix)
├── Agent 2: Task 2A (card padding)
└── Agent 3: Task 3 (Past due badge)

SEQUENTIAL GROUP D (after A/B/C complete):
├── Task 4.1: PrincipalCard component
├── Task 4.2: PrincipalColumn component
├── Task 4.3: PrincipalGroupedList component
└── Task 4.4: ViewSwitcher + OpportunityList updates

OPTIONAL (after user validation):
└── Task 2B: Two-line card layout
```
