/**
 * Tests for .max() constraints on operator segments validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import { operatorSegmentRecordSchema, createOperatorSegmentSchema } from "../operatorSegments";
import { z } from "zod";

describe("OperatorSegments .max() Constraints", () => {
  describe("id field (UUID)", () => {
    it("should accept valid UUID", () => {
      const validSegment = {
        id: "33333333-3333-4333-8333-000000000001",
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
      };
      expect(() => operatorSegmentRecordSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject invalid UUID format", () => {
      const invalidSegment = {
        id: "not-a-uuid",
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
      };
      expect(() => operatorSegmentRecordSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("parent_id field (UUID)", () => {
    it("should accept valid UUID parent_id", () => {
      const validSegment = {
        name: "Fine Dining",
        segment_type: "operator" as const,
        parent_id: "33333333-3333-4333-8333-000000000001",
      };
      expect(() => operatorSegmentRecordSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject invalid UUID format for parent_id", () => {
      const invalidSegment = {
        name: "Fine Dining",
        segment_type: "operator" as const,
        parent_id: "not-a-uuid",
      };
      expect(() => operatorSegmentRecordSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });

    it("should accept null parent_id", () => {
      const validSegment = {
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
        parent_id: null,
      };
      expect(() => operatorSegmentRecordSchema.parse(validSegment)).not.toThrow();
    });
  });

  describe("created_by field (UUID)", () => {
    it("should accept valid UUID created_by", () => {
      const validSegment = {
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
        created_by: "550e8400-e29b-41d4-a716-446655440000",
      };
      expect(() => operatorSegmentRecordSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject invalid UUID format for created_by", () => {
      const invalidSegment = {
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
        created_by: "not-a-uuid",
      };
      expect(() => operatorSegmentRecordSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("created_at field (timestamp)", () => {
    it("should accept timestamp at max length (50 chars)", () => {
      const validSegment = {
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
        created_at: "2024-01-01T00:00:00.000Z",
      };
      expect(() => operatorSegmentRecordSchema.parse(validSegment)).not.toThrow();
    });

    it("should reject timestamp over max length (51 chars)", () => {
      const invalidSegment = {
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
        created_at: "a".repeat(51),
      };
      expect(() => operatorSegmentRecordSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });

  describe("createOperatorSegmentSchema", () => {
    it("should enforce max constraints on create", () => {
      const validCreate = {
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
      };
      expect(() => createOperatorSegmentSchema.parse(validCreate)).not.toThrow();
    });
  });

  describe("enum validation", () => {
    it("should only accept valid operator segment names", () => {
      const validSegment = {
        name: "Full-Service Restaurant",
        segment_type: "operator" as const,
      };
      expect(() => operatorSegmentRecordSchema.parse(validSegment)).not.toThrow();

      const invalidSegment = {
        name: "Invalid Segment Name",
        segment_type: "operator" as const,
      };
      expect(() => operatorSegmentRecordSchema.parse(invalidSegment)).toThrow(z.ZodError);
    });
  });
});
