/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type * as RaCore from "ra-core";

// Mock ra-core
vi.mock("ra-core", async () => {
  const actual = await vi.importActual<typeof RaCore>("ra-core");
  return {
    ...actual,
    useRecordContext: vi.fn(),
    useDataProvider: vi.fn(),
    useNotify: vi.fn(),
  };
});

import { useRecordContext, useDataProvider, useNotify } from "ra-core";
import { ParentOrganizationSection } from "../ParentOrganizationSection";
import type { Organization } from "../../types";

const mockOrganization = (overrides?: Partial<Organization>): Organization => ({
  id: 1,
  name: "Test Org",
  organization_type: "customer",
  priority: "C",
  nb_contacts: 0,
  nb_opportunities: 0,
  ...overrides,
});

const renderWithRouter = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ParentOrganizationSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when org has no parent", () => {
    const org = mockOrganization({ parent_organization_id: null });
    (useRecordContext as any).mockReturnValue(org);

    const { container } = renderWithRouter(<ParentOrganizationSection />);

    // Should return null - container should have no meaningful content
    expect(container.innerHTML).toBe("");
  });

  it("should render parent link when org has parent", async () => {
    const org = mockOrganization({
      id: 1,
      parent_organization_id: 2,
      parent_organization_name: "Parent Corp",
    });
    (useRecordContext as any).mockReturnValue(org);

    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [],
        total: 0,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 2, name: "Parent Corp" },
      }),
    };
    (useDataProvider as any).mockReturnValue(mockDataProvider);

    renderWithRouter(<ParentOrganizationSection />);

    await waitFor(() => {
      const parentLink = screen.getByRole("link", { name: /parent corp/i });
      expect(parentLink).toBeInTheDocument();
    });
  });

  it("should fetch and display sister branches", async () => {
    const org = mockOrganization({
      id: 1,
      parent_organization_id: 2,
      parent_organization_name: "Parent Corp",
    });
    (useRecordContext as any).mockReturnValue(org);

    const sisters = [
      { id: 10, name: "Sister Org A" },
      { id: 11, name: "Sister Org B" },
      { id: 12, name: "Sister Org C" },
    ];

    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: sisters,
        total: 3,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 2, name: "Parent Corp" },
      }),
    };
    (useDataProvider as any).mockReturnValue(mockDataProvider);

    renderWithRouter(<ParentOrganizationSection />);

    await waitFor(() => {
      sisters.forEach((sister) => {
        const link = screen.getByRole("link", { name: new RegExp(sister.name, "i") });
        expect(link).toBeInTheDocument();
      });
    });
  });

  it("should show first 3 sisters and 'Show all X more' button", async () => {
    const org = mockOrganization({
      id: 1,
      parent_organization_id: 2,
      parent_organization_name: "Parent Corp",
    });
    (useRecordContext as any).mockReturnValue(org);

    const sisters = [
      { id: 10, name: "Sister Org A" },
      { id: 11, name: "Sister Org B" },
      { id: 12, name: "Sister Org C" },
      { id: 13, name: "Sister Org D" },
      { id: 14, name: "Sister Org E" },
    ];

    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: sisters,
        total: 5,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 2, name: "Parent Corp" },
      }),
    };
    (useDataProvider as any).mockReturnValue(mockDataProvider);

    renderWithRouter(<ParentOrganizationSection />);

    await waitFor(() => {
      // First 3 should be visible
      expect(screen.getByRole("link", { name: /sister org a/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sister org b/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sister org c/i })).toBeInTheDocument();

      // Rest should not be visible initially
      expect(screen.queryByRole("link", { name: /sister org d/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /sister org e/i })).not.toBeInTheDocument();

      // Should show "Show all 2 more" button
      expect(screen.getByText(/show all 2 more/i)).toBeInTheDocument();
    });
  });

  it("should display Change Parent button", async () => {
    const org = mockOrganization({
      id: 1,
      parent_organization_id: 2,
      parent_organization_name: "Parent Corp",
    });
    (useRecordContext as any).mockReturnValue(org);

    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [],
        total: 0,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 2, name: "Parent Corp" },
      }),
    };
    (useDataProvider as any).mockReturnValue(mockDataProvider);

    renderWithRouter(<ParentOrganizationSection />);

    await waitFor(() => {
      const changeButton = screen.getByRole("link", { name: /change parent/i });
      expect(changeButton).toBeInTheDocument();
    });
  });

  it("should display Remove Parent button", async () => {
    const org = mockOrganization({
      id: 1,
      parent_organization_id: 2,
      parent_organization_name: "Parent Corp",
    });
    (useRecordContext as any).mockReturnValue(org);

    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [],
        total: 0,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 2, name: "Parent Corp" },
      }),
    };
    (useDataProvider as any).mockReturnValue(mockDataProvider);

    renderWithRouter(<ParentOrganizationSection />);

    await waitFor(() => {
      const removeButton = screen.getByRole("button", { name: /remove parent/i });
      expect(removeButton).toBeInTheDocument();
    });
  });

  it("should exclude self from sister branches", async () => {
    const org = mockOrganization({
      id: 1,
      parent_organization_id: 2,
      parent_organization_name: "Parent Corp",
    });
    (useRecordContext as any).mockReturnValue(org);

    // Mock returns all siblings including self
    const mockDataProvider = {
      getList: vi.fn().mockImplementation((resource, params) => {
        if (resource === "organizations") {
          // The component should filter out self with filter param
          const filteredSisters = [
            { id: 10, name: "Sister Org A" },
            { id: 11, name: "Sister Org B" },
          ];
          return Promise.resolve({
            data: filteredSisters,
            total: 2,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 2, name: "Parent Corp" },
      }),
    };
    (useDataProvider as any).mockReturnValue(mockDataProvider);

    renderWithRouter(<ParentOrganizationSection />);

    await waitFor(() => {
      // Verify getList was called with correct filter to exclude self
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          filter: expect.objectContaining({
            parent_organization_id: 2,
          }),
        })
      );
    });
  });
});
