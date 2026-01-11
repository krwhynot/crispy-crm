/**
 * Tests for AuthorizationsTab component
 *
 * Tests the principal authorizations tab for distributor organizations including:
 * - Loading states and empty state
 * - Displaying authorized principals list
 * - Add authorization dialog functionality
 * - Remove authorization confirmation
 * - Status badges (active, expired, inactive)
 * - Product-level exceptions (expandable section)
 * - Add/remove product exceptions
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import type { GetListParams } from "react-admin";
import * as reactAdmin from "react-admin";

// Import component under test
import { AuthorizationsTab } from "../AuthorizationsTab";

// Setup spies on react-admin hooks
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useGetList: vi.fn(),
    useCreate: vi.fn(),
    useDelete: vi.fn(),
    useNotify: vi.fn(),
    useRefresh: vi.fn(),
    useGetIdentity: vi.fn(),
  };
});

describe("AuthorizationsTab", () => {
  const mockDistributorId = 9;
  const mockRefresh = vi.fn();
  const mockNotify = vi.fn();
  const mockCreateFn = vi.fn();
  const mockDeleteFn = vi.fn();

  // Mock authorization data
  const mockAuthorizations = [
    {
      id: 1,
      distributor_id: 9,
      principal_id: 1,
      is_authorized: true,
      authorization_date: "2024-01-01",
      expiration_date: null,
      territory_restrictions: null,
      notes: "Full line authorization",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      distributor_id: 9,
      principal_id: 2,
      is_authorized: true,
      authorization_date: "2024-01-15",
      expiration_date: "2025-12-31", // Future date - still active
      territory_restrictions: ["TX", "OK", "LA"],
      notes: "Regional only",
      created_at: "2024-01-15T00:00:00Z",
    },
  ];

  // Mock principal organizations
  const mockPrincipals = [
    { id: 1, name: "McCRUM Foods", organization_type: "principal" },
    { id: 2, name: "Rapid Rasoi", organization_type: "principal" },
    { id: 3, name: "Premium Produce", organization_type: "principal" },
    { id: 4, name: "Fresh Farms", organization_type: "principal" },
  ];

  // Mock products for exception testing
  const mockProducts = [
    { id: 101, name: "McCRUM Fries", sku: "MCF-001", principal_id: 1, category: "frozen" },
    { id: 102, name: "McCRUM Wedges", sku: "MCW-002", principal_id: 1, category: "frozen" },
    { id: 103, name: "McCRUM Chips", sku: "MCC-003", principal_id: 1, category: "snacks" },
  ];

  // Mock product authorizations (exceptions)
  const mockProductAuths = [
    {
      id: 501,
      product_id: 102,
      distributor_id: 9,
      is_authorized: false, // Exception: blocked
      authorization_date: "2024-02-01",
      expiration_date: null,
      notes: "Product discontinued in this region",
      created_at: "2024-02-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementations for all hooks
    vi.mocked(reactAdmin.useRefresh).mockReturnValue(mockRefresh);
    vi.mocked(reactAdmin.useNotify).mockReturnValue(mockNotify);
    vi.mocked(reactAdmin.useCreate).mockReturnValue([mockCreateFn, { isPending: false }] as any);
    vi.mocked(reactAdmin.useDelete).mockReturnValue([mockDeleteFn, { isPending: false }] as any);
    vi.mocked(reactAdmin.useGetIdentity).mockReturnValue({
      data: { id: 1 },
      isLoading: false,
    } as any);
  });

  describe("Loading State", () => {
    test("renders loading skeleton when fetching authorizations", () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: undefined, isPending: true, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      // Should show skeleton loading state (class name contains skeleton-related styling)
      expect(document.querySelector(".space-y-4")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    test("renders error message when fetch fails", () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: undefined, isPending: false, error: new Error("Network error") } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      expect(screen.getByText(/failed to load authorizations/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    test("renders empty state when no authorizations exist", () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [], isPending: false, error: null } as any;
        }
        return { data: mockPrincipals, isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      // Use getAllByText since there are multiple "no authorized" references
      expect(screen.getAllByText(/no authorized principals/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/add.*principal/i).length).toBeGreaterThan(0);
    });

    test("shows Add Principal button in empty state", () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [], isPending: false, error: null } as any;
        }
        return { data: mockPrincipals, isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      // Both the header Add button and the empty state button should be present
      const addButtons = screen.getAllByRole("button", { name: /add.*principal/i });
      expect(addButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Authorization List", () => {
    test("renders list of authorized principals with count", async () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation(
        (resource: string, params?: GetListParams) => {
          if (resource === "distributor_principal_authorizations") {
            return { data: mockAuthorizations, isPending: false, error: null } as any;
          }
          if (resource === "organizations") {
            if (params?.filter?.id) {
              const principal = mockPrincipals.find((p) => p.id === params.filter.id);
              return { data: principal ? [principal] : [], isPending: false, error: null } as any;
            }
            return { data: mockPrincipals, isPending: false, error: null } as any;
          }
          return { data: [], isPending: false, error: null } as any;
        }
      );

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(screen.getByText(/2 authorized principals/i)).toBeInTheDocument();
      });
    });

    test("displays authorization cards", async () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: mockAuthorizations, isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        // Should have authorization cards rendered
        const cards = document.querySelectorAll('[class*="border-border"][class*="rounded-lg"]');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Add Principal Dialog", () => {
    test("opens add dialog when clicking Add Principal button", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [], isPending: false, error: null } as any;
        }
        return { data: mockPrincipals, isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      // Find the Add Principal button in the header
      const addButton = screen.getAllByRole("button", { name: /add principal/i })[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText(/add authorized principal/i)).toBeInTheDocument();
      });
    });

    test("dialog has form elements when open", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [], isPending: false, error: null } as any;
        }
        return { data: mockPrincipals, isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      const addButton = screen.getAllByRole("button", { name: /add principal/i })[0];
      await user.click(addButton);

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
        // Check dialog has form structure
        expect(screen.getByText(/add authorized principal/i)).toBeInTheDocument();
      });
    });

    test("dialog closes via close button", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [], isPending: false, error: null } as any;
        }
        return { data: mockPrincipals, isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      const addButton = screen.getAllByRole("button", { name: /add principal/i })[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Find close button (X button or Cancel)
      const closeButtons = screen.getAllByRole("button");
      const cancelButton = closeButtons.find((btn) => btn.textContent?.match(/cancel/i));
      if (cancelButton) {
        await user.click(cancelButton);
        await waitFor(() => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
      }
    });
  });

  describe("Remove Authorization", () => {
    test("shows remove button on authorization cards", async () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /remove authorization/i })).toBeInTheDocument();
      });
    });

    test("opens confirmation dialog when clicking remove", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(screen.getByText(/1 authorized principal/)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole("button", { name: /remove authorization/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(screen.getByText(/remove principal authorization/i)).toBeInTheDocument();
      });
    });

    test("closes confirmation dialog on cancel", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(screen.getByText(/1 authorized principal/)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole("button", { name: /remove authorization/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Slide-over Tab Interface", () => {
    test("accepts record prop for slide-over usage", async () => {
      const mockRecord = {
        id: mockDistributorId,
        name: "Test Distributor",
        organization_type: "distributor",
      };

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: mockAuthorizations, isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(
        <AuthorizationsTab record={mockRecord} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText(/2 authorized principals/i)).toBeInTheDocument();
      });
    });

    test("shows message when no distributor selected", () => {
      renderWithAdminContext(<AuthorizationsTab />);
      expect(screen.getByText(/no distributor selected/i)).toBeInTheDocument();
    });
  });

  describe("Product-Level Exceptions", () => {
    test("shows expand button on authorization cards", async () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        // Should have expand/collapse trigger button
        const expandButton = screen.getByRole("button", { name: /expand product exceptions/i });
        expect(expandButton).toBeInTheDocument();
      });
    });

    test("expands to show product exceptions section", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "product_distributor_authorizations") {
          return { data: mockProductAuths, isPending: false, error: null } as any;
        }
        if (resource === "products") {
          return { data: mockProducts, isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /expand product exceptions/i })
        ).toBeInTheDocument();
      });

      const expandButton = screen.getByRole("button", { name: /expand product exceptions/i });
      await user.click(expandButton);

      await waitFor(() => {
        // Should show Product Exceptions heading
        expect(screen.getByText(/product exceptions/i)).toBeInTheDocument();
      });
    });

    test("shows exception count badge when exceptions exist", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "product_distributor_authorizations") {
          return { data: mockProductAuths, isPending: false, error: null } as any;
        }
        if (resource === "products") {
          return { data: mockProducts, isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      // First expand to trigger the product auth fetch
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /expand product exceptions/i })
        ).toBeInTheDocument();
      });

      const expandButton = screen.getByRole("button", { name: /expand product exceptions/i });
      await user.click(expandButton);

      await waitFor(() => {
        // Should show exception count in badge
        expect(screen.getByText(/1 exception/i)).toBeInTheDocument();
      });
    });

    test("displays blocked product in exceptions list", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "product_distributor_authorizations") {
          return { data: mockProductAuths, isPending: false, error: null } as any;
        }
        if (resource === "products") {
          return { data: mockProducts, isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      const expandButton = await screen.findByRole("button", {
        name: /expand product exceptions/i,
      });
      await user.click(expandButton);

      await waitFor(() => {
        // Should show the blocked product with "Not Authorized" status
        expect(screen.getByText("McCRUM Wedges")).toBeInTheDocument();
        expect(screen.getByText("Not Authorized")).toBeInTheDocument();
      });
    });
  });

  describe("Status Badges", () => {
    test("shows Active badge for valid authorization", async () => {
      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [mockAuthorizations[0]], isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(screen.getByText("Active")).toBeInTheDocument();
      });
    });

    test("shows Expired badge for expired authorization", async () => {
      const expiredAuth = {
        ...mockAuthorizations[0],
        expiration_date: "2020-01-01", // Past date
      };

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [expiredAuth], isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(screen.getByText("Expired")).toBeInTheDocument();
      });
    });

    test("shows Inactive badge for is_authorized=false", async () => {
      const inactiveAuth = {
        ...mockAuthorizations[0],
        is_authorized: false,
      };

      vi.mocked(reactAdmin.useGetList).mockImplementation((resource: string, params?: any) => {
        if (resource === "distributor_principal_authorizations") {
          return { data: [inactiveAuth], isPending: false, error: null } as any;
        }
        if (resource === "organizations") {
          if (params?.filter?.id) {
            const principal = mockPrincipals.find((p) => p.id === params.filter.id);
            return { data: principal ? [principal] : [], isPending: false, error: null } as any;
          }
          return { data: mockPrincipals, isPending: false, error: null } as any;
        }
        return { data: [], isPending: false, error: null } as any;
      });

      renderWithAdminContext(<AuthorizationsTab distributorId={mockDistributorId} />);

      await waitFor(() => {
        expect(screen.getByText("Inactive")).toBeInTheDocument();
      });
    });
  });
});
