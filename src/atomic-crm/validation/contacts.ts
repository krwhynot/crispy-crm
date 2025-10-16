import { z } from "zod";

/**
 * Contact validation schemas and functions
 * Implements validation rules from ContactInputs.tsx
 */

// Email and phone type enum
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

// LinkedIn URL validation
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;
const isLinkedinUrl = z
  .string()
  .refine(
    (url) => {
      if (!url) return true;
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
      } catch {
        return false;
      }
    },
    { message: "URL must be from linkedin.com" },
  )
  .optional()
  .nullable();

// Email and phone sub-schemas for JSONB arrays
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});

// Helper schemas for backward compatibility with tests
// These schemas handle the old object-based email/phone format
export const phoneNumberSchema = z.record(z.string()).optional();
export const emailSchema = z.record(z.string()).optional();
export const contactStatusSchema = z.enum(["active", "inactive", "blocked", "pending"]);

// Contact-Organization relationship schema
export const contactOrganizationSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    contact_id: z.union([z.string(), z.number()]).optional(),
    organization_id: z.union([z.string(), z.number()]).optional(),
    is_primary: z.boolean().default(false),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    deleted_at: z.string().optional().nullable(),
  })
  .refine((data) => {
    // Check for removed legacy fields and provide helpful error messages
    if ("is_primary_contact" in data) {
      throw new Error(
        "Field 'is_primary_contact' is no longer supported. Use is_primary in contact_organizations relationship instead.",
      );
    }
    return true;
  });

// Base contact schema without transformations
const contactBaseSchema = z.object({
  // Primary key
  id: z.union([z.string(), z.number()]).optional(),

  // Name fields (name is required, first/last are optional)
  name: z.string().optional(), // Computed from first + last
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),

  // Contact information - JSONB fields in DB
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),

  // Professional information
  title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),

  // Address fields
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable().default("USA"),

  // Personal information
  birthday: z.string().optional().nullable(), // Date field
  gender: z.string().optional().nullable(),

  // Social media
  linkedin_url: isLinkedinUrl,
  twitter_handle: z.string().optional().nullable(),

  // Additional fields
  notes: z.string().optional().nullable(),
  tags: z.array(z.union([z.string(), z.number()])).optional().default([]),

  // Relationships
  sales_id: z.union([z.string(), z.number()]).optional().nullable(),
  organization_id: z.union([z.string(), z.number()]).optional().nullable(),

  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.union([z.string(), z.number()]).optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  first_seen: z.string().optional(),
  last_seen: z.string().optional(),

  // Search (readonly)
  search_tsv: z.any().optional(),

  // Legacy/test fields that might be in tests but not in DB
  middle_name: z.string().optional().nullable(),
  status: z.string().optional().default("active"),
  background: z.string().optional().nullable(),
  has_newsletter: z.boolean().optional().default(false),
  avatar: z.any().optional(), // Partial<RAFile>

  // Support for old test format - email/phone as objects
  email_object: z.record(z.string()).optional(),
  phone_number: z.record(z.string()).optional(),

  // Many-to-many organization support (for tests)
  organization_ids: z.array(z.union([z.string(), z.number()])).optional(),
  primary_organization_id: z.union([z.string(), z.number()]).optional().nullable(),

  // Calculated fields (readonly)
  nb_tasks: z.number().optional(),
  company_name: z.string().optional().nullable(),
});

// Helper function to transform data
function transformContactData(data: any) {
  // Transform legacy email object format to array format
  if (data.email_object && typeof data.email_object === 'object' && !Array.isArray(data.email)) {
    const emailArray = Object.entries(data.email_object).map(([type, email]) => ({
      email: email as string,
      type: type === 'primary' || type === 'work' ? 'Work' :
            type === 'personal' ? 'Home' : 'Other' as "Work" | "Home" | "Other"
    }));
    data.email = emailArray;
  }

  // Transform legacy phone object format to array format
  if (data.phone_number && typeof data.phone_number === 'object' && !Array.isArray(data.phone)) {
    const phoneArray = Object.entries(data.phone_number).map(([type, number]) => ({
      number: number as string,
      type: type === 'mobile' || type === 'office' ? 'Work' :
            type === 'home' ? 'Home' : 'Other' as "Work" | "Home" | "Other"
    }));
    data.phone = phoneArray;
  }

  // Compute name from first + last if not provided
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';
  }

  // Ensure first_name and last_name are set if name is provided but they aren't
  if (data.name && !data.first_name && !data.last_name) {
    const parts = data.name.split(' ');
    if (parts.length >= 2) {
      data.first_name = parts[0];
      data.last_name = parts.slice(1).join(' ');
    } else {
      data.first_name = data.name;
      data.last_name = '';
    }
  }

  return data;
}

// Main contact schema with comprehensive validation
// This schema serves as the single source of truth for all contact validation
// per Engineering Constitution - all validation happens at API boundary only
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Validate that at least name or first_name/last_name is provided
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Either name or first_name/last_name must be provided",
      });
    }

    // Contact-level email validation
    if (data.email && Array.isArray(data.email)) {
      const emailValidator = z.string().email("Invalid email address");
      data.email.forEach((entry: any, index: number) => {
        if (entry.email && !emailValidator.safeParse(entry.email).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email", index, "email"],
            message: "Must be a valid email address",
          });
        }
      });
    }
  });

// Type inference
export type ContactInput = z.input<typeof contactSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ContactOrganization = z.infer<typeof contactOrganizationSchema>;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where contact validation occurs
export async function validateContactForm(data: any): Promise<void> {
  try {
    // Ensure at least one email is provided if email exists
    if (data.email && Array.isArray(data.email) && data.email.length > 0) {
      // Validate each email entry
      data.email.forEach((entry: any, index: number) => {
        if (!entry.email || entry.email.trim() === "") {
          throw new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              message: "Email address is required",
              path: ["email", index, "email"],
            },
          ]);
        }
      });
    }

    // Parse and validate the data
    contactSchema.parse(data);
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
export const createContactSchema = contactBaseSchema
  .omit({
    id: true,
    first_seen: true,
    last_seen: true,
    deleted_at: true,
    nb_tasks: true,
    company_name: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    search_tsv: true,
  })
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // For creation, we need at least first_name and last_name OR name
    if (!data.name && (!data.first_name || !data.last_name)) {
      if (!data.first_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["first_name"],
          message: "First name is required",
        });
      }
      if (!data.last_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["last_name"],
          message: "Last name is required",
        });
      }
    }

    // Sales ID is required for creation
    if (!data.sales_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sales_id"],
        message: "Account manager is required",
      });
    }
  });

// Update-specific schema (more flexible)
// ID is passed in params.id by React Admin, not in data
export const updateContactSchema = contactBaseSchema
  .partial()
  .transform(transformContactData);

// Export validation functions for specific operations
export async function validateCreateContact(data: any): Promise<void> {
  try {
    // Ensure at least one email is provided for new contacts
    if (!data.email || !Array.isArray(data.email) || data.email.length === 0) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: "At least one email address is required",
          path: ["email"],
        },
      ]);
    }

    createContactSchema.parse(data);
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

export async function validateUpdateContact(data: any): Promise<void> {
  try {
    updateContactSchema.parse(data);
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

// Validation for contact-organization relationships
export async function validateContactOrganization(data: any): Promise<void> {
  try {
    contactOrganizationSchema.parse(data);
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