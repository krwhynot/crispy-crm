import { describe, it, expect } from "vitest";
import {
  formatFullName,
  formatRoleAndDept,
  formatSalesName,
  formatTagsForExport,
  formatCount,
  EMPTY_PLACEHOLDER,
} from "../formatters";

describe("formatters", () => {
  describe("EMPTY_PLACEHOLDER", () => {
    it("should be '--'", () => {
      expect(EMPTY_PLACEHOLDER).toBe("--");
    });
  });

  describe("formatFullName", () => {
    it("formats both names", () => {
      expect(formatFullName("John", "Doe")).toBe("John Doe");
    });

    it("handles missing last name", () => {
      expect(formatFullName("John", null)).toBe("John");
      expect(formatFullName("John", undefined)).toBe("John");
      expect(formatFullName("John", "")).toBe("John");
    });

    it("handles missing first name", () => {
      expect(formatFullName(null, "Doe")).toBe("Doe");
      expect(formatFullName(undefined, "Doe")).toBe("Doe");
    });

    it("returns placeholder for both missing", () => {
      expect(formatFullName(null, null)).toBe("--");
      expect(formatFullName("", "")).toBe("--");
      expect(formatFullName("   ", "   ")).toBe("--");
    });

    it("trims whitespace", () => {
      expect(formatFullName("  John  ", "  Doe  ")).toBe("John Doe");
    });
  });

  describe("formatRoleAndDept", () => {
    it("formats both values", () => {
      expect(formatRoleAndDept("CEO", "Executive")).toBe("CEO, Executive");
    });

    it("handles missing department", () => {
      expect(formatRoleAndDept("CEO", null)).toBe("CEO");
    });

    it("handles missing title", () => {
      expect(formatRoleAndDept(null, "Executive")).toBe("Executive");
    });

    it("returns placeholder for both missing", () => {
      expect(formatRoleAndDept(null, null)).toBe("--");
    });
  });

  describe("formatSalesName", () => {
    it("formats sales record", () => {
      expect(formatSalesName({ first_name: "John", last_name: "Doe" })).toBe("John Doe");
    });

    it("returns empty for null", () => {
      expect(formatSalesName(null)).toBe("");
      expect(formatSalesName(undefined)).toBe("");
    });
  });

  describe("formatTagsForExport", () => {
    it("joins tag names", () => {
      const tagsMap = { 1: { name: "VIP" }, 2: { name: "Hot" } };
      expect(formatTagsForExport([1, 2], tagsMap)).toBe("VIP, Hot");
    });

    it("handles empty array", () => {
      expect(formatTagsForExport([], {})).toBe("");
      expect(formatTagsForExport(undefined, {})).toBe("");
    });

    it("filters missing tags", () => {
      const tagsMap = { 1: { name: "VIP" } };
      expect(formatTagsForExport([1, 999], tagsMap)).toBe("VIP");
    });
  });

  describe("formatCount", () => {
    it("returns count as-is", () => {
      expect(formatCount(5)).toBe(5);
      expect(formatCount(0)).toBe(0);
    });

    it("returns 0 for null/undefined", () => {
      expect(formatCount(null)).toBe(0);
      expect(formatCount(undefined)).toBe(0);
    });
  });
});
