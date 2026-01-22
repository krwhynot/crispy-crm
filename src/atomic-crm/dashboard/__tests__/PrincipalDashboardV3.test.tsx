import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrincipalDashboardV3 } from "../PrincipalDashboardV3";

// Mock LogActivityFAB to avoid React Admin dependency in tests
vi.mock("../components/LogActivityFAB", () => ({
  LogActivityFAB: () => <button aria-label="Log Activity">Log Activity FAB</button>,
}));

// Mock the hooks
vi.mock("../usePrincipalPipeline", () => ({
  usePrincipalPipeline: () => ({
    data: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("../useMyTasks", () => ({
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
vi.mock("../usePrincipalOpportunities", () => ({
  usePrincipalOpportunities: () => ({
    opportunities: [],
    loading: false,
    error: null,
  }),
}));

// Mock the useMyPerformance hook (used by MyPerformanceWidget)
vi.mock("../useMyPerformance", () => ({
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
vi.mock("../useTeamActivities", () => ({
  useTeamActivities: () => ({
    activities: [],
    loading: false,
    error: null,
  }),
}));

// Mock the useTaskCount hook (used by DashboardTabPanel for badge)
vi.mock("../useTaskCount", () => ({
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
vi.mock("../useKPIMetrics", () => ({
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

// Create fresh QueryClient for each test to avoid state leakage
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
      },
    },
  });

// Helper to render with all required providers
const renderDashboard = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <PrincipalDashboardV3 />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("PrincipalDashboardV3", () => {
  it("should render both panels (Pipeline and Tasks)", () => {
    renderDashboard();

    // Tab labels in the tabbed interface
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
  });

  it("should render the Log Activity FAB", () => {
    renderDashboard();

    expect(screen.getByRole("button", { name: /log activity/i })).toBeInTheDocument();
  });

  it("should use vertically stacked layout for main sections", () => {
    const { container } = renderDashboard();

    // Main content should use flex-col for vertical stacking
    const flexColContainers = container.querySelectorAll(".flex-col");
    expect(flexColContainers.length).toBeGreaterThanOrEqual(1);

    // Root container uses calc height for dynamic viewport
    const rootDiv = container.querySelector(".flex.flex-col");
    expect(rootDiv).toBeInTheDocument();

    // Main element should have flex-1 for remaining height
    const mainElement = container.querySelector("main.flex-1");
    expect(mainElement).toBeInTheDocument();
  });

  it("should have KPI row with 4-column desktop grid", () => {
    const { container } = renderDashboard();

    // KPI Summary Row should use responsive grid: 2-col mobile, 4-col desktop
    const kpiGrid = container.querySelector(".grid.grid-cols-2.lg\\:grid-cols-4");
    expect(kpiGrid).toBeInTheDocument();

    // Should have ARIA label for accessibility
    const kpiSection = container.querySelector('section[aria-label="Key Performance Indicators"]');
    expect(kpiSection).toBeInTheDocument();
  });

  it("should have tabbed interface for all sections", () => {
    renderDashboard();

    // All sections are now in tabs - verify all tab triggers exist
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("Team Activity")).toBeInTheDocument();
  });

  it("should render all dashboard sections in vertical stack order", () => {
    renderDashboard();

    // Verify all sections are present (order is implicit by DOM structure)
    // 1. KPI Summary Row
    expect(screen.getByLabelText("Key Performance Indicators")).toBeInTheDocument();

    // 2-5. Tabbed interface contains all sections
    // Tab labels (sections accessible via tabs)
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("Team Activity")).toBeInTheDocument();
  });

  it("should render dashboard main content area", () => {
    const { container } = renderDashboard();

    // Dashboard renders main content area with KPI row and tabbed interface
    // Header is provided by Layout component, not this component
    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();

    // KPI Summary Row should be present
    expect(screen.getByLabelText("Key Performance Indicators")).toBeInTheDocument();
  });

  it("should render KPI summary row with four metrics (PRD v1.9)", () => {
    renderDashboard();

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
    renderDashboard();

    // Check KPI values using aria-labels for specificity (avoids collision with Performance widget)
    // KPIs have aria-label like "Open Opportunities: 8. Click to view details."
    expect(screen.getByRole("button", { name: /Open Opportunities: 8/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Overdue Tasks: 3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Activities This Week: 12/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Stale Deals: 2/i })).toBeInTheDocument();
  });
});
