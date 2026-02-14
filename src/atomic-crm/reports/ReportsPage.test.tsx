import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import ReportsPage from "./ReportsPage";

// Mock useBreakpoint to return "desktop" — JSDOM has no real viewport
vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: () => "desktop" as const,
  useIsDesktop: () => true,
  useIsLaptopOrLarger: () => true,
  useIsMobileOrTablet: () => false,
}));

// Mock ra-core hooks (used by GlobalFilterBar)
vi.mock("ra-core", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() required in vi.mock factory
  const actual = (await vi.importActual("ra-core")) as typeof import("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
  };
});

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
    renderWithAdminContext(<ReportsPage />);

    expect(screen.getByText("Reports & Analytics")).toBeInTheDocument();
  });

  it("renders all tabs", () => {
    renderWithAdminContext(<ReportsPage />);

    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^opportunities$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /weekly activity/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^campaign$/i })).toBeInTheDocument();
  });

  it("defaults to overview tab", () => {
    renderWithAdminContext(<ReportsPage />);

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab).toHaveAttribute("data-state", "active");
  });

  it("uses desktop-first responsive tabs", () => {
    renderWithAdminContext(<ReportsPage />);

    const tabList = screen.getByRole("tablist");
    expect(tabList).toHaveClass("grid-cols-2");
    expect(tabList).toHaveClass("lg:grid-cols-4");
  });

  it("hides filter sidebar on Overview tab (uses inline context header instead)", () => {
    renderWithAdminContext(<ReportsPage />);

    // Overview tab uses ReportContextHeader instead of sidebar
    expect(screen.queryByLabelText("Filter reports")).not.toBeInTheDocument();
    // Context header with Overview filters should be present
    expect(screen.getByRole("toolbar", { name: "Overview filters" })).toBeInTheDocument();
  });

  it("shows filter sidebar on non-Overview tabs", async () => {
    const user = userEvent.setup();
    renderWithAdminContext(<ReportsPage />);

    // Switch to Opportunities tab
    const oppsTab = screen.getByRole("tab", { name: /^opportunities$/i });
    await user.click(oppsTab);

    // Sidebar should now be visible for non-overview tabs
    expect(screen.getByLabelText("Filter reports")).toBeInTheDocument();
  });

  it("uses Skeleton for tab loading states", () => {
    renderWithAdminContext(<ReportsPage />);

    // Should show Skeleton components (with data-slot), not plain text "Loading..."
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
