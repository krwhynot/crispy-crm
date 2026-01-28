/**
 * Tests for .max() constraints on tags validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import { tagSchema, createTagSchema, updateTagSchema, tagFilterSchema } from "../tags";
import { z } from "zod";

describe("Tags .max() Constraints", () => {
  describe("name field", () => {
    it("should accept name at max length (50 chars)", () => {
      const validTag = {
        name: "a".repeat(50),
        color: "warm",
      };
      expect(() => tagSchema.parse(validTag)).not.toThrow();
    });

    it("should reject name over max length (51 chars)", () => {
      const invalidTag = {
        name: "a".repeat(51),
        color: "warm",
      };
      expect(() => tagSchema.parse(invalidTag)).toThrow(z.ZodError);
    });
  });

  describe("id field (union)", () => {
    it("should accept string IDs at max length (50 chars)", () => {
      const validTag = {
        id: "a".repeat(50),
        name: "Test",
        color: "warm",
      };
      expect(() => tagSchema.parse(validTag)).not.toThrow();
    });

    it("should reject string IDs over max length (51 chars)", () => {
      const invalidTag = {
        id: "a".repeat(51),
        name: "Test",
        color: "warm",
      };
      expect(() => tagSchema.parse(invalidTag)).toThrow(z.ZodError);
    });

    it("should accept number IDs", () => {
      const validTag = {
        id: 123,
        name: "Test",
        color: "warm",
      };
      expect(() => tagSchema.parse(validTag)).not.toThrow();
    });
  });

  describe("timestamp fields", () => {
    it("should accept timestamp fields at max length (50 chars)", () => {
      const validTag = {
        name: "Test",
        color: "warm",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        deleted_at: "2024-01-01T00:00:00.000Z",
      };
      expect(() => tagSchema.parse(validTag)).not.toThrow();
    });

    it("should reject timestamp over max length (51 chars)", () => {
      const invalidTag = {
        name: "Test",
        color: "warm",
        createdAt: "a".repeat(51),
      };
      expect(() => tagSchema.parse(invalidTag)).toThrow(z.ZodError);
    });
  });

  describe("tagFilterSchema", () => {
    it("should reject more than 20 color filters", () => {
      const invalidFilter = {
        colors: Array(21).fill("warm"),
      };
      expect(() => tagFilterSchema.parse(invalidFilter)).toThrow(z.ZodError);
    });

    it("should accept searchTerm at max length (100 chars)", () => {
      const validFilter = {
        searchTerm: "a".repeat(100),
      };
      expect(() => tagFilterSchema.parse(validFilter)).not.toThrow();
    });

    it("should reject searchTerm over max length (101 chars)", () => {
      const invalidFilter = {
        searchTerm: "a".repeat(101),
      };
      expect(() => tagFilterSchema.parse(invalidFilter)).toThrow(z.ZodError);
    });
  });

  describe("createTagSchema", () => {
    it("should enforce max constraints on create", () => {
      const validCreate = {
        name: "a".repeat(50),
        color: "warm",
      };
      expect(() => createTagSchema.parse(validCreate)).not.toThrow();

      const invalidCreate = {
        name: "a".repeat(51),
        color: "warm",
      };
      expect(() => createTagSchema.parse(invalidCreate)).toThrow(z.ZodError);
    });
  });

  describe("updateTagSchema", () => {
    it("should enforce max constraints on partial updates", () => {
      const validUpdate = {
        id: "tag-1",
        name: "a".repeat(50),
      };
      expect(() => updateTagSchema.parse(validUpdate)).not.toThrow();

      const invalidUpdate = {
        id: "tag-1",
        name: "a".repeat(51),
      };
      expect(() => updateTagSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });
  });
});
