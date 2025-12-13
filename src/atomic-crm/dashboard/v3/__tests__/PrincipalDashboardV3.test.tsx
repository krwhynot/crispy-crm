import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrincipalDashboardV3 } from "../PrincipalDashboardV3";

// Mock LogActivityFAB to avoid React Admin dependency in tests
vi.mock("../components/LogActivityFAB", () => ({
  LogActivityFAB: () => <button aria-label="Log Activity">Log Activity FAB</button>,
}));

// Mock the hooks
vi.mock("../hooks/usePrincipalPipeline", () => ({
  usePrincipalPipeline: () => ({
    data: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("../hooks/useMyTasks", () => ({
  useMyTasks: () => ({
    tasks: [],
    loading: false,
    error: null,
    completeTask: vi.fn(),
    snoozeTask: vi.fn(),
    deleteTask: vi.fn(),
    viewTask: vi.fn(),
    updateTaskDueDate: vi.fn(),
    updateTaskLocally: vi.fn(),
    rollbackTask: vi.fn(),
    calculateStatus: vi.fn(),
  }),
}));

// Mock the usePrincipalOpportunities hook (used by PipelineDrillDownSheet)
vi.mock("../hooks/usePrincipalOpportunities", () => ({
  usePrincipalOpportunities: () => ({
    opportunities: [],
    loading: false,
    error: null,
  }),
}));

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

// Mock the useTeamActivities hook (used by ActivityFeedPanel)
vi.mock("../hooks/useTeamActivities", () => ({
  useTeamActivities: () => ({
    activities: [],
    loading: false,
    error: null,
  }),
}));

// Mock the useTaskCount hook (used by DashboardTabPanel for badge)
vi.mock("../hooks/useTaskCount", () => ({
  useTaskCount: () => ({
    pendingCount: 0,
    isLoading: false,
  }),
}));

// Mock MobileQuickActionBar to avoid complex dependencies
vi.mock("../components/MobileQuickActionBar", () => ({
  MobileQuickActionBar: () => null,
}));

// Mock TaskCompleteSheet to avoid complex dependencies
vi.mock("../components/TaskCompleteSheet", () => ({
  TaskCompleteSheet: () => null,
}));

// Mock the useKPIMetrics hook (used by KPISummaryRow)
// Updated to match PRD v1.9: KPI #1 = Open Opportunities count (not $), KPI #4 = Stale Deals
vi.mock("../hooks/useKPIMetrics", () => ({
  useKPIMetrics: () => ({
    metrics: {
      openOpportunitiesCount: 8,
      overdueTasksCount: 3,
      activitiesThisWeek: 12,
      staleDealsCount: 2,
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("PrincipalDashboardV3", () => {
  it("should render both panels (Pipeline and Tasks)", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByText("Pipeline by Principal")).toBeInTheDocument();
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
  });

  it("should render the Log Activity FAB", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /log activity/i })).toBeInTheDocument();
  });

  it("should use vertically stacked layout for main sections", () => {
    const { container } = render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // Main content should use flex-col for vertical stacking
    const flexColContainers = container.querySelectorAll(".flex-col");
    expect(flexColContainers.length).toBeGreaterThanOrEqual(1);

    // Root container should be flex h-screen flex-col
    const rootDiv = container.querySelector(".flex.h-screen.flex-col");
    expect(rootDiv).toBeInTheDocument();

    // Main element should have flex-1 for remaining height
    const mainElement = container.querySelector("main.flex-1");
    expect(mainElement).toBeInTheDocument();
  });

  it("should have KPI row with 4-column desktop grid", () => {
    const { container } = render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // KPI Summary Row should use responsive grid: 2-col mobile, 4-col desktop
    const kpiGrid = container.querySelector(".grid.grid-cols-2.lg\\:grid-cols-4");
    expect(kpiGrid).toBeInTheDocument();

    // Should have ARIA label for accessibility
    const kpiSection = container.querySelector('section[aria-label="Key Performance Indicators"]');
    expect(kpiSection).toBeInTheDocument();
  });

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
    expect(screen.getByText("Pipeline by Principal")).toBeInTheDocument();

    // 3. Tasks Kanban
    expect(screen.getByText("My Tasks")).toBeInTheDocument();

    // 4. My Performance Widget
    expect(screen.getByText("My Performance")).toBeInTheDocument();

    // 5. Activity Feed Panel
    expect(screen.getByText("Team Activity")).toBeInTheDocument();
  });

  it("should render dashboard header", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByText("Principal Dashboard")).toBeInTheDocument();
  });

  it("should render KPI summary row with four metrics (PRD v1.9)", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // Check that KPI labels are rendered per PRD v1.9 Section 9.2.1
    // KPI #1: Open Opportunities (count, not $ value per Decision #5)
    // KPI #2: Overdue Tasks
    // KPI #3: Activities This Week
    // KPI #4: Stale Deals (with amber styling when > 0)
    expect(screen.getByText("Open Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Overdue Tasks")).toBeInTheDocument();
    expect(screen.getByText("Activities This Week")).toBeInTheDocument();
    expect(screen.getByText("Stale Deals")).toBeInTheDocument();
  });

  it("should render KPI values from mocked data", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // Check KPI values using aria-labels for specificity (avoids collision with Performance widget)
    // KPIs have aria-label like "Open Opportunities: 8. Click to view details."
    expect(screen.getByRole("button", { name: /Open Opportunities: 8/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Overdue Tasks: 3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Activities This Week: 12/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Stale Deals: 2/i })).toBeInTheDocument();
  });
});
