/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationList } from "./OrganizationList";
import { ConfigurationContext } from "../root/ConfigurationContext";

// Mock organizations data with enhanced organization features
const mockOrganizations = [
  {
    id: 1,
    name: "Acme Corp",
    sector: "Technology",
    organization_type: "customer",
    priority: "A",
    size: "Large",
    revenue: 50000000,
    website: "https://acme.com",
    phone: "+1-555-0100",
    address: "123 Tech Street",
    city: "San Francisco",
    state: "CA",
    created_at: "2024-01-15T10:00:00Z",
    sales_id: 1,
  },
  {
    id: 2,
    name: "Principal Solutions Inc",
    sector: "Software",
    organization_type: "principal",
    priority: "A",
    size: "Large",
    revenue: 100000000,
    website: "https://principal-solutions.com",
    phone: "+1-555-0200",
    address: "456 Principal Ave",
    city: "Austin",
    state: "TX",
    created_at: "2024-01-10T10:00:00Z",
    sales_id: 1,
  },
  {
    id: 3,
    name: "Tech Distributors Ltd",
    sector: "Distribution",
    organization_type: "distributor",
    priority: "B",
    size: "Medium",
    revenue: 25000000,
    website: "https://techdist.com",
    phone: "+1-555-0300",
    address: "789 Distribution Way",
    city: "Chicago",
    state: "IL",
    created_at: "2024-01-20T10:00:00Z",
    sales_id: 2,
  },
  {
    id: 4,
    sales_id: 2,
  },
];

const mockSales = [
  { id: 1, first_name: "Alice", last_name: "Johnson" },
  { id: 2, first_name: "Bob", last_name: "Smith" },
];

// Mock the unified data provider with service methods
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
  // Custom service methods for unified provider
  salesCreate: vi.fn(),
  salesUpdate: vi.fn(),
  updatePassword: vi.fn(),
  unarchiveOpportunity: vi.fn(),
  getActivityLog: vi.fn(),
  getContactOrganizations: vi.fn(),
  addContactToOrganization: vi.fn(),
  removeContactFromOrganization: vi.fn(),
  setPrimaryOrganization: vi.fn(),
  getOpportunityParticipants: vi.fn(),
  addOpportunityParticipant: vi.fn(),
  removeOpportunityParticipant: vi.fn(),
  getOpportunityContacts: vi.fn(),
  addOpportunityContact: vi.fn(),
  removeOpportunityContact: vi.fn(),
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

describe("OrganizationList - Enhanced Organization Features (Unified Provider)", () => {
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
              (organization) => organization.organization_type === params.filter.organization_type
            );
          }

          if (params.filter.priority) {
            filteredOrganizations = filteredOrganizations.filter(
              (organization) => organization.priority === params.filter.priority
            );
          }

          if (params.filter.sector) {
            filteredOrganizations = filteredOrganizations.filter(
              (organization) => organization.sector === params.filter.sector
            );
          }

          if (params.filter.size) {
            filteredOrganizations = filteredOrganizations.filter(
              (organization) => organization.size === params.filter.size
            );
          }

          if (params.filter.q) {
            const query = params.filter.q.toLowerCase();
            filteredOrganizations = filteredOrganizations.filter(
              (organization) =>
                organization.name.toLowerCase().includes(query) ||
                organization.sector?.toLowerCase().includes(query) ||
                organization.city?.toLowerCase().includes(query)
            );
          }
        }

        // Apply sorting
        if (params.sort) {
          filteredOrganizations.sort((a, b) => {
            const aValue = a[params.sort.field as keyof typeof a];
            const bValue = b[params.sort.field as keyof typeof b];

            if (typeof aValue === "string" && typeof bValue === "string") {
              return params.sort.order === "ASC"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
              return params.sort.order === "ASC" ? aValue - bValue : bValue - aValue;
            }

            return 0;
          });
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
  });

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
      expect(screen.getByText("Prospect Tech Inc")).toBeInTheDocument();
    });
  });

  it("should display organization types correctly", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Customer")).toBeInTheDocument();
      expect(screen.getByText("Principal")).toBeInTheDocument();
      expect(screen.getByText("Distributor")).toBeInTheDocument();

      expect(screen.getByText("Prospect")).toBeInTheDocument();
    });
  });

  it("should display priority levels with visual indicators", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("A")).toBeInTheDocument(); // High priority
      expect(screen.getByText("B")).toBeInTheDocument(); // Medium-High priority
      expect(screen.getByText("C")).toBeInTheDocument(); // Medium priority
    });
  });

  it("should display organization sizes", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Large")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Small")).toBeInTheDocument();
    });
  });

  it("should display revenue information", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("$50,000,000")).toBeInTheDocument();
      expect(screen.getByText("$100,000,000")).toBeInTheDocument();
      expect(screen.getByText("$25,000,000")).toBeInTheDocument();
      expect(screen.getByText("$5,000,000")).toBeInTheDocument();
      expect(screen.getByText("$15,000,000")).toBeInTheDocument();
    });
  });

  it("should filter by organization type", async () => {
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

  it("should filter by priority level", async () => {
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

  it("should filter by sector", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Apply sector filter
    const sectorFilter = screen.getByLabelText(/sector/i);
    fireEvent.change(sectorFilter, { target: { value: "Technology" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          filter: expect.objectContaining({
            sector: "Technology",
          }),
        })
      );
    });
  });

  it("should filter by organization size", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Apply size filter
    const sizeFilter = screen.getByLabelText(/size/i);
    fireEvent.change(sizeFilter, { target: { value: "Large" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          filter: expect.objectContaining({
            size: "Large",
          }),
        })
      );
    });
  });

  it("should filter principal organizations", async () => {
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

  it("should filter distributor organizations", async () => {
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

  it("should perform full-text search across multiple fields", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Search by organization name
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

  it("should search by city/location", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Search by city
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "San Francisco" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          filter: expect.objectContaining({
            q: "San Francisco",
          }),
        })
      );
    });
  });

  it("should sort by organization type", async () => {
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

  it("should sort by priority level", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Click priority column header to sort
    const priorityHeader = screen.getByText(/priority/i);
    fireEvent.click(priorityHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          sort: { field: "priority", order: "ASC" },
        })
      );
    });
  });

  it("should sort by revenue", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Click revenue column header to sort
    const revenueHeader = screen.getByText(/revenue/i);
    fireEvent.click(revenueHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          sort: { field: "revenue", order: "DESC" },
        })
      );
    });
  });

  it("should display account managers correctly", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    });
  });

  it("should handle pagination with large datasets", async () => {
    const manyCompanies = Array.from({ length: 50 }, (_, i) => ({
      ...mockCompanies[0],
      id: i + 1,
      name: `Company ${i + 1}`,
      organization_type: i % 2 === 0 ? "customer" : "prospect",
    }));

    mockDataProvider.getList.mockResolvedValue({
      data: manyCompanies.slice(0, 25),
      total: 50,
    });

    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Company 1")).toBeInTheDocument();
    });

    // Check pagination controls exist
    expect(screen.getByText(/1-25 of 50/i)).toBeInTheDocument();
  });

  it("should support combined filters", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Apply multiple filters
    const orgTypeFilter = screen.getByLabelText(/organization type/i);
    fireEvent.change(orgTypeFilter, { target: { value: "customer" } });

    const priorityFilter = screen.getByLabelText(/priority/i);
    fireEvent.change(priorityFilter, { target: { value: "A" } });

    const sectorFilter = screen.getByLabelText(/sector/i);
    fireEvent.change(sectorFilter, { target: { value: "Technology" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          filter: expect.objectContaining({
            organization_type: "customer",
            priority: "A",
            sector: "Technology",
          }),
        })
      );
    });
  });

  it("should display special indicators for principal and distributor organizations", async () => {
    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show special badges or indicators
      const principalRow = screen.getByText("Principal Solutions Inc").closest("tr");
      expect(principalRow).toBeInTheDocument();

      const distributorRow = screen.getByText("Tech Distributors Ltd").closest("tr");
      expect(distributorRow).toBeInTheDocument();

      // These organizations should have special visual indicators
      expect(screen.getByText("Principal")).toBeInTheDocument();
      expect(screen.getByText("Distributor")).toBeInTheDocument();
    });
  });

  it("should handle empty results gracefully", async () => {
    mockDataProvider.getList.mockResolvedValue({
      data: [],
      total: 0,
    });

    render(
      <TestWrapper>
        <OrganizationList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no organizations found/i)).toBeInTheDocument();
    });
  });
});
