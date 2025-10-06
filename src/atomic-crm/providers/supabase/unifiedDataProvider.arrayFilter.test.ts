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
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));

// Mock validation and services
vi.mock("../../validation/opportunities", () => ({
  validateOpportunityForm: vi.fn(),
}));

vi.mock("../../validation/organizations", () => ({
  validateOrganizationForSubmission: vi.fn(),
}));

vi.mock("../../validation/contacts", () => ({
  validateContactForm: vi.fn(),
}));

vi.mock("../../validation/products", () => ({
  validateProductForm: vi.fn(),
}));

vi.mock("../../validation/tags", () => ({
  validateCreateTag: vi.fn(),
  validateUpdateTag: vi.fn(),
}));

vi.mock("../../validation/notes", () => ({
  validateContactNoteForSubmission: vi.fn(),
  validateOpportunityNoteForSubmission: vi.fn(),
}));

vi.mock("../../validation/tasks", () => ({
  validateTaskForSubmission: vi.fn(),
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
}));

vi.mock("../../utils/storage.utils", () => ({
  uploadToBucket: vi.fn(),
}));

vi.mock("../../utils/avatar.utils", () => ({
  processContactAvatar: vi.fn().mockImplementation((data) => data),
  processOrganizationLogo: vi.fn().mockImplementation((data) => data),
}));

// Import the provider after all mocks are set up
import { unifiedDataProvider } from "./unifiedDataProvider";

describe("UnifiedDataProvider Array Filter Transformation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetList.mockResolvedValue({ data: [], total: 0 });
    mockGetManyReference.mockResolvedValue({ data: [], total: 0 });
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
        }),
      );
    });

    it("should transform status array to PostgREST @in operator", async () => {
      await unifiedDataProvider.getList("opportunities", {
        filter: { stage: ["qualified", "proposal", "negotiation"] },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that the filter was transformed correctly
      // Note: opportunities_summary is a view, so deleted_at is NOT added
      expect(mockGetList).toHaveBeenCalledWith(
        "opportunities_summary",
        expect.objectContaining({
          filter: {
            "stage@in": "(qualified,proposal,negotiation)",
          },
        }),
      );
    });

    it("should preserve existing PostgREST operators", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: {
          "tags@cs": "{5}",
          "amount@gte": 1000,
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
            "amount@gte": 1000,
          },
        }),
      );
    });

    it("should remove empty arrays from filter", async () => {
      await unifiedDataProvider.getList("contacts", {
        filter: {
          tags: [],
          name: "John",
        },
        sort: { field: "id", order: "ASC" },
        pagination: { page: 1, perPage: 10 },
      });

      // Check that empty array was removed
      expect(mockGetList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: {
            name: "John",
          },
        }),
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
            "email@cs": "{\"test@example.com\",\"test2@example.com\"}",
            first_name: "John",
            "last_name@ilike": "%doe%",
          },
        }),
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
            "phone@cs": "{\"+1234567890\",\"+0987654321\"}",
          },
        }),
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
            deleted_at: null,
          },
        }),
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
        }),
      );
    });
  });
});