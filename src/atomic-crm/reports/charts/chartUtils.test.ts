/**
 * Chart Utils Tests
 *
 * Tests for shared chart utility functions.
 */

import { describe, it, expect } from "vitest";
import { withOklchAlpha, truncateLabel } from "./chartUtils";

describe("withOklchAlpha", () => {
  it("adds alpha channel to an OKLCH color string", () => {
    expect(withOklchAlpha("oklch(55% 0.095 142)", 0.5)).toBe("oklch(55% 0.095 142 / 0.5)");
  });

  it("handles fractional alpha values", () => {
    expect(withOklchAlpha("oklch(38% 0.085 142)", 0.125)).toBe("oklch(38% 0.085 142 / 0.125)");
  });

  it("trims whitespace from input", () => {
    expect(withOklchAlpha("  oklch(55% 0.095 142)  ", 0.5)).toBe("oklch(55% 0.095 142 / 0.5)");
  });

  it("returns non-OKLCH strings unchanged", () => {
    expect(withOklchAlpha("rgb(255, 0, 0)", 0.5)).toBe("rgb(255, 0, 0)");
    expect(withOklchAlpha("#ff0000", 0.5)).toBe("#ff0000");
    expect(withOklchAlpha("transparent", 0.5)).toBe("transparent");
  });

  it("returns empty string unchanged", () => {
    expect(withOklchAlpha("", 0.5)).toBe("");
  });
});

describe("truncateLabel", () => {
  it("returns short labels unchanged", () => {
    expect(truncateLabel("Hello", 20)).toBe("Hello");
  });

  it("truncates long labels with ellipsis", () => {
    expect(truncateLabel("A very long principal name here", 20)).toBe("A very long princ...");
  });

  it("handles exact boundary length", () => {
    expect(truncateLabel("12345", 5)).toBe("12345");
    expect(truncateLabel("123456", 5)).toBe("12...");
  });
});
