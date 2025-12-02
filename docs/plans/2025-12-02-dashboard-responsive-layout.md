# Dashboard Responsive Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement PRD Section 9.2.6's 5-breakpoint responsive dashboard layout with collapsible Tasks panel, icon rail, and drawer overlays.

**Architecture:** Transform the current vertical-stacking layout into a CSS Grid-based responsive system. Desktop shows 3-panel simultaneous view (Pipeline + Tasks). Laptop collapses Tasks to 48px icon rail with click-to-expand drawer. Tablet/mobile use Sheet overlays. Reuse existing `Sheet`, `useIsMobile`, and animation patterns.

**Tech Stack:** React 19, Tailwind CSS v4, Radix UI Sheet, CSS Grid, CSS Custom Properties

---

## Strategic Context

**PRD Compliance Gap:** Current implementation scores 93% (14/15 features). This plan addresses the missing responsive layout requirement (Section 9.2.6).

**Current State:** Pure vertical flex stacking (`flex-col gap-section`) with no grid layout at dashboard level.

**Target State:** 5-breakpoint responsive grid with icon rail, drawer overlays, and master-detail navigation.

| Breakpoint | Layout | Tasks Panel Behavior |
|------------|--------|---------------------|
| Desktop (1440px+) | 3-panel grid | Inline 320px panel |
| Laptop (1280-1439px) | 2-panel + icon rail | 48px rail → 320px drawer |
| iPad Landscape (1024-1279px) | 2-panel + overlay | Sheet from right (320px) |
| iPad Portrait (768-1023px) | Master-detail | Sheet from right (70% width) |
| Mobile (<768px) | Single column | Bottom sheet via MobileQuickActionBar |

---

## Phase 0: Critical Pre-Layout Fixes

> **Rationale:** These fixes address HIGH severity issues from the UI/UX audit that are independent of the responsive layout work. They should be completed first to establish a solid foundation.

### Task 0.1: Add Draft Persistence to MobileQuickActionBar

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/MobileQuickActionBar.tsx`
- Reference: `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx` (existing pattern)

**Rationale:** Desktop FAB has draft persistence but MobileQuickActionBar doesn't. Users who navigate away mid-form lose their input.

**Severity:** HIGH | **Impact:** User data loss on mobile

**Step 1: Examine the existing pattern in LogActivityFAB**

```bash
grep -A 30 "useDraftPersistence\|onDraftChange" src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx
```

**Step 2: Add draft persistence to MobileQuickActionBar**

```typescript
// Add to MobileQuickActionBar.tsx
import { useDraftPersistence } from "@/hooks/useDraftPersistence";

// Inside the component:
const { draft, saveDraft, clearDraft } = useDraftPersistence("mobile-quick-log", {
  debounceMs: 500,
  expiryHours: 24,
});

// Pass to QuickLogForm:
<QuickLogForm
  defaultValues={draft}
  onDraftChange={saveDraft}
  onSuccess={clearDraft}
/>
```

**Step 3: Verify functionality**

```bash
npm run dev
# Test: Start filling mobile form → navigate away → return → form should restore
```

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/MobileQuickActionBar.tsx
git commit -m "fix(dashboard): add draft persistence to MobileQuickActionBar

Matches desktop LogActivityFAB behavior - prevents data loss when users
navigate away from partially filled activity forms on mobile.

- Uses 500ms debounce to avoid excessive localStorage writes
- 24-hour expiry on drafts
- Audit fix: HIGH severity"
```

---

### Task 0.2: Add Table Header Scope Attributes

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`

**Rationale:** WCAG 2.1 AA requires table headers to have `scope` attributes for screen readers.

**Severity:** HIGH | **Impact:** Accessibility compliance

**Step 1: Identify TableHead elements**

```bash
grep -n "TableHead\|<th" src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx
```

**Step 2: Add scope="col" to all column headers**

```typescript
// Before:
<TableHead className="...">Principal</TableHead>
<TableHead className="...">Status</TableHead>

// After:
<TableHead scope="col" className="...">Principal</TableHead>
<TableHead scope="col" className="...">Status</TableHead>
```

**Step 3: Verify with accessibility check**

```bash
npm run dev
# Use axe DevTools or NVDA to verify header associations
```

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx
git commit -m "a11y(dashboard): add scope attributes to pipeline table headers

WCAG 2.1 AA compliance - adds scope='col' to all TableHead elements
for proper screen reader association.

Audit fix: HIGH severity"
```

---

## Phase 1: Foundation (Hooks & Utilities)

### Task 1.1: Create useBreakpoint Hook

**Files:**
- Create: `src/hooks/useBreakpoint.ts`
- Create: `src/hooks/__tests__/useBreakpoint.test.ts`

**Rationale:** Need granular breakpoint detection beyond simple `useIsMobile`. PRD requires 5 distinct layouts.

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useBreakpoint.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBreakpoint } from "../useBreakpoint";

describe("useBreakpoint", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns mobile breakpoint for small screens", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 767px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("mobile");
  });

  it("returns tablet-portrait for 768-1023px", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px) and (max-width: 1023px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("tablet-portrait");
  });

  it("returns tablet-landscape for 1024-1279px", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1024px) and (max-width: 1279px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("tablet-landscape");
  });

  it("returns laptop for 1280-1439px", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1280px) and (max-width: 1439px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("laptop");
  });

  it("returns desktop for 1440px+", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1440px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("desktop");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="useBreakpoint" --run
```

Expected: FAIL with "Cannot find module '../useBreakpoint'"

**Step 3: Write minimal implementation**

```typescript
// src/hooks/useBreakpoint.ts
import { useEffect, useState } from "react";

export type Breakpoint =
  | "mobile"
  | "tablet-portrait"
  | "tablet-landscape"
  | "laptop"
  | "desktop";

const BREAKPOINT_QUERIES: Record<Breakpoint, string> = {
  mobile: "(max-width: 767px)",
  "tablet-portrait": "(min-width: 768px) and (max-width: 1023px)",
  "tablet-landscape": "(min-width: 1024px) and (max-width: 1279px)",
  laptop: "(min-width: 1280px) and (max-width: 1439px)",
  desktop: "(min-width: 1440px)",
};

const BREAKPOINT_ORDER: Breakpoint[] = [
  "desktop",
  "laptop",
  "tablet-landscape",
  "tablet-portrait",
  "mobile",
];

function getCurrentBreakpoint(): Breakpoint {
  for (const bp of BREAKPOINT_ORDER) {
    if (window.matchMedia(BREAKPOINT_QUERIES[bp]).matches) {
      return bp;
    }
  }
  return "mobile";
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    typeof window !== "undefined" ? getCurrentBreakpoint() : "desktop"
  );

  useEffect(() => {
    const mediaQueries = Object.entries(BREAKPOINT_QUERIES).map(
      ([bp, query]) => ({
        breakpoint: bp as Breakpoint,
        mql: window.matchMedia(query),
      })
    );

    const handleChange = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    mediaQueries.forEach(({ mql }) => {
      mql.addEventListener("change", handleChange);
    });

    return () => {
      mediaQueries.forEach(({ mql }) => {
        mql.removeEventListener("change", handleChange);
      });
    };
  }, []);

  return breakpoint;
}

// Convenience hooks
export function useIsDesktop(): boolean {
  return useBreakpoint() === "desktop";
}

export function useIsLaptopOrLarger(): boolean {
  const bp = useBreakpoint();
  return bp === "desktop" || bp === "laptop";
}

export function useIsMobileOrTablet(): boolean {
  const bp = useBreakpoint();
  return bp === "mobile" || bp === "tablet-portrait" || bp === "tablet-landscape";
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="useBreakpoint" --run
```

Expected: PASS (5 tests)

**Step 5: Export from hooks index**

```typescript
// Add to src/hooks/index.ts
export { useBreakpoint, useIsDesktop, useIsLaptopOrLarger, useIsMobileOrTablet } from "./useBreakpoint";
export type { Breakpoint } from "./useBreakpoint";
```

**Step 6: Commit**

```bash
git add src/hooks/useBreakpoint.ts src/hooks/__tests__/useBreakpoint.test.ts src/hooks/index.ts
git commit -m "feat(hooks): add useBreakpoint for 5-breakpoint responsive layout

- Detects mobile/tablet-portrait/tablet-landscape/laptop/desktop
- Exports convenience hooks: useIsDesktop, useIsLaptopOrLarger, useIsMobileOrTablet
- Supports PRD Section 9.2.6 responsive requirements"
```

---

### Task 1.2: Add Dashboard CSS Custom Properties

**Files:**
- Modify: `src/index.css`

**Rationale:** Define semantic layout variables for consistent dashboard sizing.

**Step 1: Add CSS variables**

Add after existing spacing tokens (around line 50):

```css
/* src/index.css - Dashboard Layout Tokens */
:root {
  /* Dashboard Panel Widths */
  --dashboard-tasks-width: 320px;
  --dashboard-icon-rail-width: 48px;
  --dashboard-tasks-drawer-width: 70%;

  /* Dashboard Transitions */
  --dashboard-transition-duration: 200ms;
  --dashboard-transition-easing: ease-out;
}
```

**Step 2: Verify CSS loads**

```bash
npm run dev
# Open browser DevTools, verify --dashboard-* variables exist on :root
```

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(styles): add dashboard layout CSS custom properties

- --dashboard-tasks-width: 320px
- --dashboard-icon-rail-width: 48px
- --dashboard-tasks-drawer-width: 70%
- --dashboard-transition-duration: 200ms"
```

---

## Phase 2: Tasks Panel Responsive Component

### Task 2.1: Create TasksIconRail Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/TasksIconRail.tsx`
- Create: `src/atomic-crm/dashboard/v3/components/__tests__/TasksIconRail.test.tsx`

**Rationale:** The 48px collapsed icon rail that shows on laptop breakpoint.

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/dashboard/v3/components/__tests__/TasksIconRail.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TasksIconRail } from "../TasksIconRail";

describe("TasksIconRail", () => {
  it("renders a 48px wide rail", () => {
    render(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    const rail = screen.getByRole("complementary");
    expect(rail).toHaveClass("w-12"); // 48px
  });

  it("displays task count badge", () => {
    render(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onExpand when clicked", () => {
    const onExpand = vi.fn();
    render(<TasksIconRail taskCount={3} onExpand={onExpand} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("has accessible label", () => {
    render(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    expect(screen.getByLabelText(/expand tasks/i)).toBeInTheDocument();
  });

  it("meets 44px minimum touch target", () => {
    render(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-11"); // 44px minimum
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="TasksIconRail" --run
```

Expected: FAIL with "Cannot find module '../TasksIconRail'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/dashboard/v3/components/TasksIconRail.tsx
import { CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TasksIconRailProps {
  taskCount: number;
  onExpand: () => void;
}

export function TasksIconRail({ taskCount, onExpand }: TasksIconRailProps) {
  return (
    <aside
      role="complementary"
      aria-label="Tasks panel (collapsed)"
      className="w-12 flex flex-col items-center gap-2 py-4 bg-muted border-l border-border"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            aria-label={`Expand tasks panel (${taskCount} tasks)`}
            className="h-11 w-11 relative"
          >
            <CheckSquare className="h-5 w-5" />
            {taskCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
              >
                {taskCount > 99 ? "99+" : taskCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tasks ({taskCount})</p>
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="TasksIconRail" --run
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/TasksIconRail.tsx \
        src/atomic-crm/dashboard/v3/components/__tests__/TasksIconRail.test.tsx
git commit -m "feat(dashboard): add TasksIconRail for laptop breakpoint

- 48px wide collapsed rail with task count badge
- Expands to drawer on click
- 44px touch target, accessible label, tooltip"
```

---

### Task 2.2: Create TasksDrawer Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/TasksDrawer.tsx`
- Create: `src/atomic-crm/dashboard/v3/components/__tests__/TasksDrawer.test.tsx`

**Rationale:** The Sheet-based drawer that slides in from the right on laptop/tablet.

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/dashboard/v3/components/__tests__/TasksDrawer.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TasksDrawer } from "../TasksDrawer";

// Mock TasksKanbanPanel to avoid complex setup
vi.mock("../TasksKanbanPanel", () => ({
  TasksKanbanPanel: () => <div data-testid="tasks-content">Tasks Content</div>,
}));

describe("TasksDrawer", () => {
  it("renders closed by default when open is false", () => {
    render(<TasksDrawer open={false} onOpenChange={vi.fn()} variant="laptop" />);
    expect(screen.queryByTestId("tasks-content")).not.toBeInTheDocument();
  });

  it("renders tasks content when open", async () => {
    render(<TasksDrawer open={true} onOpenChange={vi.fn()} variant="laptop" />);
    await waitFor(() => {
      expect(screen.getByTestId("tasks-content")).toBeInTheDocument();
    });
  });

  it("uses 320px width for laptop variant", async () => {
    render(<TasksDrawer open={true} onOpenChange={vi.fn()} variant="laptop" />);
    await waitFor(() => {
      const drawer = screen.getByRole("dialog");
      expect(drawer).toHaveClass("sm:max-w-[320px]");
    });
  });

  it("uses 70% width for tablet variant", async () => {
    render(<TasksDrawer open={true} onOpenChange={vi.fn()} variant="tablet" />);
    await waitFor(() => {
      const drawer = screen.getByRole("dialog");
      expect(drawer).toHaveClass("w-[70%]");
    });
  });

  it("calls onOpenChange when closed", async () => {
    const onOpenChange = vi.fn();
    render(<TasksDrawer open={true} onOpenChange={onOpenChange} variant="laptop" />);

    // Press Escape to close
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="TasksDrawer.test" --run
```

Expected: FAIL with "Cannot find module '../TasksDrawer'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/dashboard/v3/components/TasksDrawer.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TasksKanbanPanel } from "./TasksKanbanPanel";

interface TasksDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "laptop" | "tablet";
}

export function TasksDrawer({ open, onOpenChange, variant }: TasksDrawerProps) {
  const widthClass = variant === "laptop"
    ? "w-full sm:max-w-[320px]"
    : "w-[70%] sm:max-w-none";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`${widthClass} flex flex-col p-0 transition-transform duration-[var(--dashboard-transition-duration)] ease-[var(--dashboard-transition-easing)]`}
        aria-label="Tasks panel"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>Tasks</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto">
          <TasksKanbanPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="TasksDrawer.test" --run
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/TasksDrawer.tsx \
        src/atomic-crm/dashboard/v3/components/__tests__/TasksDrawer.test.tsx
git commit -m "feat(dashboard): add TasksDrawer for responsive overlay

- Laptop variant: 320px fixed width
- Tablet variant: 70% viewport width
- Uses Sheet with right slide animation
- Wraps existing TasksKanbanPanel"
```

---

### Task 2.3: Create ResponsiveTasksPanel Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/ResponsiveTasksPanel.tsx`
- Create: `src/atomic-crm/dashboard/v3/components/__tests__/ResponsiveTasksPanel.test.tsx`

**Rationale:** Orchestrates TasksKanbanPanel, TasksIconRail, and TasksDrawer based on breakpoint.

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/dashboard/v3/components/__tests__/ResponsiveTasksPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResponsiveTasksPanel } from "../ResponsiveTasksPanel";

// Mock the breakpoint hook
const mockUseBreakpoint = vi.fn();
vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: () => mockUseBreakpoint(),
}));

// Mock child components
vi.mock("../TasksKanbanPanel", () => ({
  TasksKanbanPanel: () => <div data-testid="inline-tasks">Inline Tasks</div>,
}));
vi.mock("../TasksIconRail", () => ({
  TasksIconRail: ({ onExpand }: { onExpand: () => void }) => (
    <button data-testid="icon-rail" onClick={onExpand}>Rail</button>
  ),
}));
vi.mock("../TasksDrawer", () => ({
  TasksDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="tasks-drawer">Drawer</div> : null,
}));

describe("ResponsiveTasksPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders inline TasksKanbanPanel on desktop", () => {
    mockUseBreakpoint.mockReturnValue("desktop");
    render(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.getByTestId("inline-tasks")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-rail")).not.toBeInTheDocument();
  });

  it("renders icon rail on laptop", () => {
    mockUseBreakpoint.mockReturnValue("laptop");
    render(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.getByTestId("icon-rail")).toBeInTheDocument();
    expect(screen.queryByTestId("inline-tasks")).not.toBeInTheDocument();
  });

  it("renders nothing on mobile (handled by MobileQuickActionBar)", () => {
    mockUseBreakpoint.mockReturnValue("mobile");
    render(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.queryByTestId("inline-tasks")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-rail")).not.toBeInTheDocument();
  });

  it("renders nothing on tablet-portrait (handled by header icon)", () => {
    mockUseBreakpoint.mockReturnValue("tablet-portrait");
    render(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.queryByTestId("inline-tasks")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="ResponsiveTasksPanel" --run
```

Expected: FAIL with "Cannot find module '../ResponsiveTasksPanel'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/dashboard/v3/components/ResponsiveTasksPanel.tsx
import { useState } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { TasksKanbanPanel } from "./TasksKanbanPanel";
import { TasksIconRail } from "./TasksIconRail";
import { TasksDrawer } from "./TasksDrawer";

interface ResponsiveTasksPanelProps {
  taskCount: number;
}

export function ResponsiveTasksPanel({ taskCount }: ResponsiveTasksPanelProps) {
  const breakpoint = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Desktop: Inline full panel
  if (breakpoint === "desktop") {
    return (
      <aside
        role="complementary"
        aria-label="Tasks panel"
        className="w-[var(--dashboard-tasks-width)] flex flex-col border-l border-border bg-muted overflow-hidden"
      >
        <TasksKanbanPanel />
      </aside>
    );
  }

  // Laptop: Icon rail + drawer
  if (breakpoint === "laptop") {
    return (
      <>
        <TasksIconRail taskCount={taskCount} onExpand={() => setDrawerOpen(true)} />
        <TasksDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          variant="laptop"
        />
      </>
    );
  }

  // Tablet landscape: Drawer only (triggered from header)
  if (breakpoint === "tablet-landscape") {
    return (
      <TasksDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        variant="tablet"
      />
    );
  }

  // Tablet portrait & Mobile: Handled by MobileQuickActionBar or header icon
  // Return nothing - tasks accessed via bottom sheet or navigation
  return null;
}

// Export drawer control for external triggers (header button)
export function useTasksDrawer() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen((prev) => !prev) };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="ResponsiveTasksPanel" --run
```

Expected: PASS (4 tests)

**Step 5: Export from components index**

```typescript
// Add to src/atomic-crm/dashboard/v3/components/index.ts
export { ResponsiveTasksPanel, useTasksDrawer } from "./ResponsiveTasksPanel";
export { TasksIconRail } from "./TasksIconRail";
export { TasksDrawer } from "./TasksDrawer";
```

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/ResponsiveTasksPanel.tsx \
        src/atomic-crm/dashboard/v3/components/__tests__/ResponsiveTasksPanel.test.tsx \
        src/atomic-crm/dashboard/v3/components/index.ts
git commit -m "feat(dashboard): add ResponsiveTasksPanel orchestrator

- Desktop: inline 320px panel
- Laptop: 48px icon rail + drawer
- Tablet landscape: drawer overlay only
- Mobile/tablet portrait: defers to MobileQuickActionBar"
```

---

## Phase 3: Dashboard Grid Layout

### Task 3.1: Create DashboardGrid Layout Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/DashboardGrid.tsx`
- Create: `src/atomic-crm/dashboard/v3/components/__tests__/DashboardGrid.test.tsx`

**Rationale:** Replaces the current flex-col layout with a responsive CSS Grid.

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/dashboard/v3/components/__tests__/DashboardGrid.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardGrid } from "../DashboardGrid";

const mockUseBreakpoint = vi.fn();
vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: () => mockUseBreakpoint(),
}));

describe("DashboardGrid", () => {
  it("renders children in a grid container", () => {
    mockUseBreakpoint.mockReturnValue("desktop");
    render(
      <DashboardGrid>
        <div data-testid="child">Content</div>
      </DashboardGrid>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies 2-column grid for desktop", () => {
    mockUseBreakpoint.mockReturnValue("desktop");
    const { container } = render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid");
  });

  it("applies single column for mobile", () => {
    mockUseBreakpoint.mockReturnValue("mobile");
    const { container } = render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid-cols-1");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="DashboardGrid.test" --run
```

Expected: FAIL with "Cannot find module '../DashboardGrid'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/dashboard/v3/components/DashboardGrid.tsx
import { type ReactNode } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  const breakpoint = useBreakpoint();

  // Responsive grid columns:
  // - Desktop (1440px+): Main content + 320px tasks panel
  // - Laptop (1280-1439px): Main content + 48px icon rail
  // - Tablet/Mobile: Single column (tasks via overlay)
  const gridClasses = cn(
    "grid gap-section transition-all duration-[var(--dashboard-transition-duration)]",
    {
      // Desktop: Pipeline takes remaining space, Tasks panel is fixed 320px
      "grid-cols-[1fr_var(--dashboard-tasks-width)]": breakpoint === "desktop",
      // Laptop: Pipeline takes remaining space, icon rail is 48px
      "grid-cols-[1fr_var(--dashboard-icon-rail-width)]": breakpoint === "laptop",
      // Tablet landscape: Single column, tasks via drawer
      "grid-cols-1": breakpoint === "tablet-landscape",
      // Tablet portrait: Single column, master-detail nav
      "grid-cols-1": breakpoint === "tablet-portrait",
      // Mobile: Single column, stacked
      "grid-cols-1": breakpoint === "mobile",
    },
    className
  );

  return <div className={gridClasses}>{children}</div>;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="DashboardGrid.test" --run
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/DashboardGrid.tsx \
        src/atomic-crm/dashboard/v3/components/__tests__/DashboardGrid.test.tsx
git commit -m "feat(dashboard): add DashboardGrid responsive layout component

- Desktop: grid-cols-[1fr_320px]
- Laptop: grid-cols-[1fr_48px]
- Tablet/Mobile: grid-cols-1"
```

---

### Task 3.2: Update PrincipalDashboardV3 to Use Grid Layout

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`

**Rationale:** Replace the vertical flex layout with the new responsive grid.

**Step 1: Read current implementation**

```bash
# Review current structure before modifying
head -100 src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx
```

**Step 2: Update imports**

Add at the top of the file:

```typescript
import { DashboardGrid } from "./components/DashboardGrid";
import { ResponsiveTasksPanel } from "./components/ResponsiveTasksPanel";
import { useBreakpoint } from "@/hooks/useBreakpoint";
```

**Step 3: Replace layout structure**

Replace the content div (lines 53-71) with:

```typescript
// Inside PrincipalDashboardV3 component, after header
const breakpoint = useBreakpoint();
const showActivityFeedInMain = breakpoint === "mobile" || breakpoint === "tablet-portrait";

// ... existing hooks (useMyTasks, etc.)

return (
  <div className="min-h-[calc(100vh-8rem)] flex flex-col">
    <DashboardHeader onRefresh={handleRefresh} />

    <div className="relative flex-1 p-content lg:p-widget">
      {/* KPI Row - Always full width, above grid */}
      <div className="mb-section">
        <KPISummaryRow key={`kpi-${refreshKey}`} />
      </div>

      {/* Main Grid: Pipeline + Tasks */}
      <DashboardGrid>
        {/* Main Content Column */}
        <main className="flex flex-col gap-section min-w-0">
          <section aria-label="Pipeline overview">
            <PrincipalPipelineTable key={`pipeline-${refreshKey}`} />
          </section>

          {/* Activity Feed - Only in main column on mobile/tablet-portrait */}
          {showActivityFeedInMain && (
            <section aria-label="Team activity">
              <ActivityFeedPanel key={`activities-${refreshKey}`} limit={15} />
            </section>
          )}
        </main>

        {/* Tasks Panel - Responsive (inline/rail/drawer) */}
        <ResponsiveTasksPanel taskCount={overdueCount + todayCount} />
      </DashboardGrid>

      {/* FAB - Desktop only (mobile uses MobileQuickActionBar) */}
      <LogActivityFAB key={`fab-${refreshKey}`} />

      {/* Mobile Quick Action Bar */}
      <MobileQuickActionBar />

      {/* Task Complete Modal */}
      <TaskCompleteSheet
        taskId={taskToComplete}
        onClose={() => setTaskToComplete(null)}
        key={`complete-${refreshKey}`}
      />
    </div>
  </div>
);
```

**Step 4: Run existing tests**

```bash
npm test -- --testPathPattern="PrincipalDashboardV3" --run
```

Expected: Tests should still pass (may need minor adjustments)

**Step 5: Run visual verification**

```bash
npm run dev
# Test at: 1440px (desktop), 1300px (laptop), 1100px (tablet-landscape), 900px (tablet-portrait), 375px (mobile)
```

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx
git commit -m "refactor(dashboard): migrate to responsive CSS Grid layout

BREAKING CHANGE: Dashboard now uses DashboardGrid instead of flex-col
- Desktop: 2-column grid with inline tasks panel
- Laptop: 2-column grid with icon rail + drawer
- Tablet/Mobile: Single column with overlay access

Implements PRD Section 9.2.6 responsive requirements"
```

---

## Phase 4: Header Tasks Button (Tablet/Mobile)

### Task 4.1: Add Tasks Button to DashboardHeader

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx`

**Rationale:** Tablet portrait and landscape need a header button to open Tasks drawer.

**Step 1: Read current header**

```bash
cat src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx
```

**Step 2: Update DashboardHeader**

```typescript
// src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx
import { CheckSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBreakpoint } from "@/hooks/useBreakpoint";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onOpenTasks?: () => void;
  taskCount?: number;
}

export function DashboardHeader({
  onRefresh,
  onOpenTasks,
  taskCount = 0
}: DashboardHeaderProps) {
  const breakpoint = useBreakpoint();
  const showTasksButton =
    breakpoint === "tablet-portrait" ||
    breakpoint === "tablet-landscape";

  return (
    <header className="flex items-center justify-between px-content lg:px-widget py-3 border-b border-border bg-background">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Principal Pipeline Overview</p>
      </div>

      <div className="flex items-center gap-content">
        {/* Tasks button - Tablet only */}
        {showTasksButton && onOpenTasks && (
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenTasks}
            className="h-11 w-11 relative"
            aria-label={`Open tasks (${taskCount} pending)`}
          >
            <CheckSquare className="h-5 w-5" />
            {taskCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
              >
                {taskCount > 99 ? "99+" : taskCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            className="h-11 w-11"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
```

**Step 3: Update PrincipalDashboardV3 to wire up header**

Add state and pass to header:

```typescript
// In PrincipalDashboardV3
const [tasksDrawerOpen, setTasksDrawerOpen] = useState(false);

// Pass to header
<DashboardHeader
  onRefresh={handleRefresh}
  onOpenTasks={() => setTasksDrawerOpen(true)}
  taskCount={overdueCount + todayCount}
/>

// Pass to ResponsiveTasksPanel
<ResponsiveTasksPanel
  taskCount={overdueCount + todayCount}
  externalDrawerOpen={tasksDrawerOpen}
  onExternalDrawerChange={setTasksDrawerOpen}
/>
```

**Step 4: Update ResponsiveTasksPanel to accept external control**

```typescript
// Update ResponsiveTasksPanel props
interface ResponsiveTasksPanelProps {
  taskCount: number;
  externalDrawerOpen?: boolean;
  onExternalDrawerChange?: (open: boolean) => void;
}

// Use external state when provided
const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
const drawerOpen = externalDrawerOpen ?? internalDrawerOpen;
const setDrawerOpen = onExternalDrawerChange ?? setInternalDrawerOpen;
```

**Step 5: Run tests and verify**

```bash
npm test -- --testPathPattern="DashboardHeader" --run
npm run dev
# Test tasks button visibility at tablet breakpoints
```

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx \
        src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx \
        src/atomic-crm/dashboard/v3/components/ResponsiveTasksPanel.tsx
git commit -m "feat(dashboard): add Tasks button to header for tablet breakpoints

- Shows on tablet-portrait and tablet-landscape
- Badge displays pending task count
- Opens Tasks drawer on click
- 44px touch target with accessible label"
```

---

## Phase 5: Testing & Verification

### Task 5.1: Add E2E Responsive Tests

**Files:**
- Create: `tests/e2e/dashboard/responsive-layout.spec.ts`

**Step 1: Write E2E test**

```typescript
// tests/e2e/dashboard/responsive-layout.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Dashboard Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='dashboard']", { state: "visible" });
  });

  test("desktop (1440px): shows inline tasks panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Tasks panel should be inline
    const tasksPanel = page.locator("[aria-label='Tasks panel']");
    await expect(tasksPanel).toBeVisible();

    // Should NOT show icon rail
    const iconRail = page.locator("[aria-label='Tasks panel (collapsed)']");
    await expect(iconRail).not.toBeVisible();
  });

  test("laptop (1300px): shows icon rail, drawer on click", async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 900 });

    // Icon rail should be visible
    const iconRail = page.locator("[aria-label='Tasks panel (collapsed)']");
    await expect(iconRail).toBeVisible();

    // Click to open drawer
    await iconRail.locator("button").click();

    // Drawer should appear
    const drawer = page.locator("[role='dialog'][aria-label='Tasks panel']");
    await expect(drawer).toBeVisible();
  });

  test("tablet landscape (1100px): tasks accessible via drawer", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });

    // Header tasks button should be visible
    const tasksButton = page.locator("button[aria-label*='Open tasks']");
    await expect(tasksButton).toBeVisible();

    // Click to open drawer
    await tasksButton.click();

    // Drawer should appear
    const drawer = page.locator("[role='dialog']");
    await expect(drawer).toBeVisible();
  });

  test("tablet portrait (900px): tasks accessible via header", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1200 });

    // Header tasks button should be visible
    const tasksButton = page.locator("button[aria-label*='Open tasks']");
    await expect(tasksButton).toBeVisible();
  });

  test("mobile (375px): tasks via MobileQuickActionBar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile action bar should be visible
    const mobileBar = page.locator("[aria-label='Quick actions']");
    await expect(mobileBar).toBeVisible();

    // Inline tasks panel should NOT be visible
    const tasksPanel = page.locator("[aria-label='Tasks panel']").first();
    await expect(tasksPanel).not.toBeVisible();
  });

  test("touch targets meet 44px minimum", async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 900 });

    // Check icon rail button
    const railButton = page.locator("[aria-label*='Expand tasks']");
    const box = await railButton.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
```

**Step 2: Run E2E tests**

```bash
npm run test:e2e -- --grep "Dashboard Responsive"
```

**Step 3: Commit**

```bash
git add tests/e2e/dashboard/responsive-layout.spec.ts
git commit -m "test(e2e): add dashboard responsive layout tests

- Tests all 5 breakpoints (desktop/laptop/tablet-landscape/tablet-portrait/mobile)
- Verifies correct panel visibility at each breakpoint
- Tests drawer interaction on laptop/tablet
- Validates 44px touch targets"
```

---

### Task 5.2: Run Full Verification Suite

**Step 1: Run all tests**

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Semantic colors
npm run validate:colors
```

**Step 2: Manual verification checklist**

- [ ] Desktop (1440px): 2-column grid, inline tasks panel (320px)
- [ ] Laptop (1300px): 2-column grid, 48px icon rail, click opens 320px drawer
- [ ] Tablet Landscape (1100px): 1-column, header tasks button, 70% drawer
- [ ] Tablet Portrait (900px): 1-column, header tasks button, 70% drawer
- [ ] Mobile (375px): 1-column, MobileQuickActionBar, no inline tasks
- [ ] All touch targets ≥ 44px
- [ ] Drawer animations smooth (200ms ease-out)
- [ ] Focus trap works in drawer
- [ ] ESC closes drawer
- [ ] Keyboard navigation works

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: complete dashboard responsive layout implementation

PRD Section 9.2.6 compliance: 100%

Implemented:
- 5-breakpoint responsive grid (desktop/laptop/tablet-landscape/tablet-portrait/mobile)
- Collapsible Tasks panel with 48px icon rail
- Drawer overlays at 320px (laptop) and 70% (tablet)
- Header tasks button for tablet breakpoints
- E2E tests for all breakpoints

Closes #responsive-dashboard"
```

---

## Phase 6: Post-Layout UX Polish

> **Rationale:** These fixes address MEDIUM and LOW severity issues from the UI/UX audit that should be applied after the responsive layout is complete. They polish the user experience without blocking the core layout work.

### Task 6.1: Increase Table Row Touch Targets

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/PipelineTableRow.tsx`

**Rationale:** Current row height (~32px) is below WCAG's 44px minimum for touch targets.

**Severity:** HIGH | **Impact:** Touch accessibility on iPad

**Step 1: Examine current row styles**

```bash
grep -n "className\|height\|h-" src/atomic-crm/dashboard/v3/components/PipelineTableRow.tsx
```

**Step 2: Increase row height**

```typescript
// Before:
<TableRow className="hover:bg-muted/50">

// After:
<TableRow className="h-12 min-h-[48px] hover:bg-muted/50">
```

**Step 3: Test touch interaction**

```bash
npm run dev
# Test on iPad or touch simulator - rows should be easy to tap
```

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/PipelineTableRow.tsx
git commit -m "a11y(dashboard): increase pipeline table row height to 48px

WCAG 2.1 AA compliance - ensures table rows meet 44px minimum
touch target requirement for iPad users.

Audit fix: HIGH severity"
```

---

### Task 6.2: Increase Cancel Button Touch Target

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

**Rationale:** Cancel button uses default size which may be below 44px minimum.

**Severity:** MEDIUM | **Impact:** Touch accessibility

**Step 1: Find cancel button**

```bash
grep -n "Cancel\|variant.*outline" src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx
```

**Step 2: Add h-11 class (44px)**

```typescript
// Before:
<Button variant="outline" onClick={onCancel}>Cancel</Button>

// After:
<Button variant="outline" onClick={onCancel} className="h-11">Cancel</Button>
```

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx
git commit -m "a11y(dashboard): increase QuickLogForm cancel button to 44px

Ensures cancel button meets WCAG 2.1 AA touch target minimum.

Audit fix: MEDIUM severity"
```

---

### Task 6.3: Enhance Overdue Section Visual Hierarchy

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx`
- Modify: `src/atomic-crm/dashboard/v3/components/TaskGroup.tsx`

**Rationale:** Overdue tasks need stronger visual differentiation to grab attention.

**Severity:** MEDIUM | **Impact:** Cognitive load, urgency perception

**Step 1: Enhance TaskGroup header for overdue**

```typescript
// In TaskGroup.tsx, add conditional styling:
const headerClasses = cn(
  "flex items-center gap-2 px-3 py-2 bg-muted rounded-t-lg",
  isOverdue && "bg-destructive/10 border-l-4 border-destructive"
);

// For the count badge:
const badgeVariant = isOverdue ? "destructive" : "secondary";
```

**Step 2: Add animation for overdue count**

```typescript
// Add subtle pulse animation for overdue count > 0
{overdueCount > 0 && (
  <Badge variant="destructive" className="animate-pulse">
    {overdueCount}
  </Badge>
)}
```

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/TasksPanel.tsx \
        src/atomic-crm/dashboard/v3/components/TaskGroup.tsx
git commit -m "ux(dashboard): enhance overdue task visual hierarchy

- Add destructive background tint and left border
- Pulse animation on overdue count badge
- Improves urgency perception per Fitts's Law

Audit fix: MEDIUM severity"
```

---

### Task 6.4: Add Keyboard Access to Hidden Action

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/PipelineDrillDownSheet.tsx`
- Modify: `src/atomic-crm/dashboard/v3/components/OpportunityCard.tsx`

**Rationale:** "View Details" button is only visible on hover, inaccessible via keyboard.

**Severity:** MEDIUM | **Impact:** Keyboard accessibility

**Step 1: Add focus-visible styles**

```typescript
// In OpportunityCard.tsx:
<Button
  variant="ghost"
  size="sm"
  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
  onClick={() => onViewDetails(opportunity.id)}
>
  View Details
</Button>
```

**Step 2: Add keyboard shortcut hint**

```typescript
// Add aria-describedby with keyboard hint
<span id="view-details-hint" className="sr-only">
  Press Enter to view opportunity details
</span>
```

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/PipelineDrillDownSheet.tsx \
        src/atomic-crm/dashboard/v3/components/OpportunityCard.tsx
git commit -m "a11y(dashboard): add keyboard access to opportunity card actions

- Shows action button on focus-visible (not just hover)
- Adds screen reader hint for keyboard navigation
- Ensures keyboard-only users can access all actions

Audit fix: MEDIUM severity"
```

---

### Task 6.5: Improve KPI Glanceability

**Files:**
- Modify: `src/atomic-crm/dashboard/v3/components/KPICard.tsx`

**Rationale:** KPI values could use larger font size for better glanceability in warehouse/car environments.

**Severity:** LOW | **Impact:** Readability at distance

**Step 1: Increase KPI value font size**

```typescript
// Before:
<span className="text-xl font-bold">{value}</span>

// After:
<span className="text-2xl lg:text-3xl font-bold tabular-nums">{value}</span>
```

**Step 2: Ensure proper text contrast**

```typescript
// Use semantic text colors
<span className="text-foreground">{value}</span>
<span className="text-muted-foreground">{label}</span>
```

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/KPICard.tsx
git commit -m "ux(dashboard): increase KPI font size for glanceability

- Increases KPI values to text-2xl (lg:text-3xl)
- Uses tabular-nums for consistent number alignment
- Improves readability in warehouse/car environments

Audit fix: LOW severity"
```

---

## Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 0: Critical Pre-Layout Fixes | 2 tasks | 45 min |
| Phase 1: Foundation | 2 tasks | 30 min |
| Phase 2: Tasks Panel Components | 3 tasks | 45 min |
| Phase 3: Dashboard Grid | 2 tasks | 45 min |
| Phase 4: Header Integration | 1 task | 20 min |
| Phase 5: Testing | 2 tasks | 30 min |
| Phase 6: Post-Layout UX Polish | 5 tasks | 30 min |

**Total Estimated Time:** ~4 hours (17 tasks)

---

## Files Created/Modified

### Phase 0 Modified Files
- `src/atomic-crm/dashboard/v3/components/MobileQuickActionBar.tsx` (add draft persistence)
- `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx` (add scope attributes)

### New Files (8)
- `src/hooks/useBreakpoint.ts`
- `src/hooks/__tests__/useBreakpoint.test.ts`
- `src/atomic-crm/dashboard/v3/components/TasksIconRail.tsx`
- `src/atomic-crm/dashboard/v3/components/TasksDrawer.tsx`
- `src/atomic-crm/dashboard/v3/components/ResponsiveTasksPanel.tsx`
- `src/atomic-crm/dashboard/v3/components/DashboardGrid.tsx`
- `src/atomic-crm/dashboard/v3/components/__tests__/*.test.tsx` (4 files)
- `tests/e2e/dashboard/responsive-layout.spec.ts`

### Modified Files (5)
- `src/index.css` (CSS variables)
- `src/hooks/index.ts` (exports)
- `src/atomic-crm/dashboard/v3/components/index.ts` (exports)
- `src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx`
- `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`

### Phase 6 Modified Files
- `src/atomic-crm/dashboard/v3/components/PipelineTableRow.tsx` (increase touch targets)
- `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` (increase button height)
- `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx` (overdue visual hierarchy)
- `src/atomic-crm/dashboard/v3/components/PipelineDrillDownSheet.tsx` (keyboard access)
- `src/atomic-crm/dashboard/v3/components/KPICard.tsx` (improve glanceability)

---

## Audit Compliance Checklist

This plan ensures full compliance with all findings from the parallel UI/UX audit:

- [ ] **Mobile draft persistence** - Phase 0, Task 0.1: Update MobileQuickActionBar to persist form state
- [ ] **Table header scope attributes** - Phase 0, Task 0.2: Add scope attributes to PrincipalPipelineTable headers
- [ ] **5-breakpoint responsive grid** - Phases 1-5: Implements desktop/laptop/tablet-landscape/tablet-portrait/mobile layouts
- [ ] **Table row touch targets** - Phase 6, Task 6.1: Increase row height to ensure ≥44px touch targets
- [ ] **Cancel button touch target** - Phase 6, Task 6.2: Increase QuickLogForm button heights to 44px
- [ ] **Overdue section visual hierarchy** - Phase 6, Task 6.3: Enhance TasksPanel overdue visual styling
- [ ] **Hidden action keyboard access** - Phase 6, Task 6.4: Improve PipelineDrillDownSheet keyboard navigation
- [ ] **KPI glanceability** - Phase 6, Task 6.5: Increase KPICard font sizes for better readability

---

## Changelog

### v1.1 (2025-12-02)
- Added Phase 0: Critical pre-layout fixes from UI/UX audit findings
- Added Phase 6: Post-layout UX polish from UI/UX audit findings
- Total implementation time increased from 2.5-3 hours to ~4 hours
- Full compliance with parallel UI/UX audit results
- Phase 0 addresses: draft persistence, table header accessibility
- Phase 6 addresses: touch targets, visual hierarchy, keyboard access, glanceability

### v1.0 (2025-12-02)
- Initial plan created from parallel agent audit
- Follows PRD Section 9.2.6 5-breakpoint requirements
- TDD approach with bite-sized tasks
- Reuses existing Sheet, Badge, Button components
