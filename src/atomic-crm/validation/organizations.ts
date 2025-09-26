import { z } from 'zod';

/**
 * Organization/Company validation schemas and functions
 * Implements validation rules from CompanyInputs.tsx
 * Note: File named "organizations" to match unifiedDataProvider imports, but uses "Company" in schemas for backward compatibility
 */

// Organization type enum
export const organizationTypeSchema = z.enum([
  'customer',
  'prospect',
  'vendor',
  'partner',
  'principal',
  'distributor',
  'unknown'
]);

// Company priority enum
export const companyPrioritySchema = z.enum(['A', 'B', 'C', 'D']);

// Company size values
export const companySizeSchema = z.union([
  z.literal(1),
  z.literal(10),
  z.literal(50),
  z.literal(250),
  z.literal(500)
]);

// URL validation regex from CompanyInputs
const URL_REGEX = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin.com\//;

// Custom validators
const isValidUrl = z.string().refine(
  (url) => !url || URL_REGEX.test(url),
  { message: 'Must be a valid URL' }
);

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
  { message: 'URL must be from linkedin.com' }
);

// Main company/organization schema
export const organizationSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, 'Company name is required'),
  logo: z.any().optional(), // RAFile type
  sector: z.string().optional(),
  size: companySizeSchema.optional(),
  linkedin_url: isLinkedinUrl.optional(),
  website: isValidUrl.optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
  city: z.string().optional(),
  stateAbbr: z.string().optional(),
  country: z.string().optional(),
  sales_id: z.union([z.string(), z.number()]).optional(),
  description: z.string().optional(),
  revenue: z.string().optional(),
  tax_identifier: z.string().optional(),
  context_links: z.array(isValidUrl).optional(),

  // Organization-specific fields
  organization_type: organizationTypeSchema.optional(),
  is_principal: z.boolean().optional(),
  is_distributor: z.boolean().optional(),
  parent_company_id: z.union([z.string(), z.number()]).optional().nullable(),
  segment: z.string().optional(),
  priority: companyPrioritySchema.optional(),

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
export async function validateOrganizationForSubmission(data: any): Promise<void> {
  try {
    // Parse and validate the data
    organizationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });

      // Throw error in React Admin expected format
      throw {
        message: 'Validation failed',
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
export const createOrganizationSchema = organizationSchema.omit({
  id: true,
  created_at: true,
  deleted_at: true,
  nb_contacts: true,
  nb_opportunities: true,
}).required({
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
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      throw {
        message: 'Validation failed',
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
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      throw {
        message: 'Validation failed',
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

