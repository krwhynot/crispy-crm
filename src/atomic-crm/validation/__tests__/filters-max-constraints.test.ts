/**
 * Tests for .max() constraints on filters validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import { filterValueSchema, listParamsSchema, urlFilterSchema } from "../filters";
import { z } from "zod";

describe("Filters .max() Constraints", () => {
  describe("filterValueSchema - string variant", () => {
    it("should accept string at max length (500 chars)", () => {
      const validFilter = "a".repeat(500);
      expect(() => filterValueSchema.parse(validFilter)).not.toThrow();
    });

    it("should reject string over max length (501 chars)", () => {
      const invalidFilter = "a".repeat(501);
      expect(() => filterValueSchema.parse(invalidFilter)).toThrow(z.ZodError);
    });
  });

  describe("filterValueSchema - array variant", () => {
    it("should accept array with strings at max length (500 chars each)", () => {
      const validFilter = ["a".repeat(500), "b".repeat(500)];
      expect(() => filterValueSchema.parse(validFilter)).not.toThrow();
    });

    it("should reject array with string over max length (501 chars)", () => {
      const invalidFilter = ["a".repeat(500), "b".repeat(501)];
      expect(() => filterValueSchema.parse(invalidFilter)).toThrow(z.ZodError);
    });

    it("should reject array with too many items (101 items)", () => {
      const invalidFilter = Array(101).fill("test");
      expect(() => filterValueSchema.parse(invalidFilter)).toThrow(z.ZodError);
    });

    it("should accept array with max items (100 items)", () => {
      const validFilter = Array(100).fill("test");
      expect(() => filterValueSchema.parse(validFilter)).not.toThrow();
    });
  });

  describe("listParamsSchema - sort.field", () => {
    it("should accept sort field at max length (100 chars)", () => {
      const validParams = {
        sort: {
          field: "a".repeat(100),
          order: "ASC" as const,
        },
      };
      expect(() => listParamsSchema.parse(validParams)).not.toThrow();
    });

    it("should reject sort field over max length (101 chars)", () => {
      const invalidParams = {
        sort: {
          field: "a".repeat(101),
          order: "ASC" as const,
        },
      };
      expect(() => listParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });
  });

  describe("listParamsSchema - filter record keys", () => {
    it("should accept filter record with keys at max length (50 chars)", () => {
      const validParams = {
        filter: {
          ["a".repeat(50)]: "value",
        },
      };
      expect(() => listParamsSchema.parse(validParams)).not.toThrow();
    });

    it("should reject filter record with key over max length (51 chars)", () => {
      const invalidParams = {
        filter: {
          ["a".repeat(51)]: "value",
        },
      };
      expect(() => listParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });
  });

  describe("listParamsSchema - displayedFilters record keys", () => {
    it("should accept displayedFilters record with keys at max length (50 chars)", () => {
      const validParams = {
        displayedFilters: {
          ["a".repeat(50)]: true,
        },
      };
      expect(() => listParamsSchema.parse(validParams)).not.toThrow();
    });

    it("should reject displayedFilters record with key over max length (51 chars)", () => {
      const invalidParams = {
        displayedFilters: {
          ["a".repeat(51)]: true,
        },
      };
      expect(() => listParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });
  });

  describe("urlFilterSchema - stage array", () => {
    it("should accept stage array at max length (20 items)", () => {
      const validFilter = {
        stage: Array(20).fill("new_lead"),
      };
      expect(() => urlFilterSchema.parse(validFilter)).not.toThrow();
    });

    it("should reject stage array over max length (21 items)", () => {
      const invalidFilter = {
        stage: Array(21).fill("new_lead"),
      };
      expect(() => urlFilterSchema.parse(invalidFilter)).toThrow(z.ZodError);
    });
  });
});
