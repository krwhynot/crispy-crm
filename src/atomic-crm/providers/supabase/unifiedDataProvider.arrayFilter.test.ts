/**
 * Tests for array filter transformation in unified data provider
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock declarations to ensure they're available before imports
const { mockGetList, mockGetManyReference } = vi.hoisted(() => {
  return {
    mockGetList: vi.fn(),
    mockGetManyReference: vi.fn(),
  };
});

// Mock the base supabase provider
vi.mock("ra-supabase-core", () => ({
  supabaseDataProvider: () => ({
    getList: mockGetList,
    getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    getMany: vi.fn().mockResolvedValue({ data: [] }),
    getManyReference: mockGetManyReference,
    create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    updateMany: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    deleteMany: vi.fn().mockResolvedValue({ data: [] }),
  }),
}));

// Mock the supabase client
vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
    })),
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

// Mock validation and services
vi.mock("../../validation/opportunities", () => ({
  validateOpportunityForm: vi.fn(),
  validateCreateOpportunity: vi.fn(),
  validateUpdateOpportunity: vi.fn(),
}));

vi.mock("../../validation/organizations", () => ({
  validateOrganizationForSubmission: vi.fn(),
}));

vi.mock("../../validation/contacts", () => ({
  validateContactForm: vi.fn(),
  validateCreateContact: vi.fn(),
  validateUpdateContact: vi.fn(),
  validateContactOrganization: vi.fn(),
}));

vi.mock("../../validation/products", () => ({
  validateProductForm: vi.fn(),
  validateOpportunityProduct: vi.fn(),
}));

vi.mock("../../validation/tags", () => ({
  validateCreateTag: vi.fn(),
  validateUpdateTag: vi.fn(),
}));

vi.mock("../../validation/notes", () => ({
  validateContactNoteForSubmission: vi.fn(),
  validateOpportunityNoteForSubmission: vi.fn(),
  validateCreateContactNote: vi.fn(),
  validateUpdateContactNote: vi.fn(),
  validateCreateOpportunityNote: vi.fn(),
  validateUpdateOpportunityNote: vi.fn(),
}));

vi.mock("../../validation/tasks", () => ({
  validateTaskForSubmission: vi.fn(),
  validateCreateTask: vi.fn(),
  validateUpdateTask: vi.fn(),
  validateTaskWithReminder: vi.fn(),
}));

vi.mock("../../validation/sales", () => ({
  validateSalesForm: vi.fn(),
  validateCreateSales: vi.fn(),
  validateUpdateSales: vi.fn(),
}));

vi.mock("../../validation/activities", () => ({
  validateActivitiesForm: vi.fn(),
  validateCreateActivities: vi.fn(),
  validateUpdateActivities: vi.fn(),
  validateEngagementsForm: vi.fn(),
  validateCreateEngagements: vi.fn(),
  validateUpdateEngagements: vi.fn(),
  validateInteractionsForm: vi.fn(),
  validateCreateInteractions: vi.fn(),
  validateUpdateInteractions: vi.fn(),
}));

vi.mock("../../validation/segments", () => ({
  validateCreateSegment: vi.fn(),
  validateUpdateSegment: vi.fn(),
  validateSegmentForSubmission: vi.fn(),
}));

vi.mock("../../services", () => ({
  SalesService: vi.fn().mockImplementation(() => ({
    salesCreate: vi.fn(),
    salesUpdate: vi.fn(),
    updatePassword: vi.fn(),
  })),
  OpportunitiesService: vi.fn().mockImplementation(() => ({
    unarchiveOpportunity: vi.fn(),
  })),
  ActivitiesService: vi.fn().mockImplementation(() => ({
    getActivityLog: vi.fn(),
  })),
  JunctionsService: vi.fn().mockImplementation(() => ({
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
  })),
  SegmentsService: vi.fn().mockImplementation(() => ({
    getSegmentContacts: vi.fn(),
    addContactToSegment: vi.fn(),
    removeContactFromSegment: vi.fn(),
  })),
}));

vi.mock("../../utils/storage.utils", () => ({
  uploadToBucket: vi.fn(),
}));

vi.mock("../../utils/avatar.utils", () => ({
  processContactAvatar: vi.fn().mockImplementation((data) => data),
  processOrganizationLogo: vi.fn().mockImplementation((data) => data),
}));

vi.mock("./filterRegistry", () => ({
  filterableFields: {
    contacts: ["id", "first_name", "last_name", "email", "phone", "tags", "q"],
    contacts_summary: ["id", "first_name", "last_name", "email", "phone", "tags", "q"],
    opportunities: ["id", "name", "stage", "amount"],
    opportunities_summary: ["id", "name", "stage", "amount"],
  },
  isValidFilterField: vi.fn().mockReturnValue(true),
}));

// NOTE: DO NOT mock dataProviderUtils for this test - we're testing the actual transformations!

// Import the provider after all mocks are set up
import { supabase } from "./supabase";
import { unifiedDataProvider } from "./unifiedDataProvider";

describe("UnifiedDataProvider Array Filter Transformation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetList.mockResolvedValue({ data: [], total: 0 });
    mockGetManyReference.mockResolvedValue({ data: [], total: 0 });

    // Set up default auth mocks for each test
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "test-user" }, access_token: "test-token" } },
      error: null,
    } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "test-user" } },
      error: null,
    } as any);
  });

  describe("getList with array filters", () => {
    it("should transform tags array to PostgREST @cs operator", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: { tags: [1, 2, 3] },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that the filter was transformed correctly
      // Note: contacts_summary is a view, so deleted_at is NOT added (views handle this internally)
      expect(mockGetList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: {
            "tags@cs": "{1,2,3}",
          },
        })
      );
    });

    it("should transform status array to PostgREST @in operator", async () => {
      await unifiedDataProvider.getList("opportunities", {
        filter: { stage: ["qualified", "proposal", "negotiation"] },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that the filter was transformed correctly
      // Note: opportunities uses summary view, which handles soft delete filtering internally
      expect(mockGetList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          filter: {
            "stage@in": "(qualified,proposal,negotiation)",
          },
        })
      );
    });

    it("should preserve existing PostgREST operators", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: {
          "tags@cs": "{5}",
          "last_seen@gte": "2024-01-01",
        },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that existing operators are preserved
      expect(mockGetList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: {
            "tags@cs": "{5}",
            "last_seen@gte": "2024-01-01",
          },
        })
      );
    });

    it("should remove empty arrays from filter", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: {
          tags: [],
          first_name: "John",
        },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that empty array was removed
      expect(mockGetList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: {
            first_name: "John",
          },
        })
      );

      // Verify tags field was not included
      const callArgs = mockGetList.mock.calls[0][1];
      expect(callArgs.filter).not.toHaveProperty("tags");
      expect(callArgs.filter).not.toHaveProperty("tags@cs");
    });

    it("should handle mixed filters correctly", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: {
          tags: [1, 2],
          email: ["test@example.com", "test2@example.com"],
          first_name: "John",
          "last_name@ilike": "%doe%",
        },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that all filters were transformed correctly
      expect(mockGetList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: {
            "tags@cs": "{1,2}",
            "email@cs": '{"test@example.com","test2@example.com"}',
            first_name: "John",
            "last_name@ilike": "%doe%",
          },
        })
      );
    });

    it("should handle phone array as JSONB field", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: {
          phone: ["+1234567890", "+0987654321"],
        },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that phone array was transformed to @cs operator
      expect(mockGetList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: {
            "phone@cs": "{+1234567890,+0987654321}",
          },
        })
      );
    });
  });

  describe("getManyReference with array filters", () => {
    it("should transform array filters in getManyReference", async () => {
      await unifiedDataProvider.getManyReference("contacts", {
        target: "organization_id",
        id: 1,
        filter: { tags: [4, 5, 6] },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that the filter was transformed correctly
      // getManyReference uses the base table (contacts) which supports soft delete
      expect(mockGetManyReference).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          filter: {
            "tags@cs": "{4,5,6}",
            "deleted_at@is": null,
          },
        })
      );
    });
  });

  describe("search with array filters", () => {
    it("should apply both search and array transformations", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: {
          q: "john",
          tags: [1, 2],
        },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that both transformations were applied
      // Views don't get deleted_at filter
      expect(mockGetList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.objectContaining({
            "tags@cs": "{1,2}",
            "@or": expect.any(Object), // Search transformation
          }),
        })
      );
    });
  });
});
