import { z } from "zod";

/**
 * Organization/Company validation schemas and functions
 * Implements validation rules from CompanyInputs.tsx
 * Note: File named "organizations" to match unifiedDataProvider imports, but uses "Company" in schemas for backward compatibility
 */

// Organization type enum
export const organizationTypeSchema = z.enum([
  "customer",
  "prospect",
  "partner",
  "principal",
  "distributor",
  "unknown",
]);

// Company priority enum
export const companyPrioritySchema = z.enum(["A", "B", "C", "D"]);

// URL validation regex from CompanyInputs
// Protocol (http:// or https://) is REQUIRED for valid URLs
const URL_REGEX =
  /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin.com\//;

// Custom validators
const isValidUrl = z
  .string()
  .refine((url) => !url || URL_REGEX.test(url), {
    message: "Must be a valid URL",
  });

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
  { message: "Must be a valid LinkedIn company URL" },
);

// Main company/organization schema with comprehensive validation
// This schema serves as the single source of truth for all organization validation
// per Engineering Constitution - all validation happens at API boundary only
export const organizationSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Company name is required"),
  logo: z.any().optional().nullable(), // RAFile type
  parent_id: z.union([z.string(), z.number()]).optional().nullable(), // Maps to parent_organization_id in database
  // Updated field names to match database schema
  segment_id: z.string().uuid().optional().nullable(), // was: industry (text field) - optional field, can be null or undefined
  linkedin_url: isLinkedinUrl.nullish(),
  website: isValidUrl.nullish(),
  phone: z.string().nullish(), // was: phone_number
  address: z.string().nullish(),
  postal_code: z.string().nullish(), // was: zipcode
  city: z.string().nullish(),
  state: z.string().nullish(), // was: stateAbbr
  sales_id: z.union([z.string(), z.number()]).nullish(),
  description: z.string().optional().nullable(),
  context_links: z.array(isValidUrl).nullish(),

  // Organization-specific fields
  organization_type: organizationTypeSchema.default("unknown"), // Default matches database
  priority: companyPrioritySchema.default("C"), // Default matches database

  // Computed fields (readonly)
  nb_contacts: z.number().optional(),
  nb_opportunities: z.number().optional(),

  // System fields
  created_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});

// Type inference
export type OrganizationInput = z.input<typeof organizationSchema>;
export type Organization = z.infer<typeof organizationSchema>;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where organization validation occurs
export async function validateOrganizationForSubmission(
  data: any,
): Promise<void> {
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
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
export const createOrganizationSchema = organizationSchema
  .omit({
    id: true,
    created_at: true,
    deleted_at: true,
    nb_contacts: true,
    nb_opportunities: true,
  })
  .required({
    name: true,
  });

// Update-specific schema (more flexible)
export const updateOrganizationSchema = organizationSchema.partial().required({
  id: true,
});

// Export validation functions for specific operations
export async function validateCreateOrganization(data: any): Promise<void> {
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
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

export async function validateUpdateOrganization(data: any): Promise<void> {
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
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

// Alias for form validation (used in tests)
export const validateOrganizationForm = validateOrganizationForSubmission;
