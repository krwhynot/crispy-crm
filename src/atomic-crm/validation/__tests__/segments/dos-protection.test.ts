/**
 * DoS Protection Tests for Segment Validation
 *
 * Tests .max() constraints on unbounded strings to prevent DoS attacks
 * Part of Task 8 (audit remediation)
 */

import { describe, it, expect } from "vitest";
import { segmentSchema, createSegmentSchema } from "../../segments";
import { z } from "zod";

describe("Segment DoS Protection", () => {
  describe("segmentSchema - bounded string limits", () => {
    it("should enforce 100 char limit on segment names", () => {
      const maxName = "a".repeat(100);
      const tooLongName = "a".repeat(101);

      expect(() =>
        segmentSchema.parse({
          name: maxName,
          segment_type: "playbook",
        })
      ).not.toThrow();

      expect(() =>
        segmentSchema.parse({
          name: tooLongName,
          segment_type: "playbook",
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on UUID strings", () => {
      const validUUID = "22222222-2222-4222-8222-000000000001";
      const tooLongId = "a".repeat(51);

      expect(() =>
        segmentSchema.parse({
          id: validUUID,
          name: "Test Segment",
          segment_type: "playbook",
        })
      ).not.toThrow();

      expect(() =>
        segmentSchema.parse({
          id: tooLongId,
          name: "Test Segment",
          segment_type: "playbook",
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on parent_id UUID strings", () => {
      const validUUID = "22222222-2222-4222-8222-000000000001";
      const tooLongId = "a".repeat(51);

      expect(() =>
        segmentSchema.parse({
          name: "Child Segment",
          segment_type: "operator",
          parent_id: validUUID,
        })
      ).not.toThrow();

      expect(() =>
        segmentSchema.parse({
          name: "Child Segment",
          segment_type: "operator",
          parent_id: tooLongId,
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on created_by UUID strings", () => {
      const validUUID = "11111111-1111-4111-8111-111111111111";
      const tooLongId = "a".repeat(51);

      expect(() =>
        segmentSchema.parse({
          name: "Test Segment",
          segment_type: "playbook",
          created_by: validUUID,
        })
      ).not.toThrow();

      expect(() =>
        segmentSchema.parse({
          name: "Test Segment",
          segment_type: "playbook",
          created_by: tooLongId,
        })
      ).toThrow(z.ZodError);
    });
  });

  describe("createSegmentSchema - bounded string limits", () => {
    it("should enforce 100 char limit on segment names", () => {
      const maxName = "a".repeat(100);
      const tooLongName = "a".repeat(101);

      expect(() =>
        createSegmentSchema.parse({
          name: maxName,
          segment_type: "playbook",
        })
      ).not.toThrow();

      expect(() =>
        createSegmentSchema.parse({
          name: tooLongName,
          segment_type: "playbook",
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on parent_id UUID strings", () => {
      const validUUID = "22222222-2222-4222-8222-000000000001";
      const tooLongId = "a".repeat(51);

      expect(() =>
        createSegmentSchema.parse({
          name: "Child Segment",
          segment_type: "operator",
          parent_id: validUUID,
        })
      ).not.toThrow();

      expect(() =>
        createSegmentSchema.parse({
          name: "Child Segment",
          segment_type: "operator",
          parent_id: tooLongId,
        })
      ).toThrow(z.ZodError);
    });
  });
});
