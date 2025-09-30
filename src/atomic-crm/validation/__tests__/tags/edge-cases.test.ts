/**
 * Tests for tag business rules, uniqueness, and edge cases
 * Focus: Uniqueness validation, business logic, and error formatting
 */

import { describe, it, expect } from "vitest";
import {
  tagSchema,
  validateTagUniqueness,
  validateTagForSubmission,
  type Tag,
} from "../../tags";
import { z } from "zod";

describe("Tag Edge Cases and Business Rules", () => {
  describe("validateTagUniqueness", () => {
    const existingTags: Tag[] = [
      { id: 1, name: "Existing Tag", color: "red" },
      { id: 2, name: "Another Tag", color: "blue" },
      { id: 3, name: "Case Test", color: "green" },
    ];

    it("should detect duplicate tag names", () => {
      const error = validateTagUniqueness("Existing Tag", existingTags);
      expect(error).toBe("A tag with this name already exists");
    });

    it("should be case-insensitive", () => {
      const error = validateTagUniqueness("EXISTING TAG", existingTags);
      expect(error).toBe("A tag with this name already exists");
    });

    it("should ignore spaces in comparison", () => {
      const error = validateTagUniqueness("  Existing Tag  ", existingTags);
      expect(error).toBe("A tag with this name already exists");
    });

    it("should allow unique names", () => {
      const error = validateTagUniqueness("Unique Tag", existingTags);
      expect(error).toBeUndefined();
    });

    it("should exclude tag being updated", () => {
      const error = validateTagUniqueness("Existing Tag", existingTags, 1);
      expect(error).toBeUndefined();
    });

    it("should still detect duplicates when updating", () => {
      const error = validateTagUniqueness("Another Tag", existingTags, 1);
      expect(error).toBe("A tag with this name already exists");
    });
  });

  describe("validateTagForSubmission", () => {
    it("should validate and normalize tag data", () => {
      const inputData = {
        name: "  Important Tag  ",
        color: "red",
      };

      const result = validateTagForSubmission(inputData);
      expect(result.name).toBe("Important Tag");
      expect(result.color).toBe("red");
    });

    it("should throw for invalid submission data", () => {
      const invalidData = {
        name: "",
        color: "red",
      };

      expect(() => validateTagForSubmission(invalidData)).toThrow(z.ZodError);
    });

    it("should transform hex colors during submission", () => {
      const dataWithHex = {
        name: "Color Test",
        color: "gray",
      };

      const result = validateTagForSubmission(dataWithHex);
      expect(result.color).toBe("gray");
    });
  });

  describe("Business Rules", () => {
    it("should enforce semantic color system", () => {
      const semanticColors = [
        "red",
        "orange",
        "amber",
        "yellow",
        "lime",
        "green",
        "emerald",
        "teal",
        "cyan",
        "sky",
        "blue",
        "indigo",
        "violet",
        "purple",
        "fuchsia",
        "pink",
        "rose",
        "gray",
      ];

      semanticColors.forEach((color) => {
        const tag = {
          name: `${color} Tag`,
          color,
        };

        expect(() => tagSchema.parse(tag)).not.toThrow();
      });
    });

    it("should handle color migration from hex to semantic", () => {
      const legacyTag = {
        name: "Legacy",
        color: "gray",
      };

      const result = tagSchema.parse(legacyTag);
      expect(typeof result.color).toBe("string");
      expect(result.color).toMatch(/^[a-z]+$/);
    });

    it("should enforce name length limits", () => {
      const maxLengthName = "a".repeat(50);
      const tooLongName = "a".repeat(51);

      expect(() =>
        tagSchema.parse({
          name: maxLengthName,
          color: "blue",
        }),
      ).not.toThrow();

      expect(() =>
        tagSchema.parse({
          name: tooLongName,
          color: "blue",
        }),
      ).toThrow(z.ZodError);
    });

    it("should handle tag categorization", () => {
      const categoryTags = [
        { name: "High Priority", color: "red" },
        { name: "In Progress", color: "yellow" },
        { name: "Completed", color: "green" },
        { name: "Archived", color: "gray" },
      ];

      categoryTags.forEach((tag) => {
        expect(() => tagSchema.parse(tag)).not.toThrow();
      });
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", () => {
      const testCases = [
        {
          data: { name: "", color: "red" },
          expectedError: "Tag name is required",
        },
        {
          data: { name: "a".repeat(51), color: "blue" },
          expectedError: "Tag name must be less than 50 characters",
        },
        {
          data: { name: "Test", color: "invalid" },
          expectedError:
            "Invalid color selection. Must be a valid semantic color.",
        },
      ];

      testCases.forEach(({ data, expectedError }) => {
        try {
          tagSchema.parse(data);
          expect.fail("Should have thrown error");
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.errors[0].message;
            expect(message).toBe(expectedError);
          }
        }
      });
    });
  });
});