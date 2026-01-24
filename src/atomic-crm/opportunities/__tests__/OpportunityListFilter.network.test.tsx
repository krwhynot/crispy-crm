import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OpportunityListFilter } from "../OpportunityListFilter";
import { useGetList, useGetIdentity, ListContextProvider } from "ra-core";

// Mock React Admin hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
    useGetIdentity: vi.fn(),
  };
});

describe("OpportunityListFilter - Network Optimization", () => {
  const mockOrganizations = [
    { id: 1, name: "Principal A", organization_type: "principal" },
    { id: 2, name: "Principal B", organization_type: "principal" },
    { id: 3, name: "Customer X", organization_type: "customer" },
    { id: 4, name: "Prospect Y", organization_type: "prospect" },
  ];

  const mockCampaigns = [
    { id: "1", name: "Campaign Q1" },
    { id: "2", name: "Campaign Q2" },
  ];

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock identity
    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: "user-1", fullName: "Test User" },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
  });

  describe("PERF: Query Batching (P0-PERF-2)", () => {
    it("combines organizations into single query instead of separate principal/customer calls", async () => {
      const mockUseGetList = vi.mocked(useGetList);

      // Mock organizations query
      mockUseGetList.mockImplementation((resource: string) => {
        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          } as any;
        }
        if (resource === "distinct_opportunities_campaigns") {
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          } as any;
        }
        return {
          data: [],
          total: 0,
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        } as any;
      });

      renderWithAdminContext(<OpportunityListFilter />);

      await waitFor(() => {
        expect(screen.getByText("Principal A")).toBeInTheDocument();
      });

      // CRITICAL ASSERTION: Only 1 organizations call, not 2 separate calls
      const organizationsCalls = mockUseGetList.mock.calls.filter(
        (call) => call[0] === "organizations"
      );

      expect(organizationsCalls).toHaveLength(1);

      // Verify the single query uses the combined filter
      const [, params] = organizationsCalls[0];
      expect(params?.filter).toEqual(
        expect.objectContaining({
          "organization_type@in": "(principal,prospect,customer)",
          deleted_at: null,
        })
      );
    });

    it("fetches campaigns from optimized DB view with caching", async () => {
      const mockUseGetList = vi.mocked(useGetList);

      mockUseGetList.mockImplementation((resource: string, _params, options) => {
        if (resource === "distinct_opportunities_campaigns") {
          // Verify caching options are passed
          expect(options).toMatchObject({
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
            refetchOnWindowFocus: false,
          });

          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          } as any;
        }
        return {
          data: mockOrganizations,
          total: mockOrganizations.length,
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        } as any;
      });

      renderWithAdminContext(<OpportunityListFilter />);

      await waitFor(() => {
        const campaignsCalls = mockUseGetList.mock.calls.filter(
          (call) => call[0] === "distinct_opportunities_campaigns"
        );
        expect(campaignsCalls).toHaveLength(1);
      });
    });

    it("splits organizations client-side to maintain data shape", async () => {
      const mockUseGetList = vi.mocked(useGetList);

      mockUseGetList.mockImplementation((resource: string) => {
        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          } as any;
        }
        return {
          data: mockCampaigns,
          total: mockCampaigns.length,
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        } as any;
      });

      renderWithAdminContext(<OpportunityListFilter />);

      // Wait for rendering
      await waitFor(() => {
        expect(screen.getByText("Principal A")).toBeInTheDocument();
      });

      // Verify principals section shows only principal orgs
      expect(screen.getByText("Principal A")).toBeInTheDocument();
      expect(screen.getByText("Principal B")).toBeInTheDocument();

      // Verify customers section shows prospect/customer orgs
      expect(screen.getByText("Customer X")).toBeInTheDocument();
      expect(screen.getByText("Prospect Y")).toBeInTheDocument();
    });
  });

  describe("Network Request Count", () => {
    it("makes exactly 3 queries on mount (identity + organizations + campaigns)", async () => {
      const mockUseGetList = vi.mocked(useGetList);
      const mockUseGetIdentity = vi.mocked(useGetIdentity);

      mockUseGetList.mockImplementation((resource: string) => {
        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          } as any;
        }
        if (resource === "distinct_opportunities_campaigns") {
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          } as any;
        }
        return {
          data: [],
          total: 0,
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        } as any;
      });

      renderWithAdminContext(<OpportunityListFilter />);

      await waitFor(() => {
        expect(screen.getByText("Principal A")).toBeInTheDocument();
      });

      // Count total hook calls
      expect(mockUseGetList).toHaveBeenCalledTimes(2); // organizations + campaigns
      expect(mockUseGetIdentity).toHaveBeenCalled(); // identity

      // Verify NO duplicate organizations calls
      const organizationsCalls = mockUseGetList.mock.calls.filter(
        (call) => call[0] === "organizations"
      );
      expect(organizationsCalls).toHaveLength(1);
    });
  });

  describe("Regression Prevention", () => {
    it("does NOT make separate calls for principals and customers", async () => {
      const mockUseGetList = vi.mocked(useGetList);

      mockUseGetList.mockImplementation((resource: string) => {
        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          } as any;
        }
        return {
          data: mockCampaigns,
          total: mockCampaigns.length,
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        } as any;
      });

      renderWithAdminContext(<OpportunityListFilter />);

      await waitFor(() => {
        expect(screen.getByText("Principal A")).toBeInTheDocument();
      });

      // RED FLAG: If this test fails, someone re-introduced the N+1 pattern
      const allCalls = mockUseGetList.mock.calls.map((call) => call[0]);
      expect(allCalls).not.toContain("principals"); // Old resource name
      expect(allCalls).not.toContain("customers"); // Old resource name

      // Only the combined query should exist
      expect(allCalls.filter((r) => r === "organizations")).toHaveLength(1);
    });
  });
});
