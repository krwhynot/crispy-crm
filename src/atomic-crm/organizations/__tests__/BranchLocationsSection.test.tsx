// src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx

import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockOrganization, createMockDataProvider } from "@/tests/utils/mock-providers";
import { BranchLocationsSection } from "../BranchLocationsSection";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";

describe("BranchLocationsSection", () => {
  it("renders nothing when org has no children", () => {
    const org: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Sysco Denver" }),
      organization_type: "distributor",
      child_branch_count: 0,
    };

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={org} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: org,
        initialEntries: ["/organizations/1/show"],
      }
    );

    expect(screen.queryByText(/Branch Locations/)).not.toBeInTheDocument();
  });

  it("renders section header with branch count", async () => {
    const org: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Sysco Corporate" }),
      organization_type: "distributor",
      child_branch_count: 8,
    };

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={org} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: org,
        dataProvider: createMockDataProvider({
          getList: vi.fn().mockResolvedValue({
            data: [],
            total: 8,
          }),
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    expect(screen.getByText("8 Branch Locations")).toBeInTheDocument();
  });

  it("fetches and displays branch organizations", async () => {
    const org: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Sysco Corporate" }),
      organization_type: "distributor",
      child_branch_count: 3,
    };

    const branches = [
      createMockOrganization({
        id: 2,
        name: "Sysco Denver",
        city: "Denver",
        nb_contacts: 12,
        nb_opportunities: 5,
      }),
      createMockOrganization({
        id: 3,
        name: "Sysco Colorado Springs",
        city: "Colorado Springs",
        nb_contacts: 8,
        nb_opportunities: 3,
      }),
    ];

    const mockGetList = vi.fn().mockResolvedValue({
      data: branches,
      total: 2,
    });

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={org} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: org,
        dataProvider: createMockDataProvider({
          getList: mockGetList,
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Sysco Denver")).toBeInTheDocument();
      expect(screen.getByText("Sysco Colorado Springs")).toBeInTheDocument();
      expect(screen.getByText("Denver")).toBeInTheDocument();
      expect(screen.getByText("Colorado Springs")).toBeInTheDocument();
    });

    // Verify getList was called with correct filter
    expect(mockGetList).toHaveBeenCalledWith("organizations", {
      filter: { parent_organization_id: 1 },
      pagination: { page: 1, perPage: 100 },
    });
  });

  it("shows Add Branch button", () => {
    const org: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Sysco Corporate" }),
      organization_type: "distributor",
      child_branch_count: 8,
    };

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={org} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: org,
        dataProvider: createMockDataProvider({
          getList: vi.fn().mockResolvedValue({
            data: [],
            total: 0,
          }),
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    expect(screen.getByRole("link", { name: /Add Branch/i })).toBeInTheDocument();
  });
});
