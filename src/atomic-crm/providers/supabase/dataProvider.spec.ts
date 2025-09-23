import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GetListParams, CreateParams, UpdateParams } from "ra-core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseDataProvider } from "ra-supabase-core";

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

describe("Supabase DataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      // Import the actual data provider after mocks are set up
      const { dataProvider } = await import("./dataProvider");

      const params: GetListParams = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "created_at", order: "DESC" },
        filter: { stage: "qualified" },
      };

      const result = await dataProvider.getList("opportunities", params);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
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

      const { dataProvider } = await import("./dataProvider");

      const params: CreateParams = {
        data: newOpportunity,
      };

      const result = await dataProvider.create("opportunities", params);

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

      const { dataProvider } = await import("./dataProvider");

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

      const result = await dataProvider.update("opportunities", params);

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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.delete("opportunities", {
        id: "opp-1",
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });
  });

  describe("Junction Table Queries", () => {
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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getList("contact_organizations", {
        pagination: { page: 1, perPage: 10 },
        filter: { contact_id: "contact-1" },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("contact_organizations");
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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getList("opportunity_participants", {
        pagination: { page: 1, perPage: 10 },
        filter: { opportunity_id: "opp-1" },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunity_participants");
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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.create("contact_organizations", {
        data: newRelationship,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("contact_organizations");
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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getList("opportunities_summary", {
        pagination: { page: 1, perPage: 10 },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities_summary");
      expect(result).toBeDefined();
    });

    it("should handle backward compatible deals_summary view", async () => {
      // This would be handled by the backward compatibility wrapper
      // but we test that the underlying provider handles the view correctly
      const mockSummaryData = [
        {
          id: "deal-1",
          name: "Legacy Deal",
          company_name: "Old Corp",
          stage: "proposal",
          amount: 50000,
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

      const { dataProvider } = await import("./dataProvider");

      // The deals_summary would be transformed to opportunities_summary
      // by the backward compatibility layer
      const result = await dataProvider.getList("deals_summary", {
        pagination: { page: 1, perPage: 10 },
      });

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

      const { dataProvider } = await import("./dataProvider");

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

      await dataProvider.getList("opportunities", {
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

      const { dataProvider } = await import("./dataProvider");

      const dateFilter = {
        "created_at@gte": "2025-01-01",
        "created_at@lte": "2025-01-31",
      };

      await dataProvider.getList("opportunities", {
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

      const { dataProvider } = await import("./dataProvider");

      await expect(
        dataProvider.getList("opportunities", {
          pagination: { page: 1, perPage: 10 },
        })
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
            message: "null value in column 'customer_organization_id' violates not-null constraint",
            code: "23502",
          },
        }),
      };

      (mockSupabaseClient.from as any).mockReturnValue(mockInsertChain);

      const { dataProvider } = await import("./dataProvider");

      await expect(
        dataProvider.create("opportunities", {
          data: incompleteOpportunity,
        })
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

      const { dataProvider } = await import("./dataProvider");

      const page1 = await dataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
      });

      expect(mockSelectChain.range).toHaveBeenCalledWith(0, 9);

      const page2 = await dataProvider.getList("opportunities", {
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

      const { dataProvider } = await import("./dataProvider");

      await dataProvider.getList("opportunities", {
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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.getMany("opportunities", { ids });

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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.updateMany("opportunities", {
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

      const { dataProvider } = await import("./dataProvider");

      const result = await dataProvider.deleteMany("opportunities", { ids });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("opportunities");
      expect(result).toBeDefined();
    });
  });
});