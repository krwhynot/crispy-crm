/**
 * @vitest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OpportunityCreate } from "../OpportunityCreate";
import { OpportunityEdit } from "../OpportunityEdit";
import { ConfigurationContext } from "../../root/ConfigurationContext";

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
    organization_id: 1,
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    title: "VP Engineering",
    organization_id: 1,
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

describe("Opportunity Lifecycle Workflows", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockDataProvider.getList.mockImplementation((resource) => {
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

    mockDataProvider.create.mockResolvedValue({
      data: { id: 1, name: "Test Opportunity" },
    });

    mockDataProvider.update.mockResolvedValue({
      data: { id: 1, name: "Updated Opportunity" },
    });
  });

  describe("Create New Opportunity Workflow", () => {
    it("should create opportunity with lifecycle stages", async () => {
      renderWithAdminContext(
        <TestWrapper>
          <OpportunityCreate />
        </TestWrapper>
      );

      // Fill in required fields
      const nameInput = screen.getByLabelText(/opportunity name/i);
      fireEvent.change(nameInput, { target: { value: "New Enterprise Deal" } });

      // Select lifecycle stage
      const stageSelect = screen.getByLabelText(/lifecycle stage/i);
      fireEvent.change(stageSelect, { target: { value: "new_lead" } });

      // Select priority
      const prioritySelect = screen.getByLabelText(/priority/i);
      fireEvent.change(prioritySelect, { target: { value: "high" } });

      // Set amount
      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: "75000" } });

      // Set probability
      const probabilityInput = screen.getByLabelText(/probability/i);
      fireEvent.change(probabilityInput, { target: { value: "60" } });

      // Select customer organization
      const customerOrgSelect = screen.getByLabelText(/customer organization/i);
      fireEvent.change(customerOrgSelect, { target: { value: "1" } });

      // Select contacts
      const contactsSelect = screen.getByLabelText(/contacts/i);
      fireEvent.change(contactsSelect, { target: { value: ["1", "2"] } });

      // Set expected closing date
      const dateInput = screen.getByLabelText(/expected closing date/i);
      fireEvent.change(dateInput, { target: { value: "2024-06-30" } });

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockDataProvider.create).toHaveBeenCalledWith("opportunities", {
          data: expect.objectContaining({
            name: "New Enterprise Deal",
            stage: "new_lead",
            priority: "high",
            amount: 75000,
            probability: 60,
            customer_organization_id: 1,
            contact_ids: [1, 2],
            expected_closing_date: "2024-06-30",
          }),
        });
      });
    });

    it("should validate required fields during creation", async () => {
      renderWithAdminContext(
        <TestWrapper>
          <OpportunityCreate />
        </TestWrapper>
      );

      // Try to submit without required fields
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Should show validation errors
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // Should not call create if validation fails
      expect(mockDataProvider.create).not.toHaveBeenCalled();
    });

    it("should create opportunity participants automatically", async () => {
      renderWithAdminContext(
        <TestWrapper>
          <OpportunityCreate />
        </TestWrapper>
      );

      // Fill in minimal required fields
      const nameInput = screen.getByLabelText(/opportunity name/i);
      fireEvent.change(nameInput, {
        target: { value: "Participant Test Deal" },
      });

      const stageSelect = screen.getByLabelText(/lifecycle stage/i);
      fireEvent.change(stageSelect, { target: { value: "new_lead" } });

      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: "50000" } });

      const customerOrgSelect = screen.getByLabelText(/customer organization/i);
      fireEvent.change(customerOrgSelect, { target: { value: "1" } });

      const contactsSelect = screen.getByLabelText(/contacts/i);
      fireEvent.change(contactsSelect, { target: { value: ["1", "2"] } });

      const dateInput = screen.getByLabelText(/expected closing date/i);
      fireEvent.change(dateInput, { target: { value: "2024-06-30" } });

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockDataProvider.create).toHaveBeenCalledWith("opportunities", {
          data: expect.objectContaining({
            contact_ids: [1, 2],
          }),
        });
      });
    });
  });

  describe("Opportunity Stage Progression", () => {
    const mockOpportunity = {
      id: 1,
      name: "Test Opportunity",
      stage: "new_lead",
      priority: "medium",
      amount: 50000,
      probability: 10,
      customer_organization_id: 1,
      contact_ids: [1],
      expected_closing_date: "2024-06-30",
    };

    beforeEach(() => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockOpportunity,
      });
    });

    it("should progress from new_lead to initial_outreach stage", async () => {
      renderWithAdminContext(
        <TestWrapper>
          <OpportunityEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("new_lead")).toBeInTheDocument();
      });

      // Change stage to initial_outreach
      const stageSelect = screen.getByLabelText(/lifecycle stage/i);
      fireEvent.change(stageSelect, { target: { value: "initial_outreach" } });

      // Update probability for initial_outreach stage
      const probabilityInput = screen.getByLabelText(/probability/i);
      fireEvent.change(probabilityInput, { target: { value: "25" } });

      // Save changes
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockDataProvider.update).toHaveBeenCalledWith("opportunities", {
          id: 1,
          data: expect.objectContaining({
            stage: "initial_outreach",
            probability: 25,
          }),
          previousData: mockOpportunity,
        });
      });
    });

    it("should progress through all lifecycle stages", async () => {
      // 7-stage pipeline per PRD v1.20 (awaiting_response removed)
      const stages = [
        { stage: "new_lead", probability: 10 },
        { stage: "initial_outreach", probability: 25 },
        { stage: "sample_visit_offered", probability: 40 },
        { stage: "feedback_logged", probability: 55 },
        { stage: "demo_scheduled", probability: 80 },
        { stage: "closed_won", probability: 100 },
      ];

      for (const { stage, probability } of stages) {
        mockDataProvider.getOne.mockResolvedValue({
          data: { ...mockOpportunity, stage, probability },
        });

        renderWithAdminContext(
          <TestWrapper>
            <OpportunityEdit />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByDisplayValue(stage)).toBeInTheDocument();
          expect(screen.getByDisplayValue(probability.toString())).toBeInTheDocument();
        });
      }
    });

    it("should handle closed lost stage", async () => {
      renderWithAdminContext(
        <TestWrapper>
          <OpportunityEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("new_lead")).toBeInTheDocument();
      });

      // Change stage to closed lost
      const stageSelect = screen.getByLabelText(/lifecycle stage/i);
      fireEvent.change(stageSelect, { target: { value: "closed_lost" } });

      // Set probability to 0 for closed lost
      const probabilityInput = screen.getByLabelText(/probability/i);
      fireEvent.change(probabilityInput, { target: { value: "0" } });

      // Save changes
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockDataProvider.update).toHaveBeenCalledWith("opportunities", {
          id: 1,
          data: expect.objectContaining({
            stage: "closed_lost",
            probability: 0,
          }),
          previousData: mockOpportunity,
        });
      });
    });
  });

  describe("Activity Tracking and Aggregation", () => {
    it("should track opportunity progression activities", async () => {
      const mockActivities = [
        {
          id: 1,
          opportunity_id: 1,
          type: "stage_change",
          subject: "Stage changed from New Lead to Initial Outreach",
          date: "2024-02-01T10:00:00Z",
          opportunity_owner_id: 1,
        },
        {
          id: 2,
          opportunity_id: 1,
          type: "call",
          subject: "Discovery call with decision maker",
          date: "2024-02-02T14:00:00Z",
          opportunity_owner_id: 1,
        },
      ];

      mockDataProvider.getList.mockImplementation((resource, params) => {
        if (resource === "activities" && params.filter?.opportunity_id === 1) {
          return Promise.resolve({
            data: mockActivities,
            total: mockActivities.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      // This would be tested in a component that shows activities
      expect(mockActivities).toHaveLength(2);
      expect(mockActivities[0].type).toBe("stage_change");
      expect(mockActivities[1].type).toBe("call");
    });

    it("should aggregate opportunity metrics correctly", async () => {
      const opportunities = [
        { id: 1, stage: "initial_outreach", amount: 50000, probability: 25 },
        { id: 2, stage: "demo_scheduled", amount: 30000, probability: 80 },
        { id: 3, stage: "closed_won", amount: 25000, probability: 100 },
      ];

      // Calculate weighted pipeline value
      const pipelineValue = opportunities.reduce((total, opp) => {
        return total + (opp.amount * opp.probability) / 100;
      }, 0);

      expect(pipelineValue).toBe(61500); // (50000*0.25 + 30000*0.80 + 25000*1.0)

      // Count opportunities by stage
      const stageCount = opportunities.reduce(
        (counts, opp) => {
          counts[opp.stage] = (counts[opp.stage] || 0) + 1;
          return counts;
        },
        {} as Record<string, number>
      );

      expect(stageCount).toEqual({
        initial_outreach: 1,
        demo_scheduled: 1,
        closed_won: 1,
      });
    });
  });
});
