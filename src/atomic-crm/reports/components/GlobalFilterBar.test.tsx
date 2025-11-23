import { render, screen } from "@testing-library/react";
import { GlobalFilterBar } from "./GlobalFilterBar";
import { GlobalFilterProvider } from "../contexts/GlobalFilterContext";

describe("GlobalFilterBar", () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalFilterProvider>{children}</GlobalFilterProvider>
  );

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

  it("renders export button", () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    const exportButton = screen.getByRole("button", { name: /export all/i });
    expect(exportButton).toBeInTheDocument();
  });

  it("renders reset filters button", () => {
    render(<GlobalFilterBar />, { wrapper: Wrapper });

    const resetButton = screen.getByRole("button", { name: /reset filters/i });
    expect(resetButton).toBeInTheDocument();
  });
});
