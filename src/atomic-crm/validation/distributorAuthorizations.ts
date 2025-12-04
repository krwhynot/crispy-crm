import { z } from "zod";

/**
 * Distributor Principal Authorization validation schemas
 *
 * Tracks which principals (food manufacturers) are authorized to sell
 * through which distributors. Part of MFB's three-party business model:
 * Principal → Distributor → Customer/Operator
 *
 * @see supabase/migrations/20251129050428_add_distributor_principal_authorizations.sql
 */

/**
 * Schema for creating/updating a distributor-principal authorization
 * Follows Engineering Constitution: Single validation at API boundary
 */
export const distributorAuthorizationSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),

    // Required foreign keys
    distributor_id: z.coerce.number().int().positive("Distributor is required"),
    principal_id: z.coerce.number().int().positive("Principal is required"),

    // Authorization metadata
    is_authorized: z.coerce.boolean().default(true),
    authorization_date: z.coerce.date().optional().nullable(),
    expiration_date: z.coerce.date().optional().nullable(),
    territory_restrictions: z.array(z.string()).optional().nullable(),
    notes: z.string().optional().nullable(),

    // Audit fields (system-managed)
    created_by: z.coerce.number().int().optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    deleted_at: z.string().optional().nullable(),
  })
  .refine((data) => data.distributor_id !== data.principal_id, {
    message: "Distributor and Principal cannot be the same organization",
  })
  .refine(
    (data) => {
      if (data.expiration_date && data.authorization_date) {
        return new Date(data.expiration_date) > new Date(data.authorization_date);
      }
      return true;
    },
    { message: "Expiration date must be after authorization date" }
  );

/**
 * Type inference from schema
 */
export type DistributorAuthorization = z.infer<typeof distributorAuthorizationSchema>;

/**
 * Input type (before parsing) for form data
 */
export type DistributorAuthorizationInput = z.input<typeof distributorAuthorizationSchema>;

/**
 * Extended type with joined organization names for display
 * Used in list views and the AuthorizationsTab component
 */
export interface DistributorAuthorizationWithNames extends DistributorAuthorization {
  principal_name?: string;
  distributor_name?: string;
}

/**
 * Create-specific schema (stricter requirements)
 * Omits system-managed fields
 */
export const createDistributorAuthorizationSchema = distributorAuthorizationSchema
  .innerType()
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  });

/**
 * Update-specific schema (more flexible)
 * ID is required, other fields are optional
 */
export const updateDistributorAuthorizationSchema = distributorAuthorizationSchema
  .innerType()
  .partial()
  .required({ id: true });

/**
 * Validation function for React Admin forms
 * @throws Formatted error object for React Admin
 */
export async function validateDistributorAuthorization(data: unknown): Promise<void> {
  const result = distributorAuthorizationSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    throw {
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
}

/**
 * Validation for create operations
 */
export async function validateCreateDistributorAuthorization(data: unknown): Promise<void> {
  const result = createDistributorAuthorizationSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    throw {
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
}

// =====================================================
// Product-Level Authorization Overrides
// =====================================================

/**
 * Special pricing JSONB schema
 * Flexible structure for product-specific pricing overrides
 */
export const specialPricingSchema = z
  .object({
    unit_price: z.coerce.number().positive().optional(),
    discount_percent: z.coerce.number().min(0).max(100).optional(),
    min_quantity: z.coerce.number().int().positive().optional(),
    max_quantity: z.coerce.number().int().positive().optional(),
    notes: z.string().optional(),
  })
  .passthrough(); // Allow additional fields for flexibility

/**
 * Product Distributor Authorization schema
 *
 * Allows product-specific overrides to org-level authorizations.
 * Resolution order:
 * 1. Product-level auth (this table) - most specific
 * 2. Org-level auth (distributor_principal_authorizations) - inherited
 * 3. No auth found = product not authorized
 *
 * @see supabase/migrations/20251129051625_add_product_distributor_authorizations.sql
 */
export const productDistributorAuthorizationSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),

    // Required foreign keys
    product_id: z.coerce.number().int().positive("Product is required"),
    distributor_id: z.coerce.number().int().positive("Distributor is required"),

    // Authorization metadata
    is_authorized: z.coerce.boolean().default(true),
    authorization_date: z.coerce.date().optional().nullable(),
    expiration_date: z.coerce.date().optional().nullable(),

    // Product-specific pricing (JSONB)
    special_pricing: specialPricingSchema.optional().nullable(),

    // Territory restrictions (array)
    territory_restrictions: z.array(z.string()).optional().nullable(),
    notes: z.string().optional().nullable(),

    // Audit fields (system-managed)
    created_by: z.coerce.number().int().optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    deleted_at: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.expiration_date && data.authorization_date) {
        return new Date(data.expiration_date) > new Date(data.authorization_date);
      }
      return true;
    },
    { message: "Expiration date must be after authorization date" }
  );

/**
 * Type inference from schema
 */
export type ProductDistributorAuthorization = z.infer<typeof productDistributorAuthorizationSchema>;

/**
 * Input type (before parsing) for form data
 */
export type ProductDistributorAuthorizationInput = z.input<
  typeof productDistributorAuthorizationSchema
>;

/**
 * Extended type with joined names for display
 */
export interface ProductDistributorAuthorizationWithNames extends ProductDistributorAuthorization {
  product_name?: string;
  distributor_name?: string;
  principal_name?: string; // From product's principal
}

/**
 * Create-specific schema (stricter requirements)
 */
export const createProductDistributorAuthorizationSchema = productDistributorAuthorizationSchema
  .innerType()
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  });

/**
 * Update-specific schema (more flexible)
 */
export const updateProductDistributorAuthorizationSchema = productDistributorAuthorizationSchema
  .innerType()
  .partial()
  .required({ id: true });

/**
 * Validation function for React Admin forms
 */
export async function validateProductDistributorAuthorization(data: unknown): Promise<void> {
  const result = productDistributorAuthorizationSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    throw {
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
}
