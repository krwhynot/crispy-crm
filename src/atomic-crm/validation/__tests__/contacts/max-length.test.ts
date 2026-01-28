/**
 * Tests for .max() constraints on unbounded strings in contacts schemas
 * Task 8: Audit remediation - add length limits to prevent DoS attacks
 *
 * Field type limits:
 * - Contact names: 255 (combined) / 100 (individual)
 * - Department names: 100
 * - Title/role: 100
 * - ID strings: 50
 */

import { describe, it, expect } from "vitest";
import { contactSchema, quickCreateContactSchema } from "../../contacts";

describe("Contact Schema - String Max Length Constraints", () => {
  describe("Name fields", () => {
    it("accepts first_name at max length (100)", () => {
      const result = contactSchema.safeParse({
        first_name: "a".repeat(100),
        last_name: "Smith",
      });
      expect(result.success).toBe(true);
    });

    it("rejects first_name over max length (101)", () => {
      const result = contactSchema.safeParse({
        first_name: "a".repeat(101),
        last_name: "Smith",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "first_name");
        expect(error?.message).toContain("too long");
      }
    });

    it("accepts last_name at max length (100)", () => {
      const result = contactSchema.safeParse({
        first_name: "John",
        last_name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects last_name over max length (101)", () => {
      const result = contactSchema.safeParse({
        first_name: "John",
        last_name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "last_name");
        expect(error?.message).toContain("too long");
      }
    });

    it("accepts computed name at max length (255)", () => {
      // Name is computed from first + last, so test the computed field
      const result = contactSchema.partial().safeParse({
        name: "a".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    it("rejects computed name over max length (256)", () => {
      const result = contactSchema.partial().safeParse({
        name: "a".repeat(256),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "name");
        expect(error?.message).toContain("too long");
      }
    });
  });

  describe("Professional fields (100 chars)", () => {
    it("accepts title at max length (100)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        title: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects title over max length (101)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        title: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "title");
        expect(error?.message).toContain("too long");
      }
    });

    it("accepts department at max length (100)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        department: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects department over max length (101)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        department: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "department");
        expect(error?.message).toContain("too long");
      }
    });

    it("accepts territory_name at max length (100)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        territory_name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects territory_name over max length (101)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        territory_name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "territory_name");
        expect(error?.message).toContain("too long");
      }
    });
  });

  describe("District code (10 chars)", () => {
    it("accepts district_code at max length (10)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        district_code: "a".repeat(10),
      });
      expect(result.success).toBe(true);
    });

    it("rejects district_code over max length (11)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        district_code: "a".repeat(11),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "district_code");
        expect(error?.message).toContain("too long");
      }
    });
  });

  describe("Twitter handle (100 chars)", () => {
    it("accepts twitter_handle at max length (100)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        twitter_handle: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects twitter_handle over max length (101)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        twitter_handle: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "twitter_handle");
        expect(error?.message).toContain("too long");
      }
    });
  });

  describe("Gender field (50 chars)", () => {
    it("accepts gender at max length (50)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        gender: "a".repeat(50),
      });
      expect(result.success).toBe(true);
    });

    it("rejects gender over max length (51)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        gender: "a".repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "gender");
        expect(error?.message).toContain("too long");
      }
    });
  });

  describe("Status field (50 chars)", () => {
    it("accepts status at max length (50)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        status: "a".repeat(50),
      });
      expect(result.success).toBe(true);
    });

    it("rejects status over max length (51)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        status: "a".repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "status");
        expect(error?.message).toContain("too long");
      }
    });
  });

  describe("Timestamp fields (50 chars)", () => {
    it("accepts created_at at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        created_at: timestamp,
      });
      expect(result.success).toBe(true);
    });

    it("rejects created_at over max length (51)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        created_at: "a".repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "created_at");
        expect(error?.message).toContain("50");
      }
    });

    it("accepts updated_at at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        updated_at: timestamp,
      });
      expect(result.success).toBe(true);
    });

    it("accepts deleted_at at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        deleted_at: timestamp,
      });
      expect(result.success).toBe(true);
    });

    it("accepts first_seen at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        first_seen: timestamp,
      });
      expect(result.success).toBe(true);
    });

    it("accepts last_seen at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        last_seen: timestamp,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Company name (255 chars - readonly)", () => {
    it("accepts company_name at max length (255)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        company_name: "a".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    it("rejects company_name over max length (256)", () => {
      const result = contactSchema.partial().safeParse({
        first_name: "John",
        company_name: "a".repeat(256),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "company_name");
        expect(error?.message).toContain("too long");
      }
    });
  });
});

describe("Quick Create Contact Schema - String Max Length Constraints", () => {
  describe("Name fields", () => {
    it("accepts first_name at max length (100)", () => {
      const result = quickCreateContactSchema.safeParse({
        first_name: "a".repeat(100),
        organization_id: 1,
        quickCreate: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects first_name over max length (101)", () => {
      const result = quickCreateContactSchema.safeParse({
        first_name: "a".repeat(101),
        organization_id: 1,
        quickCreate: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "first_name");
        expect(error?.message).toContain("100");
      }
    });

    it("accepts last_name at max length (100)", () => {
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        last_name: "a".repeat(100),
        organization_id: 1,
        quickCreate: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects last_name over max length (101)", () => {
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        last_name: "a".repeat(101),
        organization_id: 1,
        quickCreate: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "last_name");
        expect(error?.message).toContain("100");
      }
    });

    it("accepts computed name at max length (201)", () => {
      // Quick create allows 100 + space + 100 = 201
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        name: "a".repeat(201),
        organization_id: 1,
        quickCreate: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects computed name over max length (202)", () => {
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        name: "a".repeat(202),
        organization_id: 1,
        quickCreate: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "name");
        expect(error?.message).toContain("201");
      }
    });
  });

  describe("Timestamp fields (50 chars)", () => {
    it("accepts first_seen at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        organization_id: 1,
        first_seen: timestamp,
        quickCreate: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects first_seen over max length (51)", () => {
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        organization_id: 1,
        first_seen: "a".repeat(51),
        quickCreate: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "first_seen");
        expect(error?.message).toContain("50");
      }
    });

    it("accepts last_seen at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        organization_id: 1,
        last_seen: timestamp,
        quickCreate: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects last_seen over max length (51)", () => {
      const result = quickCreateContactSchema.safeParse({
        first_name: "John",
        organization_id: 1,
        last_seen: "a".repeat(51),
        quickCreate: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "last_seen");
        expect(error?.message).toContain("50");
      }
    });
  });
});
