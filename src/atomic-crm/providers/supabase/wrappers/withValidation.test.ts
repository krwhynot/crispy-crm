/**
 * Tests for withValidation wrapper
 *
 * TDD: These tests define the expected behavior for validation integration
 *
 * Key behaviors to preserve:
 * 1. Validate create data before calling provider
 * 2. Validate update data before calling provider
 * 3. Clean filter fields on getList
 * 4. Pass through requests for resources without validation
 * 5. Transform Zod errors to React Admin validation format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import { withValidation } from "./withValidation";
import { ValidationService } from "../services";

// Mock the ValidationService
vi.mock("../services", () => ({
  ValidationService: vi.fn().mockImplementation(() => ({
    validate: vi.fn(),
    hasValidation: vi.fn(),
    validateFilters: vi.fn((_resource, filters) => filters),
  })),
}));

describe("withValidation", () => {
  let mockProvider: DataProvider;
  let mockValidationService: {
    validate: ReturnType<typeof vi.fn>;
    hasValidation: ReturnType<typeof vi.fn>;
    validateFilters: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock DataProvider
    mockProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1, name: "Created" } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1, name: "Updated" } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };

    // Get reference to mock validation service methods
    mockValidationService = {
      validate: vi.fn(),
      hasValidation: vi.fn().mockReturnValue(true),
      validateFilters: vi.fn((_resource, filters) => filters),
    };

    // Override the mock implementation for this test
    vi.mocked(ValidationService).mockImplementation(() => mockValidationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("create validation", () => {
    it("should validate data before create", async () => {
      const wrappedProvider = withValidation(mockProvider);
      const createData = { name: "Test Contact", email: "test@example.com" };

      await wrappedProvider.create("contacts", { data: createData });

      expect(mockValidationService.validate).toHaveBeenCalledWith("contacts", "create", createData);
      expect(mockProvider.create).toHaveBeenCalledWith("contacts", { data: createData });
    });

    it("should throw validation error on invalid create data", async () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            path: ["email"],
            code: "invalid_string",
            validation: "email",
            message: "Invalid email format",
          },
          { path: ["name"], code: "invalid_type", input: undefined, message: "Required" },
        ],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(
        wrappedProvider.create("contacts", { data: { invalid: "data" } })
      ).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            email: "Please enter a valid email address.",
            name: "This field is required.",
          }),
        },
      });

      // Provider create should NOT be called when validation fails
      expect(mockProvider.create).not.toHaveBeenCalled();
    });

    it("should pass through create for resources without validation", async () => {
      mockValidationService.hasValidation.mockReturnValue(false);
      mockValidationService.validate.mockResolvedValue(undefined);

      const wrappedProvider = withValidation(mockProvider);
      const createData = { name: "Unknown Resource" };

      await wrappedProvider.create("unknown_resource", { data: createData });

      // Validation is still called, but service handles "no validation" case
      expect(mockProvider.create).toHaveBeenCalledWith("unknown_resource", {
        data: createData,
      });
    });
  });

  describe("update validation", () => {
    it("should validate data before update", async () => {
      const wrappedProvider = withValidation(mockProvider);
      const updateData = { name: "Updated Name" };
      const previousData = { id: 1, name: "Old Name" } as RaRecord;

      await wrappedProvider.update("contacts", {
        id: 1,
        data: updateData,
        previousData,
      });

      // Validation should receive data with id merged (since schemas like taskUpdateSchema require id)
      expect(mockValidationService.validate).toHaveBeenCalledWith("contacts", "update", {
        ...updateData,
        id: 1,
      });
      expect(mockProvider.update).toHaveBeenCalled();
    });

    it("should throw validation error on invalid update data", async () => {
      const zodError = {
        name: "ZodError",
        issues: [{ path: ["status"], code: "invalid_enum_value", message: "Invalid enum value" }],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(
        wrappedProvider.update("contacts", {
          id: 1,
          data: { status: "invalid" },
          previousData: { id: 1 } as RaRecord,
        })
      ).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            status: "Please select a valid option.",
          }),
        },
      });

      expect(mockProvider.update).not.toHaveBeenCalled();
    });
  });

  describe("filter validation", () => {
    it("should validate and clean filters on getList", async () => {
      const cleanedFilters = { status: "active" };
      mockValidationService.validateFilters.mockReturnValue(cleanedFilters);

      const wrappedProvider = withValidation(mockProvider);

      await wrappedProvider.getList("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: { status: "active", invalid_field: "should_be_removed" },
      });

      expect(mockValidationService.validateFilters).toHaveBeenCalledWith("contacts", {
        status: "active",
        invalid_field: "should_be_removed",
      });

      // Provider should receive cleaned filters
      expect(mockProvider.getList).toHaveBeenCalledWith("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: cleanedFilters,
      });
    });

    it("should handle getList without filters", async () => {
      const wrappedProvider = withValidation(mockProvider);

      await wrappedProvider.getList("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      expect(mockProvider.getList).toHaveBeenCalled();
    });

    it("should propagate errors when validateFilters throws (fail-fast)", async () => {
      // Configure mock to throw error on invalid filters
      const validationError: Error & { status?: number } = new Error(
        "Invalid filter field(s) for contacts: [invalid_field]"
      );
      validationError.status = 400;
      mockValidationService.validateFilters.mockImplementation(() => {
        throw validationError;
      });

      const wrappedProvider = withValidation(mockProvider);

      await expect(
        wrappedProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: { invalid_field: "value" },
        })
      ).rejects.toThrow("Invalid filter field");

      // Provider should NOT be called if validation fails
      expect(mockProvider.getList).not.toHaveBeenCalled();
    });
  });

  describe("passthrough methods", () => {
    it("should pass through getOne without validation", async () => {
      const wrappedProvider = withValidation(mockProvider);

      await wrappedProvider.getOne("contacts", { id: 1 });

      expect(mockValidationService.validate).not.toHaveBeenCalled();
      expect(mockProvider.getOne).toHaveBeenCalledWith("contacts", { id: 1 });
    });

    it("should pass through getMany without validation", async () => {
      const wrappedProvider = withValidation(mockProvider);

      await wrappedProvider.getMany("contacts", { ids: [1, 2, 3] });

      expect(mockValidationService.validate).not.toHaveBeenCalled();
      expect(mockProvider.getMany).toHaveBeenCalledWith("contacts", { ids: [1, 2, 3] });
    });

    it("should pass through delete without validation", async () => {
      const wrappedProvider = withValidation(mockProvider);

      await wrappedProvider.delete("contacts", {
        id: 1,
        previousData: { id: 1 } as RaRecord,
      });

      expect(mockValidationService.validate).not.toHaveBeenCalled();
      expect(mockProvider.delete).toHaveBeenCalled();
    });
  });

  describe("error transformation", () => {
    it("should transform nested path Zod errors correctly", async () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            path: ["address", "city"],
            code: "invalid_type",
            input: undefined,
            message: "City is required",
          },
          {
            path: ["contacts", 0, "email"],
            code: "invalid_string",
            validation: "email",
            message: "Invalid email",
          },
        ],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(wrappedProvider.create("organizations", { data: {} })).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            "address.city": "This field is required.",
            "contacts.0.email": "Please enter a valid email address.",
          }),
        },
      });
    });

    it("should handle non-Zod errors by passing through", async () => {
      const regularError = new Error("Database connection failed");
      mockValidationService.validate.mockRejectedValue(regularError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(wrappedProvider.create("contacts", { data: {} })).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should transform single unrecognized_keys error to field-specific error", async () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            path: [],
            code: "unrecognized_keys",
            keys: ["unknownField"],
            message: "Unrecognized keys",
          },
        ],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(
        wrappedProvider.create("contacts", { data: { unknownField: "value" } })
      ).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            unknownField: "Unknown field 'unknownField' is not allowed",
          }),
        },
      });
    });

    it("should transform multiple unrecognized_keys to separate field errors", async () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            path: [],
            code: "unrecognized_keys",
            keys: ["foo", "bar", "baz"],
            message: "Unrecognized keys",
          },
        ],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(wrappedProvider.create("contacts", { data: {} })).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            foo: "Unknown field 'foo' is not allowed",
            bar: "Unknown field 'bar' is not allowed",
            baz: "Unknown field 'baz' is not allowed",
          }),
        },
      });
    });

    it("should handle mixed errors (unrecognized_keys + standard field errors)", async () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            path: [],
            code: "unrecognized_keys",
            keys: ["unknownField"],
            message: "Unrecognized keys",
          },
          { path: ["email"], message: "Invalid email format" },
        ],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(wrappedProvider.create("contacts", { data: {} })).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            unknownField: "Unknown field 'unknownField' is not allowed",
            email: "Invalid email format",
          }),
        },
      });
    });

    it("should handle unrecognized_keys without keys array (fallback to _error)", async () => {
      const zodError = {
        name: "ZodError",
        issues: [{ path: [], code: "unrecognized_keys", message: "Unrecognized keys" }],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(wrappedProvider.create("contacts", { data: {} })).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            _error: "Unexpected fields provided.",
          }),
        },
      });
    });

    it("should handle unrecognized_keys with empty keys array (fallback to _error)", async () => {
      const zodError = {
        name: "ZodError",
        issues: [{ path: [], code: "unrecognized_keys", keys: [], message: "Unrecognized keys" }],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(wrappedProvider.create("contacts", { data: {} })).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            _error: "Unexpected fields provided.",
          }),
        },
      });
    });
  });

  describe("custom methods passthrough", () => {
    it("should preserve custom methods on the provider", async () => {
      const extendedProvider = {
        ...mockProvider,
        customRpc: vi.fn().mockResolvedValue({ success: true }),
      };

      const wrappedProvider = withValidation(extendedProvider);

      const extendedWrappedProvider = wrappedProvider as typeof wrappedProvider & {
        customRpc: (arg: string) => Promise<{ success: boolean }>;
      };
      expect(extendedWrappedProvider.customRpc).toBeDefined();
      const result = await extendedWrappedProvider.customRpc("test");
      expect(result).toEqual({ success: true });
    });
  });
});
