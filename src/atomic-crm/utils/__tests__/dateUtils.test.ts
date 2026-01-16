import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getWeekRange } from "../dateUtils";

describe("dateUtils", () => {
  describe("getWeekRange", () => {
    describe("default behavior", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("returns current week by default when no argument provided", () => {
        vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));

        const result = getWeekRange();

        expect(result.start).toBe("2026-01-12");
        expect(result.end).toBe("2026-01-18");
      });
    });

    describe("ISO 8601 week boundaries", () => {
      it("starts week on Monday (ISO 8601 standard)", () => {
        // Use local time constructor to avoid UTC parsing gotcha
        const wednesday = new Date(2026, 0, 14); // Jan 14, 2026 (Wednesday)

        const result = getWeekRange(wednesday);

        expect(result.start).toBe("2026-01-12");
        // Verify the returned string represents a Monday by parsing in local time
        const startParts = result.start.split("-").map(Number) as [number, number, number];
        const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        expect(startDate.getDay()).toBe(1); // Monday
      });

      it("ends week on Sunday", () => {
        const wednesday = new Date(2026, 0, 14); // Jan 14, 2026 (Wednesday)

        const result = getWeekRange(wednesday);

        expect(result.end).toBe("2026-01-18");
        // Verify the returned string represents a Sunday by parsing in local time
        const endParts = result.end.split("-").map(Number) as [number, number, number];
        const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
        expect(endDate.getDay()).toBe(0); // Sunday
      });
    });

    describe("edge cases", () => {
      it("handles Monday edge case (date IS a Monday)", () => {
        const monday = new Date("2026-01-12");

        const result = getWeekRange(monday);

        expect(result.start).toBe("2026-01-12");
        expect(result.end).toBe("2026-01-18");
      });

      it("handles Sunday edge case (date IS a Sunday)", () => {
        const sunday = new Date("2026-01-18");

        const result = getWeekRange(sunday);

        expect(result.start).toBe("2026-01-12");
        expect(result.end).toBe("2026-01-18");
      });

      it("handles year boundary (Dec 31 mid-week)", () => {
        const dec31 = new Date("2025-12-31");

        const result = getWeekRange(dec31);

        expect(result.start).toBe("2025-12-29");
        expect(result.end).toBe("2026-01-04");
      });

      it("handles year boundary (Jan 1 mid-week)", () => {
        const jan1 = new Date("2026-01-01");

        const result = getWeekRange(jan1);

        expect(result.start).toBe("2025-12-29");
        expect(result.end).toBe("2026-01-04");
      });
    });

    describe("date formatting", () => {
      it("formats dates as yyyy-MM-dd", () => {
        const date = new Date("2026-03-15");

        const result = getWeekRange(date);

        expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it("zero-pads single digit months and days", () => {
        const earlyDate = new Date("2026-01-05");

        const result = getWeekRange(earlyDate);

        expect(result.start).toBe("2025-12-29");
        expect(result.end).toBe("2026-01-04");
      });
    });
  });
});
