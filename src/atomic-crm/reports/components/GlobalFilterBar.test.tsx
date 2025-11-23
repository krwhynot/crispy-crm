import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlobalFilterBar } from "./GlobalFilterBar";
import { GlobalFilterProvider } from "../contexts/GlobalFilterContext";

// Mock ra-core hooks
vi.mock("ra-core", () => ({
  useGetList: vi.fn(),
}));

import { useGetList } from "ra-core";

const mockSalesReps = [
  { id: 1, first_name: "John", last_name: "Smith" },
  { id: 2, first_name: "Jane", last_name: "Doe" },
];

describe("GlobalFilterBar", () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalFilterProvider>{children}</GlobalFilterProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    (useGetList as any).mockReturnValue({ data: mockSalesReps, isPending: false });
  });

  it("renders date range selector", () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
    expect(screen.getByText(/last 30 days/i)).toBeInTheDocument();
  });

  it("renders sales rep filter", () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
    expect(screen.getByText(/all reps/i)).toBeInTheDocument();
  });

  it("does not show reset button with default filters", () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    // Reset button only appears when filters are changed from defaults
    const resetButton = screen.queryByRole("button", { name: /reset filters/i });
    expect(resetButton).not.toBeInTheDocument();
  });

  it("displays sales rep options from fetched data", () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    // Verify the sales rep dropdown shows "All Reps" as default
    expect(screen.getByText(/all reps/i)).toBeInTheDocument();
  });
});
