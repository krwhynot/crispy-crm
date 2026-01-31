/**
 * Tests for .max() constraints on segments validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import { segmentSchema, createSegmentSchema, playbookSegmentSchema } from "../segments";
import { z } from "zod";

describe("Segments .max() Constraints", () => {
  describe("name field", () => {
    it("should accept name at max length (100 chars)", () => {
      const validSegment = {
        name: "a".repeat(100),
        segment_type: "playbook" as const,
      };
      expect(() => segmentSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject name over max length (101 chars)", () => {
      const invalidSegment = {
        name: "a".repeat(101),
        segment_type: "playbook" as const,
      };
      expect(() => segmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("id field (UUID)", () => {
    it("should accept valid UUID", () => {
      const validSegment = {
        id: "22222222-2222-4222-8222-000000000001",
        name: "Test",
        segment_type: "playbook" as const,
      };
      expect(() => segmentSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject invalid UUID format", () => {
      const invalidSegment = {
        id: "not-a-uuid",
        name: "Test",
        segment_type: "playbook" as const,
      };
      expect(() => segmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("parent_id field (UUID)", () => {
    it("should accept valid UUID parent_id", () => {
      const validSegment = {
        name: "Test",
        segment_type: "operator" as const,
        parent_id: "33333333-3333-4333-8333-000000000001",
      };
      expect(() => segmentSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject invalid UUID format for parent_id", () => {
      const invalidSegment = {
        name: "Test",
        segment_type: "operator" as const,
        parent_id: "not-a-uuid",
      };
      expect(() => segmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });

    it("should accept null parent_id", () => {
      const validSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        parent_id: null,
      };
      expect(() => segmentSchema.parse(validSegment)).not.toThrow();
    });
  });

  describe("created_by field (UUID)", () => {
    it("should accept valid UUID created_by", () => {
      const validSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        created_by: "550e8400-e29b-41d4-a716-446655440000",
      };
      expect(() => segmentSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject invalid UUID format for created_by", () => {
      const invalidSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        created_by: "not-a-uuid",
      };
      expect(() => segmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("created_at field (timestamp)", () => {
    it("should accept timestamp at max length (50 chars)", () => {
      const validSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        created_at: "2024-01-01T00:00:00.000Z",
      };
      expect(() => segmentSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject timestamp over max length (51 chars)", () => {
      const invalidSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        created_at: "a".repeat(51),
      };
      expect(() => segmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("display_order field", () => {
    it("should accept display_order at max value (9999)", () => {
      const validSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        display_order: 9999,
      };
      expect(() => segmentSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject display_order over max value (10000)", () => {
      const invalidSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        display_order: 10000,
      };
      expect(() => segmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });

    it("should reject negative display_order", () => {
      const invalidSegment = {
        name: "Test",
        segment_type: "playbook" as const,
        display_order: -1,
      };
      expect(() => segmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("playbookSegmentSchema", () => {
    it("should only accept playbook category names", () => {
      const validSegment = {
        name: "Major Broadline",
        segment_type: "playbook" as const,
      };
      expect(() => playbookSegmentSchema.parse(validSegment)).not.toThrow();

      const invalidSegment = {
        name: "Invalid Category",
        segment_type: "playbook" as const,
      };
      expect(() => playbookSegmentSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("createSegmentSchema", () => {
    it("should enforce max constraints on create", () => {
      const validCreate = {
        name: "a".repeat(100),
        segment_type: "operator" as const,
      };
      expect(() => createSegmentSchema.parse(validCreate)).not.toThrow();

      const invalidCreate = {
        name: "a".repeat(101),
        segment_type: "operator" as const,
      };
      expect(() => createSegmentSchema.parse(invalidCreate)).toThrow(z.ZodError);
    });
  });
});
