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
  organizationStatusSchema,
} from "../../organizations";
import { z } from "zod";

describe("Organization Validation Schemas", () => {
  describe("Enum Schemas", () => {
    describe("organizationTypeSchema", () => {
      it("should accept valid organization types", () => {
        const validTypes = [
          "customer",
          "prospect",
          "partner",
          "vendor",
          "competitor",
          "investor",
          "other",
        ];

        validTypes.forEach((type) => {
          expect(() => organizationTypeSchema.parse(type)).not.toThrow();
        });
      });

      it("should reject invalid organization types", () => {
        const invalidTypes = ["", "client", "supplier", "employee", "unknown"];

        invalidTypes.forEach((type) => {
          expect(() => organizationTypeSchema.parse(type)).toThrow(z.ZodError);
        });
      });
    });

    describe("organizationStatusSchema", () => {
      it("should accept valid statuses", () => {
        const validStatuses = ["active", "inactive", "pending", "suspended"];

        validStatuses.forEach((status) => {
          expect(() => organizationStatusSchema.parse(status)).not.toThrow();
        });
      });

      it("should reject invalid statuses", () => {
        expect(() => organizationStatusSchema.parse("enabled")).toThrow(
          z.ZodError,
        );
        expect(() => organizationStatusSchema.parse("disabled")).toThrow(
          z.ZodError,
        );
        expect(() => organizationStatusSchema.parse("archived")).toThrow(
          z.ZodError,
        );
      });
    });
  });

  describe("organizationSchema", () => {
    const validOrganization = {
      name: "Test Organization",
      type: "customer",
      status: "active",
      website: "https://example.com",
      industry: "Technology",
      annual_revenue: 1000000,
      employee_count: 50,
    };

    it("should accept valid organization data", () => {
      const result = organizationSchema.parse(validOrganization);
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Organization");
      expect(result.type).toBe("customer");
    });

    it("should provide default values", () => {
      const minimalOrganization = {
        name: "Minimal Organization",
      };

      const result = organizationSchema.parse(minimalOrganization);
      expect(result.type).toBe("prospect");
      expect(result.status).toBe("active");
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
        }),
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "http://example.com",
        }),
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "https://subdomain.example.com/path",
        }),
      ).not.toThrow();

      // Invalid URLs
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "not-a-url",
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          website: "example.com",
        }),
      ).toThrow(z.ZodError);
    });

    it("should validate LinkedIn URL specifically", () => {
      // Valid LinkedIn URLs
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "https://www.linkedin.com/company/example",
        }),
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "https://linkedin.com/company/test-org",
        }),
      ).not.toThrow();

      // Invalid LinkedIn URLs
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "https://facebook.com/company/example",
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          linkedin_url: "not-a-url",
        }),
      ).toThrow(z.ZodError);
    });

    it("should validate numeric fields", () => {
      // Valid numbers
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          annual_revenue: 1000000,
          employee_count: 100,
        }),
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          annual_revenue: 0,
          employee_count: 1,
        }),
      ).not.toThrow();

      // Invalid numbers
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          annual_revenue: -1000,
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          employee_count: 0,
        }),
      ).toThrow(z.ZodError);
    });

    it("should accept both string and number IDs", () => {
      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          id: "string-id",
        }),
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          id: 12345,
        }),
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          parent_id: "parent-123",
        }),
      ).not.toThrow();

      expect(() =>
        organizationSchema.parse({
          ...validOrganization,
          parent_id: 456,
        }),
      ).not.toThrow();
    });

    it("should handle nullable fields", () => {
      const dataWithNulls = {
        ...validOrganization,
        parent_id: null,
        logo: null,
        description: null,
        deleted_at: null,
      };

      expect(() => organizationSchema.parse(dataWithNulls)).not.toThrow();
    });

    it("should handle tags array", () => {
      const orgWithTags = {
        ...validOrganization,
        tags: ["enterprise", "technology", "saas"],
      };

      const result = organizationSchema.parse(orgWithTags);
      expect(result.tags).toEqual(["enterprise", "technology", "saas"]);
      expect(result.tags).toHaveLength(3);
    });

    it("should handle sectors array", () => {
      const orgWithSectors = {
        ...validOrganization,
        sectors: ["technology", "finance", "healthcare"],
      };

      const result = organizationSchema.parse(orgWithSectors);
      expect(result.sectors).toEqual(["technology", "finance", "healthcare"]);
      expect(result.sectors).toHaveLength(3);
    });
  });

  describe("createOrganizationSchema", () => {
    it("should require essential fields for creation", () => {
      const validCreate = {
        name: "New Organization",
      };

      expect(() => createOrganizationSchema.parse(validCreate)).not.toThrow();
    });

    it("should reject creation without required fields", () => {
      expect(() => createOrganizationSchema.parse({})).toThrow(z.ZodError);
      expect(() => createOrganizationSchema.parse({ name: "" })).toThrow(
        z.ZodError,
      );
    });

    it("should not allow id field on creation", () => {
      const dataWithId = {
        id: "should-not-be-here",
        name: "New Organization",
      };

      const result = createOrganizationSchema.parse(dataWithId);
      expect("id" in result).toBe(false);
    });

    it("should not include system fields on creation", () => {
      const dataWithSystemFields = {
        name: "New Organization",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = createOrganizationSchema.parse(dataWithSystemFields);
      expect("created_at" in result).toBe(false);
      expect("updated_at" in result).toBe(false);
    });

    it("should apply defaults on creation", () => {
      const minimalCreate = {
        name: "New Org",
      };

      const result = createOrganizationSchema.parse(minimalCreate);
      expect(result.type).toBe("prospect");
      expect(result.status).toBe("active");
    });
  });

  describe("updateOrganizationSchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: "org-123",
        name: "Updated Name",
      };

      expect(() => updateOrganizationSchema.parse(validUpdate)).not.toThrow();
    });

    it("should reject updates without id", () => {
      const invalidUpdate = {
        name: "Updated Name",
      };

      expect(() => updateOrganizationSchema.parse(invalidUpdate)).toThrow(
        z.ZodError,
      );
    });

    it("should allow partial updates", () => {
      expect(() =>
        updateOrganizationSchema.parse({ id: "org-1", name: "New Name" }),
      ).not.toThrow();
      expect(() =>
        updateOrganizationSchema.parse({ id: "org-1", type: "vendor" }),
      ).not.toThrow();
      expect(() =>
        updateOrganizationSchema.parse({
          id: "org-1",
          annual_revenue: 2000000,
        }),
      ).not.toThrow();
      expect(() =>
        updateOrganizationSchema.parse({ id: "org-1" }),
      ).not.toThrow();
    });

    it("should validate updated fields", () => {
      expect(() =>
        updateOrganizationSchema.parse({
          id: "org-1",
          type: "invalid_type",
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        updateOrganizationSchema.parse({
          id: "org-1",
          annual_revenue: -1000,
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        updateOrganizationSchema.parse({
          id: "org-1",
          website: "not-a-url",
        }),
      ).toThrow(z.ZodError);
    });
  });
});