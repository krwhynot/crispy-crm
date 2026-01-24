/**
 * Tests for withErrorLogging wrapper
 *
 * TDD: These tests define the expected behavior extracted from
 * unifiedDataProvider.ts lines 166-425 (logError, wrapMethod)
 *
 * Key behaviors to preserve:
 * 1. Log errors with structured context (method, resource, params, timestamp)
 * 2. Preserve original error for re-throwing
 * 3. Handle validation errors in React Admin format
 * 4. Handle Supabase errors with field extraction
 * 5. Handle idempotent delete (already deleted = success)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import { withErrorLogging } from "./withErrorLogging";

describe("withErrorLogging", () => {
  let mockProvider: DataProvider;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create mock DataProvider
    mockProvider = {
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

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful operations", () => {
    it("should pass through successful getList calls unchanged", async () => {
      const expectedResult = { data: [{ id: 1, name: "Test" }], total: 1 };
      (mockProvider.getList as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      const result = await wrappedProvider.getList("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });
      expect(result).toEqual(expectedResult);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should pass through successful create calls unchanged", async () => {
      const expectedResult = { data: { id: 1, name: "New Contact" } };
      (mockProvider.create as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      const result = await wrappedProvider.create("contacts", {
        data: { name: "New Contact" },
      });
      expect(result).toEqual(expectedResult);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("error logging", () => {
    it("should log errors with structured context", async () => {
      const error = new Error("Database connection failed");
      (mockProvider.getList as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(
        wrappedProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: { status: "active" },
        })
      ).rejects.toThrow("Database connection failed");

      // Verify structured logging
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DataProvider Error]",
        expect.objectContaining({
          method: "getList",
          resource: "contacts",
          params: expect.objectContaining({
            filter: { status: "active" },
            pagination: { page: 1, perPage: 10 },
          }),
          timestamp: expect.any(String),
        }),
        expect.objectContaining({
          error: "Database connection failed",
          stack: expect.any(String),
        })
      );
    });

    it("should redact data field in logs (show [Data Present] instead)", async () => {
      const error = new Error("Validation failed");
      (mockProvider.create as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(
        wrappedProvider.create("contacts", {
          data: { name: "Secret", email: "secret@example.com" },
        })
      ).rejects.toThrow();

      // Verify data is redacted
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DataProvider Error]",
        expect.objectContaining({
          params: expect.objectContaining({
            data: "[Data Present]",
          }),
        }),
        expect.anything()
      );
    });

    it("should include timestamp in ISO format", async () => {
      const error = new Error("Test error");
      (mockProvider.getOne as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(wrappedProvider.getOne("contacts", { id: 1 })).rejects.toThrow();

      const loggedContext = consoleErrorSpy.mock.calls[0][1];
      expect(loggedContext.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("validation error handling", () => {
    it("should preserve React Admin validation error format", async () => {
      const validationError = {
        message: "Validation failed",
        body: {
          errors: {
            email: "Invalid email format",
            name: "Name is required",
          },
        },
      };
      (mockProvider.create as ReturnType<typeof vi.fn>).mockRejectedValue(validationError);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(wrappedProvider.create("contacts", { data: {} })).rejects.toEqual(
        validationError
      );

      // Error should be passed through unchanged for React Admin
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should log validation errors in detail", async () => {
      const validationError = {
        message: "Validation failed",
        body: {
          errors: {
            email: "Invalid email format",
          },
        },
      };
      (mockProvider.update as ReturnType<typeof vi.fn>).mockRejectedValue(validationError);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(
        wrappedProvider.update("contacts", { id: 1, data: {}, previousData: {} as RaRecord })
      ).rejects.toThrow();

      // Should log validation errors separately
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Validation Errors Detail]",
        expect.stringContaining("email")
      );
    });
  });

  describe("Supabase error handling", () => {
    it("should extract field name from Supabase error details", async () => {
      const supabaseError = {
        message: "Database error",
        code: "23505",
        details: 'Key (column "email")=(test@test.com) already exists.',
      };
      (mockProvider.create as ReturnType<typeof vi.fn>).mockRejectedValue(supabaseError);

      const wrappedProvider = withErrorLogging(mockProvider);
      try {
        await wrappedProvider.create("contacts", { data: { email: "test@test.com" } });
      } catch (error: unknown) {
        // Should transform to validation error format with field
        const err = error as { errors?: Record<string, string> };
        expect(err.errors).toBeDefined();
        expect(err.errors?.email || err.errors?._error).toBeDefined();
      }
    });
  });

  describe("idempotent delete handling", () => {
    it("should treat already-deleted resource as success", async () => {
      const alreadyDeletedError = new Error("Cannot coerce the result to a single JSON object");
      const previousData = { id: 1, name: "Deleted Contact" } as RaRecord;
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockRejectedValue(alreadyDeletedError);

      const wrappedProvider = withErrorLogging(mockProvider);
      const result = await wrappedProvider.delete("contacts", {
        id: 1,
        previousData,
      });

      // Should return success with previousData
      expect(result).toEqual({ data: previousData });
    });

    it("should still throw non-idempotent delete errors", async () => {
      const realError = new Error("Foreign key constraint violation");
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockRejectedValue(realError);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(
        wrappedProvider.delete("contacts", {
          id: 1,
          previousData: { id: 1 } as RaRecord,
        })
      ).rejects.toThrow("Foreign key constraint violation");
    });
  });

  describe("all DataProvider methods wrapped", () => {
    const methods = [
      "getList",
      "getOne",
      "getMany",
      "getManyReference",
      "create",
      "update",
      "updateMany",
      "delete",
      "deleteMany",
    ] as const;

    methods.forEach((method) => {
      it(`should wrap ${method} with error logging`, async () => {
        const error = new Error(`${method} failed`);
        (mockProvider[method] as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        const wrappedProvider = withErrorLogging(mockProvider);
        const providerMethod = wrappedProvider[method] as (
          resource: string,
          params: Record<string, unknown>
        ) => Promise<unknown>;
        await expect(providerMethod("resource", {})).rejects.toThrow(`${method} failed`);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe("custom methods passthrough", () => {
    it("should preserve custom methods on the provider", async () => {
      const extendedProvider = {
        ...mockProvider,
        customMethod: vi.fn().mockResolvedValue({ success: true }),
      };

      const wrappedProvider = withErrorLogging(extendedProvider);
      expect((wrappedProvider as any).customMethod).toBeDefined();
      const result = await (wrappedProvider as any).customMethod();
      expect(result).toEqual({ success: true });
    });
  });

  describe("success audit logging", () => {
    let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    });

    it("should log success for delete operation on any resource", async () => {
      const expectedResult = { data: { id: 123 } };
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.delete("contacts", { id: 123 });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[DataProvider Audit]",
        expect.objectContaining({
          method: "delete",
          resource: "contacts",
          recordId: 123,
          timestamp: expect.any(String),
        })
      );
    });

    it("should log success for deleteMany operation on any resource", async () => {
      const expectedResult = { data: [1, 2, 3] };
      (mockProvider.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.deleteMany("opportunities", { ids: [1, 2, 3] });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[DataProvider Audit]",
        expect.objectContaining({
          method: "deleteMany",
          resource: "opportunities",
          recordId: [1, 2, 3],
          timestamp: expect.any(String),
        })
      );
    });

    it("should log success for operations on sales resource", async () => {
      const expectedResult = { data: { id: 456, name: "John" } };
      (mockProvider.update as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.update("sales", { id: 456, data: { name: "John" } });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[DataProvider Audit]",
        expect.objectContaining({
          method: "update",
          resource: "sales",
          recordId: 456,
          timestamp: expect.any(String),
        })
      );
    });

    it("should log success for operations on opportunities resource", async () => {
      const expectedResult = { data: { id: 789, title: "Big Deal" } };
      (mockProvider.create as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.create("opportunities", { data: { title: "Big Deal" } });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[DataProvider Audit]",
        expect.objectContaining({
          method: "create",
          resource: "opportunities",
          recordId: 789,
          timestamp: expect.any(String),
        })
      );
    });

    it("should NOT log success for read operations on non-sensitive resources", async () => {
      const expectedResult = { data: [{ id: 1, name: "Test" }], total: 1 };
      (mockProvider.getList as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.getList("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });
});
