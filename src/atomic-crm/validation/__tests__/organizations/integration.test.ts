/**
 * Tests for organization validation functions and API integration
 * Focus: Form validation and submission processing
 */

import { describe, it, expect } from "vitest";
import {
  validateOrganizationForSubmission,
  validateOrganizationForm,
} from "../../organizations";

describe("Organization Validation Functions", () => {
  describe("validateOrganizationForm", () => {
    it("should validate and pass valid data", async () => {
      const validData = {
        name: "Test Organization",
        type: "customer",
        status: "active",
      };

      await expect(
        validateOrganizationForm(validData),
      ).resolves.toBeUndefined();
    });

    it("should format errors for React Admin", async () => {
      const invalidData = {
        name: "",
        type: "invalid_type",
        status: "invalid_status",
        annual_revenue: -1000,
        employee_count: -10,
        website: "not-a-url",
      };

      try {
        await validateOrganizationForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors).toBeDefined();
        expect(error.errors.name).toBe("Organization name is required");
        expect(error.errors.type).toBeDefined();
        expect(error.errors.status).toBeDefined();
        expect(error.errors.annual_revenue).toBe(
          "Annual revenue must be positive",
        );
        expect(error.errors.employee_count).toBe(
          "Employee count must be at least 1",
        );
        expect(error.errors.website).toBe("Invalid URL format");
      }
    });

    it("should validate LinkedIn URL format", async () => {
      const invalidLinkedIn = {
        name: "Test Org",
        linkedin_url: "https://twitter.com/company/test",
      };

      try {
        await validateOrganizationForm(invalidLinkedIn);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors.linkedin_url).toBe(
          "Must be a valid LinkedIn company URL",
        );
      }
    });

    it("should handle nested field errors", async () => {
      const complexInvalidData = {
        name: "Test",
        address: {
          street: "",
          city: "",
        },
        contact: {
          email: "invalid-email",
          phone: "",
        },
      };

      try {
        await validateOrganizationForm(complexInvalidData);
      } catch (error: any) {
        // If address and contact are nested fields in the schema
        expect(error.errors).toBeDefined();
      }
    });
  });

  describe("validateOrganizationForSubmission", () => {
    it("should validate and normalize organization data", () => {
      const inputData = {
        name: "Submission Test",
        type: "customer",
        status: "active",
        website: "https://example.com",
      };

      const result = validateOrganizationForSubmission(inputData);
      expect(result.name).toBe("Submission Test");
      expect(result.type).toBe("customer");
      expect(result.website).toBe("https://example.com");
    });

    it("should apply defaults during submission", () => {
      const minimalData = {
        name: "Minimal Org",
      };

      const result = validateOrganizationForSubmission(minimalData);
      expect(result.type).toBe("prospect");
      expect(result.status).toBe("active");
    });

    it("should throw for invalid submission data", () => {
      const invalidData = {
        name: "",
        type: "invalid",
      };

      expect(() => validateOrganizationForSubmission(invalidData)).toThrow();
    });

    it("should strip extra fields during submission", () => {
      const dataWithExtras = {
        name: "Clean Org",
        type: "customer",
        extra_field: "should be removed",
        malicious: "also removed",
      };

      const result = validateOrganizationForSubmission(dataWithExtras);
      expect(result.name).toBe("Clean Org");
      expect("extra_field" in result).toBe(false);
      expect("malicious" in result).toBe(false);
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", async () => {
      const testCases = [
        {
          data: { name: "", type: "customer" },
          expectedError: "Organization name is required",
          field: "name",
        },
        {
          data: { name: "Test", type: "invalid" },
          expectedError: "Invalid organization type",
          field: "type",
        },
        {
          data: { name: "Test", annual_revenue: -1000 },
          expectedError: "Annual revenue must be positive",
          field: "annual_revenue",
        },
        {
          data: { name: "Test", employee_count: 0 },
          expectedError: "Employee count must be at least 1",
          field: "employee_count",
        },
      ];

      for (const { data, expectedError, field } of testCases) {
        try {
          await validateOrganizationForm(data);
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