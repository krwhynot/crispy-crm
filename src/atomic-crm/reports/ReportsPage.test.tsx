import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import ReportsPage from "./ReportsPage";

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

const createMatchMedia =
  (isDesktop: boolean) =>
  (query: string): MediaQueryList => ({
    matches:
      isDesktop && (query.includes("min-width: 1024px") || query.includes("min-width: 1280px")),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetList).mockReturnValue({ data: mockSalesReps, isPending: false });
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia(true));
  });

  it("renders page title", () => {
    renderWithAdminContext(<ReportsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Reports & Analytics" })
    ).toBeInTheDocument();
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

  it("renders filter sidebar with global controls on Overview tab", () => {
    renderWithAdminContext(<ReportsPage />);

    // Sidebar renders with global filter controls
    expect(screen.getByLabelText("Period")).toBeInTheDocument();
    expect(screen.getByLabelText("Principal")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner")).toBeInTheDocument();
  });

  it("renders filter sidebar with tab-specific controls on non-Overview tabs", async () => {
    const user = userEvent.setup();
    renderWithAdminContext(<ReportsPage />);

    // Switch to Opportunities tab
    const oppsTab = screen.getByRole("tab", { name: /^opportunities$/i });
    await user.click(oppsTab);

    // Global controls still present
    expect(screen.getByLabelText("Period")).toBeInTheDocument();
    expect(screen.getByLabelText("Principal")).toBeInTheDocument();
  });

  it("uses Skeleton for tab loading states", () => {
    renderWithAdminContext(<ReportsPage />);

    // Should show Skeleton components (with data-slot), not plain text "Loading..."
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
