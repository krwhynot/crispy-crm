/**
 * Segment validation schemas and functions
 *
 * Implements Zod validation for segments following Core Principle #3:
 * Single point validation at API boundaries
 */

import { z } from "zod";

/**
 * Base segment schema with all fields
 */
export const segmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, "Segment name is required")
    .max(100, "Segment name too long")
    .trim(),
  created_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

/**
 * Schema for creating a new segment
 */
export const createSegmentSchema = segmentSchema.omit({
  id: true,
  created_at: true,
  created_by: true,
});

/**
 * Schema for updating an existing segment
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
  const validated = segmentSchema.parse(data);

  // Ensure name is trimmed
  validated.name = validated.name.trim();

  return validated;
}
