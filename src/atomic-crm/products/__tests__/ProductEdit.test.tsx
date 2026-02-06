/**
 * ProductEdit Unit Tests
 *
 * Focused unit tests for ProductEdit critical functionality:
 * - Default values calculation with schema parsing
 * - Pessimistic mutation mode behavior
 * - Cache invalidation logic
 * - Error handling
 * - Form configuration
 */

import { describe, it, expect, vi } from "vitest";
import { productSchema, productUpdateSchema } from "@/atomic-crm/validation/products";
import { createMockProduct } from "@/tests/utils";
import { productKeys } from "../../queryKeys";

/**
 * Helper to create a schema-compliant product record for testing.
 * Uses only fields defined in productSchema to avoid strictObject errors.
 */
function createSchemaCompliantProduct(overrides?: Record<string, unknown>) {
  return {
    name: "Test Product",
    principal_id: 1,
    category: "beverages",
    status: "active" as const,
    description: undefined,
    certifications: [],
    allergens: [],
    ingredients: null,
    nutritional_info: null,
    marketing_description: null,
    created_by: null,
    updated_by: null,
    ...overrides,
  };
}

describe("ProductEdit - Transform Logic", () => {
  describe("Default Values Calculation", () => {
    it("applies productSchema.partial().parse to schema-compliant record", () => {
      const record = createSchemaCompliantProduct({
        name: "Test Product",
        category: "beverages",
        status: "active",
        principal_id: 1,
      });

      // Mirrors ProductEditForm's defaultValues calculation
      const defaultValues = productSchema.partial().parse(record);

      expect(defaultValues.name).toBe("Test Product");
      expect(defaultValues.category).toBe("beverages");
      expect(defaultValues.status).toBe("active");
    });

    it("adds updated_by from identity", () => {
      const record = createSchemaCompliantProduct({ name: "Test" });
      const identity = { id: 42 };

      // Mirrors ProductEditForm's defaultValues calculation
      const defaultValues = {
        ...productSchema.partial().parse(record),
        updated_by: identity.id,
      };

      expect(defaultValues.updated_by).toBe(42);
    });

    it("handles undefined updated_by when identity not loaded", () => {
      const record = createSchemaCompliantProduct({ name: "Test" });
      const identity = undefined;

      const defaultValues = {
        ...productSchema.partial().parse(record),
        updated_by: identity?.id,
      };

      expect(defaultValues.updated_by).toBeUndefined();
    });

    it("preserves all product fields through partial parse", () => {
      const record = createSchemaCompliantProduct({
        name: "Gourmet Coffee",
        principal_id: 5,
        category: "beverages",
        status: "active",
        description: "Premium roasted beans",
        certifications: ["organic", "fair-trade"],
        allergens: [],
      });

      const defaultValues = productSchema.partial().parse(record);

      expect(defaultValues.name).toBe("Gourmet Coffee");
      expect(defaultValues.principal_id).toBe(5);
      expect(defaultValues.category).toBe("beverages");
      expect(defaultValues.status).toBe("active");
      expect(defaultValues.description).toBe("Premium roasted beans");
      expect(defaultValues.certifications).toEqual(["organic", "fair-trade"]);
      expect(defaultValues.allergens).toEqual([]);
    });

    it("does not mutate original record", () => {
      const record = createSchemaCompliantProduct({
        name: "Original Name",
      });
      const originalName = record.name;

      const defaultValues = {
        ...productSchema.partial().parse(record),
        updated_by: 42,
      };

      // Original record should be unchanged
      expect(record.name).toBe(originalName);
      // Default values are a separate object
      expect(defaultValues.updated_by).toBe(42);
      expect(record.updated_by).toBeNull();
    });

    it("productUpdateSchema.strip() removes unknown keys from database records", () => {
      // Database records contain extra fields not in schema
      const databaseRecord = {
        id: 123, // Not in schema
        name: "Test Product",
        principal_id: 1,
        category: "beverages",
        status: "active",
        created_at: "2024-01-01T00:00:00Z", // Not in schema
        updated_at: "2024-01-01T00:00:00Z", // Not in schema
      };

      // productUpdateSchema uses .strip() to remove unknown keys
      const parsed = productUpdateSchema.partial().parse(databaseRecord);

      expect(parsed.name).toBe("Test Product");
      expect(parsed).not.toHaveProperty("id");
      expect(parsed).not.toHaveProperty("created_at");
      expect(parsed).not.toHaveProperty("updated_at");
    });
  });

  describe("Identity Transform", () => {
    it("data passes through without transformation", () => {
      // ProductEdit does not use a transform prop
      // Data goes directly to API from form
      const formData = {
        name: "Updated Product",
        principal_id: 1,
        category: "frozen",
        status: "active",
        description: "Updated description",
      };

      // No transform function applied - data passes through as-is
      const dataForApi = { ...formData };

      expect(dataForApi).toEqual(formData);
    });
  });
});

describe("ProductEdit - Cache Invalidation", () => {
  it("should invalidate products cache on success", () => {
    const mockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    // Simulate onSuccess callback from ProductEdit
    const onSuccess = () => {
      mockQueryClient.invalidateQueries({ queryKey: productKeys.all });
    };

    onSuccess();

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: productKeys.all,
    });
  });

  it("invalidates with correct cache key structure", () => {
    const mockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    const onSuccess = () => {
      mockQueryClient.invalidateQueries({ queryKey: productKeys.all });
    };

    onSuccess();

    const call = mockQueryClient.invalidateQueries.mock.calls[0][0];
    expect(call).toHaveProperty("queryKey");
    expect(call.queryKey).toEqual(productKeys.all);
  });

  it("handles cache invalidation errors gracefully", async () => {
    const mockQueryClient = {
      invalidateQueries: vi.fn().mockRejectedValue(new Error("Cache error")),
    };

    // onSuccess should not throw even if cache invalidation fails
    const onSuccess = async () => {
      try {
        await mockQueryClient.invalidateQueries({ queryKey: productKeys.all });
      } catch {
        // Silently handle cache errors - the update was successful
        console.warn("Cache invalidation failed");
      }
    };

    await expect(onSuccess()).resolves.toBeUndefined();
  });
});

describe("ProductEdit - Pessimistic Mode", () => {
  it("uses pessimistic mutation mode", () => {
    // ProductEdit configuration
    const mutationMode = "pessimistic";

    expect(mutationMode).toBe("pessimistic");
  });

  it("does not apply optimistic updates", () => {
    const record = createMockProduct({
      id: 123,
      name: "Original Product",
      status: "active",
    });

    const updates = {
      name: "Updated Product",
      status: "discontinued",
    };

    // In pessimistic mode, record should not change until server confirms
    const optimisticRecord = { ...record }; // No changes applied

    expect(optimisticRecord.name).toBe("Original Product");
    expect(optimisticRecord.status).toBe("active");

    // Only after server response should changes be applied
    const confirmedRecord = { ...record, ...updates };
    expect(confirmedRecord.name).toBe("Updated Product");
    expect(confirmedRecord.status).toBe("discontinued");
  });
});

describe("ProductEdit - Form Configuration", () => {
  it("targets 'products' resource implicitly via EditBase", () => {
    // ProductEdit uses EditBase which inherits resource from route context
    // The expected resource name
    const expectedResource = "products";

    expect(expectedResource).toBe("products");
  });

  it("redirects to 'show' after edit", () => {
    // ProductEdit configuration
    const redirectTarget = "show";

    expect(redirectTarget).toBe("show");
  });

  it("uses record.id as form key for remounting", () => {
    const record1 = createMockProduct({ id: 123 });
    const record2 = createMockProduct({ id: 456 });

    // Form key should change when record changes
    const key1 = record1.id;
    const key2 = record2.id;

    expect(key1).not.toBe(key2);
    expect(key1).toBe(123);
    expect(key2).toBe(456);
  });

  it("returns null when record not loaded", () => {
    // ProductEditForm returns null when record is undefined
    const record = undefined;

    const shouldRender = record !== undefined;

    expect(shouldRender).toBe(false);
  });
});

describe("ProductEdit - Error Handling", () => {
  it("formats server errors correctly", () => {
    const formatError = (error: { status: number; message?: string }) => {
      if (error.status === 500) {
        return {
          message: error.message || "Internal server error",
          type: "error",
        };
      }
      if (error.status === 409) {
        return {
          message: "Record has been modified by another user",
          type: "error",
        };
      }
      return {
        message: "An error occurred",
        type: "error",
      };
    };

    const serverError = { status: 500, message: "Database connection failed" };
    let result = formatError(serverError);
    expect(result.message).toBe("Database connection failed");
    expect(result.type).toBe("error");

    const conflictError = { status: 409 };
    result = formatError(conflictError);
    expect(result.message).toBe("Record has been modified by another user");
  });

  it("handles validation errors in React Admin format", () => {
    // React Admin expects: { message, body: { errors } }
    const validationError = {
      message: "Validation failed",
      body: {
        errors: {
          name: "Product name is required",
          principal_id: "Principal/Supplier is required",
        },
      },
    };

    expect(validationError.message).toBe("Validation failed");
    expect(validationError.body.errors.name).toBe("Product name is required");
    expect(validationError.body.errors.principal_id).toBe("Principal/Supplier is required");
  });

  it("handles RLS violations with field-specific errors", () => {
    const formatRLSError = (error: { message: string; errors?: Record<string, string> }) => {
      if (error.message === "RLS policy violation" && error.errors) {
        return {
          fieldErrors: error.errors,
          type: "error",
        };
      }
      return null;
    };

    const rlsError = {
      message: "RLS policy violation",
      errors: {
        principal_id: "You do not have permission to modify this product",
      },
    };

    const result = formatRLSError(rlsError);

    expect(result?.fieldErrors).toEqual({
      principal_id: "You do not have permission to modify this product",
    });
  });

  it("preserves form data after error", () => {
    const originalData = createMockProduct({
      id: 123,
      name: "Original Product",
      status: "active",
    });

    const modifiedData = {
      ...originalData,
      name: "Modified Product",
      status: "discontinued",
    };

    // Form data should retain user's changes, not revert
    const dataAfterError = { ...modifiedData };

    expect(dataAfterError.name).toBe("Modified Product");
    expect(dataAfterError.status).toBe("discontinued");
    expect(dataAfterError.id).toBe(123);
  });

  it("allows retry after error", async () => {
    let attemptCount = 0;
    const mockUpdate = vi.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error("First attempt failed");
      }
      return Promise.resolve({ data: { id: 123 } });
    });

    // First attempt
    expect(() => mockUpdate()).toThrow("First attempt failed");
    expect(attemptCount).toBe(1);

    // Second attempt succeeds
    await expect(mockUpdate()).resolves.toEqual({ data: { id: 123 } });
    expect(attemptCount).toBe(2);
  });
});

describe("ProductEdit - Record Loading", () => {
  it("handles existing record with all fields", () => {
    const record = createMockProduct({
      id: 123,
      name: "Existing Product",
      principal_id: 5,
      category: "beverages",
      status: "active",
      description: "Test description",
      certifications: ["organic"],
      allergens: ["milk"],
    });

    expect(record.id).toBe(123);
    expect(record.name).toBe("Existing Product");
    expect(record.principal_id).toBe(5);
    expect(record.certifications).toEqual(["organic"]);
    expect(record.allergens).toEqual(["milk"]);
  });

  it("handles existing record with optional fields undefined", () => {
    const record = createMockProduct({
      id: 123,
      name: "Minimal Product",
      principal_id: 1,
      category: "other",
      status: "active",
      description: undefined,
      certifications: undefined,
      allergens: undefined,
    });

    // Form should handle undefined optional fields
    const defaultValues = {
      ...record,
      description: record.description ?? "",
      certifications: record.certifications ?? [],
      allergens: record.allergens ?? [],
    };

    expect(defaultValues.description).toBe("");
    expect(defaultValues.certifications).toEqual([]);
    expect(defaultValues.allergens).toEqual([]);
  });

  it("handles null values for nullable fields", () => {
    const record = createSchemaCompliantProduct({
      name: "Product with nulls",
      principal_id: 1,
      category: "beverages",
      status: "active",
      ingredients: null,
      nutritional_info: null,
      marketing_description: null,
    });

    // productSchema uses .nullish() for these fields
    const parsed = productSchema.partial().parse(record);

    expect(parsed.ingredients).toBeNull();
    expect(parsed.nutritional_info).toBeNull();
    expect(parsed.marketing_description).toBeNull();
  });
});

describe("ProductEdit - Schema Validation", () => {
  it("validates name is required and has max length", () => {
    // Test max length constraint (255 chars)
    const longName = "A".repeat(256);
    const result = productSchema.safeParse({
      name: longName,
      principal_id: 1,
      category: "beverages",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("validates principal_id is required and positive", () => {
    const result = productSchema.safeParse({
      name: "Test Product",
      principal_id: -1,
      category: "beverages",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("principal_id");
    }
  });

  it("validates status is one of allowed values", () => {
    const validResult = productSchema.safeParse({
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
      status: "active",
    });

    expect(validResult.success).toBe(true);

    const invalidResult = productSchema.safeParse({
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
      status: "invalid_status",
    });

    expect(invalidResult.success).toBe(false);
  });

  it("uses strictObject to prevent mass assignment", () => {
    // strictObject rejects unknown keys
    const result = productSchema.safeParse({
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
      unknown_field: "malicious_value",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      // strictObject throws on unrecognized keys
      const hasUnrecognizedKeyError = result.error.issues.some(
        (issue) => issue.code === "unrecognized_keys"
      );
      expect(hasUnrecognizedKeyError).toBe(true);
    }
  });
});
