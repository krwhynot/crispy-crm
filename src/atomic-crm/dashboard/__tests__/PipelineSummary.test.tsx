import { render, screen } from "@testing-library/react";
import { PipelineSummary, calculatePipelineMetrics } from "../PipelineSummary";
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
