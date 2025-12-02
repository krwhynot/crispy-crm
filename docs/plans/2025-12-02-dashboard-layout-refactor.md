# Dashboard Layout Refactor (Option C) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the Principal Dashboard by removing redundant components, extracting reusable elements, and applying consistent design system patterns.

**Architecture:** Remove `MyPerformanceWidget` (duplicates KPISummaryRow metrics), expand `ActivityFeedPanel` to full-width, extract `DashboardHeader` component, wrap `PrincipalPipelineTable` in Card, and apply semantic spacing tokens throughout.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui, Vitest

---

## Summary of Changes

| Component | Action | Reason |
|-----------|--------|--------|
| `MyPerformanceWidget.tsx` | DELETE | Duplicates KPI metrics |
| `useMyPerformance.ts` | DELETE | No longer needed |
| `DashboardHeader.tsx` | CREATE | Extracted reusable header |
| `PrincipalDashboardV3.tsx` | MODIFY | Use new layout structure |
| `PrincipalPipelineTable.tsx` | MODIFY | Wrap in Card |
| `ActivityFeedPanel.tsx` | MODIFY | Full-width layout |
| `PrincipalDashboardV3.test.tsx` | MODIFY | Update test expectations |

---

## Task 1: Delete MyPerformanceWidget and Hook

**Files:**
- Delete: `src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx`
- Delete: `src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts`

**Step 1: Verify no other imports exist**

Run: `grep -r "MyPerformanceWidget\|useMyPerformance" src/ --include="*.tsx" --include="*.ts" | grep -v "\.test\." | grep -v "__tests__"`

Expected: Only `PrincipalDashboardV3.tsx` should import these.

**Step 2: Delete the component file**

```bash
rm src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx
```

**Step 3: Delete the hook file**

```bash
rm src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts
```

**Step 4: Verify deletion**

```bash
ls src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx 2>&1 | grep -q "No such file" && echo "PASS: Component deleted"
ls src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts 2>&1 | grep -q "No such file" && echo "PASS: Hook deleted"
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete redundant MyPerformanceWidget

Metrics were duplicated in KPISummaryRow (Open Opps, Activities).
Removing to reduce cognitive load and API calls."
```

---

## Task 2: Create DashboardHeader Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx`
- Test: `src/atomic-crm/dashboard/v3/components/__tests__/DashboardHeader.test.tsx`

**Step 1: Write the failing test**

Create file `src/atomic-crm/dashboard/v3/components/__tests__/DashboardHeader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardHeader } from "../DashboardHeader";

describe("DashboardHeader", () => {
  it("should render the title", () => {
    render(<DashboardHeader title="Principal Dashboard" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Principal Dashboard");
  });

  it("should render optional subtitle", () => {
    render(
      <DashboardHeader
        title="Principal Dashboard"
        subtitle="Track your pipeline"
      />
    );
    expect(screen.getByText("Track your pipeline")).toBeInTheDocument();
  });

  it("should render children in actions slot", () => {
    render(
      <DashboardHeader title="Test">
        <button>Action</button>
      </DashboardHeader>
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("should use semantic header element", () => {
    const { container } = render(<DashboardHeader title="Test" />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("should apply consistent spacing with border-b", () => {
    const { container } = render(<DashboardHeader title="Test" />);
    const header = container.querySelector("header");
    expect(header).toHaveClass("border-b", "border-border");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/dashboard/v3/components/__tests__/DashboardHeader.test.tsx`

Expected: FAIL - "Cannot find module '../DashboardHeader'"

**Step 3: Write minimal implementation**

Create file `src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx`:

```tsx
interface DashboardHeaderProps {
  /** Page title displayed as h1 */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Optional action buttons (right side) */
  children?: React.ReactNode;
}

/**
 * DashboardHeader - Reusable dashboard page header
 *
 * Provides consistent styling for dashboard headers with:
 * - Title (h1) and optional subtitle
 * - Actions slot on the right (for buttons, search, etc.)
 * - Border bottom for visual separation
 * - Semantic HTML (header element)
 *
 * @example
 * ```tsx
 * <DashboardHeader title="Principal Dashboard" subtitle="Track your pipeline">
 *   <Button>Log Activity</Button>
 * </DashboardHeader>
 * ```
 */
export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-content lg:px-widget">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-content">{children}</div>
        )}
      </div>
    </header>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v3/components/__tests__/DashboardHeader.test.tsx`

Expected: PASS - All 5 tests pass

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx
git add src/atomic-crm/dashboard/v3/components/__tests__/DashboardHeader.test.tsx
git commit -m "feat: add DashboardHeader component

Extracted from PrincipalDashboardV3 for reusability.
Uses semantic spacing tokens (px-content, gap-content)."
```

---

## Task 3: Update PrincipalPipelineTable with Card Wrapper

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`

**Step 1: Import Card component**

At the top of the file, add to imports:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
```

**Step 2: Wrap the return JSX in Card**

Replace the outer div structure. Find this code (around line 141-142):

```tsx
return (
  <div className="flex h-full flex-col">
    {/* Header with title and filters */}
    <div className="border-b border-border pb-4">
```

Replace with:

```tsx
return (
  <Card className="card-container flex h-full flex-col">
    {/* Header with title and filters */}
    <CardHeader className="border-b border-border pb-3 shrink-0">
```

**Step 3: Update the header content structure**

Find this code (around line 145-151):

```tsx
<div className="flex items-start justify-between">
  <div>
    <h2 className="text-lg font-semibold">Pipeline by Principal</h2>
    <p className="text-sm text-muted-foreground">
      Track opportunity momentum across your customer accounts
    </p>
  </div>
```

Replace with:

```tsx
<div className="flex items-start justify-between">
  <div>
    <CardTitle className="text-lg font-semibold">Pipeline by Principal</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Track opportunity momentum across your customer accounts
    </CardDescription>
  </div>
```

**Step 4: Close the header properly**

Find the closing `</div>` for the header section (around line 179) and replace:

```tsx
    </div>
  </div>
```

With:

```tsx
    </div>
  </CardHeader>
```

**Step 5: Wrap table in CardContent**

Find the table container div (around line 181-182):

```tsx
{/* Table */}
<div className="flex-1 overflow-auto">
```

Replace with:

```tsx
{/* Table */}
<CardContent className="flex-1 overflow-auto p-0">
```

**Step 6: Close CardContent and Card**

Find the closing div before the drill-down sheet (around line 246):

```tsx
      </div>
    </div>

    {/* Drill-Down Sheet - lazy loaded */}
```

Replace with:

```tsx
      </CardContent>
    </Card>

    {/* Drill-Down Sheet - lazy loaded */}
```

Wait - that's wrong. The drill-down sheet needs to be OUTSIDE the Card. Let me fix:

Find line ~259 closing `</div>`:

```tsx
      </div>
    </div>
  );
```

The structure should be:
```tsx
      </CardContent>

      {/* Drill-Down Sheet - lazy loaded */}
      {selectedPrincipal !== null && (
        <Suspense fallback={null}>
          <PipelineDrillDownSheet
            principalId={selectedPrincipal.id}
            principalName={selectedPrincipal.name}
            isOpen={true}
            onClose={handleCloseSheet}
          />
        </Suspense>
      )}
    </Card>
  );
```

**Step 7: Update loading skeleton to match**

Find the loading state return (around line 82-127) and update the outer wrapper:

```tsx
if (loading) {
  return (
    <Card className="card-container flex h-full flex-col">
      {/* Header skeleton matching production header */}
      <CardHeader className="border-b border-border pb-3 shrink-0">
```

And close it properly:

```tsx
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 8: Update error state to match**

Find the error state (around line 129-139):

```tsx
if (error) {
  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader>
        <CardTitle>Pipeline by Principal</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load pipeline data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 9: Run tests**

Run: `npm test -- src/atomic-crm/dashboard/v3/components/__tests__/PrincipalPipelineTable.test.tsx`

Expected: PASS

**Step 10: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx
git commit -m "refactor: wrap PrincipalPipelineTable in Card

Aligns with design system .card-container pattern.
Uses CardHeader/CardContent for semantic structure."
```

---

## Task 4: Update PrincipalDashboardV3 Layout

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`

**Step 1: Remove MyPerformanceWidget import**

Find and delete this line (around line 9):

```tsx
import { MyPerformanceWidget } from "./components/MyPerformanceWidget";
```

**Step 2: Add DashboardHeader import**

Add this import:

```tsx
import { DashboardHeader } from "./components/DashboardHeader";
```

**Step 3: Replace inline header with DashboardHeader component**

Find the header section (around line 45-50):

```tsx
{/* Header */}
<header className="border-b border-border bg-card">
  <div className="flex h-16 items-center px-6">
    <h1 className="text-xl font-semibold">Principal Dashboard</h1>
  </div>
</header>
```

Replace with:

```tsx
{/* Header */}
<DashboardHeader title="Principal Dashboard" />
```

**Step 4: Apply semantic spacing to main content**

Find (around line 52-54):

```tsx
{/* Main Content - Vertically stacked layout */}
<main className="relative flex-1 overflow-auto p-4">
  <div className="flex flex-col gap-4">
```

Replace with:

```tsx
{/* Main Content - Vertically stacked layout */}
<main className="relative flex-1 overflow-auto p-content lg:p-widget">
  <div className="flex flex-col gap-section">
```

**Step 5: Remove bottom 2-column grid and MyPerformanceWidget**

Find the bottom section (around line 64-71):

```tsx
{/* Performance + Activity - Two columns on desktop, stacked on mobile */}
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
  {/* My Performance Widget */}
  <MyPerformanceWidget key={`performance-${refreshKey}`} />

  {/* Activity Feed Panel */}
  <ActivityFeedPanel key={`activities-${refreshKey}`} limit={10} />
</div>
```

Replace with (ActivityFeedPanel now full-width):

```tsx
{/* Activity Feed - Full width */}
<section aria-label="Team Activity">
  <ActivityFeedPanel key={`activities-${refreshKey}`} limit={15} />
</section>
```

**Step 6: Add section landmarks to other sections**

Wrap KPISummaryRow (around line 55-56):

```tsx
{/* KPI Summary Row */}
<KPISummaryRow key={`kpi-${refreshKey}`} />
```

Already has aria-label inside component, so leave as-is.

Wrap PrincipalPipelineTable (around line 58-59):

```tsx
{/* Pipeline Table - Full width */}
<section aria-label="Pipeline by Principal">
  <PrincipalPipelineTable key={`pipeline-${refreshKey}`} />
</section>
```

Wrap TasksKanbanPanel (around line 61-62):

```tsx
{/* Tasks Kanban Board - Full width */}
<section aria-label="My Tasks">
  <TasksKanbanPanel key={`tasks-${refreshKey}`} />
</section>
```

**Step 7: Run lint check**

Run: `npm run lint:apply`

**Step 8: Run tests**

Run: `npm test -- src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx`

Expected: Some tests will FAIL (we'll fix in Task 5)

**Step 9: Commit (work in progress)**

```bash
git add src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx
git commit -m "refactor: update dashboard layout with semantic spacing

- Use DashboardHeader component
- Remove MyPerformanceWidget (redundant)
- Full-width ActivityFeedPanel
- Apply semantic spacing tokens (gap-section, p-content)
- Add section landmarks for accessibility

BREAKING: Tests need update in next commit"
```

---

## Task 5: Update Dashboard Tests

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx`

**Step 1: Remove useMyPerformance mock**

Find and delete this mock (around lines 45-56):

```tsx
// Mock the useMyPerformance hook (used by MyPerformanceWidget)
vi.mock("../hooks/useMyPerformance", () => ({
  useMyPerformance: () => ({
    metrics: {
      activitiesThisWeek: { value: 5, previousValue: 3, trend: 67, direction: "up" as const },
      dealsMoved: { value: 2, previousValue: 2, trend: 0, direction: "flat" as const },
      tasksCompleted: { value: 8, previousValue: 10, trend: -20, direction: "down" as const },
      openOpportunities: { value: 12, previousValue: 10, trend: 20, direction: "up" as const },
    },
    loading: false,
  }),
}));
```

**Step 2: Remove the 2-column grid test**

Find and delete this test (around lines 151-161):

```tsx
it("should have 2-column grid for Performance + Activity bottom row", () => {
  const { container } = render(
    <MemoryRouter>
      <PrincipalDashboardV3 />
    </MemoryRouter>
  );

  // Bottom row uses grid-cols-1 (mobile) lg:grid-cols-2 (desktop)
  const bottomGrid = container.querySelector(".grid.grid-cols-1.lg\\:grid-cols-2");
  expect(bottomGrid).toBeInTheDocument();
});
```

**Step 3: Update the "all sections" test**

Find this test (around line 163-185) and update it:

```tsx
it("should render all dashboard sections in vertical stack order", () => {
  render(
    <MemoryRouter>
      <PrincipalDashboardV3 />
    </MemoryRouter>
  );

  // Verify all sections are present (order is implicit by DOM structure)
  // 1. KPI Summary Row
  expect(screen.getByLabelText("Key Performance Indicators")).toBeInTheDocument();

  // 2. Pipeline Table
  expect(screen.getByLabelText("Pipeline by Principal")).toBeInTheDocument();

  // 3. Tasks Kanban
  expect(screen.getByLabelText("My Tasks")).toBeInTheDocument();

  // 4. Activity Feed Panel (now full-width, no Performance widget)
  expect(screen.getByLabelText("Team Activity")).toBeInTheDocument();
});
```

**Step 4: Remove "My Performance" assertion**

Find line 181 and delete:

```tsx
// 4. My Performance Widget
expect(screen.getByText("My Performance")).toBeInTheDocument();
```

**Step 5: Add test for semantic spacing**

Add new test after the "vertically stacked layout" test:

```tsx
it("should use semantic spacing tokens", () => {
  const { container } = render(
    <MemoryRouter>
      <PrincipalDashboardV3 />
    </MemoryRouter>
  );

  // Main content should use semantic spacing
  const mainElement = container.querySelector("main");
  expect(mainElement).toHaveClass("p-content");

  // Sections should use gap-section for vertical spacing
  const sectionContainer = mainElement?.querySelector(".gap-section");
  expect(sectionContainer).toBeInTheDocument();
});
```

**Step 6: Run tests**

Run: `npm test -- src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx`

Expected: PASS - All tests pass

**Step 7: Run full test suite**

Run: `npm test`

Expected: PASS - No regressions

**Step 8: Commit**

```bash
git add src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx
git commit -m "test: update dashboard tests for new layout

- Remove MyPerformanceWidget mock and assertions
- Update section landmark expectations
- Add semantic spacing token test
- Remove 2-column grid test (no longer applicable)"
```

---

## Task 6: Final Verification and Cleanup

**Step 1: Run build**

Run: `npm run build`

Expected: PASS - No TypeScript errors

**Step 2: Run full test suite with coverage**

Run: `npm run test:ci`

Expected: PASS - Coverage should remain above 70%

**Step 3: Visual verification (manual)**

Run: `npm run dev`

Check:
- [ ] Dashboard loads without errors
- [ ] KPI cards display correctly (4-column on desktop)
- [ ] Pipeline table has card styling
- [ ] Tasks kanban works (drag-drop)
- [ ] Activity feed is full-width
- [ ] No "My Performance" widget visible
- [ ] Spacing looks consistent

**Step 4: Commit final changes (if any)**

```bash
git add -A
git commit -m "chore: dashboard layout refactor complete

Option C implementation:
- Removed redundant MyPerformanceWidget
- Extracted DashboardHeader component
- Applied semantic spacing tokens
- Added section landmarks for accessibility
- Full-width ActivityFeedPanel"
```

---

## Success Criteria

- [ ] `MyPerformanceWidget.tsx` deleted
- [ ] `useMyPerformance.ts` deleted
- [ ] `DashboardHeader.tsx` created with tests
- [ ] `PrincipalPipelineTable` wrapped in Card
- [ ] Dashboard uses semantic spacing (`gap-section`, `p-content`)
- [ ] Activity feed is full-width
- [ ] All tests pass (`npm run test:ci`)
- [ ] Build succeeds (`npm run build`)
- [ ] No "My Performance" visible in UI

---

## Rollback Plan

If issues arise:

```bash
# Revert all commits from this refactor
git log --oneline | head -6  # Find first commit hash before refactor
git revert --no-commit HEAD~5..HEAD
git commit -m "revert: rollback dashboard layout refactor"
```

---

## Files Changed Summary

```
 src/atomic-crm/dashboard/v3/
 ├── PrincipalDashboardV3.tsx         # MODIFIED - New layout
 ├── components/
 │   ├── DashboardHeader.tsx          # CREATED - New component
 │   ├── MyPerformanceWidget.tsx      # DELETED
 │   ├── PrincipalPipelineTable.tsx   # MODIFIED - Card wrapper
 │   └── __tests__/
 │       └── DashboardHeader.test.tsx # CREATED - New tests
 ├── hooks/
 │   └── useMyPerformance.ts          # DELETED
 └── __tests__/
     └── PrincipalDashboardV3.test.tsx # MODIFIED - Updated expectations
```
