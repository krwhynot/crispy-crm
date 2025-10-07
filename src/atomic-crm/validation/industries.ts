/**
 * Industry validation schemas and functions
 *
 * Implements Zod validation for industries following Core Principle #3:
 * Single point validation at API boundaries
 */

import { z } from "zod";

/**
 * Base industry schema with all fields
 */
export const industrySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, "Industry name is required")
    .max(100, "Industry name too long")
    .trim(),
  created_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

/**
 * Schema for creating a new industry
 */
export const createIndustrySchema = industrySchema.omit({
  id: true,
  created_at: true,
  created_by: true,
});

/**
 * Schema for updating an existing industry
 */
export const updateIndustrySchema = industrySchema
  .partial()
  .required({ id: true })
  .omit({ created_at: true, created_by: true });

/**
 * Inferred types from schemas
 */
export type Industry = z.infer<typeof industrySchema>;
export type CreateIndustryInput = z.infer<typeof createIndustrySchema>;
export type UpdateIndustryInput = z.infer<typeof updateIndustrySchema>;

/**
 * Validate industry creation data
 * Expected by unifiedDataProvider
 * @param data - Industry data to validate
 * @returns Validated industry data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateIndustry(data: unknown): CreateIndustryInput {
  return createIndustrySchema.parse(data);
}

/**
 * Validate industry update data
 * Expected by unifiedDataProvider
 * @param data - Industry data to validate
 * @returns Validated industry data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateIndustry(data: unknown): UpdateIndustryInput {
  return updateIndustrySchema.parse(data);
}

/**
 * Validate and normalize industry data for submission
 * @param data - Industry data to validate and normalize
 * @returns Normalized industry data ready for database
 */
export function validateIndustryForSubmission(data: unknown): Industry {
  const validated = industrySchema.parse(data);

  // Ensure name is trimmed
  validated.name = validated.name.trim();

  return validated;
}
