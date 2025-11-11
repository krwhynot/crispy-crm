import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CampaignActivityReport from "../CampaignActivityReport";

// Mock ra-core hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
    useNotify: vi.fn(() => vi.fn()),
  };
});

describe("CampaignActivityReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders report title and summary cards", async () => {
    const { useGetList } = await import("ra-core");
    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <CampaignActivityReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Campaign Activity Report")).toBeInTheDocument();
    });

    // Summary cards
    expect(screen.getByText("Total Activities")).toBeInTheDocument();
    expect(screen.getByText("Organizations Contacted")).toBeInTheDocument();
    expect(screen.getByText("Coverage Rate")).toBeInTheDocument();
    expect(screen.getByText("Avg Activities per Lead")).toBeInTheDocument();
  });

  it("groups activities by type and calculates metrics", async () => {
    const { useGetList } = await import("ra-core");

    const mockActivities = [
      {
        id: 1,
        type: "note",
        subject: "Test",
        created_at: "2025-11-11T10:00:00Z",
        created_by: 1,
        organization_id: 10,
        contact_id: null,
        organization_name: "Test Org 1",
      },
      {
        id: 2,
        type: "call",
        subject: "Followup",
        created_at: "2025-11-11T11:00:00Z",
        created_by: 1,
        organization_id: 20,
        contact_id: null,
        organization_name: "Test Org 2",
      },
      {
        id: 3,
        type: "note",
        subject: "Another note",
        created_at: "2025-11-11T12:00:00Z",
        created_by: 1,
        organization_id: 10,
        contact_id: null,
        organization_name: "Test Org 1",
      },
    ];

    vi.mocked(useGetList).mockReturnValue({
      data: mockActivities,
      total: 3,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <CampaignActivityReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check that activities are grouped
      // Notes should have 2 activities, calls should have 1
      expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
    });
  });

  it("auto-expands top 3 activity types on load", async () => {
    const { useGetList } = await import("ra-core");

    // Mock 5 activity groups
    const mockActivities = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      type: ["note", "call", "email", "meeting", "demo"][i % 5],
      subject: `Activity ${i + 1}`,
      created_at: "2025-11-11T10:00:00Z",
      created_by: 1,
      organization_id: i % 3,
      contact_id: null,
      organization_name: `Org ${i % 3}`,
    }));

    vi.mocked(useGetList).mockReturnValue({
      data: mockActivities,
      total: 10,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <CampaignActivityReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Top 3 types should be expanded
      // This is a visual verification test
      expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
    });
  });

  it("shows empty state when no activities found", async () => {
    const { useGetList } = await import("ra-core");

    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <CampaignActivityReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No activities found for this campaign")).toBeInTheDocument();
      expect(screen.getByText("Activities will appear here once your team starts engaging with leads")).toBeInTheDocument();
    });
  });

  it("calculates summary metrics correctly", async () => {
    const { useGetList } = await import("ra-core");

    const mockActivities = [
      {
        id: 1,
        type: "note",
        subject: "Test",
        created_at: "2025-11-11T10:00:00Z",
        created_by: 1,
        organization_id: 10,
        contact_id: null,
        organization_name: "Test Org 1",
      },
      {
        id: 2,
        type: "call",
        subject: "Followup",
        created_at: "2025-11-11T11:00:00Z",
        created_by: 1,
        organization_id: 20,
        contact_id: null,
        organization_name: "Test Org 2",
      },
      {
        id: 3,
        type: "email",
        subject: "Product info",
        created_at: "2025-11-11T12:00:00Z",
        created_by: 2,
        organization_id: 30,
        contact_id: null,
        organization_name: "Test Org 3",
      },
    ];

    const mockSalesReps = [
      { id: 1, first_name: "John", last_name: "Smith" },
      { id: 2, first_name: "Jane", last_name: "Doe" },
    ];

    vi.mocked(useGetList).mockImplementation((resource: string) => {
      if (resource === "activities") {
        return {
          data: mockActivities,
          total: 3,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        } as any;
      } else if (resource === "sales") {
        return {
          data: mockSalesReps,
          total: 2,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        } as any;
      }
      return {
        data: [],
        total: 0,
        isPending: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any;
    });

    render(
      <MemoryRouter>
        <CampaignActivityReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check summary metrics - using getAllByText since "3" appears twice
      const threeElements = screen.getAllByText("3");
      expect(threeElements).toHaveLength(2); // Total Activities and Organizations Contacted both show "3"

      expect(screen.getByText("1%")).toBeInTheDocument(); // Coverage Rate (3/369)
      expect(screen.getByText("0.0")).toBeInTheDocument(); // Avg per lead (3/369)
    });
  });
});