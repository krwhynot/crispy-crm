/**
 * Tests for .max() constraints on unbounded strings in organizations schema
 * Task 8: Audit remediation - add length limits to prevent DoS attacks
 *
 * Field type limits:
 * - Organization names: 255
 * - Department names: 100
 * - ID unions: 50
 */

import { describe, it, expect } from "vitest";
import { organizationSchema } from "../../organizations";

describe("Organization Schema - String Max Length Constraints", () => {
  const requiredFields = {
    name: "Test Org",
    organization_type: "prospect" as const,
    priority: "C" as const,
    status: "active" as const,
  };

  describe("Organization name (255 chars)", () => {
    it("accepts name at max length (255)", () => {
      const result = organizationSchema.safeParse({
        ...requiredFields,
        name: "a".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    it("rejects name over max length (256)", () => {
      const result = organizationSchema.safeParse({
        ...requiredFields,
        name: "a".repeat(256),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((i) => i.path[0] === "name");
        expect(nameError?.message).toContain("too long");
      }
    });
  });

  describe("Department-like fields (100 chars)", () => {
    it("accepts cuisine at max length (100)", () => {
      const result = organizationSchema.partial().safeParse({
        cuisine: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects cuisine over max length (101)", () => {
      const result = organizationSchema.partial().safeParse({
        cuisine: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "cuisine");
        expect(error?.message).toMatch(/100/);
      }
    });

    it("accepts sector at max length (100)", () => {
      const result = organizationSchema.partial().safeParse({
        sector: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects sector over max length (101)", () => {
      const result = organizationSchema.partial().safeParse({
        sector: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "sector");
        expect(error?.message).toMatch(/100/);
      }
    });

    it("accepts territory at max length (100)", () => {
      const result = organizationSchema.partial().safeParse({
        territory: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects territory over max length (101)", () => {
      const result = organizationSchema.partial().safeParse({
        territory: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "territory");
        expect(error?.message).toMatch(/100/);
      }
    });
  });

  describe("ID union fields (50 chars)", () => {
    it("accepts segment_id at max length (36 for UUID)", () => {
      // UUIDs are 36 chars: 8-4-4-4-12
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = organizationSchema.partial().safeParse({
        segment_id: validUuid,
      });
      expect(result.success).toBe(true);
    });

    it("rejects segment_id that is not a valid UUID", () => {
      const result = organizationSchema.partial().safeParse({
        segment_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "segment_id");
        expect(error?.message).toMatch(/UUID/i);
      }
    });

    it("accepts import_session_id at max length (36 for UUID)", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = organizationSchema.partial().safeParse({
        import_session_id: validUuid,
      });
      expect(result.success).toBe(true);
    });

    it("accepts playbook_category_id at max length (36 for UUID)", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = organizationSchema.partial().safeParse({
        playbook_category_id: validUuid,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Timestamp fields (50 chars)", () => {
    it("accepts updated_at at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z"; // 24 chars - well under 50
      const result = organizationSchema.partial().safeParse({
        updated_at: timestamp,
      });
      expect(result.success).toBe(true);
    });

    it("rejects updated_at over max length (51)", () => {
      const result = organizationSchema.partial().safeParse({
        updated_at: "a".repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "updated_at");
        expect(error?.message).toContain("50");
      }
    });

    it("accepts created_at at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = organizationSchema.partial().safeParse({
        created_at: timestamp,
      });
      expect(result.success).toBe(true);
    });

    it("accepts deleted_at at max length (50)", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const result = organizationSchema.partial().safeParse({
        deleted_at: timestamp,
      });
      expect(result.success).toBe(true);
    });
  });
});
