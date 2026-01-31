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
  createOrganizationSchema,
  organizationQuickCreateSchema,
  type OrganizationType,
  type OrganizationPriority,
} from "../organizations";
import { PLAYBOOK_CATEGORY_IDS } from "../segments";

describe("Organization Validation Schemas (organizations.ts)", () => {
  describe("organizationTypeSchema", () => {
    it("should accept all valid organization types", () => {
      const validTypes: OrganizationType[] = ["customer", "prospect", "principal", "distributor"];

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

  describe("organizationSchema defaults behavior", () => {
    /**
     * Per audit fix (commit 4f0245d2b): Schema no longer provides silent defaults
     * for organization_type, priority, status to prevent data masking issues.
     *
     * Form layer (OrganizationCreate.tsx) now provides explicit defaults:
     *   status: "active"
     *   organization_type: "prospect"
     *   priority: "C"
     *
     * Only country fields and booleans retain schema defaults (safe for forms).
     */

    it("does NOT provide silent default for organization_type (form layer responsibility)", () => {
      const defaults = organizationSchema.partial().parse({});
      // organization_type should be undefined - form provides explicit default
      expect(defaults.organization_type).toBeUndefined();
    });

    it("does NOT provide silent default for priority (form layer responsibility)", () => {
      const defaults = organizationSchema.partial().parse({});
      // priority should be undefined - form provides explicit default
      expect(defaults.priority).toBeUndefined();
    });

    it("does NOT provide silent default for status (form layer responsibility)", () => {
      const defaults = organizationSchema.partial().parse({});
      // status should be undefined - form provides explicit default
      expect(defaults.status).toBeUndefined();
    });

    it("extracts 'US' as default billing_country via .partial().parse({})", () => {
      // Country defaults are safe to keep in schema (ISO codes, not business logic)
      const defaults = organizationSchema.partial().parse({});
      expect(defaults.billing_country).toBe("US");
    });

    it("extracts true as default is_operating_entity via .partial().parse({})", () => {
      // Boolean defaults are safe to keep in schema
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
    // Required fields after audit fix (commit 4f0245d2b)
    const requiredFields = {
      organization_type: "prospect" as const,
      priority: "C" as const,
      status: "active" as const,
    };

    it("requires name field", () => {
      const result = organizationSchema.safeParse({
        ...requiredFields,
        // name intentionally missing
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
        ...requiredFields,
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

  describe("URL TLD validation", () => {
    it("rejects URLs without TLD (e.g., https://invalid-website)", () => {
      const result = organizationSchema.partial().safeParse({
        website: "invalid-website", // Will be prefixed to https://invalid-website
      });
      expect(result.success).toBe(false);
    });

    it("accepts URLs with valid TLD (e.g., example.com)", () => {
      const result = organizationSchema.partial().safeParse({
        website: "example.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.website).toBe("https://example.com");
      }
    });

    it("accepts empty website", () => {
      const result = organizationSchema.partial().safeParse({
        website: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Phone number validation", () => {
    it("rejects phone with less than 10 digits", () => {
      const result = organizationSchema.partial().safeParse({
        phone: "abc123", // Only 3 digits
      });
      expect(result.success).toBe(false);
    });

    it("accepts phone with 10+ digits in various formats", () => {
      const validPhones = ["5551234567", "(555) 123-4567", "555.123.4567", "+1 555-123-4567"];

      validPhones.forEach((phone) => {
        const result = organizationSchema.partial().safeParse({ phone });
        expect(result.success).toBe(true);
      });
    });

    it("accepts empty phone", () => {
      const result = organizationSchema.partial().safeParse({
        phone: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createOrganizationSchema - segment_id Unknown rejection", () => {
    // Minimal valid data for the create schema
    const validCreateData = {
      name: "Test Organization",
      organization_type: "prospect" as const,
      sales_id: 1,
      segment_id: PLAYBOOK_CATEGORY_IDS["Major Broadline"],
      priority: "C" as const,
      status: "active" as const,
    };

    it("should reject Unknown segment UUID on create", () => {
      const dataWithUnknown = {
        ...validCreateData,
        segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
      };

      const result = createOrganizationSchema.safeParse(dataWithUnknown);
      expect(result.success).toBe(false);
      if (!result.success) {
        const segmentError = result.error.issues.find((i) => i.path[0] === "segment_id");
        expect(segmentError).toBeDefined();
        expect(segmentError?.message).toMatch(/select a specific segment/i);
      }
    });

    it("should reject missing segment_id on create", () => {
      const { segment_id: _, ...dataWithoutSegment } = validCreateData;

      const result = createOrganizationSchema.safeParse(dataWithoutSegment);
      expect(result.success).toBe(false);
    });

    it("should accept valid segment UUID on create", () => {
      const result = createOrganizationSchema.safeParse(validCreateData);
      expect(result.success).toBe(true);
    });

    it("should accept all non-Unknown playbook category UUIDs", () => {
      const nonUnknownCategories = Object.entries(PLAYBOOK_CATEGORY_IDS).filter(
        ([name]) => name !== "Unknown"
      );

      nonUnknownCategories.forEach(([_name, id]) => {
        const data = { ...validCreateData, segment_id: id };
        const result = createOrganizationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("base organizationSchema still allows Unknown segment (edit compatibility)", () => {
      // Base schema must NOT reject Unknown — edit forms rely on it
      const result = organizationSchema.partial().safeParse({
        segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Postal code validation", () => {
    it("rejects invalid ZIP codes", () => {
      const invalidZips = ["1234", "123456", "ABCDE", "12345-678"];

      invalidZips.forEach((postal_code) => {
        const result = organizationSchema.partial().safeParse({ postal_code });
        expect(result.success).toBe(false);
      });
    });

    it("accepts valid 5-digit ZIP codes", () => {
      const result = organizationSchema.partial().safeParse({
        postal_code: "12345",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid ZIP+4 codes", () => {
      const result = organizationSchema.partial().safeParse({
        postal_code: "12345-6789",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty postal code", () => {
      const result = organizationSchema.partial().safeParse({
        postal_code: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("organizationQuickCreateSchema - Unknown segment allowed", () => {
    // Minimal valid data for quick create
    const validQuickCreateData = {
      name: "Quick Org",
      organization_type: "prospect" as const,
      priority: "C" as const,
      segment_id: PLAYBOOK_CATEGORY_IDS["Major Broadline"],
    };

    it("should ALLOW Unknown segment UUID (quick create exception)", () => {
      const dataWithUnknown = {
        ...validQuickCreateData,
        segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
      };

      const result = organizationQuickCreateSchema.safeParse(dataWithUnknown);
      expect(result.success).toBe(true);
    });

    it("should accept valid segment UUID", () => {
      const result = organizationQuickCreateSchema.safeParse(validQuickCreateData);
      expect(result.success).toBe(true);
    });

    it("should accept all playbook category UUIDs including Unknown", () => {
      Object.entries(PLAYBOOK_CATEGORY_IDS).forEach(([_name, id]) => {
        const data = { ...validQuickCreateData, segment_id: id };
        const result = organizationQuickCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject missing segment_id", () => {
      const { segment_id: _, ...dataWithoutSegment } = validQuickCreateData;

      const result = organizationQuickCreateSchema.safeParse(dataWithoutSegment);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID format", () => {
      const dataWithInvalidUUID = {
        ...validQuickCreateData,
        segment_id: "not-a-valid-uuid",
      };

      const result = organizationQuickCreateSchema.safeParse(dataWithInvalidUUID);
      expect(result.success).toBe(false);
    });

    it("createOrganizationSchema still rejects Unknown (maintains full create validation)", () => {
      // Verify the full create schema still has stricter validation
      const dataWithUnknown = {
        name: "Test Organization",
        organization_type: "prospect" as const,
        sales_id: 1,
        segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
        priority: "C" as const,
        status: "active" as const,
      };

      const result = createOrganizationSchema.safeParse(dataWithUnknown);
      expect(result.success).toBe(false);
      if (!result.success) {
        const segmentError = result.error.issues.find((i) => i.path[0] === "segment_id");
        expect(segmentError).toBeDefined();
        expect(segmentError?.message).toMatch(/select a specific segment/i);
      }
    });
  });
});
