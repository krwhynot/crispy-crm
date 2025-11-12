/**
 * formatRelativeTime Tests
 * Tests for relative time formatting utility
 *
 * Test Coverage:
 * - Hours ago (1h, 2h, 23h)
 * - Days ago (1d, 2d, 30d)
 * - Edge cases: invalid dates, future dates, very old dates
 * - Different input formats: Date objects and ISO strings
 */

import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "../formatRelativeTime";

describe("formatRelativeTime", () => {
  describe("hours ago", () => {
    it("should format 1 hour ago", () => {
      const date = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      expect(formatRelativeTime(date)).toBe("1h ago");
    });

    it("should format 2 hours ago", () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      expect(formatRelativeTime(date)).toBe("2h ago");
    });

    it("should format 23 hours ago", () => {
      const date = new Date(Date.now() - 23 * 60 * 60 * 1000); // 23 hours ago
      expect(formatRelativeTime(date)).toBe("23h ago");
    });

    it("should format less than 1 hour as '0h ago'", () => {
      const date = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      expect(formatRelativeTime(date)).toBe("0h ago");
    });
  });

  describe("days ago", () => {
    it("should format 1 day ago", () => {
      const date = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      expect(formatRelativeTime(date)).toBe("1d ago");
    });

    it("should format 2 days ago", () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      expect(formatRelativeTime(date)).toBe("2d ago");
    });

    it("should format 7 days ago", () => {
      const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      expect(formatRelativeTime(date)).toBe("7d ago");
    });

    it("should format 30 days ago", () => {
      const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      expect(formatRelativeTime(date)).toBe("30d ago");
    });
  });

  describe("string input", () => {
    it("should handle ISO string input", () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const isoString = date.toISOString();
      expect(formatRelativeTime(isoString)).toBe("2h ago");
    });

    it("should handle date string input", () => {
      const date = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const dateString = date.toString();
      expect(formatRelativeTime(dateString)).toBe("1d ago");
    });
  });

  describe("edge cases", () => {
    it("should handle invalid date strings", () => {
      expect(formatRelativeTime("invalid-date")).toBe("Invalid date");
    });

    it("should handle empty strings", () => {
      expect(formatRelativeTime("")).toBe("Invalid date");
    });

    it("should handle future dates", () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
      expect(formatRelativeTime(futureDate)).toBe("Just now");
    });

    it("should handle very old dates (>365 days)", () => {
      const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago
      expect(formatRelativeTime(oldDate)).toBe("400d ago");
    });

    it("should handle dates exactly at current time", () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      // Should be either "Just now" or "0h ago" depending on millisecond precision
      expect(result === "Just now" || result === "0h ago").toBe(true);
    });
  });

  describe("rounding behavior", () => {
    it("should round down hours (1.9h → 1h)", () => {
      const date = new Date(Date.now() - 1.9 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe("1h ago");
    });

    it("should round down days (2.9d → 2d)", () => {
      const date = new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe("2d ago");
    });

    it("should prefer days over hours when >= 24h", () => {
      const date = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours
      expect(formatRelativeTime(date)).toBe("1d ago");
    });
  });
});
