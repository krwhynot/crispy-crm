/**
 * Tests for BranchLocationsSection component
 *
 * Tests the branch locations display including:
 * - Rendering nothing when org has no children
 * - Displaying section header with branch count
 * - Fetching and displaying branch organizations in a table
 * - "Add Branch Location" button
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import type * as RaCore from "ra-core";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import {
  createMockOrganization,
  createMockDataProvider,
} from "@/tests/utils/mock-providers";
import type { OrganizationWithHierarchy } from "@/atomic-crm/types";
import { BranchLocationsSection } from "../BranchLocationsSection";

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual<typeof RaCore>("ra-core");
  return {
    ...actual,
    useRecordContext: vi.fn(),
  };
});

// Import mocked functions
import { useRecordContext } from "ra-core";

describe("BranchLocationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders nothing when org has no child_branch_count", async () => {
    const mockOrg: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Parent Corp" }),
      child_branch_count: 0,
    };

    (useRecordContext as any).mockReturnValue(mockOrg);

    const { container } = renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        initialEntries: ["/organizations/1/show"],
      }
    );

    // Should render nothing (null)
    expect(container.firstChild).toBeNull();
  });

  test("renders section header with branch count", async () => {
    const mockOrg: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Parent Corp" }),
      child_branch_count: 3,
    };

    (useRecordContext as any).mockReturnValue(mockOrg);

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        dataProvider: createMockDataProvider({
          getList: vi.fn().mockResolvedValue({
            data: [],
            total: 0,
          }),
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      expect(
        screen.getByText(/3 Branch Locations?/i)
      ).toBeInTheDocument();
    });
  });

  test("fetches and displays branch organizations in a table", async () => {
    const mockOrg: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Parent Corp" }),
      child_branch_count: 2,
    };

    const mockBranches = [
      createMockOrganization({
        id: 2,
        name: "Branch 1",
        nb_contacts: 5,
        nb_opportunities: 3,
      }),
      createMockOrganization({
        id: 3,
        name: "Branch 2",
        nb_contacts: 8,
        nb_opportunities: 2,
      }),
    ];

    (useRecordContext as any).mockReturnValue(mockOrg);

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        dataProvider: createMockDataProvider({
          getList: vi.fn().mockResolvedValue({
            data: mockBranches,
            total: 2,
          }),
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      // Check table headers
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("City")).toBeInTheDocument();
      expect(screen.getByText("Contacts")).toBeInTheDocument();
      expect(screen.getByText("Opportunities")).toBeInTheDocument();

      // Check branch data is displayed
      expect(screen.getByText("Branch 1")).toBeInTheDocument();
      expect(screen.getByText("Branch 2")).toBeInTheDocument();
    });
  });

  test("shows Add Branch Location button", async () => {
    const mockOrg: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Parent Corp" }),
      child_branch_count: 1,
    };

    const mockBranch = createMockOrganization({
      id: 2,
      name: "Branch 1",
    });

    (useRecordContext as any).mockReturnValue(mockOrg);

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        dataProvider: createMockDataProvider({
          getList: vi.fn().mockResolvedValue({
            data: [mockBranch],
            total: 1,
          }),
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      const link = screen.getByText(/add branch location/i);
      expect(link).toBeInTheDocument();
    });
  });

  test("displays loading state while fetching branches", async () => {
    const mockOrg: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Parent Corp" }),
      child_branch_count: 1,
    };

    const mockBranch = createMockOrganization({
      id: 2,
      name: "Delayed Branch",
    });

    (useRecordContext as any).mockReturnValue(mockOrg);

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        dataProvider: createMockDataProvider({
          getList: vi.fn(
            () =>
              new Promise((resolve) =>
                setTimeout(
                  () =>
                    resolve({
                      data: [mockBranch],
                      total: 1,
                    }),
                  100
                )
              )
          ),
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    // Eventually should load (skeleton loaders should disappear and table appears)
    await waitFor(
      () => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test("displays empty state when no branches exist", async () => {
    const mockOrg: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 1, name: "Parent Corp" }),
      child_branch_count: 0,
    };

    (useRecordContext as any).mockReturnValue(mockOrg);

    const { container } = renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        dataProvider: createMockDataProvider({
          getList: vi.fn().mockResolvedValue({
            data: [],
            total: 0,
          }),
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    // When child_branch_count is 0, component returns null
    expect(container.firstChild).toBeNull();
  });

  test("calls getList with correct filter for parent_organization_id", async () => {
    const mockOrg: OrganizationWithHierarchy = {
      ...createMockOrganization({ id: 42, name: "Parent Corp" }),
      child_branch_count: 1,
    };

    const mockGetList = vi.fn().mockResolvedValue({
      data: [],
      total: 0,
    });

    (useRecordContext as any).mockReturnValue(mockOrg);

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<BranchLocationsSection org={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        dataProvider: createMockDataProvider({
          getList: mockGetList,
        }),
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalled();
      const call = mockGetList.mock.calls[0];
      // getList is called with (resource, params)
      expect(call[0]).toBe("organizations");
      expect(call[1].filter).toEqual({
        parent_organization_id: 42,
      });
    });
  });
});
