import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminContext } from "react-admin";
import { Dashboard } from "./Dashboard";

// Mock all dashboard widget components
vi.mock("./MetricsCardGrid", () => ({
  MetricsCardGrid: () => <div data-testid="metrics-card-grid">Metrics</div>,
}));

vi.mock("./MyOpenOpportunities", () => ({
  MyOpenOpportunities: () => <div data-testid="my-open-opportunities">My Open Opportunities</div>,
}));

vi.mock("./OverdueTasks", () => ({
  OverdueTasks: () => <div data-testid="overdue-tasks">Overdue Tasks</div>,
}));

vi.mock("./ThisWeeksActivities", () => ({
  ThisWeeksActivities: () => <div data-testid="this-weeks-activities">This Week's Activities</div>,
}));

vi.mock("./OpportunitiesByPrincipal", () => ({
  OpportunitiesByPrincipal: () => <div data-testid="opportunities-by-principal">Opportunities by Principal</div>,
}));

vi.mock("./PipelineByStage", () => ({
  PipelineByStage: () => <div data-testid="pipeline-by-stage">Pipeline by Stage</div>,
}));

vi.mock("./RecentActivities", () => ({
  RecentActivities: () => <div data-testid="recent-activities">Recent Activities</div>,
}));

vi.mock("./TasksList", () => ({
  TasksList: () => <div data-testid="tasks-list">Tasks List</div>,
}));

vi.mock("./DashboardActivityLog", () => ({
  DashboardActivityLog: () => <div data-testid="activity-log">Activity Log</div>,
}));

vi.mock("./HotContacts", () => ({
  HotContacts: () => <div data-testid="hot-contacts">Hot Contacts</div>,
}));

vi.mock("./MiniPipeline", () => ({
  MiniPipeline: () => <div data-testid="mini-pipeline">Mini Pipeline</div>,
}));

vi.mock("./QuickAdd", () => ({
  QuickAdd: () => <div data-testid="quick-add">Quick Add</div>,
}));

// Mock React Admin hooks
const mockRefresh = vi.fn();
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })),
    useRefresh: () => mockRefresh,
  };
});

describe("Dashboard", () => {
  const renderDashboard = () => {
    return render(
      <AdminContext>
        <Dashboard />
      </AdminContext>
    );
  };

  it("renders the dashboard header with title", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  it("renders the refresh button", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByLabelText("Refresh dashboard")).toBeInTheDocument();
    });
  });

  it("renders all 6 Phase 4 widgets", async () => {
    renderDashboard();

    await waitFor(() => {
      // Phase 4 Widgets
      expect(screen.getByTestId("my-open-opportunities")).toBeInTheDocument();
      expect(screen.getByTestId("overdue-tasks")).toBeInTheDocument();
      expect(screen.getByTestId("this-weeks-activities")).toBeInTheDocument();
      expect(screen.getByTestId("opportunities-by-principal")).toBeInTheDocument();
      expect(screen.getByTestId("pipeline-by-stage")).toBeInTheDocument();
      expect(screen.getByTestId("recent-activities")).toBeInTheDocument();
    });
  });

  it("renders existing dashboard components", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("metrics-card-grid")).toBeInTheDocument();
      expect(screen.getByTestId("tasks-list")).toBeInTheDocument();
      expect(screen.getByTestId("activity-log")).toBeInTheDocument();
      expect(screen.getByTestId("hot-contacts")).toBeInTheDocument();
      expect(screen.getByTestId("mini-pipeline")).toBeInTheDocument();
      expect(screen.getByTestId("quick-add")).toBeInTheDocument();
    });
  });

  it("has proper grid layout structure", async () => {
    const { container } = renderDashboard();

    await waitFor(() => {
      // Check for Phase 4 widgets grid
      const phase4Grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(phase4Grid).toBeInTheDocument();
    });
  });

  it("calls refresh when refresh button is clicked", async () => {
    const { getByLabelText } = renderDashboard();

    await waitFor(() => {
      const refreshButton = getByLabelText("Refresh dashboard");
      refreshButton.click();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
