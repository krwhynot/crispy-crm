/**
 * Error handling tests for unifiedDataProvider
 * Coverage: network failures, RLS errors, validation errors, constraint violations
 *
 * Following "fail fast" principle - no circuit breakers, no retries
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { unifiedDataProvider } from "./unifiedDataProvider";

// Create mock functions that will be reused
const mockGetList = vi.fn();
const mockGetOne = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockGetMany = vi.fn();
const mockGetManyReference = vi.fn();
const mockUpdateMany = vi.fn();
const mockDeleteMany = vi.fn();

// Mock the base supabase provider
vi.mock("ra-supabase-core", () => ({
  supabaseDataProvider: () => ({
    getList: mockGetList,
    getOne: mockGetOne,
    getMany: mockGetMany,
    getManyReference: mockGetManyReference,
    create: mockCreate,
    update: mockUpdate,
    updateMany: mockUpdateMany,
    delete: mockDelete,
    deleteMany: mockDeleteMany,
  }),
}));

// Mock the supabase client
vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
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

vi.mock("../../validation/rpc", () => ({
  RPC_SCHEMAS: {},
  edgeFunctionSchemas: {},
}));

describe("unifiedDataProvider - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      mockDelete.mockRejectedValue(new Error("Network error"));

      await expect(
        unifiedDataProvider.delete("contacts", {
          id: 1,
          previousData: { id: 1 },
        })
      ).rejects.toThrow("Network error");
    });

    it("should propagate network errors on getOne", async () => {
      mockGetOne.mockRejectedValue(new Error("ERR_NETWORK"));

      await expect(
        unifiedDataProvider.getOne("contacts", { id: 1 })
      ).rejects.toThrow("ERR_NETWORK");
    });
  });

  describe("RLS (Row Level Security) errors", () => {
    it("should propagate permission denied on getList", async () => {
      mockGetList.mockRejectedValue({
        code: "42501",
        message: "permission denied for table contacts",
      });

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).rejects.toMatchObject({
        code: "42501",
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
      mockUpdate.mockRejectedValue({
        code: "42501",
        message: "permission denied for table tasks",
        details: "RLS policy prevents update",
      });

      await expect(
        unifiedDataProvider.update("tasks", {
          id: 1,
          data: { title: "Updated Task" },
          previousData: { id: 1, title: "Original Task" },
        })
      ).rejects.toMatchObject({
        code: "42501",
      });
    });

    it("should propagate RLS errors on delete", async () => {
      mockDelete.mockRejectedValue({
        code: "42501",
        message: "permission denied for table contacts",
      });

      await expect(
        unifiedDataProvider.delete("contacts", {
          id: 1,
          previousData: { id: 1 },
        })
      ).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  describe("database constraint violations", () => {
    it("should propagate unique constraint violations on create", async () => {
      mockCreate.mockRejectedValue({
        code: "23505",
        message: 'duplicate key value violates unique constraint "contacts_email_key"',
        details: "Key (email)=(test@example.com) already exists.",
      });

      await expect(
        unifiedDataProvider.create("contacts", {
          data: { email: [{ email: "test@example.com" }] },
        })
      ).rejects.toMatchObject({
        code: "23505",
        message: expect.stringContaining("duplicate key"),
      });
    });

    it("should propagate foreign key constraint violations", async () => {
      mockCreate.mockRejectedValue({
        code: "23503",
        message: 'insert or update on table "contacts" violates foreign key constraint',
        details: 'Key (organization_id)=(999) is not present in table "organizations".',
      });

      await expect(
        unifiedDataProvider.create("contacts", {
          data: { organization_id: 999 },
        })
      ).rejects.toMatchObject({
        code: "23503",
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
      mockCreate.mockRejectedValue({
        code: "23514",
        message: 'new row for relation "products" violates check constraint',
        details: "Check constraint failed",
      });

      await expect(
        unifiedDataProvider.create("products", {
          data: { status: "invalid_status" },
        })
      ).rejects.toMatchObject({
        code: "23514",
      });
    });
  });

  describe("invalid data errors", () => {
    it("should propagate invalid JSON errors", async () => {
      mockCreate.mockRejectedValue({
        code: "22P02",
        message: "invalid input syntax for type json",
      });

      await expect(
        unifiedDataProvider.create("contacts", {
          data: { email: "not-a-json-array" },
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

      await expect(
        unifiedDataProvider.getOne("contacts", { id: 99999 })
      ).rejects.toMatchObject({
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
      mockDelete.mockRejectedValue({
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
    it("should propagate invalid filter syntax errors", async () => {
      mockGetList.mockRejectedValue({
        code: "PGRST102",
        message: "Invalid filter syntax",
      });

      await expect(
        unifiedDataProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: { "invalid@operator": "value" },
        })
      ).rejects.toMatchObject({
        code: "PGRST102",
      });
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

      await expect(
        unifiedDataProvider.getMany("contacts", { ids: [1, 2, 3] })
      ).rejects.toThrow("Batch fetch failed");
    });

    it("should propagate errors on updateMany", async () => {
      mockUpdateMany.mockRejectedValue({
        code: "42501",
        message: "permission denied",
      });

      await expect(
        unifiedDataProvider.updateMany("contacts", {
          ids: [1, 2, 3],
          data: { tags: ["test"] },
        })
      ).rejects.toMatchObject({
        code: "42501",
      });
    });

    it("should propagate errors on deleteMany", async () => {
      mockDeleteMany.mockRejectedValue({
        code: "23503",
        message: "foreign key constraint violation",
      });

      await expect(
        unifiedDataProvider.deleteMany("organizations", {
          ids: [1, 2, 3],
        })
      ).rejects.toMatchObject({
        code: "23503",
      });
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
      mockCreate.mockRejectedValue({
        code: "40001",
        message: "could not serialize access due to concurrent update",
      });

      await expect(
        unifiedDataProvider.create("activities", {
          data: { activity_type: "call" },
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
