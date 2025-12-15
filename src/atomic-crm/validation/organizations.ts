import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";

/**
 * Organization validation schemas and functions
 * Implements validation rules from OrganizationInputs.tsx
 */

// Organization type enum - must match database enum and constants.ts
// Valid types: customer, prospect, principal, distributor
export const organizationTypeSchema = z.enum(["customer", "prospect", "principal", "distributor"]);

// Organization priority enum
export const organizationPrioritySchema = z.enum(["A", "B", "C", "D"]);

// Organization scope enum
export const orgScopeSchema = z.enum(['national', 'regional', 'local']);
export type OrgScope = z.infer<typeof orgScopeSchema>;

// Organization status enum
export const orgStatusSchema = z.enum(['active', 'inactive']);
export type OrgStatus = z.infer<typeof orgStatusSchema>;

// Status reason enum
export const orgStatusReasonSchema = z.enum([
  'active_customer',
  'prospect',
  'authorized_distributor',
  'account_closed',
  'out_of_business',
  'disqualified',
]);
export type OrgStatusReason = z.infer<typeof orgStatusReasonSchema>;

// Payment terms enum
export const paymentTermsSchema = z.enum([
  'net_30',
  'net_60',
  'net_90',
  'cod',
  'prepaid',
  '2_10_net_30',
]);
export type PaymentTerms = z.infer<typeof paymentTermsSchema>;

// LinkedIn URL validation - domain-specific regex required
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin.com\//;

// Custom validators
const isValidUrl = z.string().url({ message: "Must be a valid URL" }).or(z.literal(""));

const isLinkedinUrl = z.string().refine(
  (url) => {
    if (!url) return true;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
    } catch {
      return false;
    }
  },
  { message: "Must be a valid LinkedIn organization URL" }
);

// Main organization schema with comprehensive validation
// This schema serves as the single source of truth for all organization validation
// per Engineering Constitution - all validation happens at API boundary only
export const organizationSchema = z.strictObject({
  id: z.coerce.number().optional(),
  name: z.string().min(1, "Organization name is required").max(255, "Organization name too long"),
  logo: z.any().optional().nullable(), // RAFile type
  parent_organization_id: z.coerce.number().optional().nullable(), // Parent organization reference
  // Updated field names to match database schema
  segment_id: z.string().uuid().optional().nullable(), // was: industry (text field) - optional field, can be null or undefined
  linkedin_url: isLinkedinUrl.nullish(),
  website: isValidUrl.nullish(),
  phone: z.string().max(30, "Phone number too long").nullish(), // was: phone_number
  address: z.string().max(500, "Address too long").nullish(),
  postal_code: z.string().max(20, "Postal code too long").nullish(), // was: zipcode
  city: z.string().max(100, "City name too long").nullish(),
  state: z.string().max(100, "State name too long").nullish(), // was: stateAbbr
  sales_id: z.coerce.number().nullish(),
  description: z
    .string()
    .max(5000, "Description too long")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  context_links: z.array(isValidUrl).nullish(),
  tags: z.string().max(1000, "Tags too long").optional(), // Comma-separated tag names for CSV import

  // Business fields (DB columns added for completeness)
  email: z.string().email().nullish(), // Organization contact email
  notes: z
    .string()
    .max(5000, "Notes too long")
    .nullish()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // General notes about organization
  employee_count: z.coerce.number().int().positive().nullish(), // Number of employees
  founded_year: z.coerce.number().int().min(1800).max(new Date().getFullYear()).nullish(), // Year founded
  tax_identifier: z.string().max(50, "Tax identifier too long").nullish(), // Tax ID / EIN
  logo_url: z.string().url().nullish(), // Direct URL to logo (separate from logo RAFile)
  updated_at: z.string().optional(), // System-managed timestamp
  updated_by: z.coerce.number().nullish(), // Audit: who last updated

  // Organization-specific fields
  organization_type: organizationTypeSchema.default("prospect"), // Default for new organizations
  priority: organizationPrioritySchema.default("C"), // Default matches database

  // Computed fields (readonly)
  nb_contacts: z.number().optional(),
  nb_opportunities: z.number().optional(),
  nb_notes: z.number().optional(),

  // Hierarchy fields (Task 12)
  org_scope: orgScopeSchema.nullable().optional(),
  is_operating_entity: z.coerce.boolean().default(true),

  // Status fields (Task 13)
  status: orgStatusSchema.default('active'),
  status_reason: orgStatusReasonSchema.nullable().optional(),

  // Billing Address fields (Task 14)
  billing_street: z.string().max(255).nullable().optional(),
  billing_city: z.string().max(100).nullable().optional(),
  billing_state: z.string().max(2).nullable().optional(),
  billing_postal_code: z.string().max(20).nullable().optional(),
  billing_country: z.string().max(2).default('US'),

  // Shipping Address fields (Task 14)
  shipping_street: z.string().max(255).nullable().optional(),
  shipping_city: z.string().max(100).nullable().optional(),
  shipping_state: z.string().max(2).nullable().optional(),
  shipping_postal_code: z.string().max(20).nullable().optional(),
  shipping_country: z.string().max(2).default('US'),

  // Payment fields (Task 14)
  payment_terms: paymentTermsSchema.nullable().optional(),
  credit_limit: z.coerce.number().nonnegative().nullable().optional(),
  territory: z.string().max(100).nullable().optional(),

  // System/Audit fields
  created_at: z.string().optional(),
  created_by: z.coerce.number().nullish(), // Audit: who created
  deleted_at: z.string().optional().nullable(), // Soft-delete timestamp
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
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
// Omits system-managed fields that are auto-populated by DB triggers
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
  } catch (error) {
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
  } catch (error) {
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
