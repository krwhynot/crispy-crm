import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants";

/**
 * Organization Distributor validation schemas
 *
 * Tracks which distributors serve which customer/prospect organizations.
 * Answers the question: "Which distributor does this customer buy from?"
 *
 * Business Context:
 * - Customers (operators like restaurants) buy from distributors
 * - A customer may work with multiple distributors
 * - One distributor is marked as "primary" per customer
 *
 * @see supabase/migrations/20251207211946_add_organization_distributors.sql
 */

/**
 * Schema for creating/updating an organization-distributor relationship
 * Follows Engineering Constitution: Single validation at API boundary
 */
export const organizationDistributorSchema = z
  .strictObject({
    id: z.union([z.string(), z.number()]).optional(),

    // Required foreign keys
    organization_id: z.coerce.number().int().positive("Organization is required"),
    distributor_id: z.coerce.number().int().positive("Distributor is required"),

    // Primary flag (only one per organization can be true)
    is_primary: z.coerce.boolean().default(false),

    // Optional metadata
    notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(),

    // Audit fields (system-managed)
    created_by: z.coerce.number().int().optional().nullable(),
    created_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX, "Timestamp too long").optional(),
    updated_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX, "Timestamp too long").optional(),
    deleted_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX, "Timestamp too long").optional().nullable(),
  })
  .refine((data) => data.organization_id !== data.distributor_id, {
    message: "Organization cannot be its own distributor",
  });

/**
 * Type inference from schema
 */
export type OrganizationDistributor = z.infer<typeof organizationDistributorSchema>;

/**
 * Input type (before parsing) for form data
 */
export type OrganizationDistributorInput = z.input<typeof organizationDistributorSchema>;

/**
 * Extended type with joined organization names for display
 * Used in list views and relationship displays
 */
export interface OrganizationDistributorWithNames extends OrganizationDistributor {
  organization_name?: string;
  distributor_name?: string;
  distributor_city?: string;
  distributor_state?: string;
}

/**
 * Create-specific schema (stricter requirements)
 * Omits system-managed fields
 */
export const createOrganizationDistributorSchema = organizationDistributorSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .refine((data) => data.organization_id !== data.distributor_id, {
    message: "Organization cannot be its own distributor",
  });

/**
 * Update-specific schema (more flexible)
 * ID is required, other fields are optional
 */
export const updateOrganizationDistributorSchema = organizationDistributorSchema
  .partial()
  .required({ id: true })
  .refine(
    (data) => {
      // Only validate when both fields are being updated
      if (data.organization_id !== undefined && data.distributor_id !== undefined) {
        return data.organization_id !== data.distributor_id;
      }
      return true;
    },
    { message: "Organization cannot be its own distributor" }
  );

/**
 * Validation function for React Admin forms
 * @throws Formatted error object for React Admin
 */
export async function validateOrganizationDistributor(data: unknown): Promise<void> {
  const result = organizationDistributorSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}

/**
 * Validation for create operations
 */
export async function validateCreateOrganizationDistributor(data: unknown): Promise<void> {
  const result = createOrganizationDistributorSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}
