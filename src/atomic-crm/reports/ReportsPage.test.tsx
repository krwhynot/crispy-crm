import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReportsPage from "./ReportsPage";

describe("ReportsPage", () => {
  it("renders page title", () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Reports & Analytics")).toBeInTheDocument();
  });

  it("renders all tabs", () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /opportunities by principal/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /weekly activity/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /campaign activity/i })).toBeInTheDocument();
  });

  it("defaults to overview tab", () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab).toHaveAttribute("data-state", "active");
  });
});
