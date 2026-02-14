import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { resolvePreset } from "../resolvePreset";

// Freeze time for deterministic results
const FROZEN_NOW = new Date("2025-06-15T12:00:00.000Z");

describe("resolvePreset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves "today" to start-of-day through now', () => {
    const result = resolvePreset("today");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(startOfDay(FROZEN_NOW));
    expect(result!.end).toEqual(FROZEN_NOW);
  });

  it('resolves "yesterday" to full previous day', () => {
    const yesterday = subDays(FROZEN_NOW, 1);
    const result = resolvePreset("yesterday");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(startOfDay(yesterday));
    expect(result!.end).toEqual(endOfDay(yesterday));
  });

  it('resolves "last7" to 7 days ago through now', () => {
    const result = resolvePreset("last7");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(subDays(FROZEN_NOW, 7));
    expect(result!.end).toEqual(FROZEN_NOW);
  });

  it('resolves "last30" to 30 days ago through now', () => {
    const result = resolvePreset("last30");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(subDays(FROZEN_NOW, 30));
    expect(result!.end).toEqual(FROZEN_NOW);
  });

  it('resolves "last90" to 90 days ago through now', () => {
    const result = resolvePreset("last90");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(subDays(FROZEN_NOW, 90));
    expect(result!.end).toEqual(FROZEN_NOW);
  });

  it('resolves "thisMonth" to start of current month through now', () => {
    const result = resolvePreset("thisMonth");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(startOfMonth(FROZEN_NOW));
    expect(result!.end).toEqual(FROZEN_NOW);
  });

  it('resolves "lastMonth" to full previous month', () => {
    const prevMonth = subMonths(FROZEN_NOW, 1);
    const result = resolvePreset("lastMonth");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(startOfMonth(prevMonth));
    expect(result!.end).toEqual(endOfMonth(prevMonth));
  });

  it('resolves "thisQuarter" to start of current quarter through now', () => {
    const result = resolvePreset("thisQuarter");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(startOfQuarter(FROZEN_NOW));
    expect(result!.end).toEqual(FROZEN_NOW);
  });

  it('resolves "thisYear" to start of current year through now', () => {
    const result = resolvePreset("thisYear");
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(startOfYear(FROZEN_NOW));
    expect(result!.end).toEqual(FROZEN_NOW);
  });

  it("returns null for unknown presets", () => {
    expect(resolvePreset("unknownPreset")).toBeNull();
    expect(resolvePreset("")).toBeNull();
    expect(resolvePreset("allTime")).toBeNull();
  });
});
