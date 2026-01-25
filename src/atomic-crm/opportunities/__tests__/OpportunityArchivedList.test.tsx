import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OpportunityArchivedList } from "../OpportunityArchivedList";
import { useGetIdentity, useGetList } from "ra-core";

// Mock react-admin hooks
vi.mock("ra-core", () => ({
  useGetIdentity: vi.fn(),
  useGetList: vi.fn(),
}));

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
    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: 1, name: "Test User" },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGetList).mockReturnValue({
      data: mockOpportunities.slice(0, 25),
      total: 100,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OpportunityArchivedList />);

    // Verify useGetList was called with correct pagination
    expect(vi.mocked(useGetList)).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        pagination: { page: 1, perPage: 25 },
      })
    );
  });

  it("should display View archived opportunities button", () => {
    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: 1, name: "Test User" },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGetList).mockReturnValue({
      data: mockOpportunities.slice(0, 25),
      total: 100,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OpportunityArchivedList />);

    expect(screen.getByText("View archived opportunities")).toBeInTheDocument();
  });

  it("should show pagination info for first page", async () => {
    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: 1, name: "Test User" },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGetList).mockReturnValue({
      data: mockOpportunities.slice(0, 25),
      total: 100,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OpportunityArchivedList />);

    // Open dialog
    const button = screen.getByText("View archived opportunities");
    fireEvent.click(button);

    // Check pagination info
    await waitFor(() => {
      expect(screen.getByText(/Showing 1–25 of 100 archived opportunities/)).toBeInTheDocument();
    });
  });

  it("should show Load More button when there are more pages", async () => {
    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: 1, name: "Test User" },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useGetList).mockReturnValue({
      data: mockOpportunities.slice(0, 25),
      total: 100,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OpportunityArchivedList />);

    // Open dialog
    const button = screen.getByText("View archived opportunities");
    fireEvent.click(button);

    // Check Load More button exists
    await waitFor(() => {
      expect(screen.getByText("Load More")).toBeInTheDocument();
    });
  });

  it("should not show Load More button when all items are loaded", async () => {
    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: 1, name: "Test User" },
      isLoading: false,
      error: null,
    } as any);

    // Only 20 items with perPage=25 means all items fit on one page
    vi.mocked(useGetList).mockReturnValue({
      data: mockOpportunities.slice(0, 20),
      total: 20,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<OpportunityArchivedList />);

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

    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: 1, name: "Test User" },
      isLoading: false,
      error: null,
    } as any);

    mockUseGetList.mockReturnValue({
      data: mockOpportunities.slice(0, 25),
      total: 100,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { rerender } = render(<OpportunityArchivedList />);

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
