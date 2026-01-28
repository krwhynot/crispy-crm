/**
 * Tests for .max() constraints on categories validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import { categorySchema } from "../categories";
import { z } from "zod";

describe("Categories .max() Constraints", () => {
  describe("id field", () => {
    it("should accept id at max length (255 chars)", () => {
      const validCategory = {
        id: "a".repeat(255),
        name: "Test",
      };
      expect(() => categorySchema.parse(validCategory)).not.toThrow();
    });

    it("should reject id over max length (256 chars)", () => {
      const invalidCategory = {
        id: "a".repeat(256),
        name: "Test",
      };
      expect(() => categorySchema.parse(invalidCategory)).toThrow(z.ZodError);
    });
  });

  describe("name field", () => {
    it("should accept name at max length (255 chars)", () => {
      const validCategory = {
        id: "test-id",
        name: "a".repeat(255),
      };
      expect(() => categorySchema.parse(validCategory)).not.toThrow();
    });

    it("should reject name over max length (256 chars)", () => {
      const invalidCategory = {
        id: "test-id",
        name: "a".repeat(256),
      };
      expect(() => categorySchema.parse(invalidCategory)).toThrow(z.ZodError);
    });
  });
});
