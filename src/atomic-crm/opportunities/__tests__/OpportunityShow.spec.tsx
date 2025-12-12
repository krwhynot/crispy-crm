/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OpportunityShow } from "../OpportunityShow";
import { ConfigurationContext } from "../../root/ConfigurationContext";

// Mock opportunity data with participants
const mockOpportunity = {
  id: 1,
  name: "Enterprise Software Deal",
  description: "Large-scale enterprise software implementation for client transformation",
  stage: "initial_outreach",
  priority: "high",
  amount: 50000,
  probability: 75,
  expected_closing_date: "2024-03-15",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-02-01T15:30:00Z",
  customer_organization_id: 1,
  principal_organization_id: 2,
  distributor_organization_id: 3,
  contact_ids: [1, 2],
  opportunity_owner_id: 1,
};

const mockOpportunityParticipants = [
  {
    id: 1,
    opportunity_id: 1,
    contact_id: 1,
    role: "decision_maker",
    influence_level: "high",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    opportunity_id: 1,
    contact_id: 2,
    role: "influencer",
    influence_level: "medium",
    created_at: "2024-01-15T10:00:00Z",
  },
];

const mockCompanies = [
  { id: 1, name: "Acme Corp", sector: "Technology" },
  { id: 2, name: "Principal Solutions Inc", sector: "Software" },
  { id: 3, name: "Tech Distributors Ltd", sector: "Distribution" },
];

const mockContacts = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    title: "CTO",
    email: [{ value: "john.doe@acme.com", type: "work" }],
    phone: [{ value: "+1-555-0123", type: "work" }],
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    title: "VP Engineering",
    email: [{ value: "jane.smith@acme.com", type: "work" }],
    phone: [{ value: "+1-555-0124", type: "work" }],
  },
];

const mockSales = [
  {
    id: 1,
    first_name: "Alice",
    last_name: "Johnson",
    email: "alice.johnson@company.com",
  },
];

const mockActivities = [
  {
    id: 1,
    opportunity_id: 1,
    type: "call",
    subject: "Discovery call with technical team",
    description: "Discussed technical requirements and integration needs",
    date: "2024-01-20T14:00:00Z",
    opportunity_owner_id: 1,
  },
  {
    id: 2,
    opportunity_id: 1,
    type: "email",
    subject: "Follow-up on proposal requirements",
    description: "Sent detailed technical specifications document",
    date: "2024-01-25T10:30:00Z",
    opportunity_owner_id: 1,
  },
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
  // Custom service methods
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
  companySectors: ["Technology", "Healthcare", "Finance"],
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
      <MemoryRouter initialEntries={["/opportunities/1/show"]}>
        <AdminContext dataProvider={mockDataProvider}>
          <ConfigurationContext.Provider value={mockConfiguration}>
            {children}
          </ConfigurationContext.Provider>
        </AdminContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("OpportunityShow - Unified Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getOne for opportunity
    mockDataProvider.getOne.mockImplementation((resource, params) => {
      if (resource === "opportunities" && params.id === 1) {
        return Promise.resolve({ data: mockOpportunity });
      }
      return Promise.reject(new Error("Not found"));
    });

    // Mock getList for related data
    mockDataProvider.getList.mockImplementation((resource) => {
      if (resource === "opportunity_participants") {
        return Promise.resolve({
          data: mockOpportunityParticipants,
          total: mockOpportunityParticipants.length,
        });
      }
      if (resource === "activities") {
        return Promise.resolve({
          data: mockActivities,
          total: mockActivities.length,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

    // Mock getMany for references
    mockDataProvider.getMany.mockImplementation((resource, params) => {
      if (resource === "organizations") {
        return Promise.resolve({
          data: mockCompanies.filter((c) => params.ids.includes(c.id)),
        });
      }
      if (resource === "contacts_summary") {
        return Promise.resolve({
          data: mockContacts.filter((c) => params.ids.includes(c.id)),
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

  it("should render opportunity details", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
      expect(
        screen.getByText("Large-scale enterprise software implementation for client transformation")
      ).toBeInTheDocument();
    });
  });

  it("should display opportunity stage and priority", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Qualified")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
    });
  });

  it("should display financial information", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("$50,000")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  it("should display expected closing date", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("2024-03-15")).toBeInTheDocument();
    });
  });

  it("should display linked organizations", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("Principal Solutions Inc")).toBeInTheDocument();
      expect(screen.getByText("Tech Distributors Ltd")).toBeInTheDocument();
    });
  });

  it("should display opportunity participants with roles", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Decision Maker")).toBeInTheDocument();
      expect(screen.getByText("Influencer")).toBeInTheDocument();
    });
  });

  it("should display participant influence levels", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });
  });

  it("should display contact information for participants", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("CTO")).toBeInTheDocument();
      expect(screen.getByText("VP Engineering")).toBeInTheDocument();
      expect(screen.getByText("john.doe@acme.com")).toBeInTheDocument();
      expect(screen.getByText("jane.smith@acme.com")).toBeInTheDocument();
    });
  });

  it("should display activity tracking", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Discovery call with technical team")).toBeInTheDocument();
      expect(screen.getByText("Follow-up on proposal requirements")).toBeInTheDocument();
    });
  });

  it("should display activity types and dates", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Call")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("2024-01-20")).toBeInTheDocument();
      expect(screen.getByText("2024-01-25")).toBeInTheDocument();
    });
  });

  it("should display account manager information", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });
  });

  it("should handle opportunity without participants gracefully", async () => {
    mockDataProvider.getList.mockImplementation((resource) => {
      if (resource === "opportunity_participants") {
        return Promise.resolve({ data: [], total: 0 });
      }
      if (resource === "activities") {
        return Promise.resolve({ data: [], total: 0 });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
      // Should still render the main opportunity information
      expect(screen.getByText("$50,000")).toBeInTheDocument();
    });
  });

  it("should display opportunity lifecycle progression", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check that stage progression is visible
      expect(screen.getByText("Qualified")).toBeInTheDocument();
      // The component should show the current stage and allow viewing the progression
    });
  });

  it("should aggregate activity information correctly", async () => {
    render(
      <TestWrapper>
        <OpportunityShow />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show activity count and recent activities
      expect(screen.getByText("Discovery call with technical team")).toBeInTheDocument();
      expect(screen.getByText("Follow-up on proposal requirements")).toBeInTheDocument();

      // Should show activity descriptions
      expect(
        screen.getByText("Discussed technical requirements and integration needs")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Sent detailed technical specifications document")
      ).toBeInTheDocument();
    });
  });
});
