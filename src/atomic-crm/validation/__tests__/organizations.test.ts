/**
 * Tests for organizations.ts validation schemas
 * Ensures schema defaults are correctly extracted for form defaultValues
 *
 * Pattern: Form defaults come from Zod schema via .partial().parse({})
 * This is Engineering Constitution #5: Form State From Truth
 */

import { describe, it, expect } from "vitest";
import {
  organizationSchema,
  organizationTypeSchema,
  organizationPrioritySchema,
  type OrganizationType,
  type OrganizationPriority,
} from "../organizations";

describe("Organization Validation Schemas (organizations.ts)", () => {
  describe("organizationTypeSchema", () => {
    it("should accept all valid organization types", () => {
      const validTypes: OrganizationType[] = [
        "customer",
        "prospect",
        "principal",
        "distributor",
      ];

      validTypes.forEach((type) => {
        const result = organizationTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid organization types", () => {
      const invalidTypes = ["invalid", "lead", "vendor", "", null, undefined];

      invalidTypes.forEach((type) => {
        const result = organizationTypeSchema.safeParse(type);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("organizationPrioritySchema", () => {
    it("should accept all valid priorities", () => {
      const validPriorities: OrganizationPriority[] = ["A", "B", "C", "D"];

      validPriorities.forEach((priority) => {
        const result = organizationPrioritySchema.safeParse(priority);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid priorities", () => {
      const invalidPriorities = ["E", "1", "low", "high", "", null];

      invalidPriorities.forEach((priority) => {
        const result = organizationPrioritySchema.safeParse(priority);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("organizationSchema defaults", () => {
    it("extracts 'prospect' as default organization_type via .partial().parse({})", () => {
      // This is the exact pattern used in OrganizationCreate.tsx:239
      // const formDefaults = { ...organizationSchema.partial().parse({}) }
      const defaults = organizationSchema.partial().parse({});
      expect(defaults.organization_type).toBe("prospect");
    });

    it("extracts 'C' as default priority via .partial().parse({})", () => {
      const defaults = organizationSchema.partial().parse({});
      expect(defaults.priority).toBe("C");
    });

    it("extracts 'active' as default status via .partial().parse({})", () => {
      const defaults = organizationSchema.partial().parse({});
      expect(defaults.status).toBe("active");
    });

    it("extracts 'US' as default billing_country via .partial().parse({})", () => {
      const defaults = organizationSchema.partial().parse({});
      expect(defaults.billing_country).toBe("US");
    });

    it("extracts true as default is_operating_entity via .partial().parse({})", () => {
      const defaults = organizationSchema.partial().parse({});
      expect(defaults.is_operating_entity).toBe(true);
    });

    it("preserves existing organization_type when parsing with .partial()", () => {
      // Simulates edit form scenario: existing record has "customer" type
      // Should NOT be overwritten by schema default "prospect"
      const existing = { organization_type: "customer" as const };
      const result = organizationSchema.partial().parse(existing);
      expect(result.organization_type).toBe("customer");
    });

    it("preserves existing priority when parsing with .partial()", () => {
      const existing = { priority: "A" as const };
      const result = organizationSchema.partial().parse(existing);
      expect(result.priority).toBe("A");
    });

    it("allows all fields to be optional via .partial()", () => {
      // This is critical: .partial() makes ALL fields optional
      // So we can call .parse({}) without providing any fields
      const result = organizationSchema.partial().safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("organizationSchema validation", () => {
    it("requires name field", () => {
      const result = organizationSchema.safeParse({
        organization_type: "prospect",
        priority: "C",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((i) => i.path[0] === "name");
        expect(nameError).toBeDefined();
      }
    });

    it("validates name max length (255)", () => {
      const result = organizationSchema.safeParse({
        name: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("transforms website to add https:// prefix", () => {
      const result = organizationSchema.partial().parse({
        website: "example.com",
      });
      expect(result.website).toBe("https://example.com");
    });

    it("preserves existing https:// in website", () => {
      const result = organizationSchema.partial().parse({
        website: "https://example.com",
      });
      expect(result.website).toBe("https://example.com");
    });
  });
});
