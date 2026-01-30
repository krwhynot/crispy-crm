import { z } from "zod";
import { VALIDATION_LIMITS } from "./constants";
import { zodErrorToReactAdminError } from "./utils";

/**
 * Sales validation schemas and functions
 * Implements validation rules for salespeople/users
 *
 * CONSOLIDATED: This is the single source of truth for all sales/user validation
 * Previously duplicated in src/atomic-crm/admin/users/schemas.ts (now deprecated)
 */

// =====================================================================
// Role Configuration (UI + Validation)
// =====================================================================

/**
 * User role enum - matches database user_role type
 */
export const UserRoleEnum = z.enum(["admin", "manager", "rep"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

/**
 * Role display configuration for UI (React Admin SelectInput choices)
 */
export const ROLE_CHOICES = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "rep", name: "Rep" },
] as const;

// NOTE: Role badge colors are defined inline in SalesList.tsx and SalesPermissionsTab.tsx
// using semantic tokens (border-primary, border-success, border-muted-foreground)
// Do not add a ROLE_COLORS constant here - keep styling co-located with components

// =====================================================================
// Main Sales Schema
// =====================================================================

// Main sales schema with comprehensive validation
// This schema serves as the single source of truth for all sales validation
// per Engineering Constitution - all validation happens at API boundary only
export const salesSchema = z.strictObject({
  id: z.union([z.string().max(50, "ID too long"), z.number()]).optional(),
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name too long"),
  last_name: z.string().trim().min(1, "Last name is required").max(100, "Last name too long"),
  email: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.EMAIL_MAX, "Email too long")
    .email("Must be a valid email address"),
  phone: z.string().trim().max(VALIDATION_LIMITS.PHONE_MAX, "Phone number too long").nullish(),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .max(VALIDATION_LIMITS.AVATAR_URL_MAX, "Avatar URL too long")
    .optional()
    .nullable(),
  user_id: z.string().uuid("Must be a valid UUID").optional(),

  // Permission fields (role is primary, others are computed/deprecated)
  role: z.enum(["admin", "manager", "rep"]).default("rep"),
  is_admin: z.coerce.boolean().optional(), // Deprecated - synced from role via trigger
  administrator: z.coerce.boolean().optional(), // Computed column - read-only

  disabled: z.coerce.boolean().default(false),

  // Notification preferences
  digest_opt_in: z.coerce.boolean().default(true), // Default true for backward compatibility

  // User preferences
  timezone: z
    .string()
    .regex(/^[A-Za-z]+\/[A-Za-z_]+$/)
    .max(VALIDATION_LIMITS.TIMEZONE_MAX, "Timezone too long")
    .default("America/Chicago"),

  // System fields
  created_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX, "Timestamp too long").optional(),
  updated_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX, "Timestamp too long").optional(),
  deleted_at: z
    .string()
    .max(VALIDATION_LIMITS.TIMESTAMP_MAX, "Timestamp too long")
    .optional()
    .nullable(),
});

// Type inference
export type SalesInput = z.input<typeof salesSchema>;
export type Sales = z.infer<typeof salesSchema>;

// P2 consolidation: Export enum types and aliases
export type SalesRole = z.infer<typeof salesSchema>["role"];

// Alias for backward compatibility with types.ts interface name
export type Sale = Sales;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where sales validation occurs
export async function validateSalesForm(data: unknown): Promise<void> {
  try {
    // Parse and validate the data
    salesSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
// Industry-standard invite flow: Admin enters name/email/role, user sets own password via invite email
export const createSalesSchema = salesSchema
  .omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .extend({
    // Password optional - Edge Function uses Supabase inviteUserByEmail for password setup
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long")
      .optional(),
  })
  .required({
    first_name: true,
    last_name: true,
    email: true,
    // Note: password removed from required - user sets via invite email
  });

// Update-specific schema (more flexible)
export const updateSalesSchema = salesSchema.partial().required({
  id: true,
});

// Export validation functions for specific operations
export async function validateCreateSales(data: unknown): Promise<void> {
  try {
    createSalesSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}

export async function validateUpdateSales(data: unknown): Promise<void> {
  try {
    updateSalesSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}

// =====================================================================
// User Invite Schema (for Settings → Team invite flow)
// =====================================================================

/**
 * Schema for inviting a new user
 * Used by UserInviteForm in the /sales create flow
 * Validation happens at Edge Function (API boundary), NOT in form
 *
 * Industry-standard invite flow: Admin provides name/email/role only
 * User receives invite email and sets their own password
 */
export const userInviteSchema = z.strictObject({
  email: z.string().max(254, "Email too long").email("Invalid email format"),
  // Password optional - Supabase inviteUserByEmail handles password setup
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .optional(),
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name too long"),
  last_name: z.string().trim().min(1, "Last name is required").max(100, "Last name too long"),
  role: UserRoleEnum.default("rep"),
});

export type UserInvite = z.infer<typeof userInviteSchema>;

/**
 * Schema for updating an existing user via sales_id
 * Used by UserSlideOver edit flow (now consolidated into /sales)
 */
export const userUpdateSchema = z.strictObject({
  sales_id: z.coerce.number().int().positive("Invalid sales ID"),
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name too long")
    .optional(),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name too long")
    .optional(),
  role: UserRoleEnum.optional(),
  disabled: z.coerce.boolean().optional(),
});

export type UserUpdate = z.infer<typeof userUpdateSchema>;

// =====================================================================
// Form Default Schemas (per Engineering Constitution #5)
// These provide schema-derived defaults for form state initialization
// =====================================================================

/**
 * Schema for SalesProfileTab form fields
 * Uses .transform() to coerce nullish values to empty strings
 * This is the single source of truth for profile form defaults
 */
export const salesProfileSchema = z.strictObject({
  first_name: z
    .string()
    .max(100)
    .nullish()
    .transform((v) => v ?? ""),
  last_name: z
    .string()
    .max(100)
    .nullish()
    .transform((v) => v ?? ""),
  email: z
    .string()
    .max(254)
    .nullish()
    .transform((v) => v ?? ""),
  phone: z
    .string()
    .max(50)
    .nullish()
    .transform((v) => v ?? ""),
  avatar_url: z
    .string()
    .max(VALIDATION_LIMITS.AVATAR_URL_MAX)
    .nullish()
    .transform((v) => v ?? ""),
});

export type SalesProfileFormData = z.infer<typeof salesProfileSchema>;

/**
 * Schema for SalesPermissionsTab form fields
 * Uses schema defaults for role and disabled status
 * This is the single source of truth for permissions form defaults
 */
export const salesPermissionsSchema = z.strictObject({
  role: UserRoleEnum.default("rep"),
  disabled: z.coerce.boolean().default(false),
});

export type SalesPermissionsFormData = z.infer<typeof salesPermissionsSchema>;
