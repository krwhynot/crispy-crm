import { z } from "zod";

/**
 * Contact validation schemas and functions
 * Implements validation rules from ContactInputs.tsx
 */

// Contact role enum
export const contactRoleSchema = z.enum([
  "decision_maker",
  "influencer",
  "buyer",
  "end_user",
  "gatekeeper",
  "champion",
  "technical",
  "executive",
  "unknown",
]);

// Purchase influence enum
export const purchaseInfluenceSchema = z.enum([
  "High",
  "Medium",
  "Low",
  "Unknown",
]);

// Decision authority enum
export const decisionAuthoritySchema = z.enum([
  "Decision Maker",
  "Influencer",
  "End User",
  "Gatekeeper",
]);

// Email and phone type enum
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

// LinkedIn URL validation
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin.com\//;
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

// Email validation helper
const emailSchema = z.string().email("Invalid email address");

// Email and phone sub-schemas
export const emailAndTypeSchema = z.object({
  email: emailSchema,
  type: personalInfoTypeSchema.default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});

// Contact-Organization relationship schema
export const contactOrganizationSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    contact_id: z.union([z.string(), z.number()]).optional(),
    organization_id: z.union([z.string(), z.number()]),
    is_primary_organization: z.boolean().default(false),
    purchase_influence: purchaseInfluenceSchema.default("Unknown"),
    decision_authority: decisionAuthoritySchema.default("End User"),
    role: contactRoleSchema.optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    deleted_at: z.string().optional().nullable(),
  })
  .refine((data) => {
    // Check for removed legacy fields and provide helpful error messages
    if ("is_primary_contact" in data) {
      throw new Error(
        "Field 'is_primary_contact' is no longer supported. Use is_primary_organization in contact_organizations relationship instead.",
      );
    }
    return true;
  });

// Main contact schema
export const contactSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    title: z.string().optional(),
    email: z.array(emailAndTypeSchema).default([]),
    avatar: z.any().optional(), // Partial<RAFile>
    linkedin_url: isLinkedinUrl,
    first_seen: z.string().optional(),
    last_seen: z.string().optional(),
    has_newsletter: z.boolean().default(false),
    tags: z.array(z.union([z.string(), z.number()])).optional(),
    gender: z.string().optional(),
    sales_id: z
      .union([z.string(), z.number()])
      .min(1, "Account manager is required"),
    status: z.string().optional(),
    background: z.string().optional(),
    phone: z.array(phoneNumberAndTypeSchema).default([]),

    // Multi-organization support
    organizations: z.array(contactOrganizationSchema).optional(),
    organization_ids: z.array(z.union([z.string(), z.number()])).optional(),

    // Calculated fields (readonly)
    nb_tasks: z.number().optional(),
    company_name: z.string().optional(),
    total_organizations: z.number().optional(),

    // System fields
    deleted_at: z.string().optional().nullable(),
  })
  .refine((data) => {
    // Check for removed legacy fields and provide helpful error messages
    if ("company_id" in data) {
      throw new Error(
        "Field 'company_id' is no longer supported. Use contact_organizations relationship instead.",
      );
    }
    if ("role" in data) {
      throw new Error(
        "Field 'role' is no longer supported at contact level. Use role in contact_organizations relationship instead.",
      );
    }
    if ("department" in data) {
      throw new Error(
        "Field 'department' is no longer supported at contact level. Define department in contact_organizations relationship instead.",
      );
    }
    if ("is_primary_contact" in data) {
      throw new Error(
        "Field 'is_primary_contact' is no longer supported. Use is_primary_organization in contact_organizations relationship instead.",
      );
    }
    if ("purchase_influence" in data) {
      throw new Error(
        "Field 'purchase_influence' is no longer supported at contact level. Use purchase_influence in contact_organizations relationship instead.",
      );
    }
    if ("decision_authority" in data) {
      throw new Error(
        "Field 'decision_authority' is no longer supported at contact level. Use decision_authority in contact_organizations relationship instead.",
      );
    }
    return true;
  });

// Type inference
export type ContactInput = z.input<typeof contactSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ContactOrganization = z.infer<typeof contactOrganizationSchema>;

// Validation function matching expected signature from unifiedDataProvider
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
      error.errors.forEach((err) => {
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
export const createContactSchema = contactSchema
  .omit({
    id: true,
    first_seen: true,
    last_seen: true,
    deleted_at: true,
    nb_tasks: true,
    company_name: true,
    total_organizations: true,
  })
  .required({
    first_name: true,
    last_name: true,
    sales_id: true,
  });

// Update-specific schema (more flexible)
export const updateContactSchema = contactSchema.partial().required({
  id: true,
});

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
      error.errors.forEach((err) => {
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
      error.errors.forEach((err) => {
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
      error.errors.forEach((err) => {
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
