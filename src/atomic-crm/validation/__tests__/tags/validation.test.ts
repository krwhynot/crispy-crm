/**
 * Tests for tag validation schemas
 * Focus: Core validation rules and schema behavior
 */

import { describe, it, expect } from "vitest";
import {
  tagSchema,
  createTagSchema,
  updateTagSchema,
  tagWithCountSchema,
  tagFilterSchema,
  validateCreateTag,
  validateUpdateTag,
  validateTagFilter,
} from "../../tags";
import { z } from "zod";

describe("Tag Validation Schemas", () => {
  describe("tagSchema", () => {
    const validTag = {
      name: "Important",
      color: "warm", // Using semantic color instead of "red"
    };

    it("should accept valid tag data", () => {
      const result = tagSchema.parse(validTag);
      expect(result).toBeDefined();
      expect(result.name).toBe("Important");
      expect(result.color).toBe("warm"); // Now expects "warm" instead of "red"
    });

    it("should reject empty name", () => {
      const invalidData = { ...validTag, name: "" };
      expect(() => tagSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should reject name longer than 50 characters", () => {
      const longName = "a".repeat(51);
      const invalidData = { ...validTag, name: longName };
      expect(() => tagSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should trim tag names", () => {
      const tagWithSpaces = {
        name: "  Trimmed Tag  ",
        color: "blue",
      };

      const result = tagSchema.parse(tagWithSpaces);
      expect(result.name).toBe("Trimmed Tag");
    });

    it("should validate semantic colors", () => {
      const validColors = ["warm", "green", "teal", "blue", "purple", "yellow", "gray", "pink"];

      validColors.forEach((color) => {
        const tag = { name: "Test", color };
        expect(() => tagSchema.parse(tag)).not.toThrow();
      });
    });

    it("should reject invalid colors including hex codes", () => {
      // Testing that hex codes are properly rejected per Engineering Constitution #7
      const invalidColors = ["black", "white", "brown", "invalid", "#FF0000"];

      invalidColors.forEach((color) => {
        const tag = { name: "Test", color };
        expect(() => tagSchema.parse(tag)).toThrow(z.ZodError);
      });
    });

    it("should transform legacy hex colors to semantic colors", () => {
      // Testing that legacy hex colors are properly mapped to semantic colors
      // These hex values are test data to verify the transformation logic
      const legacyHexTags = [
        { name: "Red Tag", color: "#ef4444" }, // Should map to semantic color
        { name: "Blue Tag", color: "#3b82f6" }, // Should map to semantic color
      ];

      legacyHexTags.forEach((tag) => {
        const result = tagSchema.parse(tag);
        expect(result.color).toBeDefined();
        expect(typeof result.color).toBe("string");
        // Result should be a semantic color, not a hex value
        expect(result.color).not.toMatch(/^#[A-Fa-f0-9]{6}$/);
      });
    });

    it("should handle optional timestamp fields", () => {
      const tagWithTimestamps = {
        ...validTag,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      };

      const result = tagSchema.parse(tagWithTimestamps);
      expect(result.createdAt).toBe("2024-01-01T00:00:00Z");
      expect(result.updatedAt).toBe("2024-01-02T00:00:00Z");
    });

    it("should accept both string and number IDs", () => {
      expect(() => tagSchema.parse({ ...validTag, id: "string-id" })).not.toThrow();
      expect(() => tagSchema.parse({ ...validTag, id: 12345 })).not.toThrow();
    });

    it("should handle Date objects for timestamps", () => {
      const now = new Date();
      const tagWithDates = {
        ...validTag,
        createdAt: now,
        updatedAt: now,
      };

      expect(() => tagSchema.parse(tagWithDates)).not.toThrow();
    });
  });

  describe("createTagSchema", () => {
    it("should require essential fields for creation", () => {
      const validCreate = {
        name: "New Tag",
        color: "green",
      };

      expect(() => createTagSchema.parse(validCreate)).not.toThrow();
    });

    it("should reject creation without required fields", () => {
      expect(() => createTagSchema.parse({})).toThrow(z.ZodError);
      expect(() => createTagSchema.parse({ name: "Test" })).toThrow(z.ZodError);
      expect(() => createTagSchema.parse({ color: "blue" })).toThrow(z.ZodError);
    });

    it("should reject id field on creation (z.strictObject security)", () => {
      const dataWithId = {
        id: "should-not-be-here",
        name: "New Tag",
        color: "blue",
      };

      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      expect(() => createTagSchema.parse(dataWithId)).toThrow(z.ZodError);
    });

    it("should reject timestamp fields on creation (z.strictObject security)", () => {
      const dataWithTimestamps = {
        name: "New Tag",
        color: "purple",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      expect(() => createTagSchema.parse(dataWithTimestamps)).toThrow(z.ZodError);
    });

    it("should trim name on creation", () => {
      const tagWithSpaces = {
        name: "  New Tag  ",
        color: "yellow", // Use semantic color instead of "orange"
      };

      const result = createTagSchema.parse(tagWithSpaces);
      expect(result.name).toBe("New Tag");
    });
  });

  describe("updateTagSchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: "tag-123",
        name: "Updated Name",
      };

      expect(() => updateTagSchema.parse(validUpdate)).not.toThrow();
    });

    it("should reject updates without id", () => {
      const invalidUpdate = {
        name: "Updated Name",
      };

      expect(() => updateTagSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it("should allow partial updates", () => {
      expect(() => updateTagSchema.parse({ id: "tag-1", name: "New Name" })).not.toThrow();
      expect(
        () => updateTagSchema.parse({ id: "tag-1", color: "warm" }) // Use semantic color
      ).not.toThrow();
      expect(() => updateTagSchema.parse({ id: "tag-1" })).not.toThrow();
    });

    it("should validate updated fields", () => {
      expect(() =>
        updateTagSchema.parse({
          id: "tag-1",
          color: "invalid_color",
        })
      ).toThrow(z.ZodError);

      expect(() =>
        updateTagSchema.parse({
          id: "tag-1",
          name: "a".repeat(51),
        })
      ).toThrow(z.ZodError);
    });

    it("should reject timestamp updates (z.strictObject security)", () => {
      const updateWithTimestamps = {
        id: "tag-1",
        name: "Updated",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      };

      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      expect(() => updateTagSchema.parse(updateWithTimestamps)).toThrow(z.ZodError);
    });
  });

  describe("tagWithCountSchema", () => {
    it("should extend tag with count field", () => {
      const tagWithCount = {
        name: "Popular Tag",
        color: "blue",
        count: 42,
      };

      const result = tagWithCountSchema.parse(tagWithCount);
      expect(result.name).toBe("Popular Tag");
      expect(result.count).toBe(42);
    });

    it("should validate count is non-negative integer", () => {
      expect(() =>
        tagWithCountSchema.parse({
          name: "Tag",
          color: "warm", // Use semantic color
          count: -1,
        })
      ).toThrow(z.ZodError);

      expect(() =>
        tagWithCountSchema.parse({
          name: "Tag",
          color: "warm", // Use semantic color
          count: 3.14,
        })
      ).toThrow(z.ZodError);

      expect(() =>
        tagWithCountSchema.parse({
          name: "Tag",
          color: "warm", // Use semantic color
          count: 0,
        })
      ).not.toThrow();
    });
  });

  describe("tagFilterSchema", () => {
    it("should accept valid filter options", () => {
      const filter = {
        colors: ["warm", "blue", "green"], // Use semantic colors
        searchTerm: "important",
      };

      const result = tagFilterSchema.parse(filter);
      expect(result.colors).toHaveLength(3);
      expect(result.searchTerm).toBe("important");
    });

    it("should allow optional fields", () => {
      expect(() => tagFilterSchema.parse({})).not.toThrow();
      expect(() => tagFilterSchema.parse({ colors: ["warm"] })).not.toThrow(); // Use semantic color
      expect(() => tagFilterSchema.parse({ searchTerm: "test" })).not.toThrow();
    });

    it("should validate color array contains only valid colors", () => {
      expect(() =>
        tagFilterSchema.parse({
          colors: ["warm", "invalid_color", "blue"], // Use semantic colors
        })
      ).toThrow(z.ZodError);
    });
  });

  describe("Validation Functions", () => {
    describe("validateCreateTag", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          name: "New Tag",
          color: "green",
        };

        const result = validateCreateTag(validData);
        expect(result.name).toBe("New Tag");
        expect(result.color).toBe("green");
      });

      it("should throw for invalid creation data", () => {
        const invalidData = {
          name: "",
          color: "green",
        };

        expect(() => validateCreateTag(invalidData)).toThrow(z.ZodError);
      });

      it("should trim name during validation", () => {
        const dataWithSpaces = {
          name: "  Trimmed  ",
          color: "blue",
        };

        const result = validateCreateTag(dataWithSpaces);
        expect(result.name).toBe("Trimmed");
      });
    });

    describe("validateUpdateTag", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          id: "tag-123",
          name: "Updated Tag",
        };

        const result = validateUpdateTag(validData);
        expect(result.id).toBe("tag-123");
        expect(result.name).toBe("Updated Tag");
      });

      it("should throw for invalid update data", () => {
        const invalidData = {
          name: "Updated Tag",
        };

        expect(() => validateUpdateTag(invalidData)).toThrow(z.ZodError);
      });
    });

    describe("validateTagFilter", () => {
      it("should validate filter options", () => {
        const filter = {
          colors: ["warm", "blue"], // Use semantic colors
          searchTerm: "test",
        };

        const result = validateTagFilter(filter);
        expect(result.colors).toEqual(["warm", "blue"]);
        expect(result.searchTerm).toBe("test");
      });

      it("should handle empty filter", () => {
        const result = validateTagFilter({});
        expect(result.colors).toBeUndefined();
        expect(result.searchTerm).toBeUndefined();
      });
    });
  });
});
