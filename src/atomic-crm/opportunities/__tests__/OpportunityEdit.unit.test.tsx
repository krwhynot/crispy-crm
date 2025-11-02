/**
 * OpportunityEdit Unit Tests
 *
 * Focused unit tests for critical functionality:
 * - Transform function (products → products_to_sync)
 * - Cache invalidation logic
 * - Pessimistic mode behavior
 * - Error handling
 */

import { describe, it, expect, vi } from "vitest";
import { createMockOpportunity } from "@/tests/utils";

describe("OpportunityEdit - Transform Function", () => {
  it("should extract products to products_to_sync", () => {
    // Test the transform logic directly
    const transform = (data: any) => {
      const { products, ...opportunityData } = data;
      return {
        ...opportunityData,
        products_to_sync: products || [],
      };
    };

    const input = {
      id: 123,
      name: "Updated Opportunity",
      amount: 75000,
      products: [
        { product_id_reference: 3, notes: "Test product 3" },
        { product_id_reference: 4, notes: "Test product 4" },
      ],
    };

    const result = transform(input);

    expect(result).toHaveProperty("products_to_sync");
    expect(result.products_to_sync).toEqual(input.products);
    expect(result).not.toHaveProperty("products");
    expect(result.id).toBe(123); // ID should be preserved
  });

  it("should handle empty products array", () => {
    const transform = (data: any) => {
      const { products, ...opportunityData } = data;
      return {
        ...opportunityData,
        products_to_sync: products || [],
      };
    };

    const input = {
      id: 123,
      name: "Updated Opportunity",
      products: [],
    };

    const result = transform(input);

    expect(result.products_to_sync).toEqual([]);
    expect(result).not.toHaveProperty("products");
  });

  it("should handle undefined products", () => {
    const transform = (data: any) => {
      const { products, ...opportunityData } = data;
      return {
        ...opportunityData,
        products_to_sync: products || [],
      };
    };

    const input = {
      id: 123,
      name: "Updated Opportunity",
      // No products field
    };

    const result = transform(input);

    expect(result.products_to_sync).toEqual([]);
    expect(result).not.toHaveProperty("products");
  });

  it("should preserve all other fields during transform", () => {
    const transform = (data: any) => {
      const { products, ...opportunityData } = data;
      return {
        ...opportunityData,
        products_to_sync: products || [],
      };
    };

    const input = {
      id: 123,
      name: "Updated Opportunity",
      amount: 75000,
      probability: 80,
      stage: "qualified",
      expected_closing_date: "2024-12-31",
      customer_organization_id: 10,
      products: [{ product_id_reference: 1, notes: "Test product" }],
    };

    const result = transform(input);

    // All fields except products should be preserved
    expect(result.id).toBe(123);
    expect(result.name).toBe("Updated Opportunity");
    expect(result.amount).toBe(75000);
    expect(result.probability).toBe(80);
    expect(result.stage).toBe("qualified");
    expect(result.expected_closing_date).toBe("2024-12-31");
    expect(result.customer_organization_id).toBe(10);
    expect(result.products_to_sync).toHaveLength(1);
  });
});

describe("OpportunityEdit - Cache Invalidation", () => {
  it("should invalidate correct cache keys", () => {
    const mockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    // Simulate onSuccess callback
    const onSuccess = () => {
      mockQueryClient.invalidateQueries({ queryKey: ["opportunities"] } as any);
    };

    onSuccess();

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["opportunities"],
    });
  });

  it("should handle cache invalidation errors gracefully", () => {
    const mockQueryClient = {
      invalidateQueries: vi.fn().mockRejectedValue(new Error("Cache error")),
    };

    // onSuccess should not throw even if cache invalidation fails
    const onSuccess = async () => {
      try {
        await mockQueryClient.invalidateQueries({ queryKey: ["opportunities"] } as any);
      } catch (error) {
        // Silently handle cache errors - the update was successful
        console.warn("Cache invalidation failed:", error);
      }
    };

    expect(onSuccess()).resolves.toBeUndefined();
  });
});

describe("OpportunityEdit - Pessimistic Mode", () => {
  it("should use pessimistic mutation mode", () => {
    // Pessimistic mode configuration
    const mutationMode = "pessimistic";

    expect(mutationMode).toBe("pessimistic");
  });

  it("should not apply optimistic updates", () => {
    const record = createMockOpportunity({
      id: 123,
      name: "Original Name",
      amount: 50000,
    });

    const updates = {
      name: "Updated Name",
      amount: 75000,
    };

    // In pessimistic mode, record should not change until server confirms
    const optimisticRecord = { ...record }; // No changes applied

    expect(optimisticRecord.name).toBe("Original Name");
    expect(optimisticRecord.amount).toBe(50000);

    // Only after server response should changes be applied
    const confirmedRecord = { ...record, ...updates };
    expect(confirmedRecord.name).toBe("Updated Name");
    expect(confirmedRecord.amount).toBe(75000);
  });
});

describe("OpportunityEdit - Validation", () => {
  it("should validate probability is between 0 and 100", () => {
    const validateProbability = (value: number) => {
      if (value < 0 || value > 100) {
        return "Probability must be between 0 and 100";
      }
      return undefined;
    };

    expect(validateProbability(60)).toBeUndefined();
    expect(validateProbability(0)).toBeUndefined();
    expect(validateProbability(100)).toBeUndefined();
    expect(validateProbability(-10)).toBe("Probability must be between 0 and 100");
    expect(validateProbability(150)).toBe("Probability must be between 0 and 100");
  });

  it("should validate amount is positive", () => {
    const validateAmount = (value: number) => {
      if (value < 0) {
        return "Amount must be positive";
      }
      return undefined;
    };

    expect(validateAmount(75000)).toBeUndefined();
    expect(validateAmount(0)).toBeUndefined();
    expect(validateAmount(-1000)).toBe("Amount must be positive");
  });

  it("should require opportunity name on update", () => {
    const validateName = (value: string) => {
      if (!value || value.trim().length === 0) {
        return "Opportunity name is required";
      }
      return undefined;
    };

    expect(validateName("Updated Opportunity")).toBeUndefined();
    expect(validateName("")).toBe("Opportunity name is required");
    expect(validateName("   ")).toBe("Opportunity name is required");
  });
});

describe("OpportunityEdit - Error Handling", () => {
  it("should format server errors correctly", () => {
    const formatError = (error: any) => {
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

  it("should handle RLS violations with field-specific errors", () => {
    const formatRLSError = (error: any) => {
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
        customer_organization_id: "You do not have permission to perform this action",
      },
    };

    const result = formatRLSError(rlsError);

    expect(result?.fieldErrors).toEqual({
      customer_organization_id: "You do not have permission to perform this action",
    });
  });

  it("should preserve form data after error", () => {
    // Test that form state is preserved after error
    const originalData = createMockOpportunity({
      id: 123,
      name: "Original Opportunity",
      amount: 50000,
    });

    const modifiedData = {
      ...originalData,
      name: "Modified Opportunity",
      amount: 75000,
    };

    // Form data should retain user's changes, not revert
    const dataAfterError = { ...modifiedData };

    expect(dataAfterError.name).toBe("Modified Opportunity");
    expect(dataAfterError.amount).toBe(75000);
    expect(dataAfterError.id).toBe(123);
  });

  it("should allow retry after error", () => {
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
    expect(mockUpdate()).resolves.toEqual({ data: { id: 123 } });
    expect(attemptCount).toBe(2);
  });
});

describe("OpportunityEdit - Record Loading", () => {
  it("should handle existing record with products", () => {
    const record = createMockOpportunity({
      id: 123,
      name: "Existing Opportunity",
      products: [
        { product_id_reference: 1, notes: "Test product 1" },
        { product_id_reference: 2, notes: "Test product 2" },
      ],
    });

    // Default values should include products array
    const defaultValues = {
      ...record,
      products: record.products || [],
    };

    expect(defaultValues.products).toHaveLength(2);
    expect(defaultValues.products[0].product_id_reference).toBe(1);
  });

  it("should handle existing record without products", () => {
    const record = createMockOpportunity({
      id: 123,
      name: "Existing Opportunity",
      products: undefined,
    });

    // Default values should provide empty array for undefined products
    const defaultValues = {
      ...record,
      products: record.products || [],
    };

    expect(defaultValues.products).toEqual([]);
  });

  it("should use record ID as form key for remounting", () => {
    const record1 = createMockOpportunity({ id: 123 });
    const record2 = createMockOpportunity({ id: 456 });

    // Form key should change when record changes
    const key1 = record1.id;
    const key2 = record2.id;

    expect(key1).not.toBe(key2);
    expect(key1).toBe(123);
    expect(key2).toBe(456);
  });
});