import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OpportunityArchivedList } from "../OpportunityArchivedList";
import { useGetIdentity, useGetList } from "ra-core";
import { mockUseGetIdentityReturn, mockUseGetListReturn } from "@/tests/utils/typed-mocks";

// Mock react-admin hooks
vi.mock("ra-core", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() required in vi.mock factory
  const actual = (await vi.importActual("ra-core")) as typeof import("ra-core");
  return {
    ...actual,
    useGetIdentity: vi.fn(),
    useGetList: vi.fn(),
  };
});

const mockOpportunities = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Opportunity ${i + 1}`,
  stage: "closed_won",
  deleted_at: new Date(2025, 0, i % 30).toISOString(),
  estimated_close_date: new Date(2025, 0, 1).toISOString(),
}));

describe("OpportunityArchivedList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch initial page with 25 items per page", () => {
    vi.mocked(useGetIdentity).mockReturnValue(
      mockUseGetIdentityReturn({
        identity: { id: 1, fullName: "Test User" },
      })
    );

    vi.mocked(useGetList).mockReturnValue(
      mockUseGetListReturn({
        data: mockOpportunities.slice(0, 25),
        total: 100,
        isPending: false,
      })
    );

    renderWithAdminContext(<OpportunityArchivedList />);

    // Verify useGetList was called with correct pagination
    expect(vi.mocked(useGetList)).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        pagination: { page: 1, perPage: 25 },
      })
    );
  });

  it("should display View archived opportunities button", () => {
    vi.mocked(useGetIdentity).mockReturnValue(
      mockUseGetIdentityReturn({
        identity: { id: 1, fullName: "Test User" },
      })
    );

    vi.mocked(useGetList).mockReturnValue(
      mockUseGetListReturn({
        data: mockOpportunities.slice(0, 25),
        total: 100,
        isPending: false,
      })
    );

    renderWithAdminContext(<OpportunityArchivedList />);

    expect(screen.getByText("View archived opportunities")).toBeInTheDocument();
  });

  it("should show pagination info for first page", async () => {
    vi.mocked(useGetIdentity).mockReturnValue(
      mockUseGetIdentityReturn({
        identity: { id: 1, fullName: "Test User" },
      })
    );

    vi.mocked(useGetList).mockReturnValue(
      mockUseGetListReturn({
        data: mockOpportunities.slice(0, 25),
        total: 100,
        isPending: false,
      })
    );

    renderWithAdminContext(<OpportunityArchivedList />);

    // Open dialog
    const button = screen.getByText("View archived opportunities");
    fireEvent.click(button);

    // Check pagination info
    await waitFor(() => {
      expect(screen.getByText(/Showing 1–25 of 100 archived opportunities/)).toBeInTheDocument();
    });
  });

  it("should show Load More button when there are more pages", async () => {
    vi.mocked(useGetIdentity).mockReturnValue(
      mockUseGetIdentityReturn({
        identity: { id: 1, fullName: "Test User" },
      })
    );

    vi.mocked(useGetList).mockReturnValue(
      mockUseGetListReturn({
        data: mockOpportunities.slice(0, 25),
        total: 100,
        isPending: false,
      })
    );

    renderWithAdminContext(<OpportunityArchivedList />);

    // Open dialog
    const button = screen.getByText("View archived opportunities");
    fireEvent.click(button);

    // Check Load More button exists
    await waitFor(() => {
      expect(screen.getByText("Load More")).toBeInTheDocument();
    });
  });

  it("should not show Load More button when all items are loaded", async () => {
    vi.mocked(useGetIdentity).mockReturnValue(
      mockUseGetIdentityReturn({
        identity: { id: 1, fullName: "Test User" },
      })
    );

    // Only 20 items with perPage=25 means all items fit on one page
    vi.mocked(useGetList).mockReturnValue(
      mockUseGetListReturn({
        data: mockOpportunities.slice(0, 20),
        total: 20,
        isPending: false,
      })
    );

    renderWithAdminContext(<OpportunityArchivedList />);

    // Open dialog
    const button = screen.getByText("View archived opportunities");
    fireEvent.click(button);

    // Check Load More button does NOT exist
    await waitFor(() => {
      expect(screen.queryByText("Load More")).not.toBeInTheDocument();
    });
  });

  it("should reset to page 1 when dialog reopens", async () => {
    const mockUseGetList = vi.mocked(useGetList);

    vi.mocked(useGetIdentity).mockReturnValue(
      mockUseGetIdentityReturn({
        identity: { id: 1, fullName: "Test User" },
      })
    );

    mockUseGetList.mockReturnValue(
      mockUseGetListReturn({
        data: mockOpportunities.slice(0, 25),
        total: 100,
        isPending: false,
      })
    );

    renderWithAdminContext(<OpportunityArchivedList />);

    // Open and close dialog
    const button = screen.getByText("View archived opportunities");
    fireEvent.click(button);

    // Verify it was called with page 1
    expect(mockUseGetList).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        pagination: { page: 1, perPage: 25 },
      })
    );
  });
});
