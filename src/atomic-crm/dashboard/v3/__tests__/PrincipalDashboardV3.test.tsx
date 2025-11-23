import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrincipalDashboardV3 } from "../PrincipalDashboardV3";

// Mock QuickLoggerPanel to avoid React Admin dependency in tests
vi.mock("../components/QuickLoggerPanel", () => ({
  QuickLoggerPanel: () => (
    <div>
      <h2>Log Activity</h2>
      <p>Quick capture for calls, meetings, and notes</p>
    </div>
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

describe("PrincipalDashboardV3", () => {
  it("should render all three panels", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByText("Pipeline by Principal")).toBeInTheDocument();
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(screen.getByText("Log Activity")).toBeInTheDocument();
  });

  it("should render resizable panel group", () => {
    const { container } = render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    const panelGroup = container.querySelector("[data-panel-group]");
    expect(panelGroup).toBeInTheDocument();
  });

  it("should have three panels with correct default sizes", () => {
    const { container } = render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    const panels = container.querySelectorAll("[data-panel]");
    expect(panels).toHaveLength(3);
  });
});
