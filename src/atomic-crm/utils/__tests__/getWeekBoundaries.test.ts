/**
 * getWeekBoundaries() Edge Case Tests
 *
 * Phase 5 Automation — Reporting Audit
 *
 * Tests week boundary computation for edge cases that affect metric accuracy:
 * - Year boundaries (Dec 31 / Jan 1 mid-week)
 * - DST transitions (spring forward / fall back)
 * - Monday/Sunday edge days
 * - lastWeek boundaries relative to thisWeek
 *
 * Rollout: nightly (may be flaky on DST in non-US TZ CI runners).
 */
import { describe, it, expect } from "vitest";
import { getWeekBoundaries } from "../dateUtils";

describe("getWeekBoundaries", () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. Basic ISO 8601 week structure
  // ────────────────────────────────────────────────────────────────────────
  describe("ISO 8601 structure", () => {
    it("thisWeekStart is always a Monday", () => {
      // Test across several different weekdays
      const dates = [
        new Date(2026, 0, 12), // Monday
        new Date(2026, 0, 14), // Wednesday
        new Date(2026, 0, 17), // Saturday
        new Date(2026, 0, 18), // Sunday
      ];

      for (const d of dates) {
        const b = getWeekBoundaries(d);
        expect(b.thisWeekStart.getDay()).toBe(1); // Monday
      }
    });

    it("thisWeekEnd is always a Sunday", () => {
      const dates = [
        new Date(2026, 0, 12), // Monday
        new Date(2026, 0, 14), // Wednesday
        new Date(2026, 0, 18), // Sunday
      ];

      for (const d of dates) {
        const b = getWeekBoundaries(d);
        expect(b.thisWeekEnd.getDay()).toBe(0); // Sunday
      }
    });

    it("thisWeekStart is at midnight (00:00:00)", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14)); // Wednesday
      expect(b.thisWeekStart.getHours()).toBe(0);
      expect(b.thisWeekStart.getMinutes()).toBe(0);
      expect(b.thisWeekStart.getSeconds()).toBe(0);
    });

    it("thisWeekEnd is at end of day (23:59:59)", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14));
      expect(b.thisWeekEnd.getHours()).toBe(23);
      expect(b.thisWeekEnd.getMinutes()).toBe(59);
      expect(b.thisWeekEnd.getSeconds()).toBe(59);
    });

    it("week span is exactly 7 days", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14));
      const diffMs = b.thisWeekEnd.getTime() - b.thisWeekStart.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      // 6 days + 23:59:59 ≈ 7 days minus 1 second
      expect(Math.round(diffDays)).toBe(7);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Monday and Sunday edge days
  // ────────────────────────────────────────────────────────────────────────
  describe("day-of-week edges", () => {
    it("Monday input: thisWeekStart equals today at midnight", () => {
      const monday = new Date(2026, 0, 12, 10, 30); // Monday 10:30 AM
      const b = getWeekBoundaries(monday);
      expect(b.thisWeekStart.toDateString()).toBe(new Date(2026, 0, 12).toDateString());
      expect(b.today.toDateString()).toBe(new Date(2026, 0, 12).toDateString());
    });

    it("Sunday input: thisWeekStart is the preceding Monday", () => {
      const sunday = new Date(2026, 0, 18, 15, 0); // Sunday 3 PM
      const b = getWeekBoundaries(sunday);
      // Sunday Jan 18 belongs to week starting Mon Jan 12
      expect(b.thisWeekStart.toDateString()).toBe(new Date(2026, 0, 12).toDateString());
      expect(b.thisWeekEnd.toDateString()).toBe(new Date(2026, 0, 18).toDateString());
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Year boundary
  // ────────────────────────────────────────────────────────────────────────
  describe("year boundary", () => {
    it("Dec 31 mid-week: week spans two years", () => {
      // Dec 31, 2025 is a Wednesday
      const b = getWeekBoundaries(new Date(2025, 11, 31));
      expect(b.thisWeekStart.getFullYear()).toBe(2025);
      expect(b.thisWeekStart.getMonth()).toBe(11); // December
      expect(b.thisWeekStart.getDate()).toBe(29); // Monday Dec 29
      expect(b.thisWeekEnd.getFullYear()).toBe(2026);
      expect(b.thisWeekEnd.getMonth()).toBe(0); // January
      expect(b.thisWeekEnd.getDate()).toBe(4); // Sunday Jan 4
    });

    it("Jan 1 mid-week: week starts in previous year", () => {
      // Jan 1, 2026 is a Thursday
      const b = getWeekBoundaries(new Date(2026, 0, 1));
      expect(b.thisWeekStart.getFullYear()).toBe(2025);
      expect(b.thisWeekStart.getDate()).toBe(29); // Mon Dec 29, 2025
    });

    it("Jan 1 that IS a Monday: week is entirely in new year", () => {
      // Jan 1, 2029 is a Monday
      const b = getWeekBoundaries(new Date(2029, 0, 1));
      expect(b.thisWeekStart.getFullYear()).toBe(2029);
      expect(b.thisWeekStart.getMonth()).toBe(0);
      expect(b.thisWeekStart.getDate()).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. lastWeek boundaries are exactly 7 days before thisWeek
  // ────────────────────────────────────────────────────────────────────────
  describe("lastWeek relationship", () => {
    it("lastWeekStart is exactly 7 days before thisWeekStart", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14));
      const diff = b.thisWeekStart.getTime() - b.lastWeekStart.getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("lastWeekEnd is exactly 7 days before thisWeekEnd", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14));
      const diff = b.thisWeekEnd.getTime() - b.lastWeekEnd.getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("lastWeekStart is a Monday", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14));
      expect(b.lastWeekStart.getDay()).toBe(1);
    });

    it("lastWeekEnd is a Sunday", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14));
      expect(b.lastWeekEnd.getDay()).toBe(0);
    });

    it("lastWeek does not overlap with thisWeek", () => {
      const b = getWeekBoundaries(new Date(2026, 0, 14));
      // lastWeekEnd should be strictly before thisWeekStart
      expect(b.lastWeekEnd.getTime()).toBeLessThan(b.thisWeekStart.getTime());
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. DST transitions (US Eastern: Mar 8, 2026 spring forward; Nov 1, 2026 fall back)
  // ────────────────────────────────────────────────────────────────────────
  describe("DST transitions", () => {
    it("spring forward (Mar 8 2026): week boundaries remain consistent", () => {
      // Mar 8, 2026 is a Sunday — US spring forward day
      // Week should be Mon Mar 2 to Sun Mar 8
      const b = getWeekBoundaries(new Date(2026, 2, 8));
      expect(b.thisWeekStart.getDay()).toBe(1); // still Monday
      expect(b.thisWeekEnd.getDay()).toBe(0); // still Sunday
      expect(b.thisWeekStart.getDate()).toBe(2); // Mar 2
      expect(b.thisWeekEnd.getDate()).toBe(8); // Mar 8
    });

    it("day after spring forward: lastWeek spans the DST transition", () => {
      // Mar 9, 2026 is Monday — new week after spring forward
      const b = getWeekBoundaries(new Date(2026, 2, 9));
      // lastWeek = Mar 2 - Mar 8 (contains spring forward)
      expect(b.lastWeekStart.getDate()).toBe(2);
      expect(b.lastWeekEnd.getDate()).toBe(8);
      // thisWeek = Mar 9 - Mar 15
      expect(b.thisWeekStart.getDate()).toBe(9);
    });

    it("fall back (Nov 1 2026): week boundaries remain consistent", () => {
      // Nov 1, 2026 is a Sunday — US fall back day
      const b = getWeekBoundaries(new Date(2026, 10, 1));
      expect(b.thisWeekStart.getDay()).toBe(1); // Monday
      expect(b.thisWeekEnd.getDay()).toBe(0); // Sunday
      expect(b.thisWeekStart.getDate()).toBe(26); // Oct 26
      expect(b.thisWeekEnd.getDate()).toBe(1); // Nov 1
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 6. today field is startOfDay (strips time)
  // ────────────────────────────────────────────────────────────────────────
  describe("today normalization", () => {
    it("strips time from input", () => {
      const afternoon = new Date(2026, 0, 14, 15, 45, 30);
      const b = getWeekBoundaries(afternoon);
      expect(b.today.getHours()).toBe(0);
      expect(b.today.getMinutes()).toBe(0);
      expect(b.today.getSeconds()).toBe(0);
    });

    it("today date matches input date", () => {
      const input = new Date(2026, 5, 15, 20, 0);
      const b = getWeekBoundaries(input);
      expect(b.today.getFullYear()).toBe(2026);
      expect(b.today.getMonth()).toBe(5);
      expect(b.today.getDate()).toBe(15);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 7. Default parameter (no argument)
  // ────────────────────────────────────────────────────────────────────────
  describe("default parameter", () => {
    it("returns boundaries for current date when called with no args", () => {
      const b = getWeekBoundaries();
      const now = new Date();
      // today should be same calendar date as now
      expect(b.today.getFullYear()).toBe(now.getFullYear());
      expect(b.today.getMonth()).toBe(now.getMonth());
      expect(b.today.getDate()).toBe(now.getDate());
    });
  });
});
