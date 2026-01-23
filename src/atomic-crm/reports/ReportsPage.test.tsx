import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReportsPage from "./ReportsPage";

// Mock ra-core hooks (used by GlobalFilterBar)
vi.mock("ra-core", () => ({
  useGetList: vi.fn(),
}));

import { useGetList } from "ra-core";

const mockSalesReps = [
  { id: 1, first_name: "John", last_name: "Smith" },
  { id: 2, first_name: "Jane", last_name: "Doe" },
];

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetList).mockReturnValue({ data: mockSalesReps, isPending: false });
  });

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
    expect(screen.getByRole("tab", { name: /^opportunities$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /weekly activity/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^campaign$/i })).toBeInTheDocument();
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

  it("uses desktop-first responsive tabs", () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    const tabList = screen.getByRole("tablist");
    expect(tabList).toHaveClass("grid-cols-2");
    expect(tabList).toHaveClass("lg:grid-cols-4");
  });

  it("does not render GlobalFilterBar (filters moved to tabs)", () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    // GlobalFilterBar had date range label - should not exist at page level
    // Only individual tabs should have filter bars
    expect(screen.queryByText(/last 30 days/i)).not.toBeInTheDocument();
  });

  it("uses Skeleton for tab loading states", () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    // Should show Skeleton components (with data-slot), not plain text "Loading..."
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
