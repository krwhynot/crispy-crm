import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GetListParams, CreateParams, UpdateParams } from "ra-core";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock modules
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("ra-supabase-core", () => ({
  supabaseDataProvider: vi.fn(() => mockBaseDataProvider),
}));

vi.mock("./supabase", () => ({
  supabase: mockSupabaseClient,
}));

vi.mock("./authProvider", () => ({
  getIsInitialized: vi.fn(() => true),
}));

// Create mock service instances first
const mockSalesService = {
  salesCreate: vi.fn(),
  salesUpdate: vi.fn(),
  updatePassword: vi.fn(),
};

const mockOpportunitiesService = {
  unarchiveOpportunity: vi.fn(),
};

const mockActivitiesService = {
  getActivityLog: vi.fn(),
};

const mockJunctionsService = {
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

// Mock services
vi.mock("../../services", () => ({
  SalesService: vi.fn().mockImplementation(() => mockSalesService),
  OpportunitiesService: vi.fn().mockImplementation(() => mockOpportunitiesService),
  ActivitiesService: vi.fn().mockImplementation(() => mockActivitiesService),
  JunctionsService: vi.fn().mockImplementation(() => mockJunctionsService),
}));

// Mock validation functions
vi.mock("../../validation/opportunities", () => ({
  validateOpportunityForm: vi.fn(),
}));

vi.mock("../../validation/organizations", () => ({
  validateOrganizationForSubmission: vi.fn(),
}));

vi.mock("../../validation/contacts", () => ({
  validateContactForm: vi.fn(),
}));

vi.mock("../../validation/tags", () => ({
  validateCreateTag: vi.fn(),
  validateUpdateTag: vi.fn(),
}));

// Mock utils
vi.mock("../../utils/storage.utils", () => ({
  uploadToBucket: vi.fn(),
}));

vi.mock("../../utils/avatar.utils", () => ({
  processContactAvatar: vi.fn().mockImplementation((data) => data),
  processOrganizationLogo: vi.fn().mockImplementation((data) => data),
}));

// Mock environment variables
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");

// Create mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
  auth: {
    getSession: vi.fn(),
  },
} as unknown as SupabaseClient;

// Create mock base data provider
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

describe("Unified Supabase DataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset service mocks
    Object.values(mockSalesService).forEach(mock => mock.mockReset());
    Object.values(mockOpportunitiesService).forEach(mock => mock.mockReset());
    Object.values(mockActivitiesService).forEach(mock => mock.mockReset());
    Object.values(mockJunctionsService).forEach(mock => mock.mockReset());
  });

  describe("Opportunities CRUD Operations", () => {
    it("should handle getList for opportunities", async () => {
      const mockOpportunities = [
        {
          id: "opp-1",
          name: "Big Deal",
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
          name: "Medium Deal",
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
      ];

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: mockOpportunities,
            error: null,
            count: mockOpportunities.length,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      // Import the actual unified data provider after mocks are set up
      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const params: GetListParams = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "created_at", order: "DESC" },
        filter: { stage: "qualified" },
      };

      const result = await unifiedDataProvider.getList("opportunities", params);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities_summary");
      expect(result).toBeDefined();
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
        created_at: "2025-01-22",
        updated_at: "2025-01-22",
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdOpportunity,
          error: null,
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockInsertChain);

      const { dataProvider } = await import("./index");

      const params: CreateParams = {
        data: newOpportunity,
      };

      const result = await unifiedDataProvider.create("opportunities", params);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });

    it("should handle update for opportunities", async () => {
      const updatedData = {
        id: "opp-1",
        name: "Updated Opportunity",
        stage: "negotiation",
        amount: 150000,
        probability: 80,
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedData,
          error: null,
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockUpdateChain);

      const { dataProvider } = await import("./index");

      const params: UpdateParams = {
        id: "opp-1",
        data: updatedData,
        previousData: {
          id: "opp-1",
          name: "Original Opportunity",
          stage: "qualified",
          amount: 100000,
        },
      };

      const result = await unifiedDataProvider.update("opportunities", params);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });

    it("should handle delete for opportunities", async () => {
      const mockDeleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "opp-1" },
          error: null,
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockDeleteChain);

      const { dataProvider } = await import("./index");

      const result = await unifiedDataProvider.delete("opportunities", {
        id: "opp-1",
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });
  });

  describe("Junction Table Operations", () => {
    it("should handle contact_organizations junction table queries", async () => {
      const mockContactOrganizations = [
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
      ];

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: mockContactOrganizations,
            error: null,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const result = await unifiedDataProvider.getList("contact_organizations", {
        pagination: { page: 1, perPage: 10 },
        filter: { contact_id: "contact-1" },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "contact_organizations",
      );
      expect(result).toBeDefined();
    });

    it("should handle opportunity_participants junction table queries", async () => {
      const mockOpportunityParticipants = [
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
      ];

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: mockOpportunityParticipants,
            error: null,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const result = await unifiedDataProvider.getList("opportunity_participants", {
        pagination: { page: 1, perPage: 10 },
        filter: { opportunity_id: "opp-1" },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "opportunity_participants",
      );
      expect(result).toBeDefined();
    });

    it("should create contact_organization relationship", async () => {
      const newRelationship = {
        contact_id: "contact-1",
        organization_id: "org-3",
        is_primary: true,
        role: "CTO",
      };

      const createdRelationship = {
        id: "co-new",
        ...newRelationship,
        created_at: "2025-01-22",
        updated_at: "2025-01-22",
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdRelationship,
          error: null,
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockInsertChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const result = await unifiedDataProvider.create("contact_organizations", {
        data: newRelationship,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "contact_organizations",
      );
      expect(result).toBeDefined();
    });
  });

  describe("View Compatibility", () => {
    it("should handle opportunities_summary view queries", async () => {
      const mockSummaryData = [
        {
          id: "opp-1",
          name: "Big Deal",
          customer_organization_name: "Acme Corp",
          stage: "qualified",
          amount: 100000,
          probability: 75,
          expected_revenue: 75000,
          days_in_stage: 15,
        },
      ];

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: mockSummaryData,
            error: null,
            count: 1,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const result = await unifiedDataProvider.getList("opportunities_summary", {
        pagination: { page: 1, perPage: 10 },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "opportunities_summary",
      );
      expect(result).toBeDefined();
    });
  });

  describe("Filter Transformations", () => {
    it("should handle complex filter transformations", async () => {
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: [],
            error: null,
            count: 0,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      // Test various filter operators
      const complexFilter = {
        "amount@gte": 50000,
        "amount@lte": 200000,
        "stage@in": "(qualified,proposal,negotiation)",
        "name@ilike": "%deal%",
        "@or": {
          priority: "high",
          probability: 80,
        },
      };

      await unifiedDataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        filter: complexFilter,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
    });

    it("should handle date range filters", async () => {
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: [],
            error: null,
            count: 0,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const dateFilter = {
        "created_at@gte": "2025-01-01",
        "created_at@lte": "2025-01-31",
      };

      await unifiedDataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        filter: dateFilter,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
    });
  });

  describe("Error Handling", () => {
    it("should handle Supabase errors gracefully", async () => {
      const mockError = {
        message: "Database error",
        details: "Connection refused",
        hint: "Check your connection",
        code: "PGRST301",
      };

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: null,
            error: mockError,
            count: null,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      await expect(
        unifiedDataProvider.getList("opportunities", {
          pagination: { page: 1, perPage: 10 },
        }),
      ).rejects.toThrow();
    });

    it("should handle missing required fields in create", async () => {
      const incompleteOpportunity = {
        name: "Incomplete Opportunity",
        // Missing required customer_organization_id
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message:
              "null value in column 'customer_organization_id' violates not-null constraint",
            code: "23502",
          },
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockInsertChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      await expect(
        unifiedDataProvider.create("opportunities", {
          data: incompleteOpportunity,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Pagination and Sorting", () => {
    it("should handle pagination correctly", async () => {
      const mockOpportunities = Array.from({ length: 25 }, (_, i) => ({
        id: `opp-${i + 1}`,
        name: `Opportunity ${i + 1}`,
        amount: (i + 1) * 10000,
      }));

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn((start, end) => {
          const data = mockOpportunities.slice(start, end + 1);
          return {
            order: vi.fn().mockReturnThis(),
            then: vi.fn((callback) => {
              callback({
                data,
                error: null,
                count: mockOpportunities.length,
              });
            }),
          };
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const page1 = await unifiedDataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
      });

      expect(mockSelectChain.range).toHaveBeenCalledWith(0, 9);

      const page2 = await unifiedDataProvider.getList("opportunities", {
        pagination: { page: 2, perPage: 10 },
      });

      expect(mockSelectChain.range).toHaveBeenCalledWith(10, 19);
    });

    it("should handle sorting correctly", async () => {
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: [],
            error: null,
            count: 0,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      await unifiedDataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "amount", order: "DESC" },
      });

      expect(mockSelectChain.order).toHaveBeenCalled();
    });
  });

  describe("Batch Operations", () => {
    it("should handle getMany for multiple opportunities", async () => {
      const ids = ["opp-1", "opp-2", "opp-3"];
      const mockOpportunities = ids.map((id) => ({
        id,
        name: `Opportunity ${id}`,
        amount: 50000,
      }));

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: mockOpportunities,
            error: null,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockSelectChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const result = await unifiedDataProvider.getMany("opportunities", { ids });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });

    it("should handle updateMany for batch updates", async () => {
      const ids = ["opp-1", "opp-2"];
      const updateData = { stage: "closed_won" };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: ids.map((id) => ({ id, ...updateData })),
            error: null,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockUpdateChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const result = await unifiedDataProvider.updateMany("opportunities", {
        ids,
        data: updateData,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });

    it("should handle deleteMany for batch deletes", async () => {
      const ids = ["opp-1", "opp-2", "opp-3"];

      const mockDeleteChain = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          callback({
            data: ids.map((id) => ({ id })),
            error: null,
          });
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockDeleteChain);

      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      const result = await unifiedDataProvider.deleteMany("opportunities", { ids });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });
  });

  describe("Custom Service Methods", () => {
    it("should include sales service methods in unified provider", async () => {
      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      expect(typeof unifiedDataProvider.salesCreate).toBe('function');
      expect(typeof unifiedDataProvider.salesUpdate).toBe('function');
      expect(typeof unifiedDataProvider.updatePassword).toBe('function');
    });

    it("should include opportunity service methods in unified provider", async () => {
      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      expect(typeof unifiedDataProvider.unarchiveOpportunity).toBe('function');
    });

    it("should include junction service methods in unified provider", async () => {
      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      expect(typeof unifiedDataProvider.getContactOrganizations).toBe('function');
      expect(typeof unifiedDataProvider.addContactToOrganization).toBe('function');
      expect(typeof unifiedDataProvider.getOpportunityParticipants).toBe('function');
    });

    it("should include activity service methods in unified provider", async () => {
      const { unifiedDataProvider } = await import("./unifiedDataProvider");

      expect(typeof unifiedDataProvider.getActivityLog).toBe('function');
    });
  });

  describe("Unified Provider Architecture", () => {
    it("should include validation registry", async () => {
      const { resourceUsesValidation } = await import("./unifiedDataProvider");

      expect(typeof resourceUsesValidation).toBe('function');
      expect(resourceUsesValidation("opportunities")).toBe(true);
      expect(resourceUsesValidation("organizations")).toBe(true);
      expect(resourceUsesValidation("contacts")).toBe(true);
      expect(resourceUsesValidation("tags")).toBe(true);
    });

    it("should include transformer registry", async () => {
      const { resourceUsesTransformers } = await import("./unifiedDataProvider");

      expect(typeof resourceUsesTransformers).toBe('function');
      expect(resourceUsesTransformers("contactNotes")).toBe(true);
      expect(resourceUsesTransformers("organizations")).toBe(true);
      expect(resourceUsesTransformers("contacts")).toBe(true);
    });
  });
});
