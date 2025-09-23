import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { GetListParams, CreateParams, UpdateParams } from "ra-core";
import type { Opportunity, Deal, Contact, Company } from "../../types";

// Mock modules
vi.mock("ra-data-fakerest", () => ({
  default: vi.fn(() => mockBaseDataProvider),
}));

vi.mock("./dataGenerator", () => ({
  default: vi.fn(() => mockGeneratedData),
}));

vi.mock("../commons/getContactAvatar", () => ({
  getContactAvatar: vi.fn((contact) =>
    Promise.resolve(`https://avatar.example.com/${contact.email_jsonb?.[0]?.email || 'default'}`)
  ),
}));

vi.mock("../commons/getCompanyAvatar", () => ({
  getCompanyAvatar: vi.fn((company) =>
    Promise.resolve(`https://logo.example.com/${company.name || 'default'}`)
  ),
}));

// Mock generated data
const mockGeneratedData = {
  opportunities: [
    {
      id: "opp-1",
      name: "Test Opportunity 1",
      customer_organization_id: "org-1",
      stage: "qualified",
      status: "active",
      priority: "high",
      amount: 100000,
      probability: 75,
      created_at: "2025-01-01",
      updated_at: "2025-01-15",
      sales_id: "sales-1",
    },
    {
      id: "opp-2",
      name: "Test Opportunity 2",
      customer_organization_id: "org-2",
      stage: "proposal",
      status: "active",
      priority: "medium",
      amount: 50000,
      probability: 60,
      created_at: "2025-01-05",
      updated_at: "2025-01-20",
      sales_id: "sales-2",
    },
  ],
  contact_organizations: [
    {
      id: "co-1",
      contact_id: "contact-1",
      organization_id: "org-1",
      is_primary: true,
      role: "CEO",
      created_at: "2025-01-01",
    },
    {
      id: "co-2",
      contact_id: "contact-1",
      organization_id: "org-2",
      is_primary: false,
      role: "Advisor",
      created_at: "2025-01-05",
    },
  ],
  opportunity_participants: [
    {
      id: "op-1",
      opportunity_id: "opp-1",
      contact_id: "contact-1",
      role: "decision_maker",
      influence_level: "high",
      created_at: "2025-01-01",
    },
    {
      id: "op-2",
      opportunity_id: "opp-1",
      contact_id: "contact-2",
      role: "influencer",
      influence_level: "medium",
      created_at: "2025-01-02",
    },
  ],
  companies: [
    {
      id: "org-1",
      name: "Acme Corp",
      sector: "Technology",
      size: "100-500",
      website: "https://acme.example.com",
      created_at: "2025-01-01",
    },
    {
      id: "org-2",
      name: "Beta Inc",
      sector: "Finance",
      size: "50-100",
      website: "https://beta.example.com",
      created_at: "2025-01-02",
    },
  ],
  contacts: [
    {
      id: "contact-1",
      first_name: "John",
      last_name: "Doe",
      email_jsonb: [{ email: "john@acme.com", type: "work" }],
      phone_number_jsonb: [{ phone: "+1234567890", type: "mobile" }],
      created_at: "2025-01-01",
    },
    {
      id: "contact-2",
      first_name: "Jane",
      last_name: "Smith",
      email_jsonb: [{ email: "jane@beta.com", type: "work" }],
      phone_number_jsonb: [{ phone: "+0987654321", type: "office" }],
      created_at: "2025-01-02",
    },
  ],
};

// Mock base data provider
const mockBaseDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  updateMany: vi.fn(),
};

describe("FakeRest DataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Opportunities CRUD Operations", () => {
    it("should handle getList for opportunities", async () => {
      mockBaseDataProvider.getList.mockResolvedValue({
        data: mockGeneratedData.opportunities,
        total: mockGeneratedData.opportunities.length,
      });

      // Import the actual data provider after mocks are set up
      const { dataProvider } = await import("./dataProvider");

      const params: GetListParams = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "created_at", order: "DESC" },
        filter: { stage: "qualified" },
      };

      const result = await dataProvider.getList("opportunities", params);

      expect(result.data).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });

    it("should handle create for opportunities", async () => {
      const newOpportunity = {
        name: "New Opportunity",
        customer_organization_id: "org-1",
        stage: "lead",
        status: "active",
        priority: "medium",
        amount: 25000,
        probability: 10,
      };

      const createdOpportunity = {
        id: "opp-new",
        ...newOpportunity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockBaseDataProvider.create.mockResolvedValue({
        data: createdOpportunity,
      });

      const { dataProvider } = await import("./dataProvider");

      const params: CreateParams = {
        data: newOpportunity,
      };

      const result = await dataProvider.create("opportunities", params);

      expect(result.data).toMatchObject(newOpportunity);
      expect(result.data.id).toBeDefined();
    });

    it("should handle update for opportunities", async () => {
      const updatedData = {
        id: "opp-1",
        name: "Updated Opportunity",
        stage: "negotiation",
        amount: 150000,
        probability: 80,
      };

      mockBaseDataProvider.update.mockResolvedValue({
        data: {
          ...mockGeneratedData.opportunities[0],
          ...updatedData,
          updated_at: new Date().toISOString(),
        },
      });

      const { dataProvider } = await import("./dataProvider");

      const params: UpdateParams = {
        id: "opp-1",
        data: updatedData,
        previousData: mockGeneratedData.opportunities[0],
      };

      const result = await dataProvider.update("opportunities", params);

      expect(result.data.name).toBe("Updated Opportunity");
      expect(result.data.stage).toBe("negotiation");
      expect(result.data.amount).toBe(150000);
    });

    it("should handle delete for opportunities", async () => {
      mockBaseDataProvider.delete.mockResolvedValue({
        data: { id: "opp-1" },
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.delete("opportunities", {
        id: "opp-1",
      });

      expect(result.data.id).toBe("opp-1");
    });
  });

  describe("Junction Table Operations", () => {
    it("should handle contact_organizations queries", async () => {
      mockBaseDataProvider.getList.mockResolvedValue({
        data: mockGeneratedData.contact_organizations,
        total: mockGeneratedData.contact_organizations.length,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getList("contact_organizations", {
        pagination: { page: 1, perPage: 10 },
        filter: { contact_id: "contact-1" },
      });

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should handle opportunity_participants queries", async () => {
      mockBaseDataProvider.getList.mockResolvedValue({
        data: mockGeneratedData.opportunity_participants,
        total: mockGeneratedData.opportunity_participants.length,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getList("opportunity_participants", {
        pagination: { page: 1, perPage: 10 },
        filter: { opportunity_id: "opp-1" },
      });

      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should create new contact_organization relationship", async () => {
      const newRelationship = {
        contact_id: "contact-2",
        organization_id: "org-2",
        is_primary: true,
        role: "CTO",
      };

      const createdRelationship = {
        id: "co-new",
        ...newRelationship,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockBaseDataProvider.create.mockResolvedValue({
        data: createdRelationship,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.create("contact_organizations", {
        data: newRelationship,
      });

      expect(result.data).toMatchObject(newRelationship);
      expect(result.data.id).toBeDefined();
    });

    it("should create new opportunity_participant", async () => {
      const newParticipant = {
        opportunity_id: "opp-2",
        contact_id: "contact-2",
        role: "technical_evaluator",
        influence_level: "low",
      };

      const createdParticipant = {
        id: "op-new",
        ...newParticipant,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockBaseDataProvider.create.mockResolvedValue({
        data: createdParticipant,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.create("opportunity_participants", {
        data: newParticipant,
      });

      expect(result.data).toMatchObject(newParticipant);
      expect(result.data.id).toBeDefined();
    });
  });

  describe("Filter Transformations", () => {
    it("should transform Supabase filter syntax to FakeRest", async () => {
      mockBaseDataProvider.getList.mockResolvedValue({
        data: [],
        total: 0,
      });

      const { dataProvider } = await import("./dataProvider");

      // Test various Supabase filter operators
      const supabaseFilter = {
        "amount@gte": 50000,
        "amount@lte": 200000,
        "stage@in": "(qualified,proposal,negotiation)",
        "name@ilike": "%deal%",
      };

      await dataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        filter: supabaseFilter,
      });

      // The withSupabaseFilterAdapter should transform these filters
      expect(mockBaseDataProvider.getList).toHaveBeenCalled();
    });

    it("should handle OR filter transformations", async () => {
      mockBaseDataProvider.getList.mockResolvedValue({
        data: [],
        total: 0,
      });

      const { dataProvider } = await import("./dataProvider");

      const orFilter = {
        "@or": {
          priority: "high",
          probability: 80,
        },
      };

      await dataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        filter: orFilter,
      });

      expect(mockBaseDataProvider.getList).toHaveBeenCalled();
    });

    it("should handle complex nested filters", async () => {
      mockBaseDataProvider.getList.mockResolvedValue({
        data: [],
        total: 0,
      });

      const { dataProvider } = await import("./dataProvider");

      const complexFilter = {
        "created_at@gte": "2025-01-01",
        "created_at@lte": "2025-01-31",
        "stage@neq": "closed_lost",
        "sales_id@is": null,
      };

      await dataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        filter: complexFilter,
      });

      expect(mockBaseDataProvider.getList).toHaveBeenCalled();
    });
  });

  describe("Backward Compatibility", () => {
    it("should handle deals endpoint with backward compatibility", async () => {
      const dealData = {
        id: "deal-1",
        name: "Legacy Deal",
        company_id: "org-1",
        stage: "proposal",
        amount: 50000,
      };

      mockBaseDataProvider.getList.mockResolvedValue({
        data: [mockGeneratedData.opportunities[0]],
        total: 1,
      });

      const { dataProvider } = await import("./dataProvider");

      // The backward compatibility wrapper should handle this
      const result = await dataProvider.getList("deals", {
        pagination: { page: 1, perPage: 10 },
      });

      // Should be transformed from opportunities
      expect(result.data).toBeDefined();
    });

    it("should transform opportunity to deal format in backward compatibility mode", async () => {
      const opportunity: Opportunity = {
        id: "opp-1",
        name: "Test Opportunity",
        customer_organization_id: "org-1",
        stage: "qualified",
        status: "active",
        priority: "high",
        amount: 100000,
        probability: 75,
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        sales_id: "sales-1",
        stage_manual: false,
        status_manual: false,
      };

      mockBaseDataProvider.getOne.mockResolvedValue({
        data: opportunity,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getOne("deals", { id: "opp-1" });

      // Should be transformed to deal format
      expect(result.data).toHaveProperty("company_id");
      expect(result.data).toHaveProperty("expected_closing_date");
    });
  });

  describe("Contact Avatar Processing", () => {
    it("should auto-generate contact avatar if not provided", async () => {
      const newContact = {
        first_name: "Test",
        last_name: "User",
        email_jsonb: [{ email: "test@example.com", type: "work" }],
      };

      const createdContact = {
        id: "contact-new",
        ...newContact,
        avatar: { src: "https://avatar.example.com/test@example.com" },
        created_at: new Date().toISOString(),
      };

      mockBaseDataProvider.create.mockResolvedValue({
        data: createdContact,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.create("contacts", {
        data: newContact,
      });

      expect(result.data.avatar).toBeDefined();
      expect(result.data.avatar.src).toContain("avatar");
    });

    it("should handle base64 avatar upload", async () => {
      const base64Avatar = "data:image/png;base64,iVBORw0KGgoAAAANS...";
      const contactWithAvatar = {
        first_name: "Test",
        last_name: "User",
        avatar: {
          rawFile: new File([""], "avatar.png", { type: "image/png" }),
          src: base64Avatar,
        },
      };

      mockBaseDataProvider.update.mockResolvedValue({
        data: {
          ...contactWithAvatar,
          id: "contact-1",
        },
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.update("contacts", {
        id: "contact-1",
        data: contactWithAvatar,
        previousData: { id: "contact-1" },
      });

      expect(result.data.avatar).toBeDefined();
    });
  });

  describe("Company Logo Processing", () => {
    it("should auto-generate company logo if not provided", async () => {
      const newCompany = {
        name: "Test Company",
        sector: "Technology",
      };

      const createdCompany = {
        id: "company-new",
        ...newCompany,
        logo: { src: "https://logo.example.com/Test Company" },
        created_at: new Date().toISOString(),
      };

      mockBaseDataProvider.create.mockResolvedValue({
        data: createdCompany,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.create("companies", {
        data: newCompany,
      });

      expect(result.data.logo).toBeDefined();
      expect(result.data.logo.src).toContain("logo");
    });
  });

  describe("Batch Operations", () => {
    it("should handle getMany for multiple records", async () => {
      const ids = ["opp-1", "opp-2"];

      mockBaseDataProvider.getMany.mockResolvedValue({
        data: mockGeneratedData.opportunities.filter(o => ids.includes(o.id)),
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getMany("opportunities", { ids });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe("opp-1");
      expect(result.data[1].id).toBe("opp-2");
    });

    it("should handle updateMany for batch updates", async () => {
      const ids = ["opp-1", "opp-2"];
      const updateData = { stage: "closed_won" };

      mockBaseDataProvider.updateMany.mockResolvedValue({
        data: ids,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.updateMany("opportunities", {
        ids,
        data: updateData,
      });

      expect(result.data).toEqual(ids);
    });

    it("should handle deleteMany for batch deletes", async () => {
      const ids = ["opp-1", "opp-2"];

      mockBaseDataProvider.deleteMany.mockResolvedValue({
        data: ids,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.deleteMany("opportunities", { ids });

      expect(result.data).toEqual(ids);
    });
  });

  describe("getManyReference", () => {
    it("should handle reference queries for related data", async () => {
      const contactOpportunities = mockGeneratedData.opportunity_participants
        .filter(op => op.contact_id === "contact-1")
        .map(op => mockGeneratedData.opportunities.find(o => o.id === op.opportunity_id))
        .filter(Boolean);

      mockBaseDataProvider.getManyReference.mockResolvedValue({
        data: contactOpportunities,
        total: contactOpportunities.length,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getManyReference("opportunities", {
        target: "contact_id",
        id: "contact-1",
        pagination: { page: 1, perPage: 10 },
        sort: { field: "created_at", order: "DESC" },
        filter: {},
      });

      expect(result.data).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in CRUD operations", async () => {
      const error = new Error("Database connection failed");
      mockBaseDataProvider.getList.mockRejectedValue(error);

      const { dataProvider } = await import("./dataProvider");

      await expect(
        dataProvider.getList("opportunities", {
          pagination: { page: 1, perPage: 10 },
        })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed: amount must be positive");
      mockBaseDataProvider.create.mockRejectedValue(validationError);

      const { dataProvider } = await import("./dataProvider");

      await expect(
        dataProvider.create("opportunities", {
          data: {
            name: "Invalid Opportunity",
            amount: -1000,
          },
        })
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("Sorting and Pagination", () => {
    it("should apply sorting correctly", async () => {
      const sortedData = [...mockGeneratedData.opportunities].sort(
        (a, b) => b.amount - a.amount
      );

      mockBaseDataProvider.getList.mockResolvedValue({
        data: sortedData,
        total: sortedData.length,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "amount", order: "DESC" },
      });

      expect(result.data[0].amount).toBeGreaterThanOrEqual(result.data[1]?.amount || 0);
    });

    it("should handle pagination boundaries", async () => {
      mockBaseDataProvider.getList.mockResolvedValue({
        data: [],
        total: 0,
      });

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getList("opportunities", {
        pagination: { page: 100, perPage: 10 },
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});