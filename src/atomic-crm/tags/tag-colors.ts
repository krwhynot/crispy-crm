import type { TagColorName } from "@/lib/color-types";
import { SEMANTIC_COLORS, VALID_TAG_COLORS } from "@/lib/color-types";

/**
 * Validates if a color value is a valid tag color
 * Only accepts semantic color names
 * @param value - The color value to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validateTagColor(value: string): string | undefined {
  // Check if it's a valid semantic color name
  if (VALID_TAG_COLORS.includes(value as TagColorName)) {
    return undefined;
  }

  return "Invalid color selection";
}

/**
 * Gets the CSS class for a tag color
 * Only handles semantic color names
 * @param color - The semantic color name
 * @returns CSS class string for the color
 */
export function getTagColorClass(color: string): string {
  // Try as semantic color name
  const semanticColor = SEMANTIC_COLORS[color as TagColorName];
  if (semanticColor) {
    return semanticColor.cssClass;
  }

  // Fallback to default gray if unknown
  return SEMANTIC_COLORS.gray.cssClass;
}

/**
 * Normalizes a color value to a semantic color name
 * Only accepts semantic color names, defaults to gray for invalid values
 * @param color - The color value to normalize
 * @returns The normalized semantic color name
 */
export function normalizeColorToSemantic(color: string): TagColorName {
  // If it's already a valid semantic color, return it
  if (VALID_TAG_COLORS.includes(color as TagColorName)) {
    return color as TagColorName;
  }

  // Default to gray for any invalid color
  return "gray";
}

/**
 * Export the valid colors list for use in UI components
 */
export const TAG_COLORS = VALID_TAG_COLORS;
