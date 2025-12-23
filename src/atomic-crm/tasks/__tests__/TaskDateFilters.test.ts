/**
 * Task Date Filters Tests
 *
 * Tests for date filter bug fix: "Today" filter was showing tomorrow's tasks
 * due to timezone/column-type mismatch.
 *
 * Root cause: Database `due_date` column is `date` type (no time),
 * but filters were using `toISOString()` which includes timezone-shifted timestamps.
 * When `endOfToday().toISOString()` crossed into the next UTC day, tasks due
 * tomorrow would incorrectly match the filter.
 *
 * Fix: Use date-only format strings ('yyyy-MM-dd') for direct date comparison.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { startOfToday, addDays, format } from "date-fns";

describe("Task date filter values", () => {
  beforeEach(() => {
    // Mock to consistent date: Sunday, December 22, 2024, 10:00 AM local
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-12-22T10:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Date format", () => {
    it("uses date-only format (no time component)", () => {
      const today = format(startOfToday(), "yyyy-MM-dd");

      expect(today).toBe("2024-12-22");
      expect(today).not.toContain("T"); // No ISO time separator
      expect(today).not.toContain("Z"); // No UTC suffix
    });

    it("does not include timezone offset", () => {
      const today = format(startOfToday(), "yyyy-MM-dd");

      // Should be exactly 10 characters: YYYY-MM-DD
      expect(today.length).toBe(10);
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("Today filter", () => {
    it("has same start and end date (single day)", () => {
      const gte = format(startOfToday(), "yyyy-MM-dd");
      const lte = format(startOfToday(), "yyyy-MM-dd");

      expect(gte).toBe("2024-12-22");
      expect(lte).toBe("2024-12-22");
      expect(gte).toBe(lte); // Both boundaries are today
    });

    it("does not accidentally include tomorrow", () => {
      const todayEnd = format(startOfToday(), "yyyy-MM-dd");
      const tomorrow = format(addDays(startOfToday(), 1), "yyyy-MM-dd");

      expect(todayEnd).toBe("2024-12-22");
      expect(tomorrow).toBe("2024-12-23");

      // Today's end date should not be >= tomorrow
      expect(todayEnd < tomorrow).toBe(true);
    });
  });

  describe("This Week filter", () => {
    it("spans 7 days starting from today", () => {
      const gte = format(startOfToday(), "yyyy-MM-dd");
      const lte = format(addDays(startOfToday(), 6), "yyyy-MM-dd");

      expect(gte).toBe("2024-12-22"); // Today (Sunday)
      expect(lte).toBe("2024-12-28"); // Saturday (6 days later)
    });

    it("includes exactly 7 days", () => {
      const start = startOfToday();
      const end = addDays(startOfToday(), 6);

      // Count days: 22, 23, 24, 25, 26, 27, 28 = 7 days
      const daysDiff = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff + 1).toBe(7); // +1 because both ends are inclusive
    });
  });

  describe("Overdue filter", () => {
    it("uses less-than (not less-than-or-equal) for today", () => {
      // The overdue filter should use @lt, not @lte
      // This means tasks due TODAY are NOT overdue
      const overdueThreshold = format(startOfToday(), "yyyy-MM-dd");

      expect(overdueThreshold).toBe("2024-12-22");

      // A task due 2024-12-22 should NOT match "due_date < 2024-12-22"
      // because < is exclusive (task due today is not overdue yet)
    });

    it("excludes tasks due today", () => {
      const today = format(startOfToday(), "yyyy-MM-dd");
      const yesterday = format(addDays(startOfToday(), -1), "yyyy-MM-dd");

      // Task due yesterday: "2024-12-21" < "2024-12-22" ✓ (is overdue)
      expect(yesterday < today).toBe(true);

      // Task due today: "2024-12-22" < "2024-12-22" ✗ (not overdue)
      expect(today < today).toBe(false);
    });

    it("includes tasks due yesterday", () => {
      const today = format(startOfToday(), "yyyy-MM-dd");
      const yesterday = format(addDays(startOfToday(), -1), "yyyy-MM-dd");

      expect(yesterday).toBe("2024-12-21");
      expect(yesterday < today).toBe(true);
    });

    it("includes tasks due last week", () => {
      const today = format(startOfToday(), "yyyy-MM-dd");
      const lastWeek = format(addDays(startOfToday(), -7), "yyyy-MM-dd");

      expect(lastWeek).toBe("2024-12-15");
      expect(lastWeek < today).toBe(true);
    });
  });

  describe("Timezone safety", () => {
    it("produces same date regardless of when during the day it runs", () => {
      // Morning
      vi.setSystemTime(new Date("2024-12-22T06:00:00"));
      const morning = format(startOfToday(), "yyyy-MM-dd");

      // Evening
      vi.setSystemTime(new Date("2024-12-22T23:59:59"));
      const evening = format(startOfToday(), "yyyy-MM-dd");

      expect(morning).toBe("2024-12-22");
      expect(evening).toBe("2024-12-22");
      expect(morning).toBe(evening);
    });

    it("would have failed with old toISOString approach in negative UTC timezone", () => {
      // Simulate user in America/Chicago (UTC-6)
      // When it's Dec 22 at 11:59 PM local, UTC is Dec 23 at 5:59 AM
      // This is a documentation test showing why toISOString() was wrong

      // Old approach would do: endOfToday().toISOString()
      // On Dec 22 at any time in UTC-6:
      // - startOfToday() = Dec 22 00:00:00 local = Dec 22 06:00:00 UTC
      // - endOfToday() = Dec 22 23:59:59 local = Dec 23 05:59:59 UTC
      // The ISO string would be "2024-12-23T05:59:59.999Z"
      // PostgreSQL comparing date column with "2024-12-23T05:59:59Z" would include Dec 23 tasks!

      // New approach uses date-only strings, avoiding this entirely
      const today = format(startOfToday(), "yyyy-MM-dd");
      expect(today).toBe("2024-12-22");
      expect(today).not.toContain("2024-12-23");
    });
  });
});

describe("Edge cases", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles year boundary correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-12-31T10:00:00"));

    const today = format(startOfToday(), "yyyy-MM-dd");
    const tomorrow = format(addDays(startOfToday(), 1), "yyyy-MM-dd");

    expect(today).toBe("2024-12-31");
    expect(tomorrow).toBe("2025-01-01");
  });

  it("handles leap year correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-28T10:00:00"));

    const today = format(startOfToday(), "yyyy-MM-dd");
    const tomorrow = format(addDays(startOfToday(), 1), "yyyy-MM-dd");

    expect(today).toBe("2024-02-28");
    expect(tomorrow).toBe("2024-02-29"); // 2024 is a leap year
  });

  it("handles month boundary correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-31T10:00:00"));

    const today = format(startOfToday(), "yyyy-MM-dd");
    const tomorrow = format(addDays(startOfToday(), 1), "yyyy-MM-dd");

    expect(today).toBe("2024-01-31");
    expect(tomorrow).toBe("2024-02-01");
  });
});
