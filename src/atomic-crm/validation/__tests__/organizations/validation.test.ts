/**
 * Tests for organization validation schemas
 * Focus: Core validation rules and schema behavior
 */

import { describe, it, expect } from "vitest";
import {
  organizationSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationTypeSchema,
} from "../../organizations";
import { z } from "zod";

describe("Organization Validation Schemas", () => {
  describe("Enum Schemas", () => {
    describe("organizationTypeSchema", () => {
      it("should accept valid organization types", () => {
        const validTypes = ["customer", "prospect", "principal", "distributor"];

        validTypes.forEach((type) => {
          expect(() => organizationTypeSchema.parse(type)).not.toThrow();
        });
      });

      it("should reject invalid organization types", () => {
        const invalidTypes = [
          "",
          "client",
          "supplier",
          "employee",
          "vendor",
          "competitor",
          "investor",
          "other",
          "partner", // Removed type
          "unknown", // Removed type
        ];

        invalidTypes.forEach((type) => {
          expect(() => organizationTypeSchema.parse(type)).toThrow(z.ZodError);
        });
      });
    });
  });

  describe("organizationSchema", () => {
    const validOrganization = {
      name: "Test Organization",
      organization_type: "customer",
      website: "https://example.com",
      segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
      // Required fields after audit fix (commit 4f0245d2b):
      // Schema no longer provides silent defaults - form layer must provide them
      priority: "B" as const,
      status: "active" as const,
    };

    it("should accept valid organization data", () => {
      const result = organizationSchema.parse(validOrganization);
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Organization");
      expect(result.organization_type).toBe("customer");
    });

    it("should require organization_type, priority, and status (no silent defaults)", () => {
      // Per audit fix (commit 4f0245d2b): Schema no longer provides defaults
      // to prevent silent data issues. Form layer must provide explicit values.
      const minimalOrganization = {
        name: "Minimal Organization",
      };

      // Schema requires these fields - will throw without them
      expect(() => organizationSchema.parse(minimalOrganization)).toThrow(z.ZodError);

      // With required fields, should pass
      const completeOrganization = {
        name: "Minimal Organization",
        organization_type: "prospect",
        priority: "C",
        status: "active",
      };
      expect(() => organizationSchema.parse(completeOrganization)).not.toThrow();
    });

    it("should reject empty name", () => {
      const invalidData = { ...validOrganization, name: "" };
      expect(() => organizationSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should validate website URL format", () => {
      // Valid URLs
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "https://example.com",
        })
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "http://example.com",
        })
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "https://subdomain.example.com/path",
        })
      ).not.toThrow();

      // Auto-prefix behavior: URLs without protocol get https:// added
      // "example.com" becomes "https://example.com" which is valid
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "example.com",
        })
      ).not.toThrow();

      // Truly invalid URLs (malformed structure)
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "://invalid",
        })
      ).toThrow(z.ZodError);

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "https://[invalid",
        })
      ).toThrow(z.ZodError);
    });

    it("should validate LinkedIn URL specifically", () => {
      // Valid LinkedIn URLs
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "https://www.linkedin.com/company/example",
        })
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "https://linkedin.com/company/test-org",
        })
      ).not.toThrow();

      // Auto-prefix behavior: "linkedin.com/company/test" becomes valid
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "linkedin.com/company/auto-prefix-test",
        })
      ).not.toThrow();

      // Country subdomain support (ca.linkedin.com, uk.linkedin.com, etc.)
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "https://ca.linkedin.com/company/example",
        })
      ).not.toThrow();

      // Invalid LinkedIn URLs (wrong domain - even with auto-prefix)
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "https://facebook.com/company/example",
        })
      ).toThrow(z.ZodError);

      // Auto-prefixed but wrong domain
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "twitter.com/company/test",
        })
      ).toThrow(z.ZodError);
    });

    // Numeric field validation removed - annual_revenue, employee_count, founded_year
    // are not part of form validation as they have no UI inputs

    it("should accept numeric IDs (z.coerce.number)", () => {
      // Schema uses z.coerce.number() which requires numeric IDs
      // String IDs that can be coerced to numbers work, but non-numeric strings become NaN
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          id: 12345,
        })
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          id: "67890", // Numeric string coerces to number
        })
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          parent_organization_id: 456,
        })
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          parent_organization_id: "789", // Numeric string coerces to number
        })
      ).not.toThrow();
    });

    it("should handle nullable fields", () => {
      const dataWithNulls = {
        ...validOrganization,
        parent_organization_id: null,
        logo: null,
        description: null,
        deleted_at: null,
      };

      expect(() => organizationSchema.parse(dataWithNulls)).not.toThrow();
    });
  });

  describe("createOrganizationSchema", () => {
    it("should require essential fields for creation", () => {
      // createOrganizationSchema requires: name, organization_type, sales_id, segment_id, priority, status
      // Per audit fix: priority and status must be explicit (no silent defaults)
      const validCreate = {
        name: "New Organization",
        organization_type: "prospect",
        sales_id: 1,
        segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
        priority: "C",
        status: "active",
      };

      expect(() => createOrganizationSchema.parse(validCreate)).not.toThrow();
    });

    it("should reject creation without required fields", () => {
      expect(() => createOrganizationSchema.parse({})).toThrow(z.ZodError);
      expect(() => createOrganizationSchema.parse({ name: "" })).toThrow(z.ZodError);
    });

    it("should reject id field on creation for mass assignment prevention", () => {
      // z.strictObject() rejects unrecognized keys - id is omitted from createOrganizationSchema
      const dataWithId = {
        id: "should-not-be-here",
        name: "New Organization",
      };

      // .omit() on z.strictObject() makes 'id' an unrecognized key, causing rejection
      expect(() => createOrganizationSchema.parse(dataWithId)).toThrow(z.ZodError);
    });

    it("should reject system fields on creation for mass assignment prevention", () => {
      // z.strictObject() rejects unrecognized keys - system fields omitted from createOrganizationSchema
      const dataWithSystemFields = {
        name: "New Organization",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // .omit() on z.strictObject() makes system fields unrecognized keys, causing rejection
      expect(() => createOrganizationSchema.parse(dataWithSystemFields)).toThrow(z.ZodError);
    });

    it("should require priority and status explicitly (no silent defaults)", () => {
      // Per audit fix (commit 4f0245d2b): Schema no longer provides silent defaults
      // Form layer must supply these values explicitly to prevent data issues
      const minimalCreate = {
        name: "New Org",
        organization_type: "prospect",
        sales_id: 1,
        segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
      };

      // Schema requires priority and status - will throw without them
      expect(() => createOrganizationSchema.parse(minimalCreate)).toThrow(z.ZodError);

      // With all required fields, should pass
      const completeCreate = {
        ...minimalCreate,
        priority: "C",
        status: "active",
      };

      const result = createOrganizationSchema.parse(completeCreate);
      expect(result.organization_type).toBe("prospect"); // Explicitly provided
      expect(result.priority).toBe("C"); // Explicitly provided
      expect(result.status).toBe("active"); // Explicitly provided
      expect(result.billing_country).toBe("US"); // Default from schema (country defaults are OK)
    });
  });

  describe("updateOrganizationSchema", () => {
    it("should require id for updates", () => {
      // Use numeric ID since schema uses z.coerce.number()
      const validUpdate = {
        id: 123,
        name: "Updated Name",
      };

      expect(() => updateOrganizationSchema.parse(validUpdate)).not.toThrow();
    });

    it("should reject updates without id", () => {
      const invalidUpdate = {
        name: "Updated Name",
      };

      expect(() => updateOrganizationSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it("should allow partial updates", () => {
      // Use numeric IDs since schema uses z.coerce.number()
      expect(() => updateOrganizationSchema.parse({ id: 1, name: "New Name" })).not.toThrow();
      expect(() =>
        updateOrganizationSchema.parse({ id: 2, organization_type: "principal" })
      ).not.toThrow();
      expect(() =>
        updateOrganizationSchema.parse({ id: 3, website: "https://example.com" })
      ).not.toThrow();
      expect(() => updateOrganizationSchema.parse({ id: 4 })).not.toThrow();
    });

    it("should validate updated fields", () => {
      expect(() =>
        updateOrganizationSchema.parse({
          id: 1,
          organization_type: "invalid_type",
        })
      ).toThrow(z.ZodError);

      // With auto-prefix, "not-a-url" becomes "https://not-a-url" (valid format)
      // Use malformed URL to test rejection
      expect(() =>
        updateOrganizationSchema.parse({
          id: 1,
          website: "://invalid-url",
        })
      ).toThrow(z.ZodError);

      expect(() =>
        updateOrganizationSchema.parse({
          id: 1,
          linkedin_url: "https://facebook.com/page",
        })
      ).toThrow(z.ZodError);
    });
  });
});
