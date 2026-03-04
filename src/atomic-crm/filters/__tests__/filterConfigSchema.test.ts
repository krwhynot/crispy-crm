/**
 * filterConfigSchema Tests
 *
 * Tests the Zod validation schemas for filter configuration objects.
 * Pure function tests — no React hooks or mocking needed.
 *
 * Covers:
 * - filterChoiceSchema: id types, name max length, strictObject rejection
 * - chipFilterConfigSchema: required fields, enum validation, optional fields, extra key rejection
 * - choices: static array vs callback function
 * - formatLabel: function validation
 * - validateFilterConfig: valid array, invalid input, empty array
 */

import { describe, test, expect } from "vitest";
import {
  filterChoiceSchema,
  chipFilterConfigSchema,
  validateFilterConfig,
} from "../filterConfigSchema";

describe("filterConfigSchema", () => {
  // --- filterChoiceSchema ---

  describe("filterChoiceSchema", () => {
    test("accepts valid string id", () => {
      expect(filterChoiceSchema.parse({ id: "abc", name: "Choice A" })).toEqual({
        id: "abc",
        name: "Choice A",
      });
    });

    test("accepts valid number id", () => {
      expect(filterChoiceSchema.parse({ id: 42, name: "Choice B" })).toEqual({
        id: 42,
        name: "Choice B",
      });
    });

    test("rejects name longer than 100 characters", () => {
      expect(() => filterChoiceSchema.parse({ id: "x", name: "a".repeat(101) })).toThrow();
    });

    test("rejects extra keys (strictObject)", () => {
      expect(() => filterChoiceSchema.parse({ id: "x", name: "ok", extra: true })).toThrow();
    });
  });

  // --- chipFilterConfigSchema ---

  describe("chipFilterConfigSchema", () => {
    const validConfig = {
      key: "status",
      label: "Status",
      type: "select" as const,
    };

    test("accepts valid minimal config", () => {
      expect(chipFilterConfigSchema.parse(validConfig)).toEqual(validConfig);
    });

    test("rejects missing key", () => {
      expect(() => chipFilterConfigSchema.parse({ label: "Status", type: "select" })).toThrow();
    });

    test("rejects missing label", () => {
      expect(() => chipFilterConfigSchema.parse({ key: "status", type: "select" })).toThrow();
    });

    test("rejects missing type", () => {
      expect(() => chipFilterConfigSchema.parse({ key: "status", label: "Status" })).toThrow();
    });

    test("rejects invalid type enum value", () => {
      expect(() =>
        chipFilterConfigSchema.parse({ key: "x", label: "X", type: "invalid" })
      ).toThrow();
    });

    test("accepts all valid type enum values", () => {
      const types = [
        "select",
        "multiselect",
        "reference",
        "date-range",
        "search",
        "toggle",
        "boolean",
      ];
      for (const type of types) {
        expect(() => chipFilterConfigSchema.parse({ key: "k", label: "L", type })).not.toThrow();
      }
    });

    test("accepts optional fields", () => {
      const full = {
        ...validConfig,
        reference: "organizations",
        removalGroup: "date_range",
      };
      expect(chipFilterConfigSchema.parse(full)).toEqual(full);
    });

    test("rejects extra keys (strictObject)", () => {
      expect(() => chipFilterConfigSchema.parse({ ...validConfig, unknown: true })).toThrow();
    });
  });

  // --- choices field ---

  describe("choices validation", () => {
    test("accepts static array of choices", () => {
      const config = {
        key: "status",
        label: "Status",
        type: "select",
        choices: [{ id: "a", name: "A" }],
      };
      expect(() => chipFilterConfigSchema.parse(config)).not.toThrow();
    });

    test("accepts callback function for choices", () => {
      const config = {
        key: "status",
        label: "Status",
        type: "select",
        choices: () => [{ id: "a", name: "A" }],
      };
      expect(() => chipFilterConfigSchema.parse(config)).not.toThrow();
    });

    test("rejects non-function non-array choices", () => {
      const config = {
        key: "status",
        label: "Status",
        type: "select",
        choices: "invalid",
      };
      expect(() => chipFilterConfigSchema.parse(config)).toThrow();
    });
  });

  // --- formatLabel field ---

  describe("formatLabel validation", () => {
    test("accepts function", () => {
      const config = {
        key: "k",
        label: "L",
        type: "select",
        formatLabel: (v: unknown) => String(v),
      };
      expect(() => chipFilterConfigSchema.parse(config)).not.toThrow();
    });

    test("rejects non-function", () => {
      const config = {
        key: "k",
        label: "L",
        type: "select",
        formatLabel: "not a function",
      };
      expect(() => chipFilterConfigSchema.parse(config)).toThrow();
    });
  });

  // --- validateFilterConfig ---

  describe("validateFilterConfig", () => {
    test("returns parsed array for valid input", () => {
      const configs = [
        { key: "a", label: "A", type: "select" },
        { key: "b", label: "B", type: "toggle" },
      ];
      expect(validateFilterConfig(configs)).toEqual(configs);
    });

    test("throws ZodError for invalid input", () => {
      expect(() => validateFilterConfig([{ key: "a" }])).toThrow();
    });

    test("returns empty array for empty input", () => {
      expect(validateFilterConfig([])).toEqual([]);
    });
  });
});
