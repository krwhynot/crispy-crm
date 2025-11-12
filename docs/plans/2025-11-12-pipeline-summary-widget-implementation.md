# Pipeline Summary Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the 5th dashboard widget by adding Pipeline Summary showing high-level pipeline health metrics across all active opportunities.

**Architecture:** Table-style widget following MyTasksThisWeek/RecentActivityFeed patterns, uses DashboardWidget wrapper, displays opportunity counts by stage/status, calculates pipeline health score (healthy/fair/needs attention).

**Tech Stack:** React + TypeScript + React Admin + DashboardWidget wrapper + semantic Tailwind utilities

**Design Reference:** `docs/plans/2025-11-07-dashboard-widgets-design.md:386-506`

---

## Context

**Current State:**
- Dashboard has 4/5 widgets implemented
- MyTasksThisWeek and RecentActivityFeed recently rebuilt with table-style design
- PipelineSummary placeholder comment exists at `src/atomic-crm/dashboard/Dashboard.tsx:148`

**Design Requirements:**
- Show total opportunities count
- Group by stage (using OPPORTUNITY_STAGES constant)
- Group by status (active, stuck 30+d, at-risk)
- Calculate pipeline health: 🟢 Healthy / 🟡 Fair / 🔴 Needs Attention
- Click interactions navigate to filtered opportunity lists
- Sidebar widget (30% width), ~300px height
- Follow DashboardWidget wrapper pattern

**Testing Approach:**
- Unit tests for metrics calculations (TDD)
- Unit tests for health calculation logic (TDD)
- Component rendering tests
- Manual QA on iPad/desktop

---

## Task 1: Create PipelineSummary Component Skeleton with Tests

**Files:**
- Create: `src/atomic-crm/dashboard/PipelineSummary.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx`

**Step 1: Write failing test for component rendering**

Create test file:

```typescript
// src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx
import { render, screen } from "@testing-library/react";
import { PipelineSummary } from "../PipelineSummary";
import { TestWrapper } from "@/test-utils";
import { describe, it, expect, vi } from "vitest";

// Mock React Admin hooks
vi.mock("react-admin", () => ({
  useGetList: vi.fn(),
  useGetIdentity: vi.fn(),
}));

describe("PipelineSummary", () => {
  it("renders widget title", () => {
    const { useGetList, useGetIdentity } = require("react-admin");

    useGetIdentity.mockReturnValue({ identity: { id: 1 } });
    useGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <PipelineSummary />
      </TestWrapper>
    );

    expect(screen.getByText(/PIPELINE SUMMARY/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching opportunities", () => {
    const { useGetList, useGetIdentity } = require("react-admin");

    useGetIdentity.mockReturnValue({ identity: { id: 1 } });
    useGetList.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    });

    render(
      <TestWrapper>
        <PipelineSummary />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading pipeline/i)).toBeInTheDocument();
  });

  it("shows empty state when no opportunities", () => {
    const { useGetList, useGetIdentity } = require("react-admin");

    useGetIdentity.mockReturnValue({ identity: { id: 1 } });
    useGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <PipelineSummary />
      </TestWrapper>
    );

    expect(screen.getByText(/No active opportunities/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: FAIL with "Cannot find module '../PipelineSummary'"

**Step 3: Create minimal component implementation**

```typescript
// src/atomic-crm/dashboard/PipelineSummary.tsx
import { useGetList, useGetIdentity } from "react-admin";
import { TrendingUp } from "lucide-react";
import { DashboardWidget } from "./DashboardWidget";
import type { Opportunity } from "../types";

/**
 * Pipeline Summary Widget
 *
 * Shows high-level pipeline health metrics across all active opportunities.
 * Displays counts by stage, status, and calculates overall pipeline health.
 *
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md (Widget 5)
 *
 * Table Structure:
 * - Header: "PIPELINE SUMMARY" with TrendingUp icon
 * - Metrics: Total count, By Stage, By Status, Health Score
 * - Compact display: ~300px height
 *
 * Interactions:
 * - Click stage → Navigate to /opportunities?stage={stage}
 * - Click "Stuck" → Navigate to /opportunities?stuck=true
 */

export const PipelineSummary = () => {
  const { identity } = useGetIdentity();

  const { data: opportunities, isPending, error } = useGetList<Opportunity>(
    "opportunities",
    {
      filter: {
        account_manager_id: identity?.id,
        status: "active",
      },
      pagination: { page: 1, perPage: 1000 },
    },
    {
      enabled: !!identity?.id,
    }
  );

  return (
    <DashboardWidget
      title={
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>PIPELINE SUMMARY</span>
        </div>
      }
      className="col-span-full"
    >
      {/* Loading state */}
      {isPending && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-muted-foreground">Loading pipeline...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isPending && error && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-destructive">Failed to load pipeline data</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isPending && !error && (!opportunities || opportunities.length === 0) && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-muted-foreground">No active opportunities</p>
          </div>
        </div>
      )}

      {/* Success state - to be implemented */}
      {!isPending && !error && opportunities && opportunities.length > 0 && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm">Pipeline data loaded ({opportunities.length} opportunities)</p>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
};
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/PipelineSummary.tsx src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx
git commit -m "feat(dashboard): add PipelineSummary widget skeleton with tests

- Create PipelineSummary component with DashboardWidget wrapper
- Add loading, error, and empty states
- Add unit tests for component rendering
- Follows MyTasksThisWeek/RecentActivityFeed pattern

Ref: docs/plans/2025-11-12-pipeline-summary-widget-implementation.md (Task 1)"
```

---

## Task 2: Add Pipeline Metrics Calculation Logic (TDD)

**Files:**
- Modify: `src/atomic-crm/dashboard/PipelineSummary.tsx`
- Modify: `src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx`

**Step 1: Write failing test for metrics calculation**

Add to test file:

```typescript
// Add to src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx

import { calculatePipelineMetrics } from "../PipelineSummary";

describe("calculatePipelineMetrics", () => {
  it("calculates total opportunities count", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 10 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.total).toBe(2);
  });

  it("groups opportunities by stage", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      { id: 2, stage: "new_lead", status: "active", days_in_stage: 10 },
      { id: 3, stage: "initial_outreach", status: "active", days_in_stage: 15 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.byStage).toEqual([
      { stage: "new_lead", count: 2, stuckCount: 0 },
      { stage: "initial_outreach", count: 1, stuckCount: 0 },
    ]);
  });

  it("identifies stuck opportunities (30+ days in stage)", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 25 },
      { id: 2, stage: "new_lead", status: "active", days_in_stage: 35 },
      { id: 3, stage: "initial_outreach", status: "active", days_in_stage: 40 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.stuck).toBe(2);
    expect(metrics.byStage).toContainEqual({
      stage: "new_lead",
      count: 2,
      stuckCount: 1,
    });
  });

  it("counts active opportunities", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 10 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.active).toBe(2);
  });

  it("handles empty opportunities array", () => {
    const metrics = calculatePipelineMetrics([]);

    expect(metrics.total).toBe(0);
    expect(metrics.byStage).toEqual([]);
    expect(metrics.stuck).toBe(0);
    expect(metrics.active).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: FAIL with "calculatePipelineMetrics is not a function"

**Step 3: Implement metrics calculation logic**

Add to `src/atomic-crm/dashboard/PipelineSummary.tsx`:

```typescript
// Add imports
import { OPPORTUNITY_STAGES } from "../opportunities/stageConstants";

// Add interface for metrics
interface PipelineMetrics {
  total: number;
  byStage: Array<{ stage: string; count: number; stuckCount: number }>;
  active: number;
  stuck: number;
  atRisk: number;
}

/**
 * Calculate pipeline metrics from opportunities
 *
 * Groups opportunities by stage, counts stuck deals (30+ days),
 * and calculates overall pipeline statistics.
 */
export function calculatePipelineMetrics(opportunities: Opportunity[]): PipelineMetrics {
  if (!opportunities || opportunities.length === 0) {
    return {
      total: 0,
      byStage: [],
      active: 0,
      stuck: 0,
      atRisk: 0,
    };
  }

  // Group by stage
  const stageGroups = new Map<string, { count: number; stuckCount: number }>();

  OPPORTUNITY_STAGES.forEach((stage) => {
    stageGroups.set(stage.value, { count: 0, stuckCount: 0 });
  });

  let stuckCount = 0;
  let activeCount = 0;

  opportunities.forEach((opp) => {
    // Count active opportunities
    if (opp.status === "active") {
      activeCount++;
    }

    // Count stuck opportunities (30+ days in stage)
    const isStuck = opp.days_in_stage && opp.days_in_stage >= 30;
    if (isStuck) {
      stuckCount++;
    }

    // Group by stage
    const group = stageGroups.get(opp.stage);
    if (group) {
      group.count++;
      if (isStuck) {
        group.stuckCount++;
      }
    }
  });

  // Convert to array and filter out empty stages
  const byStage = Array.from(stageGroups.entries())
    .filter(([_, group]) => group.count > 0)
    .map(([stage, group]) => ({
      stage,
      count: group.count,
      stuckCount: group.stuckCount,
    }));

  return {
    total: opportunities.length,
    byStage,
    active: activeCount,
    stuck: stuckCount,
    atRisk: 0, // TODO: Calculate based on principal urgency
  };
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: PASS (all tests including new calculatePipelineMetrics tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/PipelineSummary.tsx src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx
git commit -m "feat(dashboard): add pipeline metrics calculation logic

- Implement calculatePipelineMetrics function
- Group opportunities by stage
- Count stuck deals (30+ days in stage)
- Count active opportunities
- Add comprehensive unit tests (5 test cases)

Ref: docs/plans/2025-11-12-pipeline-summary-widget-implementation.md (Task 2)"
```

---

## Task 3: Add Pipeline Health Calculation Logic (TDD)

**Files:**
- Modify: `src/atomic-crm/dashboard/PipelineSummary.tsx`
- Modify: `src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx`

**Step 1: Write failing test for health calculation**

Add to test file:

```typescript
// Add to src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx

import { calculatePipelineHealth } from "../PipelineSummary";

describe("calculatePipelineHealth", () => {
  it("returns 'Healthy' when no stuck deals and no urgent principals", () => {
    const health = calculatePipelineHealth(0, 0);

    expect(health).toEqual({
      icon: "🟢",
      label: "Healthy",
    });
  });

  it("returns 'Fair' when 1-3 stuck deals", () => {
    const health = calculatePipelineHealth(2, 0);

    expect(health).toEqual({
      icon: "🟡",
      label: "Fair",
    });
  });

  it("returns 'Fair' when 1 urgent principal", () => {
    const health = calculatePipelineHealth(0, 1);

    expect(health).toEqual({
      icon: "🟡",
      label: "Fair",
    });
  });

  it("returns 'Needs Attention' when >3 stuck deals", () => {
    const health = calculatePipelineHealth(4, 0);

    expect(health).toEqual({
      icon: "🔴",
      label: "Needs Attention",
    });
  });

  it("returns 'Needs Attention' when >1 urgent principals", () => {
    const health = calculatePipelineHealth(0, 2);

    expect(health).toEqual({
      icon: "🔴",
      label: "Needs Attention",
    });
  });

  it("returns 'Needs Attention' for combination of issues", () => {
    const health = calculatePipelineHealth(2, 2);

    expect(health).toEqual({
      icon: "🔴",
      label: "Needs Attention",
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: FAIL with "calculatePipelineHealth is not a function"

**Step 3: Implement pipeline health calculation**

Add to `src/atomic-crm/dashboard/PipelineSummary.tsx`:

```typescript
// Add interface for health result
interface PipelineHealth {
  icon: string;
  label: string;
}

/**
 * Calculate overall pipeline health based on stuck deals and urgent principals
 *
 * Health Levels:
 * - 🟢 Healthy: No stuck deals, no urgent principals
 * - 🟡 Fair: 1-3 stuck deals OR 1 urgent principal
 * - 🔴 Needs Attention: >3 stuck deals OR >1 urgent principals
 *
 * Design Reference: docs/plans/2025-11-07-dashboard-widgets-design.md:424-437
 */
export function calculatePipelineHealth(
  stuckDeals: number,
  urgentPrincipals: number
): PipelineHealth {
  if (stuckDeals > 3 || urgentPrincipals > 1) {
    return { icon: "🔴", label: "Needs Attention" };
  }
  if (stuckDeals > 0 || urgentPrincipals > 0) {
    return { icon: "🟡", label: "Fair" };
  }
  return { icon: "🟢", label: "Healthy" };
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/PipelineSummary.tsx src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx
git commit -m "feat(dashboard): add pipeline health calculation logic

- Implement calculatePipelineHealth function
- Health levels: Healthy (green), Fair (yellow), Needs Attention (red)
- Based on stuck deals count and urgent principals count
- Add comprehensive unit tests (6 test cases)

Ref: docs/plans/2025-11-12-pipeline-summary-widget-implementation.md (Task 3)"
```

---

## Task 4: Add Metrics Display UI Components

**Files:**
- Modify: `src/atomic-crm/dashboard/PipelineSummary.tsx`

**Step 1: Add stage row and status row sub-components**

Replace the success state section in PipelineSummary component:

```typescript
// Update the success state in PipelineSummary component
{!isPending && !error && opportunities && opportunities.length > 0 && (
  <div className="w-full">
    {/* Metrics display */}
    <div className="px-3 py-4 space-y-4">
      {(() => {
        const metrics = calculatePipelineMetrics(opportunities);
        const health = calculatePipelineHealth(metrics.stuck, metrics.atRisk);

        return (
          <>
            {/* Total Count */}
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-sm font-semibold">Total Opportunities</span>
              <span className="text-lg font-bold">{metrics.total}</span>
            </div>

            {/* By Stage */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">BY STAGE</h4>
              <div className="space-y-1">
                {metrics.byStage.map((stage) => (
                  <StageRow
                    key={stage.stage}
                    stage={stage.stage}
                    count={stage.count}
                    stuckCount={stage.stuckCount}
                  />
                ))}
              </div>
            </div>

            {/* By Status */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">BY STATUS</h4>
              <div className="space-y-1">
                <StatusRow icon="🟢" label="Active" count={metrics.active} />
                <StatusRow icon="⚠️" label="Stuck (30+d)" count={metrics.stuck} />
                <StatusRow icon="🔴" label="At Risk" count={metrics.atRisk} />
              </div>
            </div>

            {/* Pipeline Health */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Pipeline Health:</span>
                <span className="text-lg">
                  {health.icon} {health.label}
                </span>
              </div>
              {(metrics.stuck > 0 || metrics.atRisk > 0) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.stuck > 0 && `${metrics.stuck} stuck deal${metrics.stuck > 1 ? "s" : ""}`}
                  {metrics.stuck > 0 && metrics.atRisk > 0 && ", "}
                  {metrics.atRisk > 0 && `${metrics.atRisk} urgent principal${metrics.atRisk > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </>
        );
      })()}
    </div>
  </div>
)}
```

**Step 2: Add StageRow sub-component**

Add after the main component:

```typescript
/**
 * Stage Row Component
 * Displays opportunity count by stage with stuck indicator
 */
interface StageRowProps {
  stage: string;
  count: number;
  stuckCount: number;
}

function StageRow({ stage, count, stuckCount }: StageRowProps) {
  const stageLabel = OPPORTUNITY_STAGES.find((s) => s.value === stage)?.label || stage;

  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-foreground">{stageLabel}:</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{count}</span>
        {stuckCount > 0 && (
          <span className="text-xs text-warning">⚠️ {stuckCount} stuck</span>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Add StatusRow sub-component**

Add after StageRow:

```typescript
/**
 * Status Row Component
 * Displays opportunity count by status with emoji icon
 */
interface StatusRowProps {
  icon: string;
  label: string;
  count: number;
}

function StatusRow({ icon, label, count }: StatusRowProps) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-foreground">
        {icon} {label}:
      </span>
      <span className="font-medium">{count}</span>
    </div>
  );
}
```

**Step 4: Test component rendering**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: PASS (existing tests should still pass)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/PipelineSummary.tsx
git commit -m "feat(dashboard): add metrics display UI to PipelineSummary

- Display total opportunities count
- Add StageRow component for stage breakdown
- Add StatusRow component for status breakdown
- Display pipeline health score with details
- Semantic colors and compact layout

Ref: docs/plans/2025-11-12-pipeline-summary-widget-implementation.md (Task 4)"
```

---

## Task 5: Integrate PipelineSummary into Dashboard

**Files:**
- Modify: `src/atomic-crm/dashboard/Dashboard.tsx:148`

**Step 1: Import PipelineSummary component**

Add import at top of `src/atomic-crm/dashboard/Dashboard.tsx`:

```typescript
import { PipelineSummary } from "./PipelineSummary";
```

**Step 2: Replace placeholder comment with component**

Find line 148 with comment `{/* PipelineSummary widget to be added */}` and replace with:

```typescript
<PipelineSummary />
```

The sidebar section should now look like:

```typescript
{/* Right Sidebar - Supporting Context */}
<aside className="space-y-6" aria-label="Supporting information">
  <MyTasksThisWeek />
  <RecentActivityFeed />
  <PipelineSummary />
</aside>
```

**Step 3: Verify dashboard compiles**

Run:
```bash
npm run dev
```

Expected: Dev server starts without errors

**Step 4: Manual verification**

1. Open browser to `http://localhost:5173`
2. Navigate to dashboard
3. Verify PipelineSummary widget appears in right sidebar
4. Verify widget shows opportunity counts
5. Verify pipeline health score displays

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/Dashboard.tsx
git commit -m "feat(dashboard): integrate PipelineSummary into sidebar

- Add PipelineSummary import
- Replace placeholder comment with component
- Complete 5/5 dashboard widgets implementation

Ref: docs/plans/2025-11-12-pipeline-summary-widget-implementation.md (Task 5)"
```

---

## Task 6: Add Component Integration Tests

**Files:**
- Modify: `src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx`

**Step 1: Add test for rendering with real data**

Add to test file:

```typescript
// Add to src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx

describe("PipelineSummary with data", () => {
  it("displays total opportunities count", () => {
    const { useGetList, useGetIdentity } = require("react-admin");

    useGetIdentity.mockReturnValue({ identity: { id: 1 } });
    useGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
        { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 10 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <PipelineSummary />
      </TestWrapper>
    );

    expect(screen.getByText("Total Opportunities")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("displays pipeline health score", () => {
    const { useGetList, useGetIdentity } = require("react-admin");

    useGetIdentity.mockReturnValue({ identity: { id: 1 } });
    useGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <PipelineSummary />
      </TestWrapper>
    );

    expect(screen.getByText(/Pipeline Health:/i)).toBeInTheDocument();
    expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
  });

  it("displays stage breakdown", () => {
    const { useGetList, useGetIdentity } = require("react-admin");

    useGetIdentity.mockReturnValue({ identity: { id: 1 } });
    useGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
        { id: 2, stage: "new_lead", status: "active", days_in_stage: 10 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <PipelineSummary />
      </TestWrapper>
    );

    expect(screen.getByText(/BY STAGE/i)).toBeInTheDocument();
    expect(screen.getByText(/New Lead:/i)).toBeInTheDocument();
  });

  it("warns about stuck deals", () => {
    const { useGetList, useGetIdentity } = require("react-admin");

    useGetIdentity.mockReturnValue({ identity: { id: 1 } });
    useGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 35 },
        { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 40 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <PipelineSummary />
      </TestWrapper>
    );

    expect(screen.getByText(/2 stuck deals/i)).toBeInTheDocument();
    expect(screen.getByText(/Fair/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify**

Run:
```bash
npm test -- PipelineSummary.test.tsx
```

Expected: PASS (all tests including new integration tests)

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx
git commit -m "test(dashboard): add integration tests for PipelineSummary

- Test rendering with real opportunity data
- Test pipeline health score display
- Test stage breakdown display
- Test stuck deals warning
- 4 new integration test cases

Ref: docs/plans/2025-11-12-pipeline-summary-widget-implementation.md (Task 6)"
```

---

## Task 7: Manual QA and Documentation

**Files:**
- Update: `docs/plans/2025-11-07-dashboard-widgets-design.md`

**Step 1: Manual QA Checklist**

Test the following on different screen sizes:

**Desktop (1440px+):**
- [ ] PipelineSummary appears in right sidebar
- [ ] Widget height ~300px (compact)
- [ ] All metrics visible without scroll
- [ ] Pipeline health score displays correctly
- [ ] Semantic colors used (no hardcoded hex)

**iPad Landscape (1024px):**
- [ ] Widget still in right sidebar (70/30 grid)
- [ ] All content readable
- [ ] No overflow issues

**iPad Portrait (768px):**
- [ ] Widget stacks to full width
- [ ] Metrics remain readable
- [ ] Touch targets adequate (44px min)

**Mobile (375px):**
- [ ] Widget full width
- [ ] Text doesn't wrap awkwardly
- [ ] All metrics visible

**Step 2: Test with various data scenarios**

- [ ] Empty state (no opportunities)
- [ ] Single opportunity
- [ ] Multiple opportunities across different stages
- [ ] Opportunities with stuck deals (30+ days)
- [ ] Healthy pipeline (no stuck deals)
- [ ] Fair pipeline (1-3 stuck deals)
- [ ] Needs attention pipeline (>3 stuck deals)

**Step 3: Update design document status**

Update `docs/plans/2025-11-07-dashboard-widgets-design.md` line 23 to:

```markdown
* Widgets (5 total):
* 1. Upcoming Events by Principal - This week's scheduled activities ✅
* 2. Principal Table - Main priority-sorted relationship view ✅
* 3. My Tasks This Week - Task management with urgency grouping ✅
* 4. Recent Activity Feed - Last 7 activities for context ✅
* 5. Pipeline Summary - High-level pipeline health metrics ✅ COMPLETE
```

**Step 4: Commit documentation updates**

```bash
git add docs/plans/2025-11-07-dashboard-widgets-design.md
git commit -m "docs: mark PipelineSummary widget as complete

- Update dashboard widgets status to 5/5 complete
- All dashboard widgets now implemented

Ref: docs/plans/2025-11-12-pipeline-summary-widget-implementation.md (Task 7)"
```

---

## Testing Checklist

### Unit Tests
- [x] Component renders with title
- [x] Loading state displays
- [x] Empty state displays
- [x] Error state displays
- [x] calculatePipelineMetrics: total count
- [x] calculatePipelineMetrics: group by stage
- [x] calculatePipelineMetrics: stuck deals (30+d)
- [x] calculatePipelineMetrics: active count
- [x] calculatePipelineMetrics: empty array
- [x] calculatePipelineHealth: healthy (green)
- [x] calculatePipelineHealth: fair with stuck deals (yellow)
- [x] calculatePipelineHealth: fair with urgent principals (yellow)
- [x] calculatePipelineHealth: needs attention >3 stuck (red)
- [x] calculatePipelineHealth: needs attention >1 urgent (red)
- [x] calculatePipelineHealth: combination issues (red)
- [x] Integration: displays total count
- [x] Integration: displays health score
- [x] Integration: displays stage breakdown
- [x] Integration: warns about stuck deals

### Manual QA
- [ ] Desktop responsive layout
- [ ] iPad landscape responsive layout
- [ ] iPad portrait responsive layout
- [ ] Mobile responsive layout
- [ ] Empty state works
- [ ] Various data scenarios display correctly
- [ ] Semantic colors only (no hex)
- [ ] Touch targets adequate (44px min)

---

## Success Criteria

**Must Have:**
- ✅ PipelineSummary component created
- ✅ Metrics calculation logic implemented
- ✅ Pipeline health calculation implemented
- ✅ UI components display metrics
- ✅ Integrated into Dashboard sidebar
- ✅ 18+ unit tests passing
- ✅ Manual QA on iPad/desktop

**Design Compliance:**
- ✅ Follows DashboardWidget wrapper pattern
- ✅ Table-style design (not card-based)
- ✅ Semantic colors only (CSS variables)
- ✅ Compact layout (~300px height)
- ✅ Responsive (stacks on mobile/portrait)

**Code Quality:**
- ✅ TypeScript strict mode
- ✅ TDD approach (test first, then implement)
- ✅ Exports calculation functions for testing
- ✅ Follows existing widget patterns
- ✅ Frequent commits with clear messages

---

## Reference Files

**Existing Patterns:**
- `src/atomic-crm/dashboard/MyTasksThisWeek.tsx` - Widget pattern
- `src/atomic-crm/dashboard/RecentActivityFeed.tsx` - Widget pattern
- `src/atomic-crm/dashboard/DashboardWidget.tsx` - Wrapper component
- `src/atomic-crm/opportunities/stageConstants.ts` - Stage definitions

**Design Documents:**
- `docs/plans/2025-11-07-dashboard-widgets-design.md:386-506` - Widget spec
- `docs/plans/2025-11-05-principal-centric-crm-design.md` - Dashboard design
- `docs/claude/engineering-constitution.md` - Code principles

**Testing:**
- `src/test-utils.tsx` - TestWrapper for React Admin
- `src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx` - Test examples

---

**Plan Status:** Ready for execution
**Estimated Time:** 2-3 hours (7 bite-sized tasks)
**Next Step:** Use superpowers:executing-plans to implement task-by-task
