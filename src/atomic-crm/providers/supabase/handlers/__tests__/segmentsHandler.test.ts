/**
 * Tests for segmentsHandler
 *
 * Tests the composed handler for segments resource:
 * 1. isSegmentRecord type guard validates segment shape
 * 2. Type guard properly rejects invalid data structures
 *
 * Engineering Constitution: Type guards replace unsafe double-casts
 */

import { describe, it, expect } from "vitest";
import { isSegmentRecord } from "../segmentsHandler";

describe("isSegmentRecord type guard", () => {
  it("returns true for valid segment with id and name", () => {
    const segment = { id: "test-uuid", name: "Test Segment" };
    expect(isSegmentRecord(segment)).toBe(true);
  });

  it("returns true for segment with all optional fields", () => {
    const segment = {
      id: "test-uuid",
      name: "Test Segment",
      segment_type: "playbook",
      parent_id: null,
      display_order: 0,
      created_at: "2026-01-01T00:00:00Z",
      created_by: "user-uuid",
    };
    expect(isSegmentRecord(segment)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isSegmentRecord(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isSegmentRecord(undefined)).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isSegmentRecord("string")).toBe(false);
    expect(isSegmentRecord(123)).toBe(false);
    expect(isSegmentRecord(true)).toBe(false);
    expect(isSegmentRecord([])).toBe(false);
  });

  it("returns false for object missing id", () => {
    const segment = { name: "Test Segment" };
    expect(isSegmentRecord(segment)).toBe(false);
  });

  it("returns false for object missing name", () => {
    const segment = { id: "test-uuid" };
    expect(isSegmentRecord(segment)).toBe(false);
  });

  it("returns false for object with invalid id type", () => {
    const segment = { id: null, name: "Test" };
    expect(isSegmentRecord(segment)).toBe(false);
  });

  it("returns false for object with invalid name type", () => {
    const segment = { id: "test-uuid", name: 123 };
    expect(isSegmentRecord(segment)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(isSegmentRecord({})).toBe(false);
  });
});
