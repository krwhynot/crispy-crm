/**
 * DoS Protection Tests for Operator Segment Validation
 *
 * Tests .max() constraints on unbounded strings to prevent DoS attacks
 * Part of Task 8 (audit remediation)
 */

import { describe, it, expect } from "vitest";
import {
  operatorSegmentRecordSchema,
  createOperatorSegmentSchema,
  updateOperatorSegmentSchema,
} from "../../operatorSegments";
import { z } from "zod";

describe("Operator Segment DoS Protection", () => {
  describe("operatorSegmentRecordSchema - bounded string limits", () => {
    it("should enforce 50 char limit on UUID strings", () => {
      const validUUID = "33333333-3333-4333-8333-000000000001";
      const tooLongId = "a".repeat(51);

      expect(() =>
        operatorSegmentRecordSchema.parse({
          id: validUUID,
          name: "Full-Service Restaurant",
          segment_type: "operator",
        })
      ).not.toThrow();

      expect(() =>
        operatorSegmentRecordSchema.parse({
          id: tooLongId,
          name: "Full-Service Restaurant",
          segment_type: "operator",
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on parent_id UUID strings", () => {
      const validUUID = "33333333-3333-4333-8333-000000000001";
      const tooLongId = "a".repeat(51);

      expect(() =>
        operatorSegmentRecordSchema.parse({
          name: "Fine Dining",
          segment_type: "operator",
          parent_id: validUUID,
        })
      ).not.toThrow();

      expect(() =>
        operatorSegmentRecordSchema.parse({
          name: "Fine Dining",
          segment_type: "operator",
          parent_id: tooLongId,
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on created_by UUID strings", () => {
      const validUUID = "11111111-1111-4111-8111-111111111111";
      const tooLongId = "a".repeat(51);

      expect(() =>
        operatorSegmentRecordSchema.parse({
          name: "Full-Service Restaurant",
          segment_type: "operator",
          created_by: validUUID,
        })
      ).not.toThrow();

      expect(() =>
        operatorSegmentRecordSchema.parse({
          name: "Full-Service Restaurant",
          segment_type: "operator",
          created_by: tooLongId,
        })
      ).toThrow(z.ZodError);
    });
  });

  describe("createOperatorSegmentSchema - bounded string limits", () => {
    it("should enforce 50 char limit on parent_id UUID strings", () => {
      const validUUID = "33333333-3333-4333-8333-000000000001";
      const tooLongId = "a".repeat(51);

      expect(() =>
        createOperatorSegmentSchema.parse({
          name: "Fine Dining",
          segment_type: "operator",
          parent_id: validUUID,
        })
      ).not.toThrow();

      expect(() =>
        createOperatorSegmentSchema.parse({
          name: "Fine Dining",
          segment_type: "operator",
          parent_id: tooLongId,
        })
      ).toThrow(z.ZodError);
    });
  });

  describe("updateOperatorSegmentSchema - bounded string limits", () => {
    it("should enforce 50 char limit on ID UUID strings", () => {
      const validUUID = "33333333-3333-4333-8333-000000000001";
      const tooLongId = "a".repeat(51);

      expect(() =>
        updateOperatorSegmentSchema.parse({
          id: validUUID,
          name: "Fine Dining",
        })
      ).not.toThrow();

      expect(() =>
        updateOperatorSegmentSchema.parse({
          id: tooLongId,
          name: "Fine Dining",
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on parent_id UUID strings", () => {
      const validUUID = "33333333-3333-4333-8333-000000000001";
      const validParentUUID = "33333333-3333-4333-8333-000000000002";
      const tooLongId = "a".repeat(51);

      expect(() =>
        updateOperatorSegmentSchema.parse({
          id: validUUID,
          parent_id: validParentUUID,
        })
      ).not.toThrow();

      expect(() =>
        updateOperatorSegmentSchema.parse({
          id: validUUID,
          parent_id: tooLongId,
        })
      ).toThrow(z.ZodError);
    });
  });
});
