/**
 * Filter Configuration Schema
 *
 * Zod schema for validating filter configurations at initialization time (fail-fast).
 * Used by FilterChipBar to transform filter state into displayable chips.
 *
 * @module filters/filterConfigSchema
 */

import { z } from "zod";

/**
 * Schema for individual filter choice options
 */
export const filterChoiceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().max(100),
});

/**
 * Type for filter choices - can be static array or callback for dynamic choices
 * Callback receives context (e.g., ConfigurationContext values) at runtime
 */
export type FilterChoice = z.infer<typeof filterChoiceSchema>;
export type ChoicesOrCallback = FilterChoice[] | ((context: unknown) => FilterChoice[]);

/**
 * Zod 4 custom schema for validating callback functions.
 * In Zod 4, z.function() is no longer a schema - it's a "function factory".
 * We use z.custom() to validate that a value is a function returning FilterChoice[].
 *
 * @see https://zod.dev/v4/changelog#zfunction
 */
const choicesCallbackSchema = z.custom<(context: unknown) => FilterChoice[]>(
  (val) => typeof val === "function",
  { message: "Expected a function returning FilterChoice[]" }
);

/**
 * Zod 4 custom schema for validating formatLabel callback functions.
 */
const formatLabelCallbackSchema = z.custom<(value: unknown) => string>(
  (val) => typeof val === "function",
  { message: "Expected a function returning string" }
);

/**
 * Schema for a single filter configuration entry
 *
 * NOTE: ChipFilterConfig is named to avoid collision with existing FilterConfig in types.ts
 */
export const chipFilterConfigSchema = z.object({
  /** Filter key matching React Admin filterValues (e.g., "organization_type", "created_at@gte") */
  key: z.string().min(1).max(100),
  /** Human-readable label for the chip category (e.g., "Type", "Created After") */
  label: z.string().min(1).max(50),
  /**
   * Filter type - expanded to include all existing filter types in codebase:
   * - select: Single value selection
   * - multiselect: Multiple value selection
   * - reference: Reference to another resource (uses name hooks)
   * - date-range: Date filter (typically paired with @gte/@lte)
   * - search: Full-text search filter
   * - toggle: Boolean toggle
   * - boolean: Boolean filter with custom labels
   */
  type: z.enum(["select", "multiselect", "reference", "date-range", "search", "toggle", "boolean"]),
  /** Reference resource name for 'reference' type filters (e.g., "organizations", "sales") */
  reference: z.string().optional(),
  /**
   * Choices for select/multiselect filters
   * Can be static array OR callback function for dynamic choices (e.g., from ConfigurationContext)
   */
  choices: z
    .union([z.array(filterChoiceSchema), choicesCallbackSchema])
    .optional(),
  /** Custom formatter function to transform filter value into chip label */
  formatLabel: formatLabelCallbackSchema.optional(),
  /**
   * Group related filters for removal (e.g., date ranges)
   * When one filter in a group is removed, all filters in that group are removed
   * Example: "last_seen_range" groups "last_seen@gte" and "last_seen@lte"
   */
  removalGroup: z.string().optional(),
});

/**
 * Schema for array of filter configurations
 */
export const filterConfigSchema = z.array(chipFilterConfigSchema);

/**
 * Type for a single filter configuration entry
 * Named ChipFilterConfig to avoid collision with existing FilterConfig in types.ts
 */
export type ChipFilterConfig = z.infer<typeof chipFilterConfigSchema>;

/**
 * Validate filter config at module initialization (fail-fast).
 *
 * Call this when defining filter configs to catch errors at startup:
 * ```typescript
 * export const MY_FILTER_CONFIG = validateFilterConfig([
 *   { key: "status", label: "Status", type: "select", choices: STATUS_CHOICES },
 * ]);
 * ```
 *
 * @param config - Array of filter configuration objects
 * @returns Validated and typed filter configuration array
 * @throws {ZodError} if config is malformed
 */
export function validateFilterConfig(config: unknown): ChipFilterConfig[] {
  return filterConfigSchema.parse(config);
}
