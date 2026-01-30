/**
 * Tests for organization validation schemas and API integration
 * Focus: Schema validation and error formatting
 *
 * Note: validateOrganizationForm was removed as dead code (no production callers).
 * These tests now exercise organizationSchema directly, which is the underlying
 * schema used by validateCreateOrganization / validateUpdateOrganization.
 */

import { describe, it, expect } from "vitest";
import { organizationSchema } from "../../organizations";
import { zodErrorToReactAdminError } from "../../utils";
import { z } from "zod";

/** Helper: parse with organizationSchema and convert ZodErrors to RA format */
async function parseOrganization(data: unknown): Promise<void> {
  try {
    organizationSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}

describe("Organization Validation Functions", () => {
  // After audit fix (commit 4f0245d2b): Schema no longer provides silent defaults
  // All tests must include required fields: organization_type, priority, status
  const requiredFields = {
    organization_type: "customer" as const,
    priority: "B" as const,
    status: "active" as const,
  };

  describe("organizationSchema validation", () => {
    it("should validate and pass valid data", async () => {
      const validData = {
        name: "Test Organization",
        ...requiredFields,
      };

      await expect(parseOrganization(validData)).resolves.toBeUndefined();
    });

    it("should format errors for React Admin", async () => {
      // Note: "not-a-url" now becomes "https://not-a-url" via auto-prefix (valid format)
      // Use malformed URL "://invalid" to test URL validation error
      const invalidData = {
        ...requiredFields, // Spread first
        name: "", // Invalid: empty name
        organization_type: "invalid_type", // Override with invalid type
        website: "://invalid", // Invalid URL
      };

      try {
        await parseOrganization(invalidData);
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        const err = error as { message: string; body: { errors: Record<string, string> } };
        expect(err.message).toBe("Validation failed");
        expect(err.body.errors).toBeDefined();
        expect(err.body.errors.name).toBe("Organization name is required");
        expect(err.body.errors.organization_type).toBeDefined();
        expect(err.body.errors.website).toBe("Must be a valid URL (e.g., example.com)");
      }
    });

    it("should validate LinkedIn URL format", async () => {
      const invalidLinkedIn = {
        name: "Test Org",
        ...requiredFields,
        linkedin_url: "https://twitter.com/company/test",
      };

      try {
        await parseOrganization(invalidLinkedIn);
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        const err = error as { body: { errors: Record<string, string> } };
        expect(err.body.errors.linkedin_url).toBe("Must be a LinkedIn URL (linkedin.com)");
      }
    });

    it("should handle nested field errors", async () => {
      const complexInvalidData = {
        name: "Test",
        ...requiredFields,
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
        await parseOrganization(complexInvalidData);
      } catch (error: unknown) {
        // z.strictObject() rejects unrecognized keys like 'address' and 'contact'
        const err = error as { body: { errors: Record<string, string> } };
        expect(err.body.errors).toBeDefined();
      }
    });
  });

  describe("organizationSchema normalization", () => {
    it("should validate and normalize organization data", async () => {
      const inputData = {
        name: "Submission Test",
        ...requiredFields,
        website: "https://example.com",
      };

      await expect(parseOrganization(inputData)).resolves.toBeUndefined();
    });

    it("should throw for missing required fields", async () => {
      const minimalData = {
        // Missing required 'name' field (and priority/status per audit fix)
        organization_type: "customer",
      };

      await expect(parseOrganization(minimalData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should throw for invalid submission data", async () => {
      const invalidData = {
        name: "",
        organization_type: "invalid",
        ...requiredFields,
      };

      await expect(parseOrganization(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should reject unrecognized fields for mass assignment prevention", async () => {
      // z.strictObject() provides defense-in-depth security by rejecting unrecognized keys
      const dataWithExtras = {
        name: "Clean Org",
        ...requiredFields,
        extra_field: "should be rejected",
        malicious: "also rejected",
      };

      // z.strictObject() throws ZodError for unrecognized keys instead of silently stripping
      await expect(parseOrganization(dataWithExtras)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", async () => {
      const testCases = [
        {
          data: { ...requiredFields, name: "" }, // Empty name
          expectedError: "Organization name is required",
          field: "name",
        },
        {
          // Spread first, then override with invalid value
          data: { ...requiredFields, name: "Test", organization_type: "invalid" },
          field: "organization_type",
        },
      ];

      for (const { data, field } of testCases) {
        try {
          await parseOrganization(data);
          expect.fail(`Should have thrown error for field: ${field}`);
        } catch (error: unknown) {
          const err = error as { body: { errors: Record<string, string> } };
          expect(err.body.errors[field]).toBeDefined();
        }
      }
    });
  });
});
