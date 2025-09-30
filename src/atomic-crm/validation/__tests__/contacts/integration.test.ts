/**
 * Tests for contact validation functions and React Admin integration
 * Focus: Validation functions, form validation, and error formatting
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
        email: { primary: "john@example.com" },
      };

      await expect(validateContactForm(validData)).resolves.toBeUndefined();
    });

    it("should format errors for React Admin", async () => {
      const invalidData = {
        first_name: "",
        last_name: "",
        email: { primary: "not-an-email" },
        linkedin_url: "not-a-url",
      };

      try {
        await validateContactForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors).toBeDefined();
        expect(error.errors.first_name).toBe("First name is required");
        expect(error.errors.last_name).toBe("Last name is required");
        expect(error.errors["email.primary"]).toBeDefined();
      }
    });

    it("should handle nested email validation errors", async () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: {
          primary: "invalid",
          work: "also-invalid",
        },
      };

      try {
        await validateContactForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors["email.primary"]).toBeDefined();
        expect(error.errors["email.work"]).toBeDefined();
      }
    });
  });

  describe("validateCreateContact", () => {
    it("should validate creation data", async () => {
      const validData = {
        first_name: "Jane",
        last_name: "Smith",
        email: { primary: "jane@example.com" },
      };

      await expect(validateCreateContact(validData)).resolves.toBeUndefined();
    });

    it("should require email for creation", async () => {
      const dataWithoutEmail = {
        first_name: "Jane",
        last_name: "Smith",
      };

      try {
        await validateCreateContact(dataWithoutEmail);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors.email).toBeDefined();
      }
    });
  });

  describe("validateUpdateContact", () => {
    it("should validate update data", async () => {
      const validData = {
        id: "contact-123",
        first_name: "Updated",
      };

      await expect(validateUpdateContact(validData)).resolves.toBeUndefined();
    });

    it("should reject update without id", async () => {
      const invalidData = {
        first_name: "Updated",
      };

      try {
        await validateUpdateContact(invalidData);
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
            first_name: "",
            last_name: "Doe",
            email: { primary: "test@example.com" },
          },
          expectedError: "First name is required",
          field: "first_name",
        },
        {
          data: {
            first_name: "John",
            last_name: "",
            email: { primary: "test@example.com" },
          },
          expectedError: "Last name is required",
          field: "last_name",
        },
        {
          data: { first_name: "John", last_name: "Doe", email: {} },
          expectedError: "At least one email is required",
          field: "email",
        },
        {
          data: {
            first_name: "John",
            last_name: "Doe",
            email: { primary: "invalid" },
          },
          expectedError: "Invalid email format",
          field: "email.primary",
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