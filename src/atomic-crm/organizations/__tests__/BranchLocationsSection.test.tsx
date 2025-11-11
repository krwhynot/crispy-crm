// src/atomic-crm/organizations/__tests__/BranchLocationsSection.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TestMemoryRouter } from "@/test-utils";
import { BranchLocationsSection } from "../BranchLocationsSection";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";

// Mock useDataProvider
const mockGetList = vi.fn();
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useDataProvider: () => ({
      getList: mockGetList,
    }),
  };
});

describe("BranchLocationsSection", () => {
  beforeEach(() => {
    mockGetList.mockReset();
  });

  it("renders nothing when org has no children", () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Denver",
      organization_type: "distributor",
      child_branch_count: 0,
    };

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.queryByText(/Branch Locations/)).not.toBeInTheDocument();
  });

  it("renders section header with branch count", async () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      child_branch_count: 8,
    };

    mockGetList.mockResolvedValue({
      data: [],
      total: 8,
    });

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.getByText("Branch Locations (8)")).toBeInTheDocument();
  });

  it("fetches and displays branch organizations", async () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      child_branch_count: 3,
    };

    const branches = [
      {
        id: "2",
        name: "Sysco Denver",
        city: "Denver",
        nb_contacts: 12,
        nb_opportunities: 5,
      },
      {
        id: "3",
        name: "Sysco Colorado Springs",
        city: "Colorado Springs",
        nb_contacts: 8,
        nb_opportunities: 3,
      },
    ];

    mockGetList.mockResolvedValue({
      data: branches,
      total: 2,
    });

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sysco Denver")).toBeInTheDocument();
      expect(screen.getByText("Sysco Colorado Springs")).toBeInTheDocument();
      expect(screen.getByText("Denver")).toBeInTheDocument();
      expect(screen.getByText("Colorado Springs")).toBeInTheDocument();
    });

    // Verify getList was called with correct filter
    expect(mockGetList).toHaveBeenCalledWith("organizations", {
      filter: { parent_organization_id: "1" },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
    });
  });

  it("shows Add Branch button", () => {
    const org: OrganizationWithHierarchy = {
      id: "1",
      name: "Sysco Corporate",
      organization_type: "distributor",
      child_branch_count: 8,
    };

    mockGetList.mockResolvedValue({
      data: [],
      total: 0,
    });

    render(
      <TestMemoryRouter>
        <BranchLocationsSection organization={org} />
      </TestMemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Add Branch/i })).toBeInTheDocument();
  });
});
