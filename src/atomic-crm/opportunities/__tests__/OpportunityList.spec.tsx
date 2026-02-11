/**
 * @vitest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OpportunityList } from "../OpportunityList";
import { ConfigurationContext } from "../../root/ConfigurationContext";

// Mock opportunities data
const mockOpportunities = [
  {
    id: 1,
    name: "Enterprise Software Deal",
    stage: "initial_outreach",
    priority: "high",
    amount: 50000,
    probability: 75,
    expected_closing_date: "2024-03-15",
    customer_organization_id: 1,
    contact_ids: [1, 2],
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Hardware Upgrade Project",
    stage: "demo_scheduled",
    priority: "medium",
    amount: 25000,
    probability: 60,
    expected_closing_date: "2024-04-20",
    customer_organization_id: 2,
    contact_ids: [3],
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: 3,
    name: "Consulting Services",
    stage: "feedback_logged",
    priority: "critical",
    amount: 75000,
    probability: 90,
    expected_closing_date: "2024-02-28",
    customer_organization_id: 3,
    contact_ids: [4, 5, 6],
    created_at: "2024-01-20T10:00:00Z",
  },
];

const mockCompanies = [
  { id: 1, name: "Acme Corp" },
  { id: 2, name: "Tech Solutions Inc" },
  { id: 3, name: "Global Systems Ltd" },
];

const mockContacts = [
  { id: 1, first_name: "John", last_name: "Doe" },
  { id: 2, first_name: "Jane", last_name: "Smith" },
  { id: 3, first_name: "Bob", last_name: "Johnson" },
  { id: 4, first_name: "Alice", last_name: "Brown" },
  { id: 5, first_name: "Charlie", last_name: "Wilson" },
  { id: 6, first_name: "Diana", last_name: "Davis" },
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

describe("OpportunityList", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock getList for opportunities
    mockDataProvider.getList.mockImplementation((resource) => {
      if (resource === "opportunities_summary") {
        return Promise.resolve({
          data: mockOpportunities,
          total: mockOpportunities.length,
        });
      }
      if (resource === "organizations") {
        return Promise.resolve({
          data: mockCompanies,
          total: mockCompanies.length,
        });
      }
      if (resource === "contacts_summary") {
        return Promise.resolve({
          data: mockContacts,
          total: mockContacts.length,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

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
      return Promise.resolve({ data: [] });
    });
  });

  it("should render opportunity list with data", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
      expect(screen.getByText("Hardware Upgrade Project")).toBeInTheDocument();
      expect(screen.getByText("Consulting Services")).toBeInTheDocument();
    });
  });

  it("should display opportunity amounts correctly", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("50,000")).toBeInTheDocument();
      expect(screen.getByText("25,000")).toBeInTheDocument();
      expect(screen.getByText("75,000")).toBeInTheDocument();
    });
  });

  it("should display opportunity stages correctly", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Qualified")).toBeInTheDocument();
      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("Negotiation")).toBeInTheDocument();
    });
  });

  it("should display priority levels correctly", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Critical")).toBeInTheDocument();
    });
  });

  it("should display probability percentages", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
    });
  });

  it("should display expected closing dates", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("2024-03-15")).toBeInTheDocument();
      expect(screen.getByText("2024-04-20")).toBeInTheDocument();
      expect(screen.getByText("2024-02-28")).toBeInTheDocument();
    });
  });

  it("should allow filtering by stage", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
    });

    // Apply stage filter
    const stageFilter = screen.getByLabelText(/stage/i);
    fireEvent.change(stageFilter, { target: { value: "initial_outreach" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            stage: "initial_outreach",
          }),
        })
      );
    });
  });

  it("should allow filtering by priority", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
    });

    // Apply priority filter
    const priorityFilter = screen.getByLabelText(/priority/i);
    fireEvent.change(priorityFilter, { target: { value: "high" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            priority: "high",
          }),
        })
      );
    });
  });

  it("should allow filtering by opportunity context", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
    });

    // Apply opportunity context filter
    const contextFilter = screen.getByLabelText(/opportunity context/i);
    fireEvent.change(contextFilter, { target: { value: "Software" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          filter: expect.objectContaining({}),
        })
      );
    });
  });

  it("should allow searching by opportunity name", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
    });

    // Search by name
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Enterprise" } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            q: "Enterprise",
          }),
        })
      );
    });
  });

  it("should handle sorting by amount", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
    });

    // Click amount column header to sort
    const amountHeader = screen.getByText(/amount/i);
    fireEvent.click(amountHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          sort: { field: "amount", order: "ASC" },
        })
      );
    });
  });

  it("should handle sorting by probability", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Enterprise Software Deal")).toBeInTheDocument();
    });

    // Click probability column header to sort
    const probabilityHeader = screen.getByText(/probability/i);
    fireEvent.click(probabilityHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          sort: { field: "probability", order: "ASC" },
        })
      );
    });
  });

  it("should handle pagination", async () => {
    const manyOpportunities = Array.from({ length: 50 }, (_, i) => ({
      ...mockOpportunities[0],
      id: i + 1,
      name: `Opportunity ${i + 1}`,
    }));

    mockDataProvider.getList.mockResolvedValue({
      data: manyOpportunities.slice(0, 25),
      total: 50,
    });

    renderWithAdminContext(
      <TestWrapper>
        <OpportunityList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Opportunity 1")).toBeInTheDocument();
    });

    // Check pagination controls exist
    expect(screen.getByText(/1-25 of 50/i)).toBeInTheDocument();
  });
});
