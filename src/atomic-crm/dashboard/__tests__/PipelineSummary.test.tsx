import { render, screen } from "@testing-library/react";
import {
  PipelineSummary,
  calculatePipelineHealth,
} from "../PipelineSummary";
import { TestMemoryRouter } from "ra-core";
import { describe, it, expect, vi } from "vitest";

// Mock React Admin hooks
const mockGetList = vi.fn();
const mockGetIdentity = vi.fn();

vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useGetList: () => mockGetList(),
    useGetIdentity: () => mockGetIdentity(),
  };
});

describe("PipelineSummary", () => {
  it("renders widget title", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/PIPELINE SUMMARY/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching opportunities", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/Loading pipeline/i)).toBeInTheDocument();
  });

  it("shows empty state when no opportunities", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/No active opportunities/i)).toBeInTheDocument();
  });
});

describe("calculatePipelineMetrics", () => {
  it("calculates total opportunities count", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 10 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.total).toBe(2);
  });

  it("groups opportunities by stage", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      { id: 2, stage: "new_lead", status: "active", days_in_stage: 10 },
      { id: 3, stage: "initial_outreach", status: "active", days_in_stage: 15 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.byStage).toEqual([
      { stage: "new_lead", count: 2, stuckCount: 0 },
      { stage: "initial_outreach", count: 1, stuckCount: 0 },
    ]);
  });

  it("identifies stuck opportunities (30+ days in stage)", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 25 },
      { id: 2, stage: "new_lead", status: "active", days_in_stage: 35 },
      { id: 3, stage: "initial_outreach", status: "active", days_in_stage: 40 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.stuck).toBe(2);
    expect(metrics.byStage).toContainEqual({
      stage: "new_lead",
      count: 2,
      stuckCount: 1,
    });
  });

  it("counts active opportunities", () => {
    const opportunities = [
      { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 10 },
    ];

    const metrics = calculatePipelineMetrics(opportunities as any);

    expect(metrics.active).toBe(2);
  });

  it("handles empty opportunities array", () => {
    const metrics = calculatePipelineMetrics([]);

    expect(metrics.total).toBe(0);
    expect(metrics.byStage).toEqual([]);
    expect(metrics.stuck).toBe(0);
    expect(metrics.active).toBe(0);
  });
});

describe("calculatePipelineHealth", () => {
  it("returns 'Healthy' when no stuck deals and no urgent principals", () => {
    const health = calculatePipelineHealth(0, 0);

    expect(health).toEqual({
      icon: "🟢",
      label: "Healthy",
    });
  });

  it("returns 'Fair' when 1-3 stuck deals", () => {
    const health = calculatePipelineHealth(2, 0);

    expect(health).toEqual({
      icon: "🟡",
      label: "Fair",
    });
  });

  it("returns 'Fair' when 1 urgent principal", () => {
    const health = calculatePipelineHealth(0, 1);

    expect(health).toEqual({
      icon: "🟡",
      label: "Fair",
    });
  });

  it("returns 'Needs Attention' when >3 stuck deals", () => {
    const health = calculatePipelineHealth(4, 0);

    expect(health).toEqual({
      icon: "🔴",
      label: "Needs Attention",
    });
  });

  it("returns 'Needs Attention' when >1 urgent principals", () => {
    const health = calculatePipelineHealth(0, 2);

    expect(health).toEqual({
      icon: "🔴",
      label: "Needs Attention",
    });
  });

  it("returns 'Needs Attention' for combination of issues", () => {
    const health = calculatePipelineHealth(2, 2);

    expect(health).toEqual({
      icon: "🔴",
      label: "Needs Attention",
    });
  });
});

describe("PipelineSummary with data", () => {
  it("displays total opportunities count", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
        { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 10 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText("Total Opportunities")).toBeInTheDocument();
    const totalOpportunities = screen.getByText("Total Opportunities").parentElement;
    expect(totalOpportunities).toHaveTextContent("2");
  });

  it("displays pipeline health score", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/Pipeline Health:/i)).toBeInTheDocument();
    expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
  });

  it("displays stage breakdown", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 5 },
        { id: 2, stage: "new_lead", status: "active", days_in_stage: 10 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/BY STAGE/i)).toBeInTheDocument();
    expect(screen.getByText(/New Lead:/i)).toBeInTheDocument();
  });

  it("warns about stuck deals", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [
        { id: 1, stage: "new_lead", status: "active", days_in_stage: 35 },
        { id: 2, stage: "initial_outreach", status: "active", days_in_stage: 40 },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/2 stuck deals/i)).toBeInTheDocument();
    expect(screen.getByText(/Fair/i)).toBeInTheDocument();
  });
});
