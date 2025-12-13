/**
 * Error handling tests for unifiedDataProvider
 * Coverage: network failures, RLS errors, validation errors, constraint violations
 *
 * Following "fail fast" principle - no circuit breakers, no retries
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to create mocks that can be used in vi.mock factories
const mocks = vi.hoisted(() => ({
  mockGetList: vi.fn(),
  mockGetOne: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockGetMany: vi.fn(),
  mockGetManyReference: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockGetUser: vi.fn(),
}));

// Destructure for easier access
const {
  mockGetList,
  mockGetOne,
  mockCreate,
  mockUpdate,
  mockGetMany,
  mockUpdateMany,
  mockDeleteMany,
} = mocks;

// Mock the base supabase provider
vi.mock("ra-supabase-core", () => ({
  supabaseDataProvider: () => ({
    getList: mocks.mockGetList,
    getOne: mocks.mockGetOne,
    getMany: mocks.mockGetMany,
    getManyReference: mocks.mockGetManyReference,
    create: mocks.mockCreate,
    update: mocks.mockUpdate,
    updateMany: mocks.mockUpdateMany,
    delete: mocks.mockDelete,
    deleteMany: mocks.mockDeleteMany,
  }),
}));

// Mock the supabase client
vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

// Mock validation to pass by default (we'll override for specific tests)
vi.mock("../../validation/opportunities", () => ({
  validateOpportunityForm: vi.fn().mockResolvedValue(undefined),
  validateCreateOpportunity: vi.fn().mockResolvedValue(undefined),
  validateUpdateOpportunity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../validation/organizations", () => ({
  validateOrganizationForSubmission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../validation/contacts", () => ({
  validateContactForm: vi.fn().mockResolvedValue(undefined),
  validateCreateContact: vi.fn().mockResolvedValue(undefined),
  validateUpdateContact: vi.fn().mockResolvedValue(undefined),
  validateContactOrganization: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../validation/tags", () => ({
  validateCreateTag: vi.fn().mockReturnValue({}),
  validateUpdateTag: vi.fn().mockReturnValue({}),
}));

vi.mock("../../validation/notes", () => ({
  validateCreateContactNote: vi.fn().mockReturnValue({}),
  validateUpdateContactNote: vi.fn().mockReturnValue({}),
  validateCreateOpportunityNote: vi.fn().mockReturnValue({}),
  validateUpdateOpportunityNote: vi.fn().mockReturnValue({}),
  validateContactNoteForSubmission: vi.fn().mockReturnValue({}),
  validateOpportunityNoteForSubmission: vi.fn().mockReturnValue({}),
}));

vi.mock("../../validation/products", () => ({
  validateProductForm: vi.fn().mockResolvedValue(undefined),
  validateOpportunityProduct: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../validation/activities", () => ({
  validateActivitiesForm: vi.fn().mockResolvedValue(undefined),
  validateEngagementsForm: vi.fn().mockResolvedValue(undefined),
  validateInteractionsForm: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../validation/rpc", () => ({
  RPC_SCHEMAS: {},
  edgeFunctionSchemas: {},
}));

vi.mock("./filterRegistry", () => ({
  filterableFields: {
    contacts: ["id", "first_name", "last_name", "email", "tags", "q"],
    contacts_summary: ["id", "first_name", "last_name", "email", "tags", "q"],
    opportunities: ["id", "name", "stage", "amount"],
    opportunities_summary: ["id", "name", "stage", "amount"],
    organizations: ["id", "name"],
    tags: ["id", "name"],
    activities: ["id", "activity_type", "contact_id"],
  },
  isValidFilterField: vi.fn().mockReturnValue(true),
}));

vi.mock("./dataProviderUtils", () => ({
  getDatabaseResource: vi.fn((resource: string) => `${resource}_summary`),
  applySearchParams: vi.fn((resource: string, params: any) => params),
  normalizeResponseData: vi.fn((resource: string, data: any) => data),
  transformArrayFilters: vi.fn((filters: any) => filters),
  escapeForPostgREST: vi.fn((value: any) => String(value)),
}));

import { supabase } from "./supabase";
import { unifiedDataProvider } from "./unifiedDataProvider";

describe("unifiedDataProvider - Error Handling", () => {
  beforeEach(() => {
    // TD-001 FIX: Use resetAllMocks() instead of clearAllMocks()
    // clearAllMocks() only clears call history, NOT mock implementations
    // resetAllMocks() clears BOTH, preventing state leakage between tests
    vi.resetAllMocks();

    // Set up default auth mocks for each test
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "user-123" }, access_token: "test-token" } },
      error: null,
    } as any);

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    } as any);
  });

  describe("network errors", () => {
    it("should propagate network timeout errors on getList", async () => {
      mockGetList.mockRejectedValue(new Error("Network timeout"));

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).rejects.toThrow("Network timeout");
    });

    it("should propagate connection errors on create", async () => {
      mockCreate.mockRejectedValue(new Error("Connection refused"));

      await expect(
        unifiedDataProvider.create("contacts", {
          data: { first_name: "John", last_name: "Doe" },
        })
      ).rejects.toThrow("Connection refused");
    });

    it("should propagate DNS resolution errors on update", async () => {
      mockUpdate.mockRejectedValue(new Error("ENOTFOUND"));

      await expect(
        unifiedDataProvider.update("contacts", {
          id: 1,
          data: { first_name: "Jane" },
          previousData: { id: 1, first_name: "John" },
        })
      ).rejects.toThrow("ENOTFOUND");
    });

    it("should propagate network errors on delete", async () => {
      // TD-001 RESOLVED: Mock isolation fixed by using vi.resetAllMocks() in beforeEach
      // NOTE: All resources use SOFT DELETE (update deleted_at), not hard delete
      // So delete errors propagate through mockUpdate, not mockDelete
      mockUpdate.mockRejectedValue(new Error("Network unreachable"));

      await expect(
        unifiedDataProvider.delete("tags", {
          id: 1,
          previousData: { id: 1 },
        })
      ).rejects.toThrow("Network unreachable");
    });

    it("should propagate network errors on getOne", async () => {
      mockGetOne.mockRejectedValue(new Error("ERR_NETWORK"));

      await expect(unifiedDataProvider.getOne("contacts", { id: 1 })).rejects.toThrow(
        "ERR_NETWORK"
      );
    });
  });

  describe("RLS (Row Level Security) errors", () => {
    it("should propagate permission denied on getList", async () => {
      mockGetList.mockRejectedValue({
        message: "permission denied for table contacts",
      });

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining("permission denied"),
      });
    });

    it("should propagate RLS policy violation on create", async () => {
      mockCreate.mockRejectedValue({
        code: "PGRST301",
        message: "new row violates row-level security policy",
      });

      await expect(
        unifiedDataProvider.create("opportunities", {
          data: { name: "Test Opportunity" },
        })
      ).rejects.toMatchObject({
        code: "PGRST301",
      });
    });

    it("should propagate RLS denial on update", async () => {
      vi.clearAllMocks();
      mockUpdate.mockRejectedValue({
        message: "permission denied for table tags",
        details: "RLS policy prevents update",
      });

      await expect(
        unifiedDataProvider.update("tags", {
          id: 1,
          data: { name: "Updated Tag" },
          previousData: { id: 1, name: "Original Tag" },
        })
      ).rejects.toThrow();
    });

    it("should propagate RLS errors on delete", async () => {
      // NOTE: All resources use SOFT DELETE - delete errors come through mockUpdate
      mockUpdate.mockRejectedValue({
        message: "permission denied for table tags",
      });

      await expect(
        unifiedDataProvider.delete("tags", {
          id: 1,
          previousData: { id: 1 },
        })
      ).rejects.toThrow();
    });
  });

  describe("database constraint violations", () => {
    it("should propagate unique constraint violations on create", async () => {
      vi.clearAllMocks();
      mockCreate.mockRejectedValue({
        code: "23505",
        message: 'duplicate key value violates unique constraint "tags_name_key"',
        details: "Key (name)=(existing-tag) already exists.",
      });

      await expect(
        unifiedDataProvider.create("tags", {
          data: { name: "existing-tag" },
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining("duplicate key"),
      });
    });

    it("should propagate foreign key constraint violations", async () => {
      vi.clearAllMocks();
      // Use Error object with code and details properties to match Supabase error format
      const error: any = new Error(
        'insert or update on table "activities" violates foreign key constraint'
      );
      error.code = "23503";
      error.details = 'Key (contact_id)=(999) is not present in table "contacts".';
      mockCreate.mockRejectedValue(error);

      await expect(
        unifiedDataProvider.create("activities", {
          data: { contact_id: 999, activity_type: "call" },
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining("foreign key"),
      });
    });

    it("should propagate not-null constraint violations", async () => {
      mockCreate.mockRejectedValue({
        code: "23502",
        message: 'null value in column "name" violates not-null constraint',
      });

      await expect(
        unifiedDataProvider.create("organizations", {
          data: {},
        })
      ).rejects.toMatchObject({
        code: "23502",
        message: expect.stringContaining("not-null"),
      });
    });

    it("should propagate check constraint violations", async () => {
      vi.clearAllMocks();
      mockCreate.mockRejectedValue({
        code: "23514",
        message: 'new row for relation "tags" violates check constraint',
        details: "Check constraint failed",
      });

      await expect(
        unifiedDataProvider.create("tags", {
          data: { name: "" }, // Assuming empty name violates check
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining("check constraint"),
        errors: expect.any(Object),
      });
    });
  });

  describe("invalid data errors", () => {
    it("should propagate invalid JSON errors", async () => {
      vi.clearAllMocks();
      mockCreate.mockRejectedValue({
        code: "22P02",
        message: "invalid input syntax for type json",
      });

      await expect(
        unifiedDataProvider.create("tags", {
          data: { name: "test-tag", invalid_field: "bad-json" },
        })
      ).rejects.toMatchObject({
        code: "22P02",
      });
    });

    it("should propagate invalid UUID errors", async () => {
      mockGetOne.mockRejectedValue({
        code: "22P02",
        message: "invalid input syntax for type uuid",
      });

      await expect(
        unifiedDataProvider.getOne("contacts", { id: "not-a-uuid" })
      ).rejects.toMatchObject({
        code: "22P02",
      });
    });

    it("should propagate type conversion errors", async () => {
      mockUpdate.mockRejectedValue({
        code: "22007",
        message: "invalid datetime format",
      });

      await expect(
        unifiedDataProvider.update("opportunities", {
          id: 1,
          data: { estimated_close_date: "invalid-date" },
          previousData: { id: 1 },
        })
      ).rejects.toMatchObject({
        code: "22007",
      });
    });
  });

  describe("resource not found errors", () => {
    it("should propagate 404 errors on getOne", async () => {
      mockGetOne.mockRejectedValue({
        code: "PGRST116",
        message: "The result contains 0 rows",
      });

      await expect(unifiedDataProvider.getOne("contacts", { id: 99999 })).rejects.toMatchObject({
        code: "PGRST116",
      });
    });

    it("should propagate record not found on update", async () => {
      mockUpdate.mockRejectedValue({
        code: "PGRST116",
        message: "The result contains 0 rows",
      });

      await expect(
        unifiedDataProvider.update("contacts", {
          id: 99999,
          data: { first_name: "John" },
          previousData: { id: 99999 },
        })
      ).rejects.toMatchObject({
        code: "PGRST116",
      });
    });

    it("should propagate record not found on delete", async () => {
      // NOTE: All resources use SOFT DELETE - delete errors come through mockUpdate
      mockUpdate.mockRejectedValue({
        code: "PGRST116",
        message: "The result contains 0 rows",
      });

      await expect(
        unifiedDataProvider.delete("contacts", {
          id: 99999,
          previousData: { id: 99999 },
        })
      ).rejects.toMatchObject({
        code: "PGRST116",
      });
    });
  });

  describe("query syntax errors", () => {
    it("should throw HttpError on invalid filter fields (fail-fast validation)", async () => {
      // UPDATED: With fail-fast validation, invalid filters are caught BEFORE
      // reaching the database, so we get HttpError(400) instead of PGRST102
      // This is the desired behavior per Engineering Constitution
      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: { "invalid@operator": "value" },
        })
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining("invalid@operator"),
      });

      // The database should never be called - validation catches it first
      expect(mockGetList).not.toHaveBeenCalled();
    });

    it("should propagate column does not exist errors", async () => {
      mockGetList.mockRejectedValue({
        code: "42703",
        message: 'column "nonexistent_column" does not exist',
      });

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "nonexistent_column", order: "ASC" },
          filter: {},
        })
      ).rejects.toMatchObject({
        code: "42703",
      });
    });
  });

  describe("batch operation errors", () => {
    it("should propagate errors on getMany", async () => {
      mockGetMany.mockRejectedValue(new Error("Batch fetch failed"));

      await expect(unifiedDataProvider.getMany("contacts", { ids: [1, 2, 3] })).rejects.toThrow(
        "Batch fetch failed"
      );
    });

    it("should propagate errors on updateMany", async () => {
      mockUpdateMany.mockRejectedValue({
        message: "permission denied",
      });

      await expect(
        unifiedDataProvider.updateMany("contacts", {
          ids: [1, 2, 3],
          data: { tags: ["test"] },
        })
      ).rejects.toMatchObject({});
    });

    it("should propagate errors on deleteMany", async () => {
      vi.clearAllMocks();
      mockDeleteMany.mockRejectedValue({
        message: "foreign key constraint violation",
      });

      await expect(
        unifiedDataProvider.deleteMany("tags", {
          ids: [1, 2, 3],
        })
      ).rejects.toMatchObject({});
    });
  });

  describe("transaction errors", () => {
    it("should propagate transaction deadlock errors", async () => {
      mockUpdate.mockRejectedValue({
        code: "40P01",
        message: "deadlock detected",
      });

      await expect(
        unifiedDataProvider.update("opportunities", {
          id: 1,
          data: { stage: "closed_won" },
          previousData: { id: 1, stage: "proposal" },
        })
      ).rejects.toMatchObject({
        code: "40P01",
      });
    });

    it("should propagate serialization failure errors", async () => {
      vi.clearAllMocks();
      mockCreate.mockRejectedValue({
        code: "40001",
        message: "could not serialize access due to concurrent update",
      });

      await expect(
        unifiedDataProvider.create("tags", {
          data: { name: "concurrent-tag" },
        })
      ).rejects.toMatchObject({
        code: "40001",
      });
    });
  });

  describe("rate limiting errors", () => {
    it("should propagate rate limit exceeded errors", async () => {
      mockGetList.mockRejectedValue({
        code: "PGRST000",
        message: "Too many requests",
        status: 429,
      });

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining("Too many requests"),
      });
    });
  });

  describe("authentication errors", () => {
    it("should propagate JWT expired errors", async () => {
      mockGetList.mockRejectedValue({
        code: "PGRST301",
        message: "JWT expired",
      });

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).rejects.toMatchObject({
        code: "PGRST301",
        message: expect.stringContaining("JWT"),
      });
    });

    it("should propagate invalid JWT errors", async () => {
      mockCreate.mockRejectedValue({
        code: "PGRST301",
        message: "Invalid JWT",
      });

      await expect(
        unifiedDataProvider.create("contacts", {
          data: { first_name: "John" },
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining("JWT"),
      });
    });
  });

  describe("edge cases", () => {
    it("should handle undefined error messages", async () => {
      mockGetList.mockRejectedValue(new Error());

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).rejects.toThrow();
    });

    it("should handle non-Error thrown values", async () => {
      mockCreate.mockRejectedValue("String error");

      await expect(
        unifiedDataProvider.create("contacts", {
          data: { first_name: "John" },
        })
      ).rejects.toBe("String error");
    });

    it("should handle error objects without code", async () => {
      mockUpdate.mockRejectedValue({
        message: "Unknown error",
      });

      await expect(
        unifiedDataProvider.update("contacts", {
          id: 1,
          data: { first_name: "Jane" },
          previousData: { id: 1 },
        })
      ).rejects.toMatchObject({
        message: "Unknown error",
      });
    });
  });
});
