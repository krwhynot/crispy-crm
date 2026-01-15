import { describe, it, expect } from "vitest";
import { formatDateDisplay, formatDateForInput, formatDateLocale } from "../formatDate";

describe("formatDateDisplay", () => {
  it("formats Date object to MMM d, yyyy", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(formatDateDisplay(date)).toBe("Jan 15, 2026");
  });

  it("formats ISO string to MMM d, yyyy", () => {
    // Use midday UTC to avoid timezone boundary issues
    expect(formatDateDisplay("2026-01-15T12:00:00Z")).toBe("Jan 15, 2026");
  });

  it("formats date-only string", () => {
    expect(formatDateDisplay("2026-01-15")).toBe("Jan 15, 2026");
  });

  it("returns empty string for null", () => {
    expect(formatDateDisplay(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDateDisplay(undefined)).toBe("");
  });

  it("returns original value for invalid date string", () => {
    expect(formatDateDisplay("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateForInput", () => {
  it("formats Date to yyyy-MM-dd for HTML inputs", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(formatDateForInput(date)).toBe("2026-01-15");
  });

  it("formats ISO string to yyyy-MM-dd", () => {
    // Use midday UTC to avoid timezone boundary issues
    expect(formatDateForInput("2026-01-15T12:00:00Z")).toBe("2026-01-15");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatDateForInput(null)).toBe("");
    expect(formatDateForInput(undefined)).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDateForInput("invalid")).toBe("");
  });
});

describe("formatDateLocale", () => {
  it("formats with default options (short month, numeric day, numeric year)", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(formatDateLocale(date)).toBe("Jan 15, 2026");
  });

  it("accepts custom format options", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    const result = formatDateLocale(date, { weekday: "long", month: "long", day: "numeric" });
    expect(result).toContain("January");
    expect(result).toContain("15");
  });

  it("accepts custom locale", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    // German locale would have different format
    const result = formatDateLocale(date, { month: "short", day: "numeric", year: "numeric" }, "de-DE");
    expect(result).toBeTruthy(); // Just verify it doesn't crash
  });

  it("returns empty string for null/undefined", () => {
    expect(formatDateLocale(null)).toBe("");
    expect(formatDateLocale(undefined)).toBe("");
  });
});
