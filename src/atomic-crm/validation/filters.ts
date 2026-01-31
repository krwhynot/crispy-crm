import { z } from "zod";

/**
 * Schema for validating filter values from URL or localStorage.
 * Defensive validation to prevent injection attacks.
 */
export const filterValueSchema = z.union([
  z.string().max(500),
  z.array(z.string().max(500)).max(100),
  z.number(),
  z.boolean(),
  z.null(),
]);

export type FilterValue = z.infer<typeof filterValueSchema>;

/**
 * Schema for validating React Admin list params from localStorage.
 * Uses .passthrough() to allow extra fields from React Admin.
 */
export const listParamsSchema = z
  .object({
    filter: z.record(z.string().max(50), z.unknown()).optional(),
    sort: z
      .object({
        field: z.string().max(100),
        order: z.enum(["ASC", "DESC"]),
      })
      .optional(),
    page: z.number().int().positive().optional(),
    perPage: z.number().int().positive().max(1000).optional(),
    displayedFilters: z.record(z.string().max(50), z.boolean()).optional(),
  })
  .passthrough();

/**
 * Schema for URL filter parameters (opportunity stages, etc.)
 */
export const urlFilterSchema = z
  .object({
    stage: z
      .union([z.string(), z.array(z.string()).max(20, "Maximum 20 stage filters")])
      .optional(),
  })
  .passthrough();
