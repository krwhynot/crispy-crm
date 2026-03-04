/**
 * filterPrecedence Tests
 *
 * Tests the URL > sessionStorage > default precedence logic
 * for initializing filter state. Covers URL parsing, storage
 * get/set, stage filter initialization, and buildInitialFilters.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  parseUrlFilters,
  getStoredFilterPreferences,
  saveFilterPreferences,
  getDefaultVisibleStages,
  getInitialFilterValue,
  getInitialStageFilter,
  updateStagePreferences,
  buildInitialFilters,
} from "../filterPrecedence";

// --- Mocks ---

const mockGetStorageItem = vi.fn();
const mockSetStorageItem = vi.fn();
const mockRemoveStorageItem = vi.fn();

vi.mock("../../utils/secureStorage", () => ({
  getStorageItem: (...args: unknown[]) => mockGetStorageItem(...args),
  setStorageItem: (...args: unknown[]) => mockSetStorageItem(...args),
  removeStorageItem: (...args: unknown[]) => mockRemoveStorageItem(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

const MOCK_ACTIVE_STAGES = [
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
];

vi.mock("@/atomic-crm/opportunities/constants", () => ({
  ACTIVE_STAGES: [
    "new_lead",
    "initial_outreach",
    "sample_visit_offered",
    "feedback_logged",
    "demo_scheduled",
  ],
}));

vi.mock("../../utils/safeJsonParse", () => ({
  safeJsonParse: (json: string) => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  },
}));

vi.mock("../../validation/filters", () => ({
  filterValueSchema: {
    safeParse: (val: unknown) => ({ success: true, data: val }),
  },
}));

describe("filterPrecedence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStorageItem.mockReturnValue(null);
  });

  // --- parseUrlFilters ---

  describe("parseUrlFilters", () => {
    test("parses simple key-value params", () => {
      expect(parseUrlFilters("?stage=new_lead&priority=high")).toEqual({
        stage: "new_lead",
        priority: "high",
      });
    });

    test("skips RA internal params (page, perPage, sort, order)", () => {
      const result = parseUrlFilters("?stage=new_lead&page=2&perPage=25&sort=name&order=ASC");
      expect(result).toEqual({ stage: "new_lead" });
    });

    test("parses JSON array values", () => {
      const result = parseUrlFilters('?stage=["new_lead","closed_won"]');
      expect(result).toEqual({ stage: ["new_lead", "closed_won"] });
    });

    test("treats non-JSON values as strings", () => {
      const result = parseUrlFilters("?stage=not_json");
      expect(result).toEqual({ stage: "not_json" });
    });

    test("returns empty object for empty string", () => {
      expect(parseUrlFilters("")).toEqual({});
    });
  });

  // --- getStoredFilterPreferences ---

  describe("getStoredFilterPreferences", () => {
    test("returns stored value when found", () => {
      mockGetStorageItem.mockReturnValue(["new_lead"]);
      expect(getStoredFilterPreferences("test_key")).toEqual(["new_lead"]);
      expect(mockGetStorageItem).toHaveBeenCalledWith("test_key", { type: "session" });
    });

    test("returns null when not found", () => {
      mockGetStorageItem.mockReturnValue(null);
      expect(getStoredFilterPreferences("test_key")).toBeNull();
    });

    test("returns null on storage error", () => {
      mockGetStorageItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      expect(getStoredFilterPreferences("test_key")).toBeNull();
    });
  });

  // --- saveFilterPreferences ---

  describe("saveFilterPreferences", () => {
    test("calls setStorageItem with session type", () => {
      saveFilterPreferences("key", ["value"]);
      expect(mockSetStorageItem).toHaveBeenCalledWith("key", ["value"], { type: "session" });
    });
  });

  // --- getDefaultVisibleStages ---

  describe("getDefaultVisibleStages", () => {
    test("returns copy of ACTIVE_STAGES", () => {
      const result = getDefaultVisibleStages();
      expect(result).toEqual(MOCK_ACTIVE_STAGES);
    });

    test("returns new array each call (not same reference)", () => {
      const a = getDefaultVisibleStages();
      const b = getDefaultVisibleStages();
      expect(a).not.toBe(b);
    });
  });

  // --- getInitialFilterValue ---

  describe("getInitialFilterValue", () => {
    test("URL value wins over storage and default", () => {
      mockGetStorageItem.mockReturnValue("stored");
      expect(getInitialFilterValue("stage", "url_value", "default")).toBe("url_value");
    });

    test("falls back to storage when URL is undefined", () => {
      mockGetStorageItem.mockReturnValue("stored");
      expect(getInitialFilterValue("stage", undefined, "default")).toBe("stored");
    });

    test("falls back to default when URL and storage are empty", () => {
      mockGetStorageItem.mockReturnValue(null);
      expect(getInitialFilterValue("stage", undefined, "default_val")).toBe("default_val");
    });

    test("skips nullish URL values (null, empty string)", () => {
      mockGetStorageItem.mockReturnValue("stored");
      expect(getInitialFilterValue("stage", null, "default")).toBe("stored");
      expect(getInitialFilterValue("stage", "" as never, "default")).toBe("stored");
    });
  });

  // --- getInitialStageFilter ---

  describe("getInitialStageFilter", () => {
    test("uses URL param array when present", () => {
      expect(getInitialStageFilter({ stage: ["new_lead", "closed_won"] })).toEqual([
        "new_lead",
        "closed_won",
      ]);
    });

    test("wraps URL string in array", () => {
      expect(getInitialStageFilter({ stage: "new_lead" })).toEqual(["new_lead"]);
    });

    test("falls back to storage", () => {
      mockGetStorageItem.mockReturnValue(["stored_stage"]);
      expect(getInitialStageFilter({})).toEqual(["stored_stage"]);
    });

    test("falls back to defaults when no URL or storage", () => {
      mockGetStorageItem.mockReturnValue(null);
      expect(getInitialStageFilter({})).toEqual(MOCK_ACTIVE_STAGES);
    });
  });

  // --- updateStagePreferences ---

  describe("updateStagePreferences", () => {
    test("saves when different from defaults", () => {
      updateStagePreferences(["new_lead"]);
      expect(mockSetStorageItem).toHaveBeenCalledWith("opportunity_hidden_stages", ["new_lead"], {
        type: "session",
      });
    });

    test("removes from storage when same as defaults", () => {
      updateStagePreferences([...MOCK_ACTIVE_STAGES]);
      expect(mockRemoveStorageItem).toHaveBeenCalledWith("opportunity_hidden_stages");
      expect(mockSetStorageItem).not.toHaveBeenCalled();
    });
  });

  // --- buildInitialFilters ---

  describe("buildInitialFilters", () => {
    test("applies precedence to defaults", () => {
      const result = buildInitialFilters("", { stage: "default_stage", priority: "high" });
      expect(result).toEqual({ stage: "default_stage", priority: "high" });
    });

    test("URL overrides defaults", () => {
      const result = buildInitialFilters("?stage=url_stage", { stage: "default_stage" });
      expect(result).toEqual({ stage: "url_stage" });
    });

    test("includes additional URL keys not in defaults", () => {
      const result = buildInitialFilters("?extra=value", { stage: "default" });
      expect(result).toEqual({ stage: "default", extra: "value" });
    });

    test("filters out null/undefined/empty values", () => {
      const result = buildInitialFilters("", { stage: "", priority: null as never });
      expect(result).toEqual({});
    });
  });
});
