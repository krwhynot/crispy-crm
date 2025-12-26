import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatRelativeTime } from "../formatRelativeTime";

describe("formatRelativeTime", () => {
  let now: Date;

  beforeEach(() => {
    now = new Date("2025-11-13T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("recent times (hours)", () => {
    it('should return "now" for times within 1 minute', () => {
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo)).toBe("now");
    });

    it('should return "5m ago" for 5 minutes ago', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
    });

    it('should return "1h ago" for 1 hour ago', () => {
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe("1h ago");
    });

    it('should return "2h ago" for 2 hours ago', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
    });
  });

  describe("past days", () => {
    it('should return "yesterday" for 1 day ago', () => {
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      // Intl.RelativeTimeFormat with numeric:"auto" returns natural language
      expect(formatRelativeTime(oneDayAgo)).toBe("yesterday");
    });

    it('should return "3d ago" for 3 days ago', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
    });

    it('should return "7d ago" for 7 days ago', () => {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(sevenDaysAgo)).toBe("7d ago");
    });

    it("should return date string for times older than 7 days", () => {
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(eightDaysAgo)).toMatch(/Nov \d+/);
    });
  });

  describe("edge cases", () => {
    it("should handle ISO string input", () => {
      const isoString = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(isoString)).toBe("2h ago");
    });

    it("should handle invalid dates", () => {
      expect(formatRelativeTime("invalid-date")).toBe("unknown");
    });
  });
});
