import { z } from "zod";

/**
 * Sales validation schemas and functions
 * Implements validation rules for salespeople/users
 */

// Main sales schema with comprehensive validation
// This schema serves as the single source of truth for all sales validation
// per Engineering Constitution - all validation happens at API boundary only
export const salesSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email address"),
  phone: z.string().nullish(),
  avatar_url: z.string().url("Must be a valid URL").optional().nullable(),
  user_id: z.string().uuid("Must be a valid UUID").optional(),
  is_admin: z.boolean().default(false),
  disabled: z.boolean().default(false),

  // System fields
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});

// Type inference
export type SalesInput = z.input<typeof salesSchema>;
export type Sales = z.infer<typeof salesSchema>;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where sales validation occurs
export async function validateSalesForm(data: any): Promise<void> {
  try {
    // Parse and validate the data
    salesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      // Throw error in React Admin expected format
      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
export const createSalesSchema = salesSchema
  .omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .required({
    first_name: true,
    last_name: true,
    email: true,
  });

// Update-specific schema (more flexible)
export const updateSalesSchema = salesSchema.partial().required({
  id: true,
});

// Export validation functions for specific operations
export async function validateCreateSales(data: any): Promise<void> {
  try {
    createSalesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

export async function validateUpdateSales(data: any): Promise<void> {
  try {
    updateSalesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}