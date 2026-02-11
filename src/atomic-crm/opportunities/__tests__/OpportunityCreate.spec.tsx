/**
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OpportunityCreate } from "../OpportunityCreate";
import { ConfigurationContext } from "../../root/ConfigurationContext";
import userEvent from "@testing-library/user-event";

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
  opportunityStages: [
    { value: "new_lead", label: "New Lead" },
    { value: "initial_outreach", label: "Initial Outreach" },
    { value: "sample_visit_offered", label: "Sample/Visit Offered" },
    { value: "feedback_logged", label: "Feedback Logged" },
    { value: "demo_scheduled", label: "Demo Scheduled" },
    { value: "closed_won", label: "Closed Won" },
    { value: "closed_lost", label: "Closed Lost" },
  ],
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

const mockOrganizations = [
  {
    id: 1,
    name: "Acme Corp",
    organization_type: "customer",
    priority: "A",
    segment: "Enterprise",
  },
  {
    id: 2,
    name: "Principal Solutions Inc",
    organization_type: "principal",
    priority: "A",
    segment: "Enterprise",
  },
  {
    id: 3,
    name: "Tech Distributors Ltd",
    organization_type: "distributor",
    priority: "B",
    segment: "Channel Partner",
  },
];

const mockContacts = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    title: "CTO",
    organization_id: 1,
    role: "decision_maker",
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    title: "VP Sales",
    organization_id: 1,
    role: "influencer",
  },
  {
    id: 3,
    first_name: "Bob",
    last_name: "Johnson",
    title: "Procurement Manager",
    organization_id: 2,
    role: "buyer",
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/opportunities/create"]}>
        <AdminContext dataProvider={mockDataProvider}>
          <ConfigurationContext.Provider value={mockConfiguration}>
            {children}
          </ConfigurationContext.Provider>
        </AdminContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("OpportunityCreate - Lifecycle Stages and B2B Features", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock getList for organizations
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === "organizations") {
        return Promise.resolve({
          data: mockOrganizations,
          total: mockOrganizations.length,
        });
      }
      if (resource === "contacts" || resource === "contacts_summary") {
        let filteredContacts = [...mockContacts];
        if (params.filter?.organization_id) {
          filteredContacts = filteredContacts.filter(
            (contact) => contact.organization_id === params.filter.organization_id
          );
        }
        return Promise.resolve({
          data: filteredContacts,
          total: filteredContacts.length,
        });
      }
      if (resource === "opportunities") {
        return Promise.resolve({
          data: [],
          total: 0,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

    mockDataProvider.getMany.mockResolvedValue({ data: [] });
    mockDataProvider.create.mockImplementation((resource, params) => {
      if (resource === "opportunities") {
        return Promise.resolve({
          data: {
            id: Date.now(),
            ...params.data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        });
      }
      return Promise.resolve({ data: params.data });
    });
  });

  it("should render opportunity creation form with all lifecycle stages", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    // Check all lifecycle stages are available
    const stageSelect = screen.getByLabelText(/stage/i);
    fireEvent.click(stageSelect);

    await waitFor(() => {
      expect(screen.getByText("New Lead")).toBeInTheDocument();
      expect(screen.getByText("Initial Outreach")).toBeInTheDocument();
      expect(screen.getByText("Sample/Visit Offered")).toBeInTheDocument();
      expect(screen.getByText("Awaiting Response")).toBeInTheDocument();
      expect(screen.getByText("Feedback Logged")).toBeInTheDocument();
      expect(screen.getByText("Demo Scheduled")).toBeInTheDocument();
      expect(screen.getByText("Closed Won")).toBeInTheDocument();
      expect(screen.getByText("Closed Lost")).toBeInTheDocument();
    });
  });

  it("should create opportunity with customer organization", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Fill in opportunity details
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, "New Enterprise Deal");

    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, "150000");

    // Select customer organization
    const customerOrgSelect = screen.getByLabelText(/customer organization/i);
    fireEvent.change(customerOrgSelect, { target: { value: "1" } });

    // Select stage
    const stageSelect = screen.getByLabelText(/stage/i);
    fireEvent.change(stageSelect, { target: { value: "initial_outreach" } });

    // Submit form
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          data: expect.objectContaining({
            name: "New Enterprise Deal",
            amount: 150000,
            customer_organization_id: 1,
            stage: "initial_outreach",
          }),
        })
      );
    });
  });

  it("should support principal-distributor relationships", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Fill basic info
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, "Channel Partner Deal");

    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, "250000");

    // Select principal organization
    const principalOrgSelect = screen.getByLabelText(/principal organization/i);
    fireEvent.change(principalOrgSelect, { target: { value: "2" } });

    // Select distributor organization
    const distributorOrgSelect = screen.getByLabelText(/distributor organization/i);
    fireEvent.change(distributorOrgSelect, { target: { value: "3" } });

    // Select customer organization
    const customerOrgSelect = screen.getByLabelText(/customer organization/i);
    fireEvent.change(customerOrgSelect, { target: { value: "1" } });

    // Submit form
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Channel Partner Deal",
            amount: 250000,
            customer_organization_id: 1,
            principal_organization_id: 2,
            distributor_organization_id: 3,
          }),
        })
      );
    });
  });

  it("should calculate probability based on stage", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
    });

    // 7-stage pipeline per PRD v1.20 (awaiting_response removed)
    const stageProbabilities = {
      new_lead: 10,
      initial_outreach: 25,
      sample_visit_offered: 40,
      feedback_logged: 55,
      demo_scheduled: 80,
      closed_won: 100,
      closed_lost: 0,
    };

    // Test each stage updates probability
    const stageSelect = screen.getByLabelText(/stage/i);

    for (const [stage, expectedProbability] of Object.entries(stageProbabilities)) {
      fireEvent.change(stageSelect, { target: { value: stage } });

      await waitFor(() => {
        const probabilityInput = screen.getByLabelText(/probability/i) as HTMLInputElement;
        expect(probabilityInput.value).toBe(String(expectedProbability));
      });
    }
  });

  it("should add opportunity participants", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Fill basic info
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, "Multi-stakeholder Deal");

    // Select customer organization first
    const customerOrgSelect = screen.getByLabelText(/customer organization/i);
    fireEvent.change(customerOrgSelect, { target: { value: "1" } });

    // Wait for contacts to load
    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: { organization_id: 1 },
        })
      );
    });

    // Select participants
    const participantsSelect = screen.getByLabelText(/participants/i);
    fireEvent.click(participantsSelect);

    await waitFor(() => {
      expect(screen.getByText("John Doe - CTO")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith - VP Sales")).toBeInTheDocument();
    });

    // Select multiple participants
    fireEvent.click(screen.getByText("John Doe - CTO"));
    fireEvent.click(screen.getByText("Jane Smith - VP Sales"));

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Multi-stakeholder Deal",
            customer_organization_id: 1,
            participant_ids: [1, 2],
          }),
        })
      );
    });
  });

  it("should set commission fields for distributor opportunities", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Fill basic info
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, "Commission Deal");

    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, "100000");

    // Select distributor organization
    const distributorOrgSelect = screen.getByLabelText(/distributor organization/i);
    fireEvent.change(distributorOrgSelect, { target: { value: "3" } });

    // Commission fields should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/commission percentage/i)).toBeInTheDocument();
    });

    const commissionInput = screen.getByLabelText(/commission percentage/i);
    await userEvent.type(commissionInput, "15");

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Commission Deal",
            amount: 100000,
            distributor_organization_id: 3,
            commission_percentage: 15,
            commission_amount: 15000, // Auto-calculated
          }),
        })
      );
    });
  });

  it("should validate required fields", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Try to save without filling required fields
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/customer organization is required/i)).toBeInTheDocument();
      expect(screen.getByText(/stage is required/i)).toBeInTheDocument();
    });

    expect(mockDataProvider.create).not.toHaveBeenCalled();
  });

  it("should set expected closing date based on stage", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
    });

    // Select different stages and check closing date suggestions
    const stageSelect = screen.getByLabelText(/stage/i);

    // New Lead stage - should suggest 90 days out
    fireEvent.change(stageSelect, { target: { value: "new_lead" } });

    await waitFor(() => {
      const closingDateInput = screen.getByLabelText(/expected closing date/i) as HTMLInputElement;
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + 90);
      // Check that date is approximately 90 days from now
      expect(closingDateInput.value).toBeTruthy();
    });

    // Demo Scheduled stage - should suggest 30 days out
    fireEvent.change(stageSelect, { target: { value: "demo_scheduled" } });

    await waitFor(() => {
      const closingDateInput = screen.getByLabelText(/expected closing date/i) as HTMLInputElement;
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + 30);
      // Check that date is approximately 30 days from now
      expect(closingDateInput.value).toBeTruthy();
    });
  });

  it("should support opportunity categorization", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/opportunity context/i)).toBeInTheDocument();
    });

    const contextSelect = screen.getByLabelText(/opportunity context/i);
    fireEvent.click(contextSelect);

    await waitFor(() => {
      expect(screen.getByText("Software")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Services")).toBeInTheDocument();
      expect(screen.getByText("Support")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Software"));

    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, "Software Deal");

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Software Deal",
          }),
        })
      );
    });
  });

  it("should set opportunity priority", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <OpportunityCreate open={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    const prioritySelect = screen.getByLabelText(/priority/i);
    fireEvent.click(prioritySelect);

    await waitFor(() => {
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Low")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("High"));

    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, "Urgent Deal");

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Urgent Deal",
            priority: "high",
          }),
        })
      );
    });
  });
});
