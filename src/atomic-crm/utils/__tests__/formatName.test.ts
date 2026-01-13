import { describe, it, expect } from "vitest";
import { formatSingleName, formatName } from "../formatName";

describe("formatSingleName (renamed from formatFullName)", () => {
  it("trims and returns single name", () => {
    expect(formatSingleName("  John  ")).toBe("John");
  });

  it("returns placeholder for null/undefined", () => {
    expect(formatSingleName(null)).toBe("--");
    expect(formatSingleName(undefined)).toBe("--");
  });

  it("returns placeholder for empty/whitespace", () => {
    expect(formatSingleName("")).toBe("--");
    expect(formatSingleName("   ")).toBe("--");
  });
});

describe("formatName (first + last with sanitization)", () => {
  it("formats both names", () => {
    expect(formatName("John", "Doe")).toBe("John Doe");
  });

  it("handles missing last name", () => {
    expect(formatName("John", null)).toBe("John");
    expect(formatName("John", undefined)).toBe("John");
  });

  it("handles missing first name", () => {
    expect(formatName(null, "Doe")).toBe("Doe");
    expect(formatName(undefined, "Doe")).toBe("Doe");
  });

  it("returns placeholder for both missing", () => {
    expect(formatName(null, null)).toBe("--");
    expect(formatName("", "")).toBe("--");
  });

  it("sanitizes literal 'null' strings from database", () => {
    expect(formatName("null", "Doe")).toBe("Doe");
    expect(formatName("John", "NULL")).toBe("John");
    expect(formatName("null", "null")).toBe("--");
  });

  it("trims whitespace", () => {
    expect(formatName("  John  ", "  Doe  ")).toBe("John Doe");
  });
});
