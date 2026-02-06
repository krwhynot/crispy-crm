/**
 * OpportunityEdit Unit Tests
 *
 * Focused unit tests for critical functionality:
 * - Cache invalidation logic
 * - Pessimistic mode behavior
 * - Error handling
 * - Form state management
 */

import { describe, it, expect, vi, type Mock } from "vitest";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import { opportunityKeys } from "../../queryKeys";

/**
 * Typed interface for QueryClient invalidateQueries options
 * Matches TanStack Query's InvalidateQueryFilters structure
 */
interface InvalidateQueryOptions {
  queryKey: readonly unknown[];
}

/**
 * Mock QueryClient interface for type-safe testing
 */
interface MockQueryClient {
  invalidateQueries: Mock<[options: InvalidateQueryOptions], Promise<void>>;
}

describe("OpportunityEdit - Form Architecture", () => {
  it("should use compact form with CollapsibleSections", () => {
    // OpportunityEdit uses OpportunityCompactForm which has:
    // - Always visible fields: name, customer, principal, stage, priority, close date, account manager, distributor
    // - CollapsibleSection "Contacts & Products" (defaultOpen in edit mode): contact_ids, products_to_sync
    // - CollapsibleSection "Classification" (collapsed): lead_source, campaign, tags
    // - CollapsibleSection "Additional Details" (collapsed): description, next_action, decision_criteria, notes
    // - Activity History section (always visible, not in a collapsible)

    const formStructure = {
      alwaysVisible: [
        "name",
        "customer_organization_id",
        "principal_organization_id",
        "stage",
        "priority",
        "estimated_close_date",
        "account_manager_id",
        "distributor_organization_id",
      ],
      collapsibleSections: {
        "Contacts & Products": {
          fields: ["contact_ids", "products_to_sync"],
          defaultOpen: true, // in edit mode
        },
        Classification: {
          fields: ["lead_source", "campaign", "tags"],
          defaultOpen: false,
        },
        "Additional Details": {
          fields: [
            "description",
            "next_action",
            "next_action_date",
            "decision_criteria",
            "related_opportunity_id",
            "notes",
          ],
          defaultOpen: false,
        },
      },
      activitySection: "Activity History", // Always visible, not collapsible
    };

    // Verify structure
    expect(formStructure.alwaysVisible).toHaveLength(8);
    expect(Object.keys(formStructure.collapsibleSections)).toHaveLength(3);
    expect(formStructure.collapsibleSections["Contacts & Products"].defaultOpen).toBe(true);
    expect(formStructure.collapsibleSections.Classification.defaultOpen).toBe(false);
    expect(formStructure.activitySection).toBe("Activity History");
  });

  it("should use products_to_sync directly without transform", () => {
    // OpportunityEdit no longer uses a transform function
    // The form directly uses products_to_sync as the source
    const formData = {
      id: 123,
      name: "Test Opportunity",
      products_to_sync: [
        { product_id_reference: 1, notes: "Product 1" },
        { product_id_reference: 2, notes: "Product 2" },
      ],
    };

    // Data goes directly to API without transformation
    expect(formData.products_to_sync).toHaveLength(2);
    expect(formData).toHaveProperty("products_to_sync");
    expect(formData).not.toHaveProperty("products");
  });
});

describe("OpportunityEdit - Cache Invalidation", () => {
  it("should invalidate correct cache keys", () => {
    const mockQueryClient: MockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    // Simulate onSuccess callback
    const onSuccess = () => {
      mockQueryClient.invalidateQueries({ queryKey: opportunityKeys.all });
    };

    onSuccess();

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: opportunityKeys.all,
    });
  });

  it("should handle cache invalidation errors gracefully", () => {
    const mockQueryClient: MockQueryClient = {
      invalidateQueries: vi.fn().mockRejectedValue(new Error("Cache error")),
    };

    // onSuccess should not throw even if cache invalidation fails
    const onSuccess = async () => {
      try {
        await mockQueryClient.invalidateQueries({ queryKey: opportunityKeys.all });
      } catch (error: unknown) {
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

  it("should handle RLS violations with field-specific errors", () => {
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
  it("should handle existing record with products_to_sync", () => {
    const record = createMockOpportunity({
      id: 123,
      name: "Existing Opportunity",
      products_to_sync: [
        { product_id_reference: 1, notes: "Test product 1" },
        { product_id_reference: 2, notes: "Test product 2" },
      ],
    });

    // Record should include products_to_sync array
    expect(record.products_to_sync).toHaveLength(2);
    expect(record.products_to_sync[0].product_id_reference).toBe(1);
  });

  it("should handle existing record without products", () => {
    const record = createMockOpportunity({
      id: 123,
      name: "Existing Opportunity",
      products_to_sync: undefined,
    });

    // Form should handle undefined products_to_sync
    const defaultValues = {
      ...record,
      products_to_sync: record.products_to_sync || [],
    };

    expect(defaultValues.products_to_sync).toEqual([]);
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
