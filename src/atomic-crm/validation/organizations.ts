import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";
import { optionalRaFileSchema } from "./shared/ra-file";

/**
 * Organization validation schemas and functions
 * Implements validation rules from OrganizationInputs.tsx
 */

// Organization type enum - must match database enum and constants.ts
// Valid types: customer, prospect, principal, distributor
export const organizationTypeSchema = z.enum([
  "prospect", // Most common (80% of new orgs) - show first in dropdown
  "customer",
  "principal",
  "distributor",
]);

// Organization priority enum
export const organizationPrioritySchema = z.enum(["A", "B", "C", "D"]);

// Organization scope enum
export const orgScopeSchema = z.enum(["national", "regional", "local"]);
export type OrgScope = z.infer<typeof orgScopeSchema>;

// Organization status enum
export const orgStatusSchema = z.enum(["active", "inactive"]);
export type OrgStatus = z.infer<typeof orgStatusSchema>;

// Status reason enum
export const orgStatusReasonSchema = z.enum([
  "active_customer",
  "prospect",
  "authorized_distributor",
  "account_closed",
  "out_of_business",
  "disqualified",
]);
export type OrgStatusReason = z.infer<typeof orgStatusReasonSchema>;

// Payment terms enum
export const paymentTermsSchema = z.enum([
  "net_30",
  "net_60",
  "net_90",
  "cod",
  "prepaid",
  "2_10_net_30",
]);
export type PaymentTerms = z.infer<typeof paymentTermsSchema>;

/**
 * URL auto-prefix transform
 * Automatically adds https:// to URLs that don't have a protocol.
 * This prevents the false positive where client shows ✓ but server rejects.
 *
 * Example: "linkedin.com/company/test" → "https://linkedin.com/company/test"
 */
const urlAutoPrefix = (val: string | null | undefined): string => {
  if (!val) return val ?? "";
  const trimmed = val.trim();
  if (!trimmed) return "";
  // Only add protocol if the value doesn't already have one
  if (trimmed && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

// Custom validators with auto-prefix transform
// Note: Zod's .url() validates RFC 3986 syntax only - "https://invalid" is valid per spec.
// We add TLD check (hostname must contain ".") for real-world URL validation.
const isValidUrl = z
  .string()
  .transform(urlAutoPrefix)
  .pipe(
    z
      .string()
      .refine(
        (url) => {
          if (!url) return true;
          try {
            const hostname = new URL(url).hostname;
            return hostname.includes("."); // TLD requires at least one dot
          } catch {
            return false;
          }
        },
        { message: "Must be a valid URL (e.g., example.com)" }
      )
      .max(2048)
      .or(z.literal(""))
  );

const isLinkedinUrl = z
  .string()
  .max(2048, "URL too long")
  .transform(urlAutoPrefix)
  .pipe(
    z.string().refine(
      (url) => {
        if (!url) return true;
        try {
          const hostname = new URL(url).hostname;
          return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
        } catch {
          return false;
        }
      },
      { message: "Must be a LinkedIn URL (linkedin.com)" }
    )
  );

// Main organization schema with comprehensive validation
// This schema serves as the single source of truth for all organization validation
// per Engineering Constitution - all validation happens at API boundary only
export const organizationSchema = z.strictObject({
  id: z.coerce.number().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(255, "Organization name too long"),
  logo: optionalRaFileSchema,
  parent_organization_id: z.coerce.number().optional().nullable(), // Parent organization reference
  // Updated field names to match database schema
  segment_id: z.string().uuid().optional().nullable(), // was: industry (text field) - optional field, can be null or undefined
  linkedin_url: isLinkedinUrl.nullish(),
  website: isValidUrl.nullish(),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number too long")
    .refine((val) => !val || val.replace(/\D/g, "").length >= 10, {
      message: "Phone must have at least 10 digits",
    })
    .nullish(), // was: phone_number
  address: z.string().trim().max(500, "Address too long").nullish(),
  postal_code: z
    .string()
    .trim()
    .max(20, "Postal code too long")
    .refine((val) => !val || /^\d{5}(-\d{4})?$/.test(val), {
      message: "Invalid ZIP code (use 12345 or 12345-6789)",
    })
    .nullish(), // was: zipcode
  city: z.string().trim().max(100, "City name too long").nullish(),
  state: z.string().trim().max(100, "State name too long").nullish(), // was: stateAbbr
  sales_id: z.coerce.number().nullish(),
  description: z
    .string()
    .trim()
    .max(5000, "Description too long")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  context_links: z.array(isValidUrl).max(20, "Maximum 20 context links").nullish(),
  tags: z.string().trim().max(1000, "Tags too long").optional(), // Comma-separated tag names for CSV import

  // Business fields (DB columns added for completeness)
  email: z.string().email().max(254, "Email too long").nullish(), // Organization contact email
  notes: z
    .string()
    .trim()
    .max(5000, "Notes too long")
    .nullish()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // General notes about organization
  employee_count: z.coerce.number().int().positive().nullish(), // Number of employees
  founded_year: z.coerce.number().int().min(1800).max(new Date().getFullYear()).nullish(), // Year founded
  tax_identifier: z.string().trim().max(50, "Tax identifier too long").nullish(), // Tax ID / EIN
  logo_url: z.string().url().max(2048, "URL too long").nullish(), // Direct URL to logo (separate from logo RAFile)
  updated_at: z.string().max(50).optional(), // System-managed timestamp
  updated_by: z.coerce.number().nullish(), // Audit: who last updated

  // Organization-specific fields
  organization_type: organizationTypeSchema, // Required - no silent default
  priority: organizationPrioritySchema, // Required - no silent default

  // Computed fields (readonly)
  nb_contacts: z.number().optional(),
  nb_opportunities: z.number().optional(),
  nb_notes: z.number().optional(),

  // Hierarchy fields (Task 12)
  org_scope: orgScopeSchema.nullable().optional(),
  is_operating_entity: z.coerce.boolean().default(true),

  // Status fields (Task 13)
  status: orgStatusSchema, // Required - no silent default
  status_reason: orgStatusReasonSchema.nullable().optional(),

  // Billing Address fields (Task 14)
  billing_street: z.string().trim().max(255).nullable().optional(),
  billing_city: z.string().trim().max(100).nullable().optional(),
  billing_state: z.string().trim().max(2).nullable().optional(),
  billing_postal_code: z.string().trim().max(20).nullable().optional(),
  billing_country: z.string().trim().max(2).default("US"),

  // Shipping Address fields (Task 14)
  shipping_street: z.string().trim().max(255).nullable().optional(),
  shipping_city: z.string().trim().max(100).nullable().optional(),
  shipping_state: z.string().trim().max(2).nullable().optional(),
  shipping_postal_code: z.string().trim().max(20).nullable().optional(),
  shipping_country: z.string().trim().max(2).default("US"),

  // Payment fields (Task 14)
  payment_terms: paymentTermsSchema.nullable().optional(),
  credit_limit: z.coerce.number().nonnegative().nullable().optional(),
  territory: z.string().trim().max(100).nullable().optional(),

  // System/Audit fields
  created_at: z.string().max(50).optional(),
  created_by: z.coerce.number().nullish(), // Audit: who created
  deleted_at: z.string().max(50).optional().nullable(), // Soft-delete timestamp

  // Database columns discovered during SlideOver save debugging
  // These fields exist in the organizations table but were missing from schema
  import_session_id: z.string().uuid().nullable().optional(), // Tracks import batch
  playbook_category_id: z.string().uuid().nullable().optional(), // References playbook_categories
  cuisine: z.string().trim().max(100).nullable().optional(), // Restaurant cuisine type
  needs_review: z.coerce.boolean().default(false), // Data quality flag
  sector: z.string().trim().max(100).nullable().optional(), // Industry sector
});

// Type inference
export type OrganizationInput = z.input<typeof organizationSchema>;
export type Organization = z.infer<typeof organizationSchema>;

// Enum type exports (P1 consolidation - single source of truth)
export type OrganizationType = z.infer<typeof organizationTypeSchema>;
export type OrganizationPriority = z.infer<typeof organizationPrioritySchema>;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where organization validation occurs
export async function validateOrganizationForSubmission(data: unknown): Promise<void> {
  try {
    // Parse and validate the data
    organizationSchema.parse(data);
  } catch (error: unknown) {
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
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
// Omits system-managed fields that are auto-populated by DB triggers
// Uses .extend() to override nullish/default fields as truly required
// per plan: Organization Form requires 4 fields: name, organization_type, sales_id, segment_id
export const createOrganizationSchema = organizationSchema
  .omit({
    id: true,
    created_at: true,
    created_by: true, // Auto-set by trigger
    updated_at: true, // Auto-set by trigger
    updated_by: true, // Auto-set by trigger
    deleted_at: true,
    nb_contacts: true, // Computed field
    nb_opportunities: true, // Computed field
    nb_notes: true, // Computed field
  })
  .extend({
    // Override with non-nullable, no-default versions
    // .required() doesn't remove .nullable() from .nullish() fields, so we redefine them
    organization_type: organizationTypeSchema, // Remove .default("prospect") - must be explicitly selected
    sales_id: z.coerce.number(), // Remove .nullish() - Account Manager required
    segment_id: z.string().uuid(), // Remove .optional().nullable() - Segment required
  })
  .required({
    name: true,
  });

// Update-specific schema (more flexible)
export const updateOrganizationSchema = organizationSchema.partial().required({
  id: true,
});

// Export validation functions for specific operations
export async function validateCreateOrganization(data: unknown): Promise<void> {
  try {
    createOrganizationSchema.parse(data);
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

export async function validateUpdateOrganization(data: unknown): Promise<void> {
  try {
    updateOrganizationSchema.parse(data);
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

// Alias for form validation (used in tests)
export const validateOrganizationForm = validateOrganizationForSubmission;

/**
 * Form-level validation for QuickCreatePopover (Organizations)
 * Uses simple types matching form inputs for react-hook-form validation.
 */
export const organizationQuickCreateSchema = z.strictObject({
  name: z.string().trim().min(1, "Name required").max(255),
  organization_type: organizationTypeSchema,
  // Note: priority is required in the schema, default provided in form's defaultValues
  priority: organizationPrioritySchema,
  segment_id: z.string().uuid(), // Required: defaults to "Unknown" via form defaultValues
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
});

export type OrganizationQuickCreateInput = z.infer<typeof organizationQuickCreateSchema>;
