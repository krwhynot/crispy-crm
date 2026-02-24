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
 * 6. Use structured logger for production Sentry integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import { HttpError } from "react-admin";
import { withErrorLogging } from "./withErrorLogging";
import { logger } from "@/lib/logger";

// Mock the logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("withErrorLogging", () => {
  let mockProvider: DataProvider;

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

    // Clear mock calls
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should pass through successful create calls unchanged", async () => {
      const expectedResult = { data: { id: 1, name: "New Contact" } };
      (mockProvider.create as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      const result = await wrappedProvider.create("contacts", {
        data: { name: "New Contact" },
      });
      expect(result).toEqual(expectedResult);
      expect(logger.error).not.toHaveBeenCalled();
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

      // Verify structured logging with logger
      expect(logger.error).toHaveBeenCalledWith(
        "DataProvider operation failed",
        error,
        expect.objectContaining({
          method: "getList",
          resource: "contacts",
          operation: "DataProvider.getList",
          filter: { status: "active" },
          pagination: { page: 1, perPage: 10 },
        })
      );
    });

    it("should redact data field in logs (show hasData flag instead)", async () => {
      const error = new Error("Validation failed");
      (mockProvider.create as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(
        wrappedProvider.create("contacts", {
          data: { name: "Secret", email: "secret@example.com" },
        })
      ).rejects.toThrow();

      // Verify data is redacted (hasData flag, not actual data)
      expect(logger.error).toHaveBeenCalledWith(
        "DataProvider operation failed",
        error,
        expect.objectContaining({
          hasData: true,
          method: "create",
          resource: "contacts",
        })
      );
      // Ensure actual data is NOT in the context
      const callContext = vi.mocked(logger.error).mock.calls[0][2];
      expect(callContext).not.toHaveProperty("data");
      expect(callContext).not.toHaveProperty("name");
      expect(callContext).not.toHaveProperty("email");
    });

    it("should log errors for non-Error types", async () => {
      const error = "String error";
      (mockProvider.getOne as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(wrappedProvider.getOne("contacts", { id: 1 })).rejects.toThrow();

      // Should convert to Error
      expect(logger.error).toHaveBeenCalledWith(
        "DataProvider operation failed",
        expect.any(Error),
        expect.objectContaining({
          method: "getOne",
          resource: "contacts",
        })
      );
    });

    it("should serialize plain object errors with JSON.stringify, not String() (Sentry #7283831143)", async () => {
      // Regression: plain objects were serialized as "[object Object]" via String()
      const plainObjectError = { code: "CUSTOM", detail: "something went wrong" };
      (mockProvider.getOne as ReturnType<typeof vi.fn>).mockRejectedValue(plainObjectError);

      const wrappedProvider = withErrorLogging(mockProvider);
      await expect(wrappedProvider.getOne("contacts", { id: 1 })).rejects.toBeDefined();

      // The error passed to logger should contain JSON, not "[object Object]"
      const loggedError = vi.mocked(logger.error).mock.calls[0][1] as Error;
      expect(loggedError.message).not.toBe("[object Object]");
      expect(loggedError.message).toContain("CUSTOM");
      expect(loggedError.message).toContain("something went wrong");
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

      // Validation errors are expected control flow — logged at debug, NOT error level
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        "DataProvider validation error (expected)",
        expect.objectContaining({
          method: "create",
          resource: "contacts",
          validationErrors: {
            email: "Invalid email format",
            name: "Name is required",
          },
        })
      );
    });

    it("should log validation errors at debug level, not error level", async () => {
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

      // Should log at debug level, not error level
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        "DataProvider validation error (expected)",
        expect.objectContaining({
          validationErrors: { email: "Invalid email format" },
        })
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
        const err = error as { body?: { errors?: Record<string, string> } };
        expect(err.body?.errors).toBeDefined();
        expect(err.body?.errors?.email || err.body?.errors?._error).toBeDefined();
      }
    });

    it("should wrap transformed Supabase errors in HttpError (not plain object)", async () => {
      const supabaseError = {
        message: "Unique violation",
        code: "23505",
        details: 'Key (column "name")=(Acme) already exists.',
      };
      (mockProvider.update as ReturnType<typeof vi.fn>).mockRejectedValue(supabaseError);

      const wrappedProvider = withErrorLogging(mockProvider);
      try {
        await wrappedProvider.update("organizations", {
          id: 1,
          data: { name: "Acme" },
          previousData: { id: 1 } as RaRecord,
        });
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        // Must be an Error instance (not plain object) for proper Sentry serialization
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(HttpError);
        // Must still have body.errors for React Admin validation display
        const httpErr = error as HttpError;
        expect(httpErr.body?.errors).toBeDefined();
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
        expect(logger.error).toHaveBeenCalled();
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
      const extendedWrappedProvider = wrappedProvider as typeof wrappedProvider & {
        customMethod: () => Promise<{ success: boolean }>;
      };
      expect(extendedWrappedProvider.customMethod).toBeDefined();
      const result = await extendedWrappedProvider.customMethod();
      expect(result).toEqual({ success: true });
    });
  });

  describe("success audit logging", () => {
    it("should log success for delete operation on any resource", async () => {
      const expectedResult = { data: { id: 123 } };
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.delete("contacts", { id: 123 });

      expect(logger.info).toHaveBeenCalledWith(
        "DataProvider audit: sensitive operation succeeded",
        expect.objectContaining({
          method: "delete",
          resource: "contacts",
          operation: "DataProvider.delete",
          recordId: 123,
        })
      );
    });

    it("should log success for deleteMany operation on any resource", async () => {
      const expectedResult = { data: [1, 2, 3] };
      (mockProvider.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.deleteMany("opportunities", { ids: [1, 2, 3] });

      expect(logger.info).toHaveBeenCalledWith(
        "DataProvider audit: sensitive operation succeeded",
        expect.objectContaining({
          method: "deleteMany",
          resource: "opportunities",
          operation: "DataProvider.deleteMany",
          recordId: [1, 2, 3],
        })
      );
    });

    it("should log success for operations on sales resource", async () => {
      const expectedResult = { data: { id: 456, name: "John" } };
      (mockProvider.update as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.update("sales", { id: 456, data: { name: "John" } });

      expect(logger.info).toHaveBeenCalledWith(
        "DataProvider audit: sensitive operation succeeded",
        expect.objectContaining({
          method: "update",
          resource: "sales",
          operation: "DataProvider.update",
          recordId: 456,
        })
      );
    });

    it("should log success for operations on opportunities resource", async () => {
      const expectedResult = { data: { id: 789, title: "Big Deal" } };
      (mockProvider.create as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withErrorLogging(mockProvider);
      await wrappedProvider.create("opportunities", { data: { title: "Big Deal" } });

      expect(logger.info).toHaveBeenCalledWith(
        "DataProvider audit: sensitive operation succeeded",
        expect.objectContaining({
          method: "create",
          resource: "opportunities",
          operation: "DataProvider.create",
          recordId: 789,
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

      expect(logger.info).not.toHaveBeenCalled();
    });
  });
});
