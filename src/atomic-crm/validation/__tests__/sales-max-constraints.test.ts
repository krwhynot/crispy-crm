/**
 * Tests for .max() constraints on sales validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import {
  salesSchema,
  createSalesSchema,
  updateSalesSchema,
  userInviteSchema,
  userUpdateSchema,
  salesProfileSchema,
} from "../sales";
import { z } from "zod";

describe("Sales .max() Constraints", () => {
  describe("id field (union)", () => {
    it("should accept string IDs at max length (50 chars)", () => {
      const validSales = {
        id: "a".repeat(50),
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject string IDs over max length (51 chars)", () => {
      const invalidSales = {
        id: "a".repeat(51),
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });

    it("should accept number IDs", () => {
      const validSales = {
        id: 123,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });
  });

  describe("name fields", () => {
    it("should accept first_name at max length (100 chars)", () => {
      const validSales = {
        first_name: "a".repeat(100),
        last_name: "Doe",
        email: "john@example.com",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject first_name over max length (101 chars)", () => {
      const invalidSales = {
        first_name: "a".repeat(101),
        last_name: "Doe",
        email: "john@example.com",
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });

    it("should accept last_name at max length (100 chars)", () => {
      const validSales = {
        first_name: "John",
        last_name: "a".repeat(100),
        email: "john@example.com",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject last_name over max length (101 chars)", () => {
      const invalidSales = {
        first_name: "John",
        last_name: "a".repeat(101),
        email: "john@example.com",
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });
  });

  describe("email field", () => {
    it("should accept email at max length from VALIDATION_LIMITS.EMAIL_MAX", () => {
      const validSales = {
        first_name: "John",
        last_name: "Doe",
        email: "a".repeat(241) + "@example.com", // 254 chars total
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject email over VALIDATION_LIMITS.EMAIL_MAX", () => {
      const invalidSales = {
        first_name: "John",
        last_name: "Doe",
        email: "a".repeat(243) + "@example.com", // 255 chars total
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });
  });

  describe("phone field", () => {
    it("should accept phone at max length from VALIDATION_LIMITS.PHONE_MAX", () => {
      const validSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "1".repeat(30),
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject phone over VALIDATION_LIMITS.PHONE_MAX", () => {
      const invalidSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "1".repeat(31),
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });
  });

  describe("avatar_url field", () => {
    it("should accept avatar_url at max length from VALIDATION_LIMITS.AVATAR_URL_MAX", () => {
      const baseUrl = "https://cdn.example.com/avatars/";
      const pathLength = 500 - baseUrl.length - 4;
      const validSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        avatar_url: baseUrl + "a".repeat(pathLength) + ".jpg",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject avatar_url over VALIDATION_LIMITS.AVATAR_URL_MAX", () => {
      const baseUrl = "https://cdn.example.com/avatars/";
      const pathLength = 501 - baseUrl.length - 4;
      const invalidSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        avatar_url: baseUrl + "a".repeat(pathLength) + ".jpg",
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });
  });

  describe("user_id field (UUID)", () => {
    it("should accept valid UUID", () => {
      const validSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject invalid UUID format", () => {
      const invalidSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        user_id: "not-a-uuid",
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });
  });

  describe("timezone field", () => {
    it("should accept timezone at max length from VALIDATION_LIMITS.TIMEZONE_MAX", () => {
      const validSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        timezone: "America/Chicago",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject timezone over VALIDATION_LIMITS.TIMEZONE_MAX", () => {
      const invalidSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        timezone: "A".repeat(101),
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });
  });

  describe("timestamp fields", () => {
    it("should accept timestamp fields at VALIDATION_LIMITS.TIMESTAMP_MAX", () => {
      const validSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        deleted_at: "2024-01-01T00:00:00.000Z",
      };
      expect(() => salesSchema.parse(validSales)).not.toThrow();
    });

    it("should reject timestamp over VALIDATION_LIMITS.TIMESTAMP_MAX", () => {
      const invalidSales = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        created_at: "a".repeat(51),
      };
      expect(() => salesSchema.parse(invalidSales)).toThrow(z.ZodError);
    });
  });

  describe("createSalesSchema", () => {
    it("should enforce max constraints on create", () => {
      const validCreate = {
        first_name: "a".repeat(100),
        last_name: "a".repeat(100),
        email: "test@example.com",
      };
      expect(() => createSalesSchema.parse(validCreate)).not.toThrow();

      const invalidCreate = {
        first_name: "a".repeat(101),
        last_name: "Doe",
        email: "test@example.com",
      };
      expect(() => createSalesSchema.parse(invalidCreate)).toThrow(z.ZodError);
    });

    it("should accept password at max length (128 chars)", () => {
      const validCreate = {
        first_name: "John",
        last_name: "Doe",
        email: "test@example.com",
        password: "a".repeat(128),
      };
      expect(() => createSalesSchema.parse(validCreate)).not.toThrow();
    });

    it("should reject password over max length (129 chars)", () => {
      const invalidCreate = {
        first_name: "John",
        last_name: "Doe",
        email: "test@example.com",
        password: "a".repeat(129),
      };
      expect(() => createSalesSchema.parse(invalidCreate)).toThrow(z.ZodError);
    });
  });

  describe("updateSalesSchema", () => {
    it("should enforce max constraints on partial updates", () => {
      const validUpdate = {
        id: 1,
        first_name: "a".repeat(100),
      };
      expect(() => updateSalesSchema.parse(validUpdate)).not.toThrow();

      const invalidUpdate = {
        id: 1,
        last_name: "a".repeat(101),
      };
      expect(() => updateSalesSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });
  });

  describe("userInviteSchema", () => {
    it("should enforce max constraints on invite", () => {
      const validInvite = {
        first_name: "a".repeat(100),
        last_name: "a".repeat(100),
        email: "test@example.com",
      };
      expect(() => userInviteSchema.parse(validInvite)).not.toThrow();

      const invalidInvite = {
        first_name: "a".repeat(101),
        last_name: "Doe",
        email: "test@example.com",
      };
      expect(() => userInviteSchema.parse(invalidInvite)).toThrow(z.ZodError);
    });
  });

  describe("userUpdateSchema", () => {
    it("should enforce max constraints on user update", () => {
      const validUpdate = {
        sales_id: 1,
        first_name: "a".repeat(100),
      };
      expect(() => userUpdateSchema.parse(validUpdate)).not.toThrow();

      const invalidUpdate = {
        sales_id: 1,
        last_name: "a".repeat(101),
      };
      expect(() => userUpdateSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });
  });

  describe("salesProfileSchema", () => {
    it("should enforce max constraints on profile form", () => {
      const baseUrl = "https://cdn.example.com/avatars/";
      const pathLength = 500 - baseUrl.length - 4;
      const validProfile = {
        first_name: "a".repeat(100),
        last_name: "a".repeat(100),
        email: "a".repeat(241) + "@example.com",
        phone: "1".repeat(30),
        avatar_url: baseUrl + "a".repeat(pathLength) + ".jpg",
      };
      expect(() => salesProfileSchema.parse(validProfile)).not.toThrow();

      const invalidProfile = {
        first_name: "a".repeat(101),
        last_name: "Doe",
        email: "test@example.com",
        phone: "123-456-7890",
        avatar_url: "http://example.com/avatar.png",
      };
      expect(() => salesProfileSchema.parse(invalidProfile)).toThrow(z.ZodError);
    });
  });
});
