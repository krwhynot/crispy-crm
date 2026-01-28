/**
 * Tests for .max() constraints on favorites validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import { favoriteSchema, createFavoriteSchema, updateFavoriteSchema } from "../favorites";
import { z } from "zod";

describe("Favorites .max() Constraints", () => {
  describe("id field (union)", () => {
    it("should accept string IDs at max length (50 chars)", () => {
      const validFavorite = {
        id: "a".repeat(50),
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
      };
      expect(() => favoriteSchema.parse(validFavorite)).not.toThrow();
    });

    it("should reject string IDs over max length (51 chars)", () => {
      const invalidFavorite = {
        id: "a".repeat(51),
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
      };
      expect(() => favoriteSchema.parse(invalidFavorite)).toThrow(z.ZodError);
    });

    it("should accept number IDs", () => {
      const validFavorite = {
        id: 123,
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
      };
      expect(() => favoriteSchema.parse(validFavorite)).not.toThrow();
    });
  });

  describe("user_id field (UUID)", () => {
    it("should accept user_id at max length (36 chars - UUID)", () => {
      const validFavorite = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
      };
      expect(() => favoriteSchema.parse(validFavorite)).not.toThrow();
    });

    it("should reject invalid UUID format", () => {
      const invalidFavorite = {
        user_id: "not-a-uuid",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
      };
      expect(() => favoriteSchema.parse(invalidFavorite)).toThrow(z.ZodError);
    });

    it("should reject user_id over max length (37+ chars)", () => {
      const invalidFavorite = {
        user_id: "a".repeat(37),
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
      };
      expect(() => favoriteSchema.parse(invalidFavorite)).toThrow(z.ZodError);
    });
  });

  describe("display_name field", () => {
    it("should accept display_name at max length (255 chars)", () => {
      const validFavorite = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "a".repeat(255),
      };
      expect(() => favoriteSchema.parse(validFavorite)).not.toThrow();
    });

    it("should reject display_name over max length (256 chars)", () => {
      const invalidFavorite = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "a".repeat(256),
      };
      expect(() => favoriteSchema.parse(invalidFavorite)).toThrow(z.ZodError);
    });
  });

  describe("timestamp fields", () => {
    it("should accept timestamp fields at max length (50 chars)", () => {
      const validFavorite = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
        created_at: "2024-01-01T00:00:00.000Z",
        deleted_at: "2024-01-01T00:00:00.000Z",
      };
      expect(() => favoriteSchema.parse(validFavorite)).not.toThrow();
    });

    it("should reject timestamp over max length (51 chars)", () => {
      const invalidFavorite = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "Test",
        created_at: "a".repeat(51),
      };
      expect(() => favoriteSchema.parse(invalidFavorite)).toThrow(z.ZodError);
    });
  });

  describe("createFavoriteSchema", () => {
    it("should enforce max constraints on create", () => {
      const validCreate = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "a".repeat(255),
      };
      expect(() => createFavoriteSchema.parse(validCreate)).not.toThrow();

      const invalidCreate = {
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entity_type: "contacts" as const,
        entity_id: 1,
        display_name: "a".repeat(256),
      };
      expect(() => createFavoriteSchema.parse(invalidCreate)).toThrow(z.ZodError);
    });
  });

  describe("updateFavoriteSchema", () => {
    it("should enforce max constraints on partial updates", () => {
      const validUpdate = {
        id: 1,
        display_name: "a".repeat(255),
      };
      expect(() => updateFavoriteSchema.parse(validUpdate)).not.toThrow();

      const invalidUpdate = {
        id: 1,
        display_name: "a".repeat(256),
      };
      expect(() => updateFavoriteSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });
  });
});
