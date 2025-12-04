/**
 * Tests for tag API boundary integration
 * Focus: API payload validation, type coercion, and security
 */

import { describe, it, expect } from "vitest";
import { tagSchema, validateCreateTag, validateUpdateTag } from "../../tags";

describe("Tag API Boundary Integration", () => {
  it("should validate at creation boundary", () => {
    const apiPayload = {
      name: "  API Tag  ",
      color: "purple",
    };

    const result = validateCreateTag(apiPayload);
    expect(result.name).toBe("API Tag");
    expect(result.color).toBe("purple");
  });

  it("should reject extra fields at creation (z.strictObject security)", () => {
    const apiPayload = {
      name: "API Tag",
      color: "purple",
      extra_field: "should be rejected",
    };

    // z.strictObject() rejects unrecognized keys (mass assignment prevention)
    expect(() => validateCreateTag(apiPayload)).toThrow();
  });

  it("should validate at update boundary", () => {
    const apiPayload = {
      id: "tag-123",
      color: "green",
    };

    const result = validateUpdateTag(apiPayload);
    expect(result.id).toBe("tag-123");
    expect(result.color).toBe("green");
  });

  it("should reject malicious fields at update (z.strictObject security)", () => {
    const apiPayload = {
      id: "tag-123",
      color: "green",
      malicious_field: "should be rejected",
    };

    // z.strictObject() rejects unrecognized keys (mass assignment prevention)
    expect(() => validateUpdateTag(apiPayload)).toThrow();
  });

  it("should handle type coercion at boundary", () => {
    const apiPayload = {
      id: 123, // Number instead of string
      name: "Coerced Tag",
      color: "blue",
    };

    const result = tagSchema.parse(apiPayload);
    expect(result.id).toBe(123);
  });
});
