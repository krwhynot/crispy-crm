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
import { VALIDATION_LIMITS } from "./constants";
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
  "Principal/Manufacturer",
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
  "Principal/Manufacturer": "22222222-2222-4222-8222-000000000010",
  Unknown: "22222222-2222-4222-8222-000000000009",
} as const;

/**
 * Unknown segment ID constant - single source of truth
 * Used across the application for rejecting "Unknown" during CREATE operations
 */
export const UNKNOWN_SEGMENT_ID = PLAYBOOK_CATEGORY_IDS.Unknown;

/**
 * Reverse lookup: Playbook category UUID → category name
 * Used for synchronous name resolution in filter chips (no async fetch needed)
 */
export const PLAYBOOK_CATEGORY_NAMES_BY_ID: Record<string, PlaybookCategory> = Object.fromEntries(
  Object.entries(PLAYBOOK_CATEGORY_IDS).map(([name, id]) => [id, name])
) as Record<string, PlaybookCategory>;

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
  name: z.string().trim().min(1).max(100),
  segment_type: z.enum(SEGMENT_TYPES).default("playbook"),
  parent_id: z.string().uuid().nullable().optional(),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
  created_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX, "Timestamp too long").optional(),
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
 */
export const createSegmentSchema = segmentSchema.omit({
  id: true,
  created_at: true,
  created_by: true,
});

/**
 * Inferred types from schemas
 */
export type Segment = z.infer<typeof segmentSchema>;
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;

/**
 * Validate segment creation data
 * Expected by unifiedDataProvider
 * @param data - Segment data to validate
 * @returns Validated and typed segment data
 */
export function validateCreateSegment(data: unknown): CreateSegmentInput {
  return createSegmentSchema.parse(data);
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

/**
 * Determine which segment type to use for an organization
 * @param orgType - The organization type
 * @returns 'playbook' for distributors/principals, 'operator' for customers/prospects/unknown
 */
export function getSegmentTypeForOrganization(orgType: OrganizationType): SegmentType {
  if (orgType === "distributor" || orgType === "principal") {
    return "playbook";
  }
  return "operator";
}

export type { SegmentType };
