import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrincipalPipelineTable } from "../PrincipalPipelineTable";
import * as usePrincipalPipelineModule from "../../hooks/usePrincipalPipeline";

const mockPipelineData = [
  {
    id: 1,
    name: "Acme Corporation",
    totalPipeline: 5,
    activeThisWeek: 3,
    activeLastWeek: 1,
    momentum: "increasing" as const,
    nextAction: "Demo scheduled Friday",
  },
];

// Mock the usePrincipalPipeline hook with vi.fn() for per-test control
const mockUsePrincipalPipeline = vi.fn();
vi.mock("../../hooks/usePrincipalPipeline", () => ({
  usePrincipalPipeline: () => mockUsePrincipalPipeline(),
}));

// Mock the usePrincipalOpportunities hook (used by PipelineDrillDownSheet)
vi.mock("../../hooks/usePrincipalOpportunities", () => ({
  usePrincipalOpportunities: () => ({
    opportunities: [],
    loading: false,
    error: null,
  }),
}));

describe("PrincipalPipelineTable", () => {
  beforeEach(() => {
    // Default mock returns populated data
    mockUsePrincipalPipeline.mockReturnValue({
      data: mockPipelineData,
      loading: false,
      error: null,
    });
  });

  it("should render table headers correctly", () => {
    render(
      <MemoryRouter>
        <PrincipalPipelineTable />
      </MemoryRouter>
    );

    expect(screen.getByText("Pipeline by Principal")).toBeInTheDocument();
    expect(
      screen.getByText("Track opportunity momentum across your customer accounts")
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /principal/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /this week/i })).toBeInTheDocument();
  });

  it("should apply premium hover effects class", () => {
    const { container } = render(
      <MemoryRouter>
        <PrincipalPipelineTable />
      </MemoryRouter>
    );
    const rows = container.querySelectorAll(".table-row-premium");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("should display empty state when no data is available", () => {
    // Override mock to return empty data for this test
    mockUsePrincipalPipeline.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <PrincipalPipelineTable />
      </MemoryRouter>
    );

    // Should show empty state message
    expect(screen.getByText(/no principals found/i)).toBeInTheDocument();
    // Should NOT show the table body with data rows
    expect(screen.queryByRole("button", { name: /view opportunities/i })).not.toBeInTheDocument();
  });
});
