# Reports Module Cleanup - Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical bugs, improve UX with collapsible sections, and apply visual polish to the Reports module.

**Architecture:** Minimal surgical changes following existing patterns. Each phase is independent and can be executed separately. TDD approach with tests first.

**Tech Stack:** React 19, Vitest, React Testing Library, shadcn/ui (Collapsible, Badge, Button), Chart.js, Tailwind CSS v4

**Design System Requirements:**
- Desktop-first: `lg:` breakpoint (1024px+), never `md:`
- Semantic spacing: `space-y-section`, `gap-content`, `gap-section`
- 44px touch targets: `h-11` class
- Semantic colors only: CSS vars like `--primary`, `--chart-1`

---

## Phase 1: Quick Wins (Bug Fixes & Collapse Behavior)

**Estimated Time:** ~1.5 hours

### Task 1.1: Fix Coverage Rate Calculation Bug

**Files:**
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:311-319`
- Test: `src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx`

**Problem:** Current calculation `(uniqueOrgs / totalOpportunities) * 100` shows 2700% because it divides organizations contacted by total opportunities (wrong denominator).

**Step 1: Write the failing test**

```typescript
describe("Coverage Rate Calculation", () => {
  it("does not exceed 100% when orgs > opportunities (bug case)", async () => {
    const { useGetList } = await import("ra-core");

    // 1 opportunity in campaign
    const mockOpportunities = [
      { id: 1, name: "Opp 1", campaign: "Grand Rapids Trade Show" },
    ];

    // Activities from 3 different orgs for the same opportunity (this caused 300% before)
    const mockActivities = [
      { id: 1, type: "call", organization_id: 10, opportunity_id: 1 },
      { id: 2, type: "email", organization_id: 20, opportunity_id: 1 },
      { id: 3, type: "note", organization_id: 30, opportunity_id: 1 },
    ];

    vi.mocked(useGetList).mockImplementation((resource: string) => {
      if (resource === "opportunities") return { data: mockOpportunities, isPending: false } as any;
      if (resource === "activities") return { data: mockActivities, isPending: false } as any;
      return { data: [], isPending: false } as any;
    });

    render(<MemoryRouter><CampaignActivityReport /></MemoryRouter>);

    await waitFor(() => {
      // Coverage Rate should be 100% (1 opportunity has activity / 1 total)
      // NOT 300% (3 unique orgs / 1 opportunity - the bug)
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**
```bash
npm test -- src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx --run
```

**Step 3: Write minimal implementation**

Replace lines 311-319:

```typescript
// Calculate summary metrics
const totalActivities = activities.length;
const uniqueOrgs = new Set(activities.map((a) => a.organization_id)).size;

// Get all opportunities for this campaign
const campaignOpportunities = allOpportunities.filter(
  (opp) => opp.campaign === selectedCampaign
);
const totalOpportunities = campaignOpportunities.length || 1;

// Coverage Rate: percentage of opportunities that have at least one activity
const opportunitiesWithActivities = new Set(
  activities.map((a) => a.opportunity_id).filter(Boolean)
).size;
const coverageRate =
  totalOpportunities > 0
    ? Math.round((opportunitiesWithActivities / totalOpportunities) * 100)
    : 0;

const avgActivitiesPerOpportunity =
  totalOpportunities > 0 ? (totalActivities / totalOpportunities).toFixed(1) : "0.0";
```

**Step 4: Run test to verify it passes**
```bash
npm test -- src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx --run
```

**Step 5: Commit**
```bash
git add src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx && git commit -m "$(cat <<'EOF'
fix(reports): correct coverage rate calculation in CampaignActivityReport

Changed from (unique orgs / total opportunities) to
(opportunities with activities / total opportunities) * 100

This ensures coverage rate represents opportunity engagement, capped at 100%.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Fix "Avg Activities per Lead" Label

**Files:**
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:786-789`

**Step 1: Write the failing test**

```typescript
it("displays 'Avg Activities per Opportunity' label (not 'per Lead')", async () => {
  render(<MemoryRouter><CampaignActivityReport /></MemoryRouter>);

  await waitFor(() => {
    expect(screen.getByText("Avg Activities per Opportunity")).toBeInTheDocument();
    expect(screen.queryByText("Avg Activities per Lead")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**
```bash
npm test -- src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx --run
```

**Step 3: Write minimal implementation**

Change lines 786-789:
```tsx
<CardTitle className="text-sm font-medium text-muted-foreground">
  Avg Activities per Opportunity
</CardTitle>
```

Also update variable name to `avgActivitiesPerOpportunity` (done in Task 1.1).

**Step 4: Run test to verify it passes**

**Step 5: Commit**
```bash
git add src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx && git commit -m "$(cat <<'EOF'
fix(reports): rename 'Avg Activities per Lead' to 'Avg Activities per Opportunity'

Align terminology with PRD which uses 'Opportunity' throughout.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.3: Fix CampaignActivityReport Auto-Expand Behavior

**Files:**
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:70-71,286-293,819-831`

**Step 1: Write the failing test**

```typescript
describe("Expand/Collapse Behavior", () => {
  it("defaults all activity type cards to collapsed", async () => {
    // ... setup mocks ...
    render(<MemoryRouter><CampaignActivityReport /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
    });

    // All cards should be collapsed - no expanded content visible
    expect(screen.queryByText("Call 1")).not.toBeInTheDocument();
  });

  it("renders Expand All / Collapse All button", async () => {
    render(<MemoryRouter><CampaignActivityReport /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText("Expand All")).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Write minimal implementation**

1. Delete the auto-expand useEffect (lines 286-293) and `hasInitialized` ref (lines 70-71)

2. Add expand/collapse handlers:
```typescript
const handleExpandAll = () => {
  setExpandedTypes(new Set(activityGroups.map((g) => g.type)));
};

const handleCollapseAll = () => {
  setExpandedTypes(new Set());
};

const allExpanded = activityGroups.length > 0 && expandedTypes.size === activityGroups.length;
```

3. Update Activity Type Breakdown section:
```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold">Activity Type Breakdown</h3>
  <Button
    variant="outline"
    size="sm"
    onClick={allExpanded ? handleCollapseAll : handleExpandAll}
    className="h-11"
  >
    {allExpanded ? "Collapse All" : "Expand All"}
  </Button>
</div>
```

**Step 4: Run test to verify it passes**

**Step 5: Commit**
```bash
git commit -m "feat(reports): add Expand All/Collapse All for CampaignActivityReport"
```

---

### Task 1.4: Fix OpportunitiesByPrincipalReport Auto-Expand Behavior

**Files:**
- Modify: `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx:259-263,278,366-384`

**Step 1: Write the failing test**

```typescript
describe("Expand/Collapse Behavior", () => {
  it("defaults all principal groups to collapsed", async () => {
    // ... setup with 4 principals ...
    render(<MemoryRouter><OpportunitiesByPrincipalReport /></MemoryRouter>);

    // All should be collapsed - opportunity details should not be visible
    expect(screen.queryByText("Customer 1")).not.toBeInTheDocument();
  });

  it("renders Expand All / Collapse All button", async () => {
    render(<MemoryRouter><OpportunitiesByPrincipalReport /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText("Expand All")).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Write minimal implementation**

1. Remove auto-expand logic from principalGroups useMemo (lines 259-263)

2. Add handlers:
```typescript
const handleExpandAll = () => {
  setExpandedPrincipals(new Set(principalGroups.map((g) => g.principalId || "null")));
};

const handleCollapseAll = () => {
  setExpandedPrincipals(new Set());
};

const allExpanded =
  principalGroups.length > 0 && expandedPrincipals.size === principalGroups.length;
```

3. Add button before accordion list:
```tsx
<div className="flex justify-end">
  <Button
    variant="outline"
    size="sm"
    onClick={allExpanded ? handleCollapseAll : handleExpandAll}
    className="h-11"
  >
    {allExpanded ? "Collapse All" : "Expand All"}
  </Button>
</div>
```

**Step 4: Run test to verify it passes**

**Step 5: Commit**
```bash
git commit -m "feat(reports): add Expand All/Collapse All for OpportunitiesByPrincipalReport"
```

---

## Phase 2: Opportunities Tab Improvements

**Estimated Time:** ~4 hours

### Task 2.1: Replace Custom FilterToolbar with TabFilterBar

**Files:**
- Modify: `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx:44-137,153-165,335-339`

**Step 1: Write the failing test**

```typescript
describe("OpportunitiesByPrincipalReport - TabFilterBar Integration", () => {
  it("renders TabFilterBar with date range selector", () => {
    render(<OpportunitiesByPrincipalReport />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
  });

  it("meets 44px touch target requirement on filter controls", () => {
    render(<OpportunitiesByPrincipalReport />, { wrapper: Wrapper });
    const comboboxes = screen.getAllByRole("combobox");
    comboboxes.forEach((combobox) => {
      expect(combobox).toHaveClass("h-11");
    });
  });
});
```

**Step 2-5:** Delete custom FilterToolbar (~90 lines), replace with TabFilterBar pattern from OverviewTab.

---

### Task 2.2: Add Semantic Badge Variants for Stage Display

**Files:**
- Modify: `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx:479`

**Implementation:**

```typescript
function getStageBadgeVariant(stage: string): "default" | "secondary" | "destructive" | "outline" {
  switch (stage) {
    case "closed_won": return "default";
    case "closed_lost": return "destructive";
    case "demo_scheduled": return "secondary";
    default: return "outline";
  }
}

// In render:
<Badge variant={getStageBadgeVariant(opp.stage)}>{opp.stage}</Badge>
```

---

### Task 2.3: Add Summary Bar Chart

**Files:**
- Create: `src/atomic-crm/reports/charts/PrincipalOpportunitiesChart.tsx`
- Modify: `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`

Add horizontal bar chart between KPI cards and accordion, reusing TopPrincipalsChart pattern.

---

## Phase 3: Campaign Activity Tab Improvements

**Estimated Time:** ~3.5 hours

### Task 3.1: Reorganize Filter Section with Collapsible Panel

**Files:**
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:552-732`

**Implementation:**

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const [filtersExpanded, setFiltersExpanded] = useState(false);

const activeFilterCount = useMemo(() => {
  let count = 0;
  if (dateRange !== null) count++;
  if (selectedActivityTypes.length < INTERACTION_TYPE_OPTIONS.length) count++;
  if (selectedSalesRep !== null) count++;
  if (showStaleLeads) count++;
  return count;
}, [dateRange, selectedActivityTypes.length, selectedSalesRep, showStaleLeads]);

<Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
  <Card>
    <CollapsibleTrigger asChild>
      <button className="w-full h-11 flex items-center justify-between px-4">
        <div className="flex items-center gap-content">
          <span className="font-medium">Filters</span>
          <Badge variant="secondary">{activeFilterCount} active</Badge>
        </div>
        <ChevronDown className={`h-4 w-4 ${filtersExpanded ? "rotate-180" : ""}`} />
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      {/* Existing filter content */}
    </CollapsibleContent>
  </Card>
</Collapsible>
```

---

### Task 3.2: Add Summary Bar Chart for Activity Distribution

**Files:**
- Create: `src/atomic-crm/reports/CampaignActivity/ActivityDistributionChart.tsx`
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`

Clickable horizontal bar chart that scrolls to and expands corresponding ActivityTypeCard.

---

## Phase 4: Overview Tab Visual Polish

**Estimated Time:** ~2 hours

### Task 4.1: Standardize KPI Card Subtitles

**Files:**
- Modify: `src/atomic-crm/reports/tabs/OverviewTab.tsx:322-360`

Ensure all subtitles under 60 characters with consistent phrasing.

---

### Task 4.2: Increase Chart Height to 320px

**Files:**
- Modify: `src/atomic-crm/reports/components/ChartWrapper.tsx:22`

```tsx
<div className="h-[280px] lg:h-[320px]">
```

---

### Task 4.3: Pipeline Chart Semantic Colors

**Files:**
- Modify: `src/atomic-crm/reports/charts/PipelineChart.tsx:26-33`
- Modify: `src/atomic-crm/reports/hooks/useChartTheme.ts`

Use `var(--chart-1)` through `var(--chart-7)` instead of hardcoded color references.

---

### Task 4.4: TabFilterBar Visual Polish

**Files:**
- Modify: `src/atomic-crm/reports/components/TabFilterBar.tsx:96`

```tsx
<div className="... bg-muted/70 border border-border rounded-lg">
```

---

## Summary

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| Phase 1 | 4 tasks (bugs + collapse) | 1.5 hrs | HIGH |
| Phase 2 | 3 tasks (Opportunities tab) | 4 hrs | MEDIUM |
| Phase 3 | 2 tasks (Campaign Activity) | 3.5 hrs | MEDIUM |
| Phase 4 | 4 tasks (visual polish) | 2 hrs | LOW |

**Total: ~11 hours**

**Quick Wins First:** Phase 1 fixes the most visible issues (2700% bug, long pages) in ~1.5 hours.

---

## Critical Files

1. `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` - Coverage rate bug, label fix, collapse behavior
2. `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx` - Filter consolidation, badge variants, collapse behavior
3. `src/atomic-crm/reports/components/TabFilterBar.tsx` - Reusable filter pattern
4. `src/atomic-crm/reports/components/ChartWrapper.tsx` - Chart height fix
5. `src/atomic-crm/reports/charts/PipelineChart.tsx` - Semantic colors
