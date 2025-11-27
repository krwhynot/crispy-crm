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
vi.mock("../hooks/useKPIMetrics", () => ({
  useKPIMetrics: () => ({
    metrics: {
      totalPipelineValue: 150000,
      overdueTasksCount: 3,
      activitiesThisWeek: 12,
      openOpportunitiesCount: 8,
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

  it("should use CSS Grid layout with two columns on desktop", () => {
    const { container } = render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // The main content grid container should have the responsive grid classes
    // Now nested inside a flex container that also contains KPISummaryRow
    const gridContainers = container.querySelectorAll(".grid");
    // Should have at least 2 grids: KPISummaryRow (4-col) and main panels (2-col)
    expect(gridContainers.length).toBeGreaterThanOrEqual(2);

    // Find the main panel grid with 2fr/3fr layout
    const mainPanelGrid = Array.from(gridContainers).find(
      (el) => el.classList.contains("lg:grid-cols-[2fr_3fr]")
    );
    expect(mainPanelGrid).toBeInTheDocument();
    expect(mainPanelGrid).toHaveClass("grid-cols-1");
  });

  it("should render dashboard header", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByText("Principal Dashboard")).toBeInTheDocument();
  });

  it("should render KPI summary row with four metrics", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // Check that KPI labels are rendered
    expect(screen.getByText("Total Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Overdue Tasks")).toBeInTheDocument();
    expect(screen.getByText("Activities This Week")).toBeInTheDocument();
    expect(screen.getByText("Open Opportunities")).toBeInTheDocument();
  });

  it("should render KPI values from mocked data", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // Check formatted values from our mock
    expect(screen.getByText("$150,000")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});
