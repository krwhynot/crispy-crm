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
    validateFilters: vi.fn((resource, filters) => filters),
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
      validateFilters: vi.fn((resource, filters) => filters),
    };

    // Override the mock implementation for this test
    (ValidationService as any).mockImplementation(() => mockValidationService);
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
          { path: ["email"], message: "Invalid email format" },
          { path: ["name"], message: "Required" },
        ],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(
        wrappedProvider.create("contacts", { data: { invalid: "data" } })
      ).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            email: "Invalid email format",
            name: "Required",
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
        issues: [{ path: ["status"], message: "Invalid enum value" }],
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
            status: "Invalid enum value",
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
      const validationError = new Error("Invalid filter field(s) for contacts: [invalid_field]");
      (validationError as any).status = 400;
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
          { path: ["address", "city"], message: "City is required" },
          { path: ["contacts", 0, "email"], message: "Invalid email" },
        ],
      };
      mockValidationService.validate.mockRejectedValue(zodError);

      const wrappedProvider = withValidation(mockProvider);

      await expect(wrappedProvider.create("organizations", { data: {} })).rejects.toMatchObject({
        body: {
          errors: expect.objectContaining({
            "address.city": "City is required",
            "contacts.0.email": "Invalid email",
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
  });

  describe("custom methods passthrough", () => {
    it("should preserve custom methods on the provider", async () => {
      const extendedProvider = {
        ...mockProvider,
        customRpc: vi.fn().mockResolvedValue({ success: true }),
      };

      const wrappedProvider = withValidation(extendedProvider);

      expect((wrappedProvider as any).customRpc).toBeDefined();
      const result = await (wrappedProvider as any).customRpc("test");
      expect(result).toEqual({ success: true });
    });
  });
});
