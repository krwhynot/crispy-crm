/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContactList } from "./ContactList";
import { ConfigurationContext } from "../root/ConfigurationContext";

// Mock contacts with single organization relationship (per PRD - one contact = one org)
const mockContacts = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    title: "CTO",
    email: [{ value: "john.doe@acme.com", type: "work" }],
    phone: [{ value: "+1-555-0123", type: "work" }],
    organization_id: 1, // Single org relationship
    role: "decision_maker",
    purchase_influence: "High",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    title: "VP Engineering",
    email: [{ value: "jane.smith@techcorp.com", type: "work" }],
    phone: [{ value: "+1-555-0124", type: "work" }],
    organization_id: 2, // Single org relationship
    role: "influencer",
    purchase_influence: "Medium",
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: 3,
    first_name: "Bob",
    last_name: "Johnson",
    title: "Procurement Manager",
    email: [{ value: "bob.johnson@global.com", type: "work" }],
    phone: [{ value: "+1-555-0125", type: "work" }],
    organization_id: 3, // Single org relationship
    role: "buyer",
    purchase_influence: "High",
    created_at: "2024-02-01T10:00:00Z",
  },
];

const mockOrganizations = [
  { id: 1, name: "Acme Corp", sector: "Technology" },
  { id: 2, name: "TechCorp Inc", sector: "Software" },
  { id: 3, name: "Global Systems Ltd", sector: "Consulting" },
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
    { id: "end_user", name: "End User" },
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

describe("ContactList - Single Organization Model (Unified Provider)", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock getList for contacts - simplified single-org model
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === "contacts_summary") {
        let filteredContacts = [...mockContacts];

        // Apply filters
        if (params.filter) {
          if (params.filter.organization_id) {
            // Direct organization_id match (single-org model)
            filteredContacts = filteredContacts.filter(
              (contact) => contact.organization_id === params.filter.organization_id
            );
          }

          if (params.filter.role) {
            filteredContacts = filteredContacts.filter(
              (contact) => contact.role === params.filter.role
            );
          }

          if (params.filter.purchase_influence) {
            filteredContacts = filteredContacts.filter(
              (contact) => contact.purchase_influence === params.filter.purchase_influence
            );
          }

          if (params.filter.q) {
            const query = params.filter.q.toLowerCase();
            // Get org name for search matching
            const getOrgName = (orgId: number) =>
              mockOrganizations.find((org) => org.id === orgId)?.name || "";

            filteredContacts = filteredContacts.filter(
              (contact) =>
                contact.first_name.toLowerCase().includes(query) ||
                contact.last_name.toLowerCase().includes(query) ||
                contact.title?.toLowerCase().includes(query) ||
                getOrgName(contact.organization_id).toLowerCase().includes(query)
            );
          }
        }

        return Promise.resolve({
          data: filteredContacts,
          total: filteredContacts.length,
        });
      }

      if (resource === "organizations") {
        return Promise.resolve({
          data: mockOrganizations,
          total: mockOrganizations.length,
        });
      }

      return Promise.resolve({ data: [], total: 0 });
    });

    mockDataProvider.getMany.mockImplementation((resource, params) => {
      if (resource === "organizations") {
        return Promise.resolve({
          data: mockOrganizations.filter((org) => params.ids.includes(org.id)),
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("should render contact list with organization data", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });
  });

  it("should display organization for each contact", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
      expect(screen.getByText("Global Systems Ltd")).toBeInTheDocument();
    });
  });

  it("should display contact roles and influence levels", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Decision Maker")).toBeInTheDocument();
      expect(screen.getByText("Influencer")).toBeInTheDocument();
      expect(screen.getByText("Buyer")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });
  });

  it("should display contact titles and email addresses", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("CTO")).toBeInTheDocument();
      expect(screen.getByText("VP Engineering")).toBeInTheDocument();
      expect(screen.getByText("Procurement Manager")).toBeInTheDocument();
      expect(screen.getByText("john.doe@acme.com")).toBeInTheDocument();
      expect(screen.getByText("jane.smith@techcorp.com")).toBeInTheDocument();
    });
  });

  it("should filter contacts by organization", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Apply organization filter
    const orgFilter = screen.getByLabelText(/organization/i);
    fireEvent.change(orgFilter, { target: { value: "1" } }); // Acme Corp

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            organization_id: 1,
          }),
        })
      );
    });
  });

  it("should filter contacts by role", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Apply role filter
    const roleFilter = screen.getByLabelText(/role/i);
    fireEvent.change(roleFilter, { target: { value: "decision_maker" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            role: "decision_maker",
          }),
        })
      );
    });
  });

  it("should filter contacts by purchase influence", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Apply purchase influence filter
    const influenceFilter = screen.getByLabelText(/purchase influence/i);
    fireEvent.change(influenceFilter, { target: { value: "High" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            purchase_influence: "High",
          }),
        })
      );
    });
  });

  it("should search contacts by name", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Search by contact name
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "John" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            q: "John",
          }),
        })
      );
    });
  });

  it("should search contacts by organization name", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Search by organization name
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Acme" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            q: "Acme",
          }),
        })
      );
    });
  });

  it("should handle sorting by name", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Click name column header to sort
    const nameHeader = screen.getByText(/name/i);
    fireEvent.click(nameHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          sort: { field: "last_name", order: "ASC" },
        })
      );
    });
  });

  it("should handle sorting by organization", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Click organization column header to sort
    const orgHeader = screen.getByText(/organization/i);
    fireEvent.click(orgHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          sort: { field: "primary_organization_name", order: "ASC" },
        })
      );
    });
  });

  it("should handle pagination with organization data", async () => {
    const manyContacts = Array.from({ length: 50 }, (_, i) => ({
      ...mockContacts[0],
      id: i + 1,
      first_name: `Contact${i + 1}`,
      last_name: "Test",
      organization_id: (i % 3) + 1, // Cycle through org IDs 1, 2, 3
    }));

    mockDataProvider.getList.mockResolvedValue({
      data: manyContacts.slice(0, 25),
      total: 50,
    });

    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Contact1 Test")).toBeInTheDocument();
    });

    // Check pagination controls exist
    expect(screen.getByText(/1-25 of 50/i)).toBeInTheDocument();
  });

  it("should support combined filters (organization + role)", async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Apply both organization and role filters
    const orgFilter = screen.getByLabelText(/organization/i);
    fireEvent.change(orgFilter, { target: { value: "1" } });

    const roleFilter = screen.getByLabelText(/role/i);
    fireEvent.change(roleFilter, { target: { value: "decision_maker" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            organization_id: 1,
            role: "decision_maker",
          }),
        })
      );
    });
  });

  it("should handle empty organization filter gracefully", async () => {
    // Test contact filtering when no organization filter is applied
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === "contacts_summary" && !params.filter?.organization_id) {
        return Promise.resolve({
          data: mockContacts,
          total: mockContacts.length,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });
  });
});
