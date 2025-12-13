import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrincipalPipelineTable } from "../PrincipalPipelineTable";

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

const mockMultiplePipelineData = [
  {
    id: 1,
    name: "Acme Corporation",
    totalPipeline: 5,
    activeThisWeek: 3,
    activeLastWeek: 1,
    momentum: "increasing" as const,
    nextAction: "Demo scheduled Friday",
  },
  {
    id: 2,
    name: "Beta Industries",
    totalPipeline: 10,
    activeThisWeek: 1,
    activeLastWeek: 4,
    momentum: "decreasing" as const,
    nextAction: null,
  },
  {
    id: 3,
    name: "Gamma Tech",
    totalPipeline: 3,
    activeThisWeek: 2,
    activeLastWeek: 2,
    momentum: "steady" as const,
    nextAction: "Call tomorrow",
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

// Mock Tooltip components to avoid "must be used within TooltipProvider" error
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span data-testid="tooltip-content">{children}</span>,
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

  describe("Column sorting", () => {
    it("should show sort indicators on sortable column headers", () => {
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      // Column headers should have aria-sort attribute
      const principalHeader = screen.getByRole("columnheader", { name: /principal/i });
      const pipelineHeader = screen.getByRole("columnheader", { name: /pipeline/i });

      expect(principalHeader).toHaveAttribute("aria-sort");
      expect(pipelineHeader).toHaveAttribute("aria-sort");
    });

    it("should sort by Pipeline column when clicked", async () => {
      const user = userEvent.setup();
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      // Get the Pipeline column header and click it
      const pipelineHeader = screen.getByRole("columnheader", { name: /pipeline/i });
      await user.click(pipelineHeader);

      // After clicking, should sort descending (highest first)
      await waitFor(() => {
        expect(pipelineHeader).toHaveAttribute("aria-sort", "descending");
      });
    });

    it("should toggle sort direction on repeated clicks", async () => {
      const user = userEvent.setup();
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      const principalHeader = screen.getByRole("columnheader", { name: /principal/i });

      // Principal starts sorted ascending by default
      expect(principalHeader).toHaveAttribute("aria-sort", "ascending");

      // First click: toggle to descending
      await user.click(principalHeader);
      await waitFor(() => {
        expect(principalHeader).toHaveAttribute("aria-sort", "descending");
      });

      // Second click: toggle back to ascending
      await user.click(principalHeader);
      await waitFor(() => {
        expect(principalHeader).toHaveAttribute("aria-sort", "ascending");
      });
    });
  });

  describe("Search filter", () => {
    it("should render search input", () => {
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      expect(screen.getByPlaceholderText(/search principals/i)).toBeInTheDocument();
    });

    it("should filter table rows based on search input", async () => {
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      // Initially shows all 3 rows
      expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
      expect(screen.getByText("Beta Industries")).toBeInTheDocument();
      expect(screen.getByText("Gamma Tech")).toBeInTheDocument();

      // Type in search box using fireEvent for controlled input
      const searchInput = screen.getByPlaceholderText(/search principals/i);
      fireEvent.change(searchInput, { target: { value: "Beta" } });

      // Should only show matching row
      await waitFor(() => {
        expect(screen.queryByText("Acme Corporation")).not.toBeInTheDocument();
        expect(screen.getByText("Beta Industries")).toBeInTheDocument();
        expect(screen.queryByText("Gamma Tech")).not.toBeInTheDocument();
      });
    });

    it("should be case-insensitive when filtering", async () => {
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/search principals/i);
      fireEvent.change(searchInput, { target: { value: "beta" } }); // lowercase

      await waitFor(() => {
        expect(screen.getByText("Beta Industries")).toBeInTheDocument();
        expect(screen.queryByText("Acme Corporation")).not.toBeInTheDocument();
      });
    });
  });

  describe("Filter dropdown", () => {
    it("should show momentum filter options when Filters button is clicked", async () => {
      const user = userEvent.setup();
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      // Click Filters button
      const filtersButton = screen.getByRole("button", { name: /filters/i });
      await user.click(filtersButton);

      // Should show momentum filter options (use checkbox role to avoid matching row aria-labels)
      await waitFor(() => {
        expect(screen.getByText(/filter by momentum/i)).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: /increasing/i })).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: /steady/i })).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: /decreasing/i })).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: /stale/i })).toBeInTheDocument();
      });
    });

    it("should filter by momentum when checkbox is selected", async () => {
      const user = userEvent.setup();
      mockUsePrincipalPipeline.mockReturnValue({
        data: mockMultiplePipelineData,
        loading: false,
        error: null,
      });

      render(
        <MemoryRouter>
          <PrincipalPipelineTable />
        </MemoryRouter>
      );

      // Click Filters button and select "increasing" momentum
      const filtersButton = screen.getByRole("button", { name: /filters/i });
      await user.click(filtersButton);

      // Use specific checkbox ID to avoid matching the row's aria-label
      const increasingCheckbox = await screen.findByRole("checkbox", { name: /increasing/i });
      await user.click(increasingCheckbox);

      // Should only show rows with increasing momentum (Acme Corporation)
      await waitFor(() => {
        expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
        expect(screen.queryByText("Beta Industries")).not.toBeInTheDocument();
        expect(screen.queryByText("Gamma Tech")).not.toBeInTheDocument();
      });
    });
  });
});
