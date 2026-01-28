/**
 * Tests for .max() constraints on task validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import { taskSchema, taskCreateSchema, taskUpdateSchema } from "../task";
import { z } from "zod";

describe("Task .max() Constraints", () => {
  describe("title field", () => {
    it("should accept title at max length (500 chars)", () => {
      const validTask = {
        title: "a".repeat(500),
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
      };
      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });

    it("should reject title over max length (501 chars)", () => {
      const invalidTask = {
        title: "a".repeat(501),
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
      };
      expect(() => taskSchema.parse(invalidTask)).toThrow(z.ZodError);
    });
  });

  describe("description field", () => {
    it("should accept description at max length (2000 chars)", () => {
      const validTask = {
        title: "Test",
        description: "a".repeat(2000),
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
      };
      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });

    it("should reject description over max length (2001 chars)", () => {
      const invalidTask = {
        title: "Test",
        description: "a".repeat(2001),
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
      };
      expect(() => taskSchema.parse(invalidTask)).toThrow(z.ZodError);
    });
  });

  describe("timestamp fields", () => {
    it("should accept timestamp fields at max length (50 chars)", () => {
      const validTask = {
        title: "Test",
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        completed_at: "2024-01-01T00:00:00.000Z",
      };
      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });

    it("should reject timestamp over max length (51 chars)", () => {
      const invalidTask = {
        title: "Test",
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
        created_at: "a".repeat(51),
      };
      expect(() => taskSchema.parse(invalidTask)).toThrow(z.ZodError);
    });
  });

  describe("created_by field (union)", () => {
    it("should accept string created_by at max length (50 chars)", () => {
      const validTask = {
        title: "Test",
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
        created_by: "a".repeat(50),
      };
      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });

    it("should reject string created_by over max length (51 chars)", () => {
      const invalidTask = {
        title: "Test",
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
        created_by: "a".repeat(51),
      };
      expect(() => taskSchema.parse(invalidTask)).toThrow(z.ZodError);
    });

    it("should accept number created_by", () => {
      const validTask = {
        title: "Test",
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
        created_by: 123,
      };
      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });
  });

  describe("taskCreateSchema", () => {
    it("should enforce max constraints on create", () => {
      const validCreate = {
        title: "a".repeat(500),
        description: "a".repeat(2000),
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
      };
      expect(() => taskCreateSchema.parse(validCreate)).not.toThrow();

      const invalidCreate = {
        title: "a".repeat(501),
        type: "Call" as const,
        due_date: new Date(),
        sales_id: 1,
      };
      expect(() => taskCreateSchema.parse(invalidCreate)).toThrow(z.ZodError);
    });
  });

  describe("taskUpdateSchema", () => {
    it("should enforce max constraints on partial updates", () => {
      const validUpdate = {
        id: 1,
        title: "a".repeat(500),
      };
      expect(() => taskUpdateSchema.parse(validUpdate)).not.toThrow();

      const invalidUpdate = {
        id: 1,
        description: "a".repeat(2001),
      };
      expect(() => taskUpdateSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });
  });
});
