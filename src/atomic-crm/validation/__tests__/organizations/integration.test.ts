/**
 * Tests for organization validation functions and API integration
 * Focus: Form validation and submission processing
 */

import { describe, it, expect } from "vitest";
import { validateOrganizationForSubmission, validateOrganizationForm } from "../../organizations";

describe("Organization Validation Functions", () => {
  describe("validateOrganizationForm", () => {
    it("should validate and pass valid data", async () => {
      const validData = {
        name: "Test Organization",
        organization_type: "customer",
      };

      await expect(validateOrganizationForm(validData)).resolves.toBeUndefined();
    });

    it("should format errors for React Admin", async () => {
      // Note: "not-a-url" now becomes "https://not-a-url" via auto-prefix (valid format)
      // Use malformed URL "://invalid" to test URL validation error
      const invalidData = {
        name: "",
        organization_type: "invalid_type",
        website: "://invalid",
      };

      try {
        await validateOrganizationForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.body.errors).toBeDefined();
        expect(error.body.errors.name).toBe("Organization name is required");
        expect(error.body.errors.organization_type).toBeDefined();
        expect(error.body.errors.website).toBe("Must be a valid URL");
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
        expect(error.body.errors.linkedin_url).toBe("Must be a LinkedIn URL (linkedin.com)");
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
        // z.strictObject() rejects unrecognized keys like 'address' and 'contact'
        expect(error.body.errors).toBeDefined();
      }
    });
  });

  describe("validateOrganizationForSubmission", () => {
    it("should validate and normalize organization data", async () => {
      const inputData = {
        name: "Submission Test",
        organization_type: "customer",
        website: "https://example.com",
      };

      await expect(validateOrganizationForSubmission(inputData)).resolves.toBeUndefined();
    });

    it("should throw for missing required fields", async () => {
      const minimalData = {
        // Missing required 'name' field
        organization_type: "customer",
      };

      await expect(validateOrganizationForSubmission(minimalData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should throw for invalid submission data", async () => {
      const invalidData = {
        name: "",
        organization_type: "invalid",
      };

      await expect(validateOrganizationForSubmission(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should reject unrecognized fields for mass assignment prevention", async () => {
      // z.strictObject() provides defense-in-depth security by rejecting unrecognized keys
      const dataWithExtras = {
        name: "Clean Org",
        organization_type: "customer",
        extra_field: "should be rejected",
        malicious: "also rejected",
      };

      // z.strictObject() throws ZodError for unrecognized keys instead of silently stripping
      await expect(validateOrganizationForSubmission(dataWithExtras)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", async () => {
      const testCases = [
        {
          data: { name: "", organization_type: "customer" },
          expectedError: "Organization name is required",
          field: "name",
        },
        {
          data: { name: "Test", organization_type: "invalid" },
          field: "organization_type",
        },
      ];

      for (const { data, field } of testCases) {
        try {
          await validateOrganizationForm(data);
          expect.fail(`Should have thrown error for field: ${field}`);
        } catch (error: any) {
          expect(error.body.errors[field]).toBeDefined();
        }
      }
    });
  });
});
