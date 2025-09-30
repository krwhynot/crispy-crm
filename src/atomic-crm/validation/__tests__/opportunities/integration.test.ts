/**
 * Tests for opportunity validation functions and API integration
 * Focus: Form validation and API boundary processing
 */

import { describe, it, expect } from "vitest";
import {
  validateOpportunityForm,
  validateCreateOpportunity,
  validateUpdateOpportunity,
} from "../../opportunities";

describe("Opportunity Validation Functions", () => {
  describe("validateOpportunityForm", () => {
    it("should validate and pass valid data", async () => {
      const validData = {
        name: "Test Opportunity",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
        amount: 10000,
        probability: 75,
      };

      await expect(
        validateOpportunityForm(validData),
      ).resolves.toBeUndefined();
    });

    it("should format errors for React Admin", async () => {
      const invalidData = {
        name: "",
        contact_ids: [],
        expected_closing_date: "",
        probability: 150,
        amount: -100,
      };

      try {
        await validateOpportunityForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors).toBeDefined();
        expect(error.errors.name).toBe("Opportunity name is required");
        expect(error.errors.contact_ids).toBe(
          "At least one contact is required",
        );
        expect(error.errors.expected_closing_date).toBe(
          "Expected closing date is required",
        );
        expect(error.errors.probability).toBe(
          "Probability must be between 0 and 100",
        );
        expect(error.errors.amount).toBe("Amount must be positive");
      }
    });

    it("should handle nested path errors correctly", async () => {
      const invalidData = {
        name: "Test",
        contact_ids: ["valid-id"],
        expected_closing_date: "2024-12-31",
        stage: "invalid_stage",
      };

      try {
        await validateOpportunityForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors.stage).toBeDefined();
      }
    });
  });

  describe("validateCreateOpportunity", () => {
    it("should validate creation data", async () => {
      const validData = {
        name: "New Opportunity",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
      };

      await expect(
        validateCreateOpportunity(validData),
      ).resolves.toBeUndefined();
    });

    it("should reject incomplete creation data", async () => {
      const incompleteData = {
        name: "New Opportunity",
      };

      try {
        await validateCreateOpportunity(incompleteData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors).toBeDefined();
      }
    });
  });

  describe("validateUpdateOpportunity", () => {
    it("should validate update data", async () => {
      const validData = {
        id: "opp-123",
        name: "Updated Opportunity",
        probability: 80,
      };

      await expect(
        validateUpdateOpportunity(validData),
      ).resolves.toBeUndefined();
    });

    it("should reject update without id", async () => {
      const invalidData = {
        name: "Updated Opportunity",
      };

      try {
        await validateUpdateOpportunity(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors.id).toBeDefined();
      }
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", async () => {
      const testCases = [
        {
          data: {
            name: "",
            contact_ids: ["contact-1"],
            expected_closing_date: "2024-12-31",
          },
          expectedError: "Opportunity name is required",
          field: "name",
        },
        {
          data: {
            name: "Test",
            contact_ids: [],
            expected_closing_date: "2024-12-31",
          },
          expectedError: "At least one contact is required",
          field: "contact_ids",
        },
        {
          data: {
            name: "Test",
            contact_ids: ["contact-1"],
            expected_closing_date: "",
          },
          expectedError: "Expected closing date is required",
          field: "expected_closing_date",
        },
        {
          data: {
            name: "Test",
            contact_ids: ["contact-1"],
            expected_closing_date: "2024-12-31",
            probability: 150,
          },
          expectedError: "Probability must be between 0 and 100",
          field: "probability",
        },
      ];

      for (const { data, expectedError, field } of testCases) {
        try {
          await validateOpportunityForm(data);
          if (expectedError) {
            expect.fail(`Should have thrown error for field: ${field}`);
          }
        } catch (error: any) {
          expect(error.errors[field]).toBe(expectedError);
        }
      }
    });
  });
});