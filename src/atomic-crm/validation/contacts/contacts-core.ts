import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";
import { emailAndTypeSchema, phoneNumberAndTypeSchema, EmailEntry } from "./contacts-communication";
import { contactDepartmentSchema } from "./contacts-department";
import { quickCreateContactSchema } from "./contacts-quick-create";
import { optionalRaFileSchema } from "../shared/ra-file";

/**
 * Core contact validation schemas and functions
 * Implements validation rules from ContactInputs.tsx
 */

// LinkedIn URL validation
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;
const isLinkedinUrl = z
  .string()
  .max(2048, "URL too long")
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
    { message: "URL must be from linkedin.com" }
  )
  .optional()
  .nullable();

// Base contact schema - validates only fields that have UI inputs in ContactInputs.tsx
// Per "UI as source of truth" principle: we only validate what users can actually input
// EXPORTED: Enables form default generation via contactBaseSchema.partial().parse({})
// per Engineering Constitution #5: FORM STATE DERIVED FROM TRUTH
export const contactBaseSchema = z.strictObject({
  // Primary key
  id: z.coerce.number().optional(),

  // Name fields - ContactIdentityInputs (required in UI)
  name: z.string().trim().max(255, "Name too long").optional(), // Computed from first + last
  first_name: z.string().trim().max(100, "First name too long").optional().nullable(),
  last_name: z.string().trim().max(100, "Last name too long").optional().nullable(),

  // Contact information - ContactPersonalInformationInputs
  // JSONB arrays in database: email and phone
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),

  // Professional information - ContactPositionInputs
  title: z.string().trim().max(100, "Title too long").optional().nullable(),
  department: z.string().trim().max(100, "Department too long").optional().nullable(),
  department_type: contactDepartmentSchema.nullable().optional(),

  // Social media - ContactMiscInputs
  linkedin_url: isLinkedinUrl,

  // Relationships - ContactPositionInputs
  sales_id: z.coerce.number().nullish(),
  // Manager relationship - BIGINT FK for manager hierarchy
  manager_id: z.coerce.number().nullable().optional(),
  // REQUIRED: Contacts must belong to an organization (no orphans)
  // See migration 20251129030358_contact_organization_id_not_null.sql
  // Note: Base schema accepts undefined for form defaults via .partial().parse({})
  // Create/Update schemas enforce requirement via superRefine
  organization_id: z.coerce.number().nullable().optional(),

  // Territory assignment fields
  district_code: z.string().trim().max(10, "District code too long").nullable().optional(),
  territory_name: z.string().trim().max(100, "Territory name too long").nullable().optional(),

  // System fields (readonly, not validated)
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  created_by: z.coerce.number().optional().nullable(),
  deleted_at: z.string().max(50).optional().nullable(),
  first_seen: z.string().max(50).optional(),
  last_seen: z.string().max(50).optional(),

  // Avatar field (managed by ImageEditorField)
  avatar: optionalRaFileSchema,

  // Calculated/readonly fields (not user input)
  nb_tasks: z.number().optional(),
  company_name: z.string().max(255, "Company name too long").optional().nullable(),

  // Notes field - text field for additional contact information
  notes: z
    .string()
    .trim()
    .max(5000, "Notes too long")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),

  // Address fields - exist in DB, may not have UI inputs yet
  address: z.string().trim().max(500, "Address too long").optional().nullable(),
  city: z.string().trim().max(100, "City too long").optional().nullable(),
  state: z.string().trim().max(100, "State too long").optional().nullable(),
  postal_code: z.string().trim().max(20, "Postal code too long").optional().nullable(),
  country: z.string().trim().max(100, "Country too long").optional().nullable(),

  // Personal info fields - exist in DB
  birthday: z.coerce.date().optional().nullable(),
  gender: z.string().trim().max(50, "Gender too long").optional().nullable(),
  twitter_handle: z.string().trim().max(100, "Twitter handle too long").optional().nullable(),

  // Classification fields - exist in DB
  tags: z.array(z.string().trim().max(100)).default([]),
  status: z.string().trim().max(50, "Status too long").optional().nullable(),

  // System fields (readonly, set by triggers)
  updated_by: z.coerce.number().optional().nullable(),

  // Computed fields from views/joins (readonly, not written to DB)
  nb_notes: z.number().optional(),
  nb_activities: z.number().optional(),
});

// Helper function to transform data
function transformContactData(data: Record<string, unknown>) {
  // Compute name from first + last if not provided
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown";
  }

  // Ensure first_name and last_name are set if name is provided but they aren't
  if (data.name && !data.first_name && !data.last_name) {
    const parts = data.name.split(" ");
    if (parts.length >= 2) {
      data.first_name = parts[0];
      data.last_name = parts.slice(1).join(" ");
    } else {
      data.first_name = data.name;
      data.last_name = "";
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
      data.email.forEach((entry: EmailEntry, index: number) => {
        if (entry.value && !emailValidator.safeParse(entry.value).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email", index, "value"],
            message: "Must be a valid email address",
          });
        }
      });
    }

    // Prevent self-manager circular reference (defense in depth)
    if (data.manager_id && data.id && data.manager_id === data.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contact cannot be their own manager",
        path: ["manager_id"],
      });
    }
  });

// Type inference
export type ContactInput = z.input<typeof contactSchema>;
export type Contact = z.infer<typeof contactSchema>;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where contact validation occurs
export async function validateContactForm(data: unknown): Promise<void> {
  const rawData = data as Record<string, unknown>;

  // Quick create path - reduced but secure validation
  if (rawData.quickCreate === true) {
    try {
      quickCreateContactSchema.parse(rawData);
      return; // Valid quick create
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          formattedErrors[err.path.join(".")] = err.message;
        });
        throw { message: "Validation failed", body: { errors: formattedErrors } };
      }
      throw error;
    }
  }

  // Create a schema that includes the email entry validation
  const formSchema = contactBaseSchema.transform(transformContactData).superRefine((data, ctx) => {
    // Reject whitespace-only first_name (after .trim() in schema, becomes empty string)
    if (typeof data.first_name === "string" && data.first_name === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_name"],
        message: "First name is required",
      });
    }

    // Reject whitespace-only last_name (after .trim() in schema, becomes empty string)
    if (typeof data.last_name === "string" && data.last_name === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last_name"],
        message: "Last name is required",
      });
    }

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
      data.email.forEach((entry: EmailEntry, index: number) => {
        if (entry.value && !emailValidator.safeParse(entry.value).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email", index, "value"],
            message: "Must be a valid email address",
          });
        }
      });
    }

    // Ensure at least one email is provided if email exists
    if (data.email && Array.isArray(data.email) && data.email.length > 0) {
      // Validate each email entry
      (data.email as EmailEntry[]).forEach((entry: EmailEntry, index: number) => {
        if (!entry.value || entry.value.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Email address is required",
            path: ["email", index, "value"],
          });
        }
      });
    }

    // Prevent self-manager circular reference (defense in depth)
    if (data.manager_id && data.id && data.manager_id === data.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contact cannot be their own manager",
        path: ["manager_id"],
      });
    }
  });

  try {
    // Parse and validate the data
    formSchema.parse(data);
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
  })
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Reject whitespace-only first_name (after .trim() in schema, becomes empty string)
    // Must check BEFORE the name computation fallback logic
    if (typeof data.first_name === "string" && data.first_name === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_name"],
        message: "First name is required",
      });
    }

    // Reject whitespace-only last_name (after .trim() in schema, becomes empty string)
    if (typeof data.last_name === "string" && data.last_name === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last_name"],
        message: "Last name is required",
      });
    }

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

    // Organization ID is required for creation (no orphan contacts)
    // See PRD: "Contact requires organization" business rule
    if (!data.organization_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organization_id"],
        message: "Organization is required - contacts cannot exist without an organization",
      });
    }
  });

// Update-specific schema (more flexible)
// ID is passed in params.id by React Admin, not in data
export const updateContactSchema = contactBaseSchema.partial().transform(transformContactData);

// Export validation functions for specific operations
export async function validateCreateContact(data: unknown): Promise<void> {
  // Check if this is a quick create request (validation bypass for "Just use name" flow)
  const isQuickCreate =
    typeof data === "object" &&
    data !== null &&
    "quickCreate" in data &&
    (data as Record<string, unknown>).quickCreate === true;

  // Create a schema that includes the email requirement validation
  const createSchemaWithEmail = contactBaseSchema
    .extend({
      // Add quickCreate flag - not stored in DB, only for validation bypass
      quickCreate: z.boolean().optional(),
    })
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
    })
    .transform(transformContactData)
    .superRefine((data, ctx) => {
      // Reject whitespace-only first_name (after .trim() in schema, becomes empty string)
      // Must check BEFORE the name computation fallback logic
      if (typeof data.first_name === "string" && data.first_name === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["first_name"],
          message: "First name is required",
        });
      }

      // Reject whitespace-only last_name (after .trim() in schema, becomes empty string)
      // Only for non-quick-create (quick create allows empty last_name)
      if (!isQuickCreate && typeof data.last_name === "string" && data.last_name === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["last_name"],
          message: "Last name is required",
        });
      }

      // For quick create, only require first_name
      // For regular creation, require first_name and last_name OR name
      if (!isQuickCreate) {
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
      } else {
        // Quick create only requires first_name
        if (!data.first_name) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["first_name"],
            message: "First name is required",
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

      // Organization ID is required for creation (no orphan contacts)
      // See PRD: "Contact requires organization" business rule
      if (!data.organization_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organization_id"],
          message: "Organization is required - contacts cannot exist without an organization",
        });
      }

      // Ensure at least one email is provided for new contacts (skip for quick create)
      if (!isQuickCreate) {
        if (!data.email || !Array.isArray(data.email) || data.email.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one email address is required",
            path: ["email"],
          });
        }
      }
    });

  try {
    createSchemaWithEmail.parse(data);
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

export async function validateUpdateContact(data: unknown): Promise<void> {
  try {
    updateContactSchema.parse(data);
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
