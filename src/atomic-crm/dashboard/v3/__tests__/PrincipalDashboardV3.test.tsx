import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrincipalDashboardV3 } from "../PrincipalDashboardV3";

// Mock LogActivityFAB to avoid React Admin dependency in tests
vi.mock("../components/LogActivityFAB", () => ({
  LogActivityFAB: () => (
    <button aria-label="Log Activity">
      Log Activity FAB
    </button>
  ),
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

    // KPI Summary Row should still have its responsive grid
    const gridContainers = container.querySelectorAll(".grid");
    expect(gridContainers.length).toBeGreaterThanOrEqual(1);

    // Verify KPI row uses 4-column grid on desktop
    const kpiGrid = Array.from(gridContainers).find(
      (el) => el.classList.contains("lg:grid-cols-4")
    );
    expect(kpiGrid).toBeInTheDocument();
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

    // Check formatted values from our mock (all counts, no $ amounts)
    expect(screen.getByText("8")).toBeInTheDocument(); // Open Opportunities
    expect(screen.getByText("3")).toBeInTheDocument(); // Overdue Tasks
    expect(screen.getByText("12")).toBeInTheDocument(); // Activities This Week
    expect(screen.getByText("2")).toBeInTheDocument(); // Stale Deals
  });
});
