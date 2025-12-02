import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OverviewTab from "./OverviewTab";

// Mock ra-core hooks
vi.mock("ra-core", () => ({
  useGetList: vi.fn(),
}));

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

import { useGetList } from "ra-core";

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

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <GlobalFilterProvider>{children}</GlobalFilterProvider>
  </MemoryRouter>
);

describe("OverviewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders KPI cards", () => {
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isPending: false })
      .mockReturnValueOnce({ data: mockActivities, isPending: false })
      .mockReturnValueOnce({ data: mockSalesReps, isPending: false });

    render(<OverviewTab />, { wrapper: Wrapper });

    expect(screen.getByText("Total Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Activities This Week")).toBeInTheDocument();
    expect(screen.getByText("Stale Leads")).toBeInTheDocument();
  });

  it("renders chart sections", () => {
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isPending: false })
      .mockReturnValueOnce({ data: mockActivities, isPending: false })
      .mockReturnValueOnce({ data: mockSalesReps, isPending: false });

    render(<OverviewTab />, { wrapper: Wrapper });

    expect(screen.getByText("Pipeline by Stage")).toBeInTheDocument();
    expect(screen.getByText("Activity Trend (14 Days)")).toBeInTheDocument();
    expect(screen.getByText("Top Principals by Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Rep Performance")).toBeInTheDocument();
  });
});
