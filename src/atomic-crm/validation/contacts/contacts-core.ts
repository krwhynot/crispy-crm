import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";
import type { EmailEntry } from "./contacts-communication";
import { emailAndTypeSchema, phoneNumberAndTypeSchema } from "./contacts-communication";
import { contactDepartmentSchema } from "./contacts-department";
import { quickCreateContactSchema } from "./contacts-quick-create";
import { optionalRaFileSchema } from "../shared/ra-file";
import { zodErrorToReactAdminError } from "../utils";

/**
 * Core contact validation schemas and functions
 * Implements validation rules from ContactInputs.tsx
 */

/**
 * Filter out empty email/phone entries that React Admin's SimpleFormIterator creates.
 * When a user adds a row but leaves it empty, RA sends { value: "", type: "" }.
 * This filter removes such empty entries BEFORE Zod validation runs.
 *
 * Per Engineering Constitution: validation at API boundary, not form layer.
 * The provider should handle bad data defensively.
 */
function filterEmptyArrayEntries(data: Record<string, unknown>): Record<string, unknown> {
  const filtered = { ...data };

  if (Array.isArray(filtered.email)) {
    filtered.email = filtered.email.filter(
      (entry: unknown) =>
        entry &&
        typeof entry === "object" &&
        "value" in entry &&
        entry.value &&
        String(entry.value).trim() !== ""
    );
  }

  if (Array.isArray(filtered.phone)) {
    filtered.phone = filtered.phone.filter(
      (entry: unknown) =>
        entry &&
        typeof entry === "object" &&
        "value" in entry &&
        entry.value &&
        String(entry.value).trim() !== ""
    );
  }

  return filtered;
}

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
  name: z.string().trim().max(255).optional(), // Computed from first + last
  first_name: z.string().trim().max(100).optional().nullable(),
  last_name: z.string().trim().max(100).optional().nullable(),

  // Contact information - ContactPersonalInformationInputs
  // JSONB arrays in database: email and phone
  email: z.array(emailAndTypeSchema).max(10, "Maximum 10 email addresses").default([]),
  phone: z.array(phoneNumberAndTypeSchema).max(10, "Maximum 10 phone numbers").default([]),

  // Professional information - ContactPositionInputs
  title: z.string().trim().max(100).optional().nullable(),
  department: z.string().trim().max(100).optional().nullable(),
  department_type: contactDepartmentSchema.nullable().optional(),

  // Social media - ContactMiscInputs
  linkedin_url: isLinkedinUrl,

  // Relationships - ContactPositionInputs
  sales_id: z.coerce.number().nullish(),
  secondary_sales_id: z.coerce.number().nullish(),
  // Manager relationship - BIGINT FK for manager hierarchy
  manager_id: z.coerce.number().nullable().optional(),
  // REQUIRED: Contacts must belong to an organization (no orphans)
  // See migration 20251129030358_contact_organization_id_not_null.sql
  // Note: Base schema accepts undefined for form defaults via .partial().parse({})
  // Create/Update schemas enforce requirement via superRefine
  organization_id: z.coerce.number().nullable().optional(),

  // Territory assignment fields
  district_code: z.string().trim().max(10).nullable().optional(),
  territory_name: z.string().trim().max(100).nullable().optional(),

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
  company_name: z.string().max(255).optional().nullable(),

  // Notes field - text field for additional contact information
  notes: z
    .string()
    .trim()
    .max(5000, "Notes too long")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),

  // Address fields - exist in DB, may not have UI inputs yet
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  postal_code: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),

  // Personal info fields - exist in DB
  birthday: z.coerce.date().optional().nullable(),
  gender: z.string().trim().max(50).optional().nullable(),
  twitter_handle: z.string().trim().max(100).optional().nullable(),

  // Classification fields - exist in DB
  // FIX [EDIT-001]: tags are BIGINT[] foreign keys to tags table (not strings)
  // TagsListEdit.tsx confirms: record.tags.includes(tag.id) where tag.id is number
  tags: z.array(z.coerce.number()).max(50, "Maximum 50 tags").default([]),
  status: z.string().trim().max(50).optional().nullable(),

  // System fields (readonly, set by triggers)
  updated_by: z.coerce.number().optional().nullable(),

  // Computed fields from views/joins (readonly, not written to DB)
  nb_notes: z.number().optional(),
  nb_activities: z.number().optional(),

  // PostgreSQL tsvector - auto-generated, not user-editable
  // Required to pass strictObject validation when getOne returns base table record
  // FIX [EDIT-001]: Matches pattern from opportunities-core.ts (opportunityBaseSchema)
  search_tsv: z.unknown().optional(),
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

    // Prevent same person as both primary and secondary manager (defense in depth)
    if (data.sales_id && data.secondary_sales_id && data.sales_id === data.secondary_sales_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary and secondary account managers must be different",
        path: ["secondary_sales_id"],
      });
    }
  });

// Type inference
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
        throw zodErrorToReactAdminError(error);
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

    // Prevent same person as both primary and secondary manager (defense in depth)
    if (data.sales_id && data.secondary_sales_id && data.sales_id === data.secondary_sales_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary and secondary account managers must be different",
        path: ["secondary_sales_id"],
      });
    }
  });

  try {
    // Filter out empty email/phone entries before validation
    const filteredData = filterEmptyArrayEntries(data as Record<string, unknown>);
    // Parse and validate the data
    formSchema.parse(filteredData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
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

      // Prevent same person as both primary and secondary manager (defense in depth)
      if (data.sales_id && data.secondary_sales_id && data.sales_id === data.secondary_sales_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Primary and secondary account managers must be different",
          path: ["secondary_sales_id"],
        });
      }

      // NOTE: Email is OPTIONAL per business rules - removed incorrect requirement
      // Empty email/phone entries are filtered out by filterEmptyArrayEntries() before validation
    });

  try {
    // Filter out empty email/phone entries before validation
    const filteredData = filterEmptyArrayEntries(data as Record<string, unknown>);
    createSchemaWithEmail.parse(filteredData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}

export async function validateUpdateContact(data: unknown): Promise<void> {
  try {
    updateContactSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}
