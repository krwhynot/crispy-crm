import type { z } from "zod";

/**
 * System fields to exclude from required field detection.
 * These are auto-populated by database triggers or computed by views.
 */
const SYSTEM_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "created_by",
  "version",
  "search_tsv",
  "updated_by",
  // Computed view fields (read-only, never required for input)
  "days_in_stage",
  "last_activity_date",
  "days_since_last_activity",
  "pending_task_count",
  "overdue_task_count",
  "next_task_id",
  "next_task_title",
  "next_task_due_date",
  "next_task_priority",
  "customer_organization_name",
  "principal_organization_name",
  "distributor_organization_name",
  "primary_contact_name",
  "products",
  "nb_tasks",
  "company_name",
  "nb_notes",
  "nb_activities",
  "nb_contacts",
  "nb_opportunities",
]);

/**
 * Schema types that make a field effectively optional (user doesn't need to provide input).
 */
const OPTIONAL_TYPES = new Set(["optional", "nullable", "default"]);

/**
 * Zod v4 internal definition structure.
 */
interface ZodDef {
  type: string;
  in?: ZodDef;
  innerType?: { def: ZodDef };
}

/**
 * Type guard to check if a value has Zod v4 internals structure.
 */
function hasZodInternals(value: unknown): value is { _zod: { def: ZodDef; qin?: string } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "_zod" in value &&
    typeof (value as Record<string, unknown>)._zod === "object" &&
    (value as Record<string, unknown>)._zod !== null
  );
}

/**
 * Recursively checks if a Zod definition represents an optional field.
 * Handles wrapped types like pipe (transform), nullable, and optional.
 */
function isOptionalDef(def: ZodDef): boolean {
  const defType = def.type;

  // Direct optional types
  if (OPTIONAL_TYPES.has(defType)) {
    return true;
  }

  // For pipe types (used with transform), check the input schema
  if (defType === "pipe" && def.in) {
    return isOptionalDef(def.in);
  }

  // For wrapper types, check the inner type
  if (def.innerType?.def) {
    return isOptionalDef(def.innerType.def);
  }

  return false;
}

/**
 * Extracts required field names from a Zod strictObject schema.
 * Uses Zod v4 internal API (`_zod.def.type` and `_zod.qin`).
 *
 * Required fields are those that are:
 * - Not optional (def.type !== "optional")
 * - Not nullable (def.type !== "nullable")
 * - Not marked with optional qualifier (_zod.qin !== "optional")
 * - Not system/computed fields
 *
 * @param schema - A Zod object or strictObject schema
 * @returns Array of required field names (excludes system and computed fields)
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { getRequiredFields } from "./getRequiredFields";
 *
 * const userSchema = z.strictObject({
 *   id: z.number().optional(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   phone: z.string().optional(),
 * });
 *
 * getRequiredFields(userSchema);
 * // => ["name", "email"]
 * ```
 */
export function getRequiredFields(schema: z.ZodObject<z.ZodRawShape>): string[] {
  if (!schema?.shape) {
    return [];
  }

  const shape = schema.shape;
  const requiredFields: string[] = [];

  for (const [key, fieldSchema] of Object.entries(shape)) {
    if (SYSTEM_FIELDS.has(key)) continue;

    if (!hasZodInternals(fieldSchema)) continue;

    const zodInternals = fieldSchema._zod;

    // Check for the optional qualifier (qin = "qualifier in")
    // This handles cases like z.string().nullish() which wraps in optional
    const isOptionalMarked = zodInternals.qin === "optional";

    // Recursively check if the field is optional (handles pipe, transform, etc.)
    const isOptional = isOptionalMarked || isOptionalDef(zodInternals.def);

    // Field is required if not marked as optional at any level
    if (!isOptional) {
      requiredFields.push(key);
    }
  }

  return requiredFields;
}
