/**
 * Operator Segment validation schemas and constants
 *
 * Industry-standard foodservice classifications for customer/prospect organizations.
 * Two-level hierarchy: Parent Category → Child Segment
 *
 * Commercial: FSR, LSR, Bars, Entertainment, Hotels, Catering, Travel, Restaurant Group, Meal Prep
 * Institutional: K-12, Higher Ed, Healthcare, B&I, Military/Gov, Recreation, Vending
 *
 * Implements Zod validation following Core Principle #3: Single point validation at API boundaries
 */

import { z } from "zod";

/**
 * Segment type discriminator
 */
export const SEGMENT_TYPES = ["playbook", "operator"] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

/**
 * Parent categories (top-level, no parent_id)
 * These are the primary foodservice industry classifications
 */
export const OPERATOR_PARENT_SEGMENTS = [
  "Full-Service Restaurant",
  "Limited-Service Restaurant",
  "Bars & Lounges",
  "Entertainment",
  "Hotels & Lodging",
  "Catering",
  "Travel",
  "Restaurant Group",
  "Meal Prep Service",
  "Education - K-12",
  "Education - Higher Ed",
  "Healthcare",
  "Business & Industry",
  "Military/Government",
  "Recreation/Clubs",
  "Vending Services",
] as const;

/**
 * Child segments (have parent_id)
 * These are sub-classifications that roll up to parent categories
 */
export const OPERATOR_CHILD_SEGMENTS = [
  "Fine Dining",
  "Casual Dining",
  "Family Dining",
  "Gastropub",
  "Fast Food/QSR",
  "Fast Casual",
  "Pizza",
  "Food Truck",
  "Casinos",
  "Theaters",
  "Stadiums",
  "Country Clubs",
  "Golf Courses",
  "Fitness Centers",
] as const;

/**
 * All operator segments (parents + children)
 * DO NOT modify without a database migration
 */
export const OPERATOR_SEGMENTS = [...OPERATOR_PARENT_SEGMENTS, ...OPERATOR_CHILD_SEGMENTS] as const;

/**
 * Type aliases for operator segments
 */
export type OperatorSegment = (typeof OPERATOR_SEGMENTS)[number];
export type OperatorParentSegment = (typeof OPERATOR_PARENT_SEGMENTS)[number];
export type OperatorChildSegment = (typeof OPERATOR_CHILD_SEGMENTS)[number];

/**
 * Operator segment UUIDs matching the database
 * Use these for programmatic references
 * RFC 4122 compliant UUIDs (v4 format: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx)
 * Using deterministic values for consistency between code and database
 *
 * Pattern: 33333333-3333-4333-8333-XXXXXXXXXXXX
 * Parents: 000000000001 through 000000000016
 * Children: Use parent prefix + child number (e.g., FSR children are 000000000101-104)
 */
export const OPERATOR_SEGMENT_IDS = {
  // Commercial - Parent Categories
  "Full-Service Restaurant": "33333333-3333-4333-8333-000000000001",
  "Limited-Service Restaurant": "33333333-3333-4333-8333-000000000002",
  "Bars & Lounges": "33333333-3333-4333-8333-000000000003",
  Entertainment: "33333333-3333-4333-8333-000000000004",
  "Hotels & Lodging": "33333333-3333-4333-8333-000000000005",
  Catering: "33333333-3333-4333-8333-000000000006",
  Travel: "33333333-3333-4333-8333-000000000007",
  "Restaurant Group": "33333333-3333-4333-8333-000000000008",
  "Meal Prep Service": "33333333-3333-4333-8333-000000000009",

  // Institutional - Parent Categories
  "Education - K-12": "33333333-3333-4333-8333-000000000010",
  "Education - Higher Ed": "33333333-3333-4333-8333-000000000011",
  Healthcare: "33333333-3333-4333-8333-000000000012",
  "Business & Industry": "33333333-3333-4333-8333-000000000013",
  "Military/Government": "33333333-3333-4333-8333-000000000014",
  "Recreation/Clubs": "33333333-3333-4333-8333-000000000015",
  "Vending Services": "33333333-3333-4333-8333-000000000016",

  // Full-Service Restaurant - Children
  "Fine Dining": "33333333-3333-4333-8333-000000000101",
  "Casual Dining": "33333333-3333-4333-8333-000000000102",
  "Family Dining": "33333333-3333-4333-8333-000000000103",
  Gastropub: "33333333-3333-4333-8333-000000000104",

  // Limited-Service Restaurant - Children
  "Fast Food/QSR": "33333333-3333-4333-8333-000000000201",
  "Fast Casual": "33333333-3333-4333-8333-000000000202",
  Pizza: "33333333-3333-4333-8333-000000000203",
  "Food Truck": "33333333-3333-4333-8333-000000000204",

  // Entertainment - Children
  Casinos: "33333333-3333-4333-8333-000000000401",
  Theaters: "33333333-3333-4333-8333-000000000402",
  Stadiums: "33333333-3333-4333-8333-000000000403",

  // Recreation/Clubs - Children
  "Country Clubs": "33333333-3333-4333-8333-000000001501",
  "Golf Courses": "33333333-3333-4333-8333-000000001502",
  "Fitness Centers": "33333333-3333-4333-8333-000000001503",
} as const;

/**
 * Parent-child hierarchy mapping
 * Maps parent segments to their child segments
 */
export const OPERATOR_SEGMENT_HIERARCHY: Record<
  OperatorParentSegment,
  readonly OperatorChildSegment[]
> = {
  "Full-Service Restaurant": ["Fine Dining", "Casual Dining", "Family Dining", "Gastropub"],
  "Limited-Service Restaurant": ["Fast Food/QSR", "Fast Casual", "Pizza", "Food Truck"],
  "Bars & Lounges": [],
  Entertainment: ["Casinos", "Theaters", "Stadiums"],
  "Hotels & Lodging": [],
  Catering: [],
  Travel: [],
  "Restaurant Group": [],
  "Meal Prep Service": [],
  "Education - K-12": [],
  "Education - Higher Ed": [],
  Healthcare: [],
  "Business & Industry": [],
  "Military/Government": [],
  "Recreation/Clubs": ["Country Clubs", "Golf Courses", "Fitness Centers"],
  "Vending Services": [],
};

/**
 * Zod schema for operator segment name validation
 */
export const operatorSegmentSchema = z.enum(OPERATOR_SEGMENTS);

/**
 * Zod schema for operator parent segment validation
 */
export const operatorParentSegmentSchema = z.enum(OPERATOR_PARENT_SEGMENTS);

/**
 * Zod schema for operator child segment validation
 */
export const operatorChildSegmentSchema = z.enum(OPERATOR_CHILD_SEGMENTS);

/**
 * Base operator segment schema with all fields
 */
export const operatorSegmentRecordSchema = z.strictObject({
  id: z.string().uuid().optional(),
  name: operatorSegmentSchema,
  segment_type: z.enum(SEGMENT_TYPES),
  parent_id: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

/**
 * Schema for creating a new operator segment
 * @deprecated Segments should not be created dynamically - use fixed categories
 */
export const createOperatorSegmentSchema = operatorSegmentRecordSchema.omit({
  id: true,
  created_at: true,
  created_by: true,
});

/**
 * Schema for updating an existing operator segment
 * @deprecated Segments should not be updated - use fixed categories
 */
export const updateOperatorSegmentSchema = operatorSegmentRecordSchema
  .partial()
  .required({ id: true })
  .omit({ created_at: true, created_by: true });

/**
 * Inferred types from schemas
 */
export type OperatorSegmentRecord = z.infer<typeof operatorSegmentRecordSchema>;
export type CreateOperatorSegmentInput = z.infer<typeof createOperatorSegmentSchema>;
export type UpdateOperatorSegmentInput = z.infer<typeof updateOperatorSegmentSchema>;

/**
 * UI choices array for SelectInput components - Parents only
 * Pre-formatted for React Admin's SelectInput
 * Used for filter toggles and parent selection
 */
export const OPERATOR_SEGMENT_PARENT_CHOICES = OPERATOR_PARENT_SEGMENTS.map((name) => ({
  id: OPERATOR_SEGMENT_IDS[name],
  name,
  isParent: true,
}));

/**
 * UI choices array for SelectInput components - All segments with hierarchy
 * Pre-formatted for React Admin's SelectInput
 * Children are indented with "  " prefix for visual hierarchy
 */
export const OPERATOR_SEGMENT_CHOICES = [
  // Full-Service Restaurant
  {
    id: OPERATOR_SEGMENT_IDS["Full-Service Restaurant"],
    name: "Full-Service Restaurant",
    isParent: true,
  },
  {
    id: OPERATOR_SEGMENT_IDS["Fine Dining"],
    name: "  Fine Dining",
    parentId: OPERATOR_SEGMENT_IDS["Full-Service Restaurant"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Casual Dining"],
    name: "  Casual Dining",
    parentId: OPERATOR_SEGMENT_IDS["Full-Service Restaurant"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Family Dining"],
    name: "  Family Dining",
    parentId: OPERATOR_SEGMENT_IDS["Full-Service Restaurant"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Gastropub"],
    name: "  Gastropub",
    parentId: OPERATOR_SEGMENT_IDS["Full-Service Restaurant"],
  },

  // Limited-Service Restaurant
  {
    id: OPERATOR_SEGMENT_IDS["Limited-Service Restaurant"],
    name: "Limited-Service Restaurant",
    isParent: true,
  },
  {
    id: OPERATOR_SEGMENT_IDS["Fast Food/QSR"],
    name: "  Fast Food/QSR",
    parentId: OPERATOR_SEGMENT_IDS["Limited-Service Restaurant"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Fast Casual"],
    name: "  Fast Casual",
    parentId: OPERATOR_SEGMENT_IDS["Limited-Service Restaurant"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Pizza"],
    name: "  Pizza",
    parentId: OPERATOR_SEGMENT_IDS["Limited-Service Restaurant"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Food Truck"],
    name: "  Food Truck",
    parentId: OPERATOR_SEGMENT_IDS["Limited-Service Restaurant"],
  },

  // Bars & Lounges (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Bars & Lounges"],
    name: "Bars & Lounges",
    isParent: true,
  },

  // Entertainment
  {
    id: OPERATOR_SEGMENT_IDS["Entertainment"],
    name: "Entertainment",
    isParent: true,
  },
  {
    id: OPERATOR_SEGMENT_IDS["Casinos"],
    name: "  Casinos",
    parentId: OPERATOR_SEGMENT_IDS["Entertainment"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Theaters"],
    name: "  Theaters",
    parentId: OPERATOR_SEGMENT_IDS["Entertainment"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Stadiums"],
    name: "  Stadiums",
    parentId: OPERATOR_SEGMENT_IDS["Entertainment"],
  },

  // Hotels & Lodging (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Hotels & Lodging"],
    name: "Hotels & Lodging",
    isParent: true,
  },

  // Catering (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Catering"],
    name: "Catering",
    isParent: true,
  },

  // Travel (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Travel"],
    name: "Travel",
    isParent: true,
  },

  // Restaurant Group (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Restaurant Group"],
    name: "Restaurant Group",
    isParent: true,
  },

  // Meal Prep Service (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Meal Prep Service"],
    name: "Meal Prep Service",
    isParent: true,
  },

  // Education - K-12 (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Education - K-12"],
    name: "Education - K-12",
    isParent: true,
  },

  // Education - Higher Ed (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Education - Higher Ed"],
    name: "Education - Higher Ed",
    isParent: true,
  },

  // Healthcare (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Healthcare"],
    name: "Healthcare",
    isParent: true,
  },

  // Business & Industry (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Business & Industry"],
    name: "Business & Industry",
    isParent: true,
  },

  // Military/Government (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Military/Government"],
    name: "Military/Government",
    isParent: true,
  },

  // Recreation/Clubs
  {
    id: OPERATOR_SEGMENT_IDS["Recreation/Clubs"],
    name: "Recreation/Clubs",
    isParent: true,
  },
  {
    id: OPERATOR_SEGMENT_IDS["Country Clubs"],
    name: "  Country Clubs",
    parentId: OPERATOR_SEGMENT_IDS["Recreation/Clubs"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Golf Courses"],
    name: "  Golf Courses",
    parentId: OPERATOR_SEGMENT_IDS["Recreation/Clubs"],
  },
  {
    id: OPERATOR_SEGMENT_IDS["Fitness Centers"],
    name: "  Fitness Centers",
    parentId: OPERATOR_SEGMENT_IDS["Recreation/Clubs"],
  },

  // Vending Services (no children)
  {
    id: OPERATOR_SEGMENT_IDS["Vending Services"],
    name: "Vending Services",
    isParent: true,
  },
];

/**
 * Check if a segment name is a parent segment
 * @param name - Segment name to check
 * @returns True if the segment is a parent category
 */
export function isOperatorParentSegment(name: string): name is OperatorParentSegment {
  return OPERATOR_PARENT_SEGMENTS.includes(name as OperatorParentSegment);
}

/**
 * Get segment ID by segment name
 * @param name - Operator segment name
 * @returns UUID for the segment
 */
export function getOperatorSegmentId(name: OperatorSegment): string {
  return OPERATOR_SEGMENT_IDS[name];
}

/**
 * Get child segments for a parent segment
 * @param parent - Parent segment name
 * @returns Array of child segments (empty if parent has no children)
 */
export function getOperatorSegmentChildren(
  parent: OperatorParentSegment
): readonly OperatorChildSegment[] {
  return OPERATOR_SEGMENT_HIERARCHY[parent];
}

/**
 * Check if a string is a valid operator segment
 * @param value - String to check
 * @returns True if valid operator segment
 */
export function isValidOperatorSegment(value: string): value is OperatorSegment {
  return OPERATOR_SEGMENTS.includes(value as OperatorSegment);
}

/**
 * Validate operator segment creation data
 * Expected by unifiedDataProvider
 * @deprecated Use fixed categories instead of creating new segments
 * @param data - Operator segment data to validate
 * @returns Validated operator segment data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateOperatorSegment(data: unknown): CreateOperatorSegmentInput {
  return createOperatorSegmentSchema.parse(data);
}

/**
 * Validate operator segment update data
 * Expected by unifiedDataProvider
 * @deprecated Use fixed categories instead of updating segments
 * @param data - Operator segment data to validate
 * @returns Validated operator segment data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateOperatorSegment(data: unknown): UpdateOperatorSegmentInput {
  return updateOperatorSegmentSchema.parse(data);
}

/**
 * Validate and normalize operator segment data for submission
 * @param data - Operator segment data to validate and normalize
 * @returns Normalized operator segment data ready for database
 */
export function validateOperatorSegmentForSubmission(data: unknown): OperatorSegmentRecord {
  return operatorSegmentRecordSchema.parse(data);
}
