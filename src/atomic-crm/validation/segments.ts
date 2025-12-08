/**
 * Segment validation schemas and functions
 *
 * Implements Zod validation for the 9 fixed Playbook categories following
 * Core Principle #3: Single point validation at API boundaries
 *
 * Categories align with MFB's sales playbook for distributor classification:
 * - Major Broadline: Large national distributors (Sysco, USF, GFS, PFG)
 * - Specialty/Regional: Regional or specialty-focused distributors
 * - Management Company: Foodservice management (Aramark, Compass)
 * - GPO: Group Purchasing Organizations
 * - University: Higher education foodservice
 * - Restaurant Group: Multi-unit restaurant operators
 * - Chain Restaurant: National/regional chain accounts
 * - Hotel & Aviation: Hospitality and travel foodservice
 * - Unknown: Default for unclassified organizations
 */

import { z } from "zod";
import { SEGMENT_TYPES, type SegmentType } from "./operatorSegments";
import type { OrganizationType } from "./organizations";

/**
 * Fixed Playbook category names - these are the ONLY valid segment names
 * DO NOT modify without a database migration
 */
export const PLAYBOOK_CATEGORIES = [
  "Major Broadline",
  "Specialty/Regional",
  "Management Company",
  "GPO",
  "University",
  "Restaurant Group",
  "Chain Restaurant",
  "Hotel & Aviation",
  "Unknown",
] as const;

/**
 * Playbook category UUIDs matching the database
 * Use these for programmatic references
 */
// RFC 4122 compliant UUIDs (v4 format: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx)
// Using deterministic values for consistency between code and database
export const PLAYBOOK_CATEGORY_IDS = {
  "Major Broadline": "22222222-2222-4222-8222-000000000001",
  "Specialty/Regional": "22222222-2222-4222-8222-000000000002",
  "Management Company": "22222222-2222-4222-8222-000000000003",
  GPO: "22222222-2222-4222-8222-000000000004",
  University: "22222222-2222-4222-8222-000000000005",
  "Restaurant Group": "22222222-2222-4222-8222-000000000006",
  "Chain Restaurant": "22222222-2222-4222-8222-000000000007",
  "Hotel & Aviation": "22222222-2222-4222-8222-000000000008",
  Unknown: "22222222-2222-4222-8222-000000000009",
} as const;

/**
 * Type for valid Playbook category names
 */
export type PlaybookCategory = (typeof PLAYBOOK_CATEGORIES)[number];

/**
 * Zod schema for Playbook category name validation
 */
export const playbookCategorySchema = z.enum(PLAYBOOK_CATEGORIES);

/**
 * Base segment schema with all fields
 * Supports both playbook and operator segment types
 */
export const segmentSchema = z.strictObject({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  segment_type: z.enum(SEGMENT_TYPES).default("playbook"),
  parent_id: z.string().uuid().nullable().optional(),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
  created_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

/**
 * Schema for validating playbook-specific segments
 * Restricts name to enum and segment_type to 'playbook'
 */
export const playbookSegmentSchema = segmentSchema.extend({
  name: playbookCategorySchema,
  segment_type: z.literal("playbook"),
});

/**
 * Schema for creating a new segment (admin only - categories are fixed)
 * @deprecated Segments should not be created dynamically - use fixed categories
 */
export const createSegmentSchema = segmentSchema.omit({
  id: true,
  created_at: true,
  created_by: true,
});

/**
 * Schema for updating an existing segment (admin only - categories are fixed)
 * @deprecated Segments should not be updated - use fixed categories
 */
export const updateSegmentSchema = segmentSchema
  .partial()
  .required({ id: true })
  .omit({ created_at: true, created_by: true });

/**
 * Inferred types from schemas
 */
export type Segment = z.infer<typeof segmentSchema>;
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;

/**
 * Validate segment creation data
 * Expected by unifiedDataProvider
 * @deprecated Use fixed categories instead of creating new segments
 * @param data - Segment data to validate
 * @returns Validated segment data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateSegment(data: unknown): CreateSegmentInput {
  return createSegmentSchema.parse(data);
}

/**
 * Validate segment update data
 * Expected by unifiedDataProvider
 * @deprecated Use fixed categories instead of updating segments
 * @param data - Segment data to validate
 * @returns Validated segment data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateSegment(data: unknown): UpdateSegmentInput {
  return updateSegmentSchema.parse(data);
}

/**
 * Validate and normalize segment data for submission
 * @param data - Segment data to validate and normalize
 * @returns Normalized segment data ready for database
 */
export function validateSegmentForSubmission(data: unknown): Segment {
  return segmentSchema.parse(data);
}

/**
 * Get segment ID by category name
 * @param category - Playbook category name
 * @returns UUID for the category
 */
export function getSegmentIdByCategory(category: PlaybookCategory): string {
  return PLAYBOOK_CATEGORY_IDS[category];
}

/**
 * Check if a string is a valid Playbook category
 * @param value - String to check
 * @returns True if valid category
 */
export function isValidPlaybookCategory(value: string): value is PlaybookCategory {
  return PLAYBOOK_CATEGORIES.includes(value as PlaybookCategory);
}

/**
 * UI choices array for SelectInput components
 * Pre-formatted for React Admin's SelectInput
 */
export const PLAYBOOK_CATEGORY_CHOICES = PLAYBOOK_CATEGORIES.map((name) => ({
  id: PLAYBOOK_CATEGORY_IDS[name],
  name,
}));
