/**
 * Tests for contact validation functions and React Admin integration
 * Focus: Validation functions, form validation, and error formatting
 * Per "UI as source of truth" principle: only validates fields with UI inputs in ContactInputs.tsx
 */

import { describe, it, expect } from "vitest";
import {
  validateContactForm,
  validateCreateContact,
  validateUpdateContact,
} from "../../contacts";

describe("Contact Validation Functions", () => {
  describe("validateContactForm", () => {
    it("should validate and pass valid data", async () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        email: [{ email: "john@example.com", type: "Work" }], // Array format per new schema
      };

      await expect(validateContactForm(validData)).resolves.toBeUndefined();
    });

    it("should format errors for React Admin", async () => {
      const invalidData = {
        // Name fields are required
        linkedin_url: "not-a-url",
      };

      try {
        await validateContactForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors).toBeDefined();
        expect(error.errors.name).toBeDefined(); // Name validation error
        expect(error.errors.linkedin_url).toBeDefined(); // Invalid URL
      }
    });

    it("should handle nested email validation errors", async () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: [
          { email: "invalid", type: "Work" },
          { email: "also-invalid", type: "Home" },
        ],
      };

      try {
        await validateContactForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors["email.0.email"]).toBeDefined();
        expect(error.errors["email.1.email"]).toBeDefined();
      }
    });
  });

  describe("validateCreateContact", () => {
    it("should validate creation data", async () => {
      const validData = {
        first_name: "Jane",
        last_name: "Smith",
        email: [{ email: "jane@example.com", type: "Work" }], // Array format per new schema
        sales_id: 1, // Required for creation
      };

      await expect(validateCreateContact(validData)).resolves.toBeUndefined();
    });

    it("should require email and sales_id for creation", async () => {
      const dataWithoutEmail = {
        first_name: "Jane",
        last_name: "Smith",
        // Missing email and sales_id
      };

      try {
        await validateCreateContact(dataWithoutEmail);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors.email).toBeDefined();
        expect(error.errors.sales_id).toBeDefined();
      }
    });
  });

  describe("validateUpdateContact", () => {
    it("should validate update data", async () => {
      const validData = {
        // ID is not required for updates (passed in params.id by React Admin)
        first_name: "Updated",
      };

      await expect(validateUpdateContact(validData)).resolves.toBeUndefined();
    });

    it("should allow partial updates", async () => {
      const partialData = {
        last_name: "Updated",
      };

      await expect(validateUpdateContact(partialData)).resolves.toBeUndefined();
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", async () => {
      const testCases = [
        {
          data: {
            // Missing all name fields
            email: [{ email: "test@example.com", type: "Work" }],
          },
          expectedError: "Either name or first_name/last_name must be provided",
          field: "name",
        },
        {
          data: {
            first_name: "John",
            last_name: "Doe",
            email: [{ email: "invalid", type: "Work" }], // Invalid email format
          },
          expectedError: "Must be a valid email address",
          field: "email.0.email",
        },
        {
          data: {
            first_name: "John",
            last_name: "Doe",
            linkedin_url: "not-a-url", // Invalid LinkedIn URL
          },
          expectedError: "URL must be from linkedin.com",
          field: "linkedin_url",
        },
      ];

      for (const { data, expectedError, field } of testCases) {
        try {
          await validateContactForm(data);
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