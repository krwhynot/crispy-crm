/**
 * Tag validation schemas and functions
 *
 * Implements Zod validation for tags following Core Principle #3:
 * Single point validation at API boundaries
 */

import { z } from "zod";
import type { TagColorName } from "@/lib/color-types";
import { VALID_TAG_COLORS, HEX_TO_SEMANTIC_MAP } from "@/lib/color-types";

/**
 * Semantic color validation
 * Validates that a color is either a valid semantic color name
 * or a legacy hex value that can be mapped
 */
const semanticColorSchema = z
  .string()
  .refine(
    (value) => {
      // Check if it's a valid semantic color name
      if (VALID_TAG_COLORS.includes(value as TagColorName)) {
        return true;
      }

      // Check if it's a legacy hex value that we can map
      const normalizedHex = value.toLowerCase();
      if (HEX_TO_SEMANTIC_MAP[normalizedHex]) {
        return true;
      }

      return false;
    },
    {
      message: "Invalid color selection. Must be a valid semantic color.",
    }
  )
  .transform((value) => {
    // If it's already a valid semantic color, return it
    if (VALID_TAG_COLORS.includes(value as TagColorName)) {
      return value as TagColorName;
    }

    // Try to map from hex to semantic
    const normalizedHex = value.toLowerCase();
    const mappedColorName = HEX_TO_SEMANTIC_MAP[normalizedHex];

    // Return mapped color or default to gray
    return mappedColorName || "gray";
  });

/**
 * Base tag schema with all fields
 */
export const tagSchema = z.strictObject({
  // Required fields
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be less than 50 characters")
    .trim(),

  color: semanticColorSchema,

  // Optional fields - timestamps
  createdAt: z.union([z.string().max(50, "Timestamp too long"), z.date()]).optional(),
  updatedAt: z.union([z.string().max(50, "Timestamp too long"), z.date()]).optional(),

  // Soft delete timestamp (DI-002 audit fix)
  deleted_at: z
    .union([z.string().max(50, "Timestamp too long"), z.date()])
    .nullable()
    .optional(),

  // ID only present on updates
  id: z.union([z.string().max(50, "ID too long"), z.number()]).optional(),
});

/**
 * Schema for creating a new tag
 * Includes default color for form initialization via partial().parse({})
 */
export const createTagSchema = tagSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Override color with a default for form initialization
    color: semanticColorSchema.default("warm"),
  });

/**
 * Schema for updating an existing tag
 * Includes deleted_at for soft delete support (DI-002 audit fix)
 */
export const updateTagSchema = tagSchema
  .partial()
  .required({ id: true })
  .omit({ createdAt: true, updatedAt: true });

/**
 * Schema for soft deleting a tag
 * Used by withLifecycleCallbacks when supportsSoftDelete is true
 */
export const deleteTagSchema = z.strictObject({
  id: z.union([z.string().max(50, "ID too long"), z.number()]),
  deleted_at: z.union([z.string().max(50, "Timestamp too long"), z.date()]),
});

/**
 * Schema for tag with usage count
 */
export const tagWithCountSchema = tagSchema.extend({
  count: z.number().int().min(0),
});

/**
 * Schema for tag filter options
 */
export const tagFilterSchema = z.strictObject({
  colors: z
    .array(z.enum(VALID_TAG_COLORS as [TagColorName, ...TagColorName[]]))
    .max(20, "Maximum 20 color filters")
    .optional(),
  searchTerm: z.string().max(100).optional(),
});

/**
 * Inferred types from schemas
 */
export type Tag = z.infer<typeof tagSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagWithCount = z.infer<typeof tagWithCountSchema>;
export type TagFilterOptions = z.infer<typeof tagFilterSchema>;

/**
 * Validate tag creation data
 * Expected by unifiedDataProvider
 * @param data - Tag data to validate
 * @returns Validated tag data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateTag(data: unknown): CreateTagInput {
  return createTagSchema.parse(data);
}

/**
 * Validate tag update data
 * Expected by unifiedDataProvider
 * @param data - Tag data to validate
 * @returns Validated tag data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateTag(data: unknown): UpdateTagInput {
  return updateTagSchema.parse(data);
}

/**
 * Validate tag filter options
 * @param options - Filter options to validate
 * @returns Validated filter options
 */
export function validateTagFilter(options: unknown): TagFilterOptions {
  return tagFilterSchema.parse(options);
}

/**
 * Check if a tag name is unique
 * This is a business rule validation that would be called
 * before creating or updating a tag
 * @param name - Tag name to check
 * @param existingTags - List of existing tags
 * @param excludeId - Optional ID to exclude (for updates)
 * @returns Error message if not unique, undefined if unique
 */
export function validateTagUniqueness(
  name: string,
  existingTags: Tag[],
  excludeId?: string | number
): string | undefined {
  const normalizedName = name.trim().toLowerCase();

  const isDuplicate = existingTags.some((tag) => {
    // Skip the tag being updated
    if (excludeId && tag.id === excludeId) {
      return false;
    }

    return tag.name.trim().toLowerCase() === normalizedName;
  });

  if (isDuplicate) {
    return "A tag with this name already exists";
  }

  return undefined;
}
