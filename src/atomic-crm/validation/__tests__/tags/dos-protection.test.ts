/**
 * DoS Protection Tests for Tag Validation
 *
 * Tests .max() constraints on unbounded strings to prevent DoS attacks
 * Part of Task 8 (audit remediation)
 */

import { describe, it, expect } from "vitest";
import { tagSchema, createTagSchema, updateTagSchema } from "../../tags";
import { z } from "zod";

describe("Tag DoS Protection", () => {
  describe("tagSchema - bounded string limits", () => {
    it("should enforce 50 char limit on tag names", () => {
      const maxName = "a".repeat(50);
      const tooLongName = "a".repeat(51);

      expect(() =>
        tagSchema.parse({
          name: maxName,
          color: "blue",
        })
      ).not.toThrow();

      expect(() =>
        tagSchema.parse({
          name: tooLongName,
          color: "blue",
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on ID strings", () => {
      const maxId = "a".repeat(50);
      const tooLongId = "a".repeat(51);

      expect(() =>
        tagSchema.parse({
          name: "Test",
          color: "blue",
          id: maxId,
        })
      ).not.toThrow();

      expect(() =>
        tagSchema.parse({
          name: "Test",
          color: "blue",
          id: tooLongId,
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on timestamp strings", () => {
      const maxTimestamp = "2024-01-15T10:30:00.000000000000000000000000Z";
      const tooLongTimestamp = "a".repeat(51);

      expect(() =>
        tagSchema.parse({
          name: "Test",
          color: "blue",
          createdAt: maxTimestamp,
        })
      ).not.toThrow();

      expect(() =>
        tagSchema.parse({
          name: "Test",
          color: "blue",
          createdAt: tooLongTimestamp,
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on deleted_at timestamp strings", () => {
      const maxTimestamp = "2024-01-15T10:30:00.000000000000000000000000Z";
      const tooLongTimestamp = "a".repeat(51);

      expect(() =>
        tagSchema.parse({
          name: "Test",
          color: "blue",
          deleted_at: maxTimestamp,
        })
      ).not.toThrow();

      expect(() =>
        tagSchema.parse({
          name: "Test",
          color: "blue",
          deleted_at: tooLongTimestamp,
        })
      ).toThrow(z.ZodError);
    });
  });

  describe("createTagSchema - bounded string limits", () => {
    it("should enforce 50 char limit on tag names", () => {
      const maxName = "a".repeat(50);
      const tooLongName = "a".repeat(51);

      expect(() =>
        createTagSchema.parse({
          name: maxName,
          color: "blue",
        })
      ).not.toThrow();

      expect(() =>
        createTagSchema.parse({
          name: tooLongName,
          color: "blue",
        })
      ).toThrow(z.ZodError);
    });
  });

  describe("updateTagSchema - bounded string limits", () => {
    it("should enforce 50 char limit on tag names", () => {
      const maxName = "a".repeat(50);
      const tooLongName = "a".repeat(51);

      expect(() =>
        updateTagSchema.parse({
          id: "test-id",
          name: maxName,
        })
      ).not.toThrow();

      expect(() =>
        updateTagSchema.parse({
          id: "test-id",
          name: tooLongName,
        })
      ).toThrow(z.ZodError);
    });

    it("should enforce 50 char limit on ID strings", () => {
      const maxId = "a".repeat(50);
      const tooLongId = "a".repeat(51);

      expect(() =>
        updateTagSchema.parse({
          id: maxId,
          name: "Test",
        })
      ).not.toThrow();

      expect(() =>
        updateTagSchema.parse({
          id: tooLongId,
          name: "Test",
        })
      ).toThrow(z.ZodError);
    });
  });
});
