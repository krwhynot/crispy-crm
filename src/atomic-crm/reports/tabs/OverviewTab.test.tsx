import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import OverviewTab from "./OverviewTab";

// Mock all chart components to avoid canvas rendering issues in tests
vi.mock("../charts/PipelineChart", () => ({
  PipelineChart: () => <div data-testid="pipeline-chart">Pipeline Chart</div>,
}));

vi.mock("../charts/ActivityTrendChart", () => ({
  ActivityTrendChart: () => <div data-testid="activity-trend-chart">Activity Trend Chart</div>,
}));

vi.mock("../charts/TopPrincipalsChart", () => ({
  TopPrincipalsChart: () => <div data-testid="top-principals-chart">Top Principals Chart</div>,
}));

vi.mock("../charts/RepPerformanceChart", () => ({
  RepPerformanceChart: () => <div data-testid="rep-performance-chart">Rep Performance Chart</div>,
}));

const mockOpportunities = [
  {
    id: 1,
    name: "Test Opportunity",
    amount: 50000,
    stage: "Lead",
    last_activity_at: null,
  },
  {
    id: 2,
    name: "Another Opportunity",
    amount: 75000,
    stage: "Negotiation",
    last_activity_at: "2025-11-10T10:00:00Z",
  },
];

const mockActivities = [
  {
    id: 1,
    type: "Call",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    type: "Email",
    created_at: new Date().toISOString(),
  },
];

const mockSalesReps = [
  { id: 1, first_name: "John", last_name: "Smith" },
  { id: 2, first_name: "Jane", last_name: "Doe" },
];

const createMockGetList = () =>
  vi.fn().mockImplementation((resource: string) => {
    if (resource === "opportunities" || resource === "opportunities_summary") {
      return Promise.resolve({ data: mockOpportunities, total: mockOpportunities.length });
    }
    if (resource === "activities") {
      return Promise.resolve({ data: mockActivities, total: mockActivities.length });
    }
    if (resource === "sales" || resource === "sales_summary") {
      return Promise.resolve({ data: mockSalesReps, total: mockSalesReps.length });
    }
    return Promise.resolve({ data: [], total: 0 });
  });

describe("OverviewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders KPI cards", async () => {
    renderWithAdminContext(<OverviewTab />, {
      dataProvider: {
        getList: createMockGetList(),
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Open Opportunities")).toBeInTheDocument();
    });
    expect(screen.getByText("Team Activities")).toBeInTheDocument();
    expect(screen.getByText("Stale Leads")).toBeInTheDocument();
  });

  it("renders chart sections", async () => {
    renderWithAdminContext(<OverviewTab />, {
      dataProvider: {
        getList: createMockGetList(),
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Pipeline by Stage")).toBeInTheDocument();
    });
    expect(screen.getByText("Activity Trend (14 Days)")).toBeInTheDocument();
    expect(screen.getByText("Top Principals by Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Rep Performance")).toBeInTheDocument();
  });

  it("renders embedded TabFilterBar", async () => {
    renderWithAdminContext(<OverviewTab />, {
      dataProvider: {
        getList: createMockGetList(),
      },
    });

    // Filter bar should be inside the tab, not global
    await waitFor(() => {
      expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
  });

  it("uses lg: breakpoint for desktop-first grid", async () => {
    const { container } = renderWithAdminContext(<OverviewTab />, {
      dataProvider: {
        getList: createMockGetList(),
      },
    });

    await waitFor(() => {
      const kpiGrid = container.querySelector('[data-testid="kpi-grid"]');
      expect(kpiGrid).toHaveClass("grid-cols-1");
    });

    const kpiGrid = container.querySelector('[data-testid="kpi-grid"]');
    expect(kpiGrid).toHaveClass("lg:grid-cols-4");
    // Should have md: breakpoint for tablet portrait
    expect(kpiGrid?.className).toMatch(/md:grid-cols-2/);
  });

  it("uses semantic spacing tokens", async () => {
    const { container } = renderWithAdminContext(<OverviewTab />, {
      dataProvider: {
        getList: createMockGetList(),
      },
    });

    await waitFor(() => {
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("space-y-section");
    });
  });
});
