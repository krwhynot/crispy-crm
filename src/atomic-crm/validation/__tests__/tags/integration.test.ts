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
      extra_field: "should be ignored",
    };

    const result = validateCreateTag(apiPayload);
    expect(result.name).toBe("API Tag");
    expect(result.color).toBe("purple");
    expect("extra_field" in result).toBe(false);
  });

  it("should validate at update boundary", () => {
    const apiPayload = {
      id: "tag-123",
      color: "green",
      malicious_field: "should be ignored",
    };

    const result = validateUpdateTag(apiPayload);
    expect(result.id).toBe("tag-123");
    expect(result.color).toBe("green");
    expect("malicious_field" in result).toBe(false);
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
