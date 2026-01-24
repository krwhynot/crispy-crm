/**
 * Network Optimization Tests for OpportunityListFilter
 *
 * Validates that filter component uses optimized query batching pattern:
 * - Single combined query for organizations (not separate principal/customer calls)
 * - Cached DB view for campaigns
 * - Client-side filtering to maintain data shape
 *
 * These tests prevent regression to N+1 query patterns (P0-PERF-2).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OpportunityListFilter } from "../OpportunityListFilter";
import type { DataProvider } from "ra-core";
import { ListContextProvider } from "ra-core";

// Helper to wrap filter in required List context
const FilterWithContext = () => (
  <ListContextProvider
    value={{
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      setSort: vi.fn(),
      setPage: vi.fn(),
      setPerPage: vi.fn(),
      page: 1,
      perPage: 100,
      sort: { field: "id", order: "ASC" },
      resource: "opportunities",
      hasNextPage: false,
      hasPreviousPage: false,
    }}
  >
    <OpportunityListFilter />
  </ListContextProvider>
);

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

  let mockGetList: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetList = vi.fn();
  });

  describe("PERF: Query Batching (P0-PERF-2)", () => {
    it("combines organizations into single query instead of separate principal/customer calls", async () => {
      // Track what resources are queried
      mockGetList.mockImplementation(async (resource: string, params: any) => {
        if (resource === "organizations") {
          // Verify combined filter is used
          expect(params.filter).toMatchObject({
            "organization_type@in": "(principal,prospect,customer)",
            deleted_at: null,
          });

          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
          };
        }

        if (resource === "distinct_opportunities_campaigns") {
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
          };
        }

        return { data: [], total: 0 };
      });

      renderWithAdminContext(<OpportunityListFilter />, {
        dataProvider: {
          getList: mockGetList,
        } as Partial<DataProvider>,
        resource: "opportunities",
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText("Principal A")).toBeInTheDocument();
      });

      // CRITICAL ASSERTION: Only 1 organizations call, not 2
      const organizationsCalls = mockGetList.mock.calls.filter(
        ([resource]) => resource === "organizations"
      );

      expect(organizationsCalls).toHaveLength(1);

      // Verify the single query uses combined filter
      const [, params] = organizationsCalls[0];
      expect(params.filter).toEqual({
        "organization_type@in": "(principal,prospect,customer)",
        deleted_at: null,
      });
    });

    it("splits organizations client-side to maintain data shape", async () => {
      mockGetList.mockImplementation(async (resource: string) => {
        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
          };
        }

        if (resource === "distinct_opportunities_campaigns") {
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
          };
        }

        return { data: [], total: 0 };
      });

      renderWithAdminContext(<OpportunityListFilter />, {
        dataProvider: {
          getList: mockGetList,
        } as Partial<DataProvider>,
        resource: "opportunities",
      });

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

    it("uses optimized DB view for campaigns", async () => {
      mockGetList.mockImplementation(async (resource: string) => {
        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
          };
        }

        if (resource === "distinct_opportunities_campaigns") {
          // This view only returns distinct campaign names, not full opportunities
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
          };
        }

        return { data: [], total: 0 };
      });

      renderWithAdminContext(<OpportunityListFilter />, {
        dataProvider: {
          getList: mockGetList,
        } as Partial<DataProvider>,
        resource: "opportunities",
      });

      await waitFor(() => {
        expect(screen.getByText("Campaign Q1")).toBeInTheDocument();
      });

      // Verify campaigns query uses the optimized view
      const campaignsCalls = mockGetList.mock.calls.filter(
        ([resource]) => resource === "distinct_opportunities_campaigns"
      );

      expect(campaignsCalls).toHaveLength(1);
    });
  });

  describe("Network Request Count", () => {
    it("makes exactly 2 getList queries on mount (organizations + campaigns)", async () => {
      mockGetList.mockImplementation(async (resource: string) => {
        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
          };
        }

        if (resource === "distinct_opportunities_campaigns") {
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
          };
        }

        return { data: [], total: 0 };
      });

      renderWithAdminContext(<OpportunityListFilter />, {
        dataProvider: {
          getList: mockGetList,
        } as Partial<DataProvider>,
        resource: "opportunities",
      });

      await waitFor(() => {
        expect(screen.getByText("Principal A")).toBeInTheDocument();
      });

      // Count total getList calls
      expect(mockGetList).toHaveBeenCalledTimes(2);

      // Verify resources queried
      const queriedResources = mockGetList.mock.calls.map(([resource]) => resource);
      expect(queriedResources).toEqual(
        expect.arrayContaining(["organizations", "distinct_opportunities_campaigns"])
      );

      // Verify NO duplicate organizations calls
      const organizationsCalls = mockGetList.mock.calls.filter(
        ([resource]) => resource === "organizations"
      );
      expect(organizationsCalls).toHaveLength(1);
    });
  });

  describe("Regression Prevention", () => {
    it("does NOT make separate calls for principals and customers", async () => {
      mockGetList.mockImplementation(async (resource: string) => {
        // This should FAIL the test if old pattern is reintroduced
        if (resource === "principals" || resource === "customers") {
          throw new Error(
            `REGRESSION DETECTED: Using old separate queries for ${resource}. ` +
              `Should use combined 'organizations' query.`
          );
        }

        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
          };
        }

        if (resource === "distinct_opportunities_campaigns") {
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
          };
        }

        return { data: [], total: 0 };
      });

      renderWithAdminContext(<OpportunityListFilter />, {
        dataProvider: {
          getList: mockGetList,
        } as Partial<DataProvider>,
        resource: "opportunities",
      });

      await waitFor(() => {
        expect(screen.getByText("Principal A")).toBeInTheDocument();
      });

      // RED FLAG: If this test fails, someone re-introduced the N+1 pattern
      const allResources = mockGetList.mock.calls.map(([resource]) => resource);
      expect(allResources).not.toContain("principals"); // Old resource name
      expect(allResources).not.toContain("customers"); // Old resource name

      // Only the combined query should exist
      expect(allResources.filter((r) => r === "organizations")).toHaveLength(1);
    });

    it("does NOT fetch full opportunities list for campaign values", async () => {
      mockGetList.mockImplementation(async (resource: string) => {
        // This should FAIL if old pattern is reintroduced
        if (resource === "opportunities" || resource === "opportunities_summary") {
          throw new Error(
            `REGRESSION DETECTED: Fetching full opportunities list for campaigns. ` +
              `Should use 'distinct_opportunities_campaigns' view.`
          );
        }

        if (resource === "organizations") {
          return {
            data: mockOrganizations,
            total: mockOrganizations.length,
          };
        }

        if (resource === "distinct_opportunities_campaigns") {
          return {
            data: mockCampaigns,
            total: mockCampaigns.length,
          };
        }

        return { data: [], total: 0 };
      });

      renderWithAdminContext(<OpportunityListFilter />, {
        dataProvider: {
          getList: mockGetList,
        } as Partial<DataProvider>,
        resource: "opportunities",
      });

      await waitFor(() => {
        expect(screen.getByText("Campaign Q1")).toBeInTheDocument();
      });

      // Campaigns should come from optimized view
      const allResources = mockGetList.mock.calls.map(([resource]) => resource);
      expect(allResources).toContain("distinct_opportunities_campaigns");
      expect(allResources).not.toContain("opportunities");
      expect(allResources).not.toContain("opportunities_summary");
    });
  });
});
