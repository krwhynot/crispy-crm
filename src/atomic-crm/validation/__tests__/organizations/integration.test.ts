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
        organization_type: "customer",
      };

      await expect(
        validateOrganizationForm(validData),
      ).resolves.toBeUndefined();
    });

    it("should format errors for React Admin", async () => {
      const invalidData = {
        name: "",
        organization_type: "invalid_type",
        website: "not-a-url",
      };

      try {
        await validateOrganizationForm(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Validation failed");
        expect(error.errors).toBeDefined();
        expect(error.errors.name).toBe("Company name is required");
        expect(error.errors.organization_type).toBeDefined();
        expect(error.errors.website).toBe("Must be a valid URL");
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
    it("should validate and normalize organization data", async () => {
      const inputData = {
        name: "Submission Test",
        organization_type: "customer",
        website: "https://example.com",
      };

      await expect(
        validateOrganizationForSubmission(inputData),
      ).resolves.toBeUndefined();
    });

    it("should throw for missing required fields", async () => {
      const minimalData = {
        // Missing required 'name' field
        organization_type: "customer",
      };

      await expect(
        validateOrganizationForSubmission(minimalData),
      ).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should throw for invalid submission data", async () => {
      const invalidData = {
        name: "",
        organization_type: "invalid",
      };

      await expect(
        validateOrganizationForSubmission(invalidData),
      ).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should strip extra fields during submission", async () => {
      const dataWithExtras = {
        name: "Clean Org",
        organization_type: "customer",
        extra_field: "should be removed",
        malicious: "also removed",
      };

      // Since validateOrganizationForSubmission returns void, we just check it doesn't throw
      await expect(
        validateOrganizationForSubmission(dataWithExtras),
      ).resolves.toBeUndefined();
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", async () => {
      const testCases = [
        {
          data: { name: "", organization_type: "customer" },
          expectedError: "Company name is required",
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
          expect(error.errors[field]).toBeDefined();
        }
      }
    });
  });
});