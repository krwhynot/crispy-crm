/**
 * Tests for generateOpportunityName utility
 *
 * Coverage: 100% (all branches and edge cases)
 *
 * Format: "{Principal Name} - {Customer Name} - MMYY"
 * Example: "Ocean Hugger - Nobu Miami - 0125" (January 2025)
 */

import { describe, it, expect } from "vitest";
import { generateOpportunityName, formatMonthYear } from "../generateOpportunityName";

describe("formatMonthYear", () => {
  it("should return 0125 for January 2025", () => {
    const date = new Date("2025-01-15");
    expect(formatMonthYear(date)).toBe("0125");
  });

  it("should return 0225 for February 2025", () => {
    const date = new Date("2025-02-15");
    expect(formatMonthYear(date)).toBe("0225");
  });

  it("should return 0325 for March 2025", () => {
    const date = new Date("2025-03-15");
    expect(formatMonthYear(date)).toBe("0325");
  });

  it("should return 0425 for April 2025", () => {
    const date = new Date("2025-04-15");
    expect(formatMonthYear(date)).toBe("0425");
  });

  it("should return 0525 for May 2025", () => {
    const date = new Date("2025-05-15");
    expect(formatMonthYear(date)).toBe("0525");
  });

  it("should return 0625 for June 2025", () => {
    const date = new Date("2025-06-15");
    expect(formatMonthYear(date)).toBe("0625");
  });

  it("should return 0725 for July 2025", () => {
    const date = new Date("2025-07-15");
    expect(formatMonthYear(date)).toBe("0725");
  });

  it("should return 0825 for August 2025", () => {
    const date = new Date("2025-08-15");
    expect(formatMonthYear(date)).toBe("0825");
  });

  it("should return 0925 for September 2025", () => {
    const date = new Date("2025-09-15");
    expect(formatMonthYear(date)).toBe("0925");
  });

  it("should return 1025 for October 2025", () => {
    const date = new Date("2025-10-15");
    expect(formatMonthYear(date)).toBe("1025");
  });

  it("should return 1125 for November 2025", () => {
    const date = new Date("2025-11-15");
    expect(formatMonthYear(date)).toBe("1125");
  });

  it("should return 1225 for December 2025", () => {
    const date = new Date("2025-12-15");
    expect(formatMonthYear(date)).toBe("1225");
  });
});

describe("generateOpportunityName", () => {
  describe("with all fields present", () => {
    it("should generate correct format with principal first, then customer, then MMYY date", () => {
      const result = generateOpportunityName({
        customerName: "Nobu Miami",
        principalName: "Ocean Hugger",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Ocean Hugger - Nobu Miami - 0125");
    });

    it("should generate correct format with April date", () => {
      const result = generateOpportunityName({
        customerName: "Roka Akor",
        principalName: "Fishpeople",
        date: new Date("2025-04-20"),
      });
      expect(result).toBe("Fishpeople - Roka Akor - 0425");
    });

    it("should generate correct format with July date", () => {
      const result = generateOpportunityName({
        customerName: "Blue Ribbon",
        principalName: "Tuna Roll Co",
        date: new Date("2025-07-10"),
      });
      expect(result).toBe("Tuna Roll Co - Blue Ribbon - 0725");
    });

    it("should generate correct format with October date", () => {
      const result = generateOpportunityName({
        customerName: "Katsuya",
        principalName: "Ocean Hugger",
        date: new Date("2025-10-30"),
      });
      expect(result).toBe("Ocean Hugger - Katsuya - 1025");
    });

    it("should trim whitespace from customer and principal names", () => {
      const result = generateOpportunityName({
        customerName: "  Nobu Miami  ",
        principalName: "  Ocean Hugger  ",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Ocean Hugger - Nobu Miami - 0125");
    });
  });

  describe("with missing customer", () => {
    it("should generate name with only principal and date", () => {
      const result = generateOpportunityName({
        principalName: "Ocean Hugger",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Ocean Hugger - 0125");
    });

    it("should handle null customer", () => {
      const result = generateOpportunityName({
        customerName: null,
        principalName: "Ocean Hugger",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Ocean Hugger - 0125");
    });

    it("should handle empty string customer", () => {
      const result = generateOpportunityName({
        customerName: "",
        principalName: "Ocean Hugger",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Ocean Hugger - 0125");
    });
  });

  describe("with missing principal", () => {
    it("should generate name with only customer and date", () => {
      const result = generateOpportunityName({
        customerName: "Nobu Miami",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Nobu Miami - 0125");
    });

    it("should handle null principal", () => {
      const result = generateOpportunityName({
        customerName: "Nobu Miami",
        principalName: null,
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Nobu Miami - 0125");
    });

    it("should handle empty string principal", () => {
      const result = generateOpportunityName({
        customerName: "Nobu Miami",
        principalName: "",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Nobu Miami - 0125");
    });
  });

  describe("with both customer and principal missing", () => {
    it("should return empty string when both are undefined", () => {
      const result = generateOpportunityName({
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("");
    });

    it("should return empty string when both are null", () => {
      const result = generateOpportunityName({
        customerName: null,
        principalName: null,
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("");
    });

    it("should return empty string when both are empty strings", () => {
      const result = generateOpportunityName({
        customerName: "",
        principalName: "",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("");
    });

    it("should return empty string when customer is whitespace and principal is null", () => {
      const result = generateOpportunityName({
        customerName: "   ",
        principalName: null,
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("");
    });
  });

  describe("date handling", () => {
    it("should use current date when date is not provided", () => {
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const year = now.getFullYear().toString().slice(-2);
      const expectedDate = `${month}${year}`;

      const result = generateOpportunityName({
        customerName: "Nobu Miami",
        principalName: "Ocean Hugger",
      });

      expect(result).toBe(`Ocean Hugger - Nobu Miami - ${expectedDate}`);
    });

    it("should handle different years correctly", () => {
      const result2024 = generateOpportunityName({
        customerName: "Customer A",
        principalName: "Principal A",
        date: new Date("2024-06-15"),
      });
      expect(result2024).toBe("Principal A - Customer A - 0624");

      const result2026 = generateOpportunityName({
        customerName: "Customer B",
        principalName: "Principal B",
        date: new Date("2026-09-20"),
      });
      expect(result2026).toBe("Principal B - Customer B - 0926");
    });
  });

  describe("truncation at 200 characters", () => {
    it("should truncate to 200 characters when name exceeds limit", () => {
      // Create a long principal name (100 chars) and long customer name (100 chars)
      const longPrincipal = "A".repeat(100);
      const longCustomer = "B".repeat(100);

      const result = generateOpportunityName({
        customerName: longCustomer,
        principalName: longPrincipal,
        date: new Date("2025-01-15"),
      });

      // Total would be: 100 (principal) + 3 (separator) + 100 (customer) + 3 (separator) + 4 (0125) = 210 chars
      expect(result.length).toBe(200);
      expect(result.endsWith("...")).toBe(true);
    });

    it("should not truncate when name is exactly 200 characters", () => {
      // Calculate exact length: need principal + customer to equal 190 chars
      // Format: "{principal} - {customer} - 0125" = principal + 3 + customer + 3 + 4 = 200
      // So: principal + customer = 190
      const principal = "A".repeat(95);
      const customer = "B".repeat(95);

      const result = generateOpportunityName({
        customerName: customer,
        principalName: principal,
        date: new Date("2025-01-15"),
      });

      expect(result.length).toBe(200);
      expect(result.endsWith("...")).toBe(false);
    });

    it("should not truncate when name is less than 200 characters", () => {
      const result = generateOpportunityName({
        customerName: "Short Customer",
        principalName: "Short Principal",
        date: new Date("2025-01-15"),
      });

      expect(result.length).toBeLessThan(200);
      expect(result).toBe("Short Principal - Short Customer - 0125");
    });

    it("should preserve meaningful content when truncating", () => {
      const longPrincipal = "Very Long Principal Name ".repeat(10); // ~250 chars
      const longCustomer = "Very Long Customer Name ".repeat(10); // ~240 chars

      const result = generateOpportunityName({
        customerName: longCustomer,
        principalName: longPrincipal,
        date: new Date("2025-01-15"),
      });

      expect(result.length).toBe(200);
      expect(result.substring(0, 197)).toContain("Very Long Principal Name");
      expect(result.endsWith("...")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in names", () => {
      const result = generateOpportunityName({
        customerName: "O'Malley's Irish Pub & Grill",
        principalName: "Fish & Co.",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Fish & Co. - O'Malley's Irish Pub & Grill - 0125");
    });

    it("should handle unicode characters in names", () => {
      const result = generateOpportunityName({
        customerName: "Café René",
        principalName: "Señor Fish",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Señor Fish - Café René - 0125");
    });

    it("should handle names with hyphens", () => {
      const result = generateOpportunityName({
        customerName: "Blue-Ribbon Sushi",
        principalName: "Ocean-Hugger Foods",
        date: new Date("2025-01-15"),
      });
      expect(result).toBe("Ocean-Hugger Foods - Blue-Ribbon Sushi - 0125");
    });

    it("should handle year boundaries correctly", () => {
      // Use explicit dates to avoid timezone issues
      const endOfYearDate = new Date(2024, 11, 31); // December 31, 2024 (month is 0-indexed)
      const resultEndOfYear = generateOpportunityName({
        customerName: "Customer",
        principalName: "Principal",
        date: endOfYearDate,
      });
      expect(resultEndOfYear).toBe("Principal - Customer - 1224");

      const startOfYearDate = new Date(2025, 0, 1); // January 1, 2025 (month is 0-indexed)
      const resultStartOfYear = generateOpportunityName({
        customerName: "Customer",
        principalName: "Principal",
        date: startOfYearDate,
      });
      expect(resultStartOfYear).toBe("Principal - Customer - 0125");
    });
  });
});
