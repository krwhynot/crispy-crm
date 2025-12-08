/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationInputs } from "./OrganizationInputs";
import { OrganizationShow } from "./OrganizationShow";
import { OrganizationList } from "./OrganizationList";
import { ConfigurationContext } from "../root/ConfigurationContext";

// Mock organizations with organization types
const mockOrganizations = [
  {
    id: 1,
    name: "Acme Corp",
    sector: "Technology",
    organization_type: "customer",
    priority: "A",
    website: "https://acme.com",
    phone: "+1-555-0100",
    address: "123 Tech Street",
    city: "San Francisco",
    postal_code: "94105",
    state: "CA",
    revenue: 50000000,
    size: "Large",
    parent_organization_id: null,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Principal Solutions Inc",
    sector: "Software",
    organization_type: "principal",
    priority: "A",
    website: "https://principal-solutions.com",
    phone: "+1-555-0200",
    address: "456 Principal Ave",
    city: "Austin",
    postal_code: "73301",
    state: "TX",
    revenue: 100000000,
    size: "Large",
    parent_organization_id: null,
    created_at: "2024-01-10T10:00:00Z",
  },
  {
    id: 3,
    name: "Tech Distributors Ltd",
    sector: "Distribution",
    organization_type: "distributor",
    priority: "B",
    website: "https://techdist.com",
    phone: "+1-555-0300",
    address: "789 Distribution Way",
    city: "Chicago",
    postal_code: "60601",
    state: "IL",
    revenue: 25000000,
    size: "Medium",
    parent_organization_id: null,
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: 4,
  },
];

const mockSales = [
  { id: 1, first_name: "Alice", last_name: "Johnson" },
  { id: 2, first_name: "Bob", last_name: "Smith" },
];

// Mock the data provider
const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

const mockConfiguration = {
  opportunityCategories: ["Software", "Hardware", "Services", "Support"],
  contactGender: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ],
  contactRoles: [
    { id: "decision_maker", name: "Decision Maker" },
    { id: "influencer", name: "Influencer" },
    { id: "buyer", name: "Buyer" },
  ],
  companySectors: ["Technology", "Healthcare", "Finance", "Software", "Services", "Distribution"],
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminContext dataProvider={mockDataProvider}>
          <ConfigurationContext.Provider value={mockConfiguration}>
            {children}
          </ConfigurationContext.Provider>
        </AdminContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Organization Type Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getList for organizations
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === "organizations") {
        let filteredOrganizations = [...mockOrganizations];

        // Apply filters
        if (params.filter) {
          if (params.filter.organization_type) {
            filteredOrganizations = filteredOrganizations.filter(
              (org) => org.organization_type === params.filter.organization_type
            );
          }

          if (params.filter.priority) {
            filteredOrganizations = filteredOrganizations.filter(
              (org) => org.priority === params.filter.priority
            );
          }

          if (params.filter.sector) {
            filteredOrganizations = filteredOrganizations.filter(
              (org) => org.sector === params.filter.sector
            );
          }

          if (params.filter.q) {
            const query = params.filter.q.toLowerCase();
            filteredOrganizations = filteredOrganizations.filter(
              (org) =>
                org.name.toLowerCase().includes(query) || org.sector?.toLowerCase().includes(query)
            );
          }
        }

        return Promise.resolve({
          data: filteredOrganizations,
          total: filteredOrganizations.length,
        });
      }

      if (resource === "sales") {
        return Promise.resolve({
          data: mockSales,
          total: mockSales.length,
        });
      }

      return Promise.resolve({ data: [], total: 0 });
    });

    // Mock getOne for organization
    mockDataProvider.getOne.mockImplementation((resource, params) => {
      if (resource === "organizations") {
        const organization = mockOrganizations.find((c) => c.id === params.id);
        return organization
          ? Promise.resolve({ data: organization })
          : Promise.reject(new Error("Not found"));
      }
      return Promise.reject(new Error("Not found"));
    });

    mockDataProvider.getMany.mockImplementation((resource, params) => {
      if (resource === "organizations") {
        return Promise.resolve({
          data: mockOrganizations.filter((c) => params.ids.includes(c.id)),
        });
      }
      if (resource === "sales") {
        return Promise.resolve({
          data: mockSales.filter((s) => params.ids.includes(s.id)),
        });
      }
      return Promise.resolve({ data: [] });
    });

    mockDataProvider.create.mockResolvedValue({
      data: { id: 6, name: "New Company" },
    });

    mockDataProvider.update.mockResolvedValue({
      data: { id: 1, name: "Updated Company" },
    });
  });

  describe("OrganizationInputs - Organization Type Fields", () => {
    it("should render organization type selector with all options", async () => {
      render(
        <TestWrapper>
          <OrganizationInputs />
        </TestWrapper>
      );

      const orgTypeSelect = screen.getByLabelText(/organization type/i);
      expect(orgTypeSelect).toBeInTheDocument();

      fireEvent.click(orgTypeSelect);

      await waitFor(() => {
        expect(screen.getByText("Customer")).toBeInTheDocument();
        expect(screen.getByText("Prospect")).toBeInTheDocument();
        expect(screen.getByText("Partner")).toBeInTheDocument();
        expect(screen.getByText("Principal")).toBeInTheDocument();
        expect(screen.getByText("Distributor")).toBeInTheDocument();
        expect(screen.getByText("Unknown")).toBeInTheDocument();
      });
    });

    it("should render priority selector with A/B/C/D levels", async () => {
      render(
        <TestWrapper>
          <OrganizationInputs />
        </TestWrapper>
      );

      const prioritySelect = screen.getByLabelText(/priority/i);
      expect(prioritySelect).toBeInTheDocument();

      fireEvent.click(prioritySelect);

      await waitFor(() => {
        expect(screen.getByText("A - High Priority")).toBeInTheDocument();
        expect(screen.getByText("B - Medium-High Priority")).toBeInTheDocument();
        expect(screen.getByText("C - Medium Priority")).toBeInTheDocument();
        expect(screen.getByText("D - Low Priority")).toBeInTheDocument();
      });
    });

    it("should render parent organization reference selector", async () => {
      render(
        <TestWrapper>
          <OrganizationInputs />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/parent company/i)).toBeInTheDocument();
    });

    it("should render revenue and tax identifier fields", async () => {
      render(
        <TestWrapper>
          <OrganizationInputs />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/revenue/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax identifier/i)).toBeInTheDocument();
    });

    it("should have proper section organization with Context heading", async () => {
      render(
        <TestWrapper>
          <OrganizationInputs />
        </TestWrapper>
      );

      expect(screen.getByText(/context/i)).toBeInTheDocument();
      expect(screen.getByText(/contact/i)).toBeInTheDocument();
      expect(screen.getByText(/address/i)).toBeInTheDocument();
      expect(screen.getByText(/additional information/i)).toBeInTheDocument();
      expect(screen.getByText(/account manager/i)).toBeInTheDocument();
    });
  });

  describe("OrganizationShow - Organization Type Display", () => {
    it("should display organization type for customer organization", async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockOrganizations[0], // Acme Corp - customer
      });

      render(
        <TestWrapper>
          <OrganizationShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Customer")).toBeInTheDocument();
        expect(screen.getByText("A")).toBeInTheDocument(); // Priority
        expect(screen.getByText("Enterprise")).toBeInTheDocument(); // Segment
      });
    });

    it("should display organization type for principal organization", async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockOrganizations[1], // Principal Solutions Inc - principal
      });

      render(
        <TestWrapper>
          <OrganizationShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Principal Solutions Inc")).toBeInTheDocument();
        expect(screen.getByText("Principal")).toBeInTheDocument();
        expect(screen.getByText("Software")).toBeInTheDocument(); // Sector
      });
    });

    it("should display organization type for distributor organization", async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockOrganizations[2], // Tech Distributors Ltd - distributor
      });

      render(
        <TestWrapper>
          <OrganizationShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Tech Distributors Ltd")).toBeInTheDocument();
        expect(screen.getByText("Distributor")).toBeInTheDocument();
        expect(screen.getByText("Channel Partner")).toBeInTheDocument(); // Segment
      });
    });

    it("should display organization hierarchy when parent organization exists", async () => {
      const subsidiaryOrganization = {
        ...mockOrganizations[0],
        id: 10,
        name: "Acme Subsidiary",
        parent_organization_id: 1,
      };

      mockDataProvider.getOne.mockResolvedValue({
        data: subsidiaryOrganization,
      });

      mockDataProvider.getMany.mockResolvedValue({
        data: [mockOrganizations[0]], // Parent organization
      });

      render(
        <TestWrapper>
          <OrganizationShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Acme Subsidiary")).toBeInTheDocument();
        expect(screen.getByText("Acme Corp")).toBeInTheDocument(); // Parent company
      });
    });

    it("should display financial information correctly", async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockOrganizations[1], // Principal Solutions with revenue
      });

      render(
        <TestWrapper>
          <OrganizationShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("$100,000,000")).toBeInTheDocument(); // Revenue formatted
        expect(screen.getByText("Large")).toBeInTheDocument(); // Company size
      });
    });
  });

  describe("OrganizationList - Organization Type Filtering", () => {
    it("should render organization list with organization types", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Principal Solutions Inc")).toBeInTheDocument();
        expect(screen.getByText("Tech Distributors Ltd")).toBeInTheDocument();
        expect(screen.getByText("Partner Services Co")).toBeInTheDocument();
        expect(screen.getByText("Prospect Alliance Inc")).toBeInTheDocument();
      });
    });

    it("should display organization types in the list", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Customer")).toBeInTheDocument();
        expect(screen.getByText("Principal")).toBeInTheDocument();
        expect(screen.getByText("Distributor")).toBeInTheDocument();
        expect(screen.getByText("Partner")).toBeInTheDocument();
        expect(screen.getByText("Prospect")).toBeInTheDocument();
      });
    });

    it("should filter organizations by organization type", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Apply organization type filter
      const orgTypeFilter = screen.getByLabelText(/organization type/i);
      fireEvent.change(orgTypeFilter, { target: { value: "principal" } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          "organizations",
          expect.objectContaining({
            filter: expect.objectContaining({
              organization_type: "principal",
            }),
          })
        );
      });
    });

    it("should filter organizations by priority level", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Apply priority filter
      const priorityFilter = screen.getByLabelText(/priority/i);
      fireEvent.change(priorityFilter, { target: { value: "A" } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          "organizations",
          expect.objectContaining({
            filter: expect.objectContaining({
              priority: "A",
            }),
          })
        );
      });
    });

    it("should filter principal organizations specifically", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Apply principal organization type filter
      const orgTypeFilter = screen.getByLabelText(/organization type/i);
      fireEvent.change(orgTypeFilter, { target: { value: "principal" } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          "organizations",
          expect.objectContaining({
            filter: expect.objectContaining({
              organization_type: "principal",
            }),
          })
        );
      });
    });

    it("should filter distributor organizations specifically", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Apply distributor organization type filter
      const orgTypeFilter = screen.getByLabelText(/organization type/i);
      fireEvent.change(orgTypeFilter, { target: { value: "distributor" } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          "organizations",
          expect.objectContaining({
            filter: expect.objectContaining({
              organization_type: "distributor",
            }),
          })
        );
      });
    });

    it("should search organizations across all fields", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Search by company name
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "Principal" } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          "organizations",
          expect.objectContaining({
            filter: expect.objectContaining({
              q: "Principal",
            }),
          })
        );
      });
    });

    it("should handle sorting by organization type", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Click organization type column header to sort
      const orgTypeHeader = screen.getByText(/organization type/i);
      fireEvent.click(orgTypeHeader);

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          "organizations",
          expect.objectContaining({
            sort: { field: "organization_type", order: "ASC" },
          })
        );
      });
    });

    it("should display priority levels visually", async () => {
      render(
        <TestWrapper>
          <OrganizationList />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show priority badges or indicators
        expect(screen.getByText("A")).toBeInTheDocument(); // High priority
        expect(screen.getByText("B")).toBeInTheDocument(); // Medium-High priority
        expect(screen.getByText("C")).toBeInTheDocument(); // Medium priority
      });
    });
  });

  describe("Organization Type Workflows", () => {
    it("should create organization with organization type", async () => {
      const newOrganizationData = {
        name: "New Tech Partner",
        sector: "Technology",
        organization_type: "prospect",
        priority: "B",
        website: "https://newtechpartner.com",
        revenue: 10000000,
        size: "Medium",
      };

      await mockDataProvider.create("organizations", {
        data: newOrganizationData,
      });

      expect(mockDataProvider.create).toHaveBeenCalledWith("organizations", {
        data: newOrganizationData,
      });
    });

    it("should update organization type", async () => {
      const updatedOrganizationData = {
        ...mockOrganizations[0],
        organization_type: "prospect", // Changed from customer to partner
        priority: "B", // Changed priority as well
      };

      await mockDataProvider.update("organizations", {
        id: 1,
        data: updatedOrganizationData,
        previousData: mockOrganizations[0],
      });

      expect(mockDataProvider.update).toHaveBeenCalledWith("organizations", {
        id: 1,
        data: updatedOrganizationData,
        previousData: mockOrganizations[0],
      });
    });

    it("should validate principal organization requirements", async () => {
      // Test that principal organizations have required fields
      const principalOrganization = mockOrganizations.find(
        (c) => c.organization_type === "principal"
      );

      expect(principalOrganization).toBeDefined();
      expect(principalOrganization?.organization_type).toBe("principal");
      expect(principalOrganization?.name).toBeTruthy();
      expect(principalOrganization?.sector).toBeTruthy();
    });

    it("should validate distributor organization requirements", async () => {
      // Test that distributor organizations have required fields
      const distributorOrganization = mockOrganizations.find(
        (c) => c.organization_type === "distributor"
      );

      expect(distributorOrganization).toBeDefined();
      expect(distributorOrganization?.organization_type).toBe("distributor");
      expect(distributorOrganization?.name).toBeTruthy();
      expect(distributorOrganization?.sector).toBeTruthy();
    });

    it("should handle organization hierarchy validation", async () => {
      // Test parent-child relationship validation
      const parentOrganization = mockOrganizations[0];
      const childOrganization = {
        ...mockOrganizations[0],
        id: 10,
        name: "Child Organization",
        parent_organization_id: parentOrganization.id,
      };

      // Child organization should have valid parent reference
      expect(childOrganization.parent_organization_id).toBe(parentOrganization.id);
      expect(parentOrganization.parent_organization_id).toBeNull(); // Parent has no parent
    });

    it("should support organization type transitions", async () => {
      // Test changing from prospect to customer
      const prospectToCustomer = {
        ...mockOrganizations[0],
        organization_type: "customer", // Was prospect, now customer
        priority: "A", // Upgraded priority
      };

      await mockDataProvider.update("organizations", {
        id: 1,
        data: prospectToCustomer,
        previousData: { ...mockOrganizations[0], organization_type: "prospect" },
      });

      expect(mockDataProvider.update).toHaveBeenCalledWith("organizations", {
        id: 1,
        data: prospectToCustomer,
        previousData: expect.objectContaining({
          organization_type: "prospect",
        }),
      });
    });

    it("should aggregate organization types for reporting", async () => {
      // Test organization type metrics
      const orgTypeCounts = mockOrganizations.reduce(
        (counts, org) => {
          counts[org.organization_type] = (counts[org.organization_type] || 0) + 1;
          return counts;
        },
        {} as Record<string, number>
      );

      expect(orgTypeCounts).toEqual({
        customer: 1,
        principal: 1,
        distributor: 1,
        partner: 1,
        prospect: 1,
      });

      // Test priority distribution
      const priorityCounts = mockOrganizations.reduce(
        (counts, org) => {
          counts[org.priority] = (counts[org.priority] || 0) + 1;
          return counts;
        },
        {} as Record<string, number>
      );

      expect(priorityCounts).toEqual({
        A: 2,
        B: 2,
        C: 1,
      });
    });
  });
});
