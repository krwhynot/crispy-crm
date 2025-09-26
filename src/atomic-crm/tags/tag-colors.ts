import type { TagColorName } from '@/lib/color-types';
import {
  SEMANTIC_COLORS,
  VALID_TAG_COLORS
} from '@/lib/color-types';

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

  return 'Invalid color selection';
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
 * Migrates a legacy hex color to a semantic color name
 * @param hexColor - The hex color to migrate
 * @returns The semantic color name
 */
export function migrateHexToSemantic(hexColor: string): TagColorName {
  const normalizedHex = hexColor.toLowerCase();
  const mappedColor = HEX_TO_SEMANTIC_MAP[normalizedHex];

  // Return mapped color or default to gray
  return mappedColor || 'gray';
}

/**
 * Gets the hex fallback for a semantic color
 * Used during transition period for backward compatibility
 * @param colorName - The semantic color name
 * @returns Hex color string
 */
export function getHexFallback(colorName: TagColorName): string {
  const semanticColor = SEMANTIC_COLORS[colorName];
  return semanticColor ? semanticColor.hexFallback : SEMANTIC_COLORS.gray.hexFallback;
}

/**
 * Checks if a value is a legacy hex color
 * @param value - The value to check
 * @returns True if it's a known legacy hex color
 */
export function isLegacyHexColor(value: string): boolean {
  const normalizedHex = value.toLowerCase();
  return normalizedHex in HEX_TO_SEMANTIC_MAP;
}

/**
 * Normalizes a color value to a semantic color name
 * Handles both semantic names and hex values
 * @param color - The color value to normalize
 * @returns The normalized semantic color name
 */
export function normalizeColorToSemantic(color: string): TagColorName {
  // If it's already a valid semantic color, return it
  if (VALID_TAG_COLORS.includes(color as TagColorName)) {
    return color as TagColorName;
  }

  // Try to migrate from hex
  return migrateHexToSemantic(color);
}

/**
 * Color migration mapping for database conversion
 * Maps old hex values to new semantic names
 */
export const COLOR_MIGRATION_MAP = {
  '#eddcd2': 'warm',
  '#fff1e6': 'yellow',
  '#fde2e4': 'pink',
  '#fad2e1': 'pink',
  '#c5dedd': 'teal',
  '#dbe7e4': 'green',
  '#f0efeb': 'gray',
  '#d6e2e9': 'blue',
  '#bcd4e6': 'blue',
  '#99c1de': 'teal',
} as const;

/**
 * Export the valid colors list for use in UI components
 */
export const TAG_COLORS = VALID_TAG_COLORS;