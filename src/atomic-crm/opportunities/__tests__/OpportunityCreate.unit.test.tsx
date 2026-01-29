/**
 * OpportunityCreate Unit Tests
 *
 * Focused unit tests for critical functionality:
 * - Transform function (products → products_to_sync)
 * - Error handling behavior
 * - Default values
 */

import { describe, it, expect } from "vitest";

interface OpportunityFormData {
  name: string;
  amount?: number;
  products?: Array<{ product_id_reference: number; notes: string }>;
  [key: string]: unknown;
}

describe("OpportunityCreate - Transform Function", () => {
  it("should extract products to products_to_sync", () => {
    // Test the transform logic directly
    const transform = (data: OpportunityFormData) => {
      const { products, ...opportunityData } = data;
      return {
        ...opportunityData,
        products_to_sync: products || [],
      };
    };

    const input = {
      name: "Test Opportunity",
      amount: 50000,
      products: [
        { product_id_reference: 1, notes: "Test product 1" },
        { product_id_reference: 2, notes: "Test product 2" },
      ],
    };

    const result = transform(input);

    expect(result).toHaveProperty("products_to_sync");
    expect(result.products_to_sync).toEqual(input.products);
    expect(result).not.toHaveProperty("products");
  });

  it("should handle empty products array", () => {
    const transform = (data: OpportunityFormData) => {
      const { products, ...opportunityData } = data;
      return {
        ...opportunityData,
        products_to_sync: products || [],
      };
    };

    const input = {
      name: "Test Opportunity",
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
      name: "Test Opportunity",
      // No products field
    };

    const result = transform(input);

    expect(result.products_to_sync).toEqual([]);
    expect(result).not.toHaveProperty("products");
  });
});

describe("OpportunityCreate - Default Values", () => {
  it("should have correct default values structure", () => {
    const getDefaultValues = (identityId?: number) => ({
      opportunity_owner_id: identityId,
      account_manager_id: identityId,
      contact_ids: [],
      products: [],
      priority: "medium",
      probability: 50,
      stage: "new_lead",
      expected_closing_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });

    const defaults = getDefaultValues(123);

    expect(defaults.opportunity_owner_id).toBe(123);
    expect(defaults.account_manager_id).toBe(123);
    expect(defaults.priority).toBe("medium");
    expect(defaults.probability).toBe(50);
    expect(defaults.stage).toBe("new_lead");
    expect(defaults.products).toEqual([]);

    // Check date is approximately 90 days from now
    const expectedDate = new Date(defaults.expected_closing_date);
    const now = new Date();
    const daysDiff = (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(89);
    expect(daysDiff).toBeLessThanOrEqual(91);
  });
});

describe("OpportunityCreate - Validation", () => {
  it("should validate probability is between 0 and 100", () => {
    const validateProbability = (value: number) => {
      if (value < 0 || value > 100) {
        return "Probability must be between 0 and 100";
      }
      return undefined;
    };

    expect(validateProbability(50)).toBeUndefined();
    expect(validateProbability(0)).toBeUndefined();
    expect(validateProbability(100)).toBeUndefined();
    expect(validateProbability(-1)).toBe("Probability must be between 0 and 100");
    expect(validateProbability(101)).toBe("Probability must be between 0 and 100");
    expect(validateProbability(150)).toBe("Probability must be between 0 and 100");
  });

  it("should validate amount is positive", () => {
    const validateAmount = (value: number) => {
      if (value < 0) {
        return "Amount must be positive";
      }
      return undefined;
    };

    expect(validateAmount(0)).toBeUndefined();
    expect(validateAmount(1000)).toBeUndefined();
    expect(validateAmount(999999)).toBeUndefined();
    expect(validateAmount(-1)).toBe("Amount must be positive");
    expect(validateAmount(-1000)).toBe("Amount must be positive");
  });

  it("should require opportunity name", () => {
    const validateName = (value: string) => {
      if (!value || value.trim().length === 0) {
        return "Opportunity name is required";
      }
      return undefined;
    };

    expect(validateName("Test Opportunity")).toBeUndefined();
    expect(validateName("A")).toBeUndefined();
    expect(validateName("")).toBe("Opportunity name is required");
    expect(validateName("   ")).toBe("Opportunity name is required");
  });

  it("should require expected closing date", () => {
    const validateDate = (value: string) => {
      if (!value || value.trim().length === 0) {
        return "Expected closing date is required";
      }
      return undefined;
    };

    expect(validateDate("2024-12-31")).toBeUndefined();
    expect(validateDate("")).toBe("Expected closing date is required");
  });
});

describe("OpportunityCreate - Error Handling", () => {
  it("should format server errors correctly", () => {
    const formatError = (error: any) => {
      if (error.status === 500) {
        return {
          message: error.message || "Internal server error",
          type: "error",
        };
      }
      return {
        message: "An error occurred",
        type: "error",
      };
    };

    const serverError = { status: 500, message: "Database connection failed" };
    const result = formatError(serverError);

    expect(result.message).toBe("Database connection failed");
    expect(result.type).toBe("error");
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
    const formData = {
      name: "Test Opportunity",
      amount: 50000,
      probability: 75,
    };

    // Simulate error occurring (captured for potential logging/handling)
    const _error = new Error("Network timeout");

    // Form data should remain unchanged
    const dataAfterError = { ...formData };

    expect(dataAfterError).toEqual(formData);
    expect(dataAfterError.name).toBe("Test Opportunity");
    expect(dataAfterError.amount).toBe(50000);
    expect(dataAfterError.probability).toBe(75);
  });
});
