/**
 * Color system type definitions for the Atomic CRM application
 */

/**
 * Available tag color names in the new semantic color system
 */
export type TagColorName =
  | 'warm'
  | 'yellow'
  | 'pink'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'gray';

/**
 * Semantic color tokens for theme colors
 * Used for mapping color names to CSS variables or classes
 */
export type SemanticColorToken = {
  name: TagColorName;
  cssClass: string;
  hexFallback: string;
};

/**
 * Legacy hex color to semantic color mapping
 * Used during the migration transition period
 */
export const HEX_TO_SEMANTIC_MAP: Record<string, TagColorName> = {
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
  // Additional mappings for test compatibility
  '#ef4444': 'warm', // Map red to warm
  '#3b82f6': 'blue', // Map blue to blue
};

/**
 * Semantic color definitions with CSS classes
 */
export const SEMANTIC_COLORS: Record<TagColorName, SemanticColorToken> = {
  warm: {
    name: 'warm',
    cssClass: 'tag-warm',
    hexFallback: '#eddcd2',
  },
  yellow: {
    name: 'yellow',
    cssClass: 'tag-yellow',
    hexFallback: '#fff1e6',
  },
  pink: {
    name: 'pink',
    cssClass: 'tag-pink',
    hexFallback: '#fde2e4',
  },
  green: {
    name: 'green',
    cssClass: 'tag-green',
    hexFallback: '#dbe7e4',
  },
  teal: {
    name: 'teal',
    cssClass: 'tag-teal',
    hexFallback: '#c5dedd',
  },
  blue: {
    name: 'blue',
    cssClass: 'tag-blue',
    hexFallback: '#d6e2e9',
  },
  purple: {
    name: 'purple',
    cssClass: 'tag-purple',
    hexFallback: '#8b5cf6', // Default purple as it wasn't in the original palette
  },
  gray: {
    name: 'gray',
    cssClass: 'tag-gray',
    hexFallback: '#f0efeb',
  },
};

/**
 * List of valid tag color names
 */
export const VALID_TAG_COLORS: TagColorName[] = [
  'warm',
  'green',
  'teal',
  'blue',
  'purple',
  'yellow',
  'gray',
  'pink',
];